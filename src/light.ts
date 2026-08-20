// Dynamic lighting: two 0..15 integer light fields propagated locally through the
// voxel grid — light does not know which source lit it; state is local, nothing is
// remembered; changes propagate through a queue until a stable state (the classic
// voxel-sandbox convention). Mirrors src/water.ts's queue shape.
// See docs/superpowers/specs/2026-08-19-dynamic-lighting-design.md.
// Pure module: no three.js — node-testable.

import { BLOCKS, isDoor, doorOpen } from './blocks';
import { World, CHUNK_SIZE, localIndex, chunkOf } from './world';
import { CY_MAX } from './streaming';

export const LIGHT_MAX = 15;
export const LIGHT_AMBIENT = 0.12; // unlit floor ("dark but readable"): shader factor at light 0
export const LIGHT_TICK_BUDGET = 2500; // cell pops per 60 Hz substep: a torch's <=14-cell wave (a few thousand cells) settles in 1-3 substeps
export const LIGHT_SETTLE_GUARD = 4096; // inline pops per chunk-load settle (~one chunk-size pass; rest keeps draining on substeps)

const N6: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]; // orthogonal neighbors only — diagonals get light by taking two steps

/** The cell's light opacity O: registry default; doors are meta-dependent (closed = 15 like solid, open = 0 like air — the door-meta semantics of world.isSolid). */
export function lightOpacity(world: World, wx: number, wy: number, wz: number): number {
  const b = world.getBlock(wx, wy, wz);
  if (isDoor(b)) return doorOpen(world.getMeta(wx, wy, wz)) ? 0 : LIGHT_MAX;
  return BLOCKS[b].opacity;
}

/** Capped-at-15 sum of light opacities over one 16-cell chunk column (lx, lz) of chunk (cx, cy, cz) — the per-chunk `colSum` cache entry. Reads the chunk arrays directly (no per-cell world lookups). */
export function columnSum(world: World, cx: number, cy: number, cz: number, lx: number, lz: number): number {
  const c = world.getChunk(cx, cy, cz);
  if (!c) return 0;
  let s = 0;
  for (let ly = 15; ly >= 0 && s < LIGHT_MAX; ly--) {
    const i = localIndex(lx, ly, lz);
    const b = c.blocks[i];
    s += isDoor(b) ? (doorOpen(c.meta[i]) ? 0 : LIGHT_MAX) : BLOCKS[b].opacity;
    if (s > LIGHT_MAX) s = LIGHT_MAX;
  }
  return s;
}

/** Sky-light emission E_s of a cell: 15 minus the capped sum of the opacities of every cell STRICTLY above it (open air column -> 0 -> 15: direct downward skylight does not decay through air; glass costs 1; water 2 per cell; a single solid above -> 0). Walks up through loaded chunks (missing chunk = air = 0, keep walking); a partially-loaded column reads low until the upper chunks load and their seam seeding re-seeds the lower one. The band top is CY_MAX (generated y band 0..79; outside it there are no chunks, hence no cells). */
export function skyEmit(world: World, wx: number, wy: number, wz: number): number {
  const cx = chunkOf(wx), cy = chunkOf(wy), cz = chunkOf(wz);
  const c = world.getChunk(cx, cy, cz);
  if (!c) return 0;
  const lx = wx - cx * CHUNK_SIZE, lz = wz - cz * CHUNK_SIZE, ly = wy - cy * CHUNK_SIZE;
  let s = 0;
  for (let cyi = cy + 1; cyi <= CY_MAX; cyi++) {
    const up = world.getChunk(cx, cyi, cz);
    if (up) {
      s += up.colSum[lx + lz * 16];
      if (s >= LIGHT_MAX) return 0;
    } // missing upper chunk = air: contributes 0, keep walking
  }
  for (let y2 = 15; y2 > ly; y2--) {
    const i2 = localIndex(lx, y2, lz);
    const b = c.blocks[i2];
    s += isDoor(b) ? (doorOpen(c.meta[i2]) ? 0 : LIGHT_MAX) : BLOCKS[b].opacity;
    if (s >= LIGHT_MAX) return 0;
  }
  return LIGHT_MAX - s;
}
