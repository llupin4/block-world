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

  it('cloudMask rejects anchors that are not CELL multiples (seam guard)', () => {
    expect(() => cloudMask(2, 0, 0, 0)).toThrow();
    expect(() => cloudMask(0, -2, 0, 0)).toThrow();
    expect(() => cloudMask(-4, 8, 0, 0)).not.toThrow();
    expect(() => cloudMask(8, -4, 0, 0)).not.toThrow();
  });

  it('re-anchoring: the whole shared overlap agrees, not just one column', () => {
    const a = cloudMask(-4, 0, 7.3, 2.1);
    const b = cloudMask(0, 0, 7.3, 2.1);
    for (let j = 0; j < WINDOW; j++)
      for (let i = 1; i < WINDOW; i++)
        expect(a[j * WINDOW + i], `shared col ${i}, row ${j}`).toBe(b[j * WINDOW + i - 1]);
  });

  it('coverage is world-locked at the continuous value (not just the mask bit)', () => {
    const shared = -4 + 23 * CELL; // 88: world cell shared by both windows below
    const wz = 5 * CELL;
    expect(cloudCoverage(shared, wz, 7.3, 2.1)).toBe(cloudCoverage(22 * CELL, wz, 7.3, 2.1));
  });

  it('drift via the windAt seam changes the mask (the interface main.ts will call)', () => {
    const [wx0, wz0] = windAt(0);
    const [wx1, wz1] = windAt(2000);
    const a = cloudMask(0, 0, wx0, wz0);
    const b = cloudMask(0, 0, wx1, wz1);
    expect(a.some((v, i) => v !== b[i])).toBe(true);
  });
});