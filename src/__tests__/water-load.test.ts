import { it, expect } from 'vitest';
import { World, localIndex } from '../world';
import { Block } from '../blocks';
import { WaterSim } from '../water';
import { TerrainGen, generateChunkTerrain, TERRAIN_SEED } from '../terrain';
import { update } from '../streaming';
import { meshChunk } from '../chunk-mesher';

// Load-path budget: replays main.ts exactly — boot column (0,·,2), then 60 frames of
// streaming.update around the spawn (pcx=0, pcy=2, pcz=2) with the frame loop's work:
// settle + remesh per rebuilt chunk, slow-clock tick() every 5th frame, frame-end
// touched drain. Lineage of the process() count on this replay:
//   old code (per-cell seeding, unguarded spread): 2,463,202 — every world-edge settle
//     looped: a spread write into missing/out-of-band space is a state no-op, but
//     writeCell still re-marks the target's closure (self + HXZ + above), which contains
//     the source cell, so the source re-enqueued forever and each ocean settle ran to
//     the SETTLE_GUARD ceiling; secondarily, unguarded spread re-leveled loaded-unsettled
//     neighbours' pristine worldgen water into decaying slabs that each neighbour's own
//     settle then discarded (rework, and the seam-level bug of the load).
//   two-pass settle only (pass-1 seed + pass-2 reseed, spread still unguarded):
//     2,463,202 — invariant: the edge loop still capped every ocean settle.
//   two-pass settle + the two spread guards (intermediate): 358,734 — the edge self-loop is
//     gone, but streaming still loaded high y-bands before their low bands: a settle above
//     a not-yet-generated band read the void as dry Air and "fell" the column's top water
//     out of the world (destroyed through a hole that does not exist). The ocean top row
//     was then gone forever and refilled only unevenly by neighbour spreads — the visible
//     raised/stepped ocean sections (histogram: 2959 columns at one level, 469 one higher).
//   + band-order fix (this fix): settle() defers a chunk whose low band is in-band but not
//     yet loaded (and cascades upward once a low band settles), and process() refuses to
//     fall into not-yet-generated space (world floor excepted). Final: every ocean column
//     converges to exactly one surface height (the flatness probe below measures 0 columns
//     off-mode) and the whole replay relaxes in ~3k cell updates — 3,032 here, settle
//     wall ~25 ms of the ~500 ms total (the rest is terrain+mesh, a POC streaming cost):
//     // The pin is the original pre-fix budget floor (2,463,202 / 2 = 1,231,601): it separates
// the fixed pipeline (3,032 final; 358,734 post-T2) from the old code and the two-pass-only intermediate.
// process() is counted via a runtime prototype patch (TS `private` is
// compile-time only), so the pin is implementation-agnostic. Wall time is logged for
// the record, never asserted (it is machine-dependent); mesh cost is included (it is
// unchanged by the fix) and the replay ends on a full 5x5x5 ring: 125 chunks, like
// main.ts at rest.
const PIN = 1231601; // old code: 2,463,202 (SETTLE_GUARD-saturated edge loop); two-pass-only: 2,463,202; guarded fix measured 358,734

it('boot + 60 streaming frames stay within the load-path work budget', () => {
  const w = new World();
  const gen = new TerrainGen(TERRAIN_SEED);
  for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(w, gen, 0, cy, 2); // main.ts:171

  let processes = 0;
  const proto = WaterSim.prototype as unknown as {
    process: (this: WaterSim, wx: number, wy: number, wz: number) => void;
  };
  const origProcess = proto.process;
  proto.process = function (wx: number, wy: number, wz: number) {
    processes++;
    return origProcess.call(this, wx, wy, wz);
  };
  const sim = new WaterSim(w);

  let settleMs = 0, meshMs = 0;
  const tStart = performance.now();
  let frameNo = 0;
  for (let f = 0; f < 60; f++) {
    frameNo++;
    const r = update(w, 0, 2, 2); // main.ts:528
    for (const c of r.rebuilt) {
      const t0 = performance.now();
      sim.settle(c.cx, c.cy, c.cz); // main.ts:531
      settleMs += performance.now() - t0;
      const t1 = performance.now();
      meshChunk(w, c.cx, c.cy, c.cz); // main.ts:532 (scene side stubbed: pure buffers)
      meshMs += performance.now() - t1;
      const ch = w.getChunk(c.cx, c.cy, c.cz);
      if (ch) ch.dirty = false; // main.ts:225
    }
    if (frameNo % 5 === 0) sim.tick(200); // main.ts:585
    const touched = sim.touched; // main.ts:586-593
    if (touched.size) {
      const t0 = performance.now();
      for (const key of touched) {
        const [cx, cy, cz] = key.split(',').map(Number);
        if (w.hasChunk(cx, cy, cz)) {
          meshChunk(w, cx, cy, cz);
          const ch = w.getChunk(cx, cy, cz);
          if (ch) ch.dirty = false;
        }
      }
      meshMs += performance.now() - t0;
      touched.clear();
    }
  }
  const wall = performance.now() - tStart;
  proto.process = origProcess; // stop counting before the residual-drain probe below

  console.log('LOAD wall=', wall.toFixed(0), 'ms');
  console.log('LOAD settle=', settleMs.toFixed(0), 'ms');
  console.log('LOAD mesh=', meshMs.toFixed(0), 'ms');
  console.log('LOAD processes=', processes, '(old code: 2463202; two-pass-only: 2463202; PIN', PIN + ')');
  console.log('LOAD chunks=', w.count());

  expect(w.count()).toBe(125); // the replay really walked to the full 5x5x5 ring
  expect(processes).toBeLessThan(PIN);
  expect(sim.tick(1)).toBe(0); // residual relaxation from any guard-saturated early settle completed within the replay window (queue fully drained)

  // Ocean-surface flatness probe (measurement only, no assert): after the queue has fully
  // drained, a hydrostatically correct ocean shows, per water column, water contiguous
  // down to its floor, all surfaces at one height. These two histograms are the
  // objective signature of the user-visible "raised sections" complaint:
  //  - a column with AIR below its water top = relaxation never completed (guard
  //    saturation left it mid-fall, or it is sealed — a permanent raised section);
  //  - surface heights far from the mode = columns the settle never brought to level.
  let airborne = 0;
  const tops = new Map<number, number>();
  for (const c of w.allChunks()) {
    for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) {
      let top = -1, below = 0;
      for (let ly = 0; ly < 16; ly++) {
        const b = c.blocks[localIndex(lx, ly, lz)];
        if (b !== Block.Water) continue;
        if (ly > top) { top = ly; } else { below++; }
      }
      if (top < 0) continue;
      const gx = c.cx * 16 + lx, gz = c.cz * 16 + lz;
      if (top === 15 && w.getBlock(gx, c.cy * 16 + 16, gz) === Block.Water) continue; // continues into the chunk above: not a surface
      if (below > 0) airborne++;
      tops.set(c.cy * 16 + top, (tops.get(c.cy * 16 + top) ?? 0) + 1);
    }
  }
  const sorted = [...tops.entries()].sort((a, b) => b[1] - a[1]);
  const modeY = sorted[0]?.[0] ?? -1;
  const offMode = [...tops.entries()].filter(([y]) => y !== modeY).reduce((n, [, c]) => n + c, 0);
  console.log('LOAD waterColumns=', [...tops.values()].reduce((a, b) => a + b, 0), 'airBeneathWater=', airborne, 'surfacesOffMode(', modeY, ')=', offMode, 'hist=', JSON.stringify(sorted));
}, 30000);
