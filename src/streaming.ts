import { chunkKey, type World } from './world';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from './terrain';

// One shared generator: streaming must reproduce T4/T9's terrain exactly, so it uses the
// same seeded generator (height/cave/tree functions are pure in world coordinates — any
// x/z generates; only y is band-limited to 0..79).
const GEN = new TerrainGen(TERRAIN_SEED);

export const VIEW_RADIUS = 2; // chunk radius in x/z: the ring is 5x5 columns
export const CY_MIN = 0;      // generated y band: 0..79
export const CY_MAX = 4;

const LOAD_BUDGET = 2;   // new chunk generations per call
const REMESH_BUDGET = 2; // dirty chunk rebuilds per call (main.ts performs the rebuild)

export interface Coord { cx: number; cy: number; cz: number }

export interface StreamingUpdate {
  rebuilt: Coord[];  // loaded (freshly generated) and dirty-remeshed chunks: main.ts calls
                     // rebuildChunkMesh on each, which clears the chunk's dirty flag
  unloaded: Coord[]; // removed from the world inside update(): main.ts only disposes scene meshes
}

/** (dx^2+dz^2) dominates x/z; |cy - pcy| orders levels; main.ts passes pcy = chunkOf(player.y). */
function score(c: Coord, pcx: number, pcz: number, pcy: number): number {
  const dx = c.cx - pcx, dz = c.cz - pcz;
  return (dx * dx + dz * dz) * 100 + Math.abs(c.cy - pcy);
}

function cmp(a: Coord, b: Coord, pcx: number, pcz: number, pcy: number): number {
  return score(a, pcx, pcz, pcy) - score(b, pcx, pcz, pcy) || a.cx - b.cx || a.cy - b.cy || a.cz - b.cz;
}

function inRange(cx: number, cz: number, pcx: number, pcz: number): boolean {
  return Math.abs(cx - pcx) <= VIEW_RADIUS && Math.abs(cz - pcz) <= VIEW_RADIUS;
}

/** Mark existing in-range neighbors of (cx,cy,cz) dirty: their culling is stale after a load/unload. */
function markNeighborsDirty(world: World, cx: number, cy: number, cz: number, pcx: number, pcz: number): void {
  const n: [number, number, number][] = [
    [cx + 1, cy, cz], [cx - 1, cy, cz],
    [cx, cy + 1, cz], [cx, cy - 1, cz],
    [cx, cy, cz + 1], [cx, cy, cz - 1],
  ];
  for (const [nx, ny, nz] of n) {
    const c = world.getChunk(nx, ny, nz);
    if (c && inRange(nx, nz, pcx, pcz)) c.dirty = true;
  }
}

/**
 * One streaming step around (pcx, pcy, pcz):
 *   1. loads:  closest missing chunks in the ring (<=2), filled with terrain immediately;
 *      each load marks its existing in-range neighbors dirty (their culling is stale);
 *   2. remesh: closest dirty chunks (<=2, excluding loads of this call, which main.ts
 *      rebuilds immediately anyway);
 *   3. unload: everything outside the ring (or outside the y band) leaves the world;
 *      their in-range neighbors are marked dirty first (newly exposed boundary faces).
 * Pure TS (no three) so vitest can drive it; main.ts turns the result into scene work.
 */
export function update(world: World, pcx: number, pcz: number, pcy = 2): StreamingUpdate {
  const rebuilt: Coord[] = [];
  const unloaded: Coord[] = [];
  const done = new Set<string>(); // keys rebuilt by this call; the remesh pass skips them

  const loads: Coord[] = [];
  for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
    for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
      for (let cy = CY_MIN; cy <= CY_MAX; cy++) {
        const cx = pcx + dx, cz = pcz + dz;
        if (!world.hasChunk(cx, cy, cz)) loads.push({ cx, cy, cz });
      }
    }
  }
  loads.sort((a, b) => cmp(a, b, pcx, pcz, pcy));
  for (const c of loads.slice(0, LOAD_BUDGET)) {
    world.ensureChunk(c.cx, c.cy, c.cz);
    generateChunkTerrain(world, GEN, c.cx, c.cy, c.cz); // fills data, sets dirty
    markNeighborsDirty(world, c.cx, c.cy, c.cz, pcx, pcz);
    rebuilt.push(c);
    done.add(chunkKey(c.cx, c.cy, c.cz));
  }

  const dirty: Coord[] = [];
  for (const c of world.allChunks()) {
    if (!c.dirty || done.has(chunkKey(c.cx, c.cy, c.cz))) continue;
    if (!inRange(c.cx, c.cz, pcx, pcz)) continue; // goes away with the unload pass below
    dirty.push({ cx: c.cx, cy: c.cy, cz: c.cz });
  }
  dirty.sort((a, b) => cmp(a, b, pcx, pcz, pcy));
  for (const c of dirty.slice(0, REMESH_BUDGET)) {
    rebuilt.push(c);
    done.add(chunkKey(c.cx, c.cy, c.cz));
  }

  const doomed: Coord[] = [];
  for (const c of world.allChunks()) {
    if (!inRange(c.cx, c.cz, pcx, pcz) || c.cy < CY_MIN || c.cy > CY_MAX) doomed.push(c);
  }
  for (const c of doomed) {
    markNeighborsDirty(world, c.cx, c.cy, c.cz, pcx, pcz);
    world.removeChunk(c.cx, c.cy, c.cz);
    unloaded.push({ cx: c.cx, cy: c.cy, cz: c.cz });
  }

  return { rebuilt, unloaded };
}