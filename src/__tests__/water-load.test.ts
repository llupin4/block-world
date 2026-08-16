import { it, expect } from 'vitest';
import { World } from '../world';
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
//   two-pass settle + the two spread guards (this fix): 358,734 — the edge self-loop is
//     gone (no writeCell into missing space, no pristine-water re-leveling) and early
//     settles near spawn now do their own water's work instead of burning the guard.
//     The very largest early settles still exhaust per-settle work (SETTLE_GUARD) and hand
//     their residual relaxation to later settles / the tick/5 slow clock; the queue is
//     fully drained within the first ~15 frames of the replay (asserted below), so total
//     work is what the pin bounds.
//   equalize (T3): adds pocket/body probe work that is INVISIBLE to the process count
//     (equalize never calls process()). Unguarded, it re-walked the full 8192-cell pocket
//     budget for EVERY seed in an over-budget region (2.8M pocketBlock lookups in this
//     replay, zero fills, doubling the settle wall to ~1.7 s); the per-call probe budget
//     (EQUALIZE_PROBE_BUDGET) plus overflow-prefix claiming bounds it — settle wall comes
//     back to ~1 s and the deterministic `stats.probes` count below pins the work the
//     process-count pin cannot see.
// The pin is the original pre-fix budget floor (2,463,202 / 2 = 1,231,601): it separates
// the fix (358,734) from both the old code and the two-pass-only intermediate.
// process() is counted via a runtime prototype patch (TS `private` is
// compile-time only), so the pin is implementation-agnostic. Wall time is logged for
// the record, never asserted (it is machine-dependent); mesh cost is included (it is
// unchanged by the fix) and the replay ends on a full 5x5x5 ring: 125 chunks, like
// main.ts at rest.
const PIN = 1231601; // old code: 2,463,202 (SETTLE_GUARD-saturated edge loop); two-pass-only: 2,463,202; guarded fix measured 358,734
const PROBE_PIN = 1000000; // T3 equalize probes, unguarded: 2,804,261 (redundant per-seed re-walks of over-budget pockets, zero fills); guarded fix measured 605,070; pin leaves headroom above that and is far below the unguarded value

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
  console.log('LOAD probes=', sim.stats.probes, '(T3 equalize neighbour probes — invisible to `processes`; unguarded T3 measured 2804261 on this replay; PROBE_PIN', PROBE_PIN + ')');
  console.log('LOAD chunks=', w.count());

  expect(w.count()).toBe(125); // the replay really walked to the full 5x5x5 ring
  expect(processes).toBeLessThan(PIN);
  expect(sim.stats.probes).toBeLessThan(PROBE_PIN); // the equalize probe-work budget (call counts are machine-independent)
  expect(sim.tick(1)).toBe(0); // residual relaxation from any guard-saturated early settle completed within the replay window (queue fully drained)
}, 30000);
