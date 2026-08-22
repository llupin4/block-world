import { describe, it, expect } from 'vitest';
import { World, chunkKey, localIndex } from '../world';
import { Block } from '../blocks';
import { LightSim } from '../light';
import { LightWorkerState } from '../light-worker-core';
import type { LightMsg } from '../light-protocol';

function chunkMsg(world: World, cx: number, cy: number, cz: number, tick: number): LightMsg {
  const c = world.getChunk(cx, cy, cz)!;
  return { t: 'load', tick, cx, cy, cz, blocks: c.blocks.slice(), meta: c.meta.slice() };
}

describe('light worker core (the protocol driving an unmodified LightSim over a mirror)', () => {
  it('push content: a torch chunk settles, the reply carries its fields, and the idle reply is empty', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    world.setBlock(8, 8, 8, Block.Torch);
    const state = new LightWorkerState();
    state.handle(chunkMsg(world, 0, 0, 0, 1));
    const r1 = state.handle({ t: 'tick', tick: 2, budget: 100_000 })!;
    expect(r1.changed.map((c) => chunkKey(c.cx, c.cy, c.cz))).toEqual([chunkKey(0, 0, 0)]);
    const pushed = r1.changed[0];
    expect(pushed.blight[localIndex(8, 8, 8)]).toBe(14); // the torch's own cell
    expect(pushed.blight[localIndex(9, 8, 8)]).toBe(13); // one step out in the open air
    expect(pushed.skylight[localIndex(8, 8, 8)]).toBe(15); // open column
    expect(r1.queue).toBe(0);
    // an idle tick: still exactly one reply, empty changed, cumulative stats unchanged
    const r2 = state.handle({ t: 'tick', tick: 3, budget: 100_000 })!;
    expect(r2.changed).toEqual([]);
    expect(r2.stats).toEqual(r1.stats);
  });

  it('edit: a torch placed after load lights the mirror (the message carries the new block+meta)', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    const state = new LightWorkerState();
    state.handle(chunkMsg(world, 0, 0, 0, 1));
    // main does world.setBlock, then the edit — the mirror needs the new (block, meta)
    world.setBlock(8, 8, 8, Block.Torch);
    state.handle({ t: 'edit', tick: 2, x: 8, y: 8, z: 8, block: world.getBlock(8, 8, 8), meta: world.getMeta(8, 8, 8) });
    const r = state.handle({ t: 'tick', tick: 3, budget: 100_000 })!;
    const pushed = r.changed.find((c) => c.cx === 0 && c.cy === 0 && c.cz === 0);
    expect(pushed, 'the edited chunk is pushed').toBeDefined();
    expect(pushed!.blight[localIndex(8, 8, 8)]).toBe(14);
    expect(pushed!.blight[localIndex(9, 8, 8)]).toBe(13);
    // the edit applied to the mirror's block data too
    expect(state.chunk(0, 0, 0)!.blocks[localIndex(8, 8, 8)]).toBe(Block.Torch);
  });

  it('unload: the surviving chunk\'s fields darken exactly as the direct engine darkens them', () => {
    const world = new World();
    const left = world.ensureChunk(0, 0, 0);
    world.ensureChunk(1, 0, 0);
    world.setBlock(16, 8, 8, Block.Torch); // in the right chunk, one cell right of the seam
    // capture the worker's load data from the live world first (as main.ts's client would —
    // the direct path below removes the chunk from the world)
    const right = world.getChunk(1, 0, 0)!;
    const rightData = { blocks: right.blocks.slice(), meta: right.meta.slice() };

    const direct = new LightSim(world);
    direct.settleChunk(0, 0, 0);
    direct.settleChunk(1, 0, 0);
    direct.tick(100_000);

    // main.ts order: streaming removes the chunk from the world, THEN onChunkUnloaded
    world.removeChunk(1, 0, 0);
    direct.onChunkUnloaded(1, 0, 0);
    direct.tick(100_000); // the darkness wave through the left chunk

    const state = new LightWorkerState();
    state.handle(chunkMsg(world, 0, 0, 0, 1));
    state.handle({ t: 'load', tick: 2, cx: 1, cy: 0, cz: 0, blocks: rightData.blocks, meta: rightData.meta });
    state.handle({ t: 'tick', tick: 3, budget: 100_000 })!;
    state.handle({ t: 'unload', tick: 4, cx: 1, cy: 0, cz: 0 })!;
    const r = state.handle({ t: 'tick', tick: 5, budget: 100_000 })!;

    const pushedLeft = r.changed.find((c) => c.cx === 0 && c.cz === 0);
    expect(pushedLeft, 'the surviving chunk is pushed (its seam darkened)').toBeDefined();
    expect(Array.from(pushedLeft!.blight)).toEqual(Array.from(left.blight));
    expect(Array.from(pushedLeft!.skylight)).toEqual(Array.from(left.skylight));
    expect(r.changed.find((c) => c.cx === 1), 'the unloaded chunk is not pushed').toBeUndefined();
    expect(state.chunk(1, 0, 0), 'the mirror dropped the chunk').toBeUndefined();
  });

  it('edit targeting a chunk absent from the mirror: no crash, nothing changes', () => {
    const state = new LightWorkerState();
    state.handle({ t: 'edit', tick: 1, x: 100, y: 5, z: 100, block: Block.Stone, meta: 0 });
    const r = state.handle({ t: 'tick', tick: 2, budget: 100_000 })!;
    expect(r.changed).toEqual([]);
    expect(r.stats.pops).toBe(0);
  });

  it('duplicate load (the remesh path): seam-only re-settle, same pops and fields as the direct engine', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    const direct = new LightSim(world);
    direct.settleChunk(0, 0, 0); // same sequence as the worker: chunk 0 settles while chunk 1 is absent
    world.ensureChunk(1, 0, 0);
    world.setBlock(16, 8, 8, Block.Torch);
    direct.settleChunk(1, 0, 0);
    direct.tick(100_000);
    direct.settleChunk(1, 0, 0); // a remesh: lightSettled => seam-only
    direct.tick(100_000);

    const state = new LightWorkerState();
    state.handle(chunkMsg(world, 0, 0, 0, 1));
    state.handle(chunkMsg(world, 1, 0, 0, 2));
    state.handle({ t: 'tick', tick: 3, budget: 100_000 })!;
    state.handle(chunkMsg(world, 1, 0, 0, 4)); // the duplicate load
    state.handle({ t: 'tick', tick: 5, budget: 100_000 })!;

    expect(state.stats.pops, 'same sequence, same pops').toBe(direct.stats.pops);
    for (const [cx, cy, cz] of [[0, 0, 0], [1, 0, 0]] as const) {
      const m = state.chunk(cx, cy, cz)!;
      const c = world.getChunk(cx, cy, cz)!;
      expect(Array.from(m.blight)).toEqual(Array.from(c.blight));
      expect(Array.from(m.skylight)).toEqual(Array.from(c.skylight));
    }
  });
});