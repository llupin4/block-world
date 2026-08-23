# Design (draft): water simulation offloaded to the sim worker

- **Date:** 2026-08-22
- **Status:** draft (written alongside the light-worker project as its sibling deliverable;
  updated with that project's implementation lessons; final review at the end of the
  light-worker project). Not yet implemented.
- **Depends on:** ADR 0012 — Light simulation on a web worker (the worker, the mirror, the
  protocol, the client, and the debug surface exist; this project extends them).

## Context

ADR 0012 moved the light sim off the main thread: a pin-identical engine over a chunk-field
mirror, a tick-numbered structured-clone protocol, and a main-thread client
(`src/light-transport.ts`) that applies replies into the real `Chunk` objects. The water
sim (ADR 0005 — Water simulation) is the remaining simulation work on the main thread: the
1,000-cell pulse every 30 ticks (ADR 0011's stride, `WATER_PULSE = 1000`) and the
per-chunk load settle. Individually small, but the same string-queue churn pattern (the
water queue is the same array+Set design), and its state feeds the mesher's water surfaces
exactly as the light fields do — the water analog of ADR 0012's offload.

## Scope

**In:** move `WaterSim` off the main thread through the existing worker; record the
decision in ADR 0013; resolve the follow-up.

**Out (deliberate):** any change to the water rules or budgets (`WATER_PULSE = 1000`,
`WATER_STRIDE = 30`, the settle guard — unchanged); the worldgen/meshing worker (a
separate TODO item).

## Decision (settled at design time)

**One worker, both sims.** The light worker evolves into the sim worker:
`light-worker-core.ts` → `sim-worker-core.ts` (`SimWorkerState` owns both the `LightSim`
and the `WaterSim` over the same mirror); `light-worker.ts` → `sim-worker.ts`;
`LightClient` → `SimClient`. One lifecycle, one mirror, one `load` message feeding both
engines. The light/water queues are independent and the sims never touch each other's
state (ADR 0007), so the interleaving within one worker changes nothing — and there is no
parallelism to gain from a second worker (a 1,000-cell pulse per 30 frames vs a
512/frame drain).

**The mirror gains the water state.** `MirrorChunk` gains `wlevel`, `wsource`, `wplaced`,
`wstream` (each `Uint8Array(4096)`) + the water `settled` flag. The `load` message gains
the chunk's initial `wlevel`/`wsource`/`wplaced`/`wstream` (worldgen's water — the water
engine's state, exactly as `blight`/`skylight` are light's; main keeps ownership of its
own copies for the mesher until the replies land). The pushed fields gain **`wlevel`,
`wsource`, `wstream`** — the three the mesher reads via `World.getWaterHeight` (water
surface height, skirt compares) — for changed chunks; `wplaced` is engine-internal (like
`colSum`) and never pushed.

**Pulse pacing stays on main — the ADR 0011 seam, exactly as designed.** Main keeps the
`tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)` decision; on a pulse frame it
posts `{ t: 'wtick', tick, budget: WATER_PULSE }` (the water drain message), and nothing
on non-pulse frames. Load-settles stay event-driven via `load` (the worker runs each
engine's settle on the load message). The water `touched` merge moves to the client's
reply — the same one-frame-late pattern as light (frame N's re-mesh consumes the reply to
tick N−1; `REBUILD_BUDGET` + the water-convergence argument, ADR 0005/0012).

**First-mesh deferral is shared.** ADR 0012 already defers a new chunk's first mesh to the
frame-end budgeted path; the water's settled `wlevel` arrives with the same reply, so the
deferred mesh reads water that is *fresher* than today's inline mesh (settle + the first
pulse drain). No new change.

**Determinism.** The engine-level 10,690 lineage (`water-load.test.ts`) is untouched —
`src/water.ts` stays pin-identical (the settle path gains the fresh-settle `touched` mark,
below — a mark, not a pop, so the 10,690 process pin holds). Water's fresh settle has the
same no-process direct-write pattern that forced light's 705c663 touched-mark:
`WaterSim.settleSeed` (src/water.ts:193) bulk-writes `wlevel`/`wsource`/`wplaced`/
`wstream` straight into the chunk arrays (lines 198–201) with no queue write and no
re-mark, and the engine's only `touched`-marking path, `setState`'s block-change branch
(lines 150–151), a water-fields-only settle never takes — so a fresh settle with zero
queue-driven changes (a sealed water chunk: pass 2 enqueues nothing, lines 209–233, and
the settle drain pops nothing, lines 615–623) never enters `touched`, and under the
reply's push contract (fields are pushed for `touched` chunks only,
`light-worker-core.ts:119–126`) its settled water fields would never reach main — main's
copies stay pristine (l=0) and the mesher's `getWaterHeight` reads 0: water's
dark-surface analog. Design requirement: the same fresh-settle `touched` mark is required
in `WaterSim`'s settle path, for the same reason (705c663). The worker-core equivalence
test gains a water arm: the same boot replay sequence driven through the protocol →
identical `wlevel`/`wsource`/`wstream` fields + identical cumulative water stats; the
10,690 pin is re-verified through the protocol (the same assertion shape as the light
459,134).

## Tests (shape)

- Engine: `water.test.ts` / `water-load.test.ts` byte-identical, untouched (the pins).
- Worker core: the existing light equivalence test becomes the sim equivalence test (both
  engines, one op sequence); a water arm asserts `wlevel` field identity + stats; edges
  mirror light's (unload/reload, duplicate load, edit on a missing chunk — water edits
  carry the new block + the cell's water state, since `WaterSim.edit` takes the new block
  and re-derives).
- Transport: `applyLightResult` gains the water arrays (or a sibling `applySimResult`).
- Browser acceptance: stationary-spawn parity on the water process count via the debug
  handle — a band around the worker-path count, not an exact match (the node boot-replay
  equivalence test pins the per-path lineage; the worker path may differ from the inline
  10,690, as light's did — 459,134 inline vs 434,883 worker, the one-time redundant boot
  wave the mirror skips; production's 2 Hz water pulses shift remesh-op timing versus the
  node replay's collapsed drains — a few %), plus the scene check (water-settled surfaces
  on load, not an exact number); free play — placement/drain pace unchanged at the 0.5 s
  pulse cadence (ADR 0011), cave fills read the same.

## Documentation (at its implementation)

ADR 0013 — Water simulation on the sim worker; ADR 0005's Consequences (a worker
follow-up line, if added there); the ADR README index; the TODO item.
