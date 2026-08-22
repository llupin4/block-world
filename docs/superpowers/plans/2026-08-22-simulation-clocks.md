# Simulation Clocks (Tick Heartbeat) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Anchor the water sim's pulse to the simulation tick — one pulse per 30 substeps
(= 0.5 sim s) — via a `tick` counter on `WorldTime`, so no simulation system reads the
wall clock and every system derives from one heartbeat (the TODO item "World time &
simulation clocks"; ADR 0008's open follow-up).

**Architecture:** `src/time.ts` `WorldTime` gains a public `tick` field (incremented once
per `advance()` call — one tick = one 60 Hz substep, independent of `dt` magnitude) and a
pure exported `tickCrossed(prev, now, stride)` helper. `src/main.ts`'s frame loop captures
the pre-substep tick and fires `sim.tick(WATER_PULSE)` at the pulse's **existing frame
slot** (after `tickStreaming()` and `lightSim.tick(...)`, before the frame-end touched
merge) iff `tickCrossed(tickBefore, worldTime.tick, 30)` — a crossing check, not
`tick % 30 === 0`, because a frame can run up to 6 substeps (`dt` clamped at 0.1 s) and a
frame whose ticks run 29 → 34 crosses the boundary mid-frame yet ends on a non-multiple.
The load-path replay test (`water-load.test.ts`) mirrors the same rule and re-pins its
lineage. ADR 0011 records the decision; ADR 0008's follow-up and the TODO item are
resolved. Out of scope: the light drain stays a per-frame budget (a drain budget, not a
clock); the web-worker offload is a later project that will *consume* this heartbeat.

**Tech Stack:** TypeScript (strict; sim modules are pure — no three.js), Vitest, Vite.

**Pre-change baselines (measured 2026-08-22, commit `4919cd1`):**

- `water-load.test.ts` replay: `LOAD processes= 10690` (pin `PIN = 1,231,601` is an
  upper-bound assert, not an exact pin; the exact value is logged + recorded in the
  lineage comment).
- The replay's float accumulator (`waterAcc += 1/60`, pulse at `>= 0.5`) fires **19**
  pulses at frame indices **30, 61, 92, …, 557, 588** (accumulated `1/60` lands just
  under `0.5`, so each cycle drifts one frame later). The integer tick rule fires
  **20** pulses at **29, 59, 89, …, 569, 599**.
- The light boot lineage (459,134 pops, `light-load.test.ts`) is untouched by this work
  (the light drain cadence is unchanged) and must stay green as-is.

**Repo conventions the engineer must follow:**

- Commit style (from `git log`): `feat:` / `perf:` / `refactor:` / `test:` / `docs:` /
  `docs(adr):` + a descriptive sentence, em-dash detail where useful. One commit per task.
- Lineages: the repo records exact work-counter values with old → new in the test's
  header comment (see `water-load.test.ts` lines 13–41). Re-pinning = adding an entry,
  never deleting history.
- ADR house style (`docs/adr/README.md`): Status / Last updated / Sources / Context /
  Decision / Alternatives considered / Consequences; pinned constants and numbers kept
  verbatim; no reference engine named.
- Chunk math is `>> 4` / `& 15` (not needed here — no chunk math in this change).

## File structure

| File | Responsibility | Change |
|---|---|---|
| `src/time.ts` | world clock + (new) canonical tick heartbeat + `tickCrossed` rule | add `tick` field, increment in `advance()`, export `tickCrossed`, header note |
| `src/main.ts` | the frame loop | `WATER_STRIDE = 30` replaces `WATER_STEP` + `waterAcc`; pulse fires on `tickCrossed` at its existing frame slot; two stale comments updated |
| `src/__tests__/time.test.ts` | clock unit tests | new `tick` + `tickCrossed` describes |
| `src/__tests__/water-load.test.ts` | load-path replay + lineage | replay clock → tick stride; lineage entry + `POST` constant |
| `docs/adr/0011-simulation-clocks.md` | the decision record | **new** |
| `docs/adr/0008-sky-day-night.md` | Sky & day/night ADR | clock-alignment follow-up marked resolved; `Last updated` bumped |
| `docs/adr/README.md` | ADR index | 0011 row appended |
| `TODO.md` | open items | "World time & simulation clocks" section removed |

---

### Task 1: `tick` counter + `tickCrossed` in `src/time.ts` (TDD)

**Files:**
- Modify: `src/time.ts`
- Test: `src/__tests__/time.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/__tests__/time.test.ts` (after the `formatClock` describe, at end of file),
and change the import on line 2 to include `tickCrossed`:

```ts
import { WorldTime, formatClock, DAY_LENGTH, tickCrossed } from '../time';
```

```ts
describe('tick — the canonical heartbeat (ADR 0011)', () => {
  it('starts at 0 and counts advances 1:1, independent of dt magnitude', () => {
    const t = new WorldTime();
    expect(t.tick).toBe(0);
    t.advance(1 / 60);
    expect(t.tick).toBe(1);
    t.advance(5); // a giant dt is still one substep: tick counts advances, not time
    expect(t.tick).toBe(2);
    t.advance(1 / 60);
    expect(t.tick).toBe(3);
  });

  it('is deterministic: identical dt sequences give identical tick sequences', () => {
    const a = new WorldTime();
    const b = new WorldTime();
    for (const dt of [1 / 60, 1 / 60, 0.02, 1 / 60, 0.1, 5]) {
      a.advance(dt);
      b.advance(dt);
    }
    expect(a.tick).toBe(b.tick);
    expect(a.tick).toBe(6);
  });
});

describe('tickCrossed — the frame-end water-pulse rule (ADR 0011)', () => {
  it('reports a multiple-of-stride crossing inside (prev, now]', () => {
    expect(tickCrossed(29, 29, 30)).toBe(false); // no ticks ran
    expect(tickCrossed(29, 30, 30)).toBe(true); // exact boundary
    expect(tickCrossed(29, 34, 30)).toBe(true); // boundary crossed mid-range — the case a bare `tick % 30` at frame end misses
    expect(tickCrossed(30, 30, 30)).toBe(false); // already past the boundary
    expect(tickCrossed(31, 35, 30)).toBe(false); // no multiple in (31, 35]
    expect(tickCrossed(29, 95, 30)).toBe(true); // multiple crossings still report one boolean (the ≤6-ticks/frame cap makes this unreachable in practice)
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/time.test.ts`
Expected: FAIL — `tickCrossed` is not exported from `../time` (import error), and
`t.tick` is `undefined` in the new `describe` blocks. The 6 pre-existing tests pass.

- [ ] **Step 3: Implement the minimal code**

In `src/time.ts`, add the `tick` field after the `phaseTotal` field (line 16) and
increment it in `advance()`:

```ts
  /** Total simulation time (s). */
  time = 0;
  /** Total phase progressed, in cycles. Stored, not derived from `time`, so the cycle can later run independently. */
  private phaseTotal: number;
  /** The canonical heartbeat (ADR 0011): one tick per advance() call = one 60 Hz substep, independent of dt magnitude. The water pulse strides on it (every WATER_STRIDE ticks). */
  tick = 0;
```

```ts
  /** Advance the simulation clock, the daylight cycle (in lockstep), and the tick heartbeat. */
  advance(dt: number): void {
    this.time += dt;
    this.phaseTotal += dt / DAY_LENGTH;
    this.tick++;
  }
```

Append the pure helper at the end of the file (after `formatClock`):

```ts
/** True iff the tick sequence (prev, now] crossed a multiple of `stride` — the frame-end water-pulse rule (ADR 0011). A frame can run ≤ 6 substeps (dt clamped at 0.1 s), so a bare `now % stride === 0` read once per frame would miss a boundary crossed mid-frame (ticks 29 → 34); this counts the crossing instead. With ≤ 6 < stride ticks per frame, at most one multiple is crossable, so the result drives at most one pulse. */
export function tickCrossed(prev: number, now: number, stride: number): boolean {
  return Math.floor(now / stride) > Math.floor(prev / stride);
}
```

And extend the file-header comment: after the line
`// rescaled, or set independently of the simulation clock. See` … the `//` block
ending in `// docs/superpowers/specs/2026-08-19-day-night-clouds-design.md.`, insert:

```ts
// `tick` is the canonical heartbeat (ADR 0011 — Simulation clocks): one per advance()
// call = one 60 Hz substep; the water pulse strides on it (every WATER_STRIDE ticks).
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/__tests__/time.test.ts`
Expected: PASS — 9 tests (6 pre-existing + 3 new), 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/time.ts src/__tests__/time.test.ts
git commit -m "feat: WorldTime.tick heartbeat + tickCrossed — substep count, frame-end crossing rule (ADR 0011)"
```

---

### Task 2: `src/main.ts` — water pulse on the tick stride

**Files:**
- Modify: `src/main.ts`

No unit test covers `main.ts` (it is the DOM entry point); verification is the typecheck
+ build + the full test suite (the replay test carries its own clock and is unaffected —
it is updated in Task 3).

- [ ] **Step 1: Update the time import (line 11)**

```ts
import { WorldTime, formatClock, tickCrossed } from './time';
```

- [ ] **Step 2: Replace the slow-clock constants and accumulator (lines 829–835)**

Current:

```ts
const STEP = 1 / 60;
const WATER_STEP = 0.5;   // slow-clock pulse interval (s): water takes one "tick" per pulse — placement and drain visibly take time
const WATER_PULSE = 1000; // cell updates budgeted per pulse: big enough that a cut-off body's re-stabilization cascade (level wave + drain) finishes within a pulse or two, so a stopped flow settles in ~1 s instead of crawling for many seconds (and visibly re-expanding before it drains); smaller pulses made that crawl read as "flow that keeps moving"

let last = performance.now();
let acc = 0;
let waterAcc = 0;
```

New (the `WATER_PULSE` line is unchanged in substance — keep its full comment):

```ts
const STEP = 1 / 60;
const WATER_STRIDE = 30;  // substep ticks per water pulse (ADR 0011): 30 × (1/60 s) = 0.5 sim s — water takes one "tick" per pulse, so placement and drain visibly take time (was WATER_STEP = 0.5 wall-clock s on a floating accumulator that drifted a frame later each cycle: 19 pulses/10 s instead of 20)
const WATER_PULSE = 1000; // cell updates budgeted per pulse: big enough that a cut-off body's re-stabilization cascade (level wave + drain) finishes within a pulse or two, so a stopped flow settles in ~1 s instead of crawling for many seconds (and visibly re-expanding before it drains); smaller pulses made that crawl read as "flow that keeps moving"

let last = performance.now();
let acc = 0;
```

- [ ] **Step 3: Rewire the frame loop (lines 837–854)**

Current:

```ts
function frame(now: number): void {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // clamp after tab-switch/hitch
  acc += dt;
  while (acc >= STEP) {
    acc -= STEP;
    player.update(STEP, readMove());
    worldTime.advance(STEP);
    if (player.pos.y < WORLD_Y_MIN) player.place(SPAWN); // fell out of the world (open cave / dug-away floor)
  }
  tickStreaming(); // ONCE per frame (was inside the substep loop, where the frame-time clamp multiplied the streaming budget by the substep count, up to ~12 chunks/frame)
  lightSim.tick(LIGHT_TICK_BUDGET); // light drain ONCE per frame (was per substep: budget × up to 6 catch-up substeps = ~15k pops/frame); idle cost ~0 (an empty queue is a no-op)
  waterAcc += dt;
  if (waterAcc >= WATER_STEP) {
    waterAcc = 0;
    sim.tick(WATER_PULSE); // water on a ~2 Hz slow clock (PROJECT.md §9); settles are event-driven and stay snappy
  }
```

New (`tickBefore` captured before the substep loop; the pulse keeps its exact frame
position — after streaming and the light drain; the long `tickStreaming`/`lightSim.tick`
comments are unchanged):

```ts
function frame(now: number): void {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // clamp after tab-switch/hitch
  acc += dt;
  const tickBefore = worldTime.tick; // ADR 0011: the water pulse strides the tick lattice; capture pre-substep tick for the frame-end crossing check
  while (acc >= STEP) {
    acc -= STEP;
    player.update(STEP, readMove());
    worldTime.advance(STEP);
    if (player.pos.y < WORLD_Y_MIN) player.place(SPAWN); // fell out of the world (open cave / dug-away floor)
  }
  tickStreaming(); // ONCE per frame (was inside the substep loop, where the frame-time clamp multiplied the streaming budget by the substep count, up to ~12 chunks/frame)
  lightSim.tick(LIGHT_TICK_BUDGET); // light drain ONCE per frame (was per substep: budget × up to 6 catch-up substeps = ~15k pops/frame); idle cost ~0 (an empty queue is a no-op)
  if (tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)) sim.tick(WATER_PULSE); // water on the tick heartbeat (ADR 0011): one pulse per 30 substeps = 0.5 sim s (was a wall-clock accumulator); settles are event-driven and stay snappy
```

- [ ] **Step 4: Fix the stale boot comment (lines 241–244)**

Current:

```ts
// Water sim (PROJECT.md §9, src/water.ts): flow state streams with each chunk; it is
// settled per chunk as streaming loads them (tickStreaming) and advanced on a slower
// clock than physics (every 5th frame). The boot-generated spawn column is settled by
// the first tickStreaming, before the first rendered frame, so caves read as already filled.
```

New:

```ts
// Water sim (PROJECT.md §9, src/water.ts): flow state streams with each chunk; it is
// settled per chunk as streaming loads them (tickStreaming) and advanced on the tick
// heartbeat (one pulse per WATER_STRIDE substeps; ADR 0011). The boot-generated spawn
// column is settled by the first tickStreaming, before the first rendered frame, so
// caves read as already filled.
```

- [ ] **Step 5: Verify — typecheck, build, full suite**

Run: `npm run build`
Expected: tsc clean + vite build succeeds.

Run: `npm test`
Expected: all test files pass (15 files). `water-load.test.ts` still passes — it replays
its OWN clock (updated in Task 3) and does not import `main.ts`. `light-load.test.ts`
(459,134 pop lineage) is green unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/main.ts
git commit -m "refactor: water pulse on the tick stride — frame-end tickCrossed replaces the wall-clock accumulator (ADR 0011)"
```

---

### Task 3: `water-load.test.ts` — replay the tick-stride pulse, re-pin the lineage

**Files:**
- Modify: `src/__tests__/water-load.test.ts`

The replay mirrors `main.ts`'s frame work exactly, so its clock block gets the same
tick-stride rule. The pulse frames move from **30, 61, …, 588** (19 — float accumulator
drift) to **29, 59, …, 599** (20 — integer tick); the `processes` count may shift
slightly (the extra 20th pulse drains only the residual queue; the ±1-frame shift of
every pulse can reorder queue contents at pulse time). The assert is the upper bound
(`processes < PIN`), so a small drift cannot fail the test — it is recorded in the
lineage instead.

- [ ] **Step 1: Add the `tickCrossed` import**

After line 4 (`import { WaterSim } from '../water';`), add:

```ts
import { tickCrossed } from '../time';
```

- [ ] **Step 2: Update the header comment (lines 9–12)**

Current:

```ts
// Load-path budget: replays main.ts exactly — boot column (0,·,2), then a 10-second
// session (600 frames at 60 fps) of streaming.update around the spawn (pcx=0, pcy=2,
// pcz=2) with the frame loop's work: settle + remesh per rebuilt chunk, the slow
// water clock (one pulse of 1000 updates every 0.5 s), frame-end touched drain.
```

New:

```ts
// Load-path budget: replays main.ts exactly — boot column (0,·,2), then a 10-second
// session (600 frames at 60 fps) of streaming.update around the spawn (pcx=0, pcy=2,
// pcz=2) with the frame loop's work: settle + remesh per rebuilt chunk, the
// tick-heartbeat water pulse (one pulse of 1000 updates per 30 ticks = 0.5 sim s;
// ADR 0011), frame-end touched drain.
```

- [ ] **Step 3: Add the lineage entry (after the round-6 entry, line 41)**

After the line
`//     settle pass still processes the same cells, so the count still holds.`
insert (with `{N}` replaced per Step 5):

```ts
//   + tick heartbeat (ADR 0011: the pulse strides the substep tick lattice — every 30th
//     tick — instead of a wall-clock accumulator): the float accumulator under-pulsed —
//     19 pulses at f = 30, 61, …, 588 (accumulated 1/60 lands just under 0.5, drifting a
//     frame later each cycle); the integer tick fires 20 at f = 29, 59, …, 599.
//     {LINEAGE_TAIL}
```

`{LINEAGE_TAIL}` is one of these two lines, chosen from the measured value in Step 5:

- if the count is unchanged (10,690):
  `//     count: 10,690 → 10,690 — the extra 20th pulse lands on an already-empty residual queue and the shifted pulse frames drain the same cells, so the count holds.`
- if it changed (e.g. 10,743):
  `//     count: 10,690 → 10,743 — the shifted pulse frames (±1 f per pulse) and the extra 20th pulse drain the residual queue differently; the pin (1,231,601 upper bound) is unchanged.`
  (write the actually measured number in both slots of the arrow)

- [ ] **Step 4: Replace the replay's clock block (lines 67–87)**

Current:

```ts
  let settleMs = 0, meshMs = 0;
  const tStart = performance.now();
  let waterAcc = 0;
  const STEP = 1 / 60, WATER_STEP = 0.5, WATER_PULSE = 1000; // main.ts slow-clock constants
  for (let f = 0; f < 600; f++) { // 10 s at 60 fps
    waterAcc += STEP;
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
    if (waterAcc >= WATER_STEP) {
      waterAcc = 0;
      sim.tick(WATER_PULSE); // main.ts: the 0.5 s slow-clock pulse
    }
```

New (the substep — hence the tick increment — runs at the top of the frame, exactly as
in `main.ts` where the substep loop precedes `tickStreaming()`; the pulse check sits at
its old frame position):

```ts
  let settleMs = 0, meshMs = 0;
  const tStart = performance.now();
  let tick = 0; // main.ts substep tick: one per frame at the replay's 60 fps (worldTime.advance increments it); tick - 1 is the frame's tickBefore
  const WATER_STRIDE = 30, WATER_PULSE = 1000; // main.ts tick-stride constants (ADR 0011)
  for (let f = 0; f < 600; f++) { // 10 s at 60 fps
    tick++;
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
    if (tickCrossed(tick - 1, tick, WATER_STRIDE)) {
      sim.tick(WATER_PULSE); // main.ts: the tick-heartbeat pulse (fires at f = 29, 59, …, 599)
    }
```

(Note: `STEP` is dropped from the const line — its only use was the deleted
`waterAcc += STEP`.)

- [ ] **Step 5: Run, read the measured count**

Run: `npx vitest run src/__tests__/water-load.test.ts`
Expected: PASS. Read the `LOAD processes=` value from the output → this is `{N}`.
Sanity gate: `{N}` must be within `10,690 − 500 … 10,690 + 1,000` (the delta comes only
from the shifted/extra pulse draining the residual queue). **If outside that range, stop
and investigate** — the pulse frames must be exactly f = 29, 59, …, 599 (20 pulses);
anything else is a wrong `tickCrossed` wiring in the replay.

- [ ] **Step 6: Record the measured value**

Next to the `PIN` constant (line 49), add:

```ts
const POST = {N}; // tick heartbeat (ADR 0011): pulse frames f = 30, 61, …, 588 (float accumulator, 19) → f = 29, 59, …, 599 (integer tick, 20)
```

In the log line (line 109), before `PIN`:

```ts
  console.log('LOAD processes=', processes, '(old code: 2463202; guarded fix: 358734; slow clock: 12797; placed-water split: 9911; tick heartbeat:', POST, '; PIN', PIN + ')');
```

Fill `{N}` in the Step 3 lineage entry (choosing the right `{LINEAGE_TAIL}` variant).

- [ ] **Step 7: Re-run to confirm**

Run: `npx vitest run src/__tests__/water-load.test.ts`
Expected: PASS, `LOAD processes= {N}` identical to Step 5 (the replay is
deterministic — no wall clock in it), `LOAD waterColumns= 3718 airBeneathWater= 0`.

- [ ] **Step 8: Commit**

```bash
git add src/__tests__/water-load.test.ts
git commit -m "test: load-path replay on the tick-heartbeat water pulse (ADR 0011); lineage re-pinned 10,690 → {N}"
```

(substitute the measured `{N}` in the commit message)

---

### Task 4: docs — ADR 0011, ADR 0008 pointer, TODO item, ADR index

**Files:**
- Create: `docs/adr/0011-simulation-clocks.md`
- Modify: `docs/adr/README.md`
- Modify: `docs/adr/0008-sky-day-night.md`
- Modify: `TODO.md`

The ADR's lineage numbers use the measured `{N}` from Task 3 (both variants are
specified — no guessing).

- [ ] **Step 1: Write ADR 0011**

Create `docs/adr/0011-simulation-clocks.md`:

````markdown
# 0011. Simulation clocks — the substep tick is the single heartbeat; the water pulse strides it

- **Status:** Accepted
- **Last updated:** 2026-08-22
- **Sources:** (superseded by this ADR; recoverable via `git show 4919cd1:<path>`)
  - `docs/superpowers/specs/2026-08-22-simulation-clocks-design.md`
  - `TODO.md` (the resolved "World time & simulation clocks — align the simulation clocks on one tick system" item, originating from ADR 0008 — Sky & day/night)

## Context

After the day/night project (ADR 0008 — Sky & day/night), world state ran on two clock
regimes. `src/time.ts` `WorldTime` — total simulation seconds plus a stored day-cycle
counter — is advanced once per fixed 60 Hz physics substep inside the `while (acc >=
STEP)` loop in `src/main.ts`, never from wall-clock `dt`; the sky, the clouds (wind
reads `worldTime.time`), and the HUD clock all derive from it. The water sim's slow clock
was the exception: its pulse was driven by an independent wall-clock accumulator in
`main.ts` (`waterAcc += dt`, a pulse when `waterAcc >= WATER_STEP`, `WATER_STEP = 0.5`
s). It accumulated the same clamped `dt` as physics, but on its own boundary: the pulse
fired on accumulated-time crossings, dropped the fractional remainder at every pulse,
and its phase walked relative to the substep lattice — in the deterministic 10-second
replay the float accumulator fired only **19** pulses (frames 30, 61, …, 588) where the
tick lattice has **20** (frames 29, 59, …, 599), a one-frame-later-per-cycle drift. The
light sim has no clock of its own: its queue drains on a per-frame budget
(`lightSim.tick(LIGHT_TICK_BUDGET)`, once per frame) — a drain budget, not a clock
(ADR 0007 — Dynamic lighting).

The open follow-up (ADR 0008, Consequences; TODO.md): align the simulation clocks on one
tick system — a single heartbeat that every simulation system derives from (water's
pulse as one stride on the shared tick; world time, cloud wind, and future
weather/lighting as siblings) — worth it for determinism and for future
server-authoritative multiplayer, where a shared tick basis is what lets a server own
the simulation.

## Decision

**The tick counter is the canonical heartbeat.** `WorldTime` holds a public `tick = 0`
counter, incremented exactly once per `advance()` call — one tick = one 60 Hz substep,
independent of `dt` magnitude. `time`/`phaseTotal` semantics are unchanged; the sky and
clouds read the clock exactly as before. A pure exported helper carries the frame-loop
rule:

```ts
/** True iff the tick sequence (prev, now] crossed a multiple of `stride`. */
export function tickCrossed(prev: number, now: number, stride: number): boolean; // Math.floor(now / stride) > Math.floor(prev / stride)
```

**The water pulse is a stride on the tick.** `src/main.ts` defines `WATER_STRIDE = 30`
(30 × 1/60 s = 0.5 simulation seconds — the same nominal rate as the old 0.5 s
wall-clock step). `frame()` captures `tickBefore = worldTime.tick` before the substep
loop and, at the pulse's previous frame position (after `tickStreaming()` and
`lightSim.tick(...)`, before the frame-end touched merge), fires
`sim.tick(WATER_PULSE)` iff `tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)`.
The `waterAcc`/`WATER_STEP` accumulator is deleted.

**Why a crossing check, not `tick % 30 === 0`:** the check runs once per frame, but a
frame can run up to 6 substeps (`dt` clamped at 0.1 s ⇒ ≤ 6 ticks/frame). A frame whose
ticks run 29 → 34 crosses 30 mid-frame yet ends at a non-multiple — a bare modulo test
at frame end would skip that pulse. `floor(now/stride) > floor(prev/stride)` counts the
crossing regardless of where the frame's ticks land. With ≤ 6 ticks per frame and
stride 30, at most one multiple is crossable per frame, so the pulse remains at most
once per frame, as before.

**The light drain stays per-frame.** `lightSim.tick(LIGHT_TICK_BUDGET)` remains a
per-frame budget drain, not a tick-strided clock: its final fields are
order-independent fixpoints (ADR 0007), so frame-slot placement is not a determinism
concern. Revisit only if the off-thread light project (below) changes its cadence.

**Determinism.** After this change no simulation system reads the wall clock; the only
wall-clock input is the rAF timestamp, which enters as clamped `dt`. Identical clamped-`dt`
sequences ⇒ identical tick sequences ⇒ identical pulse sequences ⇒ identical water
state. This is the property a server needs to own the simulation in multiplayer, and
why the off-thread light project will carry tick numbers in its message protocol:
`WorldTime.tick` is the basis both sides derive from.

**Lineage.** The `water-load.test.ts` replay mirrors the game loop's frame work, and its
replay clock was updated from the float accumulator to the same tick crossing (one
substep per frame in the replay). The pulse frames move from f = 30, 61, …, 588 (19 —
float drift) to f = 29, 59, …, 599 (20 — integer tick); the replay's process count
moves from **10,690** (pre-heartbeat) to **{N}** (post-heartbeat). {LINEAGE_TAIL_ADR}
The pin (`PIN = 1,231,601` upper bound) is unchanged, and the light boot lineage
(459,134 pops, ADR 0007) is untouched (drain cadence unchanged).

## Alternatives considered

- **In-loop stride check** — `worldTime.advance(STEP); if (worldTime.tick % 30 === 0)
  sim.tick(...)` inside the substep loop. Rejected: it moves the pulse to *before*
  `tickStreaming()` in frame order, so cells seeded by a frame's streaming settle wait a
  full pulse (0.5 s) for their first drain (cave-fill converges one pulse later), and
  the pulse interleaves with the player's substeps. The crossing check keeps the pulse's
  frame slot.
- **Sim-time accumulator** — keep `waterAcc` but advance it by `STEP` per substep
  instead of wall-clock `dt`. Rejected: the phase still floats (the remainder is dropped
  at every pulse, the boundary walks with accumulation history); it is not a true stride
  on the tick lattice and gives a weaker determinism argument.
- **A dedicated `SimClock` module** — extract time + phase + tick into a new module that
  `WorldTime` becomes. Rejected as out of scope: the tick seam is all the off-thread
  light project needs; it remains an option if a third clocked system arrives.

## Consequences

- ADR 0008's open follow-up (align the simulation clocks on one tick system) is resolved
  by this ADR.
- Water pulse cadence is nominally unchanged (one per 0.5 s — now *simulation*
  seconds, and exactly 20 per 10 s where the float accumulator managed 19); a pulse's
  exact *frame* is anchored to the tick lattice instead of walking with accumulation
  history.
- Off-thread light settle/propagation (TODO.md — Sky & lighting) is the next project to
  consume this heartbeat: its message protocol will carry tick numbers, and a future
  server owns the tick sequence.
- Performance: unchanged. One `floor` comparison per frame; the pulse's work and cadence
  are as before.
````

`{LINEAGE_TAIL_ADR}` is chosen from the measured `{N}` (Task 3 Step 5):

- if `{N}` = 10,690: `The count holds: the extra 20th pulse lands on an already-empty residual queue and the shifted pulse frames drain the same cells.`
- otherwise: `The shifted pulse frames (±1 frame per pulse) and the extra 20th pulse drain the residual queue differently.`

(keep the measured `{N}` verbatim where it appears)

- [ ] **Step 2: Append the index row (`docs/adr/README.md`)**

After the 0010 row (line 19), append:

```md
| [0011](0011-simulation-clocks.md) | Simulation clocks | `WorldTime.tick` heartbeat, water pulse on a 30-tick stride, frame-end crossing rule |
```

- [ ] **Step 3: Mark ADR 0008's follow-up resolved**

In `docs/adr/0008-sky-day-night.md`:

- Line 3: `- **Last updated:** 2026-08-20` → `- **Last updated:** 2026-08-22`
- Consequences, the open follow-up bullet (lines 67–68):

Current:

```md
- Open follow-up, tracked in TODO.md: **align the simulation clocks on one tick system.** The water sim keeps its own independent slow clock (`WATER_STEP`/`waterAcc`) while the sky reads `WorldTime`; converging on a single heartbeat that every simulation derives from (water's pulse as one stride; world time, cloud wind, and future weather/lighting as siblings) is worth it for determinism and for future server-authoritative multiplayer, where a shared tick basis is what lets a server own the simulation.
```

New:

```md
- ~~Open follow-up: **align the simulation clocks on one tick system.**~~ Resolved 2026-08-22 by **ADR 0011 — Simulation clocks**: `WorldTime.tick` is the canonical heartbeat and the water pulse strides it (every 30th tick). The light drain remains a per-frame budget (ADR 0007); the off-thread light worker will carry tick numbers in its protocol.
```

- [ ] **Step 4: Remove the TODO item**

In `TODO.md`, delete the whole section (lines 36–45), including its trailing blank line:

```md
## World time & simulation clocks

- **Align the simulation clocks on one tick system.** The day/night project introduced
  `src/time.ts` — a canonical `WorldTime` advanced in the fixed 60 Hz physics substep — which
  the sky/cloud systems read, but the water sim keeps its own independent slow clock
  (`WATER_STEP`/`waterAcc` in `src/main.ts`). Backlog: converge on a single heartbeat that every
  simulation system derives from (water's pulse as one stride on the shared tick; world time,
  cloud wind, and future weather/lighting as siblings). Worth it eventually for determinism and
  for multiplayer, where a shared tick basis is what lets a server own the simulation.
  (ADR 0008 — Sky & day/night.)
```

- [ ] **Step 5: Commit**

```bash
git add docs/adr/0011-simulation-clocks.md docs/adr/README.md docs/adr/0008-sky-day-night.md TODO.md
git commit -m "docs(adr): 0011 simulation clocks — the tick heartbeat (resolves ADR 0008's clock-alignment follow-up; TODO item removed)"
```

---

### Task 5: final gate

- [ ] **Step 1: Full suite + build**

Run: `npm test`
Expected: all 15 test files pass, 0 fail. In particular: `time.test.ts` 9/9;
`water-load.test.ts` `LOAD processes= {N}` (the Task 3 value) and `airBeneathWater= 0`;
`light-load.test.ts` green with its 459,134-pop lineage unchanged.

Run: `npm run build`
Expected: tsc clean + vite build succeeds.

- [ ] **Step 2: Manual check (user, optional — needs a browser)**

Run: `npm run dev`, play a minute: a placed water block spreads and drains at the same
visible pace as before (one pulse per 0.5 s); the HUD clock advances normally; no
perceptible difference in walking smoothness (the change is a clock, not a workload).

- [ ] **Step 3: Confirm the git log**

Run: `git log --oneline -5`
Expected: the four commits from Tasks 1–4 on top of `4919cd1` (the spec commit). Nothing
else dirty: `git status --short` empty.