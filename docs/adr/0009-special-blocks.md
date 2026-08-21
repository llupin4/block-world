# 0009. Special blocks — per-cell `meta` state gives a placeable torch (wall/floor-mounted) and a two-cell toggleable door, with partial-geometry meshing and state-dependent solidity

- **Status:** Accepted
- **Last updated:** 2026-08-20
- **Sources:** (superseded by this ADR; recoverable via `git show 0cf878c:<path>`)
  - `docs/superpowers/specs/2026-08-18-torches-doors-palette-design.md`
  - `docs/superpowers/plans/2026-08-18-torches-doors-palette.md` (Tasks 1–5, 7)
  - `PROJECT.md` (§16 Special blocks)

## Context

The world had 10 block kinds, all full cubes flowing through one mesher path, with a single `solid` flag that doubled as the collision truth. Two requests broke that model: a **placeable torch** (a wall/floor-mounted light source — visual only at first; real emission landed later as ADR 0007 — Dynamic lighting) and a **door** in the classic voxel-sandbox sense (two cells tall, right-click toggles open/closed; closed = solid thin panel, open = walkable panel swung to the cell corner). Both need *per-cell state* (mount face; open/axis/hinge) that a single block id can't carry, and both are non-cube geometry that the existing cull rules would render wrong. The palette also needed to grow from a fixed 3×3 grid into a scrollable list of all placeables (owned by ADR 0010 — UI & inventory).

## Decision

### Block registry extensions (`src/blocks.ts`)

New ids appended after `Planks = 9`: `Torch = 10`, `DoorBottom = 11`, `DoorTop = 12` (13 kinds total). One kind id per block; per-cell *state* lives in meta, not in extra ids. `BlockDef` gains `name: string` (display name, used by palette rows and tooltips) and `kind: 'cube' | 'torch' | 'door'` — `'cube'` keeps the existing mesher path; the other two go to special emitters. Flags: torch `{ solid: false, transparent: true, kind: 'torch' }`; doors `{ solid: true, transparent: true, kind: 'door' }` (the door's `solid: true` means *when closed*; open-state solidity is state-dependent). Door and torch are **never opaque** — they never cull neighbour faces, so the wall behind a closed door stays visible. `PLACEABLE` becomes the 9 current blocks plus `Torch` and `DoorBottom` (11 logical entries); `DoorBottom` is the door's logical id held by the palette/hotbar, expanded into the bottom+top pair on placement. `iconTile` still reads `faces[2]` (torch stem tile 11, door tile 13), so the CSS atlas-crop icon machinery works unchanged.

### Per-cell state (`meta`)

One byte of state per cell, same pattern as the water flag arrays (ADR 0005 — Water simulation):

| kind  | bit 0         | remaining bits |
|-------|---------------|----------------|
| torch | wall-mounted? | bits 1–3: if wall-mounted, face `1:+X, 2:-X, 3:+Z, 4:-Z` (no ceiling mounts); if floor-mounted, unused |
| door  | open?         | bit 1: axis — `0` = panel thin in X, `1` = thin in Z; bit 2: side — `0` = hinges on the cell's min edge of its thin axis, `1` = max edge (chosen by which wall face was aimed: `−X`/`−Z` aim → side 1) |

Stored in **both** door cells, identically — the mesher reads strictly the local cell, so a door pair spanning a chunk seam renders correctly from either side. Pack/unpack helpers (`packTorchMeta(face | 'floor')`, `packDoorMeta(open, axis, side)`, and their decoders) are pure functions in `blocks.ts`, testable without the world. Ordinary cube blocks always carry meta 0.

### World (`src/world.ts`)

`Chunk` gains `meta: Uint8Array(CHUNK_VOL)`, allocated zeroed in `ensureChunk` and streamed/unloaded exactly like the water fields (cross-ref ADR 0002 — World model & terrain). `getMeta(wx, wy, wz)` returns 0 for missing chunks (mirror of `getBlock`). `setBlock(wx, wy, wz, b, meta = 0)` writes block **and** meta together and marks the chunk *and its 6 face-neighbours* dirty unconditionally — changing door open/closed state changes which neighbour faces are hidden and what is solid, so neighbours must remesh. New `isSolid(x, y, z)` is the single collision truth: air → false, torch → false, missing data → false, door → `!open` (meta bit 0), otherwise → `isOpaque(b)` (the legacy player rule — leaves/glass are `solid` for the water sim's blocking checks but pass-through for the player; `BLOCKS[b].solid` is deliberately *not* the collision truth, or glass and leaves would become walls).

### Player (`src/player.ts`)

The constructor takes an optional second callback `new Player(getBlock, isSolidAt?)`; `collides()` uses `isSolidAt(x,y,z)` when provided, else falls back to `isOpaque(getBlock(...))` (existing one-callback tests untouched). `main.ts` passes `(x,y,z) => world.isSolid(x,y,z)`. Consequences: a **closed** door (both halves) blocks movement as a full block; an **open** door is walkable; a torch is never a collider (cross-ref ADR 0004 — Player & interaction). `intersectsVoxel` (the placement self-overlap guard) keeps the AABB-vs-voxel test; door placement checks it for **both** cells.

### Rendering (`src/chunk-mesher.ts`)

The 256×256 atlas (row 0, 16 tiles/row, 11 used) gains 3 tiles: 11 `torchStem` (brown vertical wood grain, full-tile so any stretch onto the thin post reads as wood), 12 `torchFlame` (orange/yellow flame), 13 `door` (plank panel, darker frame, a latch on one side) — painted with the existing deterministic `TILES` painter mechanism (cross-ref ADR 0003 — Chunk meshing & rendering).

`meshChunk`'s per-cell loop branches on `BLOCKS[b].kind`: `'cube'` → the existing path byte-for-byte unchanged; `'torch'`/`'door'` → new pure emitters writing into the **opaque** buffer, built on a small `pushBox(buf, x0..x1, y0..y1, z0..z1, perFaceTile)` helper. A partial-geometry box face is culled only when the box **end** of that face sits on the cell-boundary plane AND the neighbour is opaque, OR the neighbour is a special block whose own geometry on its opposite face *covers that face's area* (rect coverage: a strict superset always culls; with exactly equal coverage the pair keeps exactly one face, by the smaller lexicographic cell index). A face whose box end is interior — or a neighbour whose geometry never touches that plane (a torch post beside a door panel) — is never culled, so panels stay textured from every angle instead of developing see-through slits. Shading reuses `FACE_SHADE` per face direction; **no vertex AO** on partial geometry; UVs map the face's 16×16 tile as cubes do.

Special-block geometry (cell-local; both door halves emit identical geometry in their own cell):

| block | state | emitted box (cell-local) | face tiles |
|---|---|---|---|
| torch | floor-mounted | stem `x,z ∈ [0.41, 0.59]`, `y ∈ [0, 0.875]` | sides/bottom = stem, top = flame |
| torch | wall-mounted (`f`) | stub along `+f` from the wall face: `0 → 0.375` in `f`, centered `0.41–0.59` on the face's other two axes | all faces stem except the outward tip (`+f`) = flame |
| door (both halves) | closed, axis X, side 0 | `x ∈ [0, 0.2]`, `z ∈ [0, 1]`, `y ∈ [0, 1]` | all = door |
| door (both halves) | closed, axis X, side 1 | `x ∈ [0.8, 1]`, `z ∈ [0, 1]`, `y ∈ [0, 1]` | all = door |
| door (both halves) | closed, axis Z, side 0 | `z ∈ [0, 0.2]`, `x ∈ [0, 1]`, `y ∈ [0, 1]` | all = door |
| door (both halves) | closed, axis Z, side 1 | `z ∈ [0.8, 1]`, `x ∈ [0, 1]`, `y ∈ [0, 1]` | all = door |
| door (both halves) | open, axis X | `x ∈ [0, 1]`, `z ∈ [0, 0.2]`, `y ∈ [0, 1]` | all = door |
| door (both halves) | open, axis Z | `x ∈ [0, 0.2]`, `z ∈ [0, 1]`, `y ∈ [0, 1]` | all = door |

The open panel is the **closed panel rotated 90° about its hinge corner** — the same full-size 1×0.2 panel in both states, never a squished slab (the 2026-08-18 user-feedback revision; the original centred/corner-clamped geometry made the open state read as "squished"). A side-1 door's true swing would overhang the cell's far edge, so its open state is clamped to the cell and reads as a small reposition rather than a continuous in-place swing (accepted, POC). State changes are an instant snap — no animation. Raycast needs no changes: torch/door are non-air/water, so LMB already targets them and RMB's existing face math yields the mount cell.

### Interaction (`src/main.ts`)

RMB (button 2), in order of precedence:
1. **Aim at a door half** (`DoorBottom`/`DoorTop`, any state): **toggle** open/closed regardless of the held item. New meta written to the aimed cell **and** the partner cell (half above/below, if loaded and a matching half); remesh around both; water sim not involved (block ids unchanged). Axis and side never change — only the open bit flips.
2. **Hold torch:** place only if the target cell `T` is **Air** *and* the face cell behind it (the cast hit) is a solid opaque block. No torches in water, on ceilings (`ny = -1`), on door faces (doors aren't opaque → invalid support), or mid-air. Meta = mount face (or floor).
3. **Hold door:** `T` and `T+1` (above) must both be Air **or** Water (water cells are dried by `sim.edit` on placement), `T+1 < WORLD_Y_MAX`, and neither cell may intersect the player's AABB (while closed the door is a full solid block in both cells). Axis from the player's **level facing** — the dominant component of `(-sin yaw, -cos yaw)`, the XZ-projected look direction — so the wide flat panel face sits perpendicular to where the player looks; a straight-down aim falls back to the aimed face's normal. Side from the aimed normal along the thin axis: `−X`/`−Z` aim → side 1, else side 0. Writes `DoorBottom`@`T`, `DoorTop`@`T+1`, both `packDoorMeta(open=false, axis, side)`; `sim.edit` on both cells.
4. **Hold a normal block `B`:** `T` may be Air, Water, **Torch** (replaced — `setBlock(T, B)` with meta 0 clears its state), or a **door half** (the whole pair removed first — partner cell set to Air, meta 0 — then `B` placed at the aimed half). All other guards apply (world bounds, player overlap).

LMB (button 0) — break: the cast stops at torch/door (not air/water), so the existing targeting logic reaches them. **Door half** → clear the aimed cell **and** the partner cell (if loaded and a matching half), metas 0; `sim.edit` each; remesh around each. **Torch** → clear the cell, meta 0; `sim.edit`; remesh. Everything else: today's behaviour. `sim.edit(x,y,z,b)` needs no change — torch/door ids are non-water, so the existing "dries the cell and re-marks dependents" path is exactly right; only the door **toggle** skips `sim.edit` (ids didn't change).

## Alternatives considered

- **Extra block ids per state** (e.g. separate open/closed door ids) — rejected: state belongs in a per-cell `meta` byte (same pattern as the water flags), keeping one kind id per block and letting the mesher read strictly local state across chunk seams.
- **Using `BLOCKS[b].solid` as the collision truth** — rejected: it would make glass and leaves walls (they're `solid` for the water sim's blocking checks but pass-through for the player); a dedicated `world.isSolid` keeps the two concerns separate.
- **Squished-slab open-door geometry** — rejected after user feedback: the open panel is the closed panel rotated 90° about its hinge corner, the same full-size panel in both states.

## Consequences

- The water sim had to be re-pinned against the new block ids (ADR 0005 — Water simulation): placing a torch/door id into a water cell clears that cell's water state through the existing `sim.edit` path.
- Known limits (accepted, POC): instant open/close snap (no swing animation); a door pair split across an unload boundary can orphan one half until the chunk streams back (data lives in the chunk); no ceiling torches, no torch on a door face; torches not placeable through water (target must be Air; doors over Water are allowed and dry it); a torch whose support is later broken stays mounted mid-air (visual-only blocks have no physics support check on edit); a side-1 door opens into the min-corner slab (reads as a small reposition).