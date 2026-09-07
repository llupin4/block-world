import { chunkKey, type Chunk, type World } from './world';
import { applyRecord, type PersistSource } from './persistence';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from './terrain';
import { type Entity, type EntityRecord } from './entity';

/** The entity view streaming needs for the unload path (dependency inversion, as PersistSource). */
export interface EntitySource {
  entitiesInChunk(cx: number, cy: number, cz: number): Entity[];
  toRecord(e: Entity): EntityRecord;
}

// One shared generator: streaming must reproduce T4/T9's terrain exactly, so it uses the
// same seeded generator (height/cave/tree functions are pure in world coordinates — any
// x/z generates; only y is band-limited to 0..79).
const GEN = new TerrainGen(TERRAIN_SEED);

export const VIEW_RADIUS = 2; // chunk radius in x/z: the ring is 5x5 columns
export const CY_MIN = 0;      // generated y band: 0..79
export const CY_MAX = 4;

// One rebuild per budget per frame (measured: 2+2 made walking over deep ocean stutter
// — a chunk's terrain+settle+mesh is a 10–35 ms spike, so two in one frame ran 25–138 ms
// frames against the 16.7 ms budget). One per frame keeps every frame light; the ring
// simply fills/relocates a little more gradually.
const LOAD_BUDGET = 1;   // new chunk generations per call
const REMESH_BUDGET = 1; // dirty chunk rebuilds per call (main.ts performs the rebuild)

export interface Coord { cx: number; cy: number; cz: number }

export interface StreamingUpdate {
  rebuilt: Coord[];  // loaded (freshly generated) and dirty-remeshed chunks (their concatenation): main.ts calls
                     // rebuildChunkMesh on each, which clears the chunk's dirty flag
  generated: Coord[]; // freshly GENERATED columns — the ONLY ones spawnDeer tops up
  remeshed: Coord[];  // dirty-RE-MESHED chunks — no spawnDeer
  restored: Coord[]; // chunks restored from a WARM persistence record this call (applied inline):
                     // main.ts runs sim.restore + lightSim.load + deferredFirstMesh (no settle — settled is already true)
  pending: Coord[];  // in the persistence key set but not warm: main.ts fetches async (fetchRecord →
                     // applyRecord → sim.restore + lightSim.load + deferredFirstMesh); not loaded or generated this call
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

/** In-range: within VIEW_RADIUS of the player chunk in both x and z. Exported: main.ts
 *  range-checks a cold-restore callback against the CURRENT player position (stale fetches
 *  must not resurrect chunks the player has walked past). */
export function inRange(cx: number, cz: number, pcx: number, pcz: number): boolean {
  return Math.abs(cx - pcx) <= VIEW_RADIUS && Math.abs(cz - pcz) <= VIEW_RADIUS;
}

/** Mark existing in-range neighbors of (cx,cy,cz) dirty: their culling is stale after a load/unload/restore. Exported: main.ts marks after an async (cold) apply. */
export function markNeighborsDirty(world: World, cx: number, cy: number, cz: number, pcx: number, pcz: number): void {
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
 *   1. loads:  for every missing chunk of the ring, in score order:
 *      a. warm persistence record → applied inline (restored; neighbors marked dirty; does
 *         not consume the generation budget — records are the load, terrain gen is the
 *         fallback);
 *      b. key-set hit without a warm record → pending: main.ts fetches async; the chunk is
 *         NEVER generated while its key is known (D3) — generation happens only after a
 *         dropped/stale record (dropPersisted) makes it a confirmed miss;
 *      c. otherwise → terrain generation (≤ LOAD_BUDGET per call, as before);
 *   2. remesh: closest dirty chunks (≤ REMESH_BUDGET, excluding loads of this call, which
 *      main.ts rebuilds immediately anyway);
 *   3. unload: everything outside the ring (or outside the y band) leaves the world;
 *      persist.onUnload snapshots EDITED chunks only (D4/D6); their in-range neighbors
 *      are marked dirty first (newly exposed boundary faces).
 * Pure TS (no three) so vitest can drive it; main.ts turns the result into scene work.
 */
export function update(world: World, pcx: number, pcz: number, pcy = 2, persist?: PersistSource, sim?: EntitySource): StreamingUpdate {
  const rebuilt: Coord[] = [];
  const generated: Coord[] = [];
  const remeshed: Coord[] = [];
  const restored: Coord[] = [];
  const pending: Coord[] = [];
  const unloaded: Coord[] = [];
  const done = new Set<string>(); // keys handled by this call's load pass; the remesh pass skips them

  const missed: Coord[] = [];
  for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
    for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
      for (let cy = CY_MIN; cy <= CY_MAX; cy++) {
        const cx = pcx + dx, cz = pcz + dz;
        if (world.hasChunk(cx, cy, cz)) continue;
        const rec = persist?.syncRecord(cx, cy, cz);
        if (rec) {
          applyRecord(world, rec); // edited chunk: arrays verbatim, settled = true (D1)
          markNeighborsDirty(world, cx, cy, cz, pcx, pcz);
          restored.push({ cx, cy, cz });
          done.add(chunkKey(cx, cy, cz));
          continue;
        }
        if (persist?.hasPersisted(cx, cy, cz)) {
          pending.push({ cx, cy, cz }); // async fetch dedups in-flight; the first mesh is paced by main.ts
          continue;
        }
        missed.push({ cx, cy, cz });
      }
    }
  }
  missed.sort((a, b) => cmp(a, b, pcx, pcz, pcy));
  for (const c of missed.slice(0, LOAD_BUDGET)) {
    world.ensureChunk(c.cx, c.cy, c.cz);
    generateChunkTerrain(world, GEN, c.cx, c.cy, c.cz); // fills data, sets dirty
    markNeighborsDirty(world, c.cx, c.cy, c.cz, pcx, pcz);
    rebuilt.push(c);
    generated.push(c);
    done.add(chunkKey(c.cx, c.cy, c.cz));
  }
  pending.sort((a, b) => cmp(a, b, pcx, pcz, pcy)); // deterministic fetch order (closest first)

  const dirty: Coord[] = [];
  for (const c of world.allChunks()) {
    if (!c.dirty || done.has(chunkKey(c.cx, c.cy, c.cz))) continue;
    if (!inRange(c.cx, c.cz, pcx, pcz)) continue; // goes away with the unload pass below
    dirty.push({ cx: c.cx, cy: c.cy, cz: c.cz });
  }
  dirty.sort((a, b) => cmp(a, b, pcx, pcz, pcy));
  for (const c of dirty.slice(0, REMESH_BUDGET)) {
    rebuilt.push(c);
    remeshed.push(c);
    done.add(chunkKey(c.cx, c.cy, c.cz));
  }

  const doomed: Chunk[] = []; // Chunk (not Coord): onUnload needs the live arrays
  for (const c of world.allChunks()) {
    if (!inRange(c.cx, c.cz, pcx, pcz) || c.cy < CY_MIN || c.cy > CY_MAX) doomed.push(c);
  }
  for (const c of doomed) {
    const ents = sim ? sim.entitiesInChunk(c.cx, c.cy, c.cz).map((e) => sim.toRecord(e)) : undefined;
    persist?.onUnload(c, ents); // edited-only snapshot (D4/D6); entities ride the chunk
    markNeighborsDirty(world, c.cx, c.cy, c.cz, pcx, pcz);
    world.removeChunk(c.cx, c.cy, c.cz);
    unloaded.push({ cx: c.cx, cy: c.cy, cz: c.cz });
  }

  return { rebuilt, generated, remeshed, restored, pending, unloaded };
}