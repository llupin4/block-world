import { describe, expect, it, vi } from 'vitest';
import { IdleController } from '../entity';
import { Persistence } from '../persistence';
import { TERRAIN_SEED } from '../terrain';
import { createLoopbackSession } from '../startup/loopback-session';

function options(mode: 'host' | 'client') {
  return {
    mode,
    bots: 2,
    delay: 0,
    seed: TERRAIN_SEED,
    controller: new IdleController(),
    persist: new Persistence(null, TERRAIN_SEED),
    hooks: {},
    lightEdit: vi.fn(),
    hostLeft: vi.fn(),
  };
}

describe('loopback startup', () => {
  it('returns the authoritative host and named bot clients', () => {
    const config = options('host');
    const runtime = createLoopbackSession(config);
    expect(runtime.session).toBe(runtime.host);
    expect(runtime.host.persist).toBe(config.persist);
    expect(runtime.clients).toHaveLength(2);
    expect([...runtime.hub.transports.keys()]).toEqual(['host', 'bot0', 'bot1']);
    expect(runtime.otherTransports).toEqual([]);
  });

  it('wires the local client last and only reports the headless host leaving', () => {
    const config = options('client');
    const runtime = createLoopbackSession(config);
    expect(runtime.session).toBe(runtime.clients[2]);
    expect(runtime.session).not.toBe(runtime.host);
    expect(runtime.clients[2].controller).toBe(config.controller);
    expect([...runtime.hub.transports.keys()]).toEqual(['headless', 'other0', 'other1', 'me']);
    runtime.otherTransports[0].transport.disconnect();
    expect(config.hostLeft).not.toHaveBeenCalled();
    runtime.hub.transports.get('headless')!.disconnect();
    expect(config.hostLeft).toHaveBeenCalledTimes(1);
  });
});
