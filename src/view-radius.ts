// Adaptive single-player view radius (spec 2026-09-17-adaptive-view-radius-design.md). A pure
// frame-time governor: feed it each frame's main-thread work + whether the current-radius ring is
// fully loaded; it returns the view radius (2..4), growing toward 4 with headroom and falling back
// to 2 under load. No three/DOM — node-testable.
export const MIN_RADIUS = 2;
export const MAX_RADIUS = 4;
const ALPHA = 0.1;       // EMA time constant (~10 frames)
const MAX_WINDOW = 30;   // recent-max window (0.5 s)
const GROW_EMA = 12.0;   // grow only when the EMA is under this (ms)
const GROW_MAX = 15.0;   // ... and the recent max is under this (ms)
const SHRINK_EMA = 15.0; // shrink when the EMA is over this (ms)
const SHRINK_MAX = 16.5; // ... or the recent max is over this (ms)
const COOLDOWN = 60;     // frames between changes (1 s)

/** Target loaded-chunk count for a radius: (2r+1)^2 columns x the 5-level y band. 125/245/405. */
export function targetChunks(radius: number): number {
  return (2 * radius + 1) ** 2 * 5;
}

export class ViewRadiusGovernor {
  radius = MIN_RADIUS;
  private ema = 0;
  private hasEma = false;
  private recent: number[] = [];
  private cooldown = 0;

  /** Feed one frame's main-thread work (ms) + whether the current-radius ring is fully loaded.
   *  Returns the (possibly changed) radius. */
  noteFrame(workMs: number, ringFull: boolean): number {
    this.ema = this.hasEma ? this.ema * (1 - ALPHA) + workMs * ALPHA : workMs;
    this.hasEma = true;
    this.recent.push(workMs);
    if (this.recent.length > MAX_WINDOW) this.recent.shift();
    if (!ringFull) return this.radius; // the ring is filling: frame time is transient, don't react
    if (this.cooldown > 0) { this.cooldown--; return this.radius; }
    const maxRecent = Math.max(...this.recent);
    if (this.radius < MAX_RADIUS && this.ema < GROW_EMA && maxRecent < GROW_MAX) {
      this.radius++; this.cooldown = COOLDOWN;
    } else if (this.radius > MIN_RADIUS && (this.ema > SHRINK_EMA || maxRecent > SHRINK_MAX)) {
      this.radius--; this.cooldown = COOLDOWN;
    }
    return this.radius;
  }
}
