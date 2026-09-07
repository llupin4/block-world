import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World } from '../world';
import { TERRAIN_SEED, TerrainGen } from '../terrain';
import { update, inRing } from '../streaming';
import { InMemoryChunkStore, Persistence, applyRecord, type PersistSource } from '../persistence';
import { Sim, IdleController, type EntityRecord } from '../entity';

// Tests stand in for main.ts: every chunk update() reports as rebuilt is treated as
// (re)meshed, which clears its dirty flag (in the app the clear happens in
// rebuildChunkMesh).
function converge(world: World): void {
  let calls = 0;
  for (;;) {
    const r = update(world, 2, 2, 2); // player stands in chunk (2,2), band-middle height
    for (const c of r.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;
    if (r.rebuilt.length === 0 && r.unloaded.length === 0) return;
    if (++calls > 500) throw new Error('streaming did not converge');
  }
}

describe('streaming', () => {
  it('A: converges to the full 5x5x5 ring, terrain-filled, closest first', () => {
    const world = new World();
    const first = update(world, 2, 2, 2);
    // score 0 (player's own chunk); the budget is 1 per call, so the column's other levels
    // (score ×100 ranks them before any x/z-neighbour) stream in over the following calls.
    expect(first.rebuilt).toEqual([{ cx: 2, cy: 2, cz: 2 }]);
    expect(first.unloaded).toEqual([]);
    for (const c of first.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;

    converge(world);

    expect(world.count()).toBe(125); // 5 x 5 columns x 5 levels
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cx = 0; cx <= 4; cx++) {
      for (let cz = 0; cz <= 4; cz++) {
        const wx = cx * 16 + 8, wz = cz * 16 + 8;
        const h = gen.heightAt(wx, wz); // T4: 12..52, always inside the band
        expect(world.getBlock(wx, h, wz), `surface of column (${cx}, ${cz})`).not.toBe(Block.Air);
      }
    }
  });

  it('B: budget — at most 1 load + 1 remesh per call; cold start loads exactly 1', () => {
    const cold = new World();
    const f = update(cold, 2, 2, 2);
    expect(f.rebuilt.length).toBe(1); // nothing but loads on a cold start
    expect(cold.count()).toBe(1);

    const world = new World();
    let calls = 0;
    for (;;) {
      const r = update(world, 2, 2, 2);
      expect(r.rebuilt.length).toBeLessThanOrEqual(2);
      expect(r.unloaded.length).toBe(0); // a standing player never unloads
      for (const c of r.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;
      if (r.rebuilt.length === 0) break;
      if (++calls > 500) throw new Error('streaming did not converge');
    }
    expect(world.count()).toBe(125);
  });

  it('C: dirty chunks remesh in score order, one per call (the safety net behind T8 edits)', () => {
    const world = new World();
    converge(world);
    for (const c of world.allChunks()) c.dirty = false;

    world.setBlock(4 * 16 + 8, 34, 4 * 16 + 8, Block.Dirt); // dirties chunk (4,2,4) + its in-ring face-neighbors
    const r = update(world, 2, 2, 2);
    // The closest dirty chunk (score 500: (3,2,4) and (4,2,3) tie; tie broken by cx) goes
    // first — the budget is 1 per call, so (4,2,3) follows on the next one.
    expect(r.rebuilt).toEqual([{ cx: 3, cy: 2, cz: 4 }]); // (1^2 + 2^2) * 100 = 500

    for (const c of r.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;
    let calls = 0;
    for (;;) { // the remaining dirty chunks drain over later calls
      let left = 0;
      for (const c of world.allChunks()) if (c.dirty) left++;
      if (left === 0) break;
      const rr = update(world, 2, 2, 2);
      for (const c of rr.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;
      if (++calls > 50) throw new Error('dirty chunks never drained');
    }
  });

  it('D: unload — after a teleport the old ring leaves the world, the new one streams in', () => {
    const world = new World();
    converge(world); // 125 chunks around (2,2)
    const r = update(world, 10, 10, 2);
    expect(r.unloaded.length).toBe(125); // every old chunk is >2 chunks from (10,10)
    expect(world.count()).toBe(1);       // only the one chunk loaded toward (10,10)
    expect(world.hasChunk(10, 2, 10)).toBe(true); // top of the destination column (cy=pcy)
    expect(world.hasChunk(10, 1, 10)).toBe(false); // streams in on a later call (budget 1)
    expect(world.hasChunk(2, 2, 2)).toBe(false);
    expect(world.hasChunk(4, 4, 4)).toBe(false);
  });
});

describe('streaming + persistence', () => {
  // Chunk (0,1,2) is in the ring around a (2,·,2) player and its terrain value at
  // (8,20,40) is unknown — so flip that cell to whatever it is NOT (guaranteed change
  // → chunk edited).
  function editChunk(world: World): number {
    const before = world.getBlock(8, 20, 40);
    const b = before === Block.Dirt ? Block.Stone : Block.Dirt;
    world.setBlock(8, 20, 40, b);
    return b;
  }

  it('E: warm restore — an edited chunk snapshots on unload and restores inline on the walk back', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot();
    const world = new World();
    converge(world); // 125 chunks around (2,2,2)
    for (const c of world.allChunks()) c.dirty = false;
    const b = editChunk(world); // marks chunk (0,1,2) edited

    update(world, 40, 2, 2, persist); // teleport: the whole ring unloads
    expect(store.puts).toBe(1); // D4/D6: only the edited chunk is snapshotted

    const r = update(world, 2, 2, 2, persist); // walk back
    expect(r.restored).toContainEqual({ cx: 0, cy: 1, cz: 2 });
    expect(world.getChunk(0, 1, 2)!.settled).toBe(true); // D1: water state restored as-is
    expect(world.getBlock(8, 20, 40)).toBe(b); // the edit survived the round trip
    expect(store.puts).toBe(1); // restoring does not re-put
  });

  it('F: cold restore — a fresh Persistence (page reload) defers to an async fetch; the chunk is never generated', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot();
    const world = new World();
    converge(world);
    const b = editChunk(world);
    update(world, 40, 2, 2, persist); // put → store.puts === 1

    const world2 = new World(); // "page reload": fresh world + fresh persistence, same store
    const persist2 = new Persistence(store, TERRAIN_SEED);
    await persist2.boot(); // the key set now contains 1234:0,1,2

    const r = update(world2, 2, 2, 2, persist2);
    expect(world2.hasChunk(0, 1, 2)).toBe(false); // not yet — the fetch is async
    expect(r.pending).toContainEqual({ cx: 0, cy: 1, cz: 2 });
    expect(r.rebuilt.some((c) => c.cx === 0 && c.cy === 1 && c.cz === 2)).toBe(false); // D3: no generation over a known record

    const rec = await persist2.fetchRecord(0, 1, 2); // main.ts's pending loop
    expect(rec).toBeDefined();
    applyRecord(world2, rec!);
    expect(world2.getBlock(8, 20, 40)).toBe(b);
    expect(world2.getChunk(0, 1, 2)!.settled).toBe(true);
  });

  it('G: confirmed miss — a chunk with no record still generates terrain, budgets intact', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot(); // empty store → empty key set
    const world = new World();
    const r = update(world, 2, 2, 2, persist);
    expect(r.rebuilt).toEqual([{ cx: 2, cy: 2, cz: 2 }]);
    expect(r.restored).toEqual([]);
    expect(r.pending).toEqual([]);
    expect(world.count()).toBe(1);
  });
});

describe('streaming — entities ride the unload', () => {
  it('threads frozen entities into the onUnload record when the chunk unloads', () => {
    const world = new World();
    const sim = new Sim(world, {}, 1234);
    const e = sim.spawn({ x: 4, y: 5, z: 4 }, new IdleController()); // chunk (0,0,0)
    world.ensureChunk(0, 0, 0).edited = true; // so onUnload snapshots it
    let captured: EntityRecord[] | undefined;
    const persist: PersistSource = {
      hasPersisted: () => false,
      syncRecord: () => undefined,
      fetchRecord: () => Promise.resolve(undefined),
      onUnload: (_c, entities) => { captured = entities; },
      dropPersisted: () => {},
    };
    update(world, 4, 4, 2, persist, sim); // anchor far -> (0,0,0) is outside the ring and unloads
    expect(captured).toBeDefined();
    expect(captured!.some((r) => r.id === e.id)).toBe(true);
  });

  it('passes no entities when the sim is absent (unchanged behavior)', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0).edited = true;
    let captured: EntityRecord[] | undefined = 'sentinel' as never;
    const persist: PersistSource = {
      hasPersisted: () => false,
      syncRecord: () => undefined,
      fetchRecord: () => Promise.resolve(undefined),
      onUnload: (_c, entities) => { captured = entities; },
      dropPersisted: () => {},
    };
    update(world, 4, 4, 2, persist);
    expect(captured).toBeUndefined();
  });
});

describe('streaming — generated vs remeshed (multiplayer pre-work D2)', () => {
  it('a fresh generate lands in generated; a dirty remesh in remeshed; rebuilt is the union', () => {
    const world = new World();
    const f = update(world, 2, 2, 2);
    expect(f.generated).toEqual([{ cx: 2, cy: 2, cz: 2 }]); // cold start: a fresh generate
    expect(f.remeshed).toEqual([]);
    expect(f.rebuilt).toEqual([{ cx: 2, cy: 2, cz: 2 }]);   // the union
    for (const c of f.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;

    converge(world);
    for (const c of world.allChunks()) c.dirty = false;

    world.getChunk(2, 2, 2)!.dirty = true; // mark an already-loaded chunk dirty
    const r = update(world, 2, 2, 2);
    expect(r.generated).toEqual([]);                        // nothing new to generate
    expect(r.remeshed).toContainEqual({ cx: 2, cy: 2, cz: 2 }); // it remeshes
    expect(r.rebuilt).toContainEqual({ cx: 2, cy: 2, cz: 2 });  // still in the union
    expect(r.rebuilt.length).toBe(1);
  });

  it('a remeshed (dirty) column is never in generated, so spawnDeer (generated-only) cannot re-top it', () => {
    // A column that already has 1 deer is a partial column: a remesh must NOT add a second.
    const world = new World();
    const sim = new Sim(world, {}, TERRAIN_SEED);
    converge(world); // all 125 chunks of the (2,2) ring loaded → nothing left to generate
    for (const c of world.allChunks()) c.dirty = false;
    sim.spawn({ x: 8, y: 5, z: 8 }, new IdleController()); // a deer in chunk (0,0,0) (in the ring)
    world.getChunk(0, 0, 0)!.dirty = true; // dirty the deer's column (a remesh, not a generate)
    const before = sim.all().length;
    const r = update(world, 2, 2, 2); // same anchor as converge → no missing chunks
    expect(r.generated).toEqual([]);                            // nothing to generate (converged)
    expect(r.remeshed).toContainEqual({ cx: 0, cy: 0, cz: 0 }); // the deer's column remeshes
    // main.ts's spawnDeer loop iterates r.generated only → the deer's column is untouched:
    for (const c of r.generated) { /* spawnDeer would run here only */ }
    expect(sim.all().length).toBe(before); // unchanged
  });
});

describe('streaming — union ring (multiplayer, T3)', () => {
  it('a chunk is alive if it is in range of ANY anchor', () => {
    expect(inRing({ cx: 0, cz: 0 }, [{ cx: 0, cz: 0 }, { cx: 4, cz: 4 }])).toBe(true);
    expect(inRing({ cx: 4, cz: 4 }, [{ cx: 0, cz: 0 }, { cx: 4, cz: 4 }])).toBe(true);
    expect(inRing({ cx: 8, cz: 8 }, [{ cx: 0, cz: 0 }, { cx: 4, cz: 4 }])).toBe(false);
  });

  it('does not unload a dirty chunk that is only in range of a remote anchor', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    c.edited = true;
    c.dirty = true;
    // Player stands at (4,4); the remote anchor keeps (0,0,0) alive.
    const r = update(world, 4, 4, 2, undefined, undefined, [{ cx: 0, cz: 0 }]);
    expect(r.unloaded).toEqual([]);
    expect(world.hasChunk(0, 0, 0)).toBe(true);
  });

  it('with no remote anchors (undefined) the player ring alone governs (single player, unchanged)', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0).edited = true;
    const r = update(world, 4, 4, 2, undefined, undefined); // undefined anchors → player's own ring
    // (0,0,0) is outside the (4,4) ring and no remote anchor covers it → it unloads.
    expect(r.unloaded).toContainEqual({ cx: 0, cy: 0, cz: 0 });
  });
});