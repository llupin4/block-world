import { it, expect } from 'vitest';
import { ViewRadiusGovernor, targetChunks, MIN_RADIUS, MAX_RADIUS } from '../view-radius';

/** Feed `n` frames of `workMs` (all `ringFull`) and return the final radius. */
function feed(g: ViewRadiusGovernor, n: number, workMs: number, ringFull = true): number {
  let r = g.radius;
  for (let i = 0; i < n; i++) r = g.noteFrame(workMs, ringFull);
  return r;
}

it('starts at the minimum radius', () => {
  expect(new ViewRadiusGovernor().radius).toBe(2);
});

it('targetChunks is (2r+1)^2 x 5', () => {
  expect(targetChunks(2)).toBe(125);
  expect(targetChunks(3)).toBe(245);
  expect(targetChunks(4)).toBe(405);
});

it('grows 2 -> 3 -> 4 under sustained headroom', () => {
  const g = new ViewRadiusGovernor();
  expect(feed(g, 200, 5)).toBe(4); // light frames, ring full -> settle at the max
});

it('clamps at the maximum radius', () => {
  const g = new ViewRadiusGovernor();
  expect(feed(g, 1000, 1)).toBe(MAX_RADIUS); // never above 4
});

it('shrinks 4 -> 3 -> 2 under sustained load', () => {
  const g = new ViewRadiusGovernor();
  feed(g, 200, 5); // to 4
  expect(feed(g, 200, 20)).toBe(2); // heavy frames, ring full -> fall back to the min
});

it('clamps at the minimum radius', () => {
  const g = new ViewRadiusGovernor();
  feed(g, 200, 5); // to 4
  feed(g, 200, 20); // to 2
  expect(feed(g, 200, 20)).toBe(MIN_RADIUS); // never below 2
});

it('holds while the ring is not full (the anti-oscillation gate)', () => {
  const g = new ViewRadiusGovernor();
  expect(feed(g, 200, 5, false)).toBe(2); // light but ring not full -> no growth
});

it('the cooldown paces changes: no second change within 60 frames', () => {
  const g = new ViewRadiusGovernor();
  g.noteFrame(5, true); // -> 3, cooldown 60
  expect(g.radius).toBe(3);
  expect(feed(g, 60, 5)).toBe(3); // 60 more frames: cooldown expires, still 3
  expect(g.noteFrame(5, true)).toBe(4); // next frame: cooldown cleared, grows again
});

it('moves at most one step per frame', () => {
  const g = new ViewRadiusGovernor();
  expect(g.noteFrame(1, true)).toBe(3); // a single light frame: 2 -> 3, not 2 -> 4
});

it('a heavy frame during the cooldown does not reverse the change', () => {
  const g = new ViewRadiusGovernor();
  g.noteFrame(5, true); // -> 3, cooldown 60
  expect(g.noteFrame(50, true)).toBe(3); // a spike while cooling: absorbed, stays 3
});
