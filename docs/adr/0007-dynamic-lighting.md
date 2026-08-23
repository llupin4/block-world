# 0007. Dynamic lighting — two per-chunk 0–15 light fields propagated by local
recompute-relaxation, baked per-vertex, with day/night as a per-frame uniform

- **Status:** Accepted
- **Last updated:** 2026-08-22
- **Sources:** (superseded by this ADR; recoverable via `git show 0cf878c:<path>`)
  - `docs/superpowers/specs/2026-08-19-dynamic-lighting-design.md` (the design:
    value space, opacity table, emission, the propagation rule, the light
    engine's pop/seeds/determinism, day/night integration, renderer, wiring,
    tests, follow-ups)
  - `docs/superpowers/plans/2026-08-19-dynamic-lighting.md` (the implementation
    plan: API shapes, the settle/unload mechanics)
  - `TODO.md` (the resolved "Dynamic lighting with light levels" item under
    "Sky & lighting" — its final-state wording, distilled here)

## Context

The renderer is unlit (ADR 0003 — Chunk meshing & rendering):
`MeshBasicMaterial` with per-vertex `FACE_SHADE × AO` baked into the shared
`colors` buffer, and the only "time of day" the terrain sees is a
material-level `worldDim` scalar (1.0 → 0.33) written by `sky.apply` — a
documented stand-in until per-block skylight lands. Torches are visual only:
a bright tile, no glow.

The infrastructure this decision builds on:

- **Chunk storage** already carries parallel `Uint8Array` fields per chunk
  (`blocks`, `meta`, `wlevel`, …); 16³ chunks, `World Y ∈ [−32, 64]`, a
  ~125-chunk loaded ring streamed within a small per-frame load/remesh budget
  (PROJECT.md §9).
- **The water sim** (`src/water.ts`, ADR 0005 — Water simulation) already
  implements the local-propagation pattern this design mirrors: a world-coord
  queue (insertion-ordered FIFO with dedup), `tick(budget)`, an `edit()` hook
  for player mutations, a load-time bounded `settle`, and a `touched` chunk
  set consumed exactly once per frame and re-meshed immediately at the frame
  end.
- **`WorldTime`** (`src/time.ts`) advances in the fixed 60 Hz substep;
  `sampleSky(phase)` is a pure keyframed sampler (ADR 0008 — Sky & day/night).

This ADR resolves the `TODO.md` item "Dynamic lighting with light levels"
(and the flood-fill skylight/block-light item deferred from PROJECT.md §15).
The day/night project (branch `day-night-clouds`) already landed and supplies
the clock and the `worldDim` stand-in this project replaces.

## Decision

**Model — two per-chunk 0–15 light fields.** `LIGHT_MAX = 15`. Each world cell
has **two independent fields**, stored per chunk as `Uint8Array` alongside the
existing chunk fields: `blight` (block light — torches) and `skylight` (sky
light — open-to-sky exposure). Both fields follow the *same* propagation rule;
only the emission `E` differs. Light is 0–15 integers everywhere in the
simulation; normalization to 0–1 happens only at the mesher (attribute) and in
the shader formula. The design principle: a voxel stores only its own state;
it re-derives from its immediate six neighbours; changes propagate outward
through a queue until a stable state — the classic voxel-sandbox convention.
Light does not know which source lit it; state is local, nothing is remembered.
Two sources overlapping a cell take the **max** of levels, never a sum — the
stored value is a level, not energy.

**Opacity table (extra attenuation `O`).** A new `opacity` field on the
`BLOCKS` registry entries (alongside `solid`, `transparent`, …), plus a new
`light` emission field:

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

Doors are meta-dependent (exactly like `world.isSolid`): `src/light.ts`
exposes `lightOpacity(world, wx, wy, wz)` — the registry default, with the
door exception from the meta. `O = 15` is chosen so a solid under open sky
gets column emission `15 − 15 = 0` (no one-level leak through a stone cell).

**Emission.**

- *Block light:* `E_b(cell) = BLOCKS[getBlock(cell)].light` — torch 14, else
  0. The emission set as of this ADR is the torch only; a future
  glowstone-class emitter is a one-line registry `light` value (open
  follow-up, tracked in TODO.md).
- *Sky light:* `E_s(cell) = max(0, 15 − S)`, where `S` is the capped (at 15)
  sum of the opacities of **every cell strictly above** the target, up to the
  world top. Designed consequences: an unobstructed air column → `S = 0` →
  **every cell in the column emits 15** — direct downward skylight does
  **not** decay through air (otherwise a world 96 blocks tall would be dark
  at sea level); under a glass ceiling → 14; under a 2-cell water column → 11
  (depth darkens naturally, 2 per water cell); under any solid → 0 (caves are
  dark until lit). `E_s` is computed on demand, cheaply: each chunk caches
  `colSum[256]` (the capped-at-15 opacity sum of its own 16-cell column,
  maintained at load and on in-chunk edits); for a pop, walk up through the
  *loaded* chunks above (break at 15) plus the in-chunk column — ≤ ~21 ops
  worst case (caves break after 1–2 rock cells).

**The propagation rule (the pop).** Orthogonal neighbours only — a diagonal
receives light only by taking two steps through orthogonal cells (the classic
diamond/Manhattan falloff). Attenuation is paid **exiting** the source cell:

```
target_F(cell) = max( E_F(cell),  max over the 6 neighbours nb: L_F(nb) − 1 − O(nb) )
```

- `1` per propagation step: open air runs torch 14 → 13 → 12 → … → 0 at
  distance 14 (a block-light wave can never reach further than 14 cells).
- `O(nb)`: glass costs 1 extra, leaves 2, water 2, solid 15 (nothing gets
  through: `L − 1 − 15 < 0` → 0).
- A neighbour that is a missing chunk / out-of-range-y contributes nothing —
  propagation stops at ungenerated space (nothing is simulated through the
  void, exactly like water).
- Cells **store** their field value even when solid (stone beside a torch
  stores 13) — storage is what rendering and further rules read; whether the
  light *leaves* a cell is governed by its `O`.

**Termination.** Values are bounded integers; a cell only changes when its
target differs from its current value, and each change moves it toward the
max-of-sources fixed point of the equations — so any seeded wave dies when no
cell can change. Block-light waves are bounded to ≤14 cells of any source;
skylight re-seed waves are bounded by the reachable cave volume.

**The light engine (`src/light.ts`).** Pure TS (no three.js), mirroring the
water sim's proven shape (ADR 0005): a world-coord queue (insertion-ordered
FIFO with dedup) and a `stats` block (pops, seeds, field changes);
`LIGHT_TICK_BUDGET = 2500` cell pops per tick, drained **every 60 Hz
substep** (a torch's ≤14-cell wave — a few thousand cells — settles in 1–3
substeps ≈ 20–50 ms, i.e. perceptually instant; idle cost ≈ 0);
`LIGHT_SETTLE_GUARD = 4096` (one-time load-settle cap); and an accumulating
`touched` chunk set, consumed and cleared exactly once per frame by
`main.ts` (the exact `sim.touched` contract).

A popped cell re-derives **both** fields with the rule above (reading the two
fields of the six neighbours; `E_F(cell)` is evaluated at every pop — a
registry read for block light, the on-demand column read for sky light). If a
field's target differs from the current value: write it, add the cell's chunk
to `touched`, and re-queue the six neighbours. If both are equal: stop. A seed
is what *applies a change of emission* (setting exact values and starting the
wave); the pop always evaluates the full formula.

**De-propagation requires no special pass** — the hard part flagged in the
original TODO item. A removal's darkness wave simply walks out until cells
find an equal-or-better value from surviving support, then stops dead there:
with two torches overlapping and one removed, any cell the survivor's field
still supports at an equal-or-higher value computes `target == current` and is
never touched.

**Seeds — the only things that start waves.**

1. *Player edit — `edit(wx, wy, wz)`*, called from `main.ts` after every
   `world.setBlock` / door-meta change, at every existing `sim.edit(...)` site
   (place, break, torch; the door toggle seeds both halves). Seeds:
   - the changed cell (its new `E_b` — torch placed → 14; torch broken → 0
     and the darkness wave starts) plus its six neighbours;
   - the **sky column** for `(wx, wz)`: every cell strictly below the edit
     whose `E_s` changed is set *exactly* to its new `E_s` and queued (a block
     placed at a cave mouth can drop many column cells 15 → 0; breaking it
     restores; horizontal support a column cell loses or gains is then
     repaired by ordinary pops, since the rule takes the max);
   - the chunk's `colSum` entry for that column is recomputed (16 reads).
2. *Chunk load — `settleChunk(cx, cy, cz)`* from the budgeted load path (where
   water settles): maintain the chunk's `colSum`, then — on a *fresh* load
   only (the `lightSettled` flag, mirroring WaterSim's `settled`) — settle via
   **column prefill + frontier seeding**: set every cell's sky field to its
   column emission `E_s` (the direct downcast — a lower bound on the true sky
   light, which horizontal propagation only raises) and its block field to 0
   (one O(4096) pass off `colSum`); then enqueue only the cells that can
   change — the six face shells (light crosses a chunk boundary there), every
   interior cell a horizontal neighbour's prefill can raise (a cell's sky
   light can only exceed its column prefill through a horizontal neighbour —
   a vertical neighbour's column prefill is at most its own, so it never
   raises a cell above the prefill), and every torch (the only block-light
   source); the frontier then relaxes with the recompute pop (a pop re-seeds a
   changed cell's neighbours), so the deficit propagates inward and the settle
   converges to the *same fixpoint* as a full re-derive. Drained inline up to
   `LIGHT_SETTLE_GUARD` pops; the rest keeps draining over substeps. **Plus
   the one-cell face shell of the load seam in already-loaded neighbours** —
   their boundary light may change across the new seam (including sky columns
   whose upper band just appeared). A *remesh* of an already-loaded chunk
   skips the prefill — the interior is settled and stays converged by the
   wave, so only the one-cell seam is re-seeded. Net effect: a fresh chunk
   costs a small drain, not a full re-derive. The slow full re-derive
   (`settleChunkBruteForce`) is kept as a test-only reference that pins the
   fixpoint the fast path must reach.
3. *Chunk unload — `onChunkUnloaded(cx, cy, cz)`* from the unload path: queue
   the one-cell face shell of the unloaded seam in the surviving neighbours,
   so cells that were lit *through* the removed region darken (their
   seam-neighbour lookup now finds a missing chunk → no contribution → target
   drops → the darkness wave propagates).

The **water sim never touches the light sim**: light depends only on block ids
and door meta; flow levels are opacity-blind (O=2 flat), so water waves change
nothing light-wise.

**Determinism.** Insertion-ordered queue + pure local rule ⇒ the final fields
are a deterministic function of the edit sequence. Pinned by tests: the same
edit sequence on two fresh worlds → identical final fields. The node boot
replay (the real spawn ring, driven through the streaming load/settle/unload
path exactly like the game loop, drained to a fixpoint) pins field sanity on
real terrain (open columns 15, one cell deeper through water attenuates by
exactly 2, all fields ≤ 15) and the boot's total pop count exactly —
**459,134 pops**, verified identical across repeated runs, ~61 % fewer than
the full 4096-cell re-derive the frontier replaced: a deterministic pop-count
lineage in the water-load pattern. The same suite also pins that the fast
settle and the brute-force full re-derive converge to identical fields.

**Day/night integration.**

- **`dayness` — a new `SkySample` field (0–1).** No new anchors: it is the
  existing `dim` ramp normalized to 0–1 — `dayness = (dim_raw − 0.33) / 0.67`
  evaluated on the same per-anchor lerps (the anchors that pin `dim` at 1.0
  pin `dayness` at 1.0; the anchors that pin `dim` at 0.33 pin `dayness` at
  0.0). Consequence: the world light fades on the *exact* curve the sky
  palette already uses — sky and light are in perfect sync. Driven by
  `WorldTime`'s day phase (ADR 0008 — Sky & day/night); pure and node-testable
  (noon 1.0 / midnight 0.0, dusk≡dawn mirroring, monotonic ramps).
- **The renderer split.** Light *levels* change only on block edits /
  streaming, but *dayness* changes continuously — already-meshed chunks must
  darken at dusk without re-meshing. So:
  - *Static per-vertex (baked when the light fields change):* the mesher
    gains a new 2-component vertex attribute `aLight = (blightLevel / 15,
    skylightLevel / 15)` per corner (ADR 0003 — Chunk meshing & rendering).
    The existing vertex color stays exactly as today (`FACE_SHADE × AO`
    scalar). Per-corner sampling, per field independently: the candidate cells
    are the cell **across the face**, the two **face-diagonal** cells (offset
    along the face's u/v axes toward the corner — the same machinery as the
    vertex AO samplers), and the **body-diagonal** cell (both steps) — the max
    over the up-to-4 candidates keeps a corner lit when a solid tucks into the
    corner of the outside cell (the classic one-dark-corner artifact); solid
    candidate cells contribute their stored value, which propagation keeps
    naturally low. The mesher receives the light via a new
    `lightAt: (wx, wy, wz) => [bl, sk]` parameter (0–15 integers, `[0, 0]`
    for missing chunks — `main.ts` supplies it from `World.getLight`; tests
    supply stubs), keeping the mesher pure.
  - *Per-frame uniform:* `uDayness` written into the two chunk
    `MeshBasicMaterial`s each frame (O(1)) via a small `onBeforeCompile`
    injection, computing per vertex:

    ```glsl
    // uDayness written per frame; uAmbient is a uniform fed from the JS
    // constant LIGHT_AMBIENT (0.12)
    float light  = clamp(max(aLight.x, aLight.y * uDayness), 0.0, 1.0);
    float factor = uAmbient + (1.0 - uAmbient) * light;
    vColor.rgb *= factor;                                  // after face/AO
    ```

    The existing face/AO multiply is untouched; `factor` multiplies on top.
    `LIGHT_AMBIENT = 0.12` (exported from `src/light.ts`) implements the
    chosen "dark but readable": unlit deep night ≈ 12 % (shapes just
    readable), daytime skylit ≈ 100 %, a torch cell ≈ 94 % at the source
    grading to the floor over 13 steps. Sky light dies at night; block light
    never does — per vertex, with **zero re-baking** during day/night
    transitions.
- **`worldDim` retirement (render side).** The
  `matOpaque.color.setScalar(worldDim)` /
  `matTrans.color.setScalar(worldDim)` lines leave `sky.apply` — the materials
  stay white and lighting lives in the vertex data + the dayness uniform.
  `SkySample.worldDim` **remains** for its one remaining consumer — the
  cloud/sky visual tint (ADR 0008 — Sky & day/night): clouds are not world
  geometry and keep the mood-tint path. The underwater mood needs no special
  case: water's O=2 per cell darkens skylight with depth, and at night
  everything falls to the ambient floor like any other surface.
- **New world accessor:** `World.getLight(wx, wy, wz): [number, number]`
  (both fields 0–15; `[0, 0]` for missing chunks / out-of-range y).

**Wiring (`main.ts`).** `new LightSim(world)` at boot next to
`new WaterSim(world)`; `lightSim.tick(LIGHT_TICK_BUDGET)` in the fixed 60 Hz
substep next to `worldTime.advance(STEP)` and `sim.tick(WATER_PULSE)`; a
`lightSim.edit(x, y, z)` sibling at every existing `sim.edit(...)` site (plus
the door toggle, which seeds both halves); the load path calls
`lightSim.settleChunk(cx, cy, cz)` for each newly loaded chunk (inside the
per-frame load budget) and the unload path calls
`lightSim.onChunkUnloaded(...)`; `lightSim.touched` is consumed and cleared
exactly once per frame (the `sim.touched` contract) and those chunks are
re-meshed immediately at the frame end — no streaming-budget latency, and
touched chunks per event stay small (≤ ~6 for a torch edit, ≤ ~5 column chunks
for a sky edit); after `sky.apply(...)` each frame, `uDayness =
skySample.dayness` on both materials — one uniform write each, and the
material colors no longer change (white).

## Alternatives considered

- **Bake `max(bl, sk)` into the existing scalar + mark chunks dirty on
  dayness step-changes** — the documented fallback, only if GLSL injection
  proved impractical at `three@0.166` — rejected on design: a visible
  brightness wavefront sweeping the ring at dusk plus frame-budget spikes.
  Injection shipped; the fallback is not needed.
- **Sum-of-sources / per-source bookkeeping** — rejected: the stored value is
  a level, not energy; two sources overlapping a cell take the max of levels.
  That is also what makes de-propagation by plain relaxation possible — there
  is no per-source shadowing to tear down when a torch is removed.
- **A special de-propagation pass** (a separate removal rule for darkness) —
  rejected: the same relaxation handles it; a removal's wave stops exactly at
  the cells a surviving source still supports (`target == current`).
- **Vertical air decay for the downcast skylight** — rejected: an
  unobstructed column must emit 15 at every height, or a world 96 blocks tall
  would be dark at sea level.
- **Keep / extend the `worldDim` material scalar** — rejected: one material
  scalar cannot express per-block light levels (torch glow, cave darkness,
  underwater depth). It was a documented stand-in, and it survives only as the
  cloud/sky visual tint (ADR 0008 — Sky & day/night).

## Consequences

- **Open follow-ups.** The spec's "Follow-ups" section is moved to `TODO.md`
  — open follow-up, tracked in TODO.md: more light-emitting blocks
  (glowstone-class — a one-line registry `light` value); light persistence
  once a world save system exists (until then the fields re-derive on chunk
  load exactly like water does); flow-level-dependent water opacity (O by
  `wlevel` — today flat O=2); cloud shadows (attenuation by the cloud layer —
requires the layer to become world state); ~~web-worker offload of
   settle/propagation (the PROJECT.md §15 deferral)~~ — resolved by ADR 0012 — Light
   simulation on a web worker; directional/colored light
  (per-flow "which way").
- **Performance.** The load-path settle is a small drain, not a full
  re-derive: column prefill + frontier, bounded to `LIGHT_SETTLE_GUARD` inline
  pops with the rest draining over substeps — the boot replay pins the whole
  spawn-ring boot at 459,134 pops, ~61 % fewer than the full 4096-cell
  re-derive. Idle cost ≈ 0 (an empty queue no-ops); a torch place/break
  settles in 1–3 substeps (≈ 20–50 ms); day/night is one uniform write per
  frame. Touched chunks per event stay small (≤ ~6 for a torch edit, ≤ ~5
  column chunks for a sky edit), so the frame-end re-mesh reuses the existing
  machinery inside the §9 budget. Targets: walking p95 stays ≈ 7 ms; zero
  frames > 25 ms attributable to light work.
- **The 0.12 ambient floor is the readability trade-off.** Unlit deep night
  ≈ 12 % linear — dark but readable, never black-cleared; applied in linear
  light, it reads as ≈ 0.38× the day sRGB luminance after the renderer's sRGB
  conversion lifts the dark values. A torch cell reads ≈ 94 % at the source
  and grades to the floor over 13 steps; sky light dies at night while block
  light never does.
- **Limits (accepted POC deviations).**
  - Light never propagates through ungenerated space: a missing chunk /
    out-of-range-y neighbour contributes nothing, exactly like water.
  - A partially-loaded column reads too bright (a missing upper chunk counts
    as air → a too-low opacity sum) until the upper chunks load and their seam
    seeding re-seeds the lower one — a load-time transient, self-correcting
    within a few ticks.
  - Water opacity is flow-level-flat (O=2); levels are render-cosmetic per
    PROJECT.md §9.
  - Everything runs on the main thread: settle/propagation drain inside the
    frame budget (the worker offload is the follow-up above); the `stats`
    block (pops, seeds, field changes) is the debug surface.