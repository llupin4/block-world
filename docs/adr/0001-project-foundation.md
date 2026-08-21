# 0001. Project foundation & tooling — a hand-scaffolded Vite + strict-TypeScript + vitest browser voxel sandbox, gated by an automated test/type/build/smoke suite and deployed to GitHub Pages

- **Status:** Accepted
- **Last updated:** 2026-08-20
- **Sources:** (superseded by this ADR; recoverable via `git show 0cf878c:<path>`)
  - `docs/superpowers/plans/2026-08-15-voxel-sandbox-poc.md` (Goal, Tech stack, Spec deviations, Milestone → task map, File map, Conventions, Task 1, Task 13)
  - `docs/superpowers/2026-08-15-voxel-sandbox-poc-execution-notes.md` (task table, milestones, gate history)
  - `PROJECT.md` (§1 Stack, §13 Milestones, §14 Known traps, §15 Deferred)
  - `scripts/deploy-gh-pages.mjs`, `package.json`

## Context

The goal was a browser voxel sandbox from the POC plan (`PROJECT.md`): 16³ chunked infinite terrain (simplex noise — hills, beaches, trees, caves, water), fly/walk/swim physics, block break/place via raycasting, streaming load/mesh/unload, hotbar + palette UI, underwater effects, and a procedural block texture atlas. Everything client-side, no build-time assets. The scope note set the bar: where there's a tradeoff between "correct/fast" and "working this week," pick working, and flag each shortcut as **[POC shortcut]** so the deferral is visible. This ADR records the foundation that everything else in this set builds on: the stack, the project layout, the gate suite, the deliberate POC boundaries, and the deploy path.

## Decision

### Stack & pinned versions

| Piece | Choice | Why |
|---|---|---|
| Renderer | three.js `^0.166.1` (+ `@types/three ^0.166.0`) | WebGL boilerplate, camera, scene graph; doesn't hide `BufferGeometry`, which the mesher needs |
| Build | Vite `^5.4.0` + TypeScript `^5.5.4` | Instant HMR, zero config; TS pays for itself the moment you start indexing flat arrays |
| Noise | `simplex-noise` **pinned exactly to `4.0.3`** (no caret) | Small, fast, seedable; the registry tops out at 4.0.3, and deterministic noise values matter for the fixed-seed test assertions (ADR 0002 — World model & terrain) |
| Tests | vitest `^2.0.5` (node env) | No DOM tests; three.js is import-safe in node because no test ever calls `toGeometry` |
| Physics | None — hand-rolled | Voxel AABB collision is ~100 lines; a general engine fights the grid (ADR 0004 — Player & interaction) |
| UI | Plain DOM overlay | Flexbox and hover states for free; do not draw the hotbar in-canvas (ADR 0010 — UI & inventory) |

`tsconfig`: ES2022, module ESNext, moduleResolution `bundler`, **strict**, noEmit, skipLibCheck, isolatedModules. Package scripts: `dev` (vite), `build` (`tsc --noEmit && vite build`), `preview` (vite preview), `test` (`vitest run`), `deploy:gh-pages`. Hand-scaffolded (no `create-vite`) — Vite handles TS natively, and an empty `vite.config.ts` is deliberate (Vite picks up `index.html` + TS out of the box; vitest reads the same file and uses node env by default).

**[POC shortcut]** Everything runs on the main thread. No Web Workers. Generation and meshing hitch when chunks load — acceptable at small render distance, and moving to workers later is a mechanical refactor since both are already pure functions over buffers.

### Project layout & conventions

```
block-world/
├── package.json · tsconfig.json · vite.config.ts · .gitignore · index.html   # T1
└── src/
    ├── main.ts        # entry; the only file with side effects (atlas/tile drawing lives inline here)
    ├── ui.css         # single stylesheet
    ├── blocks.ts      # registry            world.ts   # chunk store
    ├── terrain.ts     # generation          chunk-mesher.ts  # two-pass mesh + AO
    ├── player.ts      # physics             raycast.ts  # DDA targeting
    ├── streaming.ts   # load/mesh/unload    ui.ts       # hotbar (data-only)
    └── __tests__/     # one suite per module (blocks, world, terrain, chunk-mesher, player, raycast, streaming, ui)
```

Conventions: fixed timestep `STEP = 1/60` with an accumulator in the main loop (frame dt clamped to 0.1); `player.pos` = feet position; all module code is ESM with named exports only (no default exports in logic modules); `main.ts` is the sole entry with side effects; no comments unless explaining a non-obvious deviation. Test files mirror the modules; tasks with no node-testable surface (the demo scene, water FX, final polish) get manual `npm run dev` verification plus the final gate.

### The automated gate suite

Per task the executing session ran, from the repo root: `npm test` (vitest) → `npx tsc --noEmit` (strict) → `npm run build` → a dev-server smoke on :5199 (root + module fetches return 200, Vite ready, port killed and confirmed free). "Green" means all four pass before the task commits. The final POC sweep (T13): 48 tests / 8 suites, tsc strict clean, production build ≈ 481 kB (≈ 125 kB gzip), and `npm run preview` serving root/bundle/css 200.

### Deliberate POC boundaries

No persistence or saves; a static world seed; a 5×5×5 streaming ring around the player (cross-ref ADR 0002); a y 0..79 terrain slab. Known traps the design was built around (PROJECT.md §14): chunk-boundary bugs are the dominant bug class (seam faces, AO discontinuities, edits that don't propagate); never remesh synchronously inside `setBlock` (mark dirty, flush once per frame with a budget); negative-coordinate math needs `>>`/`&`, not `/`/`%`; every skipped `dispose()` is permanently held GPU memory; atlas bleeding is avoided with `NearestFilter` + mipmaps off; winding order must be CCW under `FrontSide`; tunneling at low framerate is fixed by the fixed timestep; and frustum culling alone isn't enough, so `RENDER_DIST` stays at 6 with vertical chunks capped.

### The gh-pages deploy decision

`scripts/deploy-gh-pages.mjs` (`npm run deploy:gh-pages`) publishes the site. Vite's default build emits hashed asset names, a `crossorigin` attribute, and absolute `/assets/...` paths — none of which suit GitHub Pages, where the site is served under `/block-world/` (paths must be relative) and the gh-pages branch pins the entry files to `assets/index.js` + `assets/index.css`. The script: (1) builds (`tsc --noEmit && vite build` — a type/build error aborts the deploy); (2) rewrites `dist/` to the gh-pages pattern (static `index.js`/`index.css`, relative `./assets/...`, no `crossorigin`); (3) mirrors `dist/` into the gh-pages branch, commits (`deploy: <sha>`), and pushes; (4) restores the branch it was run from. It requires running from a clean tree (a dirty tree aborts), stages only the site files (not `git add -A`, since a build leaves untracked cruft the gh-pages `.gitignore` doesn't cover), and supports `--dry-run` (preview the commit/push without making it, then `git reset --hard`).

## Alternatives considered

- **`npm create vite` scaffold** — rejected in favour of a hand scaffold (spec deviation D7): the config is trivial and hand-writing it keeps the exact pinned versions and the empty-config behaviour explicit.
- **`Uint16Array` block storage** — the spec called for it; the implementation uses `Uint8Array` (D9) since the 10 block values fit in a byte and behaviour is identical.
- **In-canvas hotbar** — rejected: a plain DOM overlay gets flexbox and hover states for free (ADR 0010).
- **Web Workers for generation/meshing** — deferred ([POC shortcut]): main-thread hitches are acceptable at POC render distance, and the pure-function-over-buffers shape makes the later worker migration mechanical.

## Consequences

- The project grew well beyond the POC boundaries: the "out of scope" items were landed one by one as separate features — water simulation (ADR 0005 — Water simulation) and graded water rendering (ADR 0006 — Water rendering), dynamic lighting (ADR 0007 — Dynamic lighting), sky/day-night/clouds (ADR 0008 — Sky & day/night), and special blocks (ADR 0009 — Special blocks). The gate suite and the `src/` layout survived that growth unchanged.
- Still deferred (PROJECT.md §15): greedy meshing, `DataArrayTexture` instead of an atlas, biomes beyond a surface-block swap, survival mechanics (health, mining time, item stacks, crafting), entities/mobs, and multiplayer. (Flood-fill skylight/blocklight and the day/night cycle were the two items that got de-deferred and landed as ADR 0007 and ADR 0008.)

## Deviations & execution notes

The POC plan recorded its own intentional spec deviations (each justified): **D1** plain TS `enum Block` + `Record<Block, BlockDef>` instead of a `const`-asserted object (same values/ordering, cleaner typing); **D2** the FACES table's `+X`/`−X` corner rows corrected to CCW (the spec's were clockwise under `FrontSide` and would cull every side face); **D3** the `vertexAO` tangent fix (pick the two non-normal axes, not the normal axis, so X/Z faces don't sample the same neighbour twice); **D4** AO + face shade baked at mesh build so "lighting" needs no runtime work (the M6 lighting milestone becomes a visual-verification step in T13); **D5** a single shared transparent material (`opacity 0.75`, `depthWrite:false`, `DoubleSide`) for water/leaves/glass (leaves look slightly glassy, accepted); **D6** the streamer loads only the terrain band `cy ∈ [0,4]` (5 levels), not all 7 vertical levels; **D7** hand scaffold; **D8** M1 "render one chunk" done as a richer 3×3-chunk synthetic demo; **D9** `Uint8Array` storage; **D10** no persistence; **D11** milestone compression (T6→M1, T7/T8→M2/M3, T9→M4, T10/T11→M5, T12→M6, T13→M6/M12).

Condensed build history (milestones T1–T13, representative commits): T1 scaffold `b968754` · T2 blocks `d44a9ef` · T3 world store `efd1c61` · T4 terrain `c2def5f` · T5 chunk mesher `bbb752a` · T6 demo scene `71af48e` · T7 player `642bed1` · T8 break/place `749660f` · T9 terrain world `07c3ef1` · T10 streaming `377474d` · T11 hotbar+palette `7b8f5bf` · T12 underwater FX `bc490cf` · T13 polish + gate `d860c3e`. All milestones met; the final gate state is the T13 sweep above.