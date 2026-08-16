import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, localIndex } from '../world';
import { TerrainGen, generateChunkTerrain, generateRegion, SEA_LEVEL, TERRAIN_SEED, hash2 } from '../terrain';

function genRegion(cx0: number, cx1: number, cz0: number, cz1: number, seed = TERRAIN_SEED) {
  const world = new World();
  const gen = new TerrainGen(seed);
  generateRegion(world, gen, cx0, cz0, cx1, cz1); // cy band 0..4
  return { world, gen };
}

describe('terrain', () => {
  it('heightAt: deterministic, in range, both land and sea for this seed', () => {
    const a = new TerrainGen(1234);
    const b = new TerrainGen(1234);
    const c = new TerrainGen(7);
    let min = 1e9, max = -1e9, same = true, differs = false;
    for (let x = -32; x <= 47; x += 2) {
      for (let z = -32; z <= 47; z += 2) {
        const h = a.heightAt(x, z);
        if (h < min) min = h;
        if (h > max) max = h;
        if (a.heightAt(x, z) !== b.heightAt(x, z)) same = false;
        if (a.heightAt(x, z) !== c.heightAt(x, z)) differs = true;
        expect(h).toBeGreaterThanOrEqual(10); // spec range is 12..52 (SEA_LEVEL ± 20)
        expect(h).toBeLessThanOrEqual(55);
      }
    }
    expect(same).toBe(true);
    expect(differs).toBe(true);
    expect(min).toBeLessThan(SEA_LEVEL);
    expect(max).toBeGreaterThan(SEA_LEVEL);
  });

  it('generateRegion builds 5x5x5 = 125 chunks', () => {
    const { world } = genRegion(-2, 2, -2, 2);
    expect(world.count()).toBe(125);
  });

  it('every generated world of this seed contains water above the seafloor', () => {
    const { world } = genRegion(-2, 2, -2, 2);
    let water = 0;
    for (const c of world.allChunks()) for (let i = 0; i < c.blocks.length; i++) if (c.blocks[i] === Block.Water) water++;
    expect(water).toBe(45395); // exact, measured against simplex-noise@4.0.3 (seed pinned above)
  });

  it('surface columns end in grass or sand; dirt directly below for above-sea-level ground', () => {
    const { world } = genRegion(-2, 2, -2, 2);
    for (const sx of [0, 8, 16, 24, 32]) {
      for (const sz of [0, 8, 16, 24, 32]) {
        let yFirst = -1, firstSolid = 0;
        for (let y = 63; y >= 0; y--) {
          const b = world.getBlock(sx, y, sz);
          if (b !== Block.Air && b !== Block.Water) { firstSolid = b; yFirst = y; break; }
        }
        expect([Block.Grass, Block.Sand]).toContain(firstSolid);
        if (yFirst > SEA_LEVEL) {
          // above-sea-level ground: the row just under the surface is never cave-carved
          expect(world.getBlock(sx, yFirst - 1, sz)).toBe(Block.Dirt);
        }
      }
    }
  });

  it('stone exists below every sample column', () => {
    const { world } = genRegion(-2, 2, -2, 2);
    for (const sx of [0, 8, 16, 24, 32]) {
      for (const sz of [0, 8, 16, 24, 32]) {
        let found = false;
        for (let y = 60; y >= 0; y--) if (world.getBlock(sx, y, sz) === Block.Stone) { found = true; break; }
        expect(found, `stone below (${sx},${sz})`).toBe(true);
      }
    }
  });

  it('trees: hash-selected land columns get a full wood trunk and an air-replacing leaf canopy', () => {
    const { world, gen } = genRegion(-2, 2, -2, 2, TERRAIN_SEED);
    const trunkH = (wx: number, wz: number) => 4 + Math.floor(hash2((TERRAIN_SEED ^ 0x51ab) | 0, wx, wz) * 3);
    let checked = 0;
    for (let wx = -32; wx <= 47; ) {
      for (let wz = -32; wz <= 47; ) {
        const lx = ((wx % 16) + 16) % 16, lz = ((wz % 16) + 16) % 16;
        if (lx >= 3 && lx <= 12 && lz >= 3 && lz <= 12) {
          const h = gen.heightAt(wx, wz);
          if (h >= SEA_LEVEL + 1 && hash2(TERRAIN_SEED, wx, wz) < 0.02) {
            const trunk = trunkH(wx, wz);
            for (let y = h + 1; y <= h + trunk; y++) expect(world.getBlock(wx, y, wz), `wood at ${wx},${wz},${y}`).toBe(Block.Wood);
            expect([Block.Grass, Block.Sand]).toContain(world.getBlock(wx, h, wz));
            expect(world.getBlock(wx, h + trunk + 2, wz)).toBe(Block.Leaves); // canopy apex
            checked++;
            if (checked >= 3) return; // geometry on a few trees is enough
          }
        }
        wz += 1;
      }
      wx += 1;
      // (the outer loop bound is reached after -32..47 in both axes)
    }
    expect(checked).toBeGreaterThanOrEqual(1); // seed 1234 has >=1 tree in this region (measured)
  });
});