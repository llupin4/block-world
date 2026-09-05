import { it, expect } from 'vitest';
import {
  ProfRig, meshVerts, PROF_WORST_KEY, PROF_WORST_VERTS, PROF_B_FRAMES, PROF_A_CAP,
} from '../prof-rig';
import type { FrameState, ProfReport, ProfRigOptions, RemeshKind } from '../prof-rig';
import type { ChunkMesh } from '../chunk-mesher';
import type { VoxelBuffer } from '../world';

const NO: FrameState = { worstLoaded: false, worstSettled: false };
const LOADED: FrameState = { worstLoaded: true, worstSettled: false };
const SETTLED: FrameState = { worstLoaded: true, worstSettled: true };

interface Ev { kind: RemeshKind; verts: number }
interface FrameSpec { ms: number; state?: FrameState; events?: Ev[] }

/** Drive the rig through a scripted frame sequence; return the emitted report. */
function run(frames: FrameSpec[], opts: Partial<ProfRigOptions> = {}): ProfReport {
  const rig = new ProfRig({ seed: 1234, phase: 0, render: true, anchor: { x: 6, y: 34, z: 46 }, ...opts });
  let report: ProfReport | null = null;
  for (const f of frames) {
    rig.beginFrame(f.state ?? NO);
    for (const e of f.events ?? []) rig.noteRemesh(e.kind, e.verts);
    report = rig.noteFrame(f.ms, 1) ?? report;
  }
  expect(report, 'rig did not emit a report').not.toBeNull();
  return report!;
}

it('happy path: window, cycles, slice-path + baseline checks, ocean stats (pass)', () => {
  const frames: FrameSpec[] = [];
  for (let i = 0; i < 60; i++) frames.push({ ms: 3 });                                              // 0..59: boot
  frames.push({ ms: 4, state: LOADED });                                                            // 60: window opens (load frame)
  frames.push({ ms: 5, state: LOADED, events: [{ kind: 'probe-complete', verts: 1200 }] });         // 61: first mesh (partial light)
  for (let i = 0; i < 8; i++) frames.push({ ms: 4, state: LOADED });                                // 62..69: light settling
  frames.push({ ms: 8, state: LOADED, events: [{ kind: 'plan', verts: 1500 }] });                   // 70: settled remesh — slice plan (band 0)
  for (let i = 1; i <= 3; i++)
    frames.push({ ms: 7, state: LOADED, events: [{ kind: 'slice', verts: 1500 }] });                // 71..73: bands 1..3
  frames.push({ ms: 9, state: LOADED, events: [{ kind: 'merge', verts: PROF_WORST_VERTS }] });      // 74: merge
  frames.push({ ms: 4, state: SETTLED });                                                           // 75: settled observed → segment B
  for (let i = 0; i < PROF_B_FRAMES - 1; i++) frames.push({ ms: i === 100 ? 6 : 4 });               // 76..374
  const r = run(frames);
  expect(r.pass).toBe(true);
  expect(r.failReason).toBe(null);
  expect(r.worstChunk.key).toBe(PROF_WORST_KEY);
  expect(r.worstChunk.window).toEqual([60, 74]);
  expect(r.worstChunk.maxWindowMs).toBe(9);
  expect(r.worstChunk.settledVerts).toBe(PROF_WORST_VERTS);
  expect(r.worstChunk.remeshCycles).toEqual([
    { kind: 'probe-complete', frames: [61], maxFrameMs: 5, verts: 1200 },
    { kind: 'sliced', frames: [70, 71, 72, 73, 74], maxFrameMs: 9, verts: PROF_WORST_VERTS },
  ]);
  expect(r.boot).toEqual({ frames: 60, maxMs: 3 });
  expect(r.ocean.frames).toBe(PROF_B_FRAMES);
  expect(r.ocean.maxMs).toBe(6);
  expect(r.global.framesOver16_7).toEqual([]);
  expect(r.global.maxFrameIndex).toBe(74); // the 9 ms merge frame is the global max
  expect(r.seed).toBe(1234);
  expect(r.render).toBe(true);
});

it('violations: over-budget remesh frame, window frame, ocean regression, light drift (fail + reasons)', () => {
  const frames: FrameSpec[] = [];
  for (let i = 0; i < 10; i++) frames.push({ ms: 3 });                                              // 0..9
  frames.push({ ms: 4, state: LOADED });                                                            // 10: window opens
  frames.push({ ms: 20, state: LOADED, events: [{ kind: 'plan', verts: 1500 }] });                  // 11: remesh frame over budget
  frames.push({ ms: 4, state: LOADED, events: [{ kind: 'slice', verts: 1500 }] });                  // 12
  frames.push({ ms: 4, state: LOADED, events: [{ kind: 'slice', verts: 1500 }] });                  // 13
  frames.push({ ms: 4, state: LOADED, events: [{ kind: 'slice', verts: 1500 }] });                  // 14
  frames.push({ ms: 18, state: LOADED, events: [{ kind: 'merge', verts: 6000 }] });                 // 15: over budget + wrong verts
  frames.push({ ms: 4, state: SETTLED });                                                           // 16: settled → B
  frames.push({ ms: 27 });                                                                          // 17: ocean over baseline
  for (let i = 0; i < PROF_B_FRAMES - 2; i++) frames.push({ ms: 4 });                               // 18..
  const r = run(frames);
  expect(r.pass).toBe(false);
  expect(r.failReason).toContain('remesh frame 11');
  expect(r.failReason).toContain('window frame 11');
  expect(r.failReason).toContain('ocean max 27.00 ms > 25 ms');
  expect(r.failReason).toContain('settled verts 6000 != node baseline 6312');
});

it('a settled remesh that is probe-complete (not sliced) fails the slice-path check', () => {
  const frames: FrameSpec[] = [];
  for (let i = 0; i < 5; i++) frames.push({ ms: 3 });
  frames.push({ ms: 4, state: LOADED });
  frames.push({ ms: 5, state: LOADED, events: [{ kind: 'probe-complete', verts: PROF_WORST_VERTS }] });
  frames.push({ ms: 4, state: SETTLED });
  for (let i = 0; i < PROF_B_FRAMES - 1; i++) frames.push({ ms: 4 });
  const r = run(frames);
  expect(r.pass).toBe(false);
  expect(r.failReason).toContain('did not take the slice path');
  expect(r.worstChunk.settledVerts).toBe(PROF_WORST_VERTS);
});

it('segment A cap: never loaded by the cap → done, pass=false, failReason, report still emitted', () => {
  const frames: FrameSpec[] = [];
  for (let i = 0; i < PROF_A_CAP; i++) frames.push({ ms: 3 });
  for (let i = 0; i < PROF_B_FRAMES; i++) frames.push({ ms: 4 });
  const r = run(frames);
  expect(r.pass).toBe(false);
  expect(r.failReason).toContain('segment A cap');
  expect(r.worstChunk.window).toBe(null);
  expect(r.ocean.frames).toBe(PROF_B_FRAMES);
});

it('defensive: a slice without a plan opens a cycle; an unterminated split is closed at report', () => {
  const frames: FrameSpec[] = [];
  for (let i = 0; i < 3; i++) frames.push({ ms: 3 });
  frames.push({ ms: 4, state: LOADED });
  frames.push({ ms: 5, state: LOADED, events: [{ kind: 'slice', verts: 100 }] }); // no plan
  frames.push({ ms: 4, state: SETTLED });
  for (let i = 0; i < PROF_B_FRAMES - 1; i++) frames.push({ ms: 4 });
  const r = run(frames);
  expect(r.worstChunk.remeshCycles).toEqual([{ kind: 'sliced', frames: [4], maxFrameMs: 5, verts: 100 }]);
  expect(r.pass).toBe(false);
  expect(r.failReason).toContain('settled verts 100 != node baseline');
});

it('waypoints: the spawn anchor until settle, then the ocean point for exactly the ocean budget', () => {
  const rig = new ProfRig({ seed: 1234, phase: 0, render: true, anchor: { x: 6, y: 34, z: 46 } });
  expect(rig.beginFrame(NO).waypoint).toEqual({ x: 6, y: 34, z: 46 });
  rig.noteFrame(3, 1);
  expect(rig.beginFrame(LOADED).waypoint).toEqual({ x: 6, y: 34, z: 46 });
  rig.noteFrame(3, 1);
  expect(rig.beginFrame(SETTLED).waypoint).toEqual({ x: 8, y: 34, z: 200 }); // settled → segment B
  rig.noteFrame(3, 1); // the transition frame itself runs segment B (begin/note alternate)
  let rep: ProfReport | null = null;
  for (let i = 0; i < PROF_B_FRAMES - 1; i++) {
    rig.beginFrame(SETTLED);
    rep = rig.noteFrame(3, 1) ?? rep;
  }
  expect(rep, 'the report is emitted on the last ocean frame').not.toBeNull();
  expect(rep!.ocean.frames).toBe(PROF_B_FRAMES);
  expect(rep!.pass).toBe(false); // no remesh ever ran (window never closed) — expected here
  expect(rep!.failReason ?? '').toContain('window never closed');
});

it('meshVerts sums opaque + trans and ignores null passes', () => {
  const buf = (verts: number): VoxelBuffer =>
    ({ positions: new Float32Array(verts * 3) } as unknown as VoxelBuffer);
  expect(meshVerts({ opaque: buf(4), trans: buf(3) } as ChunkMesh)).toBe(7);
  expect(meshVerts({ opaque: null, trans: null } as ChunkMesh)).toBe(0);
});