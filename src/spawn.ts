import { Block } from './blocks';
import { type World } from './world';
import { SimRng, IdleController, type Sim } from './entity';

/** A dolt can spawn on this cell: grass with two air cells above, at a plausible surface height. */
export function isDoltSpawnCell(getBlock: (x: number, y: number, z: number) => number, x: number, y: number, z: number): boolean {
  return getBlock(x, y, z) === Block.Grass && getBlock(x, y + 1, z) === Block.Air && getBlock(x, y + 2, z) === Block.Air && y >= -20 && y <= 32;
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
    let y = 32;
    while (y >= -20 && !isDoltSpawnCell(get, x, y, z)) y--;
    if (y >= -20 && !exists(x, y, z)) out.push({ x: x + 0.5, y: y + 1, z: z + 0.5 });
  }
  return out;
}

/**
 * Spawn up to `count` dolts into the sim for chunk (cx,cz), using a PRNG seeded from the chunk
 * coords (deterministic per chunk). Dolts run an IdleController as their default (base)
 * controller so they stand still until a player possesses one.
 */
export function spawnDolts(world: World, sim: Sim, cx: number, cz: number, count = 2): void {
  const exists = (x: number, y: number, z: number) =>
    sim.all().some((e) => e.kind.id === 'dolt' && Math.round(e.pos.x) === x && Math.round(e.pos.z) === z);
  const rng = new SimRng(cx * 73856093 ^ cz * 19349663);
  for (const p of rollDoltSpawns(world, cx, cz, count, () => rng.next(), exists))
    sim.spawn(p, new IdleController(), { kindId: 'dolt', baseController: new IdleController() });
}