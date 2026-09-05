# 0014. World persistence — edited chunks snapshot to IndexedDB on unload and restore verbatim (water state included); light recomputes on load

- **Status:** Accepted
- **Last updated:** 2026-09-05
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

**Storage.** `IndexedDBChunkStore` — IndexedDB database `block-world` v1, single object
store `chunks`, one record per key, one short transaction per operation (records carry
typed arrays; structured clone stores them natively). `InMemoryChunkStore` is the
node-test backend. No IDB index: the key set is preloaded at boot via `getAllKeys()`
plus a `seed:` prefix filter (a world's keys are few — one per edited chunk — and the
prefix keeps multi-seed databases honest; an IDB index on the seed prefix is a follow-up
if the set grows). Store failures are swallowed by the facade: IDB unavailable (private
mode, quota) degrades to session-only persistence, and a failed/stale chunk fetch drops
the key (`dropPersisted`) so streaming generates that chunk fresh — a confirmed miss.

**The load path (warmer than generate).** `Persistence` keeps the preloaded key set and a
warm cache (`WARM_CAP = 512` records ≈ 15 MB, insertion-ordered, oldest evicted
**[POC shortcut]** — a byte-budgeted LRU is the follow-up). Streaming's `update` takes an
optional `PersistSource` and, for a chunk in the player's ring, resolves in order:
warm cache hit → restored inline this frame (`restored`); key known but not warm →
`pending` (fetch deduped per key — per-frame re-pending is a cheap map lookup; the
record applies when it lands, re-marks the chunk's seams dirty, restores the water sim,
loads the light, and defers the first mesh); key unknown → confirmed miss → generate
exactly as before (`rebuilt`). Because the key set is preloaded before the first frame
(boot gate, below), pre-arrival generation of a persisted chunk is impossible — the
restore-or-generate decision is made BEFORE any generation work, which is stricter than
generate-and-discard: a persisted chunk never costs its generation pass.

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

**Save points.** A chunk snapshots when it UNLOADS (the streaming path calls
`onUnload` → edited-only snapshot → warm + background IDB put). The meta saves when the
page hides (`visibilitychange` → hidden) and on `pagehide`, and after any unload batch
(the world just changed durably). `flush()` awaits the background puts at those moments.
The window between an edit and the next save point is lost on a hard tab kill **[POC
shortcut]** — interval snapshots (or per-edit meta saves) are the follow-up.

**The boot gate.** `main.ts` starts the game only once `persist.boot()` resolves (key set
+ meta loaded) — capped at 1.5 s: a stalled IDB must not hold the first frame hostage.
At start, the spawn column (chunk column `(0, ·, 2)`, `cy 0..4`) restores from records
when present (the measured-spawn scan then reads the RESTORED world) or generates
otherwise; the meta restores `WorldTime` (via a new `snapshot()`/`restore()` pair that
also exposes the private `phaseTotal`), the player pose, and the hotbar (a restored
`selected === 0` refreshes the `.sel` borders directly, since `select()` is a no-op at
its default). A meta resolving after the 1.5 s fallback is dropped — the fallback starts
a fresh world; that edge is documented, not handled.

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
- **Periodic whole-world snapshot.** Rejected: the loaded ring is at most ~125 chunks
  (~3 MB per snapshot at 24 KB) on a timer, versus the current "pay only for edits, at
  unload" model; the crash-window cost (edits since the last save point) is the accepted
  POC trade.
- **Full async load path (fetch-first streaming: the worldgen worker fetches the record
  and the chunk never touches the main thread synchronously).** Not built: the record
  shape is that payload, and the current sync-apply path (warm inline / pending fetch /
  confirmed miss) is the POC form. The async endgame reworks the streaming budget model
  the way the worldgen-worker TODO (ADR 0002) does for generation.

## Consequences

- **~24 KB raw per edited chunk.** No compression today; RLE/brotli on the arrays is the
  first follow-up (the arrays are highly run-length-compressible: whole columns of the
  same block). (TODO.md → Persistence.)
- **Warm cache cap 512 records ≈ 15 MB, oldest evicted.** Evicted records re-fetch on
  demand (one IDB read); a byte-budgeted LRU is the follow-up. (TODO.md → Persistence.)
- **Boot cost is one `getAllKeys` + one meta get** before the first frame (capped at
  1.5 s). At POC key-set sizes this is sub-millisecond; the key-set growth follow-up is
  an IDB index on the seed prefix. (TODO.md → Persistence.)
- **Crash window.** A hard tab kill loses edits made since the last save point (unload
  batch / hide / pagehide). Interval snapshots close it. (TODO.md → Persistence.)
- **The record is frozen at `v: 1`.** Bumping `v` is the only sanctioned migration path;
  older records are dropped on read (the chunk regenerates).
- **The pins hold.** The `water-load` PIN (1,231,601 / 10,690 processes) and the
  `remesh-perf` gate are untouched by persistence: restore never settles, and a no-edit
  replay has an empty `editQueue`, so sim queue membership/order and meshing costs are
  unchanged.
- **The light-persistence TODO is resolved by decision:** light fields are intentionally
  not persisted — the worker re-settles every restored chunk (exact, deterministic, and
  free of a second 8 KB/record cost).
- **IndexedDB under node is out of scope** **[POC shortcut]**: the IDB backend is verified
  in the browser (prof rig + manual checklist), not by node tests; the `InMemoryChunkStore`
  carries the unit suite.