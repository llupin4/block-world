import {
  IdleController,
  MobController,
  type Sim,
  type EntityRecord,
  type Controller,
} from '../entity';
import type { World } from '../world';

export function restoredController(world: World, sim: Sim, record: EntityRecord): Controller {
  if (record.kindId === 'deer' || record.kindId === 'dolt') {
    return new MobController(
      (x, y, z) => world.getBlock(x, y, z),
      () => sim.rng.next(),
    );
  }
  return new IdleController();
}

export function ensureSpectator(sim: Sim): void {
  sim.ghostId = sim.all().find((entity) => entity.kind.id === 'spectator')?.id ?? 0;
  if (sim.ghostId !== 0) return;
  const viewed = sim.viewed() ?? sim.all()[0];
  if (!viewed) return;
  sim.ghostId = sim.spawn(
    { x: viewed.pos.x, y: viewed.pos.y + 4, z: viewed.pos.z },
    new IdleController(),
    { kindId: 'spectator', baseController: new IdleController() },
  ).id;
}
