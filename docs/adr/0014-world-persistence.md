# 0014. World persistence — edited chunks snapshot to IndexedDB on unload and restore verbatim (water state included); light recomputes on load

- **Status:** Accepted
- **Last updated:** 2026-09-06
- **Sources:** `docs/superpowers/specs/2026-09-05-chunk-persistence-design.md`,
  `docs/superpowers/plans/2026-09-05-chunk-persistence.md`
- **Resolves:** TODO.md → Sky & lighting — "Light persistence once a world save system
  exists" (resolved by decision: light is deliberately NOT persisted); supersedes the
  persistence design in PROJECT.md §12 (diff store + skip-for-v1 shortcut).

## Context

The world regenerates identically from `TERRAIN_SEED = 1234` (ADR 0002), so a refresh loses
only what the player did: block edits, the water they flowed (springs, drains, floods),
their position, the clock, and the hotbar. PROJECT.md §12 sketched a diff store
(per-chunk `Map<voxelIndex, blockId>`) plus a skip-for-v1 shortcut; it also assumed the
quota problem was decisive against full chunk arrays.

What forced the actual shape:

- **Water state is not derivable from the seed.** Placed water is an immortal spring
  (ADR 0005); its level/source/stream fields are the sim's memory. Replaying "diffs" of
  block ids cannot reproduce a drained cave or a flooded one — the six per-chunk arrays
  (`blocks`, `meta`, `wlevel`, `wsource`, `wplaced`, `wstream`) are the minimal complete
  record. Six `Uint8Array`s of 4096 cells (`CHUNK_VOL`) = 24,576 B ≈ 24 KB per edited chunk,
  raw. A POC-scale editing session touches a handful of chunks — IndexedDB holds tens of
  thousands of records comfortably; the §12 quota fear applies to a whole-world store,
  not an edited-chunk store.
- **The load path had a budget.** Streaming loads ≤1 chunk/frame and remeshes ≤1/frame
  (ADR 0002). A load that could miss (fetch) and a load that cannot (generate) need
  different handling, and the decision "does this chunk exist in the save?" must be
  available BEFORE the chunk is generated — otherwise a restored chunk is generated first
  and discarded (generate-and-discard).
- **Light is the one field that must not round-trip.** The light fields live in the
  worker's mirror, settle over ticks (ADR 0012), and cost 2 more 4096 arrays to persist.
  Re-settling a restored chunk from its blocks is exact (the light sim is deterministic
  over the chunk field) and cheaper than trusting a saved field across engine changes.
- **Untouched play must cost zero.** A walk with no edits persists nothing: not even
  regenerated terrain. The gate has to distinguish player-origin changes from
  generation and from the water sim's own settling.

## Decision

**What is saved.** Per chunk, `ChunkRecord { v: 1, cx, cy, cz, blocks, meta, wlevel,
wsource, wplaced, wstream }` — the six raw arrays, no light, no derived state. The record
is frozen at `v: 1` and is the shape a future async load path will fetch verbatim (the
sync payload). Plus one small `WorldMeta { v: 1, seed, player {x,y,z,yaw,pitch}, time
{time, tick, phaseTotal}, hotbar {slots, selected} }` under key `"${seed}:__meta__"`.
Chunk records live under `"${seed}:${cx},${cy},${cz}"`.

**The edit gate (why untouched play persists nothing).** `Chunk.edited` is set ONLY by
player-origin work: `World.setBlock` (default `markEdited = true`; same-value writes still
set it once) and the water sim's edit-origin tracking — the sim carries an `editQueue ⊆
queue` of cells whose flow traces back to a player edit (`remark(wx, wy, wz, origin)`
propagates the flag; the ordinary settle path marks `false`). Terrain generation and
worldgen-fluid settling never set it. A chunk unloads its snapshot only if `edited`;
a pure walk therefore writes zero records (pinned by a zero-put test).

**The save-generation gate (why a periodic save re-writes only what changed).** `edited`
decides whether a chunk is EVER persisted; two counters decide whether a GIVEN save needs
to write it. `Chunk.editGen` is bumped on every edit (the same `setBlock` `markEdited` path
that sets `edited`), and `Chunk.savedGen` is stamped `= editGen` each time a snapshot is
written to the store. A chunk is DUE when `edited && !(editGen > 0 && savedGen ===
editGen)` — edited AND out of sync. A restored chunk is seeded `editGen = savedGen = 1`
(in sync: nothing to write until the next edit bumps `editGen`). The `editGen > 0` guard
keeps chunks that set `edited` directly (tests, `editGen = savedGen = 0`) DUE. A periodic
save therefore re-writes only the chunks edited since the last save, not the whole edited
set; the unload path keeps writing a single `put` (one chunk at a time, unload frequency)
and caches the record warm for a fast inline reload.

**Storage.** `IndexedDBChunkStore` — IndexedDB database `block-world` v1, single object
store `chunks`, one record per key, one short transaction per operation (records carry
typed arrays; structured clone stores them natively). The save-point batch (`putMany`) is
ONE readwrite transaction — all-or-nothing, so a batch can't half-write (a mid-batch
structured-clone failure aborts it and commits nothing). `InMemoryChunkStore` is the
node-test backend. No IDB index: the key set is preloaded at boot with a PREFIX-BOUNDED
scan — `store.keys("seed:")` is an `IDBKeyRange.bound(prefix, prefix + '\uffff')` range
query on the IDB backend (a `startsWith` filter in memory), so a multi-seed store never
reads the other seeds' key space. A world's keys are few (one per edited chunk); an IDB
index on the seed prefix is a follow-up if the set grows. Store failures are swallowed by
the facade: IDB unavailable (private mode, quota) degrades to session-only persistence,
and a failed/stale chunk fetch drops the key (`dropPersisted`) so streaming generates that
chunk fresh — a confirmed miss. The IDB backend is unit-tested against `fake-indexeddb`
(round trip, `putMany` atomicity, `keys(prefix)`), not only the browser checklist.

**The load path (warmer than generate).** `Persistence` keeps the preloaded key set and a
warm cache (`WARM_CAP = 512` records ≈ 15 MB, insertion-ordered, oldest evicted
**[POC shortcut]** — a byte-budgeted LRU is the follow-up). The cache spans BOTH unloaded
records (`onUnload`) and cold-fetched records (`fetchRecord`, which are then loaded); the
save path (`saveLoaded`) deliberately does NOT pre-cache still-loaded chunks (pure waste
while loaded — `onUnload` re-caches the record when the chunk leaves), and evicting any
record is safe (a loaded chunk re-snapshots on unload; any record re-fetches on demand).
Streaming's `update` takes an optional `PersistSource` and, for a chunk in the player's
ring, resolves in order: warm cache hit → restored inline this frame (`restored`); key
known but not warm → `pending` (cold restore); key unknown → confirmed miss → generate
exactly as before (`rebuilt`). Because the key set is preloaded before the first frame
(boot gate, below), pre-arrival generation of a persisted chunk is impossible — the
restore-or-generate decision is made BEFORE any generation work, which is stricter than
generate-and-discard: a persisted chunk never costs its generation pass.

**Cold restore (one in-flight fetch per key, range-checked).** `main.ts` keeps a
`restoring` set of in-flight cold-restore keys: streaming re-pends a key every frame until
its record lands, so without the set a new `.then` continuation would be re-attached (and
the whole apply re-run) every frame. The key is added when the fetch starts and removed
when it settles. The cold-restore callback range-checks against the CURRENT player
position before applying: the player may have walked past the chunk since the fetch
started, and a stale record must not resurrect an out-of-range chunk (the record is
already cached warm by `fetchRecord`, so a later walk-back restores it inline).

**Water restore (the exactness contract).** Restored chunks are applied verbatim —
arrays `set()` onto the chunk, `settled = true` (D1: NO re-settle; the flood that existed
at save time is the flood at load time, byte-identical, pinned by a spring-flood
round-trip test against a no-save control) — and the sim's working state is rebuilt from
the arrays: springs re-queued from `wplaced`, the `waiting` set (cells blocked by an
unloaded lower chunk) rebuilt by a bottom-face scan (D2: derived, never persisted),
interior flow cells re-marked through the six faces without queueing (so the next tick
behaves exactly as at save time). The `water-load` PIN (1,231,601 / 10,690 processes) is
untouched: a no-edit replay has an empty `editQueue`, so queue membership, order, and the
process counts are unchanged.

**Save points.** A chunk snapshots (a) when it UNLOADS (the streaming path calls
`onUnload` — one `put`, and the record is cached warm for a fast inline reload) and (b) at
every save point below via `saveLoaded` — all currently-loaded, edited, OUT-OF-SYNC chunks
(the save-generation gate) are snapshotted in ONE `putMany` (one store transaction) along
with the meta. Save points: page hide (`visibilitychange` → hidden), `pagehide`, and a
**5 s periodic save** **[POC shortcut]**. `flush()` awaits the background writes at each.
The periodic save is the one that makes a hard reload safe: the `pagehide` put is
best-effort (the page can be torn down mid-transaction, so it may not commit — a 200 B
meta or a 24 KB chunk record alike), and edits in still-loaded chunks are otherwise only
captured when those chunks unload. The remaining loss window is a hard process kill (no JS
runs at all): at most ~5 s of edits **[POC shortcut]**.

**The boot gate.** `main.ts` starts the game only once `persist.boot()` resolves (key set
+ meta loaded) — capped at 5 s (raised from 1.5 s: a cold IndexedDB open on a slow device
can exceed 1.5 s and silently start a fresh world, losing the save; 5 s still bounds the
stall): a stalled IDB must not hold the first frame hostage. The fallback logs to the
console so a triggered cap is visible, not silent. At start, the spawn column (chunk
column `(0, ·, 2)`, `cy 0..4`) restores from records when present (the measured-spawn scan
then reads the RESTORED world) or generates otherwise; the meta restores `WorldTime` (via
a new `snapshot()`/`restore()` pair that also exposes the private `phaseTotal`), the
player pose, and the hotbar (a restored `selected === 0` refreshes the `.sel` borders
directly, since `select()` is a no-op at its default). A meta resolving after the 5 s
fallback is dropped — the fallback starts a fresh world; that edge is documented, not
handled.

## Alternatives

- **Diff store (PROJECT.md §12).** A per-chunk `Map<voxelIndex, blockId>` replayed over
  regenerated terrain. Rejected: it cannot represent water sim state (the arrays ARE the
  state), and replaying diffs onto regenerated terrain re-runs the whole generation +
  settle path per touched chunk for a saving of bytes that do not constrain IndexedDB at
  POC edit volumes. The quota objection applies to whole-world storage, not an
  edited-chunk store.
- **Persisting the sim's `queue`/`waiting`/`editQueue`.** Rejected (D2): they are derived
  working state — re-derivable from the arrays (springs from `wplaced`, waiting from a
  bottom-face scan) and version-fragile; persisting them would make the record depend on
  the sim's internal representation.
- **Settled-flag-gated restore (re-settle restored chunks).** Rejected (D1): settling a
  restored chunk re-simulates flow that had already converged at save time — a drained
  cave could reflood one cell, and the flood field would no longer be byte-identical to
  the saved world. `settled = true` + verbatim arrays is exact by construction; the
  pinned water-load numbers prove no-edit behavior is untouched.
- **Periodic whole-world snapshot.** Rejected: snapshotting the whole loaded ring
  (~125 chunks, ~3 MB) on a timer costs for terrain the player never touched. The
  periodic save instead re-saves only the edited + OUT-OF-SYNC set (a walk filtered by
  the edit gate and the save-generation gate) — zero cost for an untouched world, and
  bounded by the edits since the last save otherwise.
- **Full async load path (fetch-first streaming: the worldgen worker fetches the record
  and the chunk never touches the main thread synchronously).** Not built: the record
  shape is that payload, and the current sync-apply path (warm inline / pending fetch /
  confirmed miss) is the POC form. The async endgame reworks the streaming budget model
  the way the worldgen-worker TODO (ADR 0002) does for generation.

## Consequences

- **~24 KB raw per edited chunk.** No compression today; RLE/brotli on the arrays is the
  first follow-up (the arrays are highly run-length-compressible: whole columns of the
  same block). (TODO.md → Persistence.)
- **Warm cache cap 512 records ≈ 15 MB, oldest evicted.** The cache spans BOTH unloaded
  and cold-fetched (then-loaded) records; the save path does not pre-cache still-loaded
  chunks. Evicting a record is safe — a loaded chunk re-snapshots on unload, and an
  evicted record re-fetches on demand (one IDB read). A byte-budgeted LRU is the
  follow-up. (TODO.md → Persistence.)
- **Boot cost is a prefix-bounded key scan + one meta get** before the first frame (capped
  at 5 s): `store.keys("seed:")` is an `IDBKeyRange.bound` range query (IDB) / a `startsWith`
  filter (memory), so a multi-seed store never reads the other seeds' keys. At POC key-set
  sizes this is sub-millisecond; the key-set growth follow-up is an IDB index on the seed
  prefix. (TODO.md → Persistence.)
- **Crash window.** A hard process kill loses at most ~5 s of edits (the 5 s periodic
  save; the pagehide put is best-effort and can be torn down mid-transaction). A normal
  reload/tab switch is safe: the periodic + hide snapshots cover edits in still-loaded
  chunks, which the unload-only path used to lose. The periodic save writes only the
  edited + OUT-OF-SYNC chunks (the save-generation gate), so a steady-state walk (nothing
  edited since the last save) writes just the ~200 B meta — the old "re-save the whole
  edited set every 5 s" cost is gone. (TODO.md → Persistence.)
- **The record is frozen at `v: 1`.** Bumping `v` is the only sanctioned migration path;
  older records are dropped on read (the chunk regenerates).
- **The pins hold.** The `water-load` PIN (1,231,601 / 10,690 processes) and the
  `remesh-perf` gate are untouched by persistence: restore never settles, and a no-edit
  replay has an empty `editQueue`, so sim queue membership/order and meshing costs are
  unchanged.
- **The light-persistence TODO is resolved by decision:** light fields are intentionally
  not persisted — the worker re-settles every restored chunk (exact, deterministic, and
  free of a second 8 KB/record cost).
- **The IDB backend is node-tested.** `IndexedDBChunkStore` is unit-tested against
  `fake-indexeddb` (round trip with typed arrays intact, `putMany` atomicity, `keys(prefix)`);
  `InMemoryChunkStore` continues to carry the facade's unit suite. (Replaces the earlier
  "IndexedDB under node is out of scope **[POC shortcut]**" stance.)
- **Under-persisted cross-seam water (settled, not edit-origin).** When a player edit in
  chunk A lets water settle across a seam into a chunk B that is itself unedited, B's
  water cells are written by the settle path (`editOrigin = false`), so B is never marked
  `edited` and its record is NOT persisted. On reload B regenerates from terrain and is
  re-settled, converging to the identical water field — so the world is correct, but B
  pays a regenerate + re-settle instead of a verbatim restore (pinned by a round-trip test
  asserting B is absent from the store yet its water matches pre-unload after a few
  sim ticks). This is a consequence of the edit gate (settling must not persist), not a
  bug; the follow-up is propagating the edit-origin flag across seams so B is persisted.