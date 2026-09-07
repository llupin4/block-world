import { describe, it, expect } from 'vitest';
import { LoopbackHub, type Transport } from '../net/transport';
import { type Msg } from '../net/messages';

const m = (x: number): Msg => ({ type: 'time', tick: x, worldTime: x });

describe('LoopbackHub — reliable, ordered, pump-driven', () => {
  it('delivers in send order with zero delay (same-tick pump)', () => {
    const hub = new LoopbackHub();
    const a = hub.connect('a'); const b = hub.connect('b');
    const got: number[] = [];
    b.onMessage((_from, msg) => { if (msg.type === 'time') got.push(msg.tick); });
    a.send('b', m(1)); a.send('b', m(2)); a.send('b', m(3));
    hub.pump(0);
    expect(got).toEqual([1, 2, 3]);
  });

  it('broadcasts to every other peer', () => {
    const hub = new LoopbackHub();
    const a = hub.connect('a'); const b = hub.connect('b'); const c = hub.connect('c');
    let nb = 0, nc = 0;
    b.onMessage(() => { nb++; }); c.onMessage(() => { nc++; });
    a.send('all', m(0));
    hub.pump(0);
    expect(nb).toBe(1); expect(nc).toBe(1);
  });

  it('a per-link delay defers delivery by that many ticks (reorder-free)', () => {
    const hub = new LoopbackHub({ delay: (from, to) => (from === 'a' && to === 'b' ? 2 : 0) });
    const a = hub.connect('a'); const b = hub.connect('b');
    const got: number[] = [];
    b.onMessage((_f, msg) => { if (msg.type === 'time') got.push(msg.tick); });
    a.send('b', m(1));
    hub.pump(0); expect(got).toEqual([]);   // at = 0 + 2 = 2, not due
    hub.pump(1); expect(got).toEqual([]);
    hub.pump(2); expect(got).toEqual([1]);  // due at tick 2
  });

  it('jitter is reorder-free: a later message with a smaller delay never overtakes', () => {
    const hub = new LoopbackHub({ jitterTicks: 3, seed: 1234 });
    const a = hub.connect('a'); const b = hub.connect('b');
    const got: number[] = [];
    b.onMessage((_f, msg) => { if (msg.type === 'time') got.push(msg.tick); });
    const sent: number[] = [];
    for (let i = 0; i < 50; i++) { a.send('b', m(i)); sent.push(i); }
    for (let t = 0; t < 400 && got.length < sent.length; t++) hub.pump(t);
    expect(got).toEqual(sent); // delivery order == send order regardless of jitter
  });

  it('fires onPeerJoin/onPeerLeave and updates peers()', () => {
    const hub = new LoopbackHub();
    const a = hub.connect('a');
    const joined: string[] = []; const left: string[] = [];
    a.onPeerJoin((id) => joined.push(id)); a.onPeerLeave((id) => left.push(id));
    hub.connect('b');
    expect(a.peers()).toEqual(['b']);
    expect(joined).toEqual(['b']);
    hub.disconnect('b');
    expect(a.peers()).toEqual([]);
    expect(left).toEqual(['b']);
  });

  it('counts sent messages and bytes for the stress rig', () => {
    const hub = new LoopbackHub();
    const a = hub.connect('a'); const b = hub.connect('b');
    a.send('b', m(9999));
    hub.pump(0);
    expect(hub.sentCount).toBe(1);
    expect(hub.sentBytes).toBeGreaterThan(0);
  });
});