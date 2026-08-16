# Block World — Browser Voxel Sandbox POC — Implementation Plan

> **For the implementer:** This is an executable plan. Work task by task, top to bottom. For each task: (1) create/modify exactly the listed files, (2) run the exact test command and confirm the listed failure (red) before implementing where a test is listed first, (3) implement, (4) confirm green, (5) manual `npm run dev` check when listed, (6) commit with the EXACT message shown. Never commit until the task's verification passes. All `git` commands run from the `block-world/` directory (the repo root is `../projects`, so commit with `git add -A .` from `block-world/` — the nested `.gitignore` covers `node_modules/` and `dist/`).

## Goal

Build the POC from `PROJECT.md`: a browser voxel sandbox (three.js + TypeScript + Vite). 16³ chunked infinite terrain (simplex noise: hills, beaches, trees, caves, water), fly/walk/swim physics, block break/place via raycasting, streaming load/mesh/unload, hotbar + palette UI, underwater effects, procedural block texture atlas. Everything client-side, no build-time assets.

## Architecture (from PROJECT.md, condensed)

- **Chunks**: cubic `16×16×16` blocks (`CHUNK_SIZE=16`, `CHUNK_VOL=4096`). Chunk key `${cx},${cy},${cz}`; vertical band `cy ∈ [0,4]` for the streaming band (world y ∈ [−32, 64) overall — 7 levels `cy ∈ [−2,4)` — but streaming only requests the terrain band, see Deviation D6). Local index: `idx = lx + lz*16 + ly*256`.
- **World**: `Map<key, Chunk>`; `Chunk = { blocks: Uint8Array(4096), dirty: boolean, opaqueMesh: VoxelBuffer|null, transMesh: VoxelBuffer|null }`.
- **Rendering**: two `BufferGeometry` meshes per chunk (opaque pass, transparent pass). Vertex colors bake face shade × ambient occlusion. One 16×16 procedural canvas atlas (11 tiles), `CanvasTexture` (flipY default) shared by both materials.
- **Mesher**: classic greedy-free culling — emit a face when the neighbor block is air or (transparent and different block). Opaque blocks only in the opaque pass; water/leaves/glass in the transparent pass, but only against air or *different* transparent blocks (water-water shares no face).
- **Camera/physics**: `Player` class (position = feet), axis-separated AABB collision with iterative snap, walk/jump/fly/swim, optional noclip teleport mode.
- **Interaction**: DDA voxel raycast (Amanatides & Woo) from screen center; LMB break, RMB place (with no-inside-own-AABB guard).
- **Streaming**: per-frame budgeted `ChunkStreamer.update()` → `{loaded, toMesh, removed}`; missing-load sort key `(dx²+dz²)*100 + |dy|`; unload chunks outside the load radius.
- **Terrain**: `TerrainGen(seed)` — seeded 2D simplex (4 octaves → height = `floor(32 + h*20)`, h normalized ≈ ±1) + 3D simplex (caves, threshold > 0.55) + per-column trees (hash2 < 0.02, rejected near chunk edges to keep canopies inside the chunk).
- **UI**: pointer lock, crosshair, hotbar (9 slots, `1-9`/wheel), palette overlay (`E`), hint line.

## Tech stack

- `three@^0.166.1` (+`@types/three`), `simplex-noise@^4.0.3` (NOTE: this registry tops out at 4.0.3, not 4.3.0 — verified).
- `typescript@^5.5.4`, `vite@^5.4.0`, `vitest@^2.0.5` (node env — no DOM tests; three.js is import-safe in node because no test ever calls `toGeometry`).
- `tsconfig`: ES2022, module ESNext, moduleResolution `bundler`, strict, noEmit, skipLibCheck.
- Package scripts: `dev` (vite), `build` (`tsc --noEmit && vite build`), `preview` (vite preview), `test` (`vitest run`).
- Hand-scaffolded (no create-vite) — Vite handles TS natively.

## Spec deviations (intentional, each justified)

- **D1** — plain TS `enum Block` + `Record<Block, BlockDef>` instead of spec's `const`-asserted object (same values/ordering, cleaner typing).
- **D2** — FACES table: spec's `+X`/`−X` corner rows are **clockwise** under three.js `FrontSide` and would cull every side face (the spec's own §14 "culling/face order trap"). Plan uses the corrected **CCW** table (only `+X`/`−X` rows change; `±Y`/`±Z` rows are already correct in the spec).
- **D3** — `vertexAO` tangent fix: spec picks the *normal* axis as a tangent for X/Z faces, so those faces would sample the same neighbor twice. Plan picks the two non-normal axes.
- **D4** — AO + face shade are baked at mesh build (T5), so "lighting" needs no runtime work; the spec's M6 "lighting/AO" milestone becomes a **visual verification** step in T13.
- **D5** — single shared transparent material (`opacity 0.75`, `depthWrite:false`, `DoubleSide`) for water/leaves/glass per spec §3; leaves look slightly glassy, accepted in a POC.
- **D6** — streamer only loads the terrain band `cy ∈ [0,4]` (5 levels); above/below is never requested. (Spec implies all 7 vertical levels; terrain + play band is 0..4. Edits above y=64 are out of POC range.)
- **D7** — hand scaffold instead of `npm create vite`.
- **D8** — M1 "render one chunk" is done as a richer **3×3-chunk synthetic demo** (hardcoded `demoFill`, incl. pool/beach/tree/planks/glass) — still fully hardcoded, zero noise, per spec's M1 definition.
- **D9** — `Uint8Array` for block storage (10 block values fit in a byte; spec said `Uint16Array` — behavior identical here).
- **D10** — no world persistence/saves (spec POC-scoped shortcut).
- **D11** — milestone compression: T6 demo satisfies M1; T7/T8 satisfy M2 (player) + M3 (interaction); T9 = M4 terrain; T10/T11 = M5 streaming+UI; T12 = M6 water FX; T13 = M6 visual polish + final verification + debug tools (M12). M2-POC texture generation (procedural) is folded into the T6 atlas.

## Milestone → task map

| Task | Deliverable | Milestone |
|---|---|---|
| T1 | Scaffold (package.json, tsconfig, vite, index.html, ui.css stub, empty main) | M0 |
| T2 | `src/blocks.ts` + tests | M0 |
| T3 | `src/world.ts` (chunk store, get/set, dirty) + tests | M1 (pre) |
| T4 | `src/terrain.ts` (seeded noise, heightmap, caves, trees) + tests | M4 (pre) |
| T5 | `src/chunk-mesher.ts` (two-pass mesh + AO/face-shade) + tests | M1 (core) |
| T6 | Demo scene: atlas, materials, 3×3 synthetic world, camera orbit, full `ui.css` | M1 |
| T7 | `src/player.ts` (physics, swim, fly, noclip) + tests | M2 |
| T8 | `src/raycast.ts` + break/place + highlight + main integration | M3 |
| T9 | Real terrain in `main.ts` (replace demo), spawn on surface | M4 |
| T10 | `src/streaming.ts` + main integration (load/mesh/unload budgets) + tests | M5 |
| T11 | `src/ui.ts` hotbar + palette, main integration | M5 |
| T12 | Water FX (fog/background/FOV swap) | M6 |
| T13 | Final verification: AO/lighting visual, debug tools, full test suite, build+preview | M6/M12 |

## File map

```
block-world/
├── package.json            # T1
├── tsconfig.json           # T1
├── vite.config.ts          # T1
├── .gitignore              # T1 (node_modules/, dist/)
├── index.html              # T1 (app shell; hotbar/palette divs added T11)
└── src/
    ├── main.ts             # T6 (full demo), extended T7–T13
    ├── ui.css              # T6 (final), stub in T1
    ├── blocks.ts           # T2
    ├── world.ts            # T3
    ├── terrain.ts          # T4
    ├── chunk-mesher.ts     # T5
    ├── player.ts           # T7
    ├── raycast.ts          # T8
    ├── streaming.ts        # T10
    ├── ui.ts               # T11
    └── (atlas/tile drawing lives inline in main.ts, T6)
```

Test files mirror the modules: `src/__tests__/` — `blocks.test.ts` (T2), `world.test.ts` (T3), `terrain.test.ts` (T4), `chunk-mesher.test.ts` (T5), `player.test.ts` (T7), `raycast.test.ts` (T8), `streaming.test.ts` (T10), `ui.test.ts` (T11). T6/T12/T13 have no node-testable surface beyond what T2–T11 cover; they get manual `npm run dev` verification + the final gate in T13.

## Conventions

- Fixed timestep `STEP = 1/60` with an accumulator in the main loop (frame dt clamped to 0.1).
- `player.pos` = feet position; half-extent `HALF=0.3`, `HEIGHT=1.8`, `EYE=1.62` (eye = `pos.y + 1.62`).
- Yaw 0 faces −Z; `forward = (−sin yaw, 0, −cos yaw)`, `right = (cos yaw, 0, −sin yaw)`.
- All module code is ESM; no default exports in logic modules (named exports only); `main.ts` is the only entry with side effects.
- No comments unless explaining a non-obvious deviation (D2/D3 get one-line comments citing the plan).
- Every task ends with an explicit `git commit` (exact message given). The final plan file itself is committed separately by the reviewer, not by an implementer task.

---

# Task 1 — Project scaffold (M0)

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `index.html`
- Create: `src/ui.css` (stub), `src/main.ts` (stub)

## Step 1.1 — `package.json`

```json
{
  "name": "block-world",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "simplex-noise": "4.0.3",
    "three": "^0.166.1"
  },
  "devDependencies": {
    "@types/three": "^0.166.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

## Step 1.2 — `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "useDefineForClassFields": true
  },
  "include": ["src"]
}
```

## Step 1.3 — `vite.config.ts`

```ts
import { defineConfig } from 'vite';

export default defineConfig({});
```

(Empty config on purpose: Vite picks up `index.html` + TS out of the box. `vitest` also reads this file and will use node env via default.)

## Step 1.4 — `.gitignore`

```
node_modules/
dist/
```

## Step 1.5 — `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>block-world — voxel sandbox poc</title>
    <link rel="stylesheet" href="/src/ui.css" />
  </head>
  <body>
    <div id="app"></div>
    <div id="crosshair"></div>
    <div id="hint"></div>
    <div id="hotbar" class="hidden"></div>
    <div id="palette" class="hidden"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

(`#hotbar`/`#palette` exist now, stay `.hidden` until T11 — avoids a second index.html edit.)

## Step 1.6 — `src/ui.css` (stub, finalized in T6)

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #0b0e14; }
.hidden { display: none !important; }
```

## Step 1.7 — `src/main.ts` (stub)

```ts
console.log('block-world boot');
```

## Step 1.8 — Verify

Run (from `block-world/`):

```sh
npm install
npm test          # → "No test files found" style message is FINE at this stage (vitest exits 0 or 1 with no tests)
npm run build     # → tsc clean + vite build succeeds (builds the stub index.html)
```

If `vitest run` with zero test files exits non-zero on your platform, that is expected for T1; from T2 onward tests exist. The gate that matters here is `npm run build` succeeding and `npm run dev` showing the page (title visible, no console errors).

## Step 1.9 — Commit

```sh
git add -A . && git commit -m "T1: scaffold vite+ts+vitest project skeleton"
```

> **Order note:** because the terrain *fill* tests need a `World` to write into, **Task 3 = `world.ts`**, **Task 4 = `terrain.ts`** (consistent with the overview table). Also: in T1's `package.json`, pin `simplex-noise` **exactly** to `"4.0.3"` (no caret) — deterministic noise values matter for the fixed-seed test assertions in Task 4.

# Task 2 — `src/blocks.ts` (M0)

**Files:** Create `src/blocks.ts`, `src/__tests__/blocks.test.ts`.

## Step 2.1 — Write the failing test first: `src/__tests__/blocks.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { Block, BLOCKS, isOpaque, PLACEABLE } from '../blocks';

describe('blocks', () => {
  it('assigns the spec values in order (0..9)', () => {
    expect([Block.Air, Block.Stone, Block.Dirt, Block.Grass, Block.Sand, Block.Water, Block.Wood, Block.Leaves, Block.Glass, Block.Planks])
      .toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('BLOCKS has a definition for every block value', () => {
    for (let b = 0; b <= 9; b++) expect(BLOCKS[b], `def for ${b}`).toBeDefined();
    expect(Object.keys(BLOCKS).length).toBe(10);
  });

  it('classifies solidity/transparency per spec section 3', () => {
    expect(isOpaque(Block.Stone)).toBe(true);
    expect(isOpaque(Block.Dirt)).toBe(true);
    expect(isOpaque(Block.Grass)).toBe(true);
    expect(isOpaque(Block.Sand)).toBe(true);
    expect(isOpaque(Block.Wood)).toBe(true);
    expect(isOpaque(Block.Planks)).toBe(true);
    expect(isOpaque(Block.Leaves)).toBe(false); // transparent (still solid)
    expect(isOpaque(Block.Glass)).toBe(false);
    expect(isOpaque(Block.Water)).toBe(false);
    expect(isOpaque(Block.Air)).toBe(false);
    expect(BLOCKS[Block.Water].solid).toBe(false);
    expect(BLOCKS[Block.Leaves].solid).toBe(true);
    expect(BLOCKS[Block.Glass].solid).toBe(true);
  });

  it('tile map: grass top vs sides vs bottom, wood sides vs top', () => {
    const g = BLOCKS[Block.Grass].faces; // order: +X,-X,+Y,-Y,+Z,-Z
    expect(g[2]).toBe(0);  // +Y top face -> grassTop
    expect(g[3]).toBe(2);  // -Y bottom -> dirt
    expect([g[0], g[1], g[4], g[5]]).toEqual([1, 1, 1, 1]); // sides -> grassSide
    const w = BLOCKS[Block.Wood].faces;
    expect([w[0], w[1], w[4], w[5]]).toEqual([6, 6, 6, 6]); // woodSide
    expect([w[2], w[3]]).toEqual([7, 7]);                   // woodTop
  });

  it('PLACEABLE: 9 blocks, never Air', () => {
    expect(PLACEABLE).toHaveLength(9);
    expect(PLACEABLE).not.toContain(Block.Air);
  });
});
```

Run: `npm test` → fails (module `../blocks` missing). Expected red.

## Step 2.2 — Implement `src/blocks.ts`

```ts
export enum Block {
  Air = 0,
  Stone,
  Dirt,
  Grass,
  Sand,
  Water,
  Wood,
  Leaves,
  Glass,
  Planks,
}

export interface BlockDef {
  solid: boolean;
  transparent: boolean;
  /** tile indices, order [+X, -X, +Y, -Y, +Z, -Z]; see the atlas layout in Task 6 */
  faces: [number, number, number, number, number, number];
}

// D1: Record<number, ...> so plain-number voxel data indexes freely; completeness is test-enforced.
export const BLOCKS: Record<number, BlockDef> = {
  [Block.Air]:    { solid: false, transparent: true,  faces: [0, 0, 0, 0, 0, 0] },
  [Block.Stone]:  { solid: true,  transparent: false, faces: [3, 3, 3, 3, 3, 3] },
  [Block.Dirt]:   { solid: true,  transparent: false, faces: [2, 2, 2, 2, 2, 2] },
  [Block.Grass]:  { solid: true,  transparent: false, faces: [1, 1, 0, 1, 1, 1] },
  [Block.Sand]:   { solid: true,  transparent: false, faces: [4, 4, 4, 4, 4, 4] },
  [Block.Water]:  { solid: false, transparent: true,  faces: [5, 5, 5, 5, 5, 5] },
  [Block.Wood]:   { solid: true,  transparent: false, faces: [6, 6, 7, 7, 6, 6] },
  [Block.Leaves]: { solid: true,  transparent: true,  faces: [8, 8, 8, 8, 8, 8] },
  [Block.Glass]:  { solid: true,  transparent: true,  faces: [9, 9, 9, 9, 9, 9] },
  [Block.Planks]: { solid: true,  transparent: false, faces: [10, 10, 10, 10, 10, 10] },
};

export const TILE_NAMES = ['grassTop', 'grassSide', 'dirt', 'stone', 'sand', 'water', 'woodSide', 'woodTop', 'leaves', 'glass', 'planks'] as const;

export function isOpaque(b: number): boolean {
  return b !== Block.Air && !BLOCKS[b].transparent;
}

export const PLACEABLE: Block[] = [Block.Grass, Block.Stone, Block.Dirt, Block.Sand, Block.Wood, Block.Leaves, Block.Glass, Block.Planks, Block.Water];

export function iconTile(b: Block): number {
  return BLOCKS[b].faces[2]; // top-face tile doubles as the UI icon
}
```

Run: `npm test` → 5/5 green.

## Step 2.3 — Commit

```sh
git add -A . && git commit -m "T2: block registry (10 blocks, tile map, placeable set)"
```

---

# Task 3 — `src/world.ts` (M1 pre)

**Files:** Create `src/world.ts`, `src/__tests__/world.test.ts`.

## Step 3.1 — Write the failing tests first: `src/__tests__/world.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { World, CHUNK_SIZE, CHUNK_VOL, chunkKey, localIndex, chunkOf } from '../world';
import { Block } from '../blocks';

describe('world', () => {
  it('exposes chunk constants (cubic 16^3)', () => {
    expect(CHUNK_SIZE).toBe(16);
    expect(CHUNK_VOL).toBe(4096);
    expect(chunkKey(1, 2, -3)).toBe('1,2,-3');
    expect(localIndex(3, 5, 7)).toBe(3 + 7 * 16 + 5 * 256);
    expect(chunkOf(15)).toBe(0);
    expect(chunkOf(16)).toBe(1);
    expect(chunkOf(-16)).toBe(-1);
    expect(chunkOf(-17)).toBe(-2);
    expect(chunkOf(-1)).toBe(-1);
  });

  it('ensureChunk is idempotent; fresh chunks are air and dirty', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    expect(w.getChunk(0, 0, 0)).toBe(c);
    expect(c.blocks).toBeInstanceOf(Uint8Array);
    expect(c.blocks.length).toBe(4096);
    expect(c.dirty).toBe(true);
    let allAir = true;
    for (let i = 0; i < c.blocks.length; i++) if (c.blocks[i] !== 0) allAir = false;
    expect(allAir).toBe(true);
    expect(w.count()).toBe(1);
    w.ensureChunk(0, 0, 0);
    expect(w.count()).toBe(1);
  });

  it('getBlock reads across chunk seams, including negative coords; missing = Air', () => {
    const w = new World();
    const c00 = w.ensureChunk(0, 0, 0);
    c00.blocks[localIndex(15, 0, 0)] = Block.Stone;          // world (15,0,0)
    const cNeg = w.ensureChunk(-1, 0, 0);
    cNeg.blocks[localIndex(0, 0, 0)] = Block.Dirt;           // world (-16,0,0)
    expect(w.getBlock(15, 0, 0)).toBe(Block.Stone);
    expect(w.getBlock(-16, 0, 0)).toBe(Block.Dirt);
    expect(w.getBlock(16, 0, 0)).toBe(Block.Air);            // chunk (1,0,0) not loaded
    expect(w.getBlock(0, -1, 0)).toBe(Block.Air);            // cy=-1 not loaded
  });

  it('setBlock edits, marks the chunk and existing 6-neighbors dirty', () => {
    const w = new World();
    const a = w.ensureChunk(0, 0, 0);
    const b = w.ensureChunk(1, 0, 0);
    const up = w.ensureChunk(0, 1, 0);
    a.dirty = b.dirty = up.dirty = false;
    expect(w.setBlock(15, 0, 0, Block.Stone)).toBe(true);    // on the a/b x-seam
    expect(a.dirty).toBe(true);
    expect(b.dirty).toBe(true);
    expect(w.getBlock(15, 0, 0)).toBe(Block.Stone);
    expect(w.setBlock(0, 15, 0, Block.Glass)).toBe(true);    // on the a/up y-seam
    expect(up.dirty).toBe(true);
  });

  it('setBlock no-ops on identical value and on missing/out-of-range chunks', () => {
    const w = new World();
    const a = w.ensureChunk(0, 0, 0);
    a.blocks[localIndex(1, 2, 3)] = Block.Stone;
    a.dirty = false;
    expect(w.setBlock(1, 2, 3, Block.Stone)).toBe(false);
    expect(a.dirty).toBe(false);
    expect(w.setBlock(1, 2, 3, Block.Dirt)).toBe(true);
    expect(w.getBlock(1, 2, 3)).toBe(Block.Dirt);
    expect(w.setBlock(999, 0, 0, Block.Stone)).toBe(false);
  });

  it('removeChunk / clear', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0);
    w.ensureChunk(1, 0, 0);
    expect(w.removeChunk(0, 0, 0)).toBe(true);
    expect(w.hasChunk(0, 0, 0)).toBe(false);
    expect(w.removeChunk(0, 0, 0)).toBe(false);
    w.clear();
    expect(w.count()).toBe(0);
  });
});
```

Run: `npm test` → blocks tests still green; world tests fail (module missing). Expected red.

## Step 3.2 — Implement `src/world.ts`

```ts
import { Block } from './blocks';

export const CHUNK_SIZE = 16;
export const CHUNK_VOL = CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE; // 4096
export const WORLD_Y_MIN = -32;
export const WORLD_Y_MAX = 64;

export interface VoxelBuffer {
  positions: Float32Array;
  colors: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

export interface Chunk {
  cx: number;
  cy: number;
  cz: number;
  blocks: Uint8Array; // D9: 10 block values fit in a byte
  dirty: boolean;
  opaqueMesh: VoxelBuffer | null;
  transMesh: VoxelBuffer | null;
}

export function chunkKey(cx: number, cy: number, cz: number): string {
  return `${cx},${cy},${cz}`;
}

export function localIndex(lx: number, ly: number, lz: number): number {
  return lx + lz * CHUNK_SIZE + ly * CHUNK_SIZE * CHUNK_SIZE;
}

export function chunkOf(w: number): number {
  return Math.floor(w / CHUNK_SIZE);
}

export class World {
  private chunks = new Map<string, Chunk>();

  count(): number {
    return this.chunks.size;
  }

  hasChunk(cx: number, cy: number, cz: number): boolean {
    return this.chunks.has(chunkKey(cx, cy, cz));
  }

  getChunk(cx: number, cy: number, cz: number): Chunk | undefined {
    return this.chunks.get(chunkKey(cx, cy, cz));
  }

  ensureChunk(cx: number, cy: number, cz: number): Chunk {
    const key = chunkKey(cx, cy, cz);
    const c = this.chunks.get(key);
    if (c) return c;
    const n: Chunk = {
      cx, cy, cz,
      blocks: new Uint8Array(CHUNK_VOL),
      dirty: true,
      opaqueMesh: null,
      transMesh: null,
    };
    this.chunks.set(key, n);
    return n;
  }

  /** Missing chunks behave as Air. */
  getBlock(wx: number, wy: number, wz: number): number {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return Block.Air;
    const lx = wx - c.cx * CHUNK_SIZE;
    const ly = wy - c.cy * CHUNK_SIZE;
    const lz = wz - c.cz * CHUNK_SIZE;
    return c.blocks[localIndex(lx, ly, lz)];
  }

  /** Returns false when the chunk is missing or the value is unchanged. Marks the chunk and any existing 6 face-neighbors dirty. */
  setBlock(wx: number, wy: number, wz: number, b: number): boolean {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return false;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    if (c.blocks[i] === b) return false;
    c.blocks[i] = b;
    c.dirty = true;
    const n = [
      [c.cx + 1, c.cy, c.cz], [c.cx - 1, c.cy, c.cz],
      [c.cx, c.cy + 1, c.cz], [c.cx, c.cy - 1, c.cz],
      [c.cx, c.cy, c.cz + 1], [c.cx, c.cy, c.cz - 1],
    ];
    for (const [nx, ny, nz] of n) {
      const nc = this.getChunk(nx, ny, nz);
      if (nc) nc.dirty = true;
    }
    return true;
  }

  removeChunk(cx: number, cy: number, cz: number): boolean {
    return this.chunks.delete(chunkKey(cx, cy, cz));
  }

  clear(): void {
    this.chunks.clear();
  }
}
```

Run: `npm test` → 5 (blocks) + 6 (world) green.

## Step 3.3 — Commit

```sh
git add -A . && git commit -m "T3: world chunk store (16^3 chunks, cross-seam get/set, dirty marking)"
```

---

# Task 4 — `src/terrain.ts`: seeded world generation (M4)

**Files:** Create `src/terrain.ts`, `src/__tests__/terrain.test.ts`.
**Pre-step:** none — T1's `package.json` already pins `simplex-noise` exactly to `4.0.3`, so a plain `npm install` reproduces the deterministic noise values that the fixed-seed assertions below depend on.

> All expectations below were **measured against the real `simplex-noise@4.0.3`** (seed 1234, full 5×5 band): height range [19…43], 45395 water cells, stone under all 25 sample columns, 21 trees in the band (1 inside the 3×3 spawn area).

## Step 4.1 — Write the failing tests first: `src/__tests__/terrain.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, localIndex } from '../world';
import { TerrainGen, generateChunkTerrain, generateRegion, SEA_LEVEL, TERRAIN_SEED, hash2 } from '../terrain';

function genRegion(cx0: number, cx1: number, cz0: number, cz1: number, seed = TERRAIN_SEED) {
  const world = new World();
  const gen = new TerrainGen(seed);
  generateRegion(world, gen, cx0, cz0, cx1, cz1); // cy band 0..4
  return { world, gen };
}

describe('terrain', () => {
  it('heightAt: deterministic, in range, both land and sea for this seed', () => {
    const a = new TerrainGen(1234);
    const b = new TerrainGen(1234);
    const c = new TerrainGen(7);
    let min = 1e9, max = -1e9, same = true, differs = false;
    for (let x = -32; x <= 47; x += 2) {
      for (let z = -32; z <= 47; z += 2) {
        const h = a.heightAt(x, z);
        if (h < min) min = h;
        if (h > max) max = h;
        if (a.heightAt(x, z) !== b.heightAt(x, z)) same = false;
        if (a.heightAt(x, z) !== c.heightAt(x, z)) differs = true;
        expect(h).toBeGreaterThanOrEqual(10); // spec range is 12..52 (SEA_LEVEL ± 20)
        expect(h).toBeLessThanOrEqual(55);
      }
    }
    expect(same).toBe(true);
    expect(differs).toBe(true);
    expect(min).toBeLessThan(SEA_LEVEL);
    expect(max).toBeGreaterThan(SEA_LEVEL);
  });

  it('generateRegion builds 5x5x5 = 125 chunks', () => {
    const { world } = genRegion(-2, 2, -2, 2);
    expect(world.count()).toBe(125);
  });

  it('every generated world of this seed contains water above the seafloor', () => {
    const { world } = genRegion(-2, 2, -2, 2);
    let water = 0;
    for (const c of world.allChunks()) for (let i = 0; i < c.blocks.length; i++) if (c.blocks[i] === Block.Water) water++;
    expect(water).toBe(45395); // exact, measured against simplex-noise@4.0.3 (seed pinned above)
  });

  it('surface columns end in grass or sand; dirt directly below for above-sea-level ground', () => {
    const { world } = genRegion(-2, 2, -2, 2);
    for (const sx of [0, 8, 16, 24, 32]) {
      for (const sz of [0, 8, 16, 24, 32]) {
        let yFirst = -1, firstSolid = 0;
        for (let y = 63; y >= 0; y--) {
          const b = world.getBlock(sx, y, sz);
          if (b !== Block.Air && b !== Block.Water) { firstSolid = b; yFirst = y; break; }
        }
        expect([Block.Grass, Block.Sand]).toContain(firstSolid);
        if (yFirst > SEA_LEVEL) {
          // above-sea-level ground: the row just under the surface is never cave-carved
          expect(world.getBlock(sx, yFirst - 1, sz)).toBe(Block.Dirt);
        }
      }
    }
  });

  it('stone exists below every sample column', () => {
    const { world } = genRegion(-2, 2, -2, 2);
    for (const sx of [0, 8, 16, 24, 32]) {
      for (const sz of [0, 8, 16, 24, 32]) {
        let found = false;
        for (let y = 60; y >= 0; y--) if (world.getBlock(sx, y, sz) === Block.Stone) { found = true; break; }
        expect(found, `stone below (${sx},${sz})`).toBe(true);
      }
    }
  });

  it('trees: hash-selected land columns get a full wood trunk and an air-replacing leaf canopy', () => {
    const { world, gen } = genRegion(-2, 2, -2, 2, TERRAIN_SEED);
    const trunkH = (wx: number, wz: number) => 4 + Math.floor(hash2((TERRAIN_SEED ^ 0x51ab) | 0, wx, wz) * 3);
    let checked = 0;
    for (let wx = -32; wx <= 47; ) {
      for (let wz = -32; wz <= 47; ) {
        const lx = ((wx % 16) + 16) % 16, lz = ((wz % 16) + 16) % 16;
        if (lx >= 3 && lx <= 12 && lz >= 3 && lz <= 12) {
          const h = gen.heightAt(wx, wz);
          if (h >= SEA_LEVEL + 1 && hash2(TERRAIN_SEED, wx, wz) < 0.02) {
            const trunk = trunkH(wx, wz);
            for (let y = h + 1; y <= h + trunk; y++) expect(world.getBlock(wx, y, wz), `wood at ${wx},${wz},${y}`).toBe(Block.Wood);
            expect([Block.Grass, Block.Sand]).toContain(world.getBlock(wx, h, wz));
            expect(world.getBlock(wx, h + trunk + 2, wz)).toBe(Block.Leaves); // canopy apex
            checked++;
            if (checked >= 3) return; // geometry on a few trees is enough
          }
        }
        wz += 1;
      }
      wx += 1;
      // (the outer loop bound is reached after -32..47 in both axes)
    }
    expect(checked).toBeGreaterThanOrEqual(1); // seed 1234 has >=1 tree in this region (measured)
  });
});
```

(`World.allChunks()` is the trivial `values()` passthrough shown below — the water test depends on it.)

Run: `npm test` → fails (module missing). Expected red.

## Step 4.2 — Implement `src/terrain.ts`

```ts
import { createNoise2D, createNoise3D } from 'simplex-noise';
import { Block } from './blocks';
import { Chunk, World, localIndex } from './world';

export const SEA_LEVEL = 32;
export const TERRAIN_SEED = 1234;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(seed: number, x: number, z: number): number {
  let h = (seed ^ Math.imul(x, 0x9e3779b9) ^ Math.imul(z, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xcc9e2d51) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x1b873593) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

export class TerrainGen {
  private n2: (x: number, y: number) => number;
  private n3: (x: number, y: number, z: number) => number;
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.n2 = createNoise2D(mulberry32(seed));
    this.n3 = createNoise3D(mulberry32((seed ^ 0x9e3779b9) | 0));
  }

  /** 4 octaves, amplitude-normalized → ≈ [-1, 1]; height = SEA_LEVEL + h*20 → 12..52. */
  heightAt(wx: number, wz: number): number {
    const freqs = [0.008, 0.02, 0.05, 0.11];
    const amps = [1, 0.5, 0.25, 0.125];
    let h = 0;
    for (let i = 0; i < 4; i++) h += this.n2(wx * freqs[i], wz * freqs[i]) * amps[i];
    const norm = 1 + 0.5 + 0.25 + 0.125;
    return Math.floor(SEA_LEVEL + (h / norm) * 20);
  }

  caveAt(wx: number, wy: number, wz: number): number {
    return this.n3(wx * 0.06, wy * 0.06, wz * 0.06);
  }
}

/**
 * Fills exactly one 16^3 chunk, vertically seam-free (height/cave functions are
 * pure in world coords, so adjacent chunks agree on shared cells).
 */
export function generateChunkTerrain(world: World, gen: TerrainGen, cx: number, cy: number, cz: number): void {
  const c = world.ensureChunk(cx, cy, cz);
  const bx = cx * 16, by = cy * 16, bz = cz * 16;
  for (let lx = 0; lx < 16; lx++) {
    for (let lz = 0; lz < 16; lz++) {
      const wx = bx + lx, wz = bz + lz;
      const h = gen.heightAt(wx, wz);
      for (let ly = 0; ly < 16; ly++) {
        const wy = by + ly;
        const i = localIndex(lx, ly, lz);
        if (wy > h) {
          c.blocks[i] = wy <= SEA_LEVEL ? Block.Water : Block.Air;
          continue;
        }
        if (wy < h - 4) c.blocks[i] = Block.Stone;
        else if (wy < h) c.blocks[i] = Block.Dirt;
        else c.blocks[i] = h < SEA_LEVEL + 1 ? Block.Sand : Block.Grass;
        // caves carve stone/dirt below sea level (underwater caves fill with water)
        if ((c.blocks[i] === Block.Stone || c.blocks[i] === Block.Dirt) && wy <= SEA_LEVEL && gen.caveAt(wx, wy, wz) > 0.55) {
          c.blocks[i] = Block.Water;
        }
      }
    }
  }
  // trees: deterministic per column; margin 3 keeps the r=2 canopy inside the chunk
  for (let lx = 3; lx <= 12; lx++) {
    for (let lz = 3; lz <= 12; lz++) {
      const wx = bx + lx, wz = bz + lz;
      const h = gen.heightAt(wx, wz);
      if (h < SEA_LEVEL + 1) continue;
      if (hash2(gen.seed, wx, wz) >= 0.02) continue;
      const trunk = 4 + Math.floor(hash2((gen.seed ^ 0x51ab) | 0, wx, wz) * 3); // 4..6
      for (let dy = 0; dy < trunk; dy++) {
        const wy = h + 1 + dy;
        const ly = wy - by;
        if (wy < by || ly >= 16) continue;
        c.blocks[localIndex(lx, ly, lz)] = Block.Wood;
      }
      for (let wy = h + trunk - 1; wy <= h + trunk + 2; wy++) {
        const r = wy < h + trunk ? 2 : 1;
        for (let dx = -r; dx <= r; dx++) {
          for (let dz = -r; dz <= r; dz++) {
            if (Math.abs(dx) === r && Math.abs(dz) === r) continue; // trim corners
            const ly = wy - by;
            if (ly < 0 || ly >= 16) continue;
            const i = localIndex(lx + dx, ly, lz + dz);
            // canopy replaces Air only — never hollows neighbouring terrain
            if (c.blocks[i] === Block.Air) c.blocks[i] = Block.Leaves;
          }
        }
      }
    }
  }
  c.dirty = true;
}

export function generateRegion(world: World, gen: TerrainGen, cx0: number, cz0: number, cx1: number, cz1: number, cy0 = 0, cy1 = 4): void {
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cz = cz0; cz <= cz1; cz++) {
      for (let cy = cy0; cy <= cy1; cy++) generateChunkTerrain(world, gen, cx, cy, cz);
    }
  }
}
```

Also add to `src/world.ts` (one-line method, part of this task):

```ts
  *allChunks(): IterableIterator<Chunk> {
    yield* this.chunks.values();
  }
```

Run: `npm test` → all green (terrain suite: determinism + range, 125 chunks, water, surface/dirt, stone-under, trees).

## Step 4.3 — Manual check (optional here, real scene comes in T9)

`npm test` is the gate. No dev-server check needed for a pure data module.

## Step 4.4 — Commit

```sh
git add -A . && git commit -m "T4: seeded terrain gen (height/caves/trees, seam-free per-chunk fill)"
```

---

# Task 5 — `src/chunk-mesher.ts`: two-pass voxel mesher with baked AO/face-shade (M1 core)

**Files:** Create `src/chunk-mesher.ts`, `src/__tests__/chunk-mesher.test.ts`.

> Every number in the tests below (face counts, vertex/UV/AO values) was locked by running a JS mirror of this exact algorithm to completion before writing the tests — face tables, emission order, and AO sampling are all cross-verified, so the suite is a regression net, not a discovery pass. Two rules to keep straight:
> - **Winding is CCW viewed from outside** (three.js `FrontSide`); D2's correction applies to the `±X` rows.
> - **AO is classic per-corner voxel AO:** for a face whose outward neighbor cell is `nB`, each corner samples the two side cells and the diagonal cell around `nB` (in **world** coordinates); `state = (s1 && s2) ? 3 : s1 + s2 + diag`, shade `AO_SHADE[state]`.

## Step 5.1 — Write the failing tests first: `src/__tests__/chunk-mesher.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, localIndex } from '../world';
import { meshChunk } from '../chunk-mesher';

function loneChunk(b: Block): World {
  const w = new World();
  const c = w.ensureChunk(0, 0, 0);
  c.blocks[localIndex(8, 8, 8)] = b;
  return w;
}

const FACE_NORMALS: [number, number, number][] = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], // +X,-X,+Y,-Y,+Z,-Z
];

function topFaceOf(w: World) {
  // the lone/first block's +Y face: face index 2 of the first emitted block => verts 8..11
  const { opaque } = meshChunk(w, 0, 0, 0);
  return { colors: opaque!.colors, uvs: opaque!.uvs };
}

describe('chunk-mesher', () => {
  it('winding: every emitted face normal points outward (CCW under FrontSide)', () => {
    const { opaque } = meshChunk(loneChunk(Block.Stone), 0, 0, 0);
    expect(opaque).not.toBeNull();
    const p = opaque!.positions;
    for (let f = 0; f < 6; f++) {
      const o = f * 12; // 4 verts * 3 floats, faces emitted in table order by the lone block
      const ax = p[o + 3] - p[o], ay = p[o + 4] - p[o + 1], az = p[o + 5] - p[o + 2]; // v1 - v0
      const bx = p[o + 6] - p[o], by = p[o + 7] - p[o + 1], bz = p[o + 8] - p[o + 2]; // v2 - v0
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const len = Math.hypot(nx, ny, nz);
      const [ex, ey, ez] = FACE_NORMALS[f];
      expect((nx * ex + ny * ey + nz * ez) / len, `face ${f} normal`).toBeGreaterThan(0.99);
    }
  });

  it('fully solid 16^3 chunk: 6 boundary shells, 1536 faces, no transparent buffer', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0).blocks.fill(Block.Stone);
    const { opaque, trans } = meshChunk(w, 0, 0, 0);
    expect(trans).toBeNull();
    expect(opaque).not.toBeNull();
    expect(opaque!.positions.length / 3).toBe(1536 * 4);
    expect(opaque!.colors.length / 4).toBe(1536 * 4);
    expect(opaque!.uvs.length / 2).toBe(1536 * 4);
    expect(opaque!.indices.length).toBe(1536 * 6);
  });

  it('faces shared between identical solid chunks are culled', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0).blocks.fill(Block.Stone);
    w.ensureChunk(1, 0, 0).blocks.fill(Block.Stone);
    const { opaque } = meshChunk(w, 0, 0, 0);
    expect(opaque!.positions.length / 3).toBe((1536 - 256) * 4); // +X shell removed
    expect(opaque!.indices.length).toBe((1536 - 256) * 6);
  });

  it('a chunk surrounded by solid neighbors emits no opaque buffer', () => {
    const w = new World();
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) w.ensureChunk(dx, dy, dz).blocks.fill(Block.Stone);
    expect(meshChunk(w, 0, 0, 0).opaque).toBeNull();
  });

  it('water: transparent pass only; faces against air, suppressed between water blocks', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Water;
    c.blocks[localIndex(9, 8, 8)] = Block.Water;
    const { opaque, trans } = meshChunk(w, 0, 0, 0);
    expect(opaque).toBeNull();
    expect(trans).not.toBeNull();
    expect(trans!.positions.length / 3).toBe(10 * 4); // 5 + 5 faces, shared face not emitted
    expect(trans!.indices.length).toBe(10 * 6);
  });

  it('an all-air chunk produces no buffers', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0);
    const { opaque, trans } = meshChunk(w, 0, 0, 0);
    expect(opaque).toBeNull();
    expect(trans).toBeNull();
  });

  it('AO: with no occluders the +Y face of a stone block is at full brightness', () => {
    const { colors } = topFaceOf(loneChunk(Block.Stone));
    for (const i of [32, 36, 40, 44]) expect(colors[i]).toBeCloseTo(1.0); // red channel, +Y shade is 1.0
  });

  it('AO: side+diagonal occluders around the face-neighbor darken the +Y corners', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Stone; // A at (8,8,8)
    c.blocks[localIndex(9, 9, 8)] = Block.Stone; // F1: occludes A's +Y through B=(8,9,8)'s x side
    c.blocks[localIndex(8, 9, 9)] = Block.Stone; // F2: occludes A's +Y through B's z side
    const r = topFaceOf(w).colors;
    expect(r[32]).toBeCloseTo(0.8);  // x- z+ corner: one side occluded
    expect(r[36]).toBeCloseTo(0.48); // x+ z+ corner: s1 && s2 -> state 3
    expect(r[40]).toBeCloseTo(0.8);  // x+ z- corner: one side occluded
    expect(r[44]).toBeCloseTo(1.0);  // x- z- corner: clear
  });

  it('UVs: +Y face corners land exactly inside their atlas tile cell', () => {
    const range = (b: Block) => {
      const { uvs } = topFaceOf(loneChunk(b));
      const us: number[] = [], vs: number[] = [];
      for (let i = 16; i < 24; i += 2) { us.push(uvs[i]); vs.push(uvs[i + 1]); } // verts 8..11
      return { uMin: Math.min(...us), uMax: Math.max(...us), vMin: Math.min(...vs), vMax: Math.max(...vs) };
    };
    const s = range(Block.Stone); // stone tile 3, atlas row 0
    expect(s.uMin).toBeCloseTo(3 / 16); expect(s.uMax).toBeCloseTo(4 / 16);
    expect(s.vMin).toBeCloseTo(15 / 16); expect(s.vMax).toBeCloseTo(1);
    const g = range(Block.Grass); // grass top face is tile 0
    expect(g.uMin).toBeCloseTo(0); expect(g.uMax).toBeCloseTo(1 / 16);
    expect(g.vMin).toBeCloseTo(15 / 16); expect(g.vMax).toBeCloseTo(1);
  });
});
```

Run: `npm test` → new suite fails (`module not found`). Expected red.

## Step 5.2 — Implement `src/chunk-mesher.ts`

```ts
import { Block, BLOCKS, isOpaque } from './blocks';
import { World, localIndex, type VoxelBuffer } from './world';

export interface ChunkMesh {
  opaque: VoxelBuffer | null;
  trans: VoxelBuffer | null;
}
```

(`VoxelBuffer` is the shared buffer type defined in T3's `world.ts`; the mesher and `main.ts` both import it from there — no duplicate definition.)

```ts
// CCW corners viewed from outside (FrontSide-safe; see D2). `axes` = [u-axis, v-axis]
// double-duty: AO side/diagonal sampling axes and UV mapping axes.
type FaceDef = { dir: [number, number, number]; axes: [number, number]; corners: [number, number, number][] };
const FACES: FaceDef[] = [
  { dir: [1, 0, 0],  axes: [2, 1], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] }, // +X: u<-z, v<-y
  { dir: [-1, 0, 0], axes: [2, 1], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] }, // -X
  { dir: [0, 1, 0],  axes: [0, 2], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] }, // +Y: u<-x, v<-z
  { dir: [0, -1, 0], axes: [0, 2], corners: [[1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0]] }, // -Y
  { dir: [0, 0, 1],  axes: [0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] }, // +Z: u<-x, v<-y
  { dir: [0, 0, -1], axes: [0, 1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] }, // -Z
];

const FACE_SHADE = [0.6, 0.6, 1.0, 0.5, 0.8, 0.8]; // order matches FACES
const AO_SHADE = [1.0, 0.8, 0.62, 0.48];

class Buf {
  pos: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  idx: number[] = [];
  verts = 0;

  push(x: number, y: number, z: number, s: number, u: number, v: number) {
    this.pos.push(x, y, z);
    this.col.push(s, s, s, 1.0);
    this.uv.push(u, v);
    this.verts++;
  }

  toBuffer(): VoxelBuffer | null {
    if (this.verts === 0) return null;
    return {
      positions: new Float32Array(this.pos),
      colors: new Float32Array(this.col),
      uvs: new Float32Array(this.uv),
      indices: new Uint32Array(this.idx),
    };
  }
}

/**
 * Pure, stateless: reads chunk data + neighbors via world.getBlock (missing = Air).
 * Emission order ly -> lz -> lx; per block the face table order. A pass with zero
 * faces yields null. `toGeometry` (BufferGeometry) lives in main.ts only, so this
 * module stays node-testable.
 */
export function meshChunk(world: World, cx: number, cy: number, cz: number): ChunkMesh {
  const chunk = world.getChunk(cx, cy, cz);
  if (!chunk) return { opaque: null, trans: null };
  const bx = cx * 16, by = cy * 16, bz = cz * 16;
  const opaque = new Buf();
  const trans = new Buf();

  for (let ly = 0; ly < 16; ly++) {
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const b = chunk.blocks[localIndex(lx, ly, lz)];
        if (b === Block.Air) continue; // air contributes to neither pass
        const sOp = isOpaque(b);
        const wx = bx + lx, wy = by + ly, wz = bz + lz;
        for (let f = 0; f < 6; f++) {
          const face = FACES[f];
          const nx = wx + face.dir[0], ny = wy + face.dir[1], nz = wz + face.dir[2];
          const nB = world.getBlock(nx, ny, nz);
          const wantOpaque = sOp && !isOpaque(nB);
          const wantTrans = !sOp && !isOpaque(nB) && nB !== b; // b is already != Air
          if (!wantOpaque && !wantTrans) continue;
          const buf = wantOpaque ? opaque : trans;
          const [au, av] = face.axes;
          const tile = BLOCKS[b as Block].faces[f];
          const tileCol = tile % 16, tileRow = (tile / 16) | 0;
          for (const c of face.corners) {
            const su = c[au] === 1 ? 1 : -1;
            const sv = c[av] === 1 ? 1 : -1;
            const s1 = isOpaque(world.getBlock(nx + (au === 0 ? su : 0), ny + (au === 1 ? su : 0), nz + (au === 2 ? su : 0))) ? 1 : 0;
            const s2 = isOpaque(world.getBlock(nx + (av === 0 ? sv : 0), ny + (av === 1 ? sv : 0), nz + (av === 2 ? sv : 0))) ? 1 : 0;
            const dg = isOpaque(world.getBlock(
              nx + (au === 0 ? su : 0) + (av === 0 ? sv : 0),
              ny + (au === 1 ? su : 0) + (av === 1 ? sv : 0),
              nz + (au === 2 ? su : 0) + (av === 2 ? sv : 0))) ? 1 : 0;
            const occ = s1 && s2 ? 3 : s1 + s2 + dg;
            buf.push(
              wx + c[0], wy + c[1], wz + c[2],
              FACE_SHADE[f] * AO_SHADE[occ],
              (tileCol + c[au]) / 16,
              (15 - tileRow + c[av]) / 16,
            );
          }
          const base = buf.verts - 4;
          buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
    }
  }

  return { opaque: opaque.toBuffer(), trans: trans.toBuffer() };
}
```

## Step 5.3 — Run the suite

Run: `npm test` → blocks/world/terrain/chunk-mesher all green. If a face count or AO value disagrees, the FACES table or emission order drifted from the mirror — do **not** "fix" the tests; diff the constants above against the table in Step 5.2. 

## Step 5.4 — Commit

```sh
git add -A . && git commit -m "T5: chunk mesher (face culling, AO, UVs, opaque/trans buffers)"
```

# Task 6 — Demo scene in `main.ts` + final `ui.css` (M1)

**Files:**
- Modify: `src/main.ts` (replace the T1 stub), `src/ui.css` (replace the T1 stub)
- Tests: none — T6 is scene code. Gate = `npm test` still green (T2–T5) + `npm run build` clean + the dev-server checklist below.

Goal: the instant the app opens (M1) you see a 3×3×3 synthetic plateau with the hand-drawn 11-tile texture atlas, per-block materials, visible baked AO, and a slowly orbiting camera.

Design notes:
- **World-space vertices (POC deviation, spec §7):** the mesher (T5) emits world-space vertex positions and meshes are added at the origin. The spec's "chunk-local vertices + per-chunk mesh offset" produces identical rendered output; world-space is simpler for both the static M1 build and T10 streaming (no per-frame offset bookkeeping when chunks are rebuilt).
- T6 fills the `boot / scene / textures / world-state / chunks-meshing / camera` sections fully. The `input / actions / streaming / water-fx / debug` sections are left as labeled stubs for T7/T8/T10/T12/T13.
- **Camera:** T6 is orbit-only. `SPAWN` is defined now (T7 player uses it) at world `(30.5, 41, 19.5)` — one unit above the center chunk's ground top (surface y=40).
- **Atlas:** the 11 tiles sit in row 0 (cols 0..10) drawn at the top of the 256² canvas. `CanvasTexture` defaults to `flipY=true`, so canvas row 0 lands at `v≈1` — exactly where T5's UV math (`v = (15 - tileRow + c) / 16`, tileRow = 0) points. `NearestFilter` + `generateMipmaps=false` keep the pixel look and prevent bleed between neighboring tiles (the spec's atlas gotcha).

## Step 6.1 — Final `src/ui.css` (replace the stub)

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #0b0e14; }
.hidden { display: none !important; }

#app { position: fixed; inset: 0; }
#app canvas { display: block; }

#crosshair {
  display: none; /* shown by game code while pointer-locked (T7+) */
  position: fixed; left: 50%; top: 50%;
  width: 14px; height: 14px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
#crosshair::before,
#crosshair::after { content: ''; position: absolute; background: rgba(255, 255, 255, .9); }
#crosshair::before { left: 50%; top: 0; width: 2px; height: 100%; transform: translateX(-50%); }
#crosshair::after { top: 50%; left: 0; height: 2px; width: 100%; transform: translateY(-50%); }

#hint {
  position: fixed; left: 12px; bottom: 12px;
  color: #e8eef7; font: 12px/1.5 system-ui, sans-serif;
  text-shadow: 0 1px 2px #000;
  pointer-events: none;
}

/* hotbar: bottom-center, display-only (T11 fills it); palette: top-right, click targets */
#hotbar {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 4px;
  padding: 6px; background: rgba(10, 14, 22, .55); border-radius: 8px;
  pointer-events: none;
}
#palette {
  position: fixed; top: 12px; right: 12px;
  display: grid; grid-template-columns: repeat(3, 48px); gap: 4px;
}
#hotbar .slot,
#palette .slot {
  border: 2px solid rgba(255, 255, 255, .25);
  border-radius: 6px;
  background-repeat: no-repeat;
  background-size: 256px 256px; /* full atlas; per-slot background-position offsets to its tile */
}
#hotbar .slot { width: 44px; height: 44px; }
#palette .slot { width: 48px; height: 48px; }
#palette .slot { cursor: pointer; }
#hotbar .slot.sel,
#palette .slot.sel { border-color: #ffd24a; }
```

(`#hotbar`/`#palette` stay `.hidden` until T11 populates them; hotbar is display-only, palette keeps `pointer-events: auto` as UI.)

## Step 6.2 — Full `src/main.ts` (replaces the stub)

```ts
import * as THREE from 'three';
import { Block } from './blocks';
import { World, chunkKey, localIndex, type VoxelBuffer } from './world';
import { SEA_LEVEL } from './terrain';
import { meshChunk } from './chunk-mesher';

// === boot ===

const app = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.append(renderer.domElement);

// === scene ===

const scene = new THREE.Scene();
const BG_AIR = 0x87ceeb; // T12 reuses this (air/underwater background + fog swap)
scene.background = new THREE.Color(BG_AIR);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 512);
// reserved for T7's player: one above the center chunk's ground top (surface y=40)
const SPAWN = new THREE.Vector3(30.5, 41, 19.5);

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);
onResize();

// === textures ===

// 256x256 canvas atlas: 11 tiles, all in the top row (cols 0..10, row 0).
const atlasCanvas = document.createElement('canvas');
atlasCanvas.width = 256;
atlasCanvas.height = 256;
const actx = atlasCanvas.getContext('2d')!;

function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function px(g: CanvasRenderingContext2D, x: number, y: number, c: readonly [number, number, number]) {
  g.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  g.fillRect(x, y, 1, 1);
}

function speck(g: CanvasRenderingContext2D, base: readonly [number, number, number], amt: number, rnd: () => number) {
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const d = (rnd() - 0.5) * 2 * amt;
      px(g, x, y, [base[0] + d, base[1] + d, base[2] + d]);
    }
}

type TilePainter = (g: CanvasRenderingContext2D, rnd: () => number) => void;

// One painter per face-tile id (index = tile from blocks.ts BLOCKS[b].faces), all deterministic.
const TILES: TilePainter[] = [
  (g, r) => speck(g, [92, 158, 66], 24, r), // 0 grassTop
  (g, r) => {                                // 1 grassSide (dirt with a 3px grass lip)
    speck(g, [120, 86, 52], 16, r);
    g.save();
    g.beginPath();
    g.rect(0, 0, 16, 3);
    g.clip();
    speck(g, [92, 158, 66], 18, r);
    g.restore();
  },
  (g, r) => speck(g, [120, 86, 52], 18, r),  // 2 dirt
  (g, r) => {                                 // 3 stone
    speck(g, [112, 112, 118], 14, r);
    g.fillStyle = 'rgba(58,58,64,.85)';
    for (let i = 0; i < 4; i++) g.fillRect((r() * 14) | 0, (r() * 16) | 0, 2 + ((r() * 3) | 0), 1);
  },
  (g, r) => speck(g, [216, 204, 152], 14, r), // 4 sand
  (g, r) => {                                 // 5 water
    speck(g, [48, 104, 196], 12, r);
    g.fillStyle = 'rgba(130,185,255,.55)';
    for (let i = 0; i < 5; i++) g.fillRect((r() * 13) | 0, (r() * 16) | 0, 3, 1);
  },
  (g, r) => {                                 // 6 woodSide (vertical strips)
    for (let x = 0; x < 16; x++) {
      const base: readonly [number, number, number] = x % 4 < 2 ? [112, 78, 44] : [98, 68, 40];
      for (let y = 0; y < 16; y++) {
        const d = (r() - 0.5) * 14;
        px(g, x, y, [base[0] + d, base[1] + d, base[2] + d]);
      }
    }
  },
  (g, r) => {                                 // 7 woodTop (concentric squares)
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
        const base: readonly [number, number, number] = d % 3 < 1.5 ? [152, 112, 64] : [114, 82, 48];
        const j = (r() - 0.5) * 10;
        px(g, x, y, [base[0] + j, base[1] + j, base[2] + j]);
      }
  },
  (g, r) => speck(g, [54, 118, 46], 30, r),  // 8 leaves
  (g) => {                                    // 9 glass (frame + highlight)
    g.fillStyle = 'rgb(196,232,250)';
    g.fillRect(0, 0, 16, 16);
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.fillRect(0, 0, 16, 1);
    g.fillRect(0, 15, 16, 1);
    g.fillRect(0, 0, 1, 16);
    g.fillRect(15, 0, 1, 16);
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.fillRect(3, 3, 2, 6);
  },
  (g, r) => {                                 // 10 planks (4px horizontal boards)
    for (let y = 0; y < 16; y++) {
      const base: readonly [number, number, number] = y % 4 === 3 ? [70, 48, 28] : [150, 108, 62];
      for (let x = 0; x < 16; x++) {
        const d = (r() - 0.5) * 14;
        px(g, x, y, [base[0] + d, base[1] + d, base[2] + d]);
      }
    }
  },
];

for (let t = 0; t < TILES.length; t++) {
  actx.save();
  actx.translate((t % 16) * 16, ((t / 16) | 0) * 16);
  TILES[t](actx, prng(0x5eed + t * 0x9e3779b9));
  actx.restore();
}

const atlas = new THREE.CanvasTexture(atlasCanvas); // flipY defaults true: canvas row 0 -> v≈1
atlas.magFilter = THREE.NearestFilter; // pixel look; no mip bleed across tiles
atlas.minFilter = THREE.NearestFilter;
atlas.generateMipmaps = false;

// No lights (spec): MeshBasicMaterial + vertex colors carry the baked face-shade/AO.
const matOpaque = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true });
const matTrans = new THREE.MeshBasicMaterial({
  map: atlas,
  vertexColors: true,
  transparent: true,
  opacity: 0.75,
  depthWrite: false,
  side: THREE.DoubleSide, // lets water be seen from under-side/side as well
});

// === world-state ===

const world = new World();

/** Synthetic M1 plateau: 3x3 x 3-high chunk band, per-chunk plateau height h = 38..41. */
function demoFill(w: World): void {
  for (let cx = 0; cx <= 2; cx++)
    for (let cz = 0; cz <= 2; cz++) {
      const h = SEA_LEVEL + 6 + ((cx * 5 + cz * 9 + 32) % 4);
      for (let cy = 0; cy <= 2; cy++) {
        const ch = w.ensureChunk(cx, cy, cz);
        const by = cy * 16;
        for (let lz = 0; lz < 16; lz++)
          for (let lx = 0; lx < 16; lx++)
            for (let wy = by; wy < by + 16; wy++) {
              if (wy > h) continue; // leave Air (new chunks are zeroed)
              const b: number = wy === h ? (h < SEA_LEVEL + 1 ? Block.Sand : Block.Grass)
                : wy < h - 2 ? Block.Stone
                : Block.Dirt;
              ch.blocks[localIndex(lx, wy - by, lz)] = b;
            }
      }
    }

  // Hand-placed features: top band of the center chunk only (world x/z 16..31, y 32..47).
  const c = w.ensureChunk(1, 2, 1);
  const h = SEA_LEVEL + 6 + ((1 * 5 + 1 * 9 + 32) % 4); // = 40, same expression as above
  const setL = (lx: number, ly: number, lz: number, b: number, airOnly = false) => {
    if (lx < 0 || lx >= 16 || ly < 0 || ly >= 16 || lz < 0 || lz >= 16) return;
    const i = localIndex(lx, ly, lz);
    if (airOnly && c.blocks[i] !== Block.Air) return;
    c.blocks[i] = b;
  };
  for (let lz = 11; lz <= 14; lz++) // 4x4 pool: sand floor, water column flush with terrain
    for (let lx = 11; lx <= 14; lx++) {
      setL(lx, h - 35, lz, Block.Sand);
      for (let ly = h - 34; ly <= h - 32; ly++) setL(lx, ly, lz, Block.Water);
    }
  for (let lz = 0; lz <= 3; lz++) // sand patch in the chunk's south-west corner
    for (let lx = 0; lx <= 3; lx++) setL(lx, h - 32, lz, Block.Sand);
  for (let t = 0; t <= 2; t++) setL(5, h + t - 32, 5, Block.Wood); // 3-tall tree trunk
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      if (Math.abs(dx) === 1 && Math.abs(dz) === 1) continue;
      setL(5 + dx, h + 3 - 32, 5 + dz, Block.Leaves, true);
    }
  setL(5, h + 4 - 32, 5, Block.Leaves, true); // single top leaf
  for (let lz = 5; lz <= 7; lz++) // 3x3 plank deck
    for (let lx = 10; lx <= 12; lx++) setL(lx, h - 32, lz, Block.Planks);
  for (const lx of [13, 14]) // glass tower on the pool edge — written AFTER the pool
    for (const lz of [10, 11]) // so glass wins where their surface cells overlap (lz=11)
      for (let ly = h - 32; ly <= h - 30; ly++) setL(lx, ly, lz, Block.Glass);
}

demoFill(world);

// === chunks-meshing ===

// T5 emits world-space vertex positions; meshes live at the origin.
// (POC deviation from the spec's "chunk-local vertices + per-chunk mesh offset":
//  identical rendered output, and T10 streaming avoids per-frame offset bookkeeping.)
function toGeometry(b: VoxelBuffer): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(b.positions, 3));
  g.setAttribute('color', new THREE.BufferAttribute(b.colors, 4)); // rgb + baked alpha
  g.setAttribute('uv', new THREE.BufferAttribute(b.uvs, 2));
  g.setIndex(new THREE.BufferAttribute(b.indices, 1));
  g.computeBoundingSphere();
  return g;
}

const chunkObjs = new Map<string, { opaque: THREE.Mesh | null; trans: THREE.Mesh | null }>();

function rebuildChunkMesh(cx: number, cy: number, cz: number): void {
  const key = chunkKey(cx, cy, cz);
  const old = chunkObjs.get(key);
  for (const m of [old?.opaque, old?.trans]) {
    if (m) {
      scene.remove(m);
      m.geometry.dispose();
    }
  }
  const { opaque, trans } = meshChunk(world, cx, cy, cz);
  const entry: { opaque: THREE.Mesh | null; trans: THREE.Mesh | null } = { opaque: null, trans: null };
  if (opaque) entry.opaque = new THREE.Mesh(toGeometry(opaque), matOpaque);
  if (trans) entry.trans = new THREE.Mesh(toGeometry(trans), matTrans);
  if (entry.opaque) scene.add(entry.opaque);
  if (entry.trans) scene.add(entry.trans);
  chunkObjs.set(key, entry);
}
// (T8/T10 reuse rebuildChunkMesh for edits and streaming loads.)

// M1: static build of the whole demo band (T10 replaces this with streaming).
for (let cx = 0; cx <= 2; cx++)
  for (let cz = 0; cz <= 2; cz++)
    for (let cy = 0; cy <= 2; cy++) rebuildChunkMesh(cx, cy, cz);

// === camera ===

// T6: slow orbit. T7 replaces the updateOrbitCamera call sites with the player-driven camera.
const ORBIT_TARGET = new THREE.Vector3(28, 43, 28);
const ORBIT_OFFSET = new THREE.Vector3(0, 8, 26);
const UP = new THREE.Vector3(0, 1, 0);
let orbitAngle = 0;

function updateOrbitCamera(dt: number): void {
  orbitAngle += dt * 0.35;
  camera.position.copy(ORBIT_TARGET).add(ORBIT_OFFSET.clone().applyAxisAngle(UP, orbitAngle));
  camera.lookAt(ORBIT_TARGET);
}
updateOrbitCamera(0);

// === input ===
// T7: pointer-lock + WASD/SPACE key state -> MoveInput.

// === actions ===
// T8: break/place on mouse click (remeshes affected chunks); T11: selected hotbar slot.

// === streaming ===
// T10: replace the static build above with streaming.update(world, pcx, pcz, pcy) in the loop.

// === water-fx ===
// T12: underwater fog / background / FOV swap driven by player.headInWater.

// === debug ===
// T13: C = chunk-wireframe / AO demo scene (F fly / N noclip toggles live in the T7 input section).

// === loop ===

const STEP = 1 / 60;
const hint = document.getElementById('hint')!;
hint.textContent = 'block-world T6 — orbiting demo (player lands in T7)';

let last = performance.now();
let acc = 0;

function frame(now: number): void {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // clamp after tab-switch/hitch
  acc += dt;
  while (acc >= STEP) {
    acc -= STEP;
    updateOrbitCamera(STEP); // T7: player.update(STEP, moveInput)
    // T10: streaming.update(world, pcx, pcz, pcy)
    // T8:  tickInteractions()
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
```

## Step 6.3 — Verify

Run (from `block-world/`):

```sh
npm test          # T2–T5 suites still green (T6 adds no tests)
npm run build     # tsc clean + vite bundle succeeds
npm run dev       # manual checklist, browser (no console errors)
```

Dev-server checklist:
1. Camera slowly orbits (≈0.35 rad/s) around the 3×3 plateau; no flicker, no pop-in.
2. Center-chunk top (world x/z 16..31, surface y=40): speckled grass plateau; sand patch in its south-west corner (x/z 16..19); 3×3 planks deck (x 26..28, z 21..23); 4×4 pool (x/z 27..30) with a sand floor at y=37 and water surface flush with the terrain (top y=40, translucent); a 2×2 glass tower (x 29..30, z 26..27) rising from the pool surface to y=42; a tree at (21,·,21) — 3-tall trunk, 3×3 leaf canopy with trimmed corners plus one top leaf.
3. Sides: grey stone slab under a thin dirt band; AO visibly softens pool corners and the plateau/tree silhouettes.
4. Water reads translucent (opacity 0.75, double-sided, no z-fight with the sand floor); no texture bleeding between tiles (nearest filter).

Failure modes → likely cause:
- Faces inverted/inside-out → D2 winding regression in T5's `FACES` table.
- Textures off by one tile → atlas row assumption broke (tiles must be the top row; `flipY` stays default-true).
- Water invisible → `matTrans` settings, or the mesher trans pass produced no faces (check the `wantTrans` predicate).
- Everything flat grey → `vertexColors: true` missing, or the color attribute's itemSize ≠ 4 in `toGeometry`.

## Step 6.4 — Commit

```sh
git add -A . && git commit -m "T6: demo scene (atlas, materials, synthetic 3x3 world, orbit camera, final ui.css)"
```

> With T6 done, **M1** from the overview is met: a textured, AO-shaded meshed world renders on screen.

# Task 7 — `src/player.ts`: movement, gravity, collision, player camera (M2)

**Files:** create `src/player.ts`; create `src/__tests__/player.test.ts`; extend `src/main.ts` (camera, input, and loop sections per Step 7.3). No `ui.css` changes (the T6 `#crosshair` rule already defaults to `display: none`; game code shows it while pointer-locked).

The T6 orbit camera is retired: the camera becomes the player's eyes (feet + 1.62 m, rotation order YXZ), driven by pointer-lock mouse look + WASD/SPACE/SHIFT. Player physics is pure TS (no `three` import) so the whole model is node-testable: AABB-vs-voxel collision with axis-separated moves and a bisection snap, gravity, jump, a swim clamp (no free-fall in water, SPACE rises), fly (F), and noclip (N).

## Step 7.1 — `src/player.ts`

```ts
import { Block, isOpaque } from './blocks';

export interface MoveInput {
  forward: number; // -1..1 (W=+1, S=-1)
  strafe: number;  // -1..1 (D=+1, A=-1)
  up: boolean;     // SPACE: jump on ground / rise in water / fly up
  down: boolean;   // SHIFT: fly down (ignored otherwise)
}

export interface Vec3 { x: number; y: number; z: number }

export const WALK_SPEED = 5.6;   // m/s
export const SWIM_SPEED = 3.0;   // m/s horizontal in water
export const FLY_SPEED = 13.0;
export const FLY_V_SPEED = 8.0;
export const GRAVITY = 28;       // m/s^2 — applied in air AND water (water then clamps)
export const JUMP_VEL = 9.5;     // apex ~1.6 m above launch
export const HALF = 0.3;         // body half-width on x/z
export const HEIGHT = 1.8;       // feet -> top of head
export const EYE = 1.62;         // camera height above feet

const EPS = 1e-7;                // keeps a box sitting exactly on a voxel boundary from "touching" the next voxel
const BISECT_ITER = 24;          // sub-micron snap precision for typical per-step move sizes

export class Player {
  pos: Vec3 = { x: 0, y: 0, z: 0 }; // feet position
  vel: Vec3 = { x: 0, y: 0, z: 0 }; // only vel.y persists between steps (x/z are direct velocity)
  yaw = 0;   // radians; 0 = looking -z. Camera uses rotation order YXZ (yaw then pitch).
  pitch = 0; // clamped by the input layer (main.ts), raw here
  onGround = false;
  inWater = false;      // any voxel of the body AABB is water
  headInWater = false;  // the eye voxel is water (T12 underwater FX reads this)
  fly = false;          // F toggle
  noclip = false;       // N toggle

  private getBlock: (x: number, y: number, z: number) => number;

  constructor(getBlock: (x: number, y: number, z: number) => number) {
    this.getBlock = getBlock;
  }

  place(p: Vec3): void {
    this.pos = { x: p.x, y: p.y, z: p.z };
    this.vel = { x: 0, y: 0, z: 0 };
  }

  /** Does the player AABB overlap voxel (vx, vy, vz)? T8 refuses to place blocks inside the player. */
  intersectsVoxel(vx: number, vy: number, vz: number): boolean {
    const p = this.pos;
    return vx < p.x + HALF && vx + 1 > p.x - HALF &&
           vy < p.y + HEIGHT && vy + 1 > p.y &&
           vz < p.z + HALF && vz + 1 > p.z - HALF;
  }

  private collides(px: number, py: number, pz: number): boolean {
    const x0 = Math.floor(px - HALF), x1 = Math.floor(px + HALF - EPS);
    const y0 = Math.floor(py),        y1 = Math.floor(py + HEIGHT - EPS);
    const z0 = Math.floor(pz - HALF), z1 = Math.floor(pz + HALF - EPS);
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++)
          if (isOpaque(this.getBlock(x, y, z))) return true;
    return false;
  }

  private bodyInWater(px: number, py: number, pz: number): boolean {
    const x0 = Math.floor(px - HALF), x1 = Math.floor(px + HALF - EPS);
    const y0 = Math.floor(py),        y1 = Math.floor(py + HEIGHT - EPS);
    const z0 = Math.floor(pz - HALF), z1 = Math.floor(pz + HALF - EPS);
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++)
          if (this.getBlock(x, y, z) === Block.Water) return true;
    return false;
  }

  /** Move `delta` along axis 0=x, 1=y, 2=z. On collision, bisection-snap to the nearest
   *  collision-free position along that axis. Returns true if the move was blocked.
   *  Invariant: we always END a step outside solid voxels, so f=0 is always free. */
  private slide(axis: 0 | 1 | 2, delta: number): boolean {
    if (delta === 0) return false;
    const p = this.pos;
    const at = (f: number) =>
      this.collides(
        p.x + (axis === 0 ? delta * f : 0),
        p.y + (axis === 1 ? delta * f : 0),
        p.z + (axis === 2 ? delta * f : 0),
      );
    if (!at(1)) {
      if (axis === 0) p.x += delta;
      else if (axis === 1) p.y += delta;
      else p.z += delta;
      return false;
    }
    let lo = 0, hi = 1;
    for (let i = 0; i < BISECT_ITER; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid)) hi = mid; else lo = mid; // `lo` is the farthest proven-free fraction
    }
    if (axis === 0) p.x += delta * lo;
    else if (axis === 1) p.y += delta * lo;
    else p.z += delta * lo;
    return true;
  }

  /** Ground-plane movement direction from yaw (W = forward, D = right), normalized. */
  private groundDir(fwd: number, str: number): { x: number; z: number } {
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    // forward = (-sin yaw, -cos yaw); right = (cos yaw, -sin yaw)
    let x = -s * fwd + c * str;
    let z = -c * fwd - s * str;
    const l = Math.hypot(x, z);
    if (l > 1) { x /= l; z /= l; }
    return { x, z };
  }

  update(dt: number, input: MoveInput): void {
    const p = this.pos, v = this.vel;

    this.headInWater =
      this.getBlock(Math.floor(p.x), Math.floor(p.y + EYE), Math.floor(p.z)) === Block.Water;
    this.inWater = this.headInWater || this.bodyInWater(p.x, p.y, p.z);

    if (this.noclip) {
      // Free movement: no gravity, no collision.
      const d = this.groundDir(input.forward, input.strafe);
      v.x = d.x * FLY_SPEED; v.z = d.z * FLY_SPEED;
      v.y = input.up ? FLY_V_SPEED : input.down ? -FLY_V_SPEED : 0;
      p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
      this.onGround = false;
      return;
    }

    // Vertical: gravity always; water clamps fall speed and lets SPACE rise; fly overrides.
    if (this.fly) {
      v.y = input.up ? FLY_V_SPEED : input.down ? -FLY_V_SPEED : 0;
    } else {
      v.y -= GRAVITY * dt;
      if (this.inWater) {
        if (input.up) v.y = Math.min(v.y + 30 * dt, SWIM_SPEED); // net +2 m/s^2 while rising
        v.y = Math.max(v.y, -SWIM_SPEED * 0.6);                  // sink speed cap, no free-fall
      } else if (input.up && this.onGround) {
        v.y = JUMP_VEL; // jump (onGround was latched at the end of the PREVIOUS step)
      }
    }

    // Horizontal: direct velocity (no acceleration/inertia for the POC).
    const speed = this.fly ? FLY_SPEED : this.inWater ? SWIM_SPEED : WALK_SPEED;
    const d = this.groundDir(input.forward, input.strafe);
    v.x = d.x * speed; v.z = d.z * speed;

    this.slide(0, v.x * dt);   // x
    this.slide(2, v.z * dt);   // z
    if (this.slide(1, v.y * dt)) v.y = 0; // floor OR ceiling: kill vertical velocity

    // Ground probe: is there solid just below the feet? (2 cm tolerance)
    this.onGround = this.collides(p.x, p.y - 0.02, p.z);
  }
}
```

Notes:

- **Pure TS, no `three`:** positions are plain `{x,y,z}` so vitest runs the model without a DOM/WebGL. `main.ts` reads `player.pos` into the camera; `place()` is structurally happy with a `THREE.Vector3` too.
- **Collision scan:** the body AABB is `x/z ∈ [p∓HALF]`, `y ∈ [p, p+HEIGHT)`; solid = `isOpaque(getBlock)`. The `EPS` shrink on the +bounds makes "standing exactly on a voxel face" non-colliding, which is what settles the player on integer floors without jitter.
- **Bisection snap:** each axis move is tested whole (`at(1)`); if it collides, 24 bisection iterations find the farthest free fraction (`lo`), so the player stops flush with walls/floors instead of sticking or clipping. 24 iterations resolve a ~10 cm/step move to ~6 nm.
- **`onGround` latches at step end** (probe at `y − 0.02`) and is *read* at the top of the next step for the jump test — the standard pattern that makes jumping work right after landing.
- `intersectsVoxel` ships with T7 (T8's place-guard uses it); `headInWater` ships with T7 (T12's fog swap uses it).

## Step 7.2 — `src/__tests__/player.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { Block } from '../blocks';
import { Player, type MoveInput } from '../player';

const STEP = 1 / 60;

const input = (over: Partial<MoveInput> = {}): MoveInput =>
  ({ forward: 0, strafe: 0, up: false, down: false, ...over });

function run(p: Player, n: number, over: Partial<MoveInput> = {}): void {
  for (let i = 0; i < n; i++) p.update(STEP, input(over));
}

describe('player', () => {
  it('falls in empty space under gravity', () => {
    const p = new Player(() => Block.Air);
    p.place({ x: 0, y: 0, z: 0 });
    run(p, 60);
    expect(p.vel.y).toBeCloseTo(-28, 0); // full 1 s of gravity, no floor
    expect(p.pos.y).toBeLessThan(-5.5);
    expect(p.onGround).toBe(false);
  });

  it('lands on a floor and settles', () => {
    const p = new Player((_x, y) => (y <= 4 ? Block.Stone : Block.Air)); // floor top at y=5
    p.place({ x: 0, y: 6, z: 0 });
    run(p, 300);
    expect(p.pos.y).toBeCloseTo(5, 1);
    expect(p.onGround).toBe(true);
    expect(p.vel.y).toBeCloseTo(0, 1);
  });

  it('cannot walk through a solid wall', () => {
    // Full-height wall column (no y bound): the player falls alongside it for the whole
    // 1.5 s, so the x-stop must hold even while falling. (A short wall would let the
    // falling player drop under it and walk away.)
    const wall = (x: number, _y: number, z: number) =>
      (x >= 10 && x <= 13 && z >= 4 && z <= 7 ? Block.Stone : Block.Air);
    const p = new Player(wall);
    p.place({ x: 8, y: 5, z: 8 });
    p.yaw = -Math.PI / 2; // face +x, straight into the wall
    run(p, 90, { forward: 1 });
    expect(p.pos.x).toBeGreaterThan(9.6); // stopped flush at 9.7 (x + HALF = wall face at 10)
    expect(p.pos.x).toBeLessThan(10);
    expect(p.pos.y).toBeLessThan(-5);     // and it was falling the whole time
  });

  it('jumps from the ground and lands again', () => {
    const p = new Player((_x, y) => (y <= 4 ? Block.Stone : Block.Air));
    p.place({ x: 0, y: 5, z: 0 });
    let maxY = p.pos.y;
    for (let i = 0; i < 300; i++) {
      p.update(STEP, input({ up: i === 5 })); // jump once onGround has latched
      if (p.pos.y > maxY) maxY = p.pos.y;
    }
    expect(maxY).toBeGreaterThan(6.2); // apex ≈ 5 + 9.5^2 / (2*28) ≈ 6.6
    expect(p.pos.y).toBeCloseTo(5, 1);
    expect(p.onGround).toBe(true);
  });

  it('noclip phases through solid and ignores gravity', () => {
    const wall = (x: number, _y: number, z: number) =>
      (x >= 10 && x <= 13 && z >= 4 && z <= 7 ? Block.Stone : Block.Air);
    const p = new Player(wall);
    p.place({ x: 8, y: 5, z: 8 });
    p.yaw = -Math.PI / 2;
    p.noclip = true;
    run(p, 60, { forward: 1 });
    expect(p.pos.x).toBeGreaterThan(10); // walked straight through
    expect(p.pos.y).toBeCloseTo(5, 1);   // no gravity in noclip
  });

  it('fly: SPACE rises, SHIFT sinks', () => {
    const p = new Player(() => Block.Air);
    p.place({ x: 0, y: 0, z: 0 });
    p.fly = true;
    run(p, 30, { up: true });   // 0.5 s @ 8 m/s
    expect(p.pos.y).toBeCloseTo(4, 1);
    run(p, 30, { down: true }); // and back down
    expect(p.pos.y).toBeCloseTo(0, 1);
  });

  it('swim: sinking is clamped, SPACE rises', () => {
    // 1-voxel-thick water sheet at y=0 (surface at y=1).
    const sheet = (_x: number, y: number) => (y <= 0 ? Block.Water : Block.Air);
    const sink = new Player(sheet);
    sink.place({ x: 0, y: 0.5, z: 0 }); // submerged
    run(sink, 60);
    expect(sink.vel.y).toBeCloseTo(-1.8, 1); // clamp at -SWIM_SPEED*0.6, not -28t
    expect(sink.pos.y).toBeGreaterThan(-2);  // slow sink, not free-fall (~-13.5 without the clamp)
    expect(sink.pos.y).toBeLessThan(0.4);

    const deep = (_x: number, y: number) => (y <= 4 ? Block.Water : Block.Air); // deep pool
    const rise = new Player(deep);
    rise.place({ x: 0, y: 0, z: 0 });
    run(rise, 90, { up: true });
    expect(rise.vel.y).toBeCloseTo(3, 0);  // SWIM_SPEED cap
    expect(rise.pos.y).toBeCloseTo(2.3, 1);
  });
});
```

Derivations behind the asserts (all deterministic — water is not solid, so no bisection is involved in the swim test): gravity test = 60 full steps, `vy = −28`, displacement ≈ −14.2. Floor test: bisection lands at `y ≈ 5 + ~1e-7`, `onGround` then true via the `y−0.02` probe. Wall test: 90 steps = 1.5 s, `x` pins at `10 − HALF` after ~19 steps and stays pinned (wall is full-height, player's `z` band `[7.7, 8.3)` overlaps wall column `z=7` for the whole fall to `y = 5 − 14·1.5² ≈ −26.5`). Jump: apex ≈ `5.158 + 9.5²/56 ≈ 6.7`, back on the floor within ~50 steps. Fly: constant `vy = ±8` → exact `±4.0` over 0.5 s. Swim-sink: `vy` hits the `−1.8` clamp after 4 steps, 60 steps ≈ `−1.26` m. Swim-rise: net `vy += 2/60` per step up to the 3.0 cap (reached exactly at step 90), `Δy = (1/1800)·Σ(1..90) = 2.275`.

## Step 7.3 — `src/main.ts` integration (six exact replacements)

Apply to the file produced by T6 (each "before" block appears exactly once):

**7.3.1 Imports** — before:

```ts
import { meshChunk } from './chunk-mesher';
```

after:

```ts
import { meshChunk } from './chunk-mesher';
import { Player, EYE, type MoveInput } from './player';
```

**7.3.2 Camera section** — before:

```ts
// T6: slow orbit. T7 replaces the updateOrbitCamera call sites with the player-driven camera.
const ORBIT_TARGET = new THREE.Vector3(28, 43, 28);
const ORBIT_OFFSET = new THREE.Vector3(0, 8, 26);
const UP = new THREE.Vector3(0, 1, 0);
let orbitAngle = 0;

function updateOrbitCamera(dt: number): void {
  orbitAngle += dt * 0.35;
  camera.position.copy(ORBIT_TARGET).add(ORBIT_OFFSET.clone().applyAxisAngle(UP, orbitAngle));
  camera.lookAt(ORBIT_TARGET);
}
updateOrbitCamera(0);
```

after:

```ts
// Camera = the player's eyes (feet + EYE). Rotation order YXZ: yaw first, then pitch.
const player = new Player((x, y, z) => world.getBlock(x, y, z));
player.place(SPAWN);
player.yaw = Math.PI; // face south, toward the deck/pool features
camera.rotation.order = 'YXZ';

function syncCamera(): void {
  camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
}
syncCamera();
```

**7.3.3 Input section** — before:

```ts
// === input ===
// T7: pointer-lock + WASD/SPACE key state -> MoveInput.
```

after:

```ts
// === input ===

const MAX_PITCH = Math.PI / 2 - 0.01; // never go over the top
const keys = new Set<string>();

window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'KeyF') player.fly = !player.fly;         // fly toggle
  if (e.code === 'KeyN') player.noclip = !player.noclip;   // noclip toggle (T13 adds KeyC here)
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

// Click the canvas to pointer-lock (then WASD + mouse steer the character); ESC releases.
renderer.domElement.addEventListener('click', () => {
  const r = renderer.domElement.requestPointerLock() as unknown;
  if (r instanceof Promise) r.catch(() => {}); // Safari rejects without a user gesture
});

const crosshair = document.getElementById('crosshair')!;
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  crosshair.style.display = locked ? 'block' : 'none';
  if (!locked) keys.clear(); // never drift on stuck keys after ESC
});

document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  player.yaw -= e.movementX * 0.0025;
  player.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, player.pitch - e.movementY * 0.0025));
});

function readMove(): MoveInput {
  return {
    forward: (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0),
    strafe: (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0),
    up: keys.has('Space'),
    down: keys.has('ShiftLeft') || keys.has('ShiftRight'),
  };
}
```

**7.3.4 Hint text** — before:

```ts
hint.textContent = 'block-world T6 — orbiting demo (player lands in T7)';
```

after:

```ts
hint.textContent =
  'block-world T7 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · ESC release';
```

**7.3.5 Loop: orbit call → player step** — before:

```ts
    updateOrbitCamera(STEP); // T7: player.update(STEP, moveInput)
```

after:

```ts
    player.update(STEP, readMove());
```

**7.3.6 Loop: sync camera before render** — before:

```ts
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
```

after:

```ts
  }
  syncCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
```

Notes:

- `syncCamera()` runs once per *frame* (after all physics substeps), not per substep — the camera only needs the latest player state.
- Mouse-look signs: `yaw -= movementX·k` (mouse right → look right), `pitch -= movementY·k` (mouse up → look up, since `rotation.x > 0` tilts the view up in three.js).
- `T8` (interactions) and `T10` (streaming) marker comments in the loop are untouched; `T8` will also hook mouse buttons in the input section.

## Step 7.4 — Verify

Run (from `block-world/`):

```sh
npm test          # T2–T7 suites green; 7 new player tests
npm run build     # tsc strict clean + vite bundle
npm run dev       # manual checklist, browser (no console errors)
```

Dev-server checklist:
1. Click the canvas → pointer locks, the crosshair appears; ESC → releases, crosshair hidden, and the character does **not** keep moving (no stuck keys).
2. WASD walks/strafes relative to view; mouse steers yaw/pitch; pitch clamps at the horizon (camera never rolls over).
3. On the plateau (feet rest at world y=41, the top face of ground voxel y=40): SPACE jumps ~1.6 m and settles back; F → fly (SPACE/SHIFT rise/sink, faster horizontal); N → noclip.
4. **Do not noclip off the edge of the demo band** — the POC world is only the 3×3 chunk band (x/z 0..48); outside it is void (T9 fixes this with real terrain). Use noclip to pass through the band's stone side or the buried pool column instead.
5. No open water exists in the T6 world, so swimming is verified by the unit tests only (the pool's water column is buried inside the plateau) — manual swim check arrives with T9's sea.
6. No console errors; performance smooth (60 fps; the player does ~5 AABB scans per step, trivial).

Failure modes → likely cause:
- Camera upside-down or spinning with mouse → `camera.rotation.order = 'YXZ'` missing, or the pitch clamp is absent.
- Movement feels mirrored / W goes sideways → sign error in `yaw -=`/`pitch -=` or in `groundDir()`'s forward/right basis.
- Walking through walls or stuck inside them → `EPS`/bisection break in `slide()`, or the collision scan bounds (`HALF`/`HEIGHT` mismatches between `collides` and anything else that tests overlap — `intersectsVoxel` uses the same constants).
- No jump → `onGround` probe (`y − 0.02`) never true, or jump branch ordering (it must run after gravity, and skip in water).
- Sinks straight through water/floor at high fall speed → water clamp `Math.max(v.y, -SWIM_SPEED * 0.6)` missing from the `inWater` branch.
- Crosshair missing while locked → `pointerlockchange` handler not toggling `#crosshair`'s `display`, or the T6 CSS `display: none` rule lost.

## Step 7.5 — Commit

```sh
git add -A . && git commit -m "T7: player (AABB physics, swim, fly, noclip, pointer-lock camera)"
```

> With T7 done, **M2** from the overview is met: a first-person character with gravity, jump, swim clamps, fly and noclip lives on the voxel world. (T8 adds M3: interaction.)

# Task 8 — `src/raycast.ts`: DDA voxel raycast, break/place actions, target hitbox (M3)

**Files:** create `src/raycast.ts`; create `src/__tests__/raycast.test.ts`; modify `src/main.ts` (per Step 8.4 — seven exact replacements on the T7 output).

Design notes:
- **Raycast = DDA (Amanatides & Woo):** walk the integer lattice one voxel per iteration, always entering the next voxel through the nearest grid plane. Correct for oblique rays (a stepped sampler would tunnel through thin geometry). `Math.abs(1 / dir.x)` is `Infinity` when `dir.x === 0`, so a parallel axis is never stepped — IEEE-754 does the special-casing. `dir` must be normalized so the parametric `t` is meters.
- **Target = breakable solid:** the ray stops only on `b !== Air && b !== Water`. Water is pass-through, so you can target through pools, and water can **never** be broken (a water cell is never the hit cell). Placing *into* a water cell is allowed by the action layer, so pools can be filled in (M3 flavor).
- **Actions are event-driven:** `mousedown` (LMB = break, RMB = place) and `contextmenu` handlers are attached to `document` **only while the pointer is locked** — the click that requests the lock, and any later UI click, can never mutate the world. The per-frame part is a single `updateHitbox()` call after `syncCamera()` (the raycast then starts from the just-synced eye position).
- **`remeshAround`**: an edit at `(x,y,z)` rebuilds the cell's chunk mesh **and**, when the cell sits on a chunk face, the touched neighbor's mesh (guarded by `hasChunk`). `World.setBlock` only marks data dirty; the static build has no dirty consumer until T10's streaming scan (which acts as a safety net, not a requirement).
- **Place guards, in order:** target y inside the world range `[WORLD_Y_MIN, WORLD_Y_MAX)`, target cell is Air or Water (Water => fill the pool), and the placed block must not overlap the player's AABB unless `player.noclip` — via `Player.intersectsVoxel` from T7.
- **Hitbox:** white `LineSegments` around an `EdgesGeometry` box sized 1.002² (tiny overhang avoids z-fighting the target face); visible only while locked and while the ray hits.

## Step 8.1 — Write the failing test first: `src/__tests__/raycast.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { Block } from '../blocks';
import { World } from '../world';
import { raycastVoxel } from '../raycast';

// setBlock refuses to touch missing chunks, so give every case its own world with chunk (0,0,0) materialized.
function worldWith(build: (w: World) => void): World {
  const w = new World();
  w.ensureChunk(0, 0, 0);
  build(w);
  return w;
}

describe('raycastVoxel — DDA over the voxel lattice', () => {
  it('hits the first solid it crosses; normal = the face it entered from', () => {
    const w = worldWith((w) => w.setBlock(0, 0, 0, Block.Stone));
    const hit = raycastVoxel(w, { x: -5.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 30);
    expect(hit).not.toBeNull();
    expect([hit!.x, hit!.y, hit!.z, hit!.nx, hit!.ny, hit!.nz]).toEqual([0, 0, 0, -1, 0, 0]);
  });

  it('returns null when nothing solid is within maxDist', () => {
    const w = worldWith((w) => w.setBlock(0, 0, 0, Block.Stone)); // stone cell first reached at t=5.5; bound is 4
    expect(raycastVoxel(w, { x: -5.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 4)).toBeNull();
  });

  it('passes over the world: a ray above the solid exits through the distance bound', () => {
    const w = worldWith((w) => w.setBlock(0, 0, 0, Block.Stone));
    expect(raycastVoxel(w, { x: -5.5, y: 5.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 30)).toBeNull();
  });

  it('water is pass-through: stepping continues until the solid behind it', () => {
    const w = worldWith((w) => {
      w.setBlock(2, 0, 0, Block.Water);
      w.setBlock(3, 0, 0, Block.Stone);
    });
    const hit = raycastVoxel(w, { x: 0.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 10);
    expect(hit).not.toBeNull();
    expect([hit!.x, hit!.y, hit!.z, hit!.nx, hit!.ny, hit!.nz]).toEqual([3, 0, 0, -1, 0, 0]);
  });
});
```

Run `npm test` — the raycast suite **fails** (`Cannot find module '../raycast'`); T2–T7 stay green.

## Step 8.2 — Implement `src/raycast.ts`

```ts
import { Block } from './blocks';

export const REACH = 6; // targeting distance in meters

export interface RayHit {
  x: number; // the voxel the ray hit
  y: number;
  z: number;
  nx: number; // face the ray entered from (unit axis), or 0,0,0 when the origin voxel itself is solid
  ny: number;
  nz: number;
}

/**
 * DDA ray-march through the voxel lattice (Amanatides & Woo): one iteration = one new
 * voxel, always entered through the nearest grid plane. A parallel axis is never
 * stepped (1/0 is Infinity in IEEE-754). `dir` must be normalized (t == meters).
 */
export function raycastVoxel(
  world: { getBlock(x: number, y: number, z: number): number },
  origin: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  maxDist: number,
): RayHit | null {
  // Water is pass-through: the target is whatever you could break against.
  const isTarget = (b: number) => b !== Block.Air && b !== Block.Water;

  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = dir.x >= 0 ? 1 : -1;
  const stepY = dir.y >= 0 ? 1 : -1;
  const stepZ = dir.z >= 0 ? 1 : -1;
  const tDeltaX = Math.abs(1 / dir.x); // Infinity when dir.x === 0
  const tDeltaY = Math.abs(1 / dir.y);
  const tDeltaZ = Math.abs(1 / dir.z);

  let tMaxX = dir.x > 0 ? (x + 1 - origin.x) * tDeltaX : dir.x < 0 ? (origin.x - x) * tDeltaX : Infinity;
  let tMaxY = dir.y > 0 ? (y + 1 - origin.y) * tDeltaY : dir.y < 0 ? (origin.y - y) * tDeltaY : Infinity;
  let tMaxZ = dir.z > 0 ? (z + 1 - origin.z) * tDeltaZ : dir.z < 0 ? (origin.z - z) * tDeltaZ : Infinity;

  let nx = 0;
  let ny = 0;
  let nz = 0;

  for (;;) {
    if (isTarget(world.getBlock(x, y, z))) return { x, y, z, nx, ny, nz };
    if (tMaxX <= tMaxY && tMaxX <= tMaxZ) {
      if (tMaxX > maxDist) return null;
      x += stepX;
      tMaxX += tDeltaX;
      [nx, ny, nz] = [-stepX, 0, 0];
    } else if (tMaxY <= tMaxZ) {
      if (tMaxY > maxDist) return null;
      y += stepY;
      tMaxY += tDeltaY;
      [nx, ny, nz] = [0, -stepY, 0];
    } else {
      if (tMaxZ > maxDist) return null;
      z += stepZ;
      tMaxZ += tDeltaZ;
      [nx, ny, nz] = [0, 0, -stepZ];
    }
  }
}
```

Notes:
- The origin voxel is checked *before* any axis advance: if the (noclip) camera sits inside a solid block, the hit is that block with normal `(0,0,0)` (placing then targets the same, occupied cell and is rejected).
- The per-iteration `tMax > maxDist` check happens **before** the step: the ray cannot enter the next voxel within range.
- The zero-direction edge (`dir = 0,0,0`) cannot loop forever: all three `tMax` are `Infinity`, so the first branch returns `null`.

## Step 8.3 — Run the suite

```sh
npm test          # raycast suite now green (4 new tests); T2–T7 still green
```

## Step 8.4 — `src/main.ts` integration (seven exact replacements)

Apply to the file produced by T7 (each "before" block occurs exactly once; order does not matter — the blocks do not overlap):

**8.4.1 World import** — before:

```ts
import { World, chunkKey, localIndex, type VoxelBuffer } from './world';
```

after:

```ts
import { World, chunkKey, chunkOf, localIndex, CHUNK_SIZE, WORLD_Y_MAX, WORLD_Y_MIN, type VoxelBuffer } from './world';
```

**8.4.2 Raycast import** — before:

```ts
import { Player, EYE, type MoveInput } from './player';
```

after:

```ts
import { Player, EYE, type MoveInput } from './player';
import { raycastVoxel, REACH, type RayHit } from './raycast';
```

**8.4.3 Actions section** — before:

```ts
// === actions ===
// T8: break/place on mouse click (remeshes affected chunks); T11: selected hotbar slot.
```

after:

```ts
// === actions ===

// T8: crosshair break (LMB) / place (RMB). T11 replaces this single block with hotbar selection.
let selectedBlock = Block.Planks;

// Targeting wireframe: box edges, 1.002 so it never z-fights the target face.
const hitbox = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0xffffff }),
);
hitbox.visible = false;
scene.add(hitbox);

// Attach the action handlers only while the pointer is locked, so the click that
// requests the lock (and any later UI click) can never mutate the world.
let pointerLocked = false;
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
  if (pointerLocked) {
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('contextmenu', onContextMenu);
  } else {
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('contextmenu', onContextMenu);
    hitbox.visible = false;
  }
});
// RMB must suppress the browser menu, which would also drop the pointer lock.
function onContextMenu(e: Event): void {
  e.preventDefault();
}

function castFromCamera(): RayHit | null {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir); // view direction in world space, normalized
  return raycastVoxel((x, y, z) => world.getBlock(x, y, z), camera.position, dir, REACH);
}

// Rebuild the edited cell's chunk, plus — when the cell sits on a chunk face — the
// touched neighbor, so faces on the shared border are regenerated (setBlock only
// marks data dirty; the static build has no dirty consumer until T10's streaming scan).
function remeshAround(wx: number, wy: number, wz: number): void {
  const cx = chunkOf(wx);
  const cy = chunkOf(wy);
  const cz = chunkOf(wz);
  rebuildChunkMesh(cx, cy, cz);
  const lx = wx - cx * CHUNK_SIZE;
  const ly = wy - cy * CHUNK_SIZE;
  const lz = wz - cz * CHUNK_SIZE;
  const touch: [number, number, number][] = [];
  if (lx === 0) touch.push([cx - 1, cy, cz]);
  if (lx === CHUNK_SIZE - 1) touch.push([cx + 1, cy, cz]);
  if (lz === 0) touch.push([cx, cy, cz - 1]);
  if (lz === CHUNK_SIZE - 1) touch.push([cx, cy, cz + 1]);
  if (ly === 0) touch.push([cx, cy - 1, cz]);
  if (ly === CHUNK_SIZE - 1) touch.push([cx, cy + 1, cz]);
  for (const [nx, ny, nz] of touch) if (world.hasChunk(nx, ny, nz)) rebuildChunkMesh(nx, ny, nz);
}

function onMouseDown(e: MouseEvent): void {
  const hit = castFromCamera();
  if (!hit) return;
  if (e.button === 0) {
    // `hit` is always a breakable solid (water is pass-through in the raycast).
    world.setBlock(hit.x, hit.y, hit.z, Block.Air);
    remeshAround(hit.x, hit.y, hit.z);
  } else if (e.button === 2) {
    const tx = hit.x + hit.nx;
    const ty = hit.y + hit.ny;
    const tz = hit.z + hit.nz;
    if (ty < WORLD_Y_MIN || ty >= WORLD_Y_MAX) return;
    const target = world.getBlock(tx, ty, tz);
    if (target !== Block.Air && target !== Block.Water) return; // empty or water (filling pools)
    if (!player.noclip && player.intersectsVoxel(tx, ty, tz)) return; // no placing through yourself
    world.setBlock(tx, ty, tz, selectedBlock);
    remeshAround(tx, ty, tz);
  }
}

// Per-frame actions: re-target the wireframe from the just-synced camera (called after syncCamera).
function updateHitbox(): void {
  const hit = pointerLocked ? castFromCamera() : null;
  if (!hit) {
    hitbox.visible = false;
    return;
  }
  hitbox.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
  hitbox.visible = true;
}
```

**8.4.4 `rebuildChunkMesh` note** — before:

```ts
// (T8/T10 reuse rebuildChunkMesh for edits and streaming loads.)
```

after:

```ts
// (T8 remeshes around edits via remeshAround; T10 reuses this for streaming loads/unloads.)
```

**8.4.5 Hint** — before:

```ts
hint.textContent =
  'block-world T7 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · ESC release';
```

after:

```ts
hint.textContent =
  'block-world T8 — click to lock · LMB break · RMB place (planks) · F fly · N noclip · ESC release';
```

**8.4.6 Loop: drop the tick marker** (interactions are event-driven; no per-tick hook needed) — before:

```ts
    player.update(STEP, readMove());
    // T10: streaming.update(world, pcx, pcz, pcy)
    // T8:  tickInteractions()
```

after:

```ts
    player.update(STEP, readMove());
    // T10: streaming.update(world, pcx, pcz, pcy)
```

**8.4.7 Loop: target after camera sync** — before:

```ts
  syncCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
```

after:

```ts
  syncCamera();
  updateHitbox();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
```

## Step 8.5 — Verify

Run (from `block-world/`):

```sh
npm test          # all six suites green: blocks, world, terrain, chunk-mesher, player, raycast
npm run build     # tsc strict clean + vite bundle
npm run dev       # manual checklist, browser (no console errors)
```

Dev-server checklist:
1. Click the canvas → pointer locks, crosshair appears; aim at any solid within 6 m and a white wireframe box hugs that exact voxel, tracking smoothly as you steer the mouse. Aim at empty sky → the box disappears.
2. **Break:** with F (fly) circle the plateau, LMB a grass cell → the cell is gone; the exposed wall shows the freshly generated faces with baked AO in the hollow. No flicker, no console errors. LMB through the water in the (buried) pool affects **nothing in the water** — if a solid lies behind it (the sand floor), *that* is what breaks (water is pass-through and unbreakable).
3. **Chunk-boundary edit:** (noclip N to stand level with a seam) break a ground cell on a chunk seam — e.g. world x=16 or z=32 — then look across the seam: both chunks regenerated, no missing-face ghost on either side of the border.
4. **Place:** RMB a solid face → a planks block appears on that face (e.g. on the deck, on the grass, on a trunk). Dig down into the buried 4×4 pool and RMB a water cell → the water is replaced by planks (filling works); RMB where you are standing (without noclip) → nothing happens (self-overlap guard).
5. **Unlock:** ESC → crosshair **and** hitbox hide; a subsequent canvas click only re-locks, and mouse clicks can no longer break/place anything (handlers detached).
6. No console errors; clicks rebuild 1–3 chunk meshes (millisecond-scale) — 60 fps holds.

Failure modes → likely cause:
- Clicks do nothing → the `pointerlockchange` attach branch is missing/wrong-keyed (handlers bind only while locked), or the lock *request* still targets the canvas while actions listen on `document`.
- Right-click opens the browser menu → `contextmenu` `preventDefault` missing (the menu would also drop the pointer lock).
- Highlight box stays on after ESC → the unlock branch does not hide `hitbox`, or listeners were not removed.
- Missing/ghost face after a boundary edit → `remeshAround` forgot the neighbor on a touched side, or the `hasChunk` guard skipped a neighbor that exists.
- Can place a block inside yourself → `intersectsVoxel` guard dropped (it shares the collision `HALF`/`HEIGHT` constants, so there is no mismatch to worry about).
- Box z-fights the target face → `BoxGeometry` size back to exactly 1.

## Step 8.6 — Commit

```sh
git add -A . && git commit -m "T8: break/place (DDA raycast, hitbox, remesh)"
```

> With T8 done, **M3** from the overview is met: the first-person character (M2) can see, target, and modify the world. (T9 replaces the synthetic plateau with seeded terrain; T10 adds M5 streaming.)

# Task 9 — Seeded terrain in `main.ts`: 5×5×5 band, measured land spawn, void respawn (M4)

**Files:**
- Modify: `src/main.ts` only (imports, scene, world-state, chunks-meshing, camera, loop, hint — seven exact replacements).
- Tests: none — terrain generation is already pinned by the T4 suite (`src/__tests__/terrain.test.ts`), and T9 reuses that exact generator call, so the scene and the test suite share one source of truth. Gate = `npm test` still green (T2–T8) + `npm run build` clean + the dev checklist below.

Goal: the synthetic M1 plateau (`demoFill`) is replaced by seeded simplex terrain (T4's `generateRegion`, `TERRAIN_SEED` = 1234) filling the initial 5×5×5 chunk band (world x/z 0..80, y 0..80); the player spawns standing on **measured** land; T7/T8 interactions keep working on real terrain; the static one-shot build stays until T10 adds streaming.

Design notes:
- **One generator, two consumers:** `generateRegion(world, gen, 0, 0, 4, 4)` fills exactly the 125 chunks the T4 suite asserts on (seed 1234: 45 395 water cells, surface heights 19..43, 21 trees). The on-screen world is therefore the same region every unit test describes — no parallel "scene-only" terrain code.
- **Measured spawn:** the old hardcoded `SPAWN` (plateau center) no longer exists. The new spawn column (33, 41) was probed against the real noise: it is the closest land column to the old spawn — a grass shelf, surface y=33, no tree on the column. The code still *scans* down from the top of the band instead of hardcoding y, so a future seed/region tweak only needs the scan (and, if the column were open sea, the player lands on the sand floor and swims up).
- `SPAWN` moves from the scene section to world-state, **after** `generateRegion` runs. That is safe: the only consumer is the camera section's `player.place(SPAWN)`, which sits later in the file (world-state → chunks-meshing → camera → input → …).
- The band stays a static one-shot build (~1 s at load) — T10 replaces it with streaming loads/unloads around the player, which also removes the floating-slab look at the band edges.
- A void-floor respawn (`pos.y < WORLD_Y_MIN`) is added now, while the band bottom (y=0) already makes under-world falls possible (cave openings, dug-out floors).

## Step 9.1 — Imports: terrain generator in, `SEA_LEVEL`/`localIndex` out

`SEA_LEVEL` and `localIndex` exist in main.ts only for the `demoFill` that 9.3 deletes. `isOpaque` serves the spawn scan.

Before:

```ts
import { Block } from './blocks';
import { World, chunkKey, chunkOf, localIndex, CHUNK_SIZE, WORLD_Y_MAX, WORLD_Y_MIN, type VoxelBuffer } from './world';
import { SEA_LEVEL } from './terrain';
```

After:

```ts
import { Block, isOpaque } from './blocks';
import { World, chunkKey, chunkOf, CHUNK_SIZE, WORLD_Y_MAX, WORLD_Y_MIN, type VoxelBuffer } from './world';
import { TERRAIN_SEED, TerrainGen, generateRegion } from './terrain';
```

## Step 9.2 — Scene section: drop the hardcoded SPAWN

Before:

```ts
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 512);
// reserved for T7's player: one above the center chunk's ground top (surface y=40)
const SPAWN = new THREE.Vector3(30.5, 41, 19.5);
```

After:

```ts
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 512);
// SPAWN is computed in world-state, after the terrain exists (scan of a measured column).
```

## Step 9.3 — World-state: `demoFill` → `generateRegion` + spawn scan

Replace the entire `demoFill` function **and** its `demoFill(world);` call — before:

```ts
/** Synthetic M1 plateau: 3x3 x 3-high chunk band, per-chunk plateau height h = 38..41. */
function demoFill(w: World): void {
  for (let cx = 0; cx <= 2; cx++)
    for (let cz = 0; cz <= 2; cz++) {
      const h = SEA_LEVEL + 6 + ((cx * 5 + cz * 9 + 32) % 4);
      for (let cy = 0; cy <= 2; cy++) {
        const ch = w.ensureChunk(cx, cy, cz);
        const by = cy * 16;
        for (let lz = 0; lz < 16; lz++)
          for (let lx = 0; lx < 16; lx++)
            for (let wy = by; wy < by + 16; wy++) {
              if (wy > h) continue; // leave Air (new chunks are zeroed)
              const b: number = wy === h ? (h < SEA_LEVEL + 1 ? Block.Sand : Block.Grass)
                : wy < h - 2 ? Block.Stone
                : Block.Dirt;
              ch.blocks[localIndex(lx, wy - by, lz)] = b;
            }
      }
    }

  // Hand-placed features: top band of the center chunk only (world x/z 16..31, y 32..47).
  const c = w.ensureChunk(1, 2, 1);
  const h = SEA_LEVEL + 6 + ((1 * 5 + 1 * 9 + 32) % 4); // = 40, same expression as above
  const setL = (lx: number, ly: number, lz: number, b: number, airOnly = false) => {
    if (lx < 0 || lx >= 16 || ly < 0 || ly >= 16 || lz < 0 || lz >= 16) return;
    const i = localIndex(lx, ly, lz);
    if (airOnly && c.blocks[i] !== Block.Air) return;
    c.blocks[i] = b;
  };
  for (let lz = 11; lz <= 14; lz++) // 4x4 pool: sand floor, water column flush with terrain
    for (let lx = 11; lx <= 14; lx++) {
      setL(lx, h - 35, lz, Block.Sand);
      for (let ly = h - 34; ly <= h - 32; ly++) setL(lx, ly, lz, Block.Water);
    }
  for (let lz = 0; lz <= 3; lz++) // sand patch in the chunk's south-west corner
    for (let lx = 0; lx <= 3; lx++) setL(lx, h - 32, lz, Block.Sand);
  for (let t = 0; t <= 2; t++) setL(5, h + t - 32, 5, Block.Wood); // 3-tall tree trunk
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      if (Math.abs(dx) === 1 && Math.abs(dz) === 1) continue;
      setL(5 + dx, h + 3 - 32, 5 + dz, Block.Leaves, true);
    }
  setL(5, h + 4 - 32, 5, Block.Leaves, true); // single top leaf
  for (let lz = 5; lz <= 7; lz++) // 3x3 plank deck
    for (let lx = 10; lx <= 12; lx++) setL(lx, h - 32, lz, Block.Planks);
  for (const lx of [13, 14]) // glass tower on the pool edge — written AFTER the pool
    for (const lz of [10, 11]) // so glass wins where their surface cells overlap (lz=11)
      for (let ly = h - 32; ly <= h - 30; ly++) setL(lx, ly, lz, Block.Glass);
}

demoFill(world);
```

After:

```ts
// The T4 suite pins this exact region (seed 1234, chunks 0..4 x/z and y): 45395 water cells,
// surface heights 19..43, 21 trees — so what renders is what the tests describe.
const gen = new TerrainGen(TERRAIN_SEED);
generateRegion(world, gen, 0, 0, 4, 4);

// Spawn on MEASURED ground: (33,41) is the closest land column to the old plateau center —
// a grass shelf, surface y=33, no tree in the column (probed against TERRAIN_SEED). The scan
// drops from the top of the band (79 = top of cy 4 -> y 0..79) to the surface voxel; for an
// open-sea column it would land on the sand floor and the player would swim up.
const sx = 33, sz = 41;
let sy = 79;
while (sy >= 0 && !isOpaque(world.getBlock(sx, sy, sz))) sy--;
const SPAWN = new THREE.Vector3(sx + 0.5, sy + 1, sz + 0.5);
```

## Step 9.4 — Chunks-meshing: static band 3×3 → 5×5×5

Before:

```ts
// M1: static build of the whole demo band (T10 replaces this with streaming).
for (let cx = 0; cx <= 2; cx++)
  for (let cz = 0; cz <= 2; cz++)
    for (let cy = 0; cy <= 2; cy++) rebuildChunkMesh(cx, cy, cz);
```

After:

```ts
// M4: static build of the initial 5x5x5 terrain band (one-shot, ~1 s at load;
// T10 replaces this with streaming loads/unloads around the player).
for (let cx = 0; cx <= 4; cx++)
  for (let cz = 0; cz <= 4; cz++)
    for (let cy = 0; cy <= 4; cy++) rebuildChunkMesh(cx, cy, cz);
```

## Step 9.5 — Camera section: face the sea

The old yaw faced the T6 deck features, which no longer exist. From the (33,41) shelf the shoreline is east (+x), starting ≈6 m away.

Before:

```ts
player.yaw = Math.PI; // face south, toward the deck/pool features
```

After:

```ts
player.yaw = -Math.PI / 2; // face +x (east), at the sea — the shoreline starts ~6 m from spawn
```

## Step 9.6 — Hint text

Before:

```ts
hint.textContent =
  'block-world T8 — click to lock · LMB break · RMB place (planks) · F fly · N noclip · ESC release';
```

After:

```ts
hint.textContent =
  'block-world T9 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · LMB break · RMB place (planks) · ESC release';
```

## Step 9.7 — Loop: void-floor respawn after substeps

Before:

```ts
    player.update(STEP, readMove());
    // T10: streaming.update(world, pcx, pcz, pcy)
```

After:

```ts
    player.update(STEP, readMove());
    // T10: streaming.update(world, pcx, pcz, pcy)
    if (player.pos.y < WORLD_Y_MIN) player.place(SPAWN); // fell out of the world (open cave / dug-away floor)
```

## Step 9.8 — Verify

Run (from `block-world/`):

```sh
npm test          # T2–T8 suites green (terrain suite unchanged and still pins the rendered band)
npm run build     # tsc strict clean (no unused `SEA_LEVEL`/`localIndex` leftovers) + vite bundle
npm run dev       # manual checklist, browser (no console errors)
```

Dev-server checklist:
1. After a ~1 s blank first paint (one-shot build of 125 chunks — expected, T10 streams it away), a seamless rolling world appears: grass upland, sand beaches, translucent sea, ≈21 trees. Crossing chunk borders (walk along world x or z = 16/32/48/64) shows **no** seam ghosts, missing faces, or height steps — the height/cave functions are pure in world coordinates.
2. Spawn: you are standing (feet y=34, on the grass surface y=33) on the shelf at world (33,41), facing east; the sea starts ~6 m ahead. Hint says T9.
3. Walk to the shore: grass → sand → shallow water. Wade in, swim out with SPACE (head pops out of the water — the T12 fog swap is what reacts to this), look back at the beach.
4. Trees: fly up (F + SPACE) and skim a canopy — trunk 4–6 tall, 3×3/5×5 trimmed canopy; AO softens the trunk–canopy and ground contact.
5. **Break** a grass cell on a chunk seam (noclip N, level with the seam at world x=32 or z=32, LMB): both chunks regenerate, faces + AO correct on both sides.
6. **Place** a planks row on the grass; RMB a sea cell just under the surface while swimming → the plank replaces the water.
7. **Void:** F + hold SHIFT down through the slab bottom (or drop through an open underwater cave) → once below y=−32 you are back on the spawn shelf with zero velocity.
8. Band edges: the outer x/z faces of the slab render as solid walls (missing neighbor counts as air → face emitted); above/below the band you can see the slab floating over void sky — expected for the POC static build, T10 streaming removes it.
9. No console errors; 60 fps inside the static band (per-click remeshes still 1–3 chunk rebuilds, millisecond-scale).

Failure modes → likely cause:
- Black or empty screen forever → the 9.3 `generateRegion` band is not `0..4` in both x/z *and* cy (a partial fill leaves whole slabs of air), or the static loop in 9.4 was not widened to match (mismatch between filled and meshed chunks).
- Player spawns in water or falls to the void on load → spawn scan starts below the band top (must start at 79), the `isOpaque` import from `./blocks` was dropped, or (33,41) is no longer land because `TERRAIN_SEED`/`generateRegion` drifted from the T4 pinning.
- Visible seams/pop at chunk borders → world-coordinate purity of `heightAt`/`caveAt` broke (e.g. a local-coordinate leak), or 9.4's loop skips a band edge.
- Rendered terrain disagrees with the T4 test numbers → the scene stopped using `TERRAIN_SEED`/`generateRegion` (it was re-wired to a local copy) — that is exactly what this task's design forbids.
- First paint takes seconds (more than ~1 s) → extra chunk work on load (e.g. `rebuildChunkMesh` called in a wider band than `generateRegion` filled, rebuilding empty chunks forever per click).

## Step 9.9 — Commit

```sh
git add -A . && git commit -m "T9: seeded terrain world (5x5x5 band, measured land spawn, void respawn)"
```

> With T9 done, **M4** from the overview is met: the player lives in real, seamlessly generated terrain with water and trees. (T10 adds M5 streaming; T11–T13 add UI, underwater FX, and the final polish/verification pass.)

# Task 10 — `src/streaming.ts`: radius-2 chunk streaming around the player (M5)

**Files:** create `src/streaming.ts`, `src/__tests__/streaming.test.ts`; modify `src/main.ts` (seven exact replacements on the T9 output).

Design notes:
- **The ring:** streaming keeps every chunk with `|cx−pcx| ≤ 2, |cz−pcz| ≤ 2, cy ∈ [0..4]` — a 5×5×5 = 125-chunk band around the player (exactly the region T4 pins and T9 rendered statically). The x/z extent is *unbounded*: `heightAt`/`caveAt` are pure in world coordinates, so terrain generates correctly anywhere; only Y is band-limited (POC ground slab: y 0..79).
- **Per-call budget:** `update()` (called once per physics substep, 60 Hz) may load **at most 2** missing chunks — the closest by score, each filled with terrain immediately via T4's `generateChunkTerrain` — and report **at most 2** dirty chunks for main.ts to remesh via `rebuildChunkMesh`. That is ≤4 chunk builds per substep; a terrain chunk meshes in milliseconds, so even a teleport (125 fresh chunks ≈ 1 s) holds 60 fps.
- **Score:** `(dx²+dz²)·100 + |cy−pcy|` — x/z distance dominates (×100 absorbs every cy term of a nearer ring), the player's own chunk first (score 0), and deterministic `(cx, cy, cz)` tie-breaks make the stream — and the tests below — reproducible.
- **The dirty flag is the contract with T8:** `rebuildChunkMesh` (main.ts) must clear `chunk.dirty` after building; T8's `remeshAround` already rebuilds edited chunks immediately, so the streaming dirty-scan is a **safety net** — it catches chunks marked dirty while their mesh is stale or absent (setBlock marks 6 neighbors; missing chunks can't be marked, and every generated chunk starts dirty).
- **Loads and unloads mark neighbors dirty:** a newly present chunk makes existing neighbors' face culling stale (they emitted boundary faces against missing-Air); an unload exposes open boundaries on remaining in-range neighbors. The ≤2 remesh budget spreads those fixes over a few frames — a teleported player sees at most a few frames of ghost faces at the ring edge, never permanently.
- **Spawn column pre-generated:** main.ts generates only chunk column `(2, ·, 2)` (world x/z 32..47, which contains the spawn column (33,41)) before the first frame, so T9's measured-spawn scan reads real terrain and the player's own chunk (2,2,2) meshes on the **first** `update()` call. First paint: spawn column ≈1 frame, immediate ring ≈0.3 s, full 125 ≈1 s — no long blank like T9's one-shot; the world data is byte-identical (same generator + seed).

## Step 10.1 — Write the failing test first: `src/__tests__/streaming.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World } from '../world';
import { TERRAIN_SEED, TerrainGen } from '../terrain';
import { update } from '../streaming';

// Tests stand in for main.ts: every chunk update() reports as rebuilt is treated as
// (re)meshed, which clears its dirty flag (in the app the clear happens in
// rebuildChunkMesh).
function converge(world: World): void {
  let calls = 0;
  for (;;) {
    const r = update(world, 2, 2, 2); // player stands in chunk (2,2), band-middle height
    for (const c of r.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;
    if (r.rebuilt.length === 0 && r.unloaded.length === 0) return;
    if (++calls > 500) throw new Error('streaming did not converge');
  }
}

describe('streaming', () => {
  it('A: converges to the full 5x5x5 ring, terrain-filled, closest first', () => {
    const world = new World();
    const first = update(world, 2, 2, 2);
    // score 0 (player's own chunk), then the closest ring; ties break by (cx, cy, cz)
    expect(first.rebuilt).toEqual([{ cx: 2, cy: 2, cz: 2 }, { cx: 1, cy: 2, cz: 2 }]);
    expect(first.unloaded).toEqual([]);
    for (const c of first.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;

    converge(world);

    expect(world.count()).toBe(125); // 5 x 5 columns x 5 levels
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cx = 0; cx <= 4; cx++) {
      for (let cz = 0; cz <= 4; cz++) {
        const wx = cx * 16 + 8, wz = cz * 16 + 8;
        const h = gen.heightAt(wx, wz); // T4: 12..52, always inside the band
        expect(world.getBlock(wx, h, wz), `surface of column (${cx}, ${cz})`).not.toBe(Block.Air);
      }
    }
  });

  it('B: budget — at most 2 loads + 2 remeshes per call; cold start loads exactly 2', () => {
    const cold = new World();
    const f = update(cold, 2, 2, 2);
    expect(f.rebuilt.length).toBe(2); // nothing but loads on a cold start
    expect(cold.count()).toBe(2);

    const world = new World();
    let calls = 0;
    for (;;) {
      const r = update(world, 2, 2, 2);
      expect(r.rebuilt.length).toBeLessThanOrEqual(4);
      expect(r.unloaded.length).toBe(0); // a standing player never unloads
      for (const c of r.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;
      if (r.rebuilt.length === 0) break;
      if (++calls > 500) throw new Error('streaming did not converge');
    }
    expect(world.count()).toBe(125);
  });

  it('C: dirty chunks remesh in score order, two per call (the safety net behind T8 edits)', () => {
    const world = new World();
    converge(world);
    for (const c of world.allChunks()) c.dirty = false;

    world.setBlock(4 * 16 + 8, 34, 4 * 16 + 8, Block.Dirt); // dirties corner chunk (4,2,4) + its 5 loaded neighbors
    const r = update(world, 2, 2, 2);
    expect(r.rebuilt).toEqual([
      { cx: 3, cy: 2, cz: 4 }, // (1^2 + 2^2) * 100 = 500
      { cx: 4, cy: 1, cz: 4 }, // 500, tie broken by (cx, cy, cz)
    ]);

    for (const c of r.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;
    let calls = 0;
    for (;;) { // the remaining dirty chunks drain over later calls
      let left = 0;
      for (const c of world.allChunks()) if (c.dirty) left++;
      if (left === 0) break;
      const rr = update(world, 2, 2, 2);
      for (const c of rr.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;
      if (++calls > 50) throw new Error('dirty chunks never drained');
    }
  });

  it('D: unload — after a teleport the old ring leaves the world, the new one streams in', () => {
    const world = new World();
    converge(world); // 125 chunks around (2,2)
    const r = update(world, 10, 10, 2);
    expect(r.unloaded.length).toBe(125); // every old chunk is >2 chunks from (10,10)
    expect(world.count()).toBe(2);       // only the two chunks loaded toward (10,10)
    expect(world.hasChunk(10, 10, 2)).toBe(true);
    expect(world.hasChunk(9, 10, 2)).toBe(true);
    expect(world.hasChunk(2, 2, 2)).toBe(false);
    expect(world.hasChunk(4, 4, 4)).toBe(false);
  });
});
```

Run: `npm test` → the new streaming suite fails (`Cannot find module '../streaming'`); the T2–T8 suites stay green. Expected red.

## Step 10.2 — Implement `src/streaming.ts`

```ts
import { chunkKey, type World } from './world';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from './terrain';

// One shared generator: streaming must reproduce T4/T9's terrain exactly, so it uses the
// same seeded generator (height/cave/tree functions are pure in world coordinates — any
// x/z generates; only y is band-limited to 0..79).
const GEN = new TerrainGen(TERRAIN_SEED);

export const VIEW_RADIUS = 2; // chunk radius in x/z: the ring is 5x5 columns
export const CY_MIN = 0;      // generated y band: 0..79
export const CY_MAX = 4;

const LOAD_BUDGET = 2;   // new chunk generations per call
const REMESH_BUDGET = 2; // dirty chunk rebuilds per call (main.ts performs the rebuild)

export interface Coord { cx: number; cy: number; cz: number }

export interface StreamingUpdate {
  rebuilt: Coord[];  // loaded (freshly generated) and dirty-remeshed chunks: main.ts calls
                     // rebuildChunkMesh on each, which clears the chunk's dirty flag
  unloaded: Coord[]; // removed from the world inside update(): main.ts only disposes scene meshes
}

/** (dx^2+dz^2) dominates x/z; |cy - pcy| orders levels; main.ts passes pcy = chunkOf(player.y). */
function score(c: Coord, pcx: number, pcz: number, pcy: number): number {
  const dx = c.cx - pcx, dz = c.cz - pcz;
  return (dx * dx + dz * dz) * 100 + Math.abs(c.cy - pcy);
}

function cmp(a: Coord, b: Coord, pcx: number, pcz: number, pcy: number): number {
  return score(a, pcx, pcz, pcy) - score(b, pcx, pcz, pcy) || a.cx - b.cx || a.cy - b.cy || a.cz - b.cz;
}

function inRange(cx: number, cz: number, pcx: number, pcz: number): boolean {
  return Math.abs(cx - pcx) <= VIEW_RADIUS && Math.abs(cz - pcz) <= VIEW_RADIUS;
}

/** Mark existing in-range neighbors of (cx,cy,cz) dirty: their culling is stale after a load/unload. */
function markNeighborsDirty(world: World, cx: number, cy: number, cz: number, pcx: number, pcz: number): void {
  const n: [number, number, number][] = [
    [cx + 1, cy, cz], [cx - 1, cy, cz],
    [cx, cy + 1, cz], [cx, cy - 1, cz],
    [cx, cy, cz + 1], [cx, cy, cz - 1],
  ];
  for (const [nx, ny, nz] of n) {
    const c = world.getChunk(nx, ny, nz);
    if (c && inRange(nx, nz, pcx, pcz)) c.dirty = true;
  }
}

/**
 * One streaming step around (pcx, pcy, pcz):
 *   1. loads:  closest missing chunks in the ring (<=2), filled with terrain immediately;
 *      each load marks its existing in-range neighbors dirty (their culling is stale);
 *   2. remesh: closest dirty chunks (<=2, excluding loads of this call, which main.ts
 *      rebuilds immediately anyway);
 *   3. unload: everything outside the ring (or outside the y band) leaves the world;
 *      their in-range neighbors are marked dirty first (newly exposed boundary faces).
 * Pure TS (no three) so vitest can drive it; main.ts turns the result into scene work.
 */
export function update(world: World, pcx: number, pcz: number, pcy = 2): StreamingUpdate {
  const rebuilt: Coord[] = [];
  const unloaded: Coord[] = [];
  const done = new Set<string>(); // keys rebuilt by this call; the remesh pass skips them

  const loads: Coord[] = [];
  for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
    for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
      for (let cy = CY_MIN; cy <= CY_MAX; cy++) {
        const cx = pcx + dx, cz = pcz + dz;
        if (!world.hasChunk(cx, cy, cz)) loads.push({ cx, cy, cz });
      }
    }
  }
  loads.sort((a, b) => cmp(a, b, pcx, pcz, pcy));
  for (const c of loads.slice(0, LOAD_BUDGET)) {
    world.ensureChunk(c.cx, c.cy, c.cz);
    generateChunkTerrain(world, GEN, c.cx, c.cy, c.cz); // fills data, sets dirty
    markNeighborsDirty(world, c.cx, c.cy, c.cz, pcx, pcz);
    rebuilt.push(c);
    done.add(chunkKey(c.cx, c.cy, c.cz));
  }

  const dirty: Coord[] = [];
  for (const c of world.allChunks()) {
    if (!c.dirty || done.has(chunkKey(c.cx, c.cy, c.cz))) continue;
    if (!inRange(c.cx, c.cz, pcx, pcz)) continue; // goes away with the unload pass below
    dirty.push(c);
  }
  dirty.sort((a, b) => cmp(a, b, pcx, pcz, pcy));
  for (const c of dirty.slice(0, REMESH_BUDGET)) {
    rebuilt.push(c);
    done.add(chunkKey(c.cx, c.cy, c.cz));
  }

  const doomed: Coord[] = [];
  for (const c of world.allChunks()) {
    if (!inRange(c.cx, c.cz, pcx, pcz) || c.cy < CY_MIN || c.cy > CY_MAX) doomed.push(c);
  }
  for (const c of doomed) {
    markNeighborsDirty(world, c.cx, c.cy, c.cz, pcx, pcz);
    world.removeChunk(c.cx, c.cy, c.cz);
    unloaded.push(c);
  }

  return { rebuilt, unloaded };
}
```

## Step 10.3 — Run the suite

```sh
npm test   # seven suites green (streaming: A–D); nothing else touched
```

## Step 10.4 — `src/main.ts` integration (seven exact replacements)

Apply to the file produced by T9 (each “before” block occurs exactly once; the blocks do not overlap — order does not matter):

**10.4.1 Imports** — before:

```ts
import { TERRAIN_SEED, TerrainGen, generateRegion } from './terrain';
```

after:

```ts
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from './terrain';
import * as streaming from './streaming';
```

**10.4.2 `rebuildChunkMesh` clears the dirty flag; add `removeChunkMesh` for unloads** — before:

```ts
  chunkObjs.set(key, entry);
}
// (T8 remeshes around edits via remeshAround; T10 reuses this for streaming loads/unloads.)
```

after:

```ts
  chunkObjs.set(key, entry);
  const ch = world.getChunk(cx, cy, cz);
  if (ch) ch.dirty = false; // T10: a rebuilt mesh is up to date; streaming only reschedules stale chunks
}
// (T8 remeshes around edits via remeshAround; T10's streaming drives loads/remeshes via
//  rebuildChunkMesh and unloads via removeChunkMesh below.)

/** T10: scene side of an unload — update() has already removed the chunk from the world. */
function removeChunkMesh(cx: number, cy: number, cz: number): void {
  const key = chunkKey(cx, cy, cz);
  const old = chunkObjs.get(key);
  for (const m of [old?.opaque, old?.trans]) {
    if (m) {
      scene.remove(m);
      m.geometry.dispose();
    }
  }
  chunkObjs.delete(key);
}
```

**10.4.3 World-state: full band → spawn column only** — before:

```ts
const gen = new TerrainGen(TERRAIN_SEED);
generateRegion(world, gen, 0, 0, 4, 4);
```

after:

```ts
// T10 streams the rest of the world on demand: only the spawn column is generated up front,
// so the measured-spawn scan below reads real terrain before the first frame. Streaming uses
// the same generator/seed, so this column is byte-identical to what it would generate later.
const gen = new TerrainGen(TERRAIN_SEED);
for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 2, cy, 2); // chunk column (2,·,2) covers world x/z 32..47 — contains spawn (33,41)
```

(the spawn-scan block immediately below is unchanged)

**10.4.4 Chunks-meshing: the static one-shot build goes away** — before:

```ts
// M4: static build of the initial 5x5x5 terrain band (one-shot, ~1 s at load;
// T10 replaces this with streaming loads/unloads around the player).
for (let cx = 0; cx <= 4; cx++)
  for (let cz = 0; cz <= 4; cz++)
    for (let cy = 0; cy <= 4; cy++) rebuildChunkMesh(cx, cy, cz);
```

after:

```ts
// T10: no static build — the streaming section keeps a 5x5 chunk ring (cy 0..4) around the
// player and generates/remeshes/unloads chunks as the player moves.
```

**10.4.5 Streaming section** — before:

```ts
// === streaming ===
// T10: replace the static build above with streaming.update(world, pcx, pcz, pcy) in the loop.
```

after:

```ts
// === streaming ===

// Per physics substep: stream the ring around the player. update() does the world side
// (generate new chunks, remove far ones); main.ts does the scene side (rebuild/dispose
// meshes). The 2 loads + 2 remeshes per call keep the frame cost bounded.
function tickStreaming(): void {
  const r = streaming.update(world, chunkOf(player.pos.x), chunkOf(player.pos.z), chunkOf(player.pos.y));
  for (const c of r.unloaded) removeChunkMesh(c.cx, c.cy, c.cz);
  for (const c of r.rebuilt) rebuildChunkMesh(c.cx, c.cy, c.cz);
}
```

**10.4.6 Loop: marker becomes the call** — before:

```ts
    player.update(STEP, readMove());
    // T10: streaming.update(world, pcx, pcz, pcy)
    if (player.pos.y < WORLD_Y_MIN) player.place(SPAWN); // fell out of the world (open cave / dug-away floor)
```

after:

```ts
    player.update(STEP, readMove());
    tickStreaming();
    if (player.pos.y < WORLD_Y_MIN) player.place(SPAWN); // fell out of the world (open cave / dug-away floor)
```

**10.4.7 Hint** — before:

```ts
  hint.textContent =
  'block-world T9 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · LMB break · RMB place (planks) · ESC release';
```

after:

```ts
  hint.textContent =
  'block-world T10 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · LMB break · RMB place (planks) · ESC release · world streams in around you';
```

Notes:
- `tickStreaming` is a function declaration, so its position (after the `player` binding in the camera section) only matters at call time — it runs inside the loop, long after `player` exists.
- `unloaded` chunks are disposed **before** `rebuilt` are rebuilt: the two lists are disjoint (rebuilt ⊆ in-range, unloaded ⊆ out-of-range), and unloading first keeps the scene from holding meshes for chunks the world no longer has.
- `WORLD_Y_MAX`/`WORLD_Y_MIN` and every other T8/T9 import stay in use — 10.4.1 only narrows the terrain import (`generateRegion` → `generateChunkTerrain`).

## Step 10.5 — Verify

Run (from `block-world/`):

```sh
npm test          # seven suites green (streaming: A–D)
npm run build     # tsc strict clean + vite bundle
npm run dev       # manual checklist, browser (no console errors)
```

Dev-server checklist:
1. **First paint:** ground appears progressively — spawn column nearly instantly (pre-generated, built on the first substep), immediate ring within ~0.3 s, far ring within ~1 s. No multi-second blank like T9's one-shot; you can walk within a second of load. Same terrain as T9 where you could see it (spawn shelf → shore → sea → trees).
2. **Walking:** stroll a long loop and circle the area: terrain keeps generating ≤32 m ahead of you (radius-2 ring); behind you chunks silently unload — you notice only if you fly back to the edge within a second or two.
3. **Teleport:** N noclip + fly several rings away (x≈16, x≈64, or beyond x=0 / x>80): the old ring unloads, a new one streams in over ~1 s. Since `heightAt` is defined for all x/z, **the world is effectively infinite horizontally** — only the y band (0..79) is an artificial edge.
4. **Interactions unchanged:** break a cell on a chunk seam (noclip level with x/z = 16·k, LMB) — both sides remesh instantly (T8's `remeshAround`); place planks; RMB underwater fills a water cell; swim the shore exactly as in T9.
5. **Transient ghosts:** during a teleport, stale boundary faces at the streaming edge last only a few frames (loads/unloads dirty their neighbors; the 2-per-call remesh drains it) — stand still for ~1 s and the scene is stable: no flicker, no permanently missing faces, no ghost walls.
6. **Known POC edges:** beyond the ring you see boundary walls against ungenerated chunks (≥32 m away); below y=0 the slab bottom floats over void; falling past y=−32 still respawns at SPAWN.
7. No console errors; 60 fps while streaming continuously (≤2 terrain fills + ≤2 remeshes per substep, each millisecond-scale); no stutter growth after a few minutes of walking (no mesh/geometry leaks).

Failure modes → likely cause:
- Empty view or the ground never converges → `tickStreaming` missing from the substep loop, or the load scan's radius/cy band drifted from `VIEW_RADIUS`/`CY_MIN..CY_MAX` (the pre-generated spawn column alone is never enough — the ring must fill).
- Player starts inside solid or falls on load → the 10.4.3 spawn-column pre-generation is missing or not column (2)×(2) — the spawn scan then reads Air from missing chunks and SPAWN lands near y=0.
- Permanent ghost faces or missing walls at chunk borders → `markNeighborsDirty` dropped from the load or unload pass, or `rebuildChunkMesh` no longer clears `dirty` (symptom: the remesh budget re-serves already-fresh chunks, so farther chunks never get built and the ring converges sluggishly).
- World visibly "eats" itself behind the player every step → unload radius smaller than the load radius (tolerance must be `> VIEW_RADIUS`, not `>= VIEW_RADIUS + 1` off-by-one), or unload fired for in-range chunks.
- Memory/draw-call growth over time → `removeChunkMesh` not deleting the `chunkObjs` entry or forgetting `geometry.dispose()` (leak).
- Frame spikes while crossing ring edges → the per-call budget changed (must be 2 loads + 2 remeshes) or `update()` moved out of the substep loop.

## Step 10.6 — Commit

```sh
git add -A . && git commit -m "T10: chunk streaming (5x5x5 ring around the player, 2+2 per-substep budget)"
```

> With T10 done, **M5** from the overview is met: the terrain world streams in lazily around the player — no one-shot band, and walking is unbounded in x/z for as far as the noise is defined. (T11–T13 add the hotbar/palette UI, underwater FX, and the final polish/verification pass.)

---

# Task 11 — `src/ui.ts`: hotbar + palette (creative quick-select) (M5)

**Files:** create `src/ui.ts`; create `src/__tests__/ui.test.ts`; modify `src/main.ts` (eight exact replacements, step 11.6), `index.html` (step 11.4), `src/ui.css` (two small edits, step 11.5).

Design notes:
- **`Hotbar` is data-only** (in `src/ui.ts`): nine slot values, the current selection index, and two optional change callbacks. All DOM lives in `main.ts`, so the class stays node-testable (zero `document` references). The nine `.slot` divs were pre-placed in `index.html` at T1, so T11 only paints icons into them and wires clicks.
- **Icons are atlas crops, not images:** each slot's `background-image` is the whole 256×256 atlas as a data URL, scaled to `16·px` (px = slot box minus 4px of border) with `background-position` offset to the block's top-row tile column (`iconTile(b) % 16` — the same tile the mesh top face shows, so the icon matches what you place). Nearest filtering keeps the 16px art crisp at 40/44px.
- **Selection paths** (all funnel through `hotbar.select`): keys `1`–`9` (top row *and* numpad), the mouse wheel over the canvas (scroll down = next slot, up = previous, both wrap), and the palette (`E`): clicking a palette tile assigns that block to the *currently selected* hotbar slot; the palette stays open, so you can fill several slots in one sitting.
- **Palette = open-creative state:** `E` toggles it. Opening releases pointer lock (crosshair + hitbox hide via the existing `pointerlockchange` handler); closing (via `E` or a canvas click) re-requests the lock. Browsers enforce a ~1 s re-lock cooldown after ESC, so the first click right after closing can land on the canvas without re-locking — a second click works (inherent, accepted POC behavior).
- **`selectedBlock` is retired** (T8's single-block shortcut): placing now reads `hotbar.block` — the selected slot's block. The default selection is Planks (index 7 in `PLACEABLE`), so T8's "RMB places planks" behavior is preserved out of the box.

## Step 11.1 — Write the failing test first: `src/__tests__/ui.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { Block } from '../blocks';
import { Hotbar } from '../ui';

describe('A — Hotbar construction', () => {
  it('keeps a full nine-slot default list as-is', () => {
    const h = new Hotbar([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(h.slots).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(h.selected).toBe(0);
    expect(h.block).toBe(1);
  });

  it('trims longer lists to nine', () => {
    expect(new Hotbar(Array.from({ length: 15 }, (_, i) => i)).slots).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('pads shorter lists with their first slot', () => {
    expect(new Hotbar([Block.Glass]).slots).toEqual(Array(9).fill(Block.Glass));
  });

  it('falls back to stone slots for an empty list', () => {
    const h = new Hotbar([]);
    expect(h.slots).toEqual(Array(9).fill(Block.Stone));
    expect(h.selected).toBe(0);
    expect(h.block).toBe(Block.Stone);
  });
});

describe('B — Hotbar selection', () => {
  it('wraps both ways and no-ops a repeat select', () => {
    const h = new Hotbar(Array(9).fill(1));
    const seen: number[] = [];
    h.onSelectChange = (i) => seen.push(i);
    h.select(11); // 11 % 9 -> 2
    h.select(2); // already selected: no event
    h.select(-1); // ((-1) % 9 + 9) % 9 -> 8
    expect(h.selected).toBe(8);
    expect(h.block).toBe(1);
    expect(seen).toEqual([2, 8]);
  });
});

describe('C — Hotbar wheel cycling', () => {
  it('cycles forward and backward across the wrap', () => {
    const h = new Hotbar(Array(9).fill(1));
    const seen: number[] = [];
    h.onSelectChange = (i) => seen.push(i);
    h.select(8);
    h.cycle(1); // 8 -> 0
    h.cycle(-1); // 0 -> 8
    h.select(3);
    h.cycle(1); // 3 -> 4
    h.cycle(5); // only the sign matters: 4 -> 5
    expect(h.selected).toBe(5);
    expect(seen).toEqual([8, 0, 8, 3, 4, 5]);
  });
});

describe('D — Hotbar slot assignment (palette click)', () => {
  it('wraps the slot index and reports the written value', () => {
    const h = new Hotbar(Array(9).fill(1));
    const writes: [number, number][] = [];
    h.onSlotChange = (i) => writes.push([i, h.slots[i]]);
    h.setSlot(11, 42); // 11 % 9 -> slot 2
    expect(h.slots[2]).toBe(42);
    expect(writes).toEqual([[2, 42]]);
    h.select(2);
    expect(h.block).toBe(42);
  });
});
```

## Step 11.2 — Implement `src/ui.ts` to make it pass

```ts
import { Block } from './blocks';

export const SLOTS = 9;

// Data-only: no DOM here (main.ts owns the DOM side), which keeps this node-testable.
export class Hotbar {
  slots: number[];
  selected = 0;
  onSelectChange?: (index: number) => void;
  onSlotChange?: (index: number) => void;

  constructor(defaults: number[]) {
    // pad short lists with their first slot, trim long ones, fall back to stone when empty
    this.slots = Array.from({ length: SLOTS }, (_, i) => defaults[i] ?? defaults[0] ?? Block.Stone);
    if (defaults.length > SLOTS) this.slots.length = SLOTS;
  }

  // The block to place: whatever sits in the selected slot.
  get block(): number {
    return this.slots[this.selected];
  }

  select(i: number): void {
    const n = ((i % SLOTS) + SLOTS) % SLOTS; // wrap both directions
    if (n === this.selected) return; // repeat is a no-op (key mashing / held wheel)
    this.selected = n;
    this.onSelectChange?.(n);
  }

  cycle(dir: number): void {
    this.select(this.selected + (dir >= 0 ? 1 : -1));
  }

  setSlot(i: number, b: number): void {
    const n = ((i % SLOTS) + SLOTS) % SLOTS;
    this.slots[n] = b;
    this.onSlotChange?.(n);
  }
}
```

## Step 11.3 — Run the tests

```sh
npm test          # eight suites green (ui: A–D)
```

`ui.ts` touches no DOM, so the node-only test environment is unaffected.

## Step 11.4 — `index.html`: populate the two containers

**11.4.1 Hotbar + palette** — before:

```html
    <div id="hotbar" class="hidden"></div>
    <div id="palette" class="hidden"></div>
```

after:

```html
    <div id="hotbar" class="hidden">
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
    </div>
    <div id="palette" class="hidden">
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
      <div class="slot"></div>
    </div>
```

## Step 11.5 — `src/ui.css`: two small edits

**11.5.1 Slot rule: drop the hard-coded atlas size** (T11 sets image/size/position inline per slot) — before:

```css
#hotbar .slot,
#palette .slot {
  border: 2px solid rgba(255, 255, 255, .25);
  border-radius: 6px;
  background-repeat: no-repeat;
  background-size: 256px 256px; /* full atlas; per-slot background-position offsets to its tile */
}
```

after:

```css
#hotbar .slot,
#palette .slot {
  border: 2px solid rgba(255, 255, 255, .25);
  border-radius: 6px;
  background-repeat: no-repeat;
  /* T11 sets image/size/position inline per slot (atlas-crop icons) */
}
```

**11.5.2 Collapse the palette rule** — before:

```css
#hotbar .slot { width: 44px; height: 44px; }
#palette .slot { width: 48px; height: 48px; }
#palette .slot { cursor: pointer; }
```

after:

```css
#hotbar .slot { width: 44px; height: 44px; }
#palette .slot { width: 48px; height: 48px; cursor: pointer; }
```

## Step 11.6 — `src/main.ts`: eight exact replacements

**11.6.1 Import: placeables + icon tile** — before:

```ts
import { Block, isOpaque } from './blocks';
```

after:

```ts
import { Block, isOpaque, PLACEABLE, iconTile } from './blocks';
```

**11.6.2 Import: Hotbar** — before:

```ts
import * as streaming from './streaming';
```

after:

```ts
import * as streaming from './streaming';
import { Hotbar } from './ui';
```

(`SLOTS` is deliberately *not* imported into `main.ts` — the loops key off `hotbar.slots` / the `.slot` children, never off `SLOTS`.)

**11.6.3 Keydown: palette toggle + slot keys** — before:

```ts
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'KeyF') player.fly = !player.fly;         // fly toggle
  if (e.code === 'KeyN') player.noclip = !player.noclip;   // noclip toggle (T13 adds KeyC here)
});
```

after:

```ts
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'KeyF') player.fly = !player.fly; // fly toggle
  if (e.code === 'KeyN') player.noclip = !player.noclip; // noclip toggle (T13 adds KeyC here)
  if (e.code === 'KeyE') togglePalette(); // creative palette: open (unlock) / close (re-lock)
  const d = e.code.startsWith('Digit') ? e.code.slice(5) : e.code.startsWith('Numpad') ? e.code.slice(6) : '';
  if (d >= '1' && d <= '9') hotbar.select(Number(d) - 1); // 1-9 / numpad 1-9 selects a slot
});
```

(the aligned comments collapse to single spaces; the `T13 adds KeyC` marker survives until T13 inserts its line.)

**11.6.4 Canvas click: palette-aware** — before:

```ts
// Click the canvas to pointer-lock (then WASD + mouse steer the character); ESC releases.
renderer.domElement.addEventListener('click', () => {
  const r = renderer.domElement.requestPointerLock() as unknown;
  if (r instanceof Promise) r.catch(() => {}); // Safari rejects without a user gesture
});
```

after:

```ts
// Click the canvas: close the palette if it is open, otherwise pointer-lock (WASD + mouse steer; ESC releases).
renderer.domElement.addEventListener('click', () => {
  if (paletteOpen) closePalette();
  else lockPointer();
});
```

**11.6.5 Actions header: retire `selectedBlock`** — before:

```ts
// === actions ===

// T8: crosshair break (LMB) / place (RMB). T11 replaces this single block with hotbar selection.
let selectedBlock = Block.Planks;
```

after:

```ts
// === actions ===

// T8: crosshair break (LMB) / place (RMB); the placed block comes from the selected hotbar slot (T11).
```

**11.6.6 Place uses the selected slot** — before:

```ts
    world.setBlock(tx, ty, tz, selectedBlock);
```

after:

```ts
    world.setBlock(tx, ty, tz, hotbar.block);
```

**11.6.7 Insert the `// === ui ===` section before the streaming section** — before:

```ts
// === streaming ===

// Per physics substep: stream the ring around the player.
```

after:

```ts
// === ui ===

// T11: hotbar (bottom, display-only) + palette (top-right, click targets). The nine `.slot`
// divs are pre-placed in index.html; each is painted with the atlas crop of the block it holds.
const PALETTE_BLOCKS = [...PLACEABLE];
const hotbar = new Hotbar(PALETTE_BLOCKS);
const atlasURL = atlasCanvas.toDataURL();

// Crop the block's top-row tile into a `px`-sized icon: full atlas scaled 16·px wide, shifted
// to the tile column (iconTile — same tile as the mesh top face). Nearest keeps it crisp.
function placeIcon(el: HTMLElement, b: number, px: number): void {
  el.style.backgroundImage = `url(${atlasURL})`;
  el.style.backgroundSize = `${px * 16}px ${px * 16}px`;
  el.style.backgroundPosition = `-$((iconTile(b) % 16) * px}px 0px`;
  el.title = String(Block[b]);
}

const hotbarEl = document.getElementById('hotbar')!;
const paletteEl = document.getElementById('palette')!;
const hotbarSlotEls = Array.from(hotbarEl.children) as HTMLElement[];
const paletteSlotEls = Array.from(paletteEl.children) as HTMLElement[];

hotbarSlotEls.forEach((el, i) => placeIcon(el, hotbar.slots[i], 40)); // 44px box minus 2px border each side
hotbarEl.classList.remove('hidden');
paletteSlotEls.forEach((el, i) => {
  placeIcon(el, PALETTE_BLOCKS[i], 44); // 48px box minus 2px border each side
  el.addEventListener('click', () => hotbar.setSlot(hotbar.selected, PALETTE_BLOCKS[i])); // the arrow reads the *current* selection
});

hotbar.onSelectChange = (i) => {
  hotbarSlotEls.forEach((el, j) => el.classList.toggle('sel', j === i));
};
hotbar.onSlotChange = (i) => {
  placeIcon(hotbarSlotEls[i], hotbar.slots[i], 40); // the palette wrote into a slot
};

let paletteOpen = false;

// Browsers enforce a ~1 s re-lock cooldown after ESC; a rejected request is benign
// (the cooldown is the only realistic failure), so swallow it rather than throw.
function lockPointer(): void {
  const r = renderer.domElement.requestPointerLock() as unknown;
  if (r instanceof Promise) r.catch(() => {}); // Safari rejects without a user gesture
}

function closePalette(): void {
  paletteEl.classList.add('hidden');
  paletteOpen = false;
  lockPointer();
}

function togglePalette(): void {
  if (paletteOpen) {
    closePalette();
  } else {
    paletteOpen = true;
    paletteEl.classList.remove('hidden');
    document.exitPointerLock(); // crosshair + hitbox hide via the existing pointerlockchange handler
  }
}

// Callbacks are wired above, so this initial select lights the .sel border.
hotbar.select(PALETTE_BLOCKS.indexOf(Block.Planks)); // default: planks, as T8's selectedBlock was

// Wheel cycles the hotbar (down = next slot); while the palette is open the wheel is left alone.
window.addEventListener(
  'wheel',
  (e) => {
    if (paletteOpen) return;
    hotbar.cycle(e.deltaY > 0 ? 1 : -1);
  },
  { passive: true },
);

// === streaming ===

// Per physics substep: stream the ring around the player.
```

**11.6.8 Hint** — before:

```ts
  hint.textContent =
  'block-world T10 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · LMB break · RMB place (planks) · ESC release · world streams in around you';
```

after:

```ts
  hint.textContent =
  'block-world T11 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · E palette · 1-9/wheel select · LMB break · RMB place · ESC release · world streams in around you';
```

## Step 11.7 — Verify

Run (from `block-world/`):

```sh
npm test          # eight suites green (ui: A–D)
npm run build     # tsc strict clean + vite bundle
npm run dev       # manual checklist, browser (no console errors)
```

Dev-server checklist:
1. **Hotbar:** a nine-slot bar at bottom center, each slot holding one crisp 16px icon in `PLACEABLE` order (grass, stone, dirt, sand, wood, leaves, glass, planks, water); the planks slot (eighth) carries the gold `.sel` border on load.
2. **Keys:** `1`–`9` on the top row *and* Numpad1–9 move the gold selection; holding a digit key never re-triggers (`e.repeat` guard).
3. **Wheel:** scrolling over the canvas walks the hotbar one slot per notch, wrapping 8→0 and 0→8.
4. **Place follows selection:** RMB, while walking the slots, places the selected block (grass → … → glass → planks → water): glass renders translucent, water fills an air cell; LMB still breaks solids (water stays unbreakable).
5. **Open the palette (E):** pointer lock releases (crosshair + hitbox hide); a 3×3 grid of all nine blocks appears at top right.
6. **Assign:** clicking a palette tile writes it into the *currently selected* hotbar slot (that slot's icon updates) and the palette stays open; select another slot, click another tile, and so on.
7. **Close (E or canvas click):** the palette hides and pointer re-locks. (The first click right after ESC can land inside the browser's ~1 s re-lock cooldown and do nothing — click once more; that is expected.)
8. While the palette is open the hotbar is display-only (events pass through to the canvas) and the wheel cycles it only after the palette closes.

Failure modes → likely cause:
- Icons blurred or offset by a tile → `backgroundSize`/`backgroundPosition` math (scale `px·16`, offset `−(iconTile % 16)·px`, px = box width − 4: 40 for the 44px hotbar box, 44 for the 48px palette box), or `background-repeat: no-repeat` dropped in the 11.5.1 edit.
- Slots render blank → `index.html` missing its nine `.slot` children (step 11.4) — `Array.from(el.children)` silently gets fewer elements.
- Always places planks (or keys/wheel do nothing) → `selectedBlock` still referenced (11.6.5/11.6.6 missed), or the `Hotbar` import / `hotbar` binding missing (11.6.2).
- Gold border never moves (or moves to the wrong slot) → `onSelectChange` wired *after* the initial `hotbar.select` (11.6.7 wires it first on purpose), or the `.sel` rule lost in the 11.5 edits.
- Wheel cycles the hotbar while the palette is open → `paletteOpen` guard missing from the wheel listener.
- Canvas click re-locks on top of the open palette → the click handler checks `lockPointer()` before `paletteOpen`.
- Unhandled Promise rejection on click → the `as unknown` / `instanceof Promise` / `.catch` trio dropped from `lockPointer` (11.6.7).
- First click after closing the palette appears dead → the ~1 s re-lock cooldown, not a bug: click again.

## Step 11.8 — Commit

```sh
git add -A . && git commit -m "T11: hotbar + palette (atlas-crop icons, E / 1-9 / wheel selection)"
```

> With T11 done, **M5** from the overview (D11: streaming *and* UI) is fully met: a world that streams in around the player plus the in-game UI to build with it — PROJECT.md §13 #5, "this is where it becomes a game". T12 adds the water mood (M6); T13 is the final polish + verification pass.

---

# Task 12 — Underwater FX in `src/main.ts` (fog / background / FOV swap on submersion) (M6)

**Files:** modify `src/main.ts` only (four exact replacements, steps 12.1–12.4). No new module, no new tests — `player.headInWater` (T7) already samples the eye voxel on every physics step, so this task is pure wiring in `main.ts`.

Design notes:
- **Head-driven, not body-driven:** the swap keys off `player.headInWater` (the *eye* voxel is water). Standing in a 1 m pool you stay in the air mood; once your head goes under, the whole scene reads as water on the very next frame.
- **Swapped as a set, every frame:** `syncWaterFx()` compares the current mood with the last applied one and returns early when stable — background, fog, and FOV all change together on the frame of submersion (and back on surfacing), never one per frame.
- **The values:** air = sky-blue background + a faint `FogExp2(0.004)` that only softens the far distance; water = deep blue (`0x0a2a55`) background + `FogExp2(0.35)` fog that collapses visibility to a few meters, plus a slight FOV squeeze 70 → 62 so the tunnel feel sells "underwater". `camera.updateProjectionMatrix()` is what actually applies a `camera.fov` change.
- **No material changes:** POC water stays a static translucent block per §9 scope — ripples, caustics, god rays are post-POC (§15).

## Step 12.1 — Scene: two moods + base fog

before:

```ts
const scene = new THREE.Scene();
const BG_AIR = 0x87ceeb; // T12 reuses this (air/underwater background + fog swap)
scene.background = new THREE.Color(BG_AIR);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 512);
```

after:

```ts
const scene = new THREE.Scene();
// T12: two "moods" — air (sky blue, faint distance fog) vs water (deep blue, dense fog).
const BG_AIR = new THREE.Color(0x87ceeb);
const BG_WATER = new THREE.Color(0x0a2a55);
const FOG_AIR = new THREE.FogExp2(0xcfe8ff, 0.004);
const FOG_WATER = new THREE.FogExp2(0x0a2a55, 0.35);
scene.background = BG_AIR;
scene.fog = FOG_AIR;
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 512);
const FOV_AIR = 70; // must equal the perspective camera fov above
const FOV_WATER = 62;
```

## Step 12.2 — Water-FX section: the mood swap

before:

```ts
// === water-fx ===
// T12: underwater fog / background / FOV swap driven by player.headInWater.
```

after:

```ts
// === water-fx ===

// T12: when the eye voxel is water, the whole scene swaps to the water mood — background,
// fog, and a slight FOV squeeze, in one frame, in both directions. Driven by
// player.headInWater (T7 samples it each physics step); called per frame below.
let waterFx: 'air' | 'water' = 'air';
function syncWaterFx(): void {
  const m: 'air' | 'water' = player.headInWater ? 'water' : 'air';
  if (m === waterFx) return; // stable: one swap per (de)submersion, not per frame
  waterFx = m;
  scene.background = m === 'water' ? BG_WATER : BG_AIR;
  scene.fog = m === 'water' ? FOG_WATER : FOG_AIR;
  camera.fov = m === 'water' ? FOV_WATER : FOV_AIR;
  camera.updateProjectionMatrix(); // a fov change only reaches the GPU via this call
}
```

## Step 12.3 — Loop: sync the mood before render

before:

```ts
  syncCamera();
  updateHitbox();
  renderer.render(scene, camera);
```

after:

```ts
  syncCamera();
  updateHitbox();
  syncWaterFx();
  renderer.render(scene, camera);
```

## Step 12.4 — Hint

before:

```ts
  hint.textContent =
  'block-world T11 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · E palette · 1-9/wheel select · LMB break · RMB place · ESC release · world streams in around you';
```

after:

```ts
  hint.textContent =
  'block-world T12 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · E palette · 1-9/wheel select · LMB break · RMB place · ESC release · world streams in around you';
```

Notes:
- `syncWaterFx()` sits in `frame()` next to `syncCamera()`/`updateHitbox()` — once per rendered frame, after all substeps, not inside the substep `while`.
- `scene.fog` re-assigns the *same* `FogExp2` object back and forth; three.js reads its parameters on every render, so scene-wide fog needs no per-material touch-up.

## Step 12.5 — Verify

Run (from `block-world/`):

```sh
npm test          # eight suites green (no new suite — T12 is main.ts-only wiring)
npm run build     # tsc strict clean + vite bundle
npm run dev       # manual checklist, browser (no console errors)
```

Dev-server checklist:
1. **Head-driven:** stand in a 1 m-deep pool with your head above the surface → still the air mood (sky blue, faint far fog). Dive (or use F) until the eye voxel is water → the swap lands on that frame.
2. **Both directions, same frame:** swim up through the surface → air mood returns the instant you surface; treading at the surface shows no flicker (the swap is edge-triggered by `headInWater`, which is one stable state per substep).
3. **Density is felt:** underwater, `FogExp2(0.35)` collapses the view to a few meters — distant terrain dissolves into deep blue, and the background behind void matches that deep blue, so world edges no longer read as sky.
4. **FOV squeeze:** 70° → 62° is subtle but visible close-up (the tunnel narrows); the view widens back on surfacing.
5. **Air unchanged:** on land the scene is indistinguishable from T11 (same sky hue; the `0.004` fog only softens distances near the streaming radius).
6. **No perf cost:** 60 fps while swimming continuously (the swap is two object assignments + one projection-matrix update per change, not per frame).

Failure modes → likely cause:
- Swap lags by several frames, or triggers on body only → keyed on `player.inWater`/`bodyInWater` instead of `player.headInWater`, or `syncWaterFx` runs once at boot instead of inside `frame()`.
- Only the background changes → the `scene.fog = FOG_…` (and `camera.fov` + `updateProjectionMatrix()`) lines are missing from the swap.
- FOV visibly never changes → `camera.updateProjectionMatrix()` missing after the `camera.fov` assignment.
- Land stays tinted/foggy after a swim → `waterFx` initialized to `'water'` (latched) or the early-return comparison inverted so the air branch never runs.
- Air-side fog looks heavy → `FOG_AIR` density is not the faint `0.004` (the two constants got swapped).

## Step 12.6 — Commit

```sh
git add -A . && git commit -m "T12: underwater FX (fog/background/FOV swap on camera submersion)"
```

> With T12 done, PROJECT.md §13 #7 (water rendering, submersion fog, swimming) is met at POC fidelity: swim physics landed in T7, static translucent water in T6, and the submersion mood here. Ripples/caustics/god rays are post-POC (§15). T13 is the final polish + verification pass.

---

# Task 13 — Final polish + verification pass (C = wireframe debug) (M6/M12)

**Files:** modify `src/main.ts` only (three exact replacements, steps 13.1–13.3). The heavy step is the 13.4 verification sweep — run it against the full build, because several checklist items span T5–T12.

Design notes:
- **`C` closes PROJECT.md §14 trap #1** ("chunk boundary bugs"): a global wireframe makes seams, missing/duplicate faces, and stray geometry visible at a glance. The mesher shares two materials across *every* chunk mesh, so `matOpaque.wireframe` / `matTrans.wireframe` flip the whole world with two flags; per-chunk box outlines are a post-POC nicety.
- **Everything else is already built:** AO/face-shade (the D4 payoff) was baked in T5, so its §13 #6 milestone is a *visual* verification step here, not new code; fly/noclip are T7's; T13 adds only the debug key, the final hint line, and the full gate (all suites + build + production preview).

## Step 13.1 — `src/main.ts`: the `// === debug ===` section

before:

```ts
// === debug ===
// T13: C = chunk-wireframe / AO demo scene (F fly / N noclip toggles live in the T7 input section).
```

after:

```ts
// === debug ===

// PROJECT.md §14 trap #1: chunk-boundary bugs. A global wireframe pass makes seams,
// missing/duplicate faces, and stray geometry visible at a glance. The two mesher
// materials are shared by every chunk mesh, so two flags flip the whole world
// (per-chunk box outlines are a post-POC nicety).
let wireframeOn = false;
function setWireframe(on: boolean): void {
  wireframeOn = on;
  matOpaque.wireframe = on;
  matTrans.wireframe = on;
}
```

## Step 13.2 — `src/main.ts`: bind the C key (and drop the T13 marker)

before (the T11 11.6.3 result):

```ts
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'KeyF') player.fly = !player.fly; // fly toggle
  if (e.code === 'KeyN') player.noclip = !player.noclip; // noclip toggle (T13 adds KeyC here)
  if (e.code === 'KeyE') togglePalette(); // creative palette: open (unlock) / close (re-lock)
  const d = e.code.startsWith('Digit') ? e.code.slice(5) : e.code.startsWith('Numpad') ? e.code.slice(6) : '';
  if (d >= '1' && d <= '9') hotbar.select(Number(d) - 1); // 1-9 / numpad 1-9 selects a slot
});
```

after:

```ts
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'KeyF') player.fly = !player.fly; // fly toggle
  if (e.code === 'KeyN') player.noclip = !player.noclip; // noclip toggle
  if (e.code === 'KeyE') togglePalette(); // creative palette: open (unlock) / close (re-lock)
  if (e.code === 'KeyC') setWireframe(!wireframeOn); // wireframe (PROJECT.md §14: chunk-edge bugs)
  const d = e.code.startsWith('Digit') ? e.code.slice(5) : e.code.startsWith('Numpad') ? e.code.slice(6) : '';
  if (d >= '1' && d <= '9') hotbar.select(Number(d) - 1); // 1-9 / numpad 1-9 selects a slot
});
```

## Step 13.3 — `src/main.ts`: final hint (drop the task tag)

before (the T12 12.4 result):

```ts
  hint.textContent =
  'block-world T12 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · E palette · 1-9/wheel select · LMB break · RMB place · ESC release · world streams in around you';
```

after:

```ts
  hint.textContent =
  'block-world — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · C wireframe · E palette · 1-9/wheel select · LMB break · RMB place · world streams in around you · ESC release';
```

## Step 13.4 — Final verification sweep

Run (from `block-world/`) — the primary gate is the **production** bundle; `npm run dev` is expected to be identical, but `preview` proves the bundle that actually ships:

```sh
npm test          # all eight suites green: blocks, world, terrain, chunk-mesher, player, raycast, streaming, ui
npm run build     # tsc strict clean + vite bundle
npm run preview   # serves the production bundle; run the checklist against IT (no console errors)
```

Full POC checklist (against `npm run preview`):
1. **AO / face shade (the D4 payoff, §13 #6):** dig a pit or fly up to stacked features — recessed corners, shaded pyramid sides, tree canopy undersides all read with baked AO; press C to confirm the faces carrying it.
2. **Chunk seams (§14 trap #1):** with C on, stand at a seam (x or z = 16·k) and sweep the border — no missing-face ghosts, no double quads, no z-fight flicker on either side; LMB a cell on the seam → both sides remesh in place.
3. **Negative coordinates:** noclip-fly to x<0 or z<0 terrain — same generation quality, materials, AO, and streaming behavior (the noise is defined for all x/z).
4. **Streaming soak:** walk/fly continuously for ≥ 1 min including 2–3 teleports across rings; `renderer.info` (logged to the console a few times) stays flat — no geometry growth, no slow-down creep.
5. **Water end-to-end:** swim the sea (T7 clamps); place water from the hotbar into a dug hole; stand in a 1 m pool (eye above surface → air mood) vs 2 m (eye underwater → water mood: fog + background + FOV, T12); see through glass correctly.
6. **Full UI loop:** 1–9 / numpad / wheel selection; E opens the palette (unlocks), assign 2–3 blocks into slots, close via E or canvas click (expect the ~1 s re-lock cooldown on the first click — click again), then place each assigned block including glass and water.
7. **Edge cases:** fall out of the world (dug floor) → respawn on the generated surface; placing into your own cell is blocked without N (allowed with); pitch clamps at the horizon; ESC never leaves stuck keys.
8. **Atlas hygiene:** no texture bleed at tile or slot-icon edges; all 11 tiles draw; zero three.js console warnings.
9. **Performance:** 60 fps in open terrain *and* in dense underwater fog; a long soak holds 60 fps.
10. **Parity:** `preview` (production bundle) shows exactly what `dev` showed — same spawn, same streaming, same UI.

## Step 13.5 — Commit

```sh
git add -A . && git commit -m "T13: final polish (C wireframe debug, hint) + full verification pass"
```

> **POC complete.** Every milestone in the overview map is met (D11): T6 = M1; T7/T8 = M2/M3; T9 = M4; T10/T11 = M5; T12 = M6 (water FX); T13 = M6 (visual polish per D4) + M12 (the verification gate). PROJECT.md §13 #1–#8 all hold — #6's AO is T5's bake (visually verified here); #8's fly is T7's, trees are T4's, and frustum culling is three.js' per-mesh culling plus the streaming radius and this pass's polish. The POC boundaries stay exactly as the D-list fixed them: static translucent water, the y 0..79 terrain slab (D6), the 5×5×5 streaming ring (D11 budget), no persistence (D10). Everything beyond — ripples/caustics, per-chunk debug boxes, saves, more biomes — is post-POC (PROJECT.md §15).