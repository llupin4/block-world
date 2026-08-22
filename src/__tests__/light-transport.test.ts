import { describe, it, expect } from 'vitest';
import { World, chunkKey } from '../world';
import { applyLightResult, type LightClientState } from '../light-transport';
import type { LightResult } from '../light-protocol';

function makeResult(
  changed: { cx: number; cy: number; cz: number; blight: Uint8Array; skylight: Uint8Array }[],
  pops: number,
  tick = 7,
): LightResult {
  return { t: 'result', tick, queue: 0, changed, stats: { pops, seeds: 1, fieldChanges: 1 } };
}

function freshState(): LightClientState {
  return { touched: new Set(), stats: { pops: 0, seeds: 0, fieldChanges: 0 }, queue: 0, lastTick: 0 };
}

describe('applyLightResult (the main-thread side of the worker replies)', () => {
  it('copies the pushed fields into the real chunks and fills touched + stats', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    const blight = new Uint8Array(4096);
    blight[100] = 9;
    const skylight = new Uint8Array(4096);
    skylight.fill(15);
    const state = freshState();
    applyLightResult(state, world, makeResult([{ cx: 0, cy: 0, cz: 0, blight, skylight }], 42));
    expect(Array.from(c.blight)).toEqual(Array.from(blight));
    expect(Array.from(c.skylight)).toEqual(Array.from(skylight));
    expect(state.touched).toContain(chunkKey(0, 0, 0));
    expect(state.stats).toEqual({ pops: 42, seeds: 1, fieldChanges: 1 });
    expect(state.lastTick).toBe(7);
  });

  it('accumulates across replies: touched grows (the caller consumes it), stats REPLACE (they are the engine cumulative)', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    world.ensureChunk(1, 0, 0);
    const state = freshState();
    applyLightResult(state, world, makeResult([{ cx: 0, cy: 0, cz: 0, blight: new Uint8Array(4096), skylight: new Uint8Array(4096) }], 42, 7));
    applyLightResult(state, world, makeResult([{ cx: 1, cy: 0, cz: 0, blight: new Uint8Array(4096), skylight: new Uint8Array(4096) }], 420, 13));
    expect([...state.touched].sort()).toEqual([chunkKey(0, 0, 0), chunkKey(1, 0, 0)]);
    expect(state.stats).toEqual({ pops: 420, seeds: 1, fieldChanges: 1 }); // replaced, not added
    expect(state.lastTick).toBe(13);
  });

  it('a reply for a chunk unloaded in flight is a guarded no-op', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    world.removeChunk(0, 0, 0);
    const state = freshState();
    applyLightResult(state, world, makeResult([{ cx: 0, cy: 0, cz: 0, blight: new Uint8Array(4096), skylight: new Uint8Array(4096) }], 1));
    expect(state.touched.size).toBe(0);
  });
});