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