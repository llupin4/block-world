# Spec: multiplayer pre-work — entities must survive an unedited chunk's unload

Status: design frozen for implementation (2026-09-07). Prerequisite for the multiplayer
session model (`2026-09-07-multiplayer-session-design.md`, phase A). No ADR of its own —
the three fixes are correctness repairs that phase A depends on; their rationale is folded
into ADR 0018's Context.

## Why

Multiplayer runs one authoritative host whose chunks are loaded and unloaded constantly as
client rings move. Today an entity only persists when it is riding an **edited** chunk, and
a deer column is re-topped whenever that chunk is remeshed. Both break the moment a chunk
loads/unloads for reasons other than a player edit, which is exactly the multiplayer case.
Three repairs, each pinned by a test, make entity state round-trip through an unedited
chunk and stop population from growing over time.

## The three bugs (as of this spec)

1. **Unedited chunks never snapshot, so their entities are lost.** `Persistence.onUnload`
   returns early on `if (!c.edited)` (persistence.ts:287). `streaming.update` already
   collects the chunk's entities and hands them to `onUnload` (streaming.ts:143), but the
   gate drops them when the chunk was never edited by a player. A deer that wanders out of
   an edited chunk into a pristine one is despawned on unload (main.ts:1097-1098) and never
   comes back.
2. **Remesh re-tops a column, so population grows.** `streaming.update` conflates freshly
   **generated** and dirty-**remeshed** chunks in one `rebuilt` list (streaming.ts:31,
   :117-121, :133-135). `main.ts:1106` runs `spawnDeer` on every rebuilt column. `spawnDeer`
   skips a column already at its cap (spawn.ts:47) but tops a column back to `count` when a
   deer has wandered off, so every remesh of a partially-occupied column adds a deer.
3. **`Sim.despawn`'s viewed fallback is nondeterministic.** entity.ts:560-561 falls back to
   the first key of the `Map` (insertion order), not the lowest id. Deterministic id-order
   fallback matters once the host despawns remote players.

## Decisions

### D1 — A chunk with entities snapshots on unload regardless of `edited`

Entities are state that differs from worldgen by definition, so a chunk holding them is due
for a snapshot whether or not a player edited it.

- `Persistence.onUnload(c, entities?)` proceeds when `c.edited` **or** `entities` is
  non-empty, and forces the store write in the unedited-with-entities case.
- After the round trip, `applyRecord` (persistence.ts:99-103) sets `edited = true` and
  `editGen = savedGen = 1`, so the chunk is "in sync" and will not be rewritten on later
  unloads. Only the *first* unload of an unedited chunk that gained entities writes through.
- `saveLoaded` (the 5 s / hide / pagehide save-point path) is **not** changed: the player's
  pose rides `WorldMeta.entities`, and only the unload path is in scope (matching the brief).
  `[POC shortcut]` a crash between unloads can leave a deer's pose stale at the last save
  point; a deer is lost only if the page dies, not on a normal walk-away.

The single-player consequence (a chunk that merely hosted a deer is now persisted with its
pristine terrain) is accepted: correctness over a few extra records, and it is the exact
behavior the host needs.

### D2 — Split `rebuilt` into `generated` and `remeshed`; `spawnDeer` only on `generated`

`StreamingUpdate` gains `generated: Coord[]` (fresh terrain generation) and
`remeshed: Coord[]` (dirty rebuild). `rebuilt` is kept as their concatenation (load-pass
order first, then remesh-pass order — byte-identical to today's order) so `main.ts`'s
settle/light/mesh loop over `r.rebuilt` is untouched. `main.ts:1106` changes from
`for (const c of r.rebuilt) spawnDeer(...)` to `for (const c of r.generated) spawnDeer(...)`.

Consequences: a freshly generated column populates (up to its cap); a remeshed column keeps
exactly the deer it still has; a restored column keeps its persisted deer (the `restored`
path never spawns). `spawnDeer`'s existing per-column idempotency (spawn.ts:47) becomes the
only spawn path.

### D3 — `Sim.despawn` viewed fallback picks the lowest id

Replace the `Map` insertion-order fallback (entity.ts:560-561) with the first element of
`this.all()` (already id-ordered). Deterministic, and reads `all()` so there is no second
ordering to keep in sync.

## What must be true

1. `src/__tests__/persistence.test.ts`: an **unedited** chunk carrying entities snapshots on
   `onUnload` (the warm `syncRecord` returns a record carrying those entities, and a store
   write is issued); an unedited chunk with **no** entities is a no-op (no cache, no write).
2. `src/__tests__/streaming.test.ts`: a fresh generate lands in `generated`; a dirty remesh
   lands in `remeshed`; a generate + remesh in one call partition correctly; `rebuilt` is
   the union and preserves the current order.
3. `src/__tests__/entity.test.ts`: despawning the viewed (highest) id sets viewed to the
   lowest remaining id; despawning the lowest sets viewed to the next lowest.
4. Every existing pin holds (`water-load` 1,231,601/10,690, `mesher-budget`, the
   `stepEntity ≡ Player` 1e-9 pin, `spawn`/`streaming`/`persistence` suites green).
5. `npm test` and `npm run build` green.

## Pinned numbers (must not regress)

`WARM_CAP 512`, `VIEW_RADIUS 2`, `CY 0..4`, `LOAD_BUDGET 1`, `REMESH_BUDGET 1`,
`TERRAIN_SEED 1234`, `CHUNK_VOL 4096`; the `water-load` PIN 1,231,601 / 10,690; the
`mesher-budget` pins; `spawnDeer` default `count = 2`.

## Non-goals

- No change to the save-point (`saveLoaded`) entity handling (D1's `[POC shortcut]`).
- No change to how the *player's* pose is persisted (that stays in `WorldMeta`).
- No multiplayer transport, session, or loopback — that is phase A.