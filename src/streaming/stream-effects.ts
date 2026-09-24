import type { Sim, Controller, EntityRecord } from '../entity';
import type { PersistSource } from '../persistence';
import { ChunkRestoration } from './chunk-restoration';
import { inRange, markNeighborsDirty, type Coord, type StreamingUpdate } from '../streaming';
import type { WaterSim } from '../water';
import { chunkKey, chunkOf, type World } from '../world';

interface StreamContext {
  world: World;
  sim: Sim;
  persist: PersistSource;
  water: Pick<WaterSim, 'settle' | 'restore'> | null;
  light: {
    load(cx: number, cy: number, cz: number): void;
    unload(cx: number, cy: number, cz: number): void;
  };
  removeMesh(cx: number, cy: number, cz: number): void;
  removeRemesh(key: string): void;
  deferredMeshes: Set<string>;
  saveMeta: (() => void) | null;
  controllerFor(record: EntityRecord): Controller;
}

function loadLight(c: Coord, meshable: Set<string>, context: StreamContext): void {
  const key = chunkKey(c.cx, c.cy, c.cz);
  if (!meshable.has(key)) return;
  context.light.load(c.cx, c.cy, c.cz);
  context.deferredMeshes.add(key);
}

function restoreWaterAndLight(c: Coord, meshable: Set<string>, context: StreamContext): void {
  const chunk = context.world.getChunk(c.cx, c.cy, c.cz)!;
  context.water?.restore(chunk);
  loadLight(c, meshable, context);
}

function unload(c: Coord, context: StreamContext): void {
  const key = chunkKey(c.cx, c.cy, c.cz);
  context.removeMesh(c.cx, c.cy, c.cz);
  context.light.unload(c.cx, c.cy, c.cz);
  context.removeRemesh(key);
  context.deferredMeshes.delete(key);
}

export class StreamEffects {
  private readonly restoration = new ChunkRestoration();

  consume(update: StreamingUpdate, context: StreamContext): Promise<void> {
    for (const c of update.unloaded) unload(c, context);
    if (update.unloaded.length) context.saveMeta?.();
    for (const c of update.rebuilt) {
      context.water?.settle(c.cx, c.cy, c.cz);
      loadLight(c, update.meshable, context);
    }
    for (const c of update.restored) restoreWaterAndLight(c, update.meshable, context);
    return this.restoration.restore(update, {
      ...context,
      wanted: (c) => {
        const viewed = context.sim.viewed();
        return !!viewed && inRange(c.cx, c.cz, chunkOf(viewed.pos.x), chunkOf(viewed.pos.z));
      },
      restored: (c) => {
        const viewed = context.sim.viewed()!;
        markNeighborsDirty(
          context.world,
          c.cx,
          c.cy,
          c.cz,
          chunkOf(viewed.pos.x),
          chunkOf(viewed.pos.z),
        );
        restoreWaterAndLight(c, update.meshable, context);
      },
    });
  }
}
