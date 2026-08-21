# Water Level Mesh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Water surface height becomes the per-cell flow state — a resting flow cell renders at `wlevel/8` (a spring's fan reads as a stepped gradient), source and stream water render full height, and a taller water cell emits a skirt face against a lower water neighbour.

**Architecture:** A pure height helper (`waterSurfaceHeight` in `src/blocks.ts`) + a `World.getWaterHeight` accessor (`src/world.ts`) + a water-specific emitter (`emitWater` in `src/chunk-mesher.ts`) with a neighbour-height reader. Face culling for water becomes a height comparison; water faces skip vertex AO (partial geometry). No simulation changes — `WaterSim.writeCell` writes through `world.setBlock`, which already marks the chunk and its six neighbours dirty, so boundary skirts update through the existing budgeted remesh.

**Tech Stack:** TypeScript, three.js (pure vertex buffers only — no scene/material changes), vitest.

**Context for the executor:** Work on branch `water-level-mesh` (already created; the design spec is committed at `docs/superpowers/specs/2026-08-20-water-level-mesh-design.md` — read it first). Tests run with `npx vitest run <file>`. The sim invariant this feature relies on: a `Water` block cell always has `wlevel >= 1` (world.ts: "0 dry, 1..7 water"), so `wlevel/8` is always `0.125..0.875` — no degenerate zero-height box is possible.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/blocks.ts` | Add `waterSurfaceHeight(wlevel, wsource, wstream)` | Pure height rule: source/stream → 1.0, else `wlevel/8`. Lives here (not chunk-mesher.ts) because `world.ts` must import it and `world.ts` must not import `chunk-mesher.ts` (circular). |
| `src/world.ts` | Add `World.getWaterHeight(x, y, z)` | Cross-chunk neighbour height read; missing chunk → 0 (dry), mirroring `getBlock` = Air. |
| `src/chunk-mesher.ts` | Add `emitWater(...)`; add `gl` reader in `meshChunk`; route `Block.Water` to `emitWater` | All six water faces: partial box at height `h`, skirt cull rule, no vertex AO. |
| `src/__tests__/blocks.test.ts` | Add `waterSurfaceHeight` table | Unit-pins the height rule. |
| `src/__tests__/world.test.ts` | Add `getWaterHeight` cases | Unit-pins the accessor (incl. missing chunk → 0). |
| `src/__tests__/chunk-mesher.test.ts` | Update the existing water test (it sets `wlevel = 0`, violating the invariant) + new `chunk-mesher water level mesh` describe | Pins geometry: heights, skirt, cull, stream column, lip, no-AO, light. |
| `TODO.md` / `PROJECT.md` | Mark the deferred item resolved; correct the two "render-cosmetic" lines in §9 | Docs. |

`src/water.ts`, `src/main.ts`, `src/streaming.ts` — **no changes** (verified: dirty-marking already covers boundary neighbours; the load replays call `meshChunk` for timing only, never assert geometry).

---

### Task 1: `waterSurfaceHeight` in `src/blocks.ts`

**Files:**
- Modify: `src/blocks.ts` (append at end of file)
- Test: `src/__tests__/blocks.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/__tests__/blocks.test.ts`:

```ts
import { waterSurfaceHeight } from '../blocks';

describe('waterSurfaceHeight', () => {
  it('resting flow: wlevel / 8 (levels 1..7 -> 0.125..0.875)', () => {
    expect(waterSurfaceHeight(1, 0, 0)).toBe(1 / 8);
    expect(waterSurfaceHeight(4, 0, 0)).toBe(0.5);
    expect(waterSurfaceHeight(7, 0, 0)).toBe(7 / 8);
  });

  it('source or stream: full height at any level', () => {
    expect(waterSurfaceHeight(5, 1, 0)).toBe(1);
    expect(waterSurfaceHeight(3, 0, 1)).toBe(1);
    expect(waterSurfaceHeight(7, 1, 1)).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/blocks.test.ts`
Expected: FAIL — the module does not provide an export named `waterSurfaceHeight` (import/collection error).

- [ ] **Step 3: Implement the helper**

Append to the end of `src/blocks.ts` (after `doorPlacementFromView`):

```ts
// === water surface height (docs/superpowers/specs/2026-08-20-water-level-mesh-design.md) ===

/**
 * Water surface height (0..1) for a cell's flow state: source and stream cells render
 * full height; resting flow renders wlevel/8 (level 1..7 -> 0.125..0.875). Pure in the
 * three per-cell bytes (world.ts wlevel/wsource/wstream); callers invoke it for Water
 * cells only, whose invariant (block == Water => wlevel >= 1) keeps the result in
 * 0.125..1.0. Lives in blocks.ts (not chunk-mesher.ts) so world.ts can import it
 * without a circular dependency.
 */
export function waterSurfaceHeight(wlevel: number, wsource: number, wstream: number): number {
  if (wsource || wstream) return 1;
  return wlevel / 8;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/blocks.test.ts`
Expected: PASS (all tests in the file, old and new).

- [ ] **Step 5: Commit**

```bash
git add src/blocks.ts src/__tests__/blocks.test.ts
git commit -m "feat: waterSurfaceHeight — per-level water surface rule (source/stream full, flow wlevel/8)"
```

---

### Task 2: `World.getWaterHeight` in `src/world.ts`

**Files:**
- Modify: `src/world.ts:1-103` (import line; new method after `getMeta`)
- Test: `src/__tests__/world.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/__tests__/world.test.ts` (inside the existing `describe('world', ...)` block, after the `light fields` test):

```ts
  it('getWaterHeight: flow level/8, source/stream full, missing chunk reads 0 (dry)', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(5, 5, 5)] = Block.Water;
    c.wlevel[localIndex(5, 5, 5)] = 6;
    expect(w.getWaterHeight(5, 5, 5)).toBe(0.75);
    c.wsource[localIndex(5, 5, 5)] = 1;
    expect(w.getWaterHeight(5, 5, 5)).toBe(1);
    c.wsource[localIndex(5, 5, 5)] = 0;
    c.wstream[localIndex(5, 5, 5)] = 1;
    expect(w.getWaterHeight(5, 5, 5)).toBe(1);
    expect(w.getWaterHeight(64, 5, 5)).toBe(0); // chunk (1,0,0) not loaded: reads dry
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/world.test.ts`
Expected: FAIL — `TypeError: w.getWaterHeight is not a function`.

- [ ] **Step 3: Implement the accessor**

In `src/world.ts`, update the import (line 1):

```ts
import { Block, isOpaque, isDoor, doorOpen, waterSurfaceHeight } from './blocks';
```

Add the method after `getMeta` (after line 103, before `getLight`):

```ts
  /**
   * Water surface height (0..1) at a cell: waterSurfaceHeight of its
   * wlevel/wsource/wstream bytes. Missing chunk reads 0 (dry), mirroring
   * getBlock = Air. Only meaningful when the cell's block is Water — the
   * mesher checks the block id first and consults this only for water
   * neighbours (the skirt compare).
   */
  getWaterHeight(wx: number, wy: number, wz: number): number {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return 0;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    return waterSurfaceHeight(c.wlevel[i], c.wsource[i], c.wstream[i]);
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/world.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit**

```bash
git add src/world.ts src/__tests__/world.test.ts
git commit -m "feat: World.getWaterHeight — cross-chunk water surface read for the skirt rule"
```

---

### Task 3: `emitWater` + routing in `src/chunk-mesher.ts`

**Files:**
- Modify: `src/chunk-mesher.ts:1` (import), `:265-267` (insert `emitWater` after `emitDoor`), `:316-319` (add `gl` reader after `gm`), `:334-335` (route water), `:293` (doc comment)
- Test: `src/__tests__/chunk-mesher.test.ts:70-80` (update the existing water test) + new describe appended at end of file

- [ ] **Step 1: Update the existing water test and write the new failing tests**

In `src/__tests__/chunk-mesher.test.ts`, replace the existing water test (lines 70–80) — it sets `wlevel = 0`, which violates the sim invariant this feature relies on, and it must now pin the graded height:

```ts
  it('water: transparent pass only; faces against air, suppressed between water blocks; surface at wlevel/8', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Water;
    c.wlevel[localIndex(8, 8, 8)] = 7; // the sim invariant: a Water cell always holds wlevel >= 1
    c.blocks[localIndex(9, 8, 8)] = Block.Water;
    c.wlevel[localIndex(9, 8, 8)] = 7;
    const { opaque, trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque).toBeNull();
    expect(trans).not.toBeNull();
    expect(trans!.positions.length / 3).toBe(10 * 4); // 5 + 5 faces, shared face not emitted
    expect(trans!.indices.length).toBe(10 * 6);
    expect(posBounds(trans!).yMax).toBeCloseTo(8.875); // level 7 -> 7/8 surface (was 9.0 full height)
  });
```

(`posBounds` is defined at module scope further down in the same file — the test body runs after module load, so the reference resolves.)

Append a new describe block at the very end of the file (after the `makeWorldForMesher` helper):

```ts
describe('chunk-mesher water level mesh', () => {
  // Set a cell's full water state (block + level + flags) in one call.
  const water = (c: { blocks: Uint8Array; wlevel: Uint8Array; wsource: Uint8Array; wstream: Uint8Array }, lx: number, ly: number, lz: number, level: number, source = 0, stream = 0) => {
    const i = localIndex(lx, ly, lz);
    c.blocks[i] = Block.Water;
    c.wlevel[i] = level;
    c.wsource[i] = source;
    c.wstream[i] = stream;
  };

  // True when one whole emitted face quad sits on the given world-plane coordinate
  // (axis 0 = x, 1 = y, 2 = z). A face quad = the 4 unique vertices of one
  // 6-index triangle pair; a mere corner on the plane does not count.
  const faceOnPlane = (buf: { positions: Float32Array; indices: Uint32Array }, axis: number, v: number): boolean => {
    const p = buf.positions;
    for (let i = 0; i < buf.indices.length; i += 6) {
      const quad = [buf.indices[i], buf.indices[i + 1], buf.indices[i + 2], buf.indices[i + 3]];
      if (quad.every((vi) => p[vi * 3 + axis] === v)) return true;
    }
    return false;
  };

  it('a lone level-7 flow cell over solid: top at 0.875, 4 side faces, no bottom', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 7)] = Block.Stone; // floor below
    water(c, 8, 8, 8, 7);
    const { opaque, trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque!.positions.length / 3).toBe(6 * 4); // stone keeps all 6 faces (water never culls it)
    const b = posBounds(trans!);
    expect(b.yMin).toBeCloseTo(8); // side faces start at the cell floor
    expect(b.yMax).toBeCloseTo(8.875); // top at 7/8
    expect(trans!.positions.length / 3).toBe(5 * 4); // top + 4 sides; the stone culls the bottom
  });

  it('level 7 beside level 6: a skirt sits on the shared plane; only the taller emits it', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 7)] = Block.Stone;
    c.blocks[localIndex(9, 8, 7)] = Block.Stone;
    water(c, 8, 8, 8, 7);
    water(c, 9, 8, 8, 6);
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans!.positions.length / 3).toBe(9 * 4); // taller 5 (top, 3 open sides, skirt) + shorter 4 (top, 3 open sides)
    expect(faceOnPlane(trans!, 0, 9)).toBe(true); // a face on the shared x=9 plane (the skirt); without the rule both cells cull it
    expect(posBounds(trans!).yMax).toBeCloseTo(8.875);
  });

  it('equal levels keep the no-face-between-water cull', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    water(c, 8, 8, 8, 7);
    water(c, 9, 8, 8, 7);
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans!.positions.length / 3).toBe(10 * 4); // 5 + 5, exactly the full-block behaviour
    expect(faceOnPlane(trans!, 0, 9)).toBe(false); // no face on the shared plane
  });

  it('a source beside level-7 flow: the source skirts down to the flow; the flow culls toward the source', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 7)] = Block.Stone;
    c.blocks[localIndex(9, 8, 7)] = Block.Stone;
    water(c, 8, 8, 8, 7, 1); // source: full height
    water(c, 9, 8, 8, 7); // flow: 0.875
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans!.positions.length / 3).toBe(9 * 4); // source 5 (top, 3 open sides, skirt) + flow 4
    expect(posBounds(trans!).yMax).toBeCloseTo(9); // the source stays full height
  });

  it('a two-cell stream column: solid full height, no face between, no top on the lower', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 6)] = Block.Stone;
    water(c, 8, 8, 7, 7, 0, 1); // stream (riding column)
    water(c, 8, 8, 8, 7, 0, 1); // stream
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans!.positions.length / 3).toBe(9 * 4); // lower 4 (4 sides only) + upper 5 (top + 4 sides)
    const b = posBounds(trans!);
    expect(b.yMin).toBeCloseTo(7);
    expect(b.yMax).toBeCloseTo(9); // full-height column, unbroken
  });

  it('a flow cell under a stream column keeps its lip (top emitted) and the column keeps its underside', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 6)] = Block.Stone;
    water(c, 8, 8, 7, 7); // resting flow: 0.875
    water(c, 8, 8, 8, 7, 0, 1); // stream riding above: full
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans!.positions.length / 3).toBe(11 * 4); // flow 5 (lip + 4 sides) + stream 6 (top, underside, 4 sides)
    expect(faceOnPlane(trans!, 1, 7.875)).toBe(true); // the lip at y = 7 + 7/8
    expect(faceOnPlane(trans!, 1, 8)).toBe(true); // the column's underside at y = 8
  });

  it('water faces carry FACE_SHADE without vertex AO, even with opaque corner occluders', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    water(c, 8, 8, 8, 7);
    c.blocks[localIndex(9, 9, 8)] = Block.Stone; // F1: would darken a +Y face's x+ corner to 0.8
    c.blocks[localIndex(8, 9, 9)] = Block.Stone; // F2: would darken its x+/z+ corner to 0.48
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    // Face order of the lone water block: +X(0-3) -X(4-7) +Y(8-11) ...; the +Y corners'
    // red channels sit at 32/36/40/44 and all read the full top shade (no AO multiplier).
    for (const i of [32, 36, 40, 44]) expect(trans!.colors[i]).toBeCloseTo(1.0);
  });

  it('per-vertex light still bakes on water faces (the AO drop left the light path untouched)', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    water(c, 8, 8, 8, 7);
    const lightAt: LightSampler = (x, y, z) => (x === 9 && y === 8 && z === 8 ? [12, 0] : [0, 0]);
    const { trans } = meshChunk(w, 0, 0, 0, lightAt);
    const l = trans!.light;
    expect(Math.max(...l.filter((_, i) => i % 2 === 0))).toBeCloseTo(12 / 15, 6); // the +X face-across cell
    expect(Math.max(...l.filter((_, i) => i % 2 === 1))).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/__tests__/chunk-mesher.test.ts`
Expected: FAIL — the updated existing test (yMax 9.0 ≠ 8.875), the lone-flow test (yMax), the level-7-beside-6 test (8 faces ≠ 9, no face on the shared plane), the flow-under-stream test (no lip/underside faces), and the no-AO test (old code applies AO, giving 0.8/0.48 instead of 1.0). The equal-levels and light tests pass on the old code — they are guards.

- [ ] **Step 3: Implement `emitWater` and route water to it**

In `src/chunk-mesher.ts`, make these five edits:

3a. Import (line 1):

```ts
import { Block, BLOCKS, isOpaque, torchFace, doorOpen, doorAxis, doorSide, waterSurfaceHeight } from './blocks';
```

3b. Insert `emitWater` after the end of `emitDoor` (after its closing `}`, before the `/** Per-corner light: ...` comment):

```ts
/**
 * Water: a partial-geometry box in the trans pass (the mirror of pushBox, which owns
 * the opaque pass). The cell's surface height h is waterSurfaceHeight of its
 * wlevel/wsource/wstream: source and stream cells draw full, resting flow at wlevel/8.
 * The top face sits at y+h; side faces scale to c[1]*h (the v-UV scales with them — the
 * water tile is near-uniform, so the stretch is invisible); the bottom face stays at the
 * cell floor. Face cull: an opaque neighbour culls; a WATER neighbour culls a side face
 * only when its surface is >= mine (equal heights keep the no-face-between-water
 * behaviour, strictly taller emits the SKIRT closing the step), a top face only when I
 * am full (a partial cell under a full column keeps its lip), and a bottom face only
 * when the neighbour draws full (coplanar). No vertex AO on water faces (partial
 * geometry, the pushBox precedent); cornerLight unchanged.
 */
function emitWater(
  buf: Buf,
  gb: (x: number, y: number, z: number) => number,
  gl: (x: number, y: number, z: number) => number,
  wx: number, wy: number, wz: number,
  h: number,
  lightAt: LightSampler,
): void {
  const tile = BLOCKS[Block.Water].faces[0]; // water uses one tile for all 6 faces
  const tileCol = tile % 16, tileRow = (tile / 16) | 0;
  for (let f = 0; f < 6; f++) {
    const face = FACES[f];
    const nx = wx + face.dir[0], ny = wy + face.dir[1], nz = wz + face.dir[2];
    const nB = gb(nx, ny, nz);
    if (isOpaque(nB)) continue;
    const nH = nB === Block.Water ? gl(nx, ny, nz) : 0;
    if (f === 2) { if (nB === Block.Water && h >= 1 - EPS) continue; }     // +Y under a water neighbour
    else if (f === 3) { if (nH >= 1 - EPS) continue; }                     // -Y over a full water neighbour
    else if (nB === Block.Water && h <= nH) continue;                      // sides: equal/taller neighbour
    const [au, av] = face.axes;
    for (const c of face.corners) {
      const [bl, sk] = cornerLight(lightAt, wx, wy, wz, face, c);
      buf.push(
        wx + c[0], wy + c[1] * h, wz + c[2],
        FACE_SHADE[f],
        (tileCol + c[au]) / 16,
        (15 - tileRow + (av === 1 ? c[av] * h : c[av])) / 16,
        bl, sk,
      );
    }
    const base = buf.verts - 4;
    buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}
```

3c. Add the `gl` reader in `meshChunk`, immediately after the `gm` definition (after `: world.getMeta(x, y, z);`):

```ts
  // Sibling of gb/gm: the neighbour's water surface height (0 for non-water / missing).
  // In-chunk fast path reads the chunk's water arrays; only water-water boundary faces
  // ever pay the cross-chunk world.getWaterHeight (the skirt compare skips the rest).
  const gl = (x: number, y: number, z: number): number =>
    x >= bx && x < bx + 16 && y >= by && y < by + 16 && z >= bz && z < bz + 16
      ? waterSurfaceHeight(
          chunk.wlevel[localIndex(x - bx, y - by, z - bz)],
          chunk.wsource[localIndex(x - bx, y - by, z - bz)],
          chunk.wstream[localIndex(x - bx, y - by, z - bz)],
        )
      : world.getWaterHeight(x, y, z);
```

3d. Route water cells to `emitWater` in the cell loop, after `const sOp = isOpaque(b);`:

```ts
        const sOp = isOpaque(b);
        if (b === Block.Water) {
          const hMe = waterSurfaceHeight(
            chunk.wlevel[localIndex(lx, ly, lz)],
            chunk.wsource[localIndex(lx, ly, lz)],
            chunk.wstream[localIndex(lx, ly, lz)],
          );
          emitWater(trans, gb, gl, wx, wy, wz, hMe, lightAt);
          continue;
        }
        for (let f = 0; f < 6; f++) {
```

3e. Update the `meshChunk` doc comment (the line `* Pure, stateless: reads chunk data + neighbors via world.getBlock (missing = Air).` becomes):

```ts
 * Pure, stateless: reads chunk data + neighbors via world.getBlock / world.getWaterHeight (missing = Air / dry).
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/chunk-mesher.test.ts`
Expected: PASS — all tests, including the updated existing water test and the 8 new ones.

- [ ] **Step 5: Run the full suite (the load replays exercise the new mesher end-to-end)**

Run: `npm test`
Expected: PASS — every suite. `water-load.test.ts` and `light-load.test.ts` call `meshChunk` through the real 10-second streaming replay (settled water is all full-height source water, so their meshes are byte-identical to before; their budget pins hold).

- [ ] **Step 6: Commit**

```bash
git add src/chunk-mesher.ts src/__tests__/chunk-mesher.test.ts
git commit -m "feat: graded water meshes — emitWater partial boxes + skirt faces at level steps"
```

---

### Task 4: Docs + full verification

**Files:**
- Modify: `TODO.md:7-16` (mark the item resolved)
- Modify: `PROJECT.md:413` and `PROJECT.md:416` (correct the two "render-cosmetic" lines in §9)

- [ ] **Step 1: Mark the TODO item resolved**

In `TODO.md`, replace the whole "Distinguish flow water" item (lines 7–16, from `- **Distinguish flow water from source water visually**` through `adjacent water) — the distinction must come from height/alpha, not extra faces.`) with:

```markdown
- ~~Distinguish flow water from source water visually~~ **Resolved (2026-08-20, branch
  `water-level-mesh`):** the mesher now renders the level field — a resting flow cell's surface
  sits at `wlevel / 8` (a spring's fan reads as a stepped gradient), while source water (sea,
  lakes, springs) and stream cells (falling columns, riders) draw full height. A taller water
  cell emits a skirt face against a lower water neighbour (`emitWater` in `src/chunk-mesher.ts`;
  heights via `waterSurfaceHeight` in `src/blocks.ts` and `World.getWaterHeight` in
  `src/world.ts`); equal-height water keeps the no-face-between-water cull, water faces skip
  vertex AO (partial geometry), and the all-source ocean mesh is unchanged. Spec:
  `docs/superpowers/specs/2026-08-20-water-level-mesh-design.md`.
```

- [ ] **Step 2: Correct PROJECT.md §9**

Two replacements in `PROJECT.md`:

Line 413 — replace:

```
decaying to 1 with each sideways step and resetting to 7 on any fall — but it does not render: every cell draws as a full-height quad; the `source`/`placed`/`stream` flags do the rest of the work)
```

with:

```
decaying to 1 with each sideways step and resetting to 7 on any fall — and it renders: a resting flow cell's surface sits at `wlevel / 8` of the cell (source and stream cells draw full; a taller cell skirts down against a lower water neighbour, `emitWater` in `src/chunk-mesher.ts`); the `source`/`placed`/`stream` flags decide full vs graded height)
```

Line 416 — replace:

```
levels are render-cosmetic (a cell always draws full height).
```

with:

```
levels render as surface height (a resting flow cell draws at `wlevel / 8`, so the fan reads as a graded slope; source and stream cells draw full).
```

- [ ] **Step 3: Full verification**

Run: `npm test`
Expected: PASS — every suite green.

Run: `npm run build`
Expected: PASS — `tsc --noEmit` type-checks clean and the vite build succeeds.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev` and open the local URL (the `?phase` query hook is available for any time of day).

Check:
1. Spawn near the sea: the ocean surface reads visually unchanged (all source water — full height, no skirts anywhere in the sea).
2. Select water (slot 8) and place a spring on a hillside: its fan reads as a stepped gradient (0.875 → 0.75 → … → 0.125) sloping away from the spring; the spring cell itself is full height with a skirt step down to the flow.
3. Place a spring high above a basin/ledge so it pours: the falling column reads as a solid full-height column (no horizontal slits), meeting the landing sheet at a clean 1/16 step.
4. Level changes settle within ~1 s (the slow-clock pulse) and the skirts update as the fan drains/re-derives — no lingering full-height boxes.

- [ ] **Step 5: Commit**

```bash
git add TODO.md PROJECT.md
git commit -m "docs: water-level mesh resolution — TODO item + PROJECT.md §9 render-cosmetic lines"
```

---

## Self-Review (run after writing the plan, before execution)

**Spec coverage:** height rule → Task 1; cross-chunk read → Task 2; face table (+Y lip, −Y coplanar, side skirt, equal-height cull) → Task 3 tests "lone", "7 beside 6", "equal levels", "source beside flow", "stream column", "flow under stream"; geometry (top at h, sides scaled, v-UV) → Task 3 "lone" (yMax 8.875) + "7 beside 6" (yMax 8.875); no-AO → Task 3 "FACE_SHADE without AO"; light untouched → Task 3 "per-vertex light still bakes"; update flow/no sim change → Task 3 Step 5 (load replays) + File Structure note; risks (ocean unchanged, missing chunk reads dry) → Task 2 test (missing chunk → 0) + Task 3 Step 5 + Task 4 Step 4.1. No gaps.

**Placeholder scan:** every step carries exact code/strings/commands; no TBD/TODO/"similar to Task N".

**Type consistency:** `waterSurfaceHeight(wlevel, wsource, wstream)` — same 3-arg signature in Task 1 (def), Task 2 (world call), Task 3 (gl reader + hMe); `getWaterHeight(x, y, z): number` — same in Task 2 (def/test) and Task 3 (gl cross-chunk call); `emitWater(buf, gb, gl, wx, wy, wz, h, lightAt)` — definition (Task 3 Step 3b) and call site (Task 3 Step 3d) agree; test helper `water(c, lx, ly, lz, level, source?, stream?)` used with 4–6 args consistently.