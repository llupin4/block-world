# Slice-Heavy-Chunk-Remesh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kill the one-shot 15–28 ms heavy-chunk remesh by probing each drain candidate with a
vertex budget (`PROBE_VERTS = 3764`) and, when the probe truncates, slicing the chunk into 4
balanced row bands on reserved frames (each ≤ ~7 ms at worst-case density) and merging into one
geometry at the end — every frame stays ≤ 1 vsync.

**Architecture:** The mesher gains an internal row-range + vertex-budget impl (exact partition —
per-cell emission independence makes the band union byte-identical to the whole mesh; public
`meshChunk` keeps its exact signature/return). A new pure module `src/mesh-slices.ts`
(bands, merge, scheduler, pinned constants) follows the `streaming.ts` no-three pattern. The
frame-end drain in `main.ts` probes each candidate: complete → use the probe's mesh as-is
(today's behavior); truncated → 4 reserved slice frames → merge + swap. Cancellation on
synchronous edits and unloads; light/water touches mid-split are tolerated (self-correcting).

**Tech stack:** TypeScript (strict), three.js 0.166, vitest (node), Vite. No new dependencies.

## Context (zero-assumption preamble)

- **Project:** a browser voxel sandbox (Minecraft-lite POC, post-POC). 16³ chunks streamed in a
  5×5×5 ring around the player; terrain is seeded (seed 1234) and **deterministic** — test
  expectations are pinned measured constants (project convention, see ADR 0001/0002).
- **The bug:** the single largest water/cave chunk (`2,1,0`) remeshes one-shot in 15–28 ms
  (browser, ADR 0002); every other chunk is 2–5 ms. That one chunk is the last visible hitch.
- **Key measured facts (pre-plan scratch, deterministic):** worst chunk `2,1,0` = **6312**
  opaque+trans verts, **315,600 B** of geometry; `r_mesh = 0.982` (the cost is `meshChunk` CPU,
  not geometry build or upload — the "gate" passes at 0.81 ms vs the 8.7 ms limit); 4-way
  row-band linearity max ratio 1.107 (≤ 1.25 target); **20** band chunks exceed the probe
  budget. No cell-count proxy separates slow from fast chunks (the worst chunk is NOT the
  largest by cells) — hence the probe, not a threshold.
- **Pinned constants** (derive-from-measurement comments point at `remesh-perf.test.ts`):
  - `PROBE_VERTS = 3764` = `floor(6312 × 16.7 / 28)` — a probe frame is ≤ 16.7 ms **by
    construction** at the ADR 0002 worst-case density (28 ms / 6312 verts).
  - `SLICE_COUNT = 4` = `ceil(6312 / floor(6312 × 8 / 28))` = `ceil(6312/1803)` — each slice is
    ≤ 1803 verts ≈ ≤ ~7 ms at that density (goal B: ≤ ~8 ms per slice with headroom).
- **Branch:** `slice-heavy-remesh` (already created, off `main`). **Spec:**
  `docs/superpowers/specs/2026-08-29-slice-heavy-remesh-design.md` (revision R1 — read the R1
  note in its header).
- **Commands:** `npm test` = `vitest run` (full suite); `npx tsc --noEmit` = type gate;
  `npm run build` = `tsc --noEmit && vite build` (final gate). Tests run in node; `three`
  imports fine in node for geometry work.
- **File map:**

| File | Change | Responsibility |
|---|---|---|
| `src/geometry.ts` | new | `toGeometry` (moved out of `main.ts`, node-importable) |
| `src/chunk-mesher.ts` | modify | internal `meshChunkImpl(world, cx, cy, cz, lightAt, ly0, ly1, maxVerts)`; public `meshChunk` (unchanged signature/return), new `meshChunkRange`, `probeMeshChunk`, `MeshResult` |
| `src/mesh-slices.ts` | new | `PROBE_VERTS`, `SLICE_COUNT`, `decideBands`, `mergeSlices`, `SliceScheduler` |
| `src/main.ts` | modify | drain integration (probe + reserved slice frames), `swapChunkMesh`, `scheduler.cancel` wiring |
| `src/__tests__/geometry.test.ts` | new | toGeometry attribute copy |
| `src/__tests__/mesher-budget.test.ts` | new | row-range exactness + probe truncation (synthetic chunks) |
| `src/__tests__/mesh-slices.test.ts` | new | `decideBands`, `mergeSlices`, `SliceScheduler` |
| `src/__tests__/remesh-perf.test.ts` | new | Phase 0 gate: band build, pins, gate, linearity, exact split-union equality |
| `docs/adr/0013-*.md`, `docs/adr/README.md`, `docs/adr/0002-*.md`, `TODO.md`, `PROJECT.md` | finish | ADR 0013 + index + ADR 0002 pointer + TODO resolved + §11 note |

---

### Task 0: Clean up the planning scratch

The pre-plan scratch (a temporary `yRange` parameter left in `src/chunk-mesher.ts` and a
scratch measurement test) must not leak into the implementation.

**Files:**
- Delete: `src/__tests__/scratch-measure.test.ts` (untracked)
- Revert: `src/chunk-mesher.ts` (uncommitted temporary edit)

- [ ] **Step 1: Revert and verify the tree is clean**

```bash
rm src/__tests__/scratch-measure.test.ts
git checkout -- src/chunk-mesher.ts
git status
```

Expected: `nothing to commit, working tree clean` (branch `slice-heavy-remesh`).

---

### Task 1: Extract `toGeometry` into `src/geometry.ts`

`main.ts` runs the whole app at import (DOM access at top level), so it is not node-importable;
the geometry build must be measurable in the Phase 0 test. `toGeometry` is pure three and moves
to its own module. Behavior-neutral.

**Files:**
- Create: `src/geometry.ts`
- Modify: `src/main.ts` (import; delete the local `toGeometry`, lines 270–282)
- Test: `src/__tests__/geometry.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/geometry.test.ts`:

```ts
import { it, expect } from 'vitest';
import { toGeometry } from '../geometry';
import type { VoxelBuffer } from '../world';

const buf: VoxelBuffer = {
  positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]),
  colors: new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  light: new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
};

it('copies every attribute, sets the index, and computes the bounding sphere', () => {
  const g = toGeometry(buf);
  expect(g.getAttribute('position').array).toEqual(buf.positions);
  expect(g.getAttribute('color').array).toEqual(buf.colors);
  expect(g.getAttribute('uv').array).toEqual(buf.uvs);
  expect(g.getAttribute('aLight').array).toEqual(buf.light);
  expect(g.getIndex()!.array).toEqual(buf.indices);
  expect(g.boundingSphere).not.toBeNull();
  // a unit quad's corners: center (0.5, 0.5, 0), radius sqrt(0.5)
  expect(g.boundingSphere!.radius).toBeCloseTo(Math.SQRT1_2);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/geometry.test.ts`
Expected: FAIL — `Failed to resolve import "../geometry"` (module does not exist).

- [ ] **Step 3: Create `src/geometry.ts`**

```ts
import * as THREE from 'three';
import type { VoxelBuffer } from './world';

// T5 emits world-space vertex positions; meshes live at the origin.
// (POC deviation from the spec's "chunk-local vertices + per-chunk mesh offset":
//  identical rendered output, and T10 streaming avoids per-frame offset bookkeeping.)
// Moved out of main.ts (which runs the app at import and is not node-testable) so the
// geometry-build phase is measurable in the remesh-perf gate (ADR 0013).
export function toGeometry(b: VoxelBuffer): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(b.positions, 3));
  g.setAttribute('color', new THREE.BufferAttribute(b.colors, 4)); // rgb + baked alpha
  g.setAttribute('uv', new THREE.BufferAttribute(b.uvs, 2));
  g.setAttribute('aLight', new THREE.BufferAttribute(b.light, 2));
  g.setIndex(new THREE.BufferAttribute(b.indices, 1));
  g.computeBoundingSphere();
  return g;
}
```

- [ ] **Step 4: Wire `main.ts`**

In `src/main.ts`, after line 7 (`import { meshChunk } from './chunk-mesher';`) add:

```ts
import { toGeometry } from './geometry';
```

Then delete the local function — the comment block starting `// T5 emits world-space vertex
positions` through the closing `}` of `function toGeometry` (currently lines 270–282). The two
call sites inside `rebuildChunkMesh` (`new THREE.Mesh(toGeometry(opaque), matOpaque)` and
`new THREE.Mesh(toGeometry(trans), matTrans)`) are unchanged.

- [ ] **Step 5: Verify**

Run: `npx vitest run src/__tests__/geometry.test.ts`
Expected: PASS (1 test).
Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/geometry.ts src/main.ts src/__tests__/geometry.test.ts
git commit -m "refactor: move toGeometry out of main.ts into node-importable src/geometry.ts (ADR 0013 Phase 0 needs the geometry-build phase measurable; behavior-neutral)"
```

---

### Task 2: Mesher row range + vertex budget (`meshChunkRange`, `probeMeshChunk`)

The internal impl meshes a row range `[ly0, ly1)` and stops at `maxVerts` verts (charged per
emitted face, across both passes). The public `meshChunk` keeps its **exact** signature and
return type (all existing tests are the regression net). Two new exports: `meshChunkRange`
(slices) and `probeMeshChunk` (the decision).

**Files:**
- Modify: `src/chunk-mesher.ts` (body of `meshChunk` → `meshChunkImpl`; budget checks at the 4
  emission sites: cube faces, `pushBox`, `emitWater`, and `emitTorch`/`emitDoor` via `pushBox`)
- Test: `src/__tests__/mesher-budget.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/mesher-budget.test.ts`:

```ts
import { it, expect } from 'vitest';
import { World } from '../world';
import { Block } from '../blocks';
import { meshChunk, meshChunkRange, probeMeshChunk } from '../chunk-mesher';

const noLight = (): [number, number] => [0, 0];

/** A lone all-water chunk in an empty world: only the BOUNDARY cells emit — in-chunk water
 * neighbors at equal surface height cull the interior faces (emitWater's skirt/side rules),
 * and missing neighbors read as Air. 16×16 faces on each of the 6 outer shells = 1536
 * faces / 6144 verts, far over any budget. */
function allWaterWorld(): World {
  const w = new World();
  const c = w.ensureChunk(0, 0, 0);
  for (let i = 0; i < 4096; i++) {
    c.blocks[i] = Block.Water;
    c.wlevel[i] = 7;
    c.wsource[i] = 1;
  }
  return w;
}

it('row-range slices partition the mesh exactly (positions concat, indices rebase)', () => {
  const w = allWaterWorld();
  const whole = meshChunk(w, 0, 0, 0, noLight);
  const a = meshChunkRange(w, 0, 0, 0, noLight, 0, 8);
  const b = meshChunkRange(w, 0, 0, 0, noLight, 8, 16);
  expect(whole.trans).not.toBeNull();
  expect(whole.opaque).toBeNull(); // water goes to the trans pass only
  expect(a.opaque).toBeNull();
  expect(b.opaque).toBeNull();
  const pa = a.trans!.positions;
  const pb = b.trans!.positions;
  // 1) vertex order: the whole's positions are the slice positions concatenated in band order
  const merged = new Float32Array(whole.trans!.positions.length);
  merged.set(pa, 0);
  merged.set(pb, pa.length);
  expect(merged).toEqual(whole.trans!.positions);
  // 2) indices: the whole = concat(A indices, B indices rebased by A's total vertex count)
  const offA = (a.opaque ? a.opaque.positions.length / 3 : 0) + pa.length / 3;
  const vi = new Uint32Array(whole.trans!.indices.length);
  vi.set(a.trans!.indices, 0);
  const bi = b.trans!.indices;
  for (let i = 0; i < bi.length; i++) vi[a.trans!.indices.length + i] = bi[i] + offA;
  expect(vi).toEqual(whole.trans!.indices);
  // 3) row bounds: slice [0,8) vertices sit in y ∈ [0, 9); slice [8,16) in y ∈ [8, 17)
  //    (row 7's top face is culled against the in-chunk water above, so [0,8) reaches y = 8
  //    only via side faces of its top row; row 15's top face reaches y = 16)
  for (let i = 1; i < pa.length; i += 3) {
    expect(pa[i]).toBeGreaterThanOrEqual(0);
    expect(pa[i]).toBeLessThan(9);
  }
  for (let i = 1; i < pb.length; i += 3) {
    expect(pb[i]).toBeGreaterThanOrEqual(8);
    expect(pb[i]).toBeLessThan(17);
  }
});

it('the vertex budget truncates mid-mesh; within the budget the probe IS the full mesh', () => {
  const w = allWaterWorld();
  const full = meshChunk(w, 0, 0, 0, noLight);
  const fullVerts = full.trans!.positions.length / 3;
  expect(fullVerts).toBeGreaterThan(3764);
  const p = probeMeshChunk(w, 0, 0, 0, noLight, 64);
  expect(p.complete).toBe(false);
  const pv = p.mesh.trans!.positions.length / 3;
  expect(pv).toBeLessThanOrEqual(64);
  expect(pv % 4).toBe(0); // whole faces only — a face is never split across the budget
  const ok = probeMeshChunk(w, 0, 0, 0, noLight, fullVerts);
  expect(ok.complete).toBe(true);
  expect(ok.mesh.trans!.positions).toEqual(full.trans!.positions);
  expect(ok.mesh.trans!.indices).toEqual(full.trans!.indices);
});

it('public meshChunk is unchanged (whole rows, no budget)', () => {
  const w = allWaterWorld();
  const a = meshChunk(w, 0, 0, 0, noLight);
  const b = meshChunk(w, 0, 0, 0, noLight);
  expect(a.trans!.positions).toEqual(b.trans!.positions);
  expect(a.trans!.indices).toEqual(b.trans!.indices);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/mesher-budget.test.ts`
Expected: FAIL — `meshChunkRange` / `probeMeshChunk` are not exported from `../chunk-mesher`.

- [ ] **Step 3: Implement the budget + impl in `src/chunk-mesher.ts`**

The file layout for reference: `Buf` class, tile constants, `specialBox`/`faceGeom`/
`rectsCover`/`rectsEqual`/`indexGreater`/`makeHidden`, `pushBox`, `emitTorch`, `emitDoor`,
`emitWater`, `cornerLight`, then `noLight` + `meshChunk`. Apply the following changes in order.

3a. Add the budget class + result type just above the `const noLight` line:

```ts
/** Chargeable vertex budget shared by both passes: a face (4 verts) is emitted only while it
 * fits; `Infinity` = unlimited (the default meshChunk path). Truncation is per-face, so a
 * partial buffer always holds whole faces (the drain discards truncated buffers anyway). */
class VertBudget {
  private remaining: number;
  truncated = false;
  constructor(max: number) {
    this.remaining = max;
  }
  takeFace(): boolean {
    if (this.remaining < 4) {
      this.truncated = true;
      return false;
    }
    this.remaining -= 4;
    return true;
  }
}

export interface MeshResult {
  mesh: ChunkMesh;
  complete: boolean;
}
```

3b. `pushBox`: add a `budget: VertBudget` parameter after `lightAt: LightSampler`, and in its
face loop, after the existing `if (hidden(f)) continue;` insert:

```ts
    if (!budget.takeFace()) return;
```

3c. `emitTorch`: add `budget: VertBudget` after the `lightAt: LightSampler` parameter, and pass
it through to all five `pushBox` calls (the floor post + the four wall-stub branches; append
it after the `lightAt` argument in each).

3d. `emitDoor`: same — add `budget: VertBudget` after `lightAt`, pass it to all three `pushBox`
calls.

3e. `emitWater`: add `budget: VertBudget` after the `lightAt: LightSampler` parameter, and in
its face loop, after the three culling `if` statements (the `f === 2` / `f === 3` / side
checks) and before `const [au, av] = face.axes;` insert:

```ts
    if (!budget.takeFace()) return;
```

3f. Replace the region from the `/** Pure, stateless:` doc comment through the closing `}` of
`meshChunk` with the impl below plus the three public functions. That region includes the
`const noLight` line sitting between the doc comment and the function — the replacement below
re-declares it, so delete the old one (do not leave a duplicate). The impl is the current
`meshChunk` body with: the new signature, `const budget`, the labeled/bounded `ly` loop,
`budget` passed to the three special/water call sites (`emitTorch`, `emitDoor`, `emitWater`),
and the one `if (!budget.takeFace()) break outer;` before the cube-face push.
Complete replacement code:

```ts
/**
 * Pure, stateless: reads chunk data + neighbors via world.getBlock / world.getWaterHeight
 * (missing = Air / dry). Emission order ly -> lz -> lx; per block the face table order.
 * `ly0..ly1` bounds the row range (whole chunk = 0..16); `maxVerts` caps total emitted
 * vertices across both passes (Infinity = unlimited) — on truncation `complete` is false and
 * the partial buffers hold whatever whole faces were emitted (callers discard them). A pass
 * with zero faces yields null. `toGeometry` (BufferGeometry) lives in src/geometry.ts, so
 * this module stays node-testable.
 */
function meshChunkImpl(world: World, cx: number, cy: number, cz: number, lightAt: LightSampler, ly0: number, ly1: number, maxVerts: number): MeshResult {
  const chunk = world.getChunk(cx, cy, cz);
  if (!chunk) return { mesh: { opaque: null, trans: null }, complete: true };
  const bx = cx * 16, by = cy * 16, bz = cz * 16;
  const opaque = new Buf();
  const trans = new Buf();
  const budget = new VertBudget(maxVerts);

  // Neighbour block read: in-chunk neighbours read this chunk's array directly (no string
  // key / Map lookup); only the ~30% of samples on a chunk boundary pay the cross-chunk
  // world.getBlock cost (missing neighbour = Air, exactly as world.getBlock). This is the
  // difference between a ~30 ms and a ~5 ms remesh of a full-water band.
  const gb = (x: number, y: number, z: number): number =>
    x >= bx && x < bx + 16 && y >= by && y < by + 16 && z >= bz && z < bz + 16
      ? chunk.blocks[localIndex(x - bx, y - by, z - bz)]
      : world.getBlock(x, y, z);
  // Sibling of gb: the neighbour's meta byte (in-chunk fast path, else world.getMeta). Lets a
  // special-block face be culled only when the neighbour's ACTUAL geometry covers it.
  const gm = (x: number, y: number, z: number): number =>
    x >= bx && x < bx + 16 && y >= by && y < by + 16 && z >= bz && z < bz + 16
      ? chunk.meta[localIndex(x - bx, y - by, z - bz)]
      : world.getMeta(x, y, z);
  // Sibling of gb/gm: the neighbour's water surface height (0 for non-water / missing).
  // In-chunk fast path reads the chunk's water arrays; only water-water boundary faces
  // ever pay the cross-chunk world.getWaterHeight (the skirt compare skips the rest).
  const gl = (x: number, y: number, z: number): number => {
    const inChunk = x >= bx && x < bx + 16 && y >= by && y < by + 16 && z >= bz && z < bz + 16;
    if (!inChunk) return world.getWaterHeight(x, y, z);
    const i = localIndex(x - bx, y - by, z - bz);
    return waterSurfaceHeight(chunk.wlevel[i], chunk.wsource[i], chunk.wstream[i]);
  };

  outer:
  for (let ly = ly0; ly < ly1; ly++) {
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const b = chunk.blocks[localIndex(lx, ly, lz)];
        if (b === Block.Air) continue; // air contributes to neither pass
        const kind = BLOCKS[b as Block].kind;
        const wx = bx + lx, wy = by + ly, wz = bz + lz;
        if (kind !== 'cube') {
          // Special blocks are partial geometry, always in the opaque pass (never trans).
          if (kind === 'torch') emitTorch(opaque, gb, gm, wx, wy, wz, chunk.meta[localIndex(lx, ly, lz)], lightAt, budget);
          else emitDoor(opaque, gb, gm, wx, wy, wz, chunk.meta[localIndex(lx, ly, lz)], lightAt, budget);
          continue;
        }
        const sOp = isOpaque(b);
        if (b === Block.Water) {
          const hMe = waterSurfaceHeight(
            chunk.wlevel[localIndex(lx, ly, lz)],
            chunk.wsource[localIndex(lx, ly, lz)],
            chunk.wstream[localIndex(lx, ly, lz)],
          );
          emitWater(trans, gb, gl, wx, wy, wz, hMe, lightAt, budget);
          continue;
        }
        for (let f = 0; f < 6; f++) {
          const face = FACES[f];
          const nx = wx + face.dir[0], ny = wy + face.dir[1], nz = wz + face.dir[2];
          const nB = gb(nx, ny, nz);
          const wantOpaque = sOp && !isOpaque(nB);
          const wantTrans = !sOp && !isOpaque(nB) && nB !== b; // b is already != Air
          if (!wantOpaque && !wantTrans) continue;
          if (!budget.takeFace()) break outer;
          const buf = wantOpaque ? opaque : trans;
          const [au, av] = face.axes;
          const tile = BLOCKS[b as Block].faces[f];
          const tileCol = tile % 16, tileRow = (tile / 16) | 0;
          for (const c of face.corners) {
            const su = c[au] === 1 ? 1 : -1;
            const sv = c[av] === 1 ? 1 : -1;
            const s1 = isOpaque(gb(nx + (au === 0 ? su : 0), ny + (au === 1 ? su : 0), nz + (au === 2 ? su : 0))) ? 1 : 0;
            const s2 = isOpaque(gb(nx + (av === 0 ? sv : 0), ny + (av === 1 ? sv : 0), nz + (av === 2 ? sv : 0))) ? 1 : 0;
            const dg = isOpaque(gb(
              nx + (au === 0 ? su : 0) + (av === 0 ? sv : 0),
              ny + (au === 1 ? su : 0) + (av === 1 ? sv : 0),
              nz + (au === 2 ? su : 0) + (av === 2 ? sv : 0))) ? 1 : 0;
            const occ = s1 && s2 ? 3 : s1 + s2 + dg;
            const [bl, sk] = cornerLight(lightAt, wx, wy, wz, face, c);
            buf.push(
              wx + c[0], wy + c[1], wz + c[2],
              FACE_SHADE[f] * AO_SHADE[occ],
              (tileCol + c[au]) / 16,
              (15 - tileRow + c[av]) / 16,
              bl, sk,
            );
          }
          const base = buf.verts - 4;
          buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
    }
  }

  return { mesh: { opaque: opaque.toBuffer(), trans: trans.toBuffer() }, complete: !budget.truncated };
}

const noLight: LightSampler = () => [0, 0]; // zero-light default for callers not yet wired for light (e.g. the perf bench in water-load.test.ts)

/** Whole-chunk mesh — today's exact behavior (all 16 rows, unlimited vertices). */
export function meshChunk(world: World, cx: number, cy: number, cz: number, lightAt: LightSampler = noLight): ChunkMesh {
  return meshChunkImpl(world, cx, cy, cz, lightAt, 0, 16, Infinity).mesh;
}

/** Row-band mesh [y0, y1) — the slice path (no vertex budget: the band is already bounded). */
export function meshChunkRange(world: World, cx: number, cy: number, cz: number, lightAt: LightSampler, y0: number, y1: number): ChunkMesh {
  return meshChunkImpl(world, cx, cy, cz, lightAt, y0, y1, Infinity).mesh;
}

/** Vertex-budget probe: `complete === true` → `mesh` IS the full mesh; `false` → the chunk is
 * heavier than `maxVerts` verts (the drain discards `mesh` and slices instead). */
export function probeMeshChunk(world: World, cx: number, cy: number, cz: number, lightAt: LightSampler, maxVerts: number): MeshResult {
  return meshChunkImpl(world, cx, cy, cz, lightAt, 0, 16, maxVerts);
}
```

- [ ] **Step 4: Run the new test and the full suite**

Run: `npx vitest run src/__tests__/mesher-budget.test.ts`
Expected: PASS (3 tests).
Run: `npm test`
Expected: all existing suites pass unchanged (the `meshChunk` regression net — the
water-load / light-load / streaming replays included).

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add src/chunk-mesher.ts src/__tests__/mesher-budget.test.ts
git commit -m "feat: mesher row range + vertex budget — meshChunkImpl(ly0, ly1, maxVerts) with exact band partitioning; new meshChunkRange/probeMeshChunk (public meshChunk unchanged)"
```

---

### Task 3: `src/mesh-slices.ts` — constants, `decideBands`, `mergeSlices`

**Files:**
- Create: `src/mesh-slices.ts`
- Test: `src/__tests__/mesh-slices.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/mesh-slices.test.ts`:

```ts
import { it, expect } from 'vitest';
import { World, localIndex, type Chunk, type VoxelBuffer } from '../world';
import { Block } from '../blocks';
import type { ChunkMesh } from '../chunk-mesher';
import { decideBands, mergeSlices, PROBE_VERTS, SLICE_COUNT } from '../mesh-slices';

/** A chunk whose row ly holds the first `counts[ly]` cells (in localIndex order, lz 0..15 ×
 * lx 0..15) as stone — decideBands only counts per-row non-air cells, so the layout within
 * the row is irrelevant. */
function chunkWithRows(counts: number[]): Chunk {
  const w = new World();
  const c = w.ensureChunk(0, 0, 0);
  for (let ly = 0; ly < 16; ly++)
    for (let i = 0; i < counts[ly]; i++) c.blocks[localIndex(i, ly, 0)] = Block.Stone;
  return c;
}

function vbuf(verts: number[], idx: number[]): VoxelBuffer {
  const n = verts.length / 3;
  return {
    positions: new Float32Array(verts),
    colors: new Float32Array(n * 4).fill(1), // well-formed: 4 floats per vertex (rgb + alpha)
    uvs: new Float32Array(n * 2),
    light: new Float32Array(n * 2),
    indices: new Uint32Array(idx),
  };
}

it('constants are pinned to the Phase 0 derivation (remesh-perf.test.ts)', () => {
  expect(PROBE_VERTS).toBe(Math.floor(6312 * 16.7 / 28)); // = 3764
  expect(SLICE_COUNT).toBe(Math.ceil(6312 / Math.floor(6312 * 8 / 28))); // = 4
});

it('decideBands: 4 contiguous bands covering [0,16), balanced by row count', () => {
  const uniform = new Array(16).fill(256);
  expect(decideBands(chunkWithRows(uniform), SLICE_COUNT)).toEqual([[0, 4], [4, 8], [8, 12], [12, 16]]);
  // bottom-heavy: content only in rows 0..7 → the first 3 bands split it, the last takes the empty top
  const bottom = [256, 256, 256, 256, 256, 256, 256, 256, 0, 0, 0, 0, 0, 0, 0, 0];
  expect(decideBands(chunkWithRows(bottom), SLICE_COUNT)).toEqual([[0, 2], [2, 4], [4, 6], [6, 16]]);
  // all-air: equal (empty) bands
  expect(decideBands(chunkWithRows(new Array(16).fill(0)), SLICE_COUNT)).toEqual([[0, 4], [4, 8], [8, 12], [12, 16]]);
  // the worst chunk's measured rowCounts (remesh-perf.test.ts) → the measured band edges
  const worstRows = [133, 152, 173, 205, 225, 224, 223, 221, 225, 237, 255, 254, 255, 256, 256, 256];
  expect(decideBands(chunkWithRows(worstRows), SLICE_COUNT)).toEqual([[0, 5], [5, 9], [9, 13], [13, 16]]);
});

it('mergeSlices: concats attributes in band order and rebases indices by preceding vertex counts', () => {
  const a: ChunkMesh = { opaque: vbuf([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], [0, 1, 2, 0, 2, 3]), trans: null }; // 4 verts
  const b: ChunkMesh = { opaque: vbuf([2, 0, 0, 3, 0, 0], [0, 1]), trans: null }; // 2 verts
  const m = mergeSlices([a, b]);
  expect(m.opaque).not.toBeNull();
  expect(m.opaque!.positions).toEqual(new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0]));
  expect(m.opaque!.indices).toEqual(new Uint32Array([0, 1, 2, 0, 2, 3, 4, 5])); // b's indices +4
  expect(m.trans).toBeNull();
});

it('mergeSlices: null passes contribute nothing; all-null → null; single slice deep-equals', () => {
  const a: ChunkMesh = { opaque: vbuf([0, 0, 0, 1, 0, 0], [0, 1]), trans: null };
  const mid: ChunkMesh = { opaque: null, trans: null };
  const b: ChunkMesh = { opaque: null, trans: vbuf([0, 0, 0], [0]) };
  const m = mergeSlices([a, mid, b]);
  expect(m.opaque!.positions).toEqual(new Float32Array([0, 0, 0, 1, 0, 0]));
  expect(m.opaque!.indices).toEqual(new Uint32Array([0, 1]));
  expect(m.trans!.positions).toEqual(new Float32Array([0, 0, 0]));
  expect(mergeSlices([{ opaque: null, trans: null }, { opaque: null, trans: null }]))
    .toEqual({ opaque: null, trans: null });
  const solo = mergeSlices([a]);
  expect(solo.opaque!.positions).toEqual(a.opaque!.positions);
  expect(solo.opaque!.indices).toEqual(a.opaque!.indices);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/mesh-slices.test.ts`
Expected: FAIL — `Failed to resolve import "../mesh-slices"`.

- [ ] **Step 3: Implement `src/mesh-slices.ts`**

```ts
// Heavy-chunk slice state (ADR 0013): the drain probes every candidate with a vertex budget;
// a truncated probe means "heavier than the budget" and the chunk is meshed in SLICE_COUNT
// contiguous row bands (balanced by non-air row counts), one per reserved frame, then merged.
// Pure TS, no three — vitest drives it directly (the streaming.ts pattern).
import { Block } from './blocks';
import type { Chunk, VoxelBuffer } from './world';
import type { ChunkMesh } from './chunk-mesher';

/**
 * floor(6312 × 16.7 / 28): the probe's vertex budget. At the ADR 0002 worst-case measured
 * density (28 ms / 6312 verts, the browser tail on the worst chunk `2,1,0`) a probe frame is
 * ≤ 16.7 ms — ≤ 1 vsync — BY CONSTRUCTION, on any machine. Pinned derivation + the 6312
 * worst-vertex pin: src/__tests__/remesh-perf.test.ts (Phase 0 gate).
 */
export const PROBE_VERTS = 3764;

/**
 * ceil(6312 / floor(6312 × 8 / 28)): 4. Each slice is ≤ 1803 verts ≈ ≤ ~7 ms at the
 * worst-case density (goal B: per-slice ≤ ~8 ms with headroom). Same pins as PROBE_VERTS.
 */
export const SLICE_COUNT = 4;

/**
 * n contiguous row bands [y0, y1) covering [0, 16), split at the non-air row-count
 * quantiles (balanced by cell count, which proxies loop cost). A band may be empty
 * (content concentrated in a few rows); an all-air chunk gets equal bands. The probe has
 * already decided the chunk is heavy — there is no threshold here.
 */
export function decideBands(chunk: Chunk, n: number): [number, number][] {
  const rows = new Array(16).fill(0);
  for (let ly = 0; ly < 16; ly++) {
    // localIndex(lx, ly, lz) = lx + lz*16 + ly*256: at fixed ly the row is ly*256 .. ly*256+255
    for (let i = 0; i < 256; i++) {
      if (chunk.blocks[ly * 256 + i] !== Block.Air) rows[ly]++;
    }
  }
  const total = rows.reduce((a, b) => a + b, 0);
  const edges: number[] = [0];
  if (total === 0) {
    for (let k = 1; k < n; k++) edges.push(Math.floor((16 * k) / n));
  } else {
    let acc = 0;
    let edge = 0;
    for (let k = 1; k < n; k++) {
      const target = (total * k) / n;
      while (edge < 15) {
        edge++;
        acc += rows[edge - 1];
        if (acc >= target) break;
      }
      edges.push(edge);
    }
  }
  edges.push(16);
  const bands: [number, number][] = [];
  for (let k = 0; k < n; k++) bands.push([edges[k], edges[k + 1]]);
  return bands;
}

/** Per-pass merge: concat the four attribute arrays in order; rebase each pass's indices by
 * the sum of preceding passes' vertex counts. Null passes contribute nothing. */
function mergePass(passes: (VoxelBuffer | null)[]): VoxelBuffer | null {
  const solid = passes.filter((p): p is VoxelBuffer => p !== null);
  if (solid.length === 0) return null;
  const totalVerts = solid.reduce((n, p) => n + p.positions.length / 3, 0);
  const positions = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 4);
  const uvs = new Float32Array(totalVerts * 2);
  const light = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(solid.reduce((n, p) => n + p.indices.length, 0));
  let vOff = 0, posOff = 0, colOff = 0, uvOff = 0, lightOff = 0, iOff = 0;
  for (const p of solid) {
    const v = p.positions.length / 3;
    // TypedArray.set offsets are ELEMENT units (pos ×3, color ×4, uv/light ×2 per vertex);
    // the index rebase below is VERTEX units — hence the parallel counters.
    positions.set(p.positions, posOff);
    colors.set(p.colors, colOff);
    uvs.set(p.uvs, uvOff);
    light.set(p.light, lightOff);
    for (let i = 0; i < p.indices.length; i++) indices[iOff + i] = p.indices[i] + vOff;
    iOff += p.indices.length;
    vOff += v; posOff += v * 3; colOff += v * 4; uvOff += v * 2; lightOff += v * 2;
  }
  return { positions, colors, uvs, indices, light };
}

/** Merge band meshes (in band order) into one. Exact: the band union IS the whole mesh —
 * per-cell emission independence (the spec's verified premise) makes vertex order
 * deterministic, so this is a concat + index rebase, not a rebuild. */
export function mergeSlices(meshes: ChunkMesh[]): ChunkMesh {
  return {
    opaque: mergePass(meshes.map((m) => m.opaque)),
    trans: mergePass(meshes.map((m) => m.trans)),
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/__tests__/mesh-slices.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add src/mesh-slices.ts src/__tests__/mesh-slices.test.ts
git commit -m "feat: mesh-slices core — PROBE_VERTS/SLICE_COUNT pinned constants, decideBands (row-count-quantile bands), mergeSlices (concat + index rebase)"
```

---

### Task 4: `SliceScheduler` (start/advance/store/finish/cancel, one plan at a time)

**Files:**
- Modify: `src/mesh-slices.ts` (append the class)
- Test: `src/__tests__/mesh-slices.test.ts` (append tests; the `vbuf` helper from Task 3 is
  already in the file)

- [ ] **Step 1: Write the failing tests**

Append to `src/__tests__/mesh-slices.test.ts` (add `SliceScheduler` to the existing
`../mesh-slices` import line):

```ts
it('SliceScheduler: start → advance/store ×N → finish returns the merged mesh; one plan at a time', () => {
  const s = new SliceScheduler();
  expect(s.inFlightKey()).toBeNull();
  const bands: [number, number][] = [[0, 4], [4, 8], [8, 12], [12, 16]];
  expect(s.start('0,0,0', bands)).toBe(true);
  expect(s.start('1,0,0', bands)).toBe(false); // a second plan is refused while one is in flight
  expect(s.inFlightKey()).toBe('0,0,0');
  expect(s.advance('1,1,1')).toBeNull(); // no plan for that key
  const one: ChunkMesh = { opaque: vbuf([0, 0, 0, 1, 0, 0], [0, 1]), trans: null };
  const zero: ChunkMesh = { opaque: null, trans: null };
  expect(s.advance('0,0,0')).toEqual([0, 4]);
  s.store('0,0,0', one);
  expect(s.finish('0,0,0')).toBeNull(); // not all bands stored yet
  expect(s.advance('0,0,0')).toEqual([4, 8]);
  s.store('0,0,0', zero);
  expect(s.advance('0,0,0')).toEqual([8, 12]);
  s.store('0,0,0', zero);
  expect(s.advance('0,0,0')).toEqual([12, 16]);
  s.store('0,0,0', zero);
  const done = s.finish('0,0,0');
  expect(s.inFlightKey()).toBeNull(); // the plan is removed on finish
  expect(done).not.toBeNull();
  expect(done!.opaque!.indices).toEqual(new Uint32Array([0, 1])); // only the first band had geometry
  expect(done!.trans).toBeNull();
});

it('SliceScheduler: cancel discards the partial buffers', () => {
  const s = new SliceScheduler();
  expect(s.start('0,0,0', [[0, 8], [8, 16]])).toBe(true);
  s.advance('0,0,0');
  s.store('0,0,0', { opaque: null, trans: null });
  s.cancel('0,0,0');
  expect(s.has('0,0,0')).toBe(false);
  expect(s.inFlightKey()).toBeNull();
  expect(s.advance('0,0,0')).toBeNull();
  expect(s.finish('0,0,0')).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/mesh-slices.test.ts`
Expected: FAIL — `SliceScheduler` is not exported.

- [ ] **Step 3: Append the class to `src/mesh-slices.ts`**

```ts
interface Plan {
  bands: [number, number][];
  next: number;
  partial: (ChunkMesh | null)[];
}

/**
 * One in-flight slice plan at a time (the drain serializes starts; `start` enforces it).
 * Lifecycle: start → (advance + store) × bands.length → finish (merges, removes the plan);
 * cancel at any point (player edit / unload) discards the partial buffers — they are plain
 * typed arrays, so GC takes them; no GPU resources exist before the merge.
 */
export class SliceScheduler {
  private plans = new Map<string, Plan>();

  /** Returns false when a plan is already in flight (one at a time). */
  start(key: string, bands: [number, number][]): boolean {
    if (this.plans.size > 0) return false;
    this.plans.set(key, { bands, next: 0, partial: new Array(bands.length).fill(null) });
    return true;
  }

  has(key: string): boolean {
    return this.plans.has(key);
  }

  /** The single in-flight chunk key (or null). */
  inFlightKey(): string | null {
    const k = this.plans.keys().next();
    return k.done ? null : k.value;
  }

  /** The band to mesh now for `key` (or null — no plan / plan complete). */
  advance(key: string): [number, number] | null {
    const p = this.plans.get(key);
    if (!p || p.next >= p.bands.length) return null;
    return p.bands[p.next];
  }

  /** Record the just-meshed band's buffers (must follow an advance). */
  store(key: string, mesh: ChunkMesh): void {
    const p = this.plans.get(key);
    if (!p) return;
    p.partial[p.next] = mesh;
    p.next++;
  }

  /** When all bands are stored: merge them and remove the plan; otherwise null. */
  finish(key: string): ChunkMesh | null {
    const p = this.plans.get(key);
    if (!p || p.next < p.bands.length) return null;
    this.plans.delete(key);
    return mergeSlices(p.partial);
  }

  cancel(key: string): void {
    this.plans.delete(key);
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/__tests__/mesh-slices.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add src/mesh-slices.ts src/__tests__/mesh-slices.test.ts
git commit -m "feat: SliceScheduler — one in-flight plan, start/advance/store/finish/cancel (partial buffers are CPU-only until the merge)"
```

---

### Task 5: Phase 0 gate — `src/__tests__/remesh-perf.test.ts`

Builds the pinned band exactly as `light-load.test.ts` does (terrain + water settle + settled
light to the fixpoint), then: pins the worst chunk's deterministic work counts, asserts the
gate (CPU-mesh-bound) and the constant derivations, checks 4-way band linearity, and proves the
**exact split-union equality** (band meshes merged == whole mesh) on the worst chunk plus
all-water / all-air / special-block synthetic chunks. This test PASSES by construction (the
pins were measured pre-plan); if a pin is off, that is a finding — investigate before
"fixing" the constant without re-checking the spec.

**Files:**
- Create: `src/__tests__/remesh-perf.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { it, expect } from 'vitest';
import { World, chunkOf, localIndex } from '../world';
import type { VoxelBuffer } from '../world';
import { Block } from '../blocks';
import { TerrainGen, generateChunkTerrain, TERRAIN_SEED } from '../terrain';
import * as streaming from '../streaming';
import { WaterSim } from '../water';
import { LightSim } from '../light';
import { meshChunk, meshChunkRange } from '../chunk-mesher';
import type { ChunkMesh } from '../chunk-mesher';
import { toGeometry } from '../geometry';
import { decideBands, mergeSlices, PROBE_VERTS, SLICE_COUNT } from '../mesh-slices';

// Phase 0 measurement gate (spec §Phase 0, revision R1). The band is deterministic
// (TERRAIN_SEED 1234 + pinned pipeline), so the pins are exact counts, not timings
// (wall time is logged for the record, never asserted — project convention).
//   WORST_KEY/WORST_VERTS: the ADR 0002 "single largest water/cave chunk" — world x 32..47,
//   y 16..31, z 0..15 — at 6312 opaque+trans verts with settled light.
//   WORST_BYTES: the merged geometry's attribute+index bytes (the single merge-frame upload).
//   OVER_BUDGET: band chunks whose mesh exceeds PROBE_VERTS — the streaming-reservation cost
//   the spec accepts (20 × (1 probe + 4 slice frames) per full ring refill).
const SPAWN_X = 6, SPAWN_Z = 46; // main.ts's spawn column (world x 0..15, z 32..47)
const WORST_KEY = '2,1,0';
const WORST_VERTS = 6312;
const WORST_BYTES = 315_600;
const OVER_BUDGET = 20;

/** The pinned 125-chunk band at the stable state — the light-load.test.ts harness. */
function buildBand(): { world: World; lightAt: (x: number, y: number, z: number) => [number, number] } {
  const world = new World();
  const gen = new TerrainGen(TERRAIN_SEED);
  for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2); // main.ts boot column (0,·,2)
  const sim = new WaterSim(world);
  const lightSim = new LightSim(world);
  sim.settle(0, 2, 2);
  lightSim.settleChunk(0, 2, 2);
  let guard = 0;
  for (;;) {
    const r = streaming.update(world, chunkOf(SPAWN_X), chunkOf(SPAWN_Z), 2);
    if (r.rebuilt.length === 0 && r.unloaded.length === 0) break;
    for (const c of r.rebuilt) {
      sim.settle(c.cx, c.cy, c.cz);
      lightSim.settleChunk(c.cx, c.cy, c.cz);
      const ch = world.getChunk(c.cx, c.cy, c.cz);
      if (ch) ch.dirty = false; // main.ts rebuildChunkMesh clears dirty (scene side stubbed)
    }
    for (const c of r.unloaded) lightSim.onChunkUnloaded(c.cx, c.cy, c.cz);
    lightSim.tick(100_000); // collapsed full drain (light-load pattern)
    sim.tick(100_000);
    if (++guard > 500) throw new Error('replay did not stabilize in 500 streaming calls');
  }
  return { world, lightAt: (x, y, z) => world.getLight(x, y, z) };
}

const vertsOf = (b: VoxelBuffer | null): number => (b ? b.positions.length / 3 : 0);
const bytesOf = (m: ChunkMesh): number => {
  let n = 0;
  for (const b of [m.opaque, m.trans]) {
    if (!b) continue;
    n += b.positions.byteLength + b.colors.byteLength + b.uvs.byteLength + b.indices.byteLength + b.light.byteLength;
  }
  return n;
};

it('the worst remesh is CPU-mesh-bound (gate) and the slice constants hold (pins + derivations)', () => {
  const { world, lightAt } = buildBand();
  const chunks = [...world.allChunks()];
  const scan = () => {
    const rows: { key: string; verts: number; bytes: number; meshT: number; geomT: number }[] = [];
    for (const c of chunks) {
      const t0 = performance.now();
      const m = meshChunk(world, c.cx, c.cy, c.cz, lightAt);
      const t1 = performance.now();
      if (m.opaque) toGeometry(m.opaque);
      if (m.trans) toGeometry(m.trans);
      const t2 = performance.now();
      rows.push({
        key: `${c.cx},${c.cy},${c.cz}`,
        verts: vertsOf(m.opaque) + vertsOf(m.trans),
        bytes: bytesOf(m),
        meshT: t1 - t0,
        geomT: t2 - t1,
      });
    }
    return rows;
  };
  scan(); // JIT warm-up (timings below are the second, warm pass)
  const res = scan();

  const worst = res.find((r) => r.key === WORST_KEY)!;
  expect(world.count()).toBe(125); // the band really walked to the full 5x5x5 ring
  expect(worst.verts).toBe(WORST_VERTS);
  expect(worst.bytes).toBe(WORST_BYTES);

  // Gate: the merge frame = 28×r_geom + upload_est(B) + last slice (≤ 8 ms by construction)
  // must fit 16.7 ms ⇔ 28×r_geom + upload_est(B) ≤ 8.7 ms. upload_est = B / 1 MB.
  const rMesh = worst.meshT / (worst.meshT + worst.geomT);
  expect(rMesh).toBeGreaterThanOrEqual(0.9); // CPU-mesh-bound (measured 0.982)
  expect(28 * (1 - rMesh) + worst.bytes / 1e6).toBeLessThanOrEqual(8.7);

  // The constant derivations (worst verts × browser tail / target budgets):
  expect(PROBE_VERTS).toBe(Math.floor(WORST_VERTS * 16.7 / 28));
  expect(SLICE_COUNT).toBe(Math.ceil(WORST_VERTS / Math.floor(WORST_VERTS * 8 / 28)));
  // The reservation cost the spec accepts:
  expect(res.filter((r) => r.verts > PROBE_VERTS).length).toBe(OVER_BUDGET);

  // Linearity: the SLICE_COUNT bands of the worst chunk split its mesh time within 1.25×
  // (measured max ratio 1.107) — catches hidden per-slice fixed cost.
  const worstChunk = world.getChunk(2, 1, 0)!;
  const bands = decideBands(worstChunk, SLICE_COUNT);
  let maxRatio = 0;
  for (const [y0, y1] of bands) {
    const t0 = performance.now();
    meshChunkRange(world, 2, 1, 0, lightAt, y0, y1);
    maxRatio = Math.max(maxRatio, (performance.now() - t0) / (worst.meshT / SLICE_COUNT));
  }
  expect(maxRatio).toBeLessThanOrEqual(1.25);

  console.log('PERF worst=', WORST_KEY, 'verts=', worst.verts, 'bytes=', worst.bytes,
    'mesh=', worst.meshT.toFixed(2), 'ms geom=', worst.geomT.toFixed(2), 'ms rMesh=', rMesh.toFixed(3),
    'gate=', (28 * (1 - rMesh) + worst.bytes / 1e6).toFixed(2), 'ms maxBandRatio=', maxRatio.toFixed(3));
}, 60_000);

function expectSplitUnion(world: World, cx: number, cy: number, cz: number,
  lightAt: (x: number, y: number, z: number) => [number, number]): void {
  const whole = meshChunk(world, cx, cy, cz, lightAt);
  const merged = mergeSlices(
    decideBands(world.getChunk(cx, cy, cz)!, SLICE_COUNT)
      .map(([y0, y1]) => meshChunkRange(world, cx, cy, cz, lightAt, y0, y1)),
  );
  for (const [name, a, b] of [
    ['opaque.positions', merged.opaque?.positions, whole.opaque?.positions],
    ['opaque.colors', merged.opaque?.colors, whole.opaque?.colors],
    ['opaque.uvs', merged.opaque?.uvs, whole.opaque?.uvs],
    ['opaque.light', merged.opaque?.light, whole.opaque?.light],
    ['opaque.indices', merged.opaque?.indices, whole.opaque?.indices],
    ['trans.positions', merged.trans?.positions, whole.trans?.positions],
    ['trans.colors', merged.trans?.colors, whole.trans?.colors],
    ['trans.uvs', merged.trans?.uvs, whole.trans?.uvs],
    ['trans.light', merged.trans?.light, whole.trans?.light],
    ['trans.indices', merged.trans?.indices, whole.trans?.indices],
  ] as const) {
    expect(a, name).toEqual(b); // exact: same vertex order, rebased indices
  }
}

it('the row-band split reproduces the whole mesh exactly (worst + all-water + all-air + special chunks)', () => {
  const { world, lightAt } = buildBand();
  expectSplitUnion(world, 2, 1, 0, lightAt); // the pinned worst chunk, settled light

  const noLight = (): [number, number] => [0, 0];
  // all-water (trans pass only, every face emitted)
  const ww = new World();
  const wc = ww.ensureChunk(0, 0, 0);
  for (let i = 0; i < 4096; i++) {
    wc.blocks[i] = Block.Water;
    wc.wlevel[i] = 7;
    wc.wsource[i] = 1;
  }
  expectSplitUnion(ww, 0, 0, 0, noLight);
  // all-air (both passes null)
  const aw = new World();
  aw.ensureChunk(0, 0, 0);
  expectSplitUnion(aw, 0, 0, 0, noLight);
  // special blocks: a stone floor (y=0), a floor torch (0,5,0), a closed X-thin door at (1,5..6,0)
  const sw = new World();
  const sc = sw.ensureChunk(0, 0, 0);
  for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) sc.blocks[localIndex(lx, 0, lz)] = Block.Stone;
  sw.setBlock(0, 5, 0, Block.Torch, 0);
  sw.setBlock(1, 5, 0, Block.DoorBottom, 0); // closed, axis X-thin, hinge min
  sw.setBlock(1, 6, 0, Block.DoorTop, 0);
  expectSplitUnion(sw, 0, 0, 0, noLight);
}, 60_000);
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/__tests__/remesh-perf.test.ts`
Expected: PASS (2 tests, ~5–10 s). The `PERF` console line records the live wall times
(machine-dependent, not asserted). If a pin (`WORST_VERTS`, `WORST_BYTES`, `OVER_BUDGET`)
fails, the world or pipeline drifted — STOP and investigate before continuing (the pins are
load-bearing for `PROBE_VERTS`/`SLICE_COUNT`).

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/remesh-perf.test.ts
git commit -m "test: Phase 0 gate — pinned worst chunk (2,1,0 @ 6312 verts / 315,600 B), r_mesh gate, PROBE_VERTS/SLICE_COUNT derivations, 20-chunk over-budget pin, band linearity, exact split-union equality"
```

---

### Task 6: `main.ts` drain integration (probe + reserved slice frames + cancellation)

`main.ts` runs the app at import, so it is verified by type-check + the full suite (the
regression net) + the browser acceptance in Task 8 — not by node unit tests (project
precedent: `streaming.ts`'s pure logic is tested; the scene glue is not).

**Files:**
- Modify: `src/main.ts` (imports; `swapChunkMesh` refactor of `rebuildChunkMesh`;
  `removeChunkMesh` cancel; the frame-end drain)

- [ ] **Step 1: Imports + module-level state**

In `src/main.ts`, replace line 7:

```ts
import { meshChunk } from './chunk-mesher';
```

with:

```ts
import { meshChunk, meshChunkRange, probeMeshChunk, type ChunkMesh, type LightSampler } from './chunk-mesher';
import { SliceScheduler, decideBands, PROBE_VERTS, SLICE_COUNT } from './mesh-slices';
```

(After Task 1, `import { toGeometry } from './geometry';` is already present.)

After the `deferredFirstMesh` declaration (the `const deferredFirstMesh = new Set<string>();`
line and its comment), add:

```ts
const scheduler = new SliceScheduler(); // heavy-chunk slice plans (ADR 0013): at most one in flight
const lightSampler: LightSampler = (x, y, z) => world.getLight(x, y, z);
```

- [ ] **Step 2: Refactor `rebuildChunkMesh` around `swapChunkMesh`, add cancellation**

Replace the current `rebuildChunkMesh` function (from `function rebuildChunkMesh(cx: number,
cy: number, cz: number): void {` through its closing `}`, including the `(T8 remeshes around
edits via remeshAround; …)` comment line after it if you like — the comment stays accurate)
with:

```ts
/** Scene side of a finished mesh: dispose the old entry, build geometries, swap, clear dirty.
 * Shared by the sync edit path, the probe-complete drain path, and the slice-merge path. */
function swapChunkMesh(cx: number, cy: number, cz: number, mesh: ChunkMesh): void {
  const key = chunkKey(cx, cy, cz);
  const old = chunkObjs.get(key);
  for (const m of [old?.opaque, old?.trans]) {
    if (m) {
      scene.remove(m);
      m.geometry.dispose();
    }
  }
  const entry: { opaque: THREE.Mesh | null; trans: THREE.Mesh | null } = { opaque: null, trans: null };
  if (mesh.opaque) entry.opaque = new THREE.Mesh(toGeometry(mesh.opaque), matOpaque);
  if (mesh.trans) entry.trans = new THREE.Mesh(toGeometry(mesh.trans), matTrans);
  if (entry.opaque) scene.add(entry.opaque);
  if (entry.trans) scene.add(entry.trans);
  chunkObjs.set(key, entry);
  const ch = world.getChunk(cx, cy, cz);
  if (ch) ch.dirty = false; // a rebuilt mesh is up to date; streaming only reschedules stale chunks
}

/** Synchronous edit-remesh (setBlock / door toggle path). Still one-shot for heavy chunks —
 * documented residual, belongs to TODO items 2/3 (worker offload / adaptive budget). */
function rebuildChunkMesh(cx: number, cy: number, cz: number): void {
  scheduler.cancel(chunkKey(cx, cy, cz)); // a sync edit supersedes any in-flight split — a finished split must never clobber it
  swapChunkMesh(cx, cy, cz, meshChunk(world, cx, cy, cz, lightSampler));
}
```

And in `removeChunkMesh`, as the first statement of the function body (before
`const key = chunkKey(cx, cy, cz);`), add:

```ts
  scheduler.cancel(chunkKey(cx, cy, cz)); // an in-flight split of a vanished chunk is discarded (partial buffers are CPU-only)
```

- [ ] **Step 3: Replace the frame-end drain**

The touched-merge block just above it is **left unchanged**. The re-mesh warrant for a
finished split comes from the pending entry itself: the probe path deletes the entry when the
plan starts, and nothing re-adds it except a light/water touch (the touched-merge) or a
streaming dirty-remesh mark (`deferredFirstMesh`) during the split — so the entry's presence
at the merge means "stale, re-mesh next frame", and its absence means "done".

In `frame()`, replace the drain block — the two-line comment starting `// Re-mesh up to
REBUILD_BUDGET, closest to the player first;` through the closing `}` of its
`if (pendingRebuild.size)` — with:

```ts
  // Re-mesh closest to the player first (light/water is a self-correcting lower bound, so a
  // briefly-stale mesh is fine — ADR 0012). A frame that runs a heavy-chunk slice — or starts
  // one (the probe already spent the frame's budget) — is RESERVED for it: a slice is ≤ ~7 ms
  // at the worst-case density, and the other budget slots would risk the 16.7 ms budget; the
  // skipped rebuilds carry one more frame. A probe-complete mesh is ≤ PROBE_VERTS verts =
  // ≤ 16.7 ms by construction, so it flows through the ordinary budget.
  const pcx = chunkOf(player.pos.x), pcy = chunkOf(player.pos.y), pcz = chunkOf(player.pos.z);
  const inFlight = scheduler.inFlightKey();
  if (inFlight) {
    const [cx, cy, cz] = inFlight.split(',').map(Number) as [number, number, number];
    if (world.hasChunk(cx, cy, cz)) {
      const band = scheduler.advance(inFlight)!;
      scheduler.store(inFlight, meshChunkRange(world, cx, cy, cz, lightSampler, band[0], band[1]));
      const merged = scheduler.finish(inFlight);
      if (merged) {
        swapChunkMesh(cx, cy, cz, merged); // the old mesh was kept the whole split — swap at merge only
        // The pending entry was deleted when the plan started; if it is back here, light/water
        // touched the chunk during the split (or streaming marked it dirty) — its slices saw
        // mixed per-frame light states, so the entry stays and the next frame re-meshes
        // (the self-correcting contract). No entry → the chunk is done.
      }
      // Non-final frames: nothing to delete — the entry was already gone at start, and the
      // pre-check finds the plan via the scheduler, not via pendingRebuild.
    } else {
      scheduler.cancel(inFlight); // unloaded between frames
      pendingRebuild.delete(inFlight);
    }
  } else if (pendingRebuild.size) {
    const list = [...pendingRebuild].map((k) => k.split(',').map(Number) as [number, number, number]);
    list.sort((a, b) => rebuildScore(a, pcx, pcy, pcz) - rebuildScore(b, pcx, pcy, pcz));
    for (const [cx, cy, cz] of list.slice(0, REBUILD_BUDGET)) {
      const key = `${cx},${cy},${cz}`;
      if (!world.hasChunk(cx, cy, cz)) {
        pendingRebuild.delete(key);
        continue;
      }
      const probe = probeMeshChunk(world, cx, cy, cz, lightSampler, PROBE_VERTS);
      pendingRebuild.delete(key);
      if (probe.complete) {
        swapChunkMesh(cx, cy, cz, probe.mesh); // the probe IS the full mesh — today's behavior
      } else {
        // Heavy: the probe's partial buffer is discarded; start the slice plan and run band 0
        // this frame (the probe already spent the frame's budget — the frame is reserved).
        scheduler.start(key, decideBands(world.getChunk(cx, cy, cz)!, SLICE_COUNT));
        const [y0, y1] = scheduler.advance(key)!;
        scheduler.store(key, meshChunkRange(world, cx, cy, cz, lightSampler, y0, y1));
        break;
      }
    }
  }
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm test`
Expected: full suite green (the drain is scene glue — the suite is the regression net; the
behavioral check is Task 8's browser acceptance).

- [ ] **Step 5: Commit**

```bash
git add src/main.ts
git commit -m "feat: frame-end drain budgets the heavy remesh — probeMeshChunk(PROBE_VERTS) per candidate; truncated → SLICE_COUNT reserved row-band frames + merge-swap (old mesh kept until merge; cancel on edit/unload; touched-mid-split re-meshes)"
```

---

### Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full suite**

Run: `npm test`
Expected: ALL suites pass — including the untouched `water-load`, `light-load`,
`light-worker-core`, `streaming`, and the new `geometry` / `mesher-budget` / `mesh-slices` /
`remesh-perf`. Note the `PERF` console line from `remesh-perf` (machine-dependent, recorded
for the ADR only).

- [ ] **Step 2: Build gate**

Run: `npm run build`
Expected: `tsc --noEmit` clean + `vite build` succeeds.

- [ ] **Step 3: Commit (only if anything was fixed)**

If any fix was needed, commit it:

```bash
git add -A
git commit -m "fix: <what the verification caught>"
```

Otherwise: no commit.

---

### Task 8: Browser acceptance + docs (ADR 0013, index, ADR 0002 pointer, TODO, PROJECT.md)

**Files:**
- Create: `docs/adr/0013-heavy-remesh-slicing.md`
- Modify: `docs/adr/README.md` (index row), `docs/adr/0002-world-model-terrain.md`
  (Consequences follow-up line), `TODO.md` (resolve the item), `PROJECT.md` (§11 note)

- [ ] **Step 1: Browser acceptance (manual, recorded per the ADR 0012 precedent)**

Run: `npm run dev` (vite — open the printed localhost URL).

1. **Worst chunk.** Spawn at (6, 46). The worst chunk `2,1,0` covers world x 32–47, z 0–15 —
   walk ~31 blocks north (−z) and ~27 blocks east (+x) so it streams in (the ring follows the
   player; watch the heavy water/cave terrain appear at the edge). Open DevTools → Performance
   and record while it loads + settles. Identify its frames by the `probeMeshChunk` /
   `meshChunkRange` entries in the flame chart.
   **Pass:** no dropped frames (no ~33 ms frame gaps) during its load + first mesh + remesh;
   the worst single frame's main-thread time is ≤ 16.7 ms (record the measured worst-slice
   frame in ms for the ADR).
2. **Regression: open ocean.** Walk east over the sea surface (the sea starts at x ≥ 9 at
   z ≈ 46). **Pass:** the walk stays at the existing profile — no 25+ ms frames (the original
   2+2 stutter scenario, ADR 0002).
3. **Interaction sanity (quick):** break a block near a heavy chunk and place one back — the
   sync edit path must still work (the cancel wiring must not have broken `rebuildChunkMesh`).
   Place/break water near the worst chunk and watch it re-mesh without a hole or a stuck
   split (the touched-mid-split re-mesh rule).

Record: worst-slice frame (ms), frame-gap check result, ocean-walk result, the `npm test`
`PERF` line from Task 7. Kill the dev server when done.

- [ ] **Step 2: Write `docs/adr/0013-heavy-remesh-slicing.md`**

```markdown
# 0013. Heavy-chunk remesh — a vertex-budget probe splits the one-shot rebuild into balanced row-band slices

- **Status:** Accepted
- **Last updated:** 2026-08-29
- **Sources:** `docs/superpowers/specs/2026-08-29-slice-heavy-remesh-design.md` (revision R1),
  `docs/superpowers/plans/2026-08-29-slice-heavy-remesh.md`
- **Resolves:** TODO.md → Streaming / rendering — "Slicing a huge remesh over 2 frames (half
  the vertices per frame) would remove the last visible hitch" (ADR 0002 follow-up).

## Context

Every chunk rebuild is one atomic `rebuildChunkMesh`: a single synchronous `meshChunk` pass
(4096 cells), one `BufferGeometry` build, one GPU upload. Typical chunks cost 2–5 ms and the
frame-end drain (`REBUILD_BUDGET = 3`) keeps frames under budget (ADR 0002: the budget was
dropped from 2+2 after 25–138 ms frames over open ocean). The single largest water/cave chunk
still remeshed one-shot at 15–28 ms — the last visible hitch; everything else held zero frames
> 25 ms. The per-phase probe that found it was deleted with the fix (TODO item 6), so the
share of 15–28 ms held by `meshChunk` CPU, geometry build, or GPU upload was unknown.

A pre-plan measurement gate (Phase 0, `remesh-perf.test.ts`) pinned the answer on the
deterministic band (seed 1234): the worst chunk is `2,1,0` at **6312** opaque+trans vertices /
**315,600 B** of geometry; the cost is **CPU-mesh-bound** (`r_mesh = 0.982`; merge-frame gate:
`28 × 0.018 + 0.316 ms ≈ 0.8 ms ≪ 8.7 ms`); 4-way row-band linearity 1.107 (≤ 1.25); **20**
band chunks exceed the probe budget. The gate also refuted the original cell-count-threshold
design: the worst chunk is NOT the largest by cell count (stone-heavy chunks at 4000+ cells
mesh faster), and no cell/water/emit proxy separates the slow class — vertex count separates
(clean gap 5220 vs 4844) but is only known while meshing.

## Decision

The decision is made by the mesher itself, not by a pre-mesh proxy:

- **`meshChunkImpl(world, cx, cy, cz, lightAt, ly0, ly1, maxVerts)`** — the mesher runs over a
  row range `[ly0, ly1)` and stops charging faces at `maxVerts` total verts (a face is never
  split). Per-cell emission is independent (culling reads only the neighbor's block id / water
  height / meta), so a row-band partition is **exact**: the band meshes concatenated (indices
  rebased) are byte-identical to the whole mesh — pinned by a deep-equality test on the worst,
  all-water, all-air, and special-block chunks. Public `meshChunk` keeps its exact
  signature/return; new `meshChunkRange` (slices) and `probeMeshChunk` (the decision).
  `toGeometry` moved to node-importable `src/geometry.ts` (Phase 0 needs the geometry-build
  phase measurable).
- **`PROBE_VERTS = 3764 = floor(6312 × 16.7 / 28)`** — the probe's vertex budget: at the
  worst-case measured density (28 ms / 6312 verts) a probe frame is **≤ 1 vsync by
  construction**, on any machine. The frame-end drain probes every candidate: **complete** →
  the probe IS the full mesh and flows through the ordinary `REBUILD_BUDGET` (today's
  behavior, today's cost, for ≤ 3764-vert chunks); **truncated** → the chunk is heavy.
- **`SLICE_COUNT = 4 = ceil(6312 / 1803)`** — a truncated chunk is meshed in 4 contiguous row
  bands (`decideBands`, balanced by non-air row counts; a band may be empty), one per
  **reserved frame** (a slice frame runs no other rebuild — a slice is ≤ 1803 verts ≈ ≤ ~7 ms
  at the worst-case density), then `mergeSlices` (concat + index rebase) → one geometry → one
  upload on the merge frame (the lightest band carries it: measured 0.6 ms of 5.3 ms on the
  worst chunk). The old mesh is kept until the merge (at most N frames of the already-
  accepted "briefly-stale self-correcting lower bound", ADR 0012); a fresh load's pop-in
  extends from ~2 to ~4 frames, ring-edge only.
- **Cancellation:** the synchronous edit path (`rebuildChunkMesh`) and unload
  (`removeChunkMesh`) cancel any in-flight plan first — a finished split can never clobber an
  edit; partial buffers are CPU-only typed arrays (no GPU resources before the merge), so a
  walk-away unload is free. Light/water touched mid-split is NOT cancelled (each slice meshes
  from the light it has; the drain deletes the pending entry when a plan starts, so the entry's
  presence at the merge is the re-mesh warrant — only a light/water touch or a streaming
  dirty-remesh mark during the split can re-add it).
- **One in-flight plan at a time** (`SliceScheduler` enforces it; the drain pre-checks before
  any start) — serialized starts keep the reservation reasoning simple.

## Alternatives considered

- **Static cell-count threshold** (the original design) — refuted by the Phase 0 scan: no
  proxy gap; the worst chunk is mid-pack by cells.
- **Persistent two-mesh chunks** (y<8 / y≥8 forever) — 2× draw calls, 2× geometries, 2×
  dispose/create churn permanently, plus parts-array bookkeeping in every downstream path, to
  fix a rare tail.
- **Time-based drain governor** — a 28 ms rebuild is atomic; a governor can choose not to
  start it but can't interrupt it (TODO item 3's territory; complementary later).
- **Worker offload of meshing** — TODO item 2; the slice API is deliberately worker-
  compatible (`meshChunkImpl`'s range/budget parameters) so item 2 reuses it.

## Consequences

- **Measured browser acceptance (2026-08-29, branch `slice-heavy-remesh`):** <transcribe from
  the Task 8 acceptance log — pass criteria: no dropped frames (no ~33 ms gaps) during the
  worst chunk's load + first mesh + remesh; worst slice frame < ____ ms (≤ 16.7 expected);
  open-ocean walk unchanged.>
- Streaming cost: up to 20 × (1 probe + 4 slice frames) ≈ 100 reserved frames per full ring
  refill — each ≤ 1 vsync by construction; near chunks drain first (score order);
  `PROBE_VERTS` is a single tunable if the reservation ever reads as sluggish streaming.
- Residual (out of scope): the synchronous edit-remesh path still rebuilds a heavy chunk
  one-shot — belongs to TODO items 2/3.
- Follow-ups: the adaptive frame budget (ADR 0002 / TODO 3) can tune the reservation; the
  worker offload (TODO 2) reuses the partitioned/budgeted mesher API.
```

(Fill the single `<transcribe …>` line with the Step 1 numbers before committing.)

- [ ] **Step 3: Add the ADR index row**

In `docs/adr/README.md`, after the `0012` table row, add:

```markdown
| [0013](0013-heavy-remesh-slicing.md) | Heavy-chunk remesh | vertex-budget probe + 4 balanced row-band slices on reserved frames (exact partition, merge at end) |
```

- [ ] **Step 4: Point ADR 0002 at the resolution**

In `docs/adr/0002-world-model-terrain.md`, replace the Consequences line:

```markdown
- Open follow-ups, tracked in TODO.md: an **adaptive frame budget** (a cheap frame-time governor that raises the load/remesh budget to 2–3 on a fast machine when the last frame was < 8 ms and drops it to 0–1 when a heavy water/cave band is streaming in), and **slicing the one-shot heavy remesh over 2 frames** (half the vertices per frame) to remove the last visible hitch.
```

with:

```markdown
- Open follow-ups, tracked in TODO.md: an **adaptive frame budget** (a cheap frame-time governor that raises the load/remesh budget to 2–3 on a fast machine when the last frame was < 8 ms and drops it to 0–1 when a heavy water/cave band is streaming in). **Slicing the one-shot heavy remesh** is resolved by ADR 0013 (2026-08-29, branch `slice-heavy-remesh` — vertex-budget probe + 4 balanced row-band slices on reserved frames).
```

- [ ] **Step 5: Resolve the TODO.md item**

In `TODO.md`, delete the whole bullet (it is resolved — the file header says resolved items
are removed):

```markdown
- One-shot heavy remesh still shows as a 15–28 ms hiccup on the single largest water/cave chunk
  (accepted: zero >25 ms frames now except that tail; see §9 numbers). Slicing a huge remesh
  over 2 frames (half the vertices per frame) would remove the last visible hitch. (ADR 0002.)
```

- [ ] **Step 6: Add the PROJECT.md §11 note**

In `PROJECT.md`, in section `## 11. Chunk streaming`, after the line `Three does not
garbage-collect GPU buffers. Every geometry you replace must be explicitly disposed.` (and
before the `---`), insert:

```markdown
**Heavy-chunk slicing (2026-08-29, ADR 0013).** The one-shot remesh of the largest water/cave
chunk (15–28 ms on the single heaviest chunk) is now budgeted like the streaming: the
frame-end drain probes each candidate with a vertex budget (`PROBE_VERTS = 3764` — a probe
frame ≤ 1 vsync by construction); a truncated probe means the chunk is sliced into
`SLICE_COUNT = 4` balanced row bands, one per reserved frame (each ≤ ~7 ms at worst-case
density), merged into one geometry at the end. The row-band partition is exact (per-cell
emission independence — the band meshes concatenated are byte-identical to the whole), so the
slices cost nothing visually; the old mesh is kept until the merge.
```

- [ ] **Step 7: Final verification + commit**

Run: `npm test`
Expected: full suite green.

```bash
git add docs/adr/0013-heavy-remesh-slicing.md docs/adr/README.md docs/adr/0002-world-model-terrain.md TODO.md PROJECT.md
git commit -m "docs: ADR 0013 — heavy-chunk remesh slicing (vertex-budget probe + 4 row-band slices on reserved frames) with measured browser acceptance; ADR 0002 follow-up resolved; TODO item removed; PROJECT.md §11 note"
```