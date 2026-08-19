// World time: world-level state, advanced by the simulation clock. src/main.ts
// calls advance() once per fixed 60 Hz physics substep (never from wall-clock
// dt), so a lagging frame drops frames — it never stretches the day.
// `phaseTotal`/`dayPhase` are stored counters of their own (normally advanced
// 1:1 with `time` via DAY_LENGTH), so the daylight cycle can later be frozen,
// rescaled, or set independently of the simulation clock. See
// docs/superpowers/specs/2026-08-19-day-night-clouds-design.md.
// Pure module: no three.js, no DOM — node-testable.

export const DAY_LENGTH = 240; // seconds for one full day/night cycle (2 min day + 2 min night)

export class WorldTime {
  /** Total simulation time (s). */
  time = 0;
  /** Total phase progressed, in cycles. Stored, not derived from `time`, so the cycle can later run independently. */
  private phaseTotal = 0;

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

  /** Advance the simulation clock and (by default) the daylight cycle in lockstep. */
  advance(dt: number): void {
    this.time += dt;
    this.phaseTotal += dt / DAY_LENGTH;
  }
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** `"Day 2 · 19:41"` for the HUD. `hour` is the fractional display hour (WorldTime.hour). */
export function formatClock(day: number, hour: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour - h) * 60 + 1e-9);
  return `Day ${day} · ${pad2(h)}:${pad2(m)}`;
}