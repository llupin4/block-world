# Spec: entities & controllers — the player is just an entity with a controller attached

Status: design frozen for implementation (2026-09-06). Phase 1 of 3
(entities & controllers → mobs/possession/spectator → replay & spectator playback).
Durable record after implementation: ADR 0015 — Entities & controllers.

## Goal

Remove player-specialness. The simulation owns a set of **entities**; each entity has a
**controller** that emits one **intent** per 60 Hz substep; the sim applies intents in a
fixed order and steps entities in id order on the ADR 0011 heartbeat. Human keyboard,
scripted bot, mob AI, replay log, and (later) a remote peer are all just controllers.

This phase is a **no-behavior-change refactor**: play feels identical, every existing pin
holds, and the camera becomes a derived view of the viewed entity instead of the source
of truth for targeting.

## What must be true

1. `src/__tests__/player.test.ts` is **untouched** and green.
2. New `src/__tests__/entity.test.ts` pins:
   - the `player` kind's constants equal the old `player.ts` exports (same numbers);
   - `stepEntity(playerKind)` ≡ old `Player.update` on a fixed 300-tick input script —
     final pos/vel to 1e-9 — including fly and noclip segments;
   - two bots with identical scripts starting at different positions dig and place; the
     world state after 600 ticks is identical across two runs (determinism baseline for
     phase 3).
3. `water-load.test.ts` and the `mesher-budget` pins are unchanged.
4. Browser: play feels identical. Break/place/door-use work. Fly/noclip toggles work.
   The `?prof=remesh` rig (ADR 0013) still passes.
5. `npm test` and `npm run build` green.

## Model (`src/entity.ts`)

```ts
interface EntityKind {
  id: string;            // 'player' | 'spectator' | 'deer'
  half: number;          // AABB half-width x/z
  height: number;        // feet → top of head
  eye: number;           // eye height above the feet
  walkSpeed: number; swimSpeed: number; jumpVel: number;
  flySpeed: number; flyVSpeed: number;   // brief's model omits these; the player kind needs
                                         // the old FLY_SPEED/FLY_V_SPEED (13.0 / 8.0)
  canFly: boolean; canNoclip: boolean; canEdit: boolean; // capabilities the sim enforces
  collides: boolean;     // false for spectator
}

interface Entity {
  id: number;            // stable, monotonically assigned by the sim
  kind: EntityKind;
  pos: Vec3; vel: Vec3;  // pos = feet
  yaw: number; pitch: number;
  onGround: boolean; inWater: boolean; headInWater: boolean;
  fly: boolean; noclip: boolean;
  controller: Controller;
  baseController: Controller; // the controller un-possessing restores (phase 2); = controller at spawn
}

interface Intent {
  forward: number; strafe: number; up: boolean; down: boolean;   // == today's MoveInput
  yaw: number; pitch: number;                                    // ABSOLUTE look, not deltas
  primary: boolean; secondary: boolean;                          // edge-triggered this tick
  select?: number;                                               // hotbar slot change, when present
  block?: number;                                                // block to place on secondary
  toggleFly?: boolean; toggleNoclip?: boolean;
}

interface Controller {
  intent(e: Entity, tick: number): Intent;
}
```

**Deviations from the brief's model (deliberate, pinned here):**

- `Intent.block` — the brief's ScriptController needs `place(block)` and phase 3 needs
  self-contained intents (a replay log must reproduce a placement without external hotbar
  state). The human controller stamps `block` from its `heldBlock` (main.ts keeps it in
  sync with the hotbar, per frame).
- `EntityKind.flySpeed/flyVSpeed` — `stepEntity` is kind-parameterized; the old player
  constants `FLY_SPEED = 13.0`, `FLY_V_SPEED = 8.0` become kind fields. `GRAVITY = 28`
  stays a shared constant (the kind table has no gravity; no kind needs a different one).
- **Absolute look is sticky.** `intent.yaw/pitch` is the absolute look to set before
  physics this tick. A controller that wants to "hold still" must report the entity's
  *current* yaw/pitch (an `IdleController` returning yaw 0 would snap every idle entity to
  face −Z). `NULL_INTENT` is the zero-movement intent with yaw/pitch left for the caller.
- `select` in phase 1 is reported in the intent (replay captures it) but the sim's
  `onSelect` hook is **not wired** — the hotbar keeps being driven by main.ts keydown/wheel
  exactly as today (no behavior change). Phase 3 may wire it.

### The `player` kind

`KINDS.player` is built from the existing `player.ts` exports so the old constants stay
the single source: `half = HALF (0.3)`, `height = HEIGHT (1.8)`, `eye = EYE (1.62)`,
`walkSpeed = WALK_SPEED (5.6)`, `swimSpeed = SWIM_SPEED (3.0)`, `jumpVel = JUMP_VEL (9.5)`,
`flySpeed = FLY_SPEED (13.0)`, `flyVSpeed = FLY_V_SPEED (8.0)`,
`canFly = canNoclip = canEdit = true`, `collides = true`.
`src/player.ts` is left in place (constants + the legacy `Player` class) so
`player.test.ts` runs untouched; `entity.ts` imports the constants from it.

## Physics: `stepEntity(world, e, intent, dt)`

A kind-parameterized port of `Player.update`, free function in `entity.ts`:

1. Set `e.yaw = intent.yaw`, `e.pitch = intent.pitch` (absolute look, before physics).
2. Water probes from the kind: `headInWater` = the eye voxel is water (eye at
   `kind.eye`); `inWater` = head or any body-AABB voxel (kind `half`/`height`) is water.
   Collision truth = `world.isSolid` (the door-aware single truth main.ts already uses);
   water probes read `world.getBlock`.
3. `kind.collides && e.noclip` → free movement at `kind.flySpeed/flyVSpeed`, no gravity,
   no collision, `onGround = false` (old noclip branch).
4. Otherwise vertical: `e.fly` → `v.y` direct at `flyVSpeed`; else gravity
   (`v.y -= GRAVITY * dt`), water clamps (rise: `min(v.y + 30*dt, swimSpeed)`, sink:
   `max(v.y, -swimSpeed*0.6)` — the old magic numbers verbatim), jump:
   `if (up && onGround) v.y = jumpVel` (onGround latched at the previous step end).
5. Horizontal: direct velocity at `fly ? flySpeed : inWater ? swimSpeed : walkSpeed`;
   direction from absolute yaw: `forward = (−sin yaw, −cos yaw)`,
   `right = (cos yaw, −sin yaw)`, normalized when length > 1.
6. `kind.collides` → axis slides x, z, y with 24-iteration bisection (`EPS = 1e-7`,
   same as today); a blocked y-slide zeroes `v.y`; then the ground probe at
   `y − 0.02`. Non-colliding kinds integrate freely and clear `onGround`.

The old `Player.update` and `stepEntity(playerKind)` must produce identical
pos/vel/onGround/inWater/headInWater on identical input scripts — pinned to 1e-9.

## Sim ownership of actions: `applyIntent(world, e, intent, hooks)`

`main.ts` stops raycasting from the camera and calling `world.setBlock` in `onMouseDown`.
The sim does it, from the entity's eye along its yaw/pitch (pure math — no camera):

- Origin = `eyeOf(e)` = `(pos.x, pos.y + kind.eye, pos.z)`; direction =
  `lookDir(e.yaw, e.pitch)` (the YXZ convention: yaw 0 faces −Z, pitch up positive).
  Since the camera is derived from the viewed entity after the step, a local, replayed, or
  remote intent produces identical edits.
- Capability gate: `toggleFly`/`toggleNoclip` apply only when the kind allows
  (`canFly`/`canNoclip`); when `!kind.canEdit` the function returns after the toggles —
  no world edit, no break, no place.
- **primary (break):** DDA raycast (`raycastVoxel`, `REACH = 6`) with break targeting —
  stops on non-air/non-water, plus a placed spring (the only targetable water) via the
  `hooks.springTarget` callback (main.ts wires it to `waterSim.cellState(x,y,z).p === 1`).
  A door hit clears the partner half first (the aimed cell still identifies it), then the
  aimed cell goes to Air. `hooks.waterEdit(x,y,z, Air)` (water sim edit-origin) and
  `hooks.onEdit(x,y,z)` (remesh + light) fire per touched cell.
- **secondary (place-or-use):** DDA with plain (water pass-through) targeting, then the
  existing precedence — 1) a door under the crosshair toggles the pair (always wins);
  2) torch: air target + solid opaque face behind, `hit.ny >= 0`, torch meta from the
  normal; 3) door: both cells clearable (Air/Water), within height, the pair must not
  overlap the entity (unless `e.noclip`), axis from the entity's level facing
  `(−sin yaw, −cos yaw)` — identical to the camera XZ projection today (the pitch clamp
  keeps it non-degenerate); 4) plain block (from `intent.block ?? Stone`): may replace
  Air/Water/Torch/door (door pair cleared first), y inside
  `[WORLD_Y_MIN, WORLD_Y_MAX)`, no entity overlap unless `e.noclip`
  (`entityIntersectsVoxel` — the kind-aware `Player.intersectsVoxel`).
  Every write fires `waterEdit` + `onEdit`.
- The per-frame crosshair highlight casts the same break ray from the viewed entity's eye
  (identical math to today's camera cast).

`hooks` is a struct so `entity.ts` never imports the water/light sims:
`{ onEdit?, springTarget?, waterEdit? }`, wired by main.ts.

## Loop (main.ts substep)

```
while (acc >= STEP) {
  acc -= STEP;
  const tick = worldTime.tick;
  for (const e of sim.all()) {            // entity id order — deterministic
    if (!sim.chunkLoaded(e)) continue;    // frozen: its chunk is not loaded
    const it = e.controller.intent(e, tick);
    sim.onIntent?.(tick, e, it);          // phase 3: the recorder
    sim.applyIntent(e, it);
    sim.stepEntity(e, it, STEP);
  }
  worldTime.advance(STEP);
  for (const e of sim.all())              // fall-out-of-world, per entity
    if (e.pos.y < WORLD_Y_MIN)
      e.kind.id === 'player' ? respawn at sim.respawn : sim.despawn(e.id);
}
```

- `Sim` owns the entity registry (id-ordered `all()`), `viewedId`, `respawn`, the
  `ApplyHooks`, and the sim PRNG (below). `Sim.tick(dt)` runs exactly the body above.
- The water pulse stays at the frame end, tick-strided (ADR 0011 — unchanged).
- Streaming's anchor becomes the **viewed** entity: `tickStreaming`, the cold-restore
  range check, and `metaSnapshot` all read `sim.viewed()` (phase 1: identical to the old
  `player` reads).
- **ProfRig keeps pinning position.** It is not a controller: main.ts overwrites the
  viewed entity's pos/vel each frame after the substep loop (exactly today's
  `player.place(waypoint)`). No special-casing in the loop — the rig's pin is a frame-end
  write, same as today. `[POC shortcut]`

## Controllers (phase 1)

- **`HumanController`** — main.ts pushes the latest hardware state into it: the shared
  `keys` Set, `heldBlock` (synced from the hotbar each frame), and mouse deltas via
  `mouse(dx, dy)` which accumulate into absolute yaw/pitch (sensitivity 0.0025 rad/px,
  pitch clamped to ±(π/2 − 0.01) — `MAX_PITCH` moves from main.ts to entity.ts).
  `primary()/secondary()/toggleFly()/toggleNoclip()/select(slot)` set edges; `intent()`
  reports each edge for **exactly one tick** (the first substep after the event), then
  clears it. A frame that runs up to 6 substeps consumes the edge once.
- **`IdleController`** — the null movement intent, holding the entity's current
  yaw/pitch (sticky-look rule above); gravity still applies via stepEntity.
- **`ScriptController`** — a deterministic behavior list for tests and bots:
  `walkTo(x,z[,timeout])` (face the target, forward until within 0.4 m or the timeout —
  default 240 ticks), `lookAt(x,y,z)` (one-tick aim from the eye), `dig([ticks])`
  (primary for N ticks, default 1), `place(block, [ticks])` (secondary + `block` for N
  ticks), `wait(ticks)`, and a `repeat` flag (wrap the list). State (step index, ticks
  left, held look) lives in the controller instance — one instance per entity. Bots are
  entities of kind `player` with this controller; spawning N is one line each, which is
  the multiplayer load-test rig.
- **ProfRig** — unchanged; pins position from outside the loop (see Loop).

## Sim PRNG

The sim owns one seeded PRNG (`SimRng`), the pinned mulberry32 variant from
`terrain.ts` (same twist), seeded from the world seed: `seed ^ 0x5eed1234`. Phase 1 uses
it for nothing; it exists now because phase 2's mob AI must draw from **sim-owned,
tick-order** randomness (never `Math.random`) and phase 3 must be able to snapshot and
restore its state. `SimRng` exposes `next() / state() / restore(state)`. The state is
persisted in `WorldMeta.v2.simPrng` (optional field — phase 1 writes it, phases 2/3
consume it).

## Persistence (v2)

- **`EntityRecord`** — `{ id, kindId, x, y, z, vx, vy, vz, yaw, pitch, fly, noclip,
  controllerKind }`. `controllerKind` is a string (`'human' | 'idle' | 'script'` in phase
  1; `'mob'` in phase 2) so the right default controller reattaches on restore: a record
  with `'human'` gets the human controller **only when it is the viewed entity**, else an
  `IdleController` (a bot's script is not persisted — `[POC shortcut]`, documented in the
  ADR; in-session possession restore keeps the script via `baseController`).
- **`ChunkRecord` v2** — gains optional `entities?: EntityRecord[]`: entities frozen in
  that chunk when it unloads (they ride with their chunk, like today's arrays). Written
  only when the chunk is written (the edited-only gate is unchanged).
- **`WorldMeta` v2** — `player` becomes `entities: EntityRecord[]` (entities whose chunk
  is loaded at save time) plus `viewedEntityId: number` and `simPrng?: number`;
  `time`/`hotbar` unchanged.
- **Read v1 as v2:** a v1 *chunk* record has no `entities` field → read as `[]` (v1 chunks
  never carried entities). A v1 *meta* carries the player pose in `player` → migrated to
  `entities: [{ id: 1, kindId: 'player', …pose, controllerKind: 'human' }]`,
  `viewedEntityId: 1` (losing the pose would break every existing save — the migration is
  pinned by a test). Write v2.
- **Save/restore wiring:** `snapshotChunk(c, entities?)`; `applyRecord(world, r, sim?,
  controllerFor?)` restores frozen entities into the sim when given one;
  `Persistence.onUnload(c, entities?)`; streaming's unload path passes
  `sim.entitiesInChunk(cx,cy,cz).map(sim.toRecord)`; main.ts's warm/cold restore paths
  call `sim.restoreEntities(rec.entities, factory)`. `restoreEntity` is a no-op when the
  id already exists (the boot-column records restore before the meta, so the newer record
  wins).
- **Consequence (pinned in the ADR):** entities ride the edited-only chunk gate — a
  frozen entity in an unedited chunk is not persisted (it vanishes on reload, like a
  frozen unedited chunk's water would). `[POC shortcut]`.

## Ownership after the refactor

`main.ts` keeps only: read hardware → build the human controller's state → hand intents to
the sim; plus the render side (camera derived from the viewed entity after the step, hitbox,
water mood from the viewed's `headInWater`, streaming, save points). Every world mutation
flows through `applyIntent`; every kinematic change flows through `stepEntity`.

## Pinned numbers (must not regress)

`WALK_SPEED 5.6`, `SWIM_SPEED 3.0`, `FLY_SPEED 13.0`, `FLY_V_SPEED 8.0`, `GRAVITY 28`,
`JUMP_VEL 9.5`, `HALF 0.3`, `HEIGHT 1.8`, `EYE 1.62`, `EPS 1e-7`, `BISECT_ITER 24`,
`REACH 6`, mouse sensitivity `0.0025`, `MAX_PITCH π/2 − 0.01`, water-clamp magic numbers
(`+30*dt`, `−SWIM_SPEED*0.6`), ground probe `−0.02`, `STEP 1/60`, `WATER_STRIDE 30`,
`WATER_PULSE 1000`; the `water-load` PIN 1,231,601 / 10,690 processes; the `mesher-budget`
pins; `TERRAIN_SEED 1234`.

## Non-goals (phase 1; all three phases)

- Multiplayer, networking, any transport.
- Health, hunger, damage, tools, crafting.
- Entity-on-entity physics — entities pass through each other (note in the ADR).
- Mobs, possession, spectator (phase 2); replay (phase 3).