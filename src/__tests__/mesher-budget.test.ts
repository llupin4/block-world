import { it, expect } from 'vitest';
import { World } from '../world';
import { Block } from '../blocks';
import { meshChunk, meshChunkRange, probeMeshChunk } from '../chunk-mesher';

const noLight = (): [number, number] => [0, 0];

/** A lone all-water chunk in an empty world: only the BOUNDARY cells emit — in-chunk water
 * neighbors at equal surface height cull the interior faces (emitWater's skirt/side rules),
 * and missing neighbors read as Air. 16×16 faces on each of the 6 outer shells = 1536
 * faces / 6144 verts, far over any budget. */
function allWaterWorld(): World {
  const w = new World();
  const c = w.ensureChunk(0, 0, 0);
  for (let i = 0; i < 4096; i++) {
    c.blocks[i] = Block.Water;
    c.wlevel[i] = 7;
    c.wsource[i] = 1;
  }
  return w;
}

it('row-range slices partition the mesh exactly (positions concat, indices rebase)', () => {
  const w = allWaterWorld();
  const whole = meshChunk(w, 0, 0, 0, noLight);
  const a = meshChunkRange(w, 0, 0, 0, noLight, 0, 8);
  const b = meshChunkRange(w, 0, 0, 0, noLight, 8, 16);
  expect(whole.trans).not.toBeNull();
  expect(whole.opaque).toBeNull(); // water goes to the trans pass only
  expect(a.opaque).toBeNull();
  expect(b.opaque).toBeNull();
  const pa = a.trans!.positions;
  const pb = b.trans!.positions;
  // 1) vertex order: the whole's positions are the slice positions concatenated in band order
  const merged = new Float32Array(whole.trans!.positions.length);
  merged.set(pa, 0);
  merged.set(pb, pa.length);
  expect(merged).toEqual(whole.trans!.positions);
  // 2) indices: the whole = concat(A indices, B indices rebased by A's total vertex count)
  const offA = (a.opaque ? a.opaque.positions.length / 3 : 0) + pa.length / 3;
  const vi = new Uint32Array(whole.trans!.indices.length);
  vi.set(a.trans!.indices, 0);
  const bi = b.trans!.indices;
  for (let i = 0; i < bi.length; i++) vi[a.trans!.indices.length + i] = bi[i] + offA;
  expect(vi).toEqual(whole.trans!.indices);
  // 3) row bounds: slice [0,8) vertices sit in y ∈ [0, 9); slice [8,16) in y ∈ [8, 17)
  //    (row 7's top face is culled against the in-chunk water above, so [0,8) reaches y = 8
  //    only via side faces of its top row; row 15's top face reaches y = 16)
  for (let i = 1; i < pa.length; i += 3) {
    expect(pa[i]).toBeGreaterThanOrEqual(0);
    expect(pa[i]).toBeLessThan(9);
  }
  for (let i = 1; i < pb.length; i += 3) {
    expect(pb[i]).toBeGreaterThanOrEqual(8);
    expect(pb[i]).toBeLessThan(17);
  }
});

it('the vertex budget truncates mid-mesh; within the budget the probe IS the full mesh', () => {
  const w = allWaterWorld();
  const full = meshChunk(w, 0, 0, 0, noLight);
  const fullVerts = full.trans!.positions.length / 3;
  expect(fullVerts).toBeGreaterThan(3764);
  const p = probeMeshChunk(w, 0, 0, 0, noLight, 64);
  expect(p.complete).toBe(false);
  const pv = p.mesh.trans!.positions.length / 3;
  expect(pv).toBeLessThanOrEqual(64);
  expect(pv % 4).toBe(0); // whole faces only — a face is never split across the budget
  const ok = probeMeshChunk(w, 0, 0, 0, noLight, fullVerts);
  expect(ok.complete).toBe(true);
  expect(ok.mesh.trans!.positions).toEqual(full.trans!.positions);
  expect(ok.mesh.trans!.indices).toEqual(full.trans!.indices);
});

it('public meshChunk is unchanged (whole rows, no budget)', () => {
  const w = allWaterWorld();
  const a = meshChunk(w, 0, 0, 0, noLight);
  const b = meshChunk(w, 0, 0, 0, noLight);
  expect(a.trans!.positions).toEqual(b.trans!.positions);
  expect(a.trans!.indices).toEqual(b.trans!.indices);
});