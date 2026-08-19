# Torches, Doors, Scrollable Palette — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a placeable torch (floor post / wall stub), a two-cell door that right-click toggles open/closed, and a scrollable icon+name palette listing every placeable block — plus the TODO.md "Sky & lighting" section — per the spec in `docs/superpowers/specs/2026-08-18-torches-doors-palette-design.md`.

**Architecture:** New block kinds `Torch`/`DoorBottom`/`DoorTop` (ids 10–12) ride the existing block-id channel; per-cell state (torch mount face, door open/axis) lives in a new parallel `meta: Uint8Array` per chunk — the same pattern as the water flag arrays. `world.isSolid()` becomes the single collision truth (closed door = solid in both halves, open door/torch = walkable). The chunk mesher gains a partial-geometry `pushBox` helper plus pure torch/door emitters for the opaque pass (no lights yet — real light emission is the deferred TODO item). The palette (E) is generated from `PLACEABLE` as a scrolling list of icon+name rows.

**Tech Stack:** TypeScript, Three.js (canvas atlas), Vite, Vitest. No new dependencies.

**Read first:** `docs/superpowers/specs/2026-08-18-torches-doors-palette-design.md` — this plan implements it exactly; the doc holds the geometry table and the RMB/LMB interaction matrix.

**Commands:** tests: `npx vitest run src/__tests__/<file>.test.ts` (or `npm test` for all). Typecheck+build: `npm run build` (tsc --noEmit && vite build). `src/main.ts` is NOT node-testable (DOM/Three) — Tasks 6–7 verify via `npm run build` plus the manual checklist in Task 9, matching how T11 and the help overlay were done.

---

## Execution notes (2026-08-18, branch `feat/torches-doors-palette`)

All 9 tasks implemented subagent-driven from `ba4612e`. Automated verification green at the
end of Task 9: `npm test` → 10 files / 95 tests; `npm run build` (tsc + vite) clean.
The Task 9 manual in-browser pass (Step 3) is pending — run `npm run dev` and drive
the checklist; extra edges to look for (from the Task 7 review): water standing
beside/above a door **stays put when the door is opened** (water sim keeps the flat
per-id `solid` truth — POC-accepted asymmetry, PROJECT.md §16); toggle a door half
whose partner sits in a chunk that streams out, walk away and back — the partner may
show the stale state until the next toggle (id-matched, self-normalizing); break/
toggle a pair across a y-band chunk seam (y≡15/0) and confirm both halves move
atomically (wireframe `C`); a falling column landing exactly on a torch cell leaves
a cosmetic sheet resting on the thin post.

Per-task commits (plan → code → fixes):

| Task | Commits |
|------|---------|
| 1 registry | `b2943a5`, `0a0482b`, (doc reconciliations in `840b802`) |
| 2 world meta | `1b7fa21`, `51915d7` |
| 3 player isSolidAt | `3ee196d`, `13cc93d` |
| 4 mesher | `91d4eb8`, `270b90a` (plan fixup), `c8b7c98` |
| 5 water pin | `8e34e02` |
| 6 visuals | `0963485`, `6486135` (plan fixup), `65d1ed2` |
| 7 interactions | `0e83183` |
| 8 docs | `7592a18`, `3158e1d` (PROJECT.md wording fix) |

Deviations from the written plan, all reconciled (plan/spec text patched so it now
matches the code):

1. **`DoorTop.name` = `'doorTop'`**, not `'door'` (Task 1): the plan's uniqueness test
   demanded 13 distinct names while naming both halves `'door'`. DoorTop is internal
   (never UI-visible), so it got its own name.
2. **`world.isSolid` cube fallback = `isOpaque`, not `BLOCKS[.].solid`** (Task 2):
   the plan's comment "solid == opaque on every kind" was false for leaves/glass
   (`solid:true` for the water sim, walkable for the player). Keeping `isOpaque`
   preserves legacy gameplay; the rule is documented in `world.isSolid`'s docblock
   and pinned by tests (leaves/glass → `isSolid` false).
3. **Task 3 red phase** failed behaviorally (player walks through the "closed" door)
   rather than with the anticipated TS arity error — vitest transpiles without
   typechecking, so the extra ctor arg was silently ignored.
4. **Task 4 wall-torch UV test**: the plan checked the stub tip's flame uvs at
   indices 0..7; impossible, because the supporting stone emits before the torch
   (buffer order ly→lz→lx) — the tip sits at global verts 24..27 (uv u indices
   48..54). Test corrected in place (and in the plan, `270b90a`).
5. **Task 4 tuple annotations**: the plan's bare `const tiles = [...]` infers
   `number[]` and would fail `tsc` against `pushBox`'s 6-tuple parameter — the
   implementation adds explicit tuple annotations (type-only).
6. **Task 6 scrollbar styling**: the design spec's file table requires in-panel
   scrollbar styling but the plan never had a step for it — re-added as plan Edit C
   (`6486135`) and implemented with the review fixes (`65d1ed2`), which also
   ellipsize the name cell and unify `refreshPaletteSel` on `hotbar.block`.
7. **`doorPartner` matches on block id only** (Task 7; spec said "same axis"): the
   looser check is strictly better — placement/toggle always write identical meta to
   both halves, and a next toggle self-normalizes a corrupted partner.
8. **Task 8 §15 lines adapted** to PROJECT.md's actual wording; the torch placement
   bullet was corrected to "aimed cell empty, backed by a solid opaque face"
   (`water/door/glass/leaves rejected`) — the plan's "air above the target"
   phrasing did not match the real floor-case rule.

Post-plan user-feedback rounds (in-browser pass, 2026-08-18):

9. **Door edge-hinge + fully-textured faces** (commits `3224a9a`, `9be9d73`):
   - Closed door panels now hinge on a cell EDGE chosen by the aimed wall face
     (new `doorMeta(open, axis, side)` bit 2; side 1 for `−X`/`−Z` aims), not
     the cell center — the open state is the SAME full-size 1×0.2 panel swung
     90° about the hinge corner, so it is never the old squished clamped slab.
     (Known cosmetic: a side-1 door's true swing would leave the cell, so its
     open state clamps to the min corner and reads as a small reposition.)
   - Special-block face culling is now **geometry-coverage-aware**: a face is
     culled only when the box end of it actually reaches the cell-boundary
     plane AND the neighbour is opaque, or a special neighbour whose own
     geometry on the shared plane covers the face's area (equal coverage →
     exactly one face kept, by lexicographic cell index). This removes the
     see-through slits/hollow panels the old "neighbour cell is special" rule
     punched in 0.2-thin panels next to torches/doors/far-side walls. Every
     door/torch face now carries its texture from any view angle.

---

### Task 1: Block registry — new ids, names, kinds, meta helpers

**Files:**
- Modify: `src/blocks.ts`
- Test: `src/__tests__/blocks.test.ts`

- [ ] **Step 1: Write the failing tests (replace the whole file)**

Replace `src/__tests__/blocks.test.ts` with the content below (it keeps the old `iconPosition` regression test verbatim, rewrites the id/completeness/PLACEABLE tests for the new registry, and adds kind/name/meta tests):

```ts
import { describe, it, expect } from 'vitest';
import {
  Block, BLOCKS, isOpaque, PLACEABLE, iconPosition,
  torchMeta, torchFace, doorMeta, doorOpen, doorAxis, isDoor,
} from '../blocks';

describe('blocks', () => {
  it('assigns the spec values in order (0..12)', () => {
    expect([
      Block.Air, Block.Stone, Block.Dirt, Block.Grass, Block.Sand, Block.Water,
      Block.Wood, Block.Leaves, Block.Glass, Block.Planks,
      Block.Torch, Block.DoorBottom, Block.DoorTop,
    ]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('BLOCKS has a definition for every block value', () => {
    for (let b = 0; b <= 12; b++) expect(BLOCKS[b], `def for ${b}`).toBeDefined();
    expect(Object.keys(BLOCKS).length).toBe(13);
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
    expect(isOpaque(Block.Torch)).toBe(false);      // partial geometry, never opaque
    expect(isOpaque(Block.DoorBottom)).toBe(false); // a panel, even closed, never culls
    expect(isOpaque(Block.DoorTop)).toBe(false);
    expect(BLOCKS[Block.Water].solid).toBe(false);
    expect(BLOCKS[Block.Leaves].solid).toBe(true);
    expect(BLOCKS[Block.Glass].solid).toBe(true);
    expect(BLOCKS[Block.Torch].solid).toBe(false);
    expect(BLOCKS[Block.DoorBottom].solid).toBe(true); // solid when CLOSED (open ⇒ world.isSolid)
    expect(BLOCKS[Block.DoorTop].solid).toBe(true);
  });

  it('kind: the first ten are cubes, torch and doors are special', () => {
    for (const b of [Block.Air, Block.Stone, Block.Dirt, Block.Grass, Block.Sand, Block.Water, Block.Wood, Block.Leaves, Block.Glass, Block.Planks])
      expect(BLOCKS[b].kind, BLOCKS[b].name).toBe('cube');
    expect(BLOCKS[Block.Torch].kind).toBe('torch');
    expect(BLOCKS[Block.DoorBottom].kind).toBe('door');
    expect(BLOCKS[Block.DoorTop].kind).toBe('door');
    expect(isDoor(Block.DoorBottom)).toBe(true);
    expect(isDoor(Block.DoorTop)).toBe(true);
    expect(isDoor(Block.Torch)).toBe(false);
    expect(isDoor(Block.Stone)).toBe(false);
  });

  it('every block has a name, and names are unique', () => {
    const names = new Set<string>();
    for (let b = 0; b <= 12; b++) {
      expect(BLOCKS[b].name, `name for ${b}`).toMatch(/\w+/);
      names.add(BLOCKS[b].name);
    }
    expect(names.size).toBe(13);
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

  it('PLACEABLE: 11 logical blocks (9 cubes + torch + door), never Air', () => {
    expect(PLACEABLE).toHaveLength(11);
    expect(PLACEABLE).not.toContain(Block.Air);
    expect(PLACEABLE).toContain(Block.Torch);
    expect(PLACEABLE).toContain(Block.DoorBottom); // the door's logical id
    expect(PLACEABLE).not.toContain(Block.DoorTop); // halves are never picked directly
  });

  // Regression: main.ts once built this string as static text (a `-$((` typo broke the
  // template interpolation), so every slot got the same invalid position, CSS dropped
  // it, and all icons defaulted to atlas tile 0 (grass). The string must embed real
  // per-block numbers and stay valid CSS.
  it('iconPosition: per-block pixel offset from the top row, at the given icon scale', () => {
    expect(iconPosition(Block.Grass, 40)).toBe('-0px 0px'); // tile 0, no shift
    expect(iconPosition(Block.Stone, 40)).toBe('-120px 0px'); // tile 3 * 40
    expect(iconPosition(Block.Dirt, 40)).toBe('-80px 0px'); // tile 2 * 40
    expect(iconPosition(Block.Sand, 40)).toBe('-160px 0px'); // tile 4 * 40
    expect(iconPosition(Block.Water, 44)).toBe('-220px 0px'); // tile 5 * 44 (palette scale)
    expect(iconPosition(Block.Wood, 40)).toBe('-280px 0px'); // top face tile 7
    expect(iconPosition(Block.Leaves, 40)).toBe('-320px 0px'); // tile 8
    expect(iconPosition(Block.Glass, 40)).toBe('-360px 0px'); // tile 9
    expect(iconPosition(Block.Planks, 40)).toBe('-400px 0px'); // tile 10
    expect(iconPosition(Block.Torch, 40)).toBe('-440px 0px'); // tile 11 (torchStem, via +Y face)
    expect(iconPosition(Block.DoorBottom, 40)).toBe('-520px 0px'); // tile 13 (door; tile 12 = flame, unused as icon)
    // must stay a number, not the raw expression text
    expect(iconPosition(Block.Stone, 40)).not.toContain('iconTile');
  });

  it('torch meta: 0 = floor post, otherwise 1 | (face << 1); round-trips', () => {
    expect(torchMeta(0)).toBe(0); // floor post
    for (const face of [1, 2, 3, 4]) { // 1:+X 2:-X 3:+Z 4:-Z
      expect(torchFace(torchMeta(face)), `face ${face}`).toBe(face);
    }
    expect(torchFace(0)).toBe(0);
  });

  it('door meta: bit0 = open, bit1 = axis; round-trips', () => {
    for (const open of [false, true])
      for (const axis of [0, 1]) {
        expect(doorOpen(doorMeta(open, axis)), `${open}/${axis}`).toBe(open);
        expect(doorAxis(doorMeta(open, axis)), `${open}/${axis}`).toBe(axis);
      }
    expect(doorMeta(false, 0)).toBe(0); // a fresh closed X-thin door carries 0
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/__tests__/blocks.test.ts`
Expected: FAIL — `Block.Torch`/`Block.DoorBottom`/`Block.DoorTop` are `undefined` and the `torchMeta`/`doorMeta`/`doorOpen`/`doorAxis`/`isDoor` imports do not exist.

- [ ] **Step 3: Implement `src/blocks.ts` (replace the whole file)**

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
  Torch,
  DoorBottom,
  DoorTop,
}

/** 'cube' flows through the normal mesher path; 'torch'/'door' are partial geometry. */
export type BlockKind = 'cube' | 'torch' | 'door';

export interface BlockDef {
  name: string; // display name: palette rows, slot tooltips
  solid: boolean;        // collides with player (doors: when CLOSED — open state via world.isSolid)
  transparent: boolean;  // culls neighbor faces? (never for torch/door — they are partial geometry)
  kind: BlockKind;
  /** tile indices, order [+X, -X, +Y, -Y, +Z, -Z]; see the atlas layout in main.ts. faces[2] doubles as the UI icon tile */
  faces: [number, number, number, number, number, number];
}

// D1: Record<number, ...> so plain-number voxel data indexes freely; completeness is test-enforced.
export const BLOCKS: Record<number, BlockDef> = {
  [Block.Air]:        { name: 'air',    solid: false, transparent: true,  kind: 'cube',  faces: [0, 0, 0, 0, 0, 0] },
  [Block.Stone]:      { name: 'stone',  solid: true,  transparent: false, kind: 'cube',  faces: [3, 3, 3, 3, 3, 3] },
  [Block.Dirt]:       { name: 'dirt',   solid: true,  transparent: false, kind: 'cube',  faces: [2, 2, 2, 2, 2, 2] },
  [Block.Grass]:      { name: 'grass',  solid: true,  transparent: false, kind: 'cube',  faces: [1, 1, 0, 2, 1, 1] },
  [Block.Sand]:       { name: 'sand',   solid: true,  transparent: false, kind: 'cube',  faces: [4, 4, 4, 4, 4, 4] },
  [Block.Water]:      { name: 'water',  solid: false, transparent: true,  kind: 'cube',  faces: [5, 5, 5, 5, 5, 5] },
  [Block.Wood]:       { name: 'wood',   solid: true,  transparent: false, kind: 'cube',  faces: [6, 6, 7, 7, 6, 6] },
  [Block.Leaves]:     { name: 'leaves', solid: true,  transparent: true,  kind: 'cube',  faces: [8, 8, 8, 8, 8, 8] },
  [Block.Glass]:      { name: 'glass',  solid: true,  transparent: true,  kind: 'cube',  faces: [9, 9, 9, 9, 9, 9] },
  [Block.Planks]:     { name: 'planks', solid: true,  transparent: false, kind: 'cube',  faces: [10, 10, 10, 10, 10, 10] },
  [Block.Torch]:      { name: 'torch',  solid: false, transparent: true,  kind: 'torch', faces: [11, 11, 11, 11, 11, 11] },
  [Block.DoorBottom]: { name: 'door',   solid: true,  transparent: true,  kind: 'door',  faces: [13, 13, 13, 13, 13, 13] },
  [Block.DoorTop]:    { name: 'doorTop', solid: true,  transparent: true,  kind: 'door',  faces: [13, 13, 13, 13, 13, 13] },
};

export const TILE_NAMES = [
  'grassTop', 'grassSide', 'dirt', 'stone', 'sand', 'water',
  'woodSide', 'woodTop', 'leaves', 'glass', 'planks',
  'torchStem', 'torchFlame', 'door',
] as const;

export function isOpaque(b: number): boolean {
  return b !== Block.Air && !BLOCKS[b].transparent;
}

// DoorBottom is the door's LOGICAL id (palette/hotbar); placement expands it to the
// bottom + top pair. Torch/DoorBottom are the only new entries -> 11 logical placeables.
export const PLACEABLE: Block[] = [
  Block.Grass, Block.Stone, Block.Dirt, Block.Sand, Block.Wood,
  Block.Leaves, Block.Glass, Block.Planks, Block.Water,
  Block.Torch, Block.DoorBottom,
];

export function iconTile(b: Block): number {
  return BLOCKS[b].faces[2]; // top-face tile doubles as the UI icon
}

// CSS background-position that crops the block's top-row tile column out of the full
// atlas, scaled to `px` per tile (16 tiles across). Kept as a pure string helper so the
// interpolation stays unit-tested (main.ts's `-$((` typo once made it static, invalid
// CSS, and every slot fell back to tile 0 — grass).
export function iconPosition(b: Block, px: number): string {
  return `-${(iconTile(b) % 16) * px}px 0px`;
}

// === per-cell state (stored in World.meta; design doc section "Per-cell state") ===
//
// Torch meta: 0 = a floor post; a wall stub is 1 | (face << 1) where `face` is the
// normal of the support face the player aimed at: 1:+X, 2:-X, 3:+Z, 4:-Z (no ceilings).
// Door meta (stored in BOTH halves, identical): bit 0 = open, bit 1 = axis
// (0 = panel thin in X, 1 = panel thin in Z).

export function torchMeta(face: number): number {
  return face === 0 ? 0 : 1 | (face << 1);
}

export function torchFace(meta: number): number {
  return meta === 0 ? 0 : (meta >> 1) & 7;
}

export function doorMeta(open: boolean, axis: number): number {
  return (open ? 1 : 0) | ((axis & 1) << 1);
}

export function doorOpen(meta: number): boolean {
  return (meta & 1) !== 0;
}

export function doorAxis(meta: number): number {
  return (meta >> 1) & 1;
}

export function isDoor(b: number): boolean {
  return b === Block.DoorBottom || b === Block.DoorTop;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/blocks.test.ts`
Expected: PASS (every `it` green).

- [ ] **Step 5: Run the rest of the suite — this change breaks nothing else**

Run: `npm test`
Expected: PASS. (Other suites reference only pre-existing ids; `PLACEABLE` length is asserted only in blocks.test.ts.)

- [ ] **Step 6: Commit**

```bash
git add src/blocks.ts src/__tests__/blocks.test.ts
git commit -m "feat: registry gains Torch/DoorBottom/DoorTop with names, kinds and per-cell meta helpers"
```

---

### Task 2: World — meta array, getMeta, setBlock(meta), isSolid

**Files:**
- Modify: `src/world.ts`
- Test: `src/__tests__/world.test.ts`

- [ ] **Step 1: Write the failing tests**

Edit the import line in `src/__tests__/world.test.ts`:

Old:
```ts
import { Block } from '../blocks';
```
New:
```ts
import { Block, torchMeta, doorMeta } from '../blocks';
```

Then append these two `it` blocks inside the existing `describe('world', ...)` (after the `removeChunk / clear` test, before the closing `});`):

```ts
  it('setBlock stores and clears per-cell meta (torch mount / door state)', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    w.setBlock(5, 5, 5, Block.DoorBottom, doorMeta(false, 1));
    expect(c.blocks[localIndex(5, 5, 5)]).toBe(Block.DoorBottom);
    expect(c.meta[localIndex(5, 5, 5)]).toBe(doorMeta(false, 1));
    expect(w.getMeta(5, 5, 5)).toBe(doorMeta(false, 1));
    // same block + a DIFFERENT meta is a change (a door toggle) -> true + dirty
    c.dirty = false;
    expect(w.setBlock(5, 5, 5, Block.DoorBottom, doorMeta(true, 1))).toBe(true);
    expect(c.dirty).toBe(true);
    expect(w.getMeta(5, 5, 5)).toBe(doorMeta(true, 1));
    // a plain block clears the cell's meta (default meta = 0)
    w.setBlock(5, 5, 5, Block.Stone);
    expect(w.getMeta(5, 5, 5)).toBe(0);
    // torch: meta rides the block, gone when the torch is removed
    w.setBlock(6, 5, 5, Block.Torch, torchMeta(2));
    expect(w.getMeta(6, 5, 5)).toBe(torchMeta(2));
    w.setBlock(6, 5, 5, Block.Air);
    expect(w.getMeta(6, 5, 5)).toBe(0);
    // missing chunk reads as 0 (mirror of getBlock = Air)
    expect(w.getMeta(64, 5, 5)).toBe(0);
  });

  it('isSolid: closed doors block, open doors and torches do not', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0);
    w.setBlock(1, 0, 1, Block.Stone);
    w.setBlock(2, 0, 1, Block.Air);
    w.setBlock(3, 0, 1, Block.Torch);
    w.setBlock(4, 0, 1, Block.DoorBottom, doorMeta(false, 0)); // closed
    w.setBlock(5, 0, 1, Block.DoorBottom, doorMeta(true, 0));  // open
    w.setBlock(6, 0, 1, Block.DoorTop, doorMeta(false, 1));    // closed top half
    w.setBlock(7, 0, 1, Block.Leaves); // solid:true (water sim) but player-passable — pin the legacy rule
    w.setBlock(8, 0, 1, Block.Glass);  // same for glass
    expect(w.isSolid(1, 0, 1)).toBe(true);
    expect(w.isSolid(2, 0, 1)).toBe(false);
    expect(w.isSolid(3, 0, 1)).toBe(false);
    expect(w.isSolid(4, 0, 1)).toBe(true);
    expect(w.isSolid(5, 0, 1)).toBe(false);
    expect(w.isSolid(6, 0, 1)).toBe(true);
    expect(w.isSolid(7, 0, 1)).toBe(false);
    expect(w.isSolid(8, 0, 1)).toBe(false);
    expect(w.isSolid(64, 0, 0)).toBe(false); // missing chunk -> Air -> not solid
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/__tests__/world.test.ts`
Expected: FAIL — `c.meta` does not exist on `Chunk`; `w.getMeta` / `w.isSolid` are not functions.

- [ ] **Step 3: Implement the changes in `src/world.ts`**

Five surgical edits (everything else stays exactly as-is):

Edit A — the import line:

Old:
```ts
import { Block } from './blocks';
```
New:
```ts
import { Block, isOpaque, isDoor, doorOpen } from './blocks';
```

Edit B — `Chunk` interface, the `blocks` field:

Old:
```ts
  blocks: Uint8Array; // D9: 10 block values fit in a byte
```
New:
```ts
  blocks: Uint8Array; // D9: block ids fit in a byte (13 values now: cubes + torch + door halves)
  meta: Uint8Array; // per-cell state for special blocks: torch mount face (torchMeta), door open/axis (doorMeta, BOTH halves). Always 0 for cube blocks
```

Edit C — `ensureChunk`, the fresh-chunk literal:

Old:
```ts
      blocks: new Uint8Array(CHUNK_VOL),
```
New:
```ts
      blocks: new Uint8Array(CHUNK_VOL),
      meta: new Uint8Array(CHUNK_VOL),
```

Edit D — replace `setBlock` (including its doc comment) with the meta-aware version, preceded by the new `getMeta`:

Old:
```ts
  /** Returns false when the chunk is missing or the value is unchanged. Marks the chunk and any existing 6 face-neighbors dirty. */
  setBlock(wx: number, wy: number, wz: number, b: number): boolean {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return false;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    if (c.blocks[i] === b) return false;
    c.blocks[i] = b;
    c.dirty = true;
```
New:
```ts
  /** Per-cell special-block state (torchMeta/doorMeta); missing chunks read as 0, mirroring getBlock = Air. */
  getMeta(wx: number, wy: number, wz: number): number {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return 0;
    return c.meta[localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE)];
  }

  /**
   * Returns false when the chunk is missing or the value is unchanged (block AND meta).
   * meta defaults to 0 — writing any plain block clears the cell's torch/door state.
   * Marks the chunk and any existing 6 face-neighbors dirty: a door closing/opening
   * changes both what is solid and which neighbor faces its panel hides.
   */
  setBlock(wx: number, wy: number, wz: number, b: number, meta = 0): boolean {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return false;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    if (c.blocks[i] === b && c.meta[i] === meta) return false;
    c.blocks[i] = b;
    c.meta[i] = meta;
    c.dirty = true;
```

(Edit D touches only the head of `setBlock`; the neighbor-dirty loop and `return true;` at the end are unchanged.)

Edit E — insert after the (new) `setBlock` method, before `removeChunk`:

```ts
  /**
   * The single collision truth: air and torches are never solid; a door is solid
   * while CLOSED (both halves, full block) and walkable while open. Cube blocks
   * keep the legacy player rule (isOpaque): leaves/glass are solid in BLOCKS
   * (the water sim's blocking truth) but pass-through for the player. Do NOT
   * "fix" the fallback to BLOCKS[.].solid — that would wall off glass/leaves,
   * a gameplay change this feature does not make.
   */
  isSolid(wx: number, wy: number, wz: number): boolean {
    const b = this.getBlock(wx, wy, wz);
    if (b === Block.Air) return false;
    if (b === Block.Torch) return false;
    if (isDoor(b)) return !doorOpen(this.getMeta(wx, wy, wz));
    return isOpaque(b);
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/world.test.ts`
Expected: PASS — old tests still green (three-arg `setBlock` behaves exactly as before: unchanged block + meta 0 => no-op).

- [ ] **Step 5: Run the rest of the suite**

Run: `npm test`
Expected: PASS (water sim, streaming, terrain, raycast, player, ui, mesher all compile against the widened `Chunk`/`setBlock` API).

- [ ] **Step 6: Commit**

```bash
git add src/world.ts src/__tests__/world.test.ts
git commit -m "feat: world gains per-cell meta array (torch/door state), getMeta, setBlock meta param, isSolid"
```

---

### Task 3: Player — state-dependent solidity via isSolidAt

**Files:**
- Modify: `src/player.ts`
- Test: `src/__tests__/player.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the existing `describe('player', ...)` in `src/__tests__/player.test.ts` (after the `swim` test, before the closing `});`). No import changes needed — `Block` is already imported:

```ts
  it('door state drives collision via isSolidAt: a closed door blocks, opening it lets the player through', () => {
    // A full-height door column stands in for a door pair: collision only asks "is this
    // cell solid", and the answer flips with the door's state.
    const state = { closed: true };
    const inDoorColumn = (x: number, z: number) =>
      x >= 10 && x <= 13 && z >= 4 && z <= 7;
    const getBlock = (x: number, _y: number, z: number): number =>
      inDoorColumn(x, z) ? Block.DoorBottom : Block.Air;
    const isSolidAt = (x: number, _y: number, z: number) => inDoorColumn(x, z) && state.closed;
    const p = new Player(getBlock, isSolidAt);
    p.place({ x: 8, y: 5, z: 8 });
    p.yaw = -Math.PI / 2; // face +x, straight into the closed door
    run(p, 90, { forward: 1 });
    expect(p.pos.x).toBeLessThan(10); // held back by the closed door, like a wall
    state.closed = false; // right-click: the door opens
    run(p, 90, { forward: 1 });
    expect(p.pos.x).toBeGreaterThan(13); // walked straight through the open door
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/player.test.ts`
Expected: FAIL — TypeScript error: `Expected 1 arguments, but got 2` on `new Player(getBlock, isSolidAt)` (vitest reports the suite as failed).

- [ ] **Step 3: Implement in `src/player.ts`**

Edit A — constructor (the `private getBlock` field + constructor):

Old:
```ts
  private getBlock: (x: number, y: number, z: number) => number;

  constructor(getBlock: (x: number, y: number, z: number) => number) {
    this.getBlock = getBlock;
  }
```
New:
```ts
  private getBlock: (x: number, y: number, z: number) => number;
  private isSolidAt: (x: number, y: number, z: number) => boolean;

  /**
   * getBlock feeds the water probes (body/eye-voxel sampling); isSolidAt feeds
   * collision. Without one, the pre-door per-id rule (isOpaque(getBlock(...)))
   * applies — correct for every existing test that constructs Player with one arg.
   */
  constructor(
    getBlock: (x: number, y: number, z: number) => number,
    isSolidAt?: (x: number, y: number, z: number) => boolean,
  ) {
    this.getBlock = getBlock;
    this.isSolidAt = isSolidAt ?? ((x, y, z) => isOpaque(this.getBlock(x, y, z)));
  }
```

Edit B — `collides`, the per-voxel check:

Old:
```ts
            if (isOpaque(this.getBlock(x, y, z))) return true;
```
New:
```ts
            if (this.isSolidAt(x, y, z)) return true;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/player.test.ts`
Expected: PASS — the new door test passes and all existing one-argument tests (gravity, floor, wall, jump, noclip, fly, swim) are unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/player.ts src/__tests__/player.test.ts
git commit -m "feat: player collision takes an isSolidAt callback (door open/closed state)"
```

---

### Task 4: Mesher — partial geometry for torches and doors

**Files:**
- Modify: `src/chunk-mesher.ts`
- Test: `src/__tests__/chunk-mesher.test.ts`

- [ ] **Step 1: Write the failing tests**

Edit the import line in `src/__tests__/chunk-mesher.test.ts`:

Old:
```ts
import { Block } from '../blocks';
```
New:
```ts
import { Block, torchMeta, doorMeta } from '../blocks';
```

Then append a new `describe` block AFTER the existing `describe('chunk-mesher', ...)` closes:

```ts
const posBounds = (opaque: { positions: Float32Array }) => {
  const p = opaque.positions;
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    xMin = Math.min(xMin, p[i]); xMax = Math.max(xMax, p[i]);
    yMin = Math.min(yMin, p[i + 1]); yMax = Math.max(yMax, p[i + 1]);
    zMin = Math.min(zMin, p[i + 2]); zMax = Math.max(zMax, p[i + 2]);
  }
  return { xMin, xMax, yMin, yMax, zMin, zMax };
};

describe('chunk-mesher special blocks', () => {
  it('a floor torch emits a small post in the OPAQUE pass; the top face carries the flame tile', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Torch;
    c.meta[localIndex(8, 8, 8)] = torchMeta(0); // floor post
    const { opaque, trans } = meshChunk(w, 0, 0, 0);
    expect(trans).toBeNull(); // torches/doors are opaque-pass geometry, never trans
    expect(opaque).not.toBeNull();
    expect(opaque!.positions.length / 3).toBe(6 * 4); // all 6 faces of the post, open air
    const b = posBounds(opaque!); // post: x/z [8.41, 8.59], y [8, 8.875]
    expect(b.xMin).toBeCloseTo(8.41); expect(b.xMax).toBeCloseTo(8.59);
    expect(b.yMin).toBeCloseTo(8); expect(b.yMax).toBeCloseTo(8.875);
    // the +Y face is the 3rd face emitted (verts 8..11): its uvs sit in the flame tile (12) column
    const uvs = opaque!.uvs;
    for (let i = 16; i < 24; i += 2) {
      expect(uvs[i] >= 12 / 16 - 1e-6 && uvs[i] <= 13 / 16 + 1e-6, `uv ${uvs[i]}`).toBe(true);
    }
  });

  it('a wall torch hides its back face against the wall and puts the flame on the outward tip', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Stone; // the support wall
    c.blocks[localIndex(9, 8, 8)] = Block.Torch;
    c.meta[localIndex(9, 8, 8)] = torchMeta(1); // aimed at the stone's +X face: wall on the stub's -X side
    const { opaque } = meshChunk(w, 0, 0, 0);
    // stone keeps all 6 faces (a torch never culls); the stub loses its -X back face -> 5
    expect(opaque!.positions.length / 3).toBe(6 * 4 + 5 * 4);
    const b = posBounds(opaque!); // stub: x reaches 9.375 (stone bounds 8..9 merged in)
    expect(b.xMax).toBeCloseTo(9.375);
    // the tip: FACES[0] (+X) is the stub's first face emitted. The stone's 6 faces precede it
    // in the buffer (emission order ly -> lz -> lx), so the stub's +X face sits at global
    // verts 24..27 -> its u coords are uv indices 48, 50, 52, 54 -> flame tile 12
    const uvs = opaque!.uvs;
    for (let i = 48; i < 56; i += 2) {
      expect(uvs[i] >= 12 / 16 - 1e-6 && uvs[i] <= 13 / 16 + 1e-6, `uv ${uvs[i]}`).toBe(true);
    }
  });

  // REVISION (user feedback 2026-08-18, commit 3224a9a): the plan's original
  // tests below pinned a CENTERED closed panel (x [0.4, 0.6]) and a clamped
  // 0.55 open slab. The door now hinges on a side edge (new meta bit 2):
  //   closed X side 0: x [0, 0.2]; side 1: x [0.8, 1]; closed Z mirrors on z;
  //   open = the SAME full-size 1 x 0.2 panel swung 90deg about the hinge corner
  //   (open X: x [0, 1], z [0, 0.2]; open Z mirrored) — never squished.
  // See the 'closed X-thin door hugs its side edge…', 'closed Z-thin…',
  // 'open door is the full-size panel swung 90 degrees…' tests in the repo.
  //
  // REVISION (commit 9be9d73): `hidden` no longer means "neighbour cell is
  // opaque or special" — a face is culled only when the box END of that face
  // reaches the cell-boundary plane AND the neighbour is opaque, or a special
  // neighbour whose own geometry on the opposite face covers the face's area
  // (strict superset -> cull; exactly equal -> the smaller lexicographic cell
  // index keeps its face, the other culls). Interior box ends are never culled,
  // so a far-side opaque block cannot punch a slit in a 0.2-thin panel and a
  // torch post cannot eat a door face it never touches. See the repo tests
  // 'far side over-cull', 'keeps its face against a special neighbour…',
  // 'mirror-hinged… exactly one…', 'same-hinge… never z-fight', and the
  // all-special recount (6+6+5).

  it('a door never culls neighbor faces, while a stone neighbor still does', () => {
    const withNeighbor = (neighbor: number, meta = 0) => {
      const w = new World();
      const c = w.ensureChunk(0, 0, 0);
      c.blocks[localIndex(8, 8, 8)] = Block.Stone;
      c.blocks[localIndex(9, 8, 8)] = neighbor;
      if (neighbor === Block.DoorBottom) c.meta[localIndex(9, 8, 8)] = meta;
      return w;
    };
    // Stone next to a closed door: stone keeps ALL 6 faces (a panel is not opaque) and
    // the door loses its stone-facing face -> 6 + 5 faces
    expect(meshChunk(withNeighbor(Block.DoorBottom, doorMeta(false, 0)), 0, 0, 0).opaque!.positions.length / 3)
      .toBe((6 + 5) * 4);
    // Contrast: a stone neighbor IS opaque -> the shared face culls on both blocks -> 5 + 5 faces
    expect(meshChunk(withNeighbor(Block.Stone), 0, 0, 0).opaque!.positions.length / 3).toBe((5 + 5) * 4);
  });

  it('an all-special chunk renders both kinds in one opaque buffer (facing special cells hide each other)', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Torch;
    c.meta[localIndex(8, 8, 8)] = torchMeta(0);
    c.blocks[localIndex(9, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(9, 8, 8)] = doorMeta(false, 0);
    c.blocks[localIndex(9, 9, 8)] = Block.DoorTop;
    c.meta[localIndex(9, 9, 8)] = doorMeta(false, 0);
    const { opaque } = meshChunk(w, 0, 0, 0);
    // face accounting (recounted for the coverage rule, 9be9d73):
    //   torch (8,8,8):    post reaches no vertical plane -> its +X face is kept: 6 faces
    //   door bottom (9,8,8): -X kept (post can't cover), +Y kept (smaller index vs the
    //                        top half's equal coverage) -> 6 faces
    //   door top (9,9,8):    -Y culled (equal coverage, bigger index) -> 5 faces
    expect(opaque!.positions.length / 3).toBe((6 + 6 + 5) * 4);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/__tests__/chunk-mesher.test.ts`
Expected: the new `describe` FAILS — a lone Torch/DoorBottom currently goes through the cube path (full-cell bounds, cube UVs), so bounds/face-count/uv assertions fail.

- [ ] **Step 3: Implement in `src/chunk-mesher.ts`**

Edit A — the import line:

Old:
```ts
import { Block, BLOCKS, isOpaque } from './blocks';
```
New:
```ts
import { Block, BLOCKS, isOpaque, torchFace, doorOpen, doorAxis } from './blocks';
```

Edit B — after the `class Buf { ... }` block (before `meshChunk`), add the partial-geometry helper and the special emitters:

```ts
/** Tiles used by the special emitters (atlas layout: see the TILES painters in main.ts). */
const TILE_TORCH_STEM = 11;
const TILE_TORCH_FLAME = 12;
const TILE_DOOR = 13;

// torch meta face -> FACES index of the stub's outward tip: 1:+X, 2:-X, 3:+Z, 4:-Z
const TIP_FACE = [0, 0, 1, 4, 5];

/**
 * Partial-geometry box for special blocks (torch post/stub, door panel), written into
 * the opaque buffer. `min`/`size` are world-space (a box lives inside ONE cell, size
 * <= 1 per axis). `tiles` is per FACES order [+X, -X, +Y, -Y, +Z, -Z]; the tile is
 * stretched across the whole face — torch/door tiles are painted whole-material, so
 * the stretch still reads correctly on a 0.18-wide post.
 * A face is hidden only if the box END of it reaches the cell-boundary plane AND
 * the neighbouring cell is opaque, or a special block whose geometry covers the
 * face's area (strict superset culls; exactly equal -> keep one by lexicographic
 * cell index). Interior ends are never culled (revision 9be9d73): a stub's back
 * face vanishes against its wall, but a panel face is never eaten by a neighbour
 * whose geometry can't reach that plane. Shading = FACE_SHADE[face]; no vertex AO on partial geometry.
 */
function pushBox(
  buf: Buf,
  min: [number, number, number],
  size: [number, number, number],
  tiles: [number, number, number, number, number, number],
  hidden: (faceIdx: number) => boolean,
): void {
  for (let f = 0; f < 6; f++) {
    if (hidden(f)) continue;
    const face = FACES[f];
    const [au, av] = face.axes;
    const tile = tiles[f];
    const tileCol = tile % 16, tileRow = (tile / 16) | 0;
    for (const c of face.corners) {
      buf.push(
        min[0] + c[0] * size[0],
        min[1] + c[1] * size[1],
        min[2] + c[2] * size[2],
        FACE_SHADE[f],
        (tileCol + c[au]) / 16,
        (15 - tileRow + c[av]) / 16,
      );
    }
    const base = buf.verts - 4;
    buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}

/** Torch: a floor post (meta 0) or a wall stub pointing away from its support (meta face 1..4). */
function emitTorch(
  buf: Buf,
  gb: (x: number, y: number, z: number) => number,
  wx: number, wy: number, wz: number,
  meta: number,
): void {
  const hidden = (f: number): boolean => {
    const d = FACES[f].dir;
    const n = gb(wx + d[0], wy + d[1], wz + d[2]);
    return isOpaque(n) || BLOCKS[n].kind !== 'cube';
  };
  const face = torchFace(meta);
  if (face === 0) {
    pushBox(
      buf,
      [wx + 0.41, wy, wz + 0.41],
      [0.18, 0.875, 0.18],
      [TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_FLAME, TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_STEM],
      hidden,
    );
    return;
  }
  // Wall stub: grows OUT of the support face (the support sits on the face's other side).
  const tiles = [TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_STEM];
  tiles[TIP_FACE[face]] = TILE_TORCH_FLAME;
  if (face === 1) pushBox(buf, [wx, wy + 0.41, wz + 0.41], [0.375, 0.18, 0.18], tiles, hidden);
  else if (face === 2) pushBox(buf, [wx + 1 - 0.375, wy + 0.41, wz + 0.41], [0.375, 0.18, 0.18], tiles, hidden);
  else if (face === 3) pushBox(buf, [wx + 0.41, wy + 0.41, wz], [0.18, 0.18, 0.375], tiles, hidden);
  else pushBox(buf, [wx + 0.41, wy + 0.41, wz + 1 - 0.375], [0.18, 0.18, 0.375], tiles, hidden);
}

/**
* Door: BOTH halves emit the identical panel inside their own cell (side-aware,
     * post-revision 2026-08-18): closed = a 0.2-thin full-height panel hugging the
     * side edge from its meta side bit (side 0 -> min edge, side 1 -> max edge of
     * the thin axis); open = the SAME 1 x 0.2 panel swung 90 degrees about the
     * hinge corner (min-corner; a side-1 swing would overhang, so it is clamped
     * in-cell) — congruent to the closed panel, never squished.
 */
function emitDoor(
  buf: Buf,
  gb: (x: number, y: number, z: number) => number,
  wx: number, wy: number, wz: number,
  meta: number,
): void {
  const hidden = (f: number): boolean => {
    const d = FACES[f].dir;
    const n = gb(wx + d[0], wy + d[1], wz + d[2]);
    return isOpaque(n) || BLOCKS[n].kind !== 'cube';
  };
  const xThin = doorAxis(meta) === 0;
  const tiles = [TILE_DOOR, TILE_DOOR, TILE_DOOR, TILE_DOOR, TILE_DOOR, TILE_DOOR];
// REVISION (3224a9a): side-aware edges; open = congruent full-size swing (never clamped 0.55).
    const side = doorSide(meta);
    if (doorOpen(meta)) {
      pushBox(buf, [wx, wy, wz], xThin ? [1, 1, 0.2] : [0.2, 1, 1], tiles, hidden);
    } else if (xThin) {
      pushBox(buf, side ? [wx + 0.8, wy, wz] : [wx, wy, wz], [0.2, 1, 1], tiles, hidden);
    } else {
      pushBox(buf, side ? [wx, wy, wz + 0.8] : [wx, wy, wz], [1, 1, 0.2], tiles, hidden);
    }
}
```

Edit C — the per-cell loop in `meshChunk`; replace the loop head (from `const b = chunk.blocks[...]` through `const sOp = isOpaque(b); const wx = ...; for (let f = 0; f < 6; f++) {`):

Old:
```ts
        const b = chunk.blocks[localIndex(lx, ly, lz)];
        if (b === Block.Air) continue; // air contributes to neither pass
        const sOp = isOpaque(b);
        const wx = bx + lx, wy = by + ly, wz = bz + lz;
        for (let f = 0; f < 6; f++) {
```
New:
```ts
        const b = chunk.blocks[localIndex(lx, ly, lz)];
        if (b === Block.Air) continue; // air contributes to neither pass
        const kind = BLOCKS[b as Block].kind;
        const wx = bx + lx, wy = by + ly, wz = bz + lz;
        if (kind !== 'cube') {
          // Special blocks are partial geometry, always in the opaque pass (never trans).
          if (kind === 'torch') emitTorch(opaque, gb, wx, wy, wz, chunk.meta[localIndex(lx, ly, lz)]);
          else emitDoor(opaque, gb, wx, wy, wz, chunk.meta[localIndex(lx, ly, lz)]);
          continue;
        }
        const sOp = isOpaque(b);
        for (let f = 0; f < 6; f++) {
```

The rest of the cube face loop (from `const face = FACES[f];` to the end of the `ly` loop) is unchanged.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/chunk-mesher.test.ts`
Expected: PASS — all pre-existing tests (winding, full chunk, seam culling, water, AO, UVs) AND the new special-block tests.

- [ ] **Step 5: Run the rest of the suite plus the typecheck**

Run: `npm test && npm run build`
Expected: PASS / clean build.

- [ ] **Step 6: Commit**

```bash
git add src/chunk-mesher.ts src/__tests__/chunk-mesher.test.ts
git commit -m "feat: mesher emits partial geometry for torch posts/stubs and door panels (open/closed, both axes)"
```

---

### Task 5: Pin the water sim with the new block ids

The sim's `edit()` (`src/water.ts`) already routes any non-water block through the "dry the cell" branch; this task pins that torch/door ids flow through it. **No `src/water.ts` change is expected.**

**Files:**
- Test: `src/__tests__/water.test.ts`

- [ ] **Step 1: Write the test**

Edit the import line in `src/__tests__/water.test.ts`:

Old:
```ts
import { Block } from '../blocks';
```
New:
```ts
import { Block, torchMeta, doorMeta } from '../blocks';
```

Then append inside the existing `describe('water sim', ...)` (after the test that starts `w.setBlock(4, 4, 4, Block.Water); sim.edit(4, 4, 4, Block.Water);` and places `Block.Stone` into it — the "solid replaces water" case):

```ts
  it('replacing or breaking special blocks (torch/door) dries the cell like any solid — no sim special case needed', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15); // floor at y=0
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water); sim.edit(8, 1, 8, Block.Water);
    w.setBlock(9, 1, 8, Block.Water); sim.edit(9, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);
    expect(sim.cellState(8, 1, 8).b).toBe(Block.Water);
    // a torch takes the cell: its water state is gone, nothing regrows it
    w.setBlock(8, 1, 8, Block.Torch, torchMeta(0));
    sim.edit(8, 1, 8, Block.Torch);
    drain(sim);
    expect(sim.cellState(8, 1, 8)).toEqual({ b: Block.Torch, l: 0, s: 0, p: 0, st: 0 });
    // a closed door takes the neighbouring cell the same way
    w.setBlock(9, 1, 8, Block.DoorBottom, doorMeta(false, 0));
    sim.edit(9, 1, 8, Block.DoorBottom);
    drain(sim);
    expect(sim.cellState(9, 1, 8)).toEqual({ b: Block.DoorBottom, l: 0, s: 0, p: 0, st: 0 });
    assertInvariants(w);
  });
```

- [ ] **Step 2: Run the test — it should PASS already**

Run: `npx vitest run src/__tests__/water.test.ts`
Expected: PASS (this is a pin, not a TDD cycle: `edit()`'s non-water branch at `src/water.ts:651-656` treats `Block.Torch`/`Block.DoorBottom` exactly like `Block.Stone`). If it FAILS, the sim has hidden state keyed on block id that the design doc missed — STOP and re-check the design doc before touching `src/water.ts`.

- [ ] **Step 3: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/water.test.ts
git commit -m "test: pin water sim's dry path for the new torch/door block ids"
```

---

### Task 6: main.ts visuals — atlas tiles, scrollable palette, names, help row

`src/main.ts` is not node-testable; this task verifies via `npm run build` (tsc catches type errors in the palette code).

**Files:**
- Modify: `src/main.ts` (atlas section, UI section, imports)
- Modify: `index.html` (`#palette` emptied; help grid)
- Modify: `src/ui.css` (palette strip styles)

- [ ] **Step 1: Empty `#palette` in `index.html` and add the door help row**

Edit A — remove the nine static palette slots (`#palette` becomes an empty container; `main.ts` generates the rows):

Old:
```html
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
New:
```html
  <!-- rows are generated in main.ts: one .slot row per PLACEABLE entry (icon + name) -->
  <div id="palette" class="hidden"></div>
```

Edit B — the help grid's last row (the two empty cells become the door row):

Old:
```html
        <span class="key">ESC</span><span>release mouse</span><span></span><span></span>
```
New:
```html
        <span class="key">ESC</span><span>release mouse</span><span class="key">RMB</span><span>on a door: open / close</span>
```

- [ ] **Step 2: Add the three atlas tile painters in `src/main.ts`**

Edit A — the atlas comment:

Old:
```ts
// 256x256 canvas atlas: 11 tiles, all in the top row (cols 0..10, row 0).
```
New:
```ts
// 256x256 canvas atlas: 14 tiles, all in the top row (cols 0..13, row 0).
```

Edit B — extend the `TILES` array: insert these three painters after the `planks` painter (the entry beginning `(g, r) => { // 10 planks ...`), before the closing `];`:

```ts
  (g, r) => {                                 // 11 torchStem (whole-tile wood: the post stretches the tile in-world, so every pixel must read as wood)
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const base: readonly [number, number, number] = x < 2 || x > 13 ? [74, 50, 28] : [112, 78, 44];
        const d = (r() - 0.5) * 14;
        px(g, x, y, [base[0] + d, base[1] + d, base[2] + d]);
      }
  },
  (g) => {                                     // 12 torchFlame
    g.fillStyle = 'rgb(255,150,40)';
    g.fillRect(3, 4, 10, 10);
    g.fillStyle = 'rgb(255,214,80)';
    g.fillRect(5, 6, 6, 7);
    g.fillStyle = 'rgb(255,246,205)';
    g.fillRect(7, 8, 2, 4);
  },
  (g, r) => {                                  // 13 door (plank panel, darker frame, latch)
    speck(g, [150, 108, 62], 10, r);
    g.fillStyle = 'rgba(70,48,28,.9)';
    g.fillRect(0, 0, 16, 2);
    g.fillRect(0, 14, 16, 2);
    g.fillRect(0, 0, 2, 16);
    g.fillRect(14, 0, 2, 16);
    g.fillRect(7, 3, 2, 10);
    g.fillStyle = 'rgb(220,200,120)';
    g.fillRect(11, 8, 2, 2);
  },
```

- [ ] **Step 3: Generate the palette from the registry in `src/main.ts`**

Edit A — the imports line (task 7 uses the rest of these; if the unused-import lint annoys you before task 7, import only `BLOCKS` now and extend in task 7):

Old:
```ts
import { Block, isOpaque, PLACEABLE, iconPosition } from './blocks';
```
New:
```ts
import { Block, BLOCKS, isOpaque, PLACEABLE, iconPosition, torchMeta, doorMeta, doorOpen, doorAxis, isDoor } from './blocks';
```

Edit B — tooltip names inside `placeIcon`:

Old:
```ts
  el.title = String(Block[b]);
```
New:
```ts
  el.title = BLOCKS[b].name; // real names (was: the numeric block id)
```

Edit C — replace the palette/hotbar wiring block (from `const hotbarEl = document.getElementById('hotbar')!;` through the `hotbar.onSlotChange = (i) => { ... };` block) with the generated-palette version:

Old:
```ts
const hotbarEl = document.getElementById('hotbar')!;
const paletteEl = document.getElementById('palette')!;
const hotbarSlotEls = Array.from(hotbarEl.children) as HTMLElement[];
const paletteSlotEls = Array.from(paletteEl.children) as HTMLElement[];

hotbarSlotEls.forEach((el, i) => placeIcon(el, hotbar.slots[i], 40)); // 44px box minus 2px border each side
hotbarEl.classList.remove('hidden');
// Select-key keycap on each slot (1-9); palette slots are clicked, so they stay unnumbered.
hotbarSlotEls.forEach((el, i) => {
  const num = document.createElement('span');
  num.className = 'num';
  num.textContent = String(i + 1);
  el.append(num);
});
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
```
New:
```ts
const hotbarEl = document.getElementById('hotbar')!;
const paletteEl = document.getElementById('palette')!;
const hotbarSlotEls = Array.from(hotbarEl.children) as HTMLElement[];

// The palette is a generated scrolling list: one .slot row per PLACEABLE entry
// (icon + name), so it grows with the registry. index.html holds no static rows.
const paletteSlotEls: HTMLElement[] = PALETTE_BLOCKS.map((b) => {
  const el = document.createElement('div');
  el.className = 'slot';
  const icon = document.createElement('div');
  icon.className = 'icon';
  placeIcon(icon, b, 40); // the icon div is 40px square (no border of its own)
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = BLOCKS[b].name;
  el.append(icon, name);
  el.addEventListener('click', () => hotbar.setSlot(hotbar.selected, b)); // the arrow reads the *current* selection
  paletteEl.append(el);
  return el;
});
// Rows holding the selected slot's block highlight (several rows can match one block).
const refreshPaletteSel = (b: number): void => {
  paletteSlotEls.forEach((el, j) => el.classList.toggle('sel', PALETTE_BLOCKS[j] === b));
};

hotbarSlotEls.forEach((el, i) => placeIcon(el, hotbar.slots[i], 40)); // 44px box minus 2px border each side
hotbarEl.classList.remove('hidden');
// Select-key keycap on each slot (1-9); palette rows are clicked, so they stay unnumbered.
hotbarSlotEls.forEach((el, i) => {
  const num = document.createElement('span');
  num.className = 'num';
  num.textContent = String(i + 1);
  el.append(num);
});

hotbar.onSelectChange = (i) => {
  hotbarSlotEls.forEach((el, j) => el.classList.toggle('sel', j === i));
  refreshPaletteSel(hotbar.block);
};
hotbar.onSlotChange = (i) => {
  placeIcon(hotbarSlotEls[i], hotbar.slots[i], 40); // the palette wrote into a slot
  refreshPaletteSel(hotbar.block);
};
```

The remaining UI code (palette/help open-close, `lockPointer`, the initial `hotbar.select(PALETTE_BLOCKS.indexOf(Block.Planks))`, the wheel handler) is unchanged — the callbacks above are wired before that initial `select`, so the selection highlight lands on both the hotbar slot and the matching palette row.

- [ ] **Step 4: Restyle `#palette` as a scrolling strip in `src/ui.css`**

Edit A — the section comment + `#palette` block:

Old:
```css
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
```
New:
```css
/* hotbar: bottom-center, display-only (T11 fills it); palette: right strip, scrolling rows (icon + name), click targets */
#hotbar {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 4px;
  padding: 6px; background: rgba(10, 14, 22, .55); border-radius: 8px;
  pointer-events: none;
}
#palette {
  position: fixed; top: 12px; right: 12px;
  display: flex; flex-direction: column; gap: 4px;
  width: 188px; max-height: 88vh; overflow-y: auto;
  padding: 8px;
  background: rgba(10, 14, 22, .55); border-radius: 8px;
}
```

Edit B — the palette slot/row layout (replacing the 48px square rule; the shared border/`.sel` rules above it stay):

Old:
```css
#palette .slot { width: 48px; height: 48px; cursor: pointer; }
```
New:
```css
#palette .slot {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 6px; cursor: pointer;
}
#palette .slot .icon { width: 40px; height: 40px; flex: none; }
#palette .slot .name {
  flex: 1; overflow: hidden; text-overflow: ellipsis;
  color: #e8eef7; font: 13px/1.4 system-ui, sans-serif;
  text-shadow: 0 1px 2px #000; white-space: nowrap;
}
```

Edit C — scrollbar styling within the panel (the design spec's file table requires it; the strip actually scrolls, so match the dark translucent panels):

```css
#palette { scrollbar-width: thin; scrollbar-color: rgba(150, 170, 200, .45) transparent; }
#palette::-webkit-scrollbar { width: 8px; }
#palette::-webkit-scrollbar-thumb { background: rgba(150, 170, 200, .4); border-radius: 4px; }
#palette::-webkit-scrollbar-track { background: transparent; }
```

- [ ] **Step 5: Typecheck + build**

Run: `npm run build && npm test`
Expected: clean build (tsc validates the new palette code) and tests still green.

- [ ] **Step 6: Commit**

```bash
git add src/main.ts index.html src/ui.css
git commit -m "feat: 14-tile atlas (torchStem/torchFlame/door), palette becomes a scrolling icon+name list of all placeables"
```

---

### Task 7: main.ts interactions — torch/door placement, door toggle, pair-break, isSolid wiring

Verified via `npm run build` + the manual checklist in Task 9 (main.ts is not node-testable).

**Files:**
- Modify: `src/main.ts` (actions section, player construction)

- [ ] **Step 1: Add the torch/door helpers after `castFromCamera`**

Insert after the `castFromCamera` function (i.e. before the `remeshAround` function):

```ts
// Placement-support normal -> torch meta face: +Y = 0 (floor post), +X = 1, -X = 2,
// +Z = 3, -Z = 4. A -Y normal (ceiling) is rejected by the caller.
function torchFaceFromNormal(nx: number, ny: number, nz: number): number {
  if (ny > 0) return 0;
  if (nx > 0) return 1;
  if (nx < 0) return 2;
  if (nz > 0) return 3;
  return 4; // -Z
}

/** The other half of the door at (x, y, z), or null (an orphaned half). */
function doorPartner(x: number, y: number, z: number): [number, number, number] | null {
  const b = world.getBlock(x, y, z);
  if (b === Block.DoorBottom && world.getBlock(x, y + 1, z) === Block.DoorTop) return [x, y + 1, z];
  if (b === Block.DoorTop && world.getBlock(x, y - 1, z) === Block.DoorBottom) return [x, y - 1, z];
  return null;
}

/** Right-click on a door: flip open/closed on BOTH halves, keeping axis AND side (instant snap). */
function toggleDoorPair(x: number, y: number, z: number): void {
  const b = world.getBlock(x, y, z);
  const meta = doorMeta(!doorOpen(world.getMeta(x, y, z)), doorAxis(world.getMeta(x, y, z)), doorSide(world.getMeta(x, y, z)));
  world.setBlock(x, y, z, b, meta);
  remeshAround(x, y, z);
  const p = doorPartner(x, y, z);
  if (p) {
    // the partner's block id is unchanged by the toggle; its meta is forced to match
    world.setBlock(p[0], p[1], p[2], world.getBlock(p[0], p[1], p[2]), meta);
    remeshAround(p[0], p[1], p[2]);
  }
}

/** Remove ONLY the partner half of the door at (x, y, z); the caller handles that cell itself. */
function clearDoorPartner(x: number, y: number, z: number): void {
  const p = doorPartner(x, y, z);
  if (!p) return;
  world.setBlock(p[0], p[1], p[2], Block.Air);
  remeshAround(p[0], p[1], p[2]);
  sim.edit(p[0], p[1], p[2], Block.Air);
}
```

- [ ] **Step 2: Replace the `onMouseDown` body with the interaction matrix**

Replace the whole `function onMouseDown(e: MouseEvent): void { ... }` (both branches) with:

```ts
function onMouseDown(e: MouseEvent): void {
  if (e.button === 0) {
    const hit = castFromCamera(true); // break targeting: placed springs are targetable
    if (!hit) return;
    // `hit` is a breakable solid, a torch, a door half (breaks as a PAIR — the partner
    // is cleared first, while the aimed cell still identifies it), or a placed spring
    // (the only targetable water — see castFromCamera).
    const hb = world.getBlock(hit.x, hit.y, hit.z);
    if (isDoor(hb)) clearDoorPartner(hit.x, hit.y, hit.z);
    world.setBlock(hit.x, hit.y, hit.z, Block.Air);
    remeshAround(hit.x, hit.y, hit.z);
    sim.edit(hit.x, hit.y, hit.z, Block.Air); // clears the cell's water state + re-marks dependents
  } else if (e.button === 2) {
    const hit = castFromCamera(false); // place targeting: water stays pass-through
    if (!hit) return;
    const hb = world.getBlock(hit.x, hit.y, hit.z);
    const tx = hit.x + hit.nx;
    const ty = hit.y + hit.ny;
    const tz = hit.z + hit.nz;
    if (ty < WORLD_Y_MIN || ty >= WORLD_Y_MAX) return;
    const target = world.getBlock(tx, ty, tz);
    const held = hotbar.block;

    // 1) A door under the crosshair TOGGLES — always wins over placement.
    if (isDoor(hb)) {
      toggleDoorPair(hit.x, hit.y, hit.z);
      return;
    }

    // 2) Torch: AIR target + a solid opaque face behind it. No water, no ceilings,
    //    no door faces (doors are not opaque -> invalid support), no mid-air.
    if (held === Block.Torch) {
      if (target !== Block.Air) return;
      if (hit.ny < 0) return;
      if (!isOpaque(hb)) return;
      if (!player.noclip && player.intersectsVoxel(tx, ty, tz)) return;
      world.setBlock(tx, ty, tz, Block.Torch, torchMeta(torchFaceFromNormal(hit.nx, hit.ny, hit.nz)));
      remeshAround(tx, ty, tz);
      sim.edit(tx, ty, tz, Block.Torch);
      return;
    }

    // 3) Door: both cells clearable (Air or Water — water dries on placement), within
    //    height, not overlapping the player in either cell.
    if (held === Block.DoorBottom) {
      if (ty + 1 >= WORLD_Y_MAX) return;
      const above = world.getBlock(tx, ty + 1, tz);
      if (target !== Block.Air && target !== Block.Water) return;
      if (above !== Block.Air && above !== Block.Water) return;
      if (!player.noclip && (player.intersectsVoxel(tx, ty, tz) || player.intersectsVoxel(tx, ty + 1, tz))) return;
      // +/-X face or a floor face -> the panel is thin in X; +/-Z face -> thin in Z
      // (revision 3224a9a): side = which edge of the target cell the support sits on,
      // from the aim normal (-X or -Z aim -> far edge -> side 1)
      const thinInZ = hit.nz !== 0;
      const side = (thinInZ ? hit.nz : hit.nx) < 0 ? 1 : 0;
      const meta = doorMeta(false, thinInZ ? 1 : 0, side);
      world.setBlock(tx, ty, tz, Block.DoorBottom, meta);
      world.setBlock(tx, ty + 1, tz, Block.DoorTop, meta);
      remeshAround(tx, ty, tz);
      remeshAround(tx, ty + 1, tz);
      sim.edit(tx, ty, tz, Block.DoorBottom);
      sim.edit(tx, ty + 1, tz, Block.DoorTop);
      return;
    }

    // 4) A plain block may replace Air/Water, a TORCH (meta clears with it), or a DOOR
    //    (the whole pair is removed first). Player-overlap guard before any removal.
    if (target !== Block.Air && target !== Block.Water && target !== Block.Torch && !isDoor(target)) return;
    if (!player.noclip && player.intersectsVoxel(tx, ty, tz)) return;
    if (isDoor(target)) clearDoorPartner(tx, ty, tz);
    world.setBlock(tx, ty, tz, held); // meta = 0 clears any torch state in the cell
    remeshAround(tx, ty, tz);
    sim.edit(tx, ty, tz, held); // Water -> a level-7 source; any other block dries this cell
  }
}
```

- [ ] **Step 3: Wire state-dependent collision into the player**

Edit the player construction (the `const player = new Player(...)` line):

Old:
```ts
const player = new Player((x, y, z) => world.getBlock(x, y, z));
```
New:
```ts
// Second callback: collision reads WORLD STATE (open doors walkable, closed doors solid) —
// the flat per-id rule in BLOCKS cannot see door open/closed meta.
const player = new Player(
  (x, y, z) => world.getBlock(x, y, z),
  (x, y, z) => world.isSolid(x, y, z),
);
```

- [ ] **Step 4: Typecheck + build + full suite**

Run: `npm run build && npm test`
Expected: clean build (confirms `torchMeta`/`doorMeta`/`doorOpen`/`doorAxis`/`isDoor`/`world.isSolid`/`world.getMeta` all typecheck) and tests green.

- [ ] **Step 5: Commit**

```bash
git add src/main.ts
git commit -m "feat: torch/door placement, RMB door toggle, pair-break on LMB, world.isSolid wired into player collision"
```

---

### Task 8: Documentation — TODO.md "Sky & lighting" + PROJECT.md §16

**Files:**
- Modify: `TODO.md`
- Modify: `PROJECT.md`

- [ ] **Step 1: Append the new section to `TODO.md` (end of file)**

```md

## Sky & lighting

Items requested 2026-08-18 (with the torch/door work), deferred by design:

- **Clouds and a sun/moon in the sky with a day/night cycle.** A world-time clock
  driving sky background/fog (the `BG_AIR`/mood swap in `src/main.ts` becomes
  time-of-day driven), a sun/moon that crosses the sky, and instanced cloud
  layers. Torches already exist as placeable blocks, so the night falls on a
  world that can carry lights.
- **Dynamic lighting with light levels** (for torch / sun / moon positions).
  Block-light + skylight propagation into the chunk buffers, with the
  de-propagation pass on block edits (the deferred skylight item from
  PROJECT.md §15 — the hard part). Torch meta (wall-mount face) already stores
  where a light source sits; a torch's light level will be read from there.
  Until this lands, torches are **visual only** — a bright tile, no glow.
```

- [ ] **Step 2: Add PROJECT.md §16 and the §15 pointer**

Edit A — append at the end of `PROJECT.md` (after the Appendix section):

```md
## 16. Special blocks — torch, door (post-POC, 2026-08-18)

`Torch`, `DoorBottom`, `DoorTop` (ids 10–12) ride the ordinary block id; their
per-cell state lives in a parallel `meta` byte per chunk (`src/world.ts`), the same
pattern as the water flag arrays:

- **Torch meta:** `0` = floor post; `1 | (face << 1)` for a wall stub, face
  `1:+X 2:-X 3:+Z 4:-Z` (no ceiling mounts). Placement needs air above the target
  and a solid opaque face behind it; the mesher emits a thin post/stub with a flame
  tile on top (floor) or on the outward tip (wall). Emits no light — that is the
  deferred "dynamic lighting" item.
- **Door meta** (stored in **both** halves): bit 0 = open, bit 1 = axis (panel thin
  in X or Z, chosen by the aimed face). Placement writes the pair (bottom at the
  target cell, top above) into two Air/Water cells; **RMB on either half toggles the
  whole pair** (instant snap, no swing animation); breaking either half removes both.
  Closed = solid in both halves and rendered as a full-height thin panel; open = a
  slab swung to the cell corner, walkable.
- `world.isSolid()` is the single collision truth (closed door blocks, open door and
  torch walk); the mesher emits their partial geometry in the opaque pass. Torches
  and doors are never opaque, so they never cull neighbor faces.
- The **palette (E)** is a scrolling list of every `PLACEABLE` entry (icon + name),
  generated in `src/main.ts` from the registry, so new blocks appear in it for free.
```

Edit B — the `§15` item about day/night; replace the line
`- Entities, mobs, day/night cycle` with:
```md
- Entities, mobs
- ~~Flood-fill skylight and blocklight propagation~~ and ~~day/night cycle~~ — moved to `TODO.md` → **Sky & lighting** (2026-08-18)
```
i.e. remove `day/night cycle` from the "Entities, mobs" line and leave the skylight line replaced by the `TODO.md` pointer (adjust the list so both deferred-lighting topics point at `TODO.md`).

- [ ] **Step 3: Commit**

```bash
git add TODO.md PROJECT.md
git commit -m "docs: TODO.md gains Sky & lighting (day/night + dynamic lighting); PROJECT.md gains the special-blocks section"
```

---

### Task 9: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: every suite green (blocks, world, player, raycast, mesher, streaming, terrain, water, water-load, ui).

- [ ] **Step 2: Typecheck + production build**

Run: `npm run build`
Expected: `tsc --noEmit` clean + vite build succeeds.

- [ ] **Step 3: Manual pass with `npm run dev`** (drive the listed checks; fix-forward with new commits if anything misbehaves)

- Palette: `E` opens a right-side scrolling list of 11 named rows (grass → water, torch, door); with a short viewport the list scrolls; clicking a row fills the selected hotbar slot and the row(s) for that block highlight in yellow; the `?`/help overlay shows the new "on a door: open / close" row.
- Torch: RMB on a floor places a standing post with a flame top; RMB on a wall face places a stub sticking out from the wall with the flame facing you; RMB on water/ceilings/door faces does nothing; LMB on the torch removes it.
- Door: RMB beside terrain (e.g. against a wall face) places a 2-cell-tall panel; RMB swings it to the side — walkable opening; RMB again closes it and it blocks your movement again (verify with collision, not just sight); LMB on either half removes the whole door. Placing a stone where a torch or door stands replaces it.
- Water interplay: replace a pool cell with a torch or a closed door — the water dries; break the torch again and the surrounding water does not regrow into the solid-backed cell.
- No stutters/geometry leaks: walk the shoreline for a minute, open/close doors while streaming chunks — frame times stay in the normal range.

- [ ] **Step 4: Record the outcome**

Append a short "Execution notes" section under the plan's title (or in `docs/superpowers/plans/2026-08-15-voxel-sandbox-poc-execution-notes.md` style, per repo habit) noting: which commits implemented the plan, any deviations from the plan, and the manual-pass results. Commit it with `docs: execution notes for torches/doors/palette`.

---

## Self-review notes (run while writing this plan)

- **Spec coverage:** every spec section maps to a task — registry/meta (T1), world plumbing (T2), collision (T3), rendering (T4 + the T6 tiles), water pin (T5), UI (T6), interaction matrix (T7), docs/TODO (T8), verification (T9). The spec's "no raycast change" and "sim.edit unchanged" are honored: neither file is touched by any task.
- **Type consistency:** `torchMeta`/`torchFace`/`doorMeta`/`doorOpen`/`doorAxis`/`isDoor` (T1) are the exact names used by T2 (`world.isSolid`), T4 (emitters), T7 (helpers); `world.isSolid` (T2) is the exact callback T7 passes to `Player`; `world.getMeta` (T2) backs the T4 emitters and T7 toggle; `PLACEABLE`/`PALETTE_BLOCKS` (T1/T6) seed the palette rows.
- **Known simplifications carried from the spec:** open-door slab is clamped in-cell (not a literal 90° swing); door pairs split across chunk unloads can orphan a half until the chunk streams back; torches/doors are visual-only until TODO.md "Sky & lighting" lands.