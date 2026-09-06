# 0015. Entities & controllers — the player is an entity driven by a controller; world edits flow through the sim (applyIntent), not the camera

- **Status:** Accepted
- **Last updated:** 2026-09-06
- **Sources:** `docs/superpowers/specs/2026-09-06-entities-controllers-design.md`,
  `docs/superpowers/plans/2026-09-06-entities-controllers.md`
- **Supersedes:** the single-`Player` interaction model in ADR 0004 (the class and its
  physics survive; the player *is now* an entity with a controller, and the edit path is
  sim-owned). Extends ADR 0014 (persistence) to `v: 2` records/meta.

## Context

ADR 0004's `Player` is a one-off: a single object whose pose the camera mirrors and whose
mouse-driven raycast mutates the world directly. That model is a hard ceiling for the next
phase of the project — replay, spectator, and (phase 3) a remote human — all of which need
to say "this *entity* moved and edited, at this tick", not "the camera pointed here and the
mouse clicked". Two things forced the change:

- **The camera is a render-side concept, not an identity.** The break/place raycast
  originates from `camera.position` + `camera.getWorldDirection`. A replay or a second
  player has no camera of its own; the action has to be attributable to an entity (its eye,
  its look, its held block) so it can be re-derived and re-attributed independently of the
  local view.
- **There is exactly one player today, but the code assumes it.** `main.ts` scatters
  `player.` reads across the input, the actions, the camera, the water fx, the save point,
  and the loop. A second (idle, scripted, or later mob) entity has nowhere to live in that
  shape, and possession ("take over an entity") has no place to restore "who was driving it
  before".

What had to be preserved byte-for-byte: the player's feel (the pinned `player.ts`
constants and its bisection physics), the `player.test.ts` suite (a compatibility pin), the
`water-load` PIN (1,231,601 / 10,690), the `remesh-perf` gate, and the load-path budgets
(≤1 load + ≤1 remesh/frame, ADR 0002).

## Decision

**The model (`src/entity.ts`).** A kind-parameterized `Entity`:

```
EntityKind { id, half, height, eye, walkSpeed, swimSpeed, jumpVel, flySpeed, flyVSpeed,
             canFly, canNoclip, canEdit, collides }
Entity     { id, kind, pos, vel, yaw, pitch, onGround, inWater, headInWater, fly, noclip,
             controller, baseController }
Intent     { forward, strafe, up, down, yaw, pitch, primary, secondary, select?, block?,
             toggleFly?, toggleNoclip? }
Controller { intent(e, tick): Intent }
```

`Entity` has a stable, monotonic `id` assigned by the sim; `pos` is the feet; `yaw`/`pitch`
are **absolute** look. `baseController` is the controller at spawn — what un-possessing
restores (phase 2). `KINDS.player` is built from the old `player.ts` exports (`WALK_SPEED`,
`SWIM_SPEED`, `FLY_SPEED`, `FLY_V_SPEED`, `JUMP_VEL`, `HALF`, `HEIGHT`, `EYE`); gravity is
the shared `GRAVITY` constant. `player.ts` stays the single source of those numbers, and
its `Player` class + `player.test.ts` are untouched — `stepEntity(playerKind)` is pinned to
reproduce `Player.update` at 1e-9 (300-tick equivalence test).

**The sim heartbeat (`Sim.tick`).** One substep per call: for each entity **in id order**,
ask its controller for an `Intent`, fire the (phase-3) recorder, run `applyIntent`, then
`stepEntity`. An entity steps only while **its own chunk is loaded** (otherwise it is
frozen — the streaming contract, ADR 0002). A fall-out pass then respawns the player to
`sim.respawn` (or despawns a non-player). Id order is what makes a scripted multi-entity
session deterministic (pinned by a two-bot 600-tick determinism test).

**The sim-owned action path (`applyIntent`).** The break/place/door/torch raycast moved out
of `main.ts` and into `entity.ts`: it casts from the entity's eye (`eyeOf`/`lookDir`,
`REACH = 6`) with a **capability gate** (`kind.canEdit`), and world mutations flow through
a `hooks` struct (`onEdit`, `waterEdit`, `springTarget`) that `main.ts` fills with
`remeshAround` + `lightSim.edit`, `waterSim.edit`, and the placed-spring test. `entity.ts`
never imports the water/light sims or the scene — the callbacks keep it dependency-light, so
the sim (and the replay it will drive in phase 3) stays a pure function of world + intent.
The crosshair still shows the break target, but from the **viewed** entity's eye
(`castBreakFromViewed`), not the camera.

**The controller (`HumanController`).** `main.ts` pushes hardware state into the shared
controller: the `keys` Set (read directly to build movement), `heldBlock` (synced per
frame), mouse deltas (`mouse` owns yaw/pitch + the `MAX_PITCH = π/2 − 0.01` clamp), and
one-tick edges (`primary`/`secondary`/`toggleFly`/`toggleNoclip`/`select`). `intent()`
reports each edge for exactly one substep, then clears it — a frame running up to six
substeps consumes the edge once. `IdleController` is the null-movement intent holding the
entity's current look; `ScriptController` is a deterministic behavior list for tests/bots.
The camera, the water mood, the streaming anchor, and the save point all read the **viewed**
entity (`sim.viewed()`), never a hard-coded player.

**Persistence `v: 2`.** `ChunkRecord.v` bumps to 2 and gains an optional `entities?:
EntityRecord[]`; `WorldMeta.v` bumps to 2 and replaces `player {x,y,z,yaw,pitch}` with
`entities: EntityRecord[]`, `viewedEntityId`, and an optional `simPrng`. A `v: 1` meta
migrates on read: the saved player pose becomes a single viewed entity (id 1, `human`
controller). `EntityRecord` is a plain, serializable snapshot (`id`, `kindId`, pos/vel,
look, `fly`/`noclip`, `controllerKind`) — `entity.ts` exports the type, `persistence.ts`
imports it (no cycle). Frozen, non-viewed entities are restored on the `IdleController`.
The IndexedDB backend bumps to `version = 2` (the `onupgradeneeded` create-store is idempotent
across the bump).

**The sim PRNG now (unused in phase 1).** `SimRng` (the pinned mulberry32 twist from
`terrain.ts`, `deriveSimSeed = seed ^ 0x5eed1234`) lives on the sim and is snapshot/restored
in the meta (`simPrng`). Phase 1 draws nothing from it; it exists so phase 2's mob spawning
is reproducible and restore-able.

## Deliberate deviations from the brief's model

All four are recorded in the spec and are deliberate, not accidents:

- **`Intent.block`.** The brief's `Intent` carries no payload for a placement; `applyIntent`
  needs the block id to write. It is the held block the controller reports.
- **`EntityKind.flySpeed` / `flyVSpeed`.** The brief's kind table omits the fly speeds; the
  player kind needs the old `FLY_SPEED` (13.0) / `FLY_V_SPEED` (8.0) to keep fly feel
  byte-identical, so they live on the kind.
- **Sticky absolute look.** `Intent.yaw/pitch` are absolute, and a controller that wants to
  "hold still" must report the entity's **current** look (an `IdleController` returning yaw 0
  would snap every idle entity to face −Z). This is what makes replay and remote driving
  unambiguous.
- **`select` reported but unwired in phase 1.** `Intent.select` is populated (so phase 3's
  replay captures the hotbar change), but the sim's `onSelect` hook is **not** wired; the
  hotbar is still driven directly in `main.ts`.

## Alternatives

- **Keep the camera as the action source of truth.** Rejected: it ties every edit to a
  render-side object with no identity, which breaks replay and remote players (a second
  entity would have to fabricate a camera). Casting from the entity's eye is the only shape
  that re-derives cleanly.
- **Thread `sim` into `applyIntent` directly.** Rejected: `applyIntent` would then import the
  water sim, the light client, and the remesh pass — coupling the pure sim to the scene and
  to `main.ts`. The `hooks` struct inverts the dependency and keeps `entity.ts` testable in
  isolation.
- **A thin `Player` wrapper around an entity.** Rejected: the constants are already
  re-exported from `player.ts` as the single source, so the old file stays; a wrapper would
  duplicate the numbers and the physics instead of reusing `stepEntity(playerKind)`.
- **Migrate `player.ts` into `entity.ts` and delete it.** Rejected for phase 1: `player.test.ts`
  is a compatibility pin, and `stepEntity` is verified *against* `Player.update`; keeping the
  class lets the equivalence test stay an oracle. Phase 2 may retire it once mob kinds make
  the legacy path dead.

## Consequences

- **`player.ts` + `player.test.ts` stay (a compatibility pin).** The `Player` class is no
  longer instantiated by `main.ts`, but it remains the oracle for the `stepEntity(playerKind)`
  1e-9 equivalence and the single source of the pinned constants.
- **The camera is a follower, not an authority.** `syncCamera` / `syncWaterFx` / streaming /
  save all read `sim.viewed()`; the camera position and the water mood derive from the viewed
  entity every frame.
- **A ≤ 1-substep edit skew is accepted.** The intent (and thus the break/place origin) is
  sampled at the START of a substep, then `stepEntity` moves the entity; an edit can land up
  to one substep of motion stale. Documented; negligible at 60 Hz.
- **Entities ride the edited-only persistence gate `[POC shortcut]`.** A chunk's frozen
  entities are snapshotted only when the chunk is written — i.e., only when it is `edited`
  (ADR 0014's gate). Entities in a chunk the player never edited are NOT persisted and
  re-spawn from the (phase 2) rules on load; the follow-up is a chunk-agnostic entity store.
- **Two version bumps, one migration.** `ChunkRecord` and `WorldMeta` are both `v: 2`, the
  IDB store is `version = 2`, and a `v: 1` meta migrates to a single viewed player (pinned by
  the Task 6 migration test). Old `v: 1` chunk records restore with no entities (no-op).
- **The pins hold.** `player.test.ts` is untouched; the `water-load` PIN (1,231,601 / 10,690)
  and the `remesh-perf` gate are unchanged (the water sim is only *renamed* to `waterSim`; its
  settle/restore/tick/touched contract is identical); the load-path budgets and the
  `?prof=remesh` rig (which now pins the viewed entity) still pass.
- **Determinism is now a property of the sim.** Id-ordered `tick` + a seeded `SimRng` + the
  absolute-look `Intent` give a re-derivable, replay-able session (the two-bot determinism
  test is the phase-1 proof).