// Deterministic profiling rig state machine (design: ADR 0013; acceptance via the ?prof=remesh e2e).
// Pure TS — no three, no DOM: main.ts drives it once per frame (beginFrame) and at the drain's
// remesh events (noteRemesh), and reads the report when noteFrame returns one. Frame-indexed by
// design: no wall clock and no rAF cadence anywhere in the logic — headless frame pacing cannot
// invalidate the results (per-frame ms are measured by the caller and passed in).

import type { ChunkMesh } from './chunk-mesher';

export const PROF_WORST_KEY = '2,1,0'; // ADR 0002 worst chunk — world x 32..47, y 16..31, z 0..15
export const PROF_WORST_VERTS = 6312;  // node baseline (remesh-perf.test.ts), seed 1234, phase 0
export const PROF_VSYNC_MS = 16.7;     // acceptance bar B: the 60 Hz budget
export const PROF_OCEAN_MS = 25;       // ADR 0002 ocean baseline
export const PROF_A_CAP = 600;         // segment A hang guard
export const PROF_B_FRAMES = 300;      // segment B budget
export const PROF_QUIESCE = 10;        // quiescent frames after the last worst-chunk remesh before the window closes
export const PROF_OCEAN = { x: 8, y: 34, z: 200 }; // scanned 99%-water 5x5-chunk ring (seed 1234)

export type RemeshKind = 'probe-complete' | 'plan' | 'slice' | 'merge';

export interface RemeshCycle {
  kind: 'probe-complete' | 'sliced';
  frames: number[];
  maxFrameMs: number;
  verts: number; // the merged total for a sliced cycle (the merge frame's vertex count)
}

export interface ProfReport {
  mode: 'remesh';
  seed: number;
  phase: number;
  render: boolean; // false when run with &norender
  boot: { frames: number; maxMs: number }; // segment-A frames before the window opens (reference only)
  worstChunk: {
    key: string;
    settledVerts: number | null;
    window: [number, number] | null; // [load frame, settled-remesh end frame]
    maxWindowMs: number; // the worst frame inside the window (the ADR acceptance line)
    remeshCycles: RemeshCycle[];
  };
  ocean: { frames: number; maxMs: number; avgMs: number };
  global: {
    maxFrameMs: number;
    maxFrameIndex: number;
    drainMaxMs: number;
    framesOver16_7: number[];
    framesOver25: number[];
    framesOver33_4: number[];
  };
  pass: boolean;
  failReason: string | null;
}

export interface FrameState {
  worstLoaded: boolean;  // world.getChunk(2, 1, 0) !== undefined
  worstSettled: boolean; // !pendingRebuild.has(key) && !scheduler.has(key) — the chunk's lightSettled
  // flag is live ONLY in the worker mirror (the reply does not carry it), so the rig settles on
  // quiescence + the 6312 baseline signature instead (see beginFrame)
}

export interface ProfRigOptions {
  seed: number;
  phase: number;
  render: boolean;
  anchor: { x: number; y: number; z: number }; // the spawn position held in segment A
}

/** Opaque + trans vertex count of a ChunkMesh (null passes contribute 0). */
export function meshVerts(m: ChunkMesh): number {
  let n = 0;
  for (const b of [m.opaque, m.trans]) if (b) n += b.positions.length / 3;
  return n;
}

interface OpenCycle { frames: number[]; verts: number }

export class ProfRig {
  private frame = 0;
  private seg: 'A' | 'B' = 'A';
  private bLeft = PROF_B_FRAMES;
  private finished = false;
  private windowStart: number | null = null;
  private windowEnd: number | null = null;
  private lastRemeshFrame: number | null = null;
  private cycles: RemeshCycle[] = [];
  private open: OpenCycle | null = null;
  private aTotals: number[] = [];
  private bTotals: number[] = [];
  private drains: number[] = [];
  private reason: string | null = null;
  private readonly opts: ProfRigOptions;

  constructor(opts: ProfRigOptions) {
    this.opts = opts;
  }

  /** Once per frame (after this frame's streaming, before its drain): the waypoint to pin the player at. */
  beginFrame(s: FrameState): { waypoint: { x: number; y: number; z: number } } {
    const f = this.frame;
    if (s.worstLoaded && this.windowStart === null) this.windowStart = f;
    if (this.seg === 'A') {
      // Settled = the settled-light signature (a 6312-vert sliced cycle) has completed, the
      // chunk has been quiescent (no remesh) for PROF_QUIESCE frames, and no remesh of it is
      // pending/in flight. A later touch restarts the quiescence (the self-correcting contract).
      const settled = s.worstSettled
        && this.lastRemeshFrame !== null
        && f - this.lastRemeshFrame >= PROF_QUIESCE
        && this.cycles.some((c) => c.kind === 'sliced' && c.verts === PROF_WORST_VERTS);
      if (settled || f + 1 >= PROF_A_CAP) {
        if (settled) this.windowEnd = this.lastRemeshFrame;
        else this.reason = `segment A cap: worst chunk not settled by frame ${PROF_A_CAP - 1}`;
        this.seg = 'B';
        this.bLeft = PROF_B_FRAMES;
      }
    }
    if (this.seg === 'B') this.bLeft--;
    return { waypoint: this.seg === 'B' ? { ...PROF_OCEAN } : { ...this.opts.anchor } };
  }

  /** At the drain: a remesh event on the worst chunk (frame index = this.frame). */
  noteRemesh(kind: RemeshKind, verts: number): void {
    const f = this.frame;
    this.lastRemeshFrame = f;
    if (kind === 'probe-complete') {
      if (this.open) this.pushOpen(); // anomaly: a probe while a split is open — close it
      this.cycles.push({ kind: 'probe-complete', frames: [f], maxFrameMs: 0, verts });
    } else if (kind === 'plan') {
      if (this.open) this.pushOpen(); // anomaly
      this.open = { frames: [f], verts };
    } else if (!this.open) {
      this.open = { frames: [f], verts }; // defensive: a slice/merge without a plan
    } else if (kind === 'slice') {
      this.open.frames.push(f);
    } else { // merge
      this.open.frames.push(f);
      this.open.verts = verts; // the merged total
      this.pushOpen();
    }
  }

  private pushOpen(): void {
    if (!this.open) return;
    this.cycles.push({ kind: 'sliced', frames: this.open.frames, maxFrameMs: 0, verts: this.open.verts });
    this.open = null;
  }

  /** Once per frame, at frame end: the measured total + drain ms. Returns the report on the final frame. */
  noteFrame(totalMs: number, drainMs: number): ProfReport | null {
    (this.seg === 'A' ? this.aTotals : this.bTotals).push(totalMs);
    this.drains.push(drainMs);
    this.frame++;
    if (!this.finished && this.seg === 'B' && this.bLeft <= 0) {
      this.finished = true;
      return this.report();
    }
    return null;
  }

  report(): ProfReport {
    if (this.open) this.pushOpen(); // unterminated split (cancelled mid-split — not expected with the pinned player)
    const totals = [...this.aTotals, ...this.bTotals];
    const maxOf = (arr: number[]): number => arr.reduce((m, v) => Math.max(m, v), 0);
    const bootEnd = this.windowStart ?? this.aTotals.length;
    const reasons: string[] = [];
    if (this.reason) reasons.push(this.reason);
    if (this.windowStart === null) reasons.push('worst chunk never loaded in segment A');
    else if (this.windowEnd === null) reasons.push('window never closed: no remesh observed before settle');
    const last = this.cycles[this.cycles.length - 1];
    if (this.windowStart !== null && this.windowEnd !== null) {
      // the settled remesh took the slice path and matches the node baseline (independent checks)
      if (!last || last.kind !== 'sliced') reasons.push('settled remesh did not take the slice path');
      if (last && last.verts !== PROF_WORST_VERTS)
        reasons.push(`settled verts ${last.verts} != node baseline ${PROF_WORST_VERTS} (light-state drift)`);
      // remesh frames and the whole window stay inside the vsync budget
      for (const c of this.cycles)
        for (const f of c.frames)
          if (totals[f] > PROF_VSYNC_MS) { reasons.push(`remesh frame ${f}: ${totals[f].toFixed(2)} ms > ${PROF_VSYNC_MS} ms`); break; }
      for (let f = this.windowStart; f <= this.windowEnd; f++)
        if (totals[f] > PROF_VSYNC_MS) { reasons.push(`window frame ${f}: ${totals[f].toFixed(2)} ms > ${PROF_VSYNC_MS} ms`); break; }
    }
    const oceanMax = maxOf(this.bTotals);
    if (oceanMax > PROF_OCEAN_MS) reasons.push(`ocean max ${oceanMax.toFixed(2)} ms > ${PROF_OCEAN_MS} ms`);
    const withMs = (cs: RemeshCycle[]): RemeshCycle[] =>
      cs.map((c) => ({ ...c, maxFrameMs: maxOf(c.frames.map((f) => totals[f])) }));
    return {
      mode: 'remesh',
      seed: this.opts.seed,
      phase: this.opts.phase,
      render: this.opts.render,
      boot: { frames: bootEnd, maxMs: maxOf(this.aTotals.slice(0, bootEnd)) },
      worstChunk: {
        key: PROF_WORST_KEY,
        settledVerts: last ? last.verts : null,
        window: this.windowStart !== null && this.windowEnd !== null ? [this.windowStart, this.windowEnd] : null,
        maxWindowMs: this.windowStart !== null && this.windowEnd !== null
          ? maxOf(totals.slice(this.windowStart, this.windowEnd + 1))
          : 0,
        remeshCycles: withMs(this.cycles),
      },
      ocean: {
        frames: this.bTotals.length,
        maxMs: oceanMax,
        avgMs: this.bTotals.length ? this.bTotals.reduce((a, b) => a + b, 0) / this.bTotals.length : 0,
      },
      global: {
        maxFrameMs: totals[totals.reduce((m, t, i) => (t > totals[m] ? i : m), 0)],
        maxFrameIndex: totals.reduce((m, t, i) => (t > totals[m] ? i : m), 0),
        drainMaxMs: maxOf(this.drains),
        framesOver16_7: totals.map((t, i) => (t > PROF_VSYNC_MS ? i : -1)).filter((i) => i >= 0),
        framesOver25: totals.map((t, i) => (t > 25 ? i : -1)).filter((i) => i >= 0),
        framesOver33_4: totals.map((t, i) => (t > 33.4 ? i : -1)).filter((i) => i >= 0),
      },
      pass: reasons.length === 0,
      failReason: reasons.length ? reasons.join('; ') : null,
    };
  }
}