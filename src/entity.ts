import { Block } from './blocks';
import { type World } from './world';
import { WALK_SPEED, SWIM_SPEED, FLY_SPEED, FLY_V_SPEED, GRAVITY, JUMP_VEL, HALF, HEIGHT, EYE } from './player';

export interface Vec3 { x: number; y: number; z: number }

// EntityKind: the tunable body of an entity. `player` is built from the old player.ts
// exports (the single source of the numbers); the other kinds land in phase 2.
export interface EntityKind {
  id: string;            // 'player' | 'spectator' | 'dolt'
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