# Spec: chunk persistence (world save/load), water state included

Status: design frozen for implementation (2026-09-05). Task brief:
`docs/plans/chunk-peristence.md`. Durable record after implementation: ADR 0014.

## Goal

Make chunk state durable across unload/reload and across page reloads. Today,
unloading a chunk drops it from `World.chunks` and reloading regenerates it from
the seed, so every block edit and every drop of player-placed water evaporates the
moment the player walks out of `VIEW_RADIUS`.

## What must be true

1. Break a block, walk far enough to unload the chunk, walk back: the block is still
   gone. Same for placed blocks, torches (with `meta`), doors (both halves,
   open/closed state).
2. Place a water spring, let it flood a cave that spans several chunks, walk away,
   come back: the flood is exactly as you left it and the spring is still emitting.
   Mine the spring, walk away mid-drain, come back: it finishes draining.
3. Reload the page: world edits, water, player position/yaw/pitch, `WorldTime`
   (time + tick), and hotbar contents are restored. Untouched terrain is still
   generated from the seed, not stored.
4. A fresh chunk (never persisted) loads exactly as it does today — same terrain,
   same settle, same light path. The `water-load.test.ts` replay budgets must not
   regress (PIN 1,231,601 / post-change 10,690 processes).
5. `npm test` and `npm run build` green.

## Design

### Record

One `ChunkRecord` per edited chunk — the six arrays that define world state:

```ts
interface ChunkRecord {
  v: 1;
  cx: number; cy: number; cz: number;
  blocks: Uint8Array;    // 4096
  meta: Uint8Array;      // torch/door per-cell state
  wlevel: Uint8Array;    // water flow level
  wsource: Uint8Array;   // source body flag
  wplaced: Uint8Array;   // placed-source (spring) flag
  wstream: Uint8Array;   // riding flag
}
```

~24 KB raw per chunk. Typed arrays survive structured clone — stored raw, no JSON,
no base64, no new dependency. **Light fields are intentionally absent** (ADR 0007
fixpoint, ADR 0012 worker-owned): a restored chunk goes through `lightSim.load()`
exactly like a fresh one. The record is a plain data object with a version field —
it is the future multiplayer sync payload.

World meta is a separate small record:

```ts
interface WorldMeta {
  v: 1;
  seed: number;
  player: { x, y, z, yaw, pitch };
  time: { time, tick, phaseTotal };      // WorldTime.snapshot()
  hotbar: { slots: number[], selected };
}
```

### Keys and storage

- Chunk key: `"${seed}:${chunkKey}"` (`"1234:0,1,2"`). Meta key: `"${seed}:__meta__"`.
  The seed is part of the key so a seed change yields a fresh world instead of
  applying old edits to new terrain.
- Backend: a pluggable `ChunkStore` interface (`get`/`put`/`delete`/`keys`, all
  async). `InMemoryChunkStore` for vitest (node has no IndexedDB);
  `IndexedDBChunkStore` in the browser (database `block-world` v1, one object store
  `chunks`, one record per key).
- The `Persistence` facade owns:
  - a **key set preloaded at boot** (`getAllKeys` + seed-prefix filter — no IDB
    index), so "is this chunk persisted?" is a sync check;
  - a **warm cache** of recently touched records (cap 512 ≈ 15 MB, evict oldest —
    `[POC shortcut]`), giving same-frame sync restores;
  - **fetch dedup** (concurrent `fetchRecord` for one key shares one in-flight
    promise) and a `flush()` for pending background writes.
- Error tolerance: a null or rejecting store degrades to session-only persistence —
  a failed fetch resolves `undefined`, the key is dropped, and the chunk generates
  fresh (a confirmed miss). The game must never break because the store is down.

### Edit gate — only persist chunks that differ from worldgen

`Chunk.edited` (distinct from the mesh `dirty` flag) is set only by work that
originates from a player edit:

- `World.setBlock(…, markEdited = true)` — the player path (break/place/door/torch).
- The water sim threads a per-cell **work origin** (edit vs. settle/worldgen) through
  its whole pipeline (`setState` → `setBlock(markEdited = origin)`). Only
  edit-origin flow marks a chunk edited.
- NOT set by `generateChunkTerrain` (writes arrays directly) or the worldgen
  `settleSeed` bulk write.

Rationale: the worldgen settle's pass-2 relaxation goes through
`writeCell → setBlock`, which would otherwise mark deterministic cave-flooding as
edited and persist chunks that regenerate identically. With origin tracking, a
60-second walk with no edits persists **zero** chunks (pinned by a guard test).

### Load path — sync unload, instant revisit

`streaming.update()` is sync and budgeted per frame; IndexedDB is async. The split:

1. **Warm record** → applied inline (same frame, before any generation). Restored
   chunks bypass the generation budget: applying a record is array copies (µs), and
   the first mesh is paced by main.ts's frame-end rebuild budget like a load.
2. **Key-set hit without a warm record** → *pending*: main.ts fetches async and
   applies on landing. The chunk is **never generated while its key is known** —
   generation happens only on a confirmed miss (no key, or a dropped/stale record).
   This is stricter than "generate now, discard the late record": with the boot-time
   key preload, generation-before-record-arrival cannot happen at all.
3. **Confirmed miss** → terrain generation exactly as today (budget 1/call).

On unload, `Persistence.onUnload(chunk)` snapshots **edited** chunks into the warm
cache synchronously and writes through to the store in the background. Pending
writes flush on `visibilitychange` (hidden) and `pagehide`.

### Water restore — as-is, no re-simulation (the Minecraft model)

A persisted chunk restores `blocks`/`meta`/`wlevel`/`wsource`/`wplaced`/`wstream`
verbatim and comes back with `settled = true`, so `sim.settle()` is a no-op on it.
No re-settle: re-running the worldgen settle over a restored chunk would re-flood a
drained cave or re-drain a flooded one. `WaterSim.restore(chunk)` rebuilds only the
sim's in-memory state from the arrays:

- **springs**: re-registered from `wplaced` (the set is in-memory only; springs are
  re-queued every pulse, so a restored spring resumes emitting on its own);
- **waiting**: NOT persisted — rebuilt from the bottom face: a water cell whose
  below-chunk is missing was a parked fall (`cy > MIN_CY && !hasChunk(cx, cy-1, cz)`);
- **seams**: the water cells on the chunk's six faces (≤ 6×256) are re-enqueued (the
  7-cell closure each) so cross-seam state re-derives — a restored chunk's water may
  have been mid-flow at its boundary when it unloaded, and its neighbour may be fresh
  or restored from a different moment. The interior is NOT enqueued: it sits at its
  saved fixpoint, so a restored chunk with nothing new adjacent generates ~zero water
  work.

A mid-drain save restores mid-drain state and keeps draining: the queue rebuilt from
the saved arrays carries the flow to the same fixpoint a no-save world reaches
(pinned by the water round-trip test).

### Save points and boot

- Chunk snapshots: on unload (edited chunks only). `[POC shortcut]` a hard tab kill
  loses edits made since the last unload/hide.
- Meta: on unload, on `visibilitychange` (hidden), and on `pagehide`, then
  `flush()`. `beforeunload` alone is not reliable.
- **Boot gate**: the game starts once `persist.boot()` resolves (key set + meta),
  capped at 1.5 s (a stalled IDB must not hold the first frame; the fallback starts
  a fresh world and a late meta is dropped — documented edge). The boot column
  (0,·,2) restores from its records when present, else generates as before; the
  measured-spawn scan runs after the column exists either way.

## Non-goals

Multiplayer/transport (the record is the future payload), compression (raw ~24 KB is
fine now — RLE/sparse-diff noted as a follow-up), light persistence (recomputed by
design), multiple save slots (one world per seed).

## Tests

- `world.test.ts`: `edited` set by `setBlock`, not by terrain generation, not when
  `markEdited` is false.
- `time.test.ts`: `WorldTime.snapshot()/restore()` round trip (incl. the private
  `phaseTotal` via `dayPhase`/`day`/`hour`).
- `persistence.test.ts` (new, in-memory store):
  - origin tracking: settle + pulses on generated chunks never mark edited; a
    player-placed spring marks its own chunk AND the chunk its flow floods edited.
  - `WaterSim.restore`: springs rebuilt from `wplaced`; face water cells enqueued,
    interior not; `waiting` rebuilt from the bottom face (and not when the band below
    exists).
  - records: `snapshotChunk`/`applyRecord` byte-for-byte round trip; `settled = true`;
    edited-only `onUnload`; warm-cache eviction past the cap; fetch dedup; boot key
    set seed-prefix filtered + meta.
  - full path: torch + open door round trip (block AND meta); a 600-frame no-edit
    walk with water settling + pulses persists **zero** chunks (the D4 guard).
- `persistence-water.test.ts` (new): spring flood across a chunk boundary — the water
  fingerprint (all water cells' block/wlevel/wsource/wplaced/wstream) is identical
  after unload + restore + drain, and stable over 10 more pulses; mine the spring,
  save mid-drain (2 cells re-derived), restore, drain — the fixpoint matches the
  no-save control world.
- `streaming.test.ts`: warm restore (edited chunk unloads → 1 put → walk back →
  restored inline, `settled = true`, edit intact); cold key-set hit (fresh
  `Persistence` over the same store → `pending`, never generated, async apply);
  confirmed miss generates exactly as before.
- `water-load.test.ts`: untouched — the PIN must hold (the restore path never settles;
  the `process` prototype patch stays compatible with the new optional origin arg).

## Decisions log

| # | Decision |
|---|----------|
| D1 | Water restored as-is, `settled = true`, no re-settle. |
| D2 | `waiting` rebuilt on restore (bottom-face scan), not persisted. |
| D3 | Boot-time key-set preload + warm cache; generation only on a confirmed miss. |
| D4 | Edit-origin tracking in the water sim (`editQueue ⊆ queue`); no-edit walk → 0 chunks persisted. |
| D5 | Warm cache cap 512 (~15 MB), evict oldest — `[POC shortcut]`. |
| D6 | Snapshot on unload only; hard tab kill loses in-flight edits — `[POC shortcut]`. |
| D7 | Store failure → session-only persistence; failed fetch → drop key → confirmed miss. |