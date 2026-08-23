import { describe, it, expect } from 'vitest';
import { World, chunkKey, localIndex, chunkOf } from '../world';
import { Block } from '../blocks';
import { LightSim } from '../light';
import { LightWorkerState } from '../light-worker-core';
import { applyLightResult, type LightClientState } from '../light-transport';
import type { LightMsg } from '../light-protocol';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from '../terrain';
import * as streaming from '../streaming';
import { WaterSim } from '../water';

function chunkMsg(world: World, cx: number, cy: number, cz: number, tick: number): LightMsg {
  const c = world.getChunk(cx, cy, cz)!;
  return { t: 'load', tick, cx, cy, cz, blocks: c.blocks.slice(), meta: c.meta.slice() };
}

describe('light worker core (the protocol driving a pin-identical LightSim over a mirror)', () => {
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

    const state = new LightWorkerState();
    state.handle(chunkMsg(world, 0, 0, 0, 1));
    state.handle(chunkMsg(world, 1, 0, 0, 2)); // initial load: torch A only
    state.handle({ t: 'tick', tick: 3, budget: 100_000 })!;

    world.setBlock(17, 8, 8, Block.Torch); // content changed between the initial load and the remesh
    direct.settleChunk(1, 0, 0); // a remesh: lightSettled => seam-only
    direct.tick(100_000);
    state.handle(chunkMsg(world, 1, 0, 0, 4)); // the duplicate load carries the new torch
    state.handle({ t: 'tick', tick: 5, budget: 100_000 })!;

    expect(state.stats.pops, 'same sequence, same pops').toBe(direct.stats.pops);
    for (const [cx, cy, cz] of [[0, 0, 0], [1, 0, 0]] as const) {
      const m = state.chunk(cx, cy, cz)!;
      const c = world.getChunk(cx, cy, cz)!;
      expect(Array.from(m.blight)).toEqual(Array.from(c.blight));
      expect(Array.from(m.skylight)).toEqual(Array.from(c.skylight));
    }
    expect(state.chunk(1, 0, 0)!.blocks[localIndex(1, 8, 8)], 'the duplicate load re-synced the mirror with the changed content').toBe(Block.Torch);
  });
});

describe('light worker core — the reply→apply seam (a settled chunk\'s fields reach the main world)', () => {
  it('a fresh chunk whose settle changes no field via pop is still pushed, and the main copy receives its fields', () => {
    const world = new World();
    world.ensureChunk(0, 2, 2);
    const c = world.getChunk(0, 2, 2)!;
    for (let i = 0; i < c.blocks.length; i++) c.blocks[i] = Block.Dirt; // flat dirt — the user's acceptance world
    for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) for (let ly = 12; ly < 16; ly++) c.blocks[localIndex(lx, ly, lz)] = Block.Air; // open sky above the surface
    const state = new LightWorkerState();
    state.handle(chunkMsg(world, 0, 2, 2, 1)); // prefill writes the column emission directly; in this isolated flat chunk no pop changes a field
    const r = state.handle({ t: 'tick', tick: 2, budget: 100_000 })!;

    const pushed = r.changed.find((ch) => chunkKey(ch.cx, ch.cy, ch.cz) === chunkKey(0, 2, 2));
    expect(pushed, 'the settled chunk is in the reply even though its settle changed no field via pop').toBeDefined();

    // the full seam: the reply lands in the MAIN world's copy (the mesher's only light source)
    const client: LightClientState = { touched: new Set(), stats: { pops: 0, seeds: 0, fieldChanges: 0 }, queue: 0, lastTick: 0 };
    applyLightResult(client, world, r);
    const m = state.chunk(0, 2, 2)!;
    expect(Array.from(c.blight)).toEqual(Array.from(m.blight));
    expect(Array.from(c.skylight)).toEqual(Array.from(m.skylight));
    expect(c.skylight[localIndex(8, 15, 8)], 'an open-sky air cell is lit in the main copy').toBe(15);
    expect(c.skylight[localIndex(8, 11, 8)], 'and the surface block\'s own cell').toBe(15);
    expect(c.skylight[localIndex(8, 10, 8)], 'a buried cell stays dark').toBe(0);
  });
});

describe('light worker core — boot replay equivalence (identical fields; the worker-path lineage)', () => {
  it('the same boot sequence through the protocol reaches identical fields; the worker-path lineage is the inline lineage minus the one-time boot wave', () => {
    const world = new World();
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2); // main.ts:239 boot column (0,·,2)
    const water = new WaterSim(world); // settled like main.ts for sequence fidelity (light is water-blind)
    const direct = new LightSim(world); // path (a): the engine inline on the world (today's main thread)

    type Op =
      | { k: 'load'; cx: number; cy: number; cz: number; blocks: Uint8Array; meta: Uint8Array }
      | { k: 'unload'; cx: number; cy: number; cz: number }
      | { k: 'tick' };
    const ops: Op[] = [];
    const recordLoad = (cx: number, cy: number, cz: number): void => {
      const c = world.getChunk(cx, cy, cz)!; // capture the data NOW — a later-unloaded chunk is gone from the world by replay time
      ops.push({ k: 'load', cx, cy, cz, blocks: c.blocks.slice(), meta: c.meta.slice() });
    };

    water.settle(0, 2, 2); // main.ts settles the boot chunk before the first ring turn
    recordLoad(0, 2, 2);
    direct.settleChunk(0, 2, 2);

    let guard = 0;
    for (;;) {
      const r = streaming.update(world, chunkOf(6), chunkOf(46), 2); // main.ts:787 (spawn 6,46, pcy 2)
      if (r.rebuilt.length === 0 && r.unloaded.length === 0) break;
      for (const c of r.rebuilt) {
        water.settle(c.cx, c.cy, c.cz);
        recordLoad(c.cx, c.cy, c.cz);
        direct.settleChunk(c.cx, c.cy, c.cz);
        const ch = world.getChunk(c.cx, c.cy, c.cz);
        if (ch) ch.dirty = false; // main.ts:317 — rebuildChunkMesh clears dirty
      }
      for (const c of r.unloaded) {
        ops.push({ k: 'unload', cx: c.cx, cy: c.cy, cz: c.cz });
        direct.onChunkUnloaded(c.cx, c.cy, c.cz);
      }
      ops.push({ k: 'tick' });
      direct.tick(100_000); // the collapsed drain, like light-load.test.ts:35
      water.tick(100_000);
      if (++guard > 500) throw new Error('replay did not stabilize in 500 streaming calls');
    }

    // path (b): the SAME ops through the protocol
    const state = new LightWorkerState();
    let tickN = 1;
    for (const op of ops) {
      if (op.k === 'load') state.handle({ t: 'load', tick: tickN++, cx: op.cx, cy: op.cy, cz: op.cz, blocks: op.blocks, meta: op.meta });
      else if (op.k === 'unload') state.handle({ t: 'unload', tick: tickN++, cx: op.cx, cy: op.cy, cz: op.cz });
      else state.handle({ t: 'tick', tick: tickN++, budget: 100_000 });
    }

    // equivalence: every chunk's fields — the worker path reaches the identical fixpoint
    for (const c of world.allChunks()) {
      const m = state.chunk(c.cx, c.cy, c.cz);
      expect(m, `the mirror holds chunk ${c.cx},${c.cy},${c.cz}`).toBeDefined();
      expect(Array.from(m!.blight), `blight ${c.cx},${c.cy},${c.cz}`).toEqual(Array.from(c.blight));
      expect(Array.from(m!.skylight), `skylight ${c.cx},${c.cy},${c.cz}`).toEqual(Array.from(c.skylight));
    }
    // the mirror's chunk set tracks the world 1:1 — both directions (the loop above covers
    // world→mirror; a stale extra mirror chunk, e.g. a lost unload op, would show up here)
    expect(state.chunkCount, 'mirror chunk count = world chunk count').toBe(world.count());
    // lineage: pinned per path. The direct replay is a faithful light-load.test.ts replica
    // (the engine's inline regression guard); the worker path carries its own lineage —
    // identical fields, one-time −24,251 pops. The delta is the inline engine's redundant
    // pre-streaming boot wave: at the boot settleChunk(0,2,2) the real world already holds
    // all 5 boot-column chunks, so seedSeamNeighbor seeds the two adjacent siblings' 512
    // face-shell cells and cascades them through the queue — throwaway work the siblings'
    // fresh-load prefill redoes when streaming remeshes them. The mirror correctly holds
    // only the streamed chunks, so it skips the wave; after boot its chunk set tracks the
    // world 1:1 (every load/unload is mirrored): the same events drive both from there, and
    // the one-time boot wave is the only delta this replay can produce.
    expect(direct.stats.pops, 'the inline replay pins the engine lineage').toBe(459_134);
    expect(state.stats.pops, 'the worker-path lineage (the redundant boot wave is skipped)').toBe(434_883);
  }, 60_000);
});