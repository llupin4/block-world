import { type PersistSource, type ChunkRecord } from '../persistence';
import { type Transport } from './transport';

// The client's PersistSource. A client never has a persisted world: it generates pristine
// terrain locally and syncs edits/water from the host. So hasPersisted/syncRecord are
// constant and onUnload/dropPersisted are no-ops (reusing the playback no-op pattern).
// fetchRecord is a [POC shortcut] stub (streaming never calls it — the client's hasPersisted
// is always false, so its load path always generates); the real sync is the chunkReq/Rec
// side channel (see ClientSession).
export class NetworkPersistSource implements PersistSource {
  private pending = new Map<string, (rec: ChunkRecord | null) => void>();
  constructor(private readonly transport: Transport) {}
  hasPersisted(): boolean { return false; }
  syncRecord(): undefined { return undefined; }
  fetchRecord(cx: number, cy: number, cz: number): Promise<ChunkRecord | undefined> {
    const key = `${cx},${cy},${cz}`;
    return new Promise<ChunkRecord | undefined>((resolve) => {
      this.pending.set(key, (rec) => resolve(rec ?? undefined));
      this.transport.send('all', { type: 'chunkReq', key });
    });
  }
  resolveChunk(key: string, rec: ChunkRecord | null): void {
    const res = this.pending.get(key);
    if (res) { this.pending.delete(key); res(rec); }
  }
  onUnload(): void { /* no-op: a client never saves */ }
  dropPersisted(): void { /* no-op */ }
}