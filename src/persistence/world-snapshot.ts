import type { Sim } from '../entity';
import type { WorldMeta } from '../persistence';
import type { WorldTime } from '../time';
import type { Hotbar } from '../ui/hotbar';

export interface WorldSnapshotSource {
  seed: number;
  sim: Sim;
  clock: WorldTime;
  hotbar: Hotbar;
}

export function snapshotWorldMeta({ seed, sim, clock, hotbar }: WorldSnapshotSource): WorldMeta {
  return {
    v: 2,
    seed,
    entities: sim.all().map((entity) => sim.toRecord(entity)),
    viewedEntityId: sim.viewedId,
    simPrng: sim.rng.state(),
    time: clock.snapshot(),
    hotbar: { slots: [...hotbar.slots], selected: hotbar.selected },
  };
}
