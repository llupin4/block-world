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
    // before the first entry -> null intent (a FRESH controller — the one above has advanced)
    expect(new ReplayController(entries).intent(dummyEntity(), -1).forward).toBe(0);
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
// `onTick` (if given) runs AFTER sim.tick for each tick — used to (a) spawn a mid-session deer
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
  // the snapshot. The deer spawns MID-session (a spawn EVENT, not in the snapshot) so the
  // replay must re-apply it via applySpawnAt.
  const botScript = [{ op: 'lookAt', x: 0, y: 6, z: 0 }, { op: 'dig', ticks: 20 }, { op: 'place', block: Block.Planks, ticks: 20 }, { op: 'wait', ticks: 1160 }] as const;
  sim.spawn({ x: 0.5, y: 5, z: 4 }, new ScriptController([...botScript]), { baseController: new ScriptController([...botScript]) });
  const pScript = [{ op: 'place', block: Block.Water, ticks: 3 }, { op: 'wait', ticks: 1197 }] as const;
  const player = sim.spawn({ x: 5.5, y: 5, z: 5 }, new ScriptController([...pScript]), { baseController: new ScriptController([...pScript]) });
  sim.homeId = player.id;

  const rec = new Recorder(worldTime.tick);
  rec.attach(sim);
  const snapshot = snapshotState(world, sim, worldTime); // bot + player only (no deer yet)
  runTicks(world, sim, waterSim, worldTime, 1200, (t) => {
    if (t === 100) { // mid-session deer spawn -> a spawn event (fires onSpawn, tick = 100)
      const deerMob = new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next());
      sim.spawn({ x: 10, y: 5, z: 10 }, deerMob, { kindId: 'deer', baseController: deerMob });
    }
  });
  const replay: Replay = { seed: TERRAIN_SEED, startTick: 0, endTick: 1200, simPrng: snapshot.meta.simPrng!, events: rec.events, intents: rec.intents, snapshot };
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
    if (r.kindId === 'deer') return new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next());
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