import { Block, BLOCKS, isOpaque, torchFace, doorOpen, doorAxis } from './blocks';
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

/** Tiles used by the special emitters (atlas layout: see the TILES painters in main.ts). */
const TILE_TORCH_STEM = 11;
const TILE_TORCH_FLAME = 12;
const TILE_DOOR = 13;

// torch meta face -> FACES index of the stub's outward tip: 1:+X, 2:-X, 3:+Z, 4:-Z
const TIP_FACE = [0, 0, 1, 4, 5];

/**
 * Partial-geometry box for special blocks (torch post/stub, door panel), written into
 * the opaque buffer. `min`/`size` are world-space (a box lives inside ONE cell, size
 * <= 1 per axis). `tiles` is per FACES order [+X, -X, +Y, -Y, +Z, -Z]; the tile is
 * stretched across the whole face — torch/door tiles are painted whole-material, so
 * the stretch still reads correctly on a 0.18-wide post. A face is hidden when the
 * neighbouring CELL in its direction is opaque OR special: a stub's back face vanishes
 * against its wall, and the two faces between stacked door halves (or a torch beside a
 * door) hide each other — the geometry at those boundaries never coincides, so no
 * visible face is lost. Shading = FACE_SHADE[face]; no vertex AO on partial geometry.
 */
function pushBox(
  buf: Buf,
  min: [number, number, number],
  size: [number, number, number],
  tiles: [number, number, number, number, number, number],
  hidden: (faceIdx: number) => boolean,
): void {
  for (let f = 0; f < 6; f++) {
    if (hidden(f)) continue;
    const face = FACES[f];
    const [au, av] = face.axes;
    const tile = tiles[f];
    const tileCol = tile % 16, tileRow = (tile / 16) | 0;
    for (const c of face.corners) {
      buf.push(
        min[0] + c[0] * size[0],
        min[1] + c[1] * size[1],
        min[2] + c[2] * size[2],
        FACE_SHADE[f],
        (tileCol + c[au]) / 16,
        (15 - tileRow + c[av]) / 16,
      );
    }
    const base = buf.verts - 4;
    buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}

/** Torch: a floor post (meta 0) or a wall stub pointing away from its support (meta face 1..4). */
function emitTorch(
  buf: Buf,
  gb: (x: number, y: number, z: number) => number,
  wx: number, wy: number, wz: number,
  meta: number,
): void {
  const hidden = (f: number): boolean => {
    const d = FACES[f].dir;
    const n = gb(wx + d[0], wy + d[1], wz + d[2]);
    return isOpaque(n) || BLOCKS[n].kind !== 'cube';
  };
  const face = torchFace(meta);
  if (face === 0) {
    pushBox(
      buf,
      [wx + 0.41, wy, wz + 0.41],
      [0.18, 0.875, 0.18],
      [TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_FLAME, TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_STEM],
      hidden,
    );
    return;
  }
  // Wall stub: grows OUT of the support face (the support sits on the face's other side).
  const tiles: [number, number, number, number, number, number] =
    [TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_STEM, TILE_TORCH_STEM];
  tiles[TIP_FACE[face]] = TILE_TORCH_FLAME;
  if (face === 1) pushBox(buf, [wx, wy + 0.41, wz + 0.41], [0.375, 0.18, 0.18], tiles, hidden);
  else if (face === 2) pushBox(buf, [wx + 1 - 0.375, wy + 0.41, wz + 0.41], [0.375, 0.18, 0.18], tiles, hidden);
  else if (face === 3) pushBox(buf, [wx + 0.41, wy + 0.41, wz], [0.18, 0.18, 0.375], tiles, hidden);
  else pushBox(buf, [wx + 0.41, wy + 0.41, wz + 1 - 0.375], [0.18, 0.18, 0.375], tiles, hidden);
}

/**
 * Door: BOTH halves emit the identical panel inside their own cell (stacked cells read
 * as one panel; the shared seam hides against the special neighbor cell). Closed = a
 * full-height thin panel, axis X or Z; open = a slab swung to the cell's x=0,z=0
 * corner and clamped inside the cell (a true 90 degrees swing of a full-width panel
 * would overhang by half a cell).
 */
function emitDoor(
  buf: Buf,
  gb: (x: number, y: number, z: number) => number,
  wx: number, wy: number, wz: number,
  meta: number,
): void {
  const hidden = (f: number): boolean => {
    const d = FACES[f].dir;
    const n = gb(wx + d[0], wy + d[1], wz + d[2]);
    return isOpaque(n) || BLOCKS[n].kind !== 'cube';
  };
  const xThin = doorAxis(meta) === 0;
  const tiles: [number, number, number, number, number, number] =
    [TILE_DOOR, TILE_DOOR, TILE_DOOR, TILE_DOOR, TILE_DOOR, TILE_DOOR];
  if (doorOpen(meta)) {
    pushBox(buf, [wx, wy, wz], xThin ? [0.55, 1, 0.2] : [0.2, 1, 0.55], tiles, hidden);
  } else {
    pushBox(buf, xThin ? [wx + 0.4, wy, wz] : [wx, wy, wz + 0.4], xThin ? [0.2, 1, 1] : [1, 1, 0.2], tiles, hidden);
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

  // Neighbour block read: in-chunk neighbours read this chunk's array directly (no string
  // key / Map lookup); only the ~30% of samples on a chunk boundary pay the cross-chunk
  // world.getBlock cost (missing neighbour = Air, exactly as world.getBlock). This is the
  // difference between a ~30 ms and a ~5 ms remesh of a full-water band.
  const gb = (x: number, y: number, z: number): number =>
    x >= bx && x < bx + 16 && y >= by && y < by + 16 && z >= bz && z < bz + 16
      ? chunk.blocks[localIndex(x - bx, y - by, z - bz)]
      : world.getBlock(x, y, z);

  for (let ly = 0; ly < 16; ly++) {
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const b = chunk.blocks[localIndex(lx, ly, lz)];
        if (b === Block.Air) continue; // air contributes to neither pass
        const kind = BLOCKS[b as Block].kind;
        const wx = bx + lx, wy = by + ly, wz = bz + lz;
        if (kind !== 'cube') {
          // Special blocks are partial geometry, always in the opaque pass (never trans).
          if (kind === 'torch') emitTorch(opaque, gb, wx, wy, wz, chunk.meta[localIndex(lx, ly, lz)]);
          else emitDoor(opaque, gb, wx, wy, wz, chunk.meta[localIndex(lx, ly, lz)]);
          continue;
        }
        const sOp = isOpaque(b);
        for (let f = 0; f < 6; f++) {
          const face = FACES[f];
          const nx = wx + face.dir[0], ny = wy + face.dir[1], nz = wz + face.dir[2];
          const nB = gb(nx, ny, nz);
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
            const s1 = isOpaque(gb(nx + (au === 0 ? su : 0), ny + (au === 1 ? su : 0), nz + (au === 2 ? su : 0))) ? 1 : 0;
            const s2 = isOpaque(gb(nx + (av === 0 ? sv : 0), ny + (av === 1 ? sv : 0), nz + (av === 2 ? sv : 0))) ? 1 : 0;
            const dg = isOpaque(gb(
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