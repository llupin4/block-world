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
3. a **cloud layer** (instanced grid, wind drift);
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
  - `dayPhase` — position in the day/night cycle, `[0, 1)`. Normally
    advanced 1:1 with `time` (via `DAY_LENGTH`), but it is its own stored
    value, not a derived one, so the daylight cycle can later be frozen,
    rescaled, or set independently of the simulation clock (server-style
    "doDaylightCycle / time set" semantics, without any extra machinery).
  - `day` — day number; session starts at **noon of day 1**
    (`time = 0, dayPhase = 0, day = 1`).
- `advance(dt)`: `time += dt`; `dayPhase = (dayPhase + dt / DAY_LENGTH) % 1`;
  `day` increments exactly when `dayPhase` crosses **midnight** (0.5), never
  at the noon wrap.
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
- `advance(120)` reaches exactly phase 0.5 with `day` still 1; one more
  substep increments to day 2 (midnight boundary, not the noon wrap).
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
`sky.apply(sample, mood)` where `mood` is the existing air/water value:

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
- **Stars**: one `THREE.Points` of ~400 fixed random directions on a
  sphere of radius ~360, generated once with a seeded PRNG (same style as the
  atlas painters), `fog: false`, `sizeAttenuation: false`, tiny white
  points with a few tinted pale-blue; material opacity = `starAlpha`, the
  whole object hidden below ~0.01. Camera-follows, like the dome.
- **Sun & moon**: two `THREE.Sprite`s (soft radial-gradient canvas discs —
  the sun warm yellow with a broad glow, the moon pale with a faint halo),
  `fog: false`, positioned at `camera + dir · 380`, hidden when their
  elevation is below the horizon.
- **`worldDim`**: per frame, `matOpaque.color.setScalar(dim)`,
  `matTrans.color.setScalar(dim)` and the cloud material's colour. One
  uniform update on the shared materials dims the entire world with **zero
  remeshing**. (Stance: this is the accepted stand-in until the dynamic
  lighting project bakes real skylight into the per-vertex colour buffer.
  Torch flame tiles dim with everything — they stay visually the brightest
  things around by tile colour; an actual glow is that project's scope.)
- **Underwater mood keeps priority, but is time-tinted**: the existing
  `syncWaterFx()` still owns the swap (which fog object, FOV squeeze), and
  `sky.apply` paints *time-driven* values into whatever is active — the
  underwater columns of the keyframe table. In the water mood the dome,
  stars, sun and moon are hidden (dense fog would swallow them anyway).

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

- **Shape**: a layer of instanced flat quads at fixed altitude **y = 96**
  (above `WORLD_Y_MAX = 64`, so clouds never clip terrain; ~400 blocks of
  sky inside the far plane). Each quad covers **4×4 world blocks** — the
  classic voxel-sandbox cloud proportion — in a **24×24-cell window**
  (≈ 96×96 blocks) so the layer spans well past what is visible.
- **Tracking**: the layer origin is anchored to the world grid at
  `floor(cam.x / 4) · 4` (same for z) and re-snapped when the camera crosses
  a 4-block boundary. Quads live at fixed world positions inside the window,
  so there is no per-frame matrix work; instances are (re)built only on
  anchor changes.
- **Coverage**: per cell, `c = simplex2d((wx + windX) / 12,
  (wz + windZ) / 12)` using the existing `simplex-noise` dependency, on a
  12-block wavelength (features ~4–24 blocks wide, sparser than the terrain
  noise scales). A cell draws its quad when `c > 0.05` — on/off at the cell
  level; the *intra-cell* softness comes from the quad's texture, a
  canvas-painted blurred noise alpha tile (same deterministic painter style
  as the block atlas). Per-cell opacity was rejected: per-instance alpha
  isn't natively supported, and cell on/off with a noisy tile is the
  established look and the cheaper one. Noisecell count per rebuild is
  576 — a sub-millisecond budget at rebuild rate (a few times per second
  while walking).
- **Wind**: `windX = windSpeed · time` (and `windZ` at 0.9× plus a fixed
  offset for the second axis), `windSpeed ≈ 0.1` blocks/s (~1 block per 10 s
  — a slow visible drift). Drift moves the *sample offset*, not the
  geometry: the quads stay grid-locked and the pattern glides through them.
  The mask is re-evaluated whenever the window re-anchors (every 4-block
  camera movement, ~1 s at walk speed); wind is sampled at rebuild time, so
  at this speed the pattern advances ~0.1 block per rebuild — smooth, and
  rebuilds stay rare and cheap.
- **Material**: white, `transparent: true`, `fog: false` (a 40-block
  distance overhead would otherwise fog the layer out at altitude),
  `depthWrite: false`, `side: DoubleSide` (visible from below). Tint:
  `lerp(#ffffff, #707a9c, (1 − worldDim) / (1 − 0.33))` — crisp white by
  day, faint blue-grey at night per the chosen mood.
- One draw call (~a third of the 576 cells typically active).

### Tests (`src/__tests__/clouds.test.ts`)

- Coverage is deterministic: same (cell, wind offset) → same mask.
- On/off threshold behaves (cells just above/below 0.05 flip correctly).
- Re-anchoring: advancing the camera across a 4-block boundary re-anchors
  the window and yields an identical *world-space* mask (no pop or
  duplication at the seam).
- Wind: advancing `time` monotonically shifts coverage — a fixed cell's
  sampled value changes directionally as the offset grows.

## HUD clock & integration

- **HUD**: a small semi-transparent monospace readout in the top-right
  corner — `Day 2 · 19:41` — a div built in `main.ts` with existing `ui.css`
  conventions (same family as the hotbar/help text). Built from
  `worldTime.day` + `hour` (minutes = `floor((hour mod 1) · 60)`, zero-padded).
  The text node is rewritten only when the rendered string changes.
- **`main.ts` wiring** (owner of all instances; sky/cloud modules never
  import from `main.ts`):
  - boot: `const time = new WorldTime()`, `const sky = createSky(scene,
    matOpaque, matTrans)`, `const clouds = createClouds(scene)`, HUD div;
  - inside the fixed substep loop: `time.advance(STEP)` (tick discipline,
    above);
  - per frame, after `syncWaterFx()`: `sky.apply(sampleSky(time.dayPhase),
    mood)` then `clouds.update(camera, time, sample)`.
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