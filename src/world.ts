import { Block } from './blocks';

export const CHUNK_SIZE = 16;
export const CHUNK_VOL = CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE; // 4096
export const WORLD_Y_MIN = -32;
export const WORLD_Y_MAX = 64;

export interface VoxelBuffer {
  positions: Float32Array;
  colors: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

export interface Chunk {
  cx: number;
  cy: number;
  cz: number;
  blocks: Uint8Array; // D9: 10 block values fit in a byte
  wlevel: Uint8Array;  // water flow level per cell: 0 dry, 1..7 water (7 = full source)
  wsource: Uint8Array; // 0/1 per cell: this cell is a (re)promoted/placed source
  dirty: boolean;
  settled: boolean;    // water sim has settled this chunk's worldgen water (makes settle idempotent)
  opaqueMesh: VoxelBuffer | null;
  transMesh: VoxelBuffer | null;
}

export function chunkKey(cx: number, cy: number, cz: number): string {
  return `${cx},${cy},${cz}`;
}

export function localIndex(lx: number, ly: number, lz: number): number {
  return lx + lz * CHUNK_SIZE + ly * CHUNK_SIZE * CHUNK_SIZE;
}

export function chunkOf(w: number): number {
  return Math.floor(w / CHUNK_SIZE);
}

export class World {
  private chunks = new Map<string, Chunk>();

  count(): number {
    return this.chunks.size;
  }

  hasChunk(cx: number, cy: number, cz: number): boolean {
    return this.chunks.has(chunkKey(cx, cy, cz));
  }

  getChunk(cx: number, cy: number, cz: number): Chunk | undefined {
    return this.chunks.get(chunkKey(cx, cy, cz));
  }

  ensureChunk(cx: number, cy: number, cz: number): Chunk {
    const key = chunkKey(cx, cy, cz);
    const c = this.chunks.get(key);
    if (c) return c;
    const n: Chunk = {
      cx, cy, cz,
      blocks: new Uint8Array(CHUNK_VOL),
      wlevel: new Uint8Array(CHUNK_VOL),
      wsource: new Uint8Array(CHUNK_VOL),
      dirty: true,
      settled: false,
      opaqueMesh: null,
      transMesh: null,
    };
    this.chunks.set(key, n);
    return n;
  }

  /** Missing chunks behave as Air. */
  getBlock(wx: number, wy: number, wz: number): number {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return Block.Air;
    const lx = wx - c.cx * CHUNK_SIZE;
    const ly = wy - c.cy * CHUNK_SIZE;
    const lz = wz - c.cz * CHUNK_SIZE;
    return c.blocks[localIndex(lx, ly, lz)];
  }

  /** Returns false when the chunk is missing or the value is unchanged. Marks the chunk and any existing 6 face-neighbors dirty. */
  setBlock(wx: number, wy: number, wz: number, b: number): boolean {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return false;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    if (c.blocks[i] === b) return false;
    c.blocks[i] = b;
    c.dirty = true;
    const n = [
      [c.cx + 1, c.cy, c.cz], [c.cx - 1, c.cy, c.cz],
      [c.cx, c.cy + 1, c.cz], [c.cx, c.cy - 1, c.cz],
      [c.cx, c.cy, c.cz + 1], [c.cx, c.cy, c.cz - 1],
    ];
    for (const [nx, ny, nz] of n) {
      const nc = this.getChunk(nx, ny, nz);
      if (nc) nc.dirty = true;
    }
    return true;
  }

  removeChunk(cx: number, cy: number, cz: number): boolean {
    return this.chunks.delete(chunkKey(cx, cy, cz));
  }

  *allChunks(): IterableIterator<Chunk> {
    yield* this.chunks.values();
  }

  clear(): void {
    this.chunks.clear();
  }
}