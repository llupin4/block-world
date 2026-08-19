// Clouds: an instanced quad layer. The coverage math (top) is pure and
// node-testable: one simplex-noise sample per 4×4-block cell, thresholded —
// the soft look comes from a pre-baked noise-alpha quad texture. The layer
// itself follows the camera only through grid-snapped re-anchoring; wind
// drift is a slow shift of the noise sample offset (see src/time.ts for the
// time source it will be driven by).
// Spec: docs/superpowers/specs/2026-08-19-day-night-clouds-design.md.

import { createNoise2D } from 'simplex-noise';

export const CELL = 4; // world blocks per quad (the classic voxel-sandbox cloud proportion)
export const WINDOW = 24; // quads per axis: ~96×96 blocks of sky around the player
export const WAVE = 12; // noise wavelength (blocks) → cloud features ~4–24 blocks wide
export const THRESHOLD = 0.05; // cells above this noise value draw
export const ALTITUDE = 96; // above WORLD_Y_MAX (64): clouds never clip terrain
const WIND_X = 0.1; // blocks/s
const WIND_Z = 0.09;
const WIND_Z_OFFSET = 37.7; // decorrelates the z-axis sampling from x
const CLOUD_SEED = 0x5c10d5;

// Deterministic xorshift, same shape as src/main.ts's — stable cloud layout per seed.
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noise2D = createNoise2D(prng(CLOUD_SEED));

/** Pure: noise coverage (≈ −1..1) for the 4×4 cell whose min corner is (wx, wz), at a given wind drift. */
export function cloudCoverage(wx: number, wz: number, windX: number, windZ: number): number {
  return noise2D((wx + CELL / 2 + windX) / WAVE, (wz + CELL / 2 + windZ) / WAVE);
}

/** Pure: which of the WINDOW×WINDOW cells (row = +z) draw, for the window anchored at (ax, az). Throws if the anchor is not a multiple of CELL — a misaligned anchor would break the world-lock (seam pops). */
export function cloudMask(ax: number, az: number, windX: number, windZ: number): boolean[] {
  const axRem = ((ax % CELL) + CELL) % CELL;
  const azRem = ((az % CELL) + CELL) % CELL;
  if (axRem !== 0 || azRem !== 0) {
    throw new Error(`cloudMask: anchor (${ax}, ${az}) must be a multiple of CELL (${CELL})`);
  }
  const out: boolean[] = [];
  for (let j = 0; j < WINDOW; j++)
    for (let i = 0; i < WINDOW; i++)
      out.push(cloudCoverage(ax + i * CELL, az + j * CELL, windX, windZ) > THRESHOLD);
  return out;
}

/** Pure: the wind drift (in blocks) at a simulation time in seconds. */
export function windAt(timeSec: number): [number, number] {
  return [WIND_X * timeSec, WIND_Z * timeSec + WIND_Z_OFFSET];
}

import * as THREE from 'three';

// --- renderer: an InstancedMesh of flat quads, grid-locked to the world ---

export interface Clouds {
  update(camX: number, camZ: number, timeSec: number, dim: number): void;
}

/**
 * Builds the cloud layer into `scene`. Instances live at fixed world
 * positions inside a 24×24-cell window anchored to the camera's 4-block grid
 * cell; the window re-anchors (and the mask re-evaluates) only when the
 * camera crosses a cell boundary — no per-frame matrix writes. `dim` is the
 * sky's worldDim: clouds tint white → faint blue-grey as night falls.
 */
export function createClouds(scene: THREE.Scene): Clouds {
  // Pre-baked soft puff texture: blurred white blobs on transparency (deterministic).
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  {
    const g = canvas.getContext('2d')!;
    const r = prng(CLOUD_SEED ^ 0x9e3779b9);
    g.filter = 'blur(5px)';
    for (let i = 0; i < 14; i++) {
      g.globalAlpha = 0.45 + r() * 0.5;
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(r() * 64, r() * 64, 8 + r() * 14, 0, Math.PI * 2);
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas); // default linear filter: soft edges
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false, // a 40-block distance overhead would otherwise fog the layer out
  });
  const geo = new THREE.PlaneGeometry(CELL, CELL);
  geo.rotateX(-Math.PI / 2); // flat in XZ (DoubleSide → normal sign irrelevant)
  const mesh = new THREE.InstancedMesh(geo, mat, WINDOW * WINDOW);
  mesh.count = 0;
  mesh.frustumCulled = false; // the layer spans the sky around the camera; the origin bounding box would cull it
  scene.add(mesh);

  const m4 = new THREE.Matrix4();
  const day = new THREE.Color(0xffffff);
  const night = new THREE.Color(0x707a9c);
  let anchorX = NaN;
  let anchorZ = NaN;

  return {
    update(camX, camZ, timeSec, dim) {
      const ax = Math.floor(camX / CELL) * CELL;
      const az = Math.floor(camZ / CELL) * CELL;
      if (ax !== anchorX || az !== anchorZ) {
        anchorX = ax;
        anchorZ = az;
        const [wx, wz] = windAt(timeSec);
        const mask = cloudMask(ax, az, wx, wz);
        let n = 0;
        for (let j = 0; j < WINDOW; j++) {
          for (let i = 0; i < WINDOW; i++) {
            if (!mask[j * WINDOW + i]) continue;
            m4.makeTranslation(ax + i * CELL + CELL / 2, ALTITUDE, az + j * CELL + CELL / 2);
            mesh.setMatrixAt(n++, m4);
          }
        }
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
      }
      mat.color.copy(day).lerp(night, (1 - dim) / (1 - 0.33));
    },
  };
}