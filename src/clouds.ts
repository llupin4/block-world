// Clouds — a world-locked repeating pattern on one large quad, scrolled by wind.
// The pattern (top, pure, node-testable): one 2D-simplex sample per 4×4-block
// cell, baked once into a 128×128-texel tile (core/rim alpha) that repeats
// every 512 world blocks. The renderer (below) draws the tile on a
// 2048×2048 quad at y = 96 — centered on the player every frame — and
// scrolls it per frame via the texture offset (wind). No instances, no
// window, no per-frame noise or matrix work.
// Spec: docs/superpowers/specs/2026-08-19-day-night-clouds-design.md.

import { createNoise2D } from 'simplex-noise';

export const CELL = 4; // world blocks per texel (the classic voxel-sandbox cloud proportion)
export const TILE = 128; // texels per tile edge → one tile = 512 world blocks of repeating pattern
export const WAVE = 12; // noise wavelength (blocks) → cloud features ~4–24 blocks wide
export const CORE = 0.2; // noise above this → opaque core texel
export const RIM = 0.05; // noise above this (and ≤ CORE) → ~60% rim texel; below → none
export const ALTITUDE = 96; // above WORLD_Y_MAX (64): clouds never clip terrain

export const QUAD = 2048; // sheet edge (blocks); centered on the player, the 512 far plane clips corners → edge ring ≈5–10° above the horizon
const WIND_X = 0.5; // blocks/s — ~1 block per 2 s: clearly drifting while standing still, still slow
const WIND_Z = 0.45; // 0.9× the x drift
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

/** Pure: the noise value for the 4×4 cell whose min corner is (wx, wz), at a given wind drift. World-locked: cloudCoverage(w + d, u) === cloudCoverage(w, u + d). */
export function cloudCoverage(wx: number, wz: number, windX = 0, windZ = 0): number {
  return noise2D((wx + CELL / 2 + windX) / WAVE, (wz + CELL / 2 + windZ) / WAVE);
}

/** Pure: the baked tile's alpha level for texel (cx, cz): 0 = none, 1 = rim, 2 = core. */
export function cloudTileLevel(cx: number, cz: number): 0 | 1 | 2 {
  const c = cloudCoverage(cx * CELL, cz * CELL);
  return c > CORE ? 2 : c > RIM ? 1 : 0;
}

/** Pure: the wind drift (in blocks) at a simulation time in seconds. */
export function windAt(timeSec: number): [number, number] {
  return [WIND_X * timeSec, WIND_Z * timeSec + WIND_Z_OFFSET];
}

/**
 * Pure: the tile-uv offsets that keep the pattern world-locked while the
 * sheet follows the camera. For a world point w the sampled texel index is
 * (w − cam + QUAD/2) / (TILE · CELL) + 4 · offset
 *   = (w − cam + 1024) / 512 + (cam + wind) / 512
 *   = (w + wind) / 512 + 2 — the cam terms cancel algebraically.
 */
export function cloudTexOffset(camX: number, camZ: number, timeSec: number): [number, number] {
  const [wx, wz] = windAt(timeSec);
  return [(camX + wx) / QUAD, (camZ + wz) / QUAD];
}

/**
 * Pure: the cloud sheet's renderOrder for a camera at height `camY`. The
 * sheet re-centers on the camera every frame, so its bounding sphere sits at
 * the camera — three.js's transparent sort (renderOrder, then far-to-near)
 * would draw it dead last no matter where it really is. Rule: an eye at or
 * below the sheet (camY ≤ ALTITUDE) sees the sheet as the FARTHEST
 * transparent on any upward ray (terrain tops out at y ≤ 64, sun/moon discs
 * at r = 360–380) → the sheet is drawn FIRST among transparents
 * (renderOrder −1, after the −2 celestial layer). An eye above the sheet
 * (fly mode, y > ALTITUDE) sees it as the NEAREST transparent when looking
 * down → drawn LAST (renderOrder +1).
 */
export function cloudRenderOrder(camY: number): -1 | 1 {
  return camY <= ALTITUDE ? -1 : 1;
}

import * as THREE from 'three';

// --- renderer: one large textured quad, world-locked, wind-scrolled, player-centered ---

export interface Clouds {
  update(camX: number, camZ: number, camY: number, timeSec: number, dim: number): void;
  setVisible(visible: boolean): void; // the water mood hides the whole layer
}

/**
 * Builds the cloud layer into `scene`: a QUAD×QUAD-block plane at `ALTITUDE`
 * carrying the baked 128×128 tile (repeated, NearestFilter). The sheet is
 * centered on the camera EVERY frame (continuous — no snapping, no
 * re-center events), and the texture offset tracks `camera + wind`, so a
 * fixed world point always samples `(w + wind(t)) / 512 + const`: the
 * pattern is world-locked AND the sheet reads as an infinite layer — its
 * edge is always ≥ QUAD/2 blocks away, so the 512 far plane clips it to a
 * disc whose rim sits only ≈5–10° above the horizon. Per-frame cost: two
 * position floats + two offset floats; no matrix or texture uploads.
 */
export function createClouds(scene: THREE.Scene): Clouds {
  // The tile: one RGBA pixel per texel (white + alpha level), baked once.
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  {
    const g = canvas.getContext('2d')!;
    const img = g.createImageData(TILE, TILE);
    for (let j = 0; j < TILE; j++)
      for (let i = 0; i < TILE; i++) {
        const l = cloudTileLevel(i, j);
        const p = (j * TILE + i) * 4;
        img.data[p] = 255;
        img.data[p + 1] = 255;
        img.data[p + 2] = 255;
        img.data[p + 3] = l === 2 ? 255 : l === 1 ? 153 : 0;
      }
    g.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter; // the blocky 0/1 cell edges
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide, // visible from below
    fog: false, // 50–150 blocks overhead: night fog would fade the layer up to ~50%
  });
  const geo = new THREE.PlaneGeometry(QUAD, QUAD);
  geo.rotateX(-Math.PI / 2); // flat in XZ (DoubleSide → normal sign irrelevant)
  // PlaneGeometry's v runs along the pre-rotation +Y, which lands on world −z
  // after the rotate; flip it so BOTH uv axes increase with world +x/+z —
  // keeps the wind-offset signs consistent on both axes.
  {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  }
  const mesh = new THREE.Mesh(geo, mat);
  // renderOrder is managed per frame by update() via cloudRenderOrder(camY) — see that comment.
  scene.add(mesh);

  const day = new THREE.Color(0xffffff);
  const night = new THREE.Color(0x707a9c);

  return {
    update(camX, camZ, camY, timeSec, dim) {
      mesh.position.set(camX, ALTITUDE, camZ);
      mesh.renderOrder = cloudRenderOrder(camY);
      const [ox, oy] = cloudTexOffset(camX, camZ, timeSec);
      tex.offset.set(ox, oy);
      // dim ∈ [0.33, 1] (0.33 is the sky's night floor); clamp guards a future mood
      const dtn = Math.max(0, Math.min(1, (1 - dim) / (1 - 0.33)));
      mat.color.copy(day).lerp(night, dtn);
    },
    setVisible(visible) {
      mesh.visible = visible;
    },
  };
}