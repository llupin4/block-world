import { describe, expect, it, vi } from 'vitest';
import { Block } from '../blocks';
import { IdleController, Sim } from '../entity';
import { snapshotChunk, type ChunkRecord } from '../persistence';
import type { StreamingUpdate } from '../streaming';
import { StreamEffects } from '../streaming/stream-effects';
import { World } from '../world';

const origin = { cx: 0, cy: 0, cz: 0 };
function update(overrides: Partial<StreamingUpdate> = {}): StreamingUpdate {
  return {
    rebuilt: [],
    generated: [],
    remeshed: [],
    restored: [],
    pending: [],
    unloaded: [],
    meshable: new Set(['0,0,0']),
    ...overrides,
  };
}

function setup() {
  const world = new World();
  const sim = new Sim(world, {}, 1);
  sim.viewedId = sim.spawn({ x: 1, y: 2, z: 1 }, new IdleController()).id;
  const context = {
    world,
    sim,
    persist: {
      hasPersisted: () => true,
      syncRecord: () => undefined,
      onUnload: vi.fn(),
      fetchRecord: vi.fn<() => Promise<ChunkRecord | undefined>>(),
      dropPersisted: vi.fn(),
    },
    water: { settle: vi.fn(), restore: vi.fn() },
    light: { load: vi.fn(), unload: vi.fn() },
    removeMesh: vi.fn(),
    removeRemesh: vi.fn(),
    deferredMeshes: new Set<string>(),
    saveMeta: vi.fn(),
    controllerFor: () => new IdleController(),
  };
  const savedWorld = new World();
  const chunk = savedWorld.ensureChunk(0, 0, 0);
  savedWorld.setBlock(1, 1, 1, Block.Stone);
  const record = snapshotChunk(chunk);
  context.persist.fetchRecord.mockResolvedValue(record);
  return { context, record, effects: new StreamEffects() };
}

describe('StreamEffects', () => {
  it('settles host water before lighting, but lights only the meshable ring', async () => {
    const { context, effects } = setup();
    const remote = { cx: 4, cy: 0, cz: 0 };
    const order: string[] = [];
    context.water.settle.mockImplementation(() => order.push('water'));
    context.light.load.mockImplementation(() => order.push('light'));
    await effects.consume(
      update({ rebuilt: [origin, remote], generated: [origin, remote] }),
      context,
    );
    expect(order).toEqual(['water', 'light', 'water']);
    expect(context.deferredMeshes).toEqual(new Set(['0,0,0']));
  });

  it('restores warm water state without settling and skips water for clients', async () => {
    const { context, effects } = setup();
    const chunk = context.world.ensureChunk(0, 0, 0);
    await effects.consume(update({ restored: [origin] }), context);
    expect(context.water.restore).toHaveBeenCalledWith(chunk);
    expect(context.water.settle).not.toHaveBeenCalled();
    context.water.restore.mockClear();
    await effects.consume(update({ restored: [origin], rebuilt: [origin], generated: [origin] }), {
      ...context,
      water: null,
      saveMeta: null,
    });
    expect(context.water.restore).not.toHaveBeenCalled();
    expect(context.water.settle).not.toHaveBeenCalled();
  });

  it('unloads visuals and saves metadata without owning mob lifecycle', async () => {
    const { context, effects } = setup();
    const deer = context.sim.spawn({ x: 1, y: 2, z: 1 }, new IdleController(), { kindId: 'deer' });
    context.deferredMeshes.add('0,0,0');
    context.saveMeta.mockImplementation(() =>
      expect(context.sim.all().map((e) => e.id)).toContain(deer.id),
    );
    await effects.consume(update({ unloaded: [origin] }), context);
    expect(context.removeMesh).toHaveBeenCalledWith(0, 0, 0);
    expect(context.light.unload).toHaveBeenCalledWith(0, 0, 0);
    expect(context.removeRemesh).toHaveBeenCalledWith('0,0,0');
    expect(context.deferredMeshes.size).toBe(0);
    expect(context.sim.all()).toHaveLength(2);
    expect(context.saveMeta).toHaveBeenCalledTimes(1);
  });

  it('deduplicates in-flight fetches and restores chunk data and entities once', async () => {
    const { context, record, effects } = setup();
    const savedSim = new Sim(new World(), {}, 1);
    savedSim.spawn({ x: 0, y: 0, z: 0 }, new IdleController());
    const deer = savedSim.spawn({ x: 2, y: 2, z: 2 }, new IdleController(), { kindId: 'deer' });
    record.entities = [savedSim.toRecord(deer)];
    let resolve!: (record: ChunkRecord) => void;
    context.persist.fetchRecord.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const first = effects.consume(update({ pending: [origin] }), context);
    await effects.consume(update({ pending: [origin] }), context);
    expect(context.persist.fetchRecord).toHaveBeenCalledTimes(1);
    resolve(record);
    await first;
    expect(context.world.getBlock(1, 1, 1)).toBe(Block.Stone);
    expect(context.sim.all()).toHaveLength(2);
    expect(context.water.restore).toHaveBeenCalledTimes(1);
    expect(context.light.load).toHaveBeenCalledTimes(1);
    expect(context.deferredMeshes.has('0,0,0')).toBe(true);
  });

  it('drops missing records and never overwrites an already loaded chunk', async () => {
    const { context, effects } = setup();
    context.persist.fetchRecord.mockResolvedValueOnce(undefined);
    await effects.consume(update({ pending: [origin] }), context);
    expect(context.persist.dropPersisted).toHaveBeenCalledWith(0, 0, 0);
    context.world.ensureChunk(0, 0, 0);
    await effects.consume(update({ pending: [origin] }), context);
    expect(context.world.getBlock(1, 1, 1)).toBe(Block.Air);
    expect(context.light.load).not.toHaveBeenCalled();
  });

  it('skips fetched chunks outside the current view range', async () => {
    const { context, effects } = setup();
    context.sim.viewed()!.pos.x = 1000;
    await effects.consume(update({ pending: [origin] }), context);
    expect(context.world.hasChunk(0, 0, 0)).toBe(false);
    expect(context.light.load).not.toHaveBeenCalled();
  });

  it('releases failed fetches so a later update can retry', async () => {
    const { context, effects } = setup();
    context.persist.fetchRecord.mockRejectedValueOnce(new Error('read failed'));
    await expect(effects.consume(update({ pending: [origin] }), context)).rejects.toThrow(
      'read failed',
    );
    await effects.consume(update({ pending: [origin] }), context);
    expect(context.persist.fetchRecord).toHaveBeenCalledTimes(2);
    expect(context.world.getBlock(1, 1, 1)).toBe(Block.Stone);
  });
});
