import { describe, it, expect } from 'vitest';
import { Block, torchMeta, doorMeta } from '../blocks';
import { World, localIndex } from '../world';
import { meshChunk } from '../chunk-mesher';
import { type LightSampler } from '../chunk-mesher';
const NO_LIGHT: LightSampler = () => [0, 0]; // zero-light stub: pre-light behavior for all existing tests

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
  const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
  return { colors: opaque!.colors, uvs: opaque!.uvs };
}

describe('chunk-mesher', () => {
  it('winding: every emitted face normal points outward (CCW under FrontSide)', () => {
    const { opaque } = meshChunk(loneChunk(Block.Stone), 0, 0, 0, NO_LIGHT);
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
    const { opaque, trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
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
    const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque!.positions.length / 3).toBe((1536 - 256) * 4); // +X shell removed
    expect(opaque!.indices.length).toBe((1536 - 256) * 6);
  });

  it('a chunk surrounded by solid neighbors emits no opaque buffer', () => {
    const w = new World();
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) w.ensureChunk(dx, dy, dz).blocks.fill(Block.Stone);
    expect(meshChunk(w, 0, 0, 0, NO_LIGHT).opaque).toBeNull();
  });

  it('water: transparent pass only; faces against air, suppressed between water blocks; surface at wlevel/8', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Water;
    c.wlevel[localIndex(8, 8, 8)] = 7; // the sim invariant: a Water cell always holds wlevel >= 1
    c.blocks[localIndex(9, 8, 8)] = Block.Water;
    c.wlevel[localIndex(9, 8, 8)] = 7;
    const { opaque, trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque).toBeNull();
    expect(trans).not.toBeNull();
    expect(trans!.positions.length / 3).toBe(10 * 4); // 5 + 5 faces, shared face not emitted
    expect(trans!.indices.length).toBe(10 * 6);
    expect(posBounds(trans!).yMax).toBeCloseTo(8.875); // level 7 -> 7/8 surface (was 9.0 full height)
  });

  it('an all-air chunk produces no buffers', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0);
    const { opaque, trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
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
    const { opaque, trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
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
    const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
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
      const opaque = meshChunk(mount(c.face), 0, 0, 0, NO_LIGHT).opaque!;
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
    const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque!.positions.length / 3).toBe(6 * 4);
    expect(meshChunk(w, 0, 0, 0, NO_LIGHT).trans).toBeNull();
  });

  it('a closed X-thin door hugs its side edge: side 0 = x [0, 0.2], side 1 = x [0.8, 1] of the cell', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 0, 0); // closed, axis X, side 0 (min-X edge)
    const { opaque, trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans).toBeNull();
    expect(opaque!.positions.length / 3).toBe(6 * 4); // all 6 faces in open air
    let b = posBounds(opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(8.2); // panel flush against the min-X cell edge
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(9); // panel spans the full cell width
    expect(b.yMin).toBeCloseTo(8); expect(b.yMax).toBeCloseTo(9);
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 0, 1); // side 1 (max-X edge)
    b = posBounds(meshChunk(w, 0, 0, 0, NO_LIGHT).opaque!);
    expect(b.xMin).toBeCloseTo(8.8); expect(b.xMax).toBeCloseTo(9);
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(9);
    expect(b.yMin).toBeCloseTo(8); expect(b.yMax).toBeCloseTo(9);
  });

  it('a closed Z-thin door hugs its side edge: side 0 = z [0, 0.2], side 1 = z [0.8, 1]', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 1, 0);
    let b = posBounds(meshChunk(w, 0, 0, 0, NO_LIGHT).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(9); // panel spans the full cell width
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(8.2);
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 1, 1);
    b = posBounds(meshChunk(w, 0, 0, 0, NO_LIGHT).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(9);
    expect(b.zMin).toBeCloseTo(8.8); expect(b.zMax).toBeCloseTo(9);
  });

  it('an open door is the full-size panel swung 90 degrees: no clamping, extent set identical to closed side 0', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(8, 8, 8)] = doorMeta(true, 0); // open, axis X
    let b = posBounds(meshChunk(w, 0, 0, 0, NO_LIGHT).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(9);    // x full
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(8.2); // the 0.2 thickness sits at the min corner
    c.meta[localIndex(8, 8, 8)] = doorMeta(true, 1); // open, axis Z
    b = posBounds(meshChunk(w, 0, 0, 0, NO_LIGHT).opaque!);
    expect(b.xMin).toBeCloseTo(8); expect(b.xMax).toBeCloseTo(8.2);
    expect(b.zMin).toBeCloseTo(8); expect(b.zMax).toBeCloseTo(9);    // z full
    // The open panel is the closed side-0 panel rotated 90 degrees about the hinge
    // corner: the same two extents ({0.2, 1.0}) swap axes, so the swing is never
    // clamped (an old squished slab would have read 0.55 on the full axis).
    for (const m of [doorMeta(true, 0), doorMeta(true, 1)]) {
      c.meta[localIndex(8, 8, 8)] = m;
      const ob = posBounds(meshChunk(w, 0, 0, 0, NO_LIGHT).opaque!);
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
    expect(meshChunk(withNeighbor(Block.DoorBottom, doorMeta(false, 0)), 0, 0, 0, NO_LIGHT).opaque!.positions.length / 3)
      .toBe((6 + 5) * 4);
    // Contrast: a stone neighbor IS opaque -> the shared face culls on both blocks -> 5 + 5 faces
    expect(meshChunk(withNeighbor(Block.Stone), 0, 0, 0, NO_LIGHT).opaque!.positions.length / 3).toBe((5 + 5) * 4);
  });

  it('an opaque neighbour on the FAR side does not over-cull an interior panel face (see-through slit)', () => {
    // stone on the door's +X side, but the panel's +X end is INTERIOR at x=9.2 (panel hugs the
    // min-X edge, x [9.0, 9.2]). The old cell-level rule deleted that interior face against
    // the stone -> the panel read as a hollow box / slit. The new rule keeps it.
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(10, 8, 8)] = Block.Stone;       // the door's +X neighbour (far side)
    c.blocks[localIndex(9, 8, 8)] = Block.DoorBottom;   // closed X side 0: panel x [9.0, 9.2]
    c.meta[localIndex(9, 8, 8)] = doorMeta(false, 0);
    const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    // stone keeps 6 (a panel is not opaque); the door keeps ALL 6 faces (its far +X face is
    // interior at 9.2 and is no longer culled against the stone) -> (6 + 6) * 4
    expect(opaque!.positions.length / 3).toBe((6 + 6) * 4);
  });

  it('a door panel keeps its face against a special neighbour whose geometry cannot reach the shared plane', () => {
    // floor torch (post) beside a door: the post reaches only the floor (-Y) plane, never the
    // vertical plane the panel's -X face sits on, so it cannot cover the panel's face (old rule
    // deleted both the panel's -X and the post's +X -> two see-through slits). Now both survive.
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Torch;
    c.meta[localIndex(8, 8, 8)] = torchMeta(0);         // floor post
    c.blocks[localIndex(9, 8, 8)] = Block.DoorBottom;   // panel x [9.0, 9.2]
    c.meta[localIndex(9, 8, 8)] = doorMeta(false, 0);
    const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque!.positions.length / 3).toBe((6 + 6) * 4);
  });

  it('mirror-hinged doors meeting on a plane keep exactly one of the two coincident faces', () => {
    // A (8,8,8) side 1: panel x [8.8, 9.0] (+X end on plane 9.0). B (9,8,8) side 0: panel
    // x [9.0, 9.2] (-X end on plane 9.0). Both put a FULL face on plane 9.0 with equal
    // coverage -> exactly one survives: the smaller lexicographic cell (A) keeps its +X and
    // B culls its -X. NOTE: the task spec stated (5+5), but the "smaller keeps / bigger
    // culls" rule the spec itself specifies yields A=6, B=5 = 11 faces -> assert 44 verts.
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 0, 1); // A side 1: panel x [8.8, 9.0]
    c.blocks[localIndex(9, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(9, 8, 8)] = doorMeta(false, 0, 0); // B side 0: panel x [9.0, 9.2]
    const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque!.positions.length / 3).toBe((6 + 5) * 4);
  });

  it('same-hinge doors meeting on a plane never z-fight: the interior end cannot cover the far face', () => {
    // A side 0 (8,8,8): panel x [8.0, 8.2] -> its +X end is interior (8.2), not on the shared
    // plane. B side 0 (9,8,8): panel x [9.0, 9.2] -> its -X face lands on the plane 9.0. A's
    // interior +X end cannot cover B's -X face, so NOTHING is culled -> both keep 6, no z-fight.
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(8, 8, 8)] = doorMeta(false, 0, 0); // A side 0: panel x [8.0, 8.2]
    c.blocks[localIndex(9, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(9, 8, 8)] = doorMeta(false, 0, 0); // B side 0: panel x [9.0, 9.2]
    const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque!.positions.length / 3).toBe((6 + 6) * 4);
  });

  it('an all-special chunk renders both kinds in one opaque buffer (a face hides only if the neighbour covers it)', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 8)] = Block.Torch;
    c.meta[localIndex(8, 8, 8)] = torchMeta(0);
    c.blocks[localIndex(9, 8, 8)] = Block.DoorBottom;
    c.meta[localIndex(9, 8, 8)] = doorMeta(false, 0);
    c.blocks[localIndex(9, 9, 8)] = Block.DoorTop;
    c.meta[localIndex(9, 9, 8)] = doorMeta(false, 0);
    const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    // face accounting — a face is hidden iff ITS box end lies on the cell-boundary plane AND
    // the neighbour covers that face's area (opaque neighbour, or a special neighbour reaching
    // the same plane with equal-or-larger coverage; equal coverage -> the smaller cell keeps):
    //   torch (8,8,8):     floor post reaches only the -Y (floor) plane, never a vertical
    //                      plane -> no vertical face sits against a neighbour -> all 6 faces
    //   door bottom (9,8,8): -X at 9.0 faces the post (post can't reach that plane) -> kept;
    //                      +Y at 9.0 faces the top half (equal full x[0,0.2] strips) -> bottom
    //                      is the smaller cell (y=8) -> KEEPS it; far +X interior -> 6 faces
    //   door top (9,9,8):    -Y at 9.0 faces the bottom half (equal full-strip coverage) ->
    //                      top is the bigger cell (y=9) -> culls its -Y; the other 5 remain
    //   => (6 + 6 + 5) (old rule gave 5+4+5: it culled the post's +X and the panel's faces
    //       merely because the neighbouring CELL was special, not because geometry covered)
    expect(opaque!.positions.length / 3).toBe((6 + 6 + 5) * 4);
  });
});

describe('chunk-mesher light baking', () => {
  it('a zero-light stub: every vertex bakes aLight 0 (length = 2 x vertex count, all zeros); the color path is untouched by code inspection', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0).blocks.fill(Block.Stone);
    const { opaque } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque).not.toBeNull();
    const l = opaque!.light;
    expect(l.length).toBe(opaque!.positions.length / 3 * 2); // one (bl, sk) pair per vertex
    for (let i = 0; i < l.length; i++) expect(l[i]).toBe(0);
  });

  it('a torch-facing face corner bakes aLight.bl = 13/15 (the air cell across the face holds 13); a sky-exposed corner bakes aLight.sk = 1 (15/15)', () => {
    const w = makeWorldForMesher(Block.Torch); // one torch at (8,8,8) in chunk (0,0,0), no floor
    const lightAt: LightSampler = (x, y, z) => [x === 8 && y === 8 && z === 8 ? 0 : 13, 15]; // the torch cell itself stores 14 bl but the FACE-ACROSS cells of the stem read the air's 13 (see the 3-candidate rule below); sky everywhere 15
    const { opaque } = meshChunk(w, 0, 0, 0, lightAt);
    const l = opaque!.light;
    expect(l).not.toBeNull();
    // some vertex must have baked the torch-adjacent air value, scaled: 13/15
    expect(Math.max(...l.filter((_, i) => i % 2 === 0))).toBeCloseTo(13 / 15, 6);
    // and every non-torch corner reads skylight 15/15:
    expect(Math.max(...l.filter((_, i) => i % 2 === 1))).toBeCloseTo(1, 6);
  });

  it('the 3-candidate max rule: a solid diagonal keeps the corner lit when the face-across cell is dark', () => {
    const w = makeWorldForMesher(Block.Stone);
    // face-across cell dark (0,0), but a diagonal candidate holds (10, 10):
    const lightAt: LightSampler = (x, y, z) =>
      x === 9 && y === 9 && z === 9 ? [10, 10] : [0, 0]; // (9,9,9) is a face-diagonal candidate of the lone stone's +X face at (8,8,8)
    const { opaque } = meshChunk(w, 0, 0, 0, lightAt);
    const l = opaque!.light;
    expect(Math.max(...l.filter((_, i) => i % 2 === 0))).toBeCloseTo(10 / 15, 6);
  });

  it('the face-across cell (the dominant per-corner light) is pinned: light only at the across cell bakes into the corner', () => {
    const w = makeWorldForMesher(Block.Stone);
    // light ONLY at the +X face-across cell (9,8,8) of the lone stone (8,8,8); every candidate cell except the across one is dark:
    const lightAt: LightSampler = (x, y, z) => (x === 9 && y === 8 && z === 8 ? [12, 0] : [0, 0]);
    const { opaque } = meshChunk(w, 0, 0, 0, lightAt);
    const l = opaque!.light;
    expect(Math.max(...l.filter((_, i) => i % 2 === 0))).toBeCloseTo(12 / 15, 6);
    expect(Math.max(...l.filter((_, i) => i % 2 === 1))).toBe(0);
  });
});

// helper: a lone special/cube block at the chunk center (like the file's loneChunk, but importable by name here)
function makeWorldForMesher(b: Block): World {
  const w = new World();
  const c = w.ensureChunk(0, 0, 0);
  c.blocks[localIndex(8, 8, 8)] = b;
  return w;
}

describe('chunk-mesher water level mesh', () => {
  // Set a cell's full water state (block + level + flags) in one call.
  const water = (c: { blocks: Uint8Array; wlevel: Uint8Array; wsource: Uint8Array; wstream: Uint8Array }, lx: number, ly: number, lz: number, level: number, source = 0, stream = 0) => {
    const i = localIndex(lx, ly, lz);
    c.blocks[i] = Block.Water;
    c.wlevel[i] = level;
    c.wsource[i] = source;
    c.wstream[i] = stream;
  };

  // True when one whole emitted face quad sits on the given world-plane coordinate
  // (axis 0 = x, 1 = y, 2 = z). A face quad = the 4 unique vertices of one
  // 6-index triangle pair; a mere corner on the plane does not count.
  const faceOnPlane = (buf: { positions: Float32Array; indices: Uint32Array }, axis: number, v: number): boolean => {
    const p = buf.positions;
    for (let i = 0; i < buf.indices.length; i += 6) {
      const quad = [buf.indices[i], buf.indices[i + 1], buf.indices[i + 2], buf.indices[i + 3]];
      if (quad.every((vi) => p[vi * 3 + axis] === v)) return true;
    }
    return false;
  };

  it('a lone level-7 flow cell over solid: top at 0.875, 4 side faces, no bottom', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 7)] = Block.Stone; // floor below
    water(c, 8, 8, 8, 7);
    const { opaque, trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(opaque!.positions.length / 3).toBe(6 * 4); // stone keeps all 6 faces (water never culls it)
    const b = posBounds(trans!);
    expect(b.yMin).toBeCloseTo(8); // side faces start at the cell floor
    expect(b.yMax).toBeCloseTo(8.875); // top at 7/8
    expect(trans!.positions.length / 3).toBe(5 * 4); // top + 4 sides; the stone culls the bottom
  });

  it('level 7 beside level 6: a skirt sits on the shared plane; only the taller emits it', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 7)] = Block.Stone;
    c.blocks[localIndex(9, 8, 7)] = Block.Stone;
    water(c, 8, 8, 8, 7);
    water(c, 9, 8, 8, 6);
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans!.positions.length / 3).toBe(9 * 4); // taller 5 (top, 3 open sides, skirt) + shorter 4 (top, 3 open sides)
    expect(faceOnPlane(trans!, 0, 9)).toBe(true); // a face on the shared x=9 plane (the skirt); without the rule both cells cull it
    expect(posBounds(trans!).yMax).toBeCloseTo(8.875);
  });

  it('equal levels keep the no-face-between-water cull', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    water(c, 8, 8, 8, 7);
    water(c, 9, 8, 8, 7);
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans!.positions.length / 3).toBe(10 * 4); // 5 + 5, exactly the full-block behaviour
    expect(faceOnPlane(trans!, 0, 9)).toBe(false); // no face on the shared plane
  });

  it('a source beside level-7 flow: the source skirts down to the flow; the flow culls toward the source', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 8, 7)] = Block.Stone;
    c.blocks[localIndex(9, 8, 7)] = Block.Stone;
    water(c, 8, 8, 8, 7, 1); // source: full height
    water(c, 9, 8, 8, 7); // flow: 0.875
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans!.positions.length / 3).toBe(9 * 4); // source 5 (top, 3 open sides, skirt) + flow 4
    expect(posBounds(trans!).yMax).toBeCloseTo(9); // the source stays full height
  });

  it('a two-cell stream column: solid full height, no face between, no top on the lower', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 6, 8)] = Block.Stone;
    water(c, 8, 7, 8, 7, 0, 1); // stream (riding column)
    water(c, 8, 8, 8, 7, 0, 1); // stream
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans!.positions.length / 3).toBe(9 * 4); // lower 4 (4 sides only) + upper 5 (top + 4 sides)
    const b = posBounds(trans!);
    expect(b.yMin).toBeCloseTo(7);
    expect(b.yMax).toBeCloseTo(9); // full-height column, unbroken
  });

  it('a flow cell under a stream column keeps its lip (top emitted) and the column keeps its underside', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    c.blocks[localIndex(8, 6, 8)] = Block.Stone;
    water(c, 8, 7, 8, 7); // resting flow: 0.875
    water(c, 8, 8, 8, 7, 0, 1); // stream riding above: full
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    expect(trans!.positions.length / 3).toBe(11 * 4); // flow 5 (lip + 4 sides) + stream 6 (top, underside, 4 sides)
    expect(faceOnPlane(trans!, 1, 7.875)).toBe(true); // the lip at y = 7 + 7/8
    expect(faceOnPlane(trans!, 1, 8)).toBe(true); // the column's underside at y = 8
  });

  it('water faces carry FACE_SHADE without vertex AO, even with opaque corner occluders', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    water(c, 8, 8, 8, 7);
    c.blocks[localIndex(9, 9, 8)] = Block.Stone; // F1: would darken a +Y face's x+ corner to 0.8
    c.blocks[localIndex(8, 9, 9)] = Block.Stone; // F2: would darken its x+/z+ corner to 0.48
    const { trans } = meshChunk(w, 0, 0, 0, NO_LIGHT);
    // Face order of the lone water block: +X(0-3) -X(4-7) +Y(8-11) ...; the +Y corners'
    // red channels sit at 32/36/40/44 and all read the full top shade (no AO multiplier).
    for (const i of [32, 36, 40, 44]) expect(trans!.colors[i]).toBeCloseTo(1.0);
  });

  it('per-vertex light still bakes on water faces (the AO drop left the light path untouched)', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    water(c, 8, 8, 8, 7);
    const lightAt: LightSampler = (x, y, z) => (x === 9 && y === 8 && z === 8 ? [12, 0] : [0, 0]);
    const { trans } = meshChunk(w, 0, 0, 0, lightAt);
    const l = trans!.light;
    expect(Math.max(...l.filter((_, i) => i % 2 === 0))).toBeCloseTo(12 / 15, 6); // the +X face-across cell
    expect(Math.max(...l.filter((_, i) => i % 2 === 1))).toBe(0);
  });
});