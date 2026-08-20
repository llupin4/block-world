# Dynamic Lighting with Light Levels — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two 0–15 integer light fields (block light + skylight) propagated locally through the voxel grid, baked per-vertex into chunk meshes, with day/night handled by a per-frame `uDayness` uniform — replacing the global `worldDim` material dim.

**Architecture:** `src/light.ts` mirrors `src/water.ts`'s proven shape (world-coord `Set<string>` queue, `tick(budget)`, an `edit()` hook, load-time bounded `settle`, an accumulating `touched` set). Every queued cell re-derives both fields from `max(emission, max neighbor − 1 − O(neighbor))`; player edits, chunk loads, and chunk unloads are the only seeds. The mesher bakes a new 2-component `aLight` vertex attribute (levels /15); the two chunk `MeshBasicMaterial`s get a small `onBeforeCompile` injection so night fades are O(1) uniforms, never re-bakes.

**Tech Stack:** TypeScript strict, three.js `0.166.1`, Vite, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-19-dynamic-lighting-design.md` (approved 2026-08-19). Baseline: 123 passing tests, clean build.

**House rules (every task):**

- TDD: failing test → red run → minimal implementation → green run → full `npm test` → `npm run build` → commit (exact messages given).
- `npm run build` = `tsc --noEmit && vite build`. The only expected build output aside from success is the pre-existing >500 kB chunk-size warning.

**Y-band ground truth (used throughout):** the generated band is `y ∈ [0, 79]` — streaming `CY_MIN = 0` … `CY_MAX = 4` (16-block chunks per axis; `src/streaming.ts:10-11`). `world.getChunk` returns `undefined` outside the band, so **chunk-existence is the range check** — no y-constants in the light code except `CY_MAX` (imported from `src/streaming.ts`) for the column walk's top. Cell y ≥ 64 is placeable-void (placement caps at `WORLD_Y_MAX = 64`) but the light field still exists there (torch at 63 lights up into it).

---

### Task 1: Registry `light` + `opacity` fields

**Files:**
- Modify: `src/blocks.ts` (interface at :20-27, entries at :30-44)
- Test: `src/__tests__/blocks.test.ts` (append)

- [ ] **Step 1: Write the failing test** (append to the bottom of `src/__tests__/blocks.test.ts`, inside/after the existing `describe` — match the file's import style; it already imports from `'../blocks'`):

```ts
it('light fields: torch emits 14, nothing else emits; opacity: air/torch 0, glass 1, leaves/water 2, other solid + closed door 15 (open door via lightOpacity, not the registry)', () => {
  const table: [number, number, number][] = [
    // [block, light, opacity]
    [Block.Air, 0, 0],
    [Block.Stone, 0, 15], [Block.Dirt, 0, 15], [Block.Grass, 0, 15],
    [Block.Sand, 0, 15], [Block.Wood, 0, 15], [Block.Planks, 0, 15],
    [Block.Water, 0, 2],
    [Block.Leaves, 0, 2],
    [Block.Glass, 0, 1],
    [Block.Torch, 14, 0],
    [Block.DoorBottom, 0, 15], [Block.DoorTop, 0, 15], // registry default: the closed state (open is meta-dependent via lightOpacity)
  ];
  for (const [b, light, opacity] of table) {
    expect(BLOCKS[b].light, `light @ ${b}`).toBe(light);
    expect(BLOCKS[b].opacity, `opacity @ ${b}`).toBe(opacity);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/blocks.test.ts`
Expected: FAIL — `BLOCKS[Block.Air].light` is `undefined ≠ 0` (type error in tsc too: `light`/`opacity` don't exist on `BlockDef`).

- [ ] **Step 3: Implement** — `src/blocks.ts`:

Add to the `BlockDef` interface (after the `transparent` line, :23):

```ts
  light: number;         // block-light emission, 0..15 (0 = emits nothing; torch 14). Read by src/light.ts at seed time.
  opacity: number;       // extra light attenuation paid when light EXITS this cell: 0 air-like, 1 glass, 2 leaves/water, 15 nothing passes. Doors are meta-dependent via lightOpacity() (closed = 15, open = 0).
```

Add the two fields to every registry entry (:31-43) per the test table (Air `light: 0, opacity: 0`; the six opaque solids + both door ids `light: 0, opacity: 15`; Water/Leaves `light: 0, opacity: 2`; Glass `light: 0, opacity: 1`; Torch `light: 14, opacity: 0`). Keep the existing field order (`name, solid, transparent, kind, light, opacity, faces`) so the diff is one added pair per line.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/__tests__/blocks.test.ts`
Expected: PASS (all blocks suite tests).

- [ ] **Step 5: Full green + commit**

Run: `npm test` → `npm run build`
Expected: `Tests  124 passed` (123 + 1 new); build clean.

```bash
git add src/blocks.ts src/__tests__/blocks.test.ts
git commit -m "feat: block registry light emission + opacity fields (torch 14; glass 1 / leaves-water 2 / solid 15)"
```

---

### Task 2: Chunk light fields + `World.getLight`

**Files:**
- Modify: `src/world.ts` (`VoxelBuffer` :11-17, `Chunk` :18-34, `ensureChunk` :58-77, new method after `getMeta` :89-94)
- Test: `src/__tests__/world.test.ts` (append a new `it` inside the existing `describe('world')`)

- [ ] **Step 1: Write the failing test:**

```ts
it('light fields: zero-initialized per chunk; getLight reads [blight, skylight], [0, 0] for missing chunks or out-of-band y', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    expect(c.blight).toBeInstanceOf(Uint8Array);
    expect(c.blight.length).toBe(4096);
    expect(c.skylight.length).toBe(4096);
    expect(c.colSum.length).toBe(256); // per (lx, lz) column, capped at 15
    c.blight[localIndex(8, 8, 8)] = 12;
    c.skylight[localIndex(8, 8, 8)] = 15;
    expect(w.getLight(8, 8, 8)).toEqual([12, 15]);
    expect(w.getLight(0, 8, 8)).toEqual([0, 0]);      // zero cell
    expect(w.getLight(16, 8, 8)).toEqual([0, 0]);     // missing chunk (neighbor col)
    expect(w.getLight(8, 80, 8)).toEqual([0, 0]);     // above the generated band (band = y 0..79)
});
```

(`localIndex` is already imported in world.test.ts; if not, add it to the import from `'../world'`.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/world.test.ts`
Expected: FAIL — `c.blight` is `undefined`; `w.getLight is not a function`.

- [ ] **Step 3: Implement** — `src/world.ts`:

`VoxelBuffer` (:11-17) — add one member:

```ts
light: Float32Array; // per-vertex (blight, skylight), levels/15 normalized to 0..1; the shader multiplies the face/AO color by ambient + (1-ambient)*max(bl, sk*uDayness) (PROJECT.md §18)
```

`Chunk` interface — add after the `wstream` line (:24):

```ts
  blight: Uint8Array;   // block light level per cell, 0..15 (torch emission propagated); owned by src/light.ts
  skylight: Uint8Array; // sky light level per cell, 0..15 (open-to-sky exposure propagated); owned by src/light.ts
  colSum: Uint8Array;   // 256: per (lx,lz) column, capped-at-15 sum of light opacities over the chunk's own 16 cells (skyEmit's per-chunk cache; localIndex(lx, 0, lz) indexing)
```

`ensureChunk` — add to the object literal (after `wstream`, :69):

```ts
      blight: new Uint8Array(CHUNK_VOL),
      skylight: new Uint8Array(CHUNK_VOL),
      colSum: new Uint8Array(256),
```

New method after `getMeta` (:94):

```ts
  /** Both light fields at a cell, [blight, skylight] (0..15 each). Missing chunk (incl. outside the generated y band) reads [0, 0] — light never propagates through ungenerated space, exactly like water. */
  getLight(wx: number, wy: number, wz: number): [number, number] {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return [0, 0];
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    return [c.blight[i], c.skylight[i]];
  }
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/__tests__/world.test.ts`
Expected: PASS.

- [ ] **Step 5: Full green + commit** (build will now fail in the mesher's `toBuffer` callers — NO: `VoxelBuffer` is also produced by `src/chunk-mesher.ts`'s `Buf.toBuffer`, which now lacks `light` — tsc error is EXPECTED and is fixed by Task 10; to keep this commit's build green, add the placeholder in `toBuffer` NOW: `light: new Float32Array(0)` is WRONG for a non-empty buffer. Instead, implement the real `light` production in this task's scope of the mesher: in `Buf` add `light: number[] = []`; extend `push(x, y, z, s, u, v)` with two tail params `bl: number, sk: number` that do `this.light.push(bl, sk)`; update the 3 push call sites in the current mesher (cube path :306-311, `pushBox` :178-183) to pass `0, 0` for now; and `toBuffer()` returns `light: new Float32Array(this.light)`. Task 10 replaces the `0, 0` with the sampled values. This keeps every commit buildable.)

Run: `npm test` → `npm run build`
Expected: `Tests  125 passed`; build clean.

```bash
git add src/world.ts src/__tests__/world.test.ts src/chunk-mesher.ts
git commit -m "feat: chunk light fields (blight/skylight/colSum) + World.getLight; VoxelBuffer.light placeholder (zero)"
```

---

### Task 3: Light core math — `lightOpacity`, `columnSum`, `skyEmit`

**Files:**
- Create: `src/light.ts`
- Test: `src/__tests__/light.test.ts` (create; fixture pattern copied from `src/__tests__/water.test.ts:7-45`)

- [ ] **Step 1: Write the failing test** — create `src/__tests__/light.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Block, doorMeta } from '../blocks';
import { World, localIndex } from '../world';
import { lightOpacity, columnSum, skyEmit, LIGHT_MAX } from '../light';

function makeWorld(chunks: [number, number, number][]): World {
  const w = new World();
  for (const [cx, cy, cz] of chunks) w.ensureChunk(cx, cy, cz);
  return w;
}

function fillColSum(w: World, cx: number, cy: number, cz: number): void {
  // test helper: maintain the colSum cache the way LightSim does (Task 4+ calls it inside the sim)
  const c = w.getChunk(cx, cy, cz)!;
  for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) c.colSum[lx + lz * 16] = columnSum(w, cx, cy, cz, lx, lz);
}

describe('light core math', () => {
  it('lightOpacity: registry default, doors meta-dependent (closed 15, open 0)', () => {
    const w = makeWorld([[0, 0, 0]]);
    expect(lightOpacity(w, 0, 5, 0)).toBe(0); // air
    w.setBlock(1, 5, 0, Block.Glass);
    expect(lightOpacity(w, 1, 5, 0)).toBe(1);
    w.setBlock(2, 5, 0, Block.Leaves);
    expect(lightOpacity(w, 2, 5, 0)).toBe(2);
    w.setBlock(3, 5, 0, Block.Water);
    expect(lightOpacity(w, 3, 5, 0)).toBe(2); // flat, flow-level-blind
    w.setBlock(4, 5, 0, Block.Stone);
    expect(lightOpacity(w, 4, 5, 0)).toBe(15);
    w.setBlock(5, 5, 0, Block.Torch);
    expect(lightOpacity(w, 5, 5, 0)).toBe(0); // a torch never blocks
    w.setBlock(6, 5, 0, Block.DoorBottom, doorMeta(false, 0));
    expect(lightOpacity(w, 6, 5, 0)).toBe(15); // closed door blocks
    w.setBlock(6, 5, 0, Block.DoorBottom, doorMeta(true, 0));
    expect(lightOpacity(w, 6, 5, 0)).toBe(0); // open door passes
  });

  it('columnSum: capped-at-15 opacity sum of a chunk column, read from the chunk arrays', () => {
    const w = makeWorld([[0, 0, 0]]);
    expect(columnSum(w, 0, 0, 0, 8, 8)).toBe(0); // air column
    w.setBlock(8, 10, 8, Block.Stone);
    expect(columnSum(w, 0, 0, 0, 8, 8)).toBe(15); // one solid saturates the cap
    w.setBlock(8, 10, 8, Block.Air);
    w.setBlock(8, 10, 8, Block.Glass);
    w.setBlock(8, 9, 8, Block.Leaves);
    expect(columnSum(w, 0, 0, 0, 8, 8)).toBe(3); // 1 + 2
  });

  it('skyEmit: open air column emits 15 everywhere; glass ceiling 14 below (15 at the glass itself); 2-deep water 11; rock 0', () => {
    const w = makeWorld([[0, 0, 0]]); // cells y 0..15
    fillColSum(w, 0, 0, 0);
    expect(skyEmit(w, 8, 0, 8)).toBe(15);
    expect(skyEmit(w, 8, 15, 8)).toBe(15);
    w.setBlock(8, 10, 8, Block.Glass);
    fillColSum(w, 0, 0, 0);
    expect(skyEmit(w, 8, 10, 8)).toBe(15); // the glass cell: nothing opaque above IT
    expect(skyEmit(w, 8, 9, 8)).toBe(14); // air under the glass
    expect(skyEmit(w, 8, 1, 8)).toBe(14); // no vertical decay below it
    w.setBlock(8, 10, 8, Block.Water);
    w.setBlock(8, 9, 8, Block.Water);
    fillColSum(w, 0, 0, 0);
    expect(skyEmit(w, 8, 8, 8)).toBe(11); // 15 - 2 - 2
    w.setBlock(8, 10, 8, Block.Air);
    w.setBlock(8, 9, 8, Block.Air);
    w.setBlock(8, 10, 8, Block.Stone);
    fillColSum(w, 0, 0, 0);
    expect(skyEmit(w, 8, 9, 8)).toBe(0); // under rock: 15 - 15
  });

  it('skyEmit: a higher chunk's colSum is included in the walk (missing upper chunk = air, 0)', () => {
    const w = makeWorld([[0, 0, 0]]);
    w.setBlock(8, 3, 8, Block.Glass); // in chunk (0,0,0)
    fillColSum(w, 0, 0, 0);
    expect(skyEmit(w, 8, 0, 8)).toBe(15); // glass at y=3 is BELOW y=3? no: strictly above y=0 includes y=3
    expect(skyEmit(w, 8, 0, 8)).toBe(14);
    const w2 = makeWorld([[0, 0, 0], [0, 1, 0]]);
    w2.setBlock(8, 19, 8, Block.Glass); // y=19 in chunk (0,1,0), above chunk (0,0,0)
    fillColSum(w2, 0, 0, 0); fillColSum(w2, 0, 1, 0);
    expect(skyEmit(w2, 8, 5, 8)).toBe(14); // sees the upper chunk's colSum
    const w3 = makeWorld([[0, 0, 0], [0, 1, 0]]);
    w3.setBlock(8, 19, 8, Block.Glass);
    fillColSum(w3, 0, 1, 0); // colSum maintained in the UPPER chunk only
    // lower chunk's colSum stays 0 (stale) — skyEmit walks the in-chunk column of the cell's own chunk:
    expect(skyEmit(w3, 8, 5, 8)).toBe(14); // the walk reads the upper chunk's colSum directly, independent of the lower's cache
  });
});
```

Note the first `skyEmit` assertion pair in the last test: the first `expect` line is redundant — delete it when implementing (kept here as a derivation note for the worker); the pinned value is `14` (a glass at y=3 is strictly above y=0).

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/light.test.ts`
Expected: FAIL — `Cannot find module '../light'`.

- [ ] **Step 3: Implement** — create `src/light.ts`:

```ts
// Dynamic lighting: two 0..15 integer light fields propagated locally through the
// voxel grid — light does not know which source lit it; state is local, nothing is
// remembered; changes propagate through a queue until a stable state (the classic
// voxel-sandbox convention). Mirrors src/water.ts's queue shape.
// See docs/superpowers/specs/2026-08-19-dynamic-lighting-design.md.
// Pure module: no three.js — node-testable.

import { BLOCKS, isDoor, doorOpen } from './blocks';
import { World, CHUNK_SIZE, localIndex, chunkOf } from './world';
import { CY_MAX } from './streaming';

export const LIGHT_MAX = 15;
export const LIGHT_AMBIENT = 0.12; // unlit floor ("dark but readable"): shader factor at light 0
export const LIGHT_TICK_BUDGET = 2500; // cell pops per 60 Hz substep: a torch's <=14-cell wave (a few thousand cells) settles in 1-3 substeps
export const LIGHT_SETTLE_GUARD = 4096; // inline pops per chunk-load settle (~one chunk-size pass; rest keeps draining on substeps)

const N6: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]; // orthogonal neighbors only — diagonals get light by taking two steps

/** The cell's light opacity O: registry default; doors are meta-dependent (closed = 15 like solid, open = 0 like air — the door-meta semantics of world.isSolid). */
export function lightOpacity(world: World, wx: number, wy: number, wz: number): number {
  const b = world.getBlock(wx, wy, wz);
  if (isDoor(b)) return doorOpen(world.getMeta(wx, wy, wz)) ? 0 : LIGHT_MAX;
  return BLOCKS[b].opacity;
}

/** Capped-at-15 sum of light opacities over one 16-cell chunk column (lx, lz) of chunk (cx, cy, cz) — the per-chunk `colSum` cache entry. Reads the chunk arrays directly (no per-cell world lookups). */
export function columnSum(world: World, cx: number, cy: number, cz: number, lx: number, lz: number): number {
  const c = world.getChunk(cx, cy, cz);
  if (!c) return 0;
  let s = 0;
  for (let ly = 15; ly >= 0 && s < LIGHT_MAX; ly--) {
    const i = localIndex(lx, ly, lz);
    const b = c.blocks[i];
    s += isDoor(b) ? (doorOpen(c.meta[i]) ? 0 : LIGHT_MAX) : BLOCKS[b].opacity;
    if (s > LIGHT_MAX) s = LIGHT_MAX;
  }
  return s;
}

/** Sky-light emission E_s of a cell: 15 minus the capped sum of the opacities of every cell STRICTLY above it (open air column -> 0 -> 15: direct downward skylight does not decay through air; glass costs 1; water 2 per cell; a single solid above -> 0). Walks up through loaded chunks (missing chunk = air = 0, keep walking); a partially-loaded column reads low until the upper chunks load and their seam seeding re-seeds the lower one. The band top is CY_MAX (generated y band 0..79; outside it there are no chunks, hence no cells). */
export function skyEmit(world: World, wx: number, wy: number, wz: number): number {
  const cx = chunkOf(wx), cy = chunkOf(wy), cz = chunkOf(wz);
  const c = world.getChunk(cx, cy, cz);
  if (!c) return 0;
  const lx = wx - cx * CHUNK_SIZE, lz = wz - cz * CHUNK_SIZE, ly = wy - cy * CHUNK_SIZE;
  let s = 0;
  for (let cyi = cy + 1; cyi <= CY_MAX; cyi++) {
    const up = world.getChunk(cx, cyi, cz);
    if (up) {
      s += up.colSum[lx + lz * 16];
      if (s >= LIGHT_MAX) return 0;
    } // missing upper chunk = air: contributes 0, keep walking
  }
  for (let y2 = 15; y2 > ly; y2--) {
    const i2 = localIndex(lx, y2, lz);
    const b = c.blocks[i2];
    s += isDoor(b) ? (doorOpen(c.meta[i2]) ? 0 : LIGHT_MAX) : BLOCKS[b].opacity;
    if (s >= LIGHT_MAX) return 0;
  }
  return LIGHT_MAX - s;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/__tests__/light.test.ts`
Expected: PASS (4 tests). If the column-walk top needs `N6`-style inlining, keep it as written — do not "clean up" the double `expect` note from Step 1 (that was a test-file instruction, not code).

- [ ] **Step 5: Full green + commit**

Run: `npm test` → `npm run build`
Expected: `Tests  129 passed`; build clean.

```bash
git add src/light.ts src/__tests__/light.test.ts
git commit -m "feat: light core math — lightOpacity (door-aware), columnSum, skyEmit (open column 15, no vertical air decay)"
```

---

### Task 4: `LightSim` — queue, pop rule, `tick`

**Files:**
- Modify: `src/light.ts` (append the class below the core math)
- Test: `src/__tests__/light.test.ts` (new `describe('LightSim', …)` block)

- [ ] **Step 1: Write the failing test** (append to `src/__tests__/light.test.ts`; add imports for `LightSim` and `Block.Torch` usage):

```ts
import { LightSim } from '../light';

// Run the queue to a fixpoint (or until `max` tick cycles) — the node-side stand-in
// for the 60 Hz substep clock (same pattern as water.test.ts's drain).
function drain(sim: LightSim, max = 300): void {
  let n = 0;
  while (n++ < max && sim.tick(250) !== 0) {
    /* drain */
  }
}

describe('LightSim', () => {
  it('a torch propagates the exact diamond pattern through air: 14 at the source, 14-d at Manhattan distance d, nothing beyond 14, and nothing through a solid wall', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // x 0..15 and 16..31, y 0..15
    for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone); // floor
    w.setBlock(8, 1, 8, Block.Torch);
    const sim = new LightSim(w);
    sim.edit(8, 1, 8);
    drain(sim);
    expect(w.getLight(8, 1, 8)[0]).toBe(14);  // the source cell stores its own emission
    expect(w.getLight(9, 1, 8)[0]).toBe(13);  // Manhattan 1
    expect(w.getLight(10, 1, 8)[0]).toBe(12); // Manhattan 2
    expect(w.getLight(9, 1, 9)[0]).toBe(12);  // diagonal = two orthogonal steps
    expect(w.getLight(8, 8, 8)[0]).toBe(7);   // straight up, Manhattan 7
    // a solid wall at x=12 kills the field on the far side (opacity 15 exits nothing)
    for (let y = 1; y < 16; y++) for (let z = 0; z < 16; z++) w.setBlock(12, y, z, Block.Stone);
    // wall was added AFTER settle: re-seed + drain (the real flow goes through edit(), Task 5)
    sim.edit(12, 8, 8);
    drain(sim);
    expect(w.getLight(11, 1, 8)[0]).toBe(11); // last air before the wall: 14-3 (d=3 from torch); the wall doesn't attenuate the near side
    expect(w.getLight(13, 1, 8)[0]).toBe(0);  // far side stays dark (no light stored leaks through: wall stores 10 → 10-1-15 < 0)
    // distance cap: with the wall gone again, level 0 at distance 14, nothing at 15
    for (let y = 1; y < 16; y++) for (let z = 0; z < 16; z++) w.setBlock(12, y, z, Block.Air);
    sim.edit(12, 8, 8);
    drain(sim);
    expect(w.getLight(22, 1, 8)[0]).toBe(0); // 8+14 = 22: the last lit cell is 21 at level 1
    expect(w.getLight(21, 1, 8)[0]).toBe(1);
    expect(w.getLight(23, 1, 8)[0]).toBe(0);
  });

  it('two overlapping torches: the stored level is the MAX, never a sum', () => {
    const w = makeWorld([[0, 0, 0]]);
    for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone);
    w.setBlock(3, 5, 8, Block.Torch);
    const sim = new LightSim(w);
    sim.edit(3, 5, 8);
    w.setBlock(13, 5, 8, Block.Torch);
    sim.edit(13, 5, 8);
    drain(sim);
    // (8,5,8) is distance 5 from both: 14-5 = 9 from each — max 9, not 18
    expect(w.getLight(8, 5, 8)[0]).toBe(9);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/light.test.ts`
Expected: FAIL — `LightSim` is not exported.

- [ ] **Step 3: Implement** — append to `src/light.ts` (extend the import line to include `chunkKey` from `./world`):

```ts
export interface LightStats { seeds: number; pops: number; fieldChanges: number }

export class LightSim {
  /** Chunk keys whose light changed — consumed and cleared exactly once per frame by main.ts (the exact `sim.touched` contract). */
  readonly touched = new Set<string>();
  /** World-coord keys, insertion-ordered FIFO with dedup (the water-sim contract). */
  private readonly queue = new Set<string>();
  readonly stats: LightStats = { seeds: 0, pops: 0, fieldChanges: 0 };

  constructor(private readonly world: World) {}

  private seed(wx: number, wy: number, wz: number): void {
    this.queue.add(`${wx},${wy},${wz}`);
    this.stats.seeds++;
  }

  private readField(f: 0 | 1, wx: number, wy: number, wz: number): number {
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return 0; // missing neighbor = no contribution (POC deviation: no light through ungenerated space)
    return f === 0 ? c.blight[localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE)]
                   : c.skylight[localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE)];
  }

  /** Re-derive ONE cell's both fields with the rule `target = max(E, max_nb (L(nb) − 1 − O(nb)))` — attenuation is paid EXITING the neighbor. Writes on change, marks the chunk touched, re-seeds the six neighbors per changed field. Returns the number of fields that changed. */
  private pop(wx: number, wy: number, wz: number): number {
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return 0;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    let changed = 0;
    // block light: emission from the registry (torch 14) + neighbor contributions
    let best = BLOCKS[this.world.getBlock(wx, wy, wz)].light;
    for (const [dx, dy, dz] of N6) {
      const nb = this.readField(0, wx + dx, wy + dy, wz + dz);
      if (nb > 0) { // a dark neighbor can only contribute <= 0
        const v = nb - 1 - lightOpacity(this.world, wx + dx, wy + dy, wz + dz);
        if (v > best) best = v;
      }
    }
    const b = best < 0 ? 0 : best;
    if (b !== c.blight[i]) {
      c.blight[i] = b;
      this.touched.add(chunkKey(c.cx, c.cy, c.cz));
      this.stats.fieldChanges++;
      changed++;
      for (const [dx, dy, dz] of N6) this.seed(wx + dx, wy + dy, wz + dz);
    }
    // sky light: same rule, emission from skyEmit (colSum walks)
    let bestS = skyEmit(this.world, wx, wy, wz);
    for (const [dx, dy, dz] of N6) {
      const nb = this.readField(1, wx + dx, wy + dy, wz + dz);
      if (nb > 0) {
        const v = nb - 1 - lightOpacity(this.world, wx + dx, wy + dy, wz + dz);
        if (v > bestS) bestS = v;
      }
    }
    const s = bestS < 0 ? 0 : bestS;
    if (s !== c.skylight[i]) {
      c.skylight[i] = s;
      this.touched.add(chunkKey(c.cx, c.cy, c.cz));
      this.stats.fieldChanges++;
      changed++;
      for (const [dx, dy, dz] of N6) this.seed(wx + dx, wy + dy, wz + dz);
    }
    return changed;
  }

  /** Process up to `budget` queued cells (insertion order); returns the number processed (0 = queue empty). Does NOT clear `touched` — the caller drains it after re-meshing (sim.touched contract). */
  tick(budget: number): number {
    let n = 0;
    while (n++ < budget) {
      const it = this.queue.values().next();
      if (it.done) break;
      this.queue.delete(it.value);
      const [wx, wy, wz] = it.value.split(',').map(Number);
      this.stats.pops++;
      this.pop(wx, wy, wz);
    }
    return n - 1;
  }
}
```

NOTE (performance, deliberate): `pop` skips the opacity lookup for zero-valued neighbors (`if (nb > 0)`) — the common case in caves — so a dark-region wave is ~12 cheap field reads + 1 `skyEmit` (≤ ~21 ops) per pop. If Task 14's probe measures a frame spike from light work, the documented next step is the mesher-`gb()`-style in-chunk fast reads here (the budget constants exist for exactly that). Do not optimize speculatively now.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/__tests__/light.test.ts`
Expected: PASS (all light tests).

- [ ] **Step 5: Full green + commit**

Run: `npm test` → `npm run build`
Expected: `Tests  131 passed`; build clean.

```bash
git add src/light.ts src/__tests__/light.test.ts
git commit -m "feat: LightSim — recompute-relaxation queue (max-of-sources rule, attenuation exiting the neighbor, touched set)"
```

---

### Task 5: `LightSim.edit` — emission seeds + sky-column re-seed + removal waves

**Files:**
- Modify: `src/light.ts` (add `edit` to `LightSim`)
- Test: `src/__tests__/light.test.ts` (extend the `describe('LightSim')` block)

- [ ] **Step 1: Write the failing tests** (append inside the `describe('LightSim')` block):

```ts
  it('removal: the darkness wave walks out until the pre-torch state (no special de-propagation pass needed)', () => {
    const w = makeWorld([[0, 0, 0]]);
    for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone);
    w.setBlock(8, 1, 8, Block.Torch);
    const sim = new LightSim(w);
    sim.edit(8, 1, 8);
    drain(sim);
    const before = w.getLight(12, 1, 8)[0]; // 10
    expect(before).toBe(10);
    w.setBlock(8, 1, 8, Block.Air); // break the torch (main.ts calls edit after world.setBlock)
    sim.edit(8, 1, 8);
    drain(sim);
    expect(w.getLight(8, 1, 8)[0]).toBe(0);
    expect(w.getLight(12, 1, 8)[0]).toBe(0); // wave swept through; no support left anywhere
    expect(w.getLight(15, 1, 8)[0]).toBe(0);
  });

  it('two-torch support boundary: removing one torch, the darkness wave stops dead at the cells the survivor still supports', () => {
    const w = makeWorld([[0, 0, 0]]);
    for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone);
    w.setBlock(4, 5, 8, Block.Torch);
    w.setBlock(12, 5, 8, Block.Torch);
    const sim = new LightSim(w);
    sim.edit(4, 5, 8);
    sim.edit(12, 5, 8);
    drain(sim);
    expect(w.getLight(8, 5, 8)[0]).toBe(10); // distance 4 from both: 14-4
    expect(w.getLight(13, 5, 8)[0]).toBe(13); // 1 from right torch (14-1) = the max; the left torch only gives 14-9 = 5
    w.setBlock(12, 5, 8, Block.Air);
    sim.edit(12, 5, 8);
    drain(sim);
    expect(w.getLight(8, 5, 8)[0]).toBe(10); // unchanged: the left torch still supports it at exactly 10
    expect(w.getLight(13, 5, 8)[0]).toBe(5); // right field gone: left torch only — d=9 → 14-9 = 5
    expect(w.getLight(15, 5, 8)[0]).toBe(3); // d=11 from the left torch → 14-11 = 3
  });

  it('sky column re-seed: a block at a cave mouth collapses the column (1/side-step decay into the cave); breaking it restores', () => {
    const w = makeWorld([[0, 0, 0]]);
    // cave: a horizontal air tunnel at y=5, z 4..11, under a stone ceiling at y=6 and stone above; open to the sky at z=12 (the mouth)
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 15; z++) w.setBlock(x, 6, z, Block.Stone); // ceiling (leave z=15 open? no — close the far end too)
    }
    for (let z = 0; z < 16; z++) for (let y = 7; y < 16; y++) w.setBlock(0, y, z, Block.Stone); // close the top so the column above y=6 is the only sky path
    // hmm: simpler deterministic layout — build the column explicitly instead:
    // reset: one fresh world
    const w2 = makeWorld([[0, 0, 0]]);
    // column at (8,·,8): air from y=0..15 EXCEPT a stone slab at y=10..15 above an air cap y=8..9? NO — pinned layout:
    // air y 0..9, STONE y 10 (single block, the plug), air y 11..15. The plug blocks sky for y <= 9.
    for (let y = 11; y < 16; y++) w2.setBlock(8, y, 8, Block.Air); // air above the plug (explicit, though default)
    const sim = new LightSim(w2);
    sim.settleChunk(0, 0, 0); // initial settle: open column everywhere (plug not yet placed) — skylight 15 all the way down
    drain(sim);
    expect(w2.getLight(8, 0, 8)[1]).toBe(15);
    // NOW plug the column at y=10: the column cells lose direct sky (E→0) and relax to the
    // 1/side-step lateral leak from the adjacent open column (15-1 = 14) — not a full 0 (that needs enclosure)
    w2.setBlock(8, 10, 8, Block.Stone);
    sim.edit(8, 10, 8);
    drain(sim);
    expect(w2.getLight(8, 10, 8)[1]).toBe(15); // the plug itself: nothing opaque strictly above it
    expect(w2.getLight(8, 9, 8)[1]).toBe(14); // below the plug: E=0 (column blocked) + 15-1 side-step leak
    expect(w2.getLight(8, 0, 8)[1]).toBe(14); // uniform down the column: 1/side-step from the open side column, no vertical decay
    // break the plug: the column restores to 15
    w2.setBlock(8, 10, 8, Block.Air);
    sim.edit(8, 10, 8);
    drain(sim);
    expect(w2.getLight(8, 9, 8)[1]).toBe(15);
    expect(w2.getLight(8, 0, 8)[1]).toBe(15);
  });
```

(Delete the first abandoned layout in `w` — only `w2` is used; the `w`/first-loop lines are scratch, remove them when writing the file. The pinned assertions are the `w2` ones.)

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/__tests__/light.test.ts`
Expected: FAIL — `sim.edit is not a function`, `sim.settleChunk is not a function`.

- [ ] **Step 3: Implement `edit`** — add to `LightSim` (in `src/light.ts`; extend the import to include `WORLD` band top — no new import needed, use `CY_MAX` already imported):

```ts
  /** Player-side edit at (wx, wy, wz), called from main.ts AFTER world.setBlock / a door-meta change (at every existing sim.edit site + the door toggle). re-seeds: the cell (its new emission), its six neighbors, and every cell STRICTLY BELOW it in the (wx, wz) column — each such cell's sky emission may have changed; a changed one is set exactly to its new E_s (relaxation restores any horizontal support). Also maintains the edited chunk's colSum entry. */
  edit(wx: number, wy: number, wz: number): void {
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (c) {
      const lx = wx - c.cx * CHUNK_SIZE, lz = wz - c.cz * CHUNK_SIZE;
      c.colSum[lx + lz * 16] = columnSum(this.world, c.cx, c.cy, c.cz, lx, lz);
    }
    this.seed(wx, wy, wz);
    for (const [dx, dy, dz] of N6) this.seed(wx + dx, wy + dy, wz + dz);
    // the column: only cells strictly below the edited one can see a changed E_s
    for (let y = 0; y < wy; y++) {
      const ch = this.world.getChunk(chunkOf(wx), chunkOf(y), chunkOf(wz));
      if (!ch) continue; // unloaded band cell: settles when its chunk loads
      const e = skyEmit(this.world, wx, y, wz);
      const i = localIndex(wx - ch.cx * CHUNK_SIZE, y - ch.cy * CHUNK_SIZE, wz - ch.cz * CHUNK_SIZE);
      if (e !== ch.skylight[i]) {
        ch.skylight[i] = e;
        this.touched.add(chunkKey(ch.cx, ch.cy, ch.cz));
        this.stats.fieldChanges++;
      }
      this.seed(wx, y, wz);
    }
  }
```

`settleChunk` is added in Task 6 — the third test here needs it; add it NOW in the same step (it belongs to the load path but the test forces the order):

```ts
  /** Load-path settle (main.ts calls it for each newly loaded chunk, next to sim.settle): maintains the chunk's colSum, queues the chunk's cells, queues the one-cell face shells of the seam inside already-loaded neighbors (their boundary light may change across the new seam — including sky columns whose upper band just appeared), and drains inline up to LIGHT_SETTLE_GUARD pops (the rest keeps draining on substeps). */
  settleChunk(cx: number, cy: number, cz: number): void {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c) return;
    for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) c.colSum[lx + lz * 16] = columnSum(this.world, cx, cy, cz, lx, lz);
    for (let ly = 0; ly < 16; ly++) for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) this.seed(cx * 16 + lx, cy * 16 + ly, cz * 16 + lz);
    for (const [sx, sy, sz] of N6) this.seedSeamNeighbor(cx, cy, cz, sx, sy, sz);
    this.drain(LIGHT_SETTLE_GUARD);
  }

  /** Queue the one-cell face shell of neighbor chunk (cx+sx, cy+sy, cz+sz) that faces (cx, cy, cz). */
  private seedSeamNeighbor(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): void {
    const nc = this.world.getChunk(cx + sx, cy + sy, cz + sz);
    if (!nc) return;
    const x0 = nc.cx * 16, y0 = nc.cy * 16, z0 = nc.cz * 16;
    if (sx !== 0) { const lx = sx === 1 ? 0 : 15; for (let ly = 0; ly < 16; ly++) for (let lz = 0; lz < 16; lz++) this.seed(x0 + lx, y0 + ly, z0 + lz); }
    else if (sy !== 0) { const ly = sy === 1 ? 0 : 15; for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) this.seed(x0 + lx, y0 + ly, z0 + lz); }
    else { const lz = sz === 1 ? 0 : 15; for (let lx = 0; lx < 16; lx++) for (let ly = 0; ly < 16; ly++) this.seed(x0 + lx, y0 + ly, z0 + lz); }
  }

  /** Internal bounded drain (shares tick's body; used by settleChunk). */
  private drain(budget: number): void {
    let n = 0;
    while (n++ < budget) {
      const it = this.queue.values().next();
      if (it.done) break;
      this.queue.delete(it.value);
      const [wx, wy, wz] = it.value.split(',').map(Number);
      this.stats.pops++;
      this.pop(wx, wy, wz);
    }
  }
```

And refactor `tick(budget)` to `return this.drain(budget) ? … ` — replace `tick`'s body with:

```ts
  tick(budget: number): number {
    const before = this.queue.size;
    this.drain(budget);
    return before - this.queue.size < 0 ? 0 : before - this.queue.size;
  }
```

WAIT — that changes the "processed" semantics (queue shrank by more than `budget`? impossible: drain only removes what it pops = ≤ budget net, but seeds add during pops → size can grow). Keep the original counting `tick` body from Task 4 (it counts processed pops directly — correct) and have `drain` carry the loop; `tick` becomes:

```ts
  tick(budget: number): number {
    return this.drain(budget); // drain returns the number of pops processed
  }
```

i.e. `drain` is the loop from Task 4's `tick` body (returns `n - 1`), and `tick` delegates to it. Apply that shape in this step (the Task 4 test suite must stay green).

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/__tests__/light.test.ts`
Expected: PASS (all light tests).

- [ ] **Step 5: Full green + commit**

Run: `npm test` → `npm run build`
Expected: `Tests  134 passed`; build clean.

```bash
git add src/light.ts src/__tests__/light.test.ts
git commit -m "feat: LightSim.edit (emission + sky-column seeds) and settleChunk (load-path settle + seam seeding); removal waves and support boundaries pinned"
```

---

### Task 6: Chunk-unload seam seeding + cross-seam continuity + determinism

**Files:**
- Modify: `src/light.ts` (add `onChunkUnloaded`)
- Test: `src/__tests__/light.test.ts` (extend `describe('LightSim')`)

- [ ] **Step 1: Write the failing tests** (append inside the `describe('LightSim')` block):

```ts
  it('cross-chunk seams: light is continuous across a boundary (a wave crosses the seam); after the lit-neighbor chunk unloads, cells lit THROUGH it darken', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // x 0..15 and 16..31
    for (let cx = 0; cx <= 1; cx++) for (let x = cx * 16; x < cx * 16 + 16; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone);
    w.setBlock(20, 8, 8, Block.Torch); // in chunk (1,0,0)
    const sim = new LightSim(w);
    sim.settleChunk(0, 0, 0);
    sim.settleChunk(1, 0, 0);
    drain(sim);
    expect(w.getLight(20, 8, 8)[0]).toBe(14);
    expect(w.getLight(15, 8, 8)[0]).toBe(9); // 20-15 = 5 steps: 14-5
    // remove chunk (1,0,0): cells that were lit through it must darken
    w.removeChunk(1, 0, 0);
    sim.onChunkUnloaded(1, 0, 0);
    drain(sim);
    expect(w.getLight(15, 8, 8)[0]).toBe(0); // no more contribution across the missing seam
    expect(w.getLight(8, 8, 8)[0]).toBe(0);
  });

  it('determinism: the same edit sequence on two fresh worlds yields identical final fields', () => {
    const build = (w: World): void => {
      for (let x = 0; x < 32; x++) for (let z = 0; z < 16; z++) w.setBlock(x, 0, z, Block.Stone);
      w.setBlock(8, 1, 8, Block.Torch);
      w.setBlock(16, 4, 8, Block.Torch);
    };
    const fields = (w: World): number[] => {
      const out: number[] = [];
      for (const c of w.allChunks()) for (let i = 0; i < c.blight.length; i++) out.push(c.blight[i], c.skylight[i]);
      return out;
    };
    const a = makeWorld([[0, 0, 0], [1, 0, 0]]);
    build(a);
    const simA = new LightSim(a);
    simA.settleChunk(0, 0, 0); simA.settleChunk(1, 0, 0); drain(simA);
    a.setBlock(8, 1, 8, Block.Air); simA.edit(8, 1, 8); drain(simA);
    const b = makeWorld([[0, 0, 0], [1, 0, 0]]);
    build(b);
    const simB = new LightSim(b);
    simB.settleChunk(0, 0, 0); simB.settleChunk(1, 0, 0); drain(simB);
    b.setBlock(8, 1, 8, Block.Air); simB.edit(8, 1, 8); drain(simB);
    expect(fields(a)).toEqual(fields(b));
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/light.test.ts`
Expected: FAIL — `sim.onChunkUnloaded is not a function` (first test).

- [ ] **Step 3: Implement** — add to `LightSim`:

```ts
  /** Unload path (main.ts calls it for each removed chunk): the surviving neighbors' seam shells may have been lit THROUGH the removed chunk (their missing-neighbor lookup now contributes nothing) — re-seed those cells so pops re-derive the darker values and the darkness wave propagates. Streaming always unloads a whole x/z ring column, so a lower chunk can never be sitting under a missing upper band: the skyEmit walk's skip-missing-chunks rule stays safe. */
  onChunkUnloaded(cx: number, cy: number, cz: number): void {
    for (const [sx, sy, sz] of N6) this.seedSeamNeighbor(cx, cy, cz, sx, sy, sz);
  }
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/__tests__/light.test.ts`
Expected: PASS (all light tests).

- [ ] **Step 5: Full green + commit**

Run: `npm test` → `npm run build`
Expected: `Tests  136 passed`; build clean.

```bash
git add src/light.ts src/__tests__/light.test.ts
git commit -m "feat: LightSim.onChunkUnloaded (darkness wave through unloaded seams); seam continuity + determinism pinned"
```

---

### Task 7: `dayness` on the sky sampler

**Files:**
- Modify: `src/sky.ts` (`SkySample` :10-17, `sampleSky` :67-90)
- Test: `src/__tests__/sky.test.ts` (append a new `it` inside `describe('sampleSky')`)

- [ ] **Step 1: Write the failing test:**

```ts
  it('dayness: the dim ramp normalized to 0..1 — 1.0 at noon, 0.0 at midnight, mirror-symmetric, monotonic day-to-midnight', () => {
    expect(sampleSky(0.0).dayness).toBeCloseTo(1.0);
    expect(sampleSky(1.0).dayness).toBeCloseTo(1.0);
    expect(sampleSky(0.5).dayness).toBeCloseTo(0.0);
    // dayness === (worldDim - 0.33) / 0.67 at every sample
    for (let i = 0; i <= 40; i++) {
      const p = i / 40;
      const s = sampleSky(p);
      expect(s.dayness, `@${p}`).toBeCloseTo((s.worldDim - 0.33) / 0.67, 6);
    }
    // mirror symmetry about midnight
    for (let i = 1; i < 20; i++) {
      const p = 0.02 + (i / 20) * 0.46;
      expect(sampleSky(p).dayness, `mirror @${p}`).toBeCloseTo(sampleSky(1 - p).dayness, 6);
    }
    // monotonic on the way down (0.22 → 0.5), up on the way up (0.5 → 0.78)
    const down: number[] = [], up: number[] = [];
    for (let i = 0; i < 30; i++) down.push(sampleSky(0.22 + (i / 30) * 0.28).dayness);
    for (let i = 0; i < 30; i++) up.push(sampleSky(0.5 + (i / 30) * 0.28).dayness);
    for (let i = 1; i < down.length; i++) expect(down[i] <= down[i - 1] + 1e-9, `down @${i}`).toBe(true);
    for (let i = 1; i < up.length; i++) expect(up[i] >= up[i - 1] - 1e-9, `up @${i}`).toBe(true);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/sky.test.ts`
Expected: FAIL — `dayness` is `undefined`.

- [ ] **Step 3: Implement** — `src/sky.ts`:

`SkySample` interface — add after the `worldDim` line (:16):

```ts
  dayness: number; // 0..1: the worldDim ramp normalized ((worldDim - 0.33) / 0.67) — 1.0 in full daylight, 0.0 at deep night; scales the skylight component of per-vertex light (uDayness uniform). Same curve as the sky palette fade, so sky and light dim in sync.
```

`sampleSky` — replace the single `worldDim` line (:81) with:

```ts
    const dimRaw = lerp(a.dim, b.dim, t);
    ...
    worldDim: dimRaw,
    dayness: (dimRaw - 0.33) / 0.67,
```

(i.e. compute `const dimRaw = lerp(a.dim, b.dim, t);` at the top of the returned-object literal's construction and use it for both fields — the anchors pin `dim` at exactly 1.0 and 0.33, so `dayness` sits in [0, 1] with no clamping needed.)

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/__tests__/sky.test.ts`
Expected: PASS.

- [ ] **Step 5: Full green + commit**

Run: `npm test` → `npm run build`
Expected: `Tests  137 passed`; build clean.

```bash
git add src/sky.ts src/__tests__/sky.test.ts
git commit -m "feat: SkySample.dayness — the dim ramp normalized to 0..1 (sky and world light fade on the same curve)"
```

---

### Task 8: Retire the `worldDim` material dim

**Files:**
- Modify: `src/sky.ts` (`createSky` signature :122-129, the `worldDim` block :239-242), `src/main.ts` (the `createSky(...)` call :197)

No unit test: `sky.apply` is three-side; the behavior is pinned by Task 14's headless pixels (night ≈ the 0.12 ambient floor, not 0.33). Keep this task small and verify by build.

- [ ] **Step 1: Make the change** — `src/sky.ts`:

Delete the two material-param lines from `createSky`'s signature (:124-125, `matOpaque` / `matTrans`) and replace the worldDim block (:239-242) with the retargeted comment:

```ts
      // World dimming: NO LONGER a material scalar. Per-vertex light (baked aLight
      // attribute + the uDayness uniform, driven from main.ts) owns world brightness;
      // sample.worldDim survives only as the CLOUD/SKY visual tint (PROJECT.md §18).
```

(`matOpaque`/`matTrans` become unused in `sky.ts` — removing the params entirely is the honest shape; tsc `strict` won't flag unused params, but nothing else in the closure uses them — verify with `grep -n "matOpaque\|matTrans" src/sky.ts` returning only the deleted lines' former neighbors.)

- [ ] **Step 2: Update the call site** — `src/main.ts:197`:

```ts
const sky = createSky(scene, FOG_AIR, FOG_WATER, BG_WATER);
```

- [ ] **Step 3: Verify**

Run: `npx rg -n "matOpaque|matTrans" src/sky.ts` → Expected: no matches.
Run: `npm test` → `npm run build`
Expected: `Tests  137 passed` (no new tests here); build clean.

- [ ] **Step 4: Commit**

```bash
git add src/sky.ts src/main.ts
git commit -m "refactor: drop the worldDim material dim (per-vertex light takes over); worldDim stays as the cloud/sky tint"
```

---

### Task 9: Mesher `aLight` — per-corner sampling

**Files:**
- Modify: `src/chunk-mesher.ts` (exports :3-6, `Buf` :37-52, `pushBox` :165-192, `emitTorch` :195-225, `emitDoor` :232-256, `meshChunk` :260-340)
- Modify: `src/main.ts` (`toGeometry` :236-241, `rebuildChunkMesh` :257)
- Test: `src/__tests__/chunk-mesher.test.ts` (all existing `meshChunk(` call sites + new tests)

- [ ] **Step 1: Write the failing tests** — first update EVERY existing `meshChunk(` call in `src/__tests__/chunk-mesher.test.ts` (grep: `rg -n "meshChunk(" src/__tests__/chunk-mesher.test.ts`) to pass a zero stub. Add at the top of the file after the imports:

```ts
import { type LightSampler } from '../chunk-mesher';
const NO_LIGHT: LightSampler = () => [0, 0]; // zero-light stub: pre-light behavior for all existing tests
```

then append the new tests:

```ts
describe('chunk-mesher light baking', () => {
  it('a zero-light stub keeps the colors buffer byte-identical to pre-light (FACE_SHADE * AO only) and aLight all-zero', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0).blocks.fill(Block.Stone);
    const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque).not.toBeNull();
    const l = opaque!.light;
    expect(l.length).toBe(opaque!.positions.length / 3 * 2); // one (bl, sk) pair per vertex
    for (let i = 0; i < l.length; i++) expect(l[i]).toBe(0);
  });

  it('a torch-facing face corner bakes aLight.bl = 13/15 (the air cell across the face holds 13); a sky-exposed corner bakes aLight.sk = 1 (15/15)', () => {
    const w = makeWorldForMesher(Block.Torch); // one torch at (8,8,8) in chunk (0,0,0), no floor
    const lightAt: LightSampler = (x, y, z) => [x === 8 && y === 8 && z === 8 ? 0 : 13, 15]; // the torch cell itself stores 14 bl but the FACE-ACROSS cells of the stem read the air's 13 (see the 3-candidate rule below); sky everywhere 15
    const { opaque } = meshChunk(w, 0, 0, 0, lightAt);
    const l = opaque!.light;
    expect(l).not.toBeNull();
    // some vertex must have baked the torch-adjacent air value, scaled: 13/15
    expect(Math.max(...l.filter((_, i) => i % 2 === 0))).toBeCloseTo(13 / 15, 6);
    // and every non-torch corner reads skylight 15/15:
    expect(Math.max(...l.filter((_, i) => i % 2 === 1))).toBeCloseTo(1, 6);
  });

  it('the 3-candidate max rule: a solid diagonal keeps the corner lit when the face-across cell is dark', () => {
    const w = makeWorldForMesher(Block.Stone);
    // face-across cell dark (0,0), but a diagonal candidate holds (10, 10):
    const lightAt: LightSampler = (x, y, z) =>
      x === 9 && y === 9 && z === 9 ? [10, 10] : [0, 0]; // (9,9,9) is a face-diagonal candidate of the lone stone's +X face at (8,8,8)
    const { opaque } = meshChunk(w, 0, 0, 0, lightAt);
    const l = opaque!.light;
    expect(Math.max(...l.filter((_, i) => i % 2 === 0))).toBeCloseTo(10 / 15, 6);
  });
});

// helper: a lone special/cube block at the chunk center (like the file's loneChunk, but importable by name here)
function makeWorldForMesher(b: Block): World {
  const w = new World();
  const c = w.ensureChunk(0, 0, 0);
  c.blocks[localIndex(8, 8, 8)] = b;
  return w;
}
```

Notes: `makeWorldForMesher` duplicates `loneChunk` (kept separate so the new block reads standalone); the torch test's stub deliberately models "air cells read 13" — the torch STEM's face-across cells are air (the stem is a 0.18 box, the cell is the torch id; the candidates are NEIGHBOR cells, all air → 13, except where a neighbor happens to be the torch cell — for a face of the stem box the neighbor across the face is air, and the diagonal candidates are air too, EXCEPT the stub returns 0 for the torch cell and 13 elsewhere: the max over candidates of the stem's faces = 13 ✓, and the flame-tile face reads the same).

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/__tests__/chunk-mesher.test.ts`
Expected: FAIL — `LightSampler` not exported / `meshChunk` arity: the 4-arg call type-errors (tsc) and `opaque.light` is all-zero even with a lit stub.

- [ ] **Step 3: Implement** — `src/chunk-mesher.ts`:

Top (after the `ChunkMesh` interface):

```ts
/** Per-cell light accessor for baking: both fields 0..15, [0, 0] for missing neighbors. main.ts supplies it from World.getLight; tests pass stubs. */
export type LightSampler = (wx: number, wy: number, wz: number) => [number, number];
```

`Buf` (:37-52) — add `light: number[] = [];` next to `col`; `push` becomes:

```ts
  push(x: number, y: number, z: number, s: number, u: number, v: number, bl: number, sk: number): void {
    this.pos.push(x, y, z);
    this.col.push(s, s, s, 1.0);
    this.uv.push(u, v);
    this.light.push(bl, sk);
    this.verts++;
  }
```

`toBuffer()` — add `light: new Float32Array(this.light),` to the returned object.

New corner helper (place it right above `meshChunk`, with a comment):

```ts
// Per-corner light: the max over the UP TO 3 cells the vertex corner pokes into —
// the cell across the face, plus the two face-diagonal cells (offset along the face's
// u/v axes toward the corner) — per field independently. The max-over-3 keeps a corner
// lit when a solid tucks into the corner of the outside cell (the classic
// one-dark-corner artifact). Solid candidate cells contribute their stored value,
// which the propagation keeps naturally low. Returned normalized (level / 15).
function cornerLight(l: LightSampler, wx: number, wy: number, wz: number, face: FaceDef, c: readonly number[]): [number, number] {
  const ax = face.dir[0], ay = face.dir[1], az = face.dir[2];
  const su = c[face.axes[0]] === 1 ? 1 : -1;
  const sv = c[face.axes[1]] === 1 ? 1 : -1;
  const nx = wx + ax, ny = wy + ay, nz = wz + az;
  const [bl0, sk0] = l(nx, ny, nz);
  // diagonal candidates: the across-cell shifted one corner step along each face axis
  const sx = ax === 1 ? su : 0, sy = ay === 1 ? su : 0, sz = az === 1 ? su : 0;
  const [bl1, sk1] = l(nx + sx, ny + sy, nz + sz);
  const tx = ax === 1 ? sv : 0, ty = ay === 1 ? sv : 0, tz = az === 1 ? sv : 0;
  const [bl2, sk2] = l(nx + tx, ny + ty, nz + tz);
  return [Math.max(bl0, bl1, bl2) / 15, Math.max(sk0, sk1, sk2) / 15];
}
```

`meshChunk` signature (:260): `export function meshChunk(world: World, cx: number, cy: number, cz: number, lightAt: LightSampler): ChunkMesh`.

Cube path (:305-314): in the corner loop, after the `occ` compute, get the pair once and pass it:

```ts
            const [bl, sk] = cornerLight(lightAt, wx, wy, wz, face, c);
            buf.push(wx + c[0], wy + c[1], wz + c[2], FACE_SHADE[f] * AO_SHADE[occ], (tileCol + c[au]) / 16, (15 - tileRow + c[av]) / 16, bl, sk);
```

`pushBox` (:165-192): extend the signature with `lightAt: LightSampler, wx: number, wy: number, wz: number` (after `hidden`), and in its corner loop:

```ts
    for (const c of face.corners) {
      const [bl, sk] = cornerLight(lightAt, wx, wy, wz, face, c);
      buf.push(min[0] + c[0] * size[0], min[1] + c[1] * size[1], min[2] + c[2] * size[2], FACE_SHADE[f], (tileCol + c[au]) / 16, (15 - tileRow + c[av]) / 16, bl, sk);
    }
```

`emitTorch` (:195-225) and `emitDoor` (:232-256): extend signatures with `lightAt: LightSampler` (before or after `meta` — pick after `meta`) and pass `lightAt, wx, wy, wz` to every `pushBox` call inside.

Call sites in `meshChunk`'s kind dispatch (:284-286): pass `lightAt` through.

- [ ] **Step 4: Update `main.ts`** — `toGeometry` (:236-241) add the attribute line:

```ts
  g.setAttribute('aLight', new THREE.BufferAttribute(b.light, 2));
```

`rebuildChunkMesh` (:257):

```ts
  const { opaque, trans } = meshChunk(world, cx, cy, cz, (x, y, z) => world.getLight(x, y, z));
```

- [ ] **Step 5: Run to verify**

Run: `npx vitest run src/__tests__/chunk-mesher.test.ts`
Expected: PASS (old tests with `NO_LIGHT` + 3 new).
Run: `npm test` → `npm run build`
Expected: `Tests  140 passed`; build clean.

- [ ] **Step 6: Commit**

```bash
git add src/chunk-mesher.ts src/main.ts src/__tests__/chunk-mesher.test.ts
git commit -m "feat: mesher bakes per-corner light into a new aLight vertex attribute (3-candidate max per field); toGeometry exports it"
```

---

### Task 10: Shader injection (`uDayness`/`uAmbient`) + `WorldTime` phase seed + dev hooks

**Files:**
- Modify: `src/time.ts` (constructor), `src/main.ts` (materials :183-191, `worldTime` :197, frame loop :793-796, a `?dbg` hook next to the renderer)
- No unit tests (GLSL + WebGL; pinned by Task 14's headless pixels). tsc-verified.

- [ ] **Step 1: `WorldTime` constructor arg** — `src/time.ts`:

```ts
export class WorldTime {
  /** Total simulation time (s). */
  time = 0;
  /** Total phase progressed, in cycles. Stored, not derived from `time`, so the cycle can later run independently. */
  private phaseTotal: number;

  /** `startPhase` (default 0 = noon) lets verification/URL hooks (main.ts `?phase=`) reach any time of day without a real-time wait. */
  constructor(startPhase = 0) {
    this.phaseTotal = startPhase;
  }
```

- [ ] **Step 2: Shader injection** — `src/main.ts`, insert after the `matTrans` creation (:191):

```ts
// === per-vertex light (PROJECT.md §18) ===
// aLight = (blight, skylight) 0..1 baked per corner by the mesher. uDayness scales the
// sky component per frame (day/night fades in O(1) — no re-baking, no brightness
// wavefront at dusk); uAmbient is the unlit floor so deep night is dark but readable.
const daynessUniforms: { value: number }[] = [];
function addLightShader(mat: THREE.MeshBasicMaterial): void {
  const uDay = { value: 1.0 };
  const uAmb = { value: LIGHT_AMBIENT };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDayness = uDay;
    shader.uniforms.uAmbient = uAmb;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aLight;\nvarying vec2 vLight;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvLight = aLight;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDayness;\nuniform float uAmbient;\nvarying vec2 vLight;\n')
      .replace('#include <color_fragment>', '// per-vertex light: sky component fades with dayness; block light never does\nfloat bwLight = clamp(max(vLight.x, vLight.y * uDayness), 0.0, 1.0);\ndiffuseColor.rgb *= uAmbient + (1.0 - uAmbient) * bwLight;\n#include <color_fragment>');
  };
  daynessUniforms.push(uDay);
}
addLightShader(matOpaque);
addLightShader(matTrans);
```

(`onBeforeCompile` fires on first use of each material — the closures capture `uDay`/`uAmb`, so the per-frame write below reaches the compiled program. The name `bwLight` avoids colliding with any three.js identifier; `diffuseColor` exists in the basic fragment before `color_fragment` multiplies the vertex color — the product order is irrelevant for scalar multiplies.)

- [ ] **Step 3: `?phase=` + dev debug hook** — `src/main.ts`:

At the `worldTime` construction (:197), replace with:

```ts
// ?phase=<0..1> dev-only: seeds the day phase (e.g. ?phase=0.5 = deep night) so
// headless/visual verification reaches any time of day without a 120 s real-time wait.
const phaseParam = new URLSearchParams(location.search).get('phase');
const startPhase = phaseParam !== null && phaseParam !== '' && Number.isFinite(+phaseParam) ? +phaseParam : 0;
const worldTime = new WorldTime(startPhase);
```

Next to the `renderer` creation (find `const renderer = new THREE.WebGLRenderer(`), add:

```ts
// ?dbg dev-only: exposes the render triple for headless pixel verification (readPixels
// after a forced render). Never used outside that rig.
if (new URLSearchParams(location.search).has('dbg')) {
  (window as unknown as Record<string, unknown>).__bw = { renderer, scene, camera };
}
```

(Place it after `camera` exists — the renderer section is before `=== camera ===`; move the hook to right after the camera section if `camera` isn't in scope yet at the renderer line.)

Per-frame uniform write — in `frame()`, after `sky.apply(skySample, waterFx, camera);` (:794):

```ts
  for (const u of daynessUniforms) u.value = skySample.dayness;
```

- [ ] **Step 4: `light.ts` import** — `main.ts` already imports from `'./light'`? No yet (Task 11 does). Add now to the import line:

```ts
import { LIGHT_AMBIENT } from './light';
```

- [ ] **Step 5: Verify**

Run: `npm test` → `npm run build`
Expected: `Tests  140 passed`; build clean.
Manual shader smoke (optional but cheap): `npm run dev`, open `localhost:5173?phase=0.5&dbg` — the world renders (dark, not black-cleared); `localhost:5173` renders as today-but-brighter-at-night-wait: daytime rendering must look UNCHANGED from a quick compare (face/AO intact). If the world renders UNLIT-black, the GLSL anchor replace failed — check `renderer.info` / the console for a shader compile error (the headless task will catch this too).

- [ ] **Step 6: Commit**

```bash
git add src/time.ts src/main.ts
git commit -m "feat: per-vertex light shader (uDayness + uAmbient onBeforeCompile); WorldTime phase seed + ?phase/?dbg dev hooks"
```

---

### Task 11: `main.ts` wiring — substep tick, edit sites, streaming settle/unload, touched drain

**Files:**
- Modify: `src/main.ts` (import :2-ish, `lightSim` after `sim` :217, substep :771-773, break path ~:480, torch ~:538, door place ~:536, block place ~:552, `toggleDoorPair` :427-437, `clearDoorPartner` :439-445, `tickStreaming` :717-724, touched drain after the `sim.touched` block :781-788)

No unit test (integration layer; pinned by Task 13's replay + Task 14's pixels + the user's in-browser pass).

- [ ] **Step 1: Instance + import**

`src/main.ts` imports — add:

```ts
import { LightSim, LIGHT_TICK_BUDGET } from './light';
```

After `const sim = new WaterSim(world);` (:217):

```ts
// Light sim (PROJECT.md §18, src/light.ts): two 0..15 fields streamed with each chunk;
// drained every substep (near-instant), settled per loaded chunk (like sim), and its
// `touched` set re-meshes changed chunks at the frame end (the sim.touched contract).
const lightSim = new LightSim(world);
```

- [ ] **Step 2: Substep tick** — in `frame()`'s `while (acc >= STEP)` body, insert after `worldTime.advance(STEP);` (:772) and before `tickStreaming();`:

```ts
    lightSim.tick(LIGHT_TICK_BUDGET);
```

- [ ] **Step 3: Edit sites** — add a `lightSim.edit(…)` sibling at every existing `sim.edit(…)` site (the grep anchor pattern is `sim.edit(` in `src/main.ts`):

- break path (after `sim.edit(hit.x, hit.y, hit.z, Block.Air);`):
  ```ts
  lightSim.edit(hit.x, hit.y, hit.z); // water/wall removal changes block AND sky exposure
  ```
- torch placement (after `sim.edit(tx, ty, tz, Block.Torch);`):
  ```ts
  lightSim.edit(tx, ty, tz); // the glow wave
  ```
- door placement (after the two `sim.edit(tx, ty [+1], tz, …)` lines):
  ```ts
  lightSim.edit(tx, ty, tz); lightSim.edit(tx, ty + 1, tz);
  ```
- block placement (after `sim.edit(tx, ty, tz, held);`):
  ```ts
  lightSim.edit(tx, ty, tz);
  ```

- `toggleDoorPair` (:427-437) — doors change light (open 0 / closed 15) but this function has NO `sim.edit` (doors are water-irrelevant) — ADD both halves after the setBlocks/remeshes:
  ```ts
  lightSim.edit(x, y, z);
  if (p) lightSim.edit(p[0], p[1], p[2]);
  ```
- `clearDoorPartner` (:439-445) — after `sim.edit(p[0], p[1], p[2], Block.Air);` add `lightSim.edit(p[0], p[1], p[2]);`

- [ ] **Step 4: Streaming** — in `tickStreaming()` (:717-724):

In the `unloaded` loop, after `removeChunkMesh(c.cx, c.cy, c.cz);`:

```ts
    lightSim.onChunkUnloaded(c.cx, c.cy, c.cz); // cells lit through the removed chunk darken
```

In the `rebuilt` loop, after `sim.settle(c.cx, c.cy, c.cz);`:

```ts
    lightSim.settleChunk(c.cx, c.cy, c.cz);
```

- [ ] **Step 5: Touched drain** — after the `sim.touched` block (:781-788), mirror it exactly:

```ts
  const ltouched = lightSim.touched; // re-mesh any chunk whose LIGHT changed this frame (edits + settles + cross-seam waves), then drain — same contract as sim.touched
  if (ltouched.size) {
    for (const key of ltouched) {
      const [cx, cy, cz] = key.split(',').map(Number);
      if (world.hasChunk(cx, cy, cz)) rebuildChunkMesh(cx, cy, cz);
    }
    ltouched.clear();
  }
```

- [ ] **Step 6: Verify**

Run: `npx rg -n "sim.edit\(" src/main.ts | wc -l` vs `npx rg -n "lightSim.edit\(" src/main.ts | wc -l` — the light count must be ≥ the sim count (light also seeds at the no-sim door toggle).
Run: `npm test` → `npm run build`
Expected: `Tests  140 passed`; build clean.
`npm run dev` spot check (manual, 30 s): place a torch at night (`?phase=0.5` then a normal reload for day) — its glow appears within a couple of frames; break it — the area darkens; open a door in a wall — light comes through (or darkness does); close it — dark again.

- [ ] **Step 7: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire the light sim into the loop — substep tick, edit-site seeds, streaming settle/unload, frame-end touch drain"
```

---

### Task 12: Node boot-replay (field sanity + pop-count lineage)

**Files:**
- Create: `src/__tests__/light-load.test.ts`

A deterministic node replay of the boot path (same pattern as `src/__tests__/water-load.test.ts` — read it first for the shape; it re-runs the boot-generation loop and drains the water sim). Purpose: pin the "hard part" — a real spawn-ring settle stays within budget AND the fields are sane on REAL terrain (not just synthetic boxes).

- [ ] **Step 1: Write the test** — `src/__tests__/light-load.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { World, chunkOf } from '../world';
import { Block } from '../blocks';
import { TerrainGen, TERRAIN_SEED } from '../terrain';
import { streaming } from '../streaming';
import { WaterSim } from '../water';
import { LightSim, LIGHT_SETTLE_GUARD } from '../light';

const SPAWN_X = 6, SPAWN_Z = 46; // main.ts's spawn column (world x 0..15, z 32..47)

// Replay the boot: generate the spawn column (like main.ts's pre-streaming column),
// then drive streaming.update (budgeted loads/remeshes) to a stable ring, settling
// water + light on every load exactly like tickStreaming does, and draining both
// sims' queues between calls (node-side stand-in for the clocks).
function replayBoot(world: World, gen: TerrainGen, sim: WaterSim, lightSim: LightSim): void {
  for (let cy = 0; cy <= 4; cy++) {
    // generateChunkTerrain lives in src/terrain.ts — import it the way main.ts does
  }
}

describe('light boot replay (spawn ring)', () => {
  it('settles the spawn ring within budget, and the fields are sane on real terrain (open columns 15, under the sea attenuated, nothing below the void floor at y=0 dark-by-absence)', () => {
    const world = new World();
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2); // main.ts's pre-streaming spawn column (import generateChunkTerrain from '../terrain')
    const sim = new WaterSim(world);
    const lightSim = new LightSim(world);
    // main.ts settles the boot column's water on the first tickStreaming; do the light side here and settle the water like the sim does:
    sim.settle(0, 2, 2);
    lightSim.settleChunk(0, 2, 2);
    // drive the ring to a stable state (streaming budgets 2 loads/call; loop until a call rebuilds nothing new)
    let guard = 0;
    for (;;) {
      const r = streaming.update(world, chunkOf(SPAWN_X), chunkOf(SPAWN_Z), 2);
      if (r.rebuilt.length === 0 && r.unloaded.length === 0) break;
      for (const c of r.rebuilt) {
        sim.settle(c.cx, c.cy, c.cz);
        lightSim.settleChunk(c.cx, c.cy, c.cz);
      }
      for (const c of r.unloaded) lightSim.onChunkUnloaded(c.cx, c.cy, c.cz);
      // the 60 Hz substep + the 2 Hz water clock, collapsed
      lightSim.tick(100_000);
      sim.tick(100_000);
      if (++guard > 500) throw new Error('replay did not stabilize in 500 streaming calls');
    }
    // ---- field sanity on the REAL terrain ----
    // 1) the spawn column is open-grass sky: skylight 15 a few cells above the surface.
    expect(world.getLight(SPAWN_X, 40, SPAWN_Z)[1]).toBe(15);
    // 2) the sea east of spawn (worldgen water, O=2 per cell): a water cell one deep
    //    below the surface reads 13, and the air below the sea surface is <= the
    //    column-sum attenuation (probe for the exact cell, then pin it).
    let sea: [number, number] | null = null; // [x, surfaceY] — the first water column at z=46, x >= 10
    outer: for (let x = 10; x < 64; x++) for (let y = 40; y >= 20; y--) {
      if (world.getBlock(x, y, 46) === Block.Water) { sea = [x, y]; break outer; }
    }
    expect(sea, 'the sea east of spawn').not.toBeNull();
    const [sx2, sy2] = sea!;
    const topWaterSky = world.getLight(sx2, sy2, 46)[1];            // the topmost water cell of the column
    expect(topWaterSky, 'topmost sea water cell skylight').toBe(15); // open to the sky: nothing opaque above IT
    const belowWaterSky = world.getLight(sx2, sy2 - 1, 46)[1];       // one cell lower (air or water): attenuated by the topmost water's O=2...
    // NOTE: if (sx2, sy2-1) is ALSO water (a column under sea level), it reads 13; if it is the seafloor AIR one under a 1-deep sea, it reads 13 (15 - 2) as well — the pinned assertion is on the DELTA:
    expect(topWaterSky - belowWaterSky, 'one cell deeper through water attenuates by exactly 2').toBe(2);
    // 3) the whole ring is non-negative and <= 15 (invariant), with no NaN/overflow artifacts:
    for (const c of world.allChunks()) {
      for (let i = 0; i < c.blight.length; i++) {
        expect(c.blight[i]).toBeLessThanOrEqual(15);
        expect(c.skylight[i]).toBeLessThanOrEqual(15);
      }
    }
    // 4) budget lineage: total settle+tick pops over the whole boot stay bounded
    //    (the number is DETERMINISTIC — pinned once by running, then asserted exactly,
    //    like water-load.test.ts's lineage. Run once, read stats.pops, pin it.)
    expect(lightSim.stats.pops, 'settle pop lineage').toBe(/* PIN: <measured value> */);
    expect(lightSim.stats.pops).toBeLessThanOrEqual(LIGHT_SETTLE_GUARD * 40); // hard ceiling: <= 40 full-chunk-settle equivalents — the frame-budget guard (measured on the 400-frame walk probe, Task 14)
  });
});
```

**Worker instruction for Step 1:** the test body above is the intended final form with one deliberate hole — the `/* PIN: <measured value> */` in assertion 4. Write the file, run it ONCE with the pin placeholder replaced by `Number.MAX_SAFE_INTEGER` (a temporary always-pass), read the actual `stats.pops` from the console (add a `console.log(lightSim.stats)` temporarily), then set the exact number. Also: import `generateChunkTerrain` from `'../terrain'` (check its export name in that file — main.ts imports it as `generateChunkTerrain`); delete the unused `replayBoot` scaffold function above (it's a placeholder for the loop that lives inline); the `outer:` labeled break is valid TS/ES2022.

- [ ] **Step 2: Run**

Run: `npx vitest run src/__tests__/light-load.test.ts`
Expected: first run RED on the pinned value (expected the MAX_SAFE_INTEGER placeholder ≠ actual); after pinning the measured value: PASS.

- [ ] **Step 3: Full green + commit**

Run: `npm test` → `npm run build`
Expected: `Tests  141 passed`; build clean.

```bash
git add src/__tests__/light-load.test.ts
git commit -m "test: light boot replay — spawn-ring settle within budget, real-terrain field sanity, deterministic pop lineage"
```

---

### Task 13: Headless visual verification (SwiftShader pixel sampling)

**Files:**
- Create (scratch, NOT committed): `.light-verify.mjs` (repo root)
- Run against the BUILT bundle: `npx vite preview --port 5199 --strictPort` (tests the real GLSL path, not the dev transform)

Reuses the established rig: `playwright-core` (must be installed — check `node_modules/playwright-core`; if absent: `npm i --no-save playwright-core`), chromium at `$HOME/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome` (check the actual version dir under `$HOME/.cache/ms-playwright/`), launched with SwiftShader args. The `?dbg` hook (Task 10) exposes `{ renderer, scene, camera }` for a forced render + `readPixels`.

- [ ] **Step 1: Start the preview server (NOT pkill-based cleanup — use a pidfile)**

```bash
npx vite preview --port 5199 --strictPort > /tmp/opencode/preview.log 2>&1 & echo $! > /tmp/opencode/preview.pid
```

- [ ] **Step 2: Write the verify script** — `.light-verify.mjs`:

```js
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';

const chromeDir = await import('node:fs/promises').then((fs) =>
  fs.readdir(homedir() + '/.cache/ms-playwright'));
const ver = chromeDir.find((d) => d.startsWith('chromium-'));
const browser = await chromium.launch({
  executablePath: homedir() + `/\.cache/ms-playwright/${ver}/chrome-linux64/chrome`.replace('\\.', '.'),
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--window-size=960,600'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5199/', { waitUntil: 'load' });
await browser.close();
console.log('console/page errors:', errors.length ? errors : 'none');
```

(Fix the executablePath join with plain string concatenation — the `.replace` above is a bug trap: build it as `homedir() + '/.cache/ms-playwright/' + ver + '/chrome-linux64/chrome'`.)

Extend the script with the three pixel checks (each navigates fresh with `?phase=` + `?dbg`, waits ~4 s for boot + settle, forces a render, reads the center pixel of 5 different screen positions):

```js
async function sample(phase) {
  const b = await chromium.launch({ executablePath, args });
  const p = await (await b.newContext()).newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(`http://localhost:5199/?phase=${phase}&dbg`, { waitUntil: 'load' });
  await p.waitForTimeout(4000);
  const pts = await p.evaluate(async () => {
    const { renderer, scene, camera } = window.__bw;
    const read = (x, y) => new Promise((res) => requestAnimationFrame(() => {
      renderer.render(scene, camera);
      const gl = renderer.getContext();
      const px = new Uint8Array(4);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      res([px[0], px[1], px[2]]);
    }));
    // five sample positions across the center band (terrain at most positions)
    return Promise.all([read(480, 300), read(300, 350), read(660, 350), read(480, 420), read(200, 250)]);
  });
  await b.close();
  return { errs, pts };
}
const day = await sample(0.0);
const night = await sample(0.5);
// ---- assertions ----
import assert from 'node:assert';
assert.equal(day.pts[4].filter((c) => c > 200).length >= 2, true, 'daytime: sky-blue dominant sample (sanity: rendering works, phase 0 = noon)');
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
for (let i = 0; i < day.pts.length; i++) {
  const d = lum(day.pts[i]), n = lum(night.pts[i]);
  assert(n < d * 0.45, `night luminance < 0.45* day at sample ${i} (n=${n.toFixed(1)} d=${d.toFixed(1)})`); // dayness 0 + the 0.12 ambient floor darkens by far more than half at terrain samples
  assert(n > d * 0.02, `night luminance > 2% of day at sample ${i} — the ambient floor keeps it dark but READABLE, not black-cleared`);
}
assert.deepEqual(night.pts.map((p) => p), night.pts.map((p) => p), 'trivial — keep for shape');
for (const e of [...day.errs, ...night.errs]) throw new Error('page error: ' + e);
console.log('day  center:', day.pts[0], 'night center:', night.pts[0]);
for (let i = 0; i < day.pts.length; i++) console.log(`sample ${i}: day ${day.pts[i]} (${lum(day.pts[i]).toFixed(1)}) / night ${night.pts[i]} (${lum(night.pts[i]).toFixed(1)})  ratio ${ (lum(night.pts[i]) / Math.max(1, lum(day.pts[i]))).toFixed(3) }`);
console.log('LIGHT VERIFICATION PASSED');
```

Expected output: five day/night pairs with night ≈ 10–20% of day luminance (the 0.12 ambient floor, moderated by fog/camera position), NO page errors (a failed GLSL anchor replace surfaces here as a compile error / black canvas), and the ratio lines proving the floor is neither black (≥2%) nor daylike (≤45%). If a sample position happens to be sky (not terrain) the assertion may false-positive — in that case record the exact values and pick another band; the point is the day/night RATIO at terrain samples, and the no-error guarantee.

- [ ] **Step 3: Run + record**

Run: `node .light-verify.mjs`
Expected: `LIGHT VERIFICATION PASSED` + the ratio table. Record the table (pasted values) for Task 15's docs. Kill the server by pidfile: `kill $(cat /tmp/opencode/preview.pid)`.

- [ ] **Step 4: Cleanup + commit the evidence**

The script is scratch (do NOT commit `.light-verify.mjs` — if the repo's `.gitignore` doesn't cover dot-scripts, the file simply stays untracked; verify `git status --porcelain` shows nothing new, or `rm` it after recording the output). Commit nothing in this task (evidence goes into the docs commit):

```bash
kill $(cat /tmp/opencode/preview.pid)
git status --porcelain   # expected: clean (or only this task's no-ops)
```

---

### Task 14: Docs — PROJECT.md §18, TODO resolution, README, spec sync

**Files:**
- Modify: `PROJECT.md` (new §18 after §17, the §15 deferral line :~155, the §9-style budget note lives inside §18), `TODO.md` (the "Dynamic lighting" bullet :96-104), `README.md` (features list), `docs/superpowers/specs/2026-08-19-dynamic-lighting-design.md` (one-line sync: the frame-end drain re-meshes touched chunks IMMEDIATELY, mirroring the `sim.touched` block, rather than marking them dirty for the streaming budget — the implementation shape chosen in Task 11)

- [ ] **Step 1: PROJECT.md §18** — append after §17 (the sky section):

```markdown
## 18. Dynamic lighting with light levels (post-POC, 2026-08-19)

Spec: `docs/superpowers/specs/2026-08-19-dynamic-lighting-design.md`.

Two 0–15 integer light fields per chunk (`blight` torch light, `skylight`
open-to-sky exposure) are propagated locally through the voxel grid — the
classic voxel-sandbox convention: every cell re-derives
`max(emission, max neighbor − 1 − O(neighbor))` (attenuation paid *exiting* the
neighbor); light never knows which source lit it; changes walk a queue to a
stable state. O: air/torch/open-door 0, glass 1, leaves/water 2, closed-door/
solid 15 (nothing passes). Emission: torches 14; sky columns emit
`15 − (capped opacity sum above)` — open air columns 15 (no vertical air
decay), glass 14 below, water −2 per cell, rock 0.

- `src/light.ts` — `lightOpacity` (door-meta-aware), `columnSum` (per-chunk
  colSum[256] cache), `skyEmit` (the column walk, ≤ ~21 ops worst case), and
  `LightSim`: the water-sim-shaped engine (world-coord `Set<string>` queue,
  `tick(2500)` drained at every 60 Hz substep — near-instant torch waves
  settle in 1–3 substeps — `edit()` at every player mutation + the door
  toggle, `settleChunk()` per loaded chunk (bounded 4096 inline pops, seam
  seeding into loaded neighbors), `onChunkUnloaded()` seam seeding so cells
  lit *through* a removed chunk darken, and a `touched` set consumed once
  per frame exactly like `sim.touched`). De-propagation needs no special
  pass: a removed torch's wave stops dead at cells a surviving source still
  supports (target == current).
- The renderer bakes `aLight = (blight, skylight)/15` per vertex corner (the
  3-candidate max: the across-face cell + the two face-diagonal cells, per
  field), and the two chunk materials carry a one-uniform day/night pass:
  `factor = 0.12 + 0.88 * max(bl, sk * uDayness)` — `uDayness` is the
  `worldDim` ramp normalized to 0–1 (sky and light fade on the same curve),
  so night is an O(1) uniform write: no re-baking, no brightness wavefront
  sweeping the ring at dusk. The 0.12 ambient floor is the "dark but
  readable" choice; the old `worldDim` MATERIAL dim is gone (it survives as
  the cloud/sky visual tint only).
- Torch light is time-invariant (emission doesn't scale with dayness); sky
  light dies at night; underwater darkening falls out of water's O=2 per
  cell. Clouds do not attenuate (texture plane, follow-up). Flow *levels*
  are light-irrelevant (flat O=2) — the water sim never touches the light
  sim.
- POC deviations: light stops at ungenerated chunks (nothing through the
  void, like water); a partially-loaded column reads low until the upper
  chunks' seam seeding re-seeds it (self-heals within a few ticks); water
  opacity is level-flat; boot settle cost is pinned by
  `src/__tests__/light-load.test.ts` (real spawn ring, deterministic pop
  lineage). Walking stays within the §9 budget (p95 ≈ 7 ms target; the
  light tick is O(0) when idle — the queue only holds cells a recent
  edit/load actually queued).
```

- [ ] **Step 2: PROJECT.md §15** — the deferral bullet (the `~~Flood-fill skylight and blocklight propagation…~~` line) — it is already struck-through as moved; extend its parenthetical with: `(landed 2026-08-19, branch `dynamic-lighting` — see §18)`.

- [ ] **Step 3: TODO.md** — replace the "Dynamic lighting with light levels" bullet's body with the resolved marker, mirroring the day/night-clouds resolution style:

```markdown
- ~~Dynamic lighting with light levels (for torch / sun / moon positions).~~
  **Resolved (2026-08-19, branch `dynamic-lighting`):** `src/light.ts`
  (two 0–15 fields + the recompute-relaxation queue: torches 14, sky
  columns 15 with no vertical air decay, door/glass/leaves/water
  attenuation, de-propagation by relaxation — no special pass), baked
  per-vertex into the chunk meshes with a `uDayness` uniform day/night
  pass (the `worldDim` material dim it replaced is gone; the 0.12 ambient
  floor keeps deep night readable). Torches now glow. See
  `docs/superpowers/specs/2026-08-19-dynamic-lighting-design.md` and
  PROJECT.md §18.
```

- [ ] **Step 4: README.md** — the features/capabilities list: replace the "torches are decorative (visual only)"-style line (grep `torch` in README.md; adjust the wording actually present) with: dynamic lighting — torches emit 14-level light that propagates through the grid, sky light follows the day/night cycle per block, doors/glass/leaves/water attenuate.

- [ ] **Step 5: Spec sync** — in the spec's "## main.ts wiring" bullet for the frame-end touched consumption, replace the phrase "marking those chunks `dirty` for the existing ≤2-remeshes/frame drain" with "re-meshed immediately at the frame end — the exact mirror of the `sim.touched` drain block (touched chunks per event stay small: ≤ ~6 for a torch edit, ≤ ~5 column chunks for a sky edit)".

- [ ] **Step 6: commit**

```bash
git add PROJECT.md TODO.md README.md docs/superpowers/specs/2026-08-19-dynamic-lighting-design.md
git commit -m "docs: PROJECT.md §18 dynamic lighting; TODO resolution; README; spec drain-shape sync"
```

---

### Self-Review (author's, per the writing-plans skill)

- **Spec coverage:** fields+storage (Tasks 1-2) ✓; rule/opacity/emission (Task 3) ✓; engine pop/tick (Task 4) ✓; edit seeds + removal waves (Task 5) ✓; load/unload seam seeding (Tasks 5-6) ✓; deterministic (Task 6) ✓; dayness (Task 7) ✓; worldDim retirement (Task 8) ✓; aLight mesher + 3-candidate rule (Task 9) ✓; shader + ambient floor + ?phase (Task 10) ✓; wiring: substep tick / edit sites / streaming / touched drain (Task 11) ✓; boot replay + budget (Task 12) ✓; headless verification incl. night floor pixels (Task 13) ✓; docs (Task 14) ✓. Out-of-scope items (glowstone, persistence, level-dependent water opacity, cloud shadows) are recorded in the spec's Follow-ups — intentionally not planned.
- **Placeholder scan:** Task 12's pop-count pin is a deliberate measured-value step (explicit worker instruction, water-load lineage pattern — the same method the water numbers used), not a placeholder; Task 13's `executablePath` join is specified with the corrected concatenation. No TBDs.
- **Type consistency:** `LightSampler` (chunk-mesher :Task 9) is the only light type crossing modules; `World.getLight` returns `[number, number]` 0..15 used by both main.ts's adapter and the mesher; `LightSim` API (`tick/edit/settleChunk/onChunkUnloaded/touched/stats`) used identically in Tasks 4-6, 11, 12; `dayness` on `SkySample` (Task 7) consumed by the frame loop (Task 10's per-frame write moved to reference `skySample.dayness` — the write site is inserted in Task 10 after Task 11's loop context; ordering is safe because both only touch `frame()` in disjoint regions: the uniform write goes next to `clouds.update`, the light wiring in Tasks 10/11 is disjoint).