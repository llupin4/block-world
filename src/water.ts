import { Block } from './blocks';
import { World, chunkOf, chunkKey, localIndex, WORLD_Y_MIN, WORLD_Y_MAX, type Chunk } from './world';

// WaterSim: the PROJECT.md §9 flow cellular automaton. Pure TS (no three) so vitest
// drives it in node, mirroring how streaming.ts is tested. State (wlevel/wsource/wflow)
// lives in the chunk, so it streams with the chunk: a missing neighbour chunk reads
// as dry and is not a spread escape; a falling cell whose destination is
// out-of-band or missing is destroyed (falls out of the world).
//
// Model: SOURCES (wsource=1) are immortal and keep spreading. Sources are created ONLY by
// placing a water block — water that falls from a source lands as FLOW (this is what
// keeps a plugged cave drainable: the sea water that poured in through a hole carries no
// source bit of its own). Everything that is not a source is FLOW: it spreads and rests,
// and it is SUSTAINED (wflow=1) while it can reach a source through the water body
// (6-neighbour reachability; the flag updates locally cell-by-cell and is re-derived
// globally by runAudit after any water-removing edit). Flow that loses all reachability
// — a plugged hole, a sealed pocket, a removed source — starves away at the slow-clock
// pace, one cell per processed update: plug the hole and the cave you flooded empties
// itself, visibly.

const HXZ: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB6: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0],
]; // 6-neighbour water adjacency: reachability (sustained-flow BFS) walks vertically too
const SETTLE_GUARD = 20000; // safety valve: cap on cell updates one settle run may perform
const MIN_CY = 0; // lowest GENERATED y band (streaming's CY_MIN): below it is ungenerated world floor — a fall through it drains (legitimate), a settle above it defers

interface CellState { b: number; l: number; s: number; f: number }
const DRY: CellState = { b: Block.Air, l: 0, s: 0, f: 0 };

export class WaterSim {
  private readonly world: World;
  private readonly queue = new Set<string>(); // insertion-ordered FIFO with dedup
  readonly touched = new Set<string>(); // chunk keys whose geometry changed (for re-mesh)
  // Work counters, pinned by src/__tests__/water-load.test.ts (the load-path budget
  // regression). `queueAdds` counts re-mark *events* (one per enqueue() call; each
  // re-marks self + 4 horizontal + above, the same closure writeCell re-marks).
  readonly stats = { seeds: 0, processes: 0, queueAdds: 0, equalizeFills: 0 };
  private settling: Chunk | null = null; // chunk whose settle is in flight (exempts its own water from the pristine-skip in process)
  private auditPending = false; // a water-removing edit happened: re-derive sustained-flow flags globally on the next tick/settle

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
    return { b: c.blocks[i], l: c.wlevel[i], s: c.wsource[i], f: c.wflow[i] };
  }

  // Write a cell's full state. Only records the chunk in `touched` when the *block*
  // actually changed (level changes alone never re-mesh: levels don't render).
  private setState(wx: number, wy: number, wz: number, l: number, s: number, b: number, f: number): void {
    if (!this.inBand(wy)) return;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    c.wlevel[i] = l;
    c.wsource[i] = s;
    c.wflow[i] = f;
    if (c.blocks[i] !== b) {
      if (this.world.setBlock(wx, wy, wz, b)) this.touched.add(chunkKey(c.cx, c.cy, c.cz));
    }
  }

  // Write only when state differs, then re-mark the cell + 4 horizontal neighbours +
  // the cell above (a below cell is never re-marked from above: a resting level is a
  // function of horizontal + above, and a changing below re-triggers via this rule).
  private writeCell(wx: number, wy: number, wz: number, l: number, s: number, b: number, f: number = 0): void {
    const c = this.cellState(wx, wy, wz);
    if (c.b === b && c.l === l && c.s === s && c.f === f) return;
    this.setState(wx, wy, wz, l, s, b, f);
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
  // Air). A pristine l=0 neighbour is never an action target (spread writes Air only), and
  // interior ocean cells trigger neither and are never processed. Every later state change
  // still goes through writeCell (which re-marks dependents), so the worklist stays closed
  // and converges to the same fixpoint as per-cell seeding did.
  private settleSeed(c: Chunk): void {
    const bx = c.cx * 16, by = c.cy * 16, bz = c.cz * 16;
    for (let i = 0; i < c.blocks.length; i++) {
      if (c.blocks[i] !== Block.Water) continue;
      if (c.wlevel[i] === 7 && c.wsource[i] === 1) continue; // already a source
      c.wlevel[i] = 7;
      c.wsource[i] = 1;
      c.wflow[i] = 0; // worldgen water becomes source; the sustained flag is flow-only
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
            if (m.b === Block.Air) { this.enqueue(wx, wy, wz); break; }
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
      // In-band space whose chunk is not generated YET also reads as Air; falling into it
      // would destroy C out of a hole that does not exist (streaming loads bands in
      // arbitrary order). Known space = the band below is loaded, or the fall exits the
      // generated world below its floor (legitimate drain).
      const belowKnown = wy - 1 < MIN_CY * 16 || this.world.hasChunk(chunkOf(wx), chunkOf(wy - 1), chunkOf(wz));
      if (!belowKnown) return; // wait: the low band's settle (cascade) or a re-mark retries us
      this.writeCell(wx, wy, wz, 0, 0, Block.Air); // dry origin, re-marked
      if (wy - 1 >= MIN_CY * 16 && this.world.hasChunk(chunkOf(wx), chunkOf(wy - 1), chunkOf(wz))) {
        this.writeCell(wx, wy - 1, wz, 7, 0, Block.Water, C.f); // land at level 7 as FLOW: only placement creates sources (a source that fell is no longer its own supply)
      } // else: destination below the generated floor → destroyed (fell out of the world)
      return;
    }

    // resting: below is not air. Levels are a constant 7 for every live water cell (cosmetic
    // in the POC — they do not render, and nothing decays, so resting water is a zero-cost
    // fixpoint). Sources (s=1) are immortal. A flow cell (s=0) is alive while sustained:
    // some 6-neighbour is a source or a sustained flow cell (reachability through the
    // water body; the wflow flag updates locally per cell and runAudit re-derives it
    // globally after any water-removing edit). Without reachability — a plugged hole, a
    // sealed pocket, a removed source — the cell starves away at the slow-clock pace:
    // plug the hole and the cave you flooded empties itself, visibly.
    let nF = C.f;
    if (C.s !== 1 && C.l >= 1) {
      let sus = 0;
      for (const [dx, dy, dz] of NB6) {
        const m = this.cellState(wx + dx, wy + dy, wz + dz);
        if (m.b === Block.Water && (m.s === 1 || m.f === 1)) { sus = 1; break; }
      }
      if (sus === 0) {
        this.writeCell(wx, wy, wz, 0, 0, Block.Air, 0); // starved: cut off from every source
        return;
      }
      nF = 1;
    }
    if (nF !== C.f) this.writeCell(wx, wy, wz, C.l, C.s, Block.Water, nF);

    // spread to horizontal AIR neighbours — unlimited range (water is always level 7;
    // terrain and reachability, not levels, bound it). Two guards keep the load path
    // cheap: (1) never call writeCell into missing space — a state write there is a
    // no-op, but the re-mark of the target's closure (self + HXZ + above) includes this
    // cell; at a world edge that is a self-re-enqueue loop that sat every ocean settle
    // at the SETTLE_GUARD ceiling. (2) spread targets AIR only: a loaded-unsettled
    // neighbour's pristine worldgen water is never touched — its own settle re-seeds it.
    for (const [dx, dz] of HXZ) {
      const tx = wx + dx, tz = wz + dz;
      if (this.cellState(tx, wy, tz).b === Block.Air) {
        if (this.world.hasChunk(chunkOf(tx), chunkOf(wy), chunkOf(tz))) {
          this.writeCell(tx, wy, tz, 7, 0, Block.Water, 0);
        }
      }
    }
  }

  // Process up to `budget` queued cells (insertion order); the remainder persists.
  // Does not clear `touched` — the caller drains it after re-meshing. If a water-removing
  // edit is pending, its reachability audit runs first (it is free work: the starves it
  // schedules then drain through the normal budget, one cell per update).
  tick(budget: number): number {
    let n = 0;
    while (n < budget) {
      if (this.auditPending) {
        this.auditPending = false;
        this.runAudit();
        continue;
      }
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

  // Re-derive the sustained-flow flags from scratch: BFS from every source through the
  // water body (6-neighbour adjacency; pristine l=0 worldgen water counts as connectivity
  // but is never touched — its own settle re-seeds it as a source). Flow cells that end
  // up unreachable from every source get wflow=0 and are starved away by process() at
  // the slow-clock pace. One sweep is exact for a removal event: the reachable set is
  // stable under the deaths of the unreachable cells (a path through a dead cell never
  // existed), so no further sweeps are needed for the cascade it schedules.
  private runAudit(): void {
    const seen = new Set<number>();
    const stack: number[] = [];
    const pack = (x: number, y: number, z: number): number => ((x + 8192) << 28) | ((y + 8192) << 14) | (z + 8192); // 14-bit fields: exact in a double for |coord| < 8192 (streaming world around the spawn)
    for (const c of this.world.allChunks()) {
      const bx = c.cx * 16, by = c.cy * 16, bz = c.cz * 16;
      for (let i = 0; i < c.blocks.length; i++) {
        if (c.blocks[i] === Block.Water && c.wsource[i] === 1) {
          const k = pack(bx + (i % 16), by + ((i / 256) | 0), bz + (((i / 16) | 0) % 16));
          if (!seen.has(k)) { seen.add(k); stack.push(k); }
        }
      }
    }
    while (stack.length > 0) {
      const k = stack.pop()!;
      const wz = (k & 16383) - 8192;
      const wy = (((k >> 14) & 16383) - 8192);
      const wx = (((k >> 28) & 16383) - 8192);
      for (const [dx, dy, dz] of NB6) {
        const nx = wx + dx, ny = wy + dy, nz = wz + dz;
        if (ny < WORLD_Y_MIN || ny >= WORLD_Y_MAX) continue;
        const ck = this.world.getChunk(chunkOf(nx), chunkOf(ny), chunkOf(nz));
        if (!ck) continue;
        const nloc = localIndex(nx - ck.cx * 16, ny - ck.cy * 16, nz - ck.cz * 16);
        if (ck.blocks[nloc] !== Block.Water) continue;
        const nk = pack(nx, ny, nz);
        if (!seen.has(nk)) { seen.add(nk); stack.push(nk); }
      }
    }
    // Apply the flags: reachable flow re-asserts wflow=1, unreachable flow drops to 0.
    // The enqueue (no state write) re-marks each changed cell's closure so process()
    // re-reaches it — starves then proceed through the slow-clock budget.
    for (const c of this.world.allChunks()) {
      const bx = c.cx * 16, by = c.cy * 16, bz = c.cz * 16;
      for (let i = 0; i < c.blocks.length; i++) {
        if (c.blocks[i] !== Block.Water || c.wsource[i] === 1 || c.wlevel[i] < 1) continue;
        const wx = bx + (i % 16), wy = by + ((i / 256) | 0), wz = bz + (((i / 16) | 0) % 16);
        const k = pack(wx, wy, wz);
        const want = seen.has(k) ? 1 : 0;
        if (c.wflow[i] !== want) {
          c.wflow[i] = want;
          this.enqueue(wx, wy, wz);
        }
      }
    }
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
    if (this.auditPending) {
      this.auditPending = false;
      this.runAudit(); // a water-removing edit may have starved water this settle would re-seed
    }
    // The band below must already exist (or we are the lowest generated band): settling this
    // chunk while its bottom neighbours read as missing space makes its bottom water
    // "fall" out of the still-unloaded world and be destroyed through a hole that does
    // not exist — the ocean top row is then gone forever (the visible raised/stepped
    // ocean sections at spawn, from streaming loading a high band before its low band).
    // Defer: the low band's settle (below) cascades upward and settles this one.
    if (cy > MIN_CY && !this.world.hasChunk(cx, cy - 1, cz)) return this.touched;
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
    c.settled = true;
    // Wake the band above: its bottom water rests on this band's top row, so its settle
    // (deferrals, re-relaxation) can only be correct once we exist.
    const up = this.world.getChunk(cx, cy + 1, cz);
    if (up && !up.settled) this.settle(cx, cy + 1, cz);
    return this.touched;
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
    const wasWater = c.wlevel[i] >= 1 || c.wsource[i] === 1;
    if (block === Block.Water) {
      c.wlevel[i] = 7;
      c.wsource[i] = 1;
    } else {
      c.wlevel[i] = 0;
      c.wsource[i] = 0;
    }
    c.wflow[i] = 0;
    this.queue.add(`${wx},${wy},${wz}`);
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
    if (wasWater && block !== Block.Water) this.auditPending = true; // water removed: re-derive reachability on the next pulse
  }
}
