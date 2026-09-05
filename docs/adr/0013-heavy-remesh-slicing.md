# 0013. Heavy-chunk remesh — a vertex-budget probe splits the one-shot rebuild into balanced row-band slices

- **Status:** Accepted
- **Last updated:** 2026-08-29
- **Sources:** `docs/superpowers/specs/2026-08-29-slice-heavy-remesh-design.md` (revision R1),
  `docs/superpowers/plans/2026-08-29-slice-heavy-remesh.md`
- **Resolves:** TODO.md → Streaming / rendering — "Slicing a huge remesh over 2 frames (half
  the vertices per frame) would remove the last visible hitch" (ADR 0002 follow-up).

## Context

Every chunk rebuild is one atomic `rebuildChunkMesh`: a single synchronous `meshChunk` pass
(4096 cells), one `BufferGeometry` build, one GPU upload. Typical chunks cost 2–5 ms and the
frame-end drain (`REBUILD_BUDGET = 3`) keeps frames under budget (ADR 0002: the budget was
dropped from 2+2 after 25–138 ms frames over open ocean). The single largest water/cave chunk
still remeshed one-shot at 15–28 ms — the last visible hitch; everything else held zero frames
> 25 ms. The per-phase probe that found it was deleted with the fix (TODO item 6), so the
share of 15–28 ms held by `meshChunk` CPU, geometry build, or GPU upload was unknown.

A pre-plan measurement gate (Phase 0, `remesh-perf.test.ts`) pinned the answer on the
deterministic band (seed 1234): the worst chunk is `2,1,0` at **6312** opaque+trans vertices /
**315,600 B** of geometry; the cost is **CPU-mesh-bound** (`r_mesh = 0.982`; merge-frame gate:
`28 × 0.018 + 0.316 ms ≈ 0.8 ms ≪ 8.7 ms`); 4-way row-band linearity 1.107 (≤ 1.25); **20**
band chunks exceed the probe budget. The gate also refuted the original cell-count-threshold
design: the worst chunk is NOT the largest by cell count (stone-heavy chunks at 4000+ cells
mesh faster), and no cell/water/emit proxy separates the slow class — vertex count separates
(clean gap 5220 vs 4844) but is only known while meshing.

## Decision

The decision is made by the mesher itself, not by a pre-mesh proxy:

- **`meshChunkImpl(world, cx, cy, cz, lightAt, ly0, ly1, maxVerts)`** — the mesher runs over a
  row range `[ly0, ly1)` and stops charging faces at `maxVerts` total verts (a face is never
  split). Per-cell emission is independent (culling reads only the neighbor's block id / water
  height / meta), so a row-band partition is **exact**: the band meshes concatenated (indices
  rebased) are byte-identical to the whole mesh — pinned by a deep-equality test on the worst,
  all-water, all-air, and special-block chunks. Public `meshChunk` keeps its exact
  signature/return; new `meshChunkRange` (slices) and `probeMeshChunk` (the decision).
  `toGeometry` moved to node-importable `src/geometry.ts` (Phase 0 needs the geometry-build
  phase measurable).
- **`PROBE_VERTS = 3764 = floor(6312 × 16.7 / 28)`** — the probe's vertex budget: at the
  worst-case measured density (28 ms / 6312 verts) a probe frame is **≤ 1 vsync by
  construction**, on any machine. The frame-end drain probes every candidate: **complete** →
  the probe IS the full mesh and flows through the ordinary `REBUILD_BUDGET` (today's
  behavior, today's cost, for ≤ 3764-vert chunks); **truncated** → the chunk is heavy.
- **`SLICE_COUNT = 4 = ceil(6312 / 1803)`** — a truncated chunk is meshed in 4 contiguous row
  bands (`decideBands`, balanced by non-air row counts; a band may be empty), one per
  **reserved frame** (a slice frame runs no other rebuild — a slice is ≤ 1803 verts ≈ ≤ ~7 ms
  at the worst-case density), then `mergeSlices` (concat + index rebase) → one geometry → one
  upload on the merge frame (the lightest band carries it: measured 0.6 ms of 5.3 ms on the
  worst chunk). The old mesh is kept until the merge (at most N frames of the already-
  accepted "briefly-stale self-correcting lower bound", ADR 0012); a fresh load's pop-in
  extends from ~2 to ~4 frames, ring-edge only.
- **Cancellation:** the synchronous edit path (`rebuildChunkMesh`) and unload
  (`removeChunkMesh`) cancel any in-flight plan first — a finished split can never clobber an
  edit; partial buffers are CPU-only typed arrays (no GPU resources before the merge), so a
  walk-away unload is free. Light/water touched mid-split is NOT cancelled (each slice meshes
  from the light it has; the drain deletes the pending entry when a plan starts, so the entry's
  presence at the merge is the re-mesh warrant — only a light/water touch or a streaming
  dirty-remesh mark during the split can re-add it).
- **One in-flight plan at a time** (`SliceScheduler` enforces it; the drain pre-checks before
  any start) — serialized starts keep the reservation reasoning simple.

## Alternatives considered

- **Static cell-count threshold** (the original design) — refuted by the Phase 0 scan: no
  proxy gap; the worst chunk is mid-pack by cells.
- **Persistent two-mesh chunks** (y<8 / y≥8 forever) — 2× draw calls, 2× geometries, 2×
  dispose/create churn permanently, plus parts-array bookkeeping in every downstream path, to
  fix a rare tail.
- **Time-based drain governor** — a 28 ms rebuild is atomic; a governor can choose not to
  start it but can't interrupt it (TODO item 3's territory; complementary later).
- **Worker offload of meshing** — TODO item 2; the slice API is deliberately worker-
  compatible (`meshChunkImpl`'s range/budget parameters) so item 2 reuses it.

## Consequences

- **Measured browser acceptance (2026-09-05, branch `slice-heavy-remesh`):** the deterministic
  rig (`npm run prof`: `?prof=remesh` + Playwright headless, seed 1234, phase 0, render on) —
  **PASS**. Worst chunk `2,1,0` window = frames [108, 208]; the settled remesh took the slice
  path (plan + 2 slice + merge = 4 frames over 4 bands; two 6312-vert cycles, the second a
  touched-during-split re-mesh self-correcting; settledVerts = 6312 = node baseline); worst
  remesh frame 4.6 ms (plan/slice/merge all ≤ 16.7); no window frame > 16.7 ms (worst window
  frame 8.2 ms); open-ocean 300-frame segment max 8.4 ms / avg 2.2 ms (< 25 ms, the ADR 0002
  baseline); global max frame 55.6 ms on frame 0 (one-off boot cost, outside the window); drain
  max 18.3 ms. One manual headed walk confirmed the fix visually (no hitch loading the worst
  chunk; ocean unchanged). The rig re-runs deterministically (identical frame indices across
  runs) — full report at `test-results/prof-remesh.json`.
- Streaming cost: up to 20 × (1 probe + 4 slice frames) ≈ 100 reserved frames per full ring
  refill — each ≤ 1 vsync by construction; near chunks drain first (score order);
  `PROBE_VERTS` is a single tunable if the reservation ever reads as sluggish streaming.
- Residual (out of scope): the synchronous edit-remesh path still rebuilds a heavy chunk
  one-shot — belongs to TODO items 2/3.
- Follow-ups: the adaptive frame budget (ADR 0002 / TODO 3) can tune the reservation; the
  worker offload (TODO 2) reuses the partitioned/budgeted mesher API.