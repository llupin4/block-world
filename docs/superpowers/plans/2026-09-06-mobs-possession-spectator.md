# Plan: mobs, possession, spectator — one deer, drive any entity, a spectator ghost

Spec: `docs/superpowers/specs/2026-09-06-mobs-possession-spectator-design.md`
Task brief: `docs/plans/entities-controllers.md` (phase 2 section)
Branch: continue on `entities-controllers`. Prerequisite: the **phase 1 plan**
(`2026-09-06-entities-controllers.md`) is fully implemented and its gate green — this plan's
code runs only after the phase 1 code is in. (All phase docs are committed together in one
up-front docs commit; the code is implemented phase-by-phase.) Phase 2 of 3. Durable record:
ADR 0016.

## Goal

Add one mob (the **deer**, a grazing quadruped), **possession** (drive any entity, including
a spectator ghost), and the **spectator** kind — all on top of the phase 1 entity/sim. Every
state change still flows through intents on the tick; **all randomness is sim-owned and
tick-ordered** (never `Math.random`) so phase 3's replays stay deterministic.

## Architecture

- `src/entity.ts` — `KINDS.deer` + `KINDS.spectator`; `MobController` (wander AI, draws from
  the sim PRNG) + `mobRefuseStep`/`nearestGrass` (pure); possession primitives
  `possess`/`returnHome`/`spectate` (pure, mutate the `Sim`); `Sim.homeId`/`Sim.ghostId` and
  `spawn(baseController)`; `controllerKindOf` recognizes `MobController`.
- `src/raycast.ts` — `pickEntity` (nearest entity AABB before the voxel hit).
- `src/spawn.ts` (new) — `isDeerSpawnCell`/`rollDeerSpawns` (pure, deterministic).
- `src/entity-mesh.ts` (new) — the box-part rigs; the **animation math is pure and
  node-testable** (`advanceRigAnim`/`legAngles`/`horizontalSpeed`); the three.js build/update
  is browser-only.
- `src/main.ts` — rig rendering + transform updates (hide the viewed rig), the HUD kind label
  + hotbar visibility, the `P` possession handler (entity-pick), deer spawn on chunk load +
  despawn on unload, and the single spectator ghost.

## Tech stack

Existing only: TypeScript + vitest + three. No new dependencies.

## File map

| File | Action |
|------|--------|
| `docs/superpowers/specs/2026-09-06-mobs-possession-spectator-design.md` | new (Task 1) |
| `docs/superpowers/plans/2026-09-06-mobs-possession-spectator.md` | new — this file (Task 1) |
| `src/entity.ts` | edit (Task 2) |
| `src/__tests__/entity.test.ts` | edit (Task 2) |
| `src/raycast.ts` | edit (Task 3) |
| `src/__tests__/raycast.test.ts` | edit (Task 3) |
| `src/spawn.ts` | new (Task 4) |
| `src/__tests__/spawn.test.ts` | new (Task 4) |
| `src/entity-mesh.ts` | new (Task 5) |
| `src/__tests__/entity-mesh.test.ts` | new (Task 5) |
| `src/main.ts` | edit (Task 6) |
| `index.html` | edit (Task 6 — the `#kind` label) |
| `docs/adr/0016-mobs-possession-spectator.md` | new (Task 7) |
| `docs/adr/README.md`, `PROJECT.md` | edit (Task 7) |

## Pinned numbers (must not regress)

`deer`: `half 0.45`, `height 0.9`, `eye 0.7`, `walkSpeed 1.6`, `swimSpeed 1.0`, `jumpVel
8.0`; `spectator`: `eye 1.62`, `flySpeed 8`, `flyVSpeed 8`; leg-swing `amp 0.5` and
`rate` per kind (`deer 6`, `player 4` rad per m); spawn cap `DEER_CAP 6`, `DEER_PER_CHUNK
2`; drop refusal = **3** cells; `REACH 6`; all phase 1 pins unchanged.

## Execution notes

- TDD per task: failing tests first, then implementation, run, commit.
- The phase 1 gate must stay green after every task (`player.test.ts`, `water-load`,
  `mesher-budget`, the phase 1 2-bot determinism).
- The three.js rig build (`buildEntityRig`/`updateEntityRig`) is browser-only — no node test;
  only the pure animation math is unit-tested. Verify the rig in the Task 7 browser gate.

---

## Task 1: gate check (docs already committed)

**Files:** none — the spec + this plan were committed in the up-front docs commit.

**Step 1:** Confirm the phase 1 gate is green (`npm test` + `npm run build`) before starting
phase 2. This also confirms the phase 1 code (entities/sim/persistence v2) is in — this plan
builds on it.

**Step 2:** (No commit here — the phase 2 docs were committed up front with the other phase
docs. The code commits happen in Tasks 2–7.)

---

## Task 2: `entity.ts` — deer/spectator kinds, `MobController`, possession

**Files:** `src/entity.ts`, `src/__tests__/entity.test.ts`

**Step 1: Write the failing tests** — append to `src/__tests__/entity.test.ts` (extend the
`../entity` import with `Sim, HumanController, IdleController, SimRng, controllerKindOf,
MobController, mobRefuseStep, possess, returnHome, spectate`; `KINDS`, `stepEntity`,
`Entity`, `NULL_INTENT` are already imported, and `Block`/`World`/`localIndex`/the local
`const STEP` are already available):

```ts
describe('entity — deer + spectator kinds', () => {
  it('KINDS.deer is the grazing quadruped (all pinned numbers)', () => {
    const k = KINDS.deer;
    expect(k.half).toBeCloseTo(0.45, 9);
    expect(k.height).toBeCloseTo(0.9, 9);
    expect(k.eye).toBeCloseTo(0.7, 9);
    expect(k.walkSpeed).toBeCloseTo(1.6, 9);
    expect(k.swimSpeed).toBeCloseTo(1.0, 9);
    expect(k.jumpVel).toBeCloseTo(8.0, 9); // apex 8^2/56 ~ 1.14 m: clears a 1-block ledge
    expect(k.flySpeed).toBeCloseTo(0, 9); expect(k.flyVSpeed).toBeCloseTo(0, 9);
    expect(k.canEdit).toBe(false); expect(k.canFly).toBe(false);
    expect(k.canNoclip).toBe(false); expect(k.collides).toBe(true);
  });

  it('KINDS.spectator is a non-colliding ghost (all pinned numbers)', () => {
    const k = KINDS.spectator;
    expect(k.half).toBeCloseTo(0.3, 9); expect(k.height).toBeCloseTo(1.8, 9);
    expect(k.eye).toBeCloseTo(1.62, 9);
    expect(k.walkSpeed).toBeCloseTo(8, 9); expect(k.swimSpeed).toBeCloseTo(5, 9);
    expect(k.jumpVel).toBeCloseTo(0, 9);
    expect(k.flySpeed).toBeCloseTo(8, 9); expect(k.flyVSpeed).toBeCloseTo(8, 9);
    expect(k.canFly).toBe(true); expect(k.canNoclip).toBe(true);
    expect(k.canEdit).toBe(false); expect(k.collides).toBe(false);
  });

  it('controllerKindOf recognizes a MobController', () => {
    const c = new MobController(() => Block.Air, () => 0.5);
    expect(controllerKindOf(c)).toBe('mob');
  });
});

describe('entity — MobController', () => {
  it('mobRefuseStep: water ahead, a >=3 drop, and a flat step', () => {
    const water = (x: number, _y: number, z: number) => (z <= 0 ? Block.Water : Block.Air);
    expect(mobRefuseStep(water, 0, 5, 1, 0)).toBe('water'); // facing -Z into water
    const floor = (x: number, y: number, z: number) => (y <= 4 ? Block.Stone : Block.Air);
    expect(mobRefuseStep(floor, 0.5, 5, 0.5, 0)).toBeNull(); // flat floor ahead
    const pit = (x: number, y: number, z: number) => (y === 4 && x >= 0 ? Block.Stone : Block.Air);
    expect(mobRefuseStep(pit, 0.5, 5, 0.5, Math.PI / 2)).toBe('drop'); // -X is a pit
  });

  function deerPath(seed: number): number[] {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, 4, lz)] = Block.Grass;
    const rng = new SimRng(seed);
    const ctrl = new MobController((x, y, z) => world.getBlock(x, y, z), () => rng.next());
    const e: Entity = {
      id: 1, kind: KINDS.deer, pos: { x: 8, y: 5, z: 8 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0, pitch: 0, onGround: false, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: ctrl, baseController: ctrl,
    };
    const pts: number[] = [];
    for (let i = 0; i < 1200; i++) {
      const it = ctrl.intent(e, i);
      stepEntity(world, e, it, STEP);
      pts.push(Math.round(e.pos.x * 1000), Math.round(e.pos.z * 1000));
    }
    return pts;
  }

  it('a fixed seed drives a deterministic 1200-tick path', () => {
    expect(deerPath(1234)).toEqual(deerPath(1234));
  });

  it('the deer actually wanders (a non-trivial path)', () => {
    const p = deerPath(1234);
    const cells = new Set<number[]>();
    for (let i = 0; i < p.length; i += 2) cells.add([p[i], p[i + 1]].join(','));
    expect(cells.size).toBeGreaterThan(10);
  });
});

describe('entity — possession', () => {
  function simWithBodyAndDeer() {
    const world = new World();
    const sim = new Sim(world, {}, 1234);
    const human = new HumanController(new Set<string>());
    // The player body's home controller is IdleController (it stands idle when left); pass
    // it explicitly — the spawn default would otherwise re-bind baseController to `human`.
    const body = sim.spawn({ x: 0, y: 5, z: 0 }, human, { kindId: 'player', baseController: new IdleController() });
    sim.homeId = body.id;
    const mob = new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next());
    const deer = sim.spawn({ x: 1, y: 5, z: 0 }, mob, { kindId: 'deer', baseController: mob });
    const ghost = sim.spawn({ x: 0, y: 9, z: 0 }, new IdleController(), { kindId: 'spectator', baseController: new IdleController() });
    sim.ghostId = ghost.id;
    return { sim, world, human, body, deer, ghost };
  }

  it('possess swaps the human to the target and releases the body to idle; returnHome restores', () => {
    const { sim, human, body, deer } = simWithBodyAndDeer();
    expect(sim.viewedId).toBe(body.id);
    possess(sim, human, deer.id);
    expect(sim.viewedId).toBe(deer.id);
    expect(deer.controller).toBe(human);
    expect(body.controller).toBeInstanceOf(IdleController); // body released to idle
    returnHome(sim, human);
    expect(sim.viewedId).toBe(body.id);
    expect(body.controller).toBe(human);
    expect(deer.controller).toBeInstanceOf(MobController); // deer resumed its AI
  });

  it('spectate moves the human to the single ghost; returnHome restores the body', () => {
    const { sim, human, body, ghost } = simWithBodyAndDeer();
    spectate(sim, human);
    expect(sim.viewedId).toBe(ghost.id);
    expect(ghost.controller).toBe(human);
    expect(body.controller).toBeInstanceOf(IdleController); // the body was released to idle
    returnHome(sim, human);
    expect(sim.viewedId).toBe(body.id);
    expect(body.controller).toBe(human);
    expect(ghost.controller).toBeInstanceOf(IdleController); // the ghost is released
  });

  it('spawn default: baseController defaults to the passed controller (a bot keeps its script)', () => {
    const { sim } = simWithBodyAndDeer();
    const script = new IdleController(); // stand-in for a ScriptController instance
    const bot = sim.spawn({ x: 2, y: 5, z: 0 }, script, { kindId: 'player' });
    expect(bot.baseController).toBe(script); // not re-bound to a fresh IdleController
  });
});
```

**Step 2: Implement** — `src/entity.ts`:

1. Add the two kinds to `KINDS`:

```ts
  deer: {
    id: 'deer',
    half: 0.45, height: 0.9, eye: 0.7,
    walkSpeed: 1.6, swimSpeed: 1.0, jumpVel: 8.0,
    flySpeed: 0, flyVSpeed: 0,
    canFly: false, canNoclip: false, canEdit: false,
    collides: true,
  },
  spectator: {
    id: 'spectator',
    half: 0.3, height: 1.8, eye: 1.62,
    walkSpeed: 8, swimSpeed: 5, jumpVel: 0,
    flySpeed: 8, flyVSpeed: 8,
    canFly: true, canNoclip: true, canEdit: false,
    collides: false,
  },
```

2. `GetBlock` + `mobRefuseStep` + `nearestGrass` + `MobController`:

```ts
export type GetBlock = (x: number, y: number, z: number) => number;

/** Refuse a step into water or off a >=3-block drop (the deer's local obstacle rule). */
export function mobRefuseStep(getBlock: GetBlock, x: number, y: number, z: number, heading: number): 'water' | 'drop' | null {
  const fx = -Math.sin(heading), fz = -Math.cos(heading);
  const ax = Math.floor(x + fx), az = Math.floor(z + fz);
  const fy = Math.floor(y);
  if (getBlock(ax, fy, az) === Block.Water) return 'water';
  if (getBlock(ax, fy - 1, az) === Block.Air && getBlock(ax, fy - 2, az) === Block.Air && getBlock(ax, fy - 3, az) === Block.Air) return 'drop';
  return null;
}

/** Nearest grass surface cell within `radius` of (x,y,z) (for "turn toward grass"); null if none. */
export function nearestGrass(getBlock: GetBlock, x: number, y: number, z: number, radius: number): { x: number; z: number } | null {
  const cx = Math.floor(x), cy = Math.floor(y), cz = Math.floor(z);
  let best: { x: number; z: number; d: number } | null = null;
  for (let dz = -radius; dz <= radius; dz++)
    for (let dx = -radius; dx <= radius; dx++) {
      const wx = cx + dx, wz = cz + dz;
      for (let wy = cy - 1; wy <= cy + 1; wy++) {
        if (getBlock(wx, wy, wz) === Block.Grass && getBlock(wx, wy + 1, wz) === Block.Air) {
          const d = dx * dx + dz * dz;
          if (!best || d < best.d) best = { x: wx, z: wz, d };
        }
      }
    }
  return best ? { x: best.x, z: best.z } : null;
}

/**
 * The deer's wander AI. Draws EVERY random from the sim PRNG (`rand`) — the sim's fixed
 * id-order iteration keeps the draw sequence deterministic (never Math.random, never a
 * wall clock). Modes: wander (walk a random number of ticks) and idle (stand, then
 * re-face — sometimes toward the nearest grass). A stall (forward intent but no progress)
 * for 30 ticks forces a turn. Refuses water and >=3 drops via mobRefuseStep.
 */
export class MobController implements Controller {
  private readonly world: GetBlock;
  private readonly rand: () => number;
  private mode: 'wander' | 'idle' = 'wander';
  private ticksLeft = 0;
  private heading: number;
  private stall = 0;
  private lastX = 0; private lastZ = 0;
  private first = true;

  constructor(world: GetBlock, rand: () => number) {
    this.world = world;
    this.rand = rand;
    this.heading = rand() * Math.PI * 2;
    this.ticksLeft = 60 + Math.floor(rand() * 150);
  }

  intent(e: Entity, _tick: number): Intent {
    const it: Intent = { ...NULL_INTENT, yaw: this.heading, pitch: e.pitch };
    if (this.first) { this.lastX = e.pos.x; this.lastZ = e.pos.z; this.first = false; }
    if (this.ticksLeft <= 0) {
      if (this.mode === 'wander') {
        this.mode = 'idle';
        this.ticksLeft = 30 + Math.floor(this.rand() * 60);
      } else {
        this.mode = 'wander';
        this.ticksLeft = 60 + Math.floor(this.rand() * 150);
        if (this.rand() < 0.5) {
          const g = nearestGrass(this.world, e.pos.x, e.pos.y, e.pos.z, 8);
          this.heading = g ? Math.atan2(-(g.x - e.pos.x), -(g.z - e.pos.z)) : this.rand() * Math.PI * 2;
        } else {
          this.heading = this.rand() * Math.PI * 2;
        }
      }
    }
    this.ticksLeft--;
    if (this.mode === 'wander') {
      if (mobRefuseStep(this.world, e.pos.x, e.pos.y, e.pos.z, this.heading) === null) it.forward = 1;
      const progress = Math.hypot(e.pos.x - this.lastX, e.pos.z - this.lastZ);
      if (it.forward === 1 && progress < 0.005) {
        if (++this.stall > 30) { this.heading = this.rand() * Math.PI * 2; this.stall = 0; }
      } else this.stall = 0;
    }
    this.lastX = e.pos.x; this.lastZ = e.pos.z;
    return it;
  }
}
```

3. Update `controllerKindOf` (add the `MobController` case) and `Sim` (home/ghost +
   `baseController`):

```ts
export function controllerKindOf(c: Controller): string {
  if (c instanceof HumanController) return 'human';
  if (c instanceof ScriptController) return 'script';
  if (c instanceof MobController) return 'mob';
  if (c instanceof IdleController) return 'idle';
  return 'unknown';
}
```

In `Sim`: add `homeId = 0;` and `ghostId = 0;` fields; in `spawn`, set
`baseController: opts.baseController ?? controller` — i.e. the entity's home controller
defaults to the controller it is spawned with (a bot keeps its `ScriptController`, a deer
keeps its `MobController`). A player body passes an explicit `baseController:
new IdleController()` so it stands idle when left. (`spawn` signature:
`spawn(pos, controller, opts?: { kindId?: string; baseController?: Controller })`; add
`baseController?: Controller` to the `opts` type.)

4. The possession primitives (pure; mutate the `Sim`):

```ts
/** Possess `targetId`: release the current viewed to its base controller, attach `human`
 *  to the target, and switch the view. The target's baseController (its kind default) is
 *  what un-possessing restores to. */
export function possess(sim: Sim, human: Controller, targetId: number): void {
  const cur = sim.viewed();
  if (cur && cur.id !== targetId) cur.controller = cur.baseController;
  const t = sim.entities.get(targetId);
  if (t) { t.controller = human; sim.setViewed(targetId); }
}

/** Return the human to its home body (releasing whatever is currently viewed). */
export function returnHome(sim: Sim, human: Controller): void {
  if (sim.homeId === 0) return;
  const cur = sim.viewed();
  if (cur && cur.id !== sim.homeId) cur.controller = cur.baseController;
  const home = sim.entities.get(sim.homeId);
  if (home) { home.controller = human; sim.setViewed(sim.homeId); }
}

/** Swap the human to the single spectator ghost. */
export function spectate(sim: Sim, human: Controller): void {
  if (sim.ghostId === 0) return;
  const cur = sim.viewed();
  if (cur && cur.id !== sim.ghostId) cur.controller = cur.baseController;
  const ghost = sim.entities.get(sim.ghostId);
  if (ghost) { ghost.controller = human; sim.setViewed(sim.ghostId); }
}
```

**Step 3: Verify** — `npx vitest run src/__tests__/entity.test.ts src/__tests__/player.test.ts`
(kinds + MobController determinism + possession green; `player.test.ts` still green).

**Step 4: Commit**

```
feat: deer + spectator kinds, MobController (wander AI on the sim PRNG), possession primitives
```

---

## Task 3: `raycast.ts` — `pickEntity`

**Files:** `src/raycast.ts`, `src/__tests__/raycast.test.ts`

**Step 1: Write the failing tests** — append to `src/__tests__/raycast.test.ts` (import
`pickEntity`):

```ts
describe('pickEntity', () => {
  it('hits the nearest entity AABB in front, within reach', () => {
    // The viewer's eye (y 1.6) looks DOWN at the deer's chest, so the ray actually enters the
    // deer's box (a horizontal ray at y 1.6 would miss the 0.9-tall box entirely).
    const origin = { x: 0, y: 1.6, z: 0 };
    const chest = { x: 0, y: 0.45, z: -3 }; // deer body centre (feet at y 0, height 0.9)
    const len = Math.hypot(chest.y - origin.y, chest.z - origin.z);
    const dir = { x: 0, y: (chest.y - origin.y) / len, z: (chest.z - origin.z) / len };
    const ents = [
      { pos: { x: 0, y: 0, z: -3 }, kind: { half: 0.45, height: 0.9 } }, // deer ahead
      { pos: { x: 5, y: 0, z: -3 }, kind: { half: 0.3, height: 1.8 } },  // far, not in the way
    ];
    const hit = pickEntity(origin, dir, ents, 6);
    expect(hit).not.toBeNull();
    expect(hit!.index).toBe(0);
    // front face at z = -3 + 0.45 = -2.55; distance along the slanted dir = 2.55 / |dir.z|
    expect(hit!.t).toBeCloseTo(2.55 / Math.abs(dir.z), 5);
  });

  it('returns null when the only entity is beyond reach or behind', () => {
    const origin = { x: 0, y: 1.6, z: 0 };
    // beyond reach: aimed at the deer's height (so it WOULD hit if in reach), but 10 m away —
    // the front face is at ~9.55 m > reach 6.
    const chest = { x: 0, y: 0.45, z: -10 };
    const len = Math.hypot(chest.y - origin.y, chest.z - origin.z);
    const dir = { x: 0, y: (chest.y - origin.y) / len, z: (chest.z - origin.z) / len };
    const far = [{ pos: { x: 0, y: 0, z: -10 }, kind: { half: 0.45, height: 0.9 } }];
    expect(pickEntity(origin, dir, far, 6)).toBeNull(); // beyond reach
    const behind = [{ pos: { x: 0, y: 0, z: 3 }, kind: { half: 0.45, height: 0.9 } }];
    expect(pickEntity(origin, { x: 0, y: 0, z: -1 }, behind, 6)).toBeNull(); // behind
  });
});
```

**Step 2: Implement** — append to `src/raycast.ts`:

```ts
/** Slab/AABB intersection of the ray against each entity's box (kind half/height, feet at
 *  pos). Returns the NEAREST entity hit within `reach` in front of the origin, or null.
 *  Entities pass through each other — this is the nearest AABB, not a solid. The caller
 *  excludes the viewed entity so you never pick yourself. */
export function pickEntity(
  origin: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  entities: { pos: { x: number; y: number; z: number }; kind: { half: number; height: number } }[],
  reach: number,
): { index: number; t: number } | null {
  let best: { index: number; t: number } | null = null;
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    const axes: [number, number, number, number][] = [
      [origin.x, dir.x, e.pos.x - e.kind.half, e.pos.x + e.kind.half],
      [origin.y, dir.y, e.pos.y, e.pos.y + e.kind.height],
      [origin.z, dir.z, e.pos.z - e.kind.half, e.pos.z + e.kind.half],
    ];
    let tmin = 0, tmax = reach, hit = true;
    for (const [o, d, mn, mx] of axes) {
      if (Math.abs(d) < 1e-8) {
        if (o < mn || o > mx) { hit = false; break; }
      } else {
        let t1 = (mn - o) / d, t2 = (mx - o) / d;
        if (t1 > t2) [t1, t2] = [t2, t1];
        if (t1 > tmin) tmin = t1;
        if (t2 < tmax) tmax = t2;
        if (tmin > tmax) { hit = false; break; }
      }
    }
    if (hit && tmin <= reach && (best === null || tmin < best.t)) best = { index: i, t: tmin };
  }
  return best;
}
```

**Step 3: Verify** — `npx vitest run src/__tests__/raycast.test.ts`.

**Step 4: Commit**

```
feat: pickEntity — nearest entity AABB along the ray (for possession targeting)
```

---

## Task 4: `src/spawn.ts` — deterministic deer spawns

**Files:** `src/spawn.ts` (new), `src/__tests__/spawn.test.ts` (new)

**Step 1: Write the failing tests** — create `src/__tests__/spawn.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, localIndex } from '../world';
import { SimRng, Sim, IdleController, stepEntity } from '../entity';
import { isDeerSpawnCell, rollDeerSpawns, spawnDeer } from '../spawn';

const STEP = 1 / 60;

function grassFloor(world: World, cx: number, cz: number, y: number): void {
  const c = world.ensureChunk(cx, 0, cz);
  for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, y, lz)] = Block.Grass;
}

describe('spawn', () => {
  it('isDeerSpawnCell: grass with two air cells above, at a plausible surface height', () => {
    const world = new World();
    grassFloor(world, 0, 0, 4); // grass at y=4, air above
    expect(isDeerSpawnCell((x, y, z) => world.getBlock(x, y, z), 8, 4, 8)).toBe(true);
    expect(isDeerSpawnCell((x, y, z) => world.getBlock(x, y, z), 8, 3, 8)).toBe(false); // not grass
  });

  it('rollDeerSpawns: a fixed seed gives a deterministic count at deterministic positions', () => {
    const a = new World(); grassFloor(a, 0, 0, 4);
    const b = new World(); grassFloor(b, 0, 0, 4);
    const rngA = new SimRng(1234), rngB = new SimRng(1234);
    const ra = rollDeerSpawns(a, 0, 0, 2, () => rngA.next(), () => false);
    const rb = rollDeerSpawns(b, 0, 0, 2, () => rngB.next(), () => false);
    expect(ra).toEqual(rb);
    expect(ra.length).toBe(2);
    for (const p of ra) expect(p.y).toBe(5); // feet on the grass top (grass at y=4)
  });

  it('a fixed seed spawns a deterministic deer set over a 600-tick session', () => {
    const run = (): [number, number][] => {
      const world = new World();
      grassFloor(world, 0, 0, 4);
      const sim = new Sim(world, {}, 1234);
      sim.spawn({ x: 0, y: 5, z: 0 }, new IdleController(), { kindId: 'player', baseController: new IdleController() });
      spawnDeer(world, sim, 0, 0); // deer into the freshly generated (rebuilt) chunk
      for (let i = 0; i < 600; i++)
        for (const e of sim.all()) {
          const it = e.controller.intent(e, i);
          stepEntity(world, e, it, STEP);
        }
      return sim.all().filter((e) => e.kind.id === 'deer')
        .map((e) => [Math.round(e.pos.x * 1000), Math.round(e.pos.z * 1000)] as [number, number]);
    };
    expect(run()).toEqual(run());
  });
});
```

(`rollDeerSpawns` takes `rand: () => number` — the tests wrap a `SimRng` as
`() => rng.next()`, keeping the spawn function PRNG-agnostic and deterministic. The 600-tick
test drives the real spawn path (`spawnDeer`) + `stepEntity` to pin whole-session deer
determinism.)

**Step 2: Implement** — create `src/spawn.ts`:

```ts
import { Block } from './blocks';
import { type World } from './world';
import { type Sim, MobController } from './entity';

export const DEER_CAP = 6;      // live deer in the view ring
export const DEER_PER_CHUNK = 2; // max rolled per loaded chunk

export type GetBlock = (x: number, y: number, z: number) => number;

/** A deer spawn cell: a grass surface with two air cells above (cheap "sky"), at a
 *  plausible surface height (above the void). [POC shortcut] — no true sky test. */
export function isDeerSpawnCell(getBlock: GetBlock, x: number, y: number, z: number): boolean {
  return getBlock(x, y, z) === Block.Grass
    && getBlock(x, y + 1, z) === Block.Air
    && getBlock(x, y + 2, z) === Block.Air
    && y >= 3;
}

/** Roll up to `maxHere` deer spawn positions in chunk (cx,cz) from a deterministic `rand`,
 *  skipping `occupied` cells. Feet land on the grass top (y+1). Deterministic in (world,
 *  cx, cz, maxHere, rand). */
export function rollDeerSpawns(
  world: World, cx: number, cz: number, maxHere: number, rand: () => number,
  occupied: (x: number, y: number, z: number) => boolean,
): { x: number; y: number; z: number }[] {
  const get: GetBlock = (x, y, z) => world.getBlock(x, y, z);
  const out: { x: number; y: number; z: number }[] = [];
  for (let tries = 0; tries < 32 && out.length < maxHere; tries++) {
    const wx = cx * 16 + Math.floor(rand() * 16);
    const wz = cz * 16 + Math.floor(rand() * 16);
    for (let y = 40; y >= 3; y--) {
      if (isDeerSpawnCell(get, wx, y, wz)) {
        if (!occupied(wx, y + 1, wz)) out.push({ x: wx + 0.5, y: y + 1, z: wz + 0.5 });
        break;
      }
    }
  }
  return out;
}

/** Spawn up to the capped number of deer into `sim` for a freshly generated (rebuilt) chunk
 *  column, drawing every random from `sim.rng` (deterministic). Shared by main.ts (on chunk
 *  load) and the 600-tick determinism test. Call only for rebuilt chunks — restored chunks
 *  already carry their persisted deer (re-rolling would double-populate them). */
export function spawnDeer(world: World, sim: Sim, cx: number, cz: number): void {
  const live = sim.all().filter((e) => e.kind.id === 'deer').length;
  const remaining = DEER_CAP - live;
  if (remaining <= 0) return;
  const maxHere = Math.min(DEER_PER_CHUNK, remaining);
  const occupied = (x: number, y: number, z: number) =>
    sim.all().some((o) =>
      Math.abs(o.pos.x - x) < 0.5 && Math.abs(o.pos.y - y) < 0.5 && Math.abs(o.pos.z - z) < 0.5);
  const spots = rollDeerSpawns(world, cx, cz, maxHere, () => sim.rng.next(), occupied);
  for (const s of spots) {
    const m = new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next());
    sim.spawn({ x: s.x, y: s.y, z: s.z }, m, { kindId: 'deer', baseController: m });
  }
}
```

**Step 3: Verify** — `npx vitest run src/__tests__/spawn.test.ts`.

**Step 4: Commit**

```
feat: spawn.ts — deterministic deer spawn rolls (grass surface, sky, capped)
```

---

## Task 5: `src/entity-mesh.ts` — box-part rigs

**Files:** `src/entity-mesh.ts` (new), `src/__tests__/entity-mesh.test.ts` (new)

The **animation math is pure** (node-testable); the three.js build/update is browser-only.

**Step 1: Write the failing tests** — create `src/__tests__/entity-mesh.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { newRigAnim, advanceRigAnim, legAngles, horizontalSpeed } from '../entity-mesh';

describe('entity-mesh — the pure animation math', () => {
  it('leg phase advances with horizontal speed, not wall time', () => {
    const a = newRigAnim();
    expect(legAngles(a)).toEqual([0, 0, 0, 0]);
    advanceRigAnim(a, { vel: { x: 2, z: 0 } }, 1, 1); // phase = 2
    const [fl, bl, fr, br] = legAngles(a);
    const s = Math.sin(2) * 0.5;
    expect(fl).toBeCloseTo(s, 9);
    expect(bl).toBeCloseTo(-s, 9);
    expect(fr).toBeCloseTo(-s, 9);
    expect(br).toBeCloseTo(s, 9); // diagonal gait: FL+BR together, BL+FR together
  });

  it('zero speed advances no phase', () => {
    const a = newRigAnim();
    advanceRigAnim(a, { vel: { x: 0, z: 0 } }, 10, 1);
    expect(legAngles(a)).toEqual([0, 0, 0, 0]);
  });

  it('horizontalSpeed is the x/z velocity magnitude', () => {
    expect(horizontalSpeed({ vel: { x: 3, z: 4 } })).toBeCloseTo(5, 9);
  });
});
```

**Step 2: Implement** — create `src/entity-mesh.ts`:

```ts
import * as THREE from 'three';
import { SimRng, type Entity, type EntityKind } from './entity';

// === pure animation state (node-testable): the leg-swing phase, advanced by horizontal
// speed (replay-safe — no wall clock). ===

export interface RigAnim { phase: number }
export function newRigAnim(): RigAnim { return { phase: 0 }; }

export function horizontalSpeed(e: { vel: { x: number; z: number } }): number {
  return Math.hypot(e.vel.x, e.vel.z);
}

/** Advance the leg phase with horizontal speed (rate rad per meter, pinned per kind). */
export function advanceRigAnim(anim: RigAnim, e: { vel: { x: number; z: number } }, dt: number, rate: number): void {
  anim.phase += horizontalSpeed(e) * dt * rate;
}

/** The four leg swings [FL, BL, FR, BR]: opposite legs swing together; bounded by `amp`. */
export function legAngles(anim: RigAnim, amp = 0.5): [number, number, number, number] {
  const s = Math.sin(anim.phase) * amp;
  return [s, -s, -s, s];
}

// === three.js rig (browser-only; verified in the Task 7 gate) ===

interface Part { name: string; size: [number, number, number]; offset: [number, number, number]; leg?: number; head?: boolean; }

const DEER_PARTS: Part[] = [
  { name: 'body', size: [0.5, 0.5, 0.9], offset: [0, 0.55, 0] },
  { name: 'head', size: [0.35, 0.35, 0.4], offset: [0, 0.78, -0.5], head: true },
  { name: 'legFL', size: [0.16, 0.4, 0.16], offset: [0.28, 0.2, -0.3], leg: 0 },
  { name: 'legFR', size: [0.16, 0.4, 0.16], offset: [0.28, 0.2, 0.3], leg: 1 },
  { name: 'legBL', size: [0.16, 0.4, 0.16], offset: [-0.28, 0.2, -0.3], leg: 2 },
  { name: 'legBR', size: [0.16, 0.4, 0.16], offset: [-0.28, 0.2, 0.3], leg: 3 },
];
const PLAYER_PARTS: Part[] = [
  { name: 'body', size: [0.5, 0.9, 0.3], offset: [0, 0.9, 0] },
  { name: 'head', size: [0.4, 0.4, 0.4], offset: [0, 1.5, 0], head: true },
  { name: 'legL', size: [0.2, 0.9, 0.2], offset: [-0.15, 0.45, 0], leg: 0 },
  { name: 'legR', size: [0.2, 0.9, 0.2], offset: [0.15, 0.45, 0], leg: 1 },
];

export interface Rig {
  root: THREE.Group;   // at the feet; rotation.y = yaw (body follows yaw only)
  head: THREE.Group;   // rotation.x = pitch (head follows pitch+yaw)
  legs: THREE.Group[]; // rotation.x = leg swing
}

// One material per kind (no skinning, no morph targets), textured from a small canvas
// part-atlas in the same style as the block atlas: a deterministic speckle (fixed seed, so
// the rig looks identical across sessions/replays) of the kind's base colour, crisp
// NearestFilter. (This is the phase 2 texture — not a punt; see the spec's Rendering.)
export const RIG_COLORS: Record<string, number> = { deer: 0x9a7b4f, player: 0x3f6fb5 };
export const LEG_RATE: Record<string, number> = { deer: 6, player: 4 };

/** A small speckled canvas texture for a kind's material (block-atlas style). Deterministic
 *  (fixed-seed jitter) so the rig looks identical across sessions/replays. */
export function buildPartAtlas(base: number, seed: number): THREE.CanvasTexture {
  const rng = new SimRng(seed);
  const S = 32;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const r = (base >> 16) & 0xff, g = (base >> 8) & 0xff, b = base & 0xff;
  const c = (v: number) => Math.max(0, Math.min(255, v));
  const img = ctx.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const j = Math.floor((rng() - 0.5) * 48); // +-24 jitter
    img.data[i * 4 + 0] = c(r + j);
    img.data[i * 4 + 1] = c(g + j);
    img.data[i * 4 + 2] = c(b + j);
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter; // crisp, block-like
  return tex;
}

export function buildEntityRig(kind: EntityKind, material: THREE.Material): Rig | null {
  const parts = kind.id === 'deer' ? DEER_PARTS : kind.id === 'player' ? PLAYER_PARTS : null;
  if (!parts) return null; // spectator: no rig
  const root = new THREE.Group();
  const head = new THREE.Group();
  const legs: THREE.Group[] = [];
  for (const p of parts) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.size[0], p.size[1], p.size[2]), material);
    if (p.head) { mesh.position.set(...p.offset); head.add(mesh); continue; }
    if (p.leg !== undefined) {
      const pivot = new THREE.Group();
      pivot.position.set(0, p.offset[1] + p.size[1] / 2, 0); // hip pivot at the leg top
      mesh.position.set(p.offset[0], -p.size[1] / 2, p.offset[2]);
      pivot.add(mesh);
      root.add(pivot);
      legs[p.leg] = pivot;
      continue;
    }
    mesh.position.set(...p.offset);
    root.add(mesh);
  }
  root.add(head);
  return { root, head, legs };
}

/** Position the rig at the entity's feet, orient body by yaw + head by pitch, and set the
 *  leg swings from the accumulated phase. The viewed entity's rig is hidden by the caller. */
export function updateEntityRig(rig: Rig, e: Entity, anim: RigAnim, amp = 0.5): void {
  rig.root.position.set(e.pos.x, e.pos.y, e.pos.z);
  rig.root.rotation.y = e.yaw;
  rig.head.rotation.x = e.pitch;
  const a = legAngles(anim, amp);
  for (let i = 0; i < rig.legs.length; i++) rig.legs[i].rotation.x = a[i] ?? 0;
}
```

**Step 3: Verify** — `npx vitest run src/__tests__/entity-mesh.test.ts` (the pure math
green; the three.js parts compile via `npm run build`).

**Step 4: Commit**

```
feat: entity-mesh.ts — box-part rigs (pure animation math + three.js build/update)
```

---

## Task 6: `main.ts` — rig rendering, HUD, possession, spawn/despawn

**Files:** `src/main.ts`, `index.html`. Verify with `npm run build` + `npm test` + the Task 7
browser gate.

**Step 1: Imports** — add:

```ts
import { pickEntity } from './raycast';
import { possess, returnHome, spectate, MobController, type EntityRecord, type Controller } from './entity';
import { spawnDeer } from './spawn';
import { buildEntityRig, updateEntityRig, advanceRigAnim, newRigAnim, RIG_COLORS, LEG_RATE, buildPartAtlas, type Rig, type RigAnim } from './entity-mesh';
```

**Step 2: Rig state.** Near the chunk-mesh state:

```ts
const rigOf: Record<string, THREE.Material> = {};
for (const [id, color] of Object.entries(RIG_COLORS)) rigOf[id] = new THREE.MeshLambertMaterial({ map: buildPartAtlas(color, 0x5eed) });
const rigs = new Map<number, { rig: Rig; anim: RigAnim; mat: THREE.Material }>();

function syncEntityRigs(dt: number): void {
  const ve = sim.viewed();
  const seen = new Set<number>();
  for (const e of sim.all()) {
    seen.add(e.id);
    if (e.kind.collides === false) continue; // spectator: no rig
    let entry = rigs.get(e.id);
    if (!entry) {
      const mat = rigOf[e.kind.id] ?? (rigOf[e.kind.id] = new THREE.MeshLambertMaterial({ map: buildPartAtlas(0x888888, 0x5eed) }));
      const rig = buildEntityRig(e.kind, mat);
      if (!rig) continue;
      entry = { rig, anim: newRigAnim(), mat };
      rigs.set(e.id, entry);
      scene.add(rig.root);
    }
    advanceRigAnim(entry.anim, e, dt, LEG_RATE[e.kind.id] ?? 4);
    updateEntityRig(entry.rig, e, entry.anim);
    entry.rig.root.visible = e.id !== sim.viewedId; // hide the viewed entity in first person
  }
  for (const [id, entry] of rigs) if (!seen.has(id)) { scene.remove(entry.rig.root); rigs.delete(id); }
}
```

Call `syncEntityRigs(dt)` in `frame()` (after the substep loop; `dt` is the frame delta).

**Step 3: HUD — kind label + hotbar visibility.** Add `<div id="kind"></div>` to
`index.html` (style it like `#clock`: small, top-left, under the clock). In `frame()` (once
per frame, cheap):

```ts
function syncHud(): void {
  const ve = sim.viewed();
  const kindEl = document.getElementById('kind')!;
  kindEl.textContent = ve ? `viewing: ${ve.kind.id}` : '';
  hotbarEl.classList.toggle('hidden', !ve || !ve.kind.canEdit); // hide the hotbar when you can't edit
}
```

(Call it once per frame, after `syncEntityRigs`.)

**Step 4: Possession (`P`).** Add to the keydown handler:

```ts
if (e.code === 'KeyP') onPossess();
```

and:

```ts
function onPossess(): void {
  const ve = sim.viewed();
  if (!ve) return;
  const candidates = sim.all().filter((x) => x.id !== ve.id);
  const hit = pickEntity(eyeOf(ve), lookDir(ve.yaw, ve.pitch), candidates, REACH);
  if (hit) {
    possess(sim, human, candidates[hit.index].id);
  } else if (sim.viewedId === sim.homeId) {
    spectate(sim, human);   // at the body -> the ghost
  } else {
    returnHome(sim, human); // possessing/ghost -> back to the body
  }
}
```

**Step 4b: Crosshair entity picking (a closer entity shadows the voxel).** In the per-frame
crosshair update (where main.ts casts the break ray from the viewed eye for the highlight),
FIRST cast `pickEntity` (from the viewed eye along `lookDir`, excluding the viewed entity,
within `REACH`). If it hits, the crosshair targets the entity — suppress the voxel highlight
for that frame (a closer entity shadows the voxel). This must agree with `onPossess` (both use
`pickEntity` before the voxel).

**Step 5: Spawn on chunk load + despawn on unload.** In `tickStreaming`, after the
`rebuilt`/`restored` handling, spawn deer into **rebuilt** chunk columns only (freshly
generated, no saved record) — **restored** chunks already carry their persisted deer, so
re-rolling them would double-populate (and diverge from the original session). `spawnDeer`
(live in `spawn.ts`, shared with the 600-tick determinism test) caps the population and draws
every random from `sim.rng`:

```ts
for (const c of r.rebuilt) spawnDeer(world, sim, c.cx, c.cz); // NOT r.restored
```

In the `unloaded` loop, despawn the deer whose chunk just left (they persist via the
entity-ride, so they restore on walk-back):

```ts
for (const d of sim.entitiesInChunk(c.cx, c.cy, c.cz))
  if (d.kind.id === 'deer') sim.despawn(d.id);
```

**Step 6: Restore factory (the `'mob'` case), body home controller, and the single ghost.**
In `startGame`, phase 1's boot restore uses a `controllerFor` factory to reattach controllers
to restored entities. Update it so a restored deer gets a `MobController` (its
`controllerKind` is `'mob'`), set the restored player body's home controller to
`IdleController` (it must stand idle when left, not keep the `human` controller it was
restored with), derive `homeId`/`ghostId` from the restored entities, and spawn the ghost
**only if none was restored** (the ghost is a normal entity and restores like any other — never
spawn a second one):

```ts
const controllerFor = (r: EntityRecord): Controller =>
  r.controllerKind === 'mob'
    ? new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next())
    : (r.id === meta.viewedEntityId ? human : new IdleController());
sim.restoreEntities(meta.entities, controllerFor);
const body = sim.entities.get(meta.viewedEntityId);
if (body && body.kind.id === 'player') body.baseController = new IdleController();
sim.homeId = sim.all().find((e) => e.kind.id === 'player')?.id ?? 0;
sim.ghostId = sim.all().find((e) => e.kind.id === 'spectator')?.id ?? 0;
if (sim.ghostId === 0) {
  const v = sim.viewed()!;
  sim.ghostId = sim.spawn({ x: v.pos.x, y: v.pos.y + 4, z: v.pos.z }, new IdleController(), { kindId: 'spectator', baseController: new IdleController() }).id;
}
```

Use the **same** `controllerFor` (with the `'mob'` case) for the streaming restore path
(`applyRecord(world, rec, sim, streamControllerFor)`) so a deer frozen in an unloaded chunk
reattaches its AI on walk-back. On the fresh-spawn path (no save), spawn the body with an
explicit `baseController: new IdleController()` (the spawn default would otherwise bind it to
`human`).

**Step 7: Verify** — `npm run build` (type-check clean) and `npm test` (full node suite
green, including the phase 1 gate). Then the Task 7 browser gate.

**Step 8: Commit**

```
feat: main.ts mobs/possession/spectator — rig rendering, HUD, P possession, deer spawn/despawn, ghost
```

---

## Task 7: gates + ADR 0016 + docs

**Files:** `docs/adr/0016-mobs-possession-spectator.md` (new), `docs/adr/README.md`,
`PROJECT.md`.

**Step 1: Full gate.** `npm test` (green; phase 1 pins unchanged) and `npm run build` (clean).

**Step 2: Browser acceptance** (manual; `npm run dev`):
- Deers wander near spawn, animate (leg swing from speed), and restore on reload in the same
  spots (fixed seed → same spawn positions).
- `P` on a deer: the camera drops to the 0.7 m deer eye, the hotbar hides (canEdit false),
  the HUD shows `viewing: deer`; you walk slow, hop one block, can't break. `P` again (no
  target): back to the body. `P` at the body (no target): the ghost — fly-through (noclip),
  `viewing: spectator`; `P` on the body: return.
- The deer refuses to walk into water or off a tall drop; a possessed deer left alone wanders
  back out of a hole.
- `?prof=remesh` still passes (the rig is additive; the worst-chunk pins are unchanged).

**Step 3: ADR 0016.** Write `docs/adr/0016-mobs-possession-spectator.md` (Status: Accepted;
Sources: the spec + plan). Capture, at least: the two new kinds (deer/spectator, the
capability split — capabilities are the kind's, not the controller's); the `MobController`
wander AI and **why all randomness is sim-owned and tick-ordered** (the sim's fixed id-order
iteration + per-state draw counts make the sequence deterministic — required for phase 3
replays; `Math.random` and wall clocks are banned from the sim); the local obstacle rules
(water + ≥3 drop; the stall counter accumulates on **any** low-progress tick, including a
refused step) and the stall→turn; spawning (grass/two-air/`y>=3`/cap, despawn on unload,
**rebuilt-only** rolls, the entity-ride persistence, and the `[POC shortcut]` that a deer
frozen in an unedited chunk is not persisted) and the spawn-roll determinism (pinned by a
600-tick test); the box-part rig (one material per kind textured from a deterministic
**canvas part-atlas** — block-atlas-style speckle, fixed seed; speed-driven leg phase —
replay-safe); possession (view + controller swap, `baseController` restore, the single ghost
with `homeId`/`ghostId` derived, the body's home controller `IdleController` at spawn +
restore, `pickEntity` before the voxel on **both** the crosshair and the `P` handler); and
the entities-pass-through-each-other note. Alternatives
considered: a pathfinding deer (rejected — non-goal), a skinned/morph-target rig (rejected —
non-goal, beyond leg swing + head look), a per-kind solid colour instead of the canvas
part-atlas (rejected — the brief asks for block-atlas-style texture and the atlas is cheap),
`prevController` (remember the *current* controller) instead of `baseController` (rejected —
`baseController` set at spawn/restore is equivalent for every controller the sim assigns, and
simpler), and possession via a dedicated "viewer" object rather than reusing the human
controller (rejected — the human controller already targets the viewed entity from phase 1).

**Step 4: Docs.** Update `docs/adr/README.md` (add 0016) and `PROJECT.md` (feature/ownership
table + pointer). No `TODO.md` change in phase 2.

**Step 5: Commit**

```
docs: ADR 0016 — mobs, possession, spectator
```

---

## Self-review

- **Brief coverage (phase 2):** the deer (grazing quadruped, the pinned kind, `jumpVel 8.0`
  so it clears a 1-block ledge, canEdit/canFly/canNoclip false) ✓; `MobController` wander AI
  with sim-owned tick-ordered PRNG ✓; spawn (grass/two-air/`y>=3`/cap, despawn on unload,
  **600-tick** whole-session determinism via `spawnDeer`) ✓; box-part rigs (head/body/4 legs;
  player biped; speed-driven leg swing; viewed rig hidden; **canvas part-atlas** texture) ✓;
  spectator kind (non-colliding ghost, **exactly one** — `ghostId`/`homeId` derived, no second
  ghost on reload) ✓; possession (`P`, `baseController` restore, swap to ghost, return; the
  body's home controller is `IdleController` at spawn **and** restore) ✓; entity picking
  (nearest AABB before the voxel, wired to **both** the crosshair and the `P` handler) ✓; gate
  (mob determinism 1200 ticks, refuses drops/water, possession swap/restore, picking,
  browser) ✓; ADR 0016 ✓.
- **Determinism is the load-bearing invariant:** the deer AI, the spawn rolls, and (phase 3)
  the replay all draw from `sim.rng` in the sim's fixed id-order — never `Math.random`,
  never a wall clock. The leg phase is driven by `e.vel` (replay-safe); the part-atlas
  speckle is a fixed seed (cosmetic, not sim state).
- **Known risks / documented punts:** (a) the rig is three.js/browser-only — the pure
  animation math is node-tested, the mesh build + `buildPartAtlas` are gate-verified; the
  node test transitively imports `three` (isomorphic — low risk); (b) `spawnDeer` draws from
  `sim.rng` on chunk load (frame-timed) — deterministic per (world, seed, load order); (c)
  the `occupied` closure is O(entities) per candidate — fine at POC population (≤ 6); (d) a
  deer rides the phase 1 **edited-only** chunk gate — a deer frozen in an *unedited* chunk is
  not persisted (the same as an unedited chunk's water); `[POC shortcut]`.
- **Execution order:** Tasks 1→7 in order; Task 6 is the integration; the phase 1 gate must
  stay green throughout. Phase 3 starts only after Task 7's gate is green.