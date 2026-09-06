# Task: entities & controllers, one mob, replay/spectator

This is a three-phase project. Phase 1 is a refactor that changes no behavior; phases 2 and 3 build on it. Each phase gets its own spec + plan under `docs/superpowers/`, its own ADR, and its own green gate before the next starts. If you run out of context, stop at a phase boundary and leave a handoff note in the plan — the next session picks up from the ADR and the plan's execution notes.

Read `PROJECT.md`, ADR 0004 (player/interaction), ADR 0011 (simulation clocks), ADR 0014 (persistence), `src/player.ts`, the substep loop and input handling in `src/main.ts`, and `src/prof-rig.ts` (it already pins the player from outside the input path — that's a controller in embryo).

## Why

Every later feature — multiplayer, bots, creatures, possession, replay — needs the same thing: the player is not special. It is an entity with a controller attached. A controller emits one **intent** per substep; the sim applies intents in a fixed order on the ADR 0011 heartbeat. Human keyboard, scripted bot, mob AI, replay log, and (later) remote peer are all just controllers. Get that shape right and the rest is registry work.

---

## Phase 1 — entity/controller refactor (no behavior change)

### Model

```ts
// entity.ts
interface EntityKind {
  id: string;            // 'player' | 'spectator' | ...
  half: number;          // AABB half-width x/z
  height: number;
  eye: number;
  walkSpeed: number; swimSpeed: number; jumpVel: number;
  canFly: boolean; canNoclip: boolean; canEdit: boolean; // capabilities the sim enforces
  collides: boolean;     // false for spectator
}
interface Entity {
  id: number;            // stable, monotonically assigned by the sim
  kind: EntityKind;
  pos: Vec3; vel: Vec3; yaw: number; pitch: number;
  onGround: boolean; inWater: boolean; headInWater: boolean;
  fly: boolean; noclip: boolean;
  controller: Controller;
}
interface Intent {
  forward: number; strafe: number; up: boolean; down: boolean;   // == today's MoveInput
  yaw: number; pitch: number;                                    // ABSOLUTE look, not deltas (replay/network-safe)
  primary: boolean; secondary: boolean;                          // edge-triggered this tick (break / place-or-use)
  select?: number;                                               // hotbar slot change, when present
  toggleFly?: boolean; toggleNoclip?: boolean;
}
interface Controller {
  intent(e: Entity, tick: number): Intent;
}
```

`Player`'s physics (`update(dt, input)`, collision, water probes, swim/fly rules) moves into a kind-parameterized `stepEntity(world, e, intent, dt)` in `entity.ts`. `Player` can stay as a thin compatibility wrapper for one phase if that keeps `player.test.ts` untouched — but the pins in `player.test.ts` must hold exactly (same constants, same results; add a test that constructs the `player` kind and asserts the constants equal the old exports).

### Sim ownership of actions

Today `main.ts` raycasts from the Three camera and calls `world.setBlock` in `onMouseDown`. That moves into the sim: `applyIntent(world, sim, e, intent)` raycasts from the entity's eye along its yaw/pitch (pure math, no camera), applies capability checks (`canEdit`, the intersects-self placement rule, reach), and performs the edit. `main.ts` keeps only: read hardware → build intent → hand to the human controller. The camera is derived from the entity after the step, never the source of truth. This is what makes remote and replayed intents produce identical edits to local ones.

### Loop

```
while (acc >= STEP) {
  const tick = worldTime.tick;
  for (const e of sim.entities in id order) {   // deterministic order
    const it = e.controller.intent(e, tick);
    applyIntent(...); stepEntity(...);
  }
  worldTime.advance(STEP);
  fall-out-of-world respawn per entity (player kind → SPAWN; others → despawn)
}
```

Entities whose chunk is not loaded do not step (frozen). Streaming's anchor becomes the **viewed** entity (see possession), not a global `player`.

### Controllers in phase 1

- `HumanController`: `main.ts` pushes the latest keyboard/mouse state into it; it returns the intent. Mouse deltas accumulate into absolute yaw/pitch inside `main.ts` and the controller reports absolutes. Edge-detect primary/secondary here (mousedown → true for exactly one tick).
- `IdleController`: returns the null intent (holds still, gravity applies).
- `ScriptController`: a tiny deterministic behavior list for tests and bots — `walkTo(x,z)`, `lookAt`, `dig`, `place(block)`, `wait(ticks)`, `repeat`. Bots are entities of kind `player` with this controller. This is the load-test rig for multiplayer; make it comfortable to spawn N of them.
- `ProfRig` becomes a controller (or keeps pinning position; either way it must not need special-casing in the loop).

### Persistence

`WorldMeta` v2: `player` becomes `entities: EntityRecord[]` for entities in loaded chunks at save time plus `viewedEntityId`. `ChunkRecord` v2 gains optional `entities?: EntityRecord[]` for entities frozen in that chunk when it unloads (entities ride with their chunk, like today's arrays). Read v1 records as v2 with empty entity lists; write v2. Entities carry `kind.id`, pos/vel/yaw/pitch, and the `controllerKind` string so the right default controller reattaches on restore (human → the human controller if it's the viewed entity, else idle).

### Gate for phase 1

- `player.test.ts` untouched and green; new `entity.test.ts` pins the kind table and proves `stepEntity(player kind)` ≡ old `Player.update` on a fixed input script (compare final pos/vel to 1e-9).
- `water-load.test.ts` and `mesher-budget` pins unchanged.
- A test: two bots with identical scripts starting at different positions dig and place; the world state after 600 ticks is identical across two runs (determinism baseline for phase 3).
- Browser: play feels identical. Break/place/door-use work. Fly/noclip toggles work.
- ADR 0015 — Entities & controllers.

---

## Phase 2 — one mob + possession + spectator

### The mob

One grazing quadruped. Give it a name that isn't a reference engine's. Kind: `half ≈ 0.45`, `height ≈ 0.9`, `eye ≈ 0.7`, slower walk, low jump (can clear one block), `canEdit: false`, `canFly: false`, `canNoclip: false`. `MobController` (wander AI): pick a heading, walk a few seconds, idle, occasionally turn toward grass; refuse to step off a ≥3-block drop or into water; if blocked for N ticks, turn. **All randomness from a seeded PRNG owned by the sim and advanced on the tick** — never `Math.random` — or phase 3's replays diverge. Reuse the terrain PRNG style.

Spawning: at boot and as chunks load, roll for a spawn on grass surface cells with sky above, capped at a population within the view ring; despawn beyond the ring only when the chunk unloads (then they persist with the chunk). Pins: a 600-tick test with a fixed seed spawns a deterministic count at deterministic positions.

### Rendering: box-part rigs

`entity-mesh.ts`: an entity is a small set of textured boxes (head, body, 4 legs) in a parent `Object3D`, textured from a canvas atlas in the same style as blocks. A per-kind part table gives box dims, pivot, and offsets; the player kind gets a two-legged biped rig from the same system. Walk animation: leg swing = `sin(phase)` where phase advances with horizontal speed (from the entity's velocity, so it's replay-safe). Head follows pitch/yaw; body follows yaw only. Entities are rendered in third person; the viewed entity's own rig is hidden while in first person.

Keep it cheap: one material per kind, no skinning, no morph targets.

### Possession & spectator

- Add a `spectator` kind: no collision, noclip flight, `canEdit: false`, no rig. There is always exactly one spectator entity (the "ghost").
- The human controller is attached to exactly one entity at a time — the **viewed** entity. Camera = viewed entity's eye. Streaming anchor = viewed entity.
- `P` while the crosshair ray hits an entity (add entity picking to the raycast: AABB test along the ray before the voxel hit): possess it. The previous viewed entity gets its default controller back (mob → `MobController`; player → `IdleController`; a bot keeps its script). The possessed entity's previous controller is remembered so un-possessing restores it.
- `P` with no target: swap to the spectator (leave your body; it stands idle). `P` on your player body from the spectator: return.
- Capabilities are the kind's, not the controller's. Possessing the grazer means you walk slow, hop one block, can't break anything, and see from 0.7 m up. That's the feature.
- HUD: a small label for the viewed kind and, when the possessed entity `canEdit: false`, hide the hotbar.

### Gate for phase 2

- Tests: mob controller determinism (same seed → same path over 1200 ticks); refuses drops/water; possession swaps controllers and restores them; entity picking hits the nearest AABB before the voxel.
- Browser: grazers wander near spawn, animate, get restored on reload in the same spots; possess one, walk it into a hole, leave it, watch it wander out.
- ADR 0016 — Mobs, possession, spectator.

---

## Phase 3 — replay & spectator playback

Because every state change now flows through intents on the tick, a replay is: an initial snapshot + an intent log.

- `replay.ts`: `Recorder` captures `{ tick, entityId, intent }` only when the intent differs from that entity's previous one (delta-coded), plus entity spawn/despawn events and the sim PRNG seed. Snapshot = the persistence records of every loaded chunk + `WorldMeta` at record start (reuse `snapshotChunk`/`applyRecord` — no new format).
- `ReplayController` feeds an entity its logged intents; entities with no logged intents run their default controllers, which are deterministic given the PRNG seed.
- Playback: load snapshot into a fresh `World` + sim, attach `ReplayController`s, run ticks. Spectator entity is viewable during playback with its own live human controller (it emits no world-changing intents, so it doesn't perturb the replay).
- The determinism test is the whole point: record a 1200-tick session with a bot building, a grazer wandering, and a spring placed; play it back on a fresh world; assert every loaded chunk's arrays and every entity's transform are byte/1e-9 identical. Also assert that seeking (replay to tick T, snapshot, replay to T again from the snapshot) matches.
- Keys: `R` start/stop recording (writes the replay to IDB under `${seed}:replay:${startTick}`); a `?replay=<key>` URL param loads and plays one with a scrub HUD (pause, ×1/×4, step). Keep the HUD minimal.

Any nondeterminism this test finds is a bug to fix in the sim, not to paper over in the replay. The likely suspects: `Set`/`Map` iteration order that depends on insertion timing across frames (water queue is fine — it's tick-strided — but check anything that iterates `world.allChunks()` for physics), `performance.now()` leaking into sim state, and light (which doesn't affect sim state, so it's excluded from the comparison).

### Gate for phase 3

- The round-trip determinism test above, pinned.
- `docs/adr/0017-replay.md`.
- TODO.md: multiplayer is now "remote controller + intent transport + host authority over water/mob PRNG"; write that item so the next brief can start from it.

---

## Non-goals (all three phases)

- Multiplayer, networking, any transport.
- Health, hunger, damage, tools, crafting. The grazer cannot be hurt yet.
- Mob-on-mob or mob-on-player physics beyond not overlapping voxels (entities pass through each other for now — note it).
- Pathfinding. Wander + local obstacle rules only.
- Skinning/animation beyond leg swing and head look.

House style as before: no reference engine named, pinned numbers verbatim, `[POC shortcut]` tags on deliberate punts, gate suite green per phase (`npm test`, `npm run build`), ADR README table updated per ADR.