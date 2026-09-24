import { describe, expect, it } from 'vitest';
import { HumanController, IdleController, Sim } from '../entity';
import { World } from '../world';
import { entityState, shouldSendEntity } from '../net/entity-state';
import { NET_MOB_STATE_STRIDE, NET_STATE_STRIDE } from '../net/messages';
import { ClientSession } from '../net/client';
import { LoopbackHub } from '../net/transport';
import { interpose } from '../net/interp';

describe('entity replication', () => {
  it('keeps player reconciliation precise and sends mobs at one quarter the pose rate', () => {
    const sim = new Sim(new World(), {}, 1);
    const player = sim.spawn({ x: 1.1234567, y: 2, z: 3 }, new IdleController());
    const mob = sim.spawn({ x: -1.1234567, y: 2, z: 3 }, new IdleController(), { kindId: 'deer' });
    const ticks = [0, 3, 6, 9, 12];
    expect(ticks.filter((t) => shouldSendEntity(player, t))).toEqual(ticks);
    expect(ticks.filter((t) => shouldSendEntity(mob, t))).toEqual([0, 12]);
    expect(NET_MOB_STATE_STRIDE).toBe(4 * NET_STATE_STRIDE);
    expect(entityState(player).x).toBe(player.pos.x);
    expect(entityState(mob).x).toBe(-1.123);
    expect(mob.pos.x).toBe(-1.1234567);
  });

  it('retains omitted mobs and interpolates them using the slower pose cadence', () => {
    const client = new ClientSession(
      new LoopbackHub().connect('client'),
      'me',
      new HumanController(new Set()),
    );
    const sim = new Sim(new World(), {}, 1);
    const mob = sim.spawn({ x: 0, y: 2, z: 0 }, new IdleController(), { kindId: 'deer' });
    client.onMessage({ type: 'state', tick: 0, entities: [entityState(mob)] });
    client.onMessage({ type: 'state', tick: 3, entities: [] });
    expect(client.sim.entities.has(mob.id)).toBe(true);
    mob.pos.x = 12;
    client.onMessage({ type: 'state', tick: 12, entities: [entityState(mob)] });
    client.worldTime.tick = 18;
    client.syncPoses();
    expect(client.sim.entities.get(mob.id)!.pos.x).toBe(6);
    client.onMessage({ type: 'despawn', tick: 19, id: mob.id });
    expect(client.sim.entities.has(mob.id)).toBe(false);
  });

  it('still holds across a missed mob update rather than interpolating across a network gap', () => {
    const samples = [0, 24].map((tick) => ({ tick, x: tick, y: 0, z: 0, yaw: 0, pitch: 0 }));
    expect(interpose(samples, 6, NET_MOB_STATE_STRIDE).x).toBe(0);
  });
});
