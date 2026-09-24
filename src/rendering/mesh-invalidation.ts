import { CHUNK_SIZE, chunkOf, type World } from '../world';

type Coordinates = [number, number, number];

export function rebuildEditedChunks(
  world: Pick<World, 'hasChunk'>,
  position: Coordinates,
  rebuild: (...chunk: Coordinates) => void,
): void {
  const chunk = position.map(chunkOf) as Coordinates;
  rebuild(...chunk);

  // Only face neighbors share exposed faces with the edited voxel.
  for (const axis of [0, 2, 1]) {
    const local = position[axis] - chunk[axis] * CHUNK_SIZE;
    if (local !== 0 && local !== CHUNK_SIZE - 1) continue;
    const neighbor: Coordinates = [...chunk];
    neighbor[axis] += local === 0 ? -1 : 1;
    if (world.hasChunk(...neighbor)) rebuild(...neighbor);
  }
}

export function queueMeshUpdates(
  remesher: { request: (key: string) => void },
  ...sources: Set<string>[]
): void {
  for (const source of sources) {
    for (const key of source) remesher.request(key);
    source.clear();
  }
}
