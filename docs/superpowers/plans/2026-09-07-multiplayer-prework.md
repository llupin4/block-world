# Plan: multiplayer pre-work — entities survive an unedited chunk's unload

Spec: `docs/superpowers/specs/2026-09-07-multiplayer-prework-design.md`
Task brief: `docs/plans/multiplayer.md` (the "Pre-work" section)
Branch: `multiplayer` — created in Task 1, before any other file write. Preceding the
**phase A plan** (`2026-09-07-multiplayer-session.md`), which continues on this branch.
No ADR of its own — the three fixes' rationale is folded into ADR 0018's Context.

## Goal

Make entity state round-trip through an unedited chunk and stop deer population from
growing on remesh, with **zero behavior change** to the single-player pins. Three small
repairs, each TDD'd and committed on its own, before any phase A code:

1. A chunk that **holds entities** snapshots on unload regardless of `edited` (spec D1).
2. `streaming.update` splits `rebuilt` into `generated` / `remeshed`; `spawnDeer` runs on
   `generated` only (spec D2).
3. `Sim.despawn`'s viewed fallback picks the **lowest id**, not `Map` insertion order (D3).

Every existing pin holds (`water-load`, `mesher-budget`, the `stepEntity ≡ Player` 1e-9
pin, the `persistence`/`streaming`/`spawn` suites).

## Architecture

- `src/persistence.ts` — `Persistence.onUnload(c, entities?)` (L286-298): the two early-return
  gates change from "edited only" to "edited **or** carries entities."
- `src/streaming.ts` — `StreamingUpdate` (L30-38) gains `generated` + `remeshed`; `update`
  (L87-151) fills them (load pass → `generated`, remesh pass → `remeshed`); `rebuilt` is
  kept as their concatenation (identical order to today) so `main.ts`'s mesh loop is
  untouched.
- `src/main.ts` — `tickStreaming`'s `spawnDeer` loop (L1106) iterates `r.generated` instead
  of `r.rebuilt`.
- `src/entity.ts` — `Sim.despawn` (L554-563): the viewed fallback uses `this.all()[0]`
  (already id-ordered) instead of the `Map`'s first key.

## Tech stack

Existing only: TypeScript + vitest. No new dependencies.

## File map

| File | Action |
|------|--------|
| `docs/plans/multiplayer.md` | committed as-is (the brief) |
| `docs/superpowers/specs/2026-09-07-multiplayer-prework-design.md` | new (Task 1) |
| `docs/superpowers/plans/2026-09-07-multiplayer-prework.md` | new — this file (Task 1) |
| `docs/superpowers/specs/2026-09-07-multiplayer-session-design.md` | new (Task 1) |
| `docs/superpowers/plans/2026-09-07-multiplayer-session.md` | new (Task 1) |
| `docs/superpowers/specs/2026-09-07-multiplayer-transport-lobby-design.md` | new — DRAFT (Task 1) |
| `docs/superpowers/specs/2026-09-07-multiplayer-prediction-reconciliation-design.md` | new — DRAFT (Task 1) |
| `src/persistence.ts` | edit (Task 2) |
| `src/__tests__/persistence.test.ts` | edit (Task 2) |
| `src/streaming.ts` | edit (Task 3) |
| `src/main.ts` | edit (Task 3) |
| `src/__tests__/streaming.test.ts` | edit (Task 3) |
| `src/entity.ts` | edit (Task 4) |
| `src/__tests__/entity.test.ts` | edit (Task 4) |

## Pinned numbers (must not regress)

`WARM_CAP 512`, `VIEW_RADIUS 2`, `CY 0..4`, `LOAD_BUDGET 1`, `REMESH_BUDGET 1`,
`TERRAIN_SEED 1234`, `CHUNK_VOL 4096`, `spawnDeer` default `count = 2`; the `water-load`
PIN 1,231,601 / 10,690; the `mesher-budget` pins; `stepEntity(playerKind)` ≡ old
`Player.update` to 1e-9.

## Execution notes

- TDD per task: failing test first, then the minimal change, run, commit.
- House style: no reference engine named, pinned numbers verbatim, `[POC shortcut]` tags on
  deliberate punts, imperative detailed commit messages.
- These are three surgical hunks; a test failure points at the named hunk, not the test.
- The single-player consequence of D1 (a chunk that merely hosted a deer is now persisted
  with its pristine terrain) is **intended** and is the exact behavior the phase A host
  needs. The `persistence.test.ts` case "I: 600-frame no-edit walk persists ZERO chunks"
  (L273-303) must **stay** green — no deer are present in that walk, so nothing new is
  persisted.

---

## Task 1: branch + all phase docs (up-front commit)

**Files:** the brief + the six `docs/superpowers/` docs listed in the File map

**Step 1:** Create the branch before any file write:

```bash
git checkout -b multiplayer
```

**Step 2:** Write (or confirm present) the seven docs: the brief
(`docs/plans/multiplayer.md`, already present) plus the six `docs/superpowers/` files. The
pre-work spec + this plan are the design of record for the three fixes; the phase A spec +
plan are the design of record for the session model; the two phase B/C docs are marked
**DRAFT** (their plans are written later, after pre-work + phase A land).

**Step 3: Verify** — `git status` shows the seven docs as untracked/new and **no** source
files changed:

```bash
git status --short
# docs/plans/multiplayer.md + six docs/superpowers/** files, and nothing under src/
```

**Step 4: Commit**

```bash
git add docs/plans/multiplayer.md docs/superpowers/specs/2026-09-07-multiplayer-prework-design.md \
  docs/superpowers/plans/2026-09-07-multiplayer-prework.md \
  docs/superpowers/specs/2026-09-07-multiplayer-session-design.md \
  docs/superpowers/plans/2026-09-07-multiplayer-session.md \
  docs/superpowers/specs/2026-09-07-multiplayer-transport-lobby-design.md \
  docs/superpowers/specs/2026-09-07-multiplayer-prediction-reconciliation-design.md
git commit -m "docs: multiplayer — pre-work + phase A specs/plans + phase B/C draft specs"
```

---

## Task 2: entities snapshot on unload regardless of `edited` (D1)

**Files:** `src/persistence.ts`, `src/__tests__/persistence.test.ts`

`Persistence.onUnload` (L286-298) currently drops a chunk's entities when the chunk was
never edited. Two early-return gates change so that a chunk carrying entities snapshots
(caches warm + marks persisted + writes through) even when unedited. After the round trip
`applyRecord` (L99-103) sets `edited=true, editGen=savedGen=1`, so the chunk is in sync and
later unloads rewrite nothing.

**Step 1: Write the failing tests** — append to `src/__tests__/persistence.test.ts`:

```ts
describe('persistence — entity-ride unload (multiplayer pre-work D1)', () => {
  const deer: EntityRecord = {
    id: 3, kindId: 'deer', x: 2, y: 5, z: 9, vx: 0, vy: 0, vz: 0,
    yaw: 0.3, pitch: 0, fly: false, noclip: false, controllerKind: 'mob',
  };

  it('an UNEDITED chunk carrying entities snapshots on unload (warm + store)', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, 1234);
    await persist.boot();
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    expect(c.edited).toBe(false);
    persist.onUnload(c, [deer]);
    expect(store.puts).toBe(1);                              // forced: the entity is new state
    expect(persist.hasPersisted(0, 0, 0)).toBe(true);
    expect(persist.syncRecord(0, 0, 0)!.entities).toEqual([deer]); // the entity rode the record
  });

  it('an unedited chunk with NO entities is still a no-op (unchanged D4/D6 gate)', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, 1234);
    await persist.boot();
    const world = new World();
    persist.onUnload(world.ensureChunk(0, 0, 0));            // unedited, no entities
    expect(store.puts).toBe(0);
    expect(persist.hasPersisted(0, 0, 0)).toBe(false);
    expect(persist.syncRecord(0, 0, 0)).toBeUndefined();
  });

  it('a restored entity-ride chunk is in sync: the next unload rewrites nothing', async () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, 1234);
    await persist.boot();
    const world = new World();
    persist.onUnload(world.ensureChunk(0, 0, 0), [deer]);    // unedited + entities → one write
    expect(store.puts).toBe(1);
    // walk away, then back: the warm record restores (applyRecord sets edited + in sync)
    world.removeChunk(0, 0, 0);
    applyRecord(world, persist.syncRecord(0, 0, 0)!);
    expect(world.getChunk(0, 0, 0)!.edited).toBe(true);
    persist.onUnload(world.getChunk(0, 0, 0)!);              // now edited + in sync → no write
    expect(store.puts).toBe(1);
  });
});
```

**Step 2: Run to verify it fails** — the first and third tests fail (an unedited chunk with
entities is dropped, so `store.puts` is 0 and `hasPersisted` is false):

```bash
npx vitest run src/__tests__/persistence.test.ts -t "entity-ride unload"
```
Expected: 2 FAIL, 1 PASS (the no-op case already passes).

**Step 3: Implement** — in `src/persistence.ts`, replace the top of `onUnload` (L286-292):

```ts
  onUnload(c: Chunk, entities?: EntityRecord[]): void {
    const hasEntities = !!entities && entities.length > 0;
    if (!c.edited && !hasEntities) return; // no player edits and nothing to preserve
    const k = this.key(c.cx, c.cy, c.cz);
    const rec = snapshotChunk(c, entities);
    this.cache(k, rec);
    this.persistedKeys.add(k);
    if (!this.isDue(c) && !hasEntities) return; // in sync and nothing new: the store already holds it
    c.savedGen = c.editGen;
    if (!this.store) return;
    const p = this.store.put(k, rec).catch(() => undefined);
    this.pendingPuts.add(p);
    void p.then(() => this.pendingPuts.delete(p));
  }
```

(Only the two early-return lines change; the rest is unchanged.)

**Step 4: Run to verify it passes** — the new case passes **and** the whole persistence
suite (including the unchanged "I: 600-frame no-edit walk persists ZERO chunks") is green:

```bash
npx vitest run src/__tests__/persistence.test.ts src/__tests__/persistence-water.test.ts
```
Expected: PASS (all).

**Step 5: Commit**

```bash
git add src/persistence.ts src/__tests__/persistence.test.ts
git commit -m "fix: snapshot an unedited chunk that carries entities on unload (entities are state that differs from worldgen)"
```

---

## Task 3: split `rebuilt` into `generated`/`remeshed`; `spawnDeer` on `generated` only (D2)

**Files:** `src/streaming.ts`, `src/main.ts`, `src/__tests__/streaming.test.ts`

`streaming.update` (L87-151) puts freshly generated and dirty-remeshed chunks into one
`rebuilt` list; `main.ts:1106` runs `spawnDeer` on all of them, so a remesh tops a
partially-occupied column back up (population growth). Split the list; `spawnDeer` iterates
`generated` only. `rebuilt` stays their concatenation (load-pass order, then remesh-pass
order — identical to today) so the settle/light/mesh loop over `r.rebuilt` is untouched.

**Step 1: Write the failing test** — append to `src/__tests__/streaming.test.ts`:

```ts
describe('streaming — generated vs remeshed (multiplayer pre-work D2)', () => {
  it('a fresh generate lands in generated; a dirty remesh in remeshed; rebuilt is the union', () => {
    const world = new World();
    const f = update(world, 2, 2, 2);
    expect(f.generated).toEqual([{ cx: 2, cy: 2, cz: 2 }]); // cold start: a fresh generate
    expect(f.remeshed).toEqual([]);
    expect(f.rebuilt).toEqual([{ cx: 2, cy: 2, cz: 2 }]);   // the union
    for (const c of f.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;

    converge(world);
    for (const c of world.allChunks()) c.dirty = false;

    world.getChunk(2, 2, 2)!.dirty = true; // mark an already-loaded chunk dirty
    const r = update(world, 2, 2, 2);
    expect(r.generated).toEqual([]);                        // nothing new to generate
    expect(r.remeshed).toContainEqual({ cx: 2, cy: 2, cz: 2 }); // it remeshes
    expect(r.rebuilt).toContainEqual({ cx: 2, cy: 2, cz: 2 });  // still in the union
    expect(r.rebuilt.length).toBe(1);
  });

  it('spawnDeer tops a freshly generated column but not a remeshed one (population is stable)', () => {
    // A column that already has 1 deer is a partial column: a remesh must NOT add a second.
    const world = new World();
    const sim = new Sim(world, {}, TERRAIN_SEED);
    // One deer in chunk (0,0,0); the chunk is pristine (unedited) so a remesh re-rolls it.
    sim.spawn({ x: 8, y: 5, z: 8 }, new IdleController());
    world.ensureChunk(0, 0, 0).dirty = true;
    const before = sim.all().length;
    const r = update(world, 0, 0, 0);
    expect(r.remeshed).toContainEqual({ cx: 0, cy: 0, cz: 0 });
    expect(r.generated).toEqual([]);
    // main.ts's spawnDeer loop now only touches r.generated → nothing spawns here.
    for (const c of r.generated) { /* spawnDeer would run here only */ }
    expect(sim.all().length).toBe(before); // unchanged
  });
});
```

> The second test pins the *streaming* side of the fix (a remesh is not a `generated`
> column). The `main.ts` change is integration (verified by the browser + the phase A
> union-ring gate), consistent with how the project treats `main.ts` hunks.

**Step 2: Run to verify it fails** — `r.generated`/`r.remeshed` are `undefined`, so the
first assertion throws:

```bash
npx vitest run src/__tests__/streaming.test.ts -t "generated vs remeshed"
```
Expected: FAIL (property `generated` undefined).

**Step 3: Implement** — three edits.

(a) `src/streaming.ts`, extend `StreamingUpdate` (L30-38) — add two fields after `rebuilt`:

```ts
export interface StreamingUpdate {
  rebuilt: Coord[];  // generated + remeshed (their concatenation, current order): main.ts meshes each
  generated: Coord[]; // freshly GENERATED columns — the ONLY ones spawnDeer tops up
  remeshed: Coord[];  // dirty-RE-MESHED chunks — no spawnDeer
  restored: Coord[];
  pending: Coord[];
  unloaded: Coord[];
}
```

(b) `src/streaming.ts`, in `update` (L88-91) add the two arrays and populate them. Replace
the declaration block:

```ts
  const rebuilt: Coord[] = [];
  const generated: Coord[] = [];
  const remeshed: Coord[] = [];
  const restored: Coord[] = [];
```

In the load pass (L117-123), after `rebuilt.push(c)` add `generated.push(c)`. In the remesh
pass (L133-135), after `rebuilt.push(c)` add `remeshed.push(c)`. Return all of them:

```ts
  return { rebuilt, generated, remeshed, restored, pending, unloaded };
```

(c) `src/main.ts`, `tickStreaming` (L1106) — change the spawn loop to iterate `generated`:

```ts
  for (const c of r.generated) spawnDeer(world, sim, c.cx, c.cz); // fresh GENERATED columns only: a remesh must not re-top a column whose deer wandered away (pre-work D2); restored chunks already carry their persisted deer
```

**Step 4: Run to verify it passes** — the new case passes and the full streaming suite
(including "I"-style no-op and the `converge`-based A-D tests) is green:

```bash
npx vitest run src/__tests__/streaming.test.ts
```
Expected: PASS (all).

**Step 5: Commit**

```bash
git add src/streaming.ts src/main.ts src/__tests__/streaming.test.ts
git commit -m "fix: split rebuilt into generated/remeshed so spawnDeer only tops freshly generated columns (no population growth on remesh)"
```

---

## Task 4: `Sim.despawn` viewed fallback picks the lowest id (D3)

**Files:** `src/entity.ts`, `src/__tests__/entity.test.ts`

`Sim.despawn` (L554-563) falls back to the `Map`'s first key (insertion order) when the
viewed entity is removed. Make it the lowest id (deterministic) via `this.all()[0]`
(`all()` is already id-ordered).

**Step 1: Write the failing test** — append to `src/__tests__/entity.test.ts`:

```ts
describe('entity — Sim.despawn viewed fallback (deterministic, D3)', () => {
  it('despawning the viewed entity falls back to the LOWEST id, not insertion order', () => {
    const world = new World();
    const sim = new Sim(world, {}, 1);
    const a = sim.spawn({ x: 0, y: 0, z: 0 }, new IdleController()); // id 1
    const b = sim.spawn({ x: 1, y: 0, z: 0 }, new IdleController()); // id 2
    const c = sim.spawn({ x: 2, y: 0, z: 0 }, new IdleController()); // id 3
    sim.setViewed(c.id);                       // view the highest id
    sim.despawn(a.id);                         // viewed stays c; a is gone (insertion order now b, c)
    sim.restoreEntity({                        // re-add a: LAST inserted, but the LOWEST id
      id: a.id, kindId: 'player', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
      yaw: 0, pitch: 0, fly: false, noclip: false, controllerKind: 'idle',
    }, new IdleController());
    expect(sim.viewedId).toBe(c.id);           // restoring does not change viewed
    sim.despawn(c.id);                         // despawn the viewed
    expect(sim.viewedId).toBe(a.id);           // LOWEST id (1) — insertion order would give b (2)
    expect(sim.viewedId).not.toBe(b.id);
  });
});
```

**Step 2: Run to verify it fails** — insertion order gives `b.id`, so the last assertion
fails:

```bash
npx vitest run src/__tests__/entity.test.ts -t "despawn viewed fallback"
```
Expected: FAIL (`sim.viewedId` is `b.id`).

**Step 3: Implement** — in `src/entity.ts`, replace the fallback in `despawn` (L558-562):

```ts
    if (this.viewedId === id) {
      this.viewedId = 0;
      const lowest = this.all()[0]; // id-ordered: the deterministic fallback
      if (lowest !== undefined) this.viewedId = lowest.id;
    }
```

**Step 4: Run to verify it passes** — the new case passes and the whole entity suite (the
2-bot determinism gate, `stepEntity ≡ Player`, possession) is green:

```bash
npx vitest run src/__tests__/entity.test.ts src/__tests__/player.test.ts
```
Expected: PASS (all).

**Step 5: Commit**

```bash
git add src/entity.ts src/__tests__/entity.test.ts
git commit -m "fix: Sim.despawn viewed fallback picks the lowest id (deterministic, not Map insertion order)"
```

---

## Self-review

- **Spec coverage:** D1 → Task 2; D2 → Task 3; D3 → Task 4; "pinned by tests" → Tasks 2-4
  each add a failing-then-passing test; "its own commit" → three fix commits, all before
  any phase A code. The no-op (unedited + no entities) path is explicitly pinned (Task 2,
  test 2) so the D4/D6 gate is not widened for empty chunks.
- **No behavior change to single-player pins:** the unchanged `persistence` "I" test
  (no-edit walk → ZERO chunks) and the `spawn`/`streaming`/`player` suites are re-run in
  each task's verify step. `rebuilt` order is preserved (concatenation), so the mesh loop
  and the `converge` helper are unaffected.
- **Type consistency:** `StreamingUpdate.generated`/`.remeshed` are `Coord[]` and are
  produced by `update` and consumed by `main.ts`'s `spawnDeer` loop and the tests — one
  spelling. `EntityRecord` is reused verbatim in the persistence/entity tests.
- **Gaps / deferrals:** D1's save-point gap is tagged `[POC shortcut]` in the spec
  (a crash between unloads can leave a deer pose stale); no new ADR (rationale folded into
  ADR 0018 at phase A).
```