# Dynamic Lighting with Light Levels — Design

Date: 2026-08-19 · Branch `dynamic-lighting`. Implements the second "Sky &
lighting" item from `TODO.md` (and the flood-fill skylight/block-light item
deferred from PROJECT.md §15): two 0–15 integer light fields propagated locally
through the voxel grid, baked into the chunk vertex data, with day/night
handled per-vertex at render time. The first item of the TODO ("clouds and a
sun/moon with a day/night cycle", branch `day-night-clouds`) already landed and
supplies the clock and the `worldDim` stand-in this project replaces.

## Context

Where the world is today:

- **Unlit renderer.** `MeshBasicMaterial` with per-vertex
  `FACE_SHADE × AO` baked into the shared `colors` buffer. The only "time of
  day" the terrain sees is a material-level `worldDim` scalar
  (1.0 → 0.33) written by `sky.apply` — a documented stand-in until per-block
  skylight lands.
- **Torches are visual only** — a bright tile, no glow (TODO note).
- **Chunk storage** already carries parallel `Uint8Array` fields per chunk
  (`blocks`, `meta`, `wlevel`, `wsource`, `wplaced`, `wstream`); 16³ chunks,
  `World Y ∈ [−32, 64]`, ~125-chunk loaded ring, ≤2 loads + ≤2 remeshes per
  frame (PROJECT.md §9 budget).
- **The water sim** (`src/water.ts`) already implements the local-propagation
  pattern this design mirrors: a world-coord `Set<string>` queue
  (insertion-ordered FIFO with dedup), `tick(budget)`, an `edit()` hook for
  player mutations, a load-time bounded `settle`, and a `touched` set
  consumed exactly once per frame to mark chunks `dirty` for the existing
  remesh drain.
- **`WorldTime`** (`src/time.ts`) advances in the fixed 60 Hz substep;
  `sampleSky(phase)` is a pure 9-anchor keyframed sampler with `sunDir`.

This project delivers:

1. **Two light fields** (block light + skylight, 0–15) stored per chunk and
   maintained by a cheap local propagation — the classic voxel-sandbox
   convention of propagating integer levels through the grid (light does not
   know which source lit it; state is local, nothing is remembered).
2. **A recompute-relaxation engine** (`src/light.ts`) mirroring the water
   sim's shape: one queue, one local rule, player edits and chunk load/unload
   as the only seeds.
3. **Per-vertex light baking** in the mesher (a new 2-component `aLight`
   attribute) plus a **per-frame `uDayness` uniform** so day/night fades are
   O(1) — no re-baking, no brightness waves sweeping the terrain at dusk.
4. **Retirement of the `worldDim` material dim** (it stays as the
   cloud/sky *visual* tint only), with a small **ambient floor** so unlit
   night is dark but readable.

Explicitly out of scope:

- Light-emitting blocks beyond the torch (the registry `light` field makes
  future sources a one-line change — recorded under Follow-ups).
- Light persistence — there is no world save system; fields re-derive on
  chunk load exactly like water does.
- Flow-level-dependent water attenuation (flat O=2; levels are
  render-cosmetic per PROJECT.md §9).
- Attenuation by the cloud layer (it is a texture plane, not world state —
  recorded as a follow-up).
- Colored/directional light, shadow raycasting, animated flicker, and any
  per-source bookkeeping (two sources overlapping a cell take the **max** of
  levels, never a sum — the stored value is a level, not energy).

## Conventions

- This project's code and documentation do not name or reference any
  particular existing game by name. Prior art is described generically
  ("the classic voxel-sandbox convention", "a classic low-res light grid").
- Light is **0–15 integers everywhere in the simulation**; normalization to
  0–1 happens only at the mesher (attribute) and in the shader formula.
- The design principle the whole system follows: a voxel stores only its own
  state; it re-derives from its immediate six neighbours; changes propagate
  outward through a queue until a stable state is reached.

## Light rules

### Value space

`LIGHT_MAX = 15`. Each world cell has **two independent fields**:
`blight` (block light — torches) and `skylight` (sky light — open-to-sky
exposure), each 0–15, stored per chunk. Both fields follow the *same*
propagation rule; only the emission `E` differs.

### Opacity table (extra attenuation `O`)

A new `opacity` field on the `BLOCKS` registry entries (alongside `solid`,
`transparent`, …):

| block | emission `light` | opacity `O` |
|---|---|---|
| air | 0 | 0 |
| stone, dirt, grass, sand, wood, planks | 0 | 15 (fully blocks) |
| water | 0 | 2 (flat, regardless of flow level) |
| leaves | 0 | 2 |
| glass | 0 | 1 |
| torch | **14** | 0 (a torch never blocks light) |
| door (open) | 0 | 0 (passes, like air) |
| door (closed) | 0 | 15 (blocks, like solid) |

Doors are meta-dependent (exactly like `world.isSolid`), so `src/light.ts`
exposes `lightOpacity(world, wx, wy, wz): number` — registry default, door
exception from the meta. `O = 15` is chosen so a solid under open sky gets
column emission `15 − 15 = 0` (no one-level leak through a stone cell).

### Emission

- **Block light:** `E_b(cell) = BLOCKS[getBlock(cell)].light` (torch 14, else
  0).
- **Sky light:** `E_s(cell) = max(0, 15 − S)`, where `S` = the capped (at 15)
  sum of the opacities of **every cell strictly above** the target, up to the
  world top (`WORLD_Y_MAX`). Consequences (the designed behavior):
  - an unobstructed air column → `S = 0` → **every cell in the column
    emits 15**: direct downward skylight does **not** decay through air
    (otherwise a world 96 blocks tall would be dark at sea level);
  - under a glass ceiling → 14; under a 2-cell water column → 11 (depth
    darkens naturally, 2 per water cell);
  - under any solid → 0 (caves are dark until lit).
  - `E_s` is computed on demand, cheaply: each chunk caches
    `colSum[256]` (capped-at-15 opacity sum of its own 16-cell column,
    maintained at load and on in-chunk edits — 16 reads). For a pop:
    walk up through *loaded* chunks above accumulating their `colSum`
    (≤5 reads, break at 15) + walk the in-chunk column top row → `y+1`
    (≤16 reads, break at 15). Caves break after 1–2 rock cells; the worst
    open-air case is ≈20 cheap ops per pop.

### The propagation rule

Orthogonal neighbours only — a diagonal receives light only by taking two
steps through orthogonal cells (the classic diamond/Manhattan falloff).
Attenuation is paid **exiting** the source cell:

```
target_F(cell) = max( E_F(cell),  max over the 6 neighbours nb: L_F(nb) − 1 − O(nb) )
```

- `1` per propagation step: open air runs torch 14 → 13 → 12 → … → 0 at
  distance 14 (a block-light wave can never reach further than 14 cells).
- `O(nb)`: glass costs 1 extra, leaves 2, water 2, solid 15 (nothing gets
  through: `L − 1 − 15 < 0` → 0).
- A neighbour that is a missing chunk / out-of-range-y contributes nothing —
  propagation stops at ungenerated space (the water POC deviation: nothing is
  simulated through the void).
- Cells **store** their field value even when solid (stone beside a torch
  stores 13) — storage is what rendering and further rules read; whether the
  light *leaves* a cell is governed by its `O`.

**Termination.** Values are bounded integers; a cell only changes when its
target differs from its current value, and each change moves it toward the
max-of-sources fixed point of the equations — so any seeded wave dies when
no cell can change. Block-light waves are bounded to ≤14 cells of any source;
skylight re-seed waves are bounded by the reachable cave volume.

## Light engine (`src/light.ts`)

Pure TS (no three.js) — mirrors `WaterSim`'s proven shape:

- a world-coord `Set<string>` queue (insertion-ordered FIFO with dedup) and
  a `stats` block (pops, seeds, chunk touches — debug surface like water's);
- `LIGHT_TICK_BUDGET = 2500` cell pops per tick, drained **every 60 Hz
  substep** (the user-chosen near-instant pacing: a torch's ≤14-cell wave —
  a few thousand cells — settles in 1–3 substeps ≈ 20–50 ms, i.e.
  perceptually instant; idle cost ≈ 0);
- `LIGHT_SETTLE_GUARD = 4096` (one-time load settle cap, same spirit as
  water's `SETTLE_GUARD`);
- an accumulating `touched` chunk set, consumed and cleared exactly once per
  frame by `main.ts` (the exact `sim.touched` contract).

### The pop (the whole engine)

A popped cell re-derives **both** fields with the rule above (reading the two
fields of the six neighbours; `E_F(cell)` is evaluated at every pop — a
registry read for block light, the on-demand column read for sky light,
~20 ops worst case). If a field's target differs from the current value:
write it, add the cell's chunk to `touched`, and re-queue the six neighbours.
If both are equal: stop. A seed is what *applies a change of emission*
(setting exact values and starting the wave); the pop always evaluates the
full formula. So a removal's darkness wave simply walks out until cells find
an equal-or-better value from surviving support, then stops dead there.
**De-propagation requires no special pass**: with two torches overlapping and
one removed, any cell the survivor's field still supports at an
equal-or-higher value computes `target == current` and is never touched.

### Seeds (the only things that start waves)

1. **Player edit — `edit(wx, wy, wz)`**, called from `main.ts` at every
   existing `sim.edit(...)` site (place, break, torch; door toggle seeds
   both halves). Seeds:
   - the changed cell (its new `E_b` — torch placed → 14; torch broken → 0
     and the darkness wave starts), plus its six neighbours;
   - the **sky column** for `(wx, wz)`: the column is re-evaluated; every
     cell whose `E_s` changed is set *exactly* to its new `E_s` and queued
     (a block placed at a cave mouth can drop many column cells 15 → 0;
     breaking it restores. Horizontal support that a column cell loses or
     gains is then repaired by ordinary pops, since the rule takes the max);
   - the chunk's `colSum` entry for that column is recomputed (16 reads).
2. **Chunk load — `settleChunk(cx, cy, cz)`** from the budgeted load path
   (where water settles): compute the chunk's `colSum`, enqueue the chunk's
   cells, and drain inline up to `LIGHT_SETTLE_GUARD = 4096` pops (≈ one
   chunk-size pass, same spirit as water's `SETTLE_GUARD`); anything left in
   the queue keeps draining over subsequent substeps, so convergence
   completes over a few ticks if it spills.
   **Plus the six-neighbourhood of the load seam in already-loaded
   neighbors** — their boundary cells may gain or lose light across the new
   seam, re-pop, and re-bake.
3. **Chunk unload** from the unload path: queue the six-neighbourhood of the
   unloaded seam in the surviving neighbours, so cells that were lit
   *through* the removed region darken (their seam neighbour lookup now finds
   a missing chunk → no contribution → target drops → the darkness wave
   propagates).

The **water sim never touches the light sim**: light depends only on block
ids and door meta; flow levels are opacity-blind (O=2 flat), so water waves
change nothing light-wise.

### Determinism

Insertion-ordered queue + pure local rule ⇒ the final fields are a
deterministic function of the edit sequence (pinned by a test: same edits on
two fresh worlds → identical fields).

## Day/night integration (`src/sky.ts`)

- **`dayness` — a new `SkySample` field (0–1).** No new anchors: it is the
  existing `dim` ramp normalized to 0–1 — `dayness = (dim_raw − 0.33) /
  0.67` evaluated on the same per-anchor lerps (the anchors that pin `dim`
  at 1.0 pin `dayness` at 1.0; the anchors that pin `dim` at 0.33 pin
  `dayness` at 0.0). Consequence: the world light fades on the *exact* curve
  the sky palette already uses — sky and light are in perfect sync. Pure and
  node-testable (noon 1.0 / midnight 0.0, dusk≡dawn mirroring, monotonic
  ramps).
- **`worldDim` retirement (render side).** The
  `matOpaque.color.setScalar(worldDim)` / `matTrans.color.setScalar(worldDim)`
  lines leave `sky.apply` — the materials stay white and lighting lives in
  the vertex data + the dayness uniform. `SkySample.worldDim` **remains**
  for its one remaining consumer (the cloud tint — clouds are not world
  geometry and keep the mood-tint path); its comment is retargeted to "visual
  tint for sky/clouds; world lighting is per-vertex". The underwater mood
  needs no special case: water's O=2 per cell darkens skylight with depth,
  and at night everything falls to the ambient floor like any other surface.

## Renderer (chunk mesher + materials)

**The key split.** Light *levels* change only on block edits / streaming,
but *dayness* changes continuously — already-meshed chunks must darken at
dusk without re-meshing. So:

- **Static per-vertex** (baked when the light fields change): the mesher
  gains a new 2-component vertex attribute
  `aLight = (blightLevel / 15, skylightLevel / 15)` per corner. The existing
  vertex color stays exactly as today (`FACE_SHADE × AO` scalar).
- **Per-frame uniform:** `uDayness` written into the materials each frame
  (O(1)). A small `onBeforeCompile` injection on the two chunk
  `MeshBasicMaterial`s computes, per vertex:

```glsl
// uDayness written per frame; uAmbient is a uniform fed from the JS
// constant LIGHT_AMBIENT (0.12)
float light  = clamp(max(aLight.x, aLight.y * uDayness), 0.0, 1.0);
float factor = uAmbient + (1.0 - uAmbient) * light;
vColor.rgb *= factor;                                  // after face/AO
```

  The existing face/AO multiply is untouched; `factor` multiplies on top.
  `LIGHT_AMBIENT = 0.12` (exported from `src/light.ts`) implements the
  chosen "dark but readable": unlit deep night ≈ 12 % (shapes just readable),
  daytime skylit ≈ 100 %, a torch cell ≈ 94 % at the source grading to the
  floor over 13 steps. Sky light dies at night; block light never does —
  per vertex, with **zero re-baking during day/night transitions**.
  Documented fallback (only if GLSL injection proves impractical at
  `three@0.166`): bake `max(bl, sk)` into the existing scalar and re-mark
  chunks dirty on dayness step changes — rejected on design (a visible
  brightness wavefront sweeping the ring at dusk + frame-budget spikes).

**Per-corner sampling (per field, independently).** For each vertex corner
of a face, the candidate cells are the cell **across the face** plus the two
**face-diagonal** cells (offset along the face's u/v axes toward the corner,
using the corner's −1/+1 signs — the same machinery as the vertex AO
samplers). `aLight.bl` = max of `blight` over the candidates; `aLight.sk` =
max of `skylight` over the candidates / 15. The max-over-3 keeps a corner lit
when a solid tucks into the corner of the outside cell (the classic
one-dark-corner artifact); solid candidate cells contribute their stored
value, which is naturally low. The mesher receives the light via a new
`lightAt: (wx, wy, wz) => [bl, sk]` parameter (0–15 integers, `[0, 0]` for
missing chunks — `main.ts` supplies it from `World.getLight`, tests supply
stubs), keeping the mesher pure.

**New world accessor:** `World.getLight(wx, wy, wz): [number, number]`
(both fields 0–15; `[0, 0]` for missing chunks / out-of-range y).

## `main.ts` wiring

- boot: `const lightSim = new LightSim(world);` (next to `new WaterSim`);
  one-time `onBeforeCompile` setup for `matOpaque` / `matTrans` (the `aLight`
  attribute is added by the mesh-build path in `toGeometry`/mesh construction
  alongside `colors`).
- fixed substep: `lightSim.tick(LIGHT_TICK_BUDGET)` next to
  `worldTime.advance(STEP)` and `sim.tick(WATER_PULSE)`.
- edits: every existing `sim.edit(...)` call site gains a sibling
  `lightSim.edit(x, y, z)` (place/break/torch at `main.ts:508` & the break
  path; door toggle seeds both halves alongside the existing pair).
- streaming: the load path calls `lightSim.settleChunk(cx, cy, cz)` for each
  newly loaded chunk (inside the ≤1 load/frame budget — a bounded ≈ water
  settle); the unload path calls the unload-seam seed for the affected
  neighbors.
- frame end: `lightSim.touched` is consumed exactly once (same contract and
  position as `sim.touched`) → those chunks are marked `dirty` → the
  existing ≤2-remeshes/frame drain rebuilds their vertex colors. No new
  scene or mesh path exists; the whole remesh machinery is reused.
- per frame, after `sky.apply(...)`: `uDayness = skySample.dayness` on both
  materials (one uniform write each); `matOpaque/matTrans` colors no longer
  change (white).
- **dev-only `?phase=` URL param** in `main.ts` (documented, verification
  only): seeds `WorldTime`'s phase on load (a small `WorldTime` constructor
  arg or setter, defaulting to the current noon start) so headless/visual
  verification can reach any time of day without a 120 s real-time wait
  (e.g. `localhost:5173?phase=0.95` for deep night).

**Performance expectations (documented §9-style, with a 400-frame walk
probe like §9's):** idle light tick ≈ 0; a torch place/break settles in
1–3 substeps; the load path adds one bounded settle per loaded chunk (≈
water-settle scale); day/night is one uniform write. Target: walking p95
stays ≈7 ms, zero frames >25 ms attributable to light work (measured on the
moving-camera replay; if a transition shows a hitch, recreate the §9 probe
with per-phase ms logging).

## Tests

### New suite `src/__tests__/light.test.ts` (synthetic-world fixtures, like `water.test.ts`)

- **Attenuation & `E_s`:** open column → 15 everywhere; cell under a glass
  ceiling → 14 (glass stores 15 itself — the step is visible below it);
  under a 2-cell water column → 11; under rock → 0; cap behavior (sum stops
  at 15).
- **Propagation shape:** on a small synthetic layout, a torch gives the exact
  diamond pattern (14 at the source, 13 at Manhattan 1, …, 0 at 14, nothing
  beyond); no light through a solid wall (the far side stays at its
  pre-torch levels — exact field asserts).
- **Max semantics:** two overlapping torch fields → the level is the max,
  never a sum (assert at the overlap cell).
- **Removal (the de-propagation pass):** place → settle → remove → the field
  returns to the pre-torch state; **two-torch support boundary**: remove one
  and the darkness wave stops exactly at the cells the survivor still
  supports (assert the boundary values on both sides).
- **Sky dynamics:** a block placed at a synthetic cave mouth → the column
  collapses and horizontal spread decays 1/step into the cave (exact values
  along the axis); breaking it → the column and cave spread restore.
- **Door meta:** a closed door blocks (O=15 path), an open door passes
  (both fields; toggle flips the result).
- **Chunk seams:** light is continuous across a chunk boundary (values on
  both sides of the seam are correct); after an unload-seam event, cells lit
  *through* the removed chunk darken.
- **Determinism:** the same edit sequence on two fresh worlds → identical
  final fields.

### Existing suites extended

- `sky.test.ts`: `dayness` keyframes (1.0 at the day anchors, 0.0 at the
  night anchors, dusk≡dawn mirroring like the existing dim/color parity
  tests, monotonic within each ramp).
- `chunk-mesher.test.ts`: with a stub `lightAt` — a torch-facing face corner
  → `aLight.bl = 13/15`; a sky-exposed corner → `aLight.sk = 1`; the `colors`
  buffer is byte-identical to the pre-light build for a zero-light stub
  (`FACE × AO` unchanged); the 3-candidate max rule (a solid diagonal keeps
  the corner lit).
- `world.test.ts`: `getLight` returns `[0, 0]` for missing chunks and
  out-of-range y.

### Integration & visual

- **Node boot-replay** (pattern of `water-load.test.ts`): generate the spawn
  ring, settle light over the loaded chunks, assert field sanity (sky columns
  15 at open terrain, caves dark, seams continuous) and measure
  settle/remesh wall time against the frame budget — the §15 "hard part",
  pinned against a measured replay like water's lineage numbers.
- **Headless pixel sampling** (existing playwright-core + SwiftShader rig,
  `vite preview` + `?phase=`): daytime torch gradient (pixels near the torch
  measurably brighter than far pixels on the same face direction), deep night
  via `?phase=` (unlit area ≈ the ambient floor — dark but readable — while a
  torchlit area stays ≈ full), and a lit/unlit corner check for the max rule.
- **In-browser checklist:** place/break a torch — glow/darken in 1–2 frames,
  no pop; two torches side by side read as one brighter region, not double;
  plug a cave mouth → the interior darkens wave-like; unplug → it restores;
  dusk → the terrain fades while torch glow holds; underwater → the deeper
  you go the darker (O=2/step), no hard band at the surface.

## Follow-ups (recorded, not this project)

- More light-emitting blocks (glowstone-class) — a one-line registry `light`
  value.
- Light persistence once a world save system exists.
- Flow-level-dependent water opacity (O by `wlevel`).
- Cloud shadows (attenuation by the cloud layer — requires the layer to
  become world state).
- Web-worker offload of settle/propagation (the §15 deferral).
- Per-flow "which way" directional light / colored light.