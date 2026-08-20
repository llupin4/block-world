import { describe, it, expect } from 'vitest';
import { Block, doorMeta } from '../blocks';
import { World, localIndex } from '../world';
import { lightOpacity, columnSum, skyEmit, LIGHT_MAX } from '../light';

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
