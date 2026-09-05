import { describe, it, expect } from 'vitest';
import { World, localIndex } from '../world';
import { Block } from '../blocks';
import { WaterSim } from '../water';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from '../terrain';

describe('water origin tracking — the edit gate (D4)', () => {
  it('settle + pulses on generated chunks never mark a chunk edited', () => {
    const world = new World();
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2);
    const sim = new WaterSim(world);
    for (const c of world.allChunks()) sim.settle(c.cx, c.cy, c.cz);
    sim.tick(1000);
    for (let i = 0; i < 20 && sim.tick(1000) > 0; i++) {}
    for (const c of world.allChunks()) expect(c.edited, `chunk (${c.cx},${c.cy},${c.cz})`).toBe(false);
  });

  it('a player-placed spring marks its own chunk AND the chunk its flow floods edited', () => {
    const world = new World();
    for (const cx of [0, 1]) {
      const c = world.ensureChunk(cx, 0, 0);
      for (let lx = 0; lx < 16; lx++)
        for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, 0, lz)] = Block.Stone;
    }
    const sim = new WaterSim(world);
    world.setBlock(12, 2, 8, Block.Water);
    sim.edit(12, 2, 8, Block.Water);
    for (let i = 0; i < 100 && sim.tick(1000) > 0; i++) {}
    expect(world.getChunk(0, 0, 0)!.edited).toBe(true); // the placement itself
    expect(world.getChunk(1, 0, 0)!.edited).toBe(true); // the fan crosses x=16 (edit-origin flow)
  });
});