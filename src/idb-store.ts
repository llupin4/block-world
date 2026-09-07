import type { StoreValue, ChunkStore } from './persistence';
import type { Replay } from './replay';

// Browser IndexedDB backend for the persistence layer (ADR 0014). One object store;
// one record per key ("seed:chunk" / "seed:__meta__"). Records carry Uint8Arrays —
// IndexedDB's structured clone stores them natively. Each operation opens its own
// transaction (the store is written at unload frequency, not per frame). putMany is
// ONE readwrite transaction (all-or-nothing) so a save-point batch can't half-write.
// Node-tested against fake-indexeddb (src/__tests__/idb-store.test.ts).
export class IndexedDBChunkStore implements ChunkStore {
  private readonly dbp: Promise<IDBDatabase>;

  constructor(name = 'block-world', version = 2) {
    this.dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('chunks')) req.result.createObjectStore('chunks');
        // Version BUMP to 2 (phase 3): an existing v1 browser DB never fires onupgradeneeded on a
        // v1 open, so the `replays` store would silently never be created for returning users
        // (the fresh-DB node test masks this). At v2 a v1 user's DB fires onupgradeneeded (v1 -> v2)
        // and `replays` is created.
        if (!req.result.objectStoreNames.contains('replays')) req.result.createObjectStore('replays');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return this.dbp.then((db) => new Promise<T>((resolve, reject) => {
      const t = db.transaction('chunks', mode);
      const req = run(t.objectStore('chunks'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  async get(key: string): Promise<StoreValue | undefined> {
    const r = await this.tx<StoreValue | undefined>('readonly', (s) => s.get(key) as IDBRequest<StoreValue | undefined>);
    return r ?? undefined;
  }

  async put(key: string, rec: StoreValue): Promise<void> {
    await this.tx('readwrite', (s) => s.put(rec, key));
  }

  /** Every entry in ONE readwrite transaction: resolves on transaction complete (all puts
   *  applied) and rejects on error/abort, so the batch is all-or-nothing. A `put` that fails
   *  the structured clone synchronously (as in fake-indexeddb) is caught and the transaction
   *  explicitly aborted, so a mid-batch failure commits nothing. */
  async putMany(entries: [string, StoreValue][]): Promise<void> {
    if (entries.length === 0) return;
    await this.dbp.then((db) => new Promise<void>((resolve, reject) => {
      const t = db.transaction('chunks', 'readwrite');
      const s = t.objectStore('chunks');
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error ?? new Error('transaction aborted'));
      try {
        for (const [k, rec] of entries) s.put(rec, k);
      } catch (e) {
        t.abort();
        reject(e);
      }
    }));
  }

  async delete(key: string): Promise<void> {
    await this.tx('readwrite', (s) => s.delete(key));
  }

  /** All keys, or — with a prefix — only the keys under it. The per-seed boot scan passes
   *  "seed:" so a multi-seed store never reads the other seeds' key space. */
  async keys(prefix?: string): Promise<string[]> {
    return this.tx<string[]>('readonly', (s) =>
      s.getAllKeys(prefix ? IDBKeyRange.bound(prefix, prefix + '\uffff') : undefined) as IDBRequest<string[]>);
  }

  // --- replays (phase 3, ADR 0017): a second object store, one record per key ---
  private txReplay<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return this.dbp.then((db) => new Promise<T>((resolve, reject) => {
      const t = db.transaction('replays', mode);
      const req = run(t.objectStore('replays'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  async putReplay(key: string, replay: Replay): Promise<void> {
    await this.txReplay('readwrite', (s) => s.put(replay, key));
  }

  async getReplay(key: string): Promise<Replay | undefined> {
    const r = await this.txReplay<Replay | undefined>('readonly', (s) => s.get(key) as IDBRequest<Replay | undefined>);
    return r ?? undefined;
  }
}