import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, chunkOf, chunkKey } from '../world';
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
  it('water placed on a stone pad floods the whole connected floor layer (unlimited range); exactly one source (the placed cell), the rest is flow, and water never climbs', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15); // floor at y=0
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water);
    sim.edit(8, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);

    console.log('A count=', countWater(w));
    const cs = (x: number, y: number, z: number) => sim.cellState(x, y, z);
    expect(cs(8, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 1, f: 0 }); // the only source: the placed cell
    expect(cs(9, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 0, f: 1 }); // flow, level stays 7 (it never decays), sustained by the source
    expect(cs(0, 1, 8).b).toBe(Block.Water); // the flood runs to the chunk edge — range is unlimited...
    expect(cs(15, 1, 8).b).toBe(Block.Water);
    expect(cs(8, 1, 0).b).toBe(Block.Water);
    expect(cs(8, 1, 15).b).toBe(Block.Water);
    // ...but it is bounded by missing space (no spread into ungenerated chunks)
    expect(cs(8, 2, 8).b).toBe(Block.Air); // water never climbs: the flood stays a floor layer
    expect(countWater(w)).toBe(256); // every floor cell of the 16x16 pad
    assertInvariants(w);
  });

  it('covering the sole source makes all the water it fed starve to air (a plugged pool empties itself)', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15);
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water);
    sim.edit(8, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);
    expect(countWater(w)).toBe(256); // 1 source + 255 flow

    w.setBlock(8, 1, 8, Block.Stone); // block the source: no source remains in the world
    sim.edit(8, 1, 8, Block.Stone);
    // the reachability audit marks the whole pool unreachable; starves then drain it at
    // the slow-clock pace (one cell per processed update)
    let guard = 0;
    while (countWater(w) > 0 && guard++ < 300) sim.tick(200);
    expect(countWater(w)).toBe(0);
    assertInvariants(w);
  });

  it('a cave under the ocean fills when the floor is breached, drains when the hole is plugged, and refills when it is broken again', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // x 0..31, y 0..15
    for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) {
      w.setBlock(x, 0, z, Block.Stone); // world-floor rock (solid bottom: nothing drains out of the world)
    }
    for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) {
      for (let y = 1; y <= 7; y++) w.setBlock(x, y, z, Block.Stone); // rock body
      for (let y = 9; y <= 15; y++) w.setBlock(x, y, z, Block.Water); // ocean above a stone floor
    }
    for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 8, z, Block.Stone); // the ocean floor (solid)
    for (let x = 16; x <= 23; x++) for (let z = 12; z <= 15; z++) for (let y = 1; y <= 7; y++) w.setBlock(x, y, z, Block.Air); // sealed cave (stone on every side)
    for (let x = 18; x <= 21; x++) for (let z = 13; z <= 14; z++) w.setBlock(x, 8, z, Block.Air); // the hole in the ocean floor
    const sim = new WaterSim(w);
    sim.settle(0, 0, 0); sim.settle(1, 0, 0);
    drain(sim);
    expect(w.getBlock(20, 3, 13)).toBe(Block.Water); // the ocean poured in through the hole and filled the cave
    expect(w.getBlock(16, 7, 12)).toBe(Block.Water); // all the way to the far corner (unlimited range)
    expect(sim.cellState(20, 3, 13).s).toBe(0); // ...as flow: the sea water that fell in carries no source bit
    expect(sim.tick(1)).toBe(0);
    const caveWater = () => countWaterAt(w, 16, 23, 12, 15, 1, 7);
    expect(caveWater()).toBe(224); // 8 x 4 x 7: the whole cave, and it stays (connected to the sea through the hole)

    // plug the hole: the cave is now sealed off from every source.
    for (let x = 18; x <= 21; x++) for (let z = 13; z <= 14; z++) {
      w.setBlock(x, 8, z, Block.Stone);
      sim.edit(x, 8, z, Block.Stone);
    }
    let guard = 0;
    while (caveWater() > 0 && guard++ < 300) sim.tick(200); // the reachability audit marks the cave unreachable; starves drain it at the slow-clock pace
    expect(caveWater()).toBe(0); // the plugged cave empties itself
    expect(w.getBlock(5, 10, 5)).toBe(Block.Water); // the ocean above is untouched
    expect(sim.tick(1)).toBe(0);
    assertInvariants(w);

    // break the plug: the ocean pours back in and the cave refills with flow.
    for (let x = 18; x <= 21; x++) for (let z = 13; z <= 14; z++) {
      w.setBlock(x, 8, z, Block.Air);
      sim.edit(x, 8, z, Block.Air);
    }
    drain(sim);
    expect(caveWater()).toBe(224);
    expect(sim.tick(1)).toBe(0);
    assertInvariants(w);
  });

  it('a source falling into a walled pit lands as flow and starves away: only placement creates sources, and flow with no source left to reach it goes', () => {
    const w = makeWorld([[0, 0, 0]]); // chunks span y=0..15
    w.setBlock(8, 0, 8, Block.Stone); // floor of a 1-wide pit
    // solid walls at the landing level so the landed cell cannot spread to a floorless edge
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) w.setBlock(8 + dx, 1, 8 + dz, Block.Stone);
    const sim = new WaterSim(w);
    w.setBlock(8, 8, 8, Block.Water);
    sim.edit(8, 8, 8, Block.Water);
    drain(sim);
    expect(sim.cellState(8, 8, 8).b).toBe(Block.Air); // origin dried as it fell
    expect(sim.cellState(8, 1, 8).b).toBe(Block.Air); // landed as flow in the walled pit, then starved: no source anywhere
    expect(countWater(w)).toBe(0);
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
    expect(sim.cellState(x, 1, z)).toEqual({ b: Block.Water, l: 7, s: 1, f: 0 });
    expect(sim.tick(1)).toBe(0); // fixpoint: settled pool never cascades
    expect(countWater(w)).toBe(9);

    // break the centre and let the source ring refill it
    w.setBlock(7, 1, 7, Block.Air);
    sim.edit(7, 1, 7, Block.Air);
    drain(sim);
    expect(sim.cellState(7, 1, 7).b).toBe(Block.Water);
    expect(sim.cellState(7, 1, 7).s).toBe(0); // refilled as flow, sustained by the source ring (no re-promotion)
    expect(sim.cellState(7, 1, 7).f).toBe(1);
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
    expect(sim.cellState(16, 1, 8).l).toBe(7);
    expect(sim.cellState(14, 1, 8).l).toBe(7); // and back into chunk 0
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
    expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Water, l: 7, s: 1, f: 0 });
    w.setBlock(4, 4, 4, Block.Stone);
    sim.edit(4, 4, 4, Block.Stone);
    expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Stone, l: 0, s: 0, f: 0 });
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
    sim.settle(0, 0, 0); // already settled → early return, leaves the flood untouched
    drain(sim);
    const after = snap();
    expect(after.l.join()).toBe(before.l.join());
    expect(after.s.join()).toBe(before.s.join());
    expect(countWater(w)).toBe(256);
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

  it('settling one chunk fills the entire seam-reachable cave (unlimited range) — it never touches a loaded-unsettled neighbour\'s worldgen water, whose own settle re-seeds it', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]]); // 2x2 ocean slab, y 0..15
    for (let x = 0; x < 32; x++) for (let z = 0; z < 32; z++) {
      w.setBlock(x, 0, z, Block.Stone); // seafloor
      for (let y = 1; y <= 15; y++) w.setBlock(x, y, z, Block.Water);
    }
    for (let x = 16; x <= 23; x++) for (let z = 12; z <= 15; z++) for (let y = 1; y <= 6; y++) w.setBlock(x, y, z, Block.Air); // sea-facing cave pocket in chunk (1,0,0)
    const sim = new WaterSim(w);
    const b0 = countWaterAt(w, 16, 31, 0, 31, 0, 15); // right column = chunk (1,0,0) [the cave] + (1,0,1) [open sea]
    sim.settle(0, 0, 0); // settle ONLY the left chunk (the runtime's per-chunk-on-load form)
    const b1 = countWaterAt(w, 16, 31, 0, 31, 0, 15);
    console.log('P before right column=', b0);
    console.log('P after  right column=', b1);
    expect(b1).toBe(7680); // +192 = the whole cave (x=16..23, unlimited range): growth is pure cave filling — no worldgen water eaten
    expect(sim.cellState(16, 8, 8)).toEqual({ b: Block.Water, l: 0, s: 0, f: 0 }); // guard-2 state pin: the neighbour's pristine sea water is never touched by a spread (which targets Air only); its own settle re-seeds it as (7,1)
    expect(w.getBlock(17, 3, 13)).toBe(Block.Water); // the spread reached through the seam into the cave
    expect(w.getBlock(23, 3, 13)).toBe(Block.Water); // and all the way to the far columns (range is unlimited)
    sim.settle(1, 0, 0); sim.settle(0, 0, 1); sim.settle(1, 0, 1); // settle the rest: the cave's own chunk seeds its own water
    const b2 = countWaterAt(w, 16, 31, 0, 31, 0, 15);
    expect(w.getBlock(23, 3, 13)).toBe(Block.Water);
    expect(b2).toBe(7680); // full ocean + fully filled cave (7488 + 192) with zero worldgen water eaten
    // every chunk is settled now: the state is at rest, so the invariant holds
    assertInvariants(w);
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

  it('a settled chunk\'s touched mark survives later sibling settles, so the frame-end drain still re-meshes it (stale seam-mesh fix)', () => {
    // The geometry keeps chunk 1\'s cave out of reach of chunk 0\'s water (the seafloor
    // row between them is solid): spreading — which only writes Air targets — never
    // touches chunk 1, so nothing there is marked until chunk 1 settles and fills its
    // own cave from its own water.
    const w = makeWorld([[0, 0, 0], [1, 0, 0], [2, 0, 0]]); // 3 chunks wide: x=0..47, z=0..15
    for (let x = 0; x < 48; x++) for (let z = 0; z < 16; z++) {
      for (let y = 0; y <= 3; y++) w.setBlock(x, y, z, Block.Stone); // seafloor
      for (let y = 4; y <= 7; y++) w.setBlock(x, y, z, Block.Water); // shallow ocean
    }
    for (let x = 18; x <= 23; x++) for (let z = 0; z <= 5; z++) for (let y = 1; y <= 3; y++) {
      w.setBlock(x, y, z, Block.Air); // sea-facing cave inside chunk 1
    }
    const sim = new WaterSim(w);
    sim.settle(0, 0, 0); // the spread guards keep chunk 1 pristine: only chunk 0's own edge cells are touched
    expect(w.getBlock(19, 2, 2)).toBe(Block.Air); // chunk 1's cave is NOT flooded by a sibling's settle ...
    expect(sim.touched.has(chunkKey(1, 0, 0))).toBe(false); // ...and no seam chunk is marked yet
    sim.settle(1, 0, 0); // settling the cave's own chunk floods it from its own water ...
    expect(w.getBlock(19, 2, 2)).toBe(Block.Water); // ... so chunk 1's mesh is now stale and marked
    expect(sim.touched.has(chunkKey(1, 0, 0))).toBe(true); // ...
    sim.settle(2, 0, 0); // ... and a second settling chunk in the same frame must not wash that mark away
    expect(sim.touched.has(chunkKey(1, 0, 0))).toBe(true); // the frame-end drain (main.ts) is the sole consumer of `touched`
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

  it('settle seeds worldgen water in bulk (stats.seeds) — interior ocean cells trigger no per-cell seeding work', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // 2-chunk ocean slab
    for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) {
      w.setBlock(x, 0, z, Block.Stone); // seafloor
      for (let y = 1; y <= 15; y++) w.setBlock(x, y, z, Block.Water); // ocean to the chunk top
    }
    const sim = new WaterSim(w);
    sim.settle(0, 0, 0);
    expect(sim.stats.seeds).toBe(3840); // 16*16*15 water cells of chunk 0, all bulk-seeded in pass 1
  });

  it('a band settling above a not-yet-loaded low band keeps its bottom water (no drain through unloaded space); the low band arrives and the cascade settles it', () => {
    // Streaming can load a high y-band before its low band. cellState reads the not-yet-
    // generated low band as dry Air, so an unconditional settle would "fall" the high
    // band's bottom water out of the world: the ocean top row is destroyed forever and
    // only refilled unevenly by spreads (the visible raised/stepped ocean sections).
    // Bands cy=-2 (world floor)..cy=1; chunk (0,0,0) — the low band under the water —
    // is missing. The high band's water column is pristine worldgen water at its bottom row.
    const w = makeWorld([[0, -2, 0], [0, -1, 0], [0, 1, 0]]);
    for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) {
      w.setBlock(x, -1, z, Block.Stone); // floor of the world-floor band (top row of (0,-1,0))
      w.setBlock(x, 16, z, Block.Water); // the high band's bottom row (its below = y15, in the MISSING band)
      w.setBlock(x, 17, z, Block.Water); // one row above
    }
    const sim = new WaterSim(w);
    const hi = w.getChunk(0, 1, 0)!;
    sim.settle(0, -2, 0); // the floor band settles (its low band is out of band, not missing) and cascades up to (0,-1,0)
    sim.settle(0, 1, 0); // DEFERRED: its low band (0,0,0) does not exist yet — the water must survive exactly as generated
    expect(hi.settled).toBe(false); // deferred, not settled
    expect(countWater(w)).toBe(512); // 2 rows x 256: nothing fell out of the unloaded world
    expect(w.getBlock(5, 16, 5)).toBe(Block.Water);
    const s = sim.cellState(5, 16, 5);
    expect(s.b).toBe(Block.Water);
    expect(s.l).toBe(0); // still pristine: the settle never ran on it
    // Now the low band arrives: it is all stone (solid floor under the water), and its
    // settle must cascade into the deferred high band.
    w.ensureChunk(0, 0, 0);
    for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) for (let y = 0; y < 16; y++) w.setBlock(x, y, z, Block.Stone);
    sim.settle(0, 0, 0);
    expect(hi.settled).toBe(true); // the cascade (low band -> band above) settled the deferred band
    expect(countWater(w)).toBe(512); // resting on the stone below: nothing fell, nothing drained
    const t = sim.cellState(5, 16, 5);
    expect(t.b).toBe(Block.Water);
    expect(t.s).toBe(1); // re-seeded as a source by the cascade settle
    assertInvariants(w);
  });
});
