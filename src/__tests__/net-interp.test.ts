import { describe, it, expect } from 'vitest';
import { interpose, PoseRing, lerpAngle, INTERP_RING } from '../net/interp';
import type { PoseSample } from '../net/interp';

const s = (tick: number, x: number, yaw = 0): PoseSample => ({ tick, x, y: 0, z: 0, yaw, pitch: 0 });

describe('net-interp (B1 pure math)', () => {
  it('lerps between the bracketing pair at renderTick (gap <= stride)', () => {
    // gap 3 (== NET_STATE_STRIDE) is a valid bracketing pair; renderTick 1.5 is halfway.
    const p = interpose([s(0, 0), s(3, 3)], 1.5);
    expect(p.x).toBeCloseTo(1.5);
  });
  it('holds the first when renderTick is before the first sample', () => {
    expect(interpose([s(0, 0), s(3, 3)], -5).x).toBe(0);
    expect(interpose([s(0, 0), s(3, 3)], 0).x).toBe(0);
  });
  it('holds the last when renderTick is at/after the last sample', () => {
    expect(interpose([s(0, 0), s(3, 3)], 3).x).toBe(3);
    expect(interpose([s(0, 0), s(3, 3)], 20).x).toBe(3);
  });
  it('holds the pose before renderTick on a jitter gap (no valid bracketing pair)', () => {
    // samples at tick 0 and 20 (a 20-tick gap > NET_STATE_STRIDE); renderTick 10 is in the gap
    // → no valid bracketing pair → hold the pose before renderTick (tick 0).
    const p = interpose([s(0, 1), s(20, 99)], 10);
    expect(p.x).toBe(1);
  });
  it('yaw lerps by shortest arc across the ±π seam', () => {
    // 350° → 10° (in radians): the short way is through 0° (360°), not through 180°.
    const a = (350 * Math.PI) / 180, b = (10 * Math.PI) / 180;
    const mid = lerpAngle(a, b, 0.5);
    expect(mid).toBeCloseTo(0); // halfway is ~0° (through the seam), not ~180°
  });
  it('a 6-tick render delay lands between the two expected samples', () => {
    // The host broadcasts every NET_STATE_STRIDE=3 ticks; the render reads 6 behind. With
    // samples at 0..30 (stride 3) and renderTick 24, the bracketing pair is (21, 24).
    const samples: PoseSample[] = [];
    for (let t = 0; t <= 30; t += 3) samples.push(s(t, t));
    const p = interpose(samples, 24);
    expect(p.x).toBeCloseTo(24);
  });
  it('PoseRing evicts the oldest beyond its size', () => {
    const r = new PoseRing(4);
    for (let t = 0; t < 8; t++) r.push(s(t, t));
    expect(r.samples.length).toBe(4);
    expect(r.samples[0]!.tick).toBe(4); // the oldest (0..3) evicted
  });
  it('INTERP_RING is 8', () => { expect(INTERP_RING).toBe(8); });
});