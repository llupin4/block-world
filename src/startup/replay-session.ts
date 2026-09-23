import { type Sim, type EntityRecord, type Controller } from '../entity';
import { applyRecord } from '../persistence';
import { ReplayController, type Replay } from '../replay';
import type { WaterSim } from '../water';
import type { WorldTime } from '../time';
import type { World } from '../world';
import { ensureSpectator } from './restore-entities';

interface ReplayOptions {
  world: World;
  sim: Sim;
  water: WaterSim;
  clock: WorldTime;
  chunkReady(cx: number, cy: number, cz: number): void;
}

export function restoreReplay(
  options: ReplayOptions,
  replay: Replay,
): (record: EntityRecord) => Controller {
  const { world, sim, water, clock } = options;
  for (const record of replay.snapshot.chunks) {
    applyRecord(world, record);
    const chunk = world.getChunk(record.cx, record.cy, record.cz);
    if (chunk) {
      water.restore(chunk);
      options.chunkReady(record.cx, record.cy, record.cz);
    }
  }
  sim.rng.restore(replay.simPrng);
  clock.restore(replay.snapshot.meta.time);
  const controllerFor = (record: EntityRecord) =>
    new ReplayController(replay.intents.filter((entry) => entry.entityId === record.id));
  sim.restoreEntities(replay.snapshot.meta.entities, controllerFor);
  if (sim.all().length === 0) throw new Error('Replay snapshot has no entities');
  ensureSpectator(sim);
  sim.setViewed(replay.snapshot.meta.viewedEntityId);
  sim.ensureViewed();
  return controllerFor;
}
