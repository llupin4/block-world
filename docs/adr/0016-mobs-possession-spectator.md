# 0016. Mobs, possession & spectator — a deer kind with wander AI, drive-any-entity possession, and the single spectator ghost

- **Status:** Accepted
- **Last updated:** 2026-09-06
- **Sources:** `docs/superpowers/specs/2026-09-06-mobs-possession-spectator-design.md`,
  `docs/superpowers/plans/2026-09-06-mobs-possession-spectator.md`
- **Extends:** ADR 0015 (the entity/sim model, the sim-owned `SimRng`, and `baseController`,
  all of which phase 1 left in place precisely for this phase).

## Context

ADR 0015 made the player an entity driven by a controller and left two seams open for exactly
this work: the sim's fixed id-order `tick` + the seeded `SimRng` (a deterministic, replay-able
randomness source), and `Entity.baseController` (what un-possessing restores). Phase 2 fills
them with the first non-human entity — the **deer**, a grazing quadruped — and the **possession**
verb: the local human may drive *any* entity (a deer, or the spectator **ghost**), not just
their own body. Three things constrained the design:

- **Replay (phase 3) is the load-bearing invariant.** Every random the sim consumes — deer
  wander turns, spawn rolls — must be re-derivable from `(world, seed, load order)`. `Math.random`
  and wall clocks are banned from the sim; the only randomness is the sim-owned, tick-ordered
  `SimRng`, drawn in the sim's fixed id-order iteration.
- **The deer must not be a pathfinder.** The brief's non-goals exclude global navigation; the
  deer only needs local obstacle avoidance (don't swim, don't fall) and a plausible wander.
- **Capabilities belong to the kind, not the controller.** Whether an entity can edit, fly,
  or noclip is a property of its `kind` (ADR 0015's `applyIntent` capability gate), so a
  possessed deer *cannot* break blocks even though it is now driven by the human controller.

## Decision

**Two new kinds (`KINDS.deer`, `KINDS.spectator`).** The deer is a low quadruped (half 0.45,
height 0.9, eye 0.7, walk 1.6, `jumpVel 8.0` so it clears a 1-block ledge, `canEdit`/`canFly`/
`canNoclip` all false, `collides` true). The spectator is a non-colliding ghost (half 0.3,
height 1.8, eye 1.62, fly speeds 8/8, `canFly`/`canNoclip` true, `canEdit` false, `collides`
false) — it flies straight through the world and cannot edit. The capability split is the
point: possession re-attaches the *human controller*, but the *kind* still forbids editing and
drives the collision.

**The wander AI (`MobController`).** A two-mode state machine (wander / idle) that turns every
tick on the sim's fixed `id` lattice. It draws *every* random from the sim PRNG passed in at
construction (`() => sim.rng.next()`) — the sim's id-order iteration is what makes the draw
sequence deterministic. It walks a random run of ticks, pauses, re-faces (sometimes toward the
nearest grass), and refuses a step that would enter water or drop ≥ 3 blocks (`mobRefuseStep`,
a pure `(getBlock, x, y, z, yaw) -> 'water' | 'drop' | null`). A stall counter — accumulated on
*any* low-progress tick, including a refused step — forces a random re-face after 30 stalled
ticks, so a deer backed into a wall or the side of a pit turns around rather than stalling
forever. `nearestGrass` is pure (a bounded radius scan for a grass cell with two air above).
A 1200-tick fixed-seed path test pins the determinism; a non-trivial-path test pins that it
actually wanders.

**Spawning (`spawn.ts`, deterministic per chunk).** `spawnDeer(world, sim, cx, cz)` rolls up
to `count` (default 2) deer into a freshly generated chunk, drawing every random from a
`SimRng` seeded from the chunk coords (`cx*73856093 ^ cz*19349663`) — so a given chunk always
gets the same deer. A spawn cell is grass with two air cells above at a plausible surface
height (`isDeerSpawnCell`). Spawning is **rebuilt-only** in `tickStreaming` (a *restored* chunk
already carries its persisted deer; re-rolling would double-populate and diverge from the
original session). On **unload**, the deer whose chunk just left are `sim.despawn`'d (they
persist via the phase 1 entity-ride, so they restore on walk-back). A 600-tick whole-session
test pins the spawn positions end-to-end. `[POC shortcut]` a deer rides the phase 1
**edited-only** chunk gate: a deer frozen in a chunk the player never edited is not persisted
(the same as an unedited chunk's water); the follow-up is a chunk-agnostic entity store.

**The box-part rig (`entity-mesh.ts`).** A per-kind part list (deer: body + head + four legs;
player: body + head + two legs; spectator: none — it renders no rig) built from
`THREE.BoxGeometry` meshes; each leg hangs from a hip pivot so it swings about the hip. One
material per kind, textured from a small deterministic **canvas part-atlas** (`buildPartAtlas`,
block-atlas-style speckle at a fixed seed — the rig looks identical across sessions/replays;
this is the phase 2 texture, not a punt). The **animation math is pure and node-tested**: the
leg phase advances by *horizontal speed* (`advanceRigAnim(anim, e, dt, rate)` =
`hypot(vel.x,vel.z) * dt * rate`) — **replay-safe** (no wall clock) — and `legAngles` returns
the four swings `[s, -s, -s, s]` (diagonal gait: FL+BR, BL+FR). The browser `syncEntityRigs`
passes each entity's `e.vel` in, places the rig at the feet, orients body by `yaw` + head by
`pitch`, and **hides the viewed entity's rig** (first person).

**Possession (`possess` / `returnHome` / `spectate`, pure, mutate the `Sim`).** Possessing
re-attaches the human controller to the target and releases the previously-viewed entity to its
`baseController`; the `Sim` remembers `homeId` (the player body) and `ghostId` (the single
spectator ghost). The body's `baseController` is set to `IdleController` at **both** fresh spawn
and restore, so a left-alone body stands idle instead of keeping the human controller. The
single ghost is spawned on fresh start and **only if none was restored** (it is a normal entity
and restores like any other — never a second ghost). `pickEntity` (slab/AABB intersection,
nearest entity box before the voxel, within `REACH`, excluding the viewed entity) drives both
the **crosshair** (a closer entity shadows the voxel highlight) and the **`P` handler** (possess
the aimed entity; else toggle body ↔ ghost). The two use the same cast so the crosshair and the
verb agree.

## Alternatives

- **A pathfinding deer.** Rejected: global navigation is a non-goal; local obstacle avoidance
  (water / ≥ 3 drop) + a stall-forced re-face covers the brief and keeps the deer cheap and
  deterministic.
- **A skinned / morph-target rig.** Rejected: beyond the brief (leg swing + head look); box
  parts with hip pivots give the gait read at a fraction of the cost.
- **A per-kind solid colour instead of the canvas part-atlas.** Rejected: the brief asks for a
  block-atlas-style texture, and a 32×32 deterministic speckle is cheap and keeps the deer
  reading as a block-world object rather than a flat toy.
- **`prevController` (remember the *current* controller) instead of `baseController`.**
  Rejected: `baseController` set at spawn/restore is equivalent for every controller the sim
  assigns, and is simpler (no re-attachment bookkeeping on each possess).
- **A dedicated "viewer" object instead of reusing the human controller.** Rejected: phase 1
  already made the human controller target the viewed entity; possession is just a controller
  swap, not a new concept.

## Consequences

- **Determinism is the load-bearing invariant.** The deer AI, the spawn rolls, and (phase 3)
  the replay all draw from `sim.rng` in the sim's fixed id-order — never `Math.random`, never a
  wall clock. The leg phase is driven by `e.vel` (replay-safe); the part-atlas speckle is a
  fixed seed (cosmetic, not sim state).
- **The deer is cheap by design.** No pathfinding, no steering; a bounded local refuse + a stall
  counter is the whole brain. Population is capped (≤ 6 by the spawn roll) and despawned on
  unload, so the sim's cost is flat.
- **Possession is a controller swap + a view change.** No new physics; the kind's capabilities
  (ADR 0015's `applyIntent` gate) decide what a possessed entity *can* do, so a possessed deer
  walks slow, hops one block, and cannot break.
- **The rig is additive; the pins hold.** The pure animation math is node-tested; the three.js
  mesh build + `buildPartAtlas` are browser-only (gate-verified). The phase 1 gate stays green
  (the `water-load` PIN and the `remesh-perf` gate are untouched — the rig is render-side), and
  `?prof=remesh` still passes.
- **Known punts `[POC shortcut]`.** (a) The node test transitively imports `three`
  (isomorphic — low risk). (b) `spawnDeer` draws from a per-chunk `SimRng` on chunk load
  (frame-timed) — deterministic per `(world, seed, load order)`. (c) The deer rides the
  edited-only chunk gate (a deer frozen in an unedited chunk is not persisted). (d) A deer frozen
  in an unloaded chunk reattaches its wander AI on walk-back via the same `controllerFor`
  factory (the `'mob'` case).
- **Phase 3 (replay) is unblocked.** Every random is sim-owned and tick-ordered, and the
  `baseController`/`homeId`/`ghostId` bookkeeping means a replay can re-derive possession and
  deer behavior exactly.