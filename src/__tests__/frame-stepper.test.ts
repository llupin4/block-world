import { describe, expect, it, vi } from 'vitest';
import type { Replay } from '../replay';
import { FrameStepper } from '../simulation/frame-stepper';
import { WorldTime } from '../time';

function setup() {
  const clock = new WorldTime();
  const sim = { tick: vi.fn(), setViewed: vi.fn() };
  const source = { sim, clock, multiplayer: null, playback: null };
  return { source, stepper: new FrameStepper(0) };
}

function replay(): Replay {
  return {
    seed: 1,
    startTick: 0,
    endTick: 2,
    simPrng: 1,
    events: [],
    intents: [],
    viewed: [{ tick: 2, id: 9 }],
    snapshot: {
      chunks: [],
      meta: {
        v: 2,
        seed: 1,
        entities: [],
        viewedEntityId: 1,
        time: new WorldTime().snapshot(),
        hotbar: { slots: [1], selected: 0 },
      },
    },
  };
}

describe('FrameStepper', () => {
  it('carries fractional steps between frames and advances simulation before its clock', () => {
    const { source, stepper } = setup();
    const observedTicks: number[] = [];
    source.sim.tick.mockImplementation(() => observedTicks.push(source.clock.tick));
    expect(stepper.advance(10, source)).toBe(0.01);
    expect(source.sim.tick).not.toHaveBeenCalled();
    stepper.advance(20, source);
    stepper.advance(40, source);
    expect(observedTicks).toEqual([0, 1]);
    expect(source.sim.tick).toHaveBeenNthCalledWith(2, 1 / 60, 1);
    expect(source.clock.tick).toBe(2);
    expect(source.clock.time).toBeCloseTo(2 / 60);
  });

  it('caps a hitch at 100 ms without retaining the discarded time', () => {
    const { source, stepper } = setup();
    expect(stepper.advance(5000, source)).toBe(0.1);
    expect(source.clock.tick).toBe(6);
    stepper.advance(5020, source);
    expect(source.clock.tick).toBe(7);
  });

  it('consumes paused time and stops on the replay end tick within a multi-step frame', () => {
    const { source, stepper } = setup();
    const playback = { replay: replay(), paused: true };
    const playing = { ...source, playback };
    stepper.advance(100, playing);
    expect(source.clock.tick).toBe(0);
    playback.paused = false;
    stepper.advance(120, playing);
    expect(source.clock.tick).toBe(1);
    expect(source.sim.setViewed).toHaveBeenLastCalledWith(1);
    stepper.advance(200, playing);
    expect(source.clock.tick).toBe(2);
    expect(source.sim.setViewed).toHaveBeenLastCalledWith(9);
    expect(playback.paused).toBe(true);
    expect(source.sim.tick).toHaveBeenCalledTimes(2);
  });

  it('sends client intents, pumps delivery, then ticks the synchronized host', () => {
    const { source, stepper } = setup();
    source.clock.tick = 10;
    const order: string[] = [];
    const hostClock = new WorldTime();
    const multiplayer = {
      clients: [
        { tick: (tick: number) => order.push(`client-a:${tick}`) },
        { tick: (tick: number) => order.push(`client-b:${tick}`) },
      ],
      hub: { pump: (tick: number) => order.push(`pump:${tick}`) },
      host: {
        worldTime: hostClock,
        tick: (tick: number) => order.push(`host:${tick}:${hostClock.tick}`),
      },
    };
    stepper.advance(34, { ...source, multiplayer });
    expect(order).toEqual([
      'client-a:10',
      'client-b:10',
      'pump:10',
      'host:10:10',
      'client-a:11',
      'client-b:11',
      'pump:11',
      'host:11:11',
    ]);
    expect(source.clock.tick).toBe(12);
    expect(source.clock.time).toBe(0);
    expect(source.sim.tick).not.toHaveBeenCalled();
  });

  it('advances a remote client without a local host or loopback hub', () => {
    const { source, stepper } = setup();
    const client = { tick: vi.fn() };
    stepper.advance(20, {
      ...source,
      multiplayer: { clients: [client], hub: null, host: null },
    });
    expect(client.tick).toHaveBeenCalledWith(0);
    expect(source.clock.tick).toBe(1);
    expect(source.sim.tick).not.toHaveBeenCalled();
  });
});
