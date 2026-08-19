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

  it('every wall stub grows out of its support face in the correct orientation (faces 1-4)', () => {
    const mount = (face: number) => {
      // support block on the stub's backing side of cell (8,8,8), torch mounted at (8,8,8)
      const w = new World();
      const c = w.ensureChunk(0, 0, 0);
      const support: [number, number, number] = face === 1 ? [7, 8, 8] : face === 2 ? [9, 8, 8] : face === 3 ? [8, 8, 7] : [8, 8, 9];
      c.blocks[localIndex(support[0], support[1], support[2])] = Block.Stone;
      c.blocks[localIndex(8, 8, 8)] = Block.Torch;
      c.meta[localIndex(8, 8, 8)] = torchMeta(face);
      return w;
    };
    // posBounds is the UNION of the support stone (a full cube, y [8,9], x/z spanning its
    // own cell) and the stub. On the stub's axis the far extreme is the stub tip; on the
    // other axes the stone's cell dominates. Per-face stub extent (emitTorch min/size):
    // face1 x[8,8.375], face2 x[8.625,9], face3 z[8,8.375], face4 z[8.625,9].
    const cases = [
      { face: 1, x: [7, 8.375],   z: [8, 9] },        // support -X(7), stone x[7,8]; stub grows +X
      { face: 2, x: [8.625, 10],  z: [8, 9] },        // support +X(9), stone x[9,10]; stub grows -X
      { face: 3, x: [8, 9],       z: [7, 8.375] },    // support -Z(7), stone z[7,8]; stub grows +Z
      { face: 4, x: [8, 9],       z: [8.625, 10] },   // support +Z(9), stone z[9,10]; stub grows -Z
    ];
    for (const c of cases) {
      const opaque = meshChunk(mount(c.face), 0, 0, 0).opaque!;
      const b = posBounds(opaque);
      // stone keeps all 6 faces (a torch never culls it); the stub loses its support-facing face -> 5
      expect(opaque.positions.length / 3, `face ${c.face}`).toBe((6 + 5) * 4);
      expect(b.xMin, `face ${c.face} xMin`).toBeCloseTo(c.x[0]);
      expect(b.xMax, `face ${c.face} xMax`).toBeCloseTo(c.x[1]);
      expect(b.zMin, `face ${c.face} zMin`).toBeCloseTo(c.z[0]);
      expect(b.zMax, `face ${c.face} zMax`).toBeCloseTo(c.z[1]);
      expect(b.yMin, `face ${c.face} yMin`).toBeCloseTo(8);
      expect(b.yMax, `face ${c.face} yMax`).toBeCloseTo(9);
    }
  });

  it('an orphan door half still renders a full-height panel in its own cell', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorTop;
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 0);
    const { opaque } = meshChunk(w, 0, 0, 0);
    expect(opaque!.positions.length / 3).toBe(6 * 4);
    expect(meshChunk(w, 0, 0, 0).trans).toBeNull();
  });

  it('a closed X-thin door hugs its side edge: side 0 = x [0, 0.2], side 1 = x [0.8, 1] of the cell', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 0, 0); // closed, axis X, side 0 (min-X edge)
    const { opaque, trans } = meshChunk(w, 0, 0, 0);
    expect(trans).toBeNull();
    expect(opaque!.positions.length / 3).toBe(6 * 4); // all 6 faces in open air
    let b = posBounds(opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(8.2); // panel flush against the min-X cell edge
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(9); // panel spans the full cell width
    expect(b.yMin).toBeCloseTo(8); expect(b.yMax).toBeCloseTo(9);
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 0, 1); // side 1 (max-X edge)
    b = posBounds(meshChunk(w, 0, 0, 0).opaque!);
    expect(b.xMin).toBeCloseTo(8.8); expect(b.xMax).toBeCloseTo(9);
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(9);
    expect(b.yMin).toBeCloseTo(8); expect(b.yMax).toBeCloseTo(9);
  });

  it('a closed Z-thin door hugs its side edge: side 0 = z [0, 0.2], side 1 = z [0.8, 1]', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 1, 0);
    let b = posBounds(meshChunk(w, 0, 0, 0).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(9); // panel spans the full cell width
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(8.2);
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 1, 1);
    b = posBounds(meshChunk(w, 0, 0, 0).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(9);
    expect(b.zMin).toBeCloseTo(8.8); expect(b.zMax).toBeCloseTo(9);
  });

  it('an open door is the full-size panel swung 90 degrees: no clamping, extent set identical to closed side 0', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(8, 8, 8)] = doorMeta(true, 0); // open, axis X
    let b = posBounds(meshChunk(w, 0, 0, 0).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(9);    // x full
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(8.2); // the 0.2 thickness sits at the min corner
    c.meta[localIndex(8, 8, 8)] = doorMeta(true, 1); // open, axis Z
    b = posBounds(meshChunk(w, 0, 0, 0).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(8.2);
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(9);    // z full
    // The open panel is the closed side-0 panel rotated 90 degrees about the hinge
    // corner: the same two extents ({0.2, 1.0}) swap axes, so the swing is never
    // clamped (an old squished slab would have read 0.55 on the full axis).
    for (const m of [doorMeta(true, 0), doorMeta(true, 1)]) {
      c.meta[localIndex(8, 8, 8)] = m;
      const ob = posBounds(meshChunk(w, 0, 0, 0).opaque!);
      const spans = [ob.xMax - ob.xMin, ob.zMax - ob.zMin].sort((p, q) => p - q);
      expect(spans[0], `open meta ${m} thin extent`).toBeCloseTo(0.2);
      expect(spans[1], `open meta ${m} full extent`).toBeCloseTo(1);
    }
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