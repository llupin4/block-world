# Spec: mobs, possession, spectator — one deer, drive any entity, a spectator ghost

Status: design (2026-09-06). Phase 2 of 3. Builds on ADR 0015 (entities & controllers) and
the phase 1 model (`src/entity.ts`). Durable record after implementation: ADR 0016 — Mobs,
possession, spectator.

## Goal

Add one mob — a grazing quadruped, the **deer** — plus **possession** (drive any entity
with the human controller, including a spectator ghost) and the **spectator** kind. Every
state change still flows through intents on the tick; **all randomness is sim-owned and
tick-ordered** (never `Math.random`) so phase 3's replays stay deterministic. The deer is
the first non-player entity to be spawned, rendered, persisted, and possessed.

## What must be true

1. The phase 1 gate stays green: `player.test.ts` untouched, `water-load` PIN
   1,231,601 / 10,690, the `mesher-budget` pins, and the phase 1 2-bot determinism.
2. A box-part rig renders the deer (head, body, 4 legs) and the player (head, body, 2
   legs) from the same system; the viewed entity's own rig is hidden in first person.
3. **Mob controller determinism:** a fixed seed drives a deterministic deer path over 1200
   ticks; the deer refuses to step off a ≥ 3-block drop or into water; it turns when it is
   blocked for N ticks.
4. **Entity picking:** the crosshair ray hits the nearest entity AABB before the voxel hit.
5. **Possession:** `P` on a targeted entity attaches the human controller to it (viewed =
   it), remembers its previous controller; `P` with no target swaps to the spectator ghost;
   `P` on the body from the spectator (or when possessing) returns to the body. Un-
   possessing restores the previous controller.
6. A **600-tick fixed-seed spawn test** spawns a deterministic count at deterministic
   positions (grass surface, sky above, capped population in the view ring).
7. Browser: grazers wander near spawn, animate (leg swing from speed), and restore on
   reload in the same spots; possess one, walk it into a hole, leave it, and it wanders out.
8. `npm test` and `npm run build` green.

## Model additions (`src/entity.ts`)

Two new kinds join `KINDS` (phase 1's `player` is unchanged):

- **`deer`** — the grazing quadruped. `half 0.45`, `height 0.9`, `eye 0.7`, `walkSpeed
  1.6`, `swimSpeed 1.0`, `jumpVel 8.0` (clears one block; apex `8²/56 ≈ 1.14 m`), `flySpeed 0`, `flyVSpeed 0`,
  `canFly false`, `canNoclip false`, `canEdit false`, `collides true`. The deer cannot edit —
  possessing it means you see from 0.7 m up and break nothing.
- **`spectator`** — the ghost. `half 0.3`, `height 1.8`, `eye 1.62`, `walkSpeed 8`,
  `swimSpeed 5`, `jumpVel 0`, `flySpeed 8`, `flyVSpeed 8`, `canFly true`, `canNoclip true`,
  `canEdit false`, `collides false` (frees through everything; flies via `stepEntity`'s
  non-colliding branch). No rig.

`EntityRecord.controllerKind` gains `'mob'` (a restored deer reattaches a `MobController`).
`controllerKindOf` recognizes `MobController` → `'mob'`.

## MobController (wander AI, `src/entity.ts`)

One `MobController` per deer. A small state machine; **every draw is from the sim's PRNG**,
passed in at construction as `rand: () => number` (a closure over `sim.rng.next()`).
Determinism comes from the sim's fixed **id-order** `all()` iteration (phase 1) plus the
fact that each deer draws a number of randoms that depends only on its own (deterministic)
state — never `Math.random`, never a wall clock.

- **wander** — face a heading (`rand` angle), walk for a `rand`-chosen number of ticks
  (~90–240); then idle.
- **idle** — stand for a `rand`-chosen number of ticks (~30–90); on a `rand`-gated chance,
  turn toward the nearest grass surface cell within a small radius (a `world.getBlock`
  probe).
- **blocked** — if forward progress is below a threshold for M consecutive ticks (M pinned,
   e.g. 30), turn to a new `rand` heading (then wander). The stall counter accumulates on
   **any** tick with low forward progress — including a step the refusal rules just blocked
   (water / a ≥3 drop) — so a deer facing water or a cliff turns within M ticks rather than
   waiting for its wander timer to expire.

Refusal rules (evaluated before committing a forward intent): do not step into a cell that is
water, and do not step off a **≥ 3-block drop** (probe three cells below the foot-ahead
point; if all three are air and the drop is ≥ 3, hold). `stepEntity` still does the actual
collision; the controller just refuses the obvious holes and water. The controller emits
`{ forward, yaw }`; the sim applies it.

Construction: `new MobController(world, rand)` where `world` is a `{ getBlock }` accessor
and `rand` is the sim's PRNG draw (`() => sim.rng.next()`). No `opts` — the wander/idle tick
ranges and the stall threshold are pinned constants (see the plan).

## Spawning (`src/spawn.ts` or inline in `main.ts`)

- At boot and on each **streaming load** of a new chunk column: roll for up to K deer in
  that chunk, under a **global population cap** within the view ring (track the live deer
count; stop spawning once at the cap — default **6**). A **spawn cell** is a grass surface
   cell (block = Grass, **two air cells above** — a cheap "sky" — and a plausible surface
   height, `y >= 3`) with the deer placed standing on it (feet at the grass top). Spawn only
   for **rebuilt** chunk columns (freshly generated, no saved record); **restored** chunks
   already carry their persisted deer and are **not** re-rolled (re-rolling would double-
   populate them). All spawn rolls draw from `sim.rng` (deterministic). `[POC shortcut]`
- **Despawn:** a deer despawns only when its chunk **unloads** (it persists with the chunk via
  the phase 1 entity-ride; it is restored on walk-back). A deer that walks out of the ring
  while its chunk is still loaded stays (frozen once its chunk unloads).

Pin: a 600-tick test with a fixed seed spawns a deterministic count at deterministic
positions.

## Rendering: `src/entity-mesh.ts` (box-part rigs)

- `buildEntityRig(kind)` returns a parent `Object3D` holding a small set of `Mesh` boxes
  from a **per-kind part table**: `{ name, size: [w,h,d], offset: [x,y,z] (from feet),
  pivot: [x,y,z] (leg/hip pivot, else 0) }`. The deer gets head + body + 4 legs; the player
gets head + body + 2 legs (a biped from the same table system). One material per kind,
   textured from a small **canvas part-atlas** in the same style as the block atlas (a
   speckled per-part tile per part; one shared part-atlas for both kinds). The atlas is a
   `THREE.CanvasTexture` built once (deterministic speckle from a fixed seed, so the rig
   looks identical across sessions) and shared by the kind's material.
- **Animation** is speed-driven (replay-safe — no wall clock): leg swing = `sin(phase)`
  about the hip pivot, where `phase += horizontalSpeed * dt * rate` (rate pinned per kind).
  Head follows pitch + yaw; body follows yaw only. `updateEntityRig(rig, e, dt)` sets
  position = `e.pos` (feet), body orientation from `e.yaw`, head from `e.yaw`/`e.pitch`, and
  the leg rotations from the accumulated phase (tracked per entity).
- The **viewed entity's own rig is hidden** while in first person (the camera is its eye).
  All other entities render in third person. Cheap: one material per kind, no skinning, no
  morph targets, ≤ 6 draws per deer.
- The spectator has **no rig** (`[POC shortcut]`).

## Possession & spectator (`src/main.ts` + `src/entity.ts`)

- The human controller is attached to exactly one entity at a time — the **viewed** entity
  (phase 1 already makes the camera + streaming anchor the viewed entity).
- **`P` (`KeyP`)** handler: cast the **entity-pick** ray (nearest entity AABB before the
   voxel hit, from the viewed eye; the viewed entity itself is excluded from the candidates).
   Cases:
   - **hits an entity `t`:** possess it. The **previous viewed** entity's controller is set
     back to its `baseController`; attach `human` to `t` (`t.controller = human`); set viewed
     = `t`. `baseController` is set at spawn to the entity's "home" controller: a deer's is
     its `MobController` (so un-possessing resumes its wander AI, keeping its state), a
     player body's is an explicit `IdleController` (so it stands idle when left), and a bot's
     is its `ScriptController` (so a bot keeps its script).
   - **no target, at the body:** swap to the **spectator ghost** — the body keeps its
     `baseController` (`IdleController`), the human moves to the ghost, viewed = the ghost.
   - **no target, not at the body (possessing a deer, or at the ghost):** return to the body
     — the entity just left gets its `baseController` back, the body's controller is set to
     `human`, viewed = the body.
   The three primitives `possess` / `returnHome` / `spectate` are pure functions that mutate
   the `Sim` (release the viewed to its `baseController`, attach `human` to the target,
   `setViewed`).
- **Capabilities are the kind's, not the controller's.** Possessing the deer means slow
  walk, one-block hop, no break, 0.7 m eye.
- **HUD:** a small label shows the viewed kind id (`player`/`deer`/`spectator`); when the
  viewed entity `canEdit` is false the **hotbar is hidden** (the deer/spectator can't place).
- There is always **exactly one spectator** entity (the ghost). It is spawned at boot **only
   if no spectator entity was restored** (the ghost is a normal entity, so it persists with
   the chunk / meta like any other and is restored on reload — booting must not spawn a
   second one). `Sim.ghostId` = the id of the single `spectator`-kind entity (derived by
   scanning `sim.all()` after boot/restore); `Sim.homeId` = the id of the `player`-kind body
   (derived likewise). Neither is stored in `WorldMeta` — both are re-derived from the
   restored entities, which keeps the "exactly one spectator" invariant across reloads.
   Possession is an in-session view + controller swap — the entities keep their positions
   (the sim owns them).

## Entity picking (`src/raycast.ts`)

Add `pickEntity(origin, dir, entities, reach)`: a slab/AABB intersection test along the ray
for each entity (box = kind `half`/`height`, feet at `e.pos`), returning the **nearest**
entity hit within `reach` that is in front of the origin, or null. `main.ts`'s crosshair and
the `P` handler use it **before** the voxel hit (a closer entity shadows the voxel).
`[Note]` entities pass through each other — picking is the nearest AABB, not a solid.

## Ownership after the refactor

`main.ts` keeps only: input → the human controller (now with the `P` possession edge and the
viewed-entity pick); render the entity rigs (update transforms from `sim.all()` each frame,
from `e.vel` for the leg phase); the HUD label + hotbar visibility from the viewed kind; and
spawn/despawn flow through the sim (chunk-load spawn + unload despawn). Every world mutation
still flows through `applyIntent`; every kinematic change through `stepEntity`. The deer is a
fully ordinary entity: spawned, stepped, persisted, and possessed exactly like the player.

## Pinned numbers (must not regress)

`deer`: `half 0.45`, `height 0.9`, `eye 0.7`, `walkSpeed 1.6`, `swimSpeed 1.0`,
`jumpVel 8.0`; `spectator`: `eye 1.62`, `flySpeed 8`, `flyVSpeed 8`; leg-swing `rate` per
kind (pinned in the rig table); spawn cap **6** in the view ring; drop refusal = **3**
cells; water refusal; `REACH 6` (picking uses the same reach); all phase 1 pins unchanged
(`WALK_SPEED 5.6`, …, `STEP 1/60`, `TERRAIN_SEED 1234`).

## Non-goals (phase 2)

- Multiplayer, networking, any transport.
- Health, hunger, damage, tools, crafting. The deer cannot be hurt yet.
- Mob-on-mob or mob-on-player physics beyond not overlapping voxels — entities pass through
  each other (noted; picking is the nearest AABB).
- Pathfinding. Wander + local obstacle rules only.
- Skinning/animation beyond leg swing and head look.

## POC shortcuts (tagged)

- Spawn rolls use `sim.rng` (deterministic); a real world would randomize per session.
- The spectator ghost has no rig.
- The population cap is a simple global count, not a per-region budget.
- A deer rides the phase 1 **edited-only** chunk gate: a deer frozen in an **unedited**
  chunk is not persisted and vanishes on reload (the same as an unedited chunk's water).
  A deer in an edited chunk persists with it. `[POC shortcut]`