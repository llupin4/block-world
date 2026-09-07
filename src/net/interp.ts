// Interpolation (B1): the client buffers a ring of host-tick-tagged poses per entity and
// renders the pose at renderTick = worldTime.tick - NET_INTERP_TICKS. Pure math (node-tested);
// the e2e verifies wiring (rigs land where the math says), not the math.
import { NET_STATE_STRIDE } from './messages';

export const INTERP_RING = 8; // the per-entity jitter-buffer size

export interface PoseSample {
  tick: number; // the host tick (state.tick / time.tick)
  x: number; y: number; z: number;
  yaw: number; pitch: number;
}

/** A fixed ring of `n` pose samples, oldest evicted first. `push` appends (evicting the oldest
 * when full); `samples` returns them in insertion (tick) order (oldest → newest). */
export class PoseRing {
  private buf: PoseSample[] = [];
  constructor(private readonly n: number = INTERP_RING) {}
  push(s: PoseSample): void {
    this.buf.push(s);
    if (this.buf.length > this.n) this.buf.shift();
  }
  get samples(): readonly PoseSample[] { return this.buf; }
  clear(): void { this.buf = []; }
}

/** Angle lerp by shortest arc (a 350°→10° turn sweeps through 0°, not 180°). Normalized to [-π, π]. */
export function lerpAngle(a: number, b: number, t: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  let r = a + d * t;
  r = (r + Math.PI) % (Math.PI * 2);
  if (r < 0) r += Math.PI * 2;
  return r - Math.PI;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The interpolated pose at `renderTick`. Picks the bracketing pair (s0.tick <= renderTick <=
 * s1.tick) in the tick-ordered samples and lerps. If the gap between the bracketing pair exceeds
 * NET_STATE_STRIDE (a jitter gap), there is no valid bracketing pair → hold the pose before
 * renderTick (s0). If renderTick is before the first or after the last, hold that end. Yaw
 * lerps by shortest arc. */
export function interpose(samples: readonly PoseSample[], renderTick: number): PoseSample {
  if (samples.length === 0) return { tick: renderTick, x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
  if (samples.length === 1) return samples[0]!;
  // renderTick before the first sample → hold the first.
  if (renderTick <= samples[0]!.tick) return samples[0]!;
  // renderTick at/after the last sample → hold the last.
  const last = samples[samples.length - 1]!;
  if (renderTick >= last.tick) return last;
  // Find the bracketing pair (the first s1 with s1.tick >= renderTick; s0 is its predecessor).
  for (let i = 1; i < samples.length; i++) {
    const s1 = samples[i]!;
    if (s1.tick >= renderTick) {
      const s0 = samples[i - 1]!;
      if (s1.tick === s0.tick) return s1; // duplicate ticks (shouldn't happen; be safe)
      // A gap wider than the broadcast stride means no valid bracketing pair → hold the pose
      // before renderTick (jitter on the wire; the loopback is tight, WebRTC is not).
      if (s1.tick - s0.tick > NET_STATE_STRIDE) return s0;
      const t = (renderTick - s0.tick) / (s1.tick - s0.tick);
      return { tick: renderTick, x: lerp(s0.x, s1.x, t), y: lerp(s0.y, s1.y, t), z: lerp(s0.z, s1.z, t), yaw: lerpAngle(s0.yaw, s1.yaw, t), pitch: lerp(s0.pitch, s1.pitch, t) };
    }
  }
  return last; // unreachable (renderTick < last.tick handled above)
}