import { describe, it, expect } from 'vitest';
import { World, localIndex } from '../world';
import { Block } from '../blocks';
import { WaterSim } from '../water';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from '../terrain';

describe('water origin tracking — the edit gate (D4)', () => {
  it('settle + pulses on generated chunks never mark a chunk edited', () => {
    const world = new World();
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2);
    const sim = new WaterSim(world);
    for (const c of world.allChunks()) sim.settle(c.cx, c.cy, c.cz);
    sim.tick(1000);
    for (let i = 0; i < 20 && sim.tick(1000) > 0; i++) {}
    for (const c of world.allChunks()) expect(c.edited, `chunk (${c.cx},${c.cy},${c.cz})`).toBe(false);
  });

  it('a player-placed spring marks its own chunk AND the chunk its flow floods edited', () => {
    const world = new World();
    for (const cx of [0, 1]) {
      const c = world.ensureChunk(cx, 0, 0);
      for (let lx = 0; lx < 16; lx++)
        for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, 0, lz)] = Block.Stone;
    }
    const sim = new WaterSim(world);
    world.setBlock(12, 2, 8, Block.Water);
    sim.edit(12, 2, 8, Block.Water);
    for (let i = 0; i < 100 && sim.tick(1000) > 0; i++) {}
    expect(world.getChunk(0, 0, 0)!.edited).toBe(true); // the placement itself
    expect(world.getChunk(1, 0, 0)!.edited).toBe(true); // the fan crosses x=16 (edit-origin flow)
  });
});
describe('WaterSim.restore — the persistence rebuild (D1/D2)', () => {
  type Inner = { queue: Set<string>; waiting: Map<string, boolean>; springs: Set<string> };
  const inner = (sim: WaterSim) => sim as unknown as Inner;

  it('rebuilds springs from wplaced', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    const i = localIndex(8, 1, 8);
    c.blocks[i] = Block.Water; c.wlevel[i] = 7; c.wsource[i] = 1; c.wplaced[i] = 1;
    c.settled = true;
    const sim = new WaterSim(world);
    expect(inner(sim).springs.size).toBe(0);
    sim.restore(c);
    expect(inner(sim).springs.has('8,1,8')).toBe(true);
  });

  it('enqueues face water cells (with their closure) — never the interior', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    const put = (x: number, y: number, z: number): void => {
      const i = localIndex(x, y, z);
      c.blocks[i] = Block.Water; c.wlevel[i] = 7; c.wsource[i] = 1;
    };
    put(0, 1, 8); // lx=0 face
    put(8, 1, 8); // interior
    c.settled = true;
    const sim = new WaterSim(world);
    sim.restore(c);
    expect(inner(sim).queue.has('0,1,8')).toBe(true);
    expect(inner(sim).queue.has('8,1,8')).toBe(false); // interior sits at its saved fixpoint
  });

  it('rebuilds waiting from the bottom face only when the band below is missing', () => {
    const world = new World();
    const c = world.ensureChunk(0, 1, 0);
    const i = localIndex(8, 0, 8); // ly=0 → wy=16
    c.blocks[i] = Block.Water; c.wlevel[i] = 7;
    c.settled = true;
    const sim = new WaterSim(world);
    sim.restore(c); // the band below (0,0,0) is missing
    expect(inner(sim).waiting.has('8,16,8')).toBe(true);

    const world2 = new World();
    world2.ensureChunk(0, 0, 0); // the band below EXISTS
    const c2 = world2.ensureChunk(0, 1, 0);
    c2.blocks[localIndex(8, 0, 8)] = Block.Water;
    c2.settled = true;
    const sim2 = new WaterSim(world2);
    sim2.restore(c2);
    expect(inner(sim2).waiting.has('8,16,8')).toBe(false);
  });
});
