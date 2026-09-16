import { describe, it, expect } from 'vitest';
import { LoopbackHub } from '../net/transport';
import { HostSession } from '../net/host';
import { ClientSession } from '../net/client';
import { SNAP_SMOOTH_FRAMES, NET_SNAP_EPS } from '../net/messages';
import { HumanController, NULL_INTENT, possess, returnHome } from '../entity';
import { Block } from '../blocks';

const NULL_CTRL = { intent: () => ({ ...NULL_INTENT }) };
const netEnt = (id: number, x: number) => ({ id, kindId: 'player', x, y: 0, z: 0, yaw: 0, pitch: 0, vx: 0, vy: 0, vz: 0, flags: 0 });
const entityRec = (id: number) => ({ id, kindId: 'player', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, fly: false, noclip: false, controllerKind: 'script' });

describe('ClientSession', () => {
  it('joins (welcome) and its world matches the host\'s for a shared chunk after sync', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = new ClientSession(hub.connect('client'), 'me', new HumanController(new Set()));
    const welcomed = new Promise<void>((res) => { client.on('welcome', () => res()); });
    for (let t = 0; t < 40; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    await welcomed;
    // the client generated its own ring; the host's spawn-chunk terrain is present on both
    const hostBlock = host.world.getBlock(8, 34, 40);
    const clientBlock = client.world.getBlock(8, 34, 40);
    expect(clientBlock).toBe(hostBlock); // pristine terrain is identical (shared seed)
  });

  it('a host cell write (cells) is applied to the client world', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = new ClientSession(hub.connect('client'), 'me', new HumanController(new Set()));
    for (let t = 0; t < 40; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    // host edits a cell in the shared chunk
    host.world.setBlock(8, 34, 40, Block.Stone);
    for (let t = 40; t < 50; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    expect(client.world.getBlock(8, 34, 40)).toBe(Block.Stone); // the cells write landed
  });

  it('B1: worldTime slews from a time message (tick kept)', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.worldTime.tick = 30; // the client's tick (the frame loop owns it)
    client.onMessage({ type: 'time', tick: 5000, worldTime: { time: 42, tick: 5000, phaseTotal: 0.25 } });
    expect(client.worldTime.tick).toBe(30); // kept (the frame loop owns the tick)
    expect(client.worldTime.time).toBe(42);
    expect(client.worldTime.dayPhase).toBeCloseTo(0.25);
  });

  it('B1: syncPoses writes the interpolated pose at renderTick (gap <= stride)', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.worldTime.tick = 20; // renderTick = 20 - NET_INTERP_TICKS(6) = 14
    client.sim.restoreEntity(entityRec(7), NULL_CTRL);
    // seed the ring via state messages (host-tick-tagged, gap 3 <= NET_STATE_STRIDE)
    client.onMessage({ type: 'state', tick: 12, entities: [netEnt(7, 0)] });
    client.onMessage({ type: 'state', tick: 15, entities: [netEnt(7, 6)] });
    client.syncPoses();
    const ent = client.sim.entities.get(7);
    // renderTick 14 is between 12 and 15 (gap 3) → lerp at t=(14-12)/(15-12)=2/3 → x=4
    expect(ent!.pos.x).toBeCloseTo(4);
  });

  it('B1: lastStream is set after a tick', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.tick(0);
    expect(client.lastStream).not.toBeNull();
  });

  it('possession on a client can return to the own body (homeId is set on welcome)', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const human = new HumanController(new Set());
    const client = new ClientSession(hub.connect('client'), 'me', human);
    const welcomed = new Promise<void>((res) => { client.on('welcome', () => res()); });
    for (let t = 0; t < 40; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    await welcomed;
    const remote = client.sim.spawn({ x: 0, y: 0, z: 0 }, NULL_CTRL, { kindId: 'player' });
    possess(client.sim, human, remote.id);
    expect(client.sim.viewedId).toBe(remote.id);
    returnHome(client.sim, human);
    expect(client.sim.viewedId).toBe(client.entityId);
  });

  it('Phase C follow-up: a large reconciliation snap lerps the display pose out over SNAP_SMOOTH_FRAMES frames', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.entityId = 7;
    client.sim.restoreEntity(entityRec(7), NULL_CTRL); // the own body at (0,0,0)
    client.tick(0); // sets the client tick (no buffered intents)
    // A state that snaps the own body far away (x 0 -> 10, >> NET_SNAP_EPS).
    client.onMessage({ type: 'state', tick: 0, entities: [netEnt(7, 10)] });
    // the sim pose is correct immediately (the Phase C gate — unchanged by the display lerp)
    expect(client.sim.entities.get(7)!.pos.x).toBeCloseTo(10);
    // the display pose has NOT jumped (a large snap starts a lerp from the pre-snap position)
    expect(client.displayPos.x).toBeCloseTo(0);
    // over exactly SNAP_SMOOTH_FRAMES frames the display pose converges to the sim pose
    for (let f = 0; f < SNAP_SMOOTH_FRAMES; f++) client.syncPoses();
    expect(client.displayPos.x).toBeCloseTo(10);
    // the frame after, the display pose tracks the sim pose exactly
    client.syncPoses();
    expect(client.displayPos.x).toBeCloseTo(client.sim.entities.get(7)!.pos.x);
  });

  it('Phase C follow-up: a small reconciliation snap (<= NET_SNAP_EPS) is instant', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.entityId = 7;
    client.sim.restoreEntity(entityRec(7), NULL_CTRL);
    client.tick(0);
    // a small snap: x 0 -> 0.03 (<= NET_SNAP_EPS = 0.05)
    expect(0.03).toBeLessThan(NET_SNAP_EPS); // sanity: the test's snap is genuinely "small"
    client.onMessage({ type: 'state', tick: 0, entities: [netEnt(7, 0.03)] });
    expect(client.sim.entities.get(7)!.pos.x).toBeCloseTo(0.03);
    // instant: the display pose jumps to the sim pose on the same message (no lerp)
    expect(client.displayPos.x).toBeCloseTo(0.03);
  });

  it('Phase C follow-up: with no snap pending, the display pose tracks the sim pose exactly (no lag)', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.entityId = 7;
    client.sim.restoreEntity(entityRec(7), NULL_CTRL);
    client.tick(0);
    client.sim.entities.get(7)!.pos.x = 5;
    client.syncPoses();
    expect(client.displayPos.x).toBeCloseTo(5);
    client.sim.entities.get(7)!.pos.x = 9;
    client.syncPoses();
    expect(client.displayPos.x).toBeCloseTo(9);
  });
});