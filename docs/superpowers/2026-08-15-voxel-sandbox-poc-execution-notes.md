# voxel-sandbox POC — execution notes

Companion to `plans/2026-08-15-voxel-sandbox-poc.md`. Records what actually happened during
execution: per-task results, the five plan deviations, issues met, workarounds, gate history,
and the handoff state. The plan itself is the spec; this file is the log.

- Branch: `poc/voxel-sandbox` (no remote)
- Execution model: the `executing-plans` workflow — test-first red→green per task, exact file
  sets per task, all automated gates (vitest / tsc strict / vite build / dev+preview smoke)
  run by the executing session. Manual browser checklists were collected per task and batched
  to the end for a human pass.
- Note: `PROJECT.md` (the design/spec document the plan's prose references, §13–§15) was never
  checked into this repo — only the plan exists under `docs/superpowers/`.

## Task completion table

| Task | Commit | Deliverables | Tests at task end | Gate status |
|---|---|---|---|---|
| T1 scaffold | `b968754` | vite 5.4.21 + TS 5.9.3 (strict) + vitest 2.1.9, three 0.166.1, simplex-noise 4.0.3 pinned | — | green |
| T2 blocks | `d44a9ef` | 10-block registry, per-face tile map, `PLACEABLE`, `iconTile` | 5 (blocks) | green (deviation D1) |
| T3 world store | `efd1c61` | 16³ chunk store, cross-seam get/set, dirty marking (self + 6 face neighbors) | 11 | green |
| T4 terrain | `c2def5f` | seeded height/caves/trees, seam-free per-chunk fill, measured constants pinned | 17 | green (deviation D2) |
| T5 chunk mesher | `bbb752a` | face culling, baked AO + face shade (the D4 payoff), opaque/trans buffers | 26 | green |
| T6 demo scene | `71af48e` | 11-tile canvas atlas, materials, synthetic 3×3 world, final `ui.css` | 26 | green |
| T7 player | `642bed1` | AABB physics, swim/climb, fly, noclip, pointer-lock camera (`YXZ`), `headInWater` | 33 | green |
| T8 break/place | `749660f` | DDA raycast (6 m reach), voxel hitbox, LMB break / RMB place, `remeshAround` | 37 | green (deviation D3) |
| T9 terrain world | `07c3ef1` | measured-spawn scan, void respawn at `WORLD_Y_MIN` | 37 | green (deviation D4) |
| T10 streaming | `377474d` | 5×5×5 ring (\|cx±2\|, cy 0..4), 2 loads + 2 remeshes per substep, shared `TerrainGen` | 41 | green (deviation D5) |
| T11 hotbar+palette | `7b8f5bf` | `Hotbar` (9 slots), atlas-crop icons, E / 1–9 / wheel, palette click→slot | 48 | green |
| T12 underwater FX | `bc490cf` | air/water mood swap (FogExp2 + background + FOV 70→62) on `headInWater`, edge-triggered | 48 | green |
| T13 polish + gate | `d860c3e` | C = global wireframe (two shared material flags), final hint, full verification sweep | 48 | green |

Final per-suite counts (state at T13): blocks 5 · world 6 · terrain 6 · chunk-mesher 9 ·
player 7 · raycast 4 · streaming 4 · ui 7 — **48 tests, 8 suites**.

Milestones: M1=T6, M2/M3=T7/T8, M4=T9, M5=T10/T11, M6=T12/T13, M12=T13 gate. All met.

## Deviations from the plan

Each was resolved in favor of the empirically-correct, design-authoritative value; no test
*intent* was weakened. D1–D4 are also recorded in code comments; D5's details live in
`streaming.test.ts` comments.

| # | Where | Plan said | What was done instead | Evidence / rationale |
|---|---|---|---|---|
| D1 | T2 `blocks.ts` | grass −Y face tile per plan table | grass −Y (bottom face) = tile 2 (dirt) | the plan's own texture layout gives dirt-on-bottom; comment in `blocks.ts` |
| D2 | T4 `terrain.ts:13` | canonical mulberry32 (`t ^ (t >>> 7)`) | variant `t ^ (a >>> 7)` | the plan's measured constants (45395 water cells, heights 19..43, 21 trees, seed 1234) are reproduced **only** by the variant; canonical gives 45258. (2026-08-16: the cave carve now produces Air, so the seeded water count re-pins to **24936** in `terrain.test.ts`; the PRNG variant and the height/tree constants are unchanged. The 45258 canonical-form figure above predates the cave→Air change and was not re-measured after it.) The pinned constants (test + `noisecheck/count55.mjs` origin) are authoritative. Comment added at the PRNG line pointing here |
| D3 | T8 `raycast.ts:20` | `raycastVoxel(world: World, …)` | first param widened to `{ getBlock(x,y,z) } \| ((x,y,z) => number)` | lets the same DDA run against ad-hoc getBlock functions (tests) without a `World`; zero behavior change |
| D4 | T9 `main.ts:172` | spawn (33,41) | spawn **(6,46)** | plan's (33,41) is a **sea-basin column in both PRNG variants** (proven by throwaway probe: variant A → sand floor y=30 / water to y=32; canonical → y=29). (6,46) is the nearest clean grass column: surface Grass@y=33, feet y=34, no tree in column, sea starts 3 m east (first water x=9 at y=32) — matching the plan's stated *intent* (grass shelf, water nearby for T12). Cascade: T10's boot pre-gen column is `(0,·,2)` (world x 0..15, z 32..47), not the plan's (2,·,2). Comment in `main.ts` |
| D5 | T10 `streaming.test.ts` | literal expectations A/C/D | corrected A→`(2,1,2)`, C→`(4,2,3)`, D→`hasChunk(10,2,10)`/`hasChunk(10,1,10)` | the plan's expectations are arithmetically inconsistent with **the plan's own** score `= (dx²+dz²)·100 + \|cy−pcy\|` plus T3's locked `setBlock` semantics (it dirties the 6 existing face-neighbor chunks). ×100 makes same-column cy levels rank *before* x/z neighbors (A, C); setBlock at (4,2,4) also dirties the cz−1 neighbor, so 500 < 801 reorders (C); D's expectations had the coordinate order swapped to (cx,cz,cy). Proven empirically with a throwaway probe before touching expectations. Plus one genuine **impl** fix found the same way: remesh/unload results pushed `Chunk` objects where the API shape is uniform `Coord[]` — changed to Coord literals |

## Issues met & workarounds (beyond the deviations)

- **Plan test-expectation arithmetic (T10, detail of D5).** Three of the plan's four streaming
  tests failed red even after a faithful implementation. Diagnosis: scratch probe
  (`src/__tests__/zzz-t10-probe.test.ts`, removed) measured the dirty set after `setBlock(4,2,4)`
  as `[[3,2,4],[4,1,4],[4,2,3],[4,2,4],[4,3,4]]` → rebuilt `[[3,2,4],[4,2,3]]`, against the
  plan's score formula. Fixed the *expectations* (intent preserved) and the *impl shape bug*.
- **Plan spawn probe irreproducible (T9, detail of D4).** A dedicated probe (`zzz-variant-probe`)
  ran both PRNG variants on (33,41) → never grass. Conclusion: the plan's T9 probe ran against a
  different scratch generator setup; its *measured constants* were only reproducible with D2.
- **Type risk that never materialized (T11).** The plan flagged that its `placeIcon(el, b: number, …)`
  calling `iconTile(b)` could trip strict tsc (numeric `Block` enum vs `number`). It did not:
  `BLOCKS` is `Record<number, BlockDef>` so a `number` param is type-correct and every `Block`
  argument stays assignable. No change needed.
- **Plan comment drift (T12/T13).** The plan's "before" snippets show a shorter
  `tickStreaming` comment and a shorter loop body than the file actually had after T10/T11;
  replacements were matched against the real file text, plan intent unchanged.
- **Env/tooling gotchas (session-wide):** `pkill -f` kills the invoking shell — dev/preview
  servers are stopped via `ss -tlnp | grep 5199 | grep -oP 'pid=\K[0-9]+'` then kill, with a
  follow-up `ss -tln` to confirm "port free". Throwaway probes must live inside the project
  (`src/__tests__/zzz-*.test.ts`) or vitest's root filter drops them; every probe was `rm`'d
  before the task commit. The Write tool mangles JSON-looking strings — such content goes via
  bash heredocs. zsh: bare `===` in echo triggers the "bad math" pitfall; quote it.

## Gate history

Per task the session ran (from `block-world/`): `npm test` (vitest) → `npx tsc --noEmit`
(strict) → `npm run build` → dev-server smoke on :5199 (root + module fetches 200, Vite ready,
port killed and confirmed free). Log tails in `/tmp/opencode/dev-t*.log`.

- T8: 37/37 · T9: 37/37 (build 477.58 kB) · T10: 41/41 (479.08 kB) · T11: 48/48 (480.77 kB) ·
  T12: 48/48 (481.29 kB)
- **T13 final sweep (13.4):** 48/48 tests, 8 suites · tsc strict clean · production build
  481.38 kB (124.59 kB gzip) · `npm run preview` on :5199 serves root/bundle/css 200 · bundle
  spot-checks confirm shipped JS carries the T11–T13 wiring (hover-text string, wireframe
  toggles, water-mood color 0x0a2a55 = 666197 both present) · preview↔dev parity expected
  (same seed, same code path — the human checklist item 10 covers the visual confirm).

## Handoff state (what a human still owes)

The only gate not run by the session is the **T13.5 manual browser pass** (10 items):
AO visual confirm (C), chunk-seam sweep at x|z = 16·k with wireframe, negative-coord fly,
≥1 min streaming soak with teleports (`renderer.info` flat), water end-to-end incl. 1 m vs 2 m
moods and glass, full hotbar/palette loop (E → assign → close → place, incl. glass/water),
edge cases (void respawn, self-cell placement, pitch clamp, no stuck keys), atlas hygiene
(no bleed, 11 tiles, zero console warnings), 60 fps open + underwater soak, preview/dev parity.
Run it against `npm run preview` (production bundle).

Known boundaries, per the plan's closing note (all intentional, post-POC): static translucent
water, y 0..79 terrain slab, 5×5×5 streaming ring with the 2+2 substep budget, no persistence.
Explicitly out of scope for later: ripples/caustics/god rays, per-chunk debug boxes, saves,
more biomes.