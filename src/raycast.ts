import { Block } from './blocks';

export const REACH = 6; // targeting distance in meters

export interface RayHit {
  x: number; // the voxel the ray hit
  y: number;
  z: number;
  nx: number; // face the ray entered from (unit axis), or 0,0,0 when the origin voxel itself is solid
  ny: number;
  nz: number;
}

/**
 * DDA ray-march through the voxel lattice (Amanatides & Woo): one iteration = one new
 * voxel, always entered through the nearest grid plane. A parallel axis is never
 * stepped (1/0 is Infinity in IEEE-754). `dir` must be normalized (t == meters).
 */
export function raycastVoxel(
  world: { getBlock(x: number, y: number, z: number): number } | ((x: number, y: number, z: number) => number),
  origin: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  maxDist: number,
): RayHit | null {
  // main.ts passes a bare callback, tests pass a World: normalize to one call shape.
  const getBlock = (x: number, y: number, z: number): number =>
    typeof world === 'function' ? world(x, y, z) : world.getBlock(x, y, z);
  // Water is pass-through: the target is whatever you could break against.
  const isTarget = (b: number) => b !== Block.Air && b !== Block.Water;

  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = dir.x >= 0 ? 1 : -1;
  const stepY = dir.y >= 0 ? 1 : -1;
  const stepZ = dir.z >= 0 ? 1 : -1;
  const tDeltaX = Math.abs(1 / dir.x); // Infinity when dir.x === 0
  const tDeltaY = Math.abs(1 / dir.y);
  const tDeltaZ = Math.abs(1 / dir.z);

  let tMaxX = dir.x > 0 ? (x + 1 - origin.x) * tDeltaX : dir.x < 0 ? (origin.x - x) * tDeltaX : Infinity;
  let tMaxY = dir.y > 0 ? (y + 1 - origin.y) * tDeltaY : dir.y < 0 ? (origin.y - y) * tDeltaY : Infinity;
  let tMaxZ = dir.z > 0 ? (z + 1 - origin.z) * tDeltaZ : dir.z < 0 ? (origin.z - z) * tDeltaZ : Infinity;

  let nx = 0;
  let ny = 0;
  let nz = 0;

  for (;;) {
    if (isTarget(getBlock(x, y, z))) return { x, y, z, nx, ny, nz };
    if (tMaxX <= tMaxY && tMaxX <= tMaxZ) {
      if (tMaxX > maxDist) return null;
      x += stepX;
      tMaxX += tDeltaX;
      [nx, ny, nz] = [-stepX, 0, 0];
    } else if (tMaxY <= tMaxZ) {
      if (tMaxY > maxDist) return null;
      y += stepY;
      tMaxY += tDeltaY;
      [nx, ny, nz] = [0, -stepY, 0];
    } else {
      if (tMaxZ > maxDist) return null;
      z += stepZ;
      tMaxZ += tDeltaZ;
      [nx, ny, nz] = [0, 0, -stepZ];
    }
  }
}