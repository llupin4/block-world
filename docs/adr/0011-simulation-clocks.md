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
was the exception: its pulse was driven by an independent floating-point dt accumulator in
`main.ts` (`waterAcc += dt`, a pulse when `waterAcc >= WATER_STEP`, `WATER_STEP = 0.5` s).
It accumulated the same clamped `dt` as physics, but on its own boundary: the pulse fired
on accumulated-time crossings, dropped the fractional remainder at every pulse, and its
phase walked relative to the substep lattice — in the deterministic 10-second replay the
accumulator fired only **19** pulses (frames 30, 61, …, 588) where the tick lattice has
**20** (frames 29, 59, …, 599). The light sim has no clock of its own: its queue drains on
a per-frame budget (`lightSim.tick(LIGHT_TICK_BUDGET)`, once per frame) — a drain budget,
not a clock (ADR 0007 — Dynamic lighting).

The open follow-up (ADR 0008, Consequences; TODO.md): align the simulation clocks on one
tick system — a single heartbeat that every simulation system derives from (water's pulse
as one stride on the shared tick; world time, cloud wind, and future weather/lighting as
siblings) — worth it for determinism and for future server-authoritative multiplayer, where
a shared tick basis is what lets a server own the simulation.

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
(30 × 1/60 s = 0.5 simulation seconds — the same nominal rate as the old 0.5 s step).
`frame()` captures `tickBefore = worldTime.tick` before the substep loop and, at the
pulse's previous frame position (after `tickStreaming()` and `lightSim.tick(...)`, before
the frame-end touched merge), fires `sim.tick(WATER_PULSE)` iff
`tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)`. The `waterAcc`/`WATER_STEP`
accumulator is deleted.

**Why a crossing check, not `tick % 30 === 0`:** the check runs once per frame, but a
frame can run up to 6 substeps (`dt` clamped at 0.1 s ⇒ ≤ 6 ticks/frame). A frame whose
ticks run 29 → 34 crosses 30 mid-frame yet ends at a non-multiple — a bare modulo test at
frame end would skip that pulse. `floor(now/stride) > floor(prev/stride)` counts the
crossing regardless of where the frame's ticks land. With ≤ 6 ticks per frame and stride
30, at most one multiple is crossable per frame, so the pulse remains at most once per
frame, as before.

**The light drain stays per-frame.** `lightSim.tick(LIGHT_TICK_BUDGET)` remains a per-frame
budget drain, not a tick-strided clock: its final fields are order-independent fixpoints
(ADR 0007), so frame-slot placement is not a determinism concern. Revisit only if the
off-thread light project (below) changes its cadence.

**Determinism.** After this change no simulation system reads the wall clock; the only
wall-clock input is the rAF timestamp, which enters as clamped `dt`. Identical clamped-`dt`
sequences ⇒ identical tick sequences ⇒ identical pulse sequences ⇒ identical water state.
This is the property a server needs to own the simulation in multiplayer, and why the
off-thread light project will carry tick numbers in its message protocol: `WorldTime.tick`
is the basis both sides derive from.

**Lineage.** The `water-load.test.ts` replay mirrors the game loop's frame work, and its
replay clock was updated from the float accumulator to the same tick crossing (one substep
per frame in the replay). The pulse frames move from f = 30, 61, …, 588 (19) to
f = 29, 59, …, 599 (20); the replay's process count holds at **10,690** (the extra 20th
pulse lands on an already-empty residual queue and the shifted pulse frames drain the same
cells). The count-neutral heartbeat step is recorded in the test's lineage header, which
also carries the pre-existing steps — including the 250→1000 pulse-budget step that moved
the count 9,911 → 10,690 before this change (the 9,911 figure is a budget-250-era
measurement). The pin (`PIN = 1,231,601` upper bound) is unchanged, and the light boot
lineage (459,134 pops, ADR 0007) is untouched (drain cadence unchanged).

## Alternatives considered

- **In-loop stride check** — `worldTime.advance(STEP); if (worldTime.tick % 30 === 0)
  sim.tick(...)` inside the substep loop. Rejected: it moves the pulse to *before*
  `tickStreaming()` in frame order, so cells seeded by a frame's streaming settle wait a
  full pulse (0.5 s) for their first drain (cave-fill converges one pulse later), and the
  pulse interleaves with the player's substeps. The crossing check keeps the pulse's frame
  slot.
- **Sim-time accumulator** — keep `waterAcc` but advance it by `STEP` per substep instead
  of clamped `dt`. Rejected: the phase still floats (the remainder is dropped at every
  pulse, the boundary walks with accumulation history); it is not a true stride on the
  tick lattice and gives a weaker determinism argument.
- **A dedicated `SimClock` module** — extract time + phase + tick into a new module that
  `WorldTime` becomes. Rejected as out of scope: the tick seam is all the off-thread light
  project needs; it remains an option if a third clocked system arrives.

## Consequences

- ADR 0008's open follow-up (align the simulation clocks on one tick system) is resolved
  by this ADR.
- Water pulse cadence is nominally unchanged (one per 0.5 s — now *simulation* seconds,
  and exactly 20 per 10 s where the float accumulator managed 19); a pulse's exact *frame*
  is anchored to the tick lattice instead of walking with accumulation history.
- Off-thread light settle/propagation (TODO.md — Sky & lighting) is the next project to
  consume this heartbeat: its message protocol will carry tick numbers, and a future
  server owns the tick sequence.
- Performance: unchanged. One `floor` comparison per frame; the pulse's work and cadence
  are as before.