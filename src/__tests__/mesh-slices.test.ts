import { it, expect } from 'vitest';
import { World, localIndex, type Chunk, type VoxelBuffer } from '../world';
import { Block } from '../blocks';
import type { ChunkMesh } from '../chunk-mesher';
import { decideBands, mergeSlices, PROBE_VERTS, SLICE_COUNT } from '../mesh-slices';

/** A chunk whose row ly holds the first `counts[ly]` cells (in localIndex order, lz 0..15 ×
 * lx 0..15) as stone — decideBands only counts per-row non-air cells, so the layout within
 * the row is irrelevant. */
function chunkWithRows(counts: number[]): Chunk {
  const w = new World();
  const c = w.ensureChunk(0, 0, 0);
  for (let ly = 0; ly < 16; ly++)
    for (let i = 0; i < counts[ly]; i++) c.blocks[localIndex(i, ly, 0)] = Block.Stone;
  return c;
}

function vbuf(verts: number[], idx: number[]): VoxelBuffer {
  const n = verts.length / 3;
  return {
    positions: new Float32Array(verts),
    colors: new Float32Array(n * 4).fill(1), // well-formed: 4 floats per vertex (rgb + alpha)
    uvs: new Float32Array(n * 2),
    light: new Float32Array(n * 2),
    indices: new Uint32Array(idx),
  };
}

it('constants are pinned to the Phase 0 derivation (remesh-perf.test.ts)', () => {
  expect(PROBE_VERTS).toBe(Math.floor(6312 * 16.7 / 28)); // = 3764
  expect(SLICE_COUNT).toBe(Math.ceil(6312 / Math.floor(6312 * 8 / 28))); // = 4
});

it('decideBands: 4 contiguous bands covering [0,16), balanced by row count', () => {
  const uniform = new Array(16).fill(256);
  expect(decideBands(chunkWithRows(uniform), SLICE_COUNT)).toEqual([[0, 4], [4, 8], [8, 12], [12, 16]]);
  // bottom-heavy: content only in rows 0..7 → the first 3 bands split it, the last takes the empty top
  const bottom = [256, 256, 256, 256, 256, 256, 256, 256, 0, 0, 0, 0, 0, 0, 0, 0];
  expect(decideBands(chunkWithRows(bottom), SLICE_COUNT)).toEqual([[0, 2], [2, 4], [4, 6], [6, 16]]);
  // all-air: equal (empty) bands
  expect(decideBands(chunkWithRows(new Array(16).fill(0)), SLICE_COUNT)).toEqual([[0, 4], [4, 8], [8, 12], [12, 16]]);
  // the worst chunk's measured rowCounts (remesh-perf.test.ts) → the measured band edges
  const worstRows = [133, 152, 173, 205, 225, 224, 223, 221, 225, 237, 255, 254, 255, 256, 256, 256];
  expect(decideBands(chunkWithRows(worstRows), SLICE_COUNT)).toEqual([[0, 5], [5, 9], [9, 13], [13, 16]]);
});

it('mergeSlices: concats attributes in band order and rebases indices by preceding vertex counts', () => {
  const a: ChunkMesh = { opaque: vbuf([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], [0, 1, 2, 0, 2, 3]), trans: null }; // 4 verts
  const b: ChunkMesh = { opaque: vbuf([2, 0, 0, 3, 0, 0], [0, 1]), trans: null }; // 2 verts
  const m = mergeSlices([a, b]);
  expect(m.opaque).not.toBeNull();
  expect(m.opaque!.positions).toEqual(new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0]));
  expect(m.opaque!.indices).toEqual(new Uint32Array([0, 1, 2, 0, 2, 3, 4, 5])); // b's indices +4
  expect(m.trans).toBeNull();
});

it('mergeSlices: null passes contribute nothing; all-null → null; single slice deep-equals', () => {
  const a: ChunkMesh = { opaque: vbuf([0, 0, 0, 1, 0, 0], [0, 1]), trans: null };
  const mid: ChunkMesh = { opaque: null, trans: null };
  const b: ChunkMesh = { opaque: null, trans: vbuf([0, 0, 0], [0]) };
  const m = mergeSlices([a, mid, b]);
  expect(m.opaque!.positions).toEqual(new Float32Array([0, 0, 0, 1, 0, 0]));
  expect(m.opaque!.indices).toEqual(new Uint32Array([0, 1]));
  expect(m.trans!.positions).toEqual(new Float32Array([0, 0, 0]));
  expect(mergeSlices([{ opaque: null, trans: null }, { opaque: null, trans: null }]))
    .toEqual({ opaque: null, trans: null });
  const solo = mergeSlices([a]);
  expect(solo.opaque!.positions).toEqual(a.opaque!.positions);
  expect(solo.opaque!.indices).toEqual(a.opaque!.indices);
});