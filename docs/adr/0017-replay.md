# 0017. Replay — a session is a snapshot + a delta-coded intent log, played back deterministically on a fresh world

- **Status:** Accepted
- **Last updated:** 2026-09-06
- **Sources:** `docs/superpowers/specs/2026-09-06-replay-spectator-playback-design.md`,
  `docs/superpowers/plans/2026-09-06-replay-spectator-playback.md`
- **Extends:** ADR 0015 (the entity/sim model, the `Controller` pull interface, and the
  deterministic `SimRng`) and ADR 0016 (the sim-owned tick-ordered randomness, `baseController`,
  and the single spectator ghost), all of which phase 1/2 left in place precisely for this phase.

## Context

ADR 0015 made every world change flow through intents on the tick (`applyIntent`), and ADR 0016
made the sim deterministic (a fixed id-order `tick` + a sim-owned, tick-ordered `SimRng`). The
consequence: a whole session is re-derivable from an **initial snapshot + an intent log** — no
per-tick state is needed, because every state change is an intent. Phase 3 captures that
invariant concretely. Record a session (`R`), persist it to IndexedDB, and play it back
**deterministically** on a fresh world. The **spectator** (ADR 0016's single ghost) can watch a
playback with its own live human controller — which, because the kind is `canEdit: false`, emits
no world-changing intents — so it never perturbs the replay. The **round-trip determinism test is
the load-bearing invariant**: record a session, replay it on a fresh world, and assert every
loaded chunk's arrays and every entity's transform are byte/`1e-9` identical (and that seeking
re-simulates to the same state).

## Decision

**The model (`src/replay.ts`).** A `Replay` is `{ seed, startTick, endTick, simPrng, events,
intents, snapshot }`. The `snapshot` reuses ADR 0014's shapes (`ChunkRecord[]` + `WorldMeta`) so
a replay restores exactly like a saved world. The `intents` are **delta-coded**: an `IntentEntry`
is `{ tick, entityId, intent }`, and an entity with no entry at a tick **repeats its previous
intent** (`intentEqual` compares the optional fields — `select`/`block`/toggles — with sentinels
so "absent" and "present-but-default" differ). An idle entity logs nothing, so a quiet session is
small. The `events` are spawn/despawn: a spawn carries the entity's `pose` (via `sim.toRecord(e)`)
so playback can re-spawn it mid-session; a despawn carries only the id (despawns are re-derived by
the sim's fall-out-of-world rule, so only spawns need re-applying). `simPrng` is the sim PRNG state
at **record start** (restored before replaying).

**The `Recorder`.** `attach(sim)` wires the sim's `onIntent`/`onSpawn`/`onDespawn` hooks (ADR
0015's sim now exposes them). The `onIntent(tick, e, it)` callback delta-codes: it logs an intent
only when it differs from the entity's last logged intent. The snapshot + `simPrng` + `startTick`
are captured at **record start** (the initial state); `endTick` + the log are read at record stop.

**The `ReplayController`.** A pull-model controller (implements `Controller.intent(e, tick)`)
that returns the LAST logged intent with `tick <= T` (the "no entry means repeat previous"
semantic; `NULL_INTENT` before the first entry). During playback every entity's controller is
replaced with a `ReplayController` holding that entity's logged intents, so the sim's fixed
id-order `tick` drives the world **deterministically from the log** — no human input, no
interface change (the `Controller` interface stays pull-only).

**Persistence.** A **second IndexedDB object store** (`replays`), added at a **DB version bump to
2**. An existing v1 browser DB never fires `onupgradeneeded` on a v1 open, so the store would
silently never be created for returning users (the fresh-DB node test masks this); at v2 a v1
user's DB fires `onupgradeneeded` (v1 → v2) and `replays` is created. `Persistence.saveReplay` /
`loadReplay` are error-tolerant (D7: a store failure is a no-op). Key: `${seed}:replay:${startTick}`.

**The browser (`main.ts`).** `R` toggles recording (capture the snapshot/PRNG/tick at start, wire
the `Recorder`; on stop, build the `Replay` and `saveReplay`). `?replay=<key>` loads a replay and
**skips the boot spawn/restore** — a boot-spawned player id 1 would shadow the snapshot's entity id
1 — and instead restores the snapshot: chunk arrays via `applyRecord` (the 2-arg form), water via
`waterSim.restore`, light via `lightSim.load` (never persisted — the worker re-settles it),
entities via `sim.restoreEntities` with the `ReplayController` factory, the PRNG via
`sim.rng.restore(replay.simPrng)`, the world time via `worldTime.restore`. The frame loop's substep
is **unchanged** (`sim.tick` + `worldTime.advance`); playback just uses `ReplayController`s plus a
pause/end check. The camera follows the spectator ghost (`sim.setViewed(ghostId)`), and the ghost's
look **head-follows the live mouse** (`human.getLook()` → the ghost's `yaw`/`pitch`), so the
spectator can look around the recorded world without touching it. A scrub HUD (`#scrub`) shows the
recording/playback state + the current tick.

## Alternatives

- **A push-model `setIntent` (the sim feeds the controller the intent).** Rejected: the
  `Controller` interface is pull-only (`intent(e, tick)`); a `ReplayController` that *reports* the
  logged intent is simpler and needs no interface change or a new sim path.
- **A full per-tick state log (no delta coding).** Rejected: every state change is already an
  intent (ADR 0015), so the snapshot + delta-coded intent log is the minimal complete record; a
  per-tick snapshot is `startTick..endTick` copies of the world.
- **A separate replay database.** Rejected: a second object store in the same DB (a version bump)
  is simpler and keeps the per-seed key space in one place.
- **Reusing the saved-world store for replays.** Rejected: replays and world snapshots have
  different lifetimes/keys (`seed:replay:startTick` vs `seed:cx,cy,cz`) and the replay's chunk
  arrays are a one-shot snapshot, not the live edited-chunk set.

## Consequences

- **Determinism is the load-bearing invariant.** The round-trip test (record → replay on a fresh
  world: byte/`1e-9` identical for every loaded chunk's arrays and every entity's transform) plus a
  seek test pin it. Any nondeterminism the test finds is a **sim bug to fix, not a paper-over in
  the replay** (likely suspects: `Set`/`Map` iteration that depends on insertion timing across
  frames, `performance.now()` leaking into sim state). The light is **excluded** — it does not
  affect sim state (the worker re-settles it on load).
- **The spectator is non-perturbing.** Its kind `canEdit: false` means its live human controller
  emits no world-changing intents, so watching a playback never perturbs it. The head-follow is
  cosmetic (the ghost's look follows the mouse; its position is the recorded world's).
- **The snapshot covers the recorded area.** A replay is fully deterministic for the chunks in its
  snapshot; a playback that streams a *new* area beyond the snapshot re-generates the terrain
  (deterministic per seed) and re-settles the light/water. Short sessions (the player stays in the
  spawn area) are fully deterministic end-to-end.
- **The scrub HUD is minimal.** Pause + the current tick ship now; **seeking** (re-simulate from
  the snapshot to tick `T`) is deferred — a full re-simulation is expensive and the MVP does not
  need it.
- **Multiplayer is unblocked.** The replay model (a shared snapshot + a per-player intent log) is
  the foundation for multiplayer: a shared initial snapshot + one delta-coded intent log per
  player is the minimal complete shared state. Tracked in the multiplayer follow-up.