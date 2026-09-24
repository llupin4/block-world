import { describe, expect, it, vi } from 'vitest';
import { Block } from '../blocks';
import { Sim, IdleController, MobController } from '../entity';
import { InMemoryChunkStore, Persistence } from '../persistence';
import { ChunkRestoration } from '../streaming/chunk-restoration';
import { MobPopulation } from '../simulation/mob-population';
import { restoredController } from '../startup/restore-entities';
import { update } from '../streaming';
import { World } from '../world';
import { HostSession } from '../net/host';
import { LoopbackHub } from '../net/transport';
import { PROTOCOL_VERSION } from '../net/messages';

async function savedPopulation() {
  const world = new World();
  const sim = new Sim(world, {}, 1234);
  const store = new InMemoryChunkStore();
  const persist = new Persistence(store, 1234);
  const chunk = world.ensureChunk(10, 0, 10);
  world.setBlock(161, 4, 161, Block.Grass);
  const deer = sim.spawn({ x: 161.5, y: 5, z: 161.5 }, new IdleController(), { kindId: 'deer' });
  const record = { ...sim.toRecord(deer), id: 1000 };
  persist.onUnload(chunk, [record]);
  await persist.flush();
  return { store, persist, record };
}

describe('population restoration', () => {
  it.each(['warm', 'cold'])(
    'restores %s populations once without repopulating mixed columns',
    async (mode) => {
      const saved = await savedPopulation();
      const persist = mode === 'warm' ? saved.persist : new Persistence(saved.store, 1234);
      await persist.boot();
      const world = new World();
      const sim = new Sim(world, {}, 1234);
      const population = new MobPopulation();
      const restoration = new ChunkRestoration();
      const anchors = [{ cx: 10, cy: 0, cz: 10, radius: 0 }];
      const restore = (r: ReturnType<typeof update>) =>
        restoration.restore(r, {
          world,
          sim,
          persist,
          controllerFor: (record) => restoredController(world, sim, record),
          wanted: () => true,
          restored: () => {},
        });
      for (let i = 0; i < 6; i++) {
        const r = update(world, anchors, persist, sim);
        population.update(world, sim, r);
        await restore(r);
        await restore(r);
      }
      expect(sim.all()).toHaveLength(1);
      expect(sim.all()[0].id).toBe(1000);
      expect(sim.all()[0].controller).toBeInstanceOf(MobController);
      sim.all()[0].pos.x = 162.5;
      const unloaded = update(world, [{ cx: 20, cy: 0, cz: 20, radius: 0 }], persist, sim);
      population.update(world, sim, unloaded);
      await persist.flush();
      expect(sim.all()).toHaveLength(0);
      const returned = update(world, anchors, persist, sim);
      population.update(world, sim, returned);
      await restore(returned);
      expect(sim.all()).toHaveLength(1);
      expect(sim.all()[0].pos.x).toBe(162.5);
    },
  );

  it.each(['warm', 'cold'])('headless hosts restore %s mobs in a peer-only ring', async (mode) => {
    const saved = await savedPopulation();
    const persist = mode === 'warm' ? saved.persist : new Persistence(saved.store, 1234);
    await persist.boot();
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false, persist });
    const peer = hub.connect('peer');
    peer.send('host', { type: 'hello', name: 'peer', protocol: PROTOCOL_VERSION });
    hub.pump(0);
    const player = host.sim.all().find((e) => e.kind.id === 'player')!;
    player.pos = { x: 161.5, y: 6, z: 161.5 };
    player.fly = true;
    host.tick(1);
    await vi.waitFor(() => expect(host.sim.entities.has(1000)).toBe(true));
    expect(host.world.getBlock(161, 4, 161)).toBe(Block.Grass);
    expect(host.sim.entities.get(1000)!.controller).toBeInstanceOf(MobController);
    expect(host.meshable.has('10,0,10')).toBe(false);
  });

  it('drops a cold restore if its interest disappears while the fetch is pending', async () => {
    const saved = await savedPopulation();
    const record = saved.persist.syncRecord(10, 0, 10)!;
    let resolve!: (r: typeof record) => void;
    const persist = {
      ...saved.persist,
      syncRecord: () => undefined,
      fetchRecord: () =>
        new Promise<typeof record>((r) => {
          resolve = r;
        }),
      dropPersisted: vi.fn(),
      hasPersisted: () => true,
      onUnload: () => {},
    };
    const world = new World();
    const sim = new Sim(world, {}, 1);
    let wanted = true;
    const restoration = new ChunkRestoration();
    const pending = restoration.restore(
      { restored: [], pending: [{ cx: 10, cy: 0, cz: 10 }] },
      {
        world,
        sim,
        persist,
        controllerFor: () => new IdleController(),
        wanted: () => wanted,
        restored: vi.fn(),
      },
    );
    wanted = false;
    resolve(record);
    await pending;
    expect(world.count()).toBe(0);
    expect(sim.all()).toHaveLength(0);
  });
});
