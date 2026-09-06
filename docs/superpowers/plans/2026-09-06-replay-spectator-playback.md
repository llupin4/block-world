# Plan: replay & spectator playback — a replay is a snapshot + an intent log

Spec: `docs/superpowers/specs/2026-09-06-replay-spectator-playback-design.md`
Task brief: `docs/plans/entities-controllers.md` (phase 3 section)
Branch: continue on `entities-controllers`. Prerequisite: the phase 1 and phase 2 plans are
fully implemented and their gates green — this plan's code runs only after both are in. (All
phase docs are committed together in one up-front docs commit; the code is implemented
phase-by-phase.) Phase 3 of 3. Durable record: ADR 0017 — Replay.

## Goal

Record a session (`R`), persist it to IndexedDB, and play it back **deterministically** on a
fresh world. A replay = an initial **snapshot** (the persistence records of every loaded
chunk + the `WorldMeta` at record start — no new format) + a **delta-coded intent log**. The
**spectator** views a playback with its own live human controller (its kind is `canEdit:
false`, so it never perturbs the replay). The **round-trip determinism test is the gate**:
record → replay on a fresh world is byte/1e-9 identical for every loaded chunk's arrays and
every entity's transform; and seeking (snapshot at `T`, replay forward) matches a direct
replay.

## Architecture

- `src/replay.ts` (new) — the types (`Replay`/`ReplaySnapshot`/`IntentEntry`/`EntityEvent`),
  `intentEqual` (delta-coding comparison), `Recorder` (hooks `sim.onIntent`/`onSpawn`/
  `onDespawn`), `ReplayController` (feeds one entity's logged intents with the "repeat
  previous" semantic), `ReplayStore` + `InMemoryReplayStore`.
- `src/entity.ts` — `Sim.onSpawn`/`Sim.onDespawn` optional callbacks (fired in `spawn`/
  `despawn`) so the `Recorder` can capture entity events.
- `src/persistence.ts` — `Persistence` gains an optional `replayStore` +
  `saveReplay(key, replay)`/`loadReplay(key)` (error-tolerant).
- `src/idb-store.ts` — `IndexedDBChunkStore` gains a `replays` object store +
  `putReplay`/`getReplay`.
- `src/main.ts` — `R` record start/stop (write to IDB under `${seed}:replay:${startTick}`);
  `?replay=<key>` loads a replay into a fresh world/sim with `ReplayController`s and a
  minimal scrub HUD (pause/×1/×4/step); the spectator is live during playback.

## Tech stack

Existing only: TypeScript + vitest + three. `fake-indexeddb` is already a dev dependency
(the existing `idb-store.test.ts` uses it). No new dependencies.

## File map

| File | Action |
|------|--------|
| `docs/superpowers/specs/2026-09-06-replay-spectator-playback-design.md` | new (Task 1) |
| `docs/superpowers/plans/2026-09-06-replay-spectator-playback.md` | new — this file (Task 1) |
| `src/replay.ts` | new (Task 2) |
| `src/entity.ts` | edit (Task 2 — `Sim.onSpawn`/`onDespawn`) |
| `src/__tests__/replay.test.ts` | new (Tasks 2–3) |
| `src/persistence.ts` | edit (Task 4 — `saveReplay`/`loadReplay`) |
| `src/idb-store.ts` | edit (Task 4 — `replays` store + `putReplay`/`getReplay`) |
| `src/__tests__/idb-store.test.ts` | edit (Task 4) |
| `src/main.ts` | edit (Task 5) |
| `docs/adr/0017-replay.md` | new (Task 6) |
| `docs/adr/README.md`, `TODO.md`, `PROJECT.md` | edit (Task 6) |

## Pinned numbers (must not regress)

All phase 1/2 pins unchanged (`STEP 1/60`, `TERRAIN_SEED 1234`, the dolt/spectator kinds,
`WATER_STRIDE 30`/`WATER_PULSE 1000`, `water-load` PIN 1,231,601 / 10,690, `mesher-budget`).
The replay round-trip and seek tests are pinned at **1200 ticks**; the comparison is
byte-identical for chunk arrays and 1e-9 for entity transforms.

## Execution notes

- TDD per task: failing tests first, then implementation, run, commit.
- **The determinism test is the point.** If it fails, the bug is in the sim (a
  `Set`/`Map` iteration-order dependency, a wall-clock leak, or a non-deterministic draw) —
  fix the sim, do NOT paper over it in the replay. Light is excluded from the comparison.
- Cross-imports: `replay.ts` imports `type { ChunkRecord, WorldMeta }` from `persistence.ts`
  (type-only) and `NULL_INTENT` from `entity.ts` (runtime). `persistence.ts`/`idb-store.ts`
  import `type Replay` from `replay.ts` (type-only). **No runtime cycle.**

---

## Task 1: gate check (docs already committed)

**Files:** none — the spec + this plan were committed in the up-front docs commit.

**Step 1:** Confirm the phase 1/2 gates are green (`npm test` + `npm run build`). This also
confirms the phase 1/2 code (entities/sim/persistence v2, mobs/possession/spectator) is in —
this plan builds on it.

**Step 2:** (No commit here — the phase 3 docs were committed up front with the other phase
docs. The code commits happen in Tasks 2–6.)

---

## Task 2: `src/replay.ts` — the model, `Recorder`, `ReplayController`

**Files:** `src/replay.ts` (new), `src/entity.ts` (edit), `src/__tests__/replay.test.ts`
(new)

**Step 1: Write the failing tests** — create `src/__tests__/replay.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, localIndex } from '../world';
import { WaterSim } from '../water';
import { WorldTime, tickCrossed } from '../time';
import { TERRAIN_SEED } from '../terrain';
import {
  Sim, SimRng, KINDS, NULL_INTENT, HumanController, IdleController, MobController,
  ScriptController, type Entity, type Intent, type Controller, type EntityRecord, type ApplyHooks,
} from '../entity';
import { snapshotChunk, applyRecord } from '../persistence';
import { Recorder, ReplayController, intentEqual, InMemoryReplayStore, applySpawnAt, parseReplayParam, type Replay, type ReplaySnapshot, type IntentEntry } from '../replay';

const STEP = 1 / 60;
const WATER_STRIDE = 30;
const WATER_PULSE = 1000;

describe('replay — delta-coding + ReplayController', () => {
  it('intentEqual: identical intents (absent optionals included) compare equal', () => {
    const a: Intent = { ...NULL_INTENT, yaw: 0.5, pitch: 0.1, block: Block.Planks };
    const b: Intent = { ...NULL_INTENT, yaw: 0.5, pitch: 0.1, block: Block.Planks };
    expect(intentEqual(a, b)).toBe(true);
    const c: Intent = { ...a, block: Block.Stone };
    expect(intentEqual(a, c)).toBe(false);
    expect(intentEqual(undefined, a)).toBe(false);
  });

  it('Recorder: logs an intent only when it changes (delta-coded)', () => {
    const rec = new Recorder(0);
    const e: Entity = {
      id: 1, kind: KINDS.player, pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0, pitch: 0, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: { intent: () => NULL_INTENT }, baseController: { intent: () => NULL_INTENT },
    };
    const i0: Intent = { ...NULL_INTENT };
    const i1: Intent = { ...NULL_INTENT, forward: 1 };
    rec.onIntent(0, e, i0); // logged (differs from none)
    rec.onIntent(1, e, i0); // NOT logged (same as previous)
    rec.onIntent(2, e, i1); // logged (changed)
    rec.onIntent(3, e, i1); // NOT logged
    expect(rec.intents).toEqual([{ tick: 0, entityId: 1, intent: i0 }, { tick: 2, entityId: 1, intent: i1 }]);
  });

  it('ReplayController: repeats the last logged intent at-or-before the tick (the "no entry" semantic)', () => {
    const entries: IntentEntry[] = [
      { tick: 0, entityId: 1, intent: { ...NULL_INTENT, forward: 0 } },
      { tick: 5, entityId: 1, intent: { ...NULL_INTENT, forward: 1 } },
    ];
    const c = new ReplayController(entries);
    expect(c.intent(dummyEntity(), 0).forward).toBe(0);
    expect(c.intent(dummyEntity(), 4).forward).toBe(0); // repeats the tick-0 intent
    expect(c.intent(dummyEntity(), 5).forward).toBe(1); // the tick-5 intent
    expect(c.intent(dummyEntity(), 9).forward).toBe(1); // repeats the tick-5 intent
    expect(c.intent(dummyEntity(), -1).forward).toBe(0); // before the first entry -> null intent
  });

  it('InMemoryReplayStore round-trips a replay', async () => {
    const s = new InMemoryReplayStore();
    const r: Replay = { seed: 1, startTick: 0, endTick: 10, simPrng: 42, events: [], intents: [], snapshot: { chunks: [], meta: {} as never } };
    await s.putReplay('1:replay:0', r);
    expect(await s.getReplay('1:replay:0')).toEqual(r);
    expect(await s.getReplay('1:replay:99')).toBeUndefined();
  });

  it('parseReplayParam reads the ?replay key (or null)', () => {
    expect(parseReplayParam('?replay=1234:replay:0')).toBe('1234:replay:0');
    expect(parseReplayParam('?foo=bar')).toBeNull();
    expect(parseReplayParam('')).toBeNull();
  });
});

function dummyEntity(): Entity {
  return {
    id: 1, kind: KINDS.player, pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 },
    yaw: 0, pitch: 0, onGround: true, inWater: false, headInWater: false,
    fly: false, noclip: false, controller: { intent: () => NULL_INTENT }, baseController: { intent: () => NULL_INTENT },
  };
}
```

**Step 2: Implement** — create `src/replay.ts`:

```ts
import { type ChunkRecord, type WorldMeta } from './persistence';
import { NULL_INTENT, type Entity, type Intent, type EntityRecord, type Controller } from './entity';

// A replay = an initial snapshot + a delta-coded intent log. Every state change flows
// through intents on the tick (ADR 0015), so this is a complete, replayable record.
export interface IntentEntry { tick: number; entityId: number; intent: Intent }
export interface EntityEvent { tick: number; type: 'spawn' | 'despawn'; id: number; kindId?: string; pose?: EntityRecord }
export interface ReplaySnapshot { chunks: ChunkRecord[]; meta: WorldMeta }
export interface Replay {
  seed: number; startTick: number; endTick: number;
  simPrng: number;           // the sim PRNG state at record start (restore before replaying)
  events: EntityEvent[];
  intents: IntentEntry[];    // delta-coded: an entity with no entry at a tick REPEATS its previous intent
  snapshot: ReplaySnapshot;  // every loaded chunk + the WorldMeta at record start (ADR 0014 shapes)
}

/** Delta-coding comparison. Optional fields (`select`/`block`/toggles) compare with a
 *  sentinel so "absent" and "present-but-default" are distinguished. */
export function intentEqual(a: Intent | undefined, b: Intent): boolean {
  if (!a) return false;
  return a.forward === b.forward && a.strafe === b.strafe && a.up === b.up && a.down === b.down
    && a.yaw === b.yaw && a.pitch === b.pitch && a.primary === b.primary && a.secondary === b.secondary
    && (a.select ?? -1) === (b.select ?? -1) && (a.block ?? -1) === (b.block ?? -1)
    && (a.toggleFly ?? false) === (b.toggleFly ?? false) && (a.toggleNoclip ?? false) === (b.toggleNoclip ?? false);
}

/**
 * Captures a session: intents (delta-coded, via `sim.onIntent`) and entity spawn/despawn
 * events (via `sim.onSpawn`/`sim.onDespawn`). `attach` wires the sim's callbacks.
 */
export class Recorder {
  readonly events: EntityEvent[] = [];
  readonly intents: IntentEntry[] = [];
  private last = new Map<number, Intent>();
  private lastTick: number;
  onIntent: (tick: number, e: Entity, it: Intent) => void;
  constructor(startTick: number) {
    this.lastTick = startTick;
    this.onIntent = (tick, e, it) => {
      this.lastTick = tick;
      const prev = this.last.get(e.id);
      if (!intentEqual(prev, it)) {
        this.intents.push({ tick, entityId: e.id, intent: { ...it } });
        this.last.set(e.id, it);
      }
    };
  }
  attach(sim: { onIntent: any; onSpawn: any; onDespawn: any; toRecord: (e: Entity) => EntityRecord }): void {
    sim.onIntent = this.onIntent;
    // A spawn event carries the entity's pose (via toRecord) so playback can re-spawn it.
    sim.onSpawn = (e: Entity) => this.events.push({ tick: this.lastTick, type: 'spawn', id: e.id, kindId: e.kind.id, pose: sim.toRecord(e) });
    sim.onDespawn = (e: Entity) => this.events.push({ tick: this.lastTick, type: 'despawn', id: e.id });
  }
}

/**
 * Feeds one entity its logged intents: at tick T it returns the LAST logged intent with
 * tick <= T (the "no entry means repeat previous" semantic); before the first entry it
 * returns NULL_INTENT. Entries must be in tick order (the recorder emits them so).
 */
export class ReplayController {
  private idx = 0;
  private last: Intent | null = null;
  constructor(private readonly entries: IntentEntry[]) {}
  intent(_e: Entity, tick: number): Intent {
    while (this.idx < this.entries.length && this.entries[this.idx].tick <= tick) {
      this.last = this.entries[this.idx].intent;
      this.idx++;
    }
    return this.last ? { ...this.last } : { ...NULL_INTENT };
  }
}

/** Spawn the entities whose spawn event fires at `tick` (from the event's pose + their
 *  controller). `restoreEntity` is a no-op for ids already present. Despawns are re-derived
 *  by the sim's fall-out-of-world rule, so only spawn events are re-applied. */
export function applySpawnAt(
  sim: { restoreEntity(rec: EntityRecord, c: Controller): Entity | null },
  replay: Replay, tick: number, controllerFor: (r: EntityRecord) => Controller,
): void {
  for (const ev of replay.events)
    if (ev.type === 'spawn' && ev.tick === tick && ev.pose)
      sim.restoreEntity(ev.pose, controllerFor(ev.pose));
}

/** Parse the `?replay=<key>` URL param (pure, node-testable). Returns the key or null. */
export function parseReplayParam(search: string): string | null {
  return new URLSearchParams(search).get('replay');
}

export interface ReplayStore {
  putReplay(key: string, replay: Replay): Promise<void>;
  getReplay(key: string): Promise<Replay | undefined>;
}
/** Node-test backend (mirrors InMemoryChunkStore). */
export class InMemoryReplayStore implements ReplayStore {
  private data = new Map<string, Replay>();
  async putReplay(key: string, replay: Replay): Promise<void> { this.data.set(key, replay); }
  async getReplay(key: string): Promise<Replay | undefined> { return this.data.get(key); }
}
```

`src/entity.ts` — add to `Sim` (optional callbacks the `Recorder` hooks):

```ts
onSpawn?: (e: Entity) => void;
onDespawn?: (e: Entity) => void;
```

and fire them: at the end of `spawn(...)` add `this.onSpawn?.(e);`; in `despawn(id)`, rework
it to fetch-then-delete-then-fire — `const e = this.entities.get(id); if (e)
this.onDespawn?.(e); this.entities.delete(id); …` (phase 1's `despawn` opens with
`this.entities.delete(id);`, so the fetch must come first). (Do NOT fire `onSpawn` from
`restoreEntity` — restored / re-applied entities are in the snapshot, not new events.)

**Step 3: Verify** — `npx vitest run src/__tests__/replay.test.ts`.

**Step 4: Commit**

```
feat: replay.ts — the replay model, Recorder (delta-coded), ReplayController, Sim spawn/despawn hooks
```

---

## Task 3: the determinism gate — round-trip + seek

**Files:** `src/__tests__/replay.test.ts` (append)

This is the load-bearing test. It records a 1200-tick session (a bot building, a dolt
wandering, a spring placed), replays it on a fresh world, and asserts byte/1e-9 identity.
**If it fails, the bug is in the sim — fix the sim, not the test.**

**Step 1: Append the round-trip + seek tests** — to `src/__tests__/replay.test.ts`:

```ts
// --- the determinism gate -------------------------------------------------------------

function buildTestWorld(world: World): void {
  const c = world.ensureChunk(0, 0, 0);
  for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, 4, lz)] = Block.Grass;
  for (let y = 5; y < 10; y++) for (let lx = 0; lx < 4; lx++) c.blocks[localIndex(lx, y, 0)] = Block.Stone; // a wall the bot builds on
}

function makeSim(world: World, waterSim: WaterSim): Sim {
  const hooks: ApplyHooks = {
    waterEdit: (x, y, z, b) => waterSim.edit(x, y, z, b),
    springTarget: (x, y, z) => waterSim.cellState(x, y, z).p === 1,
    // onEdit: a no-op in the node test (no remesh/light)
  };
  const sim = new Sim(world, hooks, TERRAIN_SEED);
  sim.respawn = { x: 4, y: 5, z: 4 };
  return sim;
}

function snapshotState(world: World, sim: Sim, worldTime: WorldTime): ReplaySnapshot {
  return {
    chunks: [...world.allChunks()].map((ch) => snapshotChunk(ch, sim.entitiesInChunk(ch.cx, ch.cy, ch.cz).map((e) => sim.toRecord(e)))),
    meta: { v: 2, seed: TERRAIN_SEED, entities: sim.all().map((e) => sim.toRecord(e)), viewedEntityId: sim.viewedId, simPrng: sim.rng.state(), time: worldTime.snapshot(), hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 0 } },
  };
}

// Drive the entity sim + water sim + world time for n ticks EXACTLY as main.ts does (ADR 0011).
// `onTick` (if given) runs AFTER sim.tick for each tick — used to (a) spawn a mid-session dolt
// in the recording and (b) re-apply spawn events in the replay (applySpawnAt).
function runTicks(world: World, sim: Sim, waterSim: WaterSim, worldTime: WorldTime, n: number, onTick?: (tick: number) => void): void {
  for (let i = 0; i < n; i++) {
    const tickBefore = worldTime.tick;
    sim.tick(STEP, worldTime.tick);
    worldTime.advance(STEP);
    if (tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)) waterSim.tick(WATER_PULSE);
    onTick?.(tickBefore);
  }
}

function flat(world: World): number[] {
  return [...world.allChunks()].flatMap((c) => Array.from(c.blocks));
}

function recordSession(): { replay: Replay; chunks: number[]; entities: EntityRecord[] } {
  const world = new World(); buildTestWorld(world);
  const waterSim = new WaterSim(world);
  const worldTime = new WorldTime(0);
  const sim = makeSim(world, waterSim);
  // A bot building (dig the wall, cap it with planks) and a player placing a spring — both in
  // the snapshot. The dolt spawns MID-session (a spawn EVENT, not in the snapshot) so the
  // replay must re-apply it via applySpawnAt.
  const botScript = [{ op: 'lookAt', x: 0, y: 6, z: 0 }, { op: 'dig', ticks: 20 }, { op: 'place', block: Block.Planks, ticks: 20 }, { op: 'wait', ticks: 1160 }] as const;
  sim.spawn({ x: 0.5, y: 5, z: 4 }, new ScriptController([...botScript]), { baseController: new ScriptController([...botScript]) });
  const pScript = [{ op: 'place', block: Block.Water, ticks: 3 }, { op: 'wait', ticks: 1197 }] as const;
  const player = sim.spawn({ x: 5.5, y: 5, z: 5 }, new ScriptController([...pScript]), { baseController: new ScriptController([...pScript]) });
  sim.homeId = player.id;

  const rec = new Recorder(worldTime.tick);
  rec.attach(sim);
  const snapshot = snapshotState(world, sim, worldTime); // bot + player only (no dolt yet)
  runTicks(world, sim, waterSim, worldTime, 1200, (t) => {
    if (t === 100) { // mid-session dolt spawn -> a spawn event (fires onSpawn, tick = 100)
      const doltMob = new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next());
      sim.spawn({ x: 10, y: 5, z: 10 }, doltMob, { kindId: 'dolt', baseController: doltMob });
    }
  });
  const replay: Replay = { seed: TERRAIN_SEED, startTick: 0, endTick: 1200, simPrng: snapshot.meta.simPrng, events: rec.events, intents: rec.intents, snapshot };
  return { replay, chunks: flat(world), entities: sim.all().map((e) => sim.toRecord(e)) };
}

// Fresh world + sim from a replay's snapshot; replay the log to `toTick`. Returns the state
// at `toTick` (chunks, entities, and a fresh snapshot for seeking).
function replayTo(replay: Replay, toTick: number): { chunks: number[]; entities: EntityRecord[]; snapshot: ReplaySnapshot; simPrng: number; time: ReturnType<WorldTime['snapshot']> } {
  const world = new World();
  for (const rec of replay.snapshot.chunks) applyRecord(world, rec); // chunk arrays (no entities yet)
  const waterSim = new WaterSim(world);
  const worldTime = new WorldTime(0);
  worldTime.restore(replay.snapshot.meta.time);
  const sim = makeSim(world, waterSim);
  sim.rng.restore(replay.simPrng);
  const controllerFor = (r: EntityRecord): Controller => {
    const entries = replay.intents.filter((e) => e.entityId === r.id);
    if (entries.length) return new ReplayController(entries);
    if (r.kindId === 'dolt') return new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next());
    return new IdleController();
  };
  sim.restoreEntities(replay.snapshot.meta.entities, controllerFor);
  sim.setViewed(replay.snapshot.meta.viewedEntityId);
  runTicks(world, sim, waterSim, worldTime, toTick - replay.snapshot.meta.time.tick,
    (t) => applySpawnAt(sim, replay, t, controllerFor)); // re-apply mid-session spawn events
  const snap = snapshotState(world, sim, worldTime);
  return { chunks: flat(world), entities: sim.all().map((e) => sim.toRecord(e)), snapshot: snap, simPrng: sim.rng.state(), time: worldTime.snapshot() };
}

function sameTransforms(a: EntityRecord[], b: EntityRecord[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((e) => {
    const m = b.find((x) => x.id === e.id)!;
    return Math.abs(m.x - e.x) < 1e-9 && Math.abs(m.y - e.y) < 1e-9 && Math.abs(m.z - e.z) < 1e-9
      && Math.abs(m.yaw - e.yaw) < 1e-9 && Math.abs(m.pitch - e.pitch) < 1e-9;
  });
}

describe('replay — the determinism gate', () => {
  it('record -> replay on a fresh world is byte/1e-9 identical', () => {
    const a = recordSession();
    const b = replayTo(a.replay, 1200);
    expect(b.chunks).toEqual(a.chunks); // every loaded chunk's arrays byte-identical
    expect(sameTransforms(a.entities, b.entities)).toBe(true); // every entity's transform to 1e-9
  });

  it('seeking: snapshot at T, replay forward, matches a direct replay (lossless replay point)', () => {
    const { replay } = recordSession();
    const T = 600, D = 300;
    const direct = replayTo(replay, T + D);
    const atT = replayTo(replay, T);
    const seekReplay: Replay = { ...replay, startTick: T, simPrng: atT.simPrng, snapshot: atT.snapshot };
    const seek = replayTo(seekReplay, T + D);
    expect(seek.chunks).toEqual(direct.chunks);
    expect(sameTransforms(direct.entities, seek.entities)).toBe(true);
  });
});
```

**Step 2: Run and fix the SIM (not the test).** `npx vitest run src/__tests__/replay.test.ts`.
If the round-trip or seek fails, hunt the sim's nondeterminism (in order of likelihood):
(a) anything that iterates `world.allChunks()` (a `Map`) for physics and depends on insertion
order; (b) a `performance.now()`/wall-clock leak into sim state; (c) a draw not routed through
`sim.rng` in the id order; (d) the water sim not driven identically (`runTicks` must match
main.ts's `tickCrossed` striding). Light is excluded. Fix the sim until the gate is green.

**Step 3: Verify** — `npx vitest run src/__tests__/replay.test.ts src/__tests__/entity.test.ts src/__tests__/player.test.ts`
(the gate green; phase 1/2 baselines still green).

**Step 4: Commit**

```
test: replay determinism gate — record->replay round-trip + seek, byte/1e-9 identical
```

---

## Task 4: IndexedDB replay store

**Files:** `src/persistence.ts`, `src/idb-store.ts`, `src/__tests__/idb-store.test.ts`

**Step 1: Write the failing tests** — append to `src/__tests__/idb-store.test.ts` (import
`type Replay` from `../replay` and build a minimal replay):

```ts
const replayRec = (): import('../replay').Replay => ({
  seed: 1234, startTick: 0, endTick: 10, simPrng: 0xdeadbeef, events: [],
  intents: [{ tick: 0, entityId: 1, intent: { forward: 0, strafe: 0, up: false, down: false, yaw: 0, pitch: 0, primary: false, secondary: false } }],
  snapshot: { chunks: [], meta: { v: 2, seed: 1234, entities: [], viewedEntityId: 1, time: { time: 0, tick: 0, phaseTotal: 0 }, hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 0 } } },
});

describe('IndexedDBChunkStore — replays (fake-indexeddb)', () => {
  it('putReplay/getReplay round-trips a replay', async () => {
    setIndexedDB();
    const store = new IndexedDBChunkStore('bw-idb-replay', 2);
    await store.putReplay('1234:replay:0', replayRec());
    const got = await store.getReplay('1234:replay:0');
    expect(got!.intents[0].intent.forward).toBe(0);
    expect(got!.simPrng).toBe(0xdeadbeef);
  });
});
```

**Step 2: Implement.**

`src/idb-store.ts` — add the `replays` store + methods (import `type Replay` from
`./replay`):

```ts
// Version BUMP to 2: an existing v1 browser DB never fires onupgradeneeded on a v1 open, so
// the `replays` store would silently never be created in the browser (the fresh-DB node test
// masks this). At v2 a returning user's DB fires onupgradeneeded (v1 -> v2) and `replays` is
// created. `main.ts`'s `new IndexedDBChunkStore()` must open at this version.
constructor(name = 'block-world', version = 2) {
  this.dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('chunks')) req.result.createObjectStore('chunks');
      if (!req.result.objectStoreNames.contains('replays')) req.result.createObjectStore('replays');
    };
    // ...
  });
}

private txReplay<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return this.dbp.then((db) => new Promise<T>((resolve, reject) => {
    const t = db.transaction('replays', mode);
    const req = run(t.objectStore('replays'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

async putReplay(key: string, replay: Replay): Promise<void> {
  await this.txReplay('readwrite', (s) => s.put(replay, key));
}
async getReplay(key: string): Promise<Replay | undefined> {
  const r = await this.txReplay<Replay | undefined>('readonly', (s) => s.get(key) as IDBRequest<Replay | undefined>);
  return r ?? undefined;
}
```

`src/persistence.ts` — `import type { Replay, ReplayStore } from './replay'`; the
`Persistence` constructor gains an optional `replayStore?: ReplayStore`; add:

```ts
saveReplay(key: string, replay: Replay): void {
  this.replayStore?.putReplay(key, replay).catch(() => undefined); // D7: error-tolerant
}
loadReplay(key: string): Promise<Replay | undefined> {
  return this.replayStore?.getReplay(key).catch(() => undefined) ?? Promise.resolve(undefined);
}
```

**Step 3: Verify** — `npx vitest run src/__tests__/idb-store.test.ts src/__tests__/persistence.test.ts`.

**Step 4: Commit**

```
feat: IndexedDB replay store + Persistence.saveReplay/loadReplay
```

---

## Task 5: `main.ts` — `R` record, `?replay` playback, scrub HUD, live spectator

**Files:** `src/main.ts`. Verify with `npm run build` + `npm test` + the Task 6 browser gate.

**Step 1: Imports + state.** Add (also import `IdleController`, `EntityRecord`, `Controller`
from `./entity` — phase 2 already imports most — and `snapshotChunk` from `./persistence` —
already used by the normal save path):

```ts
import { Recorder, ReplayController, InMemoryReplayStore, applySpawnAt, parseReplayParam, type Replay, type ReplaySnapshot } from './replay';
let recording: { rec: Recorder; snapshot: ReplaySnapshot; startTick: number } | null = null;
let playback: { replay: Replay; tick: number; paused: boolean; speed: 1 | 4 } | null = null;
// The active playback's entity-controller factory (assigned in Step 3, reused by the Step 4
// loop to re-apply mid-session spawn events). Defaults to idle until a replay loads.
let replayControllerFor: (r: EntityRecord) => Controller = () => new IdleController();
```

Wire a replay store into `persist` (the IDB store already has `putReplay`/`getReplay`):

```ts
// after `persist` is created:
persist = new Persistence(store, TERRAIN_SEED);  // unchanged
// Persistence now also accepts the store as its ReplayStore (IndexedDBChunkStore satisfies both).
```

(Update the `Persistence` constructor call to pass the store as the `replayStore`, or set
`persist`'s replay store — the `IndexedDBChunkStore` instance is both a `ChunkStore` and a
`ReplayStore`.)

**Step 2: `R` record start/stop.** In the keydown handler: `if (e.code === 'KeyR')
toggleRecording();`:

```ts
// A snapshot of the current sim (every loaded chunk + the WorldMeta) — the replay's starting
// state. (Same shape the determinism test's snapshotState builds.)
function snapshotState(): ReplaySnapshot {
  return {
    chunks: [...world.allChunks()].map((ch) => snapshotChunk(ch, sim.entitiesInChunk(ch.cx, ch.cy, ch.cz).map((e) => sim.toRecord(e)))),
    meta: { v: 2, seed: TERRAIN_SEED, entities: sim.all().map((e) => sim.toRecord(e)), viewedEntityId: sim.viewedId, simPrng: sim.rng.state(), time: worldTime.snapshot(), hotbar: { slots: hotbar.slots, selected: hotbar.selected } },
  };
}

function toggleRecording(): void {
  if (recording) {
    const replay: Replay = {
      seed: TERRAIN_SEED, startTick: recording.startTick, endTick: worldTime.tick,
      simPrng: recording.snapshot.meta.simPrng, events: recording.rec.events, intents: recording.rec.intents,
      snapshot: recording.snapshot,
    };
    persist.saveReplay(`${TERRAIN_SEED}:replay:${recording.startTick}`, replay);
    recording = null;
    console.log(`[replay] saved ${replay.intents.length} intent deltas, ticks ${replay.startTick}..${replay.endTick}`);
  } else {
    const rec = new Recorder(worldTime.tick);
    rec.attach(sim);
    recording = { rec, snapshot: snapshotState(), startTick: worldTime.tick };
    console.log('[replay] recording... (R to stop)');
  }
}
```

**Step 3: `?replay=<key>` load + playback.** In `startGame`, check the URL FIRST. If present,
**skip the normal spawn/restore** (a boot-spawned player id 1 would shadow the snapshot's
entity id 1) and load the replay into the current (freshly booted) world/sim; the **spectator
(ghost) is the live viewer** (its controller is the `human` controller, and the camera follows
it — not the recorded viewed entity):

```ts
const replayKey = parseReplayParam(location.search);
if (replayKey) {
  void persist.loadReplay(replayKey).then((replay) => {
    if (!replay) { console.log('[replay] not found'); return; }
    for (const rec of replay.snapshot.chunks) applyRecord(world, rec); // chunk arrays
    sim.rng.restore(replay.simPrng);
    worldTime.restore(replay.snapshot.meta.time);
    replayControllerFor = (r: EntityRecord): Controller => {
      if (r.kindId === 'spectator') return human; // the live spectator (the viewer)
      const entries = replay.intents.filter((e) => e.entityId === r.id);
      if (entries.length) return new ReplayController(entries);
      if (r.kindId === 'dolt') return new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next());
      return new IdleController();
    };
    sim.restoreEntities(replay.snapshot.meta.entities, replayControllerFor);
    // Derive the ghost (the single spectator); spawn one if the snapshot had none.
    sim.ghostId = sim.all().find((e) => e.kind.id === 'spectator')?.id ?? 0;
    if (sim.ghostId === 0) {
      const v = sim.viewed() ?? sim.all()[0]!;
      sim.ghostId = sim.spawn({ x: v.pos.x, y: v.pos.y + 4, z: v.pos.z }, new IdleController(), { kindId: 'spectator', baseController: new IdleController() }).id;
    }
    sim.setViewed(sim.ghostId); // camera follows the live spectator, not the recorded viewed entity
    playback = { replay, tick: replay.startTick, paused: false, speed: 1 };
    console.log(`[replay] loaded ${replay.intents.length} deltas, playing ${replay.startTick}..${replay.endTick}`);
  });
} else {
  // the normal boot spawn/restore (phase 1/2 path)
}
```

**Step 4: The playback loop.** In `frame()`, when `playback` is active, advance the replay
instead of running live input (the `ReplayController`s drive the recorded entities; the
spectator stays live; mid-session spawn events are re-applied via `applySpawnAt`):

```ts
if (playback && playback.tick <= playback.replay.endTick && !playback.paused) {
  const steps = playback.speed;
  for (let i = 0; i < steps && playback.tick <= playback.replay.endTick; i++) {
    const tickBefore = worldTime.tick;
    sim.tick(STEP, worldTime.tick);
    worldTime.advance(STEP);
    if (tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)) waterSim.tick(WATER_PULSE);
    applySpawnAt(sim, playback.replay, tickBefore, replayControllerFor); // re-apply mid-session spawns
    playback.tick = worldTime.tick;
  }
} else {
  // the normal live substep loop (unchanged)
  human.heldBlock = hotbar.block;
  while (acc >= STEP) { acc -= STEP; sim.tick(STEP, worldTime.tick); worldTime.advance(STEP); }
}
```

(`replayControllerFor` is the module-scope variable assigned in Step 3, so the Step 4 frame
loop can re-apply spawn events with the same controllers.) The spectator
(ghost) is NOT given a `ReplayController` — it keeps the live `human` controller, so the
viewer can fly around the playback (its kind is `canEdit: false`, so it perturbs nothing).
**Scrub HUD:** a minimal `#scrub` bar (tick counter + `pause`/`×1`/`×4`/`step`); `space`
pauses, `1`/`4` set speed, `.` steps one tick. Keep it small.

**Step 5: Verify** — `npm run build` (clean) and `npm test` (the full node suite green). Then
the Task 6 browser gate.

**Step 6: Commit**

```
feat: main.ts replay — R record to IDB, ?replay playback with scrub HUD, live spectator view
```

---

## Task 6: gates + ADR 0017 + TODO (multiplayer item) + docs

**Files:** `docs/adr/0017-replay.md` (new), `docs/adr/README.md`, `TODO.md`, `PROJECT.md`.

**Step 1: Full gate.** `npm test` (green, including the phase 1/2 pins + the new replay
determinism gate) and `npm run build` (clean).

**Step 2: Browser acceptance** (manual; `npm run dev`):
- `R` records a session; `R` again saves it (a console line reports the delta count + tick
  range). Reload with `?replay=<key>`: the session plays back — the bot rebuilds, the dolt
  re-wanders, the spring re-flows, byte-identically to the original.
- The scrub HUD pauses/×1/×4/step works. The spectator can fly around the playback (the
  viewer is a free ghost) without perturbing it.
- The `?prof=remesh` rig still passes (replay is additive; the worst-chunk pins are
  unchanged).

**Step 3: ADR 0017.** Write `docs/adr/0017-replay.md` (Status: Accepted; Sources: the spec +
plan). Capture, at least: the model (replay = snapshot + delta-coded intent log; the
"no entry = repeat previous" semantic; `intentEqual`); why it is complete (every state
change flows through intents on the tick — ADR 0015); the **determinism contract** (sim-owned
tick-ordered PRNG, no wall clock, no insertion-order physics, light excluded) and the
round-trip + seek gates; the IDB `replays` store (key `${seed}:replay:${startTick}`, the
snapshot reusing ADR 0014 shapes — no new format) and its **v2 bump** (an existing v1 browser
DB never fires `onupgradeneeded` on a v1 open, so `replays` is only created at v2);
mid-session **spawn-event replay** (a dolt born during the session is re-applied at its spawn
tick via `applySpawnAt`, not only at the snapshot); the `?replay` **boot ordering** (skip the
normal spawn/restore so a boot-spawned id 1 can't shadow the snapshot's id 1); the spectator
as a non-perturbing live viewer whose controller is the live `human` (the camera follows the
ghost, not the recorded viewed entity); the `[POC shortcut]`s (raw delta-coded intents,
snapshot reuse, seek re-runs from the snapshot). Alternatives considered: recording raw world
diffs (rejected — water state is not derivable from block diffs, ADR 0014), a
keyframed/interpolated playback (rejected — the intent log IS the playback; determinism is
the point), and network-transporting intents now (rejected — non-goal; the TODO item reframes
it).

**Step 4: TODO.md — the multiplayer item.** Add (under a "Multiplayer" heading): "Multiplayer
= a **remote controller** + **intent transport** + **host authority** over the water/mob PRNG.
The engine already treats the human as one of many controllers and every state change as an
intent on the tick (ADR 0015); a replay (ADR 0017) is a recorded intent log, which is the
same shape as a network stream. What remains: a transport, an authoritative host that owns the
water/mob PRNG and adjudicates edits, and client prediction/rollback. Start the next brief
from here."

**Step 5: Docs.** Update `docs/adr/README.md` (add 0017) and `PROJECT.md` (feature/ownership
table + pointer to ADR 0017).

**Step 6: Commit**

```
docs: ADR 0017 — replay (snapshot + intent log); TODO multiplayer reframed
```

---

## Self-review

- **Brief coverage (phase 3):** `replay.ts` `Recorder` (delta-coded `{tick, entityId,
  intent}`, spawn/despawn events (re-applied at their tick via `applySpawnAt` during
  playback), the PRNG seed) ✓; snapshot = persistence records +
  `WorldMeta` (reuse `snapshotChunk`/`applyRecord`, no new format) ✓; `ReplayController`
  (logged intents; entities with no logged intents run their default controllers,
  deterministic given the PRNG) ✓; playback (load snapshot into a fresh world + sim, run
  ticks; the `?replay` boot skips the normal spawn/restore so no id-1 shadow) ✓; the
  spectator viewable with a live human controller (no world-changing intents; the camera
  follows the ghost, not the recorded viewed entity); the round-trip determinism test (bot building + dolt wandering + spring placed, 1200
  ticks, byte/1e-9) ✓ + the seek test ✓; `R` start/stop → IDB `${seed}:replay:${startTick}`
  ✓; `?replay=<key>` load + minimal scrub HUD (pause/×1/×4/step) ✓; the "nondeterminism is a
  sim bug" stance ✓; ADR 0017 ✓; the TODO multiplayer item ✓.
- **Determinism is the load-bearing invariant:** the round-trip proves the SIM is
  deterministic given the logged intents (the AI is captured, not re-run). The seek test
  proves the snapshot at `T` is a lossless replay point. The phase 2 1200-tick MobController
  test separately proves the AI is deterministic given the PRNG.
- **No runtime import cycle:** `replay.ts` → `entity.ts` (runtime, `NULL_INTENT`;
  type-only, `EntityRecord`/`Controller`) + `persistence.ts` (type-only);
  `persistence.ts`/`idb-store.ts` → `replay.ts` (type-only).
- **Known risks:** (a) the round-trip is the first test that exercises the full sim
  (entity + water + time) deterministically — it may surface a real sim nondeterminism bug;
  that is the intended outcome (fix the sim); (b) `main.ts` playback reuses the live
  world/sim (a fresh boot) rather than a separate instance — a POC simplification (`[POC
  shortcut]`); (c) the scrub HUD is minimal by design; (d) `InMemoryReplayStore` is for node
  tests; the browser uses the IDB `replays` store; (e) the `recordSession` helper spawns the
  dolt MID-session (t===100) specifically to exercise spawn-event replay; (f) the IDB store
  is bumped to **v2** so the `replays` store is actually created for returning (v1) browser
  DBs — the fresh-DB node test alone would not catch this.
- **Execution order:** Tasks 1→6 in order; Task 3 (the gate) is the critical one; Task 5 is
  the integration. All three phases are complete after Task 6's gate is green.