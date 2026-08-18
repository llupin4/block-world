# TODO — deferred / follow-up

Items deliberately not done in the POC. Rough order of value.

## Water

- **Distinguish flow water from source water visually** (user request, 2026-08-16). The mesher
  reads only the block type, so a placed spring and the flow it pours out render identically.
  The state already exists per cell — `wsource` (immortal: placed springs *and* static worldgen
  water; `wplaced` tells the two apart), `wlevel` (the feed-reached decay level), `wstream`
  (a stream column that never spreads) in each chunk (`src/world.ts`), written by `WaterSim`.
  `meshChunk()` already takes the chunk, so it can read those arrays per cell. Ideas, in order of
  cheapness: lower the surface of non-spring water by a few mm (a spring keeps the full cell
  height), or a slightly different alpha/colour in the transparent pass, or a subtle animated UV
  offset on flow quads. Whatever we pick, keep the `nb === b` face cull (no quads between
  adjacent water) — the distinction must come from height/alpha, not extra faces.
- ~~A waterfall flowing into the sea raised the loaded sea surface by one.~~ **Resolved (2026-08-16,
  round 4):** flow over deep water now vanishes instead of spreading sideways, and worldgen water
  is static (only placed water is a spring), so no water body's level ever rises — a falls-to-sea
  pour is lost at the surface, basins hold a floor sheet, caves take a stream + floor pool.
- ~~Cut flow "kept moving and flickering" and never stopped — sources broken over the sea left
  flow above the sea surface.~~ **Resolved (2026-08-18, round 7):** three causes, all fixed in
  `src/water.ts` — (1) falling flow was *adopted* into source bodies (immortal `s=1` cells above
  the sea / cave lakes that never dried); it now rides a source surface and dries with its feed;
  (2) the `S . S` heal rule fused two *separate* placed sources into a phantom regenerated
  spring the player never broke (an eternal emitter); healing now only fills one-cell holes that
  are part of a body; (3) at the old slow-clock budget (250 updates / 0.5 s pulse) the
  re-stabilization cascade crawled for seconds, visibly re-expanding before draining — the budget
  is now 1000, so a cut-off body settles in ~1–2 s (a handful of pulses).
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

- ~~`runAudit()` re-derives sustained-flow reachability as a BFS over the whole loaded water
  body after any water-removing edit...~~ **Moot (the local re-derivation model replaced it):**
  no global reachability audit exists — a cut-off flow re-derives to air cell by cell through the
  dirty closure (each state change re-marks the cells whose re-derivation could differ), so a
  plugged cave / mined spring drains itself with no whole-body BFS and no per-cell sustain flag.
- ~~Placed water in mid-air falls and lands as flow; if the landing is isolated from every
  source it starves away.~~ **Superseded (2026-08-18, round 7):** a placed source is a *static*
  block — it never falls (not even alone in the sky) and pours no column through itself; its
  only emission is a side halo into the air beside it, which then falls by the ordinary flow
  rules. A lone sky source stays a single static block with a drip running off each exposed side
  (user-accepted behaviour).
- ~~Levels are cosmetic constants (7 everywhere).~~ **Superseded:** levels are a real decay
  number now (fresh start 7, one lost per sideways spread step, level 1 spreads nothing) and
  drive the ~6-block bounded fan and the "water runs down a slope" behaviour. They are still
  *render*-cosmetic (a cell always draws full height, so "flow depth" is not simulated — a
  flooded cave reads as full water, not a graded slope).
- Sideways spread is **isotropic** (a cell flows into all open side neighbours at once). The
  reference engine's bounded directional search ("which way can I fall first" — water seeking out
  a hole in a specific direction) is not modelled: a flow reaching a ledge spills equally to
  every open side. Offered as a follow-up if that ever reads as wrong (see PROJECT.md §9).

## General

- The `TODO` probe methodology that found the water stutters (a moving-camera vitest replay
  logging per-phase ms) was deleted with the fix; if more frame-time work is needed, recreate
  it — a 400-frame walk over open ocean with load/mesh/settle/tick split beats guessing.