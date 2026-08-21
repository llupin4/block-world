# TODO — deferred / follow-up

Items deliberately not done in the POC. Rough order of value.

## Water

- ~~Distinguish flow water from source water visually~~ **Resolved (2026-08-20, branch
  `water-level-mesh`):** the mesher now renders the level field — a resting flow cell's surface
  sits at `wlevel / 8` (a spring's fan reads as a stepped gradient), while source water (sea,
  lakes, springs) and stream cells (falling columns, riders) draw full height. A taller water
  cell emits a skirt face against a lower water neighbour (`emitWater` in `src/chunk-mesher.ts`;
  heights via `waterSurfaceHeight` in `src/blocks.ts` and `World.getWaterHeight` in
  `src/world.ts`); equal-height water keeps the no-face-between-water cull, water faces skip
  vertex AO (partial geometry), and the all-source ocean mesh is geometrically unchanged (the
  only visual delta: water-face corners read at full shade where opaque land tucks into the
  corner probes — the no-AO rule). Spec:
  `docs/superpowers/specs/2026-08-20-water-level-mesh-design.md`.
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

## World time & simulation clocks

- **Align the simulation clocks on one tick system.** The day/night project (branch
  `day-night-clouds`) introduces `src/time.ts` — a canonical `WorldTime` advanced in the fixed
  60 Hz physics substep — which the sky/cloud systems read, but the water sim keeps its own
  independent slow clock (`WATER_STEP`/`waterAcc` in `src/main.ts`). Backlog: converge on a
  single heartbeat that every simulation system derives from (water's pulse as one stride on
  the shared tick; world time, cloud wind, and future weather/lighting as siblings). Worth it
  eventually for determinism and for multiplayer, where a shared tick basis is what lets a
  server own the simulation.

## Sky & lighting

Items requested 2026-08-18 (with the torch/door work), deferred by design:

- ~~Clouds and a sun/moon in the sky with a day/night cycle.~~ **Resolved
  (2026-08-19, branch `day-night-clouds`):** `src/time.ts` (a `WorldTime`
  advanced in the fixed substep), `src/sky.ts` (phase-keyframed sampler +
  dome/stars/sun-moon renderer + a global `worldDim`), `src/clouds.ts`
  (instanced 4-block-cell layer at y=96 with wind drift); the sky moods —
  including the underwater one — are time-driven. See
  `docs/superpowers/specs/2026-08-19-day-night-clouds-design.md`. `worldDim`
  was the stand-in the next item (dynamic lighting, PROJECT.md §18) replaced
  — it now survives only as the cloud/sky tint.
- ~~Dynamic lighting with light levels (for torch / sun / moon positions).~~
  **Resolved (2026-08-19, branch `dynamic-lighting`):** `src/light.ts`
  (two 0–15 fields + the recompute-relaxation queue: torches 14, sky
  columns 15 with no vertical air decay, door/glass/leaves/water
  attenuation, de-propagation by relaxation — no special pass; the
  load-path settle is a column prefill + frontier so a fresh chunk costs a
  small drain, not a full re-derive), baked per-vertex into the chunk meshes
  with a `uDayness` uniform day/night pass (the `worldDim` material dim it
  replaced is gone; the 0.12 ambient floor keeps deep night readable).
  Torches now glow. See
  `docs/superpowers/specs/2026-08-19-dynamic-lighting-design.md` and
  PROJECT.md §18.