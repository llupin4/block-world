import { Block, PLACEABLE, isOpaque } from '../blocks';
import { IdleController, type Sim, type HumanController, type Vec3 } from '../entity';
import { applyRecord, type PersistSource, type WorldMeta } from '../persistence';
import { TerrainGen, generateChunkTerrain } from '../terrain';
import { markNeighborsDirty, type Coord } from '../streaming';
import type { WaterSim } from '../water';
import type { WorldTime } from '../time';
import type { Hotbar } from '../ui/hotbar';
import type { World } from '../world';
import { ensureSpectator, restoredController } from './restore-entities';

interface SinglePlayerOptions {
  world: World;
  sim: Sim;
  water: WaterSim;
  clock: WorldTime;
  human: HumanController;
  hotbar: Hotbar;
  persist: PersistSource;
  seed: number;
  chunkReady(cx: number, cy: number, cz: number): void;
}

async function loadSpawnColumn(options: SinglePlayerOptions): Promise<Coord[]> {
  const { world, sim, water, persist } = options;
  const generated: Coord[] = [];
  for (let cy = 0; cy <= 4; cy++) {
    const record = persist.syncRecord(0, cy, 2) ?? (await persist.fetchRecord(0, cy, 2));
    if (record) {
      applyRecord(world, record, sim, (entity) => restoredController(world, sim, entity));
      markNeighborsDirty(world, 0, cy, 2, 0, 2);
      water.restore(world.getChunk(0, cy, 2)!);
    } else {
      generateChunkTerrain(world, new TerrainGen(options.seed), 0, cy, 2);
      generated.push({ cx: 0, cy, cz: 2 });
    }
    // Lighting and first meshes must see the restored water state.
    options.chunkReady(0, cy, 2);
  }
  return generated;
}

function spawnPlayer(sim: Sim, human: HumanController, spawn: Vec3): number {
  const player = sim.spawn(spawn, human, {
    yaw: -Math.PI / 2,
    kindId: 'player',
    baseController: new IdleController(),
  });
  sim.setViewed(player.id);
  return player.id;
}

function restoreSavedEntities(options: SinglePlayerOptions, meta: WorldMeta, spawn: Vec3): void {
  const { sim, human } = options;
  sim.restoreEntities(meta.entities, (record) =>
    record.id === meta.viewedEntityId ? human : restoredController(options.world, sim, record),
  );
  sim.setViewed(meta.viewedEntityId);
  sim.ensureViewed();
  if (!sim.all().some((entity) => entity.kind.id === 'player')) spawnPlayer(sim, human, spawn);
  const body = sim.entities.get(meta.viewedEntityId);
  if (body?.kind.id === 'player') body.baseController = new IdleController();
  sim.homeId = sim.all().find((entity) => entity.kind.id === 'player')?.id ?? 0;
  ensureSpectator(sim);
  if (meta.simPrng !== undefined) sim.rng.restore(meta.simPrng);
}

function restoreHotbar(hotbar: Hotbar, meta: WorldMeta): void {
  if (meta.hotbar?.slots?.length !== 9) return;
  for (let index = 0; index < 9; index++) hotbar.setSlot(index, meta.hotbar.slots[index]);
  hotbar.select(meta.hotbar.selected ?? 0);
}

export async function initializeSinglePlayer(
  options: SinglePlayerOptions,
  meta: WorldMeta | null,
): Promise<Coord[]> {
  const generated = await loadSpawnColumn(options);
  const { sim, human, clock, hotbar } = options;
  let groundY = 79;
  while (groundY >= 0 && !isOpaque(options.world.getBlock(6, groundY, 46))) groundY--;
  const spawn = { x: 6.5, y: groundY + 1, z: 46.5 };
  sim.respawn = { ...spawn };
  if (meta) {
    clock.restore(meta.time);
    restoreSavedEntities(options, meta, spawn);
    restoreHotbar(hotbar, meta);
  } else {
    sim.homeId = spawnPlayer(sim, human, spawn);
    sim.ghostId = sim.spawn({ x: spawn.x, y: spawn.y + 4, z: spawn.z }, new IdleController(), {
      kindId: 'spectator',
      baseController: new IdleController(),
    }).id;
    hotbar.select(PLACEABLE.indexOf(Block.Planks));
  }
  return generated;
}
