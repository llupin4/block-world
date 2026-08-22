# 0008. Sky & day/night — a canonical WorldTime advanced in the fixed substep drives a keyframed sky sampler, dome/stars/sun-moon renderer, and a world-locked scrolling cloud layer

- **Status:** Accepted
- **Last updated:** 2026-08-22
- **Sources:** (superseded by this ADR; recoverable via `git show 0cf878c:<path>`)
  - `docs/superpowers/specs/2026-08-19-day-night-clouds-design.md`
  - `docs/superpowers/plans/2026-08-19-day-night-clouds.md` (incl. the post-execution clouds v2/v3/v4 amendment record)
  - `TODO.md` (the resolved "Clouds and a sun/moon … day/night cycle" item)

## Context

At the start of this project the world rendered with a flat sky-blue `scene.background` and a `FogExp2`, both swapped instantaneously by the air/water mood; there was no time of any kind — no clock, sun/moon, stars, or clouds. The renderer was unlit (`MeshBasicMaterial` + baked per-vertex face-shade/AO), so a global dim was the only way to darken the world at night. This project delivered: a world-time clock as world state decoupled from consumers; a sky system that reads it (gradient sky, sun/moon, stars, a global night dim); a cloud layer; and a small HUD clock. Out of scope: dynamic lighting with light levels (landed separately as ADR 0007 — Dynamic lighting, consuming this clock), weather, cloud shadows, and persistence of clock state (no save system yet; the clock starts at noon every load).

## Decision

### World time (`src/time.ts`)

Pure state + math, no three.js imports (tests without a browser). `class WorldTime` holds two deliberately separate counters:

- `time` — total simulation seconds since load.
- `phaseTotal` — the raw day-cycle position, its own stored counter (not derived from `time`) so the daylight cycle can later be frozen, rescaled, or set independently of the simulation clock (server-style "doDaylightCycle / time set" semantics). The public `dayPhase ∈ [0, 1)` is `phaseTotal % 1`.
- `day` — day number; the session starts at **noon of day 1** (`time = 0, dayPhase = 0, day = 1`).

`advance(dt)`: `time += dt`; `phaseTotal += dt / DAY_LENGTH`; `day = 1 + floor(phaseTotal + 0.5)` increments exactly when the raw total crosses an integer **+ 0.5** — a **midnight** boundary (phase 0.5) — never at the noon wrap. `DAY_LENGTH = 240` s (a 4-minute cycle: 2 min day, 2 min night; phase 0.0 noon → 0.25 sunset → 0.5 midnight → 0.75 sunrise). Display `hour = (12 + 24·dayPhase) mod 24` (phase 0.0 reads 12:00, 0.25 reads 18:00, 0.5 reads 0:00).

**Tick discipline:** `main.ts` calls `worldTime.advance(STEP)` *inside the fixed 60 Hz physics substep loop* (next to `player.update`), never from wall-clock `dt`. The sun advances with simulation steps — a lagging frame drops frames, it never stretches the day. The clock keeps running while the palette/help overlays are open (world time is continuous, independent of player input). Determinism: two clocks advanced through identical `dt` sequences stay bit-identical (no wall-clock reads anywhere in the module).

### Sky sampler (`sampleSky(dayPhase): SkySample`)

A pure, headlessly-testable core. Keyframes live in **phase space** (not sun altitude), joined by smoothstep in phase wrapping 1.0 → 0.0; the table is mirror-symmetric about midnight, so dawn and dusk are identical for free. Fields: `skyTop, skyHorizon, airFogColor, airFogDensity, worldDim, starAlpha, sunDir, moonDir, waterBg, waterFogColor, waterFogDensity` (colours as `[r,g,b]` floats). Anchors: noon (0.00, `worldDim` 1.00, `starAlpha` 0.0), late pm (0.22), sunset (0.25, dim 0.85, stars 0.15), nightfall (0.30, dim 0.45, stars 0.6), midnight (0.50, dim 0.33, stars 1.0), then the mirrored pre-dawn/dawn/dawn-lift rows back to the noon wrap. The underwater columns are their own keyframes — the underwater mood is **time-driven too**, so the sun visibly sets under the surface.

**Sun/moon geometry:** one angle drives both, `θ = 2π·dayPhase`; `sunDir = (sin θ, cos θ, 0)`, `moonDir = −sunDir`. Noon puts the sun at zenith `(0,1,0)`, sunset on the +X horizon, midnight at nadir, dawn rising on −X; the moon is always the exact antipode (overhead at midnight). The path lives in a fixed vertical plane (east/west); no azimuth animation. These directions feed the sprite positions and — in ADR 0007 — the lighting system's sun position.

### Sky renderer

Constructed once (`createSky(...)`), re-applied each frame via `sky.apply(sample, mood, camera)`:

- **Sky dome** replaces the flat background: a large inverted sphere `SphereGeometry(400, 32, 16)` (inside the 512 far plane) with a 16×256 canvas vertical gradient (row 0 = zenith `skyTop`, bottom = horizon `skyHorizon`), `BackSide`, `fog: false`, `depthWrite: false`. Re-centred on the camera each frame (skybox-follows-camera) so the horizon stays level at any pitch — the reason a fullscreen screen-space gradient was rejected. `scene.background` is `null` in the air mood. The gradient canvas is redrawn only when `skyTop`/`skyHorizon` move (the dusk/dawn bands, ~15 s per cycle); stable phases reuse the texture with zero uploads.
- **Stars:** one `THREE.Points` of ~400 fixed random directions on the upper hemisphere of a radius-~360 sphere, generated once with a seeded PRNG, `fog: false`, `sizeAttenuation: false`; material opacity = `starAlpha`, hidden below ~0.01. Camera-follows.
- **Sun & moon:** two `THREE.Sprite`s (soft radial-gradient canvas discs — sun warm yellow with a broad glow, moon pale with a faint halo), `fog: false`, positioned at `camera + dir·380`, hidden below the horizon.
- **`worldDim`:** per frame, `matOpaque.color.setScalar(dim)`, `matTrans.color.setScalar(dim)` and the cloud material's colour — one uniform update on the shared materials dims the entire world with **zero remeshing**. This was the accepted stand-in until ADR 0007 baked real skylight into the per-vertex colour buffer; it survives only as the cloud/sky tint.
- **Underwater mood keeps priority but is time-tinted:** `syncWaterFx()` still owns the mood state and the FOV squeeze, while `sky.apply` installs which fog/background is active and paints the time-driven underwater values. In the water mood the dome, stars, sun, moon, and cloud layer are hidden (dense fog would swallow them anyway).

### Clouds (`src/clouds.ts`)

A pure-consumer module: it reads `WorldTime` (for wind) and the `SkySample` (for tint); it never advances anything. Final form (after the v2/v3/v4 revisions below):

- **Shape:** a single quad, **2048×2048 blocks**, flat, at altitude **y = 96** (`ALTITUDE`, above `WORLD_Y_MAX = 64`), **centered on the player every frame** (continuous re-centering — no snapping event that could lurch). Its edge is always ≥ 1024 blocks away, so the 512-block far plane clips it to a disc whose rim sits ≈5–10° above the horizon — an effectively infinite layer from the ground. One draw call, one 128×128 texture.
- **Pattern:** a 128×128-texel repeating tile, each texel = one 4×4 world-block cell, baked once at startup (seeded PRNG): a texel's alpha is **core** if `c = simplex2d((wx+2)/12, (wz+2)/12) > 0.2`, **rim** (~60% alpha) if `c > 0.05`, else none (the +2 samples the cell centre). `NearestFilter`, no mipmaps → the blocky 0/1 cell edges. The pattern repeats every **512 blocks** — a deliberate cosmetic trade-off (repeat distance ≈ 2 min of walking).
- **Wind / drift:** the pattern scrolls purely via the texture offset: `map.offset = (camera + windAt(time)) / 2048`, where `windAt(t) = [0.5·t, 0.45·t + 37.7]` blocks (~1 block per 2 s). Because the sheet is centered on the camera AND the offset tracks `camera + wind`, the uv of a world point `w` reduces to `(w + wind(t))/512 + const` — the camera terms **cancel algebraically**, so the pattern is world-locked even though the sheet follows the player; re-centering can never cause a seam. No per-frame noise, matrices, or uploads: two position floats + two offset floats.
- **Material:** white, `transparent: true`, `opacity: 0.70`, `fog: false` (50–150 blocks overhead; night's exponential fog would fade the layer up to ~50%), `depthWrite: false`, `DoubleSide`. Transparent depth order is **dynamic**: `renderOrder` `-1` while the eye is at/below the sheet (it is the farthest transparent on any upward ray — terrain tops out at 64 < 96 — so it draws behind vegetation and water), `+1` while flying above it (nearest looking down, so in front of water). Sun/moon sprites and stars are fixed at `-2`, behind the sheet, so cloud puffs occlude the celestials. Tint: `lerp(#ffffff, #707a9c, clamped (1 − worldDim)/(1 − 0.33))` — crisp white by day, faint blue-grey at night. Hidden in the underwater mood.
- **Pure part (node-testable):** constants `CELL = 4`, `TILE = 128`, `WAVE = 12`, `CORE = 0.2`, `RIM = 0.05`, `ALTITUDE = 96`, `QUAD = 2048`; `cloudCoverage(wx, wz, windX, windZ)` (one cell's noise value, with the world-lock identity `coverage(w+d, u) === coverage(w, u+d)`); `cloudTileLevel(cx, cz) ∈ {0,1,2}`; `windAt(t)`; `cloudTexOffset(camX, camZ, t)`; `cloudRenderOrder(camY) = camY > ALTITUDE ? 1 : -1`.

### HUD clock & integration

A small semi-transparent monospace readout top-left — `Day 2 · 19:41` — a static `#clock` div styled in `ui.css`, built from `worldTime.day` + `hour` (minutes = `floor((hour mod 1)·60)`, zero-padded); the text node is rewritten only when the string changes. `main.ts` owns all instances (sky/cloud modules never import from it): boot constructs `WorldTime`, `createSky(...)`, `createClouds(scene)`; the fixed substep loop advances the clock; per frame, after `syncWaterFx()`, it sets the cloud visibility, then `sky.apply(sampleSky(worldTime.dayPhase), waterFx, camera)`, then `clouds.update(camX, camZ, camY, worldTime.time, sample.worldDim)`. No changes to world storage, mesher, water sim, or player code for this feature; the streaming/remesh budget is untouched (everything added is O(1) per frame apart from the rare gradient redraws). Two deliberate carve-outs landed alongside: `world.isSolid` now treats Leaves as solid for the player (no walking through canopies; glass keeps pass-through), and the shared leaves/water `matTrans` opacity is 0.85.

## Alternatives considered

- **Fullscreen screen-space sky gradient** — rejected: it can't keep the horizon level with the world horizon at arbitrary pitch; the camera-following dome does.
- **Per-cloud objects / instanced window** — rejected after v1 failed its manual pass (see Superseded decisions).
- **Deriving `dayPhase` from `time`** — rejected: a separate stored `phaseTotal` lets the daylight cycle be frozen/rescaled/set independently of the simulation clock with no extra machinery.
- **Azimuth animation for the sun** — deferred: a fixed east/west vertical plane is sufficient and keeps the sampler a plain data table.

## Consequences

- The global `worldDim` was a stopgap: ADR 0007 — Dynamic lighting replaced it with real per-block skylight baked into the vertex colour buffer, leaving `worldDim` only as the cloud/sky tint.
- ~~Open follow-up: **align the simulation clocks on one tick system.**~~ Resolved 2026-08-22 by **ADR 0011 — Simulation clocks**: `WorldTime.tick` is the canonical heartbeat and the water pulse strides it (every 30th tick). The light drain remains a per-frame budget (ADR 0007); the off-thread light worker will carry tick numbers in its protocol.
- Performance: O(1) per frame apart from the transition-band gradient redraws; the cloud layer is one draw call.

## Superseded decisions

- **The POC's static, edge-triggered head-in-water mood swap** (ADR 0003 — Chunk meshing & rendering: FogExp2 + background + FOV 70→62 on `headInWater`) — the underwater mood is now time-driven like the rest of the sky, reading the underwater keyframe columns.
- **Clouds v1 (instanced 24×24-cell window).** The window rebuilt its mask only when the camera crossed a 4-block grid line, so standing still showed no drift (the pattern was effectively world-static) and the finite 96-block window's hard edge read as a visible square band. **v2** replaced it with the repeating world-space tile on one large fixed-altitude sheet scrolled by the texture offset (commit `eca86af`). **v3** fixed v2's 512-block re-snap lurching the sheet (and leaving the player at the sheet's corner on spawn) by centering the quad on the player every frame with the camera-cancelling uv offset (commit `0d8fc20`). **v4** fixed the player-centred sheet drawing *in front of* tree canopies (its bounding sphere sits at the camera, so the distance-based transparent sort drew it last) with the dynamic `renderOrder` rule, the celestial `-2` layer, and the opacity re-tune (cloud 0.85 → 0.70; shared leaves/water `matTrans` 0.75 → 0.85) (commits `7563eba` + `599080b`).