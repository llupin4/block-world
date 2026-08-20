# block-world

A browser based voxel building engine that runs entirely in the browser. Fly around a procedurally generated world, break and place blocks, and watch water flow through caves.

Built with [Three.js](https://threejs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), and [simplex-noise](https://github.com/jwagner/simplex-noise.js). No game engine, no physics library — collision, terrain generation, chunk meshing, raycasting, and water simulation are all hand-rolled.

Preview here [https://llupin4.github.io/block-world/](https://llupin4.github.io/block-world/)

## Features

- **Procedural terrain** — multi-octave simplex noise heightmap with 3D-noise cave carving, seeded and deterministic per column.
- **Chunk streaming** — 16×16×16 cubic chunks load, generate, remesh, and unload around the player on demand, with per-frame budgets so walking never freezes the tab.
- **Block editing** — DDA (Amanatides & Woo) voxel raycast targets the block under your crosshair; left-click breaks, right-click places from the hotbar.
- **Water simulation** — a cellular automaton over level/source/stream flags: placed water is an immortal spring that pours through gaps and floods reachable caves; cut it off from its source and it starves away cell by cell. Runs on a slow ~2 Hz clock independent of physics.
- **Creative controls** — fly mode, noclip, hotbar + click-to-assign palette, wireframe debug view, and a help overlay.
- **Underwater mood** — submerging your head swaps background, fog, and FOV to sell the dive; its palette tracks time of day, so night underwater is darker.
- **Day/night cycle** — a world-time clock (noon start, 4-minute cycle) drives a gradient sky, a sun and moon crossing the sky, stars after dusk, a world that darkens at night, and a slowly drifting cloud layer; a small HUD clock shows the time.
- **Dynamic lighting** — torches emit 14-level light that propagates block-by-block through the grid, and sky light reaches every block open to the air, so caves and corners go dark; doors, glass, leaves, and water attenuate it. Sky light fades per block with the day/night cycle (torches stay constant), keeping deep night dark but readable.

## Requirements

- Node.js 18+ and npm
- A WebGL-capable browser (Chrome, Firefox, Edge, Safari)

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`) and click the canvas to lock the pointer.

### Controls

| Input | Action |
|---|---|
| Mouse move | Look around (while pointer-locked) |
| Left click | Break the targeted block |
| Right click | Place the selected block |
| `WASD` / arrows | Move |
| Space | Jump / swim up / fly up |
| Shift | Descend / fly down |
| `F` | Toggle fly mode |
| `N` | Toggle noclip |
| `C` | Toggle wireframe (chunk-boundary debugging) |
| `E` | Open/close the block palette |
| `H` | Open/close the help overlay |
| `1`–`9` (or numpad) | Select hotbar slot |
| Scroll wheel | Cycle hotbar slots |
| Esc | Release pointer lock |

Click any palette entry to assign it into the currently selected hotbar slot.

### Build

```bash
npm run build     # type-checks (tsc --noEmit) then bundles to dist/
npm run preview   # serve the production bundle locally
```

## Tests

Unit tests are written with [Vitest](https://vitest.dev/) and live in `src/__tests__/`. They cover the block registry, chunk mesher, player controller, voxel raycast, chunk streaming, terrain generator, world time, sky sampler, cloud coverage, UI, and both the water simulation and its chunk-load path (the latter includes a replay test that boots the world and plays for ten seconds to pin the settle performance budget).

Run them with:

```bash
npm test
```

## Project layout

```
src/
  main.ts          boot, scene setup, input, render loop
  world.ts         chunk storage + block get/set
  terrain.ts       seeded terrain generation
  blocks.ts        block registry (solid/transparent/face tiles)
  chunk-mesher.ts  face-culled geometry builder with baked AO
  streaming.ts     load/remesh/unload ring around the player
  player.ts        AABB collision + fly/noclip controller
  raycast.ts       DDA voxel raycast (targeting)
  water.ts         water flow cellular automaton
  time.ts          world-time clock (day/night phase, advanced in the fixed substep)
  sky.ts           sky sampler (phase → palette/sun/moon) + dome/stars/sprites renderer
  clouds.ts        cloud layer (world-locked noise coverage + wind drift)
  ui.ts            hotbar + palette state
index.html         app shell + DOM overlays
PROJECT.md         the original POC design doc (stack, algorithms, known traps)
docs/superpowers/  specs and plans behind each feature
```

## Design notes

This started as a proof of concept, documented in [`PROJECT.md`](PROJECT.md). A few choices worth knowing about:

- **One mesh per chunk**, not per block — interior faces are never emitted, which is what keeps a solid stone chunk at ~1,500 visible quads instead of 4,096.
- **`>> 4` and `& 15`** for chunk math, never `Math.floor(x/16)` or `x % 16` — the shift/and forms handle negative coordinates correctly.
- **Explicit `geometry.dispose()`** on every remesh/unload — Three.js does not garbage-collect GPU buffers, so a skipped dispose is a permanent leak.
- **Fixed 1/60 s timestep** for physics regardless of render rate, to avoid tunneling when a batch of chunks loads.

More detail — including the water-flow rules and a list of known traps — lives in `PROJECT.md`.