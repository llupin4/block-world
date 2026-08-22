# Design: simulation clocks on one tick heartbeat

- **Date:** 2026-08-22
- **Status:** approved design (brainstormed 2026-08-22)
- **Supersedes:** the open TODO.md item "World time & simulation clocks — align the simulation clocks on one tick system" (originating from ADR 0008 — Sky & day/night, Consequences).
- **Produces:** ADR 0011 — Simulation clocks (written at implementation time), TODO.md item removal, ADR 0008 follow-up marked resolved.

## Context

The world has two clock regimes:

1. **The simulation tick.** `src/time.ts` `WorldTime` (total seconds `time`, stored day-cycle
   counter `phaseTotal`) is advanced once per fixed 60 Hz physics substep inside the
   `while (acc >= STEP)` loop in `src/main.ts` (`worldTime.advance(STEP)`), never from
   wall-clock `dt`. A lagging frame drops frames; it never stretches the day. The sky
   (`sampleSky(dayPhase)`), clouds (wind reads `worldTime.time`), and the HUD clock all
   derive from it (ADR 0008).
2. **The water slow clock.** The water sim's pulse is driven by an *independent wall-clock
   accumulator* in `src/main.ts`: `waterAcc += dt; if (waterAcc >= WATER_STEP) { waterAcc = 0;
   sim.tick(WATER_PULSE); }` with `WATER_STEP = 0.5` s. It accumulates the same clamped `dt`
   as physics but on its own boundary: the pulse fires on accumulated-time crossings, drops
   the fractional remainder on every pulse, and its phase walks relative to the substep
   lattice. It is the only simulation system not derived from the tick.

The light sim has no clock of its own: its queue drains on a per-frame budget
(`lightSim.tick(LIGHT_TICK_BUDGET)`, once per frame) — a drain budget, not a clock. It is
out of scope for this design.

The TODO item's goal: *converge on a single heartbeat that every simulation system derives
from (water's pulse as one stride on the shared tick; world time, cloud wind, and future
weather/lighting as siblings)* — worth it for determinism and for future
server-authoritative multiplayer, where a shared tick basis is what lets a server own the
simulation.

## Scope

**In:** anchor the water pulse to the simulation tick; expose the tick counter as the
canonical heartbeat; record the decision in ADR 0011 and resolve the TODO item.

**Out (deliberate):**

- The web-worker offload of light settle/propagation — a separate, later project. It will
  *consume* this design's tick basis (its message protocol carries tick numbers); no code
  for it lands here.
- Moving the light drain onto the tick. It is a per-frame budget, not a clock; its final
  fields are order-independent fixpoints, so frame-slot placement is not a determinism
  concern. Revisit only if the worker project changes its cadence.
- Any change to pulse *rate*, water rules, streaming, sky, or rendering. Nominally
  one pulse per 0.5 s today, one per 0.5 sim s after.

## Decision

### Tick counter (`src/time.ts`)

`WorldTime` gains a public `tick = 0` field, incremented exactly once per `advance()`
call — one tick = one 60 Hz substep, independent of `dt` magnitude. `time` and
`phaseTotal` semantics are untouched; `advance(dt)` becomes:

```ts
advance(dt: number): void {
  this.time += dt;
  this.phaseTotal += dt / DAY_LENGTH;
  this.tick++;
}
```

`tick` is public read state (like `time`), so consumers read it without new API.

A pure exported helper carries the frame-loop rule (testable without the DOM):

```ts
/** True iff the tick sequence (prev, now] crossed a multiple of `stride`. */
export function tickCrossed(prev: number, now: number, stride: number): boolean {
  return Math.floor(now / stride) > Math.floor(prev / stride);
}
```

### Water stride (`src/main.ts`)

Delete `WATER_STEP` and `waterAcc` (and the `waterAcc >= WATER_STEP` block). Add:

```ts
const WATER_STRIDE = 30; // ticks per water pulse: 30 × 1/60 s = 0.5 sim s (was WATER_STEP = 0.5 wall-clock s)
```

In `frame()`:

- capture `const tickBefore = worldTime.tick;` before the substep loop;
- at the pulse's **current frame position** — after `tickStreaming()` and
  `lightSim.tick(LIGHT_TICK_BUDGET)`, exactly where the `waterAcc` block stands — replace
  the accumulator check with:

```ts
if (tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)) sim.tick(WATER_PULSE);
```

The pulse's frame slot is unchanged (after streaming, after the light drain), so the
ordering of streaming-settle seeding vs. pulse draining — and therefore cave-fill
convergence latency — is unchanged. Stale comments are updated where they describe the
old clock (the boot comment "advanced on a slower clock than physics (every 5th frame)"
and the loop comment "water on a ~2 Hz slow clock").

**Why a crossing check, not `tick % 30 === 0`:** the check is evaluated once per frame,
but a frame can run up to 6 substeps (`dt` clamped at 0.1 s ⇒ ≤ 6 ticks/frame). A frame
whose ticks run 29 → 34 crosses 30 mid-frame yet ends at a non-multiple — a bare modulo
test at frame end would skip that pulse. `floor(now/stride) > floor(prev/stride)` counts
the crossing regardless of where the frame's ticks land. With ≤ 6 ticks/frame and stride
30, at most one multiple can be crossed per frame, so the pulse remains at most once per
frame, as today.

### Guarantees

- **Cadence:** exactly one pulse per 30 ticks = 0.5 simulation seconds — the same nominal
  rate as today's 0.5 s wall-clock step.
- **Determinism:** after this change no simulation system reads the wall clock. The only
  wall-clock input is the rAF timestamp, which enters as clamped `dt`. Identical clamped-dt
  sequences ⇒ identical tick sequences ⇒ identical pulse sequences ⇒ identical water
  state. This is the determinism the TODO item asks for and the property a server needs to
  own the simulation in multiplayer.
- **Behavior:** nominally identical. A pulse's exact *frame* may shift by ±1 relative to
  the old accumulator (the boundary no longer walks), so anything pinned to frame-level
  water timing may drift slightly — see lineages below.
- **Worker seam (documented, no code):** ADR 0011 records `WorldTime.tick` as the canonical
  heartbeat. A future off-thread light worker receives tick numbers in its message
  protocol; a future server owns the tick sequence. Nothing beyond the `tick` field lands
  in this change.

## Lineages (re-pinned at implementation)

`src/__tests__/water-load.test.ts` pins the load-path replay (a 10 s / 125-chunk
boot-and-play, driven exactly like the game loop) with exact water update counts — the
repo's established lineage pattern for water-model changes. Because pulse frame slots may
shift ±1, the pinned counts may drift slightly. At implementation:

1. run the replay, observe the new counts;
2. re-pin the constants and record the old → new lineage (the pre-change value, the
   post-change value, and the reason: pulse anchoring moved from wall-clock accumulator to
   tick stride) in the test's comment and in ADR 0011, matching the existing lineage
   record style in `src/water.ts` / the test.

The light lineage (459,134 boot pops, `src/__tests__/light-load.test.ts`) is untouched by
this change (the light drain cadence is unchanged) and must remain green as-is.

## Tests

`src/__tests__/time.test.ts` (existing file, extended):

- `advance()` increments `tick` 1:1 with call count, for arbitrary `dt` values
  (including non-`STEP` dts — tick counts substeps, not time);
- `tickCrossed` edge cases at stride 30:
  - `29 → 29` false (no ticks ran);
  - `29 → 30` true (exact boundary);
  - `29 → 34` true (boundary crossed mid-range — the case a bare modulo misses);
  - `30 → 30` false (already past the boundary, no new crossing);
  - `31 → 35` false (no multiple in (31, 35]);
  - `29 → 95` true (multiple crossings still report a single boolean — the frame cap of
    ≤ 6 ticks guarantees ≤ 1 in practice).

Full suite: `npm test` green (all pre-existing tests unchanged, water-load lineage
re-pinned per above). Typecheck/build: `npm run build` clean.

Manual verification: load the dev server; walk for a minute and confirm water placement
and drain read at the same visible pace as before (a placed water block spreads over the
same ~0.5 s pulse cadence); confirm the HUD clock is unaffected.

## Documentation

- **New ADR 0011 — Simulation clocks** (`docs/adr/0011-simulation-clocks.md`): the decision
  (tick counter on `WorldTime`, the crossing rule and why, the water stride), tick
  discipline, determinism argument, the re-pinned water lineage, the worker seam, and
  ADR 0008's open follow-up marked resolved with a pointer here. Follow the ADR house
  style (Status / Last updated / Sources / Context / Decision / Alternatives considered /
  Consequences).
- **ADR 0008** — the "align the simulation clocks" open follow-up under Consequences is
  marked resolved (pointer to ADR 0011); the ADR's `Last updated` bumped.
- **TODO.md** — the "World time & simulation clocks" section and its item are removed.
- **ADR README index** — ADR 0011 added to the index table.

## Alternatives considered

- **In-loop stride check** (`worldTime.advance(STEP); if (worldTime.tick % 30 === 0)
  sim.tick(...)` inside the substep loop) — rejected: it moves the pulse to *before*
  `tickStreaming()` in frame order, so cells seeded by a frame's streaming settle wait a
  full pulse (0.5 s) for their first drain (cave-fill converges one pulse later), and the
  pulse interleaves with player substeps. The crossing check keeps the pulse's frame slot.
- **Sim-time accumulator** (keep `waterAcc` but advance it by `STEP` per substep instead
  of wall-clock `dt`) — rejected: the phase still floats (remainder dropped at every
  pulse, boundary walks with accumulation history); it is not a true stride on the tick
  lattice and gives a weaker determinism argument.
- **Dedicated `SimClock` module** (extract time + phase + tick into a new module that
  `WorldTime` becomes) — rejected as over-scope for this change (the tick seam is all the
  worker project needs); remains an option if a third clocked system arrives.