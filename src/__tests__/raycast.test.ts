import { describe, expect, it } from 'vitest';
import { Block } from '../blocks';
import { World } from '../world';
import { raycastVoxel } from '../raycast';

// setBlock refuses to touch missing chunks, so give every case its own world with chunk (0,0,0) materialized.
function worldWith(build: (w: World) => void): World {
  const w = new World();
  w.ensureChunk(0, 0, 0);
  build(w);
  return w;
}

describe('raycastVoxel — DDA over the voxel lattice', () => {
  it('hits the first solid it crosses; normal = the face it entered from', () => {
    const w = worldWith((w) => w.setBlock(0, 0, 0, Block.Stone));
    const hit = raycastVoxel(w, { x: -5.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 30);
    expect(hit).not.toBeNull();
    expect([hit!.x, hit!.y, hit!.z, hit!.nx, hit!.ny, hit!.nz]).toEqual([0, 0, 0, -1, 0, 0]);
  });

  it('returns null when nothing solid is within maxDist', () => {
    const w = worldWith((w) => w.setBlock(0, 0, 0, Block.Stone)); // stone cell first reached at t=5.5; bound is 4
    expect(raycastVoxel(w, { x: -5.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 4)).toBeNull();
  });

  it('passes over the world: a ray above the solid exits through the distance bound', () => {
    const w = worldWith((w) => w.setBlock(0, 0, 0, Block.Stone));
    expect(raycastVoxel(w, { x: -5.5, y: 5.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 30)).toBeNull();
  });

  it('water is pass-through: stepping continues until the solid behind it', () => {
    const w = worldWith((w) => {
      w.setBlock(2, 0, 0, Block.Water);
      w.setBlock(3, 0, 0, Block.Stone);
    });
    const hit = raycastVoxel(w, { x: 0.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 10);
    expect(hit).not.toBeNull();
    expect([hit!.x, hit!.y, hit!.z, hit!.nx, hit!.ny, hit!.nz]).toEqual([3, 0, 0, -1, 0, 0]);
  });
});