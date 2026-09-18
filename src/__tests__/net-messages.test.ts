import { describe, it, expect } from 'vitest';
import { WorldTime } from '../time';
import { PROTOCOL_VERSION, encodeMsg, decodeMsg } from '../net/messages';
import type { WorldTimeSnapshot, Msg } from '../net/messages';

describe('world-time wire format (B1)', () => {
  it('advanceClock advances time+phaseTotal, not tick', () => {
    const w = new WorldTime();
    w.advanceClock(240); // one full day (240 s)
    expect(w.tick).toBe(0);
    expect(w.time).toBeCloseTo(240);
    expect(w.dayPhase).toBeCloseTo(0);
    expect(w.day).toBe(2);
  });
  it('slew sets time+phaseTotal, keeps tick', () => {
    const w = new WorldTime();
    w.tick = 60; // the client's tick (the frame loop owns it)
    const s: WorldTimeSnapshot = { time: 999, tick: 5000, phaseTotal: 0.25 };
    w.slew(s);
    expect(w.tick).toBe(60); // kept (the frame loop owns the tick)
    expect(w.time).toBe(999);
    expect(w.dayPhase).toBeCloseTo(0.25);
  });
  it('PROTOCOL_VERSION is 2 (the radius message was added)', () => { expect(PROTOCOL_VERSION).toBe(2); });
  it('encode/decode round-trips a radius message', () => {
    const msg: Msg = { type: 'radius', radius: 4 };
    expect(decodeMsg(encodeMsg(msg))).toEqual({ type: 'radius', radius: 4 });
  });
});