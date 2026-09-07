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
  meshable: Set<string>; // chunk keys in range of the first (meshable) anchor: the host meshes only these
}

/** One anchor of the union ring: a player (the host's own, meshable) or a remote client. */
export interface Anchor { cx: number; cz: number; cy: number; radius: number; meshable?: boolean }

/** (dx^2+dz^2) dominates x/z; |cy - a.cy| orders levels; the min over every anchor. */
function minDist(c: Coord, anchors: Anchor[]): number {
  let best = Infinity;
  for (const a of anchors) {
    const dx = c.cx - a.cx, dz = c.cz - a.cz;
    const d = (dx * dx + dz * dz) * 100 + Math.abs(c.cy - a.cy);
    if (d < best) best = d;
  }
  return best;
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
 * One union-ring streaming step. A chunk stays loaded if it is in range of ANY anchor
 * (the host's own player + every remote client). Load/remesh budgets are shared across all
 * anchors; `meshable` = the chunk keys in range of the FIRST anchor (the host's own, so
 * remote-only chunks are sim-loaded but never meshed).
 *   1. loads:  every missing candidate, warm → pending → generate (≤ LOAD_BUDGET total);
 *   2. remesh: the closest dirty in-range chunk (≤ REMESH_BUDGET), excluding this call's loads;
 *   3. unload: everything outside the union ring (or the y band) leaves; persist.onUnload
 *      snapshots edited/entity chunks (D1/D4/D6); their in-range neighbors are marked dirty
 *      (newly exposed boundary faces).
 * Pure TS (no three) so vitest can drive it; main.ts turns the result into scene work.
 */
function _update(world: World, anchors: Anchor[], persist?: PersistSource, sim?: EntitySource): StreamingUpdate {
  const rebuilt: Coord[] = [];
  const generated: Coord[] = [];
  const remeshed: Coord[] = [];
  const restored: Coord[] = [];
  const pending: Coord[] = [];
  const unloaded: Coord[] = [];
  const done = new Set<string>(); // keys handled by this call's load pass; the remesh pass skips them

  // Union of every anchor's x/z ring (full generated y band); a key may be claimed by several
  // anchors but is processed once.
  const candidates = new Set<string>();
  const meshable = new Set<string>();
  for (let ai = 0; ai < anchors.length; ai++) {
    const a = anchors[ai];
    for (let dx = -a.radius; dx <= a.radius; dx++) {
      for (let dz = -a.radius; dz <= a.radius; dz++) {
        for (let cy = CY_MIN; cy <= CY_MAX; cy++) {
          const cx = a.cx + dx, cz = a.cz + dz;
          const k = chunkKey(cx, cy, cz);
          candidates.add(k);
          if (ai === 0 && a.meshable !== false) meshable.add(k); // the first anchor is the host's own
        }
      }
    }
  }

  // Load pass: every missing candidate, warm → pending → generate (≤ LOAD_BUDGET total).
  const missed: Coord[] = [];
  for (const k of candidates) {
    const [cx, cy, cz] = k.split(',').map(Number);
    if (world.hasChunk(cx, cy, cz)) continue;
    const rec = persist?.syncRecord(cx, cy, cz);
    if (rec) {
      applyRecord(world, rec); // edited chunk: arrays verbatim, settled = true (D1)
      markNeighborsDirty(world, cx, cy, cz, anchors[0].cx, anchors[0].cz);
      restored.push({ cx, cy, cz });
      done.add(k);
      continue;
    }
    if (persist?.hasPersisted(cx, cy, cz)) { pending.push({ cx, cy, cz }); continue; }
    missed.push({ cx, cy, cz });
  }
  missed.sort((a, b) => minDist(a, anchors) - minDist(b, anchors) || a.cx - b.cx || a.cy - b.cy || a.cz - b.cz);
  for (const c of missed.slice(0, LOAD_BUDGET)) {
    world.ensureChunk(c.cx, c.cy, c.cz);
    generateChunkTerrain(world, GEN, c.cx, c.cy, c.cz); // fills data, sets dirty
    markNeighborsDirty(world, c.cx, c.cy, c.cz, anchors[0].cx, anchors[0].cz);
    rebuilt.push(c);
    generated.push(c);
    done.add(chunkKey(c.cx, c.cy, c.cz));
  }
  pending.sort((a, b) => minDist(a, anchors) - minDist(b, anchors) || a.cx - b.cx || a.cy - b.cy || a.cz - b.cz); // deterministic fetch order (closest first)

  // Remesh pass: the closest dirty in-range chunk (≤ REMESH_BUDGET), excluding this call's loads.
  const dirty: Coord[] = [];
  for (const c of world.allChunks()) {
    if (!c.dirty || done.has(chunkKey(c.cx, c.cy, c.cz))) continue;
    if (!candidates.has(chunkKey(c.cx, c.cy, c.cz))) continue; // out of the union ring → unloading
    dirty.push({ cx: c.cx, cy: c.cy, cz: c.cz });
  }
  dirty.sort((a, b) => minDist(a, anchors) - minDist(b, anchors) || a.cx - b.cx || a.cy - b.cy || a.cz - b.cz);
  for (const c of dirty.slice(0, REMESH_BUDGET)) {
    rebuilt.push(c);
    remeshed.push(c);
    done.add(chunkKey(c.cx, c.cy, c.cz));
  }

  // Unload pass: everything outside the union ring (or the y band) leaves the world.
  const doomed: Chunk[] = []; // Chunk (not Coord): onUnload needs the live arrays
  for (const c of world.allChunks()) {
    if (!candidates.has(chunkKey(c.cx, c.cy, c.cz)) || c.cy < CY_MIN || c.cy > CY_MAX) doomed.push(c);
  }
  for (const c of doomed) {
    const ents = sim ? sim.entitiesInChunk(c.cx, c.cy, c.cz).map((e) => sim.toRecord(e)) : undefined;
    persist?.onUnload(c, ents); // edited/entity-only snapshot (D1/D4/D6); entities ride the chunk
    markNeighborsDirty(world, c.cx, c.cy, c.cz, anchors[0].cx, anchors[0].cz);
    world.removeChunk(c.cx, c.cy, c.cz);
    unloaded.push({ cx: c.cx, cy: c.cy, cz: c.cz });
  }

  return { rebuilt, generated, remeshed, restored, pending, unloaded, meshable };
}

// The public entry point. Two call forms (overloads):
//   - anchors form:    update(world, anchors, persist?, sim?) — the host and clients pass the
//     union ring's anchors (the first is the host's own, meshable) directly.
//   - single-anchor form: update(world, pcx, pcz, pcy?, persist?, sim?) — main.ts (single player)
//     keeps its today's call; one meshable VIEW_RADIUS anchor == today's behavior.
export function update(world: World, anchors: Anchor[], persist?: PersistSource, sim?: EntitySource): StreamingUpdate;
export function update(world: World, pcx: number, pcz: number, pcy?: number, persist?: PersistSource, sim?: EntitySource): StreamingUpdate;
export function update(world: World, a: Anchor[] | number, b?: number | PersistSource, c?: number | EntitySource, d?: PersistSource, e?: EntitySource): StreamingUpdate {
  if (Array.isArray(a)) return _update(world, a, b as PersistSource | undefined, c as EntitySource | undefined);
  return _update(world, [{ cx: a, cz: b as number, cy: typeof c === 'number' ? c : 2, radius: VIEW_RADIUS, meshable: true }], d, e);
}