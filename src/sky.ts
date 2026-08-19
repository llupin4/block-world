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
  return {
    skyTop: lerp3(a.top, b.top, t),
    skyHorizon: lerp3(a.horizon, b.horizon, t),
    airFogColor: lerp3(a.airFog, b.airFog, t),
    airFogDensity: lerp(a.airFogDens, b.airFogDens, t),
    worldDim: lerp(a.dim, b.dim, t),
    starAlpha: lerp(a.stars, b.stars, t),
    sunDir: sun,
    moonDir: [-sun[0], -sun[1], -sun[2]],
    waterBg: lerp3(a.waterBg, b.waterBg, t),
    waterFogColor: lerp3(a.waterFog, b.waterFog, t),
    waterFogDensity: lerp(a.waterFogDens, b.waterFogDens, t),
  };
}