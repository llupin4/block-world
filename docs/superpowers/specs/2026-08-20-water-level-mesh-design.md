# Water Level Mesh — Design

Date: 2026-08-20 · Resolves the TODO.md Water item "Distinguish flow water from
source water visually" (user request 2026-08-16) by making the mesh height
dynamic: a cell's water surface is its flow level, not a full block.

## Context

Every water cell meshes as a full 1×1×1 transparent cube (`chunk-mesher.ts`:
the cube path emits faces on cell-boundary corners; a face is culled when the
neighbour is opaque or `nB === b`). The per-cell flow state the sim already
maintains per chunk (`src/world.ts`) is render-cosmetic: `wlevel` is a real
decay number (fresh start 7, one lost per sideways spread step, reset to 7 on
any fall; `1..7` for water, `0` dry), `wsource` marks immortal source bodies
(the worldgen sea/lakes and placed springs; `wplaced` distinguishes the two),
`wstream` marks riding cells (falling waterfall columns and water one deep
over a source surface). PROJECT.md §9 states the consequence: "levels are
render-cosmetic (a cell always draws full height), so a flooded cave reads as
full water, not a graded slope."

This design makes the mesher read that state: a resting flow cell's surface
height is its level (a spring's fan renders as a stepped gradient sloping
away from the source), while source and stream water stay full height.

User decisions (brainstorming, 2026-08-20):

- **Per-level graded height.** Non-source, non-stream flow water renders at
  `wlevel / 8` (level 7 → 0.875, level 1 → 0.125). Source water (sea, lakes,
  springs) and stream cells (falling columns, riders) stay full height.
- **Skirt faces at level steps.** When adjacent water cells have different
  surface heights, the taller cell emits its side face across the boundary
  (the typical voxel-engine convention), closing the step visually. This
   supersedes the
  2026-08-16 note "keep the `nb === b` face cull — no quads between adjacent
  water": that constraint was written for the uniform-lowering idea (all
  adjacent flow water at one height, so no steps existed). With graded
  heights the cull becomes a height comparison (see Face rules); equal-height
  water still culls against each other exactly as today.
- **Streams full height.** `wstream` cells render at full cell height, so a
  multi-block waterfall column reads as solid falling water. This is the
  only configuration-safe choice: partial-height water stacked vertically
  leaves a 1/16 see-through slit at every cell boundary that no face
  configuration can patch (the gap sits between two partial boxes, and no
  face can occupy it), so streams must not be partial.

## Approach (selected)

A water-specific emitter function in the mesher — the same structure the
mesher already uses for torch/door (`emitTorch`/`emitDoor`), because water
now has its own partial geometry and its own cull rule:

- `emitWater()` in `src/chunk-mesher.ts` takes over all six faces of a water
  cell. The cube loop routes `Block.Water` to it and no longer runs the
  generic full-cube face path for water.
- A pure height helper `waterSurfaceHeight(wlevel, wsource, wstream)` in
  `src/blocks.ts` is the single source of truth for a cell's surface height;
  the world accessor and the mesher both use it, so the two can never
  disagree.
- A `World.getWaterHeight(x, y, z)` accessor lets the mesher ask a neighbour
  chunk for its cell's surface height (cross-chunk reads only; the in-chunk
  fast path reads the chunk's arrays directly, like the existing `gb`/`gm`
  readers).

Rejected alternatives: inlining the rules in the generic cube loop (one
block's divergent geometry/culling tangled into the generic path — the reason
torch/door were already split out); shader-side vertex displacement (can't
emit skirt faces because the geometry is static, contradicting the skirt
decision, and would need a separate material/attribute on the shared
`matTrans`).

## Height model

`waterSurfaceHeight(wlevel, wsource, wstream): number` in `src/blocks.ts`:

- `wsource === 1 || wstream === 1` → `1.0`
- otherwise → `wlevel / 8` (levels `1..7` → `0.125 … 0.875`)

It is a pure function of the three per-cell bytes; no block-id argument is
needed (callers only invoke it for `Water` cells). It relies on the existing
strict invariant from the water-sim design that a `Water` block cell always
has `wlevel >= 1` (world.ts: "0 dry, 1..7 water"), so the result is always
`0.125 .. 1.0` — no degenerate zero-height box is possible.

## World accessor

`World.getWaterHeight(wx, wy, wz): number` in `src/world.ts`, a sibling of
`getBlock`/`getMeta`:

- Resolves the chunk for the cell; missing chunk → `0` (reads dry, mirroring
  `getBlock` = Air).
- Otherwise returns `waterSurfaceHeight` of that cell's
  `wlevel`/`wsource`/`wstream` bytes.

The value is only meaningful when the cell's block is `Water`; the mesher
checks the block id first (via `gb`) and only then asks for the height.

## Mesher — `emitWater()`

Signature (inside `chunk-mesher.ts`):

```ts
emitWater(
  buf: Buf,            // the trans pass buffer
  gb: (x, y, z) => number,   // existing block reader (in-chunk fast path)
  gl: (x, y, z) => number,   // new: neighbour surface-height reader
  wx, wy, wz: number,        // cell origin (world space)
  hMe: number,               // this cell's surface height
  lightAt: LightSampler,
): void
```

`gl` is built in `meshChunk` exactly like `gb`/`gm`: in-chunk neighbours read
`waterSurfaceHeight(chunk.wlevel[i], chunk.wsource[i], chunk.wstream[i])`
directly (no string key / Map lookup); only cross-chunk samples pay
`world.getWaterHeight`. The caller (`meshChunk`) computes `hMe` the same way
for the cell itself.

### Face rules

For a water cell of height `h_me`, per FACES order `[+X, -X, +Y, -Y, +Z, -Z]`
with neighbour block `nB` and neighbour surface height `h_nb` (only queried
when `nB === Water`):

| Face | Culled when | Emitted at |
|---|---|---|
| +Y (top) | above is opaque; or above is `Water` and `h_me === 1.0` (interior boundary — the full-height cell's top sits on the shared plane, and emitting would z-fight the water above's underside) | `y + h_me` |
| −Y (bottom) | below is opaque; or below is `Water` at full height (coplanar, z-fight) | `y` |
| side (±X, ±Z) | neighbour is opaque; or neighbour is `Water` and `h_me <= h_nb` (equal → both cull, today's behaviour; taller-neighbour → the neighbour's skirt covers this face's region) | box `y … y + h_me` |

Consequences of the table:

- **Skirt rule (sides, water vs water):** the face is emitted exactly when
  `h_me > h_nb` — strictly taller. The skirt spans the cell's full box height
  (`y … y+h_me`), not just the strip above the neighbour's surface; the lower
  portion hides behind the neighbour's water and blends as the same material
  (transparent, `depthWrite: false`, DoubleSide — a double-covered region
  reads as slightly denser water, which is the intended step look).
- **Top lip:** a partial cell (`h_me < 1.0`) with water above (always a
  full-height stream/source by the sim's rider rule — "water that lands one
  deep over a source body's surface … rides it") emits its top face at
  `y + h_me`: the visible lip under a waterfall column.
- **Equal heights:** both sides cull — the 2026-08-16 "no quads between
  adjacent water" behaviour, preserved for the common case (the whole ocean
  is equal-height source water, geometrically identical to today's mesh).
- **Bottom over a shallower water cell** (flow-over-flow, a state the sim
  never produces — a mid-fall over a sheet becomes a stream cell) emits, so
  the defensive case is a harmless exposed lip rather than a see-through seam.

### Geometry

Using the existing `FACES` corner table (cell-local 0/1 corners):

- +Y face: all four corners at `y + h_me` (corner `c[1]` maps to `h_me`, not
  `c[1]`).
- side faces: corner y scales `c[1] → c[1] * h_me` (bottom stays `0`, top
  rises to `h_me`); x/z corners unchanged.
- −Y face: corners unchanged (`y`, full 1×1).

UV: +Y/−Y faces keep the full tile. Side faces' v-axis compresses by `h_me`
(the water tile is near-uniform noise, so the vertical stretch is invisible).

Shading: `FACE_SHADE[f]` only — **no vertex AO** on water faces. The AO
sampler (`s1`/`s2`/`dg` opacity probes at the face's outside corners) assumes
a full box reaching the cell boundary; on a partial box it is slightly wrong,
and the special-block pass (`pushBox`) already sets the precedent of no AO on
partial geometry. Per-vertex light (`cornerLight`, baking `blight`/`skylight`
from the outside cells) is unchanged.

## Update flow & performance

No simulation changes. `WaterSim.writeCell` writes through
`world.setBlock` (src/water.ts:151), which already marks the edited chunk
**and its six face-neighbour chunks** dirty; the streaming pass
(`streaming.ts`) reschedules dirty chunks for budgeted remesh (nearest
first), and `sim.touched` chunks take the `REBUILD_BUDGET` path in
`main.ts`. A level change at a chunk boundary therefore updates the
neighbour's skirt faces through the existing dirty-remesh machinery,
self-correcting within the existing frame budget.

Cost:

- The ocean (all `wsource`, full height) is geometrically identical to
  today's — same faces, positions, UVs, indices, per-vertex light. The one
  visual delta is the no-AO rule: a water-face corner that used to be
  darkened by opaque land tucked into its corner probes now reads at the full
  `FACE_SHADE` (subtly brighter where water meets high ground).
- Skirt quads appear only at level steps (a handful per fan edge); top/side
  face counts elsewhere are unchanged.
- Dropping AO on water faces removes up to 12 `gb` neighbour probes per water
  face (4 corners × `s1`/`s2`/`dg`), so water-heavy remeshes are slightly
  cheaper than today.
- `gl` pays a cross-chunk `world.getWaterHeight` only on water-water boundary
  faces (skirt comparison); all other neighbour reads are the existing
  in-chunk fast path or `gb`.

## Files

- `src/blocks.ts` — add `waterSurfaceHeight(wlevel, wsource, wstream)` (pure,
  exported).
- `src/world.ts` — add `World.getWaterHeight(x, y, z)` (imports
  `waterSurfaceHeight` from `blocks.ts`; `world.ts` already imports from
  `blocks.ts`, so no circular dependency — which is why the helper lives in
  `blocks.ts`, not `chunk-mesher.ts`, which `world.ts` must not import).
- `src/chunk-mesher.ts` — add `emitWater(...)`; build the `gl` reader in
  `meshChunk`; route `Block.Water` from the cube loop to `emitWater` (water
  no longer runs the generic full-cube face path); in-chunk `hMe` from the
  chunk's water arrays.
- `src/water.ts` — no changes (dirty-marking already covers boundary
  neighbours).
- Tests: `src/__tests__/blocks.test.ts`, `src/__tests__/world.test.ts`,
  `src/__tests__/chunk-mesher.test.ts` (see Testing).

## Testing (TDD)

Unit, in the existing vitest files:

- `blocks.test.ts` — `waterSurfaceHeight` table: flow level 1 → 0.125, 4 →
  0.5, 7 → 0.875; `wsource=1` → 1.0 at any level; `wstream=1` → 1.0 at any
  level; source+stream → 1.0.
- `world.test.ts` — `getWaterHeight`: missing chunk → 0; a flow cell level 6
  → 0.75; a source cell (level 5, source bit) → 1.0; a stream cell (level 3,
  stream bit) → 1.0.
- `chunk-mesher.test.ts` — `meshChunk` on small hand-built worlds, asserting
  on the `trans` VoxelBuffer (vertex positions/indices):
  1. **Lone level-7 flow cell over solid:** top face at `y + 0.875` (all four
     top corners), four side faces present (each spanning `y … y+0.875`), no
     bottom face (solid below culls).
  2. **Level 7 beside level 6:** the taller cell emits its boundary side face
     (skirt), the shorter cell emits none; tops at 0.875 and 0.75
     respectively.
  3. **Equal levels (7 beside 7):** no face between the cells — today's
     cull preserved.
  4. **Source beside level-7 flow:** the source (1.0) emits its skirt; the
     flow cell (0.875) culls its face toward the source.
  5. **Two-cell stream column:** both cells full height; no face between the
     cells (both cull at equal height 1.0); the lower cell's top face is
     culled (water above, `h_me === 1.0`); the lower cell's bottom face is
     culled over solid; the column's side faces span full height.
  6. **Shading:** a water face's vertex colour equals `FACE_SHADE[f]` with no
     AO multiplier even when opaque neighbours tuck the face's outside
     corners (the AO-drop is pinned).
  7. **Per-vertex light still bakes:** a water top face in a lit column gets
     the `cornerLight` values (pins that the AO drop did not touch the light
     path).

Manual verification (dev server): place a spring on a hillside — the fan
reads as a stepped gradient (0.875 → 0.75 → …) running down the slope; a
waterfall into a basin reads as a solid full-height column meeting the sheet
at a clean 1/16 step; the ocean surface is visually unchanged. `?phase` dev
hooks remain available for lighting checks.

## Risks & edge cases

- **Boundary lag:** a skirt across a chunk boundary updates via the
  dirty-remesh budget (≤1 frame per neighbour, nearest first) — the same
  behaviour as any mesh update today; self-correcting.
- **Unloaded neighbour:** a missing chunk reads `h_nb = 0`, so water at the
  edge of generated space emits its side faces — identical to today's
  world-edge behaviour (neighbour reads as Air).
- **Flow-over-flow:** the sim never produces a plain flow cell directly above
  another (a mid-fall over a sheet becomes a stream cell); the defensive
  bottom-face emission keeps it a harmless exposed lip.
- **Coplanar z-fighting:** only equal-height water pairs, resolved by
  culling both sides (the full-height case) — no two emitted faces share a
  plane, so no z-fight.
- **Swim/camera/raycast:** unchanged — `player.headInWater`, the water FOG
  mood, and the placement raycast all key off the `Water` block id, not the
  mesh height.