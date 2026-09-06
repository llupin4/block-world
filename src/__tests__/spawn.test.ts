import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, localIndex } from '../world';
import { SimRng, Sim, IdleController, stepEntity } from '../entity';
import { isDoltSpawnCell, rollDoltSpawns, spawnDolts } from '../spawn';

const STEP = 1 / 60;

function grassFloor(world: World, cx: number, cz: number, y: number): void {
  const c = world.ensureChunk(cx, 0, cz);
  for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, y, lz)] = Block.Grass;
}

describe('spawn', () => {
  it('isDoltSpawnCell: grass with two air cells above, at a plausible surface height', () => {
    const world = new World();
    grassFloor(world, 0, 0, 4); // grass at y=4, air above
    expect(isDoltSpawnCell((x, y, z) => world.getBlock(x, y, z), 8, 4, 8)).toBe(true);
    expect(isDoltSpawnCell((x, y, z) => world.getBlock(x, y, z), 8, 3, 8)).toBe(false); // not grass
  });

  it('rollDoltSpawns: a fixed seed gives a deterministic count at deterministic positions', () => {
    const a = new World(); grassFloor(a, 0, 0, 4);
    const b = new World(); grassFloor(b, 0, 0, 4);
    const rngA = new SimRng(1234), rngB = new SimRng(1234);
    const ra = rollDoltSpawns(a, 0, 0, 2, () => rngA.next(), () => false);
    const rb = rollDoltSpawns(b, 0, 0, 2, () => rngB.next(), () => false);
    expect(ra).toEqual(rb);
    expect(ra.length).toBe(2);
    for (const p of ra) expect(p.y).toBe(5); // feet on the grass top (grass at y=4)
  });

  it('a fixed seed spawns a deterministic dolt set over a 600-tick session', () => {
    const run = (): [number, number][] => {
      const world = new World();
      grassFloor(world, 0, 0, 4);
      const sim = new Sim(world, {}, 1234);
      sim.spawn({ x: 0, y: 5, z: 0 }, new IdleController(), { kindId: 'player', baseController: new IdleController() });
      spawnDolts(world, sim, 0, 0); // dolts into the freshly generated (rebuilt) chunk
      for (let i = 0; i < 600; i++)
        for (const e of sim.all()) {
          const it = e.controller.intent(e, i);
          stepEntity(world, e, it, STEP);
        }
      return sim.all().filter((e) => e.kind.id === 'dolt')
        .map((e) => [Math.round(e.pos.x * 1000), Math.round(e.pos.z * 1000)] as [number, number]);
    };
    expect(run()).toEqual(run());
  });
});