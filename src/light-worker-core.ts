// The light worker's logic (ADR 0012): a pin-identical LightSim running over a mirror of the
// loaded chunks' fields. Kept node-importable (no Worker/self references) so vitest can
// drive handle() directly — the Worker entry (src/light-worker.ts) is thin plumbing.
// Determinism by construction: the engine sees the same event sequence in the same order
// as the main thread's inline calls (FIFO both ways, one in-flight tick). The boot pop
// lineage is pinned per path — inline 459,134 (light-load.test.ts), worker path 434,883
// (light-worker-core.test.ts): the delta is the one-time redundant boot wave the mirror
// skips (the boot settle seeds the two boot siblings' 512 face shells inline; the mirror
// holds only the streamed chunks), which the siblings' fresh-load prefill throws away.
// Fields are byte-identical at quiescence.

import { LightSim, type LightStats } from './light';
import { CHUNK_SIZE, CHUNK_VOL, chunkKey, chunkOf, localIndex, type World } from './world';
import type { ChangedChunk, LightMsg, LightResult } from './light-protocol';

/** A structural twin of world.ts's Chunk for the fields LightSim touches (nothing else). */
export interface MirrorChunk {
  cx: number; cy: number; cz: number;
  blocks: Uint8Array;
  meta: Uint8Array;
  blight: Uint8Array;
  skylight: Uint8Array;
  colSum: Uint8Array;
  lightSettled: boolean;
}

/** The world stand-in: the only method the engine ever calls is getChunk. */
export class MirrorWorld {
  private readonly chunks = new Map<string, MirrorChunk>();

  getChunk(cx: number, cy: number, cz: number): MirrorChunk | undefined {
    return this.chunks.get(chunkKey(cx, cy, cz));
  }

  /** The mirror's loaded-chunk count. */
  get size(): number { return this.chunks.size; }

  /** Fresh installs get zeroed light fields; duplicates (the remesh path) refresh blocks/meta in place. */
  load(cx: number, cy: number, cz: number, blocks: Uint8Array, meta: Uint8Array): void {
    const key = chunkKey(cx, cy, cz);
    const c = this.chunks.get(key);
    if (c) {
      c.blocks.set(blocks);
      c.meta.set(meta);
      return;
    }
    this.chunks.set(key, {
      cx, cy, cz,
      blocks: blocks.slice(),
      meta: meta.slice(),
      blight: new Uint8Array(CHUNK_VOL),
      skylight: new Uint8Array(CHUNK_VOL),
      colSum: new Uint8Array(256),
      lightSettled: false,
    });
  }

  unload(cx: number, cy: number, cz: number): void {
    this.chunks.delete(chunkKey(cx, cy, cz));
  }

  /** The world.setBlock equivalent — before the engine call, exactly like main.ts's order. */
  applyEdit(x: number, y: number, z: number, block: number, meta: number): void {
    const c = this.getChunk(chunkOf(x), chunkOf(y), chunkOf(z));
    if (!c) return; // an edit targeting an unloaded chunk: the engine no-ops too
    const i = localIndex(x - c.cx * CHUNK_SIZE, y - c.cy * CHUNK_SIZE, z - c.cz * CHUNK_SIZE);
    c.blocks[i] = block;
    c.meta[i] = meta;
  }
}

export class LightWorkerState {
  private readonly world: MirrorWorld = new MirrorWorld();
  // The engine is typed against World; the mirror is a structural stand-in (its getChunk
  // returns the chunk shape the engine reads). The single localized cast — src/light.ts
  // stays pin-identical (its node tests and the 459,134 pin preserved; the sole change is
  // settleChunk's fresh-settle touched mark, 705c663 — the reply's push contract).
  private readonly sim: LightSim = new LightSim(this.world as unknown as World);

  /** A read accessor for tests. */
  chunk(cx: number, cy: number, cz: number): MirrorChunk | undefined {
    return this.world.getChunk(cx, cy, cz);
  }

  /** The mirror's loaded-chunk count (the world↔mirror 1:1 guard in the boot-replay test). */
  get chunkCount(): number {
    return this.world.size;
  }

  get stats(): LightStats {
    return this.sim.stats;
  }

  /** Apply one protocol message; the `tick` message returns the reply, the others null. */
  handle(msg: LightMsg): LightResult | null {
    switch (msg.t) {
      case 'load': {
        this.world.load(msg.cx, msg.cy, msg.cz, msg.blocks, msg.meta);
        this.sim.settleChunk(msg.cx, msg.cy, msg.cz); // colSum maintained; fresh = prefill+frontier, remesh = seam-only
        return null;
      }
      case 'unload': {
        this.world.unload(msg.cx, msg.cy, msg.cz); // remove FIRST — streaming removes the chunk before onChunkUnloaded
        this.sim.onChunkUnloaded(msg.cx, msg.cy, msg.cz);
        return null;
      }
      case 'edit': {
        // main.ts only edits loaded chunks (raycast hit): a message for a chunk absent from the
        // mirror is a TRUE no-op. (Unguarded, the engine's edit() would still seed 7 phantom
        // cells — seed() counts unconditionally — so the worker guards instead of replaying
        // impossible work.)
        if (!this.world.getChunk(chunkOf(msg.x), chunkOf(msg.y), chunkOf(msg.z))) return null;
        this.world.applyEdit(msg.x, msg.y, msg.z, msg.block, msg.meta);
        this.sim.edit(msg.x, msg.y, msg.z);
        return null;
      }
      case 'tick': {
        this.sim.tick(msg.budget);
        const changed: ChangedChunk[] = [];
        for (const key of this.sim.touched) {
          const [cx, cy, cz] = key.split(',').map(Number) as [number, number, number];
          const c = this.world.getChunk(cx, cy, cz);
          if (!c) continue; // touched then unloaded before this reply: nothing to push (the apply guards too)
          changed.push({ cx, cy, cz, blight: c.blight.slice(), skylight: c.skylight.slice() });
        }
        this.sim.touched.clear(); // the once-per-frame consume — the worker is the engine's "main"
        return {
          t: 'result',
          tick: msg.tick,
          queue: this.sim.queueSize(),
          changed,
          stats: { pops: this.sim.stats.pops, seeds: this.sim.stats.seeds, fieldChanges: this.sim.stats.fieldChanges },
        };
      }
    }
  }
}