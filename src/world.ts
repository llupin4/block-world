import { Block, isOpaque, isDoor, doorOpen, waterSurfaceHeight } from './blocks';

export const CHUNK_SIZE = 16;
export const CHUNK_VOL = CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE; // 4096
export const WORLD_Y_MIN = -32;
export const WORLD_Y_MAX = 64;

export interface VoxelBuffer {
  positions: Float32Array;
  colors: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  light: Float32Array; // per-vertex (blight, skylight), levels/15 normalized to 0..1; the shader multiplies the face/AO color by ambient + (1-ambient)*max(bl, sk*uDayness) (PROJECT.md §18)
}

export interface Chunk {
  cx: number;
  cy: number;
  cz: number;
  blocks: Uint8Array; // D9: block ids fit in a byte (13 values now: cubes + torch + door halves)
  meta: Uint8Array; // per-cell state for special blocks: torch mount face (torchMeta), door open/axis (doorMeta, BOTH halves). Always 0 for cube blocks
  wlevel: Uint8Array;  // water flow level per cell: 0 dry, 1..7 water (7 = full). Re-derived from the neighbourhood on change (the "what state do I hold" of the local cellular rule)
  wsource: Uint8Array; // 0/1 per cell: this cell is a source body — the worldgen sea/lake (settle re-seeds it), the player's placed water, or water regenerated within a placed body. Flow is never adopted into a source body (a body's level never rises and no flow can become an immortal source): sources are immortal, their level never rises or decays and they re-derive to themselves
  wplaced: Uint8Array; // 0/1 per source cell: a PLACED source (spring) — created by the player placing water, or regenerated within a placed body. A placed source is a static block: it never falls, pours no column through itself, emits only a side halo into air, and is the only water the player can break (breaking it is how you stop its flow). 0 = worldgen water settle re-seeded as a source (the sea): it stands, falls and pours where its support goes, but never emits, grows or feeds flow — the sea is not a spring
  wstream: Uint8Array; // 0/1 per flow cell: RIDING support (below is water over solid / another column / the void base) vs RESTING on its own (over solid or the void). Riding cells spread nothing — a waterfall column cannot climb a pool, fill a basin or raise the sea; a rider stays a rider only while alive flow holds it (water above, a spring or an active column alongside) — when nothing alive holds it the cell re-derives as resting water on its next pass, so a frozen column can never outlive its source
  blight: Uint8Array;   // block light level per cell, 0..15 (torch emission propagated); owned by src/light.ts
  skylight: Uint8Array; // sky light level per cell, 0..15 (open-to-sky exposure propagated); owned by src/light.ts
  colSum: Uint8Array;   // 256: per (lx,lz) column, capped-at-15 sum of light opacities over the chunk's own 16 cells (skyEmit's per-chunk cache; localIndex(lx, 0, lz) indexing)
  dirty: boolean;
  settled: boolean;    // water sim has settled this chunk's worldgen water (makes settle idempotent)
  lightSettled: boolean; // light sim has settled this chunk's interior (fresh-load full settle done; remeshes only re-seed the seam)
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
      meta: new Uint8Array(CHUNK_VOL),
      wlevel: new Uint8Array(CHUNK_VOL),
      wsource: new Uint8Array(CHUNK_VOL),
      wplaced: new Uint8Array(CHUNK_VOL),
      wstream: new Uint8Array(CHUNK_VOL),
      blight: new Uint8Array(CHUNK_VOL),
      skylight: new Uint8Array(CHUNK_VOL),
      colSum: new Uint8Array(256),
      dirty: true,
      settled: false,
      lightSettled: false,
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

  /** Per-cell special-block state (torchMeta/doorMeta); missing chunks read as 0, mirroring getBlock = Air. */
  getMeta(wx: number, wy: number, wz: number): number {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return 0;
    return c.meta[localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE)];
  }

  /**
   * Water surface height (0..1) at a cell: waterSurfaceHeight of its
   * wlevel/wsource/wstream bytes. Missing chunk reads 0 (dry), mirroring
   * getBlock = Air. Only meaningful when the cell's block is Water — the
   * mesher checks the block id first and consults this only for water
   * neighbours (the skirt compare).
   */
  getWaterHeight(wx: number, wy: number, wz: number): number {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return 0;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    return waterSurfaceHeight(c.wlevel[i], c.wsource[i], c.wstream[i]);
  }

  /** Both light fields at a cell, [blight, skylight] (0..15 each). Missing chunk (incl. outside the generated y band) reads [0, 0] — light never propagates through ungenerated space, exactly like water. */
  getLight(wx: number, wy: number, wz: number): [number, number] {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return [0, 0];
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    return [c.blight[i], c.skylight[i]];
  }

  /**
   * Returns false when the chunk is missing or the value is unchanged (block AND meta).
   * meta defaults to 0 — writing any plain block clears the cell's torch/door state.
   * Footgun: calling setBlock WITHOUT meta on a cell that already holds a
   * torch/door silently RESETS its state to 0 (returns true, dirties neighbors) —
   * always pass meta explicitly when writing Block.Torch / a door id.
   * Marks the chunk and any existing 6 face-neighbors dirty: a door closing/opening
   * changes both what is solid and which neighbor faces its panel hides.
   */
  setBlock(wx: number, wy: number, wz: number, b: number, meta = 0): boolean {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return false;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    if (c.blocks[i] === b && c.meta[i] === meta) return false;
    c.blocks[i] = b;
    c.meta[i] = meta;
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

  /**
   * The single collision truth: air and torches are never solid; a door is solid
   * while CLOSED (both halves, full block) and walkable while open. LEAVES get a
   * dedicated solid exception (the water sim already blocked them via the
   * registry flag); GLASS keeps the legacy pass-through rule. Do NOT change the
   * isOpaque fallback — it is the rule glass/air/torch still follow.
   */
  isSolid(wx: number, wy: number, wz: number): boolean {
    const b = this.getBlock(wx, wy, wz);
    if (b === Block.Air) return false;
    if (b === Block.Torch) return false;
    if (isDoor(b)) return !doorOpen(this.getMeta(wx, wy, wz));
    if (b === Block.Leaves) return true; // leaves are solid to the player; glass intentionally keeps pass-through
    return isOpaque(b);
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