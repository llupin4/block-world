import type { Sim } from '../entity';
import { spawnDeer } from '../spawn';
import { CY_MIN, CY_MAX, type Coord } from '../streaming';
import type { World } from '../world';

type PopulationPolicy = (world: World, sim: Sim, cx: number, cz: number) => void;

export class MobPopulation {
  private readonly generated = new Map<string, Set<number>>();
  private readonly populated = new Set<string>();

  constructor(private readonly populate: PopulationPolicy = spawnDeer) {}

  update(world: World, sim: Sim, update: { generated: Coord[]; unloaded: Coord[] }): void {
    for (const c of update.unloaded) {
      const key = `${c.cx},${c.cz}`;
      this.generated.delete(key);
      this.populated.delete(key);
      for (const entity of sim.entitiesInChunk(c.cx, c.cy, c.cz)) {
        if (entity.kind.id !== 'player' && entity.kind.id !== 'spectator') sim.despawn(entity.id);
      }
    }
    for (const c of update.generated) {
      const key = `${c.cx},${c.cz}`;
      if (this.populated.has(key)) continue;
      const bands = this.generated.get(key) ?? new Set<number>();
      bands.add(c.cy);
      this.generated.set(key, bands);
      if (!this.ready(world, c, bands)) continue;
      this.generated.delete(key);
      this.populated.add(key);
      this.populate(world, sim, c.cx, c.cz);
    }
  }

  private ready(world: World, c: Coord, bands: Set<number>): boolean {
    // Scan a complete, freshly generated column, never missing terrain or restored populations.
    for (let cy = CY_MIN; cy <= CY_MAX; cy++) {
      if (!bands.has(cy) || !world.hasChunk(c.cx, cy, c.cz)) return false;
    }
    return true;
  }
}
