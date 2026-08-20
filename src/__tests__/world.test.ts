import { describe, it, expect } from 'vitest';
import { World, CHUNK_SIZE, CHUNK_VOL, chunkKey, localIndex, chunkOf } from '../world';
import { Block, torchMeta, doorMeta } from '../blocks';

describe('world', () => {
  it('exposes chunk constants (cubic 16^3)', () => {
    expect(CHUNK_SIZE).toBe(16);
    expect(CHUNK_VOL).toBe(4096);
    expect(chunkKey(1, 2, -3)).toBe('1,2,-3');
    expect(localIndex(3, 5, 7)).toBe(3 + 7 * 16 + 5 * 256);
    expect(chunkOf(15)).toBe(0);
    expect(chunkOf(16)).toBe(1);
    expect(chunkOf(-16)).toBe(-1);
    expect(chunkOf(-17)).toBe(-2);
    expect(chunkOf(-1)).toBe(-1);
  });

  it('ensureChunk is idempotent; fresh chunks are air and dirty', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    expect(w.getChunk(0, 0, 0)).toBe(c);
    expect(c.blocks).toBeInstanceOf(Uint8Array);
    expect(c.blocks.length).toBe(4096);
    expect(c.dirty).toBe(true);
    let allAir = true;
    for (let i = 0; i < c.blocks.length; i++) if (c.blocks[i] !== 0) allAir = false;
    expect(allAir).toBe(true);
    expect(w.count()).toBe(1);
    w.ensureChunk(0, 0, 0);
    expect(w.count()).toBe(1);
  });

  it('getBlock reads across chunk seams, including negative coords; missing = Air', () => {
    const w = new World();
    const c00 = w.ensureChunk(0, 0, 0);
    c00.blocks[localIndex(15, 0, 0)] = Block.Stone;          // world (15,0,0)
    const cNeg = w.ensureChunk(-1, 0, 0);
    cNeg.blocks[localIndex(0, 0, 0)] = Block.Dirt;           // world (-16,0,0)
    expect(w.getBlock(15, 0, 0)).toBe(Block.Stone);
    expect(w.getBlock(-16, 0, 0)).toBe(Block.Dirt);
    expect(w.getBlock(16, 0, 0)).toBe(Block.Air);            // chunk (1,0,0) not loaded
    expect(w.getBlock(0, -1, 0)).toBe(Block.Air);            // cy=-1 not loaded
  });

  it('setBlock edits, marks the chunk and existing 6-neighbors dirty', () => {
    const w = new World();
    const a = w.ensureChunk(0, 0, 0);
    const b = w.ensureChunk(1, 0, 0);
    const up = w.ensureChunk(0, 1, 0);
    a.dirty = b.dirty = up.dirty = false;
    expect(w.setBlock(15, 0, 0, Block.Stone)).toBe(true);    // on the a/b x-seam
    expect(a.dirty).toBe(true);
    expect(b.dirty).toBe(true);
    expect(w.getBlock(15, 0, 0)).toBe(Block.Stone);
    expect(w.setBlock(0, 15, 0, Block.Glass)).toBe(true);    // on the a/up y-seam
    expect(up.dirty).toBe(true);
  });

  it('setBlock no-ops on identical value and on missing/out-of-range chunks', () => {
    const w = new World();
    const a = w.ensureChunk(0, 0, 0);
    a.blocks[localIndex(1, 2, 3)] = Block.Stone;
    a.dirty = false;
    expect(w.setBlock(1, 2, 3, Block.Stone)).toBe(false);
    expect(a.dirty).toBe(false);
    expect(w.setBlock(1, 2, 3, Block.Dirt)).toBe(true);
    expect(w.getBlock(1, 2, 3)).toBe(Block.Dirt);
    expect(w.setBlock(999, 0, 0, Block.Stone)).toBe(false);
  });

  it('removeChunk / clear', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0);
    w.ensureChunk(1, 0, 0);
    expect(w.removeChunk(0, 0, 0)).toBe(true);
    expect(w.hasChunk(0, 0, 0)).toBe(false);
    expect(w.removeChunk(0, 0, 0)).toBe(false);
    w.clear();
    expect(w.count()).toBe(0);
  });

  it('setBlock stores and clears per-cell meta (torch mount / door state)', () => {
    const w = new World();
    const c = w.ensureChunk(0, 0, 0);
    w.setBlock(5, 5, 5, Block.DoorBottom, doorMeta(false, 1));
    expect(c.blocks[localIndex(5, 5, 5)]).toBe(Block.DoorBottom);
    expect(c.meta[localIndex(5, 5, 5)]).toBe(doorMeta(false, 1));
    expect(w.getMeta(5, 5, 5)).toBe(doorMeta(false, 1));
    // same block + a DIFFERENT meta is a change (a door toggle) -> true + dirty
    c.dirty = false;
    expect(w.setBlock(5, 5, 5, Block.DoorBottom, doorMeta(true, 1))).toBe(true);
    expect(c.dirty).toBe(true);
    expect(w.getMeta(5, 5, 5)).toBe(doorMeta(true, 1));
    // a plain block clears the cell's meta (default meta = 0)
    w.setBlock(5, 5, 5, Block.Stone);
    expect(w.getMeta(5, 5, 5)).toBe(0);
    // torch: meta rides the block, gone when the torch is removed
    w.setBlock(6, 5, 5, Block.Torch, torchMeta(2));
    expect(w.getMeta(6, 5, 5)).toBe(torchMeta(2));
    w.setBlock(6, 5, 5, Block.Air);
    expect(w.getMeta(6, 5, 5)).toBe(0);
    // missing chunk reads as 0 (mirror of getBlock = Air)
    expect(w.getMeta(64, 5, 5)).toBe(0);
    // same block + same special meta is a no-op (idempotent rewrite must not dirtify)
    w.setBlock(5, 5, 5, Block.DoorBottom, doorMeta(true, 1));
    c.dirty = false;
    expect(w.setBlock(5, 5, 5, Block.DoorBottom, doorMeta(true, 1))).toBe(false);
    expect(c.dirty).toBe(false);
    // a meta-only change (door toggle) also dirties face-neighbor chunks
    const n = w.ensureChunk(1, 0, 0);
    n.dirty = false;
    w.setBlock(5, 5, 5, Block.DoorBottom, doorMeta(false, 1));
    expect(n.dirty).toBe(true);
  });

  it('isSolid: closed doors block, open doors and torches do not', () => {
    const w = new World();
    w.ensureChunk(0, 0, 0);
    w.setBlock(1, 0, 1, Block.Stone);
    w.setBlock(2, 0, 1, Block.Air);
    w.setBlock(3, 0, 1, Block.Torch);
    w.setBlock(4, 0, 1, Block.DoorBottom, doorMeta(false, 0)); // closed
    w.setBlock(5, 0, 1, Block.DoorBottom, doorMeta(true, 0));  // open
    w.setBlock(6, 0, 1, Block.DoorTop, doorMeta(false, 1));    // closed top half
    w.setBlock(7, 0, 1, Block.Leaves); // solid to the player (dedicated isSolid exception; the water sim already blocked it via the registry flag)
    w.setBlock(8, 0, 1, Block.Glass);  // glass intentionally keeps the legacy player pass-through
    expect(w.isSolid(1, 0, 1)).toBe(true);
    expect(w.isSolid(2, 0, 1)).toBe(false);
    expect(w.isSolid(3, 0, 1)).toBe(false);
    expect(w.isSolid(4, 0, 1)).toBe(true);
    expect(w.isSolid(5, 0, 1)).toBe(false);
    expect(w.isSolid(6, 0, 1)).toBe(true);
    expect(w.isSolid(7, 0, 1)).toBe(true);
    expect(w.isSolid(8, 0, 1)).toBe(false);
    expect(w.isSolid(64, 0, 0)).toBe(false); // missing chunk -> Air -> not solid
  });
});