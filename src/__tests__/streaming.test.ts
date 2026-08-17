import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World } from '../world';
import { TERRAIN_SEED, TerrainGen } from '../terrain';
import { update } from '../streaming';

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