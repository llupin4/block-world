import { describe, expect, it } from 'vitest';
import { Block } from '../blocks';
import { World } from '../world';
import { raycastVoxel, pickEntity } from '../raycast';

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

  it('a target predicate can mark water targetable (placed springs): the ray stops at the water cell, others stay pass-through', () => {
    const w = worldWith((w) => {
      w.setBlock(2, 0, 0, Block.Water); // a placed spring (caller knows its state)
      w.setBlock(3, 0, 0, Block.Stone);
    });
    const spring = (x: number, y: number, z: number) => x === 2 && y === 0 && z === 0;
    const hit = raycastVoxel(w, { x: 0.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 10, spring);
    expect(hit).not.toBeNull();
    expect([hit!.x, hit!.y, hit!.z, hit!.nx, hit!.ny, hit!.nz]).toEqual([2, 0, 0, -1, 0, 0]);
    const hit2 = raycastVoxel(w, { x: 0.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 10, (x, y, z) => {
      const b = w.getBlock(x, y, z);
      return b !== Block.Air && b !== Block.Water; // water not marked targetable: stays pass-through
    });
    expect([hit2!.x, hit2!.y, hit2!.z]).toEqual([3, 0, 0]);
  });
});

describe('pickEntity', () => {
  it('hits the nearest entity AABB in front, within reach', () => {
    // The viewer's eye (y 1.6) looks DOWN at the dolt's chest, so the ray actually enters the
    // dolt's box (a horizontal ray at y 1.6 would miss the 0.9-tall box entirely).
    const origin = { x: 0, y: 1.6, z: 0 };
    const chest = { x: 0, y: 0.45, z: -3 }; // dolt body centre (feet at y 0, height 0.9)
    const len = Math.hypot(chest.y - origin.y, chest.z - origin.z);
    const dir = { x: 0, y: (chest.y - origin.y) / len, z: (chest.z - origin.z) / len };
    const ents = [
      { pos: { x: 0, y: 0, z: -3 }, kind: { half: 0.45, height: 0.9 } }, // dolt ahead
      { pos: { x: 5, y: 0, z: -3 }, kind: { half: 0.3, height: 1.8 } },  // far, not in the way
    ];
    const hit = pickEntity(origin, dir, ents, 6);
    expect(hit).not.toBeNull();
    expect(hit!.index).toBe(0);
    // front face at z = -3 + 0.45 = -2.55; distance along the slanted dir = 2.55 / |dir.z|
    expect(hit!.t).toBeCloseTo(2.55 / Math.abs(dir.z), 5);
  });

  it('returns null when the only entity is beyond reach or behind', () => {
    const origin = { x: 0, y: 1.6, z: 0 };
    // beyond reach: aimed at the dolt's height (so it WOULD hit if in reach), but 10 m away —
    // the front face is at ~9.55 m > reach 6.
    const chest = { x: 0, y: 0.45, z: -10 };
    const len = Math.hypot(chest.y - origin.y, chest.z - origin.z);
    const dir = { x: 0, y: (chest.y - origin.y) / len, z: (chest.z - origin.z) / len };
    const far = [{ pos: { x: 0, y: 0, z: -10 }, kind: { half: 0.45, height: 0.9 } }];
    expect(pickEntity(origin, dir, far, 6)).toBeNull(); // beyond reach
    const behind = [{ pos: { x: 0, y: 0, z: 3 }, kind: { half: 0.45, height: 0.9 } }];
    expect(pickEntity(origin, { x: 0, y: 0, z: -1 }, behind, 6)).toBeNull(); // behind
  });
});