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
it('water placed on a stone pad makes a bounded fan: one level lost per sideways step (~6 blocks out), a fall resets to full level; exactly one source (the placed cell), the rest is flow, and water never climbs', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15); // floor at y=0
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water);
    sim.edit(8, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);

    const cs = (x: number, y: number, z: number) => sim.cellState(x, y, z);
    expect(cs(8, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 1, f: 0, p: 1, st: 0 }); // the only source: the placed cell (a spring)
    expect(cs(9, 1, 8)).toEqual({ b: Block.Water, l: 6, s: 0, f: 1, p: 0, st: 0 }); // flow one step out: level 6, sustained by the source
    expect(cs(14, 1, 8)).toEqual({ b: Block.Water, l: 1, s: 0, f: 1, p: 0, st: 0 }); // the fan's lip: level 1, six steps out...
    expect(cs(15, 1, 8).b).toBe(Block.Air); // ...and it stops there: a level-1 cell spreads nothing (no more contour-flooding on hills)
    expect(cs(8, 1, 2), 'the fan reaches ~6 blocks out in the sideways directions').toEqual({ b: Block.Water, l: 1, s: 0, f: 1, p: 0, st: 0 });
    expect(cs(8, 2, 8).b).toBe(Block.Air); // water never climbs: the flood stays a floor layer
    expect(countWater(w)).toBe(85); // the bounded 4-way fan (six steps of level decay from the spring)
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
    expect(countWater(w)).toBe(85); // 1 source + 84 flow

    w.setBlock(8, 1, 8, Block.Stone); // block the source: no source remains in the world
    sim.edit(8, 1, 8, Block.Stone);
    // the reachability audit marks the whole pool unreachable; starves then drain it at
    // the slow-clock pace (one cell per processed update)
    let guard = 0;
    while (countWater(w) > 0 && guard++ < 300) sim.tick(200);
    expect(countWater(w)).toBe(0);
    assertInvariants(w);
  });

  it('a cave under the ocean takes a stream + floor pool when the floor is breached, drains when the hole is plugged, and re-fills when it is broken again', () => {
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
    expect(w.getBlock(20, 3, 13)).toBe(Block.Water); // a stream came down through the hole and holds there (it is flow, never a source)
    expect(w.getBlock(16, 1, 12)).toBe(Block.Water); // the floor pool runs to the far corner (unlimited range on solid ground)
    expect(w.getBlock(16, 7, 12)).toBe(Block.Air);   // but the cave does NOT fill: only a floor pool + thin stream over the hole
    expect(sim.cellState(20, 3, 13).s).toBe(0); // ...the stream carries no source bit (worldgen water pours flow)
    expect(sim.tick(1)).toBe(0);
    const caveWater = () => countWaterAt(w, 16, 23, 12, 15, 1, 7);
    // 8 x 4 floor pool (y=1) + 4 x 2 columns x 6 stream levels (y=2..7 over the hole) = 80 of 224
    expect(caveWater()).toBe(80); // and it stays (connected to the sea through the hole)

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
    expect(caveWater()).toBe(80); // broken plug: the stream and floor pool come back
    expect(sim.tick(1)).toBe(0);
    assertInvariants(w);
  });

  it('a source placed inside a hollow never falls: it stays a spring, pouring a stream to the floor and a bounded pool; mined out, the pool starves away', () => {
    const w = makeWorld([[0, 0, 0]]); // chunk spans y=0..15
    for (let y = 0; y <= 15; y++) for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) w.setBlock(x, y, z, Block.Stone); // solid rock ...
    for (let x = 7; x <= 9; x++) for (let z = 7; z <= 9; z++) for (let y = 1; y <= 4; y++) w.setBlock(x, y, z, Block.Air); // ... with a 3x3 hollow (a cave pocket)
    const sim = new WaterSim(w);
    w.setBlock(8, 4, 8, Block.Water); // place a spring in the rock, inside the hollow
    sim.edit(8, 4, 8, Block.Water);
    for (let i = 0; i < 50; i++) sim.tick(250); // 50 slow-clock pulses

    expect(sim.cellState(8, 4, 8)).toEqual({ b: Block.Water, l: 7, s: 1, f: 0, p: 1, st: 0 }); // a placed spring NEVER falls — it stays a permanent emitter in the wall
    expect(w.getBlock(8, 3, 8)).toBe(Block.Water); // its stream runs down the hollow ...
    expect(w.getBlock(8, 2, 8)).toBe(Block.Water); // ... and pools on the floor ...
    expect(w.getBlock(7, 1, 8)).toBe(Block.Water); // a bounded floor pool (six decaying steps from each landing, clamped by the walls) ...
    expect(sim.cellState(7, 4, 8).st).toBe(1); // ... and its sideways push at head level runs down the wall as a STREAM (visible, never spreads, cannot climb)
    const c1 = countWater(w);
    expect(c1).toBe(24); // 1 spring + 4 head-level side flows + 5 + 5 stream cells (y=3,2) + 9 floor cells
    for (let i = 0; i < 20; i++) sim.tick(250); // it keeps flowing, but the state is stable at rest
    expect(countWater(w)).toBe(c1); // no churn, no climbing
    assertInvariants(w);

    // mine the spring out of the rock: with no source left, the stream and pool starve away
    w.setBlock(8, 4, 8, Block.Air);
    sim.edit(8, 4, 8, Block.Air);
    let guard = 0;
    while (countWater(w) > 0 && guard++ < 300) sim.tick(200);
    expect(countWater(w)).toBe(0);
    assertInvariants(w);
  });

  it('a spring on a ledge writes its waterfall in one pass (downward spread is unlimited until stopped by ground): the whole column appears instantly, pools a floor sheet, side streams run from the head — nothing climbs, and the result is a quiet fixpoint', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15); // open floor at y=0
    const sim = new WaterSim(w);
    w.setBlock(8, 11, 8, Block.Water);
    sim.edit(8, 11, 8, Block.Water);
    w.setBlock(8, 10, 8, Block.Water); // a two-source (spring) stack above the floor = a ledge head
    sim.edit(8, 10, 8, Block.Water);
    for (let i = 0; i < 3; i++) sim.tick(250);
    expect(w.getBlock(8, 2, 8), 'no drip fill-in: the column is written in one pass').toBe(Block.Water);
    expect(w.getBlock(8, 9, 8), '...top of the shaft included, within pulses').toBe(Block.Water);
    for (let i = 0; i < 100; i++) sim.tick(250); // settle to the side-stream steady state

    expect(sim.cellState(8, 11, 8)).toEqual({ b: Block.Water, l: 7, s: 1, f: 0, p: 1, st: 0 }); // the springs stay put — a placed spring never falls out of the water
    expect(sim.cellState(8, 10, 8).s).toBe(1);
    for (let y = 1; y <= 11; y++) {
      expect(w.getBlock(8, y, 8), `level y=${y} must be full`).toBe(Block.Water);
    }
    expect(sim.cellState(8, 3, 8).st).toBe(1); // the main column is a stream (visible, never spreads)
    expect(sim.cellState(8, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 0, f: 1, p: 0, st: 0 }); // the floor pool is a sheet on solid ground, not stream
    expect(sim.cellState(14, 1, 8).b).toBe(Block.Water); // inside the combined floor fan (main landing + side-column landings)
    expect(sim.cellState(15, 1, 8).b).toBe(Block.Water); // the side-column fans push the lip one block further
    expect(sim.cellState(16, 1, 8).b).toBe(Block.Air); // ...but it stops at the chunk edge (missing neighbour writes nothing)
    expect(w.getBlock(7, 11, 8), 'side streams run off the head level').toBe(Block.Water);
    expect(w.getBlock(7, 12, 8), 'nothing is written above the head level').toBe(Block.Air);
    // 85 floor sheet (bounded fan) + 8 main column cells (y=2..9) + 2 spring heads + 4 side columns x 10 cells (y=2..11)
    expect(countWater(w)).toBe(163); // 93 (springs + main column + main fan) + 36 shaft cells of the 4 side columns off the head + their clipped landing sheets + merged overlapping fans
    const c = countWater(w);
    for (let i = 0; i < 20; i++) sim.tick(250); // steady: the springs keep checking their full columns, write nothing
    expect(countWater(w)).toBe(c); // no churn, no flicker: a true fixpoint
    assertInvariants(w);
  });

it('a spring pouring at the world edge stays stable: the column rests on the void at the floor of the world (no per-pulse blink) and fans out a bounded sheet there; the spring endures', () => {
    const w = makeWorld([[0, 0, 0]]); // chunk spans y=0..15; nothing below
    const sim = new WaterSim(w);
    w.setBlock(8, 8, 8, Block.Water);
    sim.edit(8, 8, 8, Block.Water);
    for (let i = 0; i < 30; i++) sim.tick(250);
    expect(sim.cellState(8, 8, 8)).toEqual({ b: Block.Water, l: 7, s: 1, f: 0, p: 1, st: 0 }); // a placed spring never falls or dries
    expect(countWater(w)).toBe(125); // 85 fan on the y=0 world-floor plane + 7 shaft stream cells + the spring + 28 shaft cells + 4 landing sheets from the spring's 4 side-spread flows
    const c = countWater(w);
    for (let i = 0; i < 30; i++) sim.tick(250);
    expect(countWater(w)).toBe(c); // steady: the base sheet rests on the void and writes nothing
    assertInvariants(w);
  });

it('a sealed 3x3 pool is a fixpoint of the slow clock (immortal); breaking the centre refills it from the source ring', () => {
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
     expect(sim.cellState(x, 1, z)).toEqual({ b: Block.Water, l: 7, s: 1, f: 0, p: 1, st: 0 });
    expect(countWater(w)).toBe(9);
    const c = countWater(w);
    for (let i = 0; i < 20; i++) sim.tick(250); // fixpoint: settled pool never cascades (the spring ring re-checks every pulse, writes nothing)
    expect(countWater(w)).toBe(c);

    // break the centre and let the source ring refill it
    w.setBlock(7, 1, 7, Block.Air);
    sim.edit(7, 1, 7, Block.Air);
    drain(sim);
    expect(sim.cellState(7, 1, 7).b).toBe(Block.Water);
    expect(sim.cellState(7, 1, 7).s).toBe(0); // refilled as flow, sustained by the source ring (no re-promotion)
    expect(sim.cellState(7, 1, 7)).toEqual({ b: Block.Water, l: 6, s: 0, f: 1, p: 0, st: 0 }); // one level down: it is a spread from the ring, not a new spring
    expect(countWater(w)).toBe(9);
    const c2 = countWater(w);
    for (let i = 0; i < 20; i++) sim.tick(250);
    expect(countWater(w)).toBe(c2);
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
    expect(sim.cellState(16, 1, 8).l).toBe(6); // the level is carried (and decays: one less per step from the spring)
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

it('placing Water via edit makes a source (a spring that never falls, even alone in the sky); placing a solid into water clears that cell; invariants hold', () => {
    const w = makeWorld([[0, 0, 0]]);
    const sim = new WaterSim(w);
 w.setBlock(4, 4, 4, Block.Water);
   sim.edit(4, 4, 4, Block.Water);
   expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Water, l: 7, s: 1, f: 0, p: 1, st: 0 });
   w.setBlock(4, 4, 4, Block.Stone);
   sim.edit(4, 4, 4, Block.Stone);
   expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Stone, l: 0, s: 0, f: 0, p: 0, st: 0 });
});

  it('a placed spring alone in the sky never falls or dries: it keeps pouring, and its fall is destroyed out of the world', () => {
    const w = makeWorld([[0, 0, 0]]);
    const sim = new WaterSim(w);
    w.setBlock(4, 4, 4, Block.Water);
    sim.edit(4, 4, 4, Block.Water);
    for (let i = 0; i < 30; i++) sim.tick(250); // a dozen or so slow-clock pulses
    expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Water, l: 7, s: 1, f: 0, p: 1, st: 0 }); // the spring hovers: it is a source, not a falling block
    expect(countWater(w)).toBe(97); // spring + 3 shaft cells + the world-floor sheet's clipped fan (77) + 3 shaft cells + 1 landing sheet for each of the spring's 4 side-spread flows
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

  it('settling one chunk never floods a seam neighbour (worldgen water is static) — settling the cave chunk itself pours its own sea down as stream + floor sheet, and no worldgen water is eaten', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]]); // 2x2 ocean slab, y 0..15
    for (let x = 0; x < 32; x++) for (let z = 0; z < 32; z++) {
      w.setBlock(x, 0, z, Block.Stone); // seafloor
      for (let y = 1; y <= 15; y++) w.setBlock(x, y, z, Block.Water);
    }
    for (let x = 16; x <= 23; x++) for (let z = 12; z <= 15; z++) for (let y = 1; y <= 6; y++) w.setBlock(x, y, z, Block.Air); // sea-facing cave pocket in chunk (1,0,0), open to the sea columns directly above it
    const sim = new WaterSim(w);
    const b0 = countWaterAt(w, 16, 31, 0, 31, 0, 15); // right column = chunk (1,0,0) [the cave] + (1,0,1) [open sea]
    sim.settle(0, 0, 0); // settle ONLY the left chunk (the runtime's per-chunk-on-load form)
    const b1 = countWaterAt(w, 16, 31, 0, 31, 0, 15);
    console.log('P before right column=', b0);
    console.log('P after  right column=', b1);
    expect(b1).toBe(b0); // the worldgen sea does NOT push: settling the left column leaves the seam cave dry (the 2c fix — water levels never rise)
    expect(sim.cellState(16, 8, 8)).toEqual({ b: Block.Water, l: 0, s: 0, f: 0, p: 0, st: 0 }); // the neighbour's pristine sea water is never touched
    expect(w.getBlock(17, 3, 13)).toBe(Block.Air); // nothing crossed the seam
    sim.settle(1, 0, 0); sim.settle(0, 0, 1); sim.settle(1, 0, 1); // settle the rest: the cave's own chunk pours its own sea down
    let n = 0;
    while (n++ < 100 && sim.tick(200) !== 0) { /* drain: the runtime drains the queue every frame; settle can bail out on its per-chunk budget guard, the rest lands on the next pulses */ }
    const b2 = countWaterAt(w, 16, 31, 0, 31, 0, 15);
    expect(w.getBlock(23, 3, 13)).toBe(Block.Water); // stream through the cave to the far column
    expect(b2).toBe(7680); // 32 floor-pool cells + 32 stream columns x 5 levels = +192, with zero worldgen water eaten
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
    // Worldgen water is static: chunk 0's ocean never pushes across the seam, so chunk 1
    // stays pristine until it settles and pours its OWN sea water down into the cave
    // (the cave opens straight into the ocean at y=4, above the carved seafloor).
    const w = makeWorld([[0, 0, 0], [1, 0, 0], [2, 0, 0]]); // 3 chunks wide: x=0..47, z=0..15
    for (let x = 0; x < 48; x++) for (let z = 0; z < 16; z++) {
      for (let y = 0; y <= 3; y++) w.setBlock(x, y, z, Block.Stone); // seafloor
      for (let y = 4; y <= 7; y++) w.setBlock(x, y, z, Block.Water); // shallow ocean
    }
    for (let x = 18; x <= 23; x++) for (let z = 0; z <= 5; z++) for (let y = 1; y <= 3; y++) {
      w.setBlock(x, y, z, Block.Air); // sea-facing cave inside chunk 1
    }
    const sim = new WaterSim(w);
    sim.settle(0, 0, 0); // worldgen water stands: chunk 0's settle leaves chunk 1 pristine (no static sea ever crosses the seam)
    expect(w.getBlock(19, 2, 2)).toBe(Block.Air); // chunk 1's cave is NOT flooded by a sibling's settle ...
    expect(sim.touched.has(chunkKey(1, 0, 0))).toBe(false); // ...and no seam chunk is marked yet
    sim.settle(1, 0, 0); // settling the cave's own chunk pours its own sea down into the cave (stream + floor pool) ...
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
