import type { Entity } from '../entity';
import { chunkKey, chunkOf } from '../world';

export function hasMeshedGround(entity: Entity, hasMesh: (key: string) => boolean): boolean {
  const { x, y, z } = entity.pos;
  // Feet exactly on a chunk boundary stand on the chunk below, not the air chunk above.
  return hasMesh(chunkKey(chunkOf(x), chunkOf(y - 0.01), chunkOf(z)));
}
