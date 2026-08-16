import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, chunkOf } from '../world';
import { WaterSim } from '../water';
import { TerrainGen, generateRegion, SEA_LEVEL, TERRAIN_SEED } from '../terrain';

function makeWorld(chunks: [number, number, number][]): World {
  const w = new World();
  for (const [cx, cy, cz] of chunks) w.ensureChunk(cx, cy, cz);
  return w;
}

function slab(w: World, b: number, x0: number, x1: number, y: number, z0: number, z1: number): void {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) w.setBlock(x, y, z, b);
}

function countWater(w: World): number {
  let n = 0;
  for (const c of w.allChunks()) for (let i = 0; i < c.blocks.length; i++) if (c.blocks[i] === Block.Water) n++;
  return n;
}

// Water count over an explicit world-coordinate box (neighbour-test probe helper).
function countWaterAt(w: World, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number): number {
  let n = 0;
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      for (let y = y0; y <= y1; y++) if (w.getBlock(x, y, z) === Block.Water) n++;
  return n;
}

// Run the queue to a fixpoint (or until `max` ticks) — the node-side stand-in for the
// runtime slow clock.
function drain(sim: WaterSim, max = 300): void {
  let n = 0;
  while (n++ < max && sim.tick(200) !== 0) {
    /* drain */
  }
}

// Strict invariant from the spec: block == Water  <=>  wlevel >= 1 || wsource == 1.
function assertInvariants(w: World): void {
  for (const c of w.allChunks())
    for (let i = 0; i < c.blocks.length; i++) {
      const wet = c.blocks[i] === Block.Water;
      const st = c.wlevel[i] >= 1 || c.wsource[i] === 1;
      expect(wet === st, `invariant @ chunk(${c.cx},${c.cy},${c.cz}) i=${i}: b=${c.blocks[i]} l=${c.wlevel[i]} s=${c.wsource[i]}`).toBe(true);
    }
}

describe('water sim', () => {
  it('a lone source over a stone pad settles to a level-graded diamond, every cell re-promoted to a source; radius 6 is the front', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15); // floor at y=0
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water);
    sim.edit(8, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);

    console.log('A count=', countWater(w));
    const cs = (x: number, y: number, z: number) => sim.cellState(x, y, z);
    expect(cs(8, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 1 });
    expect(cs(9, 1, 8).l).toBe(6); expect(cs(7, 1, 8).l).toBe(6);
    expect(cs(8, 1, 9).l).toBe(6); expect(cs(8, 1, 7).l).toBe(6);
    expect(cs(9, 1, 9).l).toBe(5); // dist 2
    expect(cs(14, 1, 8).l).toBe(1); expect(cs(2, 1, 8).l).toBe(1); expect(cs(8, 1, 2).l).toBe(1); // dist 6 front
    expect(cs(14, 1, 8).s).toBe(1); // front is a promoted source (rests on stone)
    expect(cs(15, 1, 8).b).toBe(Block.Air); // dist 7 is beyond reach
    expect(cs(8, 1, 15).b).toBe(Block.Air);
    expect(cs(9, 1, 9).s).toBe(1);
    expect(countWater(w)).toBe(85); // |dx|+|dz| <= 6, all in-bounds
    assertInvariants(w);
  });

  it('water falls one cell per tick and lands on solid, re-promoting to a source', () => {
    const w = makeWorld([[0, 0, 0]]); // chunks span y=0..15
    w.setBlock(8, 0, 8, Block.Stone); // floor of a 1-wide pit
    // solid walls at the landing level so the landed cell cannot spread to a floorless edge
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) w.setBlock(8 + dx, 1, 8 + dz, Block.Stone);
    const sim = new WaterSim(w);
    w.setBlock(8, 8, 8, Block.Water);
    sim.edit(8, 8, 8, Block.Water);
    drain(sim);
    expect(sim.cellState(8, 8, 8).b).toBe(Block.Air); // origin dried as it fell
    expect(sim.cellState(8, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 1 }); // landed on the floor, promoted
    expect(countWater(w)).toBe(1);
    assertInvariants(w);
  });

  it('a stream that falls out of the world is destroyed (drain)', () => {
    const w = makeWorld([[0, 0, 0]]); // chunks span y=0..15; nothing below
    const sim = new WaterSim(w);
    w.setBlock(8, 8, 8, Block.Water);
    sim.edit(8, 8, 8, Block.Water);
    drain(sim);
    expect(countWater(w)).toBe(0);
    expect(sim.cellState(8, 0, 8).b).toBe(Block.Air);
    expect(sim.cellState(8, 8, 8).b).toBe(Block.Air);
    assertInvariants(w);
  });

  it('a sealed 3x3 pool is a fixpoint of tick (immortal); breaking the centre refills it from the source ring', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 4, 10, 0, 4, 10); // floor
    slab(w, Block.Stone, 4, 10, 1, 4, 10); // wall/ceiling level
    slab(w, Block.Stone, 4, 10, 2, 4, 10); // ceiling
    for (let x = 6; x <= 8; x++) for (let z = 6; z <= 8; z++) { w.setBlock(x, 1, z, Block.Water); } // sealed pocket
    const sim = new WaterSim(w);
    for (let x = 6; x <= 8; x++) for (let z = 6; z <= 8; z++) sim.edit(x, 1, z, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);

    for (let x = 6; x <= 8; x++) for (let z = 6; z <= 8; z++)
      expect(sim.cellState(x, 1, z)).toEqual({ b: Block.Water, l: 7, s: 1 });
    expect(sim.tick(1)).toBe(0); // fixpoint: settled pool never cascades
    expect(countWater(w)).toBe(9);

    // break the centre and let the source ring refill it
    w.setBlock(7, 1, 7, Block.Air);
    sim.edit(7, 1, 7, Block.Air);
    drain(sim);
    expect(sim.cellState(7, 1, 7).b).toBe(Block.Water);
    expect(sim.cellState(7, 1, 7).s).toBe(1); // refilled + promoted
    expect(countWater(w)).toBe(9);
    expect(sim.tick(1)).toBe(0);
    assertInvariants(w);
  });

  it('water spreads across a chunk seam into a loaded neighbour, with the level carried', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // chunks span x=0..15 and x=16..31
    slab(w, Block.Stone, 0, 31, 0, 0, 15);
    const sim = new WaterSim(w);
    w.setBlock(15, 1, 8, Block.Water); // on chunk 0's +X face
    sim.edit(15, 1, 8, Block.Water);
    sim.settle(0, 0, 0); // settle the source chunk; relax spills water across the seam into chunk 1
    drain(sim);
    expect(chunkOf(16)).toBe(1);
    expect(sim.cellState(16, 1, 8).b).toBe(Block.Water); // spread into the loaded neighbour
    expect(sim.cellState(16, 1, 8).l).toBe(6);
    expect(sim.cellState(14, 1, 8).l).toBe(6); // and back into chunk 0
    assertInvariants(w);
  });

  it('with the neighbour chunk missing, spread stops at the face and a fall is destroyed, without crashing', () => {
    const w = makeWorld([[0, 0, 0]]); // x=16..31 is ungenerated
    slab(w, Block.Stone, 0, 15, 0, 0, 15);
    const sim = new WaterSim(w);
    w.setBlock(15, 1, 8, Block.Water);
    sim.edit(15, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);
    expect(sim.cellState(16, 1, 8).b).toBe(Block.Air); // no spread into ungenerated space
    expect(sim.cellState(15, 1, 8).b).toBe(Block.Water);
    assertInvariants(w);
  });

  it('placing Water via edit makes a source; placing a solid into water clears that cell; invariants hold', () => {
    const w = makeWorld([[0, 0, 0]]);
    const sim = new WaterSim(w);
    w.setBlock(4, 4, 4, Block.Water);
    sim.edit(4, 4, 4, Block.Water);
    expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Water, l: 7, s: 1 });
    w.setBlock(4, 4, 4, Block.Stone);
    sim.edit(4, 4, 4, Block.Stone);
    expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Stone, l: 0, s: 0 });
    expect(sim.cellState(4, 3, 4).b).toBe(Block.Air); // a lone placed cell on air falls away
    assertInvariants(w);
  });

  it('settle is idempotent: a second settle on a loaded chunk is a no-op (guarded by c.settled)', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15);
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water);
    sim.edit(8, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    const snap = () => {
      const a = w.getChunk(0, 0, 0)!;
      return { l: Array.from(a.wlevel), s: Array.from(a.wsource) };
    };
    const before = snap();
    sim.settle(0, 0, 0); // already settled → early return, leaves the gradient untouched
    drain(sim);
    const after = snap();
    expect(after.l.join()).toBe(before.l.join());
    expect(after.s.join()).toBe(before.s.join());
    expect(countWater(w)).toBe(85);
    expect(w.getChunk(0, 0, 0)!.settled).toBe(true);
    assertInvariants(w);
  });

  it('settle runs with no prior edit (the load path): settled generated sea is preserved — no worldgen water is eaten by sequential per-chunk settling', () => {
    const gen = new TerrainGen(TERRAIN_SEED);
    const w = new World();
    generateRegion(w, gen, 0, 3, 0, 3); // 4x4 chunk columns: land-dominated, small sea pockets, unconnected carved caves
    const sim = new WaterSim(w);
    const before = countWater(w);
    for (const c of w.allChunks()) sim.settle(c.cx, c.cy, c.cz); // tickStreaming's settle loop — no edit() anywhere
    drain(sim);
    const after = countWater(w);
    console.log('I before=', before, 'after=', after);
    // The 0..3 region is land-dominated (322 worldgen water cells total); its sea pockets
    // are too small to feed caves within relaxation reach, so settling must preserve the
    // count exactly — the regression is EATING (loss), which unguarded settling caused.
    // The flood-into-cave path is demonstrated by the handcrafted 2x2 ocean test below.
    expect(before).toBe(322);
    expect(after).toBe(322);
    assertInvariants(w);
  });

  it('settling one chunk of a loaded 2x2 ocean region never eats a loaded-unsettled neighbour\'s worldgen water, and floods its sea-facing cave', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]]); // 2x2 ocean slab, y 0..15
    for (let x = 0; x < 32; x++) for (let z = 0; z < 32; z++) {
      w.setBlock(x, 0, z, Block.Stone); // seafloor
      for (let y = 1; y <= 15; y++) w.setBlock(x, y, z, Block.Water);
    }
    for (let x = 16; x <= 23; x++) for (let z = 12; z <= 15; z++) for (let y = 1; y <= 6; y++) w.setBlock(x, y, z, Block.Air); // sea-facing cave pocket in chunk (1,0,0)
    const sim = new WaterSim(w);
    const b0 = countWaterAt(w, 16, 31, 0, 31, 0, 15); // right column = the three loaded-unsettled chunks
    sim.settle(0, 0, 0); // settle ONLY the left chunk (the runtime's per-chunk-on-load form)
    drain(sim);
    const b1 = countWaterAt(w, 16, 31, 0, 31, 0, 15);
    console.log('P before right column=', b0);
    console.log('P after  right column=', b1);
    expect(b1).toBeGreaterThanOrEqual(b0); // the neighbours' pristine (l=0, s=0) worldgen water is never re-leveled or dried
    expect(w.getBlock(17, 3, 13)).toBe(Block.Water); // ...the cave Air IS flooded from the settled chunk's side
    // No assertInvariants here: the right column is deliberately left loaded-unsettled, so its
    // unseeded worldgen water is transiently (l=0, s=0) by design — the invariant holds only at rest.
  });

  it('settle is order-independent: settling the other chunk first converges to the same water count', () => {
    const ocean = (): World => {
      const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // 1x2 ocean slab, y 0..15
      for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) {
        w.setBlock(x, 0, z, Block.Stone);
        for (let y = 1; y <= 15; y++) w.setBlock(x, y, z, Block.Water);
      }
      return w;
    };
    const a = ocean();
    const sa = new WaterSim(a);
    sa.settle(0, 0, 0); sa.settle(1, 0, 0); // natural order
    const b = ocean();
    const sb = new WaterSim(b);
    sb.settle(1, 0, 0); sb.settle(0, 0, 0); // the other chunk first
    const w1 = countWater(a), w2 = countWater(b);
    console.log('PO w1=', w1, 'w2=', w2);
    expect(w1).toBe(7680); expect(w2).toBe(7680); // the full slab is preserved in either order...
    expect(w1).toBe(w2); // ...and the converged count does not depend on settle order
  });

  it('terrain caves carve Air (not Water): every carved stone/dirt cell below sea level is Air after generation', () => {
    const gen = new TerrainGen(TERRAIN_SEED);
    const w = new World();
    generateRegion(w, gen, 0, 3, 0, 3); // 4x4 chunk columns
    let carved = 0;
    for (const c of w.allChunks()) {
      const bx = c.cx * 16, bz = c.cz * 16;
      for (let lx = 0; lx < 16; lx++)
        for (let lz = 0; lz < 16; lz++)
          for (let ly = 0; ly < 16; ly++) {
            const wx = bx + lx, wy = c.cy * 16 + ly, wz = bz + lz;
            const h = gen.heightAt(wx, wz);
            let base: number;
            if (wy > h) base = wy <= SEA_LEVEL ? Block.Water : Block.Air;
            else if (wy < h - 4) base = Block.Stone;
            else if (wy < h) base = Block.Dirt;
            else base = h < SEA_LEVEL + 1 ? Block.Sand : Block.Grass;
            if ((base === Block.Stone || base === Block.Dirt) && wy <= SEA_LEVEL && gen.caveAt(wx, wy, wz) > 0.55) {
              carved++;
              expect(w.getBlock(wx, wy, wz), `carved cell (${wx},${wy},${wz}) must be Air`).toBe(Block.Air);
            }
          }
    }
    console.log('H carved=', carved);
    expect(carved).toBeGreaterThan(0);
  });
});
