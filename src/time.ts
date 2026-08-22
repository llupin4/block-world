// World time: world-level state, advanced by the simulation clock. src/main.ts
// calls advance() once per fixed 60 Hz physics substep (never from wall-clock
// dt), so a lagging frame drops frames — it never stretches the day.
// `phaseTotal`/`dayPhase` are stored counters of their own (normally advanced
// 1:1 with `time` via DAY_LENGTH), so the daylight cycle can later be frozen,
// rescaled, or set independently of the simulation clock. See
// docs/superpowers/specs/2026-08-19-day-night-clouds-design.md.
// `tick` is the canonical heartbeat (ADR 0011 — Simulation clocks): one per advance()
// call = one 60 Hz substep; the water pulse strides on it (every WATER_STRIDE ticks).
// Pure module: no three.js, no DOM — node-testable.

export const DAY_LENGTH = 240; // seconds for one full day/night cycle (2 min day + 2 min night)

export class WorldTime {
  /** Total simulation time (s). */
  time = 0;
  /** Total phase progressed, in cycles. Stored, not derived from `time`, so the cycle can later run independently. */
  private phaseTotal: number;
  /** The canonical heartbeat (ADR 0011): one tick per advance() call = one 60 Hz substep, independent of dt magnitude. The water pulse strides on it (every WATER_STRIDE ticks). */
  tick = 0;

  /** `startPhase` (default 0 = noon) lets verification/URL hooks (main.ts `?phase=`) reach any time of day without a real-time wait. */
  constructor(startPhase = 0) {
    this.phaseTotal = startPhase;
  }

  /** Position in the current cycle, [0, 1): 0 = noon, 0.25 = sunset, 0.5 = midnight, 0.75 = sunrise. */
  get dayPhase(): number {
    return this.phaseTotal % 1;
  }

  /** Day number; the session starts at noon of day 1, and day N+1 starts when dayPhase reaches 0.5 (midnight). */
  get day(): number {
    return 1 + Math.floor(this.phaseTotal + 0.5);
  }

  /** Display hour in [0, 24): phase 0 → 12.0, 0.25 → 18.0, 0.5 → 0.0, 0.75 → 6.0. */
  get hour(): number {
    return (12 + 24 * this.dayPhase) % 24;
  }

  /** Advance the simulation clock, the daylight cycle (in lockstep), and the tick heartbeat. */
  advance(dt: number): void {
    this.time += dt;
    this.phaseTotal += dt / DAY_LENGTH;
    this.tick++;
  }
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** `"Day 2 · 19:41"` for the HUD. `hour` is the fractional display hour (WorldTime.hour). */
export function formatClock(day: number, hour: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour - h) * 60 + 1e-9);
  return `Day ${day} · ${pad2(h)}:${pad2(m)}`;
}

/** True iff the tick sequence (prev, now] crossed a multiple of `stride` — the frame-end water-pulse rule (ADR 0011). A frame can run ≤ 6 substeps (dt clamped at 0.1 s), so a bare `now % stride === 0` read once per frame would miss a boundary crossed mid-frame (ticks 29 → 34); this counts the crossing instead. With ≤ 6 < stride ticks per frame, at most one multiple is crossable, so the result drives at most one pulse. */
export function tickCrossed(prev: number, now: number, stride: number): boolean {
  return Math.floor(now / stride) > Math.floor(prev / stride);
}
