import type { StoreValue } from './persistence';

// Browser IndexedDB backend for the persistence layer (ADR 0014). One object store;
// one record per key ("seed:chunk" / "seed:__meta__"). Records carry Uint8Arrays —
// IndexedDB's structured clone stores them natively. Each operation opens its own
// transaction (the store is written at unload frequency, not per frame).
// [POC shortcut] no node tests — verified in the Task 12 browser checklist.
export class IndexedDBChunkStore {
  private readonly dbp: Promise<IDBDatabase>;

  constructor(name = 'block-world', version = 1) {
    this.dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('chunks')) req.result.createObjectStore('chunks');
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

  async delete(key: string): Promise<void> {
    await this.tx('readwrite', (s) => s.delete(key));
  }

  async keys(): Promise<string[]> {
    return this.tx<string[]>('readonly', (s) => s.getAllKeys() as IDBRequest<string[]>);
  }
}