import { describe, it, expect } from 'vitest';
import { LoopbackHub } from '../net/transport';
import { HostSession } from '../net/host';
import { ClientSession } from '../net/client';
import { HumanController } from '../entity';
import { Block } from '../blocks';

const welcome = (c: ClientSession) => new Promise<void>((res) => { c.on('welcome', () => res()); });
const DELAY = 30; // the host→client link delay (ticks) for the reconciliation test
const TOL = 1e-6; // prediction vs host (an unchanged, in-sync world matches to float noise)

// The client's own-body pose (its predicted + reconciled pose = the sim's viewed entity).
const own = (c: ClientSession) => c.sim.entities.get(c.entityId)!.pos;
// The host's authoritative pose for the client's entity.
const hostP = (host: HostSession, c: ClientSession) => host.sim.entities.get(c.entityId)!.pos;

describe('Gate C — own-body prediction + reconciliation', () => {
  it('unchanged world, in-sync: the client predicts its own body to the host pose (no delay)', async () => {
    // No link delay: the client's world stays in sync with the host's (terrain + water), so the
    // local prediction (stepEntity on the own entity) reproduces the host's authoritative pose.
    const hub = new LoopbackHub(); // zero delay
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const a = new ClientSession(hub.connect('c0'), 'c0', new HumanController(new Set(['KeyW']))); // walk
    const pa = welcome(a);
    for (let t = 0; t < 40; t++) { host.tick(t); a.tick(t); hub.pump(t); }
    await pa;
    for (let t = 40; t < 200; t++) { host.tick(t); a.tick(t); hub.pump(t); }
    const hp = hostP(host, a), cp = own(a);
    expect(Math.abs(cp.x - hp.x)).toBeLessThan(TOL);
    expect(Math.abs(cp.y - hp.y)).toBeLessThan(TOL);
    expect(Math.abs(cp.z - hp.z)).toBeLessThan(TOL);
  });

  it('host disagrees (a block in the path), delayed link: the prediction diverges, then reconciliation corrects within K ticks', async () => {
    const hub = new LoopbackHub({ delay: (from, to) => (from === 'host' && to === 'c0') ? DELAY : 0 });
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const a = new ClientSession(hub.connect('c0'), 'c0', new HumanController(new Set(['KeyW']))); // walk forward (-Z)
    const pa = welcome(a);
    for (let t = 0; t < 40; t++) { host.tick(t); a.tick(t); hub.pump(t); }
    await pa;
    for (let t = 40; t < 80; t++) { host.tick(t); a.tick(t); hub.pump(t); } // let the client walk forward
    // The host places a wall AHEAD of the client (1 block in -Z) — the client's world lacks it for
    // the delay window, so its prediction runs through where the wall is (diverges).
    const ep = host.sim.entities.get(a.entityId)!;
    const bz = Math.floor(ep.pos.z) - 1;
    const bx = Math.floor(ep.pos.x);
    for (let x = bx - 1; x <= bx + 1; x++)
      for (let y = Math.floor(ep.pos.y) - 1; y <= Math.floor(ep.pos.y) + 2; y++)
        host.world.setBlock(x, y, bz, Block.Stone);
    // Run past the delay + a few state strides. Track that the prediction diverged, then that the
    // client's pose corrects toward the host's (reconciled) within K ticks.
    const K = DELAY + 3 * 3 + 40;
    let diverged = false; let minGap = Infinity;
    for (let i = 1; i <= K; i++) {
      const t = 80 + i;
      host.tick(t); a.tick(t); hub.pump(t);
      const hp = hostP(host, a), cp = own(a);
      const gap = Math.hypot(cp.x - hp.x, cp.y - hp.y, cp.z - hp.z);
      if (gap > 0.3) diverged = true; // the client ran through the (not-yet-arrived) wall
      minGap = Math.min(minGap, gap);
    }
    expect(diverged).toBe(true); // the prediction genuinely diverged from the host
    // the reconciliation pulled the client's pose back close to the host's (it does not run away).
    expect(minGap).toBeLessThan(0.6);
  });
});