# 0006. Water rendering — per-level graded water surfaces (flow water at `wlevel / 8`, source and stream water full height), with skirt faces at level steps

- **Status:** Accepted
- **Last updated:** 2026-08-20
- **Sources:** (superseded by this ADR; recoverable via `git show 0cf878c:<path>`)
  - `docs/superpowers/specs/2026-08-20-water-level-mesh-design.md` (the
    design: user decisions, height model, world accessor, `emitWater` face
    rules and geometry, update flow & performance, risks & edge cases)
  - `docs/superpowers/plans/2026-08-20-water-level-mesh.md` (the
    implementation plan: file structure and the API shapes —
    `waterSurfaceHeight`, `World.getWaterHeight`, `emitWater`, the `gl`
    reader)
  - `TODO.md` (the resolved item "Distinguish flow water from source water
    visually" — its final-state wording, distilled here)
  - `PROJECT.md` (§9 Water — the lines updated to say levels render as
    surface height)

## Context

Every water cell meshed as a full 1×1×1 transparent cube (ADR 0003 — Chunk
meshing & rendering): the cube path emits faces on cell-boundary corners and
culls a face when the neighbour is opaque or the same block (`nB === b` — no
quads between adjacent water). The water sim (ADR 0005 — Water simulation)
already maintains per-cell flow state per chunk (`src/world.ts`): `wlevel`
is a real decay number (fresh start 7, one lost per sideways spread step,
reset to 7 on any fall; `1..7` water, `0` dry), `wsource` marks immortal
source bodies (the worldgen sea/lakes and placed springs; `wplaced`
distinguishes the two), and `wstream` marks riding cells (falling waterfall
columns, and water one deep over a source surface). Until now that state was
render-cosmetic: a cell always drew full height, so a flooded cave read as
full water, not a graded slope.

This ADR resolves the `TODO.md` item "Distinguish flow water from source
water visually" (user request 2026-08-16) by making the mesh height dynamic:
a resting flow cell's surface is its flow level, not a full block — a
spring's fan renders as a stepped gradient sloping away from the source —
while source and stream water stay full height.

## Decision

**User decisions (approved 2026-08-20).**

- **Per-level graded height.** Non-source, non-stream flow water renders at
  `wlevel / 8` (level 7 → 0.875, level 1 → 0.125). Source water (sea, lakes,
  springs) and stream cells (falling columns, riders) stay full height.
- **Skirt faces at level steps.** When adjacent water cells have different
  surface heights, the taller cell emits its side face across the boundary
  (the classic voxel-engine convention), closing the step visually.
- **Streams full height.** `wstream` cells render at full cell height, so a
  multi-block waterfall column reads as solid falling water. This is the
  only configuration-safe choice: partial-height water stacked vertically
  leaves a 1/16 see-through slit at every cell boundary that no face
  configuration can patch (the gap sits between two partial boxes, and no
  face can occupy it), so streams must not be partial.

**Height model.** `waterSurfaceHeight(wlevel, wsource, wstream): number` in
`src/blocks.ts` is the single source of truth for a cell's surface height;
the world accessor and the mesher both use it, so the two can never
disagree:

- `wsource === 1 || wstream === 1` → `1.0`
- otherwise → `wlevel / 8` (levels `1..7` → `0.125 … 0.875`; `wlevel 0` —
  dry/missing — → `0`)

It is a pure function of the three per-cell bytes; no block-id argument —
callers invoke it only for `Water` cells, and the sim invariant that a
`Water` block always has `wlevel >= 1` (world.ts: "0 dry, 1..7 water") keeps
the result in `0.125 .. 1.0` for real cells — no degenerate zero-height box
is possible. It lives in `blocks.ts` (not `chunk-mesher.ts`) because
`world.ts` must import it and must not import `chunk-mesher.ts` (circular).

**World accessor.** `World.getWaterHeight(x, y, z): number` in
`src/world.ts`, a sibling of `getBlock` / `getMeta`: resolves the chunk for
the cell; a missing chunk → `0` (reads dry, mirroring `getBlock` = Air);
otherwise returns `waterSurfaceHeight` of that cell's `wlevel` / `wsource` /
`wstream` bytes. The value is only meaningful when the cell's block is
`Water` — the mesher checks the block id first (via `gb`) and only then asks
for the height. It exists for the cross-chunk read the skirt rule needs.

**Mesher — `emitWater()`.** A water-specific emitter in
`src/chunk-mesher.ts` (the same structure the mesher already uses for
torch/door), which takes over all six faces of a water cell; the cube loop
routes `Block.Water` to it and no longer runs the generic full-cube face
path for water. It draws a partial-height box — top at `h_me` (the cell's
surface height), bottom at `0` — from the existing `FACES` corner table:

- +Y face: all four corners at `y + h_me`
- side faces: corner y scales `c[1] → c[1] * h_me` (bottom stays `0`, top
  rises to `h_me`); x/z corners unchanged
- −Y face: corners unchanged (`y`, full 1×1)

UV: +Y/−Y faces keep the full tile; side faces' v-axis compresses by `h_me`
(the water tile is near-uniform noise, so the vertical stretch is invisible).

Signature:

```ts
emitWater(
  buf: Buf,            // the trans pass buffer
  gb: (x, y, z) => number,   // existing block reader (in-chunk fast path)
  gl: (x, y, z) => number,   // neighbour surface-height reader
  wx, wy, wz: number,        // cell origin (world space)
  hMe: number,               // this cell's surface height
  lightAt: LightSampler,
): void
```

`gl` is built in `meshChunk` as a sibling of `gb` / `gm`: in-chunk
neighbours read `waterSurfaceHeight(chunk.wlevel[i], chunk.wsource[i],
chunk.wstream[i])` directly (no string key / Map lookup); only cross-chunk
samples pay `world.getWaterHeight`. The caller (`meshChunk`) computes `hMe`
for the cell itself the same way.

**Face rules.** For a water cell of height `h_me`, per face order
`[+X, -X, +Y, -Y, +Z, -Z]`, with neighbour block `nB` and neighbour surface
height `h_nb` (queried via `gl` only when `nB === Water`):

| Face | Culled when | Emitted at |
|---|---|---|
| +Y (top) | above is opaque; or above is `Water` at full height (interior boundary — the full-height cell's top sits on the shared plane, and emitting would z-fight the water above's underside) | `y + h_me` |
| −Y (bottom) | below is opaque; or below is `Water` at full height (coplanar, z-fight) | `y` |
| side (±X, ±Z) | neighbour is opaque; or neighbour is `Water` and `h_me <= h_nb` (equal → both cull, today's behaviour; taller neighbour → its skirt covers this face's region) | box `y … y + h_me` |

Consequences of the table:

- **Skirt rule (sides, water vs water):** the face is emitted exactly when
  `h_me > h_nb` — strictly taller. The skirt spans the cell's full box
  height (`y … y + h_me`), not just the strip above the neighbour's surface;
  the lower portion hides behind the neighbour's water and blends as the
  same material (transparent, `depthWrite: false`, DoubleSide — a
  double-covered region reads as slightly denser water, the intended step
  look).
- **Top lip:** a partial cell (`h_me < 1.0`) with water above (always a
  full-height stream/source by the sim's rider rule) emits its top face at
  `y + h_me` — the visible lip under a waterfall column.
- **Equal heights:** both sides cull — the "no quads between adjacent water"
  behaviour, preserved for the common case (the whole ocean is equal-height
  source water, geometrically identical to the prior mesh).
- **Bottom over a shallower water cell** (flow-over-flow, a state the sim
  never produces — a mid-fall over a sheet becomes a stream cell) emits, so
  the defensive case is a harmless exposed lip rather than a see-through
  seam.

**Shading.** `FACE_SHADE[f]` only — no vertex AO on water faces. The AO
sampler (`s1` / `s2` / `dg` opacity probes at the face's outside corners)
assumes a full box reaching the cell boundary, and is slightly wrong on a
partial box; the special-block pass (`pushBox`) already sets the precedent
of no AO on partial geometry. Per-vertex light (`cornerLight`, baking
`blight` / `skylight` from the outside cells; ADR 0007 — Dynamic lighting)
is unchanged.

**Update flow & performance.** No simulation changes. `WaterSim.writeCell`
writes through `world.setBlock`, which already marks the edited chunk and
its six face-neighbour chunks dirty (ADR 0002 — World model & terrain); the
streaming pass reschedules dirty chunks for budgeted remesh (nearest first),
and `sim.touched` chunks take the `REBUILD_BUDGET` path in `main.ts`. A
level change at a chunk boundary therefore updates the neighbour's skirt
faces through the existing dirty-remesh machinery, self-correcting within
the existing frame budget; there is no new invalidation path. The skirt is
correct at chunk boundaries because the mesher reads neighbour heights
through the world accessor — the cross-chunk seam (a skirt at a chunk
boundary uses the neighbour's height via `world.getWaterHeight`) is pinned
by the accessor test (a cross-chunk sample; a missing chunk reads `0`, i.e.
dry).

## Alternatives considered

- **Uniform lowering of all flow water** — a single fixed surface height for
  all adjacent flow water. This is the idea the 2026-08-16 "keep the `nb ===
  b` face cull — no quads between adjacent water" note was written for (at
  one height no steps existed, so no skirts were needed). Rejected by the
  2026-08-20 user decision in favour of per-level grading: a single fixed
  height cannot express a spring's fan as a stepped gradient.
- **Inlining the water rules in the generic cube loop** — rejected: one
  block's divergent geometry/culling tangled into the generic path; the
  same reason torch/door were already split out into `emitTorch` /
  `emitDoor`.
- **Shader-side vertex displacement** (full-height meshes displaced in the
  shader) — rejected: the geometry is static, so it cannot emit skirt faces
  (contradicting the skirt decision), and it would need a separate
  material/attribute on the shared `matTrans`.

## Consequences

- **The all-source ocean mesh is geometrically unchanged** — same faces,
  positions, UVs, indices, per-vertex light. The one visual delta: a
  water-face corner that used to be darkened by opaque land tucked into its
  corner probes now reads at full `FACE_SHADE` (the no-AO rule) — subtly
  brighter where water meets high ground.
- **A spring's fan reads as a stepped gradient** (0.875 → 0.75 → … → 0.125)
  sloping away from the source; the source cell itself is full height with a
  skirt step down to the flow.
- **A waterfall column reads solid** — full height, no horizontal slit,
  meeting the landing sheet at a clean 1/16 step.
- **No simulation changes** — `src/water.ts` is untouched; the existing
  dirty marking already covers boundary neighbours.
- **Cost:**
  - Skirt quads appear only at level steps (a handful per fan edge);
    top/side face counts elsewhere are unchanged.
  - Dropping AO on water faces removes up to 12 `gb` neighbour probes per
    water face (4 corners × `s1` / `s2` / `dg`), so water-heavy remeshes are
    slightly cheaper than before.
  - `gl` pays a cross-chunk `world.getWaterHeight` only on water-water
    boundary faces (skirt comparisons); all other neighbour reads are the
    existing in-chunk fast path or `gb`.
- **Limits & edge cases:**
  - **Boundary lag:** a skirt across a chunk boundary updates via the
    dirty-remesh budget (≤1 frame per neighbour, nearest first) — the same
    behaviour as any mesh update today; self-correcting.
  - **Unloaded neighbour:** a missing chunk reads `h_nb = 0`, so water at
    the edge of generated space emits its side faces — identical to today's
    world-edge behaviour (neighbour reads as Air).
  - **Flow-over-flow:** the sim never produces a plain flow cell directly
    above another (a mid-fall over a sheet becomes a stream cell); the
    defensive bottom-face emission keeps it a harmless exposed lip.
  - **Coplanar z-fighting:** only equal-height water pairs, resolved by
    culling both sides (the full-height case) — no two emitted faces share a
    plane, so no z-fight.
  - **Swim/camera/raycast:** unchanged — `player.headInWater`, the water FOG
    mood, and the placement raycast all key off the `Water` block id, not
    the mesh height.

## Superseded decisions

- **The POC's static translucent full-block water rendering** (ADR 0003 —
  Chunk meshing & rendering) for flow water: every water cell meshed as a
  full 1×1×1 cube in the transparent pass, with same-block faces culled
  (`nB === b`). Superseded for flow water by this ADR's partial-height
  `emitWater` path; source and stream water still render exactly as before
  (full height, equal-height cull), so the all-source ocean mesh is
  geometrically identical.
- **The 2026-08-16 note "keep the `nb === b` face cull — no quads between
  adjacent water"** — written for the uniform-lowering idea (all adjacent
  flow water at one height, so no steps existed). With graded heights the
  cull became a height comparison (a side face culls when `h_me <= h_nb` and
  emits the skirt when `h_me > h_nb`); equal-height water still culls against
  each other exactly as before.