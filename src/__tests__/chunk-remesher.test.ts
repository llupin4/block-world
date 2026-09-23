import { describe, expect, it, vi } from 'vitest';
import type { ChunkMesh, LightSampler } from '../chunk-mesher';
import { PROBE_VERTS } from '../mesh-slices';
import { ChunkRemesher } from '../rendering/chunk-remesher';
import { World } from '../world';

const emptyMesh: ChunkMesh = { opaque: null, trans: null };
const light: LightSampler = () => [0, 0];

function setup() {
  const world = new World();
  const swap = vi.fn();
  const note = vi.fn();
  const probe = vi.fn(() => ({ complete: true, mesh: emptyMesh }));
  const slice = vi.fn(() => emptyMesh);
  const remesher = new ChunkRemesher(swap, note, { probe, slice });
  const request = (x: number, y = 0, z = 0) => {
    world.ensureChunk(x, y, z);
    remesher.request(`${x},${y},${z}`);
  };
  const drain = () => remesher.drain(world, light, [0, 0, 0]);
  return { world, swap, note, probe, slice, remesher, request, drain };
}

describe('ChunkRemesher', () => {
  it('deduplicates requests, prioritizes horizontal distance then height, and budgets three candidates', () => {
    const { request, drain, remesher, swap, probe, world } = setup();
    request(2);
    request(0, 2);
    request(1);
    request(0);
    request(0);
    drain();
    expect(swap.mock.calls.map((call) => call.slice(0, 3))).toEqual([
      [0, 0, 0],
      [0, 2, 0],
      [1, 0, 0],
    ]);
    expect(probe).toHaveBeenCalledWith(world, 0, 0, 0, light, PROBE_VERTS);
    expect(remesher.has('2,0,0')).toBe(true);
    drain();
    expect(swap).toHaveBeenCalledTimes(4);
    expect(remesher.has('2,0,0')).toBe(false);
  });

  it('counts missing chunks against the candidate budget without meshing them', () => {
    const { remesher, request, drain, swap } = setup();
    remesher.request('0,0,0');
    remesher.request('0,1,0');
    remesher.request('0,2,0');
    request(1);
    drain();
    expect(swap).not.toHaveBeenCalled();
    expect(remesher.has('0,0,0')).toBe(false);
    drain();
    expect(swap).toHaveBeenCalledTimes(1);
  });

  it('reserves slice frames and swaps only after all four bands are complete', () => {
    const { probe, request, drain, slice, swap, note, remesher } = setup();
    probe.mockReturnValueOnce({ complete: false, mesh: emptyMesh });
    request(0);
    request(1);
    drain();
    expect(probe).toHaveBeenCalledTimes(1);
    expect(slice).toHaveBeenCalledTimes(1);
    expect(swap).not.toHaveBeenCalled();
    expect(remesher.has('0,0,0')).toBe(true);
    drain();
    drain();
    expect(swap).not.toHaveBeenCalled();
    drain();
    expect(slice).toHaveBeenCalledTimes(4);
    expect(swap).toHaveBeenCalledTimes(1);
    expect(note.mock.calls.map((call) => call[1])).toEqual(['plan', 'slice', 'slice', 'merge']);
    expect(remesher.has('0,0,0')).toBe(false);
    expect(remesher.has('1,0,0')).toBe(true);
    drain();
    expect(swap).toHaveBeenCalledTimes(2);
  });

  it('preserves a request made during slicing for a fresh rebuild after merge', () => {
    const { probe, request, drain, remesher, swap } = setup();
    probe.mockReturnValueOnce({ complete: false, mesh: emptyMesh });
    request(0);
    drain();
    remesher.request('0,0,0');
    drain();
    drain();
    drain();
    expect(remesher.has('0,0,0')).toBe(true);
    drain();
    expect(swap).toHaveBeenCalledTimes(2);
    expect(remesher.has('0,0,0')).toBe(false);
  });

  it('cancels an unfinished slice for a synchronous edit without dropping new requests', () => {
    const { probe, request, drain, remesher, slice, swap } = setup();
    probe.mockReturnValueOnce({ complete: false, mesh: emptyMesh });
    request(0);
    drain();
    remesher.request('0,0,0');
    remesher.cancelSlice('0,0,0');
    drain();
    expect(slice).toHaveBeenCalledTimes(1);
    expect(swap).toHaveBeenCalledTimes(1);
    expect(swap).toHaveBeenCalledWith(0, 0, 0, emptyMesh);
  });

  it('drops queued and sliced work on explicit removal', () => {
    const { probe, request, drain, remesher, swap } = setup();
    probe.mockReturnValueOnce({ complete: false, mesh: emptyMesh });
    request(0);
    drain();
    request(0);
    remesher.remove('0,0,0');
    expect(remesher.has('0,0,0')).toBe(false);
    drain();
    expect(swap).not.toHaveBeenCalled();
  });

  it('discards an in-flight chunk that disappeared, reserving that frame as before', () => {
    const { probe, request, drain, world, remesher, swap } = setup();
    probe.mockReturnValueOnce({ complete: false, mesh: emptyMesh });
    request(0);
    request(1);
    drain();
    world.removeChunk(0, 0, 0);
    drain();
    expect(remesher.has('0,0,0')).toBe(false);
    expect(swap).not.toHaveBeenCalled();
    drain();
    expect(swap).toHaveBeenCalledTimes(1);
  });
});
