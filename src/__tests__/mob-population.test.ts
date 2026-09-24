import { describe, expect, it, vi } from 'vitest';
import { Block } from '../blocks';
import { Sim, IdleController } from '../entity';
import { MobPopulation } from '../simulation/mob-population';
import { CY_MIN, CY_MAX } from '../streaming';
import { World, localIndex } from '../world';
import { HostSession } from '../net/host';
import { LoopbackHub } from '../net/transport';
import { TERRAIN_SEED } from '../terrain';

function setup() {
  const world = new World();
  const sim = new Sim(world, {}, 1);
  const column = Array.from({ length: CY_MAX - CY_MIN + 1 }, (_, i) => ({
    cx: 0,
    cy: i + CY_MIN,
    cz: 0,
  }));
  for (const c of column) world.ensureChunk(c.cx, c.cy, c.cz);
  const floor = world.getChunk(0, 0, 0)!;
  for (let x = 0; x < 16; x++)
    for (let z = 0; z < 16; z++) floor.blocks[localIndex(x, 4, z)] = Block.Grass;
  return { world, sim, column };
}

describe('MobPopulation', () => {
  it('spawns on loaded terrain without any renderer and never tops up on repeated updates', () => {
    const { world, sim, column } = setup();
    const population = new MobPopulation();
    population.update(world, sim, { generated: column, unloaded: [] });
    expect(sim.all()).toHaveLength(2);
    expect(sim.all().every((e) => e.kind.id === 'deer' && e.pos.y === 5)).toBe(true);
    sim.despawn(sim.all()[0].id);
    population.update(world, sim, { generated: column, unloaded: [] });
    population.update(world, sim, { generated: [], unloaded: [] });
    expect(sim.all()).toHaveLength(1);
  });

  it('waits for all generated bands instead of treating absent upper terrain as air', () => {
    const { world, sim, column } = setup();
    const policy = vi.fn();
    const population = new MobPopulation(policy);
    for (const c of column.slice(1)) world.removeChunk(c.cx, c.cy, c.cz);
    population.update(world, sim, { generated: [column[0]], unloaded: [] });
    expect(policy).not.toHaveBeenCalled();
    for (const c of column.slice(1)) {
      world.ensureChunk(c.cx, c.cy, c.cz);
      population.update(world, sim, { generated: [c], unloaded: [] });
    }
    expect(policy).toHaveBeenCalledTimes(1);
    expect(policy).toHaveBeenCalledWith(world, sim, 0, 0);
  });

  it('does not populate restored or mixed restored/generated columns', () => {
    const { world, sim, column } = setup();
    const population = new MobPopulation();
    population.update(world, sim, { generated: [], unloaded: [] });
    population.update(world, sim, { generated: column.slice(1), unloaded: [] });
    expect(sim.all()).toHaveLength(0);
  });

  it('unloads mobs but preserves players and spectators, then allows fresh regeneration', () => {
    const { world, sim, column } = setup();
    const population = new MobPopulation();
    population.update(world, sim, { generated: column, unloaded: [] });
    const player = sim.spawn({ x: 2, y: 5, z: 2 }, new IdleController());
    const ghost = sim.spawn({ x: 2, y: 5, z: 2 }, new IdleController(), { kindId: 'spectator' });
    sim.spawn({ x: 2, y: 5, z: 2 }, new IdleController(), { kindId: 'deer' });
    population.update(world, sim, { generated: [], unloaded: column });
    expect(sim.all().map((e) => e.id)).toEqual([player.id, ghost.id]);
    population.update(world, sim, { generated: column, unloaded: [] });
    expect(sim.all().filter((e) => e.kind.id === 'deer')).toHaveLength(2);
  });

  it('populates a headless host before any mesh or render frame exists', () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), TERRAIN_SEED, { withOwnPlayer: false });
    expect(host.sim.all().some((e) => e.kind.id === 'deer')).toBe(true);
    expect(host.sim.all().some((e) => e.kind.id === 'player')).toBe(false);
  });
});
