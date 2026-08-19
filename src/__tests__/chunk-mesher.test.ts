import { describe, it, expect } from 'vitest';
import { Block, torchMeta, doorMeta } from '../blocks';
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

const posBounds = (opaque: { positions: Float32Array }) => {
  const p = opaque.positions;
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    xMin = Math.min(xMin, p[i]); xMax = Math.max(xMax, p[i]);
    yMin = Math.min(yMin, p[i + 1]); yMax = Math.max(yMax, p[i + 1]);
    zMin = Math.min(zMin, p[i + 2]); zMax = Math.max(zMax, p[i + 2]);
  }
  return { xMin, xMax, yMin, yMax, zMin, zMax };
};

describe('chunk-mesher special blocks', () => {
  it('a floor torch emits a small post in the OPAQUE pass; the top face carries the flame tile', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Torch;
    c.meta[localIndex(8, 8, 8)] = torchMeta(0); // floor post
    const { opaque, trans } = meshChunk(w, 0, 0, 0);
    expect(trans).toBeNull(); // torches/doors are opaque-pass geometry, never trans
    expect(opaque).not.toBeNull();
    expect(opaque!.positions.length / 3).toBe(6 * 4); // all 6 faces of the post, open air
    const b = posBounds(opaque!); // post: x/z [8.41, 8.59], y [8, 8.875]
    expect(b.xMin).toBeCloseTo(8.41); expect(b.xMax).toBeCloseTo(8.59);
    expect(b.yMin).toBeCloseTo(8); expect(b.yMax).toBeCloseTo(8.875);
    // the +Y face is the 3rd face emitted (verts 8..11): its uvs sit in the flame tile (12) column
    const uvs = opaque!.uvs;
    for (let i = 16; i < 24; i += 2) {
      expect(uvs[i] >= 12 / 16 - 1e-6 && uvs[i] <= 13 / 16 + 1e-6, `uv ${uvs[i]}`).toBe(true);
    }
  });

  it('a wall torch hides its back face against the wall and puts the flame on the outward tip', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Stone; // the support wall
    c.blocks[localIndex(9, 8, 8)] = Block.Torch;
    c.meta[localIndex(9, 8, 8)] = torchMeta(1); // aimed at the stone's +X face: wall on the stub's -X side
    const { opaque } = meshChunk(w, 0, 0, 0);
    // stone keeps all 6 faces (a torch never culls); the stub loses its -X back face -> 5
    expect(opaque!.positions.length / 3).toBe(6 * 4 + 5 * 4);
    const b = posBounds(opaque!); // stub: x reaches 9.375 (stone bounds 8..9 merged in)
    expect(b.xMax).toBeCloseTo(9.375);
    // the tip: FACES[0] (+X) is the stub's first face emitted. The stone's 6 faces precede it
    // in the buffer (emission order ly -> lz -> lx), so the stub's +X face sits at global
    // verts 24..27 -> its u coords are uv indices 48, 50, 52, 54 -> flame tile 12
    const uvs = opaque!.uvs;
    for (let i = 48; i < 56; i += 2) {
      expect(uvs[i] >= 12 / 16 - 1e-6 && uvs[i] <= 13 / 16 + 1e-6, `uv ${uvs[i]}`).toBe(true);
    }
  });

  it('a closed X-thin door emits its full-height panel (x [0.4, 0.6] of the cell)', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 0); // closed, axis X
    const { opaque, trans } = meshChunk(w, 0, 0, 0);
    expect(trans).toBeNull();
    expect(opaque!.positions.length / 3).toBe(6 * 4);
    const b = posBounds(opaque!);
    expect(b.xMin).toBeCloseTo(8.4); expect(b.xMax).toBeCloseTo(8.6);
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(9); // panel spans the full cell width
    expect(b.yMin).toBeCloseTo(8); expect(b.yMax).toBeCloseTo(9);
  });

  it('an open X-thin door emits a corner slab (x [0, 0.55], z [0, 0.2]); the Z axis mirrors it', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(8, 8, 8)] = doorMeta(true, 0);
    let b = posBounds(meshChunk(w, 0, 0, 0).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(8.55);
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(8.2);

    c.meta[localIndex(8, 8, 8)] = doorMeta(true, 1); // open, axis Z
    b = posBounds(meshChunk(w, 0, 0, 0).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(8.2);
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(8.55);

    // a closed Z-thin panel is thin in z instead
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 1);
    b = posBounds(meshChunk(w, 0, 0, 0).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(9);
    expect(b.zMin).toBeCloseTo(8.4); expect(b.zMax).toBeCloseTo(8.6);
  });

  it('a door never culls neighbor faces, while a stone neighbor still does', () => {
    const withNeighbor = (neighbor: number, meta = 0) => {
      const w = new World();
      const c = w.ensureChunk(0, 0, 0);
      c.blocks[localIndex(8, 8, 8)] = Block.Stone;
      c.blocks[localIndex(9, 8, 8)] = neighbor;
      if (neighbor === Block.DoorBottom) c.meta[localIndex(9, 8, 8)] = meta;
      return w;
    };
    // Stone next to a closed door: stone keeps ALL 6 faces (a panel is not opaque) and
    // the door loses its stone-facing face -> 6 + 5 faces
    expect(meshChunk(withNeighbor(Block.DoorBottom, doorMeta(false, 0)), 0, 0, 0).opaque!.positions.length / 3)
      .toBe((6 + 5) * 4);
    // Contrast: a stone neighbor IS opaque -> the shared face culls on both blocks -> 5 + 5 faces
    expect(meshChunk(withNeighbor(Block.Stone), 0, 0, 0).opaque!.positions.length / 3).toBe((5 + 5) * 4);
  });

  it('an all-special chunk renders both kinds in one opaque buffer (facing special cells hide each other)', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Torch;
    c.meta[localIndex(8, 8, 8)] = torchMeta(0);
    c.blocks[localIndex(9, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(9, 8, 8)] = doorMeta(false, 0);
    c.blocks[localIndex(9, 9, 8)] = Block.DoorTop;
    c.meta[localIndex(9, 9, 8)] = doorMeta(false, 0);
    const { opaque } = meshChunk(w, 0, 0, 0);
    // face accounting (a face is hidden iff its neighbor CELL is opaque or special):
    //   torch (8,8,8):    +X faces the door (special)       -> hidden: 5 faces
    //   door bottom (9,8,8): -X faces the torch, +Y faces the top half, both special -> 4 faces
    //   door top (9,9,8):    -Y faces the bottom half (special) -> 5 faces
    expect(opaque!.positions.length / 3).toBe((5 + 4 + 5) * 4);
  });
});