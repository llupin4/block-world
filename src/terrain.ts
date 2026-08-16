import { createNoise2D, createNoise3D } from 'simplex-noise';
import { Block } from './blocks';
import { Chunk, World, localIndex } from './world';

export const SEA_LEVEL = 32;
export const TERRAIN_SEED = 1234;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    // Pinned variant: t ^ (a >>> 7) instead of canonical mulberry32's t >>> 7 — matches the plan's
    // measured constants (24936 water cells post cave→Air, was 45395; heights 19..43, 21 trees at
    // seed 1234). The canonical form's 45258 water-cell figure predates the cave→Air change and
    // was not re-measured after it. See docs/superpowers/2026-08-15-voxel-sandbox-poc-execution-notes.md
    t = (t + Math.imul(t ^ (a >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(seed: number, x: number, z: number): number {
  let h = (seed ^ Math.imul(x, 0x9e3779b9) ^ Math.imul(z, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xcc9e2d51) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x1b873593) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

export class TerrainGen {
  private n2: (x: number, y: number) => number;
  private n3: (x: number, y: number, z: number) => number;
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.n2 = createNoise2D(mulberry32(seed));
    this.n3 = createNoise3D(mulberry32((seed ^ 0x9e3779b9) | 0));
  }

  /** 4 octaves, amplitude-normalized → ≈ [-1, 1]; height = SEA_LEVEL + h*20 → 12..52. */
  heightAt(wx: number, wz: number): number {
    const freqs = [0.008, 0.02, 0.05, 0.11];
    const amps = [1, 0.5, 0.25, 0.125];
    let h = 0;
    for (let i = 0; i < 4; i++) h += this.n2(wx * freqs[i], wz * freqs[i]) * amps[i];
    const norm = 1 + 0.5 + 0.25 + 0.125;
    return Math.floor(SEA_LEVEL + (h / norm) * 20);
  }

  caveAt(wx: number, wy: number, wz: number): number {
    return this.n3(wx * 0.06, wy * 0.06, wz * 0.06);
  }
}

/**
 * Fills exactly one 16^3 chunk, vertically seam-free (height/cave functions are
 * pure in world coords, so adjacent chunks agree on shared cells).
 */
export function generateChunkTerrain(world: World, gen: TerrainGen, cx: number, cy: number, cz: number): void {
  const c = world.ensureChunk(cx, cy, cz);
  const bx = cx * 16, by = cy * 16, bz = cz * 16;
  for (let lx = 0; lx < 16; lx++) {
    for (let lz = 0; lz < 16; lz++) {
      const wx = bx + lx, wz = bz + lz;
      const h = gen.heightAt(wx, wz);
      for (let ly = 0; ly < 16; ly++) {
        const wy = by + ly;
        const i = localIndex(lx, ly, lz);
        if (wy > h) {
          c.blocks[i] = wy <= SEA_LEVEL ? Block.Water : Block.Air;
          continue;
        }
        if (wy < h - 4) c.blocks[i] = Block.Stone;
        else if (wy < h) c.blocks[i] = Block.Dirt;
        else c.blocks[i] = h < SEA_LEVEL + 1 ? Block.Sand : Block.Grass;
        // caves carve stone/dirt below sea level to AIR; the water sim (src/water.ts) floods
        // them from any sea-facing opening and leaves sealed caves dry.
        if ((c.blocks[i] === Block.Stone || c.blocks[i] === Block.Dirt) && wy <= SEA_LEVEL && gen.caveAt(wx, wy, wz) > 0.55) {
          c.blocks[i] = Block.Air;
        }
      }
    }
  }
  // trees: deterministic per column; margin 3 keeps the r=2 canopy inside the chunk
  for (let lx = 3; lx <= 12; lx++) {
    for (let lz = 3; lz <= 12; lz++) {
      const wx = bx + lx, wz = bz + lz;
      const h = gen.heightAt(wx, wz);
      if (h < SEA_LEVEL + 1) continue;
      if (hash2(gen.seed, wx, wz) >= 0.02) continue;
      const trunk = 4 + Math.floor(hash2((gen.seed ^ 0x51ab) | 0, wx, wz) * 3); // 4..6
      for (let dy = 0; dy < trunk; dy++) {
        const wy = h + 1 + dy;
        const ly = wy - by;
        if (wy < by || ly >= 16) continue;
        c.blocks[localIndex(lx, ly, lz)] = Block.Wood;
      }
      for (let wy = h + trunk - 1; wy <= h + trunk + 2; wy++) {
        const r = wy < h + trunk ? 2 : 1;
        for (let dx = -r; dx <= r; dx++) {
          for (let dz = -r; dz <= r; dz++) {
            if (Math.abs(dx) === r && Math.abs(dz) === r) continue; // trim corners
            const ly = wy - by;
            if (ly < 0 || ly >= 16) continue;
            const i = localIndex(lx + dx, ly, lz + dz);
            // canopy replaces Air only — never hollows neighbouring terrain
            if (c.blocks[i] === Block.Air) c.blocks[i] = Block.Leaves;
          }
        }
      }
    }
  }
  c.dirty = true;
}

export function generateRegion(world: World, gen: TerrainGen, cx0: number, cz0: number, cx1: number, cz1: number, cy0 = 0, cy1 = 4): void {
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cz = cz0; cz <= cz1; cz++) {
      for (let cy = cy0; cy <= cy1; cy++) generateChunkTerrain(world, gen, cx, cy, cz);
    }
  }
}