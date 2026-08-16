import { Block, BLOCKS } from './blocks';
import { World, chunkOf, chunkKey, localIndex, WORLD_Y_MIN, WORLD_Y_MAX, type Chunk } from './world';

// WaterSim: the PROJECT.md §9 flow cellular automaton. Pure TS (no three) so vitest
// drives it in node, mirroring how streaming.ts is tested. State (wlevel/wsource)
// lives in the chunk, so it streams with the chunk: a missing neighbour chunk reads
// as dry and is not a spread escape; a falling cell whose destination is
// out-of-band or missing is destroyed (falls out of the world).

const HXZ: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const SETTLE_GUARD = 20000; // safety valve: cap on cell updates one settle run may perform
const NB6: ReadonlyArray<readonly [number, number, number]> = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const SEA_BODY_MIN = 512; // a water body larger than this counts as a sea/lake for equalization
const EQUALIZE_BUDGET = 8192; // max air-pocket cells one pocket may be filled over (per seed; a multi-seed call can fill more)
const BODY_BUDGET = 4096; // max water-body cells one equalize() may probe (probe is up-first, so the surface is reached within a few dozen hops even when truncated)
const EQUALIZE_PROBE_BUDGET = 163840; // per-equalize-call cap on neighbour probes (pocket walks + body probes). Without it, every seed inside one over-budget region re-walks the full EQUALIZE_BUDGET (measured: one settle burned ~2.8M redundant pocketBlock lookups, doubling the load-path settle wall) — when exhausted, remaining seeds are left to the CA trickle, the same sanctioned category as over-budget pockets.

interface CellState { b: number; l: number; s: number }
const DRY: CellState = { b: Block.Air, l: 0, s: 0 };

export class WaterSim {
  private readonly world: World;
  private readonly queue = new Set<string>(); // insertion-ordered FIFO with dedup
  readonly touched = new Set<string>(); // chunk keys whose geometry changed (for re-mesh)
  // Work counters, pinned by src/__tests__/water-load.test.ts (the load-path budget
  // regression). `queueAdds` counts re-mark *events* (one per enqueue() call; each
  // re-marks self + 4 horizontal + above, the same closure writeCell re-marks). `probes`
  // counts equalize's neighbour probes (pocket walks exact, body-probe pops at 8) — the
  // equalize cost is invisible to `processes`, so the load pin rides on this.
  readonly stats = { seeds: 0, processes: 0, queueAdds: 0, equalizeFills: 0, probes: 0 };
  private settling: Chunk | null = null; // chunk whose settle is in flight (exempts its own water from the pristine-skip in process)

  constructor(world: World) {
    this.world = world;
  }

  private inBand(wy: number): boolean {
    return wy >= WORLD_Y_MIN && wy < WORLD_Y_MAX;
  }

  /** Water/block state at a world cell; missing chunk or out-of-band reads as dry Air. */
  cellState(wx: number, wy: number, wz: number): CellState {
    if (!this.inBand(wy)) return DRY;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return DRY;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    return { b: c.blocks[i], l: c.wlevel[i], s: c.wsource[i] };
  }

  private solid(b: number): boolean {
    return b !== Block.Air && b !== Block.Water && BLOCKS[b].solid;
  }

  // Write a cell's full state. Only records the chunk in `touched` when the *block*
  // actually changed (level changes alone never re-mesh: levels don't render).
  private setState(wx: number, wy: number, wz: number, l: number, s: number, b: number): void {
    if (!this.inBand(wy)) return;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    c.wlevel[i] = l;
    c.wsource[i] = s;
    if (c.blocks[i] !== b) {
      if (this.world.setBlock(wx, wy, wz, b)) this.touched.add(chunkKey(c.cx, c.cy, c.cz));
    }
  }

  // Write only when state differs, then re-mark the cell + 4 horizontal neighbours +
  // the cell above (a below cell is never re-marked from above: a resting level is a
  // function of horizontal + above, and a changing below re-triggers via this rule).
  private writeCell(wx: number, wy: number, wz: number, l: number, s: number, b: number): void {
    const c = this.cellState(wx, wy, wz);
    if (c.b === b && c.l === l && c.s === s) return;
    this.setState(wx, wy, wz, l, s, b);
    this.queue.add(`${wx},${wy},${wz}`);
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
  }

  // Re-mark exactly the cells writeCell re-marks (self + 4 horizontal + above), without
  // writing state: pass-2 settle seeding and equalize fills use this to pull dependent
  // cells back into the queue. A below cell is never re-marked from above (same rule as
  // writeCell: a resting level is a function of HXZ + above; a changed below re-triggers).
  private enqueue(wx: number, wy: number, wz: number): void {
    this.queue.add(`${wx},${wy},${wz}`);
    this.stats.queueAdds++;
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
  }

  // Two-pass seed (the load-path fix): pass 1 bulk-writes every worldgen Water cell of the
  // chunk to (level 7, source) straight into the chunk arrays — no per-cell state read, no
  // queue write, no re-mark. Pass 2 enqueues ONLY a seeded cell whose rule would act on its
  // neighbours at seed time: a fall (below is Air) or a spread (an HXZ neighbour that is
  // Air, or unseeded water at level 1..5 that a level-7 source would upgrade; a pristine
  // l=0 neighbour is never upgraded — its own settle seeds it as (7,1)). Interior ocean
  // cells trigger neither and are never processed. Every later state change still goes
  // through writeCell (which re-marks dependents), so the worklist stays closed and
  // converges to the same fixpoint as per-cell seeding did.
  private settleSeed(c: Chunk): void {
    const bx = c.cx * 16, by = c.cy * 16, bz = c.cz * 16;
    for (let i = 0; i < c.blocks.length; i++) {
      if (c.blocks[i] !== Block.Water) continue;
      if (c.wlevel[i] === 7 && c.wsource[i] === 1) continue; // already a source
      c.wlevel[i] = 7;
      c.wsource[i] = 1;
      this.stats.seeds++;
    }
    for (let lx = 0; lx < 16; lx++)
      for (let ly = 0; ly < 16; ly++)
        for (let lz = 0; lz < 16; lz++) {
          if (c.blocks[localIndex(lx, ly, lz)] !== Block.Water) continue;
          const wx = bx + lx, wy = by + ly, wz = bz + lz;
          if (this.cellState(wx, wy - 1, wz).b === Block.Air) { this.enqueue(wx, wy, wz); continue; }
        for (const [dx, dz] of HXZ) {
          const m = this.cellState(wx + dx, wy, wz + dz);
          if (m.b === Block.Air || (m.b === Block.Water && m.s === 0 && m.l >= 1 && m.l < 6)) { this.enqueue(wx, wy, wz); break; }
        }
        }
  }

  // One update: process one water cell to its rule-driven action.
  private process(wx: number, wy: number, wz: number): void {
    this.stats.processes++;
    const C = this.cellState(wx, wy, wz);
    if (C.b !== Block.Water) return; // dried / no longer water: neighbours+above already re-marked
    // A loaded-unsettled neighbour still carries pristine worldgen water (level 0, no
    // source) that its own settle has not seeded yet. Never re-level or dry it: settling
    // A may flood Air across the seam into B (loaded cave mouths), but B's unseeded water
    // stays exactly as generated until B's settle re-seeds it as (7,1) — this is what
    // makes sequential per-chunk settling order-independent and unable to eat worldgen
    // water.
    const Cc = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (Cc && !Cc.settled && Cc !== this.settling && C.l === 0 && C.s === 0) return;
    const below = this.cellState(wx, wy - 1, wz);

    // below is Air (missing / out-of-band counts) → C falls down one cell.
    if (below.b === Block.Air) {
      this.writeCell(wx, wy, wz, 0, 0, Block.Air); // dry origin, re-marked
      if (this.world.hasChunk(chunkOf(wx), chunkOf(wy - 1), chunkOf(wz))) {
        this.writeCell(wx, wy - 1, wz, 7, C.s, Block.Water); // land at level 7, source bit carried
      } // else: destination missing/out-of-band → destroyed (fell out of the world)
      return;
    }

    // resting: below is solid or water.
    const above = this.cellState(wx, wy + 1, wz);
    let nL = C.l;
    let nS = C.s;
    if (C.s !== 1) {
      if (this.solid(below.b)) {
        nS = 1; // below solid → re-promote (level kept)
      } else if (above.b === Block.Water && above.l === 7) {
        nS = 1; // full-water support above → re-promote (level kept)
      } else {
        let best = -1;
        for (const [dx, dz] of HXZ) {
          const m = this.cellState(wx + dx, wy, wz + dz);
          if (m.b === Block.Water && m.l >= 1) best = Math.max(best, m.l - 1);
        }
        if (best < 1) {
          this.writeCell(wx, wy, wz, 0, 0, Block.Air); // starved: no support, no L7 above, no feed
          return;
        }
        nL = best; // decay toward the strongest horizontal feed (a non-source cell ≤ 6)
      }
    }
    this.writeCell(wx, wy, wz, nL, nS, Block.Water);

    // spread to horizontal neighbours at level-1. Two guards keep the load path cheap:
    // (1) never call writeCell into missing space — the state write there is a no-op, but
    // writeCell still re-marks the target's closure (self + HXZ + above), which includes
    // this cell; at a world edge that is a self-re-enqueue loop that sat every ocean
    // settle at the SETTLE_GUARD ceiling. (2) never re-level a pristine (l=0, s=0)
    // neighbour into a decaying slab that its own settle will discard — only water a
    // prior spread/fall already wrote (l>=1) may be re-leveled.
    if (nL >= 2) {
      for (const [dx, dz] of HXZ) {
        const tx = wx + dx, tz = wz + dz;
        const m = this.cellState(tx, wy, tz);
        if (m.b === Block.Air) {
          if (this.world.hasChunk(chunkOf(tx), chunkOf(wy), chunkOf(tz))) {
            this.writeCell(tx, wy, tz, nL - 1, 0, Block.Water);
          }
        } else if (m.b === Block.Water && m.s === 0 && m.l >= 1 && nL - 1 > m.l) {
          this.writeCell(tx, wy, tz, nL - 1, 0, Block.Water);
        }
      }
    }
  }

  // Process up to `budget` queued cells (insertion order); the remainder persists.
  // Does not clear `touched` — the caller drains it after re-meshing.
  tick(budget: number): number {
    let n = 0;
    while (n < budget) {
      const it = this.queue.values().next();
      if (it.done) break;
      const key = it.value as string;
      this.queue.delete(key);
      const [wx, wy, wz] = key.split(',').map(Number);
      this.process(wx, wy, wz);
      n++;
    }
    return n;
  }

  // On-load settle: bulk-seed every worldgen Water cell of the chunk as a level-7 source
  // (pass 1 of settleSeed, no per-cell queue work), then enqueue only the seeded cells
  // whose rule would already act (pass 2) and relax to a fixpoint (guarded). Idempotent
  // via the settled flag.
  // NOTE: does NOT clear `touched` — marks accumulate for the whole frame and the
  // frame-end drain (main.ts) is the sole consumer. Clearing here would drop marks
  // made by an EARLIER settle of the same frame: a seam chunk flooded across from it
  // keeps a stale pre-flood mesh (visible level steps / dry corners at chunk edges).
  settle(cx: number, cy: number, cz: number): Set<string> {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c || c.settled) return this.touched;
    this.settling = c; // during this settle, only c's own water may be modified (see the pristine-skip in process)
    this.settleSeed(c);
    let guard = 0;
    while (this.queue.size > 0 && guard < SETTLE_GUARD) {
      const it = this.queue.values().next();
      if (it.done) break;
      const key = it.value as string;
      this.queue.delete(key);
      const [wx, wy, wz] = key.split(',').map(Number);
      this.process(wx, wy, wz);
      guard++;
    }
    this.settling = null;
    this.equalizeAfterSettle(c);
    c.settled = true;
    return this.touched;
  }

  // The generated world's block at a cell, or -1 (impassable wall) for missing chunks /
  // out-of-band cells. Pocket searches must never walk into ungenerated space: it is an
  // infinite air void that would burn EQUALIZE_BUDGET and never settle (fills there are
  // no-ops anyway — setState cannot write to a missing chunk).
  private pocketBlock(x: number, y: number, z: number): number {
    this.stats.probes++;
    if (!this.inBand(y)) return -1;
    const c = this.world.getChunk(chunkOf(x), chunkOf(y), chunkOf(z));
    if (!c) return -1;
    return c.blocks[localIndex(x - c.cx * 16, y - c.cy * 16, z - c.cz * 16)];
  }

  // Bulk-fill air pockets that became connected to a large water body (sea/lake), up to
  // that body's surface level — connected vessels. Called from settle (seeds = generated
  // air cells below/next to the chunk's water) and edit (seed = the broken cell).
  // A pocket is filled only when: it fits in EQUALIZE_BUDGET (else the probe is incomplete
  // and the classification unsafe), the touching water body has more than SEA_BODY_MIN
  // cells, and a surface level H (a level-7 source cell with air above) was found during
  // the up-first body probe. Pockets above H keep their air; filled cells become level-7
  // sources and are re-marked (neighbouring water may have regained feed). Everything
  // else — sealed caves, tiny puddles, over-budget pockets, no surface found — is left
  // to the tick CA, which still trickles through a new opening as before.
  equalize(seeds: readonly (readonly [number, number, number])[]): void {
    const consumed = new Set<string>(); // region cells already walked by an earlier seed of this call
    let budget = EQUALIZE_PROBE_BUDGET; // per-call probe budget (see the constant's comment). Charges are
    // worst-case (a consumed-skip seed still charges 1), so the cap binds slightly tighter
    // than the stats.probes count — intentional.
    for (const [sx, sy, sz] of seeds) {
      budget -= 1;
      if (budget < 0) break; // exhausted: the remaining seeds are left to the CA trickle
      if (consumed.has(`${sx},${sy},${sz}`)) continue; // inside a region an earlier walk already refused or filled — re-walking it could only form sliver pockets
      if (this.pocketBlock(sx, sy, sz) !== Block.Air) continue; // not generated air: nothing to fill
      const pocket: number[] = []; // flat (x, y, z) triples, exploration order
      const body = new Set<string>(); // water cells 6-adjacent to the pocket
      let overflow = false;
      let starved = false;
      const seen = new Set<string>([`${sx},${sy},${sz}`]);
      const stack: [number, number, number][] = [[sx, sy, sz]];
      while (stack.length > 0) {
        // flat triple array — /3 converts entries to cell count; do not "simplify" to
        // `pocket.length >= EQUALIZE_BUDGET` (that compares entries to the budget,
        // silently dropping the cap to ~2730 cells)
        if (pocket.length / 3 >= EQUALIZE_BUDGET) { overflow = true; break; }
        budget -= NB6.length;
        if (budget < 0) { starved = true; break; } // mid-walk exhaustion: abandon this seed, stop taking more
        const [x, y, z] = stack.pop()!;
        pocket.push(x, y, z);
        for (const [dx, dy, dz] of NB6) {
          const nx = x + dx, ny = y + dy, nz = z + dz;
          const nb = this.pocketBlock(nx, ny, nz);
          if (nb === Block.Water) { body.add(`${nx},${ny},${nz}`); continue; }
          if (nb !== Block.Air) continue; // solid or wall: pocket boundary
          const key = `${nx},${ny},${nz}`;
          if (seen.has(key) || consumed.has(key)) continue;
          seen.add(key);
          stack.push([nx, ny, nz]);
        }
      }
      if (starved) break; // no fill, and no further seeds this call
      for (let i = 0; i < pocket.length; i += 3) consumed.add(`${pocket[i]},${pocket[i + 1]},${pocket[i + 2]}`); // claim the walked region (prefix on overflow)
      if (body.size === 0) continue; // not connected to any water: stays sealed and dry
      if (overflow) continue; // too big to classify safely: the CA trickle takes over
      // Probe the water body for its surface, up-first (up-neighbour pushed last, popped
      // first) so the top is reached in minimal hops even under BODY_BUDGET truncation.
      starved = false;
      let H = -1;
      let bodyCount = 0;
      const bseen = new Set<string>();
      const bstack: [number, number, number][] = [];
      for (const key of body) {
        const p = key.split(',');
        bseen.add(key);
        bstack.push([Number(p[0]), Number(p[1]), Number(p[2])]);
      }
      while (bstack.length > 0) {
        if (bodyCount >= BODY_BUDGET) break; // body is certainly large; H (if any) was already reached up-first
        budget -= 8; // one pop ≈ 8 probes (self, above, 6 neighbours)
        if (budget < 0) { starved = true; break; }
        const [x, y, z] = bstack.pop()!;
        const st = this.cellState(x, y, z);
        if (st.b !== Block.Water) continue;
        bodyCount++;
        this.stats.probes += 8;
        if (st.s === 1 && st.l === 7 && this.cellState(x, y + 1, z).b === Block.Air && y > H) H = y;
        if (bodyCount > SEA_BODY_MIN && H >= 0) break; // both decision gates are settled — stop burning the budget
        let up: [number, number, number] | null = null;
        const rest: [number, number, number][] = [];
        for (const [dx, dy, dz] of NB6) {
          const nx = x + dx, ny = y + dy, nz = z + dz;
          if (this.cellState(nx, ny, nz).b !== Block.Water) continue;
          const key = `${nx},${ny},${nz}`;
          if (bseen.has(key)) continue;
          bseen.add(key);
          if (dy === 1) up = [nx, ny, nz];
          else rest.push([nx, ny, nz]);
        }
        for (const n of rest) bstack.push(n);
        if (up) bstack.push(up);
      }
      if (starved) break; // no fill, and no further seeds this call
      if (H < 0 || bodyCount <= SEA_BODY_MIN) continue; // no sea/lake, or no surface found: leave to the CA
      for (let i = 0; i < pocket.length; i += 3) {
        const x = pocket[i], y = pocket[i + 1], z = pocket[i + 2];
        if (y > H) continue; // the pocket keeps its air above the body's surface
        this.setState(x, y, z, 7, 1, Block.Water);
        this.stats.equalizeFills++;
        this.enqueue(x, y, z);
      }
    }
  }

  // Settle-time equalization seeds: every GENERATED air cell 6-adjacent to the settling
  // chunk's water, EXCLUDING its above-neighbours — the air above a water surface is the
  // sky, connected forever, never a newly opened pocket, and searching it would burn the
  // pocket budget on every sea-chunk settle. (The edit() path seeds the broken cell
  // itself in all six directions; the same guards there make sky pockets no-ops too.)
  private equalizeAfterSettle(c: Chunk): void {
    const bx = c.cx * 16, by = c.cy * 16, bz = c.cz * 16;
    const seeds = new Map<string, [number, number, number]>();
    for (let lx = 0; lx < 16; lx++)
      for (let ly = 0; ly < 16; ly++)
        for (let lz = 0; lz < 16; lz++) {
          if (c.blocks[localIndex(lx, ly, lz)] !== Block.Water) continue;
          const wx = bx + lx, wy = by + ly, wz = bz + lz;
          for (const [dx, dy, dz] of NB6) {
            if (dy === 1) continue; // no above-neighbours (see method comment)
            const x = wx + dx, y = wy + dy, z = wz + dz;
            if (!this.inBand(y)) continue;
            if (this.cellState(x, y, z).b !== Block.Air) continue;
            seeds.set(`${x},${y},${z}`, [x, y, z]);
          }
        }
    if (seeds.size > 0) this.equalize([...seeds.values()]);
  }

  // A player edit (break = Air, place = new block). main.ts has already written the
  // block via world.setBlock (and re-meshed around it); this only syncs the sim's water
  // state — placing Water makes a level-7 source, a non-water block clears the cell's
  // state — then marks the cell + neighbours + above so dependents re-evaluate.
  edit(wx: number, wy: number, wz: number, block: number): void {
    if (!this.inBand(wy)) return;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    if (block === Block.Water) {
      c.wlevel[i] = 7;
      c.wsource[i] = 1;
    } else {
      c.wlevel[i] = 0;
      c.wsource[i] = 0;
    }
    this.queue.add(`${wx},${wy},${wz}`);
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
    if (block === Block.Air) {
      // A break may have connected a sealed pocket to a large water body (punching a
      // cave floor under the ocean): equalize now so the column fills instantly.
      this.equalize([[wx, wy, wz]]);
    }
  }
}
