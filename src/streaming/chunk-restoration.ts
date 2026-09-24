import type { Sim, EntityRecord, Controller } from '../entity';
import { applyRecord, type PersistSource } from '../persistence';
import type { Coord, StreamingUpdate } from '../streaming';
import { chunkKey, type World } from '../world';

interface RestoreContext {
  world: World;
  sim: Sim;
  persist: PersistSource;
  controllerFor(record: EntityRecord): Controller;
  wanted(c: Coord): boolean;
  restored(c: Coord): void;
}

export class ChunkRestoration {
  private readonly pending = new Set<string>();

  restore(
    update: Pick<StreamingUpdate, 'restored' | 'pending'>,
    context: RestoreContext,
  ): Promise<void> {
    for (const c of update.restored) {
      const record = context.persist.syncRecord(c.cx, c.cy, c.cz);
      if (record?.entities) context.sim.restoreEntities(record.entities, context.controllerFor);
    }
    return Promise.all(update.pending.map((c) => this.fetch(c, context))).then(() => {});
  }

  private async fetch(c: Coord, context: RestoreContext): Promise<void> {
    const key = chunkKey(c.cx, c.cy, c.cz);
    if (this.pending.has(key)) return;
    this.pending.add(key);
    try {
      const record = await context.persist.fetchRecord(c.cx, c.cy, c.cz);
      if (!record) {
        context.persist.dropPersisted(c.cx, c.cy, c.cz);
        return;
      }
      if (!context.wanted(c) || context.world.hasChunk(c.cx, c.cy, c.cz)) return;
      applyRecord(context.world, record, context.sim, context.controllerFor);
      context.restored(c);
    } finally {
      this.pending.delete(key);
    }
  }
}
