# Task: chunk persistence (world save/load), water state included

## Problem

Unloading a chunk drops it from `World.chunks` and reloading regenerates it from the seed, so every block edit and every drop of player-placed water evaporates the moment the player walks out of `VIEW_RADIUS`. Fix this by making chunk state durable across unload/reload and across page reloads.

Read `PROJECT.md`, `docs/adr/README.md`, ADR 0002 (world model), ADR 0005 (water sim), ADR 0011 (simulation clocks), and the `TODO.md` note "Light persistence once a world save system exists" before starting. Follow the house workflow: write the spec and plan under `docs/superpowers/` first, then implement, then distill into a new ADR (0014) and update `TODO.md`.

## What must be true when you're done

1. Break a block, walk far enough to unload the chunk, walk back: the block is still gone. Same for placed blocks, torches (with `meta`), doors (both halves, open/closed state).
2. Place a water spring, let it flood a cave that spans several chunks, walk away, come back: the flood is exactly as you left it and the spring is still emitting. Mine the spring, walk away mid-drain, come back: it finishes draining.
3. Reload the page: world edits, water, player position/yaw/pitch, `WorldTime` (time + tick), and hotbar contents are restored. Untouched terrain is still generated from the seed, not stored.
4. A fresh chunk (never persisted) loads exactly as it does today — same terrain, same settle, same light path. The `water-load.test.ts` replay budgets must not regress.
5. `npm test` and `npm run build` green.

## Design constraints — these are decisions, not suggestions

**Persist water state as-is; do not re-simulate on load.** This is the Minecraft model: water arrays are saved with the chunk and restored verbatim. Concretely, a persisted chunk restores `blocks`, `meta`, `wlevel`, `wsource`, `wplaced`, `wstream`, and comes back with `settled = true` so `sim.settle()` is a no-op on it. Do NOT re-run the worldgen settle over a restored chunk — that is what would re-flood a drained cave or re-drain a flooded one.

**Simulate only when something changed.** The water queue is closed under `writeCell` re-marking, so a restored chunk with nothing new adjacent to it should generate zero water work. The two things that *are* changes on load and need re-marking:
- Restored `wplaced` cells must be re-registered in `WaterSim.springs` (the set is in-memory only; rebuild it from the array on restore). Springs are re-queued every pulse already, so this alone makes a restored spring resume emitting.
- Seam cells. A restored chunk's water may have been mid-flow at its boundary when it unloaded, and its neighbour may be fresh (regenerated) or restored from a different moment. On restore, `enqueue()` the water cells on the chunk's six faces (≤ 6×256 cells, cheap) so cross-seam state re-derives. Do not enqueue the interior.

`WaterSim.waiting` (falls that stopped at ungenerated space) should also survive: either persist it as part of the chunk's record, or rebuild it on restore from cells whose "below" is missing. Pick one and document why.

**Light is recomputed, not persisted.** `blight`/`skylight`/`colSum` are order-independent fixpoints (ADR 0007) and live on the worker in production (ADR 0012). A restored chunk goes through `lightSim.load()` exactly like a fresh one. Leave the TODO.md light-persistence item open but note in the ADR that the storage record is where it would land.

**Storage is a pluggable interface, IndexedDB in the browser.** vitest runs in node with no DOM, so define something like:

```ts
interface ChunkStore {
  get(key: string): Promise<ChunkRecord | undefined>;
  put(key: string, rec: ChunkRecord): Promise<void>;
  delete(key: string): Promise<void>;
  // plus a small "world meta" record: seed, player transform, worldTime, hotbar
}
```

with an in-memory implementation used by tests and an IndexedDB implementation (one object store, keyed by `"${seed}:${chunkKey}"`) used by `main.ts`. Typed arrays survive structured clone, so store them raw — no JSON, no base64. Don't add a dependency for this.

**Unload must stay synchronous and revisit must be instant.** `streaming.update()` is sync and budgeted per frame; IndexedDB is async. So: on unload, snapshot the chunk's arrays into an in-memory `Map<string, ChunkRecord>` (the "warm cache") synchronously, and write through to IDB in the background. On load, check the warm cache first (sync hit → restore immediately in the same frame), then IDB (async miss → generate fresh terrain now as today, and if a record arrives later, discard it — a chunk that was regenerated and then edited must never be clobbered by a stale async read; simplest rule is "IDB is consulted before generation, and generation only happens on a confirmed miss"). Decide whether that means the load path becomes an async two-hop (this is the same shape the TODO's worldgen-worker item needs — design it so that project can reuse it) or whether you preload the IDB index of persisted keys at boot so the miss check is sync. Preloading the key set at boot is probably the right call for now; say so in the ADR either way.

Also flush pending IDB writes on `visibilitychange` (hidden) and `pagehide`. `beforeunload` alone is not reliable.

**Only persist chunks that differ from worldgen.** Add an `edited: boolean` to `Chunk`, distinct from the mesh `dirty` flag. Set it in `World.setBlock` and in `WaterSim.setState`, but NOT during `generateChunkTerrain` or the worldgen `settleSeed` bulk write. Watch out: the worldgen settle's pass-2 relaxation goes through `writeCell → setBlock`, which would mark deterministic cave-flooding as edited and persist chunks that regenerate identically. That's a correctness-neutral waste; decide whether to tolerate it or gate `edited` behind a `sim.settling`-style flag, and measure how many chunks get saved on a 60-second walk with no edits. Aim for zero.

**Seed is part of the key.** `TERRAIN_SEED` is a constant today; key every record by seed anyway so changing the seed later gives a fresh world instead of applying old edits to new terrain.

## Non-goals for this task

- Multiplayer, networking, or any transport. But the `ChunkRecord` type IS the future sync payload, so keep it a plain data object (no class instances, no closures) and version it (`v: 1`).
- Compression. Raw arrays are ~24 KB/chunk; fine for now. Note in the ADR where RLE or a sparse-diff encoding would go if it matters later.
- Light persistence (see above).
- Multiple named saves / save slots. One world per seed.

## Tests to add

- `world.test.ts`: `edited` set by `setBlock`, not by terrain generation.
- New `persistence.test.ts` against the in-memory store: edit → unload → reload round-trips blocks + meta; water arrays round-trip byte-for-byte; a restored chunk has `settled = true`; a restored spring is in `springs` after restore; seam cells are enqueued and interior cells are not.
- Extend the `water-load.test.ts` replay (or add a sibling): flood a cave across a chunk boundary, unload one side, reload it, assert no water cell changes on the next N pulses (the "simulate only on change" property), then mine the spring and assert it drains to the same fixpoint it would have reached without the unload.
- A guard that walking with no edits persists zero chunks (or whatever number you decide to tolerate — pin it).

## Deliverables

- Spec + plan in `docs/superpowers/`.
- Code + tests.
- `docs/adr/0014-world-persistence.md` following the existing ADR format (Context / Decision / Alternatives / Consequences), added to the ADR README table.
- `TODO.md`: remove nothing, add follow-ups for compression, light persistence hook, and the async load path if you chose the boot-time key preload.
- A short section in `README.md` under Features.

Keep the existing house style: no reference engine named, pinned numbers verbatim, `[POC shortcut]` tags on anything you deliberately punted.