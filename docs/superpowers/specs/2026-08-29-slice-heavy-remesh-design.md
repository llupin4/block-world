# Design — slice the heavy chunk remesh across frames

- **Date:** 2026-08-29
- **Branch:** `slice-heavy-remesh`
- **Status:** Design approved (2026-08-29); implementation plan follows. **Revision R1
  (2026-08-29, pre-plan scratch measurement):** the measurement gate ran before the plan and
  refuted the static cell-count decision (the worst chunk is NOT the largest by cell count —
  no proxy separates the slow class cleanly). The decision is now a **vertex-budget probe**
  (`PROBE_VERTS = 3764`, `SLICE_COUNT = 4`), derived from the measured pins below. All other
  sections unchanged in intent.
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
4. Pin (hardware-independent counts, per project convention): the **worst chunk's key and
   vertex count** (`2,1,0`, **6312** opaque+trans vertices — the ADR 0002 "single largest
   water/cave chunk"); the phase fractions `r_mesh = T_mesh / T_node` and
   `r_geom = T_geom / T_node` (measured **0.982 / 0.018** — the cost is the mesh CPU, not the
   geometry build); the merged geometry's byte size `B` (**315,600 B**).
5. Derive the two pinned constants from those pins plus the ADR 0002 browser tail (15–28 ms):
   - **`PROBE_VERTS = floor(6312 × 16.7 / 28) = 3764`** — the vertex budget of the probe
     (below): at the worst-case measured density (28 ms / 6312 verts) a probe frame is
     **≤ 16.7 ms by construction**, on any machine.
   - **`SLICE_COUNT = max(2, ceil(6312 / floor(6312 × 8 / 28))) = ceil(6312 / 1803) = 4`** —
     each slice is ≤ 1803 verts ≈ **≤ ~7 ms** at the worst-case density (goal B's ~8 ms
     per-slice target with headroom).
   The test also **pins the number of band chunks whose mesh exceeds `PROBE_VERTS` (measured
   20)** — the count the streaming reservation below is sized for; a worldgen change that
   moves this count revisits the constant.

**Gate condition (measured — PASSED).** The merge frame costs
`28 × r_geom + upload_est(B) + 28 × r_mesh / N`; the geometry build and upload do **not**
shrink with N. The last slice is ≤ 8 ms by construction, so the merge frame fits a 16.7 ms
budget only if `28 × r_geom + upload_est(B) ≤ 8.7 ms`. Measured: `28 × 0.018 + 0.316 =
0.81 ms` ≪ 8.7 ms — the tail is CPU-mesh-bound, slicing works. (Had it failed, this item
re-scopes to TODO 2/3 with the breakdown recorded in an ADR note.) `upload_est(B) = B / 1 MB`
(ms per MB of attribute+index bytes — a conservative desktop-class upper bound for the single
`gl.bufferData` at merge).

**R1 — why not a static cell-count threshold.** The original design decided "heavy" from a
pre-mesh non-air cell count. The scratch scan refuted it: the worst chunk (`2,1,0`) is ~20th
in non-air count (3550; stone-heavy chunks at 4000+ cells mesh in < 3.6 ms), and no proxy
(non-air / water / air-neighbor "emit" counts) separates the slow class from the fast class —
there is no clean gap to threshold on. Vertex count DOES separate (clean gap 5220 vs 4844 at
the tail), but it is only known while meshing — hence the probe: let the mesher itself stop
at the budget, which is both the cost model and the decision.

## Slice mechanics

### The mesher gains a row range and a vertex budget

`meshChunk`'s body moves to an internal
`meshChunkImpl(world, cx, cy, cz, lightAt, ly0, ly1, maxVerts)` returning
`{ mesh: ChunkMesh, complete: boolean }`: the outer loop runs `for (let ly = ly0; ly < ly1; ly++)`,
and before each emitted face (4 verts) it checks
`opaque.verts + trans.verts + 4 > maxVerts` → sets `complete = false` and stops (the partial
buffers are left as-is; the caller decides). The **public `meshChunk(world, cx, cy, cz,
lightAt)` keeps its exact signature and return type** — it calls the impl with
`ly0 = 0, ly1 = 16, maxVerts = Infinity` and returns `.mesh` — so every existing caller and
test is untouched. Two new exports:

- `meshChunkRange(world, cx, cy, cz, lightAt, y0, y1): ChunkMesh` — row-band meshing (the
  slice path, no vertex budget: bands are already bounded by the balanced row counts).
- `probeMeshChunk(world, cx, cy, cz, lightAt, maxVerts): { mesh, complete }` — the decision:
  mesh up to `maxVerts` verts. `complete === true` → the partial IS the full mesh (use it
  directly; its cost is ≤ the budget by construction). `complete === false` → the chunk is
  heavier than the budget; the partial buffer is discarded and the chunk goes to the slice
  path. The budget check is per-face (a face's 4 verts are never split), so a truncated
  buffer always holds whole faces — irrelevant to the result (discarded), but it keeps the
  buffer well-formed.

The row range + budget parameters are deliberately worker-compatible: TODO item 2's
worldgen/meshing worker can call the same partitioned/budgeted API.

### New `src/mesh-slices.ts` (pure TS, no three — the `streaming.ts` pattern)

- `decideBands(chunk, n): [y0, y1][]` — one 4096-read pass counts non-air cells per row;
  returns `n` contiguous bands split at the row-count quantiles (balanced by cell count),
  always covering `[0, 16)` (a band may be empty — an all-water top row culls most of its
  faces, so the last band of the worst chunk is the lightest: measured 0.6 ms of 5.3 ms).
  There is no threshold: the probe already decided the chunk is heavy.
- `mergeSlices(meshes: ChunkMesh[]): ChunkMesh` — per pass (opaque, then trans): if any
  band's pass is non-null, concat the four attribute arrays (positions, colors, uvs, light)
  in band order and rebuild the index array with each band's indices rebased by the sum of
  preceding bands' vertex counts. A null pass contributes nothing; the merged pass is null
  iff every band's pass is null.
- `SliceScheduler` — `Map<key, { bands, next, partial: (ChunkMesh | null)[] }>` with
  `start(key, bands)`, `advance(key) → { y0, y1 } | null` (null = no in-flight plan),
  `store(key, mesh: ChunkMesh)` (records the just-meshed band's buffers),
  `finish(key) → ChunkMesh | null` (`mergeSlices` over the collected bands, then removes the
  plan), `cancel(key)`, `has(key)`, `inFlightKey(): string | null` (at most one plan at a
  time — starts are serialized by the drain). Pure state machine — vitest drives it
  directly.
- `PROBE_VERTS = 3764` and `SLICE_COUNT = 4` pinned as module constants with comments
  pointing at `remesh-perf.test.ts` and the derivations above (the `TERRAIN_SEED` /
  `LOAD_BUDGET` pattern).

Slices exist **only as CPU `VoxelBuffer`s** until merge: no scene objects, no GPU uploads,
nothing to dispose mid-split. The single upload happens at merge, on the merge frame.

## Drain integration (frame-end, `main.ts`)

The existing closest-first drain over `pendingRebuild` gets a **pre-check**, then the same
per-candidate walk:

- **Pre-check — a plan in flight?** If `scheduler.inFlightKey()` is non-null, **this frame
  is reserved for it**: `advance` the in-flight chunk one slice (mesh that band via
  `meshChunkRange`, `store`), and on the last slice `finish` → `toGeometry` → swap the
  scene entry. No other rebuilds run this frame (a slice is ≤ ~7 ms; running the other
  budget slots alongside would risk the 16.7 ms budget — closer normal chunks simply carry
  one more frame, the already-accepted self-correcting staleness).
- **Otherwise**, walk the sorted candidates:
  1. **Probe** `probeMeshChunk(world, cx, cy, cz, lightAt, PROBE_VERTS)`:
     - **complete** → the probe IS the full mesh (≤ 16.7 ms by construction): swap it into
       the scene (the extracted `swapChunkMesh`, see below), clear dirty, consume one
       `REBUILD_BUDGET` slot — exactly today's cost and behavior for ≤ 3764-vert chunks.
     - **truncated** → the chunk is heavy: `decideBands(chunk, SLICE_COUNT)` →
       `scheduler.start(key, bands)`, mesh band 0, `store`, **frame reserved** (break — the
       probe already spent the frame's budget). The probe's partial buffer is discarded.
  2. Starts are serialized by construction: the pre-check runs before any start, so a new
     plan begins only on a frame with no plan in flight.

`rebuildChunkMesh` is refactored around a new `swapChunkMesh(key, mesh: ChunkMesh)`
(dispose old scene entries, `toGeometry`, add meshes, update `chunkObjs`, clear `dirty`)
used by all three paths: the sync edit path (whole `meshChunk` + swap), the probe-complete
path (probe's mesh + swap), and the merge path (merged mesh + swap).

- **Old mesh kept until merge completes.** An existing chunk shows at most `N` frames of the
  stale mesh (probe/slice-0 frame + the remaining slice frames) — the same "briefly-stale
  self-correcting lower bound" the drain already ships (ADR 0012 comment, `main.ts`). A fresh
  load's pop-in extends from ~2 to ~`N` frames (the probe frame doubles as slice 0),
  ring-edge chunks only.
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
- **20 band chunks exceed `PROBE_VERTS` (pinned).** Plans are serialized (at most one
  in flight), so a full ring refill pays up to 20 × (1 probe + `SLICE_COUNT` slice frames) ≈
  100 reserved frames — measured and accepted: the reserved frames are ≤ 16.7 ms by
  construction (the fix's purpose), the near chunks drain first (score order), and
  `PROBE_VERTS` is a single tunable constant if the reservation ever reads as sluggish
  streaming.
- **Scheduler map** is bounded by the ring (≤ 125 keys); cancels cover every exit path
  (merge, unload, edit, walk-away).
- **Documented residual (out of scope):** the synchronous edit-remesh path
  (`remeshAround`, `main.ts`) still rebuilds a heavy chunk one-shot (28 ms) — pre-existing,
  belongs to TODO 2/3.

## Testing and acceptance

**Unit (vitest, node):**

1. **Exact split-union equality:** for the worst chunk plus all-water, all-air, and
   special-block (torch/door) chunks, `mergeSlices(meshChunkRange(band_i) over
   decideBands(chunk, SLICE_COUNT))` deep-equals `meshChunk(whole)` on all five attribute
   arrays — exact, same vertex order, settled-light sampler shared across calls.
2. **Probe behavior:** a synthetic high-vertex chunk (all-water, full) →
   `probeMeshChunk(..., PROBE_VERTS)` returns `complete: false`; a synthetic light chunk
   (sparse) → `complete: true` and its mesh deep-equals the full `meshChunk` result; the
   Phase 0 scan pins the 20-chunk over-budget count in the band.
3. **`mergeSlices` rebase:** synthetic buffers, null passes, single-slice passthrough.
4. **Scheduler transitions:** start → advance×N → finish; cancel mid-flight discards;
   finish returns the merged mesh; advance on a missing key is a no-op; at most one
   in-flight plan.
5. **Linearity:** per-band wall-time ≤ 1.25 × whole/N (N = `SLICE_COUNT`, measured max
   ratio 1.107) — catches hidden per-slice fixed cost.
6. **Regression net:** the public `meshChunk` is byte-identical to today's behavior
   (default range, no budget), so every existing test is untouched; the water-load / light /
   streaming replays are the safety net.

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