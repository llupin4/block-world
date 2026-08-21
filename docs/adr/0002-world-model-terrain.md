# 0002. World model & terrain — a 16³ chunk store with cross-seam get/set and neighbour dirty-marking, over seeded seam-free terrain generation with pinned measured constants and budgeted radius-2 streaming

- **Status:** Accepted
- **Last updated:** 2026-08-20
- **Sources:** (superseded by this ADR; recoverable via `git show 0cf878c:<path>`)
  - `docs/superpowers/plans/2026-08-15-voxel-sandbox-poc.md` (Task 2 — blocks, Task 3 — world, Task 4 — terrain, Task 9 — spawn, Task 10 — streaming)
  - `PROJECT.md` (§3 Block registry, §4 World representation, §5 Terrain generation, §9 Water — streaming-budget numbers, §11 Chunk streaming)
  - `docs/superpowers/2026-08-15-voxel-sandbox-poc-execution-notes.md` (deviations D1, D2, D4, D5)
  - `docs/superpowers/specs/2026-08-16-water-simulation-design.md` ("Data model" section)
  - `docs/superpowers/plans/2026-08-19-dynamic-lighting.md` (Task 2 — chunk light fields)

## Context

The sandbox needs an infinite-feeling world that is actually a finite, budgeted set of chunks around the player: a store that can be read and written across chunk seams without special-casing, a deterministic terrain generator whose output the tests can pin exactly, and a streaming loop that loads/meshes/unloads chunks a few at a time so walking into new terrain never freezes the tab. Most voxel bugs are indexing bugs, so the core constants were chosen once and never deviated from. This ADR covers the block registry, the chunk world store, terrain generation, the spawn decision, and the streaming ring.

## Decision

### Block registry (`src/blocks.ts`)

A plain TS `enum Block` + `Record<number, BlockDef>` (spec deviation D1 — cleaner typing than a `const`-asserted object, same values/ordering). The POC registry has 10 kinds: `Air = 0, Stone, Dirt, Grass, Sand, Water, Wood, Leaves, Glass, Planks`. Each `BlockDef` carries `solid`, `transparent`, and a per-face tile map `faces: [number × 6]` in the order `[+X, −X, +Y, −Y, +Z, −Z]`. Two flags, not one: `Water` is transparent and non-solid; `Glass` and `Leaves` are transparent but solid — conflating them causes the classic "can't walk through leaves but can walk through glass" bug. `isOpaque(b)` = `b !== Air && !BLOCKS[b].transparent`. `PLACEABLE` lists the 9 placeable blocks (never Air); `iconTile(b)` reads `faces[2]` (the top-face tile doubles as the UI icon, ADR 0010 — UI & inventory). The registry was later extended by ADR 0009 — Special blocks (torch/door + per-cell `meta`) and ADR 0007 — Dynamic lighting (per-block `light`/`opacity` fields).

### Chunk world store (`src/world.ts`)

Cubic `CHUNK_SIZE = 16` chunks (`CHUNK_VOL = 4096`). Local index `idx = lx + lz·16 + ly·256` (y-major, so vertical columns are strided). `World` is a `Map<key, Chunk>` keyed `${cx},${cy},${cz}`; a `Chunk` holds `blocks: Uint8Array(4096)` (D9 — the 10 block values fit in a byte), a `dirty` flag, and the two mesh buffers (`opaqueMesh`, `transMesh`). Later features added per-chunk typed arrays alongside `blocks` — the water state arrays (`wlevel`/`wsource`/`wplaced`/`wstream`, owned by ADR 0005 — Water simulation), the per-cell `meta` array (ADR 0009 — Special blocks), and the two 0–15 light fields plus `World.getLight` (ADR 0007 — Dynamic lighting) — all streamed and unloaded with the chunk.

- **Cross-seam get/set.** `getBlock(x,y,z)` reads through `x >> 4` / `x & 15` (which handle negative coordinates correctly — `-1 >> 4 === -1`, `-1 & 15 === 15`; `Math.floor(x/16)` and `x % 16` do not) and returns Air for missing chunks. `setBlock` writes the cell and marks the chunk **and its 6 face-neighbours** dirty unconditionally ([POC shortcut]: marking all 6 rather than only the affected one costs a few wasted remeshes and saves a branch you'll get wrong). It no-ops on an identical value and on missing/out-of-range chunks.
- **Dirty contract.** The `dirty` flag is the contract with the mesher and the streamer: `rebuildChunkMesh` clears it after building, and the streaming dirty-scan is a safety net that catches chunks marked dirty while their mesh is stale or absent (every generated chunk starts dirty; missing chunks can't be marked).
- **`settled` flag.** A per-chunk `settled` boolean was added with the water sim (origin: ADR 0005) to track whether a chunk's water state has been settled after load.

### Terrain generation (`src/terrain.ts`)

Seeded, per-chunk, **vertically seam-free**: the height/cave functions are pure in world coordinates, so adjacent chunks agree on shared cells. `TerrainGen(seed)` wraps `simplex-noise` (pinned to `4.0.3`, ADR 0001) with a mulberry32 PRNG. `TERRAIN_SEED = 1234`, `SEA_LEVEL = 32`.

- **Height:** 4 octaves (freqs `[0.008, 0.02, 0.05, 0.11]`, amps `[1, 0.5, 0.25, 0.125]`), amplitude-normalized → ≈ [−1, 1]; `height = floor(SEA_LEVEL + (h/norm)·20)` → range 12..52.
- **Fill:** above `h` is Water up to `SEA_LEVEL` else Air; below `h−4` is Stone; `h−4..h−1` is Dirt; the surface row is Sand below sea level else Grass. Caves carve stone/dirt below sea level where `caveAt > 0.55` — and caves carve **Air** (not water), so a cave under the sea is an air pocket, not a second water body.
- **Trees:** deterministic per column — land columns (`h ≥ SEA_LEVEL+1`) with `hash2(seed, wx, wz) < 0.02` get a wood trunk of height `4 + floor(hash2(seed ^ 0x51ab, wx, wz)·3)` (4..6) and an air-replacing leaf canopy (radius 2 then 1, corners trimmed). A margin of 3 (columns `lx,lz ∈ [3,12]`) keeps the r=2 canopy inside the chunk.
- **Measured-constants pinning.** All test expectations were measured against the real `simplex-noise@4.0.3` (seed 1234, full 5×5 band): height range **[19…43]**, **24936** water cells (re-pinned after the cave→Air change; the pre-change figure was 45395), stone under all 25 sample columns, **21 trees** in the band (1 inside the 3×3 spawn area). These pinned constants are authoritative — they are what make the rendered world match the tested world.

### Spawn (measured)

Spawn is on **measured ground**, not a hardcoded plateau. The plan's original `(33,41)` turned out to be a **sea-basin column in both PRNG variants** (deviation D4), so the spawn moved to **(6,46)** — the nearest clean grass column: surface Grass @ y=33, feet y=34, no tree in the column, sea starting 3 m east (first water x=9 at y=32). A measured-spawn scan drops from the top of the band (y=79) to the first opaque voxel; for an open-sea column it would land on the sand floor and the player would swim up. Falling below `WORLD_Y_MIN` respawns the player at the void floor. (Cascade: T10's boot pre-gen column became `(0,·,2)` — world x 0..15, z 32..47 — to contain the new spawn.)

### Streaming (`src/streaming.ts`)

A **5×5×5 = 125-chunk ring** around the player: every chunk with `|cx−pcx| ≤ 2, |cz−pcz| ≤ 2, cy ∈ [0..4]`. The x/z extent is unbounded (terrain generates correctly anywhere); only Y is band-limited (POC ground slab, y 0..79). `update()` is called once per physics substep (60 Hz) and may **load at most 2** missing chunks (closest by score, each filled with terrain immediately) and report **at most 2** dirty chunks to remesh — ≤ 4 chunk builds per substep, so even a teleport (125 fresh chunks ≈ 1 s) holds 60 fps. Score is `(dx²+dz²)·100 + |cy−pcy|` (x/z distance dominates; the player's own chunk first at score 0; deterministic `(cx,cy,cz)` tie-breaks make the stream reproducible). Loads and unloads mark neighbours dirty (a newly present chunk makes existing neighbours' face culling stale; an unload exposes open boundaries), spread over a few frames by the remesh budget. A shared `TerrainGen` instance is used across the ring so the world data is byte-identical regardless of which chunk generated a given column.

**Budget history:** the budget started at 2 loads + 2 remeshes per substep and was **dropped to 1 per frame** after stutter measurements — at 2+2, walking over open ocean produced 25–138 ms frames (PROJECT.md §9). A one-shot heavy remesh still shows as a 15–28 ms hiccup on the single largest water/cave chunk (accepted: zero >25 ms frames now except that tail).

## Alternatives considered

- **`Uint16Array` block storage** — the spec called for it; `Uint8Array` was used instead (D9) since the block values fit in a byte and behaviour is identical.
- **Marking only the affected neighbour dirty** — rejected as a [POC shortcut]: marking all 6 face-neighbours costs a few wasted remeshes and avoids a branch that is easy to get wrong.
- **Canonical mulberry32** — rejected in favour of the variant form because only the variant reproduces the pinned measured constants (see Deviations, D2).
- **Hardcoded plateau spawn** — rejected in favour of a measured-spawn scan on real generated terrain (D4).

## Consequences

- Known limits: a y 0..79 terrain slab; no persistence (cross-ref ADR 0001 — Project foundation & tooling); the streaming ring is fixed at radius 2 with the 1-per-frame budget.
- Open follow-ups, tracked in TODO.md: an **adaptive frame budget** (a cheap frame-time governor that raises the load/remesh budget to 2–3 on a fast machine when the last frame was < 8 ms and drops it to 0–1 when a heavy water/cave band is streaming in), and **slicing the one-shot heavy remesh over 2 frames** (half the vertices per frame) to remove the last visible hitch.
- The dirty-flag + budget design is what lets edits (ADR 0004), the water sim (ADR 0005), and streaming share one invalidation path without synchronous remesh thrash.

## Deviations & execution notes

- **D1 — grass bottom face.** The plan's grass tile table was corrected so the −Y (bottom) face uses tile 2 (dirt), matching the plan's own texture layout (dirt-on-bottom).
- **D2 — PRNG variant.** The canonical mulberry32 finalizer is `t ^ (t >>> 7)`; the implementation uses the variant `t ^ (a >>> 7)`. The plan's measured constants (water count, heights 19..43, 21 trees, seed 1234) are reproduced **only** by the variant — the canonical form gives a different water count (45258 pre-cave-fix). The pinned constants (test + the origin probe) are authoritative, so the variant is the decision; a comment at the PRNG line points here.
- **D4 — measured spawn.** Spawn moved from the plan's `(33,41)` (a sea-basin column in both PRNG variants) to `(6,46)`, the nearest clean grass column (evidence above). Cascade: the boot pre-gen column became `(0,·,2)`.
- **D5 — streaming test expectations + impl shape fix.** Three of the plan's four streaming tests failed red even after a faithful implementation: the plan's literal expectations were arithmetically inconsistent with the plan's *own* score formula plus T3's locked `setBlock` semantics (it dirties the 6 existing face-neighbour chunks). The expectations were corrected (intent preserved) and one genuine impl bug was found the same way: remesh/unload results pushed `Chunk` objects where the API shape is a uniform `Coord[]` — changed to Coord literals.