# Day/Night Cycle, Sun & Moon, Stars, Clouds — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A world-time clock (world state), a time-driven sky (gradient dome, sun/moon, stars, global night dim, time-tinted underwater mood), an instanced wind-drifting cloud layer, and a small HUD clock.

**Architecture:** Three new focused modules: `src/time.ts` (pure world-time state + formatter, no three.js), `src/sky.ts` (pure `sampleSky(phase)` keyframe sampler + thin `createSky` renderer), `src/clouds.ts` (pure `cloudMask`/`windAt` coverage math + `createClouds` instanced-layer renderer). `src/main.ts` owns the instances: it advances `WorldTime` inside the fixed 60 Hz substep and applies the sampled sky + clouds per frame. The renderer is unlit (`MeshBasicMaterial` + baked vertex colors), so night is a `worldDim` scalar on the shared materials — a documented stand-in until the dynamic-lighting project bakes real skylight. Spec: `docs/superpowers/specs/2026-08-19-day-night-clouds-design.md`.

**Tech Stack:** TypeScript (strict), Three.js r166 (`FogExp2`, `CanvasTexture`, `SphereGeometry`, `Points`, `Sprite`, `InstancedMesh`), `simplex-noise` v4, Vitest, Vite. Test command: `npm test`. Type-check/build: `npm run build` (`tsc --noEmit && vite build`). Manual: `npm run dev`.

Working branch: `day-night-clouds` (already created). No other branch or worktree needed. No secrets involved.

**Deviation notes (recorded up front):**
- HUD clock is **top-left**, not the spec's top-right — the palette strip owns the top-right corner (`#palette` in `src/ui.css`), and an open palette would cover the clock.
- The clock font uses `ui-monospace` per spec; the rest of the UI uses `system-ui`.

---

### Task 1: World time (`src/time.ts`)

**Files:**
- Create: `src/time.ts`
- Create: `src/__tests__/time.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/time.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { WorldTime, formatClock, DAY_LENGTH } from '../time';

describe('world time', () => {
  it('starts at noon of day 1', () => {
    const t = new WorldTime();
    expect(t.dayPhase).toBe(0);
    expect(t.day).toBe(1);
    expect(t.hour).toBe(12);
    expect(t.time).toBe(0);
  });

  it('maps the phase landmarks: sunset 0.25, midnight 0.5, sunrise 0.75', () => {
    const t = new WorldTime();
    t.advance(DAY_LENGTH * 0.25);
    expect(t.dayPhase).toBeCloseTo(0.25);
    expect(t.hour).toBeCloseTo(18);
    t.advance(DAY_LENGTH * 0.25);
    expect(t.dayPhase).toBeCloseTo(0.5);
    expect(t.hour).toBeCloseTo(0);
    expect(t.day).toBe(2); // midnight is the day boundary
    t.advance(DAY_LENGTH * 0.25);
    expect(t.dayPhase).toBeCloseTo(0.75);
    expect(t.hour).toBeCloseTo(6);
    t.advance(DAY_LENGTH * 0.25);
    expect(t.dayPhase).toBeCloseTo(0);
    expect(t.hour).toBeCloseTo(12);
    expect(t.day).toBe(2); // a full cycle ends at noon of day 2, not day 3
  });

  it('a full cycle (240 s) wraps phase and lands on day 2', () => {
    const t = new WorldTime();
    t.advance(240);
    expect(t.dayPhase).toBeCloseTo(0);
    expect(t.day).toBe(2);
    expect(t.time).toBe(240);
  });

  it('advances deterministically: identical dt sequences give identical clocks', () => {
    const a = new WorldTime();
    const b = new WorldTime();
    for (const dt of [1 / 60, 1 / 60, 0.02, 1 / 60, 0.1, 5]) {
      a.advance(dt);
      b.advance(dt);
    }
    expect(a.time).toBe(b.time);
    expect(a.dayPhase).toBe(b.dayPhase);
    expect(a.day).toBe(b.day);
    expect(a.hour).toBe(b.hour);
  });
});

describe('formatClock', () => {
  it('renders "Day N · hh:mm" with zero padding', () => {
    expect(formatClock(1, 0)).toBe('Day 1 · 00:00');
    expect(formatClock(2, 12.0)).toBe('Day 2 · 12:00');
    expect(formatClock(2, 19 + 41 / 60)).toBe('Day 2 · 19:41');
  });

  it('handles minutes by floor, not round', () => {
    expect(formatClock(3, 23.983)).toBe('Day 3 · 23:58');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/time.test.ts`
Expected: FAIL — `Cannot find module '../time'`.

- [ ] **Step 3: Implement `src/time.ts`**

Create `src/time.ts`:

```ts
// World time: world-level state, advanced by the simulation clock. src/main.ts
// calls advance() once per fixed 60 Hz physics substep (never from wall-clock
// dt), so a lagging frame drops frames — it never stretches the day.
// `phaseTotal`/`dayPhase` are stored counters of their own (normally advanced
// 1:1 with `time` via DAY_LENGTH), so the daylight cycle can later be frozen,
// rescaled, or set independently of the simulation clock. See
// docs/superpowers/specs/2026-08-19-day-night-clouds-design.md.
// Pure module: no three.js, no DOM — node-testable.

export const DAY_LENGTH = 240; // seconds for one full day/night cycle (2 min day + 2 min night)

export class WorldTime {
  /** Total simulation time (s). */
  time = 0;
  /** Total phase progressed, in cycles. Stored, not derived from `time`, so the cycle can later run independently. */
  private phaseTotal = 0;

  /** Position in the current cycle, [0, 1): 0 = noon, 0.25 = sunset, 0.5 = midnight, 0.75 = sunrise. */
  get dayPhase(): number {
    return this.phaseTotal % 1;
  }

  /** Day number; the session starts at noon of day 1, and day N+1 starts when dayPhase reaches 0.5 (midnight). */
  get day(): number {
    return 1 + Math.floor(this.phaseTotal + 0.5);
  }

  /** Display hour in [0, 24): phase 0 → 12.0, 0.25 → 18.0, 0.5 → 0.0, 0.75 → 6.0. */
  get hour(): number {
    return (12 + 24 * this.dayPhase) % 24;
  }

  /** Advance the simulation clock and (by default) the daylight cycle in lockstep. */
  advance(dt: number): void {
    this.time += dt;
    this.phaseTotal += dt / DAY_LENGTH;
  }
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** `"Day 2 · 19:41"` for the HUD. `hour` is the fractional display hour (WorldTime.hour). */
export function formatClock(day: number, hour: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour - h) * 60 + 1e-9);
  return `Day ${day} · ${pad2(h)}:${pad2(m)}`;
}
```

The `+ 1e-9` guards float error at exact minute boundaries (e.g. `formatClock(2, 19 + 41/60)` must print `41`, not `40`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/time.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Type-check and commit**

Run: `npm run build`
Expected: type-check passes (vite build output is irrelevant here).

```bash
git add src/time.ts src/__tests__/time.test.ts
git commit -m "feat: WorldTime — world-state day/night clock + HUD clock formatter"
```

---

### Task 2: Sky sampler — the pure, keyframed core (`src/sky.ts`, part 1)

**Files:**
- Create: `src/sky.ts`
- Create: `src/__tests__/sky.test.ts`

This task adds only the pure sampler to `src/sky.ts` (no three.js imports yet — the renderer lands in Task 3 and appends to the same file).

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/sky.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { sampleSky, type RGB } from '../sky';

const rgb = (s: string): RGB => [
  parseInt(s.slice(1, 3), 16) / 255,
  parseInt(s.slice(3, 5), 16) / 255,
  parseInt(s.slice(5, 7), 16) / 255,
];

const closeRgb = (a: RGB, b: RGB, msg: string): void => {
  for (let i = 0; i < 3; i++) expect(a[i], `${msg} channel ${i}`).toBeCloseTo(b[i], 6);
};

describe('sampleSky', () => {
  it('returns the keyframe values verbatim at the anchor phases', () => {
    const noon = sampleSky(0.0);
    expect(noon.skyTop).toEqual(rgb('#3d9ae0'));
    expect(noon.skyHorizon).toEqual(rgb('#87ceeb'));
    expect(noon.airFogDensity).toBeCloseTo(0.004);
    expect(noon.worldDim).toBeCloseTo(1.0);
    expect(noon.starAlpha).toBeCloseTo(0.0);
    expect(noon.waterFogDensity).toBeCloseTo(0.35);

    const midnight = sampleSky(0.5);
    expect(midnight.skyTop).toEqual(rgb('#05070f'));
    expect(midnight.skyHorizon).toEqual(rgb('#2a3a66'));
    expect(midnight.worldDim).toBeCloseTo(0.33);
    expect(midnight.starAlpha).toBeCloseTo(1.0);
    expect(midnight.waterFogDensity).toBeCloseTo(0.4);
  });

  it('is mirror-symmetric about midnight: sampleSky(p) == sampleSky(1 - p)', () => {
    for (const p of [0.05, 0.15, 0.225, 0.3, 0.4, 0.45, 0.55, 0.65, 0.775, 0.9]) {
      const a = sampleSky(p);
      const b = sampleSky(1 - p);
      closeRgb(a.skyTop, b.skyTop, `top @ ${p}`);
      closeRgb(a.skyHorizon, b.skyHorizon, `horizon @ ${p}`);
      closeRgb(a.airFogColor, b.airFogColor, `airFog @ ${p}`);
      closeRgb(a.waterBg, b.waterBg, `waterBg @ ${p}`);
      closeRgb(a.waterFogColor, b.waterFogColor, `waterFog @ ${p}`);
      expect(a.airFogDensity, `airFogDens @ ${p}`).toBeCloseTo(b.airFogDensity, 6);
      expect(a.worldDim, `dim @ ${p}`).toBeCloseTo(b.worldDim, 6);
      expect(a.starAlpha, `stars @ ${p}`).toBeCloseTo(b.starAlpha, 6);
      expect(a.waterFogDensity, `waterFogDens @ ${p}`).toBeCloseTo(b.waterFogDensity, 6);
    }
  });

  it('worldDim falls monotonically from day to midnight', () => {
    let prev = Infinity;
    for (let i = 0; i <= 30; i++) {
      const d = sampleSky(0.22 + (i / 30) * 0.28).worldDim; // 0.22 → 0.50
      expect(d, `dim at step ${i}`).toBeLessThanOrEqual(prev + 1e-12);
      prev = d;
    }
  });

  it('worldDim stays within [0.33, 1.0] across the whole cycle', () => {
    for (let i = 0; i < 120; i++) {
      const d = sampleSky(i / 120).worldDim;
      expect(d).toBeGreaterThanOrEqual(0.33 - 1e-9);
      expect(d).toBeLessThanOrEqual(1.0 + 1e-9);
    }
  });

  it('starAlpha is 0 at noon, 1 at midnight, rising monotonically day → night', () => {
    expect(sampleSky(0).starAlpha).toBeCloseTo(0);
    expect(sampleSky(0.5).starAlpha).toBeCloseTo(1);
    let prev = -Infinity;
    for (let i = 0; i <= 30; i++) {
      const s = sampleSky(0.22 + (i / 30) * 0.28).starAlpha;
      expect(s, `stars at step ${i}`).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = s;
    }
  });

  it('sun: zenith at noon, +X horizon at sunset, nadir at midnight, -X horizon at dawn', () => {
    expect(sampleSky(0.0).sunDir[1]).toBeCloseTo(1);
    expect(sampleSky(0.25).sunDir[1]).toBeCloseTo(0);
    expect(sampleSky(0.25).sunDir[0]).toBeCloseTo(1);
    expect(sampleSky(0.5).sunDir[1]).toBeCloseTo(-1);
    expect(sampleSky(0.75).sunDir[1]).toBeCloseTo(0);
    expect(sampleSky(0.75).sunDir[0]).toBeCloseTo(-1);
  });

  it('moonDir is the antipode of sunDir everywhere', () => {
    for (let i = 0; i < 40; i++) {
      const s = sampleSky(i / 40);
      expect(s.moonDir[0]).toBeCloseTo(-s.sunDir[0], 6);
      expect(s.moonDir[1]).toBeCloseTo(-s.sunDir[1], 6);
      expect(s.moonDir[2]).toBeCloseTo(-s.sunDir[2], 6);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/sky.test.ts`
Expected: FAIL — `Cannot find module '../sky'`.

- [ ] **Step 3: Implement the sampler in `src/sky.ts`**

Create `src/sky.ts` (exactly this content — the renderer is appended in Task 3):

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/sky.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Type-check and commit**

Run: `npm run build`
Expected: type-check passes.

```bash
git add src/sky.ts src/__tests__/sky.test.ts
git commit -m "feat: sky sampler — phase-keyframed palette + sun/moon geometry"
```

---

### Task 3: Sky renderer (dome, stars, sun/moon, dim) — `src/sky.ts`, part 2

**Files:**
- Modify: `src/sky.ts` (append the renderer below the sampler)

No unit tests for this task: it is pure three.js wiring (WebGL), verified by type-check now and in-browser in Task 6's manual pass. The pure sampler is already covered by Task 2.

- [ ] **Step 1: Append the renderer to `src/sky.ts`**

Add this content to the end of `src/sky.ts` (after `sampleSky`):

```ts
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
        lastTop = sample.skyTop;
        lastHorizon = sample.skyHorizon;
      }
    },
  };
}
```

- [ ] **Step 2: Type-check (and keep the sampler tests green)**

Run: `npm run build && npx vitest run src/__tests__/sky.test.ts src/__tests__/time.test.ts`
Expected: type-check passes; tests PASS. (Importing `../sky` in tests now also loads the three.js import — `three` is node-safe, so no environment issues; if vitest ever failed on this, add a `// @vitest-environment node` header is NOT the fix — instead split the renderer into its own file. Expect no issue.)

- [ ] **Step 3: Commit**

```bash
git add src/sky.ts
git commit -m "feat: sky renderer — dome, stars, sun/moon sprites, global world dim"
```

---

### Task 4: Cloud coverage math (pure) — `src/clouds.ts`, part 1

**Files:**
- Create: `src/clouds.ts`
- Create: `src/__tests__/clouds.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/clouds.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { cloudCoverage, cloudMask, windAt, CELL, WINDOW, THRESHOLD } from '../clouds';

describe('clouds (pure coverage)', () => {
  it('mask is deterministic for a given anchor and wind', () => {
    expect(cloudMask(0, 0, 0, 0)).toEqual(cloudMask(0, 0, 0, 0));
    expect(cloudMask(-16, 8, 3.5, 9.25)).toEqual(cloudMask(-16, 8, 3.5, 9.25));
  });

  it('mask is world-locked: re-anchoring shifts the window, not the pattern', () => {
    const a = cloudMask(-4, 0, 7.3, 2.1);
    const b = cloudMask(0, 0, 7.3, 2.1);
    // column 23 of window a is world x = -4 + 23*4 = 88;
    // column 22 of window b is world x = 0 + 22*4 = 88 — same cells
    for (let j = 0; j < WINDOW; j++) {
      expect(a[j * WINDOW + 23], `row ${j}`).toBe(b[j * WINDOW + 22]);
    }
  });

  it('wind drifts the pattern over time', () => {
    const a = cloudMask(0, 0, 0, 0);
    const b = cloudMask(0, 0, 200, 0);
    expect(a.some((v, i) => v !== b[i])).toBe(true);
  });

  it('mask[i] is exactly coverage > threshold for every cell of the anchored window', () => {
    const mask = cloudMask(0, 0, 1.7, 4.4);
    for (let j = 0; j < WINDOW; j++) {
      for (let i = 0; i < WINDOW; i++) {
        const cov = cloudCoverage(i * CELL, j * CELL, 1.7, 4.4);
        expect(mask[j * WINDOW + i], `cell ${i},${j}`).toBe(cov > THRESHOLD);
      }
    }
  });

  it('wind drifts monotonically (X and Z, Z offset out of phase)', () => {
    const [wx0, wz0] = windAt(0);
    const [wx1, wz1] = windAt(10);
    expect(wx1).toBeGreaterThan(wx0);
    expect(wz1).toBeGreaterThan(wz0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/clouds.test.ts`
Expected: FAIL — `Cannot find module '../clouds'`.

- [ ] **Step 3: Implement the pure part of `src/clouds.ts`**

Create `src/clouds.ts` (exactly this content — the renderer is appended in Task 5):

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/clouds.test.ts`
Expected: PASS — 5 tests. (The wind-drift test is deterministic; if the wind-200 step ever coincidentally reproduced the mask — effectively impossible for simplex noise — increase it to `500`.)

- [ ] **Step 5: Type-check and commit**

Run: `npm run build`
Expected: type-check passes.

```bash
git add src/clouds.ts src/__tests__/clouds.test.ts
git commit -m "feat: cloud coverage math — world-locked noise mask + wind drift"
```

---

### Task 5: Cloud layer renderer — `src/clouds.ts`, part 2

**Files:**
- Modify: `src/clouds.ts` (append the renderer below the pure part)

Three.js wiring — verified by type-check now, in-browser in Task 6.

- [ ] **Step 1: Append the renderer to `src/clouds.ts`**

Add this to the end of `src/clouds.ts`:

```ts
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
```

- [ ] **Step 2: Type-check (and keep the cloud tests green)**

Run: `npm run build && npx vitest run src/__tests__/clouds.test.ts`
Expected: type-check passes; tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/clouds.ts
git commit -m "feat: cloud layer renderer — instanced grid, wind drift, night tint"
```

---

### Task 6: Wire everything into main.ts (loop, moods, HUD)

**Files:**
- Modify: `src/main.ts` (imports, mood constants, sky/cloud construction, `syncWaterFx`, `frame`)
- Modify: `index.html` (clock element)
- Modify: `src/ui.css` (clock style)

This is the integration task: no new unit tests (the pure parts are all covered), verified by type-check, full test suite, and the manual pass in Task 8.

- [ ] **Step 1: Add imports**

In `src/main.ts`, after the line `import { WaterSim } from './water';` (line 10) add:

```ts
import { WorldTime, formatClock } from './time';
import { sampleSky, createSky } from './sky';
import { createClouds } from './clouds';
```

- [ ] **Step 2: Replace the static mood constants**

Replace the block at the top of the scene section (currently lines 22–28: `// T12: two "moods" ...` through `scene.fog = FOG_AIR;`) with:

```ts
// T12: two "moods" — air vs water (submergence). The sky now paints both: the
// air mood carries the time-of-day gradient sky (src/sky.ts), the water mood a
// time-tinted deep blue (night underwater is darker). The mood still owns the
// FOV squeeze and which fog/background objects are active.
const BG_WATER = new THREE.Color(0x0a2a55);
const FOG_AIR = new THREE.FogExp2(0xcfe8ff, 0.004);
const FOG_WATER = new THREE.FogExp2(0x0a2a55, 0.35);
renderer.setClearColor(0x101a33); // fallback clear (night horizon): the sky dome covers every pixel anyway
```

(`BG_AIR` and the `scene.background = BG_AIR` / `scene.fog = FOG_AIR` initializers are deliberately removed: the sky dome replaces the flat-air-background, and the first `sky.apply` call — which runs before the first `renderer.render` — installs the initial state. The `FOG_*`/`BG_WATER` objects survive; `sky.apply` mutates them per frame instead of swapping them.)

- [ ] **Step 3: Construct the new systems**

After the `matTrans` material definition (end of the `=== scene ===` block, currently around line 188) insert:

```ts
// === sky ===
// World time is world state: advanced in the fixed substep loop below, then
// sampled per frame for the sky (src/sky.ts) and clouds (src/clouds.ts).
const worldTime = new WorldTime();
const sky = createSky(scene, matOpaque, matTrans, FOG_AIR, FOG_WATER, BG_WATER);
const clouds = createClouds(scene);
const clockEl = document.getElementById('clock')!;
let clockLabel = '';
```

- [ ] **Step 4: Trim `syncWaterFx` to what only it owns**

Replace the `syncWaterFx` function (currently lines ~715–727, from the `// T12: when the eye voxel is water` comment through the closing brace) with:

```ts
// T12: when the eye voxel is water the whole scene swaps to the water mood —
// the FOV squeeze here; the time-driven sky (sky.apply) paints whichever
// background/fog is active, in both moods. Driven by player.headInWater
// (T7 samples it each physics step); called per frame below.
let waterFx: 'air' | 'water' = 'air';
function syncWaterFx(): void {
  const m: 'air' | 'water' = player.headInWater ? 'water' : 'air';
  if (m === waterFx) return; // stable: one swap per (de)submersion, not per frame
  waterFx = m;
  camera.fov = m === 'water' ? FOV_WATER : FOV_AIR;
  camera.updateProjectionMatrix(); // a fov change only reaches the GPU via this call
}
```

- [ ] **Step 5: Advance world time and apply sky/clouds/clock in `frame()`**

In `frame()`, inside the fixed substep `while` loop, after `player.update(STEP, readMove());` add:

```ts
    worldTime.advance(STEP);
```

And after the existing `syncWaterFx();` call (just before `renderer.render(scene, camera);`) add:

```ts
  const skySample = sampleSky(worldTime.dayPhase);
  sky.apply(skySample, waterFx, camera);
  clouds.update(camera.position.x, camera.position.z, worldTime.time, skySample.worldDim);
  const label = formatClock(worldTime.day, worldTime.hour);
  if (label !== clockLabel) {
    clockLabel = label;
    clockEl.textContent = label;
  }
```

- [ ] **Step 6: Add the clock element and style**

In `index.html`, after `<div id="crosshair"></div>` (line 11) add:

```html
  <div id="clock">Day 1 · 12:00</div>
```

In `src/ui.css`, after the `#crosshair::after` rule (line 18) add:

```css
/* day/night clock: top-left (the top-right corner belongs to the palette strip) */
#clock {
  position: fixed; top: 12px; left: 12px;
  padding: 5px 9px;
  background: rgba(10, 14, 22, .55); border-radius: 6px;
  color: #e8eef7;
  font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  text-shadow: 0 1px 2px #000;
  pointer-events: none;
}
```

- [ ] **Step 7: Verify — type-check, full suite, dev-server smoke**

Run: `npm run build`
Expected: passes (in particular: no remaining references to `BG_AIR`, and `syncWaterFx` no longer touches `scene.background`/`scene.fog`).

Run: `npm test`
Expected: all suites pass (124 tests total: 101 pre-existing + 23 new).

Run: `npm run dev`, open the printed URL, click the canvas to lock the pointer, and do a 60-second smoke check:
- The sky reads as a gradient (zenith → horizon), not a flat colour; the sun disc is visible in the sky.
- The top-left clock shows `Day 1 · 12:xx` and visibly ticks (a 4-minute day = 10 real seconds per in-game hour).
- Walking around shows the cloud layer high overhead; it does not pop or jitter as the camera crosses grid cells.
Expected: all four observed. If the sun/moon are misplaced or the horizon is banded wrong, re-check the dome texture row order before moving on.

- [ ] **Step 8: Commit**

```bash
git add src/main.ts index.html src/ui.css
git commit -m "feat: wire world time, sky, clouds into the loop; HUD clock; time-tinted water mood"
```

---

### Task 7: Documentation

**Files:**
- Modify: `PROJECT.md` (append new section 17)
- Modify: `TODO.md` (strike the resolved bullet; extend the lighting bullet)
- Modify: `README.md` (features, layout, test blurb)

- [ ] **Step 1: Add PROJECT.md §17**

Append to the end of `PROJECT.md` (after the §16 block, line 566):

```markdown
## 17. Sky — day/night, sun/moon, stars, clouds (post-POC, 2026-08-19)

Spec: `docs/superpowers/specs/2026-08-19-day-night-clouds-design.md`.

- `src/time.ts` — `WorldTime`, world-level state advanced in the **fixed 60 Hz
  physics substep** (never wall-clock): a lagging frame drops frames, it never
  stretches the day. `time` (total sim time) and `phaseTotal`→`dayPhase`
  ([0,1); 0 = noon, 0.5 = midnight) are stored counters of their own, so the
  daylight cycle can later be frozen/rescaled/set independently (the backlog
  item "align all simulation clocks on one tick system", TODO.md, also covers
  the water sim's slow clock). 240 s cycle; `day` increments at midnight.
- `src/sky.ts` — pure `sampleSky(phase)` (keyframe table in phase space,
  mirror-symmetric about midnight; sun/moon one angle `θ = 2π·phase` apart,
  180° out of phase) + `createSky` renderer: a camera-locked inverted-sphere
  sky dome (16×256 gradient canvas, redrawn only while the palette moves),
  ~400 fixed stars fading in after dusk, sun/moon sprite discs at r≈380
  (inside the 400 dome, all `fog: false`). `worldDim` 1.0 → 0.33 is applied
  per frame as `material.color` on the two shared chunk materials — one
  uniform update dims the whole world with zero remeshing. It is the
  documented stand-in until the dynamic-lighting item bakes per-block
  skylight into the vertex colour buffer.
- `src/clouds.ts` — instanced 4-block-cell quads at y = 96 in a 24×24 window
  anchored to the camera's 4-block grid cell; per-cell coverage is one
  2D-simplex sample (12-block wavelength, threshold 0.05), wind = a slow
  (~0.1 block/s) shift of the sample offset, re-evaluated only on
  re-anchoring. `fog: false`, tinted white → faint blue-grey by `worldDim`.
- The T12 air/water mood swap survives: it owns the FOV squeeze and which
  fog/background objects are active; the **values** they show are now
  time-driven, so night comes underwater too.
- HUD: `Day N · hh:mm` top-left (top-right is the palette strip's).
- Renderer note: everything added is O(1) per frame apart from rare mask
  rebuilds and the dusk/dawn gradient redraws; the §9 streaming budget is
  untouched.
```

- [ ] **Step 2: Update TODO.md**

In the `## Sky & lighting` section of `TODO.md`, replace the first bullet (the one beginning `- **Clouds and a sun/moon in the sky with a day/night cycle.**` and ending `can carry lights.`) with:

```markdown
- ~~Clouds and a sun/moon in the sky with a day/night cycle.~~ **Resolved
  (2026-08-19, branch `day-night-clouds`):** `src/time.ts` (a `WorldTime`
  advanced in the fixed substep), `src/sky.ts` (phase-keyframed sampler +
  dome/stars/sun-moon renderer + a global `worldDim`), `src/clouds.ts`
  (instanced 4-block-cell layer at y=96 with wind drift); the sky moods —
  including the underwater one — are time-driven. See
  `docs/superpowers/specs/2026-08-19-day-night-clouds-design.md`. `worldDim`
  is the stand-in that the next item replaces.
```

In that same section, replace the final line of the dynamic-lighting bullet (`Until this lands, torches are **visual only** — a bright tile, no glow.`) with:

```markdown
  Until this lands, torches are **visual only** — a bright tile, no glow.
  This item consumes `WorldTime` (src/time.ts) for time-of-day/sun position —
  and `sampleSky().sunDir` for the sun — and lands per-block skylight in the
  vertex colour buffer, replacing the global `worldDim`.
```

- [ ] **Step 3: Update README.md**

Three edits:

a) In `## Features`, after the `**Underwater mood**` bullet, add:

```markdown
- **Day/night cycle** — a world-time clock (noon start, 4-minute cycle) drives a gradient sky, a sun and moon crossing the sky, stars after dusk, a world that dims at night, and a slowly drifting cloud layer; a small HUD clock shows the time.
```

and in the existing `**Underwater mood**` bullet, replace `swaps background, fog, and FOV to sell the dive.` with `swaps background, fog, and FOV to sell the dive; its palette tracks time of day, so night underwater is darker.`.

b) In the `## Project layout` code block, after the line `  water.ts         water flow cellular automaton` add:

```
  time.ts          world-time clock (day/night phase, advanced in the fixed substep)
  sky.ts           sky sampler (phase → palette/sun/moon) + dome/stars/sprites renderer
  clouds.ts        cloud layer (world-locked noise coverage + wind drift)
```

c) In `## Tests`, replace `They cover the block registry, chunk mesher, player controller, voxel raycast, chunk streaming, terrain generator, UI, and both the water simulation and its chunk-load path` with `They cover the block registry, chunk mesher, player controller, voxel raycast, chunk streaming, terrain generator, world time, sky sampler, cloud coverage, UI, and both the water simulation and its chunk-load path`.

- [ ] **Step 4: Full verification and commit**

Run: `npm test && npm run build`
Expected: all tests pass; type-check + bundle succeed.

```bash
git add PROJECT.md TODO.md README.md
git commit -m "docs: PROJECT.md §17 sky; TODO.md resolutions; README features/layout/tests"
```

---

### Task 8: Final manual verification

**Files:** none (verification only; fix any gaps in the owning task's files and re-commit with `fix:` messages).

- [ ] **Step 1: Run the full checklist from the spec**

Run `npm run dev` and, over two full cycles (~8 minutes), verify:

1. **Full cycle**: noon → dusk band (warm horizon, dim falling) → night (indigo sky, stars, glowing moon, world at ~33%) → dawn → noon. No pop on any transition; sun and moon track the horizon correctly (sun sets +X, rises −X).
2. **Underwater at night**: the water mood is the time-tinted darker blue; surfacing continues the same sky state with no time jump.
3. **HUD clock** reads 12:00 at noon, 18:00 at sunset, 0:00 when the day counter increments (midnight), 06:00 at dawn.
4. **Clouds**: the layer spans the sky overhead, drifts slowly, and never pops or duplicates when the camera crosses a 4-block grid line or the window re-anchors.
5. **Night torches**: a placed torch's flame tile dims with the world and still reads as the brightest object nearby (real glow is the lighting project's scope).

- [ ] **Step 2: Frame-budget sanity (only if any transition looks hitchy)**

If a transition shows a hitch, recreate the PROJECT.md §9 probe (400-frame walk, per-phase ms logging) as a throwaway vitest replay — do not guess. Expected without it: zero frames >25 ms attributable to sky/cloud work (it is O(1) per frame; the only texture upload is the dusk/dawn gradient redraw).

- [ ] **Step 3: Report**

Report pass/fail per checklist item. If everything passes: the branch is ready for review — do **not** merge or push without explicit user approval.