import { Block, isOpaque, torchMeta, doorMeta, doorOpen, doorAxis, doorSide, isDoor, doorPlacementFromView } from './blocks';
import { type World, WORLD_Y_MIN, WORLD_Y_MAX } from './world';
import { WALK_SPEED, SWIM_SPEED, FLY_SPEED, FLY_V_SPEED, GRAVITY, JUMP_VEL, HALF, HEIGHT, EYE } from './player';
import { raycastVoxel, REACH } from './raycast';

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