import { describe, expect, it, vi } from 'vitest';
import { Block } from '../blocks';
import { IdleController, Sim } from '../entity';
import { MultiplayerProbe } from '../diagnostics/multiplayer-probe';
import { World } from '../world';

function setup() {
  const world = new World();
  world.ensureChunk(0, 2, 0);
  const sim = new Sim(world, {}, 1);
  sim.viewedId = sim.spawn({ x: 1.26, y: 2, z: 3 }, new IdleController()).id;
  const remote = sim.spawn({ x: 4, y: 2, z: 3 }, new IdleController());
  remote.name = 'peer';
  const frame = {
    mode: 'host' as 'host' | 'client' | null,
    tick: 0,
    sim,
    world,
    rigCount: 2,
    meshedChunks: 5,
    otherTransports: [
      { transport: { disconnect: vi.fn() } },
      { transport: { disconnect: vi.fn() } },
    ],
  };
  return { frame, remote };
}

describe('MultiplayerProbe', () => {
  it('tracks first positions and emits the established host report at tick 300', () => {
    const { frame, remote } = setup();
    const probe = new MultiplayerProbe('host', 2);
    expect(probe.update(frame, false)).toBeNull();
    remote.pos.x += 0.4;
    frame.tick = 302;
    expect(probe.update(frame, false)).toEqual({
      mode: 'host',
      tick: 302,
      bots: 2,
      rigCount: 2,
      hostMeshedChunks: 5,
      remotePlayers: [{ id: remote.id, x: 4.4, y: 2, z: 3, name: 'peer', moved: true }],
      editReflected: true,
    });
    expect(frame.world.getBlock(10, 40, 10)).toBe(Block.Planks);
    frame.world.setBlock(10, 40, 10, Block.Stone);
    expect(probe.update(frame, true)).toBeNull();
    expect(frame.world.getBlock(10, 40, 10)).toBe(Block.Stone);
  });

  it('disconnects the second loopback peer only once, even when ticks skip 250', () => {
    const { frame } = setup();
    frame.mode = 'client';
    const probe = new MultiplayerProbe('client', 2);
    frame.tick = 249;
    probe.update(frame, false);
    expect(frame.otherTransports[1].transport.disconnect).not.toHaveBeenCalled();
    frame.tick = 253;
    probe.update(frame, false);
    frame.tick = 299;
    probe.update(frame, false);
    expect(frame.otherTransports[1].transport.disconnect).toHaveBeenCalledTimes(1);
    expect(frame.otherTransports[0].transport.disconnect).not.toHaveBeenCalled();
  });

  it('reports rounded client positions and checks the disconnected rig count', () => {
    const { frame, remote } = setup();
    frame.mode = 'client';
    frame.tick = 300;
    const probe = new MultiplayerProbe('client', 2);
    expect(probe.update(frame, false)).toEqual({
      mode: 'client',
      tick: 300,
      bots: 2,
      rigCount: 2,
      otherPlayers: [{ id: remote.id, x: 4, y: 2, z: 3, name: 'peer' }],
      camera: { x: 1.3, y: 2, z: 3 },
      clientMeshedChunks: 5,
      headlessHostMeshedChunks: 0,
      leaveRigRemoved: true,
    });
    frame.rigCount = 3;
    expect(probe.update(frame, false)).toMatchObject({ leaveRigRemoved: false });
  });

  it('reports lobby sessions without loopback disconnects and skips single-player', () => {
    const { frame } = setup();
    const probe = new MultiplayerProbe(null, 0);
    frame.tick = 300;
    frame.mode = null;
    expect(probe.update(frame, false)).toBeNull();
    frame.mode = 'client';
    expect(probe.update(frame, false)).toMatchObject({ mode: 'client', bots: 0 });
    expect(frame.otherTransports[1].transport.disconnect).not.toHaveBeenCalled();
  });
});
