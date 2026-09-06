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
  /** One transaction for every entry (all-or-nothing): the save-point batch. */
  putMany(entries: [string, StoreValue][]): Promise<void>;
  delete(key: string): Promise<void>;
  /** All keys, or — with a prefix — only the keys under it (the per-seed boot scan). */
  keys(prefix?: string): Promise<string[]>;
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
 *  unload re-snapshots it); editGen = savedGen = 1 (restored AND in sync — nothing to
 *  write until the next edit bumps editGen); dirty = false (its first mesh goes through
 *  main.ts's deferredFirstMesh, not the remesh pass). */
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
  c.editGen = 1;
  c.savedGen = 1;
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
  /** In-memory "transaction": a plain loop (atomicity is free — no I/O to fail). */
  async putMany(entries: [string, StoreValue][]): Promise<void> {
    for (const [key, rec] of entries) {
      this.puts++;
      this.data.set(key, rec);
    }
  }
  async delete(key: string): Promise<void> {
    this.deletes++;
    this.data.delete(key);
  }
  async keys(prefix?: string): Promise<string[]> {
    const all = [...this.data.keys()];
    return prefix ? all.filter((k) => k.startsWith(prefix)) : all;
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

// Warm cache cap (D5). [POC shortcut] ~512 × 24 KB ≈ 15 MB; evict the oldest first.
// The cache spans BOTH unloaded records (onUnload) and cold-fetched records (fetchRecord,
// which are then loaded). The save path (saveLoaded) deliberately does NOT pre-cache
// still-loaded chunks — they are pure waste while loaded (the arrays are in the world) and
// onUnload re-caches the record when the chunk actually leaves. Evicting ANY record (loaded
// or unloaded) is safe: a loaded chunk re-snapshots on unload, and any record re-fetches on
// demand. (Byte-budgeted LRU is the follow-up — TODO.md → Persistence.)
const WARM_CAP = 512;

/**
 * The persistence facade (ADR 0014):
 *  - key set preloaded at boot (D3): boot() scans ONLY this seed's keys (store.keys("seed:") —
 *    an IDBKeyRange.bound prefix scan on the IDB backend, a startsWith filter in memory) so
 *    "is this chunk persisted?" is a sync check and a multi-seed store never reads the other
 *    seeds' key space;
 *  - warm cache (D5): recently touched records, evicted oldest-first past the cap —
 *    same-frame sync restores;
 *  - fetch dedup: concurrent fetchRecord for one key shares one in-flight promise;
 *  - edited-only writes (D4/D6): onUnload snapshots a chunk only when c.edited;
 *  - save-generation gate: a chunk is written only when out of sync (savedGen !== editGen),
 *    so a periodic save re-writes only what changed since the last save — not the whole world;
 *  - batched save points: saveLoaded writes every DUE chunk + the meta in ONE putMany (one
 *    store transaction) instead of one put per chunk;
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
      const keys = await this.store.keys(`${this.seed}:`); // per-seed scan (IDBKeyRange bound; no full-keyset read)
      for (const k of keys) if (k.startsWith(`${this.seed}:`)) this.persistedKeys.add(k);
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

  /** The write gate (single source of truth): a chunk is DUE when it is edited (the D4/D6
   *  boolean gate) AND out of sync with the store (savedGen !== editGen). The `editGen > 0`
   *  guard keeps chunks that set `edited` directly (editGen = savedGen = 0) DUE. */
  private isDue(c: Chunk): boolean {
    return c.edited && !(c.editGen > 0 && c.savedGen === c.editGen);
  }

  /** Unload hook (D4/D6): every edited chunk is snapshotted into the warm cache (fast inline
   *  reload on walk-back) and marked persisted; an OUT-OF-SYNC chunk is additionally written
   *  through to the store in the background (one put — unload frequency). An unedited chunk
   *  is a no-op. */
  onUnload(c: Chunk): void {
    if (!c.edited) return;
    const k = this.key(c.cx, c.cy, c.cz);
    const rec = snapshotChunk(c);
    this.cache(k, rec);
    this.persistedKeys.add(k);
    if (!this.isDue(c)) return; // in sync: the store already holds it
    c.savedGen = c.editGen;
    if (!this.store) return;
    const p = this.store.put(k, rec).catch(() => undefined);
    this.pendingPuts.add(p);
    void p.then(() => this.pendingPuts.delete(p));
  }

  /** Save-point batch (5 s periodic / hide / pagehide): snapshot every DUE loaded chunk plus
   *  the meta record and write them ALL in one putMany (one store transaction). Still-loaded
   *  chunks are deliberately NOT cached warm here — onUnload re-caches them when they leave. */
  saveLoaded(chunks: Iterable<Chunk>, meta: WorldMeta): void {
    this.meta = meta;
    if (!this.store) return;
    const entries: [string, StoreValue][] = [];
    for (const c of chunks) {
      if (!this.isDue(c)) continue;
      const k = this.key(c.cx, c.cy, c.cz);
      const rec = snapshotChunk(c);
      c.savedGen = c.editGen;
      this.persistedKeys.add(k);
      entries.push([k, rec]);
    }
    entries.push([metaKey(this.seed), meta]);
    const p = this.store.putMany(entries).catch(() => undefined);
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