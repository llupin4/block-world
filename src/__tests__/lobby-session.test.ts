import { describe, expect, it, vi } from 'vitest';
import { IdleController } from '../entity';
import { Persistence } from '../persistence';
import { TERRAIN_SEED } from '../terrain';
import { LoopbackHub } from '../net/transport';
import { createLobbySession, generateRoomCode } from '../startup/lobby-session';

describe('lobby startup', () => {
  it('wires an authoritative host and a local client over the supplied transport', () => {
    const hub = new LoopbackHub();
    const controller = new IdleController();
    const persist = new Persistence(null, TERRAIN_SEED);
    const hostLeft = vi.fn();
    const shared = {
      seed: TERRAIN_SEED,
      controller,
      persist,
      hooks: {},
      lightEdit: vi.fn(),
      hostLeft,
    };
    const host = createLobbySession({
      ...shared,
      isHost: true,
      name: 'Host',
      transport: hub.connect('host'),
    });
    const client = createLobbySession({
      ...shared,
      isHost: false,
      name: 'Guest',
      transport: hub.connect('guest'),
    });
    hub.pump(0);
    expect(host.host).toBe(host.session);
    expect(host.clients).toEqual([]);
    expect(host.session.persist).toBe(persist);
    expect(host.session.sim.viewed()?.controller).toBe(controller);
    expect(host.session.sim.viewed()?.name).toBe('Host');
    expect(client.host).toBeNull();
    expect(client.clients).toEqual([client.session]);
    expect(client.clients[0].controller).toBe(controller);
    expect(client.clients[0].hostId).toBe('host');
    hub.connect('unrelated').disconnect();
    expect(hostLeft).not.toHaveBeenCalled();
    hub.transports.get('host')!.disconnect();
    expect(hostLeft).toHaveBeenCalledWith(client.session);
  });

  it('generates six-character room codes from the unambiguous alphabet', () => {
    expect(generateRoomCode(() => 0)).toBe('aaaaaa');
    expect(generateRoomCode(() => 0.999)).toBe('999999');
    expect(generateRoomCode()).toMatch(/^[a-kmnp-z2-9]{6}$/);
  });
});
