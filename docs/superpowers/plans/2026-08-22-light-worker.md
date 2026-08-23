# Light Web-Worker Offload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the light sim's settle/propagation off the main thread — a pin-identical
`LightSim` running in a web worker over a mirror of the chunk fields, fed by a
tick-numbered structured-clone protocol — so the 459,134-pop boot cascade and cave
propagation churn the renderer's critical path no longer does (the TODO item "Web-worker
offload of settle/propagation"; ADR 0007's open follow-up).

**Architecture:** `src/light.ts` stays pin-identical — the sole deliberate change is
`settleChunk` marking a fresh settle `touched` (705c663: prefill writes the fields without
a pop, so a settle with zero pop-driven changes — an open flat surface, an isolated load —
never entered a worker reply and the main copy stayed zero: the dark-surface bug; the mark
adds no pops/fields, both pins preserved) — and the engine's only world call is
`world.getChunk()`, so a `MirrorWorld` of chunk-shaped objects is a complete stand-in,
instantiated as `new LightSim(mirror as unknown as World)` — the single localized cast).
`src/light-worker-core.ts` holds all worker logic (`LightWorkerState.handle(msg)`,
node-importable so vitest drives it without a `Worker`); `src/light-worker.ts` is ~10
lines of `self.onmessage` plumbing Vite bundles as the worker chunk; `src/light-transport.ts`
is the main-thread `LightClient` (spawns the worker, posts `load`/`unload`/`edit`/`tick`
stamped with `WorldTime.tick` — the ADR 0011 seam — and applies replies via a pure
`applyLightResult`); `src/light-protocol.ts` is the shared message types. Main-thread
integrated: the touched merge is unchanged (frame N's re-mesh consumes the reply to
tick N−1 — one frame late, safe by the existing self-correcting-lower-bound argument),
and a newly loaded chunk's **first mesh is deferred** to the frame-end budgeted re-mesh
path so it appears fully lit 1–2 frames later instead of dark-and-flashing. Budgets
(`LIGHT_TICK_BUDGET = 512`/frame, `LIGHT_SETTLE_GUARD = 512` inline) and the drain cadence
are unchanged — behavioral parity. Determinism is by construction (same event sequence,
same FIFO order, one in-flight tick) and pinned by a new boot-replay equivalence test that
drives the same sequence through the protocol and asserts identical fields + the same
**459,134** pops. SharedArrayBuffer is the back-pocket optimization (ADR 0012 records it
with its revisit condition), not the design. The sibling water-worker design doc is written
alongside and reviewed at project end.

**Tech Stack:** TypeScript (strict; sim modules pure — no three.js), Vitest (node — no
`Worker`), Vite 5 (bundles module workers via `new Worker(new URL(...))` with no config
change), static GitHub Pages deploy (`scripts/deploy-gh-pages.mjs` — no custom headers,
hence structured clone, not SAB).

**Pre-change baselines (measured 2026-08-22, commit `10ad45c`):**

- Full suite: **15 files / 158 tests** green.
- Light boot lineage: **459,134** pops (`src/__tests__/light-load.test.ts`) — preserved by
  this work (drain cadence unchanged; 705c663's touched-mark adds no pops); must stay green
  as-is.
- Water boot lineage: **10,690** processes (`src/__tests__/water-load.test.ts`) — untouched
  (the water sim is out of scope).
- `npm run build` clean. **Known pre-existing deploy breakage this plan fixes:**
  `scripts/deploy-gh-pages.mjs` renames *every* `.js` in `dist/assets/` to `index.js` —
  with a worker chunk emitted, that clobbers the assets. Task 8 fixes it.
- ADR 0011's worker seam: `WorldTime.tick` is the canonical heartbeat and "the off-thread
  light project will carry tick numbers in its message protocol" (`docs/adr/0011-simulation-clocks.md:75`,
  follow-up at `:113`).

**Repo conventions the engineer must follow:**

- Commit style (from `git log`): `feat:` / `perf:` / `refactor:` / `test:` / `docs:` /
  `docs(adr):` / `chore:` + a descriptive sentence. One commit per task (Task 7 and Task 11
  are verification-only: no commit).
- ADR house style (`docs/adr/README.md`): Status / Last updated / Sources / Context /
  Decision / Alternatives considered / Consequences; pinned constants and numbers verbatim;
  no reference engine named.
- Type-only imports use the inline `type` modifier (house style, e.g. `streaming.ts:1`):
  `isolatedModules` is on.
- Tests live in `src/__tests__/` (`vitest run`; no config file — default include).

## File structure

| File | Responsibility | Change |
|---|---|---|
| `src/light.ts` | the light engine | **pin-identical** — sole change: `settleChunk` marks fresh settles `touched` (705c663); no pops/fields |
| `src/light-protocol.ts` | the message protocol (types only) | **new** |
| `src/light-worker-core.ts` | worker logic: `MirrorWorld` + `LightWorkerState` (node-importable) | **new** |
| `src/light-worker.ts` | thin worker entry (`self.onmessage` plumbing) | **new** |
| `src/light-transport.ts` | main side: `applyLightResult` (pure) + `LightClient` (spawns the worker) | **new** |
| `src/main.ts` | frame loop / edit / streaming wiring | import swap, client construction, 3 call-site renames, first-mesh deferral, `__lightDebug`, 4 comment updates |
| `src/world.ts` | `Chunk` fields | comments only (`colSum`/`lightSettled`/`blight`/`skylight` now worker-owned in production) |
| `src/__tests__/light-worker-core.test.ts` | protocol-level unit + edge tests + the boot-replay equivalence test | **new** |
| `src/__tests__/light-transport.test.ts` | main-side apply tests | **new** |
| `scripts/deploy-gh-pages.mjs` | gh-pages deploy | rename only the index.html-referenced entry assets (worker chunks keep hashed names) |
| `docs/adr/0012-light-worker.md` | the decision record | **new** |
| `docs/adr/0007-dynamic-lighting.md` | Dynamic lighting ADR | worker follow-up struck through + pointer; `Last updated` bumped |
| `docs/adr/0011-simulation-clocks.md` | Simulation clocks ADR | the off-thread follow-up marked consumed by ADR 0012; `Last updated` bumped |
| `docs/adr/README.md` | ADR index | 0012 row appended |
| `TODO.md` | open items | "Web-worker offload of settle/propagation" line removed |
| `docs/superpowers/specs/2026-08-22-water-worker-design.md` | sibling project design (draft) | **new** (draft, living) |
| `docs/superpowers/` | working docs (this spec + plan, the simulation-clocks spec/plan, the water draft) | **removed as the last commit before merge** (user instruction 2026-08-22: ephemeral; ADRs are the durable record; everything stays recoverable via `git show`) |

---

### Task 1: protocol module (`src/light-protocol.ts`)

**Files:**
- Create: `src/light-protocol.ts`

Types only — no logic to TDD; verified by the typecheck.

- [ ] **Step 1: Write the module**

Create `src/light-protocol.ts`:

```ts
// The message protocol between the main thread and the light worker (ADR 0012).
//
// Tick numbers come from WorldTime.tick (ADR 0011's worker seam): the engine does not
// read them (the light drain is a per-frame budget, not a clocked system) — they are the
// protocol's ordering/debug axis. FIFO both ways; one `result` reply per `tick` message
// (even when empty). No transfer lists: every array is structured-cloned by postMessage
// (main keeps ownership of blocks/meta; the worker keeps its light fields).

export interface LoadMsg {
  t: 'load';
  tick: number;
  cx: number; cy: number; cz: number;
  blocks: Uint8Array; // 4096 — a clone of the chunk's block ids at load time
  meta: Uint8Array;   // 4096 — a clone of the chunk's per-cell meta at load time
}

export interface UnloadMsg {
  t: 'unload';
  tick: number;
  cx: number; cy: number; cz: number;
}

export interface EditMsg {
  t: 'edit';
  tick: number;
  x: number; y: number; z: number;
  block: number; // the new block id (post world.setBlock) — the mirror is stale without it
  meta: number;  // the new per-cell meta
}

export interface TickMsg {
  t: 'tick';
  tick: number;
  budget: number; // pops to drain (main's LIGHT_TICK_BUDGET)
}

export type LightMsg = LoadMsg | UnloadMsg | EditMsg | TickMsg;

export interface ChangedChunk {
  cx: number; cy: number; cz: number;
  blight: Uint8Array;   // 4096 — a snapshot of the mirror's field at reply time
  skylight: Uint8Array; // 4096
}

export interface LightResult {
  t: 'result';
  tick: number;
  queue: number; // queueSize() after this drain (watch it reach 0 — the acceptance check)
  changed: ChangedChunk[]; // chunks touched since the previous reply (whole fields, not deltas)
  stats: { pops: number; seeds: number; fieldChanges: number }; // cumulative, from the engine's stats block
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npm run build`
Expected: clean (tsc + vite; the module is unused so far — that's fine, it's a type module).

- [ ] **Step 3: Commit**

```bash
git add src/light-protocol.ts
git commit -m "feat: light worker protocol — tick-numbered load/unload/edit/tick + whole-field result replies (ADR 0012 design)"
```

---

### Task 2: worker core — `MirrorWorld` + `LightWorkerState` (TDD)

**Files:**
- Create: `src/light-worker-core.ts`
- Test: `src/__tests__/light-worker-core.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/light-worker-core.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { World, chunkKey, localIndex } from '../world';
import { Block } from '../blocks';
import { LightSim } from '../light';
import { LightWorkerState } from '../light-worker-core';
import type { LightMsg } from '../light-protocol';

function chunkMsg(world: World, cx: number, cy: number, cz: number, tick: number): LightMsg {
  const c = world.getChunk(cx, cy, cz)!;
  return { t: 'load', tick, cx, cy, cz, blocks: c.blocks.slice(), meta: c.meta.slice() };
}

describe('light worker core (the protocol driving an unmodified LightSim over a mirror)', () => {
  it('push content: a torch chunk settles, the reply carries its fields, and the idle reply is empty', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    world.setBlock(8, 8, 8, Block.Torch);
    const state = new LightWorkerState();
    state.handle(chunkMsg(world, 0, 0, 0, 1));
    const r1 = state.handle({ t: 'tick', tick: 2, budget: 100_000 })!;
    expect(r1.changed.map((c) => chunkKey(c.cx, c.cy, c.cz))).toEqual([chunkKey(0, 0, 0)]);
    const pushed = r1.changed[0];
    expect(pushed.blight[localIndex(8, 8, 8)]).toBe(14); // the torch's own cell
    expect(pushed.blight[localIndex(9, 8, 8)]).toBe(13); // one step out in the open air
    expect(pushed.skylight[localIndex(8, 8, 8)]).toBe(15); // open column
    expect(r1.queue).toBe(0);
    // an idle tick: still exactly one reply, empty changed, cumulative stats unchanged
    const r2 = state.handle({ t: 'tick', tick: 3, budget: 100_000 })!;
    expect(r2.changed).toEqual([]);
    expect(r2.stats).toEqual(r1.stats);
  });

  it('edit: a torch placed after load lights the mirror (the message carries the new block+meta)', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    const state = new LightWorkerState();
    state.handle(chunkMsg(world, 0, 0, 0, 1));
    // main does world.setBlock, then the edit — the mirror needs the new (block, meta)
    world.setBlock(8, 8, 8, Block.Torch);
    state.handle({ t: 'edit', tick: 2, x: 8, y: 8, z: 8, block: world.getBlock(8, 8, 8), meta: world.getMeta(8, 8, 8) });
    const r = state.handle({ t: 'tick', tick: 3, budget: 100_000 })!;
    const pushed = r.changed.find((c) => c.cx === 0 && c.cy === 0 && c.cz === 0);
    expect(pushed, 'the edited chunk is pushed').toBeDefined();
    expect(pushed!.blight[localIndex(8, 8, 8)]).toBe(14);
    expect(pushed!.blight[localIndex(9, 8, 8)]).toBe(13);
    // the edit applied to the mirror's block data too
    expect(state.chunk(0, 0, 0)!.blocks[localIndex(8, 8, 8)]).toBe(Block.Torch);
  });

  it('unload: the surviving chunk\'s fields darken exactly as the direct engine darkens them', () => {
    const world = new World();
    const left = world.ensureChunk(0, 0, 0);
    world.ensureChunk(1, 0, 0);
    world.setBlock(16, 8, 8, Block.Torch); // in the right chunk, one cell right of the seam
    // capture the worker's load data from the live world first (as main.ts's client would —
    // the direct path below removes the chunk from the world)
    const right = world.getChunk(1, 0, 0)!;
    const rightData = { blocks: right.blocks.slice(), meta: right.meta.slice() };

    const direct = new LightSim(world);
    direct.settleChunk(0, 0, 0);
    direct.settleChunk(1, 0, 0);
    direct.tick(100_000);

    // main.ts order: streaming removes the chunk from the world, THEN onChunkUnloaded
    world.removeChunk(1, 0, 0);
    direct.onChunkUnloaded(1, 0, 0);
    direct.tick(100_000); // the darkness wave through the left chunk

    const state = new LightWorkerState();
    state.handle(chunkMsg(world, 0, 0, 0, 1));
    state.handle({ t: 'load', tick: 2, cx: 1, cy: 0, cz: 0, blocks: rightData.blocks, meta: rightData.meta });
    state.handle({ t: 'tick', tick: 3, budget: 100_000 })!;
    state.handle({ t: 'unload', tick: 4, cx: 1, cy: 0, cz: 0 })!;
    const r = state.handle({ t: 'tick', tick: 5, budget: 100_000 })!;

    const pushedLeft = r.changed.find((c) => c.cx === 0 && c.cz === 0);
    expect(pushedLeft, 'the surviving chunk is pushed (its seam darkened)').toBeDefined();
    expect(Array.from(pushedLeft!.blight)).toEqual(Array.from(left.blight));
    expect(Array.from(pushedLeft!.skylight)).toEqual(Array.from(left.skylight));
    expect(r.changed.find((c) => c.cx === 1), 'the unloaded chunk is not pushed').toBeUndefined();
    expect(state.chunk(1, 0, 0), 'the mirror dropped the chunk').toBeUndefined();
  });

  it('edit targeting a chunk absent from the mirror: no crash, nothing changes', () => {
    const state = new LightWorkerState();
    state.handle({ t: 'edit', tick: 1, x: 100, y: 5, z: 100, block: Block.Stone, meta: 0 });
    const r = state.handle({ t: 'tick', tick: 2, budget: 100_000 })!;
    expect(r.changed).toEqual([]);
    expect(r.stats.pops).toBe(0);
  });

  it('duplicate load (the remesh path): seam-only re-settle, same pops and fields as the direct engine', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    const direct = new LightSim(world);
    direct.settleChunk(0, 0, 0); // same sequence as the worker: chunk 0 settles while chunk 1 is absent
    world.ensureChunk(1, 0, 0);
    world.setBlock(16, 8, 8, Block.Torch);
    direct.settleChunk(1, 0, 0);
    direct.tick(100_000);

    const state = new LightWorkerState();
    state.handle(chunkMsg(world, 0, 0, 0, 1));
    state.handle(chunkMsg(world, 1, 0, 0, 2)); // initial load: torch A only
    state.handle({ t: 'tick', tick: 3, budget: 100_000 })!;

    world.setBlock(17, 8, 8, Block.Torch); // content changed between the initial load and the remesh
    direct.settleChunk(1, 0, 0); // a remesh: lightSettled => seam-only
    direct.tick(100_000);
    state.handle(chunkMsg(world, 1, 0, 0, 4)); // the duplicate load carries the new torch
    state.handle({ t: 'tick', tick: 5, budget: 100_000 })!;

    expect(state.stats.pops, 'same sequence, same pops').toBe(direct.stats.pops);
    for (const [cx, cy, cz] of [[0, 0, 0], [1, 0, 0]] as const) {
      const m = state.chunk(cx, cy, cz)!;
      const c = world.getChunk(cx, cy, cz)!;
      expect(Array.from(m.blight)).toEqual(Array.from(c.blight));
      expect(Array.from(m.skylight)).toEqual(Array.from(c.skylight));
    }
    expect(state.chunk(1, 0, 0)!.blocks[localIndex(1, 8, 8)], 'the duplicate load re-synced the mirror with the changed content').toBe(Block.Torch);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/__tests__/light-worker-core.test.ts`
Expected: FAIL — `Cannot find module '../light-worker-core'` (import error).

- [ ] **Step 3: Write the implementation**

Create `src/light-worker-core.ts`:

```ts
// The light worker's logic (ADR 0012): an unmodified LightSim running over a mirror of the
// loaded chunks' fields. Kept node-importable (no Worker/self references) so vitest can
// drive handle() directly — the Worker entry (src/light-worker.ts) is thin plumbing.
// Determinism by construction: the engine sees the same event sequence in the same order
// as the main thread's inline calls (FIFO both ways, one in-flight tick), so the pop
// sequence — and the 459,134 boot lineage — is preserved (pinned by light-worker-core.test.ts).

import { LightSim, type LightStats } from './light';
import { CHUNK_SIZE, CHUNK_VOL, chunkKey, chunkOf, localIndex, type World } from './world';
import type { ChangedChunk, LightMsg, LightResult } from './light-protocol';

/** A structural twin of world.ts's Chunk for the fields LightSim touches (nothing else). */
export interface MirrorChunk {
  cx: number; cy: number; cz: number;
  blocks: Uint8Array;
  meta: Uint8Array;
  blight: Uint8Array;
  skylight: Uint8Array;
  colSum: Uint8Array;
  lightSettled: boolean;
}

/** The world stand-in: the only method the engine ever calls is getChunk. */
export class MirrorWorld {
  private readonly chunks = new Map<string, MirrorChunk>();

  getChunk(cx: number, cy: number, cz: number): MirrorChunk | undefined {
    return this.chunks.get(chunkKey(cx, cy, cz));
  }

  /** The mirror's loaded-chunk count. */
  get size(): number { return this.chunks.size; }

  /** Fresh installs get zeroed light fields; duplicates (the remesh path) refresh blocks/meta in place. */
  load(cx: number, cy: number, cz: number, blocks: Uint8Array, meta: Uint8Array): void {
    const key = chunkKey(cx, cy, cz);
    const c = this.chunks.get(key);
    if (c) {
      c.blocks.set(blocks);
      c.meta.set(meta);
      return;
    }
    this.chunks.set(key, {
      cx, cy, cz,
      blocks: blocks.slice(),
      meta: meta.slice(),
      blight: new Uint8Array(CHUNK_VOL),
      skylight: new Uint8Array(CHUNK_VOL),
      colSum: new Uint8Array(256),
      lightSettled: false,
    });
  }

  unload(cx: number, cy: number, cz: number): void {
    this.chunks.delete(chunkKey(cx, cy, cz));
  }

  /** The world.setBlock equivalent — before the engine call, exactly like main.ts's order. */
  applyEdit(x: number, y: number, z: number, block: number, meta: number): void {
    const c = this.getChunk(chunkOf(x), chunkOf(y), chunkOf(z));
    if (!c) return; // an edit targeting an unloaded chunk: the engine no-ops too
    const i = localIndex(x - c.cx * CHUNK_SIZE, y - c.cy * CHUNK_SIZE, z - c.cz * CHUNK_SIZE);
    c.blocks[i] = block;
    c.meta[i] = meta;
  }
}

export class LightWorkerState {
  private readonly world: MirrorWorld = new MirrorWorld();
  // The engine is typed against World; the mirror is a structural stand-in (its getChunk
  // returns the chunk shape the engine reads). The single localized cast — src/light.ts
  // stays pin-identical (its node tests and the 459,134 pin preserved; the sole change is
  // settleChunk's fresh-settle touched mark, 705c663).
  private readonly sim: LightSim = new LightSim(this.world as unknown as World);

  /** A read accessor for tests. */
  chunk(cx: number, cy: number, cz: number): MirrorChunk | undefined {
    return this.world.getChunk(cx, cy, cz);
  }

  /** The mirror's loaded-chunk count (the world↔mirror 1:1 guard in the boot-replay test). */
  get chunkCount(): number {
    return this.world.size;
  }

  get stats(): LightStats {
    return this.sim.stats;
  }

  /** Apply one protocol message; the `tick` message returns the reply, the others null. */
  handle(msg: LightMsg): LightResult | null {
    switch (msg.t) {
      case 'load': {
        this.world.load(msg.cx, msg.cy, msg.cz, msg.blocks, msg.meta);
        this.sim.settleChunk(msg.cx, msg.cy, msg.cz); // colSum maintained; fresh = prefill+frontier, remesh = seam-only
        return null;
      }
      case 'unload': {
        this.world.unload(msg.cx, msg.cy, msg.cz); // remove FIRST — streaming removes the chunk before onChunkUnloaded
        this.sim.onChunkUnloaded(msg.cx, msg.cy, msg.cz);
        return null;
      }
      case 'edit': {
        // main.ts only edits loaded chunks (raycast hit): a message for a chunk absent from the
        // mirror is a TRUE no-op. (Unguarded, the engine's edit() would still seed 7 phantom
        // cells — seed() counts unconditionally — so the worker guards instead of replaying
        // impossible work.)
        if (!this.world.getChunk(chunkOf(msg.x), chunkOf(msg.y), chunkOf(msg.z))) return null;
        this.world.applyEdit(msg.x, msg.y, msg.z, msg.block, msg.meta);
        this.sim.edit(msg.x, msg.y, msg.z);
        return null;
      }
      case 'tick': {
        this.sim.tick(msg.budget);
        const changed: ChangedChunk[] = [];
        for (const key of this.sim.touched) {
          const [cx, cy, cz] = key.split(',').map(Number) as [number, number, number];
          const c = this.world.getChunk(cx, cy, cz);
          if (!c) continue; // touched then unloaded before this reply: nothing to push (the apply guards too)
          changed.push({ cx, cy, cz, blight: c.blight.slice(), skylight: c.skylight.slice() });
        }
        this.sim.touched.clear(); // the once-per-frame consume — the worker is the engine's "main"
        return {
          t: 'result',
          tick: msg.tick,
          queue: this.sim.queueSize(),
          changed,
          stats: { pops: this.sim.stats.pops, seeds: this.sim.stats.seeds, fieldChanges: this.sim.stats.fieldChanges },
        };
      }
    }
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/light-worker-core.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the full suite (the engine tests must be untouched-green)**

Run: `npm test`
Expected: 16 files / 163 tests passed (15 + 1 new file, 158 + 5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/light-worker-core.ts src/__tests__/light-worker-core.test.ts
git commit -m "feat: LightWorkerState — the unmodified LightSim over a chunk-field mirror (protocol-driven, node-testable; push content + edge behavior)"
```

---

### Task 3: boot-replay equivalence test (the determinism pin through the protocol)

**Files:**
- Modify: `src/__tests__/light-worker-core.test.ts` (append a second `describe`)

The test re-drives the production boot sequence (the exact replay of
`light-load.test.ts` — same spawn ring, same streaming loop, same collapsed 100,000-pop
drains) through BOTH paths: (a) the engine inline on the world (today's main thread) and
(b) the same ops through the protocol. Identical final fields — and pinned per-path
lineages: the direct replay pins the engine's 459,134 (a faithful light-load.test.ts
replica), the worker path its own 434,883 (the one-time redundant boot wave the mirror
skips; see the test's rationale comment).

- [ ] **Step 1: Append the test**

Append to `src/__tests__/light-worker-core.test.ts` (extend the import lines first — add
`chunkOf` to the `../world` import, `TERRAIN_SEED, TerrainGen, generateChunkTerrain` from
`../terrain`, `* as streaming` from `../streaming`, and `WaterSim` from `../water`):

```ts
describe('light worker core — boot replay equivalence (identical fields; the worker-path lineage)', () => {
  it('the same boot sequence through the protocol reaches identical fields; the worker-path lineage is the inline lineage minus the one-time boot wave', () => {
    const world = new World();
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2); // main.ts:239 boot column (0,·,2)
    const water = new WaterSim(world); // settled like main.ts for sequence fidelity (light is water-blind)
    const direct = new LightSim(world); // path (a): the engine inline on the world (today's main thread)

    type Op =
      | { k: 'load'; cx: number; cy: number; cz: number; blocks: Uint8Array; meta: Uint8Array }
      | { k: 'unload'; cx: number; cy: number; cz: number }
      | { k: 'tick' };
    const ops: Op[] = [];
    const recordLoad = (cx: number, cy: number, cz: number): void => {
      const c = world.getChunk(cx, cy, cz)!; // capture the data NOW — a later-unloaded chunk is gone from the world by replay time
      ops.push({ k: 'load', cx, cy, cz, blocks: c.blocks.slice(), meta: c.meta.slice() });
    };

    water.settle(0, 2, 2); // main.ts settles the boot chunk before the first ring turn
    recordLoad(0, 2, 2);
    direct.settleChunk(0, 2, 2);

    let guard = 0;
    for (;;) {
      const r = streaming.update(world, chunkOf(6), chunkOf(46), 2); // main.ts:787 (spawn 6,46, pcy 2)
      if (r.rebuilt.length === 0 && r.unloaded.length === 0) break;
      for (const c of r.rebuilt) {
        water.settle(c.cx, c.cy, c.cz);
        recordLoad(c.cx, c.cy, c.cz);
        direct.settleChunk(c.cx, c.cy, c.cz);
        const ch = world.getChunk(c.cx, c.cy, c.cz);
        if (ch) ch.dirty = false; // main.ts:317 — rebuildChunkMesh clears dirty
      }
      for (const c of r.unloaded) {
        ops.push({ k: 'unload', cx: c.cx, cy: c.cy, cz: c.cz });
        direct.onChunkUnloaded(c.cx, c.cy, c.cz);
      }
      ops.push({ k: 'tick' });
      direct.tick(100_000); // the collapsed drain, like light-load.test.ts:35
      water.tick(100_000);
      if (++guard > 500) throw new Error('replay did not stabilize in 500 streaming calls');
    }

    // path (b): the SAME ops through the protocol
    const state = new LightWorkerState();
    let tickN = 1;
    for (const op of ops) {
      if (op.k === 'load') state.handle({ t: 'load', tick: tickN++, cx: op.cx, cy: op.cy, cz: op.cz, blocks: op.blocks, meta: op.meta });
      else if (op.k === 'unload') state.handle({ t: 'unload', tick: tickN++, cx: op.cx, cy: op.cy, cz: op.cz });
      else state.handle({ t: 'tick', tick: tickN++, budget: 100_000 });
    }

    // equivalence: every chunk's fields — the worker path reaches the identical fixpoint
    for (const c of world.allChunks()) {
      const m = state.chunk(c.cx, c.cy, c.cz);
      expect(m, `the mirror holds chunk ${c.cx},${c.cy},${c.cz}`).toBeDefined();
      expect(Array.from(m!.blight), `blight ${c.cx},${c.cy},${c.cz}`).toEqual(Array.from(c.blight));
      expect(Array.from(m!.skylight), `skylight ${c.cx},${c.cy},${c.cz}`).toEqual(Array.from(c.skylight));
    }
    // the mirror's chunk set tracks the world 1:1 — both directions (the loop above covers
    // world→mirror; a stale extra mirror chunk, e.g. a lost unload op, would show up here)
    expect(state.chunkCount, 'mirror chunk count = world chunk count').toBe(world.count());
    // lineage: pinned per path. The direct replay is a faithful light-load.test.ts replica
    // (the engine's inline regression guard); the worker path carries its own lineage —
    // identical fields, one-time −24,251 pops. The delta is the inline engine's redundant
    // pre-streaming boot wave: at the boot settleChunk(0,2,2) the real world already holds
    // all 5 boot-column chunks, so seedSeamNeighbor seeds the two adjacent siblings' 512
    // face-shell cells and cascades them through the queue — throwaway work the siblings'
    // fresh-load prefill redoes when streaming remeshes them. The mirror correctly holds
    // only the streamed chunks, so it skips the wave; after boot its chunk set tracks the
    // world 1:1 (every load/unload is mirrored): the same events drive both from there, and
    // the one-time boot wave is the only delta this replay can produce.
    expect(direct.stats.pops, 'the inline replay pins the engine lineage').toBe(459_134);
    expect(state.stats.pops, 'the worker-path lineage (the redundant boot wave is skipped)').toBe(434_883);
  }, 60_000);
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/__tests__/light-worker-core.test.ts`
Expected: PASS (6 tests). If the equivalence or the 459,134 assertion fails, the bug is in
`src/light-worker-core.ts` (the op recording mirrors `light-load.test.ts` exactly) — fix the
core, never the expected values. A changed pop count means the protocol altered the event
sequence or order.

- [ ] **Step 3: Full suite + typecheck**

Run: `npm test && npm run build`
Expected: 16 files / 164 tests passed; build clean.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/light-worker-core.test.ts
git commit -m "test: boot replay through the protocol — identical fields; worker-path lineage pinned at 434,883 (inline replica 459,134; one-time redundant boot wave skipped by the mirror)"
```

---

### Task 4: main-side apply — `applyLightResult` + `LightClient` (TDD)

**Files:**
- Create: `src/light-transport.ts`
- Test: `src/__tests__/light-transport.test.ts`

`applyLightResult` is pure (node-testable); `LightClient`'s `Worker` spawn is
browser-only plumbing (verified by the build + the manual acceptance run, Task 7).

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/light-transport.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { World, chunkKey } from '../world';
import { applyLightResult, type LightClientState } from '../light-transport';
import type { LightResult } from '../light-protocol';

function makeResult(
  changed: { cx: number; cy: number; cz: number; blight: Uint8Array; skylight: Uint8Array }[],
  pops: number,
  tick = 7,
): LightResult {
  return { t: 'result', tick, queue: 0, changed, stats: { pops, seeds: 1, fieldChanges: 1 } };
}

function freshState(): LightClientState {
  return { touched: new Set(), stats: { pops: 0, seeds: 0, fieldChanges: 0 }, queue: 0, lastTick: 0 };
}

describe('applyLightResult (the main-thread side of the worker replies)', () => {
  it('copies the pushed fields into the real chunks and fills touched + stats', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    const blight = new Uint8Array(4096);
    blight[100] = 9;
    const skylight = new Uint8Array(4096);
    skylight.fill(15);
    const state = freshState();
    applyLightResult(state, world, makeResult([{ cx: 0, cy: 0, cz: 0, blight, skylight }], 42));
    expect(Array.from(c.blight)).toEqual(Array.from(blight));
    expect(Array.from(c.skylight)).toEqual(Array.from(skylight));
    expect(state.touched).toEqual(new Set([chunkKey(0, 0, 0)]));
    expect(state.stats).toEqual({ pops: 42, seeds: 1, fieldChanges: 1 });
    expect(state.lastTick).toBe(7);
  });

  it('accumulates across replies: touched grows (the caller consumes it), stats REPLACE (they are the engine cumulative)', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    world.ensureChunk(1, 0, 0);
    const state = freshState();
    applyLightResult(state, world, makeResult([{ cx: 0, cy: 0, cz: 0, blight: new Uint8Array(4096), skylight: new Uint8Array(4096) }], 42, 7));
    applyLightResult(state, world, makeResult([{ cx: 1, cy: 0, cz: 0, blight: new Uint8Array(4096), skylight: new Uint8Array(4096) }], 420, 13));
    expect([...state.touched].sort()).toEqual([chunkKey(0, 0, 0), chunkKey(1, 0, 0)]);
    expect(state.stats).toEqual({ pops: 420, seeds: 1, fieldChanges: 1 }); // replaced, not added
    expect(state.lastTick).toBe(13);
  });

  it('a reply mixing a present and an unloaded-in-flight chunk applies the survivor and skips the gone one', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    world.ensureChunk(1, 0, 0);
    world.removeChunk(1, 0, 0); // chunk 1 was unloaded between the reply's send and now
    const state = freshState();
    const survivor = { cx: 0, cy: 0, cz: 0, blight: new Uint8Array(4096), skylight: new Uint8Array(4096) };
    survivor.blight[5] = 7;
    applyLightResult(state, world, makeResult([survivor, { cx: 1, cy: 0, cz: 0, blight: new Uint8Array(4096), skylight: new Uint8Array(4096) }], 1));
    expect(state.touched).toEqual(new Set([chunkKey(0, 0, 0)])); // the gone one is not marked
    expect(world.getChunk(0, 0, 0)!.blight[5]).toBe(7); // the survivor was applied
  });

  it('an idle reply (empty changed) still advances the bookkeeping', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    const state = freshState();
    applyLightResult(state, world, makeResult([], 99, 3));
    expect(state.touched.size).toBe(0);
    expect(state.stats).toEqual({ pops: 99, seeds: 1, fieldChanges: 1 });
    expect(state.lastTick).toBe(3);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/__tests__/light-transport.test.ts`
Expected: FAIL — `Cannot find module '../light-transport'`.

- [ ] **Step 3: Write the implementation**

Create `src/light-transport.ts`:

```ts
// The main-thread side of the light worker (ADR 0012). LightClient posts the protocol
// messages (stamped with WorldTime.tick — the ADR 0011 seam) and applies the replies: the
// touched chunks' fields are copied into the real Chunk objects (the mesher's only light
// source, world.getLight) and accumulated into `touched` — the exact consume-once-per-frame
// contract main.ts already honors (frame N's re-mesh consumes the reply to tick N-1).
// applyLightResult is pure so vitest (node, no Worker) can test it; the Worker spawn is
// browser-only plumbing (verified by the build + the manual acceptance run).

import type { LightResult } from './light-protocol';
import type { WorldTime } from './time';
import { chunkKey, type World } from './world';

export interface LightDebugStats { pops: number; seeds: number; fieldChanges: number }

/** The bookkeeping applyLightResult updates — LightClient structurally satisfies this. */
export interface LightClientState {
  touched: Set<string>; // chunk keys; consumed and cleared exactly once per frame by main.ts
  stats: LightDebugStats; // cumulative, from the engine's stats block (replaced per reply, never added)
  queue: number; // queueSize() after the last drain (watch it reach 0)
  lastTick: number; // the tick of the last applied reply
}

/** Copy one reply's pushed fields into the real chunks and update the bookkeeping. Pure. */
export function applyLightResult(state: LightClientState, world: World, r: LightResult): void {
  state.stats.pops = r.stats.pops;
  state.stats.seeds = r.stats.seeds;
  state.stats.fieldChanges = r.stats.fieldChanges;
  state.queue = r.queue;
  state.lastTick = r.tick;
  for (const ch of r.changed) {
    const c = world.getChunk(ch.cx, ch.cy, ch.cz);
    if (!c) continue; // unloaded between the reply's send and now: nothing to apply
    c.blight.set(ch.blight);
    c.skylight.set(ch.skylight);
    state.touched.add(chunkKey(ch.cx, ch.cy, ch.cz));
  }
}

declare global {
  interface Window {
    /** The debug surface: cumulative pops/seeds/fieldChanges, latest queue, lastTick, touched. Read-only by convention — it is the LIVE LightClient: console calls to its load/unload/edit/tick desync the mirror, and worker.terminate() freezes the light. */
    __lightDebug?: LightClient;
  }
}

export class LightClient implements LightClientState {
  readonly touched = new Set<string>();
  readonly stats: LightDebugStats = { pops: 0, seeds: 0, fieldChanges: 0 };
  queue = 0;
  lastTick = 0;
  private readonly world: World;
  private readonly worldTime: WorldTime;
  private readonly worker: Worker;

  constructor(world: World, worldTime: WorldTime) {
    this.world = world;
    this.worldTime = worldTime;
    this.worker = new Worker(new URL('./light-worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<LightResult>) => applyLightResult(this, world, e.data);
    // a crashed worker would otherwise freeze the light updates silently (the scene keeps
    // running on the last-applied fields) — the console error is the only diagnostic
    this.worker.onerror = (e) => { console.error('[light-worker] worker crashed — light updates are frozen', e); };
  }

  /** main.ts's settleChunk equivalent: clone the chunk's block data and settle it in the worker. */
  load(cx: number, cy: number, cz: number): void {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c) return;
    this.worker.postMessage({ t: 'load', tick: this.worldTime.tick, cx, cy, cz, blocks: c.blocks.slice(), meta: c.meta.slice() });
  }

  /** main.ts's onChunkUnloaded equivalent. */
  unload(cx: number, cy: number, cz: number): void {
    this.worker.postMessage({ t: 'unload', tick: this.worldTime.tick, cx, cy, cz });
  }

  /** main.ts's edit equivalent — call AFTER world.setBlock / a door-meta change: the new (block, meta) at (x, y, z), read live from the world (the mirror is stale without it). A pre-write call would silently capture the stale block and desync the mirror. */
  edit(x: number, y: number, z: number): void {
    this.worker.postMessage({ t: 'edit', tick: this.worldTime.tick, x, y, z, block: this.world.getBlock(x, y, z), meta: this.world.getMeta(x, y, z) });
  }

  /** main.ts's tick equivalent: drain `budget` pops in the worker (once per frame). */
  tick(budget: number): void {
    this.worker.postMessage({ t: 'tick', tick: this.worldTime.tick, budget });
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/light-transport.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck (the Worker/URL code compiles under the DOM lib)**

Run: `npm run build`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/light-transport.ts src/__tests__/light-transport.test.ts
git commit -m "feat: LightClient — main-thread transport for the light worker (tick-stamped messages; pure applyLightResult into the real Chunks, the touched contract kept)"
```

---

### Task 5: worker entry (`src/light-worker.ts`) + build verification

**Files:**
- Create: `src/light-worker.ts`

- [ ] **Step 1: Write the entry**

Create `src/light-worker.ts`:

```ts
// The light worker entry (ADR 0012): thin plumbing around LightWorkerState (the logic lives
// in src/light-worker-core.ts so vitest can drive it without a Worker runtime). Vite bundles
// this file as the worker chunk (dev and build, no vite.config change); main.ts's side spawns
// it via new Worker(new URL('./light-worker.ts', import.meta.url)) in src/light-transport.ts.

import { LightWorkerState } from './light-worker-core';
import type { LightMsg } from './light-protocol';

// The DOM lib types `self` as Window (whose postMessage wants a targetOrigin); in the worker
// context the single-argument postMessage is the real one. Localized cast.
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage: (msg: unknown) => void;
};

const state = new LightWorkerState();
ctx.onmessage = (e: MessageEvent<LightMsg>) => {
  const r = state.handle(e.data);
  if (r) ctx.postMessage(r);
};
```

- [ ] **Step 2: Build and verify the worker chunk is emitted**

Run: `npm run build && ls dist/assets/`
Expected: build clean; `dist/assets/` contains `index.js`, `index.css` AND a third file
matching `light-worker-*.js` (the worker chunk, hashed name). Note the exact worker file
name — Task 8's verification greps for it.

- [ ] **Step 3: Commit**

```bash
git add src/light-worker.ts
git commit -m "feat: light worker entry — self.onmessage plumbing around LightWorkerState (Vite-emitted worker chunk)"
```

---

### Task 6: rewire `main.ts` (+ `world.ts` comments)

**Files:**
- Modify: `src/main.ts:14` (import), `:248-251` (construction), `:783-785` (comment), `:790` (unload site), `:795-796` (load site + first-mesh deferral), `:283-290` (comment), `:850` (tick site)
- Modify: `src/world.ts:26-28,31` (comments only)

- [ ] **Step 1: Swap the import (line 14)**

```ts
import { LightSim, LIGHT_AMBIENT, LIGHT_TICK_BUDGET } from './light';
```
becomes:
```ts
import { LIGHT_AMBIENT, LIGHT_TICK_BUDGET } from './light';
import { LightClient } from './light-transport';
```
(`LIGHT_AMBIENT` still feeds the `uAmbient` uniform; `LightSim` is no longer constructed on
the main thread.)

- [ ] **Step 2: Construct the client (lines 248-251)**

```ts
// Light sim (PROJECT.md §18, src/light.ts): two 0..15 fields streamed with each chunk;
// drained every substep (near-instant), settled per loaded chunk (like sim), and its
// `touched` set re-meshes changed chunks at the frame end (the sim.touched contract).
const lightSim = new LightSim(world);
```
becomes:
```ts
// Light sim (PROJECT.md §18, src/light.ts): two 0..15 fields streamed with each chunk.
// Runs in a web worker (ADR 0012): the unmodified LightSim drains/settles over a mirror of
// the chunk fields; the replies push the touched chunks' fields back into the world and
// feed the frame-end re-mesh via `touched` (the sim.touched contract, one reply late).
const lightSim = new LightClient(world, worldTime);
window.__lightDebug = lightSim; // debug surface: cumulative pops/seeds/fieldChanges, latest queue, lastTick
```
(`worldTime` is defined at main.ts:225, `world` at :233 — both in scope.)

- [ ] **Step 3: The unload site (line 790)**

```ts
    lightSim.onChunkUnloaded(c.cx, c.cy, c.cz); // cells lit through the removed chunk darken
```
becomes:
```ts
    lightSim.unload(c.cx, c.cy, c.cz); // the worker re-seeds the surviving seams (the darkness wave)
    deferredFirstMesh.delete(chunkKey(c.cx, c.cy, c.cz)); // it may still be waiting for its first mesh
```

- [ ] **Step 4: The load site + first-mesh deferral (lines 795-796)**

```ts
    lightSim.settleChunk(c.cx, c.cy, c.cz);
    rebuildChunkMesh(c.cx, c.cy, c.cz);
```
becomes:
```ts
    lightSim.load(c.cx, c.cy, c.cz); // the worker settles it; the fields land with the tick reply
    deferredFirstMesh.add(chunkKey(c.cx, c.cy, c.cz)); // ADR 0012: the first/fresh mesh waits a guaranteed frame (replies are macrotasks — a load-frame drain would mesh from still-zero light); the frame end moves it into pendingRebuild after the first reply has landed
```
(`deferredFirstMesh` is declared next to `pendingRebuild` at main.ts:292 — Step 4b; `chunkKey` is already imported.)

**Step 4b: the `deferredFirstMesh` declaration + frame-end move (the guaranteed one-frame deferral)**

Worker replies are macrotasks that land AFTER `frame()` returns, so a chunk drained in its own
load frame would mesh from still-zero light (the dark flash the deferral exists to remove — the
browser acceptance explicitly rejects it). The set holds streamed-chunk keys until the next
frame, when their first worker reply has landed:

Next to the `pendingRebuild` declaration:
```ts
const deferredFirstMesh = new Set<string>(); // streamed-chunk keys whose FIRST/fresh mesh waits one frame for the worker's light fields (ADR 0012: replies are macrotasks — a load-frame drain would mesh from still-zero light) — moved into pendingRebuild at the frame end
```

In the frame-end section, AFTER `lightSim.touched.clear();` and BEFORE the `// Re-mesh up to REBUILD_BUDGET` block:
```ts
  // First/fresh meshes of this frame's streamed chunks enter pendingRebuild only now — they were
  // loaded this frame or an earlier one, so their first worker reply has already landed (or the
  // chunk settled to all-zero light, which the move still meshes, correctly dark).
  deferredFirstMesh.forEach((key) => pendingRebuild.add(key));
  deferredFirstMesh.clear();
```

- [ ] **Step 5: The tick site comment (line 850) — the call itself is unchanged**

```ts
  lightSim.tick(LIGHT_TICK_BUDGET); // light drain ONCE per frame (was per substep: budget × up to 6 catch-up substeps = ~15k pops/frame); idle cost ~0 (an empty queue is a no-op)
```
becomes:
```ts
  lightSim.tick(LIGHT_TICK_BUDGET); // the worker drains once per frame (ADR 0012) — off the renderer's critical path; idle cost = one worker round-trip per frame (a small reply object)
```
(The tick stamping happens inside the client via `worldTime` — the call shape is
deliberately unchanged.)

- [ ] **Step 6: Update the two stale comments**

Lines 283-290 (the `REBUILD_BUDGET` comment) — replace the last sentence:
```
// visible (near) chunks are always re-meshed first. The streaming's own 1 load + 1 remesh stay
// immediate (the worldgen budget, keeps the ring filling).
```
with:
```
// visible (near) chunks are always re-meshed first. The streaming's own 1 load + 1 remesh join
// this same budgeted set (ADR 0012: their first/fresh mesh waits one frame for the worker's
// light fields).
```

Lines 783-785 (the `tickStreaming` header comment) — replace:
```
// clamp multiply the budget by the substep count, up to ~12 chunks/frame). The load+remesh are
// rebuilt immediately (they're the new world content the player is moving into); the light/water
// touched are drained through the frame's budgeted re-mesh below (REBUILD_BUDGET).
```
with:
```
// clamp multiply the budget by the substep count, up to ~12 chunks/frame). The loaded/remeshed
// chunks' first/fresh mesh goes through the frame-end budgeted re-mesh below (REBUILD_BUDGET) —
// ADR 0012 defers it one frame so the mesh reads the worker's settled light; the light/water
// touched carry the same way.
```

- [ ] **Step 7: `world.ts` field comments (lines 26-28, 31)**

```ts
  blight: Uint8Array;   // block light level per cell, 0..15 (torch emission propagated); owned by src/light.ts
  skylight: Uint8Array; // sky light level per cell, 0..15 (open-to-sky exposure propagated); owned by src/light.ts
  colSum: Uint8Array;   // 256: per (lx,lz) column, capped-at-15 sum of light opacities over the chunk's own 16 cells (skyEmit's per-chunk cache; localIndex(lx, 0, lz) indexing)
  ...
  lightSettled: boolean; // light sim has settled this chunk's interior (fresh-load full settle done; remeshes only re-seed the seam)
```
becomes:
```ts
  blight: Uint8Array;   // block light level per cell, 0..15 (torch emission propagated); owned by src/light.ts — in production the light worker's mirror is the live copy, refreshed into these arrays from the worker's replies before the mesher reads them (ADR 0012)
  skylight: Uint8Array; // sky light level per cell, 0..15 (open-to-sky exposure propagated); owned by src/light.ts — same: worker-owned in production (ADR 0012)
  colSum: Uint8Array;   // 256: per (lx,lz) column, capped-at-15 sum of light opacities over the chunk's own 16 cells (skyEmit's per-chunk cache; localIndex(lx, 0, lz) indexing) — worker-internal in production (ADR 0012): the main-thread copy is vestigial, the engine maintains it on the mirror
  ...
  lightSettled: boolean; // light sim has settled this chunk's interior (fresh-load full settle done; remeshes only re-seed the seam) — the mirror's flag is live in production (ADR 0012)
```
(Comments only — the fields stay: the engine API and all node tests are unchanged.)

- [ ] **Step 8: Verify**

Run: `npm run build && npm test`
Expected: build clean; 17 files / 167 tests passed (the suite is main.ts-agnostic — all green).

- [ ] **Step 9: Commit**

```bash
git add src/main.ts src/world.ts
git commit -m "refactor: light sim on a web worker — main.ts rewired to the LightClient (tick-stamped load/unload/edit/tick); new-chunk first mesh deferred to the frame-end budgeted path (ADR 0012)"
```

---

### Task 7: browser acceptance (manual — the controller asks the USER to run this; a subagent cannot drive a browser)

**Files:** none (verification only — no commit)

The protocol-level determinism is pinned by the node tests (Tasks 2–3). This task verifies
the real Worker round-trip in the browser — the only part node cannot reach.

- [ ] **Step 1: Stationary-spawn parity (the headline check)**

Have the user run `npm run dev`, open the page, and do nothing (no input). In the console,
watch `__lightDebug` — `queue` drains to 0 in ~14–18 s (434,883 pops at 512/frame ≈ 850
frames). When `queue` is 0 and stable, read `__lightDebug.stats.pops`.
Expected: **≈434,883** — the node worker-path lineage (the production worker skips the
inline's one-time redundant boot wave — 459,134 − 24,251 — so the browser reads the
worker-path number, not the inline one). An exact match is NOT guaranteed: production's
2 Hz water pulses (ADR 0011) shift when water placements re-mark chunks dirty, so remesh
load ops carry block data at slightly different times than the node replay's collapsed
water drains (the test's canonical-replay convention, the same one light-load's 459,134
uses). A small deviation (a few percent at most) is EXPECTED — record the exact number in
the ADR 0012 acceptance entry. If the number is off by more than ~2% (or `queue` never
reaches a stable 0), capture the number + `stats` + any console errors and STOP — report
it to the controller (do not "fix" toward the number): that is a transport/round-trip bug
to diagnose (a lost load op or a double-settle moves the count by thousands).

- [ ] **Step 2: Torch behavior**

Place a torch (RMB) on a visible solid face: the glow wave settles in a few frames
(`stats.pops` bumps; the scene visibly lights up). Break it (LMB): the darkness wave
propagates over a few frames. Expected: same visible pace as before the change
(ADR 0007: a torch's wave settles in 1–3 substeps ≈ 20–50 ms — with the drain off the
main thread it should now read *smoother*).

- [ ] **Step 3: Cave + streaming check**

Walk (or noclip, N) into an open cave: the light converges with no frame stutter (the
pre-change cost was on the main thread). Stream to new terrain: the ring edges pop in
fully lit 1–2 frames after the geometry (the deferred first mesh) — **no dark flash**
that corrects a moment later. Expected: no light-flash artifact at the view edge;
`__lightDebug.queue` rises briefly on movement and drains.

- [ ] **Step 4: Report**

The user reports: the parity number, the torch check, the streaming-edge observation, any
console errors. The controller records the outcome (this feeds the ADR 0012 "manual
acceptance" consequence and the water spec draft's lessons).

---

### Task 8: deploy script — worker assets keep their hashed names

**Files:**
- Modify: `scripts/deploy-gh-pages.mjs:40-59` (the "2. Rewrite dist/" block)

The current block renames **every** `.js` in `dist/assets/` to `index.js` — with the worker
chunk emitted (Task 5), that clobbers the assets. Only the files `index.html` references
(the entry JS/CSS) may be pinned to static names; the worker ref inside the bundle is a
hashed sibling in the same folder and must keep its name.

- [ ] **Step 1: Replace the rewrite block**

Replace:
```js
// 2. Rewrite dist/ to the gh-pages pattern.
{
  const dist = join(root, 'dist');
  const assets = join(dist, 'assets');

  // Pin the entry files to static names (vite emits index-<hash>.js / .css for
  // this single-entry app).
  for (const f of readdirSync(assets)) {
    if (f.endsWith('.js') && f !== 'index.js') renameSync(join(assets, f), join(assets, 'index.js'));
    else if (f.endsWith('.css') && f !== 'index.css') renameSync(join(assets, f), join(assets, 'index.css'));
  }

  // index.html: drop `crossorigin`, and point the entry files at the static relative
  // paths (works whether vite emitted /assets/ or ./assets/).
  const htmlPath = join(dist, 'index.html');
  const html = readFileSync(htmlPath, 'utf8')
    .replace(/ crossorigin/g, '')
    .replace(/src="(?:\.\/)?\/?assets\/[^"]+\.js"/g, 'src="./assets/index.js"')
    .replace(/href="(?:\.\/)?\/?assets\/[^"]+\.css"/g, 'href="./assets/index.css"');
  writeFileSync(htmlPath, html);
}
```
with:
```js
// 2. Rewrite dist/ to the gh-pages pattern.
{
  const dist = join(root, 'dist');
  const assets = join(dist, 'assets');

  // Pin the ENTRY files to static names — only the assets index.html references. Worker
  // chunks (the light worker, ADR 0012) and any future extra assets keep their hashed
  // names: the worker ref inside the bundle is a hashed sibling in the same folder, so
  // renaming it would break the new URL(...) resolution at runtime.
  const html0 = readFileSync(join(dist, 'index.html'), 'utf8');
  const entryJs = html0.match(/src="(?:\.\/)?\/?assets\/([^"]+\.js)"/)?.[1];
  const entryCss = html0.match(/href="(?:\.\/)?\/?assets\/([^"]+\.css)"/)?.[1];
  for (const f of readdirSync(assets)) {
    if (f === entryJs) renameSync(join(assets, f), join(assets, 'index.js'));
    else if (f === entryCss) renameSync(join(assets, f), join(assets, 'index.css'));
  }

  // index.html: drop `crossorigin`, and point the entry files at the static relative
  // paths (works whether vite emitted /assets/ or ./assets/).
  const html = html0
    .replace(/ crossorigin/g, '')
    .replace(/src="(?:\.\/)?\/?assets\/[^"]+\.js"/g, 'src="./assets/index.js"')
    .replace(/href="(?:\.\/)?\/?assets\/[^"]+\.css"/g, 'href="./assets/index.css"');
  writeFileSync(join(dist, 'index.html'), html);
}
```

- [ ] **Step 2: Verify with a dry-run deploy**

Run: `npm run deploy:gh-pages -- --dry-run`
Expected: the build is clean; the dry-run lists the staged files. Then, before the dry-run's
`finally` restores the branch, the `dist/` state is gone — so verify the pieces separately:

```bash
npm run build
ls dist/assets/            # index-*.js, index-*.css, light-worker-*.js — three entries
node -e "
const { readFileSync, readdirSync } = require('node:fs');
const html = readFileSync('dist/index.html', 'utf8');
const entryJs = html.match(/src=\"(?:\.\/)?\/?assets\/([^\"]+\.js)\"/)?.[1];
const files = readdirSync('dist/assets');
const worker = files.find((f) => f.includes('worker'));
console.log('entryJs:', entryJs, '| worker chunk:', worker, '| distinct from entry:', worker !== entryJs);
const bundle = readFileSync('dist/assets/' + entryJs, 'utf8');
console.log('bundle references the worker chunk:', bundle.includes(worker));
"
```
Expected: `distinct from entry: true` and `bundle references the worker chunk: true`
(the runtime `new URL('light-worker-<hash>.js', import.meta.url)` resolves relative to
`assets/index.js` — same folder, so the static rename of the entry is safe).

- [ ] **Step 3: Commit**

```bash
git add scripts/deploy-gh-pages.mjs
git commit -m "chore(deploy): keep worker chunks under hashed names — pin only the index.html-referenced entry assets to static names (the light worker chunk, ADR 0012)"
```

---

### Task 9: docs — ADR 0012, ADR 0007 pointer, ADR 0011 pointer, index, TODO

**Files:**
- Create: `docs/adr/0012-light-worker.md`
- Modify: `docs/adr/0007-dynamic-lighting.md:5` (`Last updated`) and `:312-314` (the follow-up list)
- Modify: `docs/adr/0011-simulation-clocks.md` (`Last updated` + the off-thread follow-up at `:113-115`)
- Modify: `docs/adr/README.md` (index table)
- Modify: `TODO.md` (remove the resolved "Web-worker offload of settle/propagation" line under Sky & lighting)

- [ ] **Step 1: Write ADR 0012**

Create `docs/adr/0012-light-worker.md`:

````markdown
# 0012. Light simulation on a web worker — the unmodified engine over a chunk-field mirror, on a tick-numbered structured-clone protocol

- **Status:** Accepted
- **Last updated:** 2026-08-22
- **Sources:** (superseded by this ADR; recoverable via `git show <sha>:<path>` — both
  working docs committed on the `light-worker` branch before the working-docs removal)
  - `docs/superpowers/specs/2026-08-22-light-worker-design.md` (the design: architecture,
    protocol, main-thread integration, guarantees, tests, the water spec deliverable)
  - `docs/superpowers/plans/2026-08-22-light-worker.md` (the implementation plan)
  - `TODO.md` (the resolved "Web-worker offload of settle/propagation" item, originating
    from ADR 0007 — Dynamic lighting)

## Context

ADR 0007 — Dynamic lighting left its open follow-up: *web-worker offload of
settle/propagation*. The light sim is the heaviest simulation work on the main thread:
the spawn-ring boot cascade is **459,134 pops** (pinned by `light-load.test.ts`), open
caves keep a large live queue of `"x,y,z"` string entries (the SetIterator-allocation
cost at ~1e5 entries that already forced the array-queue redesign in `src/light.ts`),
and the drain (512 pops/frame) plus the inline load settles (512 pops each) run inside
the renderer's frame. ADR 0011 — Simulation clocks reserved the seam: `WorldTime.tick`
is the canonical heartbeat and *a future off-thread light worker receives tick numbers
in its message protocol*.

Four structural facts made the offload clean:

- The engine only talks to the world through `world.getChunk()` — a mirror of the chunk
  fields is a complete stand-in, so `LightSim` runs **unmodified** in the worker.
- The only main-thread consumer of the light fields is the mesher (`world.getLight`);
  `colSum`/`lightSettled` are engine-internal — so the worker→main traffic is the
  touched chunks' fields and nothing else.
- The engine is node-testable and vitest has no `Worker` — the engine tests and the
  459,134 lineage stay engine-level, and the worker logic is structured to be
  node-testable without a `Worker` runtime.
- Deployment is static GitHub Pages with no custom response headers —
  SharedArrayBuffer would require cross-origin isolation headers; structured-clone
  message passing needs none.

## Decision

**Approach A — a dedicated light worker on structured-clone messages.** Four new modules
plus a thin rewiring of `main.ts`; `src/light.ts` stays pin-identical (the sole change:
`settleChunk`'s fresh-settle `touched` mark — 705c663, below).

- **`src/light-worker-core.ts`** (node-importable): `LightWorkerState` owns a
  `MirrorWorld` (`Map<chunkKey, {cx,cy,cz,blocks,meta,blight,skylight,colSum,lightSettled}>`
  answering `getChunk`) and an unmodified `LightSim` — the single localized
  `as unknown as World` cast at the construction site, since the engine is typed against
  `World` and stays untouched on purpose. `handle(msg)` applies one message and returns
  the reply (`null` for non-`tick` messages). `load` installs/refreshes the mirror chunk
  then `settleChunk` (fresh = prefill+frontier, duplicate = the seam-only remesh path,
  via the mirror's `lightSettled`); `unload` deletes the mirror chunk **then**
  `onChunkUnloaded` (main.ts's exact order); `edit` applies the message's `(block, meta)`
  to the mirror (it is otherwise stale after `world.setBlock`) **then** `LightSim.edit`;
`tick` drains `budget` pops and replies with the touched chunks' whole fields
   (`blight`/`skylight` snapshots — `colSum` is worker-internal and never pushed), the
   post-drain `queue` size, and the cumulative `stats`. `touched` is the reply's push
   contract: `pop`/`edit` mark it on field change, and `settleChunk` marks a FRESH settle
   (prefill writes the fields without a pop — without the mark a changeless settle, e.g.
   an open flat surface, would never be pushed and the main copy would stay zero: the
   dark-surface bug, 705c663).
- **`src/light-worker.ts`**: ~10 lines of `self.onmessage` plumbing; Vite bundles it as
  the worker chunk via `new Worker(new URL(...))` (no `vite.config.ts` change).
- **`src/light-transport.ts`** (main side): `LightClient(world, worldTime)` spawns the
  worker at construction (boot messages queue FIFO until it is ready) and posts
  `load`/`unload`/`edit`/`tick`, each stamped with `worldTime.tick` (the ADR 0011 seam —
  the engine does not read it; it is the protocol's ordering/debug axis). Replies are
  applied by the pure `applyLightResult`: the pushed fields are copied into the real
  `Chunk` objects (the mesher's source) and the chunk keys accumulated into `touched` —
  consumed and cleared exactly once per frame at the existing merge site, so the contract
  is unchanged. Frame N's re-mesh consumes the reply to tick N−1 (one frame late).
- **No transfer lists anywhere** — every array is structured-cloned (4KB per field
  array; 8KB per `load`, 8KB per `changed` entry). Clone cost at this traffic is
  sub-millisecond.
- **Main-thread integration:** `new LightClient(world, worldTime)` replaces
  `new LightSim(world)` (the variable keeps the name `lightSim`); the `edit` call sites
  are unchanged (the client reads `world.getBlock/getMeta` itself); `onChunkUnloaded` →
  `unload`, `settleChunk` → `load`, and `tick(LIGHT_TICK_BUDGET)` keeps its shape (the
  tick stamping is inside the client). A newly loaded chunk's **first mesh is deferred**
  to the frame-end budgeted re-mesh path (`pendingRebuild.add` instead of the immediate
  `rebuildChunkMesh`): the chunk appears fully lit 1–2 frames later instead of dark and
  flashing to lit (the §9 load budget of ≤1/frame means it never queues; the geometry
  pop-in matches how budgeted re-meshes already appear). `window.__lightDebug` exposes
  the client (cumulative pops/seeds/fieldChanges, latest queue, lastTick).
- **Budgets and cadence unchanged:** `LIGHT_TICK_BUDGET = 512`/frame,
  `LIGHT_SETTLE_GUARD = 512` inline, the same frame slots — behavioral parity. The drain
  leaving the main thread *allows* raising the budget later; that is a tuning decision,
  not this change.

**Determinism — by construction.** Both sides are single-threaded FIFO queues with one
in-flight `tick`; the worker's engine therefore sees the same event sequence in the same
order as the main thread's inline calls — same loads (same data, captured at load time),
edits, unloads, budgets, frame slots — so the pop sequence is preserved structurally: the
inline lineage **459,134** (`light-load.test.ts` + the test's direct replay) and the
worker path its own **434,883** (the one-time redundant boot wave the mirror skips — the
boot settle seeds the two boot siblings' 512 face shells inline; the siblings' fresh-load
prefill redoes that work when streaming remeshes them). Pinned: the node engine suite's
pins are preserved (the engine's sole change is the 705c663 touched-mark — no pops), and a
boot-replay equivalence test (`light-worker-core.test.ts`) drives the production boot
sequence through the protocol and asserts identical per-chunk fields + both lineages. The
runtime sanity check is the browser stationary-spawn parity (the `__lightDebug` pops reach
≈434,883 at the drained queue — a band, as production water pulses shift remesh timing).

## Alternatives considered

- **B — SharedArrayBuffer + cross-origin isolation (the back pocket).** Move the light
  fields out of the `Chunk` object into a SAB; the worker writes in place, the mesher
  reads directly — zero per-frame field clones. Rejected for now: the clone traffic it
  saves is sub-millisecond at this scale, while it costs a `_headers` (COOP/COEP) file in
  the gh-pages deploy, a `world.ts` refactor touching the mesher's read path, and it
  breaks "engine unchanged." **Revisit condition: profiling shows structured-clone cost
  is real** (e.g., the boot-cascade reply traffic measurably hitches the main thread).
- **Settle-only offload** (the worker does `settleChunk`; main keeps `tick`) — rejected:
  settle and tick share *one* queue; you cannot split a FIFO across threads without
  re-deriving the seam, and the heavy case (open caves) is precisely the propagation
  drain that would stay on main.
- **Cell-delta pushes** (push only changed cells, not whole fields) — rejected: applying
  a delta is still a memcpy of comparable size, and the per-chunk "which cells since the
  last push" bookkeeping adds state for no traffic gain at this scale.
- **Two workers, one per sim** — rejected for now: no parallelism to gain (both drains
  are small and budgeted), and one mirror / one `load` message is simpler. The
  water-worker design doc re-examines it and lands on one worker for both sims.
- **Typing the engine against a minimal world view** — rejected: it would touch
  `src/light.ts`, and "engine pin-identical" was a load-bearing constraint (the node pins
  stay exactly as they are; 705c663's touched-mark keeps them); the mirror is cast at the
  single construction site instead.
- **Offloading the mesher too** — out of scope: the worldgen/meshing worker is a separate
  project (TODO.md), a different pattern with a cross-worker data dependency (it needs
  the light fields the light worker owns).

## Consequences

- The renderer's critical path no longer runs light work: the boot cascade and cave
  propagation settle in the worker; the frame cost is one postMessage each way.
- **Accepted: one frame of latency on touched → re-mesh** (frame N's re-mesh consumes
  the reply to tick N−1) — `REBUILD_BUDGET` already spreads re-meshes over frames and a
  briefly-stale mesh is safe (ADR 0007 — the light is a self-correcting lower bound at
  the fixpoint).
- **Accepted: a new chunk's first mesh is 1–2 frames late** (fully lit on first
  appearance; no dark flash) — edge of view, consistent with the budgeted re-mesh
  pop-in.
- The main-thread `colSum`/`lightSettled` copies are vestigial in production (the mirror
  owns them); the `Chunk` fields stay because the engine API and the node tests are
  unchanged.
- **Failure mode:** a worker script error freezes the light (fields stop updating,
  `__lightDebug` goes stale); no restart logic (POC).
- Memory: the worker holds a mirror of the loaded ring — 125 chunks × ~16KB
  (blocks/meta + light fields + colSum) ≈ 2MB worst case.
- The deploy script pins only the entry assets to static names; the worker chunk keeps
  its hashed name (its runtime ref is a same-folder relative `new URL(...)`).
- The engine-level pins are preserved (the engine's sole change is the 705c663 fresh-settle
  touched mark — no pops/fields); the water lineage (10,690) is untouched.
- **Follow-ups:** the water offload — `docs/superpowers/specs/2026-08-22-water-worker-design.md`
  (draft; one worker for both sims, pulse pacing stays on main via `tickCrossed`); the
  worldgen/meshing worker (TODO.md — Streaming / rendering).
````

- [ ] **Step 2: ADR 0007 — mark the follow-up resolved**

In `docs/adr/0007-dynamic-lighting.md`, line 5: `- **Last updated:** 2026-08-20` →
`- **Last updated:** 2026-08-22`. In the Consequences follow-up list (lines 306-314),
replace:
```
  requires the layer to become world state); web-worker offload of
  settle/propagation (the PROJECT.md §15 deferral); directional/colored light
```
with:
```
  requires the layer to become world state); ~~web-worker offload of
  settle/propagation (the PROJECT.md §15 deferral)~~ — resolved by ADR 0012 — Light
  simulation on a web worker; directional/colored light
```

- [ ] **Step 3: ADR 0011 — mark the off-thread seam consumed**

In `docs/adr/0011-simulation-clocks.md`, bump `Last updated` to 2026-08-22 and replace
(lines 113-115):
```
- Off-thread light settle/propagation (TODO.md — Sky & lighting) is the next project to
  consume this heartbeat: its message protocol will carry tick numbers, and a future
  server owns the tick sequence.
```
with:
```
- Off-thread light settle/propagation consumes this heartbeat — resolved by ADR 0012 —
  Light simulation on a web worker: its message protocol carries tick numbers, and a
  future server owns the tick sequence.
```

- [ ] **Step 4: ADR README index — append the 0012 row**

After the 0011 row (`docs/adr/README.md:20`):
```
| [0012](0012-light-worker.md) | Light simulation on a web worker | pin-identical engine over a chunk-field mirror, tick-numbered structured-clone protocol |
```

- [ ] **Step 5: TODO.md — remove the resolved line (line 44)**

```
- Web-worker offload of settle/propagation.
```
(deleted — resolved by ADR 0012; the worldgen/meshing item added 2026-08-22 stays open).

- [ ] **Step 6: Verify + commit**

Run: `npm test` (docs-only change — the suite must stay green; 17 files / 167 tests)
Expected: PASS.

```bash
git add docs/adr/0012-light-worker.md docs/adr/0007-dynamic-lighting.md docs/adr/0011-simulation-clocks.md docs/adr/README.md TODO.md
git commit -m "docs(adr): 0012 light simulation on a web worker — unmodified engine over a mirror, tick-numbered structured-clone protocol (resolves ADR 0007's worker follow-up and the TODO item; SAB kept as the back-pocket optimization)"
```

---

### Task 10: water-worker design doc (the sibling deliverable — draft, living)

**Files:**
- Create: `docs/superpowers/specs/2026-08-22-water-worker-design.md`

Written now, **after** the light transport exists (it documents the actual pattern). If
Task 7's acceptance or the review surfaced a lesson that changes a statement below,
update the doc in place first (this task's commit carries the final draft).

- [ ] **Step 1: Write the draft**

Create `docs/superpowers/specs/2026-08-22-water-worker-design.md`:

````markdown
# Design (draft): water simulation offloaded to the sim worker

- **Date:** 2026-08-22
- **Status:** draft (written alongside the light-worker project as its sibling deliverable;
  updated with that project's implementation lessons; final review at the end of the
  light-worker project). Not yet implemented.
- **Depends on:** ADR 0012 — Light simulation on a web worker (the worker, the mirror, the
  protocol, the client, and the debug surface exist; this project extends them).

## Context

ADR 0012 moved the light sim off the main thread: an unmodified engine over a chunk-field
mirror, a tick-numbered structured-clone protocol, and a main-thread client
(`src/light-transport.ts`) that applies replies into the real `Chunk` objects. The water
sim (ADR 0005 — Water simulation) is the remaining simulation work on the main thread: the
1,000-cell pulse every 30 ticks (ADR 0011's stride, `WATER_PULSE = 1000`) and the
per-chunk load settle. Individually small, but the same string-queue churn pattern (the
water queue is the same array+Set design), and its state feeds the mesher's water surfaces
exactly as the light fields do — the water analog of ADR 0012's offload.

## Scope

**In:** move `WaterSim` off the main thread through the existing worker; record the
decision in ADR 0013; resolve the follow-up.

**Out (deliberate):** any change to the water rules or budgets (`WATER_PULSE = 1000`,
`WATER_STRIDE = 30`, the settle guard — unchanged); the worldgen/meshing worker (a
separate TODO item).

## Decision (settled at design time)

**One worker, both sims.** The light worker evolves into the sim worker:
`light-worker-core.ts` → `sim-worker-core.ts` (`SimWorkerState` owns both the `LightSim`
and the `WaterSim` over the same mirror); `light-worker.ts` → `sim-worker.ts`;
`LightClient` → `SimClient`. One lifecycle, one mirror, one `load` message feeding both
engines. The light/water queues are independent and the sims never touch each other's
state (ADR 0007), so the interleaving within one worker changes nothing — and there is no
parallelism to gain from a second worker (a 1,000-cell pulse per 30 frames vs a
512/frame drain).

**The mirror gains the water state.** `MirrorChunk` gains `wlevel`, `wsource`, `wplaced`,
`wstream` (each `Uint8Array(4096)`) + the water `settled` flag. The `load` message gains
the chunk's initial `wlevel`/`wsource`/`wplaced`/`wstream` (worldgen's water — the water
engine's state, exactly as `blight`/`skylight` are light's; main keeps ownership of its
own copies for the mesher until the replies land). The pushed fields gain **`wlevel`,
`wsource`, `wstream`** — the three the mesher reads via `World.getWaterHeight` (water
surface height, skirt compares) — for changed chunks; `wplaced` is engine-internal (like
`colSum`) and never pushed.

**Pulse pacing stays on main — the ADR 0011 seam, exactly as designed.** Main keeps the
`tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)` decision; on a pulse frame it
posts `{ t: 'wtick', tick, budget: WATER_PULSE }` (the water drain message), and nothing
on non-pulse frames. Load-settles stay event-driven via `load` (the worker runs each
engine's settle on the load message). The water `touched` merge moves to the client's
reply — the same one-frame-late pattern as light (frame N's re-mesh consumes the reply to
tick N−1; `REBUILD_BUDGET` + the water-convergence argument, ADR 0005/0012).

**First-mesh deferral is shared.** ADR 0012 already defers a new chunk's first mesh to the
frame-end budgeted path; the water's settled `wlevel` arrives with the same reply, so the
deferred mesh reads water that is *fresher* than today's inline mesh (settle + the first
pulse drain). No new change.

**Determinism.** The engine-level 10,690 lineage (`water-load.test.ts`) is untouched —
`src/water.ts` stays byte-identical. (Check when drafting whether water's fresh settle has
the same no-process direct-write pattern that forced light's 705c663 touched-mark — if
`WaterSim`'s fresh-settle writes fields without any queue-driven change, the water worker
needs the same mark or water states would suffer light's dark-surface bug.) The worker-core
equivalence test gains a water arm: the same boot replay sequence driven through the
protocol → identical `wlevel`/`wsource`/`wstream` fields + identical cumulative water
stats; the 10,690 pin is re-verified through the protocol (the same assertion shape as the
light 459,134).

## Tests (shape)

- Engine: `water.test.ts` / `water-load.test.ts` byte-identical, untouched (the pins).
- Worker core: the existing light equivalence test becomes the sim equivalence test (both
  engines, one op sequence); a water arm asserts `wlevel` field identity + stats; edges
  mirror light's (unload/reload, duplicate load, edit on a missing chunk — water edits
  carry the new block + the cell's water state, since `WaterSim.edit` takes the new block
  and re-derives).
- Transport: `applyLightResult` gains the water arrays (or a sibling `applySimResult`).
- Browser acceptance: stationary-spawn parity on the water process count (10,690) via the
  debug handle; free play — placement/drain pace unchanged at the 0.5 s pulse cadence
  (ADR 0011), cave fills read the same.

## Documentation (at its implementation)

ADR 0013 — Water simulation on the sim worker; ADR 0005's Consequences (a worker
follow-up line, if added there); the ADR README index; the TODO item.
````

- [ ] **Step 2: Verify + commit**

Run: `npm test` (docs-only — 17 files / 167 tests)
Expected: PASS.

```bash
git add docs/superpowers/specs/2026-08-22-water-worker-design.md
git commit -m "docs: water-worker design doc (draft) — one worker for both sims, extended mirror (wlevel/wsource/wplaced/wstream), pulse pacing stays on main via the tick seam"
```

---

### Task 11: final gate (verification only — no commit)

- [ ] **Step 1: Full suite**

Run: `npm test`
Expected: **17 files / 167 tests passed** (15 + 2 new files; 158 + 9 new tests — the 5
core unit/edge tests + the boot-replay equivalence + the 3 transport tests). Record the
actual count if it differs.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: clean; `dist/assets/` has the entry JS/CSS + `light-worker-*.js`.

- [ ] **Step 3: Deploy dry-run**

Run: `npm run deploy:gh-pages -- --dry-run`
Expected: clean build; the staged-file list includes `assets/index.js`,
`assets/index.css`, and `assets/light-worker-*.js` (three asset entries, no clobber).

- [ ] **Step 4: Branch review**

Run: `git log --oneline main..light-worker && git status --short`
Expected: 9 commits (Tasks 1–6, 8–10: protocol, core, equivalence test, transport,
worker entry, main.ts rewire, deploy fix, ADR 0012 docs, water draft), clean working
tree. Report the log to the controller.

---

### Task 12: remove the superpowers working docs (the last commit before merge)

**Files:**
- Remove: `docs/superpowers/` (the whole directory: this spec + plan, the
  simulation-clocks spec + plan, the water draft)

User instruction 2026-08-22: the `docs/superpowers/` working docs are ephemeral — ADRs are
the durable record. Everything committed on this branch stays recoverable via
`git show <sha>:<path>` (ADR 0012's Sources block already cites the spec/plan paths for
exactly this; the water draft is recoverable at its Task 10 commit, and the next project
rewrites its spec anyway). This is the house convention from the 2026-08-20 restructure
(`docs/adr/README.md`: "when a project merges … the working docs are superseded").

- [ ] **Step 1: Remove and commit**

```bash
git rm -r docs/superpowers
git commit -m "docs: remove the superpowers working docs — ephemeral by convention; ADR 0012 is the durable record (spec/plan/water-draft recoverable via git show)"
```

- [ ] **Step 2: Verify the branch is merge-ready**

Run: `git status --short && git log --oneline main..light-worker | wc -l`
Expected: clean tree; **10 commits** (Tasks 1–6, 8–12). The branch is ready for
`finishing-a-development-branch` (merge to main).