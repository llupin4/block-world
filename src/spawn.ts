import { Block } from './blocks';
import { type World, chunkOf } from './world';
import { SimRng, MobController, type Sim } from './entity';

/** A dolt can spawn on this cell: grass with two air cells above, at a plausible surface height.
 *  The upper bound covers the TERRAIN_SEED surface range (measured [13,43]; the land is above the
 *  sea at y≈33, so a y≤32 cap — the plan's original — found zero cells on this world). */
export function isDoltSpawnCell(getBlock: (x: number, y: number, z: number) => number, x: number, y: number, z: number): boolean {
  return getBlock(x, y, z) === Block.Grass && getBlock(x, y + 1, z) === Block.Air && getBlock(x, y + 2, z) === Block.Air && y >= -20 && y <= 48;
}

/**
 * Roll up to `count` dolt spawn positions in chunk (cx,cz), drawing randoms from `next` (the
 * caller's PRNG — deterministic when seeded). For each random (x,z) column, scan down from the
 * top for a grass surface; feet land on its top (y+1). Skips columns that already host a dolt
 * (the `exists` predicate). Returns positions (not entities) so the caller owns the spawn.
 */
export function rollDoltSpawns(
  world: World, cx: number, cz: number, count: number,
  next: () => number, exists: (x: number, y: number, z: number) => boolean,
): { x: number; y: number; z: number }[] {
  const get = (x: number, y: number, z: number) => world.getBlock(x, y, z);
  const out: { x: number; y: number; z: number }[] = [];
  for (let t = 0; t < 400 && out.length < count; t++) {
    const lx = Math.floor(next() * 16), lz = Math.floor(next() * 16);
    const x = cx * 16 + lx, z = cz * 16 + lz;
    let y = 48; // scan from the top of the plausible-surface band down (see isDoltSpawnCell)
    while (y >= -20 && !isDoltSpawnCell(get, x, y, z)) y--;
    if (y >= -20 && !exists(x, y, z)) out.push({ x: x + 0.5, y: y + 1, z: z + 0.5 });
  }
  return out;
}

/**
 * Spawn up to `count` dolts into the sim for chunk (cx,cz), using a PRNG seeded from the chunk
 * coords (deterministic per chunk). Each dolt runs its OWN MobController (the wander AI, drawing
 * from the sim PRNG) as both its live and base controller — so it wanders from the start, persists
 * with controllerKind 'mob' (a restore reattaches the AI), and un-possessing resumes its wander.
 * Idempotent per column: a remesh re-roll (r.rebuilt includes dirty chunks, not just fresh ones)
 * must not double-spawn a column that is already populated.
 */
export function spawnDolts(world: World, sim: Sim, cx: number, cz: number, count = 2): void {
  const inColumn = sim.all().filter((e) => e.kind.id === 'dolt' && chunkOf(e.pos.x) === cx && chunkOf(e.pos.z) === cz);
  if (inColumn.length >= count) return; // already at the column cap: skip a remesh re-roll
  const get = (x: number, y: number, z: number) => world.getBlock(x, y, z);
  const exists = (x: number, y: number, z: number) =>
    sim.all().some((e) => e.kind.id === 'dolt' && Math.round(e.pos.x) === x && Math.round(e.pos.z) === z);
  const rng = new SimRng(cx * 73856093 ^ cz * 19349663);
  for (const p of rollDoltSpawns(world, cx, cz, count, () => rng.next(), exists)) {
    const mc = new MobController(get, () => sim.rng.next());
    sim.spawn(p, mc, { kindId: 'dolt', baseController: mc });
  }
}