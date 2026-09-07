import { describe, it, expect } from 'vitest';
import { LoopbackHub } from '../net/transport';
import { HostSession } from '../net/host';
import { ClientSession } from '../net/client';
import { HumanController } from '../entity';
import { Block } from '../blocks';

const welcome = (c: ClientSession) => new Promise<void>((res) => { c.on('welcome', () => res()); });

describe('Gate A — the multiplayer loopback (what must be true)', () => {
  it('join handshake + snapshot: the client world matches the host for the shared chunk', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const a = new ClientSession(hub.connect('c0'), 'c0', new HumanController(new Set()));
    const pa = welcome(a);
    for (let t = 0; t < 40; t++) { host.tick(t); a.tick(t); hub.pump(t); }
    await pa;
    expect(a.world.getChunk(0, 2, 2)).toBeTruthy();
    expect(a.world.getBlock(8, 34, 40)).toBe(host.world.getBlock(8, 34, 40));
  });

  it('a host cell edit echoes byte-identical to two clients (consistency)', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const a = new ClientSession(hub.connect('c0'), 'c0', new HumanController(new Set()));
    const b = new ClientSession(hub.connect('c1'), 'c1', new HumanController(new Set()));
    const pa = welcome(a); const pb = welcome(b);
    for (let t = 0; t < 40; t++) { host.tick(t); a.tick(t); b.tick(t); hub.pump(t); }
    await pa; await pb;
    host.world.setBlock(8, 34, 40, Block.Stone);
    for (let t = 40; t < 55; t++) { host.tick(t); a.tick(t); b.tick(t); hub.pump(t); }
    const hb = host.world.getBlock(8, 34, 40);
    expect(a.world.getBlock(8, 34, 40)).toBe(hb);
    expect(b.world.getBlock(8, 34, 40)).toBe(hb);
    const cA = a.world.getChunk(0, 2, 2)!;
    const cB = b.world.getChunk(0, 2, 2)!;
    for (let i = 0; i < cA.blocks.length; i++) expect(cA.blocks[i]).toBe(cB.blocks[i]);
  });

  it('union ring: a remote player far from the host keeps its chunks simulated on the host', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const a = new ClientSession(hub.connect('c0'), 'c0', new HumanController(new Set()));
    const pa = welcome(a);
    for (let t = 0; t < 40; t++) { host.tick(t); a.tick(t); hub.pump(t); }
    await pa;
    const e = host.sim.entities.get(a.entityId)!;
    e.pos = { x: 64, y: 34, z: 64 }; // teleport the remote's authoritative entity far
    for (let t = 40; t < 200; t++) { host.tick(t); a.tick(t); hub.pump(t); }
    const far = [...host.world.allChunks()].filter((c) => Math.abs(c.cx) > 3 || Math.abs(c.cz) > 3);
    expect(far.length).toBeGreaterThan(0); // remote-only chunks are sim-loaded on the host
  });

  it('leaving persists the pose and rejoin restores the same id', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const c1 = new ClientSession(hub.connect('n1'), 'alice', new HumanController(new Set()));
    const p1 = welcome(c1);
    for (let t = 0; t < 40; t++) { host.tick(t); c1.tick(t); hub.pump(t); }
    await p1;
    const id1 = c1.entityId;
    c1.disconnect();
    for (let t = 40; t < 45; t++) { host.tick(t); hub.pump(t); } // let the host persist the pose
    const c2 = new ClientSession(hub.connect('n2'), 'alice', new HumanController(new Set()));
    const p2 = welcome(c2);
    for (let t = 45; t < 85; t++) { host.tick(t); c2.tick(t); hub.pump(t); }
    await p2;
    expect(c2.entityId).toBe(id1); // same id restored from the persisted peer
  });
});