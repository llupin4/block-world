import { describe, it, expect } from 'vitest';
import { cloudCoverage, cloudTileLevel, cloudTexOffset, windAt, CELL, TILE, CORE, RIM, QUAD } from '../clouds';

describe('clouds (v3: world-locked scrolling sheet, player-centered)', () => {
  it('coverage is deterministic and world-locked (shift the world or the sample)', () => {
    for (const [w0, w1, d] of [[12.5, 7, 7], [-40, 3.25, 3.25], [100, 3, 100], [5, 9, -17]]) {
      expect(cloudCoverage(w0 + d, w1 + d), `w=(${w0},${w1}) d=${d}`).toBe(
        cloudCoverage(w0, w1, d, d),
      );
    }
  });

  it('the tile is a fixed fixture (whole-tile FNV-1a hash) with all three levels', () => {
    const levels: number[] = [];
    for (let j = 0; j < TILE; j++)
      for (let i = 0; i < TILE; i++) levels.push(cloudTileLevel(i, j));
    const seen = new Set(levels);
    expect(seen.has(0)).toBe(true);
    expect(seen.has(1)).toBe(true);
    expect(seen.has(2)).toBe(true);
    let h = 0x811c9dc5;
    for (const l of levels) {
      h ^= l;
      h = Math.imul(h, 0x01000193);
    }
    expect(h >>> 0).toBe(3672114685);
  });

  it('tile levels agree with the coverage thresholds at zero wind', () => {
    let sampled = 0;
    for (let j = 0; j < TILE; j += 7)
      for (let i = 0; i < TILE; i += 5) {
        const c = cloudCoverage(i * CELL, j * CELL);
        const l = cloudTileLevel(i, j);
        expect(l, `texel ${i},${j}`).toBe(c > CORE ? 2 : c > RIM ? 1 : 0);
        sampled++;
      }
    expect(sampled).toBeGreaterThan(400);
  });

  it('tex offset keeps the pattern world-locked: camera terms cancel for a fixed world point', () => {
    // Mirrors the GPU sample term (in tiles): a fixed world point's sampled
    // cell must not depend on where the camera (hence the sheet) is.
    const s = (wX: number, camX: number, t: number): number => {
      const [u] = cloudTexOffset(camX, 0, t);
      return (wX - camX + QUAD / 2) / (TILE * CELL) + 4 * u;
    };
    for (const t of [0, 91, 1400.5]) {
      expect(s(33, 7, t)).toBeCloseTo(s(33, 519, t), 12);
      expect(s(33, 519, t)).toBeCloseTo(s(33, 1530, t), 12);
    }
  });

  it('tex offset advances exactly with the wind (cam + wind decomposition)', () => {
    const [u1] = cloudTexOffset(123, 7, 5);
    const [u2] = cloudTexOffset(123, 7, 105);
    expect(u2 - u1).toBeCloseTo((windAt(105)[0] - windAt(5)[0]) / QUAD, 12);
    const [, v1] = cloudTexOffset(123, 7, 5);
    const [, v2] = cloudTexOffset(123, 7, 105);
    expect(v2 - v1).toBeCloseTo((windAt(105)[1] - windAt(5)[1]) / QUAD, 12);
  });

  it('windAt is monotonic on both axes', () => {
    const [wx0, wz0] = windAt(0);
    const [wx1, wz1] = windAt(10);
    expect(wx1).toBeGreaterThan(wx0);
    expect(wz1).toBeGreaterThan(wz0);
  });

  it('wind drift moves the field a fixed world point samples', () => {
    const [ax, az] = windAt(0);
    const [bx, bz] = windAt(2000);
    const wx = 33, wz = 57;
    expect(cloudCoverage(wx, wz, ax, az)).not.toBe(cloudCoverage(wx, wz, bx, bz));
  });
});