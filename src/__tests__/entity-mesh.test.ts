import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World } from '../world';
import { Sim, IdleController } from '../entity';
import { advanceRigAnim, legAngles, horizontalSpeed, KIND_TO_RIG, makeDoltRig } from '../entity-mesh';

describe('entity-mesh (pure math)', () => {
  it('KIND_TO_RIG.dolt has a head and four legs', () => {
    expect(KIND_TO_RIG.dolt.parts.map((p) => p.name)).toEqual(['head', 'frontL', 'frontR', 'backL', 'backR']);
  });

  it('advanceRigAnim accumulates the walk phase from forward speed', () => {
    const anim = { phase: 0, speed: 0 };
    advanceRigAnim(anim, 1, 1 / 60); // forward 1
    const p1 = anim.phase;
    advanceRigAnim(anim, 1, 1 / 60);
    expect(anim.phase).toBeGreaterThan(p1);
    expect(anim.phase).toBeLessThanOrEqual(1);   // phase wraps into [0,1]
    advanceRigAnim(anim, 0, 1 / 60);             // stopped → phase eases back to 0
    for (let i = 0; i < 120; i++) advanceRigAnim(anim, 0, 1 / 60);
    expect(anim.phase).toBeLessThanOrEqual(0.05);
  });

  it('legAngles swings the left/right legs out of phase', () => {
    const anim = { phase: 0.25, speed: 1 };
    const L = legAngles(anim, -1.0);
    const R = legAngles(anim, +1.0);
    expect(Math.abs(L - R)).toBeGreaterThan(0.1);
  });

  it('horizontalSpeed: a forward step over a flat floor moves the entity', () => {
    const world = new World();
    world.setBlock(0, 0, 0, Block.Stone);
    const sim = new Sim(world, {}, 1234);
    const e = sim.spawn({ x: 0.5, y: 1, z: 0.5 }, new IdleController());
    const flat = horizontalSpeed(world, e, 1 / 60);
    expect(flat).toBeGreaterThan(0);
  });

  it('makeDoltRig builds a group with five parts', () => {
    const rig = makeDoltRig();
    expect(rig.parts.length).toBe(5);
    expect(rig.group.children.length).toBeGreaterThan(0);
  });
});