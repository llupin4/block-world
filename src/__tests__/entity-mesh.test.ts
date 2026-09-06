import { describe, it, expect } from 'vitest';
import { newRigAnim, advanceRigAnim, legAngles, horizontalSpeed } from '../entity-mesh';

describe('entity-mesh — the pure animation math', () => {
  it('leg phase advances with horizontal speed, not wall time', () => {
    const a = newRigAnim();
    expect(legAngles(a)).toEqual([0, 0, 0, 0]);
    advanceRigAnim(a, { vel: { x: 2, z: 0 } }, 1, 1); // phase = 2
    const [fl, bl, fr, br] = legAngles(a);
    const s = Math.sin(2) * 0.5;
    expect(fl).toBeCloseTo(s, 9);
    expect(bl).toBeCloseTo(-s, 9);
    expect(fr).toBeCloseTo(-s, 9);
    expect(br).toBeCloseTo(s, 9); // diagonal gait: FL+BR together, BL+FR together
  });

  it('zero speed advances no phase', () => {
    const a = newRigAnim();
    advanceRigAnim(a, { vel: { x: 0, z: 0 } }, 10, 1);
    expect(legAngles(a)).toEqual([0, 0, 0, 0]);
  });

  it('horizontalSpeed is the x/z velocity magnitude', () => {
    expect(horizontalSpeed({ vel: { x: 3, z: 4 } })).toBeCloseTo(5, 9);
  });
});