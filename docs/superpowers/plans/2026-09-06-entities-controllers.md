# Plan: entities & controllers — the player is just an entity with a controller

Spec: `docs/superpowers/specs/2026-09-06-entities-controllers-design.md`
Task brief: `docs/plans/entities-controllers.md`
Branch: `entities-controllers` — created in Task 1, before any other file write.
Phase 1 of 3 (entities & controllers → mobs/possession/spectator → replay & spectator
playback). Durable record after implementation: ADR 0015 — Entities & controllers.

## Goal

Remove player-specialness with **zero behavior change**: the simulation owns a set of
**entities**; each entity has a **controller** that emits one **intent** per 60 Hz substep;
the sim applies intents in a fixed order and steps entities in id order on the ADR 0011
heartbeat. Human keyboard, scripted bot, mob AI, replay log, and (later) a remote peer are
all just controllers. Play feels identical; every existing pin holds; the camera becomes a
derived view of the viewed entity instead of the source of truth for targeting.

## Architecture

- `src/entity.ts` (new) — the core: `EntityKind`/`KINDS`, `Entity`, `Intent`,
  `Controller`, `NULL_INTENT`, `Vec3`, `EntityRecord`; `stepEntity` (kind-parameterized
  port of `Player.update`), `applyIntent` (sim-owned break/place/door/torch, raycast from
  the entity's eye — no camera), `SimRng`/`deriveSimSeed`, `Sim` (registry, `viewedId`,
  `respawn`, hooks, PRNG, `tick`), and the phase 1 controllers
  (`HumanController`, `IdleController`, `ScriptController`).
- `src/player.ts` — **untouched** (constants + the legacy `Player` class); `player.test.ts`
  runs as-is. `entity.ts` imports the constants from it so the old numbers stay the single
  source.
- `src/persistence.ts` — v2 records: `ChunkRecord.entities?`, `WorldMeta.v2`
  (`entities`/`viewedEntityId`/`simPrng?`), v1→v2 read migration, `snapshotChunk(c,
  entities?)`, `applyRecord(world, r, sim?, controllerFor?)`, `Persistence.onUnload(c,
  entities?)`.
- `src/streaming.ts` — `update(..., sim?)`: frozen entities ride the edited-only unload
  record (`persist.onUnload(c, entities)`).
- `src/main.ts` — the refactor: rename `WaterSim sim` → `waterSim`; new entity `sim`
  (`Sim`); `simHooks` (remesh/light/water/spring callbacks); input → `HumanController`;
  camera + water fx + streaming + crosshair + save points all read the **viewed** entity;
  `metaSnapshot` v2; `startGame` spawns/restores entities; the substep loop is
  `sim.tick(STEP, worldTime.tick)`.

## Tech stack

Existing only: TypeScript + vitest + three. No new dependencies. (IndexedDB is native; the
IDB store is unchanged in phase 1 — the replay store lands in phase 3.)

## File map

| File | Action |
|------|--------|
| `docs/plans/entities-controllers.md` | committed as-is (the brief) |
| `docs/superpowers/specs/2026-09-06-entities-controllers-design.md` | new (Task 1) |
| `docs/superpowers/plans/2026-09-06-entities-controllers.md` | new — this file (Task 1) |
| `src/entity.ts` | new (Tasks 2–5) |
| `src/__tests__/entity.test.ts` | new (Tasks 2–5) |
| `src/persistence.ts` | edit (Task 6) |
| `src/__tests__/persistence.test.ts` | edit (Task 6) |
| `src/streaming.ts` | edit (Task 7) |
| `src/__tests__/streaming.test.ts` | edit (Task 7) |
| `src/main.ts` | edit (Task 8) |
| `docs/adr/0015-entities-controllers.md` | new (Task 9) |
| `docs/adr/README.md`, `PROJECT.md` | edit (Task 9) |

`src/player.ts` and `src/__tests__/player.test.ts` are deliberately **not** in the map —
they must stay untouched and green.

## Pinned numbers (must not regress)

`WALK_SPEED 5.6`, `SWIM_SPEED 3.0`, `FLY_SPEED 13.0`, `FLY_V_SPEED 8.0`, `GRAVITY 28`,
`JUMP_VEL 9.5`, `HALF 0.3`, `HEIGHT 1.8`, `EYE 1.62`, `EPS 1e-7`, `BISECT_ITER 24`,
`REACH 6`, mouse sensitivity `0.0025`, `MAX_PITCH π/2 − 0.01`, water-clamp magic numbers
(`+30*dt`, `−SWIM_SPEED*0.6`), ground probe `−0.02`, `STEP 1/60`, `WATER_STRIDE 30`,
`WATER_PULSE 1000`; the `water-load` PIN 1,231,601 / 10,690 processes; the `mesher-budget`
pins; `TERRAIN_SEED 1234`. `stepEntity(playerKind)` ≡ old `Player.update` to 1e-9.

## Execution notes

- TDD per task: failing tests first, then implementation, run, commit.
- House style: no reference engine named, pinned numbers verbatim, `[POC shortcut]` tags on
  deliberate punts, imperative detailed commit messages.
- The one allowed behavior nuance: edits now happen on the next 60 Hz substep (≤ 16.7 ms
  after the mouse event) instead of inside the event handler, and the edit ray uses the
  entity's pre-step eye while the crosshair uses the post-step eye — a ≤ 1-substep skew.
  Both are documented in ADR 0015. Everything else is a pure refactor.
- Tasks 6–8 are integration over Tasks 2–5; a failure points at the named hunk, not the
  test.

---

## Task 1: branch + spec + plan doc

**Files:** `docs/superpowers/specs/2026-09-06-entities-controllers-design.md`,
`docs/superpowers/plans/2026-09-06-entities-controllers.md`, `docs/plans/entities-controllers.md`

**Step 1:** Create the branch before any file write:

```
git checkout -b entities-controllers
```

**Step 2:** Ensure the three docs exist: the brief (`docs/plans/entities-controllers.md`,
already present), the spec (`docs/superpowers/specs/2026-09-06-entities-controllers-design.md`),
and this plan. The spec is the design of record (kind table, the four deliberate model
deviations, the persistence v2 shape, the loop, the controllers, the PRNG).

**Step 3: Verify** — `git status` shows the three docs staged/added; no source changed.

**Step 4: Commit**

```
docs: entities & controllers — phase 1 brief + spec + plan
```

---

## Task 2: `entity.ts` — model, kinds, physics (`stepEntity`)

**Files:** `src/entity.ts` (new), `src/__tests__/entity.test.ts` (new)

**Step 1: Write the failing tests** — create `src/__tests__/entity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, localIndex } from '../world';
import { Player, WALK_SPEED, SWIM_SPEED, FLY_SPEED, FLY_V_SPEED, JUMP_VEL, HALF, HEIGHT, EYE } from '../player';
import { KINDS, NULL_INTENT, stepEntity, lookDir, type Entity, type Intent } from '../entity';

const STEP = 1 / 60;

// A 3x3 column of chunks around the origin: a stone floor (top at y=5) everywhere, and a
// 2-deep water basin behind (−z) so the script exercises swimming. Enough floor/water to
// exercise walk, jump, fly, noclip and look without leaving the generated column.
function testWorld(): World {
  const w = new World();
  for (let cx = -1; cx <= 1; cx++)
    for (let cz = -1; cz <= 1; cz++) {
      const c = w.ensureChunk(cx, 0, cz);
      for (let lx = 0; lx < 16; lx++)
        for (let lz = 0; lz < 16; lz++) {
          c.blocks[localIndex(lx, 4, lz)] = Block.Stone; // floor, top at y=5
          if (cz === -1) { // water basin (−z): y=5 and y=6
            c.blocks[localIndex(lx, 5, lz)] = Block.Water;
            c.blocks[localIndex(lx, 6, lz)] = Block.Water;
          }
        }
    }
  return w;
}

// A fixed 300-tick input script shared by the old Player and stepEntity. It turns, looks
// up/down, jumps, and toggles fly and noclip, so every branch of the physics is covered.
function driveScript(i: number) {
  const yaw = i < 80 ? 0 : i < 160 ? 0.7 : -0.4;
  const pitch = i >= 200 ? -0.2 : 0;
  const fly = i >= 90 && i < 130;
  const noclip = i >= 140 && i < 170;
  return {
    forward: i < 60 ? 1 : 0,
    strafe: i >= 60 && i < 90 ? 1 : 0,
    up: (i >= 20 && i < 26) || (i >= 90 && i < 130), // one ground jump + rise while flying
    down: i >= 100 && i < 125,                       // sink while flying
    fly, noclip, yaw, pitch,
  };
}

describe('entity — the player kind', () => {
  it('KINDS.player is exactly the old player.ts constants', () => {
    const k = KINDS.player;
    expect(k.half).toBe(HALF);
    expect(k.height).toBe(HEIGHT);
    expect(k.eye).toBe(EYE);
    expect(k.walkSpeed).toBe(WALK_SPEED);
    expect(k.swimSpeed).toBe(SWIM_SPEED);
    expect(k.jumpVel).toBe(JUMP_VEL);
    expect(k.flySpeed).toBe(FLY_SPEED);
    expect(k.flyVSpeed).toBe(FLY_V_SPEED);
    expect(k.canFly).toBe(true);
    expect(k.canNoclip).toBe(true);
    expect(k.canEdit).toBe(true);
    expect(k.collides).toBe(true);
  });

  it('lookDir: yaw 0 faces -Z, +pitch looks up, always normalized (YXZ convention)', () => {
    expect(lookDir(0, 0)).toEqual({ x: 0, y: 0, z: -1 });
    expect(lookDir(0, Math.PI / 2)).toEqual({ x: 0, y: 1, z: 0 }); // +pitch = up
    const e = lookDir(Math.PI / 2, 0); // yaw +90° faces +X
    expect(e.x).toBeCloseTo(1, 12);
    expect(e.z).toBeCloseTo(0, 12);
    const v = lookDir(0.3, 0.4);
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1, 12);
  });

  it('stepEntity(player) ≡ old Player.update on the fixed 300-tick script (1e-9)', () => {
    const world = testWorld();
    // The old Player reads collision from world.isSolid and water from world.getBlock.
    const A = new Player((x, y, z) => world.getBlock(x, y, z), (x, y, z) => world.isSolid(x, y, z));
    A.place({ x: 0, y: 5, z: 0 });
    const B: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 5, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0, pitch: 0, onGround: false, inWater: false, headInWater: false,
      fly: false, noclip: false,
      controller: { intent: () => NULL_INTENT }, baseController: { intent: () => NULL_INTENT },
    };
    for (let i = 0; i < 300; i++) {
      const s = driveScript(i);
      A.fly = s.fly; A.noclip = s.noclip; A.yaw = s.yaw; A.pitch = s.pitch;
      A.update(STEP, { forward: s.forward, strafe: s.strafe, up: s.up, down: s.down });
      B.fly = s.fly; B.noclip = s.noclip;
      const it: Intent = { ...NULL_INTENT, forward: s.forward, strafe: s.strafe, up: s.up, down: s.down, yaw: s.yaw, pitch: s.pitch };
      stepEntity(world, B, it, STEP);
      expect(B.pos.x).toBeCloseTo(A.pos.x, 9);
      expect(B.pos.y).toBeCloseTo(A.pos.y, 9);
      expect(B.pos.z).toBeCloseTo(A.pos.z, 9);
      expect(B.vel.y).toBeCloseTo(A.vel.y, 9);
      expect(B.onGround).toBe(A.onGround);
      expect(B.inWater).toBe(A.inWater);
      expect(B.headInWater).toBe(A.headInWater);
      expect(B.yaw).toBe(A.yaw);
      expect(B.pitch).toBe(A.pitch);
    }
  });
});
```

**Step 2: Implement** — create `src/entity.ts` with the model, the kind table, and the
physics:

```ts
import { Block, isOpaque, torchMeta, doorMeta, doorOpen, doorAxis, doorSide, isDoor, doorPlacementFromView } from './blocks';
import { type World, chunkOf, WORLD_Y_MIN, WORLD_Y_MAX } from './world';
import { WALK_SPEED, SWIM_SPEED, FLY_SPEED, FLY_V_SPEED, GRAVITY, JUMP_VEL, HALF, HEIGHT, EYE } from './player';
import { raycastVoxel, REACH } from './raycast';

export interface Vec3 { x: number; y: number; z: number }

// EntityKind: the tunable body of an entity. `player` is built from the old player.ts
// exports (the single source of the numbers); the other kinds land in phase 2.
export interface EntityKind {
  id: string;            // 'player' | 'spectator' | 'deer'
  half: number;          // AABB half-width x/z
  height: number;        // feet -> top of head
  eye: number;           // eye height above the feet
  walkSpeed: number; swimSpeed: number; jumpVel: number;
  flySpeed: number; flyVSpeed: number;   // the brief's model omits these; the player kind
                                          // needs the old FLY_SPEED / FLY_V_SPEED
  canFly: boolean; canNoclip: boolean; canEdit: boolean; // capabilities the sim enforces
  collides: boolean;     // false for spectator
}

export const KINDS: Record<string, EntityKind> = {
  player: {
    id: 'player',
    half: HALF, height: HEIGHT, eye: EYE,
    walkSpeed: WALK_SPEED, swimSpeed: SWIM_SPEED, jumpVel: JUMP_VEL,
    flySpeed: FLY_SPEED, flyVSpeed: FLY_V_SPEED,
    canFly: true, canNoclip: true, canEdit: true,
    collides: true,
  },
};

// The sim assigns stable, monotonic ids. `pos` is the feet; `yaw`/`pitch` are absolute.
// `baseController` is what un-possessing restores (phase 2) — the controller at spawn.
export interface Entity {
  id: number;
  kind: EntityKind;
  pos: Vec3; vel: Vec3;
  yaw: number; pitch: number;
  onGround: boolean; inWater: boolean; headInWater: boolean;
  fly: boolean; noclip: boolean;
  controller: Controller;
  baseController: Controller;
}

// One intent per substep. `forward/strafe/up/down` == today's MoveInput. `yaw`/`pitch`
// are ABSOLUTE look (replay/network-safe). `primary/secondary` are edge-triggered this
// tick (break / place-or-use). `select` is reported (replay captures it) but the sim's
// onSelect hook is NOT wired in phase 1. `block` is the block a placement writes.
export interface Intent {
  forward: number; strafe: number; up: boolean; down: boolean;
  yaw: number; pitch: number;
  primary: boolean; secondary: boolean;
  select?: number;
  block?: number;
  toggleFly?: boolean; toggleNoclip?: boolean;
}

export interface Controller {
  intent(e: Entity, tick: number): Intent;
}

// The zero-movement intent. A controller that wants to "hold still" must still report the
// entity's CURRENT yaw/pitch (absolute look is sticky — a controller returning yaw 0 would
// snap every idle entity to face -Z). NULL_INTENT leaves yaw/pitch at 0 for the caller.
export const NULL_INTENT: Intent = {
  forward: 0, strafe: 0, up: false, down: false,
  yaw: 0, pitch: 0,
  primary: false, secondary: false,
};

// The persisted entity (persistence.ts imports this; no cycle — entity.ts never imports
// persistence.ts).
export interface EntityRecord {
  id: number; kindId: string;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  yaw: number; pitch: number;
  fly: boolean; noclip: boolean;
  controllerKind: string; // 'human' | 'idle' | 'script' (phase 1); 'mob' in phase 2
}

const EPS = 1e-7;        // keeps a box exactly on a voxel boundary from "touching" the next
const BISECT_ITER = 24;  // sub-micron snap precision for typical per-step move sizes

/** The entity's eye in world space. */
export function eyeOf(e: Entity): Vec3 {
  return { x: e.pos.x, y: e.pos.y + e.kind.eye, z: e.pos.z };
}

/** The entity's view direction (YXZ convention: yaw 0 faces -Z, +pitch looks up), normalized. */
export function lookDir(yaw: number, pitch: number): Vec3 {
  const cp = Math.cos(pitch);
  return { x: -Math.sin(yaw) * cp, y: Math.sin(pitch), z: -Math.cos(yaw) * cp };
}

/** The kind-aware Player.intersectsVoxel: does the entity AABB overlap voxel (vx,vy,vz)? */
export function entityIntersectsVoxel(e: Entity, vx: number, vy: number, vz: number): boolean {
  const p = e.pos, k = e.kind;
  return vx < p.x + k.half && vx + 1 > p.x - k.half &&
         vy < p.y + k.height && vy + 1 > p.y &&
         vz < p.z + k.half && vz + 1 > p.z - k.half;
}

// --- collision / water probes (kind-parameterized ports of Player's private helpers) ---

function collidesAt(world: World, e: Entity, px: number, py: number, pz: number): boolean {
  const k = e.kind;
  const x0 = Math.floor(px - k.half), x1 = Math.floor(px + k.half - EPS);
  const y0 = Math.floor(py),        y1 = Math.floor(py + k.height - EPS);
  const z0 = Math.floor(pz - k.half), z1 = Math.floor(pz + k.half - EPS);
  for (let y = y0; y <= y1; y++)
    for (let z = z0; z <= z1; z++)
      for (let x = x0; x <= x1; x++)
        if (world.isSolid(x, y, z)) return true;
  return false;
}

function bodyInWaterAt(world: World, e: Entity, px: number, py: number, pz: number): boolean {
  const k = e.kind;
  const x0 = Math.floor(px - k.half), x1 = Math.floor(px + k.half - EPS);
  const y0 = Math.floor(py),        y1 = Math.floor(py + k.height - EPS);
  const z0 = Math.floor(pz - k.half), z1 = Math.floor(pz + k.half - EPS);
  for (let y = y0; y <= y1; y++)
    for (let z = z0; z <= z1; z++)
      for (let x = x0; x <= x1; x++)
        if (world.getBlock(x, y, z) === Block.Water) return true;
  return false;
}

/** Ground-plane movement direction from yaw (W = forward, D = right), normalized. */
function groundDir(yaw: number, fwd: number, str: number): { x: number; z: number } {
  const s = Math.sin(yaw), c = Math.cos(yaw);
  let x = -s * fwd + c * str;   // forward = (-sin yaw, -cos yaw); right = (cos yaw, -sin yaw)
  let z = -c * fwd - s * str;
  const l = Math.hypot(x, z);
  if (l > 1) { x /= l; z /= l; }
  return { x, z };
}

// Move `delta` along axis 0=x, 1=y, 2=z; on collision bisection-snap along that axis.
// Invariant: we always END a step outside solid voxels, so f=0 is always free.
function slide(world: World, e: Entity, axis: 0 | 1 | 2, delta: number): boolean {
  if (delta === 0) return false;
  const p = e.pos;
  const at = (f: number) =>
    collidesAt(world, e,
      p.x + (axis === 0 ? delta * f : 0),
      p.y + (axis === 1 ? delta * f : 0),
      p.z + (axis === 2 ? delta * f : 0));
  if (!at(1)) {
    if (axis === 0) p.x += delta;
    else if (axis === 1) p.y += delta;
    else p.z += delta;
    return false;
  }
  let lo = 0, hi = 1;
  for (let i = 0; i < BISECT_ITER; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid)) hi = mid; else lo = mid; // `lo` = the farthest proven-free fraction
  }
  if (axis === 0) p.x += delta * lo;
  else if (axis === 1) p.y += delta * lo;
  else p.z += delta * lo;
  return true;
}

/**
 * The kind-parameterized port of Player.update. Sets the absolute look, probes water from
 * the kind's eye/box, runs the noclip / fly / gravity / swim / jump / collide rules, and
 * latches onGround. stepEntity(playerKind) must produce identical pos/vel/onGround/
 * inWater/headInWater to the old Player.update on the same input (pinned to 1e-9).
 */
export function stepEntity(world: World, e: Entity, it: Intent, dt: number): void {
  const p = e.pos, v = e.vel, k = e.kind;
  e.yaw = it.yaw;            // absolute look, before physics
  e.pitch = it.pitch;

  e.headInWater = world.getBlock(Math.floor(p.x), Math.floor(p.y + k.eye), Math.floor(p.z)) === Block.Water;
  e.inWater = e.headInWater || bodyInWaterAt(world, e, p.x, p.y, p.z);

  if (k.collides && e.noclip) {
    // Free movement: no gravity, no collision.
    const d = groundDir(e.yaw, it.forward, it.strafe);
    v.x = d.x * k.flySpeed; v.z = d.z * k.flySpeed;
    v.y = it.up ? k.flyVSpeed : it.down ? -k.flyVSpeed : 0;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    e.onGround = false;
    return;
  }

  // Vertical: gravity always; water clamps fall speed and lets SPACE rise; fly overrides.
  if (e.fly) {
    v.y = it.up ? k.flyVSpeed : it.down ? -k.flyVSpeed : 0;
  } else {
    v.y -= GRAVITY * dt;
    if (e.inWater) {
      if (it.up) v.y = Math.min(v.y + 30 * dt, k.swimSpeed); // net +2 m/s^2 while rising
      v.y = Math.max(v.y, -k.swimSpeed * 0.6);               // sink speed cap, no free-fall
    } else if (it.up && e.onGround) {
      v.y = k.jumpVel; // jump (onGround was latched at the end of the PREVIOUS step)
    }
  }

  // Horizontal: direct velocity (no acceleration/inertia for the POC).
  const speed = e.fly ? k.flySpeed : e.inWater ? k.swimSpeed : k.walkSpeed;
  const d = groundDir(e.yaw, it.forward, it.strafe);
  v.x = d.x * speed; v.z = d.z * speed;

  if (k.collides) {
    slide(world, e, 0, v.x * dt);   // x
    slide(world, e, 2, v.z * dt);   // z
    if (slide(world, e, 1, v.y * dt)) v.y = 0; // floor OR ceiling: kill vertical velocity
    e.onGround = collidesAt(world, e, p.x, p.y - 0.02, p.z);
  } else {
    // Non-colliding kinds (spectator) integrate freely and never land.
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    e.onGround = false;
  }
}
```

**Step 3: Verify** — `npx vitest run src/__tests__/entity.test.ts src/__tests__/player.test.ts`
(kind table + lookDir + `stepEntity ≡ Player` all green; `player.test.ts` still untouched
and green).

**Step 4: Commit**

```
feat: entity.ts model + kinds + stepEntity — the kind-parameterized Player port (player.ts untouched)
```

---

## Task 3: `entity.ts` — `applyIntent` (sim-owned actions)

**Files:** `src/entity.ts`, `src/__tests__/entity.test.ts`

`main.ts` stops raycasting from the camera and calling `world.setBlock` in `onMouseDown`;
the sim does it from the entity's eye along its yaw/pitch (pure math — no camera). The
`hooks` struct keeps `entity.ts` free of the water/light sims (main.ts wires them).

**Step 1: Write the failing tests** — append to `src/__tests__/entity.test.ts` (add the new
imports to the entity import line: `applyIntent, eyeOf, breakRayTarget, type ApplyHooks`;
add `import { Block, torchMeta, doorMeta, isDoor } from '../blocks'` — `Block` is already
imported):

```ts
function editHooks(world: World): { hooks: ApplyHooks; edits: [number, number, number][]; water: [number, number, number, number][] } {
  const edits: [number, number, number][] = [];
  const water: [number, number, number, number][] = [];
  const hooks: ApplyHooks = {
    onEdit: (x, y, z) => edits.push([x, y, z]),
    waterEdit: (x, y, z, b) => water.push([x, y, z, b]),
    springTarget: (x, y, z) => world.getBlock(x, y, z) === Block.Water, // stand-in: all water is a spring here
  };
  return { hooks, edits, water };
}

// Entity at (0,5,0) facing -Z (yaw 0), pitch 0. A full-height stone column stands at
// x=0, z=-3 so the eye ray (y≈6.62) meets it; the air cell (0,6,-2) sits between the eye
// and the wall.
function wallWorld(): { world: World; e: Entity } {
  const world = new World();
  const c = world.ensureChunk(0, 0, 0);
  for (let y = 0; y < 8; y++) c.blocks[localIndex(0, y, 15)] = Block.Stone; // column at world z=-1 (local z=15)
  for (let y = 0; y < 8; y++) c.blocks[localIndex(0, y, 12)] = Block.Stone; // column at world z=-4
  const e: Entity = {
    id: 1, kind: KINDS.player,
    pos: { x: 0, y: 5, z: 0 }, vel: { x: 0, y: 0, z: 0 },
    yaw: 0, pitch: 0, onGround: true, inWater: false, headInWater: false,
    fly: false, noclip: false,
    controller: { intent: () => NULL_INTENT }, baseController: { intent: () => NULL_INTENT },
  };
  return { world, e };
}

describe('entity — applyIntent (sim-owned actions)', () => {
  it('eyeOf is feet + kind eye', () => {
    const { e } = wallWorld();
    expect(eyeOf(e)).toEqual({ x: 0, y: 5 + EYE, z: 0 });
  });

  it('primary breaks the block the eye ray hits (and reports the edit + water)', () => {
    const { world, e } = wallWorld();
    const { hooks, edits, water } = editHooks(world);
    applyIntent(world, e, { ...NULL_INTENT, primary: true }, hooks);
    // The ray from the eye goes -Z and enters the z=-4 column at y=6.
    expect(world.getBlock(0, 6, -4)).toBe(Block.Air);
    expect(edits).toContainEqual([0, 6, -4]);
    expect(water).toContainEqual([0, 6, -4, Block.Air]);
  });

  it('secondary places `block` on the face behind the hit', () => {
    const { world, e } = wallWorld();
    const { hooks } = editHooks(world);
    applyIntent(world, e, { ...NULL_INTENT, secondary: true, block: Block.Planks }, hooks);
    // Hit at (0,6,-4), entered from +Z (nz=+1) -> target (0,6,-3).
    expect(world.getBlock(0, 6, -3)).toBe(Block.Planks);
  });

  it('secondary on a door toggles the pair (always wins over placement)', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    c.blocks[localIndex(0, 5, 13)] = Block.DoorBottom; // world (0,5,-3)
    c.blocks[localIndex(0, 6, 13)] = Block.DoorTop;    // world (0,6,-3)
    const e: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 5, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0, pitch: 0, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false,
      controller: { intent: () => NULL_INTENT }, baseController: { intent: () => NULL_INTENT },
    };
    const { hooks } = editHooks(world);
    applyIntent(world, e, { ...NULL_INTENT, secondary: true }, hooks);
    expect(isDoor(world.getBlock(0, 5, -3))).toBe(true);
    expect(doorOpen(world.getMeta(0, 5, -3))).toBe(true);
    expect(doorOpen(world.getMeta(0, 6, -3))).toBe(true);
  });

  it('a kind with canEdit=false performs no edit (only the toggles would apply)', () => {
    const { world, e } = wallWorld();
    e.kind = { ...KINDS.player, canEdit: false };
    const { hooks, edits, water } = editHooks(world);
    applyIntent(world, e, { ...NULL_INTENT, primary: true, secondary: true, block: Block.Planks }, hooks);
    expect(world.getBlock(0, 6, -4)).toBe(Block.Stone); // nothing broken
    expect(edits).toEqual([]);
    expect(water).toEqual([]);
  });
});
```

**Step 2: Implement** — append to `src/entity.ts`:

```ts
// The sim-owned edit origin: main.ts wires onEdit (remesh + light), waterEdit (the water
// sim's edit-origin), and springTarget (the only targetable water). entity.ts never
// imports the water/light sims — the callbacks keep it dependency-light.
export interface ApplyHooks {
  onEdit?: (x: number, y: number, z: number) => void;
  waterEdit?: (x: number, y: number, z: number, block: number) => void;
  springTarget?: (x: number, y: number, z: number) => boolean;
}

// The break ray's target: any solid/torch/door, plus a placed spring (the only water you
// can break). Returns undefined when there is no spring callback (plain non-air/non-water).
export function breakRayTarget(world: World, hooks: ApplyHooks): ((x: number, y: number, z: number) => boolean) | undefined {
  const st = hooks.springTarget;
  if (!st) return undefined;
  return (x, y, z) => {
    const b = world.getBlock(x, y, z);
    if (b !== Block.Air && b !== Block.Water) return true;
    return b === Block.Water && st(x, y, z);
  };
}

// --- pure ports of the door/torch helpers (no camera, no three) ---

function torchFaceFromNormal(nx: number, ny: number, nz: number): number {
  if (ny > 0) return 0;   // +Y floor post
  if (nx > 0) return 1;   // +X
  if (nx < 0) return 2;   // -X
  if (nz > 0) return 3;   // +Z
  return 4;               // -Z
}

/** The other half of the door at (x,y,z), or null (an orphaned half). */
function doorPartner(world: World, x: number, y: number, z: number): [number, number, number] | null {
  const b = world.getBlock(x, y, z);
  if (b === Block.DoorBottom && world.getBlock(x, y + 1, z) === Block.DoorTop) return [x, y + 1, z];
  if (b === Block.DoorTop && world.getBlock(x, y - 1, z) === Block.DoorBottom) return [x, y - 1, z];
  return null;
}

/** Remove ONLY the partner half of the door at (x,y,z); the caller handles that cell. */
function clearDoorPartner(world: World, x: number, y: number, z: number, hooks: ApplyHooks): void {
  const p = doorPartner(world, x, y, z);
  if (!p) return;
  world.setBlock(p[0], p[1], p[2], Block.Air);
  hooks.waterEdit?.(p[0], p[1], p[2], Block.Air);
  hooks.onEdit?.(p[0], p[1], p[2]);
}

/** Right-click on a door: flip open/closed on BOTH halves, keeping axis and side. */
function toggleDoorPair(world: World, x: number, y: number, z: number, hooks: ApplyHooks): void {
  const b = world.getBlock(x, y, z);
  const m = world.getMeta(x, y, z);
  const meta = doorMeta(!doorOpen(m), doorAxis(m), doorSide(m));
  world.setBlock(x, y, z, b, meta);
  hooks.onEdit?.(x, y, z);
  const p = doorPartner(world, x, y, z);
  if (p) {
    world.setBlock(p[0], p[1], p[2], world.getBlock(p[0], p[1], p[2]), meta);
    hooks.onEdit?.(p[0], p[1], p[2]);
  }
}

/**
 * The sim-owned action path (the old main.ts onMouseDown, minus the camera). Casts from
 * the entity's eye along its absolute yaw/pitch; capability-gated; break on `primary`,
 * place-or-use on `secondary` (door-toggle > torch > door-place > plain block). Every
 * write fires waterEdit + onEdit. `select` is intentionally NOT acted on in phase 1.
 */
export function applyIntent(world: World, e: Entity, it: Intent, hooks: ApplyHooks): void {
  // Capability-gated toggles apply even for a non-editing kind.
  if (it.toggleFly && e.kind.canFly) e.fly = !e.fly;
  if (it.toggleNoclip && e.kind.canNoclip) e.noclip = !e.noclip;
  if (!e.kind.canEdit) return;

  const origin = eyeOf(e);
  const dir = lookDir(e.yaw, e.pitch);

  if (it.primary) {
    const hit = raycastVoxel(world, origin, dir, REACH, breakRayTarget(world, hooks));
    if (!hit) return;
    const hb = world.getBlock(hit.x, hit.y, hit.z);
    if (isDoor(hb)) clearDoorPartner(world, hit.x, hit.y, hit.z, hooks);
    world.setBlock(hit.x, hit.y, hit.z, Block.Air);
    hooks.waterEdit?.(hit.x, hit.y, hit.z, Block.Air);
    hooks.onEdit?.(hit.x, hit.y, hit.z);
    return;
  }

  if (it.secondary) {
    const hit = raycastVoxel(world, origin, dir, REACH); // plain target: water stays pass-through
    if (!hit) return;
    const hb = world.getBlock(hit.x, hit.y, hit.z);
    const tx = hit.x + hit.nx, ty = hit.y + hit.ny, tz = hit.z + hit.nz;
    if (ty < WORLD_Y_MIN || ty >= WORLD_Y_MAX) return;
    const target = world.getBlock(tx, ty, tz);
    const held = it.block ?? Block.Stone;

    // 1) A door under the crosshair TOGGLES — always wins over placement.
    if (isDoor(hb)) { toggleDoorPair(world, hit.x, hit.y, hit.z, hooks); return; }

    // 2) Torch: AIR target + a solid opaque face behind it (no water/ceilings/door faces).
    if (held === Block.Torch) {
      if (target !== Block.Air) return;
      if (hit.ny < 0) return;
      if (!isOpaque(hb)) return;
      if (!e.noclip && entityIntersectsVoxel(e, tx, ty, tz)) return;
      world.setBlock(tx, ty, tz, Block.Torch, torchMeta(torchFaceFromNormal(hit.nx, hit.ny, hit.nz)));
      hooks.waterEdit?.(tx, ty, tz, Block.Torch);
      hooks.onEdit?.(tx, ty, tz);
      return;
    }

    // 3) Door: both cells clearable (Air/Water), within height, no entity overlap.
    if (held === Block.DoorBottom) {
      if (ty + 1 >= WORLD_Y_MAX) return;
      const above = world.getBlock(tx, ty + 1, tz);
      if (target !== Block.Air && target !== Block.Water) return;
      if (above !== Block.Air && above !== Block.Water) return;
      if (!e.noclip && (entityIntersectsVoxel(e, tx, ty, tz) || entityIntersectsVoxel(e, tx, ty + 1, tz))) return;
      // Axis from the entity's LEVEL FACING: the XZ-projected look direction, normalized —
      // identical to the camera projection today (the pitch clamp keeps it non-degenerate).
      const ldir = lookDir(e.yaw, e.pitch);
      const horiz = Math.hypot(ldir.x, ldir.z);
      const { axis, side } = doorPlacementFromView(
        horiz >= 1e-3 ? ldir.x / horiz : 0,
        horiz >= 1e-3 ? ldir.z / horiz : 0,
        hit.nx, hit.nz,
      );
      const meta = doorMeta(false, axis, side);
      world.setBlock(tx, ty, tz, Block.DoorBottom, meta);
      world.setBlock(tx, ty + 1, tz, Block.DoorTop, meta);
      hooks.waterEdit?.(tx, ty, tz, Block.DoorBottom); hooks.onEdit?.(tx, ty, tz);
      hooks.waterEdit?.(tx, ty + 1, tz, Block.DoorTop); hooks.onEdit?.(tx, ty + 1, tz);
      return;
    }

    // 4) A plain block may replace Air/Water/Torch/a door (pair cleared first).
    if (target !== Block.Air && target !== Block.Water && target !== Block.Torch && !isDoor(target)) return;
    if (!e.noclip && entityIntersectsVoxel(e, tx, ty, tz)) return;
    if (isDoor(target)) clearDoorPartner(world, tx, ty, tz, hooks);
    world.setBlock(tx, ty, tz, held);
    hooks.waterEdit?.(tx, ty, tz, held);
    hooks.onEdit?.(tx, ty, tz);
  }
}
```

**Step 3: Verify** — `npx vitest run src/__tests__/entity.test.ts` (all `applyIntent` tests
green; the `stepEntity ≡ Player` pin still holds).

**Step 4: Commit**

```
feat: applyIntent — sim-owned break/place/door/torch raycast from the entity's eye (no camera)
```

---

## Task 4: `entity.ts` — `SimRng` + `Sim`

**Files:** `src/entity.ts`, `src/__tests__/entity.test.ts`

The sim owns the registry, the viewed id, the respawn, the hooks, and one seeded PRNG
(pinned mulberry32 variant from `terrain.ts`). Phase 1 uses the PRNG for nothing — it
exists now because phase 2's mob AI must draw from sim-owned, tick-order randomness and
phase 3 must snapshot/restore it.

**Step 1: Write the failing tests** — append to `src/__tests__/entity.test.ts` (add to the
entity import: `Sim, SimRng, deriveSimSeed, controllerKindOf, IdleController`; add
`import { TERRAIN_SEED } from '../terrain'`):

```ts
describe('entity — SimRng', () => {
  it('is deterministic and snapshot/restore round-trips', () => {
    const a = new SimRng(deriveSimSeed(TERRAIN_SEED));
    const b = new SimRng(deriveSimSeed(TERRAIN_SEED));
    const xs = [a.next(), a.next(), a.next()];
    expect([b.next(), b.next(), b.next()]).toEqual(xs);
    a.restore(a.state());
    expect([a.next(), a.next()]).toEqual([b.next(), b.next()]);
    expect(deriveSimSeed(1234)).toBe((1234 ^ 0x5eed1234) >>> 0);
  });
});

describe('entity — Sim (registry + tick)', () => {
  function flat(world: World): number[] {
    return [...world.allChunks()].flatMap((c) => Array.from(c.blocks));
  }

  function runTwoBots(seed: number): { initial: number[]; final: number[] } {
    const world = new World();
    for (let cx = 0; cx <= 1; cx++)
      for (let cz = 0; cz <= 1; cz++) {
        const c = world.ensureChunk(cx, 0, cz);
        for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, 4, lz)] = Block.Stone;
      }
    // A full-height stone wall at z=0 the bots face; the bots dig it and cap it.
    for (let cx = 0; cx <= 1; cx++)
      for (let y = 0; y < 8; y++) world.ensureChunk(cx, 0, 0).blocks[localIndex(0, y, 0)] = Block.Stone;
    const sim = new Sim(world, {}, seed);
    const script = (): import('../entity').ScriptStep[] => [
      { op: 'lookAt', x: 0, y: 6, z: -16 }, // face the wall (world z=0 -> chunk-local z=0)
      { op: 'dig', ticks: 12 },
      { op: 'place', block: Block.Planks, ticks: 12 },
      { op: 'wait', ticks: 564 },
    ];
    sim.spawn({ x: 0.5, y: 5, z: 16.5 }, new ScriptController(script())); // world (0,5,16)
    sim.spawn({ x: 0.5, y: 5, z: 17.5 }, new ScriptController(script())); // world (0,5,17)
    const initial = flat(world);
    for (let i = 0; i < 600; i++) sim.tick(STEP, i);
    return { initial, final: flat(world) };
  }

  it('assigns monotonic ids and exposes the viewed entity', () => {
    const world = new World();
    const sim = new Sim(world, {}, 1);
    const a = sim.spawn({ x: 0, y: 0, z: 0 }, new IdleController());
    const b = sim.spawn({ x: 1, y: 0, z: 0 }, new IdleController());
    expect(a.id).toBeLessThan(b.id);
    expect(sim.viewed()?.id).toBe(a.id);
    expect(controllerKindOf(a.controller)).toBe('idle');
  });

  it('falls out of the world: a player kind respawns, a non-player kind despawns', () => {
    const world = new World();
    const sim = new Sim(world, {}, 1);
    sim.respawn = { x: 0, y: 5, z: 0 };
    const p = sim.spawn({ x: 0, y: -40, z: 0 }, new IdleController()); // below WORLD_Y_MIN
    const mob = sim.spawn({ x: 5, y: -40, z: 0 }, new IdleController());
    mob.kind = { ...mob.kind, id: 'deer' }; // a non-player kind
    sim.tick(STEP, 0);
    expect(sim.viewed()?.id).toBe(p.id);
    expect(p.pos).toEqual({ x: 0, y: 5, z: 0 }); // respawned
    expect(sim.entities.has(mob.id)).toBe(false); // despawned
  });

  it('two bots with identical scripts produce an identical world across two runs (determinism)', () => {
    const a = runTwoBots(1234);
    const b = runTwoBots(1234);
    expect(a.final).toEqual(b.final);   // deterministic
    expect(a.final).not.toEqual(a.initial); // and the bots actually edited the world
  });
});
```

**Step 2: Implement** — append to `src/entity.ts`:

```ts
// The sim's seeded PRNG: the pinned mulberry32 variant from terrain.ts (same twist), so
// sim randomness is reproducible and snapshot/restore-able. Phase 1 draws nothing from it.
export class SimRng {
  private a: number;
  constructor(seed: number) { this.a = seed >>> 0; }
  next(): number {
    this.a |= 0;
    this.a = (this.a + 0x6d2b79f5) | 0;
    let t = Math.imul(this.a ^ (this.a >>> 15), 1 | this.a);
    t = (t + Math.imul(t ^ (this.a >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  state(): number { return this.a >>> 0; }
  restore(state: number): void { this.a = state >>> 0; }
}

/** Derive the sim PRNG seed from the world seed (pinned). */
export function deriveSimSeed(seed: number): number {
  return (seed ^ 0x5eed1234) >>> 0;
}

export function controllerKindOf(c: Controller): string {
  if (c instanceof HumanController) return 'human';
  if (c instanceof ScriptController) return 'script';
  if (c instanceof IdleController) return 'idle';
  return 'unknown';
}

/**
 * The entity registry + heartbeat. Owns id-ordered `all()`, the viewed id, the respawn,
 * the edit hooks, and the sim PRNG. `tick` runs one substep: for each loaded entity, ask
 * its controller for an intent, fire the recorder (phase 3), applyIntent, stepEntity; then
 * the fall-out-of-world pass (player -> respawn, other -> despawn).
 */
export class Sim {
  readonly entities = new Map<number, Entity>();
  viewedId = 0;
  respawn: Vec3 = { x: 0, y: 0, z: 0 };
  readonly rng: SimRng;
  // Phase 3: the intent recorder. Phase 1 leaves it unset.
  onIntent?: (tick: number, e: Entity, it: Intent) => void;

  private readonly world: World;
  private readonly hooks: ApplyHooks;
  private nextId = 1;

  constructor(world: World, hooks: ApplyHooks, seed: number) {
    this.world = world;
    this.hooks = hooks;
    this.rng = new SimRng(deriveSimSeed(seed));
  }

  all(): Entity[] {
    const out: Entity[] = [];
    for (const id of [...this.entities.keys()].sort((x, y) => x - y)) out.push(this.entities.get(id)!);
    return out;
  }

  viewed(): Entity | undefined { return this.entities.get(this.viewedId); }

  setViewed(id: number): void { if (this.entities.has(id)) this.viewedId = id; }

  spawn(pos: Vec3, controller: Controller, opts: { yaw?: number; pitch?: number; kindId?: string } = {}): Entity {
    const kind = KINDS[opts.kindId ?? 'player'] ?? KINDS.player;
    const e: Entity = {
      id: this.nextId++,
      kind,
      pos: { ...pos }, vel: { x: 0, y: 0, z: 0 },
      yaw: opts.yaw ?? 0, pitch: opts.pitch ?? 0,
      onGround: false, inWater: false, headInWater: false,
      fly: false, noclip: false,
      controller, baseController: controller,
    };
    this.entities.set(e.id, e);
    if (this.viewedId === 0) this.viewedId = e.id;
    return e;
  }

  despawn(id: number): void {
    this.entities.delete(id);
    if (this.viewedId === id) {
      this.viewedId = 0;
      const first = this.entities.keys().next().value;
      if (first !== undefined) this.viewedId = first;
    }
  }

  /** An entity steps only while its own chunk is loaded; otherwise it is frozen. */
  chunkLoaded(e: Entity): boolean {
    return this.world.hasChunk(chunkOf(e.pos.x), chunkOf(e.pos.y), chunkOf(e.pos.z));
  }

  tick(dt: number, tick: number): void {
    for (const e of this.all()) {
      if (!this.chunkLoaded(e)) continue;
      const it = e.controller.intent(e, tick);
      this.onIntent?.(tick, e, it);
      applyIntent(this.world, e, it, this.hooks);
      stepEntity(this.world, e, it, dt);
    }
    for (const e of this.all()) {
      if (e.pos.y < WORLD_Y_MIN) {
        if (e.kind.id === 'player') {
          e.pos = { ...this.respawn }; e.vel = { x: 0, y: 0, z: 0 };
        } else {
          this.despawn(e.id);
        }
      }
    }
  }

  // --- persistence (Task 6 uses these) ---

  toRecord(e: Entity): EntityRecord {
    return {
      id: e.id, kindId: e.kind.id,
      x: e.pos.x, y: e.pos.y, z: e.pos.z,
      vx: e.vel.x, vy: e.vel.y, vz: e.vel.z,
      yaw: e.yaw, pitch: e.pitch,
      fly: e.fly, noclip: e.noclip,
      controllerKind: controllerKindOf(e.controller),
    };
  }

  entitiesInChunk(cx: number, cy: number, cz: number): Entity[] {
    return this.all().filter((e) =>
      chunkOf(e.pos.x) === cx && chunkOf(e.pos.y) === cy && chunkOf(e.pos.z) === cz);
  }

  /** Restore a persisted entity. No-op when the id already exists (a newer record wins:
   *  boot-column records restore before the meta). */
  restoreEntity(rec: EntityRecord, controller: Controller): Entity | null {
    if (this.entities.has(rec.id)) return null;
    const kind = KINDS[rec.kindId] ?? KINDS.player;
    const e: Entity = {
      id: rec.id, kind,
      pos: { x: rec.x, y: rec.y, z: rec.z },
      vel: { x: rec.vx, y: rec.vy, z: rec.vz },
      yaw: rec.yaw, pitch: rec.pitch,
      onGround: false, inWater: false, headInWater: false,
      fly: rec.fly, noclip: rec.noclip,
      controller, baseController: controller,
    };
    this.entities.set(e.id, e);
    this.nextId = Math.max(this.nextId, e.id + 1); // keep ids monotonic across restores
    return e;
  }

  restoreEntities(records: EntityRecord[], controllerFor: (r: EntityRecord) => Controller): void {
    for (const r of records) this.restoreEntity(r, controllerFor(r));
  }
}
```

`ScriptController`/`ScriptStep`/`HumanController`/`IdleController` are added in Task 5; the
imports above and `controllerKindOf`/`Sim` reference them, so **do not run `tsc` until
Task 5** — verify with vitest (which only type-checks the compiled graph it loads) and move
on. (If the project's vitest config type-checks the whole `src` tree, add a minimal
forward-declaration is unnecessary: write Task 5 immediately after, then verify together.)

**Step 3: Verify** — `npx vitest run src/__tests__/entity.test.ts` (SimRng + Sim tests
green). Run together with Task 5 for a clean type-check.

**Step 4: Commit**

```
feat: SimRng + Sim — the entity registry, tick heartbeat, and persistence record bridge
```

---

## Task 5: `entity.ts` — controllers (Human / Idle / Script) + determinism gate

**Files:** `src/entity.ts`, `src/__tests__/entity.test.ts`

**Step 1: Write the failing tests** — append to `src/__tests__/entity.test.ts` (add to the
entity import: `HumanController, ScriptController, type ScriptStep`):

```ts
describe('entity — controllers', () => {
  it('HumanController: edges fire exactly one tick then clear; mouse accumulates absolute look', () => {
    const keys = new Set<string>();
    const h = new HumanController(keys, 0, 0);
    h.primary();
    const dummy: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0.3, pitch: -0.1, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: h, baseController: h,
    };
    const it1 = h.intent(dummy, 0);
    expect(it1.primary).toBe(true);
    expect(it1.yaw).toBe(0); // absolute look held at the controller's accumulated yaw
    const it2 = h.intent(dummy, 1);
    expect(it2.primary).toBe(false); // the edge was consumed on the first substep
    h.mouse(100, 0);
    const it3 = h.intent(dummy, 2);
    expect(it3.yaw).toBeCloseTo(-0.25, 9); // 100px * 0.0025 rad/px
    expect(it3.block).toBe(Block.Stone);   // heldBlock default
    keys.add('KeyW');
    expect(h.intent(dummy, 3).forward).toBe(1);
  });

  it('HumanController: frozen (prof rig) emits zero movement but holds current look', () => {
    const h = new HumanController(new Set<string>(), 0.9, 0.2);
    h.frozen = true;
    const dummy: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0.9, pitch: 0.2, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: h, baseController: h,
    };
    const it = h.intent(dummy, 0);
    expect(it.forward).toBe(0); expect(it.up).toBe(false);
    expect(it.primary).toBe(false);
    expect(it.yaw).toBe(0.9); expect(it.pitch).toBe(0.2); // sticky, from the entity
  });

  it('IdleController holds the entity's current yaw/pitch (sticky look)', () => {
    const c = new IdleController();
    const dummy: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0.5, pitch: -0.2, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: c, baseController: c,
    };
    const it = c.intent(dummy, 0);
    expect(it.yaw).toBe(0.5); expect(it.pitch).toBe(-0.2);
    expect(it.forward).toBe(0); expect(it.primary).toBe(false);
  });

  it('ScriptController: lookAt aims the entity, dig fires primary, place fires secondary+block', () => {
    const e: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 5, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0, pitch: 0, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: null as never, baseController: null as never,
    };
    const steps: ScriptStep[] = [
      { op: 'lookAt', x: 0, y: 5, z: -3 }, // face -Z
      { op: 'dig', ticks: 2 },
      { op: 'place', block: Block.Planks, ticks: 2 },
      { op: 'wait', ticks: 1 },
    ];
    const c = new ScriptController(steps);
    e.controller = c;
    const it0 = c.intent(e, 0);
    expect(it0.yaw).toBeCloseTo(0, 9);          // facing -Z (yaw 0)
    const itDig = c.intent(e, 1);               // after lookAt(1 tick) -> dig
    expect(itDig.primary).toBe(true);
    const itPlace = c.intent(e, 3);             // after dig(2) -> place
    expect(itPlace.secondary).toBe(true);
    expect(itPlace.block).toBe(Block.Planks);
  });
});
```

**Step 2: Implement** — append the controllers to `src/entity.ts`:

```ts
/**
 * HumanController: main.ts pushes hardware state into it (the shared keys Set, heldBlock,
 * mouse deltas, and one-tick edges). intent() reports each edge for EXACTLY one substep
 * (the first after the event), then clears it — a frame that runs up to 6 substeps
 * consumes the edge once. Sensitive to `frozen` (the prof rig): zero movement, no edges,
 * but it still reports the entity's current look (sticky).
 */
export class HumanController implements Controller {
  readonly keys: Set<string>;
  heldBlock = Block.Stone;
  frozen = false;
  private yaw: number; private pitch: number;
  private primary = false; private secondary = false;
  private toggleFly = false; private toggleNoclip = false;
  private selectSlot: number | undefined;

  constructor(keys: Set<string>, yaw = 0, pitch = 0) {
    this.keys = keys; this.yaw = yaw; this.pitch = pitch;
  }

  mouse(dx: number, dy: number): void {
    this.yaw -= dx * 0.0025; // sensitivity (rad/px) moved from main.ts
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch - dy * 0.0025));
  }
  primary(): void { this.primary = true; }
  secondary(): void { this.secondary = true; }
  toggleFly(): void { this.toggleFly = true; }
  toggleNoclip(): void { this.toggleNoclip = true; }
  select(slot: number): void { this.selectSlot = slot; } // reported for replay; unwired in phase 1

  intent(e: Entity, _tick: number): Intent {
    if (this.frozen) {
      return { forward: 0, strafe: 0, up: false, down: false, yaw: e.yaw, pitch: e.pitch, primary: false, secondary: false };
    }
    const it: Intent = {
      forward: (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0),
      strafe: (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0),
      up: this.keys.has('Space'),
      down: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
      yaw: this.yaw,
      pitch: this.pitch,
      primary: this.primary,
      secondary: this.secondary,
      block: this.heldBlock,
    };
    if (this.toggleFly) it.toggleFly = true;
    if (this.toggleNoclip) it.toggleNoclip = true;
    if (this.selectSlot !== undefined) it.select = this.selectSlot;
    // consume the one-tick edges
    this.primary = false; this.secondary = false;
    this.toggleFly = false; this.toggleNoclip = false;
    this.selectSlot = undefined;
    return it;
  }
}

/** IdleController: the null movement intent, holding the entity's current look (sticky). */
export class IdleController implements Controller {
  intent(e: Entity, _tick: number): Intent {
    return { ...NULL_INTENT, yaw: e.yaw, pitch: e.pitch };
  }
}

/**
 * ScriptController: a deterministic behavior list for tests/bots. State (step index, ticks
 * left) lives in the instance — one per entity. `repeat` wraps the list. `walkTo` faces
 * the target and walks until within 0.4 m or the timeout; `lookAt` is a one-tick aim from
 * the eye; `dig`/`place` hold the edge for N ticks; `wait` idles.
 */
export type ScriptStep =
  | { op: 'walkTo'; x: number; z: number; timeout: number }
  | { op: 'lookAt'; x: number; y: number; z: number }
  | { op: 'dig'; ticks: number }
  | { op: 'place'; block: number; ticks: number }
  | { op: 'wait'; ticks: number };

const clamp1 = (v: number): number => Math.max(-1, Math.min(1, v));

export class ScriptController implements Controller {
  private readonly steps: ScriptStep[];
  private readonly repeat: boolean;
  private si = 0;
  private ticksLeft = 0;

  constructor(steps: ScriptStep[], repeat = false) {
    this.steps = steps; this.repeat = repeat;
    this.beginStep();
  }

  private ticksFor(s: ScriptStep): number {
    switch (s.op) {
      case 'walkTo': return s.timeout;
      case 'dig': return s.ticks;
      case 'place': return s.ticks;
      case 'wait': return s.ticks;
      case 'lookAt': return 1;
    }
  }

  private beginStep(): void {
    const s = this.steps[this.si];
    this.ticksLeft = s ? this.ticksFor(s) : 0;
  }

  private nextStep(): void {
    this.si++;
    if (this.si >= this.steps.length) {
      if (this.repeat) this.si = 0;
      else return; // exhausted: idle() holds still
    }
    this.beginStep();
  }

  intent(e: Entity, _tick: number): Intent {
    const s = this.steps[this.si];
    if (!s) return { ...NULL_INTENT, yaw: e.yaw, pitch: e.pitch }; // done (no repeat)
    const it: Intent = { ...NULL_INTENT, yaw: e.yaw, pitch: e.pitch };
    switch (s.op) {
      case 'walkTo': {
        const dx = s.x - e.pos.x, dz = s.z - e.pos.z;
        if (Math.hypot(dx, dz) > 0.4) {
          it.yaw = Math.atan2(-dx, -dz); // forward=(-sin,-cos) aimed at (dx,dz)
          it.forward = 1;
        }
        break;
      }
      case 'lookAt': {
        const o = eyeOf(e);
        const dx = s.x - o.x, dy = s.y - o.y, dz = s.z - o.z;
        const l = Math.hypot(dx, dy, dz) || 1;
        const dirx = dx / l, diry = dy / l, dirz = dz / l;
        it.yaw = Math.atan2(-dirx, -dirz);
        it.pitch = Math.asin(clamp1(diry));
        break;
      }
      case 'dig': it.primary = true; break;
      case 'place': it.secondary = true; it.block = s.block; break;
      case 'wait': break;
    }
    this.ticksLeft--;
    if (this.ticksLeft <= 0) this.nextStep();
    return it;
  }
}
```

Add the `MAX_PITCH` constant near the top of `entity.ts` (moved from `main.ts`):

```ts
export const MAX_PITCH = Math.PI / 2 - 0.01; // never go over the top
```

**Step 3: Verify** — `npx vitest run src/__tests__/entity.test.ts src/__tests__/player.test.ts`
(all controllers green; the 2-bot determinism gate holds; `player.test.ts` still green).

**Step 4: Commit**

```
feat: HumanController/IdleController/ScriptController — controllers are the input path (2-bot determinism pinned)
```

---

## Task 6: `persistence.ts` — v2 records + entity restore

**Files:** `src/persistence.ts`, `src/__tests__/persistence.test.ts`

`ChunkRecord` gains optional `entities?`; `WorldMeta` becomes v2 (`entities` +
`viewedEntityId` + `simPrng?`); v1 reads migrate to v2; `snapshotChunk`/`applyRecord`/
`onUnload` carry the entities. `entity.ts` is the source of `EntityRecord`.

**Step 1: Write the failing tests** — append to `src/__tests__/persistence.test.ts` (add to
the persistence import: `type WorldMeta` is already imported; add `import { type EntityRecord, IdleController, Sim } from '../entity'`):

```ts
describe('persistence v2 — entities', () => {
  it('reads a v1 meta (player pose) as a v2 meta (entities + viewedEntityId)', async () => {
    const store = new InMemoryChunkStore();
    const v1 = {
      v: 1, seed: 1234,
      player: { x: 6.5, y: 33, z: 46.5, yaw: -Math.PI / 2, pitch: 0 },
      time: { time: 1, tick: 2, phaseTotal: 0.1 },
      hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 0 },
    };
    await store.put(metaKey(1234), v1 as unknown as StoreValue);
    const p = new Persistence(store, 1234);
    const meta = await p.boot();
    expect(meta!.v).toBe(2);
    expect(meta!.viewedEntityId).toBe(1);
    expect(meta!.entities).toHaveLength(1);
    expect(meta!.entities[0]).toMatchObject({
      id: 1, kindId: 'player', x: 6.5, y: 33, z: 46.5, yaw: -Math.PI / 2, controllerKind: 'human',
    });
  });

  it('round-trips a v2 meta with entities + simPrng', async () => {
    const store = new InMemoryChunkStore();
    const p = new Persistence(store, 1234);
    const rec: EntityRecord = {
      id: 1, kindId: 'player', x: 1, y: 2, z: 3, vx: 0, vy: 0, vz: 0,
      yaw: 0.1, pitch: 0.2, fly: false, noclip: false, controllerKind: 'human',
    };
    const meta: WorldMeta = {
      v: 2, seed: 1234, entities: [rec], viewedEntityId: 1, simPrng: 0xabcdef,
      time: { time: 5, tick: 300, phaseTotal: 0.2 }, hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 0 },
    };
    p.saveMeta(meta);
    const m = await new Persistence(store, 1234).boot();
    expect(m!.entities).toEqual([rec]);
    expect(m!.viewedEntityId).toBe(1);
    expect(m!.simPrng).toBe(0xabcdef);
  });

  it('a chunk record carries frozen entities and applyRecord restores them into the sim', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0); c.edited = true;
    const rec: EntityRecord = {
      id: 7, kindId: 'deer', x: 2, y: 5, z: 9, vx: 0, vy: 0, vz: 0,
      yaw: 0.3, pitch: 0, fly: false, noclip: false, controllerKind: 'idle',
    };
    const chunkRec = snapshotChunk(c, [rec]);
    expect(chunkRec.entities).toEqual([rec]);
    const sim = new Sim(world, {}, 1234);
    applyRecord(world, chunkRec, sim, () => new IdleController());
    expect(sim.all()).toHaveLength(1);
    expect(sim.all()[0].id).toBe(7);
    expect(sim.all()[0].pos.x).toBe(2);
    // A v1 chunk record (no entities) restores with no entities.
    const v1 = snapshotChunk(c);
    delete (v1 as { entities?: unknown }).entities;
    const sim2 = new Sim(world, {}, 1234);
    applyRecord(world, v1, sim2, () => new IdleController());
    expect(sim2.all()).toHaveLength(0);
  });
});
```

**Step 2: Implement** — `src/persistence.ts`:

1. Import the types:

```ts
import { type EntityRecord, type Controller } from './entity';
```

2. Bump `ChunkRecord` and `WorldMeta`:

```ts
export interface ChunkRecord {
  v: 2;
  cx: number; cy: number; cz: number;
  blocks: Uint8Array;
  meta: Uint8Array;
  wlevel: Uint8Array; wsource: Uint8Array; wplaced: Uint8Array; wstream: Uint8Array;
  entities?: EntityRecord[]; // entities frozen in this chunk when it unloads (phase 2+)
}

export interface WorldMeta {
  v: 2;
  seed: number;
  entities: EntityRecord[];      // entities whose chunk is loaded at save time
  viewedEntityId: number;
  simPrng?: number;              // the sim PRNG state (phase 2 draws from it; phase 3 restores it)
  time: { time: number; tick: number; phaseTotal: number };
  hotbar: { slots: number[]; selected: number };
}
```

3. `snapshotChunk` gains the entities parameter:

```ts
export function snapshotChunk(c: Chunk, entities?: EntityRecord[]): ChunkRecord {
  const rec: ChunkRecord = {
    v: 2,
    cx: c.cx, cy: c.cy, cz: c.cz,
    blocks: c.blocks.slice(), meta: c.meta.slice(),
    wlevel: c.wlevel.slice(), wsource: c.wsource.slice(),
    wplaced: c.wplaced.slice(), wstream: c.wstream.slice(),
  };
  if (entities && entities.length) rec.entities = entities;
  return rec;
}
```

4. `applyRecord` restores frozen entities when given a sim + controller factory:

```ts
export function applyRecord(
  world: World, r: ChunkRecord,
  sim?: { restoreEntities(records: EntityRecord[], f: (r: EntityRecord) => Controller): void },
  controllerFor?: (r: EntityRecord) => Controller,
): void {
  const c = world.ensureChunk(r.cx, r.cy, r.cz);
  c.blocks.set(r.blocks); c.meta.set(r.meta);
  c.wlevel.set(r.wlevel); c.wsource.set(r.wsource);
  c.wplaced.set(r.wplaced); c.wstream.set(r.wstream);
  c.settled = true; c.edited = true;
  c.editGen = 1; c.savedGen = 1; c.dirty = false;
  if (r.entities && sim && controllerFor) sim.restoreEntities(r.entities, controllerFor);
}
```

5. `PersistSource.onUnload` + `Persistence.onUnload` carry entities:

```ts
onUnload(c: Chunk, entities?: EntityRecord[]): void {
  if (!c.edited) return;
  const k = this.key(c.cx, c.cy, c.cz);
  const rec = snapshotChunk(c, entities);
  // ...unchanged warm-cache + write-through below...
}
```

and the interface:

```ts
export interface PersistSource {
  hasPersisted(cx: number, cy: number, cz: number): boolean;
  syncRecord(cx: number, cy: number, cz: number): ChunkRecord | undefined;
  fetchRecord(cx: number, cy: number, cz: number): Promise<ChunkRecord | undefined>;
  onUnload(c: Chunk, entities?: EntityRecord[]): void;
  dropPersisted(cx: number, cy: number, cz: number): void;
}
```

6. `boot()` migrates a v1 meta to v2 (a v1 chunk record reads with `entities` absent):

```ts
const m = await this.store.get(metaKey(this.seed));
if (m) this.meta = migrateMeta(m);
// ...
return this.meta;

function migrateMeta(m: StoreValue): WorldMeta | null {
  if (!m || !('v' in m)) return null;
  if (m.v === 2) return m as WorldMeta;
  const v1 = m as { seed: number; player: { x: number; y: number; z: number; yaw: number; pitch: number }; time: WorldMeta['time']; hotbar: WorldMeta['hotbar'] };
  return {
    v: 2, seed: v1.seed,
    entities: [{
      id: 1, kindId: 'player',
      x: v1.player.x, y: v1.player.y, z: v1.player.z,
      vx: 0, vy: 0, vz: 0,
      yaw: v1.player.yaw, pitch: v1.player.pitch,
      fly: false, noclip: false, controllerKind: 'human',
    }],
    viewedEntityId: 1,
    time: v1.time, hotbar: v1.hotbar,
  };
}
```

Note: `saveLoaded`/`saveMeta`/`onUnload` all write v2 unchanged; a v1 chunk record (no
`entities`) is read as-is (the field is absent → no entities restored). The only migration
is the v1 **meta** → v2 (the player pose becomes entity id 1, the viewed entity).

**Step 3: Verify** — `npx vitest run src/__tests__/persistence.test.ts src/__tests__/streaming.test.ts src/__tests__/water-load.test.ts`
(v2 tests green; the existing persistence + streaming + water-load suites still pass — the
`applyRecord`/`onUnload` signature changes are backward compatible).

**Step 4: Commit**

```
feat: persistence v2 — entity records ride chunks + meta (v1 meta migrates to a single viewed player)
```

---

## Task 7: `streaming.ts` — entities ride the unload

**Files:** `src/streaming.ts`, `src/__tests__/streaming.test.ts`

`update` takes an optional `sim` so it can snapshot the frozen entities in a chunk as it
unloads, and pass them to `persist.onUnload` (the edited-only gate is unchanged — entities
ride only when the chunk is written).

**Step 1: Write the failing tests** — append to `src/__tests__/streaming.test.ts` (add to
the imports: `import { Sim, IdleController, type EntityRecord } from '../entity'` and
`import type { PersistSource } from '../persistence'`):

```ts
describe('streaming — entities ride the unload', () => {
  it('threads frozen entities into the onUnload record when the chunk unloads', () => {
    const world = new World();
    const sim = new Sim(world, {}, 1234);
    const e = sim.spawn({ x: 4, y: 5, z: 4 }, new IdleController()); // chunk (0,0,0)
    world.getChunk(0, 0, 0)!.edited = true; // so onUnload snapshots it
    let captured: EntityRecord[] | undefined;
    const persist: PersistSource = {
      hasPersisted: () => false,
      syncRecord: () => undefined,
      fetchRecord: () => Promise.resolve(undefined),
      onUnload: (_c, entities) => { captured = entities; },
      dropPersisted: () => {},
    };
    update(world, 4, 4, 2, persist, sim); // anchor far -> (0,0,0) is outside the ring and unloads
    expect(captured).toBeDefined();
    expect(captured!.some((r) => r.id === e.id)).toBe(true);
  });

  it('passes no entities when the sim is absent (unchanged behavior)', () => {
    const world = new World();
    world.getChunk(0, 0, 0)!.edited = true;
    let captured: EntityRecord[] | undefined = 'sentinel' as never;
    const persist: PersistSource = {
      hasPersisted: () => false,
      syncRecord: () => undefined,
      fetchRecord: () => Promise.resolve(undefined),
      onUnload: (_c, entities) => { captured = entities; },
      dropPersisted: () => {},
    };
    update(world, 4, 4, 2, persist);
    expect(captured).toBeUndefined();
  });
});
```

**Step 2: Implement** — `src/streaming.ts`:

1. Add the structural entity source + the import:

```ts
import { type EntityRecord } from './entity';

/** The entity view streaming needs for the unload path (dependency inversion, as PersistSource). */
export interface EntitySource {
  entitiesInChunk(cx: number, cy: number, cz: number): import('./entity').Entity[];
  toRecord(e: import('./entity').Entity): EntityRecord;
}
```

2. `update` gains the `sim` parameter and threads entities on unload:

```ts
export function update(world: World, pcx: number, pcz: number, pcy = 2, persist?: PersistSource, sim?: EntitySource): StreamingUpdate {
  // ...unchanged load / remesh passes...
  for (const c of doomed) {
    const ents = sim ? sim.entitiesInChunk(c.cx, c.cy, c.cz).map((e) => sim.toRecord(e)) : undefined;
    persist?.onUnload(c, ents); // the edited-only gate is unchanged; entities ride the chunk
    markNeighborsDirty(world, c.cx, c.cy, c.cz, pcx, pcz);
    world.removeChunk(c.cx, c.cy, c.cz);
    unloaded.push({ cx: c.cx, cy: c.cy, cz: c.cz });
  }
  // ...
}
```

(The only change to the unload loop is the `onUnload(c, ents)` call and the new optional
`sim` parameter; `unloaded.push` and `markNeighborsDirty` are unchanged.)

**Step 3: Verify** — `npx vitest run src/__tests__/streaming.test.ts` (new tests green; the
existing streaming A/B/C suites still pass — `sim` is optional).

**Step 4: Commit**

```
feat: streaming — frozen entities ride the edited-only unload record
```

---

## Task 8: `main.ts` — the refactor

**Files:** `src/main.ts`. Verify with `npm run build` + `npm test` + the Task 9 browser
checklist.

This is the integration: the water sim is renamed, the entity `Sim` + `HumanController`
take over the input path and the substep loop, and every read of "the player" becomes a
read of the **viewed** entity.

**Step 1: Imports** — add to the top (and drop `EYE` from the player import — the kind
supplies the eye):

```ts
import { Player } from './player'; // legacy class stays for player.test.ts; no longer instantiated
import { Sim, HumanController, eyeOf, lookDir, breakRayTarget, type ApplyHooks, type Controller, type EntityRecord } from './entity';
```

**Step 2: Rename the water sim.** `const sim = new WaterSim(world);` →
`const waterSim = new WaterSim(world);`. Replace every `sim.` that referred to the WaterSim
(`cellState`, `restore`, `settle`, `edit`, `tick`, `touched`) with `waterSim.` — including
the `springTarget` closure, `onMouseDown` (now removed), `toggleDoorPair`/`clearDoorPartner`
(now moved to `entity.ts`), `startGame`, `tickStreaming`, and the frame-end drain.

**Step 3: The entity sim + hooks + human controller.** After `waterSim`/`lightSim`/
`remeshAround` are defined:

```ts
// The sim-owned edit origin (ADR 0015): world mutations flow through applyIntent, which
// calls these. remeshAround + lightSim.edit are the "onEdit"; waterSim.edit is the
// water-sim edit-origin; the spring check is the only targetable water.
const simHooks: ApplyHooks = {
  onEdit: (x, y, z) => { remeshAround(x, y, z); lightSim.edit(x, y, z); },
  waterEdit: (x, y, z, block) => { waterSim.edit(x, y, z, block); },
  springTarget: (x, y, z) => waterSim.cellState(x, y, z).p === 1,
};
const sim = new Sim(world, simHooks, TERRAIN_SEED);
```

Move `MAX_PITCH` out of the input section (it now lives in `entity.ts`); keep `const keys =
new Set<string>();`, and after it:

```ts
const human = new HumanController(keys, 0, 0);
```

**Step 4: Input → the human controller.** Rewrite the handlers to drive `human` (the
hotbar is still driven directly here — `select` is reported but unwired in phase 1):

```ts
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'KeyF') human.toggleFly();
  if (e.code === 'KeyN') human.toggleNoclip();
  if (e.code === 'KeyE') togglePalette();
  if (e.code === 'KeyH') toggleHelp();
  if (e.code === 'KeyC') setWireframe(!wireframeOn);
  const d = e.code.startsWith('Digit') ? e.code.slice(5) : e.code.startsWith('Numpad') ? e.code.slice(6) : '';
  if (d >= '1' && d <= '9') { const s = Number(d) - 1; hotbar.select(s); human.select(s); }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  human.mouse(e.movementX, e.movementY);
});
```

The wheel handler gains the reported select:

```ts
hotbar.cycle(e.deltaY > 0 ? 1 : -1);
human.select(hotbar.selected);
```

Delete `readMove` (the human controller builds its intent from `keys` directly).

**Step 5: Actions.** Delete `castFromCamera`, `onMouseDown`'s body, and the door/torch
helpers (they moved to `entity.ts`). `onMouseDown` becomes a two-line edge-setter:

```ts
function onMouseDown(e: MouseEvent): void {
  if (e.button === 0) human.primary();
  else if (e.button === 2) human.secondary();
}
```

Replace `castFromCamera` with a viewed-entity break cast (identical math to the old camera
cast):

```ts
function castBreakFromViewed(): RayHit | null {
  const ve = sim.viewed();
  if (!ve) return null;
  return raycastVoxel(world, eyeOf(ve), lookDir(ve.yaw, ve.pitch), REACH, breakRayTarget(world, simHooks));
}
```

and `updateHitbox` uses it:

```ts
function updateHitbox(): void {
  const hit = pointerLocked ? castBreakFromViewed() : null;
  if (!hit) { hitbox.visible = false; return; }
  hitbox.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
  hitbox.visible = true;
}
```

**Step 6: Camera + water fx from the viewed entity.** Delete `const player = new Player(...)`.

```ts
function syncCamera(): void {
  const ve = sim.viewed();
  if (!ve) return;
  camera.position.set(ve.pos.x, ve.pos.y + ve.kind.eye, ve.pos.z);
  camera.rotation.set(ve.pitch, ve.yaw, 0);
}
```

`syncWaterFx` reads the viewed entity's `headInWater`:

```ts
function syncWaterFx(): void {
  const ve = sim.viewed();
  const m: 'air' | 'water' = ve?.headInWater ? 'water' : 'air';
  if (m === waterFx) return;
  waterFx = m;
  camera.fov = m === 'water' ? FOV_WATER : FOV_AIR;
  camera.updateProjectionMatrix();
}
```

**Step 7: `metaSnapshot` v2 + save points.**

```ts
function metaSnapshot(): WorldMeta {
  return {
    v: 2, seed: TERRAIN_SEED,
    entities: sim.all().map((e) => sim.toRecord(e)),
    viewedEntityId: sim.viewedId,
    simPrng: sim.rng.state(),
    time: worldTime.snapshot(),
    hotbar: { slots: [...hotbar.slots], selected: hotbar.selected },
  };
}
```

The save-point block is unchanged (it calls `persist.saveLoaded(world.allChunks(),
metaSnapshot())`).

**Step 8: `startGame` — spawn/restore entities.** The boot-column restore passes the sim +
a controller factory (frozen non-viewed entities → idle):

```ts
const streamControllerFor = (r: EntityRecord): Controller => new (class extends IdleController {})();
```

Actually keep it simple — `streamControllerFor = (_r) => new IdleController()` (import
`IdleController`). In the boot-column loop, `applyRecord(world, rec)` →
`applyRecord(world, rec, sim, streamControllerFor)`.

Replace the meta/fresh player block:

```ts
if (meta) {
  worldTime.restore(meta.time);
  sim.restoreEntities(meta.entities, (r) => (r.id === meta.viewedEntityId ? human : new IdleController()));
  sim.setViewed(meta.viewedEntityId);
  if (meta.simPrng !== undefined) sim.rng.restore(meta.simPrng);
  if (meta.hotbar?.slots?.length === 9) { /* unchanged hotbar restore */ }
} else {
  const p = sim.spawn(SPAWN, human, { yaw: -Math.PI / 2, kindId: 'player' });
  sim.setViewed(p.id);
  sim.respawn = { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z };
  hotbar.select(PALETTE_BLOCKS.indexOf(Block.Planks));
}
if (profMode) {
  human.frozen = true;
  const ve = sim.viewed(); if (ve) ve.noclip = true;
}
profRig = profMode
  ? new ProfRig({ seed: TERRAIN_SEED, phase: meta ? worldTime.dayPhase : startPhase, render: !profNoRender,
                 anchor: { x: sim.viewed()!.pos.x, y: sim.viewed()!.pos.y, z: sim.viewed()!.pos.z } })
  : null;
syncCamera();
requestAnimationFrame(frame);
```

**Step 9: `tickStreaming` — anchor the viewed entity + pass the sim.**

```ts
function tickStreaming(): void {
  const ve = sim.viewed();
  if (!ve) return;
  const r = streaming.update(world, chunkOf(ve.pos.x), chunkOf(ve.pos.z), chunkOf(ve.pos.y), persist, sim);
  // ...unloaded / rebuilt / restored handling unchanged, but the cold-restore stale check
  //    uses the viewed position: streaming.inRange(c.cx, c.cz, chunkOf(ve.pos.x), chunkOf(ve.pos.z))
  // and the applyRecord in the .then gains the sim + factory:
  //    applyRecord(world, rec, sim, streamControllerFor);
}
```

**Step 10: The frame loop.** The substep loop becomes the sim heartbeat; the rig pins the
**viewed** entity; the water pulse/drain read `waterSim`:

```ts
function frame(now: number): void {
  const profT0 = profMode ? performance.now() : 0;
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1;
  acc += dt;
  const tickBefore = worldTime.tick;
  human.heldBlock = hotbar.block; // sync the held block for intents (per frame)
  while (acc >= STEP) {
    acc -= STEP;
    sim.tick(STEP, worldTime.tick); // intent -> applyIntent -> stepEntity, in id order
    worldTime.advance(STEP);
  }
  tickStreaming();
  if (profRig) {
    const wc = world.getChunk(2, 1, 0);
    const wp = profRig.beginFrame({
      worstLoaded: wc !== undefined,
      worstSettled: wc !== undefined && !pendingRebuild.has(PROF_WORST_KEY) && !scheduler.has(PROF_WORST_KEY),
    }).waypoint;
    const ve = sim.viewed(); // the rig pins the viewed entity (frame-end write, same as today)
    if (ve) { ve.pos.x = wp.x; ve.pos.y = wp.y; ve.pos.z = wp.z; ve.vel = { x: 0, y: 0, z: 0 }; }
  }
  lightSim.tick(LIGHT_TICK_BUDGET);
  if (tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)) waterSim.tick(WATER_PULSE);
  for (const key of waterSim.touched) pendingRebuild.add(key);
  waterSim.touched.clear();
  // ...the light/deferredFirstMesh/rebuild budget block is unchanged...
}
```

**Step 11: Delete the now-dead code.** Remove `MAX_PITCH` (moved to `entity.ts`),
`readMove`, `castFromCamera`, `_doorFwd`, `torchFaceFromNormal`, `doorPartner`,
`toggleDoorPair`, `clearDoorPartner`, `springTarget`, the old `const player = new Player(...)`,
and every `player.` reference. `remeshAround` stays (the `onEdit` hook uses it).

**Step 12: Verify** — `npm run build` (type-check clean) and `npm test` (the full node
suite, including `player.test.ts` untouched and green). Then the browser checklist (Task 9).

**Step 13: Commit**

```
feat: main.ts entity/controller refactor — the player is the viewed entity; edits flow through applyIntent
```

---

## Task 9: gates + ADR 0015 + docs

**Files:** `docs/adr/0015-entities-controllers.md` (new), `docs/adr/README.md`,
`PROJECT.md`.

**Step 1: Full gate.** `npm test` (green, including `water-load` PIN 1,231,601 / 10,690 and
the `mesher-budget` pins) and `npm run build` (clean).

**Step 2: Browser acceptance** (manual; `npm run dev`):
- Play feels identical to before; break/place/door-use work; the crosshair lights the break
  target; fly (F) and noclip (N) toggles work; water mood (underwater FX) triggers.
- The `?prof=remesh` rig (ADR 0013) still passes (`npm run prof`) — the rig now pins the
  viewed entity, behavior unchanged.
- A reload restores the player's position, look, clock and hotbar (v2 meta; a v1 save
  still loads).

**Step 3: ADR 0015.** Write `docs/adr/0015-entities-controllers.md` (Status: Accepted;
Sources: the spec + plan). Capture, at least: the model (Entity/EntityKind/Intent/
Controller); the four deliberate deviations from the brief's model (`Intent.block`,
`EntityKind.flySpeed/flyVSpeed`, sticky absolute look, `select` reported but unwired in
phase 1); why `player.ts` stays (compatibility, `player.test.ts` untouched); the sim-owned
action path (raycast from the entity's eye, the `hooks` struct, capability gate); the loop
(id order, chunk-frozen, fall-out respawn/despawn); the ≤ 1-substep edit skew (documented);
the persistence v2 shape + the v1→v2 meta migration + the "entities ride the edited-only
gate" consequence (`[POC shortcut]`); the sim PRNG existing now for phases 2/3. Alternatives
considered: keeping the camera as the action source of truth (rejected — it breaks
replay/remote identity), threading `sim` into `applyIntent` directly (rejected — the hooks
keep `entity.ts` dependency-light), a thin `Player` wrapper (rejected — the constants are
re-exported from `player.ts`, so the old file stays the single source).

**Step 4: Docs.** Update `docs/adr/README.md` (add 0015 to the index) and `PROJECT.md`
(the feature/ownership table + a pointer to ADR 0015). No `TODO.md` change is required in
phase 1 (the multiplayer item lands in phase 3).

**Step 5: Commit**

```
docs: ADR 0015 — entities & controllers (the player is just an entity with a controller)
```

---

## Self-review

- **Brief coverage (phase 1):** model (`Entity`/`EntityKind`/`Intent`/`Controller`) ✓;
  `stepEntity` port with the kind-table pin + 300-tick 1e-9 equivalence ✓; `applyIntent`
  (sim-owned, camera-free, capability-gated) ✓; loop (id order, chunk-frozen, respawn/
  despawn) ✓; controllers (Human/Idle/Script + ProfRig pinning) ✓; persistence v2
  (entities ride chunks + meta, v1 migration) ✓; gate (`player.test.ts` untouched,
  `water-load`/`mesher-budget` unchanged, 2-bot 600-tick determinism, browser identical) ✓;
  ADR 0015 ✓.
- **Deviations vs the brief's model** (all in the spec, all deliberate): `Intent.block`,
  `EntityKind.flySpeed/flyVSpeed`, sticky absolute look, `select` unwired in phase 1.
- **Type-check ordering:** `entity.ts` compiles fully only after Task 5 (controllers).
  Tasks 2–4 verify via `vitest run src/__tests__/entity.test.ts`; do a full `tsc`/`npm run
  build` after Task 8.
- **Known risks:** (a) the ≤ 1-substep edit skew (documented, negligible for play); (b)
  `main.ts` hunk 2 (rename `sim`→`waterSim`) touches many lines — verify no stray `sim.`
  remains by the build; (c) the v1→v2 meta migration must not drop the player pose (pinned
  by the Task 6 test); (d) the streaming `unloaded.push` shape is unchanged — only the
  `onUnload` call gains the entities arg.
- **Execution order:** Tasks 1→9 in order; Task 8 is the integration; the branch is created
  in Task 1 before any file write. Phase 2 starts only after Task 9's gate is green.