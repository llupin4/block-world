import { describe, expect, it, vi } from 'vitest';
import { ChunkRemesher } from '../rendering/chunk-remesher';
import { queueMeshUpdates, rebuildEditedChunks } from '../rendering/mesh-invalidation';
import { CHUNK_SIZE, World } from '../world';

describe('edit mesh invalidation', () => {
  it('rebuilds an interior edit immediately without checking neighbors', () => {
    const world = { hasChunk: vi.fn(() => true) };
    const rebuild = vi.fn();
    rebuildEditedChunks(world, [2, 3, 4], rebuild);
    expect(rebuild.mock.calls).toEqual([[0, 0, 0]]);
    expect(world.hasChunk).not.toHaveBeenCalled();
  });

  it.each([0, 1, 2])('checks both faces of axis %i at positive and negative boundaries', (axis) => {
    for (const origin of [-CHUNK_SIZE, 0, CHUNK_SIZE]) {
      for (const local of [0, CHUNK_SIZE - 1]) {
        const position: [number, number, number] = [2, 3, 4];
        position[axis] = origin + local;
        const center = [0, 0, 0];
        center[axis] = origin / CHUNK_SIZE;
        const neighbor = [...center];
        neighbor[axis] += local === 0 ? -1 : 1;
        const world = { hasChunk: vi.fn(() => true) };
        const rebuild = vi.fn();
        rebuildEditedChunks(world, position, rebuild);
        expect(rebuild.mock.calls).toEqual([center, neighbor]);
        expect(world.hasChunk.mock.calls).toEqual([neighbor]);
      }
    }
  });

  it('rebuilds only face neighbors at a corner, in the original x/z/y order', () => {
    const world = { hasChunk: vi.fn(() => true) };
    const rebuild = vi.fn();
    rebuildEditedChunks(world, [-1, 0, CHUNK_SIZE - 1], rebuild);
    expect(rebuild.mock.calls).toEqual([
      [-1, 0, 0],
      [0, 0, 0],
      [-1, 0, 1],
      [-1, -1, 0],
    ]);
  });

  it('skips unloaded neighbors without creating chunks', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    world.ensureChunk(0, -1, 0);
    const rebuild = vi.fn();
    rebuildEditedChunks(world, [0, 0, 0], rebuild);
    expect(rebuild.mock.calls).toEqual([
      [0, 0, 0],
      [0, -1, 0],
    ]);
    expect(world.count()).toBe(2);
  });
});

describe('queued mesh invalidation', () => {
  it('consumes all sources once and accepts new updates on the next frame', () => {
    const water = new Set(['0,0,0']);
    const light = new Set(['1,0,0']);
    const firstMeshes = new Set(['2,0,0']);
    const remesher = { request: vi.fn() };
    queueMeshUpdates(remesher, water, light, firstMeshes);
    expect(remesher.request.mock.calls).toEqual([['0,0,0'], ['1,0,0'], ['2,0,0']]);
    expect([water.size, light.size, firstMeshes.size]).toEqual([0, 0, 0]);
    queueMeshUpdates(remesher, water, light, firstMeshes);
    expect(remesher.request).toHaveBeenCalledTimes(3);
    light.add('0,0,0');
    queueMeshUpdates(remesher, water, light, firstMeshes);
    expect(remesher.request).toHaveBeenCalledTimes(4);
    expect(remesher.request).toHaveBeenLastCalledWith('0,0,0');
  });

  it('lets the remesher deduplicate overlapping sources without rebuilding immediately', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    const swap = vi.fn();
    const mesh = { opaque: null, trans: null };
    const remesher = new ChunkRemesher(swap, undefined, {
      probe: () => ({ complete: true, mesh }),
      slice: () => mesh,
    });
    queueMeshUpdates(remesher, new Set(['0,0,0']), new Set(['0,0,0']));
    expect(swap).not.toHaveBeenCalled();
    expect(remesher.has('0,0,0')).toBe(true);
    remesher.drain(world, () => [0, 0], [0, 0, 0]);
    expect(swap).toHaveBeenCalledTimes(1);
    expect(remesher.has('0,0,0')).toBe(false);
  });
});
