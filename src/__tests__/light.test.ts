import { describe, it, expect } from 'vitest';
import { Block, doorMeta } from '../blocks';
import { World, localIndex } from '../world';
import { lightOpacity, columnSum, skyEmit, LIGHT_MAX, LightSim } from '../light';

function makeWorld(chunks: [number, number, number][]): World {
  const w = new World();
  for (const [cx, cy, cz] of chunks) w.ensureChunk(cx, cy, cz);
  return w;
}

function fillColSum(w: World, cx: number, cy: number, cz: number): void {
  // test helper: maintain the colSum cache the way LightSim does (Task 4+ calls it inside the sim)
  const c = w.getChunk(cx, cy, cz)!;
  for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) c.colSum[lx + lz * 16] = columnSum(w, cx, cy, cz, lx, lz);
}

describe('light core math', () => {
  it('lightOpacity: registry default, doors meta-dependent (closed 15, open 0)', () => {
    const w = makeWorld([[0, 0, 0]]);
    expect(lightOpacity(w, 0, 5, 0)).toBe(0); // air
    w.setBlock(1, 5, 0, Block.Glass);
    expect(lightOpacity(w, 1, 5, 0)).toBe(1);
    w.setBlock(2, 5, 0, Block.Leaves);
    expect(lightOpacity(w, 2, 5, 0)).toBe(2);
    w.setBlock(3, 5, 0, Block.Water);
    expect(lightOpacity(w, 3, 5, 0)).toBe(2); // flat, flow-level-blind
    w.setBlock(4, 5, 0, Block.Stone);
    expect(lightOpacity(w, 4, 5, 0)).toBe(15);
    w.setBlock(5, 5, 0, Block.Torch);
    expect(lightOpacity(w, 5, 5, 0)).toBe(0); // a torch never blocks
    w.setBlock(6, 5, 0, Block.DoorBottom, doorMeta(false, 0));
    expect(lightOpacity(w, 6, 5, 0)).toBe(15); // closed door blocks
    w.setBlock(6, 5, 0, Block.DoorBottom, doorMeta(true, 0));
    expect(lightOpacity(w, 6, 5, 0)).toBe(0); // open door passes
  });

  it('columnSum: capped-at-15 opacity sum of a chunk column, read from the chunk arrays', () => {
    const w = makeWorld([[0, 0, 0]]);
    expect(columnSum(w, 0, 0, 0, 8, 8)).toBe(0); // air column
    w.setBlock(8, 10, 8, Block.Stone);
    expect(columnSum(w, 0, 0, 0, 8, 8)).toBe(15); // one solid saturates the cap
    w.setBlock(8, 10, 8, Block.Air);
    w.setBlock(8, 10, 8, Block.Glass);
    w.setBlock(8, 9, 8, Block.Leaves);
    expect(columnSum(w, 0, 0, 0, 8, 8)).toBe(3); // 1 + 2
  });

  it('skyEmit: open air column emits 15 everywhere; glass ceiling 14 below (15 at the glass itself); 2-deep water 11; rock 0', () => {
    const w = makeWorld([[0, 0, 0]]); // cells y 0..15
    fillColSum(w, 0, 0, 0);
    expect(skyEmit(w, 8, 0, 8)).toBe(15);
    expect(skyEmit(w, 8, 15, 8)).toBe(15);
    w.setBlock(8, 10, 8, Block.Glass);
    fillColSum(w, 0, 0, 0);
    expect(skyEmit(w, 8, 10, 8)).toBe(15); // the glass cell: nothing opaque above IT
    expect(skyEmit(w, 8, 9, 8)).toBe(14); // air under the glass
    expect(skyEmit(w, 8, 1, 8)).toBe(14); // no vertical decay below it
    w.setBlock(8, 10, 8, Block.Water);
    w.setBlock(8, 9, 8, Block.Water);
    fillColSum(w, 0, 0, 0);
    expect(skyEmit(w, 8, 8, 8)).toBe(11); // 15 - 2 - 2
    w.setBlock(8, 10, 8, Block.Air);
    w.setBlock(8, 9, 8, Block.Air);
    w.setBlock(8, 10, 8, Block.Stone);
    fillColSum(w, 0, 0, 0);
    expect(skyEmit(w, 8, 9, 8)).toBe(0); // under rock: 15 - 15
  });

  it("skyEmit: a higher chunk's colSum is included in the walk (missing upper chunk = air, 0)", () => {
    const w = makeWorld([[0, 0, 0]]);
    w.setBlock(8, 3, 8, Block.Glass); // in chunk (0,0,0)
    fillColSum(w, 0, 0, 0);
    expect(skyEmit(w, 8, 0, 8)).toBe(14); // the walk reads the in-chunk column above the cell
    const w2 = makeWorld([[0, 0, 0], [0, 1, 0]]);
    w2.setBlock(8, 19, 8, Block.Glass); // y=19 in chunk (0,1,0), above chunk (0,0,0)
    fillColSum(w2, 0, 0, 0); fillColSum(w2, 0, 1, 0);
    expect(skyEmit(w2, 8, 5, 8)).toBe(14); // sees the upper chunk's colSum
    const w3 = makeWorld([[0, 0, 0], [0, 1, 0]]);
    w3.setBlock(8, 19, 8, Block.Glass);
    fillColSum(w3, 0, 1, 0); // colSum maintained in the UPPER chunk only
    // lower chunk's colSum stays 0 (stale) — skyEmit walks the in-chunk column of the cell's own chunk:
    expect(skyEmit(w3, 8, 5, 8)).toBe(14); // the walk reads the upper chunk's colSum directly, independent of the lower's cache
  });
});

// Run the queue to a fixpoint (or until `max` tick cycles) — the node-side stand-in
// for the 60 Hz substep clock (same pattern as water.test.ts's drain).
function drain(sim: LightSim, max = 300): void {
  let n = 0;
  while (n++ < max && sim.tick(250) !== 0) {
    /* drain */
  }
}

describe('LightSim', () => {
  it('a torch propagates the exact diamond pattern through air: 14 at the source, 14-d at Manhattan distance d, nothing beyond 14, and nothing through a solid wall', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // x 0..15 and 16..31, y 0..15
    for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone); // floor
    w.setBlock(8, 1, 8, Block.Torch);
    const sim = new LightSim(w);
    sim.edit(8, 1, 8);
    drain(sim);
    expect(w.getLight(8, 1, 8)[0]).toBe(14);  // the source cell stores its own emission
    expect(w.getLight(9, 1, 8)[0]).toBe(13);  // Manhattan 1
    expect(w.getLight(10, 1, 8)[0]).toBe(12); // Manhattan 2
    expect(w.getLight(9, 1, 9)[0]).toBe(12);  // diagonal = two orthogonal steps
    expect(w.getLight(8, 8, 8)[0]).toBe(7);   // straight up, Manhattan 7
    // a solid wall at x=12 kills the field on the far side (opacity 15 exits nothing)
    for (let y = 1; y < 16; y++) for (let z = 0; z < 16; z++) w.setBlock(12, y, z, Block.Stone);
    // wall was added AFTER settle: re-seed + drain (edit() re-seeds the cell, its neighbors, and the sky column below)
    sim.edit(12, 8, 8);
    drain(sim);
    expect(w.getLight(11, 1, 8)[0]).toBe(11); // last air before the wall: 14-3 (d=3 from torch); the wall doesn't attenuate the near side
    expect(w.getLight(13, 1, 8)[0]).toBe(0);  // far side stays dark (no light stored leaks through: wall stores 10 → 10-1-15 < 0)
    // distance cap: with the wall gone again, level 0 at distance 14, nothing at 15
    for (let y = 1; y < 16; y++) for (let z = 0; z < 16; z++) w.setBlock(12, y, z, Block.Air);
    sim.edit(12, 8, 8);
    drain(sim);
    expect(w.getLight(22, 1, 8)[0]).toBe(0); // 8+14 = 22: the last lit cell is 21 at level 1
    expect(w.getLight(21, 1, 8)[0]).toBe(1);
    expect(w.getLight(23, 1, 8)[0]).toBe(0);
  });

  it('two overlapping torches: the stored level is the MAX, never a sum', () => {
    const w = makeWorld([[0, 0, 0]]);
    for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone);
    w.setBlock(3, 5, 8, Block.Torch);
    const sim = new LightSim(w);
    sim.edit(3, 5, 8);
    w.setBlock(13, 5, 8, Block.Torch);
    sim.edit(13, 5, 8);
    drain(sim);
    // (8,5,8) is distance 5 from both: 14-5 = 9 from each — max 9, not 18
    expect(w.getLight(8, 5, 8)[0]).toBe(9);
  });

  it('removal: the darkness wave walks out until the pre-torch state (no special de-propagation pass needed)', () => {
    const w = makeWorld([[0, 0, 0]]);
    for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone);
    w.setBlock(8, 1, 8, Block.Torch);
    const sim = new LightSim(w);
    sim.edit(8, 1, 8);
    drain(sim);
    const before = w.getLight(12, 1, 8)[0]; // 10
    expect(before).toBe(10);
    w.setBlock(8, 1, 8, Block.Air); // break the torch (main.ts calls edit after world.setBlock)
    sim.edit(8, 1, 8);
    drain(sim);
    expect(w.getLight(8, 1, 8)[0]).toBe(0);
    expect(w.getLight(12, 1, 8)[0]).toBe(0); // wave swept through; no support left anywhere
    expect(w.getLight(15, 1, 8)[0]).toBe(0);
  });

  it('two-torch support boundary: removing one torch, the darkness wave stops dead at the cells the survivor still supports', () => {
    const w = makeWorld([[0, 0, 0]]);
    for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone);
    w.setBlock(4, 5, 8, Block.Torch);
    w.setBlock(12, 5, 8, Block.Torch);
    const sim = new LightSim(w);
    sim.edit(4, 5, 8);
    sim.edit(12, 5, 8);
    drain(sim);
    expect(w.getLight(8, 5, 8)[0]).toBe(10); // distance 4 from both: 14-4
    expect(w.getLight(13, 5, 8)[0]).toBe(13); // max of the two fields: 14-1 from the right torch (left only gives 14-9 = 5)
    w.setBlock(12, 5, 8, Block.Air);
    sim.edit(12, 5, 8);
    drain(sim);
    expect(w.getLight(8, 5, 8)[0]).toBe(10); // unchanged: the left torch still supports it at exactly 10
    expect(w.getLight(13, 5, 8)[0]).toBe(5); // right field gone: only the left torch — d=9 → 14-9
    expect(w.getLight(15, 5, 8)[0]).toBe(3); // d=11 from the left torch → 14-11
  });

  it("sky column re-seed: plugging the column drops it to the 1/side-step leak (14); breaking restores 15", () => {
    const w2 = makeWorld([[0, 0, 0]]);
    // pinned layout: open column everywhere; the plug (stone at y=10 of column (8,·,8)) is placed mid-test
    for (let y = 11; y < 16; y++) w2.setBlock(8, y, 8, Block.Air); // air above the plug (explicit, though default)
    const sim = new LightSim(w2);
    sim.settleChunk(0, 0, 0); // initial settle: open column everywhere (plug not yet placed) — skylight 15 all the way down
    drain(sim);
    expect(w2.getLight(8, 0, 8)[1]).toBe(15);
    // NOW plug the column at y=10: direct sky emission below it drops to 0 (stone opacity 15 saturates the sum);
    // the cells relax to the 1/side-step lateral leak from the adjacent open column (15-1 = 14)
    w2.setBlock(8, 10, 8, Block.Stone);
    sim.edit(8, 10, 8);
    drain(sim);
    expect(w2.getLight(8, 10, 8)[1]).toBe(15); // the plug itself: nothing opaque strictly above it
    expect(w2.getLight(8, 9, 8)[1]).toBe(14); // below the plug: E=0 (column blocked) + 15-1 side-step leak
    expect(w2.getLight(8, 0, 8)[1]).toBe(14); // uniform down the column: 1/side-step from the open side column, no vertical decay
    // break the plug: the column restores to 15
    w2.setBlock(8, 10, 8, Block.Air);
    sim.edit(8, 10, 8);
    drain(sim);
    expect(w2.getLight(8, 9, 8)[1]).toBe(15);
    expect(w2.getLight(8, 0, 8)[1]).toBe(15);
  });

  it('cross-chunk seams: light is continuous across a boundary (a wave crosses the seam); after the lit-neighbor chunk unloads, cells lit THROUGH it darken', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // x 0..15 and 16..31
    for (let cx = 0; cx <= 1; cx++) for (let x = cx * 16; x < cx * 16 + 16; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone);
    w.setBlock(20, 8, 8, Block.Torch); // in chunk (1,0,0)
    const sim = new LightSim(w);
    sim.settleChunk(0, 0, 0);
    sim.settleChunk(1, 0, 0);
    drain(sim);
    expect(w.getLight(20, 8, 8)[0]).toBe(14);
    expect(w.getLight(15, 8, 8)[0]).toBe(9); // 20-15 = 5 steps: 14-5
    // remove chunk (1,0,0): cells that were lit through it must darken
    w.removeChunk(1, 0, 0);
    sim.onChunkUnloaded(1, 0, 0);
    drain(sim);
    expect(w.getLight(15, 8, 8)[0]).toBe(0); // no more contribution across the missing seam
    expect(w.getLight(8, 8, 8)[0]).toBe(0);
  });

  it('determinism: the same edit sequence on two fresh worlds yields identical final fields', () => {
    const build = (w: World): void => {
      for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone);
      w.setBlock(8, 1, 8, Block.Torch);
      w.setBlock(16, 4, 8, Block.Torch);
    };
    const fields = (w: World): number[] => {
      const out: number[] = [];
      for (const c of w.allChunks()) for (let i = 0; i < c.blight.length; i++) out.push(c.blight[i], c.skylight[i]);
      return out;
    };
    const a = makeWorld([[0, 0, 0], [1, 0, 0]]);
    build(a);
    const simA = new LightSim(a);
    simA.settleChunk(0, 0, 0); simA.settleChunk(1, 0, 0); drain(simA);
    a.setBlock(8, 1, 8, Block.Air); simA.edit(8, 1, 8); drain(simA);
    const b = makeWorld([[0, 0, 0], [1, 0, 0]]);
    build(b);
    const simB = new LightSim(b);
    simB.settleChunk(0, 0, 0); simB.settleChunk(1, 0, 0); drain(simB);
    b.setBlock(8, 1, 8, Block.Air); simB.edit(8, 1, 8); drain(simB);
    expect(fields(a)).toEqual(fields(b));
  });

  it('column prefill + frontier settle converges to the SAME fixpoint as a full re-derive (brute force) on mixed terrain', () => {
    const chunks: [number, number, number][] = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [0, 0, -1]];
    // deterministic pseudo-random terrain (fixed seed): a dense mix of air/stone/glass/water/leaves/torch —
    // caves, horizontal sky leaks, and torches all at once, to stress the frontier's coverage
    let s = 0x12345678;
    const rnd = (): number => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const pick = (): number => {
      const r = rnd();
      if (r < 0.55) return Block.Air;
      if (r < 0.72) return Block.Stone;
      if (r < 0.8) return Block.Glass;
      if (r < 0.87) return Block.Water;
      if (r < 0.95) return Block.Leaves;
      return Block.Torch;
    };
    const cells: [number, number, number, number][] = [];
    for (const [cx, cy, cz] of chunks) for (let y = 0; y < 16; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
      const b = pick();
      if (b !== Block.Air) cells.push([cx * 16 + x, cy * 16 + y, cz * 16 + z, b]);
    }
    const build = (w: World): void => {
      for (const [cx, cy, cz] of chunks) w.ensureChunk(cx, cy, cz);
      for (const [x, y, z, b] of cells) w.setBlock(x, y, z, b);
    };
    const snapshot = (w: World): number[] => {
      const out: number[] = [];
      for (const c of w.allChunks()) for (let i = 0; i < c.blight.length; i++) out.push(c.blight[i], c.skylight[i]);
      return out;
    };
    const drainAll = (sim: LightSim): void => {
      let guard = 0;
      while (sim.tick(2000) !== 0) if (++guard > 200000) throw new Error('light did not converge');
    };
    // fast path: the production settle (column prefill + frontier), drained to empty
    const wFast = new World(); build(wFast);
    const simFast = new LightSim(wFast);
    for (const [cx, cy, cz] of chunks) simFast.settleChunk(cx, cy, cz);
    drainAll(simFast);
    // slow reference: seed EVERY cell of every chunk (full re-derive), drained to empty
    const wBrute = new World(); build(wBrute);
    const simBrute = new LightSim(wBrute);
    for (const [cx, cy, cz] of chunks) simBrute.settleChunkBruteForce(cx, cy, cz);
    drainAll(simBrute);
    expect(snapshot(wFast)).toEqual(snapshot(wBrute));
  });
});
