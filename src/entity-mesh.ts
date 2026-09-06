import * as THREE from 'three';
import { type World } from './world';
import { stepEntity, NULL_INTENT, type Entity } from './entity';

// === pure, node-testable walk-cycle math (the browser rig consumes these) ===

export interface RigAnim {
  phase: number; // walk-cycle phase in [0,1)
  speed: number; // 0 (stopped) .. 1 (walking)
}

// Walk cycles per second while walking. Pinned.
const WALK_FREQ = 12;
const STOP_EASE = 8; // how fast the phase eases back to 0 when stopped (per second)

/** Advance the walk cycle: while `forward` the phase accrues and wraps into [0,1); when
 *  stopped it eases back to 0. Pinned constants; deterministic (no Math.random). */
export function advanceRigAnim(anim: RigAnim, forward: number, dt: number): void {
  if (forward > 0) {
    anim.phase += dt * forward * WALK_FREQ;
    if (anim.phase >= 1) anim.phase -= Math.floor(anim.phase);
    anim.speed = forward;
  } else {
    anim.phase *= Math.exp(-STOP_EASE * dt);
    if (anim.phase < 0.001) anim.phase = 0;
    anim.speed = 0;
  }
}

/** Swing angle for a leg. `side` is -1 (left) / +1 (right): the two sides are out of phase
 *  (opposite swing). Amplitude scales with speed so a stopped rig rests flat. */
export function legAngles(anim: RigAnim, side: number): number {
  const amp = 0.5 * anim.speed;
  return Math.sin(anim.phase * Math.PI * 2 + (side < 0 ? 0 : Math.PI)) * amp;
}

/** The effective horizontal speed of `e` if it walked one tick (a forward step's distance
 *  over dt), restoring `e.pos` afterwards. Used to scale the walk-cycle frequency. */
export function horizontalSpeed(world: World, e: Entity, dt: number): number {
  const bx = e.pos.x, bz = e.pos.z;
  stepEntity(world, e, { ...NULL_INTENT, forward: 1, yaw: e.yaw }, dt);
  const d = Math.hypot(e.pos.x - bx, e.pos.z - bz);
  e.pos.x = bx; e.pos.z = bz;
  return d / dt;
}

// === the rig definitions (pure data) ===

export interface RigPartDef {
  name: string;
  size: [number, number, number];
  offset: [number, number, number]; // from the feet origin (feet at y 0)
}

export interface RigDef {
  parts: RigPartDef[];
}

/** The dolt: a head and four legs (front/back x left/right). Pinned. */
export const KIND_TO_RIG: Record<string, RigDef> = {
  dolt: {
    parts: [
      { name: 'head', size: [0.34, 0.3, 0.34], offset: [0, 0.55, -0.42] },
      { name: 'frontL', size: [0.14, 0.42, 0.14], offset: [-0.26, 0.21, -0.3] },
      { name: 'frontR', size: [0.14, 0.42, 0.14], offset: [0.26, 0.21, -0.3] },
      { name: 'backL', size: [0.14, 0.42, 0.14], offset: [-0.26, 0.21, 0.3] },
      { name: 'backR', size: [0.14, 0.42, 0.14], offset: [0.26, 0.21, 0.3] },
    ],
  },
};

// === the browser-only three.js rig ===

export interface RigPart {
  name: string;
  pivot: THREE.Object3D; // legs swing about this (the hip); the head's pivot is its mesh
  mesh: THREE.Mesh;
  side: number; // -1 (left) / +1 (right) for legs; 0 for the head
  isLeg: boolean;
}

export interface Rig {
  group: THREE.Group; // positioned at the entity's feet, rotated by yaw
  parts: RigPart[];
  anim: RigAnim;
}

/** Build the dolt rig (browser). The group sits at the feet; each leg hangs from a hip pivot
 *  so it swings about the hip. Pinned geometry. */
export function makeDoltRig(color = 0x8a6d4a): Rig {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color });
  const parts: RigPart[] = [];
  for (const def of KIND_TO_RIG.dolt.parts) {
    const geo = new THREE.BoxGeometry(def.size[0], def.size[1], def.size[2]);
    const mesh = new THREE.Mesh(geo, mat);
    const isLeg = def.name !== 'head';
    let pivot: THREE.Object3D;
    if (isLeg) {
      const hip = new THREE.Object3D();
      hip.position.set(def.offset[0], def.offset[1] + def.size[1] / 2, def.offset[2]);
      mesh.position.set(0, -def.size[1] / 2, 0); // the leg hangs below the hip
      group.add(hip);
      hip.add(mesh);
      pivot = hip;
    } else {
      mesh.position.set(def.offset[0], def.offset[1], def.offset[2]);
      group.add(mesh);
      pivot = mesh;
    }
    const side = def.name.endsWith('L') ? -1 : def.name.endsWith('R') ? 1 : 0;
    parts.push({ name: def.name, pivot, mesh, side, isLeg });
  }
  return { group, parts, anim: { phase: 0, speed: 0 } };
}

/** Update a rig from an entity's state (browser, per frame): place the group at the feet,
 *  rotate by yaw, and swing the legs from the walk cycle (driven by whether the entity is
 *  moving horizontally). */
export function updateRig(rig: Rig, e: Entity, dt: number): void {
  rig.group.position.set(e.pos.x, e.pos.y, e.pos.z);
  rig.group.rotation.y = e.yaw;
  const moving = Math.hypot(e.vel.x, e.vel.z) > 0.01;
  advanceRigAnim(rig.anim, moving ? 1 : 0, dt);
  for (const p of rig.parts) if (p.isLeg) p.pivot.rotation.x = legAngles(rig.anim, p.side);
}