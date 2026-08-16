import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, localIndex } from '../world';
import { meshChunk } from '../chunk-mesher';

function loneChunk(b: Block): World {
  const w = new World();
  const c = w.ensureChunk(0, 0, 0);
  c.blocks[localIndex(8, 8, 8)] = b;
  return w;
}

const FACE_NORMALS: [number, number, number][] = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], // +X,-X,+Y,-Y,+Z,-Z
];

function topFaceOf(w: World) {
  // the lone/first block's +Y face: face index 2 of the first emitted block => verts 8..11
  const { opaque } = meshChunk(w, 0, 0, 0);
  return { colors: opaque!.colors, uvs: opaque!.uvs };
}

describe('chunk-mesher', () => {
  it('winding: every emitted face normal points outward (CCW under FrontSide)', () => {
    const { opaque } = meshChunk(loneChunk(Block.Stone), 0, 0, 0);
    expect(opaque).not.toBeNull();
    const p = opaque!.positions;
    for (let f = 0; f < 6; f++) {
      const o = f * 12; // 4 verts * 3 floats, faces emitted in table order by the lone block
      const ax = p[o + 3] - p[o], ay = p[o + 4] - p[o + 1], az = p[o + 5] - p[o + 2]; // v1 - v0
      const bx = p[o + 6] - p[o], by = p[o + 7] - p[o + 1], bz = p[o + 8] - p[o + 2]; // v2 - v0
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const len = Math.hypot(nx, ny, nz);
      const [ex, ey, ez] = FACE_NORMALS[f];
      expect((nx * ex + ny * ey + nz * ez) / len, `face ${f} normal`).toBeGreaterThan(0.99);
    }
  });

  it('fully solid 16^3 chunk: 6 boundary shells, 1536 faces, no transparent buffer', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0).blocks.fill(Block.Stone);
    const { opaque, trans } = meshChunk(w, 0, 0, 0);
    expect(trans).toBeNull();
    expect(opaque).not.toBeNull();
    expect(opaque!.positions.length / 3).toBe(1536 * 4);
    expect(opaque!.colors.length / 4).toBe(1536 * 4);
    expect(opaque!.uvs.length / 2).toBe(1536 * 4);
    expect(opaque!.indices.length).toBe(1536 * 6);
  });

  it('faces shared between identical solid chunks are culled', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0).blocks.fill(Block.Stone);
    w.ensureChunk(1, 0, 0).blocks.fill(Block.Stone);
    const { opaque } = meshChunk(w, 0, 0, 0);
    expect(opaque!.positions.length / 3).toBe((1536 - 256) * 4); // +X shell removed
    expect(opaque!.indices.length).toBe((1536 - 256) * 6);
  });

  it('a chunk surrounded by solid neighbors emits no opaque buffer', () => {
    const w = new World();
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) w.ensureChunk(dx, dy, dz).blocks.fill(Block.Stone);
    expect(meshChunk(w, 0, 0, 0).opaque).toBeNull();
  });

  it('water: transparent pass only; faces against air, suppressed between water blocks', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Water;
    c.blocks[localIndex(9, 8, 8)] = Block.Water;
    const { opaque, trans } = meshChunk(w, 0, 0, 0);
    expect(opaque).toBeNull();
    expect(trans).not.toBeNull();
    expect(trans!.positions.length / 3).toBe(10 * 4); // 5 + 5 faces, shared face not emitted
    expect(trans!.indices.length).toBe(10 * 6);
  });

  it('an all-air chunk produces no buffers', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0);
    const { opaque, trans } = meshChunk(w, 0, 0, 0);
    expect(opaque).toBeNull();
    expect(trans).toBeNull();
  });

  it('AO: with no occluders the +Y face of a stone block is at full brightness', () => {
    const { colors } = topFaceOf(loneChunk(Block.Stone));
    for (const i of [32, 36, 40, 44]) expect(colors[i]).toBeCloseTo(1.0); // red channel, +Y shade is 1.0
  });

  it('AO: side+diagonal occluders around the face-neighbor darken the +Y corners', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Stone; // A at (8,8,8)
    c.blocks[localIndex(9, 9, 8)] = Block.Stone; // F1: occludes A's +Y through B=(8,9,8)'s x side
    c.blocks[localIndex(8, 9, 9)] = Block.Stone; // F2: occludes A's +Y through B's z side
    const r = topFaceOf(w).colors;
    expect(r[32]).toBeCloseTo(0.8);  // x- z+ corner: one side occluded
    expect(r[36]).toBeCloseTo(0.48); // x+ z+ corner: s1 && s2 -> state 3
    expect(r[40]).toBeCloseTo(0.8);  // x+ z- corner: one side occluded
    expect(r[44]).toBeCloseTo(1.0);  // x- z- corner: clear
  });

  it('UVs: +Y face corners land exactly inside their atlas tile cell', () => {
    const range = (b: Block) => {
      const { uvs } = topFaceOf(loneChunk(b));
      const us: number[] = [], vs: number[] = [];
      for (let i = 16; i < 24; i += 2) { us.push(uvs[i]); vs.push(uvs[i + 1]); } // verts 8..11
      return { uMin: Math.min(...us), uMax: Math.max(...us), vMin: Math.min(...vs), vMax: Math.max(...vs) };
    };
    const s = range(Block.Stone); // stone tile 3, atlas row 0
    expect(s.uMin).toBeCloseTo(3 / 16); expect(s.uMax).toBeCloseTo(4 / 16);
    expect(s.vMin).toBeCloseTo(15 / 16); expect(s.vMax).toBeCloseTo(1);
    const g = range(Block.Grass); // grass top face is tile 0
    expect(g.uMin).toBeCloseTo(0); expect(g.uMax).toBeCloseTo(1 / 16);
    expect(g.vMin).toBeCloseTo(15 / 16); expect(g.vMax).toBeCloseTo(1);
  });
});