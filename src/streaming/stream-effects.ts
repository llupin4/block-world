import type { Sim, Controller, EntityRecord } from '../entity';
import { applyRecord, type PersistSource } from '../persistence';
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
  private readonly restoring = new Set<string>();

  consume(update: StreamingUpdate, context: StreamContext): Promise<void> {
    for (const c of update.unloaded) unload(c, context);
    if (update.unloaded.length) context.saveMeta?.();
    for (const c of update.rebuilt) {
      context.water?.settle(c.cx, c.cy, c.cz);
      loadLight(c, update.meshable, context);
    }
    for (const c of update.restored) restoreWaterAndLight(c, update.meshable, context);
    return Promise.all(update.pending.map((c) => this.fetch(c, update.meshable, context))).then(
      () => {},
    );
  }

  private async fetch(c: Coord, meshable: Set<string>, context: StreamContext): Promise<void> {
    const key = chunkKey(c.cx, c.cy, c.cz);
    if (this.restoring.has(key)) return;
    this.restoring.add(key);
    const viewed = context.sim.viewed();
    const cx = viewed ? chunkOf(viewed.pos.x) : 0;
    const cz = viewed ? chunkOf(viewed.pos.z) : 0;
    try {
      const record = await context.persist.fetchRecord(c.cx, c.cy, c.cz);
      if (!record) {
        context.persist.dropPersisted(c.cx, c.cy, c.cz);
        return;
      }
      if (!viewed || !inRange(c.cx, c.cz, cx, cz)) return;
      if (context.world.hasChunk(c.cx, c.cy, c.cz)) return;
      applyRecord(context.world, record, context.sim, context.controllerFor);
      markNeighborsDirty(context.world, c.cx, c.cy, c.cz, cx, cz);
      restoreWaterAndLight(c, meshable, context);
    } finally {
      // A failed fetch must not permanently prevent a later streaming update from retrying.
      this.restoring.delete(key);
    }
  }
}
