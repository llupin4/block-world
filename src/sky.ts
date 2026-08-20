// Sky: reads world time, paints the sky. The sampler (top) is pure — a
// keyframe table in phase space plus the sun/moon angles — and is
// node-testable; the renderer (bottom, added on top of this) is the thin
// three.js side that src/main.ts applies per frame. The sky never advances
// time — it is a consumer of src/time.ts.
// Spec: docs/superpowers/specs/2026-08-19-day-night-clouds-design.md.

export type RGB = [number, number, number]; // 0..1
export type Vec3 = [number, number, number];

export interface SkySample {
  skyTop: RGB; // zenith colour for the sky dome
  skyHorizon: RGB; // horizon colour for the sky dome
  airFogColor: RGB;
  airFogDensity: number;
  worldDim: number; // 1.0 (day) .. 0.33 (night); global stand-in dim until per-block skylight lands
  dayness: number; // 0..1: the worldDim ramp normalized ((worldDim - 0.33) / 0.67) — 1.0 in full daylight, 0.0 at deep night; scales the skylight component of per-vertex light (uDayness uniform). Same curve as the sky palette fade, so sky and light dim in sync.
  starAlpha: number;
  sunDir: Vec3; // unit direction; (0,1,0) at noon, +X horizon at sunset
  moonDir: Vec3; // antipode of the sun
  waterBg: RGB; // underwater background — the underwater mood is time-tinted too
  waterFogColor: RGB;
  waterFogDensity: number;
}

interface Anchor {
  p: number;
  top: RGB;
  horizon: RGB;
  airFog: RGB;
  airFogDens: number;
  dim: number;
  stars: number;
  waterBg: RGB;
  waterFog: RGB;
  waterFogDens: number;
}

function hex(s: string): RGB {
  return [
    parseInt(s.slice(1, 3), 16) / 255,
    parseInt(s.slice(3, 5), 16) / 255,
    parseInt(s.slice(5, 7), 16) / 255,
  ];
}

// Keyframes in phase space, joined by smoothstep (wrapping 1.0 → 0.0). The
// table is mirror-symmetric about midnight, so dawn/dusk are identical.
const ANCHORS: Anchor[] = [
  { p: 0.0,  top: hex('#3d9ae0'), horizon: hex('#87ceeb'), airFog: hex('#cfe8ff'), airFogDens: 0.004,  dim: 1.0,  stars: 0.0,  waterBg: hex('#0a2a55'), waterFog: hex('#0a2a55'), waterFogDens: 0.35 },
  { p: 0.22, top: hex('#6f8fc8'), horizon: hex('#e8a05c'), airFog: hex('#d8b8a8'), airFogDens: 0.0045, dim: 1.0,  stars: 0.0,  waterBg: hex('#09244d'), waterFog: hex('#0a2a55'), waterFogDens: 0.35 },
  { p: 0.25, top: hex('#3a2f66'), horizon: hex('#d9713f'), airFog: hex('#6a5570'), airFogDens: 0.005,  dim: 0.85, stars: 0.15, waterBg: hex('#071c3d'), waterFog: hex('#071c3d'), waterFogDens: 0.37 },
  { p: 0.3,  top: hex('#0a0d1e'), horizon: hex('#232c52'), airFog: hex('#151d3a'), airFogDens: 0.0055, dim: 0.45, stars: 0.6,  waterBg: hex('#040b18'), waterFog: hex('#040b18'), waterFogDens: 0.39 },
  { p: 0.5,  top: hex('#05070f'), horizon: hex('#2a3a66'), airFog: hex('#101a33'), airFogDens: 0.006,  dim: 0.33, stars: 1.0,  waterBg: hex('#030710'), waterFog: hex('#04091a'), waterFogDens: 0.4 },
  { p: 0.7,  top: hex('#0a0d1e'), horizon: hex('#232c52'), airFog: hex('#151d3a'), airFogDens: 0.0055, dim: 0.45, stars: 0.6,  waterBg: hex('#040b18'), waterFog: hex('#040b18'), waterFogDens: 0.39 },
  { p: 0.75, top: hex('#3a2f66'), horizon: hex('#d9713f'), airFog: hex('#6a5570'), airFogDens: 0.005,  dim: 0.85, stars: 0.15, waterBg: hex('#071c3d'), waterFog: hex('#071c3d'), waterFogDens: 0.37 },
  { p: 0.78, top: hex('#6f8fc8'), horizon: hex('#e8a05c'), airFog: hex('#d8b8a8'), airFogDens: 0.0045, dim: 1.0,  stars: 0.0,  waterBg: hex('#09244d'), waterFog: hex('#0a2a55'), waterFogDens: 0.35 },
  { p: 1.0,  top: hex('#3d9ae0'), horizon: hex('#87ceeb'), airFog: hex('#cfe8ff'), airFogDens: 0.004,  dim: 1.0,  stars: 0.0,  waterBg: hex('#0a2a55'), waterFog: hex('#0a2a55'), waterFogDens: 0.35 },
];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerp3 = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const smoothstep = (t: number): number => {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
};

/** Pure: the full sky state at a day phase (wrapped into [0, 1) first). */
export function sampleSky(phase: number): SkySample {
  const p = ((phase % 1) + 1) % 1;
  let i = 0;
  for (let k = 0; k < ANCHORS.length - 1; k++) if (ANCHORS[k].p <= p) i = k;
  const a = ANCHORS[i];
  const b = ANCHORS[i + 1];
  const t = smoothstep((p - a.p) / (b.p - a.p));
  const sun: Vec3 = [Math.sin(2 * Math.PI * p), Math.cos(2 * Math.PI * p), 0];
  const dimRaw = lerp(a.dim, b.dim, t);
  return {
    skyTop: lerp3(a.top, b.top, t),
    skyHorizon: lerp3(a.horizon, b.horizon, t),
    airFogColor: lerp3(a.airFog, b.airFog, t),
    airFogDensity: lerp(a.airFogDens, b.airFogDens, t),
    worldDim: dimRaw,
    dayness: (dimRaw - 0.33) / 0.67,
    starAlpha: lerp(a.stars, b.stars, t),
    sunDir: sun,
    moonDir: [-sun[0], -sun[1], -sun[2]],
    waterBg: lerp3(a.waterBg, b.waterBg, t),
    waterFogColor: lerp3(a.waterFog, b.waterFog, t),
    waterFogDensity: lerp(a.waterFogDens, b.waterFogDens, t),
  };
}

import * as THREE from 'three';

// --- renderer: the thin three.js side, applied per frame by src/main.ts ---

const prng = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const css = (c: RGB): string =>
  `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;

const dist3 = (a: RGB, b: RGB): number =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

export interface Sky {
  apply(sample: SkySample, mood: 'air' | 'water', camera: THREE.PerspectiveCamera): void;
}

/**
 * Builds the sky objects (dome, stars, sun, moon) into `scene` and returns an
 * `apply` handle. The renderer mutates the fog-object / background objects
 * passed in from main.ts — it never re-allocates per frame. The dome is the
 * only texture that can change: its gradient canvas redraws when the palette
 * moves (dusk/dawn bands), never while a phase is stable.
 */
export function createSky(
  scene: THREE.Scene,
  matOpaque: THREE.MeshBasicMaterial,
  matTrans: THREE.MeshBasicMaterial,
  fogAir: THREE.FogExp2,
  fogWater: THREE.FogExp2,
  bgWater: THREE.Color,
): Sky {
  // Sky dome: big inverted sphere, re-centred on the camera each frame.
  // CanvasTexture keeps flipY=true and SphereGeometry gives v=1 at the top
  // pole, so canvas row 0 (zenith) lands at the top pole.
  const gradCanvas = document.createElement('canvas');
  gradCanvas.width = 16;
  gradCanvas.height = 256;
  const gctx = gradCanvas.getContext('2d')!;
  const gradTex = new THREE.CanvasTexture(gradCanvas);
  const drawDome = (top: RGB, horizon: RGB): void => {
    // rows 0..127: zenith → horizon (the equator is row ~128); below: flat horizon
    for (let y = 0; y < 128; y++) {
      const t = y / 127;
      gctx.fillStyle = css([
        top[0] + (horizon[0] - top[0]) * t,
        top[1] + (horizon[1] - top[1]) * t,
        top[2] + (horizon[2] - top[2]) * t,
      ]);
      gctx.fillRect(0, y, 16, 1);
    }
    gctx.fillStyle = css(horizon);
    gctx.fillRect(0, 128, 16, 128);
  };
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 16),
    new THREE.MeshBasicMaterial({ map: gradTex, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  scene.add(dome);

  // Stars: ~400 fixed points on the upper celestial sphere, camera-following.
  const N_STARS = 400;
  const starPos = new Float32Array(N_STARS * 3);
  const starCol = new Float32Array(N_STARS * 3);
  {
    const r = prng(0x51a77e);
    for (let i = 0; i < N_STARS; i++) {
      const y = r(); // uniform over the upper hemisphere
      const a = r() * Math.PI * 2;
      const rr = Math.sqrt(1 - y * y);
      starPos[i * 3] = rr * Math.cos(a) * 360;
      starPos[i * 3 + 1] = y * 360;
      starPos[i * 3 + 2] = rr * Math.sin(a) * 360;
      const blue = r() < 0.3; // a few pale-blue, the rest white
      starCol[i * 3] = blue ? 0.72 : 1.0;
      starCol[i * 3 + 1] = blue ? 0.78 : 1.0;
      starCol[i * 3 + 2] = 1.0;
    }
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
  const starMat = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    fog: false,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Sun & moon: soft radial-gradient sprite discs.
  const glowTexture = (inner: string, mid: string, outer: string): THREE.CanvasTexture => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, inner);
    grad.addColorStop(0.25, inner);
    grad.addColorStop(0.5, mid);
    grad.addColorStop(1, outer);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  };
  const sun = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture('rgba(255,246,205,1)', 'rgba(255,196,80,0.8)', 'rgba(255,150,40,0)'),
      fog: false,
      transparent: true,
    }),
  );
  sun.scale.set(46, 46, 1);
  scene.add(sun);
  const moon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture('rgba(244,244,232,1)', 'rgba(190,198,228,0.7)', 'rgba(150,160,205,0)'),
      fog: false,
      transparent: true,
    }),
  );
  moon.scale.set(34, 34, 1);
  scene.add(moon);

  // Celestial discs + stars sit BEHIND the cloud sheet: the sheet (renderOrder
  // −1/+1, managed per frame in src/clouds.ts) always draws after them, so
  // cloud puffs correctly occlude sun/moon/stars.
  stars.renderOrder = -2;
  sun.renderOrder = -2;
  moon.renderOrder = -2;

  const tmp = new THREE.Vector3();
  let lastTop: RGB | null = null;
  let lastHorizon: RGB | null = null;

  return {
    apply(sample, mood, camera) {
      // worldDim: one scalar on the shared materials dims the whole world,
      // zero remeshing. The clouds tint it the same way (see src/clouds.ts).
      matOpaque.color.setScalar(sample.worldDim);
      matTrans.color.setScalar(sample.worldDim);

      if (mood === 'water') {
        // the underwater mood keeps priority, but is time-tinted
        scene.background = bgWater;
        scene.fog = fogWater;
        bgWater.setRGB(sample.waterBg[0], sample.waterBg[1], sample.waterBg[2]);
        fogWater.color.setRGB(sample.waterFogColor[0], sample.waterFogColor[1], sample.waterFogColor[2]);
        fogWater.density = sample.waterFogDensity;
        dome.visible = false;
        stars.visible = false;
        sun.visible = false;
        moon.visible = false;
        return;
      }

      scene.background = null; // the dome covers the screen; clear colour is a fallback
      scene.fog = fogAir;
      fogAir.color.setRGB(sample.airFogColor[0], sample.airFogColor[1], sample.airFogColor[2]);
      fogAir.density = sample.airFogDensity;

      dome.visible = true;
      dome.position.copy(camera.position);

      stars.visible = sample.starAlpha > 0.01;
      starMat.opacity = sample.starAlpha;
      stars.position.copy(camera.position);

      sun.position.copy(camera.position).addScaledVector(tmp.set(sample.sunDir[0], sample.sunDir[1], sample.sunDir[2]), 380);
      sun.visible = sample.sunDir[1] > -0.03;
      moon.position.copy(camera.position).addScaledVector(tmp.set(sample.moonDir[0], sample.moonDir[1], sample.moonDir[2]), 380);
      moon.visible = sample.moonDir[1] > -0.03;

      if (
        lastTop === null ||
        lastHorizon === null ||
        dist3(sample.skyTop, lastTop) > 0.003 ||
        dist3(sample.skyHorizon, lastHorizon) > 0.003
      ) {
        drawDome(sample.skyTop, sample.skyHorizon);
        gradTex.needsUpdate = true;
        lastTop = [...sample.skyTop];
        lastHorizon = [...sample.skyHorizon];
      }
    },
  };
}