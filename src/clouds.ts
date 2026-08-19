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

/** Pure: which of the WINDOW×WINDOW cells (row = +z) draw, for the window anchored at (ax, az) — both multiples of CELL. */
export function cloudMask(ax: number, az: number, windX: number, windZ: number): boolean[] {
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