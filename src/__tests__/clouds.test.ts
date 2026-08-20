import { describe, it, expect } from 'vitest';
import { cloudCoverage, cloudTileLevel, windAt, CELL, TILE, CORE, RIM } from '../clouds';

describe('clouds (v2: world-locked tile + wind)', () => {
  it('coverage is deterministic and world-locked (shift the world or the sample)', () => {
    for (const [w0, w1, d] of [[12.5, 7, 7], [-40, 3.25, 3.25], [100, 3, 100], [5, 9, -17]]) {
      expect(cloudCoverage(w0 + d, w1 + d), `w=(${w0},${w1}) d=${d}`).toBe(
        cloudCoverage(w0, w1, d, d),
      );
    }
  });

  it('the tile is deterministic and yields all three alpha levels (full scan)', () => {
    expect(cloudTileLevel(3, 9)).toBe(cloudTileLevel(3, 9));
    const levels = new Set<number>();
    for (let j = 0; j < TILE; j++)
      for (let i = 0; i < TILE; i++) levels.add(cloudTileLevel(i, j));
    expect(levels.has(0)).toBe(true);
    expect(levels.has(1)).toBe(true);
    expect(levels.has(2)).toBe(true);
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
    const a = cloudCoverage(wx, wz, ax, az);
    const b = cloudCoverage(wx, wz, bx, bz);
    expect(a).not.toBe(b);
  });
});