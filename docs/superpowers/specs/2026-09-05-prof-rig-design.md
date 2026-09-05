# Design — deterministic browser profiling rig (Playwright)

- **Date:** 2026-09-05
- **Branch:** lands with the `slice-heavy-remesh` Task 8 acceptance (small follow-up branch if
  that branch has already merged — decided at execution).
- **Status:** Design approved (2026-09-05). User decisions: **Playwright harness** (full
  `@playwright/test` dep, headless, CI-capable); coverage = **worst chunk + ocean**.
- **Revision R1 (2026-09-05, plan self-review):** the worst chunk `(2,·,0)` is already in the
  spawn ring (spawn column `(0,·,2)`, `VIEW_RADIUS = 2`), so segment A holds at the computed
  spawn instead of teleporting to (40, 8, 8) — the window frames are the unmodified production
  scenario (spawned player, ring filling, chunk loading → first mesh → light-settled remesh).
  The `boot` report field = segment-A frames before the window opens. The report also records
`worstChunk.maxWindowMs` and `global.maxFrameIndex` (the ADR acceptance line reads them
   directly). Everything else unchanged.
- **Revision R2 (2026-09-05, live-run verification):** two corrections found by the first
  green e2e run. (a) **Settle semantics:** `chunk.lightSettled` is live only in the worker's
  mirror — the light reply (`applyLightResult`) applies blight/skylight + `touched` but does
  not carry the flag to main-thread chunks, so the main-thread flag is never true. The rig
  instead settles on the **settled-light signature + quiescence**: a completed `sliced` cycle
  with `verts === 6312`, `PROF_QUIESCE` (10) remesh-free frames after the last worst-chunk
  remesh, and no remesh of the chunk pending or in flight
  (`!pendingRebuild.has('2,1,0') && !scheduler.has('2,1,0')`). A later touch restarts the
  quiescence (the self-correcting contract). (b) **Cycle arithmetic:** a 4-band split is
  **4 frames** — the plan frame meshes band 0; the merge frame meshes band 3 and then
  `finish()` returns the merged geometry — not "1 plan + 3 slice + 1 merge" (5 frames).
  Verified live: two 6312-vert 4-frame cycles at frames 193–196 and 205–208 (the second = a
  touched-during-split re-mesh). First green run: `window [108, 208]`, `settledVerts 6312`,
  `maxWindowMs 8.3`, ocean `max 7.8 / avg 2.2`, global max = frame 0 (one-time shader
  compile, outside the window), `pass: true`.
- **Resolves:** the browser-acceptance gap of
  `docs/superpowers/specs/2026-08-29-slice-heavy-remesh-design.md` §Testing and acceptance
  ("manual walk loading the pinned worst chunk … per-phase CPU work ≤ 16.7 ms in DevTools") —
  replaced by a deterministic, repeatable rig — and unblocks the ADR 0013 `<transcribe …>`
  acceptance line pending in Task 8.
- **Related:** ADR 0002 (15–28 ms worst-chunk remesh; "everything else holds zero frames
  > 25 ms" ocean baseline), ADR 0012 (light worker — `LightClient` drains a pin-identical
  `LightSim` core, `LIGHT_TICK_BUDGET = 512` pops/frame), `src/__tests__/remesh-perf.test.ts`
  (node baseline: worst chunk `2,1,0` = **6312 verts / 315,600 B** at default phase, r_mesh
  0.984, gate 0.76 ms).

## Problem

The remesh-slicing fix (Tasks 0–7, committed) has node-side proof (Phase 0 gate + unit tests)
but its acceptance bar is a **browser** claim: during the worst chunk's load + first mesh +
remesh, no frame's main-thread work exceeds 16.7 ms; the open-ocean walk stays < 25 ms.
Manual verification is slow and non-repeatable: navigating to chunk `2,1,0` (world x 32–47,
z 0–15) is a ~34-east / 38-north walk from spawn (6, ·, 46) with no on-screen compass, and the
agent cannot drive a browser from the shell without an automation library. The node gate
proves the cost model but never exercises the real frame loop, the frame-end drain, the
`SliceScheduler` across real frames, or the GPU upload path.

## What the rig can and cannot prove

- **Can:** per-frame **main-thread (JS) work** — the exact quantity the fix controls (98.4% of
  the remesh cost is CPU meshing per the Phase 0 gate). Headless Chromium measures JS time via
  `performance.now()` inside the frame callback the same way DevTools' frame bars do.
- **Can:** the rig runs the **real** code path — real `frame()` loop, real drain + scheduler,
  real worker light, real `toGeometry` + GPU upload — along a deterministic path.
- **Cannot:** a real display's vsync cadence (headless has no 60 Hz screen; rAF cadence is
  synthetic). "No visible dropped frames" is a *by-construction consequence* of
  "main-thread ≤ 16.7 ms per frame" — one manual headed glance on the user's display covers
  the residual visual check.
- **By design, frame-indexed, not time-indexed:** all budgets/caps are in frames; per-frame
  cost is measured with `performance.now()`. rAF cadence (real or synthetic) never enters an
  assertion.

## Design

### 1. Rig mode — `?prof=remesh` (`src/main.ts`, gated like the existing `?dbg` / `?phase`)

- `const profMode = params.get('prof') === 'remesh'`. **Zero cost when off**: every
  instrumentation point is inside the `profMode` check (single boolean, branch-predicted).
- On: `player.noclip = true` and the rig owns the player — `readMove()` returns zeros in
  `profMode`, and **every frame** the rig calls `player.place(waypoint)` (sets `pos`, zeros
  `vel` — position is 100% deterministic: no input, no physics, no wall-clock dependence).
- **Phase:** the app default (phase 0, no `?phase` param) — identical to the node baseline's
  light state (same seed 1234, same default world time, pin-identical light core). This is
  what makes the verts self-check below exact.
- **Path** (frame-indexed; the player is pinned by `player.place()` each frame — `noclip`,
  zero input):
  - **Segment A — worst chunk (asserted):** the player holds at the app's computed spawn
    (spawn column `(0,·,2)`) — **no teleport**: the worst chunk `(2,·,0)` is already in the
    spawn ring (chunk distance (2, −2), `VIEW_RADIUS = 2`), so it loads with the ordinary ring
    refill (`LOAD_BUDGET = 1` → ~60 frames after boot). The window frames are the unmodified
    production scenario. Hold until **settled** — the settled-light signature (a completed
    `sliced` cycle with `verts === 6312`) + `PROF_QUIESCE` (10) remesh-free frames after the
    last worst-chunk remesh + no remesh of the chunk pending or in flight
    (`!pendingRebuild.has('2,1,0') && !scheduler.has('2,1,0')`); *not* `chunk.lightSettled` —
    that flag is live only in the worker's mirror (R2a). A later touch restarts the quiescence
    (the self-correcting contract). Hard cap **600 frames** (the chunk loads ~frame 108, then
    light settle + 4-frame remesh; 600 is a generous hang guard).
  - **Segment B — ocean (asserted):** teleport `player.place((8, 34, 200))` each frame — a
    scanned 99%-water 5×5-chunk ring under seed 1234 (maxH = 33, max depth 12; the ring
    streams ~121 fresh water chunks at 1/frame), fixed **300-frame** budget (covers the full
    refill + settle + remesh profile).
- **`&norender` knob:** skips `renderer.render()` — the fallback if SwiftShader inflates
  main-thread GL cost. Default (rendering on) is the real code path; the report records
  which mode ran.

### 2. Instrumentation (prof-mode only)

- `performance.now()` around the **frame body** (total per-frame ms) and around the
  **drain block** (drain ms — the section the fix controls).
- **Tag every remesh of `2,1,0`**: per-frame kind (`probe-complete` | `plan` | `slice i of N`
  | `merge`), the frame's total ms, and the emitted vertex count. Frames group into
  **cycles**: a `probe-complete` cycle is one frame; a `sliced` cycle is **4 frames** over
  `SLICE_COUNT` = 4 bands — 1 `plan` frame (meshes band 0) + 2 `slice` frames (bands 1–2) +
  1 `merge` frame (meshes band 3, then `finish()` returns the merged geometry) (R2b).
- Per-frame records `{ i, seg, total, drain }` + a per-remesh array (plain arrays; ≤ ~1000
  frames, no ring buffer needed).

### 3. Report

Emitted at the end of segment B: `console.log('PROF-RESULT ' + JSON.stringify(report))` and
`window.__profResult = report` (the `window.__bw` convention):

```
{
  mode: 'remesh', seed: 1234, phase: 0, render: true,
  boot:       { frames, maxMs },          // A-frames before the window opens (reference only)
  worstChunk: {
    key: '2,1,0', settledVerts,           // the final cycle's vertex count
    window: [firstLoadFrame, settledMergeFrame],
    maxWindowMs,                          // the worst frame inside the window (the ADR line)
    remeshCycles: [ { kind: 'probe-complete' | 'sliced', frames: [f0..fN], maxFrameMs, verts } ],
  },
  ocean:      { frames: 300, maxMs, avgMs },
  global:     { maxFrameMs, maxFrameIndex, drainMaxMs, framesOver16_7: [...], framesOver25: [...], framesOver33_4: [...] },
  pass: true|false,
  failReason: string|null                  // set when pass is false (or on a cap overrun)
}
```

The rig **always emits the report** — even on a segment cap overrun or an unexpected error
(`failReason` set, `pass: false`) — so a hang reports instead of hanging.

### 4. Pass criteria (computed in the rig, asserted by the spec)

1. **Baseline:** `worstChunk.settledVerts === 6312` — the browser's settled light matches the
   node baseline the slice constants derive from; a mismatch = light-state drift (worldgen,
   phase, or worker change) that would silently invalidate `PROBE_VERTS`/`SLICE_COUNT`.
2. **Slice path exercised:** the settled (last) remesh cycle is `sliced` — plan + 2 slice
   + merge (4 frames over the 4 bands, R2b) — the rig really ran the new code, not the
   one-shot path.
3. **Fix claim:** every worst-chunk remesh frame (plan / all slices / merge / any
   probe-complete) has total-frame ms ≤ 16.7.
4. **Acceptance bar B:** no frame with total ms > 16.7 in the window
   `[firstLoad .. settledMerge]`. *Fallback if it fails on non-remesh streaming-load frames
   (teleport-refill artifact, not a product regression): scope the hard assert to
   remesh-tagged frames and report load-frame costs separately — decided at iteration time,
   recorded in ADR 0013.*
5. **Ocean regression:** segment B max frame ms < 25 (the ADR 0002 baseline).

### 5. Playwright harness

- devDep **`@playwright/test`**; one-time `npx playwright install chromium`.
- **`playwright.config.mjs`** (new): `testDir: 'tests/e2e'`;
  `webServer: { command: 'npm run dev -- --port 4173 --strictPort', url: 'http://localhost:4173',
  reuseExistingServer: true }` (isolated port — the user's dev server may be running);
  `use: { headless: true }`; test timeout 180 s (worst case ≈ boot 60 + A ≤ 600 + B 300
  frames of in-browser worldgen/light/meshing + worker round-trips).
- **`tests/e2e/remesh-prof.spec.ts`** (new; Playwright handles TS natively):
  `page.goto('http://localhost:4173/?prof=remesh')` →
  `page.waitForFunction(() => window.__profResult, { timeout: 150_000 })` → **always print
  the full JSON** (pass or fail, human-readable) + write the `test-results/prof-remesh.json`
  artifact → `expect(r.pass, 'see prof-remesh.json').toBe(true)`.
- **`package.json`**: `"prof": "playwright test"` script. Not part of `npm test` (vitest) —
  different runner, needs a browser + dev server. `vitest.config.mts` scopes the unit suite to
  `src/__tests__/**/*.test.ts` (the e2e spec matches vitest's default `*.spec.ts` include and
  would otherwise be collected by the unit runner); `test-results/` is gitignored. CI can run
  `npm run prof` after `npm test`.

### 6. Task 8 bridge (closes the open acceptance)

1. Run `npm run prof`; the rig's JSON **is** the ADR 0013 acceptance line — transcribe it into
   the `<transcribe from the Task 8 acceptance log …>` placeholder.
2. One manual **headed** glance on the user's display (worst-chunk walk + ocean) confirms the
   by-construction vsync claim visually.
3. Commit the five pending doc files (ADR 0013 + index + ADR 0002 pointer + `TODO.md` +
   `PROJECT.md`) — Task 8 complete.

## Determinism and risks

- **Determinism:** seeded world (1234) + default phase 0 (== node baseline) + fixed
  frame-indexed path + `player.place()` (no physics). The worker's settled light is
  deterministic (pin-identical core, same inputs). Worker **reply timing** (macrotasks) can
  shift *which frame* an event lands on — every assertion is on measured costs + tagged
  events, never on frame indices.
- **SwiftShader GL:** headless WebGL executes in the GPU process; main-thread cost is command
  submission (small). If it inflates `render()` cost, the `&norender` fallback isolates the
  CPU slice; the report's `render` field records which ran. Self-check: the summed
  remesh-frame cost should track the node baseline (~5.75 ms mesh + ~0.8 ms merge tail).
- **Light drift:** the `settledVerts === 6312` check catches it (criterion 1).
- **Teleport artifact:** the rig's teleport is not a player behavior; if window frames
  16.7–25 ms show up from ring-refill loads, the fallback scoping (criterion 4) keeps the
  assert honest to the product claim.
- **Rig upkeep:** the rig reads `pendingRebuild`/`scheduler` internals — a frame-loop change
  must keep the rig compiling/running; `npm run prof` in CI (when added) is the tripwire.

## Files

- `src/main.ts` — the rig (~120 lines, all inside the `profMode` gate).
- `playwright.config.mjs` (new), `tests/e2e/remesh-prof.spec.ts` (new),
  `vitest.config.mts` (new — unit-scope), `.gitignore` (+`test-results/`, `playwright-report/`).
- `package.json` — +`@playwright/test` devDep, +`"prof"` script.
- No changes to the mesher, existing tests, or other src modules.

## Non-goals

- Playwright-driven interaction tests (block edit / water placement near the heavy chunk) —
  the manual headed glance covers that; scripting + visual "no hole" judgment is brittle.
- CI wiring beyond `npm run prof` working locally.
- GPU-frame-time profiling (CDP/GPU traces) — the CPU budget is what the fix controls.
- Headed vsync assertions — by-construction consequence; one-time manual check.