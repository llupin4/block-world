import { describe, it, expect } from 'vitest';
import { World, localIndex } from '../world';
import { Block } from '../blocks';
import { WaterSim } from '../water';
import { update } from '../streaming';
import { TERRAIN_SEED } from '../terrain';
import { InMemoryChunkStore, Persistence, applyRecord } from '../persistence';

// Two-chunk slab (stone floor at y=0) with a player-placed spring at (12,2,8). The
// spring's flood (an edit-origin flow) crosses into chunk (1,0,0), so the round trip
// exercises the cross-chunk water state. Surrounding terrain chunks may stream in while
// walking back; worldgen water is static (it never pushes), so the slab's water state
// stays isolated, and the fingerprint is taken over the two slab chunks only.

function buildWorld(): World {
  const world = new World();
  for (const cx of [0, 1]) {
    const c = world.ensureChunk(cx, 0, 0);
    for (let lx = 0; lx < 16; lx++)
      for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, 0, lz)] = Block.Stone;
  }
  return world;
}

function springWorld(): { world: World; sim: WaterSim } {
  const world = buildWorld();
  const sim = new WaterSim(world);
  world.setBlock(12, 2, 8, Block.Water);
  sim.edit(12, 2, 8, Block.Water); // placed water = a spring
  return { world, sim };
}

function drain(sim: WaterSim, max = 100): void {
  for (let i = 0; i < max; i++) if (sim.tick(1000) === 0) return;
}

// Water fingerprint: "wx,wy,wz" → [block, wlevel, wsource, wplaced, wstream] for every
// water cell of the given chunks.
function fingerprint(world: World, ...keys: [number, number, number][]): Map<string, number[]> {
  const m = new Map<string, number[]>();
  for (const [cx, cy, cz] of keys) {
    const c = world.getChunk(cx, cy, cz);
    if (!c) continue;
    for (let i = 0; i < c.blocks.length; i++) {
      if (c.blocks[i] !== Block.Water) continue;
      const lx = i & 15, lz = (i >> 4) & 15, ly = (i >> 8) & 15;
      m.set(`${cx * 16 + lx},${cy * 16 + ly},${cz * 16 + lz}`,
        [c.blocks[i], c.wlevel[i], c.wsource[i], c.wplaced[i], c.wstream[i]]);
    }
  }
  return m;
}

function expectSameFingerprint(a: Map<string, number[]>, b: Map<string, number[]>): void {
  expect(a.size).toBe(b.size);
  for (const [k, v] of a) expect(b.get(k), `cell ${k}`).toEqual(v);
}

// Walk the ring back to the slab and rebuild sim state for everything that came back
// (mirrors main.ts tickStreaming).
async function walkBack(world: World, sim: WaterSim, persist: Persistence): Promise<void> {
  for (let i = 0; i < 500 && !(world.hasChunk(0, 0, 0) && world.hasChunk(1, 0, 0)); i++) {
    const r = update(world, 0, 0, 0, persist);
    for (const p of r.pending) {
      const rec = await persist.fetchRecord(p.cx, p.cy, p.cz);
      if (rec && !world.hasChunk(p.cx, p.cy, p.cz)) applyRecord(world, rec);
    }
    for (const c of r.restored) sim.restore(world.getChunk(c.cx, c.cy, c.cz)!);
  }
}

describe('persistence — water state', () => {
  it('A: spring flood round trip — the water state is identical after unload + restore', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot();
    const { world, sim } = springWorld();
    drain(sim);
    const before = fingerprint(world, [0, 0, 0], [1, 0, 0]);
    expect(before.size).toBeGreaterThan(0); // the spring actually flooded

    update(world, 10, 0, 0, persist); // walk away: the slab unloads
    expect(store.puts).toBe(2); // both chunks: the spring's edit + the flooded chunk (edit-origin flow)

    await walkBack(world, sim, persist);
    drain(sim);
    expectSameFingerprint(fingerprint(world, [0, 0, 0], [1, 0, 0]), before);
    for (let i = 0; i < 10; i++) sim.tick(1000); // five more sim seconds: no slow drift
    expectSameFingerprint(fingerprint(world, [0, 0, 0], [1, 0, 0]), before);
  });

  it('B: mine the spring, save mid-drain, restore — the drain finishes identically to a no-save control', async () => {
    const ctrl = springWorld();
    drain(ctrl.sim);
    ctrl.world.setBlock(12, 2, 8, Block.Air);
    ctrl.sim.edit(12, 2, 8, Block.Air); // break the spring
    drain(ctrl.sim);
    const ctrlFp = fingerprint(ctrl.world, [0, 0, 0], [1, 0, 0]);

    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot();
    const { world, sim } = springWorld();
    drain(sim);
    world.setBlock(12, 2, 8, Block.Air);
    sim.edit(12, 2, 8, Block.Air);
    sim.tick(2); // partial drain: the flow has NOT reached fixpoint
    update(world, 10, 0, 0, persist); // save mid-drain
    expect(store.puts).toBe(2);
    await walkBack(world, sim, persist);
    drain(sim); // the drain continues after the restore (queue rebuilt from the saved arrays)
    expectSameFingerprint(fingerprint(world, [0, 0, 0], [1, 0, 0]), ctrlFp);
  });
});