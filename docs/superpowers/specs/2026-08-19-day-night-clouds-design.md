# Day/Night Cycle, Sun & Moon, Stars, Clouds — Design

Date: 2026-08-19 · Post-POC feature work (follows the torches/doors/palette
iteration). Implements the first "Sky & lighting" item from `TODO.md`; the
dynamic-lighting item stays deferred and is designed to consume the clock this
project introduces.

## Context

The world currently renders with:

- a flat sky-blue `scene.background` colour and a `FogExp2`, both swapped
  instantaneously by the air/water "mood" (underwater) swap in `src/main.ts`;
- **no time of any kind** — no clock, no sun/moon, no stars, no clouds;
- an unlit renderer: `MeshBasicMaterial` + baked per-vertex face-shade/AO in
  the shared `colors` buffer (no light objects, no per-block light data);
- `World Y ∈ [−32, 64]`, camera far plane 512.

This project delivers:

1. a **world-time clock** as world state, decoupled from any consumer;
2. a **sky system** that reads the clock: gradient sky, sun/moon, stars, a
   global night dim of the whole world;
3. a **cloud layer** (a world-locked repeating pattern on one large planar
   sheet, scrolled by wind);
4. a small **HUD clock**.

Explicitly out of scope: dynamic lighting with light levels (the second
"Sky & lighting" TODO item — it will consume `WorldTime` and replace the
global dim with per-block skylight), weather, cloud shadows, and persistence
of clock state (there is no world save system yet; the clock starts at noon
every load).

## Conventions

- This project's code and documentation do not name or reference any
  particular existing game by name. Prior art is described generically
  ("the classic voxel-sandbox proportion", "a classic voxel-sandbox
  convention").

## World time (`src/time.ts`)

Pure state + math. **No three.js imports** — nothing in this module touches
WebGL, so it tests without a browser.

- `class WorldTime` holds two counters, deliberately separate:
  - `time` — total simulation time (seconds) since load;
  - `phaseTotal` — the raw day-cycle position, normally advanced 1:1 with
    `time` (via `DAY_LENGTH`). It is its own stored counter, not a value
    derived from `time`, so the daylight cycle can later be frozen,
    rescaled, or set independently of the simulation clock (server-style
    "doDaylightCycle / time set" semantics, without any extra machinery).
    The public `dayPhase` ([0, 1)) is its read-wrapped view: `phaseTotal % 1`.
  - `day` — day number; session starts at **noon of day 1**
    (`time = 0, dayPhase = 0, day = 1`).
- `advance(dt)`: `time += dt`; an unbounded raw phase total accumulates
  (`phaseTotal += dt / DAY_LENGTH`) and the public `dayPhase` is read as
  `phaseTotal % 1`; `day` (= `1 + floor(phaseTotal + 0.5)`) increments
  exactly when the raw total crosses an integer **+ 0.5** — i.e. a
  **midnight** boundary (phase 0.5) — never at the noon wrap (integer raw
  total).
- `DAY_LENGTH = 240` seconds — a 4-minute cycle: 2 min of day, 2 min of
  night (phase 0.0 noon → 0.25 sunset → 0.5 midnight → 0.75 sunrise).
- `hour: number` (display hour) = `(12 + 24 · dayPhase) mod 24` — phase 0.0
  reads 12:00, 0.25 reads 18:00, 0.5 reads 0:00.
- **Tick discipline**: `main.ts` calls `worldTime.advance(STEP)` *inside the
  fixed 60 Hz physics substep loop* (next to `player.update`), never from
  wall-clock `dt`. The simulation clock — and therefore the sun — advances
  with simulation steps: a lagging frame drops frames, it never stretches the
  day. This mirrors how the water sim already runs on its own independent
  slow clock, and sets the stage for the backlog item "align all simulation
  clocks on one tick system" (TODO.md § World time & simulation clocks),
  which is a prerequisite for future server-authoritative multiplayer.
- The clock keeps running while the palette/help overlays are open: world
  time is continuous, independent of player input.

### Tests (`src/__tests__/time.test.ts`)

- `advance(240)` wraps `dayPhase` to 0 and lands on **day 2** (one midnight
  passed).
- `advance(120)` reaches exactly phase 0.5, which is the day boundary
  itself: `day` is already 2 at midnight (the increment happens on the
  midnight boundary, not at the noon wrap).
- `hour` reads 12.0 at phase 0, 18.0 at 0.25, 0.0 at 0.5, 6.0 at 0.75.
- Determinism: two clocks advanced through identical `dt` sequences stay
  bit-identical (phase, time, day) — no wall-clock reads anywhere in the
  module.

## Sky (`src/sky.ts`)

Two layers: a **pure sampler** (testable headlessly) and a thin **renderer**
(the three.js side, constructed once in `main.ts`, re-applied per frame).

### Sampler: `sampleSky(dayPhase): SkySample`

Keyframes live in **phase space** (not sun altitude), so the table is plain
data and endpoints are exact. Consecutive anchors are joined by smoothstep
in phase, wrapping 1.0 → 0.0. The table is mirror-symmetric about midnight,
so dawn and dusk are identical for free.

| phase | meaning     | skyTop   | skyHorizon | airFog   | airFogDens | worldDim | starAlpha | waterBg  | waterFog | waterFogDens |
|-------|-------------|----------|------------|----------|------------|----------|-----------|----------|----------|--------------|
| 0.00  | noon        | `#3d9ae0` | `#87ceeb`  | `#cfe8ff` | 0.004      | 1.00     | 0.0       | `#0a2a55`| `#0a2a55`| 0.35         |
| 0.22  | late pm     | `#6f8fc8` | `#e8a05c`  | `#d8b8a8` | 0.0045     | 1.00     | 0.0       | `#09244d`| `#0a2a55`| 0.35         |
| 0.25  | sunset      | `#3a2f66` | `#d9713f`  | `#6a5570` | 0.005      | 0.85     | 0.15      | `#071c3d`| `#071c3d`| 0.37         |
| 0.30  | nightfall   | `#0a0d1e` | `#232c52`  | `#151d3a` | 0.0055     | 0.45     | 0.6       | `#040b18`| `#040b18`| 0.39         |
| 0.50  | midnight    | `#05070f` | `#2a3a66`  | `#101a33` | 0.006      | 0.33     | 1.0       | `#030710`| `#04091a`| 0.40         |
| 0.70  | pre-dawn    | `= 0.30` |            |          |            |          |           |          |          |              |
| 0.75  | dawn        | `= 0.25` |            |          |            |          |           |          |          |              |
| 0.78  | dawn lift   | `= 0.22` |            |          |            |          |           |          |          |              |
| 1.00  | (noon wrap) | `= 0.00` |            |          |            |          |           |          |          |              |

(`= 0.30` etc. means "the mirror of that row".) The underwater columns are
their own keyframes: the underwater mood is **time-driven too** — night
makes the water darker, so the sun visibly sets under the surface.

`SkySample = { skyTop, skyHorizon, airFogColor, airFogDensity, worldDim,
starAlpha, sunDir, moonDir, waterBg, waterFogColor, waterFogDensity }`
(colours as `[r,g,b]` floats).

- **Sun/moon geometry.** One angle drives both: `θ = 2π · dayPhase`.
  `sunDir = (sin θ, cos θ, 0)`, `moonDir = −sunDir`. So at noon the sun is at
  zenith `(0,1,0)`, at sunset it sits on the **+X horizon**, at midnight it is
  at nadir, and it rises on the −X horizon at dawn; the moon is always the
  exact antipode (overhead at midnight). The path lives in a fixed vertical
  plane (east/west); no azimuth animation.
- These directions feed the sprite positions in the renderer and — later —
  the lighting system's sun position.

### Renderer

Constructed once (`createSky(...)`), re-applied each frame via
`sky.apply(sample, mood, camera)` where `mood` is the existing air/water value:

- **Sky dome** (replaces the flat `scene.background` colour): a large
  inverted sphere `SphereGeometry(400, 32, 16)` — inside the 512 far plane —
  with a **16×256 canvas vertical gradient** (row 0 = zenith `skyTop`, row
  bottom = horizon `skyHorizon`; the sub-horizon half is never seen in the
  air mood). Material: `MeshBasicMaterial`, `side: BackSide`, `fog: false`,
  `depthWrite: false`. The dome is re-centred on the camera position each
  frame (skybox-follows-camera), so the horizon stays level with the world
  horizon at any pitch — the reason a fullscreen screen-space gradient was
  rejected. `scene.background` is set to `null` in the air mood (the dome
  covers the whole screen; the renderer clear colour is set to the night
  horizon value as a fallback). The gradient canvas is **redrawn only when
  `skyTop`/`skyHorizon` move** (i.e. during the dusk/dawn bands, ~15 s per
  cycle); stable phases reuse the texture with zero uploads.
- **Stars**: one `THREE.Points` of ~400 fixed random directions on the
  **upper hemisphere** of a radius-~360 sphere, generated once with a
  seeded PRNG (same style as the atlas painters), `fog: false`,
  `sizeAttenuation: false`, tiny white points with a few tinted pale-blue;
  material opacity = `starAlpha`, the whole object hidden below ~0.01.
  Camera-follows, like the dome.
- **Sun & moon**: two `THREE.Sprite`s (soft radial-gradient canvas discs —
  the sun warm yellow with a broad glow, the moon pale with a faint halo),
  `fog: false`, positioned at `camera + dir · 380`, hidden when their
  elevation is below the horizon.
- **`worldDim`**: per frame, `matOpaque.color.setScalar(dim)`,
  `matTrans.color.setScalar(dim)` and the cloud material's colour (the split:
  `sky.apply` tints the two chunk materials; `clouds` tints its own;
  `frame()` in `main.ts` is the call site). One
  uniform update on the shared materials dims the entire world with **zero
  remeshing**. (Stance: this is the accepted stand-in until the dynamic
  lighting project bakes real skylight into the per-vertex colour buffer.
  Torch flame tiles dim with everything — they stay visually the brightest
  things around by tile colour; an actual glow is that project's scope.)
- **Underwater mood keeps priority, but is time-tinted**: the existing
  `syncWaterFx()` still owns the mood state and the FOV squeeze, while
  `sky.apply` installs which fog/background is active and paints
  *time-driven* values into them — the
  underwater columns of the keyframe table. In the water mood the dome,
  stars, sun and moon are hidden (dense fog would swallow them anyway).
  The cloud layer is hidden in that mood too (same 100%-fogged logic — and
  its un-fogged material would otherwise flicker in/out of the water
  column as the 24×24 window re-anchors while swimming).

### Tests (`src/__tests__/sky.test.ts`)

- Keyframe endpoints are exact: `sampleSky(0.0)` and `sampleSky(0.5)` return
  the table values verbatim.
- Mirror symmetry: for a sweep of phases, `sampleSky(p)` equals
  `sampleSky(1 − p)` on every field.
- `worldDim` is monotonic over [0.22, 0.50] (day → night: 1.0 → 0.33) and
  back over [0.50, 0.78]; always within [0.33, 1.0].
- `starAlpha` is 0 at noon, 1 at midnight, and monotonic in the same bands.
- Sun direction: zenith at `p=0`, on-horizon +X at `p=0.25`, nadir at 0.5,
  on-horizon −X at 0.75; `moonDir = −sunDir` at every sampled phase.

## Clouds (`src/clouds.ts`)

Also a pure-consumer module: it reads `WorldTime` (for wind) and the
`SkySample` (for tint); it never advances anything.

**Design revision (v2/v3, 2026-08-19):** the v1 design (an instanced
24×24-cell window, mask rebuilt only when the camera crossed a 4-block
grid line) failed its manual pass: standing still showed no drift at all
(the pattern was effectively world-static — sampling only moved at
re-anchoring rate), and the finite 96-block window's hard edge read as a
visible square band in the sky. v2 replaced the window with the standard
approach for this kind of voxel sandbox: a **repeating world-space pattern
rendered on one large fixed-altitude sheet whose texture scrolls with
time** — no per-cloud objects, no camera-relative window, no cloud state
stored anywhere. A second manual pass then showed v2's 512-block re-snap
lurching the sheet when the player crossed a grid line (and leaving the
player at the sheet's corner on spawn) — hence the continuous
player-centring below: the sheet re-centers every frame, and the
world-lock is preserved by the camera terms cancelling in the uv offset.

- **Shape**: a single quad, **2048×2048 blocks**, flat, at altitude
  **y = 96** (`ALTITUDE`, above `WORLD_Y_MAX = 64`), **centered on the
  player every frame** — the sheet re-centers continuously (no snapping, no
  re-center event that could lurch). Because its edge is always ≥ 1024
  blocks away in every direction, the 512-block far plane clips the sheet
  to a disc whose rim sits only ≈5–10° above the horizon (≈5–6° at typical
  spawn height) — it reads as an effectively infinite layer of clouds from
  the ground. One draw call, one 128×128 texture.
- **Pattern**: a **128×128-texel repeating tile**, each texel = one 4×4
  world-block cell, baked **once** at startup (deterministic, seeded PRNG
  like the atlas painters): a texel's alpha is **core** if
  `c = simplex2d((wx + 2) / 12, (wz + 2) / 12) > 0.2`, **rim** (~60% alpha)
  if `c > 0.05` (wx, wz = the cell's min corner; the +2 samples the cell
  centre), else none — the same 12-block-wavelength field as v1 (features
  ~4–24 blocks wide). `NearestFilter`, no mipmaps → the classic blocky 0/1
  cell edges (the low-res grid look): cells are on/off at the texel level,
  with the two-level alpha as the only intra-tile softness. The pattern
  therefore repeats every **512 blocks** — like a tiling cloud texture, a
  deliberate cosmetic trade-off (repeat distance ≈ 2 min of walking).
- **Wind / drift**: the pattern scrolls purely via the texture offset:
  every frame `map.offset = (camera + windAt(time)) / 2048` (in uv units,
  `QUAD = 2048`), where `windAt(t) = [0.5·t, 0.45·t + 37.7]` **blocks**
  (z at 0.9×, fixed offset decorrelating the axes). ~1 block per 2 s:
  clearly drifting while standing still, still slow in character. Because
  the sheet is centered on the camera AND the offset tracks `camera +
  wind`, the uv of a world point `w` is
  `(w − camera) / 512 + (camera + wind) / 512 + const
  = (w + wind(t)) / 512 + const` — the camera terms **cancel
  algebraically**, so the pattern is world-locked even though the sheet
  follows the player: the drift is a continuous translate and re-centering
  can never cause a seam. The quad's v axis is flipped so both uv axes
  increase with world +x/+z (sign consistency on both axes). No per-frame
  noise, matrices, or uploads: two position floats + two offset floats.
- **Material**: white, `transparent: true`, `opacity: 0.85`, `fog: false`
  (50–150 blocks overhead; night's exponential fog would fade the layer by
  up to ~50%), `depthWrite: false`, `side: DoubleSide` (visible from
  below), `renderOrder` after the other transparents (any ray that hits
  both cloud and water/celestial objects hits the cloud first: terrain tops
  out at 64 < 96 — so drawing clouds last among transparents is always
  correct, with no per-frame sort-key management). Tint:
  `lerp(#ffffff, #707a9c, clamped (1 − worldDim) / (1 − 0.33))` — crisp
  white by day, faint blue-grey at night per the chosen mood.
- The layer is **hidden in the underwater mood** (`setVisible(false)` from
  `main.ts`): dense water fog would 100% fog a y=96 layer, and an un-fogged
  one would otherwise flicker in/out of the water column.

### Pure part (node-testable)

- Constants: `CELL = 4`, `TILE = 128` (texels per tile edge → one tile =
  512 world blocks), `WAVE = 12`, `CORE = 0.2`, `RIM = 0.05`,
  `ALTITUDE = 96`, `QUAD = 2048`; the seeded 2D-simplex field (xorshift
  prng, same shape as `src/main.ts`'s).
- `cloudCoverage(wx, wz, windX = 0, windZ = 0) =
  noise2D((wx + 2 + windX) / WAVE, (wz + 2 + windZ) / WAVE)` — one 4×4
  cell's noise value (wx, wz = min corner). **World-lock identity**:
  `cloudCoverage(w + d, u) === cloudCoverage(w, u + d)` for any vector
  shift — shift the world or shift the sample; same field.
- `cloudTileLevel(cx, cz) ∈ {0, 1, 2}` — the baked tile's alpha level for
  texel (cx, cz) (0 none, 1 rim, 2 core); deterministic, and consistent
  with `cloudCoverage` at zero wind.
- `windAt(t): [number, number]` — linear drift, monotonic on both axes.
- `cloudTexOffset(camX, camZ, timeSec): [number, number] =
  [(camX + wx) / QUAD, (camZ + wz) / QUAD]` — the sheet-following uv
  offsets; the cam terms cancel in the sampling invariant above.

### Tests (`src/__tests__/clouds.test.ts`)

- `cloudCoverage` is deterministic; the world-lock identity holds for
  several (w, d) pairs.
- `cloudTileLevel` is a **fixed fixture** (whole-tile hash pinned),
  consistent with the coverage thresholds at zero wind (sampled texels),
  and yields all three levels (0, 1, 2) under the fixed seed.
- On/off thresholds behave: core above 0.2, rim in (0.05, 0.2], none at or
  below 0.05 (as expressed by `cloudTileLevel` vs `cloudCoverage`).
- The tex offset keeps the pattern world-locked: the sampled cell of a
  fixed world point is independent of the camera position (the
  cam-cancellation invariant, mirrored in JS).
- The tex offset advances exactly with the wind (cam + wind decomposition,
  both axes); `windAt` is monotonic on both axes; and drift moves the field
  a fixed world point samples (coverage at `windAt(0)` ≠
  `windAt(2000)`).

## HUD clock & integration

- **HUD**: a small semi-transparent monospace readout in the top-LEFT
  corner (top-right belongs to the palette strip) — `Day 2 · 19:41` — a
  static `#clock` div in `index.html`, styled in `ui.css` (same family as
  the hotbar/help text). Built from
  `worldTime.day` + `hour` (minutes = `floor((hour mod 1) · 60)`, zero-padded).
  The text node is rewritten only when the rendered string changes.
- **`main.ts` wiring** (owner of all instances; sky/cloud modules never
  import from `main.ts`):
  - boot: `const worldTime = new WorldTime()`,
    `const sky = createSky(scene, matOpaque, matTrans, fogAir, fogWater,
    bgWater)`, `const clouds = createClouds(scene)` (the HUD is the static
    `#clock` div in `index.html`);
  - inside the fixed substep loop: `worldTime.advance(STEP)` (tick
    discipline, above);
  - per frame, after `syncWaterFx()`:
    `clouds.setVisible(waterFx === 'air')` (the underwater mood hides the
    layer), then
    `sky.apply(sampleSky(worldTime.dayPhase), waterFx, camera)` then
    `clouds.update(camera.position.x, camera.position.z, worldTime.time,
    skySample.worldDim)`.
- No changes to world storage, mesher, water sim, or player code. The
  streaming/remesh frame budget (PROJECT.md §9) is untouched: everything
  added is O(1) per frame apart from the rare mask rebuilds and the
  transition-band gradient redraws.

## Manual verification

Run `npm run dev` and:

1. Watch a full 4-minute cycle from noon: dusk band (warm horizon, dim
   falling), night (indigo sky, stars, glowing moon, world at ~33%), dawn,
   back to day — no pop on any transition, sun/moon track the horizon
   correctly, clouds drift slowly.
2. Submerge at night: the water mood is the time-tinted darker blue; surface
   and the sky state continues uninterrupted (no time jump).
3. The HUD string is correct at noon (12:00), sunset (18:00), midnight
   (0:00, day increments there), dawn (06:00).
4. If any transition looks hitchy, recreate the PROJECT.md §9 frame-time
   probe (400-frame walk, per-phase ms) rather than guess.

## Follow-ups (recorded, not this project)

- TODO.md gains a "World time & simulation clocks" section: converge the
  water sim's independent slow clock and `WorldTime` onto one shared tick
  system (water's pulse becomes one stride on it) — determinism now, and the
  shared tick basis future multiplayer needs for a server-authoritative
  simulation. *(Added to TODO.md with this project.)*
- The dynamic-lighting TODO item will consume `WorldTime.dayPhase` for
  sky-light level and the sampler's `sunDir` for the sun's position, and will
  replace `worldDim` with real per-block skylight in the vertex colour
  buffer.