# Plan: chunk persistence (world save/load), water state included

Spec: `docs/superpowers/specs/2026-09-05-chunk-persistence-design.md`
Task brief: `docs/plans/chunk-peristence.md`
Branch: `chunk-persistence` — created in Task 1, before any other file write.

## Goal

Make chunk state durable across unload/reload and across page reloads: edits
(blocks/meta/water) survive walking away and coming back, and a page reload restores
the world, player, time and hotbar. Untouched terrain still generates from the seed;
the load-path work budget (water-load PIN) must not regress.

## Architecture

- `src/persistence.ts` (new) — `ChunkRecord`/`WorldMeta`, `ChunkStore` +
  `InMemoryChunkStore`, `snapshotChunk`/`applyRecord`, `PersistSource` + `Persistence`
  (boot key set, warm cache, fetch dedup, `flush()`).
- `src/idb-store.ts` (new) — `IndexedDBChunkStore` (browser backend; `[POC shortcut]`
  no node tests).
- `src/world.ts` — `Chunk.edited` + `World.setBlock(…, markEdited = true)`.
- `src/time.ts` — `WorldTime.snapshot()` / `restore()`.
- `src/water.ts` — per-cell work-origin threading (`editQueue ⊆ queue`,
  `waiting: Map<string, boolean>`), `setState` passes the origin as `markEdited`,
  `WaterSim.restore(chunk)`.
- `src/streaming.ts` — `PersistSource`-aware `update()`: `restored`/`pending` returns,
  edited-only unload snapshot, exported `markNeighborsDirty`.
- `src/main.ts` — boot gate `startGame(meta)`, boot-column restore, restored/pending
  streaming paths, `metaSnapshot()` + save on unload/hide.

## Tech stack

Existing only: TypeScript + vitest + three. No new dependencies; IndexedDB is native.

## File map

| File | Action |
|------|--------|
| `docs/plans/chunk-peristence.md` | committed as-is (the brief) |
| `docs/superpowers/specs/2026-09-05-chunk-persistence-design.md` | new (Task 1) |
| `docs/superpowers/plans/2026-09-05-chunk-persistence.md` | new — this file (Task 1) |
| `src/world.ts` | edit (Task 2) |
| `src/time.ts` | edit (Task 3) |
| `src/water.ts` | edit (Tasks 4–5) |
| `src/persistence.ts` | new (Task 6) |
| `src/streaming.ts` | edit (Task 7) |
| `src/__tests__/world.test.ts` | edit (Task 2) |
| `src/__tests__/time.test.ts` | edit (Task 3) |
| `src/__tests__/persistence.test.ts` | new (Tasks 4–8) |
| `src/__tests__/streaming.test.ts` | edit (Task 7) |
| `src/__tests__/persistence-water.test.ts` | new (Task 9) |
| `src/idb-store.ts` | new (Task 10) |
| `src/main.ts` | edit (Task 11) |
| `docs/adr/0014-world-persistence.md` | new (Task 13) |
| `docs/adr/README.md`, `TODO.md`, `README.md`, `PROJECT.md` | edit (Task 13) |

## Pinned numbers (must not regress)

`water-load.test.ts` PIN 1,231,601 / post-change 10,690 processes; `CHUNK_VOL` 4096;
`VIEW_RADIUS` 2, `CY` 0..4; `TERRAIN_SEED` 1234; `WARM_CAP` 512; boot gate 1.5 s.

## Execution notes

- TDD per task: failing tests first, then implementation, run, commit.
- Tasks 8–9 are integration tests over already-implemented code — expected green; a
  failure points at the named implementation hunk, not the test.
- House style: no reference engine named, pinned numbers verbatim, `[POC shortcut]`
  tags on deliberate punts, imperative detailed commit messages.

---

## Task 1: branch + spec + plan doc

**Step 1:** `git checkout -b chunk-persistence`

**Step 2:** Write the spec (`docs/superpowers/specs/2026-09-05-chunk-persistence-design.md`)
and this plan (`docs/superpowers/plans/2026-09-05-chunk-persistence.md`).

**Step 3: Commit** (includes the previously-untracked brief)

```
git add docs/plans/chunk-peristence.md docs/superpowers
git commit -m "docs: spec + plan for chunk persistence (world save/load, water state included); commit the task brief"
```

---

## Task 2: `Chunk.edited` + `World.setBlock(markEdited)`

**Files:** `src/world.ts`, `src/__tests__/world.test.ts`

**Step 1: Write the failing tests** — append to `src/__tests__/world.test.ts`
(merge `TERRAIN_SEED`/`TerrainGen`/`generateChunkTerrain` into the terrain import if
not already present):

```ts
describe('Chunk.edited — the persistence gate (ADR 0014)', () => {
  it('is set by setBlock (default) and survives equal-value writes', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    expect(c.edited).toBe(false);
    expect(w.setBlock(4, 4, 4, Block.Stone)).toBe(true);
    expect(c.edited).toBe(true);
    expect(w.setBlock(4, 4, 4, Block.Stone)).toBe(false); // no change
    expect(c.edited).toBe(true);
  });

  it('is not set when markEdited is false (the water-sim path)', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    w.setBlock(4, 4, 4, Block.Stone, 0, false);
    expect(c.edited).toBe(false);
  });

  it('is not set by terrain generation', () => {
    const w = new World();
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(w, gen, 0, cy, 2);
    for (const c of w.allChunks()) expect(c.edited, `chunk (${c.cx},${c.cy},${c.cz})`).toBe(false);
  });
});
```

**Step 2: Implement** — `src/world.ts`:

1. `Chunk` interface — add after `lightSettled`:

```ts
  edited: boolean;      // persistence gate (ADR 0014): set ONLY by player-origin work
                        // (World.setBlock default / edit-origin water flow), never by
                        // terrain generation or worldgen settle — the only chunks
                        // persisted on unload
```

2. `ensureChunk` — add `edited: false,` (after `lightSettled: false,`).

3. `setBlock` — new signature + mark:

```ts
  /**
   * Returns false when the chunk is missing or the value is unchanged (block AND meta).
   * meta defaults to 0 — writing any plain block clears the cell's torch/door state.
   * Footgun: calling setBlock WITHOUT meta on a cell that already holds a
   * torch/door silently RESETS its state to 0 (returns true, dirties neighbors) —
   * always pass meta explicitly when writing Block.Torch / a door id.
   * Marks the chunk and any existing 6 face-neighbors dirty: a door closing/opening
   * changes both what is solid and which neighbor faces its panel hides.
   * markEdited (persistence gate, ADR 0014): the player path defaults to true; the
   * water sim passes its per-cell work origin (false for settle/worldgen work, so
   * deterministic cave-flooding never persists as "edited").
   */
  setBlock(wx: number, wy: number, wz: number, b: number, meta = 0, markEdited = true): boolean {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return false;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    if (c.blocks[i] === b && c.meta[i] === meta) return false;
    c.blocks[i] = b;
    c.meta[i] = meta;
    c.dirty = true;
    if (markEdited) c.edited = true;
    const n = [ /* unchanged neighbor loop */ ];
    ...
  }
```

**Step 3: Verify** — `npx vitest run src/__tests__/world.test.ts src/__tests__/water-load.test.ts`
(new tests green; the water-load PIN still holds — no water behavior changed).

**Step 4: Commit**

```
feat: Chunk.edited + World.setBlock markEdited — the persistence gate (player-origin work only)
```

---

## Task 3: `WorldTime.snapshot()` / `restore()`

**Files:** `src/time.ts`, `src/__tests__/time.test.ts`

**Step 1: Write the failing test** — append to `src/__tests__/time.test.ts`:

```ts
describe('WorldTime.snapshot/restore — the persistence round trip (ADR 0014)', () => {
  it('round-trips time, tick and the private phaseTotal (dayPhase/day/hour included)', () => {
    const t = new WorldTime(0.25); // start at sunset
    t.advance(37.5);
    t.advance(1.5);
    const snap = t.snapshot();
    const t2 = new WorldTime(0);
    t2.restore(snap);
    expect(t2.time).toBeCloseTo(t.time);
    expect(t2.tick).toBe(t.tick);
    expect(t2.dayPhase).toBeCloseTo(t.dayPhase);
    expect(t2.day).toBe(t.day);
    expect(t2.hour).toBeCloseTo(t.hour);
  });
});
```

**Step 2: Implement** — `src/time.ts`, inside the class after `advance`:

```ts
  /** Persistence snapshot (ADR 0014): the full clock state, `phaseTotal` included. `restore` is its inverse. */
  snapshot(): { time: number; tick: number; phaseTotal: number } {
    return { time: this.time, tick: this.tick, phaseTotal: this.phaseTotal };
  }

  restore(s: { time: number; tick: number; phaseTotal: number }): void {
    this.time = s.time;
    this.tick = s.tick;
    this.phaseTotal = s.phaseTotal;
  }
```

**Step 3: Verify** — `npx vitest run src/__tests__/time.test.ts`

**Step 4: Commit**

```
feat: WorldTime.snapshot/restore — persist the clock (time + tick + phaseTotal)
```

## Task 4: WaterSim edit-origin tracking (D4)

**Files:** `src/water.ts`, `src/__tests__/persistence.test.ts` (new file — the first
describe of the persistence suite; Tasks 5–8 append to it)

The queue stays a single insertion-ordered `Set<string>` (the pin depends on its
membership and order). A parallel `editQueue: Set<string>` (invariant:
`editQueue ⊆ queue`) tags the cells whose work originates from a player edit. Every
queue mutation gains an origin flag `eo` and propagates it; a popped cell is
processed with its own origin, and `setState` passes the origin as `markEdited` to
`world.setBlock`. `enqueue` (settleSeed pass 2, counted in `stats.queueAdds`) and the
raw `queue.add` sites keep today's counting semantics; the new `remark` helper is the
UNCOUNTED writeCell closure (exactly what `writeCell` re-marks today).

**Step 1: Write the failing tests** — create `src/__tests__/persistence.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { World, localIndex } from '../world';
import { Block } from '../blocks';
import { WaterSim } from '../water';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from '../terrain';

describe('water origin tracking — the edit gate (D4)', () => {
  it('settle + pulses on generated chunks never mark a chunk edited', () => {
    const world = new World();
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2);
    const sim = new WaterSim(world);
    for (const c of world.allChunks()) sim.settle(c.cx, c.cy, c.cz);
    sim.tick(1000);
    for (let i = 0; i < 20 && sim.tick(1000) > 0; i++) {}
    for (const c of world.allChunks()) expect(c.edited, `chunk (${c.cx},${c.cy},${c.cz})`).toBe(false);
  });

  it('a player-placed spring marks its own chunk AND the chunk its flow floods edited', () => {
    const world = new World();
    for (const cx of [0, 1]) {
      const c = world.ensureChunk(cx, 0, 0);
      for (let lx = 0; lx < 16; lx++)
        for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, 0, lz)] = Block.Stone;
    }
    const sim = new WaterSim(world);
    world.setBlock(12, 2, 8, Block.Water);
    sim.edit(12, 2, 8, Block.Water);
    for (let i = 0; i < 100 && sim.tick(1000) > 0; i++) {}
    expect(world.getChunk(0, 0, 0)!.edited).toBe(true); // the placement itself
    expect(world.getChunk(1, 0, 0)!.edited).toBe(true); // the fan crosses x=16 (edit-origin flow)
  });
});
```

**Step 2: Implement** — `src/water.ts` hunks (3a–3j):

3a. Fields — replace the `waiting` field and add `editQueue` + `push`:

```ts
  private editQueue = new Set<string>(); // keys in `queue` whose work originates from a player edit (invariant: editQueue ⊆ queue) — the persistence gate (D4): only this work marks chunks edited
  private waiting = new Map<string, boolean>(); // cells whose fall stopped at not-yet-generated space below → value is the work origin carried into the re-queue
```

plus, after `enqueue`:

```ts
  /** Enqueue one key with an origin. The uncounted single-cell twin of enqueue (writeCell
   *  re-marks were never counted in stats.queueAdds — the pin semantics are preserved). */
  private push(key: string, eo: boolean): void {
    this.queue.add(key);
    if (eo) this.editQueue.add(key);
  }

  /** Re-mark exactly the cells writeCell re-marks (self + 6 neighbours), carrying the
   *  origin to the edit gate. No stats.queueAdds (see push). */
  private remark(wx: number, wy: number, wz: number, eo: boolean): void {
    this.push(`${wx},${wy},${wz}`, eo);
    for (const [dx, dz] of HXZ) this.push(`${wx + dx},${wy},${wz + dz}`, eo);
    this.push(`${wx},${wy + 1},${wz}`, eo);
    this.push(`${wx},${wy - 1},${wz}`, eo);
  }
```

3b. `setState` — new last param; pass the origin as `markEdited`:

```ts
  private setState(wx: number, wy: number, wz: number, l: number, s: number, b: number, p: number, st: number, eo: boolean = false): void {
    if (!this.inBand(wy)) return;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    c.wlevel[i] = l;
    c.wsource[i] = s;
    c.wplaced[i] = p;
    c.wstream[i] = st;
    if (c.blocks[i] !== b) {
      if (this.world.setBlock(wx, wy, wz, b, 0, eo)) this.touched.add(chunkKey(c.cx, c.cy, c.cz));
    }
  }
```

3c. `writeCell` — origin param, body = setState + remark:

```ts
  private writeCell(wx: number, wy: number, wz: number, l: number, s: number, b: number, p: number = 0, st: number = 0, eo: boolean = false): void {
    const c = this.cellState(wx, wy, wz);
    if (c.b === b && c.l === l && c.s === s && c.p === p && c.st === st) return;
    this.setState(wx, wy, wz, l, s, b, p, st, eo);
    this.remark(wx, wy, wz, eo);
  }
```

3d. `process(wx, wy, wz, eo = false)` — thread `eo` into every `writeCell` /
`dropColumn` / `spreadToAir` call in the body, and replace the three raw
`this.queue.add(\`${wx},${wy - 1},${wz}\`)` sites (fed-head pour, re-derived-dry,
rose-toward-full) with `this.push(\`${wx},${wy - 1},${wz}\`, eo)`. The
`this.waiting.add(key)` site becomes `this.waiting.set(key, eo)`.

3e. `spreadToAir(wx, wy, wz, l, eo = false)` — `this.writeCell(tx, wy, tz, l - 1, 0, Block.Water, 0, 0, eo)`.

3f. `dropColumn(x, y, z, s = 0, p = 0, eo: boolean = false)` — both pass-2 writes gain `eo`:
`this.writeCell(x, cy, z, 7, s, Block.Water, p, 1, eo)` and
`this.writeCell(x, bottom, z, 7, s, Block.Water, p, st, eo)`.

3g. `spawnSource(x, y, z, eo = false)` — `this.writeCell(x, y, z, 7, 1, Block.Water, 1, 0, eo);`
(`springs.add` unchanged). `healSourceBody(wx, wy, wz, eo = false)` — both
`spawnSource(…, eo)` calls. In `process`, the `C.p === 1` branch calls
`healSourceBody(wx, wy, wz, eo)` and `spreadToAir(wx, wy, wz, C.l, eo)`.

3h. `tick` — origin-carrying re-queues + origin-aware pop:

```ts
  tick(budget: number): number {
    for (const [key, eo] of this.waiting) this.push(key, eo);
    this.waiting.clear();
    for (const key of this.springs) {
      const [sx, sy, sz] = key.split(',').map(Number);
      if (this.cellState(sx, sy, sz).p === 1) this.push(key, true); // a live spring is eternal edit origin
      else this.springs.delete(key);
    }
    let n = 0;
    while (n < budget) {
      const it = this.queue.values().next();
      if (it.done) break;
      const key = it.value as string;
      const eo = this.editQueue.has(key);
      this.queue.delete(key);
      this.editQueue.delete(key);
      const [wx, wy, wz] = key.split(',').map(Number);
      this.process(wx, wy, wz, eo);
      n++;
    }
    return n;
  }
```

3i. `settle` pop loop — same origin-aware pop as tick (a settle drain that pops
edit-origin work keeps the origin):

```ts
    while (this.queue.size > 0 && guard < SETTLE_GUARD) {
      const it = this.queue.values().next();
      if (it.done) break;
      const key = it.value as string;
      const eo = this.editQueue.has(key);
      this.queue.delete(key);
      this.editQueue.delete(key);
      const [wx, wy, wz] = key.split(',').map(Number);
      this.process(wx, wy, wz, eo);
      guard++;
    }
```

3j. `edit` — player edits are always edit origin (replace the trailing raw adds):

```ts
    c.wstream[i] = 0; // any riding cell here is overwritten/removed: it rests again (or is gone)
    this.remark(wx, wy, wz, true); // every player edit is edit origin (D4)
  }
```

`enqueue` and `settleSeed` are unchanged (worldgen seeding stays origin-free and
counted). `water-load.test.ts`'s prototype patch of `process(wx, wy, wz)` stays
compatible: the new 4th param defaults to `false`, and the no-edit replay runs
`editQueue` empty, so queue membership/order and the process count are unchanged —
the PIN must hold.

**Step 3: Verify**

```
npx vitest run src/__tests__/persistence.test.ts src/__tests__/water-load.test.ts src/__tests__/water.test.ts
```

**Step 4: Commit**

```
feat: water sim edit-origin tracking — only player-origin work marks chunks edited (the zero-persist gate, D4)
```

---

## Task 5: `WaterSim.restore(chunk)`

**Files:** `src/water.ts`, `src/__tests__/persistence.test.ts` (append)

**Step 1: Write the failing tests** — append a describe:

```ts
describe('WaterSim.restore — the persistence rebuild (D1/D2)', () => {
  type Inner = { queue: Set<string>; waiting: Map<string, boolean>; springs: Set<string> };
  const inner = (sim: WaterSim) => sim as unknown as Inner;

  it('rebuilds springs from wplaced', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    const i = localIndex(8, 1, 8);
    c.blocks[i] = Block.Water; c.wlevel[i] = 7; c.wsource[i] = 1; c.wplaced[i] = 1;
    c.settled = true;
    const sim = new WaterSim(world);
    expect(inner(sim).springs.size).toBe(0);
    sim.restore(c);
    expect(inner(sim).springs.has('8,1,8')).toBe(true);
  });

  it('enqueues face water cells (with their closure) — never the interior', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    const put = (x: number, y: number, z: number): void => {
      const i = localIndex(x, y, z);
      c.blocks[i] = Block.Water; c.wlevel[i] = 7; c.wsource[i] = 1;
    };
    put(0, 1, 8); // lx=0 face
    put(8, 1, 8); // interior
    c.settled = true;
    const sim = new WaterSim(world);
    sim.restore(c);
    expect(inner(sim).queue.has('0,1,8')).toBe(true);
    expect(inner(sim).queue.has('8,1,8')).toBe(false); // interior sits at its saved fixpoint
  });

  it('rebuilds waiting from the bottom face only when the band below is missing', () => {
    const world = new World();
    const c = world.ensureChunk(0, 1, 0);
    const i = localIndex(8, 0, 8); // ly=0 → wy=16
    c.blocks[i] = Block.Water; c.wlevel[i] = 7;
    c.settled = true;
    const sim = new WaterSim(world);
    sim.restore(c); // the band below (0,0,0) is missing
    expect(inner(sim).waiting.has('8,16,8')).toBe(true);

    const world2 = new World();
    world2.ensureChunk(0, 0, 0); // the band below EXISTS
    const c2 = world2.ensureChunk(0, 1, 0);
    c2.blocks[localIndex(8, 0, 8)] = Block.Water;
    c2.settled = true;
    const sim2 = new WaterSim(world2);
    sim2.restore(c2);
    expect(inner(sim2).waiting.has('8,16,8')).toBe(false);
  });
});
```

**Step 2: Implement** — `src/water.ts`, after `settle`:

```ts
  /**
   * Persistence restore (ADR 0014): the chunk's arrays are already in place
   * (persistence.applyRecord) and settled = true — NO re-settle (D1: the saved state is
   * the truth; re-settling would re-flood a drained cave or re-drain a flooded one).
   * Rebuild only the sim's in-memory state from the arrays:
   *   - springs: re-registered from wplaced (in-memory only; the per-pulse re-queue
   *     resumes emission on its own);
   *   - waiting: a water cell in the bottom row over a missing band below was a parked
   *     fall (D2: rebuilt, not persisted);
   *   - seams: the water cells on the six faces are re-marked (their 7-cell closure) so
   *     cross-seam state re-derives — the chunk's water may have been mid-flow at its
   *     boundary when it unloaded. The interior is NOT enqueued: it sits at its saved
   *     fixpoint, so a restored chunk with nothing new adjacent does ~zero water work.
   */
  restore(c: Chunk): void {
    const bx = c.cx * 16, by = c.cy * 16, bz = c.cz * 16;
    for (let i = 0; i < c.blocks.length; i++) {
      if (c.blocks[i] !== Block.Water || c.wplaced[i] !== 1) continue;
      this.springs.add(`${bx + (i & 15)},${by + ((i >> 8) & 15)},${bz + ((i >> 4) & 15)}`);
    }
    if (c.cy > MIN_CY && !this.world.hasChunk(c.cx, c.cy - 1, c.cz)) {
      for (let lx = 0; lx < 16; lx++)
        for (let lz = 0; lz < 16; lz++)
          if (c.blocks[localIndex(lx, 0, lz)] === Block.Water)
            this.waiting.set(`${bx + lx},${by},${bz + lz}`, false);
    }
    for (let lx = 0; lx < 16; lx++)
      for (let ly = 0; ly < 16; ly++)
        for (let lz = 0; lz < 16; lz++) {
          const onFace = lx === 0 || lx === 15 || ly === 0 || ly === 15 || lz === 0 || lz === 15;
          if (!onFace) continue;
          if (c.blocks[localIndex(lx, ly, lz)] !== Block.Water) continue;
          this.remark(bx + lx, by + ly, bz + lz, false); // re-derivation is not an edit
        }
  }
```

(Seam re-marks use `remark(…, false)` — the uncounted closure — so restores never touch
`stats.queueAdds` and the pin semantics stay clean even when restores happen.)

**Step 3: Verify** — `npx vitest run src/__tests__/persistence.test.ts src/__tests__/water-load.test.ts`

**Step 4: Commit**

```
feat: WaterSim.restore — rebuild springs (wplaced), waiting (bottom face) and seam re-marks from restored arrays (D1/D2)
```

---

## Task 6: `src/persistence.ts` — records, store, facade

**Files:** `src/persistence.ts` (new), `src/__tests__/persistence.test.ts` (append)

**Step 1: Write the failing tests** — append (merge imports: `CHUNK_VOL, type Chunk`
from `../world`; `snapshotChunk, applyRecord, Persistence, InMemoryChunkStore,
chunkRecordKey, metaKey, type ChunkStore` from `../persistence`):

```ts
describe('persistence — records and store', () => {
  const mkChunk = (w: World, cx: number, cy: number, cz: number): Chunk => {
    const c = w.ensureChunk(cx, cy, cz);
    c.edited = true;
    return c;
  };

  it('snapshotChunk/applyRecord round-trip the six arrays byte-for-byte', () => {
    const world = new World();
    const c = mkChunk(world, 1, 2, 3);
    for (let i = 0; i < CHUNK_VOL; i++) {
      c.blocks[i] = i % 13;
      c.meta[i] = (i * 7) % 4;
      c.wlevel[i] = (i * 3) % 8;
      c.wsource[i] = i % 2;
      c.wplaced[i] = (i >> 1) % 2;
      c.wstream[i] = (i >> 2) % 2;
    }
    const rec = snapshotChunk(c);
    expect(rec.v).toBe(1);
    expect([rec.cx, rec.cy, rec.cz]).toEqual([1, 2, 3]);
    world.removeChunk(1, 2, 3);
    applyRecord(world, rec);
    const c2 = world.getChunk(1, 2, 3)!;
    expect(c2.settled).toBe(true); // D1: the saved state is the truth
    expect(c2.edited).toBe(true);  // a persisted chunk is by definition edited
    expect(c2.dirty).toBe(false);  // first mesh goes through deferredFirstMesh, not the remesh pass
    const fields: [string, Uint8Array, Uint8Array][] = [
      ['blocks', c.blocks, c2.blocks], ['meta', c.meta, c2.meta],
      ['wlevel', c.wlevel, c2.wlevel], ['wsource', c.wsource, c2.wsource],
      ['wplaced', c.wplaced, c2.wplaced], ['wstream', c.wstream, c2.wstream],
    ];
    for (const [name, a, b] of fields) expect(b, name).toEqual(new Uint8Array(a));
  });

  it('onUnload snapshots edited chunks only; the warm cache restores sync and evicts the oldest past the cap', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, 1234);
    await persist.boot();
    const world = new World();
    const edited = mkChunk(world, 0, 0, 0);
    edited.blocks[0] = 5;
    const pristine = world.ensureChunk(1, 0, 0); // edited = false
    persist.onUnload(edited);
    persist.onUnload(pristine);
    expect(store.puts).toBe(1); // pristine terrain is never written (D4/D6)
    expect(persist.syncRecord(0, 0, 0)).toBeDefined();
    expect(persist.hasPersisted(0, 0, 0)).toBe(true);
    expect(persist.hasPersisted(1, 0, 0)).toBe(false);

    for (let i = 1; i <= 513; i++) { // WARM_CAP = 512 → two evictions
      const c = world.ensureChunk(i, 0, 0);
      c.edited = true;
      persist.onUnload(c);
    }
    expect(persist.syncRecord(1, 0, 0)).toBeUndefined(); // evicted (oldest first)
    expect(persist.syncRecord(513, 0, 0)).toBeDefined();
    expect(persist.hasPersisted(1, 0, 0)).toBe(true); // eviction never drops the key set
  });

  it('fetchRecord dedups in-flight reads; the third read is a warm hit', async () => {
    let gets = 0;
    const backing = new InMemoryChunkStore();
    const counting: ChunkStore = {
      get: async (k) => { gets++; return backing.get(k); },
      put: (k, r) => backing.put(k, r),
      delete: (k) => backing.delete(k),
      keys: () => backing.keys(),
    };
    await backing.put(chunkRecordKey(1234, 2, 0, 0), snapshotChunk(mkChunk(new World(), 2, 0, 0)));
    const persist = new Persistence(counting, 1234);
    await persist.boot();
    const [a, b] = await Promise.all([persist.fetchRecord(2, 0, 0), persist.fetchRecord(2, 0, 0)]);
    expect(gets).toBe(1); // one in-flight read, shared
    expect(a).toBeDefined();
    expect(b).toBe(a);
    await persist.fetchRecord(2, 0, 0);
    expect(gets).toBe(1); // warm after the first fetch
  });

  it('boot loads the key set (seed-prefix filtered) and the world meta', async () => {
    const store = new InMemoryChunkStore();
    await store.put(chunkRecordKey(1234, 0, 0, 0), snapshotChunk(mkChunk(new World(), 0, 0, 0)));
    await store.put(chunkRecordKey(9999, 0, 0, 0), snapshotChunk(mkChunk(new World(), 0, 0, 0)));
    await store.put(metaKey(1234), {
      v: 1, seed: 1234,
      player: { x: 1, y: 2, z: 3, yaw: 0.5, pitch: -0.25 },
      time: { time: 100, tick: 6000, phaseTotal: 0.5 },
      hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 3 },
    });
    const persist = new Persistence(store, 1234);
    const meta = await persist.boot();
    expect(meta?.seed).toBe(1234);
    expect(meta?.player.x).toBe(1);
    expect(meta?.time.tick).toBe(6000);
    expect(meta?.hotbar.selected).toBe(3);
    expect(persist.hasPersisted(0, 0, 0)).toBe(true); // this seed's key
    expect(persist.hasPersisted(5, 0, 0)).toBe(false); // never persisted
  });
});
```

**Step 2: Implement** — create `src/persistence.ts`:

```ts
import { type Chunk, type World } from './world';

// === record shapes (ADR 0014) ===

/** One persisted chunk: the six arrays that define world state. Light fields are
 *  intentionally absent (recomputed by the light worker on load — ADR 0012). Plain data
 *  only (no class instances, no closures) — this is the future sync payload. */
export interface ChunkRecord {
  v: 1;
  cx: number;
  cy: number;
  cz: number;
  blocks: Uint8Array;
  meta: Uint8Array;
  wlevel: Uint8Array;
  wsource: Uint8Array;
  wplaced: Uint8Array;
  wstream: Uint8Array;
}

/** World meta: everything that is not chunk arrays. */
export interface WorldMeta {
  v: 1;
  seed: number;
  player: { x: number; y: number; z: number; yaw: number; pitch: number };
  time: { time: number; tick: number; phaseTotal: number }; // WorldTime.snapshot()
  hotbar: { slots: number[]; selected: number };
}

export type StoreValue = ChunkRecord | WorldMeta;

/** Pluggable backend (the brief's ChunkStore): IndexedDB in the browser, in-memory in
 *  node tests. Typed arrays survive structured clone — stored raw. */
export interface ChunkStore {
  get(key: string): Promise<StoreValue | undefined>;
  put(key: string, rec: StoreValue): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

const META_SUFFIX = '__meta__';

export function chunkRecordKey(seed: number, cx: number, cy: number, cz: number): string {
  return `${seed}:${cx},${cy},${cz}`;
}

export function metaKey(seed: number): string {
  return `${seed}:${META_SUFFIX}`;
}

/** Snapshot a chunk's arrays into a record. Arrays are COPIED (slice): the chunk is
 *  removed from the world right after onUnload returns. */
export function snapshotChunk(c: Chunk): ChunkRecord {
  return {
    v: 1,
    cx: c.cx, cy: c.cy, cz: c.cz,
    blocks: c.blocks.slice(),
    meta: c.meta.slice(),
    wlevel: c.wlevel.slice(),
    wsource: c.wsource.slice(),
    wplaced: c.wplaced.slice(),
    wstream: c.wstream.slice(),
  };
}

/** Apply a record to the world. settled = true (D1: the saved state is the truth — no
 *  re-settle); edited = true (a persisted chunk is by definition edited, so a later
 *  unload re-snapshots it); dirty = false (its first mesh goes through main.ts's
 *  deferredFirstMesh, not the remesh pass). */
export function applyRecord(world: World, r: ChunkRecord): void {
  const c = world.ensureChunk(r.cx, r.cy, r.cz);
  c.blocks.set(r.blocks);
  c.meta.set(r.meta);
  c.wlevel.set(r.wlevel);
  c.wsource.set(r.wsource);
  c.wplaced.set(r.wplaced);
  c.wstream.set(r.wstream);
  c.settled = true;
  c.edited = true;
  c.dirty = false;
}

/** Node-testable backend; the `puts` counter is what the zero-persist guard asserts. */
export class InMemoryChunkStore implements ChunkStore {
  data = new Map<string, StoreValue>();
  puts = 0;
  deletes = 0;

  async get(key: string): Promise<StoreValue | undefined> {
    return this.data.get(key);
  }
  async put(key: string, rec: StoreValue): Promise<void> {
    this.puts++;
    this.data.set(key, rec);
  }
  async delete(key: string): Promise<void> {
    this.deletes++;
    this.data.delete(key);
  }
  async keys(): Promise<string[]> {
    return [...this.data.keys()];
  }
}

/** The streaming-side view of persistence (dependency inversion: streaming.ts depends
 *  on this; main.ts wires in a Persistence). Coord-based so streaming never deals in
 *  keys or records. */
export interface PersistSource {
  hasPersisted(cx: number, cy: number, cz: number): boolean;
  syncRecord(cx: number, cy: number, cz: number): ChunkRecord | undefined;
  fetchRecord(cx: number, cy: number, cz: number): Promise<ChunkRecord | undefined>;
  onUnload(c: Chunk): void;
  dropPersisted(cx: number, cy: number, cz: number): void;
}

const WARM_CAP = 512; // [POC shortcut] ~512 × 24 KB ≈ 15 MB; evict the oldest

/**
 * The persistence facade (ADR 0014):
 *  - key set preloaded at boot (D3): boot() loads every key of this seed (getAllKeys +
 *    prefix filter — no IDB index) so "is this chunk persisted?" is a sync check;
 *  - warm cache (D5): recently touched records, evicted oldest-first past the cap —
 *    same-frame sync restores;
 *  - fetch dedup: concurrent fetchRecord for one key shares one in-flight promise;
 *  - edited-only writes (D4/D6): onUnload snapshots a chunk only when c.edited;
 *  - error-tolerant (D7): a null or rejecting store degrades to session-only
 *    persistence (failed fetch → undefined → the caller drops the key → confirmed miss).
 */
export class Persistence implements PersistSource {
  private readonly store: ChunkStore | null;
  private readonly seed: number;
  private readonly warm = new Map<string, ChunkRecord>(); // insertion-ordered: oldest = first key
  private readonly persistedKeys = new Set<string>(); // preloaded at boot; updated on put/drop
  private readonly inFlight = new Map<string, Promise<ChunkRecord | undefined>>();
  private readonly pendingPuts = new Set<Promise<void>>();
  meta: WorldMeta | null = null;

  constructor(store: ChunkStore | null, seed: number) {
    this.store = store;
    this.seed = seed;
  }

  key(cx: number, cy: number, cz: number): string {
    return chunkRecordKey(this.seed, cx, cy, cz);
  }

  /** Load the key set + the world meta; resolves with the meta (null when absent).
   *  Never rejects: a store failure leaves an empty key set (D7). */
  async boot(): Promise<WorldMeta | null> {
    if (!this.store) return null;
    try {
      const keys = await this.store.keys();
      const prefix = `${this.seed}:`;
      for (const k of keys) if (k.startsWith(prefix)) this.persistedKeys.add(k);
      const m = await this.store.get(metaKey(this.seed));
      if (m && 'player' in m) this.meta = m;
    } catch {
      // D7: the store is unavailable (private mode, quota) — session-only persistence
    }
    return this.meta;
  }

  hasPersisted(cx: number, cy: number, cz: number): boolean {
    return this.persistedKeys.has(this.key(cx, cy, cz));
  }

  syncRecord(cx: number, cy: number, cz: number): ChunkRecord | undefined {
    return this.warm.get(this.key(cx, cy, cz));
  }

  fetchRecord(cx: number, cy: number, cz: number): Promise<ChunkRecord | undefined> {
    const k = this.key(cx, cy, cz);
    const hit = this.warm.get(k);
    if (hit) return Promise.resolve(hit);
    const existing = this.inFlight.get(k);
    if (existing) return existing;
    const p = (async (): Promise<ChunkRecord | undefined> => {
      if (!this.store) return undefined;
      try {
        const rec = (await this.store.get(k)) as ChunkRecord | undefined;
        if (rec && 'cx' in rec) this.cache(k, rec);
        return rec && 'cx' in rec ? rec : undefined;
      } catch {
        return undefined; // D7: failed fetch → the caller drops the key → confirmed miss
      } finally {
        this.inFlight.delete(k);
      }
    })();
    this.inFlight.set(k, p);
    return p;
  }

  /** Unload hook (D4/D6): an edited chunk is snapshotted into the warm cache AND written
   *  through to the store in the background; an unedited chunk (pristine terrain) is a no-op. */
  onUnload(c: Chunk): void {
    if (!c.edited) return;
    const k = this.key(c.cx, c.cy, c.cz);
    const rec = snapshotChunk(c);
    this.cache(k, rec);
    this.persistedKeys.add(k);
    if (!this.store) return;
    const p = this.store.put(k, rec).catch(() => undefined);
    this.pendingPuts.add(p);
    void p.then(() => this.pendingPuts.delete(p));
  }

  /** A stale/failed fetch: forget the key so streaming treats the chunk as a confirmed
   *  miss and generates it fresh (D7). */
  dropPersisted(cx: number, cy: number, cz: number): void {
    const k = this.key(cx, cy, cz);
    this.persistedKeys.delete(k);
    this.warm.delete(k);
  }

  saveMeta(m: WorldMeta): void {
    this.meta = m;
    if (!this.store) return;
    const p = this.store.put(metaKey(this.seed), m).catch(() => undefined);
    this.pendingPuts.add(p);
    void p.then(() => this.pendingPuts.delete(p));
  }

  /** Wait for the background writes (called on hide/pagehide). Never rejects. */
  flush(): Promise<void> {
    return Promise.all([...this.pendingPuts]).catch(() => undefined);
  }

  private cache(k: string, rec: ChunkRecord): void {
    if (this.warm.has(k)) this.warm.delete(k); // refresh recency (last = newest)
    this.warm.set(k, rec);
    while (this.warm.size > WARM_CAP) {
      const oldest = this.warm.keys().next().value as string;
      this.warm.delete(oldest); // [POC shortcut] evict the oldest; it re-fetches on demand
    }
  }
}
```

**Step 3: Verify** — `npx vitest run src/__tests__/persistence.test.ts && npm run build`

**Step 4: Commit**

```
feat: persistence layer — ChunkRecord/WorldMeta, pluggable store, snapshot/apply, Persistence facade (boot key set, warm cache, fetch dedup, edited-only writes)
```

## Task 7: `streaming.ts` — persistence-aware load/unload

**Files:** `src/streaming.ts`, `src/__tests__/streaming.test.ts` (append)

**Step 1: Write the failing tests** — append (add
`import { InMemoryChunkStore, Persistence, applyRecord } from '../persistence';`):

```ts
describe('streaming + persistence', () => {
  // Chunk (0,1,2) is in the ring around a (2,·,2) player and its terrain value at
  // (8,20,40) is unknown — so flip that cell to whatever it is NOT (guaranteed change
  // → chunk edited).
  function editChunk(world: World): number {
    const before = world.getBlock(8, 20, 40);
    const b = before === Block.Dirt ? Block.Stone : Block.Dirt;
    world.setBlock(8, 20, 40, b);
    return b;
  }

  it('E: warm restore — an edited chunk snapshots on unload and restores inline on the walk back', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot();
    const world = new World();
    converge(world); // 125 chunks around (2,2,2)
    for (const c of world.allChunks()) c.dirty = false;
    const b = editChunk(world); // marks chunk (0,1,2) edited

    update(world, 40, 2, 2, persist); // teleport: the whole ring unloads
    expect(store.puts).toBe(1); // D4/D6: only the edited chunk is snapshotted

    const r = update(world, 2, 2, 2, persist); // walk back
    expect(r.restored).toContainEqual({ cx: 0, cy: 1, cz: 2 });
    expect(world.getChunk(0, 1, 2)!.settled).toBe(true); // D1: water state restored as-is
    expect(world.getBlock(8, 20, 40)).toBe(b); // the edit survived the round trip
    expect(store.puts).toBe(1); // restoring does not re-put
  });

  it('F: cold restore — a fresh Persistence (page reload) defers to an async fetch; the chunk is never generated', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot();
    const world = new World();
    converge(world);
    const b = editChunk(world);
    update(world, 40, 2, 2, persist); // put → store.puts === 1

    const world2 = new World(); // "page reload": fresh world + fresh persistence, same store
    const persist2 = new Persistence(store, TERRAIN_SEED);
    await persist2.boot(); // the key set now contains 1234:0,1,2

    const r = update(world2, 2, 2, 2, persist2);
    expect(world2.hasChunk(0, 1, 2)).toBe(false); // not yet — the fetch is async
    expect(r.pending).toContainEqual({ cx: 0, cy: 1, cz: 2 });
    expect(r.rebuilt.some((c) => c.cx === 0 && c.cy === 1 && c.cz === 2)).toBe(false); // D3: no generation over a known record

    const rec = await persist2.fetchRecord(0, 1, 2); // main.ts's pending loop
    expect(rec).toBeDefined();
    applyRecord(world2, rec!);
    expect(world2.getBlock(8, 20, 40)).toBe(b);
    expect(world2.getChunk(0, 1, 2)!.settled).toBe(true);
  });

  it('G: confirmed miss — a chunk with no record still generates terrain, budgets intact', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot(); // empty store → empty key set
    const world = new World();
    const r = update(world, 2, 2, 2, 2, persist);
    expect(r.rebuilt).toEqual([{ cx: 2, cy: 2, cz: 2 }]);
    expect(r.restored).toEqual([]);
    expect(r.pending).toEqual([]);
    expect(world.count()).toBe(1);
  });
});
```

**Step 2: Implement** — `src/streaming.ts` changes (keep the top comment block and
the budget comments; `markNeighborsDirty` becomes `export`):

```ts
import { chunkKey, type Chunk, type World } from './world';
import { applyRecord, type PersistSource } from './persistence';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from './terrain';
```

`StreamingUpdate` gains:

```ts
  restored: Coord[]; // chunks restored from a WARM persistence record this call (applied
                     // inline): main.ts runs sim.restore + lightSim.load + deferredFirstMesh
                     // (no settle — settled is already true)
  pending: Coord[];  // in the persistence key set but not warm: main.ts fetches async
                     // (fetchRecord → applyRecord → sim.restore + lightSim.load +
                     // deferredFirstMesh); not loaded or generated this call
```

`update` signature + load pass:

```ts
export function update(world: World, pcx: number, pcz: number, pcy = 2, persist?: PersistSource): StreamingUpdate {
  const rebuilt: Coord[] = [];
  const restored: Coord[] = [];
  const pending: Coord[] = [];
  const unloaded: Coord[] = [];
  const done = new Set<string>();

  const missed: Coord[] = [];
  for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
    for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
      for (let cy = CY_MIN; cy <= CY_MAX; cy++) {
        const cx = pcx + dx, cz = pcz + dz;
        if (world.hasChunk(cx, cy, cz)) continue;
        const rec = persist?.syncRecord(cx, cy, cz);
        if (rec) {
          applyRecord(world, rec); // edited chunk: arrays verbatim, settled = true (D1)
          markNeighborsDirty(world, cx, cy, cz, pcx, pcz);
          restored.push({ cx, cy, cz });
          done.add(chunkKey(cx, cy, cz));
          continue;
        }
        if (persist?.hasPersisted(cx, cy, cz)) {
          pending.push({ cx, cy, cz }); // async fetch dedups in-flight; the first mesh is paced by main.ts
          continue;
        }
        missed.push({ cx, cy, cz });
      }
    }
  }
  missed.sort((a, b) => cmp(a, b, pcx, pcz, pcy));
  for (const c of missed.slice(0, LOAD_BUDGET)) {
    world.ensureChunk(c.cx, c.cy, c.cz);
    generateChunkTerrain(world, GEN, c.cx, c.cy, c.cz); // fills data, sets dirty
    markNeighborsDirty(world, c.cx, c.cy, c.cz, pcx, pcz);
    rebuilt.push(c);
    done.add(chunkKey(c.cx, c.cy, c.cz));
  }
  pending.sort((a, b) => cmp(a, b, pcx, pcz, pcy)); // deterministic fetch order (closest first)
```

(the remesh pass is unchanged; the unload pass becomes:)

```ts
  const doomed: Chunk[] = []; // Chunk (not Coord): onUnload needs the live arrays
  for (const c of world.allChunks()) {
    if (!inRange(c.cx, c.cz, pcx, pcz) || c.cy < CY_MIN || c.cy > CY_MAX) doomed.push(c);
  }
  for (const c of doomed) {
    persist?.onUnload(c); // edited-only snapshot (D4/D6): a no-op for untouched terrain
    markNeighborsDirty(world, c.cx, c.cy, c.cz, pcx, pcz);
    world.removeChunk(c.cx, c.cy, c.cz);
    unloaded.push({ cx: c.cx, cy: c.cy, cz: c.cz });
  }

  return { rebuilt, restored, pending, unloaded };
}
```

Restored chunks leave `dirty` false (as `applyRecord` sets it): their first mesh goes
through main.ts's `deferredFirstMesh`, not the remesh pass.

**Step 3: Verify**

```
npx vitest run src/__tests__/streaming.test.ts src/__tests__/persistence.test.ts src/__tests__/world.test.ts
npm test
```

E/F/G green; tests A–D unchanged green (no `persist` arg → identical behavior).

**Step 4: Commit**

```
feat: streaming persistence hook — warm inline restore, pending async restore (generation only on confirmed miss), edited-only unload snapshot
```

---

## Task 8: `persistence.test.ts` — full-path round trip + zero-put guard

**Files:** `src/__tests__/persistence.test.ts` (append; merge these imports)

```ts
import { Block, torchMeta, doorMeta } from '../blocks';
import { update } from '../streaming';
import { tickCrossed } from '../time';
```

(`TERRAIN_SEED, TerrainGen, generateChunkTerrain` from `../terrain` and `WaterSim`
from `../water` — add if not already imported by Tasks 4–6.)

**Step 1: Write the tests** — append:

```ts
describe('persistence — full path', () => {
  it('H: torch + open door survive a full unload/restore round trip (meta included)', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot();
    const world = new World();
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2); // the boot column (main.ts boot shape)

    // All three cells sit in chunk (0,0,2) (x 0..15, y 0..15, z 32..47). The round trip
    // asserts block AND meta; support presence is irrelevant to the arrays.
    world.setBlock(8, 2, 40, Block.Torch, torchMeta(0));
    world.setBlock(10, 3, 40, Block.DoorBottom, doorMeta(true, 0)); // open, X-thin
    world.setBlock(10, 4, 40, Block.DoorTop, doorMeta(true, 0));

    update(world, 40, 2, 2, persist); // walk away: the column unloads
    expect(store.puts).toBe(1); // only chunk (0,0,2) was edited

    const r = update(world, 2, 2, 2, persist); // walk back: warm cache restores (0,0,2) inline
    expect(r.restored).toContainEqual({ cx: 0, cy: 0, cz: 2 });
    expect(world.getBlock(8, 2, 40)).toBe(Block.Torch);
    expect(world.getMeta(8, 2, 40)).toBe(torchMeta(0));
    expect(world.getBlock(10, 3, 40)).toBe(Block.DoorBottom);
    expect(world.getMeta(10, 3, 40)).toBe(doorMeta(true, 0));
    expect(world.getBlock(10, 4, 40)).toBe(Block.DoorTop);
    expect(world.getMeta(10, 4, 40)).toBe(doorMeta(true, 0));
  });

  it('I: a 600-frame no-edit walk (with water settling + pulses) persists ZERO chunks', async () => {
    // D4 in action: worldgen settling and tick-heartbeat pulses queue cells, but none of
    // that work carries an edit origin, so no chunk is ever marked edited and nothing is
    // snapshotted. If a water write path leaks markEdited=true, this test fails.
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot();
    const world = new World();
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2); // main.ts boot column

    const sim = new WaterSim(world);
    const WATER_STRIDE = 30, WATER_PULSE = 1000; // main.ts tick-stride constants (ADR 0011)
    let tick = 0;
    for (let f = 0; f < 600; f++) { // 10 s at 60 fps; the player walks +x: one chunk per 60 frames
      tick++;
      const pcx = Math.floor(f / 60);
      const r = update(world, pcx, 2, 2, persist);
      for (const c of r.rebuilt) {
        sim.settle(c.cx, c.cy, c.cz); // main.ts tickStreaming: settle per rebuilt chunk
        world.getChunk(c.cx, c.cy, c.cz)!.dirty = false; // main.ts rebuildChunkMesh (mesh stubbed)
      }
      if (tickCrossed(tick - 1, tick, WATER_STRIDE)) sim.tick(WATER_PULSE); // the tick-heartbeat pulse
      for (const key of sim.touched) { // main.ts frame-end drain (remesh stubbed)
        const [cx, cy, cz] = key.split(',').map(Number);
        if (world.hasChunk(cx, cy, cz)) world.getChunk(cx, cy, cz)!.dirty = false;
      }
      sim.touched.clear();
    }
    expect(store.puts).toBe(0);
  });
});
```

**Step 2: Verify** — `npx vitest run src/__tests__/persistence.test.ts`

Integration tests over already-implemented code — expected green. **If I fails:** the
regression is in Task 4's hunks — confirm the `setState` hunk threads the origin and
passes it as the `markEdited` argument, and that settle/spread/dropColumn run with the
origin unset. Fix the hunk, not the test.

**Step 3: Commit**

```
test: persistence full path — torch/door meta round trip; 600-frame no-edit walk persists zero chunks
```

---

## Task 9: `src/__tests__/persistence-water.test.ts` — water-state round trip

**Files:** `src/__tests__/persistence-water.test.ts` (new). The riskiest surface: the
wlevel/wsource/wplaced/wstream arrays, cross-chunk flow, and a mid-drain save.

**Step 1: Write the test file**

```ts
import { describe, it, expect } from 'vitest';
import { World, localIndex } from '../world';
import { Block } from '../blocks';
import { WaterSim } from '../water';
import { update } from '../streaming';
import { TERRAIN_SEED } from '../terrain';
import { InMemoryChunkStore, Persistence, applyRecord } from '../persistence';

// Two-chunk slab (stone floor at y=0) with a player-placed spring at (12,2,8). The
// spring's flood (an edit-origin flow) crosses into chunk (1,0,0), so the round trip
// exercises the cross-chunk water state. Surrounding terrain chunks may stream in while
// walking back; worldgen water is static (it never pushes), so the slab's water state
// stays isolated, and the fingerprint is taken over the two slab chunks only.

function buildWorld(): World {
  const world = new World();
  for (const cx of [0, 1]) {
    const c = world.ensureChunk(cx, 0, 0);
    for (let lx = 0; lx < 16; lx++)
      for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, 0, lz)] = Block.Stone;
  }
  return world;
}

function springWorld(): { world: World; sim: WaterSim } {
  const world = buildWorld();
  const sim = new WaterSim(world);
  world.setBlock(12, 2, 8, Block.Water);
  sim.edit(12, 2, 8, Block.Water); // placed water = a spring
  return { world, sim };
}

function drain(sim: WaterSim, max = 100): void {
  for (let i = 0; i < max; i++) if (sim.tick(1000) === 0) return;
}

// Water fingerprint: "wx,wy,wz" → [block, wlevel, wsource, wplaced, wstream] for every
// water cell of the given chunks.
function fingerprint(world: World, ...keys: [number, number, number][]): Map<string, number[]> {
  const m = new Map<string, number[]>();
  for (const [cx, cy, cz] of keys) {
    const c = world.getChunk(cx, cy, cz);
    if (!c) continue;
    for (let i = 0; i < c.blocks.length; i++) {
      if (c.blocks[i] !== Block.Water) continue;
      const lx = i & 15, lz = (i >> 4) & 15, ly = (i >> 8) & 15;
      m.set(`${cx * 16 + lx},${cy * 16 + ly},${cz * 16 + lz}`,
        [c.blocks[i], c.wlevel[i], c.wsource[i], c.wplaced[i], c.wstream[i]]);
    }
  }
  return m;
}

function expectSameFingerprint(a: Map<string, number[]>, b: Map<string, number[]>): void {
  expect(a.size).toBe(b.size);
  for (const [k, v] of a) expect(b.get(k), `cell ${k}`).toEqual(v);
}

// Walk the ring back to the slab and rebuild sim state for everything that came back
// (mirrors main.ts tickStreaming).
async function walkBack(world: World, sim: WaterSim, persist: Persistence): Promise<void> {
  for (let i = 0; i < 500 && !(world.hasChunk(0, 0, 0) && world.hasChunk(1, 0, 0)); i++) {
    const r = update(world, 0, 0, 0, persist);
    for (const p of r.pending) {
      const rec = await persist.fetchRecord(p.cx, p.cy, p.cz);
      if (rec && !world.hasChunk(p.cx, p.cy, p.cz)) applyRecord(world, rec);
    }
    for (const c of r.restored) sim.restore(world.getChunk(c.cx, c.cy, c.cz)!);
  }
}

describe('persistence — water state', () => {
  it('A: spring flood round trip — the water state is identical after unload + restore', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot();
    const { world, sim } = springWorld();
    drain(sim);
    const before = fingerprint(world, [0, 0, 0], [1, 0, 0]);
    expect(before.size).toBeGreaterThan(0); // the spring actually flooded

    update(world, 10, 0, 0, persist); // walk away: the slab unloads
    expect(store.puts).toBe(2); // both chunks: the spring's edit + the flooded chunk (edit-origin flow)

    await walkBack(world, sim, persist);
    drain(sim);
    expectSameFingerprint(fingerprint(world, [0, 0, 0], [1, 0, 0]), before);
    for (let i = 0; i < 10; i++) sim.tick(1000); // five more sim seconds: no slow drift
    expectSameFingerprint(fingerprint(world, [0, 0, 0], [1, 0, 0]), before);
  });

  it('B: mine the spring, save mid-drain, restore — the drain finishes identically to a no-save control', async () => {
    const ctrl = springWorld();
    drain(ctrl.sim);
    ctrl.world.setBlock(12, 2, 8, Block.Air);
    ctrl.sim.edit(12, 2, 8, Block.Air); // break the spring
    drain(ctrl.sim);
    const ctrlFp = fingerprint(ctrl.world, [0, 0, 0], [1, 0, 0]);

    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, TERRAIN_SEED);
    await persist.boot();
    const { world, sim } = springWorld();
    drain(sim);
    world.setBlock(12, 2, 8, Block.Air);
    sim.edit(12, 2, 8, Block.Air);
    sim.tick(2); // partial drain: the flow has NOT reached fixpoint
    update(world, 10, 0, 0, persist); // save mid-drain
    expect(store.puts).toBe(2);
    await walkBack(world, sim, persist);
    drain(sim); // the drain continues after the restore (queue rebuilt from the saved arrays)
    expectSameFingerprint(fingerprint(world, [0, 0, 0], [1, 0, 0]), ctrlFp);
  });
});
```

**Step 2: Verify** — `npx vitest run src/__tests__/persistence-water.test.ts`

**Step 3: Commit**

```
test: persistence water round trip — spring flood byte-identical after restore; mid-drain save matches the no-save control
```

---

## Task 10: `src/idb-store.ts` — the browser backend

**Files:** `src/idb-store.ts` (new). `[POC shortcut]` not unit-tested under node (vitest
has no IndexedDB); verified manually in Task 12.

**Step 1: Write the file**

```ts
import type { StoreValue } from './persistence';

// Browser IndexedDB backend for the persistence layer (ADR 0014). One object store;
// one record per key ("seed:chunk" / "seed:__meta__"). Records carry Uint8Arrays —
// IndexedDB's structured clone stores them natively. Each operation opens its own
// transaction (the store is written at unload frequency, not per frame).
// [POC shortcut] no node tests — verified in the Task 12 browser checklist.
export class IndexedDBChunkStore {
  private readonly dbp: Promise<IDBDatabase>;

  constructor(name = 'block-world', version = 1) {
    this.dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('chunks')) req.result.createObjectStore('chunks');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return this.dbp.then((db) => new Promise<T>((resolve, reject) => {
      const t = db.transaction('chunks', mode);
      const req = run(t.objectStore('chunks'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  async get(key: string): Promise<StoreValue | undefined> {
    const r = await this.tx<StoreValue | undefined>('readonly', (s) => s.get(key) as IDBRequest<StoreValue | undefined>);
    return r ?? undefined;
  }

  async put(key: string, rec: StoreValue): Promise<void> {
    await this.tx('readwrite', (s) => s.put(rec, key));
  }

  async delete(key: string): Promise<void> {
    await this.tx('readwrite', (s) => s.delete(key));
  }

  async keys(): Promise<string[]> {
    return this.tx<string[]>('readonly', (s) => s.getAllKeys() as IDBRequest<string[]>);
  }
}
```

It satisfies `ChunkStore` structurally. Rejections propagate to `Persistence`, which
swallows them (D7).

**Step 2: Verify** — `npm run build` (typecheck; no new tests).

**Step 3: Commit**

```
feat: IndexedDB chunk store — the browser persistence backend (block-world/chunks, one record per key)
```

---

## Task 11: `main.ts` — app wiring

**Files:** `src/main.ts`. Verify with `npm run build` + `npm test` + the Task 12
manual checklist.

**Step 1: Imports** (after the `LightClient` import)

```ts
import { Persistence, applyRecord, type WorldMeta } from './persistence';
import { IndexedDBChunkStore } from './idb-store';
```

**Step 2: Persistence construction** — after the `window.__lightDebug` line:

```ts
// World persistence (ADR 0014): edited chunks snapshot to IndexedDB on unload; on boot
// the key set + meta load, and previously edited chunks restore verbatim (warm: inline,
// cold: async fetch) instead of being re-generated from terrain. Persistence swallows
// store errors internally (D7: IDB failure → session-only persistence).
let persist: Persistence;
try {
  persist = new Persistence(new IndexedDBChunkStore(), TERRAIN_SEED);
} catch {
  persist = new Persistence(null, TERRAIN_SEED); // no IndexedDB in this environment
}
window.__persistDebug = persist; // debug surface: key set, warm cache, store counters
```

**Step 3: Boot gate.** Delete the top-level boot-column loop (lines 248–249), the SPAWN
scan (272–275), `player.place(SPAWN)` (359), the profMode/noclip + `profRig` block
(360–363), `player.yaw = -Math.PI / 2` (365), the top-level `syncCamera()` call (372),
the default `hotbar.select(…)` (783), and the trailing `requestAnimationFrame(frame);`
(980). Replace with:

- In place of the SPAWN scan:

```ts
// SPAWN is computed in startGame, after the boot column exists (it may be RESTORED from
// a persisted record — the scan must read the current world state, whatever that is).
let SPAWN: THREE.Vector3;
```

- In place of the profRig block:

```ts
let profRig: ProfRig | null = null; // owned by startGame (it needs the restored player position)
```

- After the persistence block, the gate:

```ts
// === boot gate (ADR 0014) ===
// The game starts only once persistence has booted (key set + meta) — capped at 1.5 s:
// a stalled IDB must not hold the first frame hostage (the fallback starts a fresh
// world; a late meta is dropped, documented edge). startGame restores-or-generates the
// boot column, restores world state, and kicks the frame loop.
let booted = false;
async function startGame(meta: WorldMeta | null): Promise<void> {
  if (booted) return;
  booted = true;
  // T10: only the spawn column is generated up front — here it is either RESTORED (a
  // persisted, edited spawn column: arrays verbatim, settled = true, no settle) or
  // generated exactly as before (settled by the first tickStreaming's remesh path).
  for (let cy = 0; cy <= 4; cy++) {
    let rec = persist.syncRecord(0, cy, 2);
    if (!rec) rec = await persist.fetchRecord(0, cy, 2); // the record may exist but not be warm (first visit after a reload)
    if (rec) {
      applyRecord(world, rec);
      streaming.markNeighborsDirty(world, 0, cy, 2, 0, 2);
      sim.restore(world.getChunk(0, cy, 2)!);
      lightSim.load(0, cy, 2); // light is never persisted: the worker re-settles
      deferredFirstMesh.add(chunkKey(0, cy, 2));
    } else {
      const gen = new TerrainGen(TERRAIN_SEED);
      generateChunkTerrain(world, gen, 0, cy, 2); // chunk column (0,·,2) → world x 0..15, z 32..47 — contains the (T9) spawn (6,46)
      lightSim.load(0, cy, 2);
      deferredFirstMesh.add(chunkKey(0, cy, 2));
    }
  }
  // Spawn on MEASURED ground (the scan reads the boot column above — synchronous either way).
  const sx = 6, sz = 46;
  let sy = 79;
  while (sy >= 0 && !isOpaque(world.getBlock(sx, sy, sz))) sy--;
  SPAWN = new THREE.Vector3(sx + 0.5, sy + 1, sz + 0.5);
  if (meta) {
    worldTime.restore(meta.time);
    player.place({ x: meta.player.x, y: meta.player.y, z: meta.player.z });
    player.yaw = meta.player.yaw;
    player.pitch = meta.player.pitch;
    if (meta.hotbar?.slots?.length === 9) {
      for (let i = 0; i < 9; i++) hotbar.setSlot(i, meta.hotbar.slots[i]); // fires onSlotChange → icons refresh
      hotbar.select(meta.hotbar.selected ?? 0);
    }
  } else {
    player.place(SPAWN);
    player.yaw = -Math.PI / 2; // face +x (east), at the sea — the shoreline starts ~6 m from spawn
    hotbar.select(PALETTE_BLOCKS.indexOf(Block.Planks)); // default: planks, as T8's selectedBlock was
  }
  if (profMode) player.noclip = true; // the rig owns the player: pinned each frame, no physics
  profRig = profMode
    ? new ProfRig({ seed: TERRAIN_SEED, phase: meta ? worldTime.dayPhase : startPhase, render: !profNoRender, anchor: { x: player.pos.x, y: player.pos.y, z: player.pos.z } })
    : null;
  syncCamera();
  requestAnimationFrame(frame);
}
const bootGate = window.setTimeout(() => { void startGame(null); }, 1500); // fallback: a stalled boot still starts (fresh world)
void persist.boot().then((meta) => {
  window.clearTimeout(bootGate);
  void startGame(meta);
});
```

Contract: `Persistence.boot()` resolves with the loaded meta (`WorldMeta | null`) —
Task 6's implementation already does this.

**Step 4: `tickStreaming`** — replace the body:

```ts
function tickStreaming(): void {
  const r = streaming.update(world, chunkOf(player.pos.x), chunkOf(player.pos.z), chunkOf(player.pos.y), persist);
  for (const c of r.unloaded) {
    removeChunkMesh(c.cx, c.cy, c.cz);
    lightSim.unload(c.cx, c.cy, c.cz); // the worker re-seeds the surviving seams (the darkness wave)
    pendingRebuild.delete(chunkKey(c.cx, c.cy, c.cz)); // don't re-mesh a chunk we just unloaded
    deferredFirstMesh.delete(chunkKey(c.cx, c.cy, c.cz)); // it may still be waiting for its first mesh
  }
  if (r.unloaded.length) persist.saveMeta(metaSnapshot()); // the world just changed durably (a chunk left): refresh the save point
  for (const c of r.rebuilt) {
    sim.settle(c.cx, c.cy, c.cz); // POC form of worldgen-fluid settling: settle BEFORE meshing so the new chunk's mesh already shows flooded caves. The settled flag makes re-settling a re-meshed chunk a no-op. settle() never clears sim.touched: cross-seam marks from any settle this frame survive here and to the end-of-frame drain below, which re-meshes them.
    lightSim.load(c.cx, c.cy, c.cz); // the worker settles it; the fields land with the tick reply
    deferredFirstMesh.add(chunkKey(c.cx, c.cy, c.cz)); // ADR 0012: the first/fresh mesh waits a guaranteed frame (replies are macrotasks — a load-frame drain would mesh from still-zero light); the frame end moves it into pendingRebuild after the first reply has landed
  }
  for (const c of r.restored) {
    const ch = world.getChunk(c.cx, c.cy, c.cz)!;
    sim.restore(ch); // D1: water restored as-is (settled = true) — rebuild springs/waiting/queue, NO settle
    lightSim.load(c.cx, c.cy, c.cz); // light is never persisted: the worker re-settles the chunk
    deferredFirstMesh.add(chunkKey(c.cx, c.cy, c.cz)); // first mesh of the restored chunk, same pacing as a load
  }
  for (const c of r.pending) {
    // Cold restore: the record is known (key set) but not warm. Fetch async; apply when
    // it lands (deduped in Persistence, so per-frame re-pending is cheap). A failed/stale
    // fetch drops the key → the next update() generates the chunk fresh (confirmed miss).
    void persist.fetchRecord(c.cx, c.cy, c.cz).then((rec) => {
      if (!rec) { persist.dropPersisted(c.cx, c.cy, c.cz); return; }
      if (world.hasChunk(c.cx, c.cy, c.cz)) return; // a duplicate in-flight fetch applied it first
      applyRecord(world, rec);
      streaming.markNeighborsDirty(world, c.cx, c.cy, c.cz, chunkOf(player.pos.x), chunkOf(player.pos.z));
      const ch = world.getChunk(c.cx, c.cy, c.cz)!;
      sim.restore(ch);
      lightSim.load(c.cx, c.cy, c.cz);
      deferredFirstMesh.add(chunkKey(c.cx, c.cy, c.cz));
    });
  }
}
```

**Step 5: `metaSnapshot` + save-on-hide** — after `tickStreaming`:

```ts
function metaSnapshot(): WorldMeta {
  return {
    v: 1,
    seed: TERRAIN_SEED,
    player: { x: player.pos.x, y: player.pos.y, z: player.pos.z, yaw: player.yaw, pitch: player.pitch },
    time: worldTime.snapshot(),
    hotbar: { slots: [...hotbar.slots], selected: hotbar.selected },
  };
}

// D6 crash window: unload snapshots cover loaded-chunk edits only when a chunk unloads
// (or on hide); a hard tab kill loses edits made since then. The meta is cheap — save on
// hide and on pagehide, and flush the store's pending puts.
const saveAndFlush = (): void => {
  persist.saveMeta(metaSnapshot());
  void persist.flush();
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveAndFlush(); });
window.addEventListener('pagehide', saveAndFlush);
```

**Step 6: Verify** — `npm test && npm run build` (typecheck catches moved symbols).

**Step 7: Commit**

```
feat: main.ts persistence wiring — boot gate, boot-column restore, restored/pending streaming paths, meta save on unload + hide
```

---

## Task 12: Gates + manual acceptance

**Step 1:** `npm test` — all green, including `water-load.test.ts` (PIN 1,231,601 /
10,690 — the restore path never settles; the `process` prototype patch stays
compatible with the new optional origin arg).

**Step 2:** `npm run build` (produces `dist/`), then `npm run prof` — the remesh rig
(`?prof=remesh`) runs through the boot gate with an empty store; behavior must be
identical to pre-persistence. If the rig's timing shifts, the boot gate is the
suspect (it should resolve in <10 ms with an empty store).

**Step 3: Manual browser acceptance** (`npm run dev`)

1. Dig a block, walk >2 chunks away, walk back: the edit survived; surrounding
   terrain untouched.
2. Place a torch + a door (leave the door open), reload the page: both restored
   (torch light, open state).
3. Place water (spring) straddling a chunk boundary, let it flood both chunks, walk
   away and back: the pool is identical.
4. Break the spring mid-drain, walk away and back: the drain continues and lands on
   the same resting state.
5. Reload the page: player position, time of day, and hotbar slots/selection restored.
6. DevTools → Application → IndexedDB → `block-world` → `chunks`: ~24 KB records keyed
   `1234:<cx,cy,cz>` plus one `1234:__meta__`; the record count equals the number of
   edited chunks.
7. Console: `window.__persistDebug` exposes the key set, warm cache, and store counters.
8. Walk pristine terrain for 60 s: the chunk store gains zero records.

**Step 4:** Fix anything that fails (commit per fix).

---

## Task 13: Docs — ADR 0014, TODO, README, PROJECT.md

**Files:** `docs/adr/0014-world-persistence.md` (new), `docs/adr/README.md`,
`TODO.md`, `README.md`, `PROJECT.md`.

**Step 1:** Write `docs/adr/0014-world-persistence.md` (Context / Decision /
Alternatives / Consequences), added to the ADR README table as the last row
(matching the existing row format). Content: the record shape (six arrays, ~24 KB,
no light, `v: 1`, future sync payload); storage (IndexedDB `block-world` v1 /
`chunks`, InMemory for tests, warm cache 512 `[POC shortcut]`, boot key-set preload,
fetch dedup, flush); the edit gate (D4, origin tracking, zero-persist); the load path
(warm inline / pending async / confirmed miss only — stricter than generate-and-discard
because the key preload makes pre-arrival generation impossible); water restore (D1
verbatim + `settled = true`, D2 waiting rebuilt, seam re-marks, springs from
`wplaced`); save points (unload + hide + pagehide + flush, crash window `[POC
shortcut]`); the boot gate (1.5 s cap, late meta dropped). Alternatives: diff store,
persisting queue/waiting, settled-flag-gated restore, periodic whole-world snapshot,
full async load path (the endgame — the record is that payload). Consequences: ~24 KB
raw (compression follow-up), warm cap, boot cost, crash window, record frozen at v:1,
pin untouched, light-persistence TODO resolved by decision.

**Step 2:** `TODO.md` — reword the light-persistence line to "Light fields are
intentionally NOT persisted (ADR 0014): the worker re-settles every restored chunk."
and add a `## Persistence (ADR 0014)` section with the follow-ups: compress
ChunkRecords (RLE/brotli); full async load path (fetch-first streaming reusing the
worldgen worker; the record is the sync payload); crash window (interval snapshots);
warm cache byte-budgeted LRU; boot key-set growth (IDB index on the seed prefix).

**Step 3:** `README.md` — one Features bullet, matching the existing style:

```
- **World persistence** — edited chunks snapshot to IndexedDB on unload and restore verbatim (water state included) across reloads; light recomputes on load (ADR 0014).
```

**Step 4:** `PROJECT.md` §12 — a superseded note pointing at ADR 0014.

**Step 5: Verify** — `npm test && npm run build` (docs only).

**Step 6: Commit**

```
docs: ADR 0014 — world persistence; TODO follow-ups; README feature; PROJECT.md §12 pointer
```

---

## Self-review

- **Spec coverage:** task-brief requirements → tasks: edit save/restore (2, 6, 7, 11),
  water state exactness (4, 5, 9), torch/door meta (8-H), player/time/hotbar meta
  (3, 11), load-path budget (8-I guard, 12), zero cost when untouched (8-I), storage
  backend (10), ADR (13). Every decision D1–D7 has at least one test or a documented
  `[POC shortcut]` tag.
- **Placeholders:** none — every task carries full code or verbatim edit targets.
- **Name consistency:** `PersistSource`/`ChunkRecord`/`WorldMeta`/`StoreValue`/
  `Persistence`/`InMemoryChunkStore`/`applyRecord`/`snapshotChunk`/`chunkRecordKey`/
  `metaKey` used identically across Tasks 6–11; `WorldMeta` fields match
  `metaSnapshot()`; `WaterSim.restore(chunk)`, `WorldTime.snapshot()/restore()`,
  `Hotbar.setSlot/select` match the implemented signatures.
- **Pins:** water-load PIN 1,231,601 / 10,690 must not move (restore never settles;
  `editQueue` empty in the no-edit replay → queue membership/order unchanged;
  `stats.queueAdds` counting unchanged).
- **Known risks:** (a) boot-gate race — a meta resolving after the 1.5 s fallback is
  dropped (documented in the ADR); (b) IndexedDB under node — POC shortcut, manual
  verification only; (c) prof-rig timing through the boot gate — Task 12 step 2;
  (d) `Persistence.boot()` must resolve with the meta — Task 6 already does.
- **Execution order:** Tasks run in number order; Task 8/9 are integration tests over
  Tasks 2–7 (expected green; failures point at the named hunks). Branch
  `chunk-persistence` is created in Task 1 before any file write.