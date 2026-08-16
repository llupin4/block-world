# Water Flow + Drain + Cave Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all water dynamic (generated ocean and player-placed water share one sim): water falls one cell/tick, re-promotes to an immortal source on solid support (a rule typical of voxel engines), spreads to a level-1 front at Manhattan radius 6, drains only when it falls out of the world, and settles on chunk load so freshly loaded chunks show caves already flooded. Separately, fix terrain so underwater caves carve **air** (not a solid water blob) and then flood physically from openings.

**Architecture:** One new pure-TS module `src/water.ts` (`WaterSim`, mirroring how `streaming.ts` is tested in node). Flow state — `wlevel` (`Uint8Array`, 0 dry / 1..7 water, 7 full) and `wsource` (`Uint8Array`, 0/1) — rides in each `Chunk` alongside `blocks` (added in `src/world.ts`), so it streams with the chunk: a missing neighbour chunk reads as dry and is not a spread escape; a falling cell whose destination is out-of-band/missing is destroyed. A global insertion-ordered `Set<string>` queue (key `${wx},${wy},${wz}`) is the dirty-cell set; `tick(budget)` processes at most `budget` cells, `settle(cx,cy,cz)` seeds a chunk's worldgen water as level-7 sources and relaxes to a fixpoint (guarded, idempotent via a per-chunk `settled` flag), and `edit(x,y,z,block)` is the entry point for player edits (placed Water = a level-7 source; any other block clears the cell's water state). `src/main.ts` wires it: construct after boot-world gen, settle each `rebuilt` chunk inside `tickStreaming`, run `sim.tick(200)` every 5th frame (slow water clock per PROJECT.md §9), call `sim.edit(...)` after the two `onMouseDown` `setBlock` sites, and re-mesh any chunk the sim touched. `src/terrain.ts` carves caves to `Block.Air`; the exact water-count pin in `terrain.test.ts` is re-measured and re-pinned. Levels affect dynamics only, never the mesher (all water is still a full transparent block). No changes to `blocks.ts`, `chunk-mesher.ts`, `raycast.ts`, `player.ts`, `ui.ts`, or `streaming.ts`.

**Tech Stack:** TypeScript + Vite + vitest (unchanged). Commands: `npm test` (vitest run), `npm run build` (tsc --noEmit + vite build), `npm run dev` (manual pass). TS is strict. The world band the sim treats as in-band is `WORLD_Y_MIN = -32 .. WORLD_Y_MAX - 1` (y -32..63); terrain is generated for `cy 0..4` only, and the top `cy=4` chunk (y 64..79) sits *above* `WORLD_Y_MAX` — it contains no water (sea surface ≤ 32, everything above air), so the sim's in-band guard never rejects live water; boot-gen still fills that chunk and the spawn scan reads it, which is fine because `World.getBlock` performs no band check, only `WaterSim.cellState` does.

**Spec:** `docs/superpowers/specs/2026-08-16-water-simulation-design.md`

**Measured constants (verified by running the tests this plan adds/edits):**
- A source on a 16×16 stone pad, settled → diamond front at Manhattan radius 6 = **85** water cells; the level-1 ring is the terminus (nothing at distance ≥ 7).
- Fall → land in a 1-wide walled pit with a stone floor → lands as a level-7 **source**, count **1**, origin dries.
- Fall out of the world (floorless) → the whole column drains, count **0**.
- Sealed 3×3 pool → **9** level-7 sources; `tick(1) === 0` (fixpoint, immortal); breaking the centre refills as a promoted source.
- Chunk-seam spread: a source on chunk 0's +X face spreads into loaded chunk 1 at level **6** and back into chunk 0 at level **6**.
- Settle is idempotent: a second `settle` on a settled chunk is a no-op (gradient + count 85 preserved).
- Terrain re-pin after cave→Air: exact water count in the `-2..2` region drops **45395 → 24936** (each carved underwater-cave cell leaves `blocks` as Air, not Water).
- Cave-carve assertion sample (`water.test.ts`, region `0..3`): **1284** carved cells are present and Air.

These values are asserted in the tests below; if a run disagrees, do **not** hand-adjust the assertion without reproducing the failure in a scratch test first — the constants are load-bearing.

---

### Task 1: `src/world.ts` — per-chunk water state + `settled` flag

**Files:**
- Modify: `src/world.ts`

The sim's state must stream with the chunk, so it lives on `Chunk` next to `blocks`. Three additions: `wlevel`, `wsource`, and `settled` (the flag that makes on-load settle idempotent). No existing field moves; `blocks`/`dirty`/mesh slots are untouched, so the existing `world.test.ts` (6 tests) still passes.

- [ ] **Step 1: Extend the `Chunk` interface**

In `src/world.ts`, the `Chunk` interface (lines 15–23) is:

```ts
export interface Chunk {
  cx: number;
  cy: number;
  cz: number;
  blocks: Uint8Array; // D9: 10 block values fit in a byte
  dirty: boolean;
  opaqueMesh: VoxelBuffer | null;
  transMesh: VoxelBuffer | null;
}
```

Replace it with:

```ts
export interface Chunk {
  cx: number;
  cy: number;
  cz: number;
  blocks: Uint8Array; // D9: 10 block values fit in a byte
  wlevel: Uint8Array;  // water flow level per cell: 0 dry, 1..7 water (7 = full source)
  wsource: Uint8Array; // 0/1 per cell: this cell is a (re)promoted/placed source
  dirty: boolean;
  settled: boolean;    // water sim has settled this chunk's worldgen water (makes settle idempotent)
  opaqueMesh: VoxelBuffer | null;
  transMesh: VoxelBuffer | null;
}
```

- [ ] **Step 2: Initialize the new fields in `ensureChunk`**

In `ensureChunk` (lines 52–65), the new-chunk literal is:

```ts
    const n: Chunk = {
      cx, cy, cz,
      blocks: new Uint8Array(CHUNK_VOL),
      dirty: true,
      opaqueMesh: null,
      transMesh: null,
    };
```

Replace it with:

```ts
    const n: Chunk = {
      cx, cy, cz,
      blocks: new Uint8Array(CHUNK_VOL),
      wlevel: new Uint8Array(CHUNK_VOL),
      wsource: new Uint8Array(CHUNK_VOL),
      dirty: true,
      settled: false,
      opaqueMesh: null,
      transMesh: null,
    };
```

- [ ] **Step 3: Typecheck + full suite (regression guard)**

Run: `npm run build && npm test`
Expected: `tsc --noEmit` clean, vite build succeeds; all 8 test files / 49 tests pass. The two new arrays are zero-filled and `settled` is `false`, so nothing that reads them exists yet — this is a pure, inert data-model addition.

- [ ] **Step 4: Commit**

```bash
git add src/world.ts
git commit -m "feat: per-chunk water state (wlevel/wsource) + settled flag for the flow sim"
```

---

### Task 2: `src/terrain.ts` — caves carve air; re-pin the exact water count

**Files:**
- Modify: `src/terrain.ts`
- Modify: `src/__tests__/terrain.test.ts`
- Modify: `docs/superpowers/2026-08-15-voxel-sandbox-poc-execution-notes.md`

Underwater caves currently carve to `Block.Water`, producing a solid submerged blob. Change the carve to `Block.Air` — cave flooding then comes entirely from the water sim (Task 3), which floods a cave wherever water can physically reach and leaves sealed caves dry. Because every carved underwater-cave cell now leaves `blocks` as Air instead of Water, the exact water-count pin in `terrain.test.ts` goes stale and must be re-measured and re-pinned (measured value: **24936**, down from 45395). The only other terrain test that could be affected is the exact-count test; the surface-column test constrains only `wy > SEA_LEVEL` rows, which never carve, so it is unchanged.

- [ ] **Step 1: Carve air, not water**

In `src/terrain.ts`, `generateChunkTerrain` (lines 76–79):

```ts
        // caves carve stone/dirt below sea level (underwater caves fill with water)
        if ((c.blocks[i] === Block.Stone || c.blocks[i] === Block.Dirt) && wy <= SEA_LEVEL && gen.caveAt(wx, wy, wz) > 0.55) {
          c.blocks[i] = Block.Water;
        }
```

Replace with:

```ts
        // caves carve stone/dirt below sea level to AIR; the water sim (src/water.ts) floods
        // them from any sea-facing opening and leaves sealed caves dry.
        if ((c.blocks[i] === Block.Stone || c.blocks[i] === Block.Dirt) && wy <= SEA_LEVEL && gen.caveAt(wx, wy, wz) > 0.55) {
          c.blocks[i] = Block.Air;
        }
```

Also update the file's pinned-PRNG comment (lines 14–16), which cites the old constant, so it no longer contradicts the re-pin. It currently reads:

```ts
    // Pinned variant: t ^ (a >>> 7) instead of canonical mulberry32's t >>> 7 — matches the plan's
    // measured constants (45395 water cells, heights 19..43, 21 trees at seed 1234); the canonical
    // form gives 45258 water cells. See docs/superpowers/2026-08-15-voxel-sandbox-poc-execution-notes.md
    t = (t + Math.imul(t ^ (a >>> 7), 61 | t)) ^ t;
```

Change only the `45395 water cells` reference in that comment to `24936 water cells (post cave→Air; was 45395)`:

```ts
    // Pinned variant: t ^ (a >>> 7) instead of canonical mulberry32's t >>> 7 — matches the plan's
    // measured constants (24936 water cells post cave→Air, was 45395; heights 19..43, 21 trees at
    // seed 1234); the canonical form gives 45258. See docs/superpowers/2026-08-15-voxel-sandbox-poc-execution-notes.md
    t = (t + Math.imul(t ^ (a >>> 7), 61 | t)) ^ t;
```

- [ ] **Step 2: Re-pin the exact water count in the test**

In `src/__tests__/terrain.test.ts` (lines 41–46), the pin is:

```ts
  it('every generated world of this seed contains water above the seafloor', () => {
    const { world } = genRegion(-2, 2, -2, 2);
    let water = 0;
    for (const c of world.allChunks()) for (let i = 0; i < c.blocks.length; i++) if (c.blocks[i] === Block.Water) water++;
    expect(water).toBe(45395); // exact, measured against simplex-noise@4.0.3 (seed pinned above)
  });
```

Replace the assertion line (and its comment) with the re-measured value:

```ts
    let water = 0;
    for (const c of world.allChunks()) for (let i = 0; i < c.blocks.length; i++) if (c.blocks[i] === Block.Water) water++;
    expect(water).toBe(24936); // exact, post cave→Air (was 45395); carved underwater-cave cells are now Air, not Water
```

- [ ] **Step 3: Run the terrain suite and confirm the pin matches (do not eyeball it)**

Run: `npx vitest run src/__tests__/terrain.test.ts`
Expected: all 6 terrain tests pass. The exact-count test passes at **24936**. If it instead fails with a different number, your scratch `world.ts`/`terrain.ts` differ from the plan (extra carved cells, or a different PRNG line) — reconcile before continuing. The other five terrain tests were already green on the clean tree and are unaffected by the carve change.

- [ ] **Step 4: Note the re-pin in the POC execution-notes doc**

In `docs/superpowers/2026-08-15-voxel-sandbox-poc-execution-notes.md`, the D2 row cites the old constant. Find the table cell containing `the plan's measured constants (45395 water cells, heights 19..43, 21 trees, seed 1234) are reproduced **only** by the variant; canonical gives 45258.` and append a post-note to it:

```
 …canonical gives 45258. (2026-08-16: the cave carve now produces Air, so the seeded water count re-pins to **24936** in `terrain.test.ts`; the PRNG variant and all other constants are unchanged.)
```

- [ ] **Step 5: Typecheck + full suite + commit**

Run: `npm run build && npm test`
Expected: `tsc` clean, build succeeds, all suites green (terrain now pinned at 24936; every other suite unchanged).

```bash
git add src/terrain.ts src/__tests__/terrain.test.ts docs/superpowers/2026-08-15-voxel-sandbox-poc-execution-notes.md
git commit -m "fix: carve underwater caves to air (not a water blob); re-pin terrain water count 45395->24936"
```

---

### Task 3: `src/water.ts` + `src/__tests__/water.test.ts` — the sim, TDD

**Files:**
- Create: `src/__tests__/water.test.ts`
- Create: `src/water.ts`

Write the test first (it fails because `../water` doesn't exist), then the implementation until it is green. The test drives `World` + `WaterSim` in node, exactly like `streaming.test.ts`. Invariants asserted throughout: `block == Water  ⇔  wlevel >= 1 || wsource == 1`. The final test in the file re-checks the terrain cave→Air carve (Task 2) as an integration assertion that the sim's flooding input is air.

- [ ] **Step 1: Write the test file (fails — `water.ts` not present yet)**

Create `src/__tests__/water.test.ts` with exactly this content:

```ts
import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, chunkOf } from '../world';
import { WaterSim } from '../water';
import { TerrainGen, generateRegion, SEA_LEVEL, TERRAIN_SEED } from '../terrain';

function makeWorld(chunks: [number, number, number][]): World {
  const w = new World();
  for (const [cx, cy, cz] of chunks) w.ensureChunk(cx, cy, cz);
  return w;
}

function slab(w: World, b: number, x0: number, x1: number, y: number, z0: number, z1: number): void {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) w.setBlock(x, y, z, b);
}

function countWater(w: World): number {
  let n = 0;
  for (const c of w.allChunks()) for (let i = 0; i < c.blocks.length; i++) if (c.blocks[i] === Block.Water) n++;
  return n;
}

// Run the queue to a fixpoint (or until `max` ticks) — the node-side stand-in for the
// runtime slow clock.
function drain(sim: WaterSim, max = 300): void {
  let n = 0;
  while (n++ < max && sim.tick(200) !== 0) {
    /* drain */
  }
}

// Strict invariant from the spec: block == Water  <=>  wlevel >= 1 || wsource == 1.
function assertInvariants(w: World): void {
  for (const c of w.allChunks())
    for (let i = 0; i < c.blocks.length; i++) {
      const wet = c.blocks[i] === Block.Water;
      const st = c.wlevel[i] >= 1 || c.wsource[i] === 1;
      expect(wet === st, `invariant @ chunk(${c.cx},${c.cy},${c.cz}) i=${i}: b=${c.blocks[i]} l=${c.wlevel[i]} s=${c.wsource[i]}`).toBe(true);
    }
}

describe('water sim', () => {
  it('a lone source over a stone pad settles to a level-graded diamond, every cell re-promoted to a source; radius 6 is the front', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15); // floor at y=0
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water);
    sim.edit(8, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);

    console.log('A count=', countWater(w));
    const cs = (x: number, y: number, z: number) => sim.cellState(x, y, z);
    expect(cs(8, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 1 });
    expect(cs(9, 1, 8).l).toBe(6); expect(cs(7, 1, 8).l).toBe(6);
    expect(cs(8, 1, 9).l).toBe(6); expect(cs(8, 1, 7).l).toBe(6);
    expect(cs(9, 1, 9).l).toBe(5); // dist 2
    expect(cs(14, 1, 8).l).toBe(1); expect(cs(2, 1, 8).l).toBe(1); expect(cs(8, 1, 2).l).toBe(1); // dist 6 front
    expect(cs(14, 1, 8).s).toBe(1); // front is a promoted source (rests on stone)
    expect(cs(15, 1, 8).b).toBe(Block.Air); // dist 7 is beyond reach
    expect(cs(8, 1, 15).b).toBe(Block.Air);
    expect(cs(9, 1, 9).s).toBe(1);
    expect(countWater(w)).toBe(85); // |dx|+|dz| <= 6, all in-bounds
    assertInvariants(w);
  });

  it('water falls one cell per tick and lands on solid, re-promoting to a source', () => {
    const w = makeWorld([[0, 0, 0]]); // chunks span y=0..15
    w.setBlock(8, 0, 8, Block.Stone); // floor of a 1-wide pit
    // solid walls at the landing level so the landed cell cannot spread to a floorless edge
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) w.setBlock(8 + dx, 1, 8 + dz, Block.Stone);
    const sim = new WaterSim(w);
    w.setBlock(8, 8, 8, Block.Water);
    sim.edit(8, 8, 8, Block.Water);
    drain(sim);
    expect(sim.cellState(8, 8, 8).b).toBe(Block.Air); // origin dried as it fell
    expect(sim.cellState(8, 1, 8)).toEqual({ b: Block.Water, l: 7, s: 1 }); // landed on the floor, promoted
    expect(countWater(w)).toBe(1);
    assertInvariants(w);
  });

  it('a stream that falls out of the world is destroyed (drain)', () => {
    const w = makeWorld([[0, 0, 0]]); // chunks span y=0..15; nothing below
    const sim = new WaterSim(w);
    w.setBlock(8, 8, 8, Block.Water);
    sim.edit(8, 8, 8, Block.Water);
    drain(sim);
    expect(countWater(w)).toBe(0);
    expect(sim.cellState(8, 0, 8).b).toBe(Block.Air);
    expect(sim.cellState(8, 8, 8).b).toBe(Block.Air);
    assertInvariants(w);
  });

  it('a sealed 3x3 pool is a fixpoint of tick (immortal); breaking the centre refills it from the source ring', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 4, 10, 0, 4, 10); // floor
    slab(w, Block.Stone, 4, 10, 1, 4, 10); // wall/ceiling level
    slab(w, Block.Stone, 4, 10, 2, 4, 10); // ceiling
    for (let x = 6; x <= 8; x++) for (let z = 6; z <= 8; z++) { w.setBlock(x, 1, z, Block.Water); } // sealed pocket
    const sim = new WaterSim(w);
    for (let x = 6; x <= 8; x++) for (let z = 6; z <= 8; z++) sim.edit(x, 1, z, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);

    for (let x = 6; x <= 8; x++) for (let z = 6; z <= 8; z++)
      expect(sim.cellState(x, 1, z)).toEqual({ b: Block.Water, l: 7, s: 1 });
    expect(sim.tick(1)).toBe(0); // fixpoint: settled pool never cascades
    expect(countWater(w)).toBe(9);

    // break the centre and let the source ring refill it
    w.setBlock(7, 1, 7, Block.Air);
    sim.edit(7, 1, 7, Block.Air);
    drain(sim);
    expect(sim.cellState(7, 1, 7).b).toBe(Block.Water);
    expect(sim.cellState(7, 1, 7).s).toBe(1); // refilled + promoted
    expect(countWater(w)).toBe(9);
    expect(sim.tick(1)).toBe(0);
    assertInvariants(w);
  });

  it('water spreads across a chunk seam into a loaded neighbour, with the level carried', () => {
    const w = makeWorld([[0, 0, 0], [1, 0, 0]]); // chunks span x=0..15 and x=16..31
    slab(w, Block.Stone, 0, 31, 0, 0, 15);
    const sim = new WaterSim(w);
    w.setBlock(15, 1, 8, Block.Water); // on chunk 0's +X face
    sim.edit(15, 1, 8, Block.Water);
    sim.settle(0, 0, 0); // settle the source chunk; relax spills water across the seam into chunk 1
    drain(sim);
    expect(chunkOf(16)).toBe(1);
    expect(sim.cellState(16, 1, 8).b).toBe(Block.Water); // spread into the loaded neighbour
    expect(sim.cellState(16, 1, 8).l).toBe(6);
    expect(sim.cellState(14, 1, 8).l).toBe(6); // and back into chunk 0
    assertInvariants(w);
  });

  it('with the neighbour chunk missing, spread stops at the face and a fall is destroyed, without crashing', () => {
    const w = makeWorld([[0, 0, 0]]); // x=16..31 is ungenerated
    slab(w, Block.Stone, 0, 15, 0, 0, 15);
    const sim = new WaterSim(w);
    w.setBlock(15, 1, 8, Block.Water);
    sim.edit(15, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    drain(sim);
    expect(sim.cellState(16, 1, 8).b).toBe(Block.Air); // no spread into ungenerated space
    expect(sim.cellState(15, 1, 8).b).toBe(Block.Water);
    assertInvariants(w);
  });

  it('placing Water via edit makes a source; placing a solid into water clears that cell; invariants hold', () => {
    const w = makeWorld([[0, 0, 0]]);
    const sim = new WaterSim(w);
    w.setBlock(4, 4, 4, Block.Water);
    sim.edit(4, 4, 4, Block.Water);
    expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Water, l: 7, s: 1 });
    w.setBlock(4, 4, 4, Block.Stone);
    sim.edit(4, 4, 4, Block.Stone);
    expect(sim.cellState(4, 4, 4)).toEqual({ b: Block.Stone, l: 0, s: 0 });
    expect(sim.cellState(4, 3, 4).b).toBe(Block.Air); // a lone placed cell on air falls away
    assertInvariants(w);
  });

  it('settle is idempotent: a second settle on a loaded chunk is a no-op (guarded by c.settled)', () => {
    const w = makeWorld([[0, 0, 0]]);
    slab(w, Block.Stone, 0, 15, 0, 0, 15);
    const sim = new WaterSim(w);
    w.setBlock(8, 1, 8, Block.Water);
    sim.edit(8, 1, 8, Block.Water);
    sim.settle(0, 0, 0);
    const snap = () => {
      const a = w.getChunk(0, 0, 0)!;
      return { l: Array.from(a.wlevel), s: Array.from(a.wsource) };
    };
    const before = snap();
    sim.settle(0, 0, 0); // already settled → early return, leaves the gradient untouched
    drain(sim);
    const after = snap();
    expect(after.l.join()).toBe(before.l.join());
    expect(after.s.join()).toBe(before.s.join());
    expect(countWater(w)).toBe(85);
    expect(w.getChunk(0, 0, 0)!.settled).toBe(true);
    assertInvariants(w);
  });

  it('terrain caves carve Air (not Water): every carved stone/dirt cell below sea level is Air after generation', () => {
    const gen = new TerrainGen(TERRAIN_SEED);
    const w = new World();
    generateRegion(w, gen, 0, 3, 0, 3); // 4x4 chunk columns
    let carved = 0;
    for (const c of w.allChunks()) {
      const bx = c.cx * 16, bz = c.cz * 16;
      for (let lx = 0; lx < 16; lx++)
        for (let lz = 0; lz < 16; lz++)
          for (let ly = 0; ly < 16; ly++) {
            const wx = bx + lx, wy = c.cy * 16 + ly, wz = bz + lz;
            const h = gen.heightAt(wx, wz);
            let base: number;
            if (wy > h) base = wy <= SEA_LEVEL ? Block.Water : Block.Air;
            else if (wy < h - 4) base = Block.Stone;
            else if (wy < h) base = Block.Dirt;
            else base = h < SEA_LEVEL + 1 ? Block.Sand : Block.Grass;
            if ((base === Block.Stone || base === Block.Dirt) && wy <= SEA_LEVEL && gen.caveAt(wx, wy, wz) > 0.55) {
              carved++;
              expect(w.getBlock(wx, wy, wz), `carved cell (${wx},${wy},${wz}) must be Air`).toBe(Block.Air);
            }
          }
    }
    console.log('H carved=', carved);
    expect(carved).toBeGreaterThan(0);
  });
});
```

Run: `npx vitest run src/__tests__/water.test.ts`
Expected (RED): the file fails to compile / `Cannot find module '../water'`. That is the expected failing state — `water.ts` does not exist yet.

- [ ] **Step 2: Write the implementation until the suite is green**

Create `src/water.ts` with exactly this content:

```ts
import { Block, BLOCKS } from './blocks';
import { World, chunkOf, chunkKey, localIndex, WORLD_Y_MIN, WORLD_Y_MAX } from './world';

// WaterSim: the PROJECT.md §9 flow cellular automaton. Pure TS (no three) so vitest
// drives it in node, mirroring how streaming.ts is tested. State (wlevel/wsource)
// lives in the chunk, so it streams with the chunk: a missing neighbour chunk reads
// as dry and is not a spread escape; a falling cell whose destination is
// out-of-band or missing is destroyed (falls out of the world).

const HXZ: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const SETTLE_GUARD = 20000; // safety valve: cap on cell updates one settle run may perform

interface CellState { b: number; l: number; s: number }
const DRY: CellState = { b: Block.Air, l: 0, s: 0 };

export class WaterSim {
  private readonly world: World;
  private readonly queue = new Set<string>(); // insertion-ordered FIFO with dedup
  readonly touched = new Set<string>(); // chunk keys whose geometry changed (for re-mesh)

  constructor(world: World) {
    this.world = world;
  }

  private inBand(wy: number): boolean {
    return wy >= WORLD_Y_MIN && wy < WORLD_Y_MAX;
  }

  /** Water/block state at a world cell; missing chunk or out-of-band reads as dry Air. */
  cellState(wx: number, wy: number, wz: number): CellState {
    if (!this.inBand(wy)) return DRY;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return DRY;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    return { b: c.blocks[i], l: c.wlevel[i], s: c.wsource[i] };
  }

  private solid(b: number): boolean {
    return b !== Block.Air && b !== Block.Water && BLOCKS[b].solid;
  }

  // Write a cell's full state. Only records the chunk in `touched` when the *block*
  // actually changed (level changes alone never re-mesh: levels don't render).
  private setState(wx: number, wy: number, wz: number, l: number, s: number, b: number): void {
    if (!this.inBand(wy)) return;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    c.wlevel[i] = l;
    c.wsource[i] = s;
    if (c.blocks[i] !== b) {
      if (this.world.setBlock(wx, wy, wz, b)) this.touched.add(chunkKey(c.cx, c.cy, c.cz));
    }
  }

  // Write only when state differs, then re-mark the cell + 4 horizontal neighbours +
  // the cell above (a below cell is never re-marked from above: a resting level is a
  // function of horizontal + above, and a changing below re-triggers via this rule).
  private writeCell(wx: number, wy: number, wz: number, l: number, s: number, b: number): void {
    const c = this.cellState(wx, wy, wz);
    if (c.b === b && c.l === l && c.s === s) return;
    this.setState(wx, wy, wz, l, s, b);
    this.queue.add(`${wx},${wy},${wz}`);
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
  }

  // One update: process one water cell to its rule-driven action.
  private process(wx: number, wy: number, wz: number): void {
    const C = this.cellState(wx, wy, wz);
    if (C.b !== Block.Water) return; // dried / no longer water: neighbours+above already re-marked
    const below = this.cellState(wx, wy - 1, wz);

    // below is Air (missing / out-of-band counts) → C falls down one cell.
    if (below.b === Block.Air) {
      this.writeCell(wx, wy, wz, 0, 0, Block.Air); // dry origin, re-marked
      if (this.world.hasChunk(chunkOf(wx), chunkOf(wy - 1), chunkOf(wz))) {
        this.writeCell(wx, wy - 1, wz, 7, C.s, Block.Water); // land at level 7, source bit carried
      } // else: destination missing/out-of-band → destroyed (fell out of the world)
      return;
    }

    // resting: below is solid or water.
    const above = this.cellState(wx, wy + 1, wz);
    let nL = C.l;
    let nS = C.s;
    if (C.s !== 1) {
      if (this.solid(below.b)) {
        nS = 1; // below solid → re-promote (level kept)
      } else if (above.b === Block.Water && above.l === 7) {
        nS = 1; // full-water support above → re-promote (level kept)
      } else {
        let best = -1;
        for (const [dx, dz] of HXZ) {
          const m = this.cellState(wx + dx, wy, wz + dz);
          if (m.b === Block.Water && m.l >= 1) best = Math.max(best, m.l - 1);
        }
        if (best < 1) {
          this.writeCell(wx, wy, wz, 0, 0, Block.Air); // starved: no support, no L7 above, no feed
          return;
        }
        nL = best; // decay toward the strongest horizontal feed (a non-source cell ≤ 6)
      }
    }
    this.writeCell(wx, wy, wz, nL, nS, Block.Water);

    // spread to horizontal neighbours at level-1, only from a loaded chunk (a missing
    // neighbour's writeCell is a no-op, so water never leaks into ungenerated space).
    if (nL >= 2) {
      for (const [dx, dz] of HXZ) {
        const m = this.cellState(wx + dx, wy, wz + dz);
        if (m.b === Block.Air || (m.b === Block.Water && m.s === 0 && nL - 1 > m.l)) {
          this.writeCell(wx + dx, wy, wz + dz, nL - 1, 0, Block.Water);
        }
      }
    }
  }

  // Process up to `budget` queued cells (insertion order); the remainder persists.
  // Does not clear `touched` — the caller drains it after re-meshing.
  tick(budget: number): number {
    let n = 0;
    while (n < budget) {
      const it = this.queue.values().next();
      if (it.done) break;
      const key = it.value as string;
      this.queue.delete(key);
      const [wx, wy, wz] = key.split(',').map(Number);
      this.process(wx, wy, wz);
      n++;
    }
    return n;
  }

  // On-load settle: seed every worldgen Water cell as a level-7 source, mark each wet
  // cell (+ neighbours + above), then relax to a fixpoint (guarded). Idempotent.
  settle(cx: number, cy: number, cz: number): Set<string> {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c || c.settled) return this.touched;
    this.touched.clear();
    const bx = cx * 16, by = cy * 16, bz = cz * 16;
    for (let i = 0; i < c.wlevel.length; i++) {
      if (c.blocks[i] === Block.Water) {
        c.wlevel[i] = 7;
        c.wsource[i] = 1;
      }
    }
    for (let lx = 0; lx < 16; lx++)
      for (let ly = 0; ly < 16; ly++)
        for (let lz = 0; lz < 16; lz++)
          if (c.blocks[localIndex(lx, ly, lz)] === Block.Water)
            this.writeCell(bx + lx, by + ly, bz + lz, 7, 1, Block.Water);
    let guard = 0;
    while (this.queue.size > 0 && guard < SETTLE_GUARD) {
      const it = this.queue.values().next();
      if (it.done) break;
      const key = it.value as string;
      this.queue.delete(key);
      const [wx, wy, wz] = key.split(',').map(Number);
      this.process(wx, wy, wz);
      guard++;
    }
    c.settled = true;
    return this.touched;
  }

  // A player edit (break = Air, place = new block). main.ts has already written the
  // block via world.setBlock (and re-meshed around it); this only syncs the sim's water
  // state — placing Water makes a level-7 source, a non-water block clears the cell's
  // state — then marks the cell + neighbours + above so dependents re-evaluate.
  edit(wx: number, wy: number, wz: number, block: number): void {
    if (!this.inBand(wy)) return;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    if (block === Block.Water) {
      c.wlevel[i] = 7;
      c.wsource[i] = 1;
    } else {
      c.wlevel[i] = 0;
      c.wsource[i] = 0;
    }
    this.queue.add(`${wx},${wy},${wz}`);
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
  }
}
```

Key invariants the implementation must preserve (the tests assert them, but re-check while implementing):
- Write only when state actually differs (`writeCell` early-returns) — this is what bounds settle to a fixpoint and keeps the pool test's `tick(1) === 0`.
- `setState` calls `world.setBlock` only when the *block* changes, and records the chunk in `touched` only from a true `setBlock` — level-only changes never re-mesh.
- A fall carries the source bit (`C.s`) and lands at level 7; a landing into a missing/void chunk is a no-op write (destroyed) — the only drain path.
- Spread only when `nL >= 2` and only into loaded neighbours, so ungenerated space is never filled.

- [ ] **Step 3: Run the water suite (GREEN)**

Run: `npx vitest run src/__tests__/water.test.ts`
Expected: all 9 tests pass. The `console.log` lines print `A count= 85` and `H carved= 1284`. If any value drifts from the constants in the header (85 / 1 / 0 / 9 / the seam level 6), reproduce it in a throwaway probe before touching any assertion — the constants are load-bearing.

- [ ] **Step 4: Full suite + typecheck**

Run: `npm run build && npm test`
Expected: `tsc --noEmit` clean, build succeeds, and every suite (now 9 test files including water) passes.

- [ ] **Step 5: Commit**

```bash
git add src/water.ts src/__tests__/water.test.ts
git commit -m "feat: water flow sim (fall/level-7-source/re-promote/spread/drain, settle-on-load) with tests"
```

---

### Task 4: `src/main.ts` — wire the sim into the runtime

**Files:**
- Modify: `src/main.ts`

`main.ts` has no node tests (codebase convention — the T11 palette and this wiring are verified with `npm run build` + a manual `npm run dev` pass). The changes: construct the sim once; settle each freshly rebuilt chunk inside `tickStreaming` (the `settled` flag makes re-settle a no-op, so pure re-meshes are free); run `sim.tick(200)` on the slow clock (every 5th frame); call `sim.edit(...)` after the two `onMouseDown` `setBlock` sites; and re-mesh any chunk the sim changed each frame, then drain `sim.touched`. The immediate `remeshAround` already shows an edit on the same click; the sim's propagated changes are re-meshed within the same/next frame via `touched`.

- [ ] **Step 1: Import `WaterSim`**

In the import block (line 9), after `import { raycastVoxel, REACH, type RayHit } from './raycast';` add:

```ts
import { WaterSim } from './water';
```

- [ ] **Step 2: Construct the sim after the spawn column is generated**

After the boot-world generation loop (ends at line 170, `for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2); // …`), before `const sx = 6, sz = 46;`, insert:

```ts
// Water sim (PROJECT.md §9, src/water.ts): flow state streams with each chunk; it is
// settled per chunk as streaming loads them (tickStreaming) and advanced on a slower
// clock than physics (every 5th frame). The boot-generated spawn column is settled by
// the first tickStreaming, before the first rendered frame, so caves read as already filled.
const sim = new WaterSim(world);

```

- [ ] **Step 3: Settle newly (re)built chunks in `tickStreaming`**

Replace `tickStreaming` (lines 518–522):

```ts
function tickStreaming(): void {
  const r = streaming.update(world, chunkOf(player.pos.x), chunkOf(player.pos.z), chunkOf(player.pos.y));
  for (const c of r.unloaded) removeChunkMesh(c.cx, c.cy, c.cz);
  for (const c of r.rebuilt) rebuildChunkMesh(c.cx, c.cy, c.cz);
}
```

with:

```ts
function tickStreaming(): void {
  const r = streaming.update(world, chunkOf(player.pos.x), chunkOf(player.pos.z), chunkOf(player.pos.y));
  for (const c of r.unloaded) removeChunkMesh(c.cx, c.cy, c.cz);
  for (const c of r.rebuilt) {
    sim.settle(c.cx, c.cy, c.cz); // POC form of worldgen-fluid settling: settle BEFORE meshing so the new chunk's mesh already shows flooded caves. The settled flag makes re-settling a re-meshed chunk a no-op. Cross-seam chunks the sim touched are re-meshed at end of frame (drain below).
    rebuildChunkMesh(c.cx, c.cy, c.cz);
  }
}
```

- [ ] **Step 4: Advance the water clock and drain `touched` in the frame loop**

Replace the frame loop (lines 555–576):

```ts
const STEP = 1 / 60;

let last = performance.now();
let acc = 0;

function frame(now: number): void {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // clamp after tab-switch/hitch
  acc += dt;
  while (acc >= STEP) {
    acc -= STEP;
    player.update(STEP, readMove());
    tickStreaming();
    if (player.pos.y < WORLD_Y_MIN) player.place(SPAWN); // fell out of the world (open cave / dug-away floor)
  }
  syncCamera();
  updateHitbox();
  syncWaterFx();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
```

with:

```ts
const STEP = 1 / 60;

let last = performance.now();
let acc = 0;
let frameNo = 0;

function frame(now: number): void {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // clamp after tab-switch/hitch
  acc += dt;
  while (acc >= STEP) {
    acc -= STEP;
    player.update(STEP, readMove());
    tickStreaming();
    if (player.pos.y < WORLD_Y_MIN) player.place(SPAWN); // fell out of the world (open cave / dug-away floor)
  }
  frameNo++;
  if (frameNo % 5 === 0) sim.tick(200); // water runs on a slower clock than physics (PROJECT.md §9: ~12 ticks/s)
  const touched = sim.touched; // re-mesh any chunk the sim changed this frame (settles from substeps + ticks), then drain
  if (touched.size) {
    for (const key of touched) {
      const [cx, cy, cz] = key.split(',').map(Number);
      if (world.hasChunk(cx, cy, cz)) rebuildChunkMesh(cx, cy, cz);
    }
    touched.clear();
  }
  syncCamera();
  updateHitbox();
  syncWaterFx();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
```

Note: a newly-settled chunk may be re-meshed once more by this end-of-frame drain (it is both in `r.rebuilt` and in `touched`); that is a one-time redundant build per chunk's first settle and is intentionally left to keep the wiring simple. A second known, accepted quirk: when two or more *first-time* chunks settle in the same frame, the later `settle()` calls `touched.clear()` and drops the earlier settle's cross-seam marks. Those chunks were still marked `dirty` by the sim's `setBlock`, so the next `streaming.update` (re-mesh budget 2/call, and those chunks come back through `rebuilt`) re-meshes them within a frame or two — no persistent artifact. Do not "fix" either behavior; both are intentional POC-simplification trade-offs recorded in the spec.

- [ ] **Step 5: Call `sim.edit` after both `onMouseDown` write sites**

In `onMouseDown`, the LMB branch (after `world.setBlock(hit.x, hit.y, hit.z, Block.Air); remeshAround(hit.x, hit.y, hit.z);`) becomes:

```ts
  if (e.button === 0) {
    // `hit` is always a breakable solid (water is pass-through in the raycast).
    world.setBlock(hit.x, hit.y, hit.z, Block.Air);
    remeshAround(hit.x, hit.y, hit.z);
    sim.edit(hit.x, hit.y, hit.z, Block.Air); // clears the cell's water state + re-marks dependents (source/support removed)
  } else if (e.button === 2) {
    const tx = hit.x + hit.nx;
    const ty = hit.y + hit.ny;
    const tz = hit.z + hit.nz;
    if (ty < WORLD_Y_MIN || ty >= WORLD_Y_MAX) return;
    const target = world.getBlock(tx, ty, tz);
    if (target !== Block.Air && target !== Block.Water) return; // empty or water (filling pools)
    if (!player.noclip && player.intersectsVoxel(tx, ty, tz)) return; // no placing through yourself
    world.setBlock(tx, ty, tz, hotbar.block);
    remeshAround(tx, ty, tz);
    sim.edit(tx, ty, tz, hotbar.block); // Water → a level-7 source; any other block dries this cell (surrounding water re-relaxes on the next tick)
  }
```

- [ ] **Step 6: Typecheck + build + full suite**

Run: `npm run build && npm test`
Expected: `tsc --noEmit` clean (the `frameNo`/touched drain compile), build succeeds, all suites still pass. `main.ts` is not node-tested, so the build is its regression gate; behavior is confirmed by Step 7.

- [ ] **Step 7: Manual verification pass (`npm run dev`)**

Run: `npm run dev` and confirm each item in the browser:

1. Spawn (x≈6, z≈46): ocean water renders as before; approaching an underwater cliff, caves read as dark **air** pockets (partially flooded where they open to the sea) — no solid water blobs.
2. Break a sand block on the seafloor: a falling stream fills the hole top-down within ~2 s; the hole's water is swim-through (the T12 underwater mood swaps under it).
3. Place water on a high ledge, over solid ground: it falls as a stream and settles at the base as a small source puddle — breaking any cell of it refills from the neighbours (settled water is immortal).
4. Place water over a void / trench: it falls out of the world and is destroyed (the visible drain).
5. Dig a tunnel down through the seafloor: it floods from above; the bottom cell re-promotes to a stable source.
6. Swim through a flooded cave: air pockets visible above the water; the mood swap works in and out.

- [ ] **Step 8: Wireframe check + commit**

Toggle wireframe (`C`): no water quads are left behind cells that dried (the sim's `setBlock`-driven dirty flags + the end-of-frame `touched` drain + the T10 streaming scan cover the re-mesh).

Run: `npm test && npm run build`
Expected: all green. Then:

```bash
git add src/main.ts
git commit -m "feat: wire WaterSim into the runtime (settle-on-load, tick/5 slow clock, edit on break/place)"
```

---

### Task 5: `PROJECT.md` — de-defer the flow sim; fix the cave pseudocode

**Files:**
- Modify: `PROJECT.md`

Two doc updates so the guide no longer says flow is deferred and its pseudo-generator no longer says caves carve water.

- [ ] **Step 1: Fix the pseudo-generator's cave line (line 145)**

In `PROJECT.md` §5's reference generator, the cave block is:

```ts
        // caves: carve where 3D noise crosses a threshold
        if (b === Block.Stone || b === Block.Dirt) {
          const cave = noise3D(wx * 0.05, wy * 0.05, wz * 0.05);
          if (cave > 0.55) b = wy <= SEA_LEVEL ? Block.Water : Block.Air;
        }
```

Replace the carve line with:

```ts
        // caves: carve AIR where 3D noise crosses a threshold; the water sim (§9, src/water.ts)
        // floods caves from any sea-facing opening and leaves sealed caves dry
        if (b === Block.Stone || b === Block.Dirt) {
          const cave = noise3D(wx * 0.05, wy * 0.05, wz * 0.05);
          if (cave > 0.55) b = Block.Air;
        }
```

- [ ] **Step 2: De-defer §9 and record the shipped behavior + POC-model deviations**

In §9, change the heading `**Flow (optional for POC).**` to `**Flow.**`, and replace the closing `[POC shortcut]` paragraph:

```md
**[POC shortcut]** You can ship the POC with water as a purely static block that fills below sea level and never flows. Flow is a genuinely fiddly system (removal/de-propagation is the hard half) and it's independent of everything else. Defer it until the rest is fun.
```

with:

```md
**[Implemented]** The flow sim shipped in `src/water.ts` (unit-tested in `src/__tests__/water.test.ts`). Flow state (`wlevel`/`wsource`) is stored in each chunk (`src/world.ts`) and streams with it. On top of the rules above it also: **re-promotes** a settled water cell to a *source* on solid support below (a rule typical of voxel engines — so settled lakes, pool floors, landing cells, and sealed pockets are immortal), **settles** standing water once on chunk load (freshly loaded chunks show flooded caves without a visible pour), and **drains** only water that falls out of the world. Documented POC-model deviations: "falling" = step down one cell/tick with the source bit carried (a landed source keeps feeding its stream); a re-promoted source *keeps* its level (bounded, unlike a fresh level-7 source), so a settled pool's front stays a level-1 ring; cut in-flight flow lands and re-promotes rather than draining; water never spreads into ungenerated space (missing chunks stop spread — only a *falling* cell into a missing/void destination is destroyed); and levels affect dynamics only, never the mesh.
```

- [ ] **Step 3: Commit**

```bash
git add PROJECT.md
git commit -m "docs: de-defer the water flow sim (now src/water.ts) and fix the cave pseudocode to carve air"
```

---

### Task 6: Final gate

**Files:** none (verification only)

- [ ] **Step 1: Full suite + build**

Run: `npm test && npm run build`
Expected: every suite green (now 9 test files / 58 tests, including the new `water.test.ts`), `tsc --noEmit` clean, `vite build` succeeds.

- [ ] **Step 2: Manual `npm run dev` sanity (if not done in Task 4 Step 7–8)**

Confirm the Task 4 dev checklist + wireframe check one last time against the fully-wired build. If anything regressed, do not proceed — reproduce it in a scratch test before editing. When it is green, stop (no commit; the work is already committed per task above).