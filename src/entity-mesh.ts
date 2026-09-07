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

/** The four leg swings [FL, BL, FR, BR]: opposite legs swing together; bounded by `amp`.
 *  `-0` is normalized to `+0` at rest (phase 0) so the tuple is a clean [0,0,0,0]. */
export function legAngles(anim: RigAnim, amp = 0.5): [number, number, number, number] {
  const s = Math.sin(anim.phase) * amp;
  return [s, -s, -s, s].map((v) => (v === 0 ? 0 : v)) as [number, number, number, number];
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
    const j = Math.floor((rng.next() - 0.5) * 48); // +-24 jitter
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