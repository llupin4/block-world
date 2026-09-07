import { Block, isOpaque, torchMeta, doorMeta, doorOpen, doorAxis, doorSide, isDoor, doorPlacementFromView } from './blocks';
import { type World, WORLD_Y_MIN, WORLD_Y_MAX, chunkOf } from './world';
import { WALK_SPEED, SWIM_SPEED, FLY_SPEED, FLY_V_SPEED, GRAVITY, JUMP_VEL, HALF, HEIGHT, EYE } from './player';
import { raycastVoxel, REACH } from './raycast';

export const MAX_PITCH = Math.PI / 2 - 0.01; // never go over the top

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

export function controllerKindOf(c: Controller): string {
  if (c instanceof HumanController) return 'human';
  if (c instanceof ScriptController) return 'script';
  if (c instanceof MobController) return 'mob';
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
  homeId = 0;   // the player body the human "home" belongs to (possession)
  ghostId = 0;  // the single spectator ghost (possession)
  respawn: Vec3 = { x: 0, y: 0, z: 0 };
  readonly rng: SimRng;
  // Phase 3: the intent recorder. Phase 1 leaves it unset.
  onIntent?: (tick: number, e: Entity, it: Intent) => void;
  onSpawn?: (e: Entity) => void;   // phase 3: the Recorder captures spawn events (mid-session spawns)
  onDespawn?: (e: Entity) => void; // phase 3: the Recorder captures despawn events

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

  spawn(pos: Vec3, controller: Controller, opts: { yaw?: number; pitch?: number; kindId?: string; baseController?: Controller } = {}): Entity {
    const kind = KINDS[opts.kindId ?? 'player'] ?? KINDS.player;
    const e: Entity = {
      id: this.nextId++,
      kind,
      pos: { ...pos }, vel: { x: 0, y: 0, z: 0 },
      yaw: opts.yaw ?? 0, pitch: opts.pitch ?? 0,
      onGround: false, inWater: false, headInWater: false,
      fly: false, noclip: false,
      controller, baseController: opts.baseController ?? controller,
    };
    this.entities.set(e.id, e);
    if (this.viewedId === 0) this.viewedId = e.id;
    this.onSpawn?.(e);
    return e;
  }

  despawn(id: number): void {
    const e = this.entities.get(id);
    if (e) this.onDespawn?.(e); // the Recorder captures the despawn before the entity is gone
    this.entities.delete(id);
    if (this.viewedId === id) {
      this.viewedId = 0;
      const lowest = this.all()[0]; // id-ordered: the deterministic fallback
      if (lowest !== undefined) this.viewedId = lowest.id;
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
    const kind = KINDS[rec.kindId] ?? (rec.kindId === 'dolt' ? KINDS.deer : KINDS.player); // legacy 'dolt' saves → deer
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
  private primaryEdge = false; private secondaryEdge = false;
  private toggleFlyEdge = false; private toggleNoclipEdge = false;
  private selectSlot: number | undefined;

  constructor(keys: Set<string>, yaw = 0, pitch = 0) {
    this.keys = keys; this.yaw = yaw; this.pitch = pitch;
  }

  /** Adopt a look (used at boot to sync the controller with the restored/spawned entity's yaw/pitch). */
  setLook(yaw: number, pitch: number): void { this.yaw = yaw; this.pitch = pitch; }

  /** The controller's current look (the live mouse look). Used when the human possesses an entity
   *  (the new possession starts facing the live look). */
  getLook(): { yaw: number; pitch: number } { return { yaw: this.yaw, pitch: this.pitch }; }

  mouse(dx: number, dy: number): void {
    this.yaw -= dx * 0.0025; // sensitivity (rad/px) moved from main.ts
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch - dy * 0.0025));
  }
  primary(): void { this.primaryEdge = true; }
  secondary(): void { this.secondaryEdge = true; }
  toggleFly(): void { this.toggleFlyEdge = true; }
  toggleNoclip(): void { this.toggleNoclipEdge = true; }
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
      primary: this.primaryEdge,
      secondary: this.secondaryEdge,
      block: this.heldBlock,
    };
    if (this.toggleFlyEdge) it.toggleFly = true;
    if (this.toggleNoclipEdge) it.toggleNoclip = true;
    if (this.selectSlot !== undefined) it.select = this.selectSlot;
    // consume the one-tick edges
    this.primaryEdge = false; this.secondaryEdge = false;
    this.toggleFlyEdge = false; this.toggleNoclipEdge = false;
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

// === possession (pure; mutate the Sim). The human controller is re-attached to whichever
// entity is viewed; the released entity reverts to its baseController (its kind default). ===

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