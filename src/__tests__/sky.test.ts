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