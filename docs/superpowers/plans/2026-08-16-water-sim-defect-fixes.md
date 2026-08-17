# Water Sim Defect Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four water-sim defects reported from live `npm run dev` testing: (1) multi-second load stalls, (2) ocean spawning with multiple visible water levels, (3) ocean corners/edges left dry, (4) punching into an under-ocean cave fills the floor but never raises a water column back up (no connected-vessels behavior).

**Architecture:** All three code fixes live in `src/water.ts`. (T1) `settle()` stops clearing `sim.touched` — the frame-end drain in `main.ts` becomes the sole consumer, so a seam chunk whose pre-flood mesh went stale is always re-meshed. (T2) `settle()` seeds worldgen water in bulk (plain array writes) and enqueues only cells that trigger a fall or a spread, so interior ocean does zero work; work counters are exposed as `sim.stats` and pinned by a 60-frame boot-replay benchmark. (T3) a new `equalize()` detects air pockets connected to a large water body (sea/lake) during settle and on player breaks, and bulk-fills them to the body's surface level — instant connected-vessels behavior. `main.ts` gets a comment fix only; no runtime logic changes.

**Tech Stack:** TypeScript, vitest (node — the sim is pure TS, no three in tests), three.js (runtime-only, untouched).

---

## Context for the implementer

**The repo** is a voxel sandbox POC (`main.ts` boots a streamed 5×5 chunk ring around a spawn in the sea). The water sim (`src/water.ts`) is a cellular automaton: water cells hold `wlevel` (0 dry … 7 full source, `Uint8Array` per chunk) and `wsource` (0/1). `block == Water <=> wlevel >= 1 || wsource == 1` is a strict invariant (checked by `assertInvariants` in tests). Block ids: `Air=0, Stone=1, Water=5` (`src/blocks.ts`). Y-band: `WORLD_Y_MIN=-32, WORLD_Y_MAX=64` (`src/world.ts`); missing chunks read as dry Air everywhere.

**Measured root causes (phase-1 evidence, verified against the current code on this branch):**

| # | Defect | Root cause |
|---|--------|-----------|
| 1 | 6+ s load stall | A 60-frame / 125-chunk replay of the boot path costs **6677 ms wall; settle = 6121 ms (87%), 2,463,202 `process()` calls**. Phase-2 diagnosis (empirically confirmed with per-cell reprocess counts) found the *dominant* cause: a **world-edge self-re-enqueue loop** — at a missing/out-of-band HXZ neighbour a spread `writeCell` is a state no-op, but it still re-marks the target's closure (self + HXZ + above), which contains the source cell, so every processed water cell at the world edge re-enqueued itself and **every ocean settle ran to the `SETTLE_GUARD` ceiling** (123 of 125 replay settles hit it). Secondary: unguarded spread re-leveled loaded-unsettled neighbours' *pristine* worldgen water into decaying 6-slab gradients that each neighbour's own settle then discarded (pure rework + the seam-level defect). The per-cell `writeCell` seeding cost is a real but minor contributor. |
| 2 | multiple ocean levels on spawn | `settle()` calls `this.touched.clear()` (`water.ts:151`). A settle of chunk A that re-levels/floods across a seam marks *sibling* chunk B in `touched`, but the *next* settle of chunk C in the same frame wipes the mark — B keeps its stale pre-flood mesh (level steps visible on the surface). Verified: 3-chunk slab, `settle(0)` → `touched={'1,0,0'}` (cave flooded, mesh stale); `settle(2)` → `touched={}`. `main.ts:531`'s comment ("settled flag makes re-settle a no-op") only protects the *same* chunk. |
| 3 | dry ocean corners/edges | Same root cause as #2, worst at the 5×5 view corners: seam chunks whose water state changed during a neighboring chunk's settle are never re-meshed. |
| 4 | no water column rises into a punched cave | `process()` only falls down, re-promotes, and spreads HXZ at level-1. There is **no upward fill and no equalization**, so a tall cave under the ocean receives only a one-cell-per-tick trickle that stalls at the pool floor (verified: 2000+ ticks, shaft 1/13 filled). |

**Pins that must stay green** (recorded console values / asserted constants in the current suite — check them after each task; the fixes are designed not to shift any of them; if one shifts, investigate before re-pinning):

| test (`src/__tests__/water.test.ts` unless noted) | pin |
|---|---|
| lone source diamond (`A`) | `countWater == 85` |
| fall onto solid | `countWater == 1` |
| stream falls out of world | `countWater == 0` |
| sealed 3×3 pool | fixpoint `tick(1)==0`, `countWater == 9`, broken centre refills to `9` |
| seam spread / missing neighbour | specific `cellState` values as asserted |
| generated sea preserved (`I`) | `before == 322`, `after == 322` |
| settled-chunk-never-eats-neighbour (`P`) | after `settle(0)`: `b1 == 7632` (exactly the six seam-reachable cave columns; far columns x=22,23 dry), `(17,3,13) == Water`, `(23,3,13) == Air`; after settling all: `b2 == 7680`, `(23,3,13) == Water`, `assertInvariants` |
| order independence (`PO`) | `w1 == w2 == 7680` |
| terrain caves carve air (`H`) | `carved == 1284` |
| terrain suite (`terrain.test.ts`) | `24936` |

New pins introduced by this plan: `stats.seeds == 3840` (T2), replay `processes < 1231601` with `count() == 125` (T2), `countWater == 7169` (T3, both tests).

**Commands** (run from repo root): `npx vitest run` (full suite), `npx vitest run src/__tests__/water.test.ts` (one file), `npx tsc --noEmit` (typecheck), `npm run build` (vite). There is **no browser in this environment** — visual verification is a manual `npm run dev` checklist the user runs (Task 4).

**Re-pin idiom** (established in this repo): tests print the measured value and assert the pinned one; if a legitimately-changed value shifts a pin, update the constant, note the old→new pair in the test, and commit.

---

## File structure

| File | Change | Responsibility touched |
|---|---|---|
| `src/water.ts` | Modify (all three tasks) | T1: drop `touched.clear()` in `settle()`. T2: `stats` counters, `enqueue`, two-pass `settleSeed`, counters in `process`/`settle`. T3: `NB6` + equalize constants, `pocketBlock`, `equalize`, `equalizeAfterSettle`, settle/edit wiring. |
| `src/main.ts` | Modify (T1, comment only) | Correct the `:531` comment: `touched` accumulates for the whole frame; the frame-end drain is the sole consumer. |
| `src/__tests__/water.test.ts` | Modify (T1, T2, T3) | New regression tests + `chunkKey` import; existing tests untouched. |
| `src/__tests__/water-load.test.ts` | **Create** (T2) | Deterministic 60-frame boot replay benchmark; pins the load-path work budget. |
| `PROJECT.md` | Modify (T4) | §9 Water: equalization rule, settle/touched contract, perf notes, deferred items. |

`src/world.ts`, `src/streaming.ts`, `src/terrain.ts`, `src/chunk-mesher.ts` are read-only context: `setBlock` marks the chunk **and its six face-neighbor chunks** dirty (that is already how fill re-meshes propagate); `streaming.update(world, pcx, pcz, pcy)` loads/remeshes ≤2 per frame; the mesher reads `blocks` only (water = full transparent block; levels never affect geometry — which is exactly why stale water *state* surfaces as stale *meshes*, hence T1).

---

### Task 1: Touched marks survive sibling settles (defects #2 and #3)

**Files:**
- Modify: `src/water.ts:143-151` (settle doc comment + the `touched.clear()` line)
- Modify: `src/main.ts:531` (comment only)
- Test: `src/__tests__/water.test.ts` (import + one new test)

- [ ] **Step 1: Write the failing test**

In `src/__tests__/water.test.ts`, change the world import on line 3 to also pull `chunkKey`:

```ts
import { World, chunkOf, chunkKey } from '../world';
```

Then append this test inside `describe('water sim', …)` (after the `PO` order-independence test, before the `H` terrain test):

```ts
it('a settled chunk\'s touched mark survives later sibling settles, so the frame-end drain still re-meshes it (stale seam-mesh fix)', () => {
  const w = makeWorld([[0, 0, 0], [1, 0, 0], [2, 0, 0]]); // 3 chunks wide: x=0..47, z=0..15
  for (let x = 0; x < 48; x++) for (let z = 0; z < 16; z++) {
    for (let y = 0; y <= 3; y++) w.setBlock(x, y, z, Block.Stone); // seafloor
    for (let y = 4; y <= 7; y++) w.setBlock(x, y, z, Block.Water); // shallow ocean
  }
  for (let x = 18; x <= 23; x++) for (let z = 0; z <= 5; z++) for (let y = 1; y <= 3; y++) {
    w.setBlock(x, y, z, Block.Air); // sea-facing cave inside chunk 1
  }
  const sim = new WaterSim(w);
  sim.settle(0, 0, 0); // settling chunk 0 re-levels chunk 1's pristine seam water, which falls into the cave
  expect(w.getBlock(19, 2, 2)).toBe(Block.Water); // the cave IS flooded by settle(0) ...
  expect(sim.touched.has(chunkKey(1, 0, 0))).toBe(true); // ... so chunk 1's mesh is now stale and marked
  sim.settle(2, 0, 0); // ... and a second settling chunk in the same frame must not wash that mark away
  expect(sim.touched.has(chunkKey(1, 0, 0))).toBe(true); // the frame-end drain (main.ts) is the sole consumer of `touched`
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/water.test.ts`
Expected: FAIL — the last expectation. `touched` is `[]` after `settle(2,0,0)` because `settle()` clears it; the seam chunk keeps its stale pre-flood mesh. (The preceding assertions pass: the cave does flood.)

- [ ] **Step 3: Remove the wipe**

In `src/water.ts`, replace the settle doc comment and opening (currently lines 143-152):

```ts
  // On-load settle: writeCell-seed every worldgen Water cell as a level-7 source — the
  // seed write is what queues the cell (+ neighbours + above); a plain array pre-mark
  // here would satisfy writeCell's exact-state early-return and queue nothing, leaving
  // the relaxation a no-op (caves would never flood on load). Then relax to a fixpoint
  // (guarded). Idempotent via the settled flag.
  settle(cx: number, cy: number, cz: number): Set<string> {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c || c.settled) return this.touched;
    this.touched.clear();
    this.settling = c; // during this settle, only c's own water may be modified (see the pristine-skip in process)
```

with:

```ts
  // On-load settle: seed every worldgen Water cell as a level-7 source (a plain array
  // pre-mark would satisfy writeCell's exact-state early-return and queue nothing,
  // leaving the relaxation a no-op — caves would never flood on load), then relax to
  // a fixpoint (guarded). Idempotent via the settled flag.
  // NOTE: does NOT clear `touched` — marks accumulate for the whole frame and the
  // frame-end drain (main.ts) is the sole consumer. Clearing here would drop marks
  // made by an EARLIER settle of the same frame: a seam chunk flooded across from it
  // keeps a stale pre-flood mesh (visible level steps / dry corners at chunk edges).
  settle(cx: number, cy: number, cz: number): Set<string> {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c || c.settled) return this.touched;
    this.settling = c; // during this settle, only c's own water may be modified (see the pristine-skip in process)
```

(only the comment changes plus deleting the `this.touched.clear();` line — the rest of `settle` stays as-is in this task).

In `src/main.ts`, replace the comment on line 531:

```ts
    sim.settle(c.cx, c.cy, c.cz); // POC form of worldgen-fluid settling: settle BEFORE meshing so the new chunk's mesh already shows flooded caves. The settled flag makes re-settling a re-meshed chunk a no-op. Cross-seam chunks the sim touched are re-meshed at end of frame (drain below).
```

with:

```ts
    sim.settle(c.cx, c.cy, c.cz); // POC form of worldgen-fluid settling: settle BEFORE meshing so the new chunk's mesh already shows flooded caves. The settled flag makes re-settling a re-meshed chunk a no-op. settle() never clears sim.touched: cross-seam marks from any settle this frame survive here and to the end-of-frame drain below, which re-meshes them.
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/water.test.ts`
Expected: PASS (all tests in the file, the new one included).

- [ ] **Step 5: Run the full suite (pin check)**

Run: `npx vitest run`
Expected: PASS, 9 files. Grep the console output for `A count= 85`, `I before= 322 after= 322`, `PO w1= 7680 w2= 7680`, `H carved= 1284`; all unchanged from the pin table.

- [ ] **Step 6: Commit**

```bash
git add src/water.ts src/main.ts src/__tests__/water.test.ts
git commit -m "fix: keep water-sim touched marks across sibling settles (stale seam mesh)"
```

---

### Task 2: Cheap settle — bulk seed, enqueue triggers only (defect #1)

**Files:**
- Modify: `src/water.ts` (`stats` field, `process` counter, `enqueue`, `settleSeed`, `settle` seed-stage swap)
- Modify: `src/__tests__/water.test.ts` (one new test)
- Create: `src/__tests__/water-load.test.ts` (60-frame boot-replay benchmark)

Design (why this is correct): `pass 1` bulk-writes worldgen water to `(level 7, source)` directly in the chunk arrays — no state reads, no queue. `pass 2` enqueues a seeded cell only if its rule would act on its neighbours at seed time: a fall (below is Air) or a spread (an HXZ neighbour is Air, or unseeded water below level 6 that a level-7 source would upgrade). Interior ocean triggers neither and is never processed — that bulk-skip is the fix. Any cell the relaxation later touches still goes through `writeCell`, which re-marks self + 4 HXZ + above (a below cell is never re-marked from above — a resting level is a function of HXZ + above, and a changed below re-triggers via this rule), so the worklist stays closed and converges to the same fixpoint. Re-seeding a cell whose state changed across a seam (level up 0→7) writes no re-marks, but that is safe: the cell's triggered dependents are enqueued by pass 2, and later re-evaluations are pure functions of current neighbour state, so the initial s-bit is never load-bearing.

Measured baseline (old code, 60-frame replay, node): **2,463,202** `process()` calls, settle wall **6121 ms** of **6677 ms** total, 125 chunks.

- [ ] **Step 1: Write the failing test**

Append to `src/__tests__/water.test.ts` inside the describe block:

```ts
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
```

(The performance effect itself is pinned by the replay benchmark in Step 5 — the old code has no `stats` at all, so this test fails with a runtime error on `sim.stats`, which is the red.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/water.test.ts`
Expected: FAIL — `TypeError: Cannot read properties of undefined (reading 'seeds')` (old implementation has no `stats`).

- [ ] **Step 3: Implement `stats`, `enqueue`, `settleSeed` in `src/water.ts`**

Add the counters field after the `touched` field (line 19):

```ts
  // Work counters, pinned by src/__tests__/water-load.test.ts (the load-path budget
  // regression). `queueAdds` counts re-mark *events* (one per enqueue() call; each
  // re-marks self + 4 horizontal + above, the same closure writeCell re-marks).
  readonly stats = { seeds: 0, processes: 0, queueAdds: 0, equalizeFills: 0 };
```

Add a counter as the first line of `process()` (line 70):

```ts
  private process(wx: number, wy: number, wz: number): void {
    this.stats.processes++;
    const C = this.cellState(wx, wy, wz);
```

Add two methods after `writeCell` (after line 67) and before `process`:

```ts
  // Re-mark exactly the cells writeCell re-marks (self + 4 horizontal + above), without
  // writing state: pass-2 settle seeding and equalize fills use this to pull dependent
  // cells back into the queue. A below cell is never re-marked from above (same rule as
  // writeCell: a resting level is a function of HXZ + above; a changed below re-triggers).
  private enqueue(wx: number, wy: number, wz: number): void {
    this.queue.add(`${wx},${wy},${wz}`);
    this.stats.queueAdds++;
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
  }

  // Two-pass seed (the load-path fix): pass 1 bulk-writes every worldgen Water cell of the
  // chunk to (level 7, source) straight into the chunk arrays — no per-cell state read, no
  // queue write, no re-mark. Pass 2 enqueues ONLY a seeded cell whose rule would act on its
  // neighbours at seed time: a fall (below is Air) or a spread (an HXZ neighbour that is
  // Air, or unseeded water below level 6 that a level-7 source would upgrade). Interior
  // ocean cells trigger neither and are never processed. Every later state change still
  // goes through writeCell (which re-marks dependents), so the worklist stays closed and
  // converges to the same fixpoint as per-cell seeding did.
  private settleSeed(c: Chunk): void {
    const bx = c.cx * 16, by = c.cy * 16, bz = c.cz * 16;
    for (let i = 0; i < c.blocks.length; i++) {
      if (c.blocks[i] !== Block.Water) continue;
      if (c.wlevel[i] === 7 && c.wsource[i] === 1) continue; // already a source
      c.wlevel[i] = 7;
      c.wsource[i] = 1;
      this.stats.seeds++;
    }
    for (let lx = 0; lx < 16; lx++)
      for (let ly = 0; ly < 16; ly++)
        for (let lz = 0; lz < 16; lz++) {
          if (c.blocks[localIndex(lx, ly, lz)] !== Block.Water) continue;
          const wx = bx + lx, wy = by + ly, wz = bz + lz;
          if (this.cellState(wx, wy - 1, wz).b === Block.Air) { this.enqueue(wx, wy, wz); continue; }
          for (const [dx, dz] of HXZ) {
            const m = this.cellState(wx + dx, wy, wz + dz);
            if (m.b === Block.Air || (m.b === Block.Water && m.s === 0 && m.l < 6)) { this.enqueue(wx, wy, wz); break; }
          }
        }
  }
```

Now replace the seed loop inside `settle()` (currently lines 153-158: `const bx = …; for (let lx … writeCell(bx+lx, …);`) with a single call:

```ts
    this.settleSeed(c);
```

so `settle` reads (after Tasks 1+2; this is the exact target state):

```ts
  settle(cx: number, cy: number, cz: number): Set<string> {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c || c.settled) return this.touched;
    this.settling = c; // during this settle, only c's own water may be modified (see the pristine-skip in process)
    this.settleSeed(c);
    let guard = 0;
    while (this.queue.size > 0 && guard < SETTLE_GUARD) {
      const it = this.queue.values().next();
      if (it.done) break;
      const key = it.value as string;
      this.queue.delete(key);
      const [wx, wy, wz] = key.split(',').map(Number);
      this.process(wx, wy, wz);
      guard++;
    }
    this.settling = null;
    c.settled = true;
    return this.touched;
  }
```

- [ ] **Step 4: Run the water tests to verify the new test passes**

Run: `npx vitest run src/__tests__/water.test.ts`
Expected: PASS, including the new `seeds == 3840` test and the Task-1 marker test.

- [ ] **Step 5: Create the load-path benchmark** `src/__tests__/water-load.test.ts`

```ts
import { it, expect } from 'vitest';
import { World } from '../world';
import { WaterSim } from '../water';
import { TerrainGen, generateChunkTerrain, TERRAIN_SEED } from '../terrain';
import { update } from '../streaming';
import { meshChunk } from '../chunk-mesher';

// Load-path budget: replays main.ts exactly — boot column (0,·,2), then 60 frames of
// streaming.update around the spawn (pcx=0, pcy=2, pcz=2) with the frame loop's work:
// settle + remesh per rebuilt chunk, slow-clock tick() every 5th frame, frame-end
// touched drain. The old implementation ran 2,463,202 process() calls and spent 6.1 s of
// the 6.7 s wall in settle(); the cheap two-pass settle must hold the same replay under
// PIN = floor(2463202 / 2) process() calls. process() is counted via a runtime prototype
// patch (TS `private` is compile-time only), so the pin is implementation-agnostic and
// still red-able against the old code. Wall time is logged for the record, never asserted
// (it is machine-dependent); mesh cost is included (it is unchanged by the fix) and the
// replay ends on a full 5x5x5 ring: 125 chunks, like main.ts at rest.
const PIN = 1231601; // floor of the old code's 2,463,202 measured process() calls

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

  console.log('LOAD wall=', wall.toFixed(0), 'ms');
  console.log('LOAD settle=', settleMs.toFixed(0), 'ms');
  console.log('LOAD mesh=', meshMs.toFixed(0), 'ms');
  console.log('LOAD processes=', processes, '(old code: 2463202; PIN', PIN + ')');
  console.log('LOAD chunks=', w.count());

  expect(w.count()).toBe(125); // the replay really walked to the full 5x5x5 ring
  expect(processes).toBeLessThan(PIN);
}, 30000);
```

- [ ] **Step 6: Run the benchmark**

Run: `npx vitest run src/__tests__/water-load.test.ts`
Expected: PASS. Observe the printed numbers vs the old baseline (wall 6677 ms / settle 6121 ms / 2,463,202 processes / 125 chunks). Record them; if `processes` legitimately lands above `PIN` (it should be at least 2× below), first check the implementation is exactly as specified, then re-pin `PIN` to the measured value and note old→new in the test's header comment.
Then run the full suite: `npx vitest run` — Expected: PASS, all pins from the table unchanged (A=85, I=322/322, PO=7680/7680, H=1284; P per the updated pin row).

**Controller addendum (post-implementation, supersedes Step 5/6 outcome):** the two-pass settle alone (commit `4a213c3`) left the replay at **2,463,202 processes — identical to the old code** — because the pass-2 boundary triggers still re-flooded pristine neighbour water and the unguarded spread into missing space kept the world-edge self-re-enqueue loop live (SETTLE_GUARD-saturated every ocean settle). Final T2 adds **two spread guards** to `process()` (`src/water.ts`, spread section): (1) the air branch calls `writeCell` into a HXZ neighbour **only if that chunk exists** (`this.world.hasChunk(...)`), breaking the edge self-loop; (2) the water branch only re-levels neighbours with `m.s === 0 && m.l >= 1` (water a prior spread/fall already wrote) — a pristine `(l=0, s=0)` worldgen neighbour is never re-leveled into a decaying slab. Measured on the 60-frame replay: **358,734 processes (6.9× fewer), 1130 ms wall (settle 715 ms / mesh 384 ms vs old 6677/6121 — 8.6× faster on settle), 125 chunks**. `PIN` restored to the original discriminative floor **1,231,601** (old 2,463,202 and two-pass-only 2,463,202 both fail it; the guarded fix passes with 3.4× headroom). The `P` test pins were re-derived from the new (correct) settle-0 behavior: settle(0) floods exactly the six seam-reachable cave columns (`b1 == 7632`, old `b1 >= b0` pin retired), far columns stay dry, own-chunk settle completes to `b2 == 7680`. All other pins (A/I/PO/H/terrain/seeds) unchanged. Code-quality review outcome (applied): the re-pinned P test's block-count pins are observably identical on the old code (re-leveling preserves block identity), so a **state-level pin** was added — after `settle(0)`, `cellState(16,8,8) == {Water, l:0, s:0}` (pristine; old code wrote a decaying-slab level there), which is the assertion that actually goes red if spread guard 2 regresses; the touched-marker test is annotated as a second guard-2 pin. The benchmark header no longer claims every ocean settle converges inline: 30 of 240 replay settles (the largest early ones) still hit `SETTLE_GUARD`, their residual relaxes via later settles / the tick/5 slow clock, and the test now asserts the queue is fully drained (`sim.tick(1) === 0`) — see the T3 saturated-settle caveat for the `equalizeAfterSettle` consequence.

- [ ] **Step 7: Typecheck + commit**

Run: `npx tsc --noEmit` → Expected: clean.

```bash
git add src/water.ts src/__tests__/water.test.ts src/__tests__/water-load.test.ts
git commit -m "perf: settle seeds worldgen water in bulk and enqueues only trigger cells"
```

---

### Task 3: Equalize sea-connected pockets (defect #4, connected vessels)

**Files:**
- Modify: `src/water.ts` (`NB6` + budget constants; `pocketBlock`, `equalize`, `equalizeAfterSettle` methods; one line in `settle`; one line in `edit`)
- Test: `src/__tests__/water.test.ts` (a world-builder helper + two new tests)

Design: a pocket is the 6-connected **air** region starting from seeds; the body is the 6-connected **water** region the pocket touches. The pocket BFS treats ungenerated space as *wall* (never traversed) so it can't burn its budget on the infinite void. The body probe is **up-first** (the up-neighbour is pushed last, popped first), so it reaches the water surface in as few hops as possible — for generated ocean the surface is flat at `SEA_LEVEL` (worldgen fills water from `h+1` up to `SEA_LEVEL`), and it is found within a handful of hops even when the probe is truncated by `BODY_BUDGET`. A pocket is filled when it fits in `EQUALIZE_BUDGET` cells, `bodyCount > SEA_BODY_MIN` (it connects to a sea/lake, not an isolated puddle), and a surface level `H` (a level-7 source cell with air above) was found; then every pocket cell with `y <= H` becomes a level-7 source via `setState` + `enqueue` (the filled column is at rest: sources on filled/stone, no air HXZ at or below H, and nothing rises — so no re-drain is needed). Seeds: at settle time, every *generated* air cell below/next-to the settling chunk's water (never above — the air above a water surface is the sky, always connected, never a new pocket, and would burn budget on every sea-chunk settle); on a player break, the broken cell itself. Small/over-budget/surface-unknown pockets are deliberately left to the CA trickle (bounded, unchanged).

**Saturated-settle caveat (T2 code-quality finding, carried into T3):** in the faithful 60-frame replay, 30 of 240 settles still exhaust `SETTLE_GUARD` (the largest early sea settles near spawn) and are marked `settled` on a *partially relaxed* state, with no re-settle/re-equalize ever. `equalizeAfterSettle` therefore probes pockets/bodies against partial state on those chunks and can misclassify (body ≤ `SEA_BODY_MIN`, surface `H` not yet established); the missed fill is backstopped by the CA trickle plus `equalize` re-running on later player breaks (`edit`), which is acceptable POC behavior — do not try to re-equalize settled chunks inside `settle()`. If the misclassification becomes visible (defect-4 relapse in the user's manual checklist), the sanctioned fix is enlarging `SETTLE_GUARD` (total process volume is invariant to the settle boundary, so the load pin holds).

Geometry used by both tests (chunks `(0,0,0)+(1,0,0)` = x 0..31, z 0..15, chunk band y 0..15): stone floor `y=0`; air cave band `y=1..12`; stone slab `y=13`; sea `y=14..15` (1024 cells > `SEA_BODY_MIN`, probe-completable under `BODY_BUDGET`; surface at `y=15`, so `H=15` and the whole cave band fills). Water after the fill = sea 1024 + cave band 6144 + the opened floor cell 1 = **7169**.

- [ ] **Step 1: Write the failing tests**

In `src/__tests__/water.test.ts`, add a helper next to `makeWorld`/`slab` (module level, below `countWaterAt`):

```ts
// Tall cave under a sea: stone floor y0, air band y1..12, stone slab y13, sea y14..15
// over x0..31 z0..15 (chunks 0 and 1). The sea is the "large body" (1024 cells) and its
// flat surface is y=15, so equalization fills the whole band (6144 cells) plus any
// opened floor cell.
function oceanCaveW(): World {
  const w = makeWorld([[0, 0, 0], [1, 0, 0]]);
  for (let x = 0; x < 32; x++)
    for (let z = 0; z < 16; z++) {
      w.setBlock(x, 0, z, Block.Stone);
      w.setBlock(x, 13, z, Block.Stone);
      for (let y = 14; y <= 15; y++) w.setBlock(x, y, z, Block.Water);
      // y1..12 stays Air (the cave band)
    }
  return w;
}
```

Append to the describe block:

```ts
it('punching the ocean floor instantly floods the connected cave to sea level (connected vessels, no tick())', () => {
  const w = oceanCaveW();
  const sim = new WaterSim(w);
  sim.settle(0, 0, 0);
  sim.settle(1, 0, 0);
  expect(countWaterAt(w, 0, 31, 0, 15, 1, 13)).toBe(0); // sealed cave stays dry until opened
  w.setBlock(9, 13, 9, Block.Air); // break the ocean floor
  sim.edit(9, 13, 9, Block.Air);
  // NO tick() anywhere: the fill must happen at edit time, not one fell cell/tick
  expect(countWaterAt(w, 0, 31, 0, 15, 1, 13)).toBe(6145); // band 6144 + the opened cell
  expect(countWater(w)).toBe(7169); // sea 1024 + cave 6145
  expect(sim.cellState(9, 14, 9).b).toBe(Block.Water); // the sea above the hole is untouched
  expect(sim.cellState(5, 15, 5)).toEqual({ b: Block.Water, l: 7, s: 1 }); // flat sea surface, unchanged
  expect(sim.stats.equalizeFills).toBe(6145);
  assertInvariants(w);
});

it('a pre-carved gap in the ocean floor is filled during settle (the load path), with no tick() involved', () => {
  const w = oceanCaveW();
  w.setBlock(9, 13, 9, Block.Air); // the gap exists in worldgen (Air), as a carve would leave it
  const sim = new WaterSim(w);
  sim.settle(0, 0, 0);
  sim.settle(1, 0, 0); // settle alone must equalize — no tick()/drain()
  expect(countWaterAt(w, 0, 31, 0, 15, 1, 13)).toBe(6145);
  expect(countWater(w)).toBe(7169);
  expect(sim.cellState(5, 14, 5).b).toBe(Block.Water); // sea intact
  assertInvariants(w);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/__tests__/water.test.ts`
Expected: both new tests FAIL. Old code: after `edit` with no `tick()`, the cave gains at most the one column that falls straight down (`countWaterAt` ≈ 13, not 6145); on the load path, `settle`'s relaxation trickles — one column falls to the floor and spreads a level-1 puddle of a few dozen cells, far short of 6145. Existing tests pass.

- [ ] **Step 3: Implement `equalize` in `src/water.ts`**

Add module constants below `SETTLE_GUARD` (line 11):

```ts
const NB6: ReadonlyArray<readonly [number, number, number]> = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const SEA_BODY_MIN = 512; // a water body larger than this counts as a sea/lake for equalization
const EQUALIZE_BUDGET = 8192; // max air-pocket cells one equalize() may fill
const BODY_BUDGET = 4096; // max water-body cells one equalize() may probe (probe is up-first, so the surface is reached within a few dozen hops even when truncated)
```

Add methods after `settle` (before `edit`):

```ts
  // The generated world's block at a cell, or -1 (impassable wall) for missing chunks /
  // out-of-band cells. Pocket searches must never walk into ungenerated space: it is an
  // infinite air void that would burn EQUALIZE_BUDGET and never settle (fills there are
  // no-ops anyway — setState cannot write to a missing chunk).
  private pocketBlock(x: number, y: number, z: number): number {
    if (!this.inBand(y)) return -1;
    const c = this.world.getChunk(chunkOf(x), chunkOf(y), chunkOf(z));
    if (!c) return -1;
    return c.blocks[localIndex(x - c.cx * 16, y - c.cy * 16, z - c.cz * 16)];
  }

  // Bulk-fill air pockets that became connected to a large water body (sea/lake), up to
  // that body's surface level — connected vessels. Called from settle (seeds = generated
  // air cells below/next to the chunk's water) and edit (seed = the broken cell).
  // A pocket is filled only when: it fits in EQUALIZE_BUDGET (else the probe is incomplete
  // and the classification unsafe), the touching water body has more than SEA_BODY_MIN
  // cells, and a surface level H (a level-7 source cell with air above) was found during
  // the up-first body probe. Pockets above H keep their air; filled cells become level-7
  // sources and are re-marked (neighbouring water may have regained feed). Everything
  // else — sealed caves, tiny puddles, over-budget pockets, no surface found — is left
  // to the tick CA, which still trickles through a new opening as before.
  equalize(seeds: readonly (readonly [number, number, number])[]): void {
    const consumed = new Set<string>(); // pocket cells already claimed by an earlier seed of this call
    for (const [sx, sy, sz] of seeds) {
      if (this.pocketBlock(sx, sy, sz) !== Block.Air) continue; // not generated air: nothing to fill
      const pocket: number[] = []; // flat (x, y, z) triples, exploration order
      const body = new Set<string>(); // water cells 6-adjacent to the pocket
      let overflow = false;
      const seen = new Set<string>([`${sx},${sy},${sz}`]);
      const stack: [number, number, number][] = [[sx, sy, sz]];
      while (stack.length > 0) {
        if (pocket.length >= EQUALIZE_BUDGET) { overflow = true; break; }
        const [x, y, z] = stack.pop()!;
        pocket.push(x, y, z);
        for (const [dx, dy, dz] of NB6) {
          const nx = x + dx, ny = y + dy, nz = z + dz;
          const nb = this.pocketBlock(nx, ny, nz);
          if (nb === Block.Water) { body.add(`${nx},${ny},${nz}`); continue; }
          if (nb !== Block.Air) continue; // solid or wall: pocket boundary
          const key = `${nx},${ny},${nz}`;
          if (seen.has(key) || consumed.has(key)) continue;
          seen.add(key);
          stack.push([nx, ny, nz]);
        }
      }
      if (body.size === 0) continue; // not connected to any water: stays sealed and dry
      if (overflow) continue; // too big to classify safely: the CA trickle takes over
      for (let i = 0; i < pocket.length; i += 3) consumed.add(`${pocket[i]},${pocket[i + 1]},${pocket[i + 2]}`);
      // Probe the water body for its surface, up-first (up-neighbour pushed last, popped
      // first) so the top is reached in minimal hops even under BODY_BUDGET truncation.
      let H = -1;
      let bodyCount = 0;
      const bseen = new Set<string>();
      const bstack: [number, number, number][] = [];
      for (const key of body) {
        const p = key.split(',');
        bseen.add(key);
        bstack.push([Number(p[0]), Number(p[1]), Number(p[2])]);
      }
      while (bstack.length > 0) {
        if (bodyCount >= BODY_BUDGET) break; // body is certainly large; H (if any) was already reached up-first
        const [x, y, z] = bstack.pop()!;
        const st = this.cellState(x, y, z);
        if (st.b !== Block.Water) continue;
        bodyCount++;
        if (st.s === 1 && st.l === 7 && this.cellState(x, y + 1, z).b === Block.Air && y > H) H = y;
        let up: [number, number, number] | null = null;
        const rest: [number, number, number][] = [];
        for (const [dx, dy, dz] of NB6) {
          const nx = x + dx, ny = y + dy, nz = z + dz;
          if (this.cellState(nx, ny, nz).b !== Block.Water) continue;
          const key = `${nx},${ny},${nz}`;
          if (bseen.has(key)) continue;
          bseen.add(key);
          if (dy === 1) up = [nx, ny, nz];
          else rest.push([nx, ny, nz]);
        }
        for (const n of rest) bstack.push(n);
        if (up) bstack.push(up);
      }
      if (H < 0 || bodyCount <= SEA_BODY_MIN) continue; // no sea/lake, or no surface found: leave to the CA
      for (let i = 0; i < pocket.length; i += 3) {
        const x = pocket[i], y = pocket[i + 1], z = pocket[i + 2];
        if (y > H) continue; // the pocket keeps its air above the body's surface
        this.setState(x, y, z, 7, 1, Block.Water);
        this.stats.equalizeFills++;
        this.enqueue(x, y, z);
      }
    }
  }

  // Settle-time equalization seeds: every GENERATED air cell 6-adjacent to the settling
  // chunk's water, EXCLUDING its above-neighbours — the air above a water surface is the
  // sky, connected forever, never a newly opened pocket, and searching it would burn the
  // pocket budget on every sea-chunk settle. (The edit() path seeds the broken cell
  // itself in all six directions; the same guards there make sky pockets no-ops too.)
  private equalizeAfterSettle(c: Chunk): void {
    const bx = c.cx * 16, by = c.cy * 16, bz = c.cz * 16;
    const seeds = new Map<string, [number, number, number]>();
    for (let lx = 0; lx < 16; lx++)
      for (let ly = 0; ly < 16; ly++)
        for (let lz = 0; lz < 16; lz++) {
          if (c.blocks[localIndex(lx, ly, lz)] !== Block.Water) continue;
          const wx = bx + lx, wy = by + ly, wz = bz + lz;
          for (const [dx, dy, dz] of NB6) {
            if (dy === 1) continue; // no above-neighbours (see method comment)
            const x = wx + dx, y = wy + dy, z = wz + dz;
            if (!this.inBand(y)) continue;
            if (this.cellState(x, y, z).b !== Block.Air) continue;
            seeds.set(`${x},${y},${z}`, [x, y, z]);
          }
        }
    if (seeds.size > 0) this.equalize([...seeds.values()]);
  }
```

Wire it into `settle` — insert the call between `this.settling = null;` and `c.settled = true;`:

```ts
    this.settling = null;
    this.equalizeAfterSettle(c);
    c.settled = true;
    return this.touched;
```

Wire it into `edit` — after the existing re-mark block (the `this.queue.add(...)` lines at the end of `edit`), append:

```ts
    if (block === Block.Air) {
      // A break may have connected a sealed pocket to a large water body (punching a
      // cave floor under the ocean): equalize now so the column fills instantly.
      this.equalize([[wx, wy, wz]]);
    }
```

- [ ] **Step 4: Run the water tests to verify the new tests pass**

Run: `npx vitest run src/__tests__/water.test.ts`
Expected: PASS — both equalize tests hit exactly `7169` / `6145` / `equalizeFills == 6145`, invariants hold, and every pre-existing test still passes (A=85: the pocket around the diamond is big but its body is only 85 cells ≤ 512, so no fill; PO=7680/7680: the full slabs contain no air, hence no seeds; I=322/322: its sea bodies are ≤ 322 cells; P: chunk 0 has zero air cells, no seeds — its cave flood still comes unchanged from the seam relaxation).

- [ ] **Step 5: Full suite + typecheck (pin check)**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: PASS, all files; every console pin unchanged (A=85, I=322, PO=7680, H=1284, terrain=24936, LOAD processes still under PIN — equalize during the replay can only add fill work for sea-adjacent pockets in the spawn region); typecheck clean. If a pin shifts: the design analysis says none should; investigate the change before touching any constant.

- [ ] **Step 6: Commit**

```bash
git add src/water.ts src/__tests__/water.test.ts
git commit -m "feat: equalize sea-connected pockets on settle/edit (connected vessels)"
```

---

**Controller addendum (T3, post-implementation + post-review):** (1) The plan's Step-3 pocket-BFS guard `if (pocket.length >= EQUALIZE_BUDGET)` is buggy as written — `pocket` is a flat triple-array (3 entries per cell), so the literal form overflowed at ≈2730 cells and could never satisfy this plan's own 6145/7169 pins; the implementation (and this plan's intent) is `pocket.length / 3 >= EQUALIZE_BUDGET` (cell count, per the constant's comment). Verified by negative control in review. (2) T3's quality review found the unguarded equalize re-walked the full 8192-cell pocket budget for EVERY seed in one over-budget region (2,804,261 `pocketBlock` lookups in the load replay, zero fills, settle wall 715→1727 ms — a defect-#1 relapse invisible to the process pin). Fixed with: `EQUALIZE_PROBE_BUDGET = 163840` per-call probe cap (starved calls abandon the current seed without filling and stop taking further seeds — same sanctioned "left to the CA trickle" category), overflow prefixes claimed into `consumed` so later seeds cannot re-walk (or form sliver pockets) an already-refused region, and an early body-probe break once both gates are settled. A new `stats.probes` counter (pocket walks exact, body pops at 8) is pinned in `water-load.test.ts` at `PROBE_PIN = 1,000,000` (measured 605,070; unguarded 2,804,261) because equalize cost is invisible to the process-count pin. Post-fix replay: processes 358,716 (< 1,231,601), probes 605,070, settle wall ≈ 985 ms (T3 overhead now ≈ +270 ms over pre-T3), queue-drained `sim.tick(1)===0` holds. (3) Three decision-gate tests were added (none existed): the `SEA_BODY_MIN` gate (a 504-cell body with a real surface stays unfilled at edit time — the body is the only gate active, since H is found), the overflow gate (an 18,432-cell stone-sealed pocket connected to a >512-body sea via a punched slab cell: `equalizeFills === 0` and the pocket still dry immediately after `edit`), and the above-`H` rule (a pocket spanning a tunnel below and a gallery above sea level H=15 fills to H exactly — sea 768 + band 1536 + tunnel 96 = 2400 water, gallery 96 cells stay Air). Granularity note from the analysis: the overflow gate is only observable at edit-time granularity, because within any settle the CA trickle (sources feed streams infinitely — an accepted POC deviation) destroys a large single pocket before its equalize run, and at settle granularity only `equalizeFills === 0` is a stable pin. (4) A focused re-review of the fix commit then proved the as-written gate tests did NOT discriminate their gates, and both were redesigned — each verified by an inverted-guard negative control (gate disabled ⇒ test red): the overflow test originally punched a slab cell *beside* the sea, giving the seed an empty body (`body.size === 0` refused before the overflow gate was consulted); it now punches `(8,13,16)` under the sea, so the seed reaches the whole sea (1024 > 512 via the body probe) and the overflow budget is the only gate that can refuse (negative control: gate off ⇒ `equalizeFills = 8192`, region floods to the cap). The above-H test originally used a tunnel+gallery pocket, but the CA fills the tunnel with water during settle, which severs the gallery from the pocket — the gallery then stayed dry for the wrong reason (also, an early draft's world left a z16..31 air void that merged the chimney into an over-budget region, so the pin passed via the overflow gate). The final geometry connects a level-7 PIPE row (y13, water-connected to the sea's underside) under a tall chimney, so the settled 6400-cell B+sky pocket (in budget) is seeded, body > 512, and — because a settled 2-row sea column grades down (top row l<7) — the surface is H=13 from the pipe row, leaving EVERY pocket cell above H: the above-H rule is the sole thing keeping the whole pocket air (negative control: rule off ⇒ count 5449 → 11076, all pinned state cells flip to (7,1)). The small-body (`SEA_BODY_MIN`) test discriminated as written (gate off ⇒ `equalizeFills = 5`).

---

### Task 4: Documentation, final gate, handoff checklist

**Files:**
- Modify: `PROJECT.md` (§9, lines ~413-423: the flow bullet list and the `[Implemented]` paragraph)

- [ ] **Step 1: Update `PROJECT.md` §9**

In §9, insert one new bullet after the "Run from a dirty-cell queue…" bullet (line 419) in the flow list:

```markdown
- **Equalization (connected vessels).** When an air pocket becomes connected to a large body of water (a sea/lake — water body > `SEA_BODY_MIN` cells with a level-7 surface found during an up-first probe) — via a chunk settling, or a player breaking a block — the pocket (≤ `EQUALIZE_BUDGET` air cells, generated chunks only) is filled to that body's surface level in one bulk write. Pockets that are sealed, small, or over budget are left to the per-tick trickle above.
```

Then replace the entire `[Implemented]` paragraph (line 423) with:

```markdown
**[Implemented]** The flow sim shipped in `src/water.ts` (unit-tested in `src/__tests__/water.test.ts`; the load path is pinned by a 60-frame boot replay in `src/__tests__/water-load.test.ts`). Flow state (`wlevel`/`wsource`) is stored in each chunk (`src/world.ts`) and streams with it. On top of the rules above it also: **re-promotes** a settled water cell to a *source* on solid support below (a rule typical of voxel engines — so settled lakes, pool floors, landing cells, and sealed pockets are immortal); **equalizes** sea/lake-connected air pockets to the body's surface level on chunk settle and on player breaks (the connected-vessels rule, so a hole punched in an ocean floor floods its cave instantly instead of trickling one fell cell per tick — heuristically bounded: pocket ≤ `EQUALIZE_BUDGET` cells, water body > `SEA_BODY_MIN` cells with a level-7 surface found by an up-first probe capped at `BODY_BUDGET` cells, ungenerated space treated as wall); **settles** standing water once per chunk load, cheaply: worldgen water is re-seeded to level-7 sources in one bulk array pass and only cells that will actually fall (below is air) or spread (an air / unseeded-water neighbour) are queued, so an interior ocean chunk settles in milliseconds and the settle runs inline in the load path (a 60-frame / 125-chunk boot replay: old code spent 6.1 s of 6.7 s in settle over 2.5M cell updates; the cheap settle holds the same replay at a few hundred thousand updates — pinned); and **drains** only water that falls out of the world. Mesh-freshness contract: `sim.touched` **accumulates** across every settle of a frame and is consumed and cleared exactly once, by the frame-end drain in `main.ts` — `settle()` never clears it, which is what guarantees a chunk flooded across a seam is re-meshed in the same frame instead of keeping a stale pre-flood mesh (the visible "multiple ocean levels on spawn" bug). Documented POC-model deviations: "falling" = step down one cell/tick with the source bit carried (a landed source keeps feeding its stream); a re-promoted source *keeps* its level (bounded, unlike a fresh level-7 source), so a settled pool's front stays a level-1 ring; cut in-flight flow lands and re-promotes rather than draining; water never spreads into ungenerated space (missing chunks stop spread — only a *falling* cell into a missing/void destination is destroyed, and the equalize pocket probe likewise treats ungenerated space as a wall); a settle that exhausts its 20 000-update guard marks its chunk settled anyway (safety valve); and levels affect dynamics only, never the mesh. One load-path subtlety is handled explicitly: settling chunks one at a time can never eat a loaded-unsettled neighbour's *unseeded* worldgen water (level 0, no source) — such cells are skipped until their own chunk's pass 1 re-seeds them as level-7 sources, so settling one chunk may flood air or raise levels across a seam but never dries its neighbour's water, and the converged state is independent of settle order. Deferred past the POC: integer chunk keys (the string keys in `World`/`touched`/queue are now the main remaining cost, and the equalize probes still pay them per cell); a mesher-side wall for *missing* chunks at the view ring; water-state consistency for chunks regenerated after a change.
```

- [ ] **Step 2: Final gate**

Run: `npx vitest run` → Expected: PASS, all files, all pins unchanged.
Run: `npx tsc --noEmit` → Expected: clean.
Run: `npm run build` → Expected: clean vite build.

- [ ] **Step 3: Hand the user the browser checklist** (no browser exists in this environment — these are verified by the user with `npm run dev`)

```markdown
1. **Load (defect #1):** start the game — spawn should appear within a second or two with no multi-second freeze; walk back and forth across the shoreline (forcing continuous chunk loads) — no frame drops beyond brief blips.
2. **Flat ocean (defect #2 & #3):** stand on the shore and look out — one flat water surface to the horizon, no stepped levels, no dry air gaps at the corners/edges of the visible world (check the view corners specifically, worst case before the fix).
3. **Punched cave (defect #4):** fly (F) under the sea into a carved cave, break a block in the ocean floor above the cave (or inside it, up through the floor) — the column fills to sea level instantly (flat top, no slow drip), and the sea surface above stays flat (no local dip).
4. **Regression feel:** place a water block on stone — it still spreads into a level-graded diamond and re-promotes; a sealed pool you dig into still refills from its source ring.
```

- [ ] **Step 4: Commit**

```bash
git add PROJECT.md
git commit -m "docs: water sim rules (equalization, settle/touched contract, perf) in PROJECT.md §9"
```

---

## Self-review notes (run while writing this plan — issues found were fixed inline)

- **Spec coverage:** #1→Task 2 (+ benchmark), #2/#3→Task 1 (+T4 doc/contract), #4→Task 3 (both settle load path and edit path), docs→Task 4. All four defects mapped; no task left placeholder-free.
- **Placeholder scan:** every code step carries complete code; the only numeric constants are measured (2 463 202 baseline, PIN 1 231 601, 7169/6145 pin derived arithmetically from the test geometry) or explicitly budget choices stated in the design.
- **Type consistency:** `stats` fields (`seeds/processes/queueAdds/equalizeFills`) used identically in T2 and T3; `equalize(seeds: readonly (readonly [number, number, number])[])` matches both call sites (`this.equalize([...seeds.values()])` and `this.equalize([[wx, wy, wz]])`); `pocketBlock`/`equalizeAfterSettle`/`enqueue`/`settleSeed` names are consistent across tasks; `chunkKey` import added in Task 1 and available to later tests in the same file.
- **Task sequencing:** T1 only deletes a line + comments; T2 rewrites the seed stage (its settle code is shown *without* the T3 call — T3 inserts it); T3 adds the equalize layer and the two wiring lines; T4 docs/gate. Each task commits green (its tests + the full suite) on its own.
- **Known deliberate deviations, documented in-plan:** equalization is a *heuristic* (budgets + `SEA_BODY_MIN`), not an exact hydrostatics solver — over-budget pockets or pockets whose body surface can't be found within `BODY_BUDGET` fall back to the CA trickle (bounded, same as today); a fill writes `(7,1)` sources, so a filled cave reads as source water (invariant-safe); `equalizeAfterSettle` intentionally skips above-water (sky) seed directions, and `edit` seeds all six directions but relies on the same guards to make sky pockets no-ops.
## Controller addendum (post-merge, user acceptance — SUPREME)

After the full plan was implemented and reviewed, the user ran the browser checklist
(Step 3) and REJECTED the T3 (equalize) result:

- Punched-cave (defect #4): instant bulk fill of the ENTIRE cave to sea level is
  "wrong and bad" — the user prefers the pre-T3 behavior (a couple of water blocks
  drop in, the cave floor fills ~1 block high, then the trickle takes over).
- Source sprawl: equalize's `(7,1)` bulk writes make a placed block spawn several
  source rings around it; the user wants placed blocks to STOP flow, and flow water
  distinguished from source water (visual is a separate, unimplemented mesher need).

Decision: REVERT T3 on `poc/voxel-sandbox` (reverts of 99cdb31, 4e33f34, 50f8634;
PROJECT.md §9 edited back to the T1/T2-era text — the settle/touched contract
documentation stays, the equalization bullet/paragraph removed). Escape branch
`poc/voxel-sandbox-t2-only` @ 2762db2 captures the pre-T3 state. Defect #4 is
re-scoped: the user does NOT want instant connected-vessels fills; if faster cave
flooding is wanted later it must look like a gradual flow-in, which is a
different design than bulk equalize and needs its own plan. Residual known issues
for the next iteration (user-observed, not yet objectively reproduced in tests):
ocean still shows raised sections (suspect: guard-saturated settles + the
tick/5 slow clock's 2400 cells/s long tail, or above-sea-level worldgen water),
and movement-time stutter (POC streaming/mesh budget; T3's per-settle probe work is
now gone, re-measure).

## Controller addendum (post-revert: root cause of the residual ocean steps + fix)

The user's re-test on the reverted branch still showed (a) stepped ocean sections and
(b) movement stutter. A water->air write trace through the exact 60-frame load replay
localized (a) to a NEW root cause the plan's tests never exercised: **streaming loads
y-bands in arbitrary order** — a high band (cy>=1) can be generated and settled while
its low band (cy-1) is still absent. `cellState` reads not-yet-generated space as dry
Air, so the settle made the high band's bottom water "fall" out of the world (destroyed
through a hole that does not exist — the documented missing-destination drain, wrongly
triggered); the ocean top row was then gone forever and refilled only *unevenly* by
neighbour spreads. Measured on the replay before the fix: 2959 ocean columns ended at
one surface height and 469 one step higher (2,959+469 of 3,438 water columns); after:
ALL 3,718 open-ocean columns converge to exactly one height (the flatness probe logs a
0-column off-mode at sea level; the only off-mode surfaces are legitimately-enclosed
underwater cavities below sea level). The secondary effect was most of the old
process count: destroying/respreading that top row is where the 358k update budget
went — after the fix the whole replay relaxes in 12,478 updates (settle wall 89 ms of
a 703 ms load; the rest is terrain+mesh, the POC streaming cost, which also explains
most of the movement stutter).

Fix (2 guards, in `src/water.ts`): `settle()` DEFERS a chunk whose low band is in the
generated range (streaming CY_MIN=0) but not yet loaded, and CASCades upward once a
band settles (waking deferred bands); `process()` refuses to fall into
not-yet-generated space (a fall exiting the generated world below its floor still
drains, as documented). Regression test: `water.test.ts` "a band settling above a
not-yet-loaded low band keeps its bottom water" (negative-control verified: without
the defer the test is red). The load test now logs the ocean-surface flatness
histogram. This is a load-path correctness fix on the T1/T2 base — no behavior change
for the interaction cases (fall/spread/re-promote/edit all unchanged).

## Controller addendum (water-model redesign: sources / flow / reachability + slow clock)

After the band-order fix the user re-tested in the browser and rejected the remaining
water *model* (four complaints: cave punch should not fill the whole cave instantly
[that was T3, already reverted]; covering a flooded hole should make the water go
away; placing a water block should create exactly ONE source, not a diamond of them;
flow water should be distinguishable from source water). Root cause of the first
three: the sim **re-promoted** any settled water on solid support (or L7 above) to an
immortal source (a rule typical of voxel engines — documented but wrong for this user's model),
and falling water carried its source bit, so the sea itself (all re-seeded sources)
left immortal sources anywhere it poured.

New model (implemented, all tests re-pinned):
- Sources are created ONLY by placing a water block; water that falls lands as flow.
- Levels are a cosmetic constant 7 (no decay → resting water is a zero-work fixpoint);
  spread has UNLIMITED range — water floods everywhere it can connect (terrain and
  reachability bound it, not level decay). This is what fills a breached cave fully
  and what makes "place on a hill" fill everything downstream.
- Flow is SUSTAINED (new per-cell `wflow` flag in the chunk) while 6-neighbour
  reachability reaches a source; after any water-removing EDIT, `runAudit()`
  re-derives the flags globally (BFS from all sources through water) and process()
  starves unreachable flow at the slow-clock pace (one cell per update) — plug a
  hole and the cave drains itself, cell by cell; break theplug and it refills.
- The water clock is now one pulse per 0.5 s (250 updates) instead of a tick every
  5th frame: placement/drain visibly take time and per-frame sim cost is ~zero
  (the user asked for exactly this, noting it should also help performance).

Verification: 17 model tests (incl. new "breached cave fills / drains on plug /
refills on unplug", "placed source floods the whole connected floor layer — exactly
one source", "source dropped in a walled pit becomes flow and starves away"), full
suite 10 files / 67 tests, tsc, build; 10-second load replay: 12,595 updates
(PIN 1,231,601), ocean flatness probe all 3,718 open columns at one surface.
Note: the flow-vs-source distinction is in state (`wsource`) but the mesher still
renders both identically — distinct flow-water visuals are a deferred mesher feature.

## Controller addendum 4 (frame-time stutters + persistent waterfalls, user round 3)

User re-test after the model redesign: (2) place-on-hill "works perfect", (4) plug-drain "fixed", but (1) walking still stutters and (3) falling water reads as a migrating drop — water must hold a persistent falling column and spread where it lands. Also requested: a doc entry for the deferred flow-vs-source visual distinction (done: `TODO.md`).

**(1) Stutter — measured, not guessed.** A temporary moving-camera replay (400 stand + 400 walk frames, stepping one chunk per 30 frames over open ocean) logged per-phase ms per frame: walking ran **p95 ≈ 80 ms, max ≈ 138 ms** against the 16.7 ms frame budget (55–68 stuttering frames in 400). Root causes, each measured on the heaviest frames:
- **settle-guard saturation**: a newly streamed-in ocean/cave chunk's `settle()` ran its full 20,000-update guard in one frame (≈80 ms, all cross-chunk cell reads) — the biggest and most frequent offender. Fix: `SETTLE_GUARD = 2000` (~5–10 ms; the saturated remainder relaxes over later slow-clock pulses — an already-documented contract).
- **2+2 streaming budgets** at a loaded remesh frame walked the rest. Fix: `LOAD_BUDGET`/`REMESH_BUDGET` 2→1 (`src/streaming.ts`; streaming re-pins updated: A/B/C/D in `streaming.test.ts`).
- **deep-water settle + remesh cross-reads**: settle seeding pass 2 and the mesher both paid a string-keyed `getChunk`/`getBlock` hash lookup per neighbour cell. Fix: settle pass 2 reads in-chunk neighbours straight from the chunk's own arrays (`c.blocks[i±1]`, `c.blocks[i±16]`, `c.blocks[i-256]`; boundary cells pay one cross-chunk `edgeAir` read) — deeper oceans no longer slow the load; the mesher gained an in-chunk `gb()` accessor (same idea) worth ~25 ms on a full-water band.
Result: **walking p95 ≈ 7 ms, max ≈ 22 ms, zero frames > 25 ms** (probe deleted with the fix; methodology note in `TODO.md`).

**(3) Waterfalls + the freeze-in-air bug they exposed.** Model additions in `src/water.ts`:
- **Fed-source heads (waterfall heads)**: a *source* with air below that has water above or in a horizontal neighbour (sea surface, a lake edge, a stack head) does NOT fall — it stays put and pours flow down through the gap each pulse, so a falling stream is a persistent column. A lone unfed source in the sky still falls and lands as flow (the walled-pit test pins this).
- **One step per pulse**: `tick()` clears/requeues a `falling` set — a cell that just dropped is skipped for the rest of the pulse and requeued at the next pulse's start, so a column drops as a rigid body, one level per 0.5 s, instead of teleporting to the ground in a pulse (the "migrating drop" the user saw). The settle path bypasses the gate (fast cascade at load).
- The requeue-at-pulse-start is load-bearing: an early draft let a skipped fall cell consume its queue token without re-enqueueing, so **columns froze in mid-air forever** (and starve cascades stalled — the "23 cells left" test residue) and the load replay spiked back to 2.46 M processes. The requeue fixes all three at once.
- Flow that lands on an existing pool rests on its surface and spreads sideways (rule unchanged from the redesign) — so an open basin fed from a high head climbs layer by layer to the head's level; the waterfall regression test now pins that converged state (11 full 16×16 layers = 2816 cells, no water above the top head, `tick(1) === 0`).

Verification: full suite **11 files / 69 tests green** (waterfall test added; pit/plug/drain tests unchanged — the freeze fix is what made them converge), `tsc --noEmit`, `vite build`; 10-s load replay: **12,797 updates** (PIN 1,231,601), 125 chunks, ≈550 ms wall, ocean flatness all 3,718 open columns at one surface. Docs: `PROJECT.md` §9 (new rules + frame-time budget paragraph) and §11 (budgets 2→1), new `TODO.md` (flow-water mesher visuals + deferred items).

## Controller addendum 5 (water model split: springs vs static sea, round 4)

User re-test after round 3: stutter "pretty snappy" (resolved), but (2a) a waterfall flowing
down a cave face then *fills the cave* — the user wants "flowing" water that adds no sources;
(2b) a placed source in a basin/walled area keeps creating more source blocks / water piles
up; (2c) placing a source high on the shore raised the ocean to the source's level.
Root cause for all three: worldgen water was re-seeded as an *eternal spreading source* at
settle, so the settled sea pushed sideways forever — across seams into caves, over pool
surfaces (flow over water spread sideways and climbed), and up to any high placed level.

Fix, approved by the user before implementation ("Yeah that sounds good"): split the world
by *provenance*, not by level.
- **Placed water is the only true spring** (`wplaced`, set by `edit(Water)`, cleared for any
  other block): immortal *and* the only kind that spreads to air at rest. A spring in a sealed
  basin pours flow in but the basin does not climb.
- **Worldgen water is static**: settle still re-seeds it as level-7 sources (bulk pass, one
  settle per chunk load) so falls are handled in the load path, but a static source never
  spreads. The sea no longer floods caves through a breach (it pours down — see streams) and
  no placed block can raise its level.
- **Streams**: flow that rests on a stream cell, or on a shallow sheet (water one deep over
  solid), becomes a stream cell (`wstream`) — visible, never spreads, starves with its body.
  Flow over anything deeper (deep pool/sea) **vanishes**: a falls-to-sea pour is lost at the
  surface, so **no water body's level ever rises** (kills 2a/2b/2c at the root).
- **Starve-proof landing**: poured flow is born sustained (`f=1` — it is poured *by* a live
  source), and a cell's own sustained flag counts for one pulse, so a fresh parcel/starved
  neighbour does not kill a just-landed pool or stream (the "expected 0 to be 5" regression
  found in the breaching-cave test before the pour fix).

Re-pinned steady states (all unit tests): placed spring on a pad → one 16×16 floor sheet,
water never climbs; breached-cave test: cave holds a 32-cell floor pool + 4×2×6 stream column
over the hole = 80 (was 224 full-cave), far corner (16,7,12) dry; waterfall → 256 sheet + 8
main-column + 2 heads + 4 side columns × 10 = 306 (was 2816 layers climbing to the head);
seam test: settling one chunk never floods a seam neighbour (worldgen is static), the cave
chunk's own settle pours its own sea down (stream + sheet, +192 = 7680), no worldgen water
eaten; the 10-s load replay drops to **9,911 processes** (was 12,797; PIN 1,231,601) since
settle-time seam equalization is gone.

Verification: full suite 11 files / 68 tests green, `tsc --noEmit`, `vite build`. Docs:
`PROJECT.md` §9 rewritten for the split, `TODO.md` sea-rise item retired (visual flow/source
distinction now keys off `wplaced`/`wstream`).

## Controller addendum 6 (level decay + eternal springs, round 5)

User re-test after addendum 5: all of items 1–4 confirmed working, plus two new bugs:
- **(A)** water placed on a hill fans out *far* at the source height — wanted: at most ~5–6
  blocks out, and water should prefer to run DOWN a block rather than keep spreading sideways.
  Root cause: round-2 level decay was dropped entirely ("no levels: unlimited range" — that
  was my design choice, now backfiring on hillside placement).
- **(B)** a source placed in a cave wall (under the ocean, air-filled) dropped once and
  disappeared — wanted: it should behave like a source and keep flowing.
  Root cause: the "lone unfed source falls" rule applied to placed water too, and a falling
  source becomes flow — which then starves (no source reached).

Fixes (both user-approved semantics):
- **Level decay restored for sideways flow** (`wlevel` is now a real number, still
  render-cosmetic): a fresh start is level 7; a cell spreads to Air sideways only at level
  ≥ 2, writing the neighbour at level-1 — a spring's flood is a ~6-block fan (rounded by the
  4-way spread: 85 cells on an open pad). Any fall (pour or drop) resets the parcel to 7, so
  water always runs down a slope first, ledge by ledge.
- **Placed springs never fall**: a `wplaced` source with air below pours *unconditionally*
  (no fed check) and is re-queued at every slow-clock pulse via a `springs` set maintained by
  `edit()` (lazy-dropped when the cell stops being a placed spring — e.g. its chunk is
  evicted, or the player removes it). A sky spring or a wall spring is an eternal emitter
  until mined out; removing one lets the water it fed starve away (audit, unchanged).
  Static worldgen sources keep the old behavior: fed → pour, lone unfed drip → fall.
- Consequences: a spring on a hillside fans out a few blocks then runs off; a sealed basin
  holds a bounded pool; a 3×3 sealed pocket of springs is still an immortal fixpoint (its
  centre refill is now level 6: a spread, not a promotion); `tick(1) === 0` is no longer a
  "rest" signal in the presence of springs (they re-check every pulse) — tests now assert
  N-pulse state stability instead.

Re-pinned steady states: open pad 256 → **85** (bounded fan); waterfall 256+50=306 → **135**
(85 fan + main column + heads + 4 side streams); wall-spring hollow test replaces the old
walled-pit "falls and starves" test (12 → **24** stable incl. head-level side flows down the
wall as streams; starves to 0 once the spring is mined out); a spring at the world edge is an
enduring fountain (falling drops destroyed, count stable); the P/plug/seam/sea tests are
unaffected (their water is all worldgen/static or fully covered by level-7 landings).

Verification: full suite 11 files / 69 tests green, `tsc --noEmit`, `vite build`; 10-s load
replay **9,911 processes** (unchanged — the replay places no water) with the ocean still flat.
Docs: `PROJECT.md` §9 rewritten (two source kinds, decay/range rules, eternal springs),
`water-load.test.ts` lineage note.

## Addendum 7 — Round 6: instant falls (cave flicker)

Symptom: water in caves "flickers" while it drops over tall heights. Probing showed the
steady-state CA is already a fixpoint (zero voxel changes per settled pulse) — the flicker
is the *fill-in transient*: the old model dropped a column one level per 0.5 s pulse, so a
10-block cave fall took 5 s of a visibly migrating/blinking drop, and the world-edge case
re-dripped one cell out of the void every pulse.

Fix (the principle: water spreads downward indefinitely into nearby air blocks
until stopped by a block; the falling-drip look is a cosmetic animation over
already-settled voxels):
- **`dropColumn()` in `src/water.ts`**: a fall writes the WHOLE column in one deterministic
  two-pass — pass 1 walks the air below to classify the landing (solid / sheet / deep /
  world floor / not-yet-generated edge / already-connected), pass 2 writes every air cell
  of the column at level 7 with final flags in place:
  - landing on solid ground or the world floor → bottom cell a sheet (spreads its bounded
    fan), the shaft above it stream (`wstream=1`: visible, never spreads);
  - landing on a pool sheet / stream over solid → all stream (a waterfall meeting a pool);
  - reaching anything DEEPER → absorbed one block above the surface: nothing is written on
    the pool's surface, so a falls-to-sea stream never blinks and no pool level ever rises;
  - edge (low band not loaded) → column stops at the band edge; the cell parks in a
    `waiting` set that the slow clock re-checks every pulse, so the column extends once
    the band loads (replaces the old destroy-out-of-the-world behavior).
- **World floor is solid**: water at the bottom row of the generated world rests on the
  void — no more per-pulse drain blink at the world edge (a world-edge spring is a stable
  fountain whose column lands and fans out on the y=0 plane).
- The 1-step-per-pulse pacing (`inPulse` gate + `falling` re-queue) is gone: a column's
  first processing is a no-op fixpoint, and a settled waterfall is *exactly* at rest
  (spring re-checks its full column each pulse, writes nothing) — nothing is recomputed
  unless the path changes.

Re-pins: waterfall 135 → **163** (the head's 4 side streams now land as their own sheets
whose fans merge with the main one) and asserts the whole column exists after 3 pulses;
world-edge 8 → **125** (stable column + world-floor fan + the spring's 4 side-spread
fountains); sky spring 4 → **97** (column + clipped world-floor fan + 4 side fountains);
new test: a spring pouring into a 6-deep pool is absorbed above the surface — the 1-block
gap stays Air, the pool level never rises, zero churn at the base.

Verification: full suite 11 files / 71 tests green, `tsc --noEmit`, `vite build`; 10-s
load replay **9,911 processes** (unchanged — settle processes the same cells).
Docs: `PROJECT.md` §9 (instant-fall rule, world-floor stability),
`water-load.test.ts` lineage note. Caveat carried to the user: if any flicker remains in
multi-depth cave water, the next suspect is the render layer (transparent water quads are
not depth-sorted across chunk borders — a documented POC shortcut).
