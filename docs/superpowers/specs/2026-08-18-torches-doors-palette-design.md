# Placeable Torches, Toggleable Doors, Scrollable Palette — Design

Date: 2026-08-18 · Post-POC feature work (follows the water-simulation and
help-overlay iterations)

## Context

The world has 10 block kinds, a 9-slot hotbar, and a fixed 3×3 palette of 9
blocks. The user wants:

1. A **placeable torch** — a wall/floor-mounted light source (visual only for
   now; actual light emission with light levels is deferred, see TODO item 2
   below).
2. A **door** in the classic voxel-game sense: a two-cell-tall block (bottom half + top
   half) that **right-click toggles open/closed**. Closed = solid and rendered
   as a thin vertical panel; open = walkable, rendered as a panel swung to the
   corner of the cell.
3. The palette extended to a **scrollable list** of *all* placeable
   blocks/items (icon + name per row), so it grows naturally as the registry
   grows.
4. `TODO.md` gains a new **Sky & lighting** section with two deferred items:
   (1) clouds and sun/moon in the sky with a day/night cycle; (2) dynamic
   lighting with light levels, for torch / sun / moon positions.

## Block registry (`src/blocks.ts`)

- New ids appended after `Planks = 9`: `Torch = 10`, `DoorBottom = 11`,
  `DoorTop = 12` (13 kinds total). One kind id per block; per-cell *state*
  lives in meta (§ State), not in extra ids.
- `BlockDef` gains:
  - `name: string` — display name (`"stone"`, `"torch"`, `"door"`, …). The
    palette rows and slot tooltips use it (today tooltips show the numeric id).
  - `kind: 'cube' | 'torch' | 'door'` — `'cube'` blocks keep flowing through
    the existing mesher path with their existing `solid` / `transparent`
    flags; the other two kinds go to the special emitters (§ Rendering).
- Flags for the new kinds: torch `{ solid: false, transparent: true,
  kind: 'torch' }`; doors `{ solid: true, transparent: true, kind: 'door' }`.
  The door's `solid: true` means *when closed*; open-state solidity is
  state-dependent and is handled by `world.isSolid` (§ World). Door and torch
  are **never opaque** — they never cull neighbor faces. A closed door is a
  thin panel, so the wall behind it stays visible.
- `PLACEABLE` becomes the 9 current blocks **plus `Torch` and `DoorBottom`**
  (11 logical entries). `DoorBottom` is the door's logical id: it is what the
  palette and hotbar hold; placement expands it into the bottom+top pair.
- `iconTile` still reads `faces[2]`: torch top-face tile = the stem tile (11),
  door top-face tile = the door tile (13), so the existing CSS atlas-crop icon
  machinery works unchanged.

### Per-cell state (`meta`)

One byte of state per cell, same pattern as the existing water flag arrays:

| kind  | bit 0         | remaining bits                                |
|-------|---------------|-----------------------------------------------|
| torch | wall-mounted? | bits 1–3: if wall-mounted, face `1:+X, 2:-X, 3:+Z, 4:-Z` (no ceiling mounts); if floor-mounted, unused |
| door  | open?         | bit 1: axis — `0` = panel thin in X, `1` = panel thin in Z |

- Stored in **both** door cells, identically. The mesher reads strictly the
  local cell, so a door pair spanning a chunk seam renders correctly from
  either side.
- Pack/unpack helpers (`packTorchMeta(face | 'floor')`, `packDoorMeta(open,
  axis)`, and their decoders) are pure functions in `blocks.ts`, testable
  without the world.
- Ordinary (cube) blocks always carry meta 0.

## World (`src/world.ts`)

- `Chunk` gains `meta: Uint8Array(CHUNK_VOL)`; allocated zeroed in
  `ensureChunk`, streamed and unloads with the chunk exactly like
  `wlevel`/`wsource`/… today.
- `getMeta(wx, wy, wz): number` — 0 for missing chunks (mirror of
  `getBlock`).
- `setBlock(wx, wy, wz, b, meta = 0)` — writes block **and** meta together;
  marks the chunk *and its 6 face-neighbors* dirty (unconditional, same as
  today). Changing door open/closed state changes which neighbor faces are
  hidden by the panel and what is solid, so neighbors must remesh.
- New `isSolid(x, y, z): boolean` — the single truth for collision:
  - air → false, torch → false, missing data → false
  - door → `!open` (meta bit 0)
  - otherwise → `isOpaque(b)` — the legacy player rule (leaves/glass are
    `solid` for the water sim's blocking checks but pass-through for the
    player; `BLOCKS[b].solid` is **not** the collision truth, or glass and
    leaves would become walls — a gameplay change this feature doesn't make)

## Player (`src/player.ts`)

- Constructor takes an optional second callback:
  `new Player(getBlock, isSolidAt?)`.
- `collides()` uses `isSolidAt(x, y, z)` when provided, otherwise falls back
  to `isOpaque(getBlock(x, y, z))` — existing tests (which construct `Player`
  with one callback) are untouched.
- `main.ts` passes `(x, y, z) => world.isSolid(x, y, z)` as the second
  argument. Consequences: a **closed** door (both halves) blocks movement as a
  full block; an **open** door is walkable; a torch is never a collider.
- `intersectsVoxel` (placement self-overlap guard) keeps using the AABB vs.
  voxel test; door placement checks it for **both** cells.

## Rendering (`src/main.ts` atlas, `src/chunk-mesher.ts`)

### Atlas tiles

The 256×256 atlas (row 0, 16 tiles per row, currently 11 used) gains 3 tiles:

| tile | name | look |
|------|------|------|
| 11   | `torchStem` | brown vertical wood grain (full-tile, so any stretch onto the thin post still reads as wood) |
| 12   | `torchFlame` | orange/yellow flame |
| 13   | `door` | plank panel, darker frame, a latch on one side |

Painted with the existing `TILES` painter mechanism (deterministic per-tile
prng). `TILE_NAMES` extended accordingly.

### Mesher

`meshChunk`'s per-cell loop branches on `BLOCKS[b].kind`:

- `'cube'` → the existing path, byte-for-byte unchanged.
- `'torch'` / `'door'` → new pure emitters writing into the **opaque**
  buffer, built on a small `pushBox(buf, x0..x1, y0..y1, z0..z1, perFaceTile)`
  helper in `chunk-mesher.ts`:
  - a box face is emitted unless the neighboring *cell* in the face direction
    is opaque **or** special (torch/door) — a torch stub's back face vanishes
    against the wall it mounts on;
  - shading reuses `FACE_SHADE` per face direction; **no vertex AO** on
    partial geometry;
  - UVs map the face's 16×16 tile (same as cubes).

Special-block geometry (cell-local, both door halves emit identical geometry
in their own cell):

| block | state | emitted box (cell-local) | face tiles |
|---|---|---|---|
| torch | floor-mounted | stem `x,z ∈ [0.41, 0.59]`, `y ∈ [0, 0.875]` | sides/bottom = stem, top = flame |
| torch | wall-mounted (`f`) | stub along `+f` from the wall face: `0 → 0.375` in `f`, centered `0.41–0.59` on the face's other two axes | all faces stem **except** the outward tip (`+f`) = flame |
| door (both halves) | closed, axis X | `x ∈ [0.4, 0.6]`, `z ∈ [0, 1]`, `y ∈ [0, 1]` | all = door |
| door (both halves) | closed, axis Z | `z ∈ [0.4, 0.6]`, `x ∈ [0, 1]`, `y ∈ [0, 1]` | all = door |
| door (both halves) | open, axis X | `x ∈ [0, 0.55]`, `z ∈ [0, 0.2]`, `y ∈ [0, 1]` (panel swung to the `x=0,z=0` corner) | all = door |
| door (both halves) | open, axis Z | `z ∈ [0, 0.55]`, `x ∈ [0, 0.2]`, `y ∈ [0, 1]` | all = door |

The open-door slab is clamped inside the cell (a true 90° swing of a
full-width panel would overhang by half a cell); it reads as a door open
against the wall. State changes are an instant snap — no animation.

Raycast needs **no changes**: torch/door are non-air/water, so LMB already
targets them and RMB's existing face math already yields the mount cell.

## Interaction (`src/main.ts`)

`onMouseDown` while pointer-locked, after the existing casts
(`castFromCamera(true)` for break, `(false)` for place):

### RMB (button 2) — in order of precedence

1. **Aim at a door half** (`DoorBottom`/`DoorTop`, any state): **toggle**
   open/closed, regardless of the held item. New meta written to the aimed
   cell **and** the partner cell (half above/below, if loaded and actually a
   matching half with the same axis); remesh around both cells; water sim not
   involved (block ids unchanged, so no new water can appear). Axis and mount
   face never change.
2. **Hold torch** (logical `Torch`): place only if the target cell `T` is
   **Air** *and* the face cell behind it (the cast hit) is a solid opaque
   block. No torches in water, on ceilings (`ny = -1`), on door faces (doors
   are not opaque → invalid support), or mid-air. Meta = mount face (or
   floor).
3. **Hold door** (logical `DoorBottom`): `T` and `T+1` (the cell above) must
   both be Air **or** Water (water cells are dried by `sim.edit` on
   placement), `T+1 < WORLD_Y_MAX`, and neither cell may intersect the
   player's AABB (while closed the door is a full solid block in both
   cells). Axis from the face: `±X → X-thin`, `±Z → Z-thin`, floor (`+Y`) →
   X-thin. Writes `DoorBottom`@`T`, `DoorTop`@`T+1`, both with
   `packDoorMeta(open=false, axis)`; `sim.edit` on both cells.
4. **Hold a normal block** `B`: `T` may be Air, Water, **Torch** (the torch
   is replaced — `setBlock(T, B)` with meta 0 clears its state), or a **door
   half** (the whole pair is removed first — the partner cell, if loaded, is
   set to Air with meta 0 — then `B` is placed at the aimed half). All other
   existing guards apply (world bounds, player overlap).

### LMB (button 0) — break

The cast stops at torch/door (they are not air/water), so the existing
`springTarget` logic targets them as it targets solids:

- **Door half** → clear the aimed cell **and** the partner cell (if loaded
  and a matching half), metas 0; `sim.edit` on each cleared cell; remesh
  around each.
- **Torch** → clear the cell, meta 0; `sim.edit`; remesh.
- Everything else: today's behaviour.

`sim.edit(x, y, z, b)` needs **no change**: torch/door ids are
non-water, so the existing "dries the cell and re-marks dependents" path is
exactly right for replacing or removing them. Only the door **toggle**
skips `sim.edit` (block ids didn't change).

Edge cases accepted (POC):

- instant open/close snap (no swing animation);
- a door pair split across an unloaded/unload boundary can orphan one half if
  the partner chunk disappears — it renders as a stray half-panel until the
  chunk streams back (data lives in the chunk);
- no ceiling torches, no torch on a door face;
- torches and doors are not placeable through water (target must be Air for
  torches; doors over Water are allowed and dry it).

## UI: scrollable palette (`index.html`, `src/ui.css`, `src/main.ts`)

- The 9 static `.slot` divs in `#palette` are replaced by an **empty**
  `#palette`; `main.ts` builds one row per `PLACEABLE` entry (in registry
  order): icon (existing `placeIcon` atlas crop) + a **name** label
  (`BLOCKS[b].name`).
- CSS: right-side vertical strip — `position: fixed; top/right: 12px`, flex
  column, ~176px wide, `max-height: 88vh; overflow-y: auto`, the hotbar's
  dark translucent panel style, 4px gap. Row ≈ 44px icon + name text on the
  right.
- Row click: unchanged semantics — assigns the block into the **currently
  selected** hotbar slot. Rows carrying the selected slot's block show the
  yellow `.sel` border (a block can appear in multiple hotbar slots, so
  several rows may highlight).
- Hotbar: mechanics untouched (9 slots, digits 1–9, wheel cycling, click-to-
  close/re-lock, defaults = first 9 of the new `PLACEABLE` order — i.e. the
  old 9 blocks; default selection stays planks via the existing
  `indexOf` call).
- Help overlay: one new grid row — `RMB on door` / `open / close`.
- `ui.ts` (`Hotbar` class) is unchanged; the palette is presentation code in
  `main.ts`, consistent with how T11 did it (not node-tested, like the other
  DOM in `main.ts`).

## Documentation

- `TODO.md`: new **Sky & lighting** section (ordered after the existing
  sections) with the two deferred items, tracked but not implemented:
  1. **Clouds and a sun/moon in the sky with a day/night cycle.**
  2. **Dynamic lighting with light levels**, for torch / sun / moon positions.
     (Note beside it: torches now *exist* as placeable blocks but emit no
     light until this lands — they are visual only.)
- `PROJECT.md`: short new section **16. Special blocks (torch, door)**
  summarising the meta model, the geometry table, and the interaction
  matrix; `§15` (Deferred) gets a pointer noting that the day/night-cycle and
  skylight/light items are now tracked in `TODO.md` → Sky & lighting.

## Files touched

| File | Change |
|---|---|
| `src/blocks.ts` | ids `Torch`/`DoorBottom`/`DoorTop`; `name` + `kind` on `BlockDef`; new entries in `BLOCKS`; `PLACEABLE` +torch +door; `TILE_NAMES` +3; meta pack/unpack helpers |
| `src/world.ts` | `meta` array on `Chunk` + `ensureChunk`; `getMeta`; `setBlock` meta param; `isSolid` |
| `src/player.ts` | optional `isSolidAt` constructor callback; `collides` uses it when provided |
| `src/chunk-mesher.ts` | `kind` branch; `pushBox` helper; torch/door emitters (geometry table above) |
| `src/main.ts` | 3 atlas tile painters + names; palette rows generated from `PLACEABLE` (row = icon + name); RMB door-toggle / torch-support / door-pair placement; LMB pair-break; `world.isSolid` wired into `Player`; help grid row; slot tooltips use `name` |
| `index.html` | `#palette` becomes an empty container; help grid gains the door row |
| `src/ui.css` | `#palette` → vertical scrolling strip; row layout (icon + `.name`); scrollbar styling within the panel |
| `src/__tests__/blocks.test.ts` | 13 ids, 13 defs, `PLACEABLE` = 11, kinds, names, non-opaque door/torch |
| `src/__tests__/world.test.ts` | meta via `setBlock`, dirty propagation incl. neighbors, `isSolid` cases (closed/open door, torch) |
| `src/__tests__/player.test.ts` | door blocking via `isSolidAt`: closed door stops, opened door passes |
| `src/__tests__/chunk-mesher.test.ts` | torch floor/wall geometry (face counts, wall back-face culled against stone); door closed vs open box; stone neighbor face **not** culled behind a closed door |
| `src/__tests__/water.test.ts` | placing a torch/door id into a water cell clears that cell's water state (existing path, new block values) |
| `TODO.md` | new Sky & lighting section (2 items) |
| `PROJECT.md` | §16 special-blocks section; §15 pointer to TODO.md |

`src/ui.ts` / `src/__tests__/ui.test.ts`, `src/water.ts` (core), `src/terrain.ts`,
`src/streaming.ts`, `src/raycast.ts` are **unchanged**.

## Verification

1. `npm test` — all suites green (existing suites: water, world, raycast,
   streaming, terrain, meshing, player, ui, blocks with updates).
2. `npm run build` — `tsc --noEmit` clean + vite build.
3. `npm run dev` manual pass (user):
   - palette (E) is a scrolling list of 11 named entries; scrolling works;
     clicking assigns into the selected hotbar slot; selection highlight
     follows the hotbar slot.
   - torch: place on a floor (reads as a standing post with a flame top) and
     on a wall (short stub, flame outward); LMB breaks it; nothing glows yet.
   - door: place from a wall face or beside the terrain edge; it appears as a
     2-cell panel; RMB swings it open (walkable gap in the corner); RMB
     again closes it and it blocks movement again; LMB on either half removes
     the whole door.
   - open a door in a doorway and walk through it; a closed door stops you.
   - placing a stone block where a torch/door sits replaces it.

Commit style: `feat: ...` (post-POC work, matching the help-overlay commit).