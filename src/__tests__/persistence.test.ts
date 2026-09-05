import { describe, it, expect } from 'vitest';
import { World, localIndex, CHUNK_VOL, type Chunk } from '../world';
import { Block } from '../blocks';
import { WaterSim } from '../water';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from '../terrain';
import {
  snapshotChunk, applyRecord, Persistence, InMemoryChunkStore,
  chunkRecordKey, metaKey, type ChunkStore,
} from '../persistence';

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
describe('persistence — records and store', () => {
  const mkChunk = (w: World, cx: number, cy: number, cz: number): Chunk => {
    const c = w.ensureChunk(cx, cy, cz);
    c.edited = true;
    return c;
  };

  it('snapshotChunk/applyRecord round-trip the six arrays byte-for-byte', () => {
    const world = new World();
    const c = mkChunk(world, 1, 2, 3);
    for (let i = 0; i < CHUNK_VOL; i++) {
      c.blocks[i] = i % 13;
      c.meta[i] = (i * 7) % 4;
      c.wlevel[i] = (i * 3) % 8;
      c.wsource[i] = i % 2;
      c.wplaced[i] = (i >> 1) % 2;
      c.wstream[i] = (i >> 2) % 2;
    }
    const rec = snapshotChunk(c);
    expect(rec.v).toBe(1);
    expect([rec.cx, rec.cy, rec.cz]).toEqual([1, 2, 3]);
    world.removeChunk(1, 2, 3);
    applyRecord(world, rec);
    const c2 = world.getChunk(1, 2, 3)!;
    expect(c2.settled).toBe(true); // D1: the saved state is the truth
    expect(c2.edited).toBe(true);  // a persisted chunk is by definition edited
    expect(c2.dirty).toBe(false);  // first mesh goes through deferredFirstMesh, not the remesh pass
    const fields: [string, Uint8Array, Uint8Array][] = [
      ['blocks', c.blocks, c2.blocks], ['meta', c.meta, c2.meta],
      ['wlevel', c.wlevel, c2.wlevel], ['wsource', c.wsource, c2.wsource],
      ['wplaced', c.wplaced, c2.wplaced], ['wstream', c.wstream, c2.wstream],
    ];
    for (const [name, a, b] of fields) expect(b, name).toEqual(new Uint8Array(a));
  });

  it('onUnload snapshots edited chunks only; the warm cache restores sync and evicts the oldest past the cap', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, 1234);
    await persist.boot();
    const world = new World();
    const edited = mkChunk(world, 0, 0, 0);
    edited.blocks[0] = 5;
    const pristine = world.ensureChunk(1, 0, 0); // edited = false
    persist.onUnload(edited);
    persist.onUnload(pristine);
    expect(store.puts).toBe(1); // pristine terrain is never written (D4/D6)
    expect(persist.syncRecord(0, 0, 0)).toBeDefined();
    expect(persist.hasPersisted(0, 0, 0)).toBe(true);
    expect(persist.hasPersisted(1, 0, 0)).toBe(false);

    for (let i = 1; i <= 513; i++) { // WARM_CAP = 512 → two evictions
      const c = world.ensureChunk(i, 0, 0);
      c.edited = true;
      persist.onUnload(c);
    }
    expect(persist.syncRecord(1, 0, 0)).toBeUndefined(); // evicted (oldest first)
    expect(persist.syncRecord(513, 0, 0)).toBeDefined();
    expect(persist.hasPersisted(1, 0, 0)).toBe(true); // eviction never drops the key set
  });

  it('fetchRecord dedups in-flight reads; the third read is a warm hit', async () => {
    let gets = 0;
    const backing = new InMemoryChunkStore();
    const counting: ChunkStore = {
      get: async (k) => { gets++; return backing.get(k); },
      put: (k, r) => backing.put(k, r),
      delete: (k) => backing.delete(k),
      keys: () => backing.keys(),
    };
    await backing.put(chunkRecordKey(1234, 2, 0, 0), snapshotChunk(mkChunk(new World(), 2, 0, 0)));
    const persist = new Persistence(counting, 1234);
    await persist.boot(); // boot's own meta lookup counts as one get
    const base = gets;
    const [a, b] = await Promise.all([persist.fetchRecord(2, 0, 0), persist.fetchRecord(2, 0, 0)]);
    expect(gets).toBe(base + 1); // one in-flight chunk read, shared
    expect(a).toBeDefined();
    expect(b).toBe(a);
    await persist.fetchRecord(2, 0, 0);
    expect(gets).toBe(base + 1); // warm after the first fetch
  });

  it('boot loads the key set (seed-prefix filtered) and the world meta', async () => {
    const store = new InMemoryChunkStore();
    await store.put(chunkRecordKey(1234, 0, 0, 0), snapshotChunk(mkChunk(new World(), 0, 0, 0)));
    await store.put(chunkRecordKey(9999, 0, 0, 0), snapshotChunk(mkChunk(new World(), 0, 0, 0)));
    await store.put(metaKey(1234), {
      v: 1, seed: 1234,
      player: { x: 1, y: 2, z: 3, yaw: 0.5, pitch: -0.25 },
      time: { time: 100, tick: 6000, phaseTotal: 0.5 },
      hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 3 },
    });
    const persist = new Persistence(store, 1234);
    const meta = await persist.boot();
    expect(meta?.seed).toBe(1234);
    expect(meta?.player.x).toBe(1);
    expect(meta?.time.tick).toBe(6000);
    expect(meta?.hotbar.selected).toBe(3);
    expect(persist.hasPersisted(0, 0, 0)).toBe(true); // this seed's key
    expect(persist.hasPersisted(5, 0, 0)).toBe(false); // never persisted
  });
});
