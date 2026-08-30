# Design — slice the heavy chunk remesh across frames

- **Date:** 2026-08-29
- **Branch:** `slice-heavy-remesh`
- **Status:** Design approved (2026-08-29); implementation plan follows
- **Resolves:** `TODO.md` → Streaming / rendering — "One-shot heavy remesh still shows as a
  15–28 ms hiccup … Slicing a huge remesh over 2 frames (half the vertices per frame) would
  remove the last visible hitch."
- **Related:** ADR 0002 (World model & terrain — the 1 load + 1 remesh budget and its history),
  ADR 0012 (Light worker — the frame-end `pendingRebuild` drain and the "briefly-stale mesh
  self-corrects" philosophy), TODO items 2 (worker offload) / 3 (adaptive budget) / 6 (probe
  recreation) — **out of scope**, see Non-goals.

## Problem

Every chunk rebuild is one atomic `rebuildChunkMesh` (`src/main.ts`): a single synchronous
`meshChunk` pass over all 4096 cells (`src/chunk-mesher.ts`), then one `BufferGeometry` build,
then one GPU upload. Typical chunks cost 2–5 ms and the frame-end drain (`REBUILD_BUDGET = 3`)
keeps frames under budget. The single largest water/cave chunk in the generated band costs
15–28 ms one-shot — the last visible hitch; everything else holds zero frames > 25 ms
(ADR 0002, Consequences).

The number comes from the `TODO` probe (a moving-camera per-phase timing replay) that was
deleted with the fix it found (TODO item 6), so we no longer know what fraction of 15–28 ms is
`meshChunk` CPU, geometry build, or GPU upload. If the tail is upload-bound, slicing the CPU
work cannot fix it. **The plan therefore starts with a measurement gate (Phase 0) and only
then sizes the slice count.**

**Goal (acceptance bar B, chosen over the "zero > 25 ms" bar):** for the worst chunk, zero
frames > 16.7 ms — per-slice mesh work ≤ ~8 ms, leaving headroom for the rest of the frame.

## Verified premise: the mesh is exactly partitionable

`meshChunk`'s per-cell emission is **independent**: face culling reads only the neighbor's
block id (`gb`), water surface height (`gl`), and meta (`gm`) — never in-chunk mesh state.
The emission order is `ly → lz → lx`, so a partition of the `ly` row range into contiguous
bands produces partial meshes whose **concatenation is exactly the whole mesh, same vertex
order** (only per-slice index bases need rebasing on merge). No approximation, no
double-emitted or missing seam faces. This is what makes a row-band split safe where, e.g., a
spatial-hash or vertex-count streaming split would not be.

## Phase 0 — measurement gate (own commit, no behavior change)

New `src/__tests__/remesh-perf.test.ts`, built on the existing replay harness patterns
(`water-load.test.ts` for the band + settle, `light-load.test.ts` for settled light — the light
core is node-testable, so the timing uses a realistic `world.getLight` sampler, not the
zero-light default):

1. Build the pinned 125-chunk band (cx/cz 0..4, cy 0..4) with terrain, water settle, and
   settled light.
2. For each chunk measure: per-row non-air cell counts, `meshChunk` wall-ms (incl. `toBuffer`),
   emitted vertex/face counts, and three.js geometry-build wall-ms (attribute setup +
   `computeBoundingSphere`).
3. To make the geometry build measurable in node, **move `toGeometry` out of `main.ts` into a
   new `src/geometry.ts`** (pure three, node-importable, ~10 lines; `main.ts` imports it).
4. Pin (hardware-independent counts, per project convention): the **worst chunk's coordinates
   and vertex count**; the phase fractions `r_mesh = T_mesh / T_node` and
   `r_geom = T_geom / T_node`; the final geometry's byte size `B`.
5. Compute the slice count from the measured browser tail (15–28 ms, ADR 0002):
   **`N = max(2, ceil(28 × r_mesh / 8))`, capped at 4.** If the raw formula yields < 2, the
   mesh CPU alone is < 8 ms, so the tail is not sliceable CPU work and the gate decision
   below applies. The heavy threshold is the non-air cell count separating the worst chunk
   from the 2–5 ms class; the test **asserts both sides of the gap** (worst ≥ threshold >
   every 2–5 ms-class chunk). The test also **pins the number of heavy chunks in the band**
   (≥ threshold) — expected 1 (ADR 0002's "single largest water/cave chunk"); the drain's
   serialized-start rule below assumes that, and if the scan finds more the plan revisits
   start priority before implementation.

**Gate condition.** The merge frame costs `28 × r_geom + upload_est(B) + 28 × r_mesh / N` —
the geometry build and upload do **not** shrink with N. The last slice is ≤ 8 ms by
construction, so the merge frame fits a 16.7 ms budget only if
`28 × r_geom + upload_est(B) ≤ 8.7 ms`. If it exceeds that, the split cannot meet goal B:
record the breakdown in an ADR note and re-scope this item to TODO 2/3 instead of shipping a
no-op. `upload_est(B) = B / 1 MB` (ms per MB of attribute+index bytes — a conservative
desktop-class upper bound for the single `gl.bufferData` at merge; if the gate is borderline,
a manual browser micro-check settles it before N is chosen). Expected outcome: CPU-bound (the
4096-cell face-emission loop with cross-chunk light lookups dominates), `N ∈ {2, 3}`. The
mechanism is content-agnostic — if the true worst chunk is not the water/cave one the docs
assume, the design is unchanged and only the pins differ.

## Slice mechanics

### `meshChunk` gains an optional row range

`meshChunk(world, cx, cy, cz, lightAt, yRange?: [y0, y1))` — the outer loop becomes
`for (let ly = y0; ly < y1; ly++)`. That is the entire mesher change. Default (omitted) is
`[0, 16)` = today's behavior, so every existing caller and test is untouched. The parameter is
deliberately worker-compatible: TODO item 2's worldgen/meshing worker can call the same
partitioned API.

### New `src/mesh-slices.ts` (pure TS, no three — the `streaming.ts` pattern)

- `decideSlices(chunk, threshold, n): [y0, y1][][] | null` — one 4096-read pass counts
  non-air cells per row; total < threshold → `null` (chunk is not heavy); otherwise returns `n`
  contiguous bands split at the row-count quantiles (balanced by cell count, which proxies
  loop cost).
- `mergeSlices(meshes: ChunkMesh[]): ChunkMesh` — per pass (opaque, then trans): if any
  band's pass is non-null, concat the four attribute arrays (positions, colors, uvs, light)
  in band order and rebuild the index array with each band's indices rebased by the sum of
  preceding bands' vertex counts. A null pass contributes nothing; the merged pass is null
  iff every band's pass is null.
- `SliceScheduler` — `Map<key, { bands, next, partial: (ChunkMesh | null)[] }>` with
  `start(key, bands)`, `advance(key) → { y0, y1 } | null` (null = no in-flight plan),
  `store(key, mesh: ChunkMesh)` (records the just-meshed band's buffers),
  `finish(key) → ChunkMesh | null` (`mergeSlices` over the collected bands, then removes the
  plan), `cancel(key)`, `has(key)`. Pure state machine — vitest drives it directly.
- `HEAVY_CELL_THRESHOLD` and `SLICE_COUNT` pinned as module constants with a comment pointing
  at `remesh-perf.test.ts` (the `TERRAIN_SEED` / `LOAD_BUDGET` pattern).

Slices exist **only as CPU `VoxelBuffer`s** until merge: no scene objects, no GPU uploads,
nothing to dispose mid-split. The single upload happens at merge, on the merge frame.

## Drain integration (frame-end, `main.ts`)

The existing closest-first drain over `pendingRebuild` gets a **pre-check**, then the same
per-candidate walk:

- **Pre-check — any in-flight plan?** If `scheduler` has an in-flight chunk, **this frame is
  reserved for it**: advance the *closest* in-flight chunk one slice (mesh that band,
  `store`), and on the last slice `finish` → `toGeometry` → swap the scene entry. No other
  rebuilds run this frame (a slice is ~8 ms; running the other budget slots alongside would
  risk the 16.7 ms budget — closer normal chunks simply carry one more frame, the
  already-accepted self-correcting staleness).
- **Otherwise**, walk the sorted candidates:
  1. **`decideSlices` says heavy** (and no plan exists yet — starts are serialized) →
     `start`, mesh slice 0, `store`; the frame is reserved (no other rebuilds).
  2. **Otherwise** → today's `rebuildChunkMesh`, up to `REBUILD_BUDGET = 3` per frame,
     exactly as now.

- **Old mesh kept until merge completes.** An existing chunk shows at most `N − 1` frames of
  the stale mesh — the same "briefly-stale self-correcting lower bound" the drain already
  ships (ADR 0012 comment, `main.ts`). A fresh load's pop-in extends from ~2 to ~`N + 2`
  frames, ring-edge chunks only.
- **`streaming.ts` is untouched** — its 1 load + 1 remesh budget and `Coord[]` API stand;
  the split lives entirely in the mesher, the new module, and the drain. The ADR 0012 light
  worker contract is untouched.

## Cancellation and edge cases

- **Player edit (`rebuildChunkMesh` sync path) and unload (`removeChunkMesh`)** both call
  `scheduler.cancel(key)` first. A finished split can therefore never clobber a synchronous
  edit, and walking away mid-split unloads the chunk and discards the partial buffers (GC).
- **Light/water touched mid-split: not cancelled.** Each slice meshes from the light it has
  that frame — the same stale-mesh trade-off the drain already accepts — and the touched
  entry in `pendingRebuild` guarantees a full re-mesh within a frame of the merge.
- **All-air band** → null pass; `mergeSlices` handles it (final pass null iff all null —
  today's behavior).
- **Two heavy chunks pending** → plans are serialized: the closest starts first, its N
  reserved frames block all other rebuilds (they carry and self-correct), and the second
  starts the frame after the first finishes. Phase 0 pins the heavy-chunk count in the band
  (expected 1), so this is a corner case, not the common path.
- **Scheduler map** is bounded by the ring (≤ 125 keys); cancels cover every exit path
  (merge, unload, edit, walk-away).
- **Documented residual (out of scope):** the synchronous edit-remesh path
  (`remeshAround`, `main.ts`) still rebuilds a heavy chunk one-shot (28 ms) — pre-existing,
  belongs to TODO 2/3.

## Testing and acceptance

**Unit (vitest, node):**

1. **Exact split-union equality:** for the worst chunk plus all-water, all-air, and
   special-block (torch/door) chunks, `mergeSlices(meshChunk(band_i))` deep-equals
   `meshChunk(whole)` on all five attribute arrays — exact, same vertex order, settled-light
   sampler shared across calls.
2. **Threshold gap:** worst chunk ≥ `HEAVY_CELL_THRESHOLD` > every 2–5 ms-class chunk (both
   sides asserted from the Phase 0 scan).
3. **`mergeSlices` rebase:** synthetic buffers, null passes, single-slice passthrough.
4. **Scheduler transitions:** start → advance×N → finish; cancel mid-flight discards;
   finish returns the merged mesh; advance on a missing key is a no-op.
5. **Linearity:** per-slice wall-time ≈ whole/N (≤ 1.25×) — catches hidden per-slice fixed
   cost.
6. **Regression net:** all existing tests untouched (default `yRange` = today's behavior);
   the water-load / light / streaming replays are the safety net.

**Acceptance (browser, recorded per the ADR 0012 precedent):** manual walk loading the pinned
worst chunk — the frames that run its slices and merge stay inside the vsync budget: per-phase
CPU work ≤ 16.7 ms in DevTools and **no dropped frames (no ~33 ms frame gaps)** during its
load + first mesh + remesh; open-ocean walk unchanged vs the existing profile.

**Docs (at finish):** new **ADR 0013** recording the decision, the Phase 0 breakdown, and the
measured browser acceptance; `TODO.md` item resolved; `PROJECT.md` §11 note.

## Non-goals

- TODO item 2 (worldgen/meshing worker offload), item 3 (adaptive frame budget), item 6
  (recreate the moving-camera probe) — separate projects. The slice API is worker-compatible
  on purpose so item 2 can reuse it.
- The synchronous edit-remesh path (documented residual above).
- A time-based drain governor (item 3's territory; the frame reservation here is the minimal
  substitute for the slice case only).
- Any change to `streaming.ts`, the light worker, or the water sim.