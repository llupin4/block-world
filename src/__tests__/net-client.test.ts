import { describe, it, expect } from 'vitest';
import { LoopbackHub } from '../net/transport';
import { HostSession } from '../net/host';
import { ClientSession } from '../net/client';
import { HumanController } from '../entity';
import { Block } from '../blocks';

describe('ClientSession', () => {
  it('joins (welcome) and its world matches the host\'s for a shared chunk after sync', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = new ClientSession(hub.connect('client'), 'me', new HumanController(new Set()));
    const welcomed = new Promise<void>((res) => { client.on('welcome', () => res()); });
    for (let t = 0; t < 40; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    await welcomed;
    // the client generated its own ring; the host's spawn-chunk terrain is present on both
    const hostBlock = host.world.getBlock(8, 34, 40);
    const clientBlock = client.world.getBlock(8, 34, 40);
    expect(clientBlock).toBe(hostBlock); // pristine terrain is identical (shared seed)
  });

  it('a host cell write (cells) is applied to the client world', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = new ClientSession(hub.connect('client'), 'me', new HumanController(new Set()));
    for (let t = 0; t < 40; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    // host edits a cell in the shared chunk
    host.world.setBlock(8, 34, 40, Block.Stone);
    for (let t = 40; t < 50; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    expect(client.world.getBlock(8, 34, 40)).toBe(Block.Stone); // the cells write landed
  });
});