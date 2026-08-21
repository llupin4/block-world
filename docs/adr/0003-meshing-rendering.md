# 0003. Chunk meshing & rendering — per-chunk two-buffer meshing with world-culled faces, baked per-vertex AO, and two shared unlit materials over an 11-tile canvas atlas

- **Status:** Accepted
- **Last updated:** 2026-08-20
- **Sources:** (superseded by this ADR; recoverable via `git show 0cf878c:<path>`)
  - `docs/superpowers/plans/2026-08-15-voxel-sandbox-poc.md` (Task 5 — chunk mesher; Task 6 — demo scene; Task 12 — underwater FX; Task 13 — polish + gate)
  - `PROJECT.md` (§6 Chunk meshing)
  - `docs/superpowers/specs/2026-08-20-water-level-mesh-design.md` (Context; supersedes/face-cull notes)
  - `docs/superpowers/specs/2026-08-19-day-night-clouds-design.md` (sky-mood / integration notes)

## Context

The world is a chunk store of cubic 16×16×16 chunks (4096 cells) with
per-chunk dirty marking (ADR 0002 — World model & terrain). The rendering
principle is one mesh per chunk, not per block: a solid 16³ chunk is 4096
blocks but only 1536 visible faces on its shell, and interior faces should
never be emitted at all.

The renderer is unlit — `MeshBasicMaterial`, no scene lights — so all shading
(face direction, corner occlusion) must be baked into vertex data at mesh
build; nothing in the render loop computes light. Textures are procedural
(no build-time assets), so every block face must be drawn at runtime into a
single canvas consumed by a `CanvasTexture`.

The mesher must be a pure function over the chunk store — it reads
neighbours through `world.getBlock`, with missing chunks reading as Air — so
it is unit-testable in node (no DOM/WebGL) and so generation/meshing can
later move to workers as a mechanical refactor.

## Decision

**Per-chunk two-pass meshing.** `meshChunk(world, cx, cy, cz)` walks the
chunk in `ly → lz → lx` order, then the six-face table order
`[+X, -X, +Y, -Y, +Z, -Z]`, and fills up to two flat buffers (`opaque` and
`trans`); a pass with zero faces yields no geometry. Per-vertex data per
buffer:

- `position` — world-space coordinates; meshes are added at the origin. The
  reference spec proposed chunk-local vertices plus a per-chunk mesh offset
  (to keep float precision sane far from the origin); the POC rejected that
  as a deviation with identical rendered output, because streaming avoids
  per-frame offset bookkeeping when chunks are rebuilt.
- `color` — grayscale baked shade, itemSize 4 (rgb + constant baked alpha
  1.0): `FACE_SHADE[f] × AO_SHADE[occ]`, with
  `FACE_SHADE = [0.6, 0.6, 1.0, 0.5, 0.8, 0.8]` in face-table order. This
  vertex data is the light injection point: ADR 0007 — Dynamic lighting
  later layered a per-corner `aLight` (block/sky light) and a one-uniform
  day/night factor onto the same two shared materials.
- `uv` — atlas tile coordinates from the block's per-face tile index:
  `u = (tileCol + corner_u) / 16`, `v = (15 − tileRow + corner_v) / 16`, so
  each face lands exactly inside its tile cell.
- `index` — `Uint32Array`; two triangles per face
  (`base, base+1, base+2, base, base+2, base+3`).

There is no `normal` attribute: the unlit material never reads it.

**Face culling against the world.** For each non-Air block and each of its
six faces, the neighbour across the face is read from the world (missing
chunks read as Air, so faces on the edge of generated space are always
emitted). A face is emitted when the neighbour across it is not an opaque
same-material block:

- The face is culled when the neighbour is opaque (`isOpaque` = not Air and
  not flagged transparent).
- In the transparent pass the face is additionally culled when the
  neighbour is the same block (`nB === b`) — no internal water–water,
  glass–glass, or leaves–leaves seams.
- Opaque blocks (Stone, Dirt, Grass, Sand, Wood, Planks) emit only into the
  opaque pass; transparent non-Air blocks (Water, Leaves, Glass) emit only
  into the transparent pass.

Corner winding is CCW viewed from outside (three.js `FrontSide`); the
reference spec's ±X corner rows were clockwise and would have culled every
side face, so the built table corrects those two rows (deviation D2).

**Baked per-vertex ambient occlusion + per-face shade** — the core look of
the POC. For a face whose outward neighbour cell is `nB`, each corner
samples the three voxels touching that corner on the outside of the face —
the two side cells and the face-diagonal cell, all in world coordinates
around `nB`, along the face's two tangent axes (the reference spec's sampler
mistook the normal axis for a tangent on X/Z faces; deviation D3). Each
probe returns 1 if opaque: `occ = (s1 && s2) ? 3 : s1 + s2 + diag`, shade
`AO_SHADE[occ] = [1.0, 0.8, 0.62, 0.48]`. The product `FACE_SHADE[f] ×
AO_SHADE[occ]` is written once at mesh build (deviation D4), so "lighting"
needs no runtime work — it is pure vertex data. Water faces later skip the
AO factor (see ADR 0006 — Water rendering).

**11-tile canvas texture atlas.** A 256×256 canvas holds a 16-column grid of
16×16-px tiles; the 11 tiles sit in row 0, columns 0..10. Each tile is drawn
by a deterministic per-tile canvas painter (speckle, vertical-strip,
concentric-ring, frame-plus-highlight, and plank patterns) with its own
seeded PRNG (`0x5eed + t × 0x9e3779b9` per tile index `t`). Tile list
(`TILE_NAMES`): `grassTop`(0), `grassSide`(1), `dirt`(2), `stone`(3),
`sand`(4), `water`(5), `woodSide`(6), `woodTop`(7), `leaves`(8), `glass`(9),
`planks`(10). Per-block face tiles are indexed in the order
`[+X, -X, +Y, -Y, +Z, -Z]`:

| block  | tiles |
|--------|-------|
| Air    | 0 ×6 |
| Stone  | 3 ×6 |
| Dirt   | 2 ×6 |
| Grass  | sides 1, top 0, bottom 2 |
| Sand   | 4 ×6 |
| Water  | 5 ×6 |
| Wood   | sides 6, top/bottom 7 |
| Leaves | 8 ×6 |
| Glass  | 9 ×6 |
| Planks | 10 ×6 |

The texture is a `CanvasTexture` with default `flipY` (canvas row 0 lands at
`v≈1`, exactly where the mesher's UV math points), `NearestFilter` for both
min and mag filtering, and `generateMipmaps = false` — nearest filtering
plus no mipmaps is the entire guard against bleed into atlas neighbours.

**Shared materials + debug.** Two materials, built from the one atlas and
shared by every chunk mesh in the scene (no lights in the scene; vertex
colors carry the baked shade):

- opaque: `MeshBasicMaterial({ map: atlas, vertexColors: true })`
- transparent: `MeshBasicMaterial({ map: atlas, vertexColors: true,
  transparent: true, depthWrite: false, side: DoubleSide })` with a shared
  opacity (0.75 in the POC; 0.85 once the sky work landed)

Because both materials are shared across all chunks, the `C` key global
wireframe debug flips exactly two flags (`matOpaque.wireframe`,
`matTrans.wireframe`) to render the whole world wireframe — seams,
missing/duplicate faces, and stray geometry become visible at a glance. The
final hint line (bottom-left `#hint` div) lists the controls, including
`C wireframe`:
`block-world — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · C wireframe · E palette · 1-9/wheel select · LMB break · RMB place · world streams in around you · ESC release`.

## Alternatives considered

- **Per-block meshes** — rejected: 4096 blocks against 1536 shell faces per
  solid chunk; interior faces must not be emitted at all.
- **Greedy meshing** — rejected for the POC: merging coplanar same-type
  quads conflicts with per-vertex AO (only quads whose AO matches on the
  shared edge may be merged). Deferred until vertex-bound.
- **Chunk-local vertices + per-chunk mesh offset** — rejected: identical
  rendered output; world-space vertices remove per-frame offset bookkeeping
  from streaming rebuilds.
- **Separate transparent material per block** — rejected (POC deviation D5):
  one shared `matTrans` for water/leaves/glass; leaves read slightly
  glassy, accepted.
- **Body-driven submersion trigger** — rejected: the mood swap keys off
  `headInWater` (the eye voxel; ADR 0004 — Player & interaction), so a
  1 m pool keeps the air mood until the head actually goes under.
- **Mipmapped atlas** — rejected: with mipmaps on, distant tiles bleed into
  their atlas neighbours and everything gets coloured fringes.
- **`DataArrayTexture` (one texture layer per tile, WebGL2)** — the real fix
  for atlas bleed; it would also remove the UV offset math. Deferred: not
  required for a POC.

## Consequences

- **Remesh cost is per chunk and driven by dirty marking** (ADR 0002 — World
  model & terrain): an edit marks the chunk and its existing face-neighbours
  dirty, and streaming remeshes at most one chunk per frame, so a single
  block edit costs a bounded number of chunk rebuilds inside the frame
  budget. One mesh per chunk also makes three.js' per-mesh bounding-sphere
  frustum culling effective at chunk granularity.
- **Everything runs on the main thread.** Generation and meshing can hitch
  when chunks load; acceptable at small render distance, and moving to
  workers later is a mechanical refactor because both are pure functions
  over buffers.
- **All shading is static vertex data.** With no runtime lights, the baked
  `FACE_SHADE × AO` product is the entire look. ADR 0007 — Dynamic lighting
  later added per-vertex `aLight` and a one-uniform day/night factor to the
  same two materials, so night is an O(1) uniform write — no re-baking, no
  remeshing.
- **Water faces skip vertex AO** (ADR 0006 — Water rendering): the AO
  sampler assumes a full box reaching the cell boundary, which
  partial-height water violates, so water faces read at plain
  `FACE_SHADE[f]` — water meeting high ground reads subtly brighter than
  the land tucked into its corner probes — and water-heavy remeshes drop up
  to 12 neighbour probes per water face.
- **Known limits:**
  - No per-chunk debug boxes — the shared materials give a global
    wireframe only; per-chunk box outlines are a post-POC nicety.
  - No mipmaps or bleed guards beyond atlas hygiene (`NearestFilter`,
    `generateMipmaps = false`); `DataArrayTexture` remains the deferred fix.
  - Transparent chunks are not sorted back-to-front; with a single mostly
    flat water surface the artifacts are minor (POC-accepted).
  - Leaves and water share one transparent material (leaves read slightly
    glassy); splitting them needs their own material.

## Superseded decisions

- **Static translucent full-block water** (POC Task 6 / Task 12): water
  rendered as a single translucent full-cube material in the transparent
  pass, with an edge-triggered head-in-water mood swap on `headInWater` —
  `FogExp2` + background colour + FOV 70→62, swapped as a set in one frame
  in both directions. Superseded for the geometry by ADR 0006 — Water
  rendering (per-level graded water surfaces: the same-material face cull
  became a height comparison, replacing the 2026-08-16 note "keep the
  `nb === b` face cull — no quads between adjacent water", which only held
  while all adjacent water was equal-height; equal-height water still culls
  exactly as before), and for the mood values by ADR 0008 — Sky & day/night
  (time-driven sky moods, including a time-tinted underwater mood; the
  edge-triggered swap and the FOV squeeze survived, the fog/background
  values now come from the day-phase keyframe table). Historical POC
  values: FOV 70→62; background 0x87ceeb (air) / 0x0a2a55 (water); fog
  `FogExp2(0xcfe8ff, 0.004)` (air) / `FogExp2(0x0a2a55, 0.35)` (water).