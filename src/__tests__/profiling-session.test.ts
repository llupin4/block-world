import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfilingSession } from '../diagnostics/profiling-session';
import { Sim, IdleController } from '../entity';
import { ProfRig, PROF_WORST_KEY, PROF_A_CAP, PROF_B_FRAMES } from '../prof-rig';
import { World } from '../world';

function setup() {
  const world = new World();
  const sim = new Sim(world, {}, 1234);
  const viewed = sim.spawn({ x: 6, y: 34, z: 46 }, new IdleController());
  const human = { frozen: false };
  const now = vi.fn(() => 0);
  const session = new ProfilingSession(now);
  const remesher = { has: vi.fn(() => false) };
  const start = () => session.start({ seed: 1234, phase: 0.25, render: false }, human, viewed);
  return { world, viewed, human, now, session, remesher, start };
}

afterEach(() => vi.restoreAllMocks());

describe('profiling session', () => {
  it('does not read the clock or change the view when inactive, but still drains', () => {
    const { world, viewed, human, now, session, remesher } = setup();
    const drain = vi.fn();
    session.startFrame();
    session.positionView(world, remesher, viewed);
    session.measureDrain(drain);
    expect(session.finishFrame()).toBeNull();
    expect(now).not.toHaveBeenCalled();
    expect(drain).toHaveBeenCalledTimes(1);
    expect(human.frozen).toBe(false);
    expect(viewed.noclip).toBe(false);
    expect(viewed.pos).toEqual({ x: 6, y: 34, z: 46 });
  });

  it('freezes input and pins the view to a copied anchor, clearing velocity', () => {
    const { world, viewed, human, session, remesher, start } = setup();
    start();
    expect(human.frozen).toBe(true);
    expect(viewed.noclip).toBe(true);
    viewed.pos.x = 100;
    viewed.vel = { x: 1, y: 2, z: 3 };
    session.positionView(world, remesher, viewed);
    expect(viewed.pos).toEqual({ x: 6, y: 34, z: 46 });
    expect(viewed.vel).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('uses loaded terrain and pending remeshes for the rig settling signal', () => {
    const { world, viewed, session, remesher, start } = setup();
    const begin = vi.spyOn(ProfRig.prototype, 'beginFrame');
    start();
    session.positionView(world, remesher, viewed);
    world.ensureChunk(2, 1, 0);
    remesher.has.mockReturnValue(true);
    session.positionView(world, remesher, viewed);
    remesher.has.mockReturnValue(false);
    session.positionView(world, remesher, undefined);
    expect(begin.mock.calls).toEqual([
      [{ worstLoaded: false, worstSettled: false }],
      [{ worstLoaded: true, worstSettled: false }],
      [{ worstLoaded: true, worstSettled: true }],
    ]);
    expect(remesher.has).toHaveBeenCalledWith(PROF_WORST_KEY);
  });

  it('forwards only worst-chunk remesh events and measures frame and drain time', () => {
    const { session, now, start } = setup();
    const remesh = vi.spyOn(ProfRig.prototype, 'noteRemesh');
    const frame = vi.spyOn(ProfRig.prototype, 'noteFrame');
    start();
    now
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(12)
      .mockReturnValueOnce(15)
      .mockReturnValueOnce(20);
    session.startFrame();
    session.measureDrain(() => {
      session.noteRemesh('0,0,0', 'plan', { opaque: null, trans: null });
      session.noteRemesh(PROF_WORST_KEY, 'plan', { opaque: null, trans: null });
    });
    expect(session.finishFrame()).toBeNull();
    expect(remesh.mock.calls).toEqual([['plan', 0]]);
    expect(frame.mock.calls).toEqual([[10, 3]]);
    session.startFrame();
    session.finishFrame();
    expect(frame).toHaveBeenLastCalledWith(0, 0);
  });

  it('handles a missing view and emits the real rig report only once', () => {
    const { world, human, session, remesher } = setup();
    session.start({ seed: 42, phase: 0.5, render: true }, human, undefined);
    const reports = [];
    for (let frame = 0; frame < PROF_A_CAP + PROF_B_FRAMES + 2; frame++) {
      session.startFrame();
      session.positionView(world, remesher, undefined);
      const report = session.finishFrame();
      if (report) reports.push(report);
    }
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ seed: 42, phase: 0.5, render: true });
  });
});
