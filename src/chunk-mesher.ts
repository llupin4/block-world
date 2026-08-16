import { Block, BLOCKS, isOpaque } from './blocks';
import { World, localIndex, type VoxelBuffer } from './world';

export interface ChunkMesh {
  opaque: VoxelBuffer | null;
  trans: VoxelBuffer | null;
}

// CCW corners viewed from outside (FrontSide-safe; see D2). `axes` = [u-axis, v-axis]
// double-duty: AO side/diagonal sampling axes and UV mapping axes.
type FaceDef = { dir: [number, number, number]; axes: [number, number]; corners: [number, number, number][] };
const FACES: FaceDef[] = [
  { dir: [1, 0, 0],  axes: [2, 1], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] }, // +X: u<-z, v<-y
  { dir: [-1, 0, 0], axes: [2, 1], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] }, // -X
  { dir: [0, 1, 0],  axes: [0, 2], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] }, // +Y: u<-x, v<-z
  { dir: [0, -1, 0], axes: [0, 2], corners: [[1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0]] }, // -Y
  { dir: [0, 0, 1],  axes: [0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] }, // +Z: u<-x, v<-y
  { dir: [0, 0, -1], axes: [0, 1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] }, // -Z
];

const FACE_SHADE = [0.6, 0.6, 1.0, 0.5, 0.8, 0.8]; // order matches FACES
const AO_SHADE = [1.0, 0.8, 0.62, 0.48];

class Buf {
  pos: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  idx: number[] = [];
  verts = 0;

  push(x: number, y: number, z: number, s: number, u: number, v: number) {
    this.pos.push(x, y, z);
    this.col.push(s, s, s, 1.0);
    this.uv.push(u, v);
    this.verts++;
  }

  toBuffer(): VoxelBuffer | null {
    if (this.verts === 0) return null;
    return {
      positions: new Float32Array(this.pos),
      colors: new Float32Array(this.col),
      uvs: new Float32Array(this.uv),
      indices: new Uint32Array(this.idx),
    };
  }
}

/**
 * Pure, stateless: reads chunk data + neighbors via world.getBlock (missing = Air).
 * Emission order ly -> lz -> lx; per block the face table order. A pass with zero
 * faces yields null. `toGeometry` (BufferGeometry) lives in main.ts only, so this
 * module stays node-testable.
 */
export function meshChunk(world: World, cx: number, cy: number, cz: number): ChunkMesh {
  const chunk = world.getChunk(cx, cy, cz);
  if (!chunk) return { opaque: null, trans: null };
  const bx = cx * 16, by = cy * 16, bz = cz * 16;
  const opaque = new Buf();
  const trans = new Buf();

  for (let ly = 0; ly < 16; ly++) {
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const b = chunk.blocks[localIndex(lx, ly, lz)];
        if (b === Block.Air) continue; // air contributes to neither pass
        const sOp = isOpaque(b);
        const wx = bx + lx, wy = by + ly, wz = bz + lz;
        for (let f = 0; f < 6; f++) {
          const face = FACES[f];
          const nx = wx + face.dir[0], ny = wy + face.dir[1], nz = wz + face.dir[2];
          const nB = world.getBlock(nx, ny, nz);
          const wantOpaque = sOp && !isOpaque(nB);
          const wantTrans = !sOp && !isOpaque(nB) && nB !== b; // b is already != Air
          if (!wantOpaque && !wantTrans) continue;
          const buf = wantOpaque ? opaque : trans;
          const [au, av] = face.axes;
          const tile = BLOCKS[b as Block].faces[f];
          const tileCol = tile % 16, tileRow = (tile / 16) | 0;
          for (const c of face.corners) {
            const su = c[au] === 1 ? 1 : -1;
            const sv = c[av] === 1 ? 1 : -1;
            const s1 = isOpaque(world.getBlock(nx + (au === 0 ? su : 0), ny + (au === 1 ? su : 0), nz + (au === 2 ? su : 0))) ? 1 : 0;
            const s2 = isOpaque(world.getBlock(nx + (av === 0 ? sv : 0), ny + (av === 1 ? sv : 0), nz + (av === 2 ? sv : 0))) ? 1 : 0;
            const dg = isOpaque(world.getBlock(
              nx + (au === 0 ? su : 0) + (av === 0 ? sv : 0),
              ny + (au === 1 ? su : 0) + (av === 1 ? sv : 0),
              nz + (au === 2 ? su : 0) + (av === 2 ? sv : 0))) ? 1 : 0;
            const occ = s1 && s2 ? 3 : s1 + s2 + dg;
            buf.push(
              wx + c[0], wy + c[1], wz + c[2],
              FACE_SHADE[f] * AO_SHADE[occ],
              (tileCol + c[au]) / 16,
              (15 - tileRow + c[av]) / 16,
            );
          }
          const base = buf.verts - 4;
          buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
    }
  }

  return { opaque: opaque.toBuffer(), trans: trans.toBuffer() };
}