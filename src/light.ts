// Dynamic lighting: two 0..15 integer light fields propagated locally through the voxel grid —
// light does not know which source lit it; state is local, nothing is remembered; changes propagate
// through a queue until a stable state (the classic voxel light-propagation convention). Mirrors
// src/water.ts's queue shape.
//
// Fresh-chunk settle uses COLUMN PREFILL + FRONTIER SEEDING instead of re-deriving all 4096 cells:
// every cell's sky field starts at its column emission E_s (the direct downcast — a lower bound on
// the true sky light, which horizontal propagation only raises) and the block field at 0, and only
// the cells that can actually change are queued — the 6 face shells (where light crosses a chunk
// boundary), every interior cell a horizontal neighbor's prefill can raise, and every torch (the
// only block-light source). A cell's sky light can only exceed its column prefill through a
// HORIZONTAL neighbor (a vertical neighbor's column prefill is always at most its own, so it never
// raises a cell above the prefill), so the frontier need not test vertical neighbors. The queued
// boundary relaxes with the same recompute pop as before, which re-seeds a cell's neighbors on
// change — so the deficit propagates inward and the settle converges to the same fixpoint as a full
// re-derive (see light.test.ts's brute-force comparison).
// See docs/superpowers/specs/2026-08-19-dynamic-lighting-design.md.
// Pure module: no three.js — node-testable.

import { BLOCKS, Block, isDoor, doorOpen } from './blocks';
import { World, Chunk, CHUNK_SIZE, localIndex, chunkOf, chunkKey } from './world';
import { CY_MAX } from './streaming';

export const LIGHT_MAX = 15;
export const LIGHT_AMBIENT = 0.12; // unlit floor ("dark but readable"): shader factor at light 0
export const LIGHT_TICK_BUDGET = 2500; // cell pops per 60 Hz substep: a torch's <=14-cell wave (a few thousand cells) settles in 1-3 substeps
export const LIGHT_SETTLE_GUARD = 4096; // inline pops per chunk-load settle (the frontier is far smaller; the rest keeps draining on substeps)

const N6: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]; // orthogonal neighbors only — diagonals get light by taking two steps

/** The cell's light opacity O from its block + meta: registry default; doors are meta-dependent (closed = 15 like solid, open = 0 like air — the door-meta semantics of world.isSolid). */
function cellOpacity(b: number, meta: number): number {
  if (isDoor(b)) return doorOpen(meta) ? 0 : LIGHT_MAX;
  return BLOCKS[b].opacity;
}

/** The cell's light opacity O at a world position (registry default; doors meta-dependent). */
export function lightOpacity(world: World, wx: number, wy: number, wz: number): number {
  return cellOpacity(world.getBlock(wx, wy, wz), world.getMeta(wx, wy, wz));
}

/** Capped-at-15 sum of light opacities over one 16-cell chunk column (lx, lz) of chunk (cx, cy, cz) — the per-chunk `colSum` cache entry. Reads the chunk arrays directly (no per-cell world lookups). The value LightSim keeps in chunk.colSum; must be recomputed after any block/meta change in the chunk (edit/settleChunk) — skyEmit reads neighboring chunks' entries and assumes they are current. */
export function columnSum(world: World, cx: number, cy: number, cz: number, lx: number, lz: number): number {
  const c = world.getChunk(cx, cy, cz);
  if (!c) return 0;
  let s = 0;
  for (let ly = 15; ly >= 0 && s < LIGHT_MAX; ly--) {
    const i = localIndex(lx, ly, lz);
    s += cellOpacity(c.blocks[i], c.meta[i]);
    if (s > LIGHT_MAX) s = LIGHT_MAX;
  }
  return s;
}

/** Sky-light emission E_s of a cell: 15 minus the capped sum of the opacities of every cell STRICTLY above it (open air column -> 0 -> 15: direct downward skylight does not decay through air; glass costs 1; water 2 per cell; a single solid above -> 0). Walks up through loaded chunks (missing chunk = air = 0, keep walking); a partially-loaded column accrues a too-low opacity sum (missing upper = air → reads too BRIGHT) until the upper chunks load and their seam seeding re-seeds the lower one. The band top is CY_MAX (generated y band 0..79; outside it there are no chunks, hence no cells). */
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
    s += cellOpacity(c.blocks[i2], c.meta[i2]);
    if (s >= LIGHT_MAX) return 0;
  }
  return LIGHT_MAX - s;
}

export interface LightStats { seeds: number; pops: number; fieldChanges: number }

export class LightSim {
  /** Chunk keys whose light changed — consumed and cleared exactly once per frame by main.ts (the exact `sim.touched` contract). */
  readonly touched = new Set<string>();
  /** World-coord keys, insertion-ordered FIFO with dedup (the water-sim contract). */
  private readonly queue = new Set<string>();
  readonly stats: LightStats = { seeds: 0, pops: 0, fieldChanges: 0 };
  /** Scratch per-cell opacity cache for the frontier scan: filled during the column prefill and read in the same call (one 16^3 pass, never escapes). */
  private readonly opac = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);

  constructor(private readonly world: World) {}

  private seed(wx: number, wy: number, wz: number): void {
    this.queue.add(`${wx},${wy},${wz}`);
    this.stats.seeds++;
  }

  /** Re-derive ONE cell's both fields with the rule `target = max(E, max_nb (L(nb) - 1 - O(nb)))` — attenuation is paid EXITING the neighbor. Each of the six neighbors is read ONCE and contributes to both fields: its opacity is a property of the block (shared by block- and sky-light), so the hot path is six chunk reads instead of twelve (profiled: neighbor lookups are ~80% of a pop). Writes on change, marks the chunk touched, re-seeds the six neighbors per changed field. Returns the number of fields that changed. */
  private pop(wx: number, wy: number, wz: number): number {
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return 0;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    let changed = 0;
    // Emissions: block light from the registry (torch 14); sky light from skyEmit (colSum walks).
    let best = BLOCKS[c.blocks[i]].light;
    let bestS = skyEmit(this.world, wx, wy, wz);
    for (const [dx, dy, dz] of N6) {
      const nc = this.world.getChunk(chunkOf(wx + dx), chunkOf(wy + dy), chunkOf(wz + dz));
      if (!nc) continue; // missing neighbor contributes nothing to either field
      const ni = localIndex(wx + dx - nc.cx * CHUNK_SIZE, wy + dy - nc.cy * CHUNK_SIZE, wz + dz - nc.cz * CHUNK_SIZE);
      const nb = nc.blight[ni], ns = nc.skylight[ni];
      if (nb === 0 && ns === 0) continue; // a dark neighbor contributes <= 0 to both
      const op = cellOpacity(nc.blocks[ni], nc.meta[ni]);
      if (op === LIGHT_MAX) continue; // a solid neighbor exits nothing (nb-1-15 <= -1)
      if (nb > 0) { const v = nb - 1 - op; if (v > best) best = v; }
      if (ns > 0) { const v = ns - 1 - op; if (v > bestS) bestS = v; }
      if (best >= LIGHT_MAX && bestS >= LIGHT_MAX) break; // both fields at the ceiling: no neighbor can raise further
    }
    const b = best < 0 ? 0 : best;
    if (b !== c.blight[i]) {
      c.blight[i] = b;
      this.touched.add(chunkKey(c.cx, c.cy, c.cz));
      this.stats.fieldChanges++;
      changed++;
      for (const [dx, dy, dz] of N6) this.seed(wx + dx, wy + dy, wz + dz);
    }
    const s = bestS < 0 ? 0 : bestS;
    if (s !== c.skylight[i]) {
      c.skylight[i] = s;
      this.touched.add(chunkKey(c.cx, c.cy, c.cz));
      this.stats.fieldChanges++;
      changed++;
      for (const [dx, dy, dz] of N6) this.seed(wx + dx, wy + dy, wz + dz);
    }
    return changed;
  }

  /** Player-side edit at (wx, wy, wz), called from main.ts AFTER world.setBlock / a door-meta change (at every existing sim.edit site + the door toggle). re-seeds: the cell (its new emission), its six neighbors, and every cell STRICTLY BELOW it in the (wx, wz) column — each such cell's sky emission may have changed; a changed one is set exactly to its new E_s (relaxation restores any horizontal support). Also maintains the edited chunk's colSum entry. */
  edit(wx: number, wy: number, wz: number): void {
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (c) {
      const lx = wx - c.cx * CHUNK_SIZE, lz = wz - c.cz * CHUNK_SIZE;
      c.colSum[lx + lz * 16] = columnSum(this.world, c.cx, c.cy, c.cz, lx, lz);
    }
    this.seed(wx, wy, wz);
    for (const [dx, dy, dz] of N6) this.seed(wx + dx, wy + dy, wz + dz);
    // the column: only cells strictly below the edited one can see a changed E_s
    for (let y = 0; y < wy; y++) {
      const ch = this.world.getChunk(chunkOf(wx), chunkOf(y), chunkOf(wz));
      if (!ch) continue; // unloaded band cell: settles when its chunk loads
      const e = skyEmit(this.world, wx, y, wz);
      const i = localIndex(wx - ch.cx * CHUNK_SIZE, y - ch.cy * CHUNK_SIZE, wz - ch.cz * CHUNK_SIZE);
      if (e !== ch.skylight[i]) {
        ch.skylight[i] = e;
        this.touched.add(chunkKey(ch.cx, ch.cy, ch.cz));
        this.stats.fieldChanges++;
      }
      this.seed(wx, y, wz);
    }
  }

  /** Load-path settle (main.ts calls it for each newly loaded chunk, next to sim.settle): maintains the chunk's colSum (skyEmit reads neighbors' entries), and — on a FRESH load only — settles the chunk via COLUMN PREFILL + FRONTIER SEEDING (prefillAndFrontier) instead of re-deriving all 4096 cells. On a REMESH the interior is already settled and stays converged by the wave, so only the one-cell seam is re-seeded (a neighbor may have loaded/unloaded, changing the boundary light — including sky columns whose upper band just appeared). The `lightSettled` flag mirrors WaterSim's `settled` and makes re-settling a re-meshed chunk cheap. */
  settleChunk(cx: number, cy: number, cz: number): void {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c) return;
    for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) c.colSum[lx + lz * 16] = columnSum(this.world, cx, cy, cz, lx, lz);
    if (!c.lightSettled) {
      this.prefillAndFrontier(c);
      c.lightSettled = true;
    }
    for (const [sx, sy, sz] of N6) this.seedSeamNeighbor(cx, cy, cz, sx, sy, sz);
    this.drain(LIGHT_SETTLE_GUARD);
  }

  /** Fresh-load settle core (COLUMN PREFILL + FRONTIER SEEDING). (1) Every cell's sky field is set to its column emission E_s (the direct downcast, a lower bound on the true sky light) and its block field to 0 — computed from the colSum cache in one O(4096) pass, no per-cell skyEmit walk. (2) Only the cells that can actually change are queued: the 6 face shells (light crosses a chunk boundary there), every interior cell a horizontal neighbor's prefill can raise (a cell's sky light can only exceed its column prefill through a horizontal neighbor — a vertical neighbor's column prefill is always at most its own, so it never raises a cell above the prefill), and every torch (the only block-light source). The queued boundary then relaxes with the recompute pop, which re-seeds a cell's neighbors on change — so the deficit propagates inward and the settle converges to the same fixpoint as a full re-derive. */
  private prefillAndFrontier(c: Chunk): void {
    const { cx, cy, cz } = c;
    const { blocks, meta, blight, skylight } = c;
    const op = this.opac;
    blight.fill(0);
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const col = lx + lz * 16;
        let s = 0; // opacity sum of every chunk strictly above this one, for this column (capped at 15)
        for (let cyi = cy + 1; cyi <= CY_MAX && s < LIGHT_MAX; cyi++) {
          const up = this.world.getChunk(cx, cyi, cz);
          if (up) { s += up.colSum[col]; if (s > LIGHT_MAX) s = LIGHT_MAX; }
        }
        for (let ly = 15; ly >= 0; ly--) {
          const i = localIndex(lx, ly, lz);
          skylight[i] = s >= LIGHT_MAX ? 0 : LIGHT_MAX - s; // column emission E_s
          const o = cellOpacity(blocks[i], meta[i]);
          op[i] = o;
          s += o;
          if (s > LIGHT_MAX) s = LIGHT_MAX;
        }
      }
    }
    for (let ly = 0; ly < 16; ly++) for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
      const i = localIndex(lx, ly, lz);
      const wx = cx * 16 + lx, wy = cy * 16 + ly, wz = cz * 16 + lz;
      if (blocks[i] === Block.Torch) { this.seed(wx, wy, wz); continue; } // block-light source
      if (lx === 0 || lx === 15 || lz === 0 || lz === 15 || ly === 0 || ly === 15) { this.seed(wx, wy, wz); continue; } // face shell: cross-chunk entry
      const my = skylight[i]; // interior: seed only if a horizontal neighbor's prefill can raise this cell
      if (skylight[i - 1] - 1 - op[i - 1] > my || skylight[i + 1] - 1 - op[i + 1] > my ||
          skylight[i - 16] - 1 - op[i - 16] > my || skylight[i + 16] - 1 - op[i + 16] > my) this.seed(wx, wy, wz);
    }
  }

  /** Verification reference (used by tests, not the game loop): the SLOW full re-derive — recompute every cell of the chunk from scratch (seed all 4096 + seam), independent of the prefill+frontier fast path. Draining to empty after this yields the fixpoint the fast path must reach. */
  settleChunkBruteForce(cx: number, cy: number, cz: number): void {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c) return;
    for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) c.colSum[lx + lz * 16] = columnSum(this.world, cx, cy, cz, lx, lz);
    for (let ly = 0; ly < 16; ly++) for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) this.seed(cx * 16 + lx, cy * 16 + ly, cz * 16 + lz);
    for (const [sx, sy, sz] of N6) this.seedSeamNeighbor(cx, cy, cz, sx, sy, sz);
  }

  /** Queue the one-cell face shell of neighbor chunk (cx+sx, cy+sy, cz+sz) that faces (cx, cy, cz). */
  private seedSeamNeighbor(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): void {
    const nc = this.world.getChunk(cx + sx, cy + sy, cz + sz);
    if (!nc) return;
    const x0 = nc.cx * 16, y0 = nc.cy * 16, z0 = nc.cz * 16;
    if (sx !== 0) { const lx = sx === 1 ? 0 : 15; for (let ly = 0; ly < 16; ly++) for (let lz = 0; lz < 16; lz++) this.seed(x0 + lx, y0 + ly, z0 + lz); }
    else if (sy !== 0) { const ly = sy === 1 ? 0 : 15; for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) this.seed(x0 + lx, y0 + ly, z0 + lz); }
    else { const lz = sz === 1 ? 0 : 15; for (let lx = 0; lx < 16; lx++) for (let ly = 0; ly < 16; ly++) this.seed(x0 + lx, y0 + ly, z0 + lz); }
  }

  /** Unload path (main.ts calls it for each removed chunk): the surviving neighbors' seam shells may have been lit THROUGH the removed chunk (their missing-neighbor lookup now contributes nothing) — re-seed those cells so pops re-derive the darker values and the darkness wave propagates. Streaming unloads a doomed x/z column in a single pass, so no SURVIVING cell ever loses an upper sky-column mate to unload (a partially-loaded column is a load-time transient, self-correcting, and is what skyEmit's skip-missing-chunks walk documents). */
  onChunkUnloaded(cx: number, cy: number, cz: number): void {
    for (const [sx, sy, sz] of N6) this.seedSeamNeighbor(cx, cy, cz, sx, sy, sz);
  }

  /** Internal bounded drain (shares tick's body; used by settleChunk). */
  private drain(budget: number): number {
    let n = 0;
    while (n++ < budget) {
      const it = this.queue.values().next();
      if (it.done) break;
      this.queue.delete(it.value);
      const [wx, wy, wz] = it.value.split(',').map(Number);
      this.stats.pops++;
      this.pop(wx, wy, wz);
    }
    return n - 1;
  }

  /** Process up to `budget` queued cells (insertion order); returns the number processed (0 = queue empty). Does NOT clear `touched` — the caller drains it after re-meshing (sim.touched contract). */
  tick(budget: number): number {
    return this.drain(budget);
  }
}