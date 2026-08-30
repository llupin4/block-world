import { it, expect } from 'vitest';
import { toGeometry } from '../geometry';
import type { VoxelBuffer } from '../world';

const buf: VoxelBuffer = {
  positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]),
  colors: new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  light: new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
};

it('copies every attribute, sets the index, and computes the bounding sphere', () => {
  const g = toGeometry(buf);
  expect(g.getAttribute('position').array).toEqual(buf.positions);
  expect(g.getAttribute('color').array).toEqual(buf.colors);
  expect(g.getAttribute('uv').array).toEqual(buf.uvs);
  expect(g.getAttribute('aLight').array).toEqual(buf.light);
  expect(g.getIndex()!.array).toEqual(buf.indices);
  expect(g.boundingSphere).not.toBeNull();
  // a unit quad's corners: center (0.5, 0.5, 0), radius sqrt(0.5)
  expect(g.boundingSphere!.radius).toBeCloseTo(Math.SQRT1_2);
});