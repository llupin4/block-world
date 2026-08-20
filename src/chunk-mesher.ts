import { Block, BLOCKS, isOpaque, torchFace, doorOpen, doorAxis, doorSide } from './blocks';
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
  light: number[] = [];
  verts = 0;

  push(x: number, y: number, z: number, s: number, u: number, v: number, bl: number, sk: number) {
    this.pos.push(x, y, z);
    this.col.push(s, s, s, 1.0);
    this.uv.push(u, v);
    this.light.push(bl, sk);
    this.verts++;
  }

  toBuffer(): VoxelBuffer | null {
    if (this.verts === 0) return null;
    return {
      positions: new Float32Array(this.pos),
      colors: new Float32Array(this.col),
      uvs: new Float32Array(this.uv),
      indices: new Uint32Array(this.idx),
      light: new Float32Array(this.light),
    };
  }
}

/** Tiles used by the special emitters (atlas layout: see the TILES painters in main.ts). */
const TILE_TORCH_STEM = 11;
const TILE_TORCH_FLAME = 12;
const TILE_DOOR = 13;

// torch meta face -> FACES index of the stub's outward tip: 1:+X, 2:-X, 3:+Z, 4:-Z
const TIP_FACE = [0, 0, 1, 4, 5];

const EPS = 1e-6;
type Cov = { u0: number; u1: number; v0: number; v1: number };
interface FaceGeom { reach: boolean; cov: Cov | null }

/**
 * Cell-local (0..1) box `[min, min+size]` for a special block, mirroring exactly what
 * emitTorch/emitDoor feed to pushBox. The box lives inside ONE cell; which cell-boundary
 * planes its ends sit on is what decides which faces can ever be hidden.
 */
function specialBox(b: number, meta: number): { min: [number, number, number]; size: [number, number, number] } {
  if (b === Block.Torch) {
    const face = torchFace(meta);
    if (face === 0) return { min: [0.41, 0, 0.41], size: [0.18, 0.875, 0.18] }; // floor post
    if (face === 1) return { min: [0, 0.41, 0.41], size: [0.375, 0.18, 0.18] }; // stub, +X tip
    if (face === 2) return { min: [1 - 0.375, 0.41, 0.41], size: [0.375, 0.18, 0.18] }; // stub, -X tip
    if (face === 3) return { min: [0.41, 0.41, 0], size: [0.18, 0.18, 0.375] };  // stub, +Z tip
    return { min: [0.41, 0.41, 1 - 0.375], size: [0.18, 0.18, 0.375] };          // stub, -Z tip
  }
  const xThin = doorAxis(meta) === 0;
  const side = doorSide(meta);
  if (doorOpen(meta)) return { min: [0, 0, 0], size: xThin ? [1, 1, 0.2] : [0.2, 1, 1] };
  if (xThin) return { min: side === 1 ? [0.8, 0, 0] : [0, 0, 0], size: [0.2, 1, 1] };
  return { min: side === 1 ? [0, 0, 0.8] : [0, 0, 0], size: [1, 1, 0.2] };
}

/**
 * For each FACES index: does the cell's geometry `reach` that cell-boundary plane, and if so
 * the 2D `cov` coverage rect in that face's u/v space (derived from `FACES[f].axes` exactly
 * like pushBox maps UVs). `reach === false` means the box end is INTERIOR to the cell, so the
 * face never reaches the boundary plane and can never be cullled; `cov` is null in that case.
 */
function faceGeom(b: number, meta: number): FaceGeom[] {
  const { min, size } = specialBox(b, meta);
  const out: FaceGeom[] = [];
  for (let f = 0; f < 6; f++) {
    const axis = f >> 1; // 0:x, 1:y, 2:z
    const reach = (f & 1) === 0 ? min[axis] + size[axis] >= 1 - EPS : min[axis] <= EPS;
    let cov: Cov | null = null;
    if (reach) {
      const [au, av] = FACES[f].axes;
      cov = { u0: min[au], u1: min[au] + size[au], v0: min[av], v1: min[av] + size[av] };
    }
    out.push({ reach, cov });
  }
  return out;
}

/** Does the `outer` rect cover the `inner` rect (within EPS on all four edges)? */
function rectsCover(outer: Cov, inner: Cov): boolean {
  return outer.u0 <= inner.u0 + EPS && outer.v0 <= inner.v0 + EPS
    && outer.u1 >= inner.u1 - EPS && outer.v1 >= inner.v1 - EPS;
}

function rectsEqual(a: Cov, b: Cov): boolean {
  return Math.abs(a.u0 - b.u0) <= EPS && Math.abs(a.u1 - b.u1) <= EPS
    && Math.abs(a.v0 - b.v0) <= EPS && Math.abs(a.v1 - b.v1) <= EPS;
}

/** Lexicographic (x,y,z) cell order; true when `a` sorts strictly after `b`. */
function indexGreater(a: [number, number, number], b: [number, number, number]): boolean {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

/**
 * A special block's face is hidden only when the box's end sits ON the cell-boundary plane
 * of that face (interior ends are never culled — a thin door's far face is not deleted just
 * because some opaque cell lies beyond it) AND the neighbouring cell covers the face's area:
 * an opaque neighbour always covers; a special neighbour covers when its geometry reaches the
 * SAME plane on its side AND its coverage rect covers mine (a strict superset). Exactly-equal
 * coverage (two panels flush on one plane) keeps exactly ONE face: the smaller lexicographic
 * cell keeps its face, the bigger culls its. `gb`/`gm` read the neighbour's block id / meta.
 */
const makeHidden = (
  gb: (x: number, y: number, z: number) => number,
  gm: (x: number, y: number, z: number) => number,
  wx: number, wy: number, wz: number,
  myB: number, myMeta: number,
) => {
  const myGeom = faceGeom(myB, myMeta);
  return (f: number): boolean => {
    const my = myGeom[f];
    if (!my.reach) return false; // interior end: the face never reaches the boundary plane
    const d = FACES[f].dir;
    const nx = wx + d[0], ny = wy + d[1], nz = wz + d[2];
    const nB = gb(nx, ny, nz);
    if (isOpaque(nB)) return true; // an opaque neighbour always covers a boundary face
    if (BLOCKS[nB].kind === 'cube') return false; // air & transparent cubes never cover a special face
    const nFace = faceGeom(nB, gm(nx, ny, nz))[f ^ 1]; // opposite face, same plane
    if (!nFace.reach) return false; // the neighbour's geometry does not reach the shared plane
    if (!rectsCover(nFace.cov!, my.cov!)) return false; // the face's area is not covered
    return !rectsEqual(nFace.cov!, my.cov!) || indexGreater([wx, wy, wz], [nx, ny, nz]);
  };
};

/**
 * Partial-geometry box for special blocks (torch post/stub, door panel), written into
 * the opaque buffer. `min`/`size` are world-space (a box lives inside ONE cell, size
 * <= 1 per axis). `tiles` is per FACES order [+X, -X, +Y, -Y, +Z, -Z]; the tile is
 * stretched across the whole face — torch/door tiles are painted whole-material, so
 * the stretch still reads correctly on a 0.18-wide post. A face is hidden only when the
 * box's end for that face sits ON the cell-boundary plane AND the neighbour's geometry
 * covers the face's area — see makeHidden: an opaque neighbour always covers; a special
 * neighbour covers only when its own ends reach the same plane with an equal-or-larger
 * coverage rect (equal coverage keeps exactly one face, by lexicographic cell order).
 * Interior box ends are never culled, so a thin door's far face is not read as a slit.
 * Shading = FACE_SHADE[face]; no vertex AO on partial geometry.
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
        0, 0,
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
  gm: (x: number, y: number, z: number) => number,
  wx: number, wy: number, wz: number,
  meta: number,
): void {
  const hidden = makeHidden(gb, gm, wx, wy, wz, Block.Torch, meta);
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
 * as one panel; the shared seam hides against the special neighbor cell). The panel
 * hinges on its `side` edge (bit 2 of the meta: 0 = min, 1 = max along the thin axis)
 * — the edge flush against the support wall the player aimed at. Closed = the thin
 * panel (0.2 x 1 x 1) hugging that edge; open = the SAME full-size panel swung 90
 * degrees about the hinge corner, so both states are congruent 1 x 0.2 boxes sitting
 * in the cell's min corner for side 0 and are never clamped or squished.
 */
function emitDoor(
  buf: Buf,
  gb: (x: number, y: number, z: number) => number,
  gm: (x: number, y: number, z: number) => number,
  wx: number, wy: number, wz: number,
  meta: number,
): void {
  // Both halves emit the identical panel, so either door id yields the same geometry.
  const hidden = makeHidden(gb, gm, wx, wy, wz, Block.DoorBottom, meta);
  const xThin = doorAxis(meta) === 0;
  const side = doorSide(meta);
  const tiles: [number, number, number, number, number, number] =
    [TILE_DOOR, TILE_DOOR, TILE_DOOR, TILE_DOOR, TILE_DOOR, TILE_DOOR];
  if (doorOpen(meta)) {
    pushBox(buf, [wx, wy, wz], xThin ? [1, 1, 0.2] : [0.2, 1, 1], tiles, hidden);
  } else if (xThin) {
    pushBox(buf, side === 1 ? [wx + 0.8, wy, wz] : [wx, wy, wz], [0.2, 1, 1], tiles, hidden);
  } else {
    pushBox(buf, side === 1 ? [wx, wy, wz + 0.8] : [wx, wy, wz], [1, 1, 0.2], tiles, hidden);
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
  // Sibling of gb: the neighbour's meta byte (in-chunk fast path, else world.getMeta). Lets a
  // special-block face be culled only when the neighbour's ACTUAL geometry covers it.
  const gm = (x: number, y: number, z: number): number =>
    x >= bx && x < bx + 16 && y >= by && y < by + 16 && z >= bz && z < bz + 16
      ? chunk.meta[localIndex(x - bx, y - by, z - bz)]
      : world.getMeta(x, y, z);

  for (let ly = 0; ly < 16; ly++) {
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const b = chunk.blocks[localIndex(lx, ly, lz)];
        if (b === Block.Air) continue; // air contributes to neither pass
        const kind = BLOCKS[b as Block].kind;
        const wx = bx + lx, wy = by + ly, wz = bz + lz;
        if (kind !== 'cube') {
          // Special blocks are partial geometry, always in the opaque pass (never trans).
          if (kind === 'torch') emitTorch(opaque, gb, gm, wx, wy, wz, chunk.meta[localIndex(lx, ly, lz)]);
          else emitDoor(opaque, gb, gm, wx, wy, wz, chunk.meta[localIndex(lx, ly, lz)]);
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
              0, 0,
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