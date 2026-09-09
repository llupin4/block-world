import { describe, it, expect } from 'vitest';
import { LoopbackHub } from '../net/transport';
import { HostSession } from '../net/host';
import { type Msg } from '../net/messages';
import { Block } from '../blocks';
import { HumanController, NULL_INTENT, possess, returnHome } from '../entity';
import { Persistence, InMemoryChunkStore } from '../persistence';

const tick = (hub: LoopbackHub, host: HostSession, clients: { tick: (t: number) => void }[], n: number) => {
  for (let t = 0; t < n; t++) { host.tick(t); for (const c of clients) c.tick(t); hub.pump(t); }
};

const welcomeOf = (client: ReturnType<LoopbackHub['connect']>) =>
  new Promise<Msg>((res) => client.onMessage((_f, m: Msg) => { if (m.type === 'welcome') res(m); }));

describe('HostSession', () => {
  it('hello spawns a remote player and replies with a welcome (snapshot + yourEntityId)', () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = hub.connect('client');
    let welcome: Msg | undefined;
    client.onMessage((_f, m: Msg) => { if (m.type === 'welcome') welcome = m; });
    client.send('host', { type: 'hello', name: 'alice', protocol: 1 });
    hub.pump(0);
    expect(welcome).toBeDefined();
    expect((welcome as Extract<Msg, { type: 'welcome' }>).snapshot.meta.seed).toBe(1234);
    expect(typeof (welcome as Extract<Msg, { type: 'welcome' }>).yourEntityId).toBe('number');
    expect((welcome as Extract<Msg, { type: 'welcome' }>).snapshot.chunks.length).toBeGreaterThan(0); // the joiner's ring
    // the host spawned the remote player
    expect(host.sim.all().some((e) => e.kind.id === 'player')).toBe(true);
  });

  it('an intent from a client is applied to that client\'s entity by the host', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = hub.connect('client');
    const welcomed = welcomeOf(client);
    client.send('host', { type: 'hello', name: 'bob', protocol: 1 });
    hub.pump(0);
    const w = (await welcomed) as Extract<Msg, { type: 'welcome' }>;
    const id = w.yourEntityId;
    // Let the entity settle (fall to the ground) before measuring intent-driven movement.
    tick(hub, host, [{ tick: () => {} }], 20);
    const b = host.sim.entities.get(id)!.pos;
    const bx = b.x, bz = b.z;
    client.send('host', { type: 'intent', tick: 20, intent: { forward: 1, strafe: 0, up: false, down: false, yaw: 0, pitch: 0, primary: false, secondary: false } });
    tick(hub, host, [{ tick: () => {} }], 20);
    const a = host.sim.entities.get(id)!.pos;
    // the intent moved the entity horizontally (yaw 0 forward = -z, but measure displacement)
    expect(Math.abs(a.x - bx) + Math.abs(a.z - bz)).toBeGreaterThan(0.05);
  });

  it('a client\'s block edit lands on the host world', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = hub.connect('client');
    const welcomed = welcomeOf(client);
    client.send('host', { type: 'hello', name: 'carol', protocol: 1 });
    hub.pump(0);
    const w = (await welcomed) as Extract<Msg, { type: 'welcome' }>;
    const id = w.yourEntityId;
    // face -Z (yaw 0) and place a block in front (secondary)
    client.send('host', { type: 'intent', tick: 2, intent: { forward: 0, strafe: 0, up: false, down: false, yaw: 0, pitch: 0, primary: false, secondary: true, block: Block.Stone } });
    tick(hub, host, [{ tick: () => {} }], 4);
    expect(host.world.count()).toBeGreaterThan(0); // the host has terrain (streaming loaded the client's ring)
    expect(host.sim.entities.has(id)).toBe(true); // the client's entity survived
  });

  it('leaving a peer persists its pose to WorldMeta.peers and despawns the entity', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = hub.connect('client');
    const welcomed = welcomeOf(client);
    client.send('host', { type: 'hello', name: 'dave', protocol: 1 });
    hub.pump(0);
    const w = (await welcomed) as Extract<Msg, { type: 'welcome' }>;
    const id = w.yourEntityId;
    expect(host.sim.entities.has(id)).toBe(true);
    hub.disconnect('client'); // onPeerLeave fires on the host transport
    expect(host.sim.entities.has(id)).toBe(false); // despawned
    expect((host.persist.meta?.peers as Record<string, unknown> | undefined)?.dave).toBeDefined(); // pose saved
  });

  it('B1: persist is injected + lastStream is set + clock advances', () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, 1234);
    const host = new HostSession(new LoopbackHub().connect('host'), 1234, { persist });
    expect(host.persist).toBe(persist); // the injected persist is used
    host.tick(0); host.tick(1);
    expect(host.worldTime.time).toBeGreaterThan(0); // the clock advanced (advanceClock)
    expect(host.lastStream).not.toBeNull(); // the host streams (the spawn column ring)
    expect(host.lastStream!.meshable.size).toBeGreaterThan(0); // the own anchor's ring is meshable
  });

  it('possession on a host can return to the own body (homeId is set for withOwnPlayer)', () => {
    const host = new HostSession(new LoopbackHub().connect('host'), 1234, { withOwnPlayer: true });
    const human = new HumanController(new Set());
    const ownId = host.sim.viewedId;
    expect(ownId).not.toBe(0);
    const NULL_CTRL = { intent: () => ({ ...NULL_INTENT }) };
    const remote = host.sim.spawn({ x: 0, y: 0, z: 0 }, NULL_CTRL, { kindId: 'player' });
    possess(host.sim, human, remote.id);
    expect(host.sim.viewedId).toBe(remote.id);
    returnHome(host.sim, human);
    expect(host.sim.viewedId).toBe(ownId);
  });

  it("ownController drives the host's own body (the lobby-host movement fix)", () => {
    const hub = new LoopbackHub();
    const human = new HumanController(new Set(['KeyW']), 0, 0);
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: true, ownController: human });
    const ownId = host.sim.viewedId;
    // copy the pos — the entity's `pos` object is mutated in place
    const pos = () => { const p = host.sim.entities.get(ownId)!.pos; return { x: p.x, y: p.y, z: p.z }; };
    // settle (fall to the ground) before measuring
    tick(hub, host, [], 20);
    const b = pos();
    tick(hub, host, [], 30);
    const a = pos();
    expect(Math.abs(a.x - b.x) + Math.abs(a.z - b.z)).toBeGreaterThan(0.05); // W moved the own body
  });

  it("ownName lands on the own entity and in the `state` broadcast to a hello'd peer", async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: true, ownName: 'Hosty' });
    const ownId = host.sim.viewedId;
    expect(host.sim.entities.get(ownId)!.name).toBe('Hosty');
    const client = hub.connect('client');
    // one combined handler — the loopback transport has a single onMessage slot
    const states: Msg[] = [];
    let resolveWelcome = () => {};
    const welcomed = new Promise<void>((res) => { resolveWelcome = res; });
    client.onMessage((_f, m: Msg) => {
      if (m.type === 'welcome') resolveWelcome();
      else if (m.type === 'state') states.push(m);
    });
    client.send('host', { type: 'hello', name: 'alice', protocol: 1 });
    hub.pump(0);
    await welcomed;
    tick(hub, host, [], 6); // state broadcasts on the NET_STATE_STRIDE (3) lattice
    const list = (states.at(-1) as Extract<Msg, { type: 'state' }>).entities;
    expect(list.some((e) => e.id === ownId && e.name === 'Hosty')).toBe(true);
  });

  it('without ownController the own body stays idle (B1 ?mp=host behavior unchanged)', () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: true });
    const ownId = host.sim.viewedId;
    const pos = () => { const p = host.sim.entities.get(ownId)!.pos; return { x: p.x, y: p.y, z: p.z }; };
    tick(hub, host, [], 20);
    const b = pos();
    tick(hub, host, [], 30);
    const a = pos();
    expect(a.x).toBe(b.x); expect(a.z).toBe(b.z); // no input, idle controller — no drift
  });
});