# TODO — deferred / follow-up

Items deliberately not done in the POC. Rough order of value.

## Water

- **Distinguish flow water from source water visually** (user request, 2026-08-16). The mesher
  reads only the block type, so a placed source (an eternal spring) and the flow it poured out
  render identically. The state already exists per cell — `wsource` (placed/immortal) and
  `wflow` (sustained reachability) in each chunk (`src/world.ts`), written by `WaterSim`.
  `meshChunk()` already takes the chunk, so it can read both arrays per cell. Ideas, in order of
  cheapness: lower the surface of flow water by a few mm (source keeps the full cell height), or
  give flow a slightly different alpha/colour in the transparent pass, or a subtle animated UV
  offset on flow quads. Whatever we pick, keep the `nb === b` face cull (no quads between
  adjacent water) — the distinction must come from height/alpha, not extra faces.
- A waterfall flowing into the sea raises the *loaded* sea surface by one where the droplets land
  (flow over water spreads sideways, so an open basin climbs to the head's level — physically
  right, but on a finite loaded sea it reads as a slow swell spreading out from the falls).
  Possible fix: cap the at-rest spread of flow that is itself over water for cells at the *top*
  of a local water column (a surface-flow gate). Only worth it if the swell is visually
  annoying.
- Player-swim interaction beyond the current gravity/speed tweaks (buoyancy bob, underwater
  particles, drag trails).

## Streaming / rendering

- **Adaptive frame budget.** Load/remesh budgets are fixed at 1 chunk per frame (dropped from 2
  after the stutter measurements in PROJECT.md §9 — at 2+2, walking over open ocean walked
  25–138 ms frames). A measured-but-blunt fix: a cheap frame-time governor could raise the
  budget to 2–3 on a fast machine when the last frame was < 8 ms and drop it to 0–1 when a
  heavy water/cave band is streaming in.
- One-shot heavy remesh still shows as a 15–28 ms hiccup on the single largest water/cave chunk
  (accepted: zero >25 ms frames now except that tail; see §9 numbers). Slicing a huge remesh
  over 2 frames (half the vertices per frame) would remove the last visible hitch.

## Water sim (model)

- `runAudit()` re-derives sustained-flow reachability as a BFS over the whole loaded water body
  after any water-removing edit. Exact and fine at POC scale (a few thousand cells); at distance
  this becomes the expensive path. Optimization: maintain component IDs incrementally (a BFS
  label per water component, recomputed only for components touched by the edit).
- Placed water in mid-air falls and lands as flow; if the landing is isolated from every source
  it starves away. Matches "only placement creates sources" but can surprise (a placed block
  over the void simply disappears after a moment).
- Levels are cosmetic constants (7 everywhere): “flow depth” is not simulated — a flooded cave
  reads as full water, not a graded slope. Restoring real levels means the old decay/spread
  radius machinery (see the reverted T3 branch) re-entering the load path.

## General

- The `TODO` probe methodology that found the water stutters (a moving-camera vitest replay
  logging per-phase ms) was deleted with the fix; if more frame-time work is needed, recreate
  it — a 400-frame walk over open ocean with load/mesh/settle/tick split beats guessing.