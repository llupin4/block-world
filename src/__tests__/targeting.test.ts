import { describe, expect, it } from 'vitest';
import { Block } from '../blocks';
import { HumanController, IdleController, Sim, eyeOf } from '../entity';
import { findBlockTarget, possessFromView } from '../input/targeting';
import { World } from '../world';

function setup() {
  const world = new World();
  world.ensureChunk(0, 0, 0);
  const sim = new Sim(world, {}, 1);
  const human = new HumanController(new Set());
  const player = sim.spawn({ x: 1.5, y: 2, z: 8.5 }, human);
  sim.homeId = sim.viewedId = player.id;
  const y = Math.floor(eyeOf(player).y);
  return { world, sim, human, player, y };
}

describe('view targeting', () => {
  it('casts from the viewed eye and respects reach and facing', () => {
    const { world, sim, player, y } = setup();
    world.setBlock(1, y, 5, Block.Stone);
    expect(findBlockTarget(world, sim, {})).toMatchObject({ x: 1, y, z: 5 });
    player.yaw = Math.PI;
    expect(findBlockTarget(world, sim, {})).toBeNull();
    player.yaw = 0;
    world.setBlock(1, y, 5, Block.Air);
    world.setBlock(1, y, 0, Block.Stone);
    expect(findBlockTarget(world, sim, {})).toBeNull();
  });

  it('allows a placed spring to be targeted while ordinary water is transparent', () => {
    const { world, sim, y } = setup();
    world.setBlock(1, y, 6, Block.Water);
    world.setBlock(1, y, 5, Block.Stone);
    expect(findBlockTarget(world, sim, {})).toMatchObject({ z: 5 });
    expect(findBlockTarget(world, sim, { springTarget: (_x, _y, z) => z === 6 })).toMatchObject({
      z: 6,
    });
  });

  it('preserves entity-first outline suppression, including entities behind a voxel', () => {
    const { world, sim, y } = setup();
    world.setBlock(1, y, 6, Block.Stone);
    sim.spawn({ x: 1.5, y: 2, z: 4 }, new IdleController());
    expect(findBlockTarget(world, sim, {})).toBeNull();
  });

  it('possesses eligible creatures and returns home on the next toggle', () => {
    const { sim, human, player, y } = setup();
    const deer = sim.spawn({ x: 1.5, y, z: 5 }, new IdleController(), { kindId: 'deer' });
    expect(possessFromView(sim, human)).toBe(true);
    expect(sim.viewedId).toBe(deer.id);
    possessFromView(sim, human);
    expect(sim.viewedId).toBe(player.id);
  });

  it('ignores other players for possession and toggles to the spectator instead', () => {
    const { sim, human } = setup();
    sim.spawn({ x: 1.5, y: 2, z: 5 }, new IdleController());
    sim.ghostId = sim.spawn({ x: 10, y: 10, z: 10 }, new IdleController(), {
      kindId: 'spectator',
    }).id;
    possessFromView(sim, human);
    expect(sim.viewedId).toBe(sim.ghostId);
  });

  it('does nothing without a viewed entity', () => {
    const world = new World();
    const sim = new Sim(world, {}, 1);
    expect(findBlockTarget(world, sim, {})).toBeNull();
    expect(possessFromView(sim, new IdleController())).toBe(false);
  });
});
