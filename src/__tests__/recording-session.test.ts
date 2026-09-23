import { describe, expect, it, vi } from 'vitest';
import { Block } from '../blocks';
import { IdleController, NULL_INTENT, Sim } from '../entity';
import { RecordingSession } from '../replay/recording-session';
import { WorldTime } from '../time';
import { Hotbar } from '../ui/hotbar';
import { World, localIndex } from '../world';

function setup() {
  const world = new World();
  world.ensureChunk(0, 0, 0);
  world.setBlock(1, 1, 1, Block.Stone);
  const sim = new Sim(world, {}, 42);
  const entity = sim.spawn({ x: 1, y: 2, z: 1 }, new IdleController());
  sim.viewedId = entity.id;
  const clock = new WorldTime();
  clock.tick = 10;
  const hotbar = new Hotbar([Block.Stone]);
  const save = vi.fn();
  const recording = new RecordingSession(save, () => 1234);
  return { source: { seed: 42, world, sim, clock, hotbar }, entity, save, recording };
}

describe('RecordingSession', () => {
  it('saves the initial snapshot independently of subsequent world and inventory edits', () => {
    const { source, entity, save, recording } = setup();
    const initialPrng = source.sim.rng.state();
    recording.start(source);
    source.world.setBlock(1, 1, 1, Block.Air);
    source.hotbar.setSlot(0, Block.Planks);
    source.hotbar.select(2);
    entity.pos.x = 20;
    source.sim.rng.next();
    source.clock.advance(1 / 60);

    const saved = recording.stop()!;
    expect(saved.key).toBe('42:replay:10');
    expect(saved.replay).toMatchObject({
      seed: 42,
      startTick: 10,
      endTick: 11,
      simPrng: initialPrng,
      recordedAt: 1234,
    });
    const snapshot = saved.replay.snapshot;
    expect(snapshot.chunks[0].blocks[localIndex(1, 1, 1)]).toBe(Block.Stone);
    expect(snapshot.meta.entities[0].x).toBe(1);
    expect(snapshot.meta.hotbar).toEqual({ slots: Array(9).fill(Block.Stone), selected: 0 });
    expect(snapshot.meta.time.tick).toBe(10);
    expect(snapshot.meta.simPrng).toBe(initialPrng);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(saved.key, saved.replay);
    expect(recording.active).toBe(false);
    expect(recording.stop()).toBeNull();
  });

  it('records intents, entity events, and possession changes, then detaches hooks', () => {
    const { source, entity, recording } = setup();
    recording.start(source);
    expect(recording.active).toBe(true);
    source.sim.onIntent?.(10, entity, { ...NULL_INTENT });
    source.sim.onIntent?.(11, entity, { ...NULL_INTENT });
    const spawned = source.sim.spawn({ x: 3, y: 2, z: 1 }, new IdleController());
    source.clock.tick = 11;
    source.sim.viewedId = spawned.id;
    recording.recordViewed();
    source.sim.despawn(spawned.id);
    const { replay } = recording.stop()!;
    expect(replay.intents).toHaveLength(1);
    expect(replay.events.map(({ type, tick }) => ({ type, tick }))).toEqual([
      { type: 'spawn', tick: 11 },
      { type: 'despawn', tick: 11 },
    ]);
    expect(replay.viewed).toEqual([{ tick: 11, id: spawned.id }]);
    expect(source.sim.onIntent).toBeUndefined();
    expect(source.sim.onSpawn).toBeUndefined();
    expect(source.sim.onDespawn).toBeUndefined();
    recording.recordViewed();
    expect(replay.viewed).toHaveLength(1);
  });

  it('ignores duplicate starts and accepts a new simulation after stopping', () => {
    const { source, recording, save } = setup();
    expect(recording.stop()).toBeNull();
    recording.recordViewed();
    expect(save).not.toHaveBeenCalled();
    recording.start(source);
    const replacement = setup().source;
    replacement.clock.tick = 50;
    recording.start(replacement);
    expect(recording.stop()!.replay.startTick).toBe(10);
    recording.start(replacement);
    expect(recording.stop()!.replay.startTick).toBe(50);
    expect(save).toHaveBeenCalledTimes(2);
  });
});
