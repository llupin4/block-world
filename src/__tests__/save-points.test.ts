import { describe, expect, it, vi } from 'vitest';
import { Block } from '../blocks';
import { IdleController, Sim } from '../entity';
import { SavePoints, installSavePoints } from '../persistence/save-points';
import { snapshotWorldMeta } from '../persistence/world-snapshot';
import { WorldTime } from '../time';
import { Hotbar } from '../ui/hotbar';
import { World } from '../world';

function source() {
  const world = new World();
  world.ensureChunk(0, 0, 0);
  const sim = new Sim(world, {}, 42);
  sim.viewedId = sim.spawn({ x: 1, y: 2, z: 3 }, new IdleController()).id;
  return {
    seed: 42,
    world,
    sim,
    clock: new WorldTime(),
    hotbar: new Hotbar([Block.Stone]),
    persist: { saveLoaded: vi.fn(), flush: vi.fn().mockResolvedValue(undefined) },
  };
}

describe('save points', () => {
  it('builds detached metadata shared by saves and replay snapshots', () => {
    const state = source();
    const snapshot = snapshotWorldMeta(state);
    const initialPrng = state.sim.rng.state();
    state.hotbar.setSlot(0, Block.Planks);
    state.hotbar.select(2);
    state.sim.viewed()!.pos.x = 100;
    state.clock.advance(1 / 60);
    state.sim.rng.next();
    expect(snapshot).toMatchObject({
      v: 2,
      seed: 42,
      viewedEntityId: state.sim.viewedId,
      simPrng: initialPrng,
      entities: [{ x: 1, y: 2, z: 3 }],
      time: { tick: 0 },
      hotbar: { slots: Array(9).fill(Block.Stone), selected: 0 },
    });
  });

  it('batches loaded chunks with current metadata before flushing', () => {
    const state = source();
    const calls: string[] = [];
    state.persist.saveLoaded.mockImplementation((chunks, meta) => {
      calls.push('save');
      expect([...chunks]).toEqual([...state.world.allChunks()]);
      expect(meta).toEqual(snapshotWorldMeta(state));
    });
    state.persist.flush.mockImplementation(async () => {
      calls.push('flush');
    });
    new SavePoints(() => state).saveAndFlush();
    expect(calls).toEqual(['save', 'flush']);
  });

  it('resolves the active runtime on each save and performs no writes during playback', () => {
    const first = source();
    const second = source();
    second.clock.tick = 20;
    let active: ReturnType<typeof source> | null = first;
    const saves = new SavePoints(() => active);
    saves.saveAndFlush();
    active = null;
    const target = { saveMeta: vi.fn() };
    saves.saveAndFlush();
    saves.saveMeta(target);
    expect(first.persist.saveLoaded).toHaveBeenCalledTimes(1);
    expect(first.persist.flush).toHaveBeenCalledTimes(1);
    expect(target.saveMeta).not.toHaveBeenCalled();
    active = second;
    saves.saveAndFlush();
    saves.saveMeta(target);
    expect(second.persist.saveLoaded).toHaveBeenCalledTimes(1);
    expect(target.saveMeta).toHaveBeenCalledWith(
      expect.objectContaining({ time: second.clock.snapshot() }),
    );
    expect(second.persist.flush).toHaveBeenCalledTimes(1);
  });

  it('saves on hidden, pagehide, and the five-second interval, with removable listeners', () => {
    const state = source();
    const saves = new SavePoints(() => state);
    const document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    let periodicSave!: () => void;
    const page = Object.assign(new EventTarget(), {
      setInterval: vi.fn((callback: () => void, _timeout: number) => {
        periodicSave = callback;
        return 7;
      }),
      clearInterval: vi.fn(),
    });
    const dispose = installSavePoints(saves, document, page);
    expect(page.setInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(state.persist.saveLoaded).not.toHaveBeenCalled();
    document.visibilityState = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    page.dispatchEvent(new Event('pagehide'));
    periodicSave();
    expect(state.persist.saveLoaded).toHaveBeenCalledTimes(3);
    dispose();
    expect(page.clearInterval).toHaveBeenCalledWith(7);
    document.dispatchEvent(new Event('visibilitychange'));
    page.dispatchEvent(new Event('pagehide'));
    expect(state.persist.saveLoaded).toHaveBeenCalledTimes(3);
  });
});
