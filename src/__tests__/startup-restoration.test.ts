import { describe, expect, it, vi } from 'vitest';
import { Block, PLACEABLE } from '../blocks';
import { World } from '../world';
import { Sim, HumanController, IdleController, MobController } from '../entity';
import { Persistence, snapshotChunk, type WorldMeta } from '../persistence';
import { ReplayController, type Replay } from '../replay';
import { WaterSim } from '../water';
import { WorldTime } from '../time';
import { Hotbar } from '../ui/hotbar';
import { TERRAIN_SEED } from '../terrain';
import { initializeSinglePlayer } from '../startup/single-player';
import { restoreReplay } from '../startup/replay-session';

function setup() {
  const world = new World();
  return {
    world,
    sim: new Sim(world, {}, TERRAIN_SEED),
    water: new WaterSim(world),
    clock: new WorldTime(),
    human: new HumanController(new Set(), 0, 0),
    hotbar: new Hotbar(PLACEABLE),
    persist: new Persistence(null, TERRAIN_SEED),
    seed: TERRAIN_SEED,
    chunkReady: vi.fn(),
  };
}

function metadata(): WorldMeta {
  return {
    v: 2,
    seed: TERRAIN_SEED,
    entities: [],
    viewedEntityId: 99,
    simPrng: 12345,
    time: { time: 0.4, tick: 120, phaseTotal: 0.4 },
    hotbar: { slots: Array(9).fill(Block.Glass), selected: 0 },
  };
}

describe('single-player restoration', () => {
  it('loads the spawn column before creating the player and spectator', async () => {
    const options = setup();
    await initializeSinglePlayer(options, null);
    expect(options.chunkReady.mock.calls).toEqual([0, 1, 2, 3, 4].map((cy) => [0, cy, 2]));
    expect(options.sim.viewed()?.pos).toEqual({ x: 6.5, y: 34, z: 46.5 });
    expect(options.sim.respawn).toEqual(options.sim.viewed()?.pos);
    expect(options.sim.viewed()?.controller).toBe(options.human);
    expect(options.sim.all().map((entity) => entity.kind.id)).toEqual(['player', 'spectator']);
    expect(options.hotbar.block).toBe(Block.Planks);
  });

  it('restores cold chunk data and water before notifying rendering', async () => {
    const options = setup();
    const source = new World();
    source.ensureChunk(0, 2, 2);
    source.setBlock(6, 40, 46, Block.Stone);
    const record = snapshotChunk(source.getChunk(0, 2, 2)!);
    vi.spyOn(options.persist, 'fetchRecord').mockImplementation(async (_cx, cy) =>
      cy === 2 ? record : undefined,
    );
    const restore = vi.spyOn(options.water, 'restore');
    options.chunkReady.mockImplementation((_cx, cy) => {
      if (cy === 2) expect(restore).toHaveBeenCalledWith(options.world.getChunk(0, 2, 2));
    });
    await initializeSinglePlayer(options, null);
    expect(options.world.getBlock(6, 40, 46)).toBe(Block.Stone);
    expect(options.sim.respawn.y).toBe(41);
  });

  it('recovers an empty save and restores its clock, RNG, and selected slot zero', async () => {
    const options = setup();
    const meta = metadata();
    await initializeSinglePlayer(options, meta);
    expect(options.sim.viewed()?.kind.id).toBe('player');
    expect(options.sim.ghostId).not.toBe(0);
    expect(options.clock.snapshot()).toEqual(meta.time);
    expect(options.sim.rng.state()).toBe(meta.simPrng);
    expect(options.hotbar.slots).toEqual(meta.hotbar.slots);
    expect(options.hotbar.selected).toBe(0);
  });

  it('restores possession, mob AI, and an existing spectator without duplication', async () => {
    const options = setup();
    const source = new Sim(new World(), {}, TERRAIN_SEED);
    const player = source.spawn({ x: 6.5, y: 34, z: 46.5 }, new IdleController());
    const deer = source.spawn({ x: 7, y: 34, z: 46 }, new IdleController(), { kindId: 'deer' });
    const ghost = source.spawn({ x: 6, y: 38, z: 46 }, new IdleController(), {
      kindId: 'spectator',
    });
    const meta = metadata();
    meta.entities = source.all().map((entity) => source.toRecord(entity));
    meta.viewedEntityId = player.id;
    await initializeSinglePlayer(options, meta);
    expect(options.sim.viewed()?.controller).toBe(options.human);
    expect(options.sim.entities.get(deer.id)?.controller).toBeInstanceOf(MobController);
    expect(options.sim.ghostId).toBe(ghost.id);
    expect(options.sim.all()).toHaveLength(3);
  });
});

describe('replay restoration', () => {
  it('restores snapshot state and replay controllers without reading the world save', () => {
    const options = setup();
    const savedWorld = new World();
    const savedChunk = savedWorld.ensureChunk(0, 2, 2);
    savedWorld.setBlock(6, 40, 46, Block.Glass);
    const source = new Sim(savedWorld, {}, TERRAIN_SEED);
    const player = source.spawn({ x: 6.5, y: 34, z: 46.5 }, new IdleController());
    const meta = metadata();
    meta.entities = [source.toRecord(player)];
    meta.viewedEntityId = player.id;
    const replay: Replay = {
      seed: TERRAIN_SEED,
      startTick: 120,
      endTick: 180,
      simPrng: 54321,
      intents: [],
      events: [],
      snapshot: { chunks: [snapshotChunk(savedChunk)], meta },
    };
    const fetch = vi.spyOn(options.persist, 'fetchRecord');
    const controllerFor = restoreReplay(options, replay);
    expect(options.world.getBlock(6, 40, 46)).toBe(Block.Glass);
    expect(options.chunkReady).toHaveBeenCalledWith(0, 2, 2);
    expect(options.sim.viewed()?.controller).toBeInstanceOf(ReplayController);
    expect(controllerFor(meta.entities[0])).toBeInstanceOf(ReplayController);
    expect(options.clock.snapshot()).toEqual(meta.time);
    expect(options.sim.rng.state()).toBe(replay.simPrng);
    expect(options.sim.ghostId).not.toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});
