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
it('a placed source is a STATIC block: it emits a side halo into the air beside it but never pours a column below itself (the space under a lone sky source stays dry; the halo it emits falls as the drip), and a lone source never grows into a column of sources', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15);
    const sim = new WaterSim(w);
    w.setBlock(8, 5, 8, Block.Water);
    sim.edit(8, 5, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);

    const cs = (x: number, y: number, z: number) => sim.cellState(x, y, z);
    expect(cs(8, 5, 8)).toEqual({ b: Block.Water, l: 7, s: 1, p: 1, st: 0 }); // the source, still a source
    expect(cs(8, 4, 8).b).toBe(Block.Air); // nothing directly below the source: it pours no column through itself
    expect(cs(8, 2, 8).b).toBe(Block.Air); // ...and none at any height: the space under the source is column-free
    // (floor-level cells under it may carry the landing fans of the side drips — that is flow, and it dries with them)
    expect(cs(7, 5, 8).b).toBe(Block.Water); // side halo, one step out
    expect(cs(7, 4, 8).b).toBe(Block.Water); // the halo falls (air below it)
    expect(cs(7, 1, 8).b).toBe(Block.Water); // its drip reaches the floor

    // stable, and the lone source never accumulates into a vertical run of sources
    const countSprings = (): number => {
      let n = 0;
      for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) for (let y = 0; y < 16; y++) {
        if (cs(x, y, z).p === 1) n++;
      }
      return n;
    };
    const after = countWater(w);
    sim.tick(200); sim.tick(200); sim.tick(200);
    expect(countWater(w)).toBe(after);
    expect(countSprings()).toBe(1);
    assertInvariants(w);
  });

  it('a body of placed water heals one-cell gaps and missing corners (source regeneration: S . S becomes S S S; a missing corner beside sources regenerates), so a placed-water body stays a body', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15);
    const sim = new WaterSim(w);
    // S . S flanking a one-cell gap, resting on the floor
    w.setBlock(7, 1, 8, Block.Water); sim.edit(7, 1, 8, Block.Water);
    w.setBlock(9, 1, 8, Block.Water); sim.edit(9, 1, 8, Block.Water);
    // a missing corner: sources at (7,2,8) and (8,2,8) above, (7,1,8) alongside — the air at (8,1,8) heals
    w.setBlock(7, 2, 8, Block.Water); sim.edit(7, 2, 8, Block.Water);
    w.setBlock(8, 2, 8, Block.Water); sim.edit(8, 2, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);

    expect(sim.cellState(8, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 1, p: 1, st: 0 }); // the gap healed to a source
    const cs = (x: number, y: number, z: number) => sim.cellState(x, y, z);
    sim.tick(200); sim.tick(200);
    expect(cs(8, 1, 8).b).toBe(Block.Water); // the healed body keeps its gaps closed
    assertInvariants(w);
  });

  it('user scene: a 5x5 water base in the air keeps its UNDERSIDE DRY (a source body pours no curtain through itself) and leaks only thin drips off its sides; a source on the 3-block tower emits its side halo, whose drip the base body absorbs; removing the tower source makes all of its feed disappear; what remains is the base body itself, its perimeter drips and their floor fans — and breaking the base dries the whole scene', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15); // floor at y=0
    const sim = new WaterSim(w);
    // 5x5 base of placed water at y=10 — a body of source blocks
    for (let x = 6; x <= 10; x++)
      for (let z = 6; z <= 10; z++) {
        w.setBlock(x, 10, z, Block.Water);
        sim.edit(x, 10, z, Block.Water);
      }
    // 3-block-tall tower in the middle of the base
    for (let y = 11; y <= 13; y++) w.setBlock(8, y, 8, Block.Stone);
    // the source on top
    w.setBlock(8, 14, 8, Block.Water);
    sim.edit(8, 14, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);

    const cs = (x: number, y: number, z: number) => sim.cellState(x, y, z);
    // with the source live: the source and its tower-top halo
    expect(w.getBlock(8, 14, 8)).toBe(Block.Water);
    expect(cs(7, 14, 8).b).toBe(Block.Water); // halo one step out on the tower top
    // the base body is still: no curtain under it — a source body pours no column through itself
    // (level 1 under the base may carry the landing fans of the perimeter drips: flow, which dries with them)
    expect(countWaterAt(w, 6, 10, 6, 10, 2, 9)).toBe(0);
    // ...but it leaks thin drips off its sides (a side halo falling to the floor)
    expect(cs(5, 10, 8).b).toBe(Block.Water); // side halo at the base edge
    expect(cs(5, 9, 8).b).toBe(Block.Water); // the drip column beside the base
    expect(cs(5, 1, 8).b).toBe(Block.Water); // its landing on the floor
    // the tower's drip meets the base body and is absorbed in it (no column materializes on the base)
    expect(countWaterAt(w, 6, 10, 6, 10, 11, 13)).toBe(0);

    // remove the tower source (break it: no source of its remains)
    w.setBlock(8, 14, 8, Block.Air);
    sim.edit(8, 14, 8, Block.Air);
    drain(sim);

    // all of the tower source's feed is gone: no tower-top halo, nothing floating
    expect(countWaterAt(w, 6, 10, 6, 10, 14, 15)).toBe(0);
    expect(countWaterAt(w, 6, 10, 6, 10, 11, 13)).toBe(0);
    // nothing adopted-source was left behind by the falls
    const adopted: string[] = [];
    for (let x = 0; x < 16; x++)
      for (let z = 0; z < 16; z++)
        for (let y = 1; y <= 15; y++) {
          const c = sim.cellState(x, y, z);
          if (c.b === Block.Water && c.s === 1 && c.p === 0) adopted.push(`${x},${y},${z}`);
        }
    expect(adopted, 'floating adopted source cells left behind by the falls').toEqual([]);
    // what remains is the base body itself, its perimeter drips and their floor fans — stable
    const after = countWater(w);
    expect(after).toBeGreaterThan(0);
    sim.tick(200); sim.tick(200); sim.tick(200);
    expect(countWater(w)).toBe(after);
    assertInvariants(w);

    // and breaking the base itself dries the whole scene: with zero sources left, everything is flow it fed
    for (let x = 6; x <= 10; x++)
      for (let z = 6; z <= 10; z++) {
        w.setBlock(x, 10, z, Block.Air);
        sim.edit(x, 10, z, Block.Air);
      }
    drain(sim);
    expect(countWater(w)).toBe(0);
    assertInvariants(w);
  });

  it('covering a source does NOT remove it (a buried source keeps emitting its halo — removal means breaking the water block itself)', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15);
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water);
    sim.edit(8, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);
    w.setBlock(8, 2, 8, Block.Stone); // cover the source from above
    sim.edit(8, 2, 8, Block.Stone);
    sim.tick(200);
    expect(w.getBlock(8, 1, 8)).toBe(Block.Water); // the source is still a source
    expect(sim.cellState(9, 1, 8).b).toBe(Block.Water); // ...and it still emits its halo
  });

  it('sources at the top of a 2-block coastal hill: their flow rides the surface of the shallow sea while they are live, and when they are broken NOTHING is left over the sea — no adopted source, no ghost flow — the sea is untouched and the land-side fans dry away', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // x 0..31
    for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) for (let y = 0; y <= 6; y++) w.setBlock(x, y, z, Block.Stone); // land, ground top y=6
    for (const hx of [14, 15]) { w.setBlock(hx, 7, 8, Block.Stone); w.setBlock(hx, 8, 8, Block.Stone); } // 2-block hill on the coast
    for (let x = 16; x < 32; x++) for (let z = 0; z < 16; z++) {
      for (let y = 0; y <= 6; y++) w.setBlock(x, y, z, Block.Stone); // seafloor level with the land
      w.setBlock(x, 7, z, Block.Water); // shallow sea, one row deep (surface y=7)
    }
    const sim = new WaterSim(w);
    sim.settle(0, 0, 0);
    sim.settle(1, 0, 0);
    const seaRow = () => countWaterAt(w, 16, 31, 0, 15, 7, 7); // the sea's own (surface) row
    const overSea = () => countWaterAt(w, 16, 31, 0, 15, 8, 15); // anything ABOVE the sea surface
    const seaBefore = seaRow(); // pure sea
    // a source on the hill top and one in the air at the sea edge (as on a 2-block jutting coast)
    w.setBlock(14, 9, 8, Block.Water); sim.edit(14, 9, 8, Block.Water);
    w.setBlock(16, 9, 8, Block.Water); sim.edit(16, 9, 8, Block.Water);
    let pulses = 0;
    while (sim.tick(1000) !== 0 && pulses++ < 50) { /* live settle at the runtime budget */ }

    // with the sources live: flow rides the sea's surface while it is fed — visible above
    // the sea, but it is FLOW (never an adopted source) and the sea itself is untouched
    expect(overSea()).toBeGreaterThan(0); // the sea-edge source's fall, above the surface
    expect(sim.cellState(17, 8, 8).s).toBe(0); // ...and it is FLOW that rides the surface
    expect(seaRow()).toBe(seaBefore); // the sea itself is untouched even while live

    // break both sources: at the live budget the whole scene re-stabilizes in a couple of
    // pulses (the reported "flow that keeps moving and flickers" was this cascade crawling
    // at a small budget, plus adopted ghosts that never dried)
    for (const [x, y] of [[14, 9], [16, 9]]) {
      w.setBlock(x, y, 8, Block.Air);
      sim.edit(x, y, 8, Block.Air);
    }
    let broke = 0;
    while (sim.tick(1000) !== 0 && broke++ < 50) { /* */ }
    
    expect(broke).toBeLessThanOrEqual(6); // settled in a handful of live-budget pulses (the reported "keeps moving" was a phantom regenerated spring between two separate sources, feeding its fan forever)
    expect(sim.tick(1)).toBe(0); // a true fixpoint: nothing left to re-derive

    expect(overSea()).toBe(0); // nothing left over the sea: no ghost flow, no adopted source
    expect(seaRow()).toBe(seaBefore); // the sea is exactly as it was
    expect(countWaterAt(w, 0, 15, 0, 15, 1, 15)).toBe(0); // the land-side fans dried away too
    assertInvariants(w);
  });

  it('a cave stream cut off from the sea (floor breach plugged) dries itself out within a handful of live-budget pulses — the re-stabilization cascade does not crawl for seconds', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // x 0..31, y 0..15
    for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) {
      w.setBlock(x, 0, z, Block.Stone); // world-floor rock
      for (let y = 1; y <= 7; y++) w.setBlock(x, y, z, Block.Stone); // rock body
      for (let y = 9; y <= 15; y++) w.setBlock(x, y, z, Block.Water); // ocean
      w.setBlock(x, 8, z, Block.Stone); // ocean floor (solid)
    }
    for (let x = 16; x <= 23; x++) for (let z = 12; z <= 15; z++) for (let y = 1; y <= 7; y++) w.setBlock(x, y, z, Block.Air); // sealed cave
    for (let x = 18; x <= 21; x++) for (let z = 13; z <= 14; z++) w.setBlock(x, 8, z, Block.Air); // breach in the ocean floor
    const sim = new WaterSim(w);
    sim.settle(0, 0, 0);
    sim.settle(1, 0, 0);
    let pulses = 0;
    while (sim.tick(1000) !== 0 && pulses++ < 50) { /* open state to rest */ }
    expect(sim.tick(1)).toBe(0); // quiet before the plug (no live springs: a drained queue returns 0)
    expect(countWaterAt(w, 16, 23, 12, 15, 1, 7)).toBe(80); // stream + floor pool fed by the sea

    for (let x = 18; x <= 21; x++) for (let z = 13; z <= 14; z++) {
      w.setBlock(x, 8, z, Block.Stone);
      sim.edit(x, 8, z, Block.Stone);
    }
    let plugged = 0;
    while (sim.tick(1000) !== 0 && plugged++ < 100) { /* the drain cascade, at the live budget */ }
    expect(plugged).toBeLessThanOrEqual(6); // the reported "never settles": cascade finished in a handful of 0.5 s pulses, not dozens
    expect(sim.tick(1)).toBe(0);
    expect(countWaterAt(w, 16, 23, 12, 15, 1, 7)).toBe(0); // the cave is dry
    assertInvariants(w);
  });

  it('water placed on a stone pad makes a bounded fan: one level lost per sideways step (~6 blocks out), a fall resets to full level; exactly one source (the placed cell), the rest is flow, and water never climbs', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15); // floor at y=0
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water);
    sim.edit(8, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);

    const cs = (x: number, y: number, z: number) => sim.cellState(x, y, z);
    expect(cs(8, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 1, p: 1, st: 0 }); // the only source: the placed cell (a spring)
    expect(cs(9, 1, 8)).toEqual({ b: Block.Water, l: 6, s: 0, p: 0, st: 0 }); // flow one step out: level 6, re-derived from the source at one hop
    expect(cs(14, 1, 8)).toEqual({ b: Block.Water, l: 1, s: 0, p: 0, st: 0 }); // the fan's lip: level 1, six steps out...
    expect(cs(15, 1, 8).b).toBe(Block.Air); // ...and it stops there: a level-1 cell spreads nothing (no more contour-flooding on hills)
    expect(cs(8, 1, 2), 'the fan reaches ~6 blocks out in the sideways directions').toEqual({ b: Block.Water, l: 1, s: 0, p: 0, st: 0 });
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
    // no full-level feed is left (the flow is all level < 7, nothing has landed): the
    // level wave re-derives the whole pool to air through the dirty closure, at the
    // slow-clock pace (one cell per processed update)
    let guard = 0;
    while (countWater(w) > 0 && guard++ < 300) sim.tick(200);
    expect(countWater(w)).toBe(0);
    assertInvariants(w);
  });

  it('local re-derivation after a water-removing edit: flow with no full-level feed in reach dries away completely (a cut-off body empties itself — flow only exists because of its source), while flow still connected to a live spring is unaffected', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // x 0..31
    for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone); // open floor
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water);  // spring A, mid-left of the floor
    sim.edit(8, 1, 8, Block.Water);
    w.setBlock(24, 4, 8, Block.Water); // spring D, in the sky mid-right: pours a stream to the floor + a landing sheet
    sim.edit(24, 4, 8, Block.Water);
    drain(sim);
    console.log('AUD pre-break=', countWater(w));
    expect(countWaterAt(w, 16, 31, 0, 15, 1, 15)).toBe(126); // D: the 4 halo-drip side columns off the source's head level (a source pours no column through itself) + their 4 landing sheets and floor fans, which push the 85 fan's lip a little further
    expect(countWaterAt(w, 0, 15, 0, 15, 1, 15)).toBe(85);  // A's fan

    // remove spring D (the player mining it out): its body now has NO live feed anywhere.
    // The level wave passes through the dirty closure: with no feed anywhere, every cell
    // re-derives dry as it is re-evaluated, so D's region ends up completely empty — no
    // orphan water left acting like a source (the reported "all water is a source"),
    // nothing re-sprouting on its own.
    w.setBlock(24, 4, 8, Block.Air);
    sim.edit(24, 4, 8, Block.Air);
    for (let i = 0; i < 40; i++) sim.tick(250);
    console.log('AUD post-break D region=', countWaterAt(w, 16, 31, 0, 15, 1, 15), 'A region=', countWaterAt(w, 0, 15, 0, 15, 1, 15));
    expect(countWaterAt(w, 16, 31, 0, 15, 1, 15)).toBe(0); // D's body is gone — the cut-off flow dried away completely
    expect(countWaterAt(w, 0, 15, 0, 15, 1, 15)).toBe(85); // A's fan, still connected to its live spring, is unaffected by re-derivation
    expect(countWater(w)).toBe(85);
    // steady: another batch of pulses changes nothing
    for (let i = 0; i < 20; i++) sim.tick(250);
    expect(countWater(w)).toBe(85);
    assertInvariants(w);
  });

  it('a player pool at sea level that touches the ocean: breaking the player spring drains ALL of it — the static sea cannot keep player water alive (the reported "still can\'t stop it at the shoreline")', () => {
    // The user's scene at ground level, right up against the sea: a 2-tall 3x4 platform on
    // flat ground at sea level, ocean on the other side. Ground top = sea surface (y7).
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // x 0..31
    for (let x = 0; x < 16; x++) // dry side: flat ground rising to sea level (sea-surface = its top)
      for (let z = 0; z < 16; z++) for (let y = 0; y <= 6; y++) w.setBlock(x, y, z, Block.Stone);
    for (let x = 6; x <= 8; x++)
      for (let z = 6; z <= 9; z++) for (let y = 7; y <= 8; y++) w.setBlock(x, y, z, Block.Stone); // 2-tall 3x4 platform on the ground
    for (let x = 16; x < 32; x++) // ocean side: seafloor to y2, sea y3..7
      for (let z = 0; z < 16; z++) {
        for (let y = 0; y <= 2; y++) w.setBlock(x, y, z, Block.Stone);
        for (let y = 3; y <= 7; y++) w.setBlock(x, y, z, Block.Water);
      }
    const sim = new WaterSim(w);
    sim.settle(1, 0, 0); // re-seed the sea as static (non-pushing) sources
    const seaBefore = countWaterAt(w, 16, 31, 0, 15, 3, 15);
    w.setBlock(12, 7, 7, Block.Water); // the player's source, at ground level (sea surface level), open ground
    sim.edit(12, 7, 7, Block.Water);
    drain(sim);
    const pool = countWaterAt(w, 0, 15, 0, 15, 7, 15);
    console.log('SHORE pool=', pool, 'sea=', countWaterAt(w, 16, 31, 0, 15, 3, 15));
    expect(pool).toBeGreaterThan(0); // it fanned out over the ground ...
    expect(w.getBlock(15, 7, 7)).toBe(Block.Water); // ... right up to the seam, 6-adjacent to the sea
    expect(sim.cellState(16, 7, 7).s).toBe(1); // the pool is 6-connected to the sea body (re-seeded static sources)
    expect(countWaterAt(w, 16, 31, 0, 15, 3, 15)).toBe(seaBefore); // the sea is untouched by the player's placement

    // The player breaks their spring. No live feed remains in the player's body: the level
    // wave resets the fan toward full level as it passes (the reset front pushes a little
    // extra into air briefly), and then every cell's probe finds no feed within 6 hops —
    // the sea is a STATIC source (it never feeds flow: its water stands, falls and pours,
    // and it can only be reached THROUGH other water, which here is all dying) — so the
    // whole pool dries away. In the reported bug the sea's source bits kept the WHOLE pool
    // "reachable" forever: the pool sits there, sustained and still pushing, no matter what
    // the player breaks.
    w.setBlock(12, 7, 7, Block.Air);
    sim.edit(12, 7, 7, Block.Air);
    for (let i = 0; i < 40; i++) sim.tick(250);
    console.log('SHORE after-break pool=', countWaterAt(w, 0, 15, 0, 15, 7, 15), 'sea=', countWaterAt(w, 16, 31, 0, 15, 3, 15));
    expect(countWaterAt(w, 0, 15, 0, 15, 7, 15)).toBe(0); // the player's flow is gone ...
    expect(countWaterAt(w, 16, 31, 0, 15, 3, 15)).toBe(seaBefore); // ... and the sea is untouched (static: it never pushes, the player's placement could not raise it)
    for (let i = 0; i < 20; i++) sim.tick(250);
    expect(countWaterAt(w, 0, 15, 0, 15, 7, 15)).toBe(0); // stable: nothing re-floods it (the sea does not push across the seam)
    assertInvariants(w);
  });

  it('a cave under the ocean takes a stream + floor pool when the floor is breached, drains itself when the hole is plugged (flow only exists because of its source), and re-fills when it is broken again', () => {
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

    // plug the hole: the cave is now sealed off from the sea — from every live feed. The
    // level wave passes through (resetting the column cells to full level as it goes, so
    // the body briefly re-spreads), and then no cell can find a feed within 6 hops: the
    // cave empties itself, visibly, at the slow-clock pace.
    for (let x = 18; x <= 21; x++) for (let z = 13; z <= 14; z++) {
      w.setBlock(x, 8, z, Block.Stone);
      sim.edit(x, 8, z, Block.Stone);
    }
    let guard = 0;
    // run to a FULL fixpoint (not just "cave empty"): the plug's edit closure re-marks the
    // ocean water above the hole, and those no-op re-checks must finish before the
    // fixpoint sample below is meaningful.
    while (sim.tick(200) !== 0 && guard++ < 300) {
      /* drain */
    }
    console.log('CAVE after-plug=', caveWater());
    expect(caveWater()).toBe(0); // the plugged cave drained itself
    expect(w.getBlock(5, 10, 5)).toBe(Block.Water); // the ocean above is untouched
    expect(sim.tick(1)).toBe(0);
    assertInvariants(w);

    // break the plug: the ocean pours back in over the hole and the cave refills with flow.
    for (let x = 18; x <= 21; x++) for (let z = 13; z <= 14; z++) {
      w.setBlock(x, 8, z, Block.Air);
      sim.edit(x, 8, z, Block.Air);
    }
    drain(sim);
    console.log('CAVE after-unplug=', caveWater());
    expect(caveWater()).toBe(80); // the stream and floor pool come back exactly as before
    expect(sim.tick(1)).toBe(0);
    assertInvariants(w);
  });

  it('a source placed inside a hollow never falls: it stays a static source, its side halos drip four streams down the hollow walls that pool on the floor; mined out, everything it fed dries away', () => {
    const w = makeWorld([[0, 0, 0]]); // chunk spans y=0..15
    for (let y = 0; y <= 15; y++) for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) w.setBlock(x, y, z, Block.Stone); // solid rock ...
    for (let x = 7; x <= 9; x++) for (let z = 7; z <= 9; z++) for (let y = 1; y <= 4; y++) w.setBlock(x, y, z, Block.Air); // ... with a 3x3 hollow (a cave pocket)
    const sim = new WaterSim(w);
    w.setBlock(8, 4, 8, Block.Water); // place a source in the rock, inside the hollow
    sim.edit(8, 4, 8, Block.Water);
    for (let i = 0; i < 50; i++) sim.tick(250); // 50 slow-clock pulses

    expect(sim.cellState(8, 4, 8)).toEqual({ b: Block.Water, l: 7, s: 1, p: 1, st: 0 }); // a placed source never falls — static, still a source in the wall
    expect(sim.cellState(8, 3, 8).b).toBe(Block.Air); // it pours no column through itself: the space directly below stays dry
    expect(w.getBlock(7, 3, 8)).toBe(Block.Water); // its side halos drip streams down the hollow walls ...
    expect(sim.cellState(7, 1, 8).st).toBe(0); // ... landing as sheets on the hollow floor ...
    expect(sim.cellState(8, 1, 8).b).toBe(Block.Water); // ... which pool / fan out on the floor (clamped by the walls)
    const c1 = countWater(w);
    expect(c1).toBe(22); // 1 source + 4 head-level side halos + 4 side columns (stream cells y=3,2 + floor sheet) + their merged floor fans
    for (let i = 0; i < 20; i++) sim.tick(250); // it keeps dripping, but the state is stable at rest
    expect(countWater(w)).toBe(c1); // no churn, no climbing
    assertInvariants(w);

    // mine the source out of the rock: no live feed remains in the hollow, so everything it
    // fed dries away on the slow clock. Nothing left acts like a source.
    w.setBlock(8, 4, 8, Block.Air);
    sim.edit(8, 4, 8, Block.Air);
    let guard = 0;
    while (countWater(w) > 0 && guard++ < 300) sim.tick(200);
    expect(countWater(w)).toBe(0);
    for (let i = 0; i < 20; i++) sim.tick(250);
    expect(countWater(w)).toBe(0); // stable: nothing re-erupts
    assertInvariants(w);
  });

  it('a source on a pedestal runs its waterfall off the sides in one pass (downward spread is unlimited until stopped by ground): the halo drips appear instantly as full columns, pool floor sheets, and fan out — nothing climbs, nothing pours through the source itself, and the result is a quiet fixpoint', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15); // open floor at y=0
    w.setBlock(8, 10, 8, Block.Stone); // a pedestal
    const sim = new WaterSim(w);
    w.setBlock(8, 11, 8, Block.Water); // a source on top of the pedestal
    sim.edit(8, 11, 8, Block.Water);
    for (let i = 0; i < 3; i++) sim.tick(250);
    expect(w.getBlock(7, 10, 8), 'no drip fill-in: the side columns are written in one pass').toBe(Block.Water);
    expect(w.getBlock(7, 1, 8), '...top of the shaft included, within pulses').toBe(Block.Water);
    for (let i = 0; i < 100; i++) sim.tick(250); // settle to the side-stream steady state

    expect(sim.cellState(8, 11, 8)).toEqual({ b: Block.Water, l: 7, s: 1, p: 1, st: 0 }); // the source stays put — static; it never falls out of the water
    expect(w.getBlock(8, 9, 8), 'the source pours no column through itself').toBe(Block.Air);
    expect(sim.cellState(7, 11, 8).b).toBe(Block.Water); // its side halo sits on top of the column
    expect(sim.cellState(7, 9, 8).st).toBe(1); // the side column is a visible falling column (riders: never spreads)
    expect(sim.cellState(7, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 0, p: 0, st: 0 }); // the floor pool is a sheet on solid ground (rests: it spreads while the flow above it lives)
    expect(sim.cellState(15, 1, 8).b).toBe(Block.Water); // the merged floor fan reaches the chunk edge ...
    expect(sim.cellState(16, 1, 8).b).toBe(Block.Air); // ...but stops there (missing neighbour writes nothing)
    expect(sim.cellState(7, 12, 8).b, 'nothing is written above the source level').toBe(Block.Air);
    // source + 4 halo riders + 4 side columns x 10 cells (y=10..2 shaft + y=1 sheet) + their merged floor fans
    expect(countWater(w)).toBe(154);
    const c = countWater(w);
    for (let i = 0; i < 20; i++) sim.tick(250); // steady: the source keeps re-checking its halo, writes nothing
    expect(countWater(w)).toBe(c); // no churn, no flicker: a true fixpoint
    assertInvariants(w);
  });

it('a source pouring at the world edge stays stable: its side drip columns rest on the void at the floor of the world (no per-pulse blink) and fan out a bounded sheet there; the source endures', () => {
    const w = makeWorld([[0, 0, 0]]); // chunk spans y=0..15; nothing below
    const sim = new WaterSim(w);
    w.setBlock(8, 8, 8, Block.Water);
    sim.edit(8, 8, 8, Block.Water);
    for (let i = 0; i < 30; i++) sim.tick(250);
    expect(sim.cellState(8, 8, 8)).toEqual({ b: Block.Water, l: 7, s: 1, p: 1, st: 0 }); // a placed source never falls or dries
    expect(countWater(w)).toBe(146); // 4 side-halo columns down to the world floor (they rest on the void, no drain out of the world) + their landing sheets + the merged floor fans + the source and its halo
    const c = countWater(w);
    for (let i = 0; i < 30; i++) sim.tick(250);
    expect(countWater(w)).toBe(c); // steady: the sheets rest on the void and write nothing
    assertInvariants(w);
  });

it('a sealed 3x3 source body is a fixpoint of the slow clock (immortal); breaking the centre HEALS it — the source ring regenerates the missing cell as a source (the infinite-source rule), so a placed-water body stays a body', () => {
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
      expect(sim.cellState(x, 1, z)).toEqual({ b: Block.Water, l: 7, s: 1, p: 1, st: 0 });
    expect(countWater(w)).toBe(9);
    const c = countWater(w);
    for (let i = 0; i < 20; i++) sim.tick(250); // fixpoint: settled body never cascades (the source ring re-checks every pulse, writes nothing)
    expect(countWater(w)).toBe(c);

    // break the centre: the source ring heals it as a SOURCE (S . S in both directions),
    // not as flow — the body stays a body
    w.setBlock(7, 1, 7, Block.Air);
    sim.edit(7, 1, 7, Block.Air);
    drain(sim);
    expect(sim.cellState(7, 1, 7)).toEqual({ b: Block.Water, l: 7, s: 1, p: 1, st: 0 }); // regenerated source
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
    expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Water, l: 7, s: 1, p: 1, st: 0 });
    w.setBlock(4, 4, 4, Block.Stone);
    sim.edit(4, 4, 4, Block.Stone);
    expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Stone, l: 0, s: 0, p: 0, st: 0 });
});

  it('a placed source alone in the sky never falls or dries: it stays a static block with its drip running off each exposed side, and its side columns rest on the void at the world floor (stable, no per-pulse blink)', () => {
    const w = makeWorld([[0, 0, 0]]);
    const sim = new WaterSim(w);
    w.setBlock(4, 4, 4, Block.Water);
    sim.edit(4, 4, 4, Block.Water);
    for (let i = 0; i < 30; i++) sim.tick(250); // a dozen or so slow-clock pulses
    expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Water, l: 7, s: 1, p: 1, st: 0 }); // the source hovers: it is a static block, not a falling block
    expect(sim.cellState(4, 3, 4).b).toBe(Block.Air); // and it pours no column through itself
    expect(countWater(w)).toBe(112); // source + its halo + the 4 side-drip columns down to the world floor + their landing sheets and fans (all of it stable: nothing drains out of the world)
    const c = countWater(w);
    for (let i = 0; i < 30; i++) sim.tick(250);
    expect(countWater(w)).toBe(c); // steady: no per-pulse blink at the world edge
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
    expect(sim.cellState(16, 8, 8)).toEqual({ b: Block.Water, l: 0, s: 0, p: 0, st: 0 }); // the neighbour's pristine sea water is never touched
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
