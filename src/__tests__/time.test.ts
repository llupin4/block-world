import { describe, it, expect } from 'vitest';
import { WorldTime, formatClock, DAY_LENGTH, tickCrossed } from '../time';

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

describe('tick — the canonical heartbeat (ADR 0011)', () => {
  it('starts at 0 and counts advances 1:1, independent of dt magnitude', () => {
    const t = new WorldTime();
    expect(t.tick).toBe(0);
    t.advance(1 / 60);
    expect(t.tick).toBe(1);
    t.advance(5); // a giant dt is still one substep: tick counts advances, not time
    expect(t.tick).toBe(2);
    t.advance(1 / 60);
    expect(t.tick).toBe(3);
  });

  it('is deterministic: identical dt sequences give identical tick sequences', () => {
    const a = new WorldTime();
    const b = new WorldTime();
    for (const dt of [1 / 60, 1 / 60, 0.02, 1 / 60, 0.1, 5]) {
      a.advance(dt);
      b.advance(dt);
    }
    expect(a.tick).toBe(b.tick);
    expect(a.tick).toBe(6);
  });
});

describe('tickCrossed — the frame-end water-pulse rule (ADR 0011)', () => {
  it('reports a multiple-of-stride crossing inside (prev, now]', () => {
    expect(tickCrossed(29, 29, 30)).toBe(false); // no ticks ran
    expect(tickCrossed(29, 30, 30)).toBe(true); // exact boundary
    expect(tickCrossed(29, 34, 30)).toBe(true); // boundary crossed mid-range — the case a bare `tick % 30` at frame end misses
    expect(tickCrossed(30, 30, 30)).toBe(false); // already past the boundary
    expect(tickCrossed(30, 31, 30)).toBe(false); // prev is a multiple: the frame just after a pulse frame must not re-pulse (double-pulse guard)
    expect(tickCrossed(31, 35, 30)).toBe(false); // no multiple in (31, 35]
    expect(tickCrossed(29, 95, 30)).toBe(true); // multiple crossings still report one boolean (the ≤6-ticks/frame cap makes this unreachable in practice)
  });
});
