import { type Chunk, type World } from './world';

declare global {
  interface Window {
    __persistDebug?: Persistence; // debug surface: key set, warm cache, store counters
  }
}

// === record shapes (ADR 0014) ===

/** One persisted chunk: the six arrays that define world state. Light fields are
 *  intentionally absent (recomputed by the light worker on load — ADR 0012). Plain data
 *  only (no class instances, no closures) — this is the future sync payload. */
export interface ChunkRecord {
  v: 1;
  cx: number;
  cy: number;
  cz: number;
  blocks: Uint8Array;
  meta: Uint8Array;
  wlevel: Uint8Array;
  wsource: Uint8Array;
  wplaced: Uint8Array;
  wstream: Uint8Array;
}

/** World meta: everything that is not chunk arrays. */
export interface WorldMeta {
  v: 1;
  seed: number;
  player: { x: number; y: number; z: number; yaw: number; pitch: number };
  time: { time: number; tick: number; phaseTotal: number }; // WorldTime.snapshot()
  hotbar: { slots: number[]; selected: number };
}

export type StoreValue = ChunkRecord | WorldMeta;

/** Pluggable backend (the brief's ChunkStore): IndexedDB in the browser, in-memory in
 *  node tests. Typed arrays survive structured clone — stored raw. */
export interface ChunkStore {
  get(key: string): Promise<StoreValue | undefined>;
  put(key: string, rec: StoreValue): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

const META_SUFFIX = '__meta__';

export function chunkRecordKey(seed: number, cx: number, cy: number, cz: number): string {
  return `${seed}:${cx},${cy},${cz}`;
}

export function metaKey(seed: number): string {
  return `${seed}:${META_SUFFIX}`;
}

/** Snapshot a chunk's arrays into a record. Arrays are COPIED (slice): the chunk is
 *  removed from the world right after onUnload returns. */
export function snapshotChunk(c: Chunk): ChunkRecord {
  return {
    v: 1,
    cx: c.cx, cy: c.cy, cz: c.cz,
    blocks: c.blocks.slice(),
    meta: c.meta.slice(),
    wlevel: c.wlevel.slice(),
    wsource: c.wsource.slice(),
    wplaced: c.wplaced.slice(),
    wstream: c.wstream.slice(),
  };
}

/** Apply a record to the world. settled = true (D1: the saved state is the truth — no
 *  re-settle); edited = true (a persisted chunk is by definition edited, so a later
 *  unload re-snapshots it); dirty = false (its first mesh goes through main.ts's
 *  deferredFirstMesh, not the remesh pass). */
export function applyRecord(world: World, r: ChunkRecord): void {
  const c = world.ensureChunk(r.cx, r.cy, r.cz);
  c.blocks.set(r.blocks);
  c.meta.set(r.meta);
  c.wlevel.set(r.wlevel);
  c.wsource.set(r.wsource);
  c.wplaced.set(r.wplaced);
  c.wstream.set(r.wstream);
  c.settled = true;
  c.edited = true;
  c.dirty = false;
}

/** Node-testable backend; the `puts` counter is what the zero-persist guard asserts. */
export class InMemoryChunkStore implements ChunkStore {
  data = new Map<string, StoreValue>();
  puts = 0;
  deletes = 0;

  async get(key: string): Promise<StoreValue | undefined> {
    return this.data.get(key);
  }
  async put(key: string, rec: StoreValue): Promise<void> {
    this.puts++;
    this.data.set(key, rec);
  }
  async delete(key: string): Promise<void> {
    this.deletes++;
    this.data.delete(key);
  }
  async keys(): Promise<string[]> {
    return [...this.data.keys()];
  }
}

/** The streaming-side view of persistence (dependency inversion: streaming.ts depends
 *  on this; main.ts wires in a Persistence). Coord-based so streaming never deals in
 *  keys or records. */
export interface PersistSource {
  hasPersisted(cx: number, cy: number, cz: number): boolean;
  syncRecord(cx: number, cy: number, cz: number): ChunkRecord | undefined;
  fetchRecord(cx: number, cy: number, cz: number): Promise<ChunkRecord | undefined>;
  onUnload(c: Chunk): void;
  dropPersisted(cx: number, cy: number, cz: number): void;
}

const WARM_CAP = 512; // [POC shortcut] ~512 × 24 KB ≈ 15 MB; evict the oldest

/**
 * The persistence facade (ADR 0014):
 *  - key set preloaded at boot (D3): boot() loads every key of this seed (getAllKeys +
 *    prefix filter — no IDB index) so "is this chunk persisted?" is a sync check;
 *  - warm cache (D5): recently touched records, evicted oldest-first past the cap —
 *    same-frame sync restores;
 *  - fetch dedup: concurrent fetchRecord for one key shares one in-flight promise;
 *  - edited-only writes (D4/D6): onUnload snapshots a chunk only when c.edited;
 *  - error-tolerant (D7): a null or rejecting store degrades to session-only
 *    persistence (failed fetch → undefined → the caller drops the key → confirmed miss).
 */
export class Persistence implements PersistSource {
  private readonly store: ChunkStore | null;
  private readonly seed: number;
  private readonly warm = new Map<string, ChunkRecord>(); // insertion-ordered: oldest = first key
  private readonly persistedKeys = new Set<string>(); // preloaded at boot; updated on put/drop
  private readonly inFlight = new Map<string, Promise<ChunkRecord | undefined>>();
  private readonly pendingPuts = new Set<Promise<void>>();
  meta: WorldMeta | null = null;

  constructor(store: ChunkStore | null, seed: number) {
    this.store = store;
    this.seed = seed;
  }

  key(cx: number, cy: number, cz: number): string {
    return chunkRecordKey(this.seed, cx, cy, cz);
  }

  /** Load the key set + the world meta; resolves with the meta (null when absent).
   *  Never rejects: a store failure leaves an empty key set (D7). */
  async boot(): Promise<WorldMeta | null> {
    if (!this.store) return null;
    try {
      const keys = await this.store.keys();
      const prefix = `${this.seed}:`;
      for (const k of keys) if (k.startsWith(prefix)) this.persistedKeys.add(k);
      const m = await this.store.get(metaKey(this.seed));
      if (m && 'player' in m) this.meta = m;
    } catch {
      // D7: the store is unavailable (private mode, quota) — session-only persistence
    }
    return this.meta;
  }

  hasPersisted(cx: number, cy: number, cz: number): boolean {
    return this.persistedKeys.has(this.key(cx, cy, cz));
  }

  syncRecord(cx: number, cy: number, cz: number): ChunkRecord | undefined {
    return this.warm.get(this.key(cx, cy, cz));
  }

  fetchRecord(cx: number, cy: number, cz: number): Promise<ChunkRecord | undefined> {
    const k = this.key(cx, cy, cz);
    const hit = this.warm.get(k);
    if (hit) return Promise.resolve(hit);
    const existing = this.inFlight.get(k);
    if (existing) return existing;
    const p = (async (): Promise<ChunkRecord | undefined> => {
      if (!this.store) return undefined;
      try {
        const rec = (await this.store.get(k)) as ChunkRecord | undefined;
        if (rec && 'cx' in rec) this.cache(k, rec);
        return rec && 'cx' in rec ? rec : undefined;
      } catch {
        return undefined; // D7: failed fetch → the caller drops the key → confirmed miss
      } finally {
        this.inFlight.delete(k);
      }
    })();
    this.inFlight.set(k, p);
    return p;
  }

  /** Unload hook (D4/D6): an edited chunk is snapshotted into the warm cache AND written
   *  through to the store in the background; an unedited chunk (pristine terrain) is a no-op. */
  onUnload(c: Chunk): void {
    if (!c.edited) return;
    const k = this.key(c.cx, c.cy, c.cz);
    const rec = snapshotChunk(c);
    this.cache(k, rec);
    this.persistedKeys.add(k);
    if (!this.store) return;
    const p = this.store.put(k, rec).catch(() => undefined);
    this.pendingPuts.add(p);
    void p.then(() => this.pendingPuts.delete(p));
  }

  /** A stale/failed fetch: forget the key so streaming treats the chunk as a confirmed
   *  miss and generates it fresh (D7). */
  dropPersisted(cx: number, cy: number, cz: number): void {
    const k = this.key(cx, cy, cz);
    this.persistedKeys.delete(k);
    this.warm.delete(k);
  }

  saveMeta(m: WorldMeta): void {
    this.meta = m;
    if (!this.store) return;
    const p = this.store.put(metaKey(this.seed), m).catch(() => undefined);
    this.pendingPuts.add(p);
    void p.then(() => this.pendingPuts.delete(p));
  }

  /** Wait for the background writes (called on hide/pagehide). Never rejects. */
  flush(): Promise<void> {
    return Promise.all([...this.pendingPuts]).then(() => undefined).catch(() => undefined);
  }

  private cache(k: string, rec: ChunkRecord): void {
    if (this.warm.has(k)) this.warm.delete(k); // refresh recency (last = newest)
    this.warm.set(k, rec);
    while (this.warm.size > WARM_CAP) {
      const oldest = this.warm.keys().next().value as string;
      this.warm.delete(oldest); // [POC shortcut] evict the oldest; it re-fetches on demand
    }
  }
}