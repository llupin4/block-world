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
- **World persistence** — edited chunks snapshot to IndexedDB on unload and restore verbatim (water state included) across reloads; light recomputes on load (ADR 0014).
- **Multiplayer lobby** — host a browser session with `?host`, join with `?join=<code>` over Trystero/WebRTC; the host is authoritative, clients predict their own body and reconcile with host snapshots, and remote players render as named bipeds.

## Requirements

- Node.js 18+ and npm
- A WebGL-capable browser (Chrome, Firefox, Edge, Safari)
- Multiplayer (`?host` / `?join`) requires a **secure context**: `http://localhost` or `https`. A raw WSL/LAN IP over `http` does not expose `crypto.subtle`, which Trystero needs for room keys.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`) and click the canvas to lock the pointer.

To expose the dev server outside the machine (WSL, VM, LAN):

```bash
npm run dev:host     # vite --host
hostname -I          # in WSL/Linux, print the local IP
```

Single-player rendering works from another machine at `http://<your-ip>:5173`. **Multiplayer must use `localhost`/HTTPS**, because the lobby needs WebCrypto (`crypto.subtle`), which browsers only expose in a secure context.

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
| `P` | Possess the targeted entity / return home / toggle ghost |
| `R` | Open/close recordings (stop + open list while recording) |
| `E` | Open/close the block palette |
| `H` | Open/close the help overlay |
| `1`–`9` (or numpad) | Select hotbar slot |
| Scroll wheel | Cycle hotbar slots |
| Esc | Release pointer lock |

Click any palette entry to assign it into the currently selected hotbar slot.

### Multiplayer

Debug / in-page loopback:

```text
http://localhost:5173/?mp=client&bots=3
http://localhost:5173/?mp=host&bots=3
http://localhost:5173/?mp=client&delay=30&bots=3
```

Real lobby (Trystero/WebRTC):

```text
# Host (generates a code, or pin one with ?host=<code>)
http://localhost:5173/?host

# Join
http://localhost:5173/?join=<code>
```

Use `localhost` or HTTPS for the real lobby. From Windows with the repo in WSL2, the easiest setup is WSL mirrored networking:

```ini
# %USERPROFILE%\.wslconfig
[wsl2]
networkingMode=mirrored
```

Then run `wsl --shutdown`, start the dev server from WSL, and open `http://localhost:5173/?host` / `?join=<code>` from Windows.

If you cannot use mirrored networking, add a Windows port proxy to the WSL IP (PowerShell, admin):

```powershell
netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=5173 connectaddress=<WSL_IP> connectport=5173
```

Use `http://localhost:5173` for multiplayer. Remove it with:

```powershell
netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=5173
```

### Build

```bash
npm run dev             # local dev server
npm run dev:host        # dev server bound to 0.0.0.0 (WSL/VM/LAN)
npm run build           # type-checks (tsc --noEmit) then bundles to dist/
npm run preview         # serve the production bundle locally
```

## Tests

Unit tests are written with [Vitest](https://vitest.dev/) and live in `src/__tests__/`. They cover the block registry, chunk mesher, player controller, voxel raycast, chunk streaming, terrain generator, world time, sky sampler, cloud coverage, UI, water simulation, persistence, replay, and the multiplayer session/transport stack.

Run the full unit suite:

```bash
npm test
```

Run one unit test file:

```bash
npx vitest run src/__tests__/water-host-settle.test.ts
```

Run the Playwright end-to-end suite:

```bash
npm run e2e
npx playwright test tests/e2e/mp-2tab.spec.ts
```

## Project layout

```
src/
  main.ts            boot, scene setup, input, render loop, lobby/debug entry points
  world.ts           chunk storage + block get/set
  terrain.ts         seeded terrain generation
  blocks.ts          block registry (solid/transparent/face tiles)
  chunk-mesher.ts    face-culled geometry builder with baked AO
  mesh-slices.ts     heavy remesh slice scheduling
  streaming.ts       load/remesh/unload ring around the player
  player.ts          legacy AABB collision + fly/noclip controller
  entity.ts          entity/sim/possession model (player, deer, ghost, host/client hooks)
  raycast.ts         DDA voxel raycast (targeting)
  water.ts           water flow cellular automaton
  time.ts            world-time clock (day/night phase, advanced in the fixed substep)
  sky.ts             sky sampler (phase → palette/sun/moon) + dome/stars/sprites renderer
  clouds.ts          cloud layer (world-locked noise coverage + wind drift)
  light.ts / light-transport.ts / light-worker.ts  dynamic lighting pipeline
  persistence.ts / idb-store.ts  IndexedDB chunk persistence
  replay.ts          recording + replay controllers
  ui.ts              hotbar + palette state
  net/               multiplayer transport, HostSession, ClientSession, Trystero lobby
index.html           app shell + DOM overlays
PROJECT.md           the original POC design doc (stack, algorithms, known traps)
docs/adr/            architecture decision records, one per system (0001-0020)
```

## Design notes

This started as a proof of concept, documented in [`PROJECT.md`](PROJECT.md). A few choices worth knowing about:

- **One mesh per chunk**, not per block — interior faces are never emitted, which is what keeps a solid stone chunk at ~1,500 visible quads instead of 4,096.
- **`>> 4` and `& 15`** for chunk math, never `Math.floor(x/16)` or `x % 16` — the shift/and forms handle negative coordinates correctly.
- **Explicit `geometry.dispose()`** on every remesh/unload — Three.js does not garbage-collect GPU buffers, so a skipped dispose is a permanent leak.
- **Fixed 1/60 s timestep** for physics regardless of render rate, to avoid tunneling when a batch of chunks loads.

More detail — including the water-flow rules and a list of known traps — lives in `PROJECT.md`.