# TODO — deferred / follow-up

Items deliberately not done in the POC. Rough order of value.

## Water

- **Distinguish flow water from source water visually** (user request, 2026-08-16). The mesher
  reads only the block type, so a placed spring and the flow it pours out render identically.
  The state already exists per cell — `wsource` (immortal: placed springs *and* static worldgen
  water; `wplaced` tells the two apart), `wflow` (sustained reachability), `wstream` (a stream
  column that never spreads) in each chunk (`src/world.ts`), written by `WaterSim`.
  `meshChunk()` already takes the chunk, so it can read those arrays per cell. Ideas, in order of
  cheapness: lower the surface of non-spring water by a few mm (a spring keeps the full cell
  height), or a slightly different alpha/colour in the transparent pass, or a subtle animated UV
  offset on flow quads. Whatever we pick, keep the `nb === b` face cull (no quads between
  adjacent water) — the distinction must come from height/alpha, not extra faces.
- ~~A waterfall flowing into the sea raised the loaded sea surface by one.~~ **Resolved (2026-08-16,
  round 4):** flow over deep water now vanishes instead of spreading sideways, and worldgen water
  is static (only placed water is a spring), so no water body's level ever rises — a falls-to-sea
  pour is lost at the surface, basins hold a floor sheet, caves take a stream + floor pool.
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