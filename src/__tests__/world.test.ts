import { describe, it, expect } from 'vitest';
import { World, CHUNK_SIZE, CHUNK_VOL, chunkKey, localIndex, chunkOf } from '../world';
import { Block } from '../blocks';

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
});