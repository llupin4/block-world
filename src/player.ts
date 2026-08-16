import { Block, isOpaque } from './blocks';

export interface MoveInput {
  forward: number; // -1..1 (W=+1, S=-1)
  strafe: number;  // -1..1 (D=+1, A=-1)
  up: boolean;     // SPACE: jump on ground / rise in water / fly up
  down: boolean;   // SHIFT: fly down (ignored otherwise)
}

export interface Vec3 { x: number; y: number; z: number }

export const WALK_SPEED = 5.6;   // m/s
export const SWIM_SPEED = 3.0;   // m/s horizontal in water
export const FLY_SPEED = 13.0;
export const FLY_V_SPEED = 8.0;
export const GRAVITY = 28;       // m/s^2 — applied in air AND water (water then clamps)
export const JUMP_VEL = 9.5;     // apex ~1.6 m above launch
export const HALF = 0.3;         // body half-width on x/z
export const HEIGHT = 1.8;       // feet -> top of head
export const EYE = 1.62;         // camera height above feet

const EPS = 1e-7;                // keeps a box sitting exactly on a voxel boundary from "touching" the next voxel
const BISECT_ITER = 24;          // sub-micron snap precision for typical per-step move sizes

export class Player {
  pos: Vec3 = { x: 0, y: 0, z: 0 }; // feet position
  vel: Vec3 = { x: 0, y: 0, z: 0 }; // only vel.y persists between steps (x/z are direct velocity)
  yaw = 0;   // radians; 0 = looking -z. Camera uses rotation order YXZ (yaw then pitch).
  pitch = 0; // clamped by the input layer (main.ts), raw here
  onGround = false;
  inWater = false;      // any voxel of the body AABB is water
  headInWater = false;  // the eye voxel is water (T12 underwater FX reads this)
  fly = false;          // F toggle
  noclip = false;       // N toggle

  private getBlock: (x: number, y: number, z: number) => number;

  constructor(getBlock: (x: number, y: number, z: number) => number) {
    this.getBlock = getBlock;
  }

  place(p: Vec3): void {
    this.pos = { x: p.x, y: p.y, z: p.z };
    this.vel = { x: 0, y: 0, z: 0 };
  }

  /** Does the player AABB overlap voxel (vx, vy, vz)? T8 refuses to place blocks inside the player. */
  intersectsVoxel(vx: number, vy: number, vz: number): boolean {
    const p = this.pos;
    return vx < p.x + HALF && vx + 1 > p.x - HALF &&
           vy < p.y + HEIGHT && vy + 1 > p.y &&
           vz < p.z + HALF && vz + 1 > p.z - HALF;
  }

  private collides(px: number, py: number, pz: number): boolean {
    const x0 = Math.floor(px - HALF), x1 = Math.floor(px + HALF - EPS);
    const y0 = Math.floor(py),        y1 = Math.floor(py + HEIGHT - EPS);
    const z0 = Math.floor(pz - HALF), z1 = Math.floor(pz + HALF - EPS);
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++)
          if (isOpaque(this.getBlock(x, y, z))) return true;
    return false;
  }

  private bodyInWater(px: number, py: number, pz: number): boolean {
    const x0 = Math.floor(px - HALF), x1 = Math.floor(px + HALF - EPS);
    const y0 = Math.floor(py),        y1 = Math.floor(py + HEIGHT - EPS);
    const z0 = Math.floor(pz - HALF), z1 = Math.floor(pz + HALF - EPS);
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++)
          if (this.getBlock(x, y, z) === Block.Water) return true;
    return false;
  }

  /** Move `delta` along axis 0=x, 1=y, 2=z. On collision, bisection-snap to the nearest
   *  collision-free position along that axis. Returns true if the move was blocked.
   *  Invariant: we always END a step outside solid voxels, so f=0 is always free. */
  private slide(axis: 0 | 1 | 2, delta: number): boolean {
    if (delta === 0) return false;
    const p = this.pos;
    const at = (f: number) =>
      this.collides(
        p.x + (axis === 0 ? delta * f : 0),
        p.y + (axis === 1 ? delta * f : 0),
        p.z + (axis === 2 ? delta * f : 0),
      );
    if (!at(1)) {
      if (axis === 0) p.x += delta;
      else if (axis === 1) p.y += delta;
      else p.z += delta;
      return false;
    }
    let lo = 0, hi = 1;
    for (let i = 0; i < BISECT_ITER; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid)) hi = mid; else lo = mid; // `lo` is the farthest proven-free fraction
    }
    if (axis === 0) p.x += delta * lo;
    else if (axis === 1) p.y += delta * lo;
    else p.z += delta * lo;
    return true;
  }

  /** Ground-plane movement direction from yaw (W = forward, D = right), normalized. */
  private groundDir(fwd: number, str: number): { x: number; z: number } {
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    // forward = (-sin yaw, -cos yaw); right = (cos yaw, -sin yaw)
    let x = -s * fwd + c * str;
    let z = -c * fwd - s * str;
    const l = Math.hypot(x, z);
    if (l > 1) { x /= l; z /= l; }
    return { x, z };
  }

  update(dt: number, input: MoveInput): void {
    const p = this.pos, v = this.vel;

    this.headInWater =
      this.getBlock(Math.floor(p.x), Math.floor(p.y + EYE), Math.floor(p.z)) === Block.Water;
    this.inWater = this.headInWater || this.bodyInWater(p.x, p.y, p.z);

    if (this.noclip) {
      // Free movement: no gravity, no collision.
      const d = this.groundDir(input.forward, input.strafe);
      v.x = d.x * FLY_SPEED; v.z = d.z * FLY_SPEED;
      v.y = input.up ? FLY_V_SPEED : input.down ? -FLY_V_SPEED : 0;
      p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
      this.onGround = false;
      return;
    }

    // Vertical: gravity always; water clamps fall speed and lets SPACE rise; fly overrides.
    if (this.fly) {
      v.y = input.up ? FLY_V_SPEED : input.down ? -FLY_V_SPEED : 0;
    } else {
      v.y -= GRAVITY * dt;
      if (this.inWater) {
        if (input.up) v.y = Math.min(v.y + 30 * dt, SWIM_SPEED); // net +2 m/s^2 while rising
        v.y = Math.max(v.y, -SWIM_SPEED * 0.6);                  // sink speed cap, no free-fall
      } else if (input.up && this.onGround) {
        v.y = JUMP_VEL; // jump (onGround was latched at the end of the PREVIOUS step)
      }
    }

    // Horizontal: direct velocity (no acceleration/inertia for the POC).
    const speed = this.fly ? FLY_SPEED : this.inWater ? SWIM_SPEED : WALK_SPEED;
    const d = this.groundDir(input.forward, input.strafe);
    v.x = d.x * speed; v.z = d.z * speed;

    this.slide(0, v.x * dt);   // x
    this.slide(2, v.z * dt);   // z
    if (this.slide(1, v.y * dt)) v.y = 0; // floor OR ceiling: kill vertical velocity

    // Ground probe: is there solid just below the feet? (2 cm tolerance)
    this.onGround = this.collides(p.x, p.y - 0.02, p.z);
  }
}