// The main-thread side of the light worker (ADR 0012). LightClient posts the protocol
// messages (stamped with WorldTime.tick — the ADR 0011 seam) and applies the replies: the
// touched chunks' fields are copied into the real Chunk objects (the mesher's only light
// source, world.getLight) and accumulated into `touched` — the exact consume-once-per-frame
// contract main.ts already honors (frame N's re-mesh consumes the reply to tick N-1).
// applyLightResult is pure so vitest (node, no Worker) can test it; the Worker spawn is
// browser-only plumbing (verified by the build + the manual acceptance run).

import type { LightResult } from './light-protocol';
import type { WorldTime } from './time';
import { chunkKey, type World } from './world';

export interface LightDebugStats { pops: number; seeds: number; fieldChanges: number }

/** The bookkeeping applyLightResult updates — LightClient structurally satisfies this. */
export interface LightClientState {
  touched: Set<string>; // chunk keys; consumed and cleared exactly once per frame by main.ts
  stats: LightDebugStats; // cumulative, from the engine's stats block (replaced per reply, never added)
  queue: number; // queueSize() after the last drain (watch it reach 0)
  lastTick: number; // the tick of the last applied reply
}

/** Copy one reply's pushed fields into the real chunks and update the bookkeeping. Pure. */
export function applyLightResult(state: LightClientState, world: World, r: LightResult): void {
  state.stats.pops = r.stats.pops;
  state.stats.seeds = r.stats.seeds;
  state.stats.fieldChanges = r.stats.fieldChanges;
  state.queue = r.queue;
  state.lastTick = r.tick;
  for (const ch of r.changed) {
    const c = world.getChunk(ch.cx, ch.cy, ch.cz);
    if (!c) continue; // unloaded between the reply's send and now: nothing to apply
    c.blight.set(ch.blight);
    c.skylight.set(ch.skylight);
    state.touched.add(chunkKey(ch.cx, ch.cy, ch.cz));
  }
}

declare global {
  interface Window {
    /** The debug surface: cumulative pops/seeds/fieldChanges, latest queue, lastTick, touched. */
    __lightDebug?: LightClient;
  }
}

export class LightClient implements LightClientState {
  readonly touched = new Set<string>();
  readonly stats: LightDebugStats = { pops: 0, seeds: 0, fieldChanges: 0 };
  queue = 0;
  lastTick = 0;
  private readonly world: World;
  private readonly worldTime: WorldTime;
  private readonly worker: Worker;

  constructor(world: World, worldTime: WorldTime) {
    this.world = world;
    this.worldTime = worldTime;
    this.worker = new Worker(new URL('./light-worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<LightResult>) => applyLightResult(this, world, e.data);
  }

  /** main.ts's settleChunk equivalent: clone the chunk's block data and settle it in the worker. */
  load(cx: number, cy: number, cz: number): void {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c) return;
    this.worker.postMessage({ t: 'load', tick: this.worldTime.tick, cx, cy, cz, blocks: c.blocks.slice(), meta: c.meta.slice() });
  }

  /** main.ts's onChunkUnloaded equivalent. */
  unload(cx: number, cy: number, cz: number): void {
    this.worker.postMessage({ t: 'unload', tick: this.worldTime.tick, cx, cy, cz });
  }

  /** main.ts's edit equivalent — the new (block, meta) at (x, y, z), read live from the world (the mirror is stale without it). */
  edit(x: number, y: number, z: number): void {
    this.worker.postMessage({ t: 'edit', tick: this.worldTime.tick, x, y, z, block: this.world.getBlock(x, y, z), meta: this.world.getMeta(x, y, z) });
  }

  /** main.ts's tick equivalent: drain `budget` pops in the worker (once per frame). */
  tick(budget: number): void {
    this.worker.postMessage({ t: 'tick', tick: this.worldTime.tick, budget });
  }
}