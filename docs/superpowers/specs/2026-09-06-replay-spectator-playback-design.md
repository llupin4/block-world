# Spec: replay & spectator playback — a replay is a snapshot + an intent log

Status: design (2026-09-06). Phase 3 of 3. Builds on ADR 0015 (entities & controllers) and
ADR 0016 (mobs, possession, spectator). Durable record after implementation: ADR 0017 —
Replay.

## Goal

Because every state change now flows through intents on the tick, a **replay is an initial
snapshot + an intent log**. Record a session (`R`), persist it to IndexedDB, and play it
back **deterministically** on a fresh world. The **spectator** can view a playback with its
own live human controller (which emits no world-changing intents, so it never perturbs the
replay). The **round-trip determinism test is the whole point**: record a 1200-tick session
(a bot building, a dolt wandering, a spring placed), play it back on a fresh world, and
assert every loaded chunk's arrays and every entity's transform are byte/1e-9 identical.

## What must be true

1. The phase 1/2 gates stay green (the whole node suite, `water-load`, `mesher-budget`, the
   determinism baselines).
2. **Round-trip determinism:** record → replay on a fresh world is byte/1e-9 identical for
   every loaded chunk's arrays and every entity's transform; and **seeking** (replay to tick
   `T`, snapshot, replay to `T` from that snapshot) matches.
3. `R` starts/stops recording; a recording is written to IndexedDB under
   `${seed}:replay:${startTick}`. `?replay=<key>` loads and plays one with a minimal scrub
   HUD (pause, ×1/×4, step).
4. During playback the spectator is viewable with its live human controller; its intents
   change no world state (the kind `canEdit: false`), so it cannot perturb the replay.
5. **Any nondeterminism the test finds is a sim bug to fix, not a paper-over in the replay.**
   Likely suspects: `Set`/`Map` iteration order that depends on insertion timing across
   frames (the water queue is tick-strided — fine — but anything that iterates
   `world.allChunks()` for physics must be checked), `performance.now()` leaking into sim
   state, and light (excluded — it does not affect sim state).
6. `npm test` and `npm run build` green.

## Model (`src/replay.ts`)

```ts
interface IntentEntry   { tick: number; entityId: number; intent: Intent }   // delta-coded
interface EntityEvent   { tick: number; type: 'spawn' | 'despawn'; id: number;
                          kindId?: string; pose?: EntityRecord }
interface ReplaySnapshot{ chunks: ChunkRecord[]; meta: WorldMeta }           // reuse ADR 0014 shapes
interface Replay {
  seed: number; startTick: number; endTick: number;
  simPrng: number;               // the sim PRNG state at record start
  events: EntityEvent[];
  intents: IntentEntry[];        // an entity with no entry at a tick REPEATS its previous intent
  snapshot: ReplaySnapshot;      // every loaded chunk + the WorldMeta at record start
}
```

- **Delta-coding:** `Recorder` captures `{ tick, entityId, intent }` **only when the intent
  differs from that entity's previous one**. An entity with no entry at a tick repeats its
  previous intent (so an idle bot/mob or a held look logs once). `intentEqual` compares the
  intent fields (the optional `select`/`block`/toggles are compared with a sentinel).
- **`Recorder`** hooks the sim (phase 1 added `sim.onIntent`): it records intents
  delta-coded, and records spawn/despawn `events` (via `sim.onSpawn`/`sim.onDespawn`, added
  in this phase; a spawn event carries the entity's pose so playback can re-spawn it). The
  record `startTick` is supplied to the `Recorder` and stamped onto the `Replay` by the caller.
- **`ReplayController`** feeds one entity its logged intents: at tick `T` it returns the
  last logged intent with `tick <= T` (the "repeat previous" semantic); before the first
  entry it returns `NULL_INTENT`. Entities with **no** logged intents run their **default**
  controller (dolt → `MobController`, player → `IdleController`), which are deterministic
  given the restored PRNG.
- **Snapshot** reuses `snapshotChunk`/`applyRecord` (ADR 0014) — **no new format**. It is
  the persistence records of every **loaded** chunk + the `WorldMeta` at record start.

## Determinism (what the sim must guarantee)

- All randomness from `sim.rng` in the sim's fixed **id-order** (ADR 0016) — never
  `Math.random`, never a wall clock.
- No `dt`/`performance.now()` in sim state (the substep is the fixed `STEP`).
- No insertion-order-dependent `Set`/`Map` iteration for physics (check
  `world.allChunks()` consumers; the water queue is tick-strided — fine).
- Light is **excluded** from the comparison (it does not affect sim state).

## IndexedDB (`src/idb-store.ts` + `src/persistence.ts`)

- A new **`replays`** object store (v2) alongside `chunks`. Key = `${seed}:replay:${startTick}`.
Value = the `Replay` (delta-coded log + events + the snapshot records; the nested
   `Uint8Array`s survive structured clone). A separate `ReplayStore` interface
   (`putReplay`/`getReplay`) is defined in `replay.ts`; `IndexedDBChunkStore` structurally
   satisfies both `ChunkStore` and `ReplayStore` (**`ChunkStore` itself is unchanged**).
   `Persistence` gains an optional `replayStore` + `saveReplay(key, replay)` /
   `loadReplay(key)` (error-tolerant, D7).
- `[POC shortcut]` intents are stored raw (delta-coded, not compressed); the snapshot reuses
  the persistence records verbatim; seeking re-runs from the snapshot (no keyframe deltas).

## Playback + spectator (`src/main.ts`)

- **`?replay=<key>` boot ordering:** on boot, if the `replay` param is present, **skip the
  normal spawn/restore** (a boot-spawned player id 1 would otherwise shadow the snapshot's
  entity id 1) and instead load the replay: apply its snapshot to the current (freshly
  booted) `World` + `Sim` — the loaded chunk arrays, `sim.rng` restored to
  `replay.simPrng`, and the snapshot's entities (entities with logged intents get a
  `ReplayController`; a dolt gets a fresh `MobController` bound to the restored PRNG; the
  single spectator is left for the live controller below) — and enter **playback mode**.
- **Spawn events are replayed:** the snapshot only holds entities present at record start.
  Entities that **spawn during** the session (a dolt on a chunk load) are carried as spawn
  `events`; the playback loop processes them, spawning each at its event tick (from the
  event's pose + its controller), so a mid-session dolt re-spawns at the same tick. (Despawn
  events are re-derived by the sim's fall-out-of-world rule and are not re-applied.)
- **Playback loop:** the frame loop advances the replay one tick at a time (×1), four per
  frame (×4), or on `step` (one tick); pause stops it. The camera follows the **live
  spectator** (below), not the recorded viewed entity.
- **The spectator is live:** the single spectator entity is **not** given a
  `ReplayController` — it keeps the live `human` controller during playback (the viewer is a
  free ghost). Its kind is `canEdit: false`, so its `primary`/`secondary` produce no world
  edits (`applyIntent` returns after the toggles) — it cannot perturb the replay. The
  recorded viewed entity is still stepped by its `ReplayController`/default controller; the
  camera just isn't attached to it.
- **Scrub HUD (minimal):** a small bar with the tick counter and pause / ×1 / ×4 / step.

## The determinism test (the gate)

- A **node** test: build a world (floor + a wall a bot builds on + a spring spot), spawn a
  bot (`ScriptController`: dig N, place N, wait), a dolt (`MobController` wandering), and a
  player (`ScriptController`: place Water once, wait). Attach a `Recorder`, take the
  snapshot, run 1200 ticks (entity sim + water sim + world time, all driven identically).
  On a **fresh** world: apply the snapshot, restore the PRNG + entities (ReplayController
  for logged entities, default for the dolt), run 1200 ticks. Assert every loaded chunk's
  arrays are byte-identical and every entity's transform matches to 1e-9.
- A **seek** test: replay to tick `T`, snapshot the sim state, then from that snapshot
  replay to `T` again — identical.

## Non-goals

- Multiplayer / networking / any transport. (The TODO item is reframed: multiplayer =
  "remote controller + intent transport + host authority over the water/mob PRNG".)
- No compression beyond delta-coding. No replay editing. No multiplayer authority yet.

## Pinned numbers

All phase 1/2 pins unchanged (`STEP 1/60`, `TERRAIN_SEED 1234`, the dolt/spectator kinds, the
water `WATER_STRIDE 30`/`WATER_PULSE 1000`, the `water-load`/`mesher-budget` pins). The
replay round-trip is pinned at **1200 ticks**; the comparison is byte-identical for chunk
arrays and 1e-9 for entity transforms.