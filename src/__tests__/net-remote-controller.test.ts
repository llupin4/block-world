import { describe, it, expect } from 'vitest';
import { NULL_INTENT, type Entity } from '../entity';
import { RemoteController } from '../net/remote-controller';
import { NetworkPersistSource } from '../net/network-persist';
import { LoopbackHub } from '../net/transport';
import { type Msg } from '../net/messages';

function dummyEntity(): Entity {
  return {
    id: 1, kind: { id: 'player', half: 0.3, height: 1.8, eye: 1.62, walkSpeed: 5.6, swimSpeed: 3, jumpVel: 9.5, flySpeed: 13, flyVSpeed: 8, canFly: true, canNoclip: true, canEdit: true, collides: true },
    pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 },
    yaw: 0, pitch: 0, onGround: false, inWater: false, headInWater: false,
    fly: false, noclip: false, controller: null as never, baseController: null as never,
  };
}

describe('RemoteController', () => {
  it('holds NULL_INTENT until the first intent, then the last received (a copy)', () => {
    const c = new RemoteController('p');
    expect(c.intent(dummyEntity(), 0)).toEqual({ ...NULL_INTENT });
    c.setIntent({ ...NULL_INTENT, forward: 1, yaw: 0.5 });
    const a = c.intent(dummyEntity(), 1);
    expect(a.forward).toBe(1); expect(a.yaw).toBe(0.5);
    a.forward = 999; // the caller must not be able to mutate the controller's state
    expect(c.intent(dummyEntity(), 2).forward).toBe(1); // a fresh copy
  });
});

describe('NetworkPersistSource', () => {
  it('fetchRecord resolves the chunk the host answers via chunkRec', async () => {
    const hub = new LoopbackHub();
    const client = hub.connect('client');
    const host = hub.connect('host');
    const np = new NetworkPersistSource(client);
    // Wire the client's side channel: a chunkRec resolves the matching fetchRecord
    // (in production the ClientSession owns this wiring).
    client.onMessage((_f, msg: Msg) => { if (msg.type === 'chunkRec') np.resolveChunk(msg.key, msg.rec); });
    host.onMessage((_f, msg: Msg) => {
      if (msg.type === 'chunkReq') {
        host.send('client', { type: 'chunkRec', key: msg.key, rec: { v: 2, cx: 1, cy: 0, cz: 1, blocks: new Uint8Array(4096), meta: new Uint8Array(4096), wlevel: new Uint8Array(4096), wsource: new Uint8Array(4096), wplaced: new Uint8Array(4096), wstream: new Uint8Array(4096) } });
      }
    });
    const p = np.fetchRecord(1, 0, 1); // sends a chunkReq to the host
    hub.pump(0);
    const rec = await p;
    expect(rec).toBeDefined();
    expect(rec!.cx).toBe(1);
  });
});