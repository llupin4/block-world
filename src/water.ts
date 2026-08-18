import { Block, BLOCKS } from './blocks';
import { World, chunkOf, chunkKey, localIndex, WORLD_Y_MIN, WORLD_Y_MAX, type Chunk } from './world';

// WaterSim: the PROJECT.md §9 flow cellular automaton. Pure TS (no three) so vitest
// drives it in node, mirroring how streaming.ts is tested. State (wlevel/wsource/wplaced/
// wstream) lives in the chunk, so it streams with the chunk: a missing neighbour chunk
// reads as dry and is not a spread escape; water at the bottom row of the generated world
// rests on the void (stable), and a fall that stopped at not-yet-generated space is
// re-checked every pulse until the low band loads.
//
// Model (LOCAL RE-DERIVATION — no provenance is tracked): a water cell stores only its own
// state — full water (wsource=1, a source) or flow, plus a level (1..7, render-cosmetic).
// Nothing remembers "which source fed me". When a flow cell is re-evaluated it re-derives
// its level from its neighbourhood:
//   level 7 — it is a PLACED spring (wplaced=1), or level-7 water sits directly above it
//            (flow landing on / pouring into it from above: a column's bottom, a floor
//            sheet under an active fall — what keeps a sheet under a live stream full and
//            pushing);
//   7 − d   — the nearest FEED is d hops away (bounded 6-neighbour probe, through the
//            water body), where a feed is a placed spring (any direction — its fan) or a
//            level-7 FLOW cell at the same level or above (a landed sheet centre, a
//            column's cells). A level-7 flow cell strictly below is never a feed —
//            otherwise a cut-off pool's sheet bottom would keep feeding its own side
//            cells forever. Worldgen water (the sea, natural lakes: s=1, p=0) is NEVER a
//            feed — the sea stands, it does not push;
//   level 0 — no feed within 6 hops: the cell re-derives to DRY.
// That is the entire decay mechanism: a FLOW cell exists only because of its source.
// Remove the spring (or plug the breach that feeds a stream) and the level wave re-
// derives the disconnected body to air, cell by cell, as the dirty closure re-evaluates —
// no global reachability audit, no per-cell "sustained" flag, no origin coordinate, and no
// frozen leftovers: a plugged cave drains itself completely, and a player pool at the
// shoreline drains ALL of it even though the static sea touches it. Two flows that merge
// into one body share that body's level field: the probe simply finds the strongest feed,
// and the merged water "belongs" to nothing.
//
// SOURCES are immortal (they never decay and re-derive to themselves). Two kinds: a
// PLACED source (wplaced=1, created only by the player placing a water block, or
// regenerated within a placed body) is a STATIC block — it never falls (not even alone
// in the sky) and pours no column through the space below itself; its only emission is a
// side halo into horizontal Air, and the halo's water then falls off edges by the
// ordinary flow rules. It is the only water the player can break, and breaking it (and
// whatever body it belongs to) is the way to stop the flow it feeds. A placed source
// also regenerates missing source cells in its body (a one-cell hole S . S → S S S, when
// the hole is part of the body; a missing corner of S S / S . closes), so a body of
// placed water behaves as one still body: a pool on flat
// ground makes a bounded still halo and sits; a body in the air leaks thin drips off its
// edges only, its underside stays dry; a lone source in the sky is one static block with
// a drip running off each exposed side. A SETTLED worldgen source (the sea, re-seeded on
// load) is static too — it stands, falls, and pours through gaps in its support, but
// never emits, never grows, and never feeds flow, so the sea does not fill caves, no
// placed block can raise its level, and a player pool cannot use it to stay alive.
//
// Consequences the local rule produces (all user-accepted):
//   - a disconnected body (spring mined, hole plugged) genuinely empties: every flow cell
//     runs out of feed within 6 hops and re-derives to dry — a plugged cave drains itself,
//     a springless fan dries to the last cell, a shoreline pool dries even with the sea
//     beside it;
//   - source water is immortal: the sea, natural cave lakes, and every spring the player
//     leaves in place persist on their own forever;
//   - water over sea or a deep pool disappears into it (a deep fall is absorbed one block
//     above the surface and writes nothing); flow that lands one deep over a source body
//     (a one-deep sea, a cave lake) rides its surface and dries with its own feed —
//     nothing is ever adopted into a source body, so no body's level ever rises and a cut
//     off flow is never left behind as an immortal source over the sea;
//
// RANGE: wlevel is a real (render-cosmetic) decay number: every fresh start is level 7; a
// water cell spreads sideways to Air only at level >= 2, and the neighbour it writes is at
// level-1. So a level-7 cell's flood reaches ~6 blocks out — a rounded fan (4-way
// spread) — and a fall (pour or drop) writes the parcel back at level 7, so water always
// prefers to run down a slope: a hillside spring fans out a few blocks, then runs off
// down to the next ledge instead of flooding the whole contour. Levels do not render (a
// cell is always a full-height quad).
//
// Waterfalls: water spreads downward through nearby air blocks until stopped by a block.
// Any water cell with air below is either a HEAD — water directly above it (a column
// feeding down) or beside it (a spring's sideways push, a sea surface edge, a sheet edge):
// it stays put and pours the whole column down through the gap in one deterministic pass
// (dropColumn) — or a lone falling parcel (no water around it): it falls the whole column
// at once, and a source parcel keeps its source flag where it lands (a falling worldgen
// lake is still a lake). The placed spring's pour is the only emission that creates new
// cells from nothing, so it is re-checked every pulse. Where a column lands: on solid
// ground or the world floor the bottom cell rests as a sheet (while a live fall keeps
// pouring into it, its level re-derives to full and it pushes its bounded floor fan out),
// everything above it RIDEs (wstream=1: visible waterfall cells that spread nothing and
// can never climb a pool, fill a basin or raise the sea); landing on another water body
// one deep over solid joins it; reaching anything deeper (the sea, a deep pool) is
// absorbed one block above the surface (no blink, no level rise); landing one deep over a
// source body (a one-deep sea, a cave lake) rides its surface like still water and dries
// with its feed — nothing is adopted into a source body. A rider stays a rider only
// while something alive
// holds it — flow above it, or a spring / active column alongside it; when the emitter is
// gone the dead column top resets to resting water and re-derives, so a frozen column can
// never outlive its source, and a settled column is a true fixpoint (writes nothing,
// re-marks nothing).

const HXZ: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB6: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0],
]; // 6-neighbour water adjacency: the feed probe walks vertically too (full-level flow at or above the probe's level, reached through the body, is a feed — a sheet centre under a stream, a column's own cells)
const SETTLE_GUARD = 2000; // safety valve: cap on cell updates one settle run may perform — ~5–10 ms of work so a chunk's settle never owns a full frame; a cave that is still mid-fill when the cap hits keeps relaxing through later slow-clock ticks (the queue is closed and persistent)
const MIN_CY = 0; // lowest GENERATED y band (streaming's CY_MIN): below it is ungenerated world floor — a fall through it drains (legitimate), a settle above it defers

interface CellState { b: number; l: number; s: number; p: number; st: number }
const DRY: CellState = { b: Block.Air, l: 0, s: 0, p: 0, st: 0 };

export class WaterSim {
  private readonly world: World;
  private readonly queue = new Set<string>(); // insertion-ordered FIFO with dedup
  readonly touched = new Set<string>(); // chunk keys whose geometry changed (for re-mesh)
  // Work counters, pinned by src/__tests__/water-load.test.ts (the load-path budget
  // regression). `queueAdds` counts re-mark *events* (one per enqueue() call; each
  // re-marks self + 4 horizontal + above, the same closure writeCell re-marks).
  readonly stats = { seeds: 0, processes: 0, queueAdds: 0, equalizeFills: 0 };
  private settling: Chunk | null = null; // chunk whose settle is in flight (exempts its own water from the pristine-skip in process)
  private waiting = new Set<string>(); // cells whose fall stopped at not-yet-generated space below: re-checked every pulse until the low band loads (their column then extends)
  private springs = new Set<string>(); // live PLACED sources (springs), including regenerated ones: re-queued at every pulse's start so a source keeps re-emitting its side halo (a sky source drips off each side forever, a wall source keeps dripping through whatever gap is open beside it) — maintained by edit() and healSourceBody()

  constructor(world: World) {
    this.world = world;
  }

  private solid(b: number): boolean {
    return b !== Block.Air && BLOCKS[b].solid;
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
    return { b: c.blocks[i], l: c.wlevel[i], s: c.wsource[i], p: c.wplaced[i], st: c.wstream[i] };
  }

  // Write a cell's full state. Only records the chunk in `touched` when the *block*
  // actually changed (level/flag changes alone never re-mesh: they don't render).
private setState(wx: number, wy: number, wz: number, l: number, s: number, b: number, p: number, st: number): void {
    if (!this.inBand(wy)) return;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    c.wlevel[i] = l;
    c.wsource[i] = s;
    c.wplaced[i] = p;
    c.wstream[i] = st;
    if (c.blocks[i] !== b) {
      if (this.world.setBlock(wx, wy, wz, b)) this.touched.add(chunkKey(c.cx, c.cy, c.cz));
    }
  }

  // Write only when state differs, then re-mark the cell + its 6 neighbours: the horizontal
  // four (they spread from / receive flow into this cell), the cell above (its support and
  // level depend on this cell) and the cell below (a resting level re-derives from the flow
  // above it; a rider below must re-evaluate when its support changes). The closure is what
  // lets a cut-off body drain end to end: every state change invalidates every cell whose
  // re-derivation could differ.
  private writeCell(wx: number, wy: number, wz: number, l: number, s: number, b: number, p: number = 0, st: number = 0): void {
    const c = this.cellState(wx, wy, wz);
    if (c.b === b && c.l === l && c.s === s && c.p === p && c.st === st) return;
    this.setState(wx, wy, wz, l, s, b, p, st);
    this.queue.add(`${wx},${wy},${wz}`);
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
    this.queue.add(`${wx},${wy - 1},${wz}`); // resting levels re-derive from the flow above; riding cells below must re-evaluate
  }

  // Re-mark exactly the cells writeCell re-marks (self + 6 neighbours), without
  // writing state: pass-2 settle seeding uses this to pull dependent cells back into the
  // queue.
  private enqueue(wx: number, wy: number, wz: number): void {
    this.queue.add(`${wx},${wy},${wz}`);
    this.stats.queueAdds++;
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
    this.queue.add(`${wx},${wy - 1},${wz}`);
  }

  // Two-pass seed (the load-path fix): pass 1 bulk-writes every worldgen Water cell of the
  // chunk to (level 7, source) straight into the chunk arrays — no per-cell state read, no
  // queue write, no re-mark. Pass 2 enqueues ONLY a seeded cell whose rule would act on its
  // neighbours at seed time: a fall (below is Air) or a spread (an HXZ neighbour that is
  // Air). A pristine l=0 neighbour is never an action target (spread writes Air only), and
  // interior ocean cells trigger neither and are never processed. In-chunk neighbours read
  // the chunk's own arrays directly (no chunk lookup, no closure): only boundary cells pay
  // a cross-chunk read, so a full-water band settles in O(chunk) cheap reads — deeper
  // oceans no longer slow the load. Every later state change still goes through writeCell
  // (which re-marks dependents), so the worklist stays closed and converges to the same
  // fixpoint as per-cell seeding did.
  private settleSeed(c: Chunk): void {
    const bx = c.cx * 16, by = c.cy * 16, bz = c.cz * 16;
    for (let i = 0; i < c.blocks.length; i++) {
      if (c.blocks[i] !== Block.Water) continue;
      if (c.wlevel[i] === 7 && c.wsource[i] === 1) continue; // already a source
      c.wlevel[i] = 7;
      c.wsource[i] = 1;
      c.wplaced[i] = 0; // worldgen water is a STATIC source (stands, falls, pours; never pushes) — never a spring
      c.wstream[i] = 0; // not riding anything: worldgen water stands on its own
      this.stats.seeds++;
    }
    const edgeAir = (ncx: number, ncz: number, lx2: number, ly2: number, lz2: number): boolean => {
      const n = this.world.getChunk(ncx, c.cy, ncz);
      if (!n) return true; // missing chunk reads as dry Air
      return n.blocks[localIndex(lx2, ly2, lz2)] === Block.Air;
    };
    for (let ly = 0; ly < 16; ly++)
      for (let lz = 0; lz < 16; lz++)
        for (let lx = 0; lx < 16; lx++) {
          const i = lx + lz * 16 + ly * 256;
          if (c.blocks[i] !== Block.Water) continue;
          const wx = bx + lx, wy = by + ly, wz = bz + lz;
          // fall trigger: the below cell reads Air (in-chunk directly, or the band below)
          if (ly > 0) {
            if (c.blocks[i - 256] === Block.Air) { this.enqueue(wx, wy, wz); continue; }
          } else {
            const lo = this.world.getChunk(c.cx, c.cy - 1, c.cz);
            if (wy - 1 < WORLD_Y_MIN || wy - 1 >= WORLD_Y_MAX || !lo || lo.blocks[localIndex(lx, 15, lz)] === Block.Air) { this.enqueue(wx, wy, wz); continue; }
          }
          // spread trigger: an HXZ neighbour reads Air
          let hit = false;
          if (lx > 0 && c.blocks[i - 1] === Block.Air) hit = true;
          else if (lx < 15 && c.blocks[i + 1] === Block.Air) hit = true;
          else if (lz > 0 && c.blocks[i - 16] === Block.Air) hit = true;
          else if (lz < 15 && c.blocks[i + 16] === Block.Air) hit = true;
          else if (lx === 0 && edgeAir(c.cx - 1, c.cz, 15, ly, lz)) hit = true;
          else if (lx === 15 && edgeAir(c.cx + 1, c.cz, 0, ly, lz)) hit = true;
          else if (lz === 0 && edgeAir(c.cx, c.cz - 1, lx, ly, 15)) hit = true;
          else if (lz === 15 && edgeAir(c.cx, c.cz + 1, lx, ly, 0)) hit = true;
          if (hit) this.enqueue(wx, wy, wz);
        }
  }

// one update: process one water cell to its rule-driven action.
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
    if (C.p === 1) {
      // A placed source is a STATIC block: it never falls and it pours no column through
      // the space below itself. Its only emission is a SIDE halo into whatever Air is
      // beside it (level-1 less); that water then falls/spreads by the ordinary flow
      // rules — a lone source in the sky keeps a thin drip running off each side, a
      // source pool on flat ground makes a bounded still halo and sits, and a body of
      // placed water in the air leaks only thin drips off its edges (its underside stays
      // dry). It also regenerates missing source cells within its own body
      // (healSourceBody) so a placed-water body behaves as one still body. Re-checked
      // every pulse via the springs set, which is what keeps a halo that is blocked
      // (a block placed in its gap) pouring again once the gap reopens. Worldgen sources
      // (the sea: p=0) do NOT emit — they fall and pour through gaps in their support
      // like any water, and they never grow.
      this.healSourceBody(wx, wy, wz); // heal BEFORE the halo spreads, or the halo would fill a gap as flow before it could heal to a source
      this.spreadToAir(wx, wy, wz, C.l);
      return;
    }
    const below = this.cellState(wx, wy - 1, wz);
    if (below.b === Block.Air && wy > MIN_CY * 16) {
      // In-band space whose chunk is not generated YET also reads as Air; falling into it
      // would write a column through a hole that does not exist (streaming loads bands in
      // arbitrary order). Known space = the band below is loaded, or the fall exits the
      // generated world below its floor (the world-floor case rests instead — see below).
      const belowKnown = wy - 1 < MIN_CY * 16 || this.world.hasChunk(chunkOf(wx), chunkOf(wy - 1), chunkOf(wz));
      if (!belowKnown) { this.waiting.add(`${wx},${wy},${wz}`); return; } // waiting on the low band: re-checked every pulse
      // Water directly above (a column feeding down), or water in a horizontal neighbour
      // (a lake edge, a sea surface cell, or the flow from an emitter/sheet beside it)
      // makes this cell a WATERFALL HEAD: it stays put and pours down through the gap —
      // true for flowing water and for settling worldgen source alike. The head keeps
      // its own flags (a worldgen lake edge that pours is still a source); only the water
      // it pours is new flow. A cell with no water anywhere around it is a lone falling
      // parcel: it falls the whole column in one pass — a source parcel keeps its source
      // flag (a falling worldgen lake is still a lake where it lands); a flow parcel
      // lands as a sheet that dries once whatever fed it cuts off.
      let fed = this.cellState(wx, wy + 1, wz).b === Block.Water;
      if (!fed) {
        for (const [dx, dz] of HXZ) {
          const m = this.cellState(wx + dx, wy, wz + dz);
          if (m.b === Block.Water) { fed = true; break; }
        }
      }
      if (fed) {
        this.dropColumn(wx, wy - 1, wz, 0, 0);
        this.queue.add(`${wx},${wy - 1},${wz}`);
        return;
      }
      this.writeCell(wx, wy, wz, 0, 0, Block.Air); // dry origin, re-marked
      this.dropColumn(wx, wy - 1, wz, C.s, 0); // instantaneous full-column drop
      return;
    }

    // resting: below is not air — or this is the bottom row of the generated world (water at
    // the world floor rests on the void: stable, no per-pulse blink at the world edge).
    if (C.s === 1) {
      // A resting worldgen source (the sea, a worldgen lake; re-seeded on load) is
      // static: it stands here and pushes nothing — the sea never erupts into cave air
      // and never grows. Placed sources (p=1) were already handled above (they emit).
      return;
    }

    if (below.b === Block.Water) {
      // Flow over a water body — including a SOURCE body (the sea, a cave lake, the
      // player's placed-water base). Nothing is ever ADOPTED into a source body: water
      // that lands on one rides its surface while something alive holds it (a fall still
      // pouring into it), and once its own feed is cut it re-derives to dry (a source body
      // never FEEDS flow — the sea stands; a placed body's flow dies with its springs).
      // That is what keeps a body's level from ever rising and guarantees no falling flow
      // is left behind as an immortal source above the sea when the player breaks their
      // water.
      // Otherwise this cell either RIDES its support — one deep on solid ground (a pool
      // sheet), over another falling column, or over water at the world floor (a column
      // base over the void): a visible waterfall segment that spreads nothing, so it cannot
      // climb a pool, fill a basin or raise a body — or it is deep over anything lower than
      // the surface (a body whose surface is below this cell): it is absorbed and
      // disappears, so no water body's level ever rises.
      const bb = this.cellState(wx, wy - 2, wz);
      const rides = below.st === 1 || below.l === 7 || wy - 2 < MIN_CY * 16 || this.solid(bb.b);
      if (!rides) {
        this.writeCell(wx, wy, wz, 0, 0, Block.Air); // disappears into the water body
        return;
      }
      // A rider stays a rider only while something ALIVE holds it: flow pouring into it
      // from above (it is mid-column), or, at the top, live flow alongside — a spring
      // pushing sideways (a wall spring's head) or a column segment whose own above is
      // still water (an active fall). When nothing alive holds it (its spring was mined,
      // its column dried) it is the dead top: reset to resting and re-derive on the next
      // pass — with no feed in reach it dries, and the column follows (a flow only exists
      // because of its source). The state write re-marks the full closure.
      let held = this.cellState(wx, wy + 1, wz).b === Block.Water;
      if (!held) {
        for (const [dx, dz] of HXZ) {
          const m = this.cellState(wx + dx, wy, wz + dz);
          if (m.b !== Block.Water) continue;
          if (m.p === 1) { held = true; break; }
          if (m.l === 7 && m.st === 1 && this.cellState(wx + dx, wy + 1, wz + dz).b === Block.Water) { held = true; break; }
        }
      }
      if (held) {
        // Held in place: a pure waterfall segment (a side-fed head, a mid-column cell).
        // Writes NOTHING and re-marks NOTHING: a settled column is a true fixpoint. The
        // cells that can change this one re-queue IT when they change (writeCell's closure
        // reaches its support below and its flow above; an edit re-marks the full
        // closure), so no proactive re-marking is needed — and none is done.
        return; // riding: no spread, ever
      }
      if (C.st === 1) {
        this.writeCell(wx, wy, wz, C.l, C.s, Block.Water, C.p, 0);
        return;
      }
      // already resting: fall through to the re-derivation below
    }

    // over solid ground, the world floor, or a rider that just reset: this cell RESTS on
    // its own. Re-derive its level (the local rule; no provenance is stored or consulted).
    // A PLACED spring (p=1) is a feed in any direction: it sustains a 6-hop body of flow
    // (its bounded fan). Worldgen water (the sea, natural lakes) is NOT a feed: it stands,
    // falls and pours, but it can only be reached through other water that itself lives —
    // which is why a player pool touching the ocean drains completely once its spring goes
    // (the reported "still can't stop it at the shoreline"). A FLOW cell re-derives to
    // full level 7 when level-7 water is directly above it (flow landing on / pouring into
    // it from above: a column's bottom, a sheet under an active fall) — that is what keeps
    // a floor sheet under a live stream full and pushing. Otherwise its level is
    // 7 − hops to the nearest feed through the water body (6-hop range), and with no feed
    // in reach it re-derives to dry: a cut-off flow only exists because of its source, so
    // a cut-off pool empties completely instead of freezing forever.
    let target = this.feedLevel(wx, wy, wz, C);
    if (target === 0) {
      this.writeCell(wx, wy, wz, 0, 0, Block.Air); // re-derived dry: no source in reach
      this.queue.add(`${wx},${wy - 1},${wz}`); // whatever rode on this cell must now be re-evaluated
      return;
    }
    if (target !== C.l || C.st !== 0) {
      this.writeCell(wx, wy, wz, target, C.s, Block.Water, C.p, 0); // resting again: clear the riding flag, re-mark the closure
      if (target > C.l) this.queue.add(`${wx},${wy - 1},${wz}`); // rose toward full level: what rides on it may now be fed
    }
    if (target >= 2) this.spreadToAir(wx, wy, wz, target);
  }

// The re-derived level of a resting flow cell (see the rest branch for the rules):
    //   7 — it is a placed spring, or level-7 water is directly above it (flow landings:
    //       a column's bottom, a sheet under an active fall);
    //   7 − d — the nearest feed is d hops away through the water, where a feed is a placed
    //           spring (any direction — its fan) or a level-7 FLOW cell at the same level or
    //           above (a landed sheet centre, a column's cells: full water that sits on top
    //           of the probing cell's body and can push it). A level-7 cell STRICTLY BELOW
    //           is never a feed — otherwise a cut-off pool's sheet would keep feeding itself
    //           through its own bottom; and worldgen water (s=1, p=0) is never a feed —
    //           the sea stands, it does not push.
    //   0 — no feed within 6 hops (the cell dries).
    private feedLevel(wx: number, wy: number, wz: number, C: CellState): number {
    if (C.p === 1) return 7;
    const above = this.cellState(wx, wy + 1, wz);
    if (above.b === Block.Water && above.l === 7) return 7;
    const seen = new Set<string>([`${wx},${wy},${wz}`]);
    let frontier: string[] = [`${wx},${wy},${wz}`];
    for (let d = 1; d <= 6; d++) {
      const next: string[] = [];
      for (const key of frontier) {
        const [x, y, z] = key.split(',').map(Number);
        for (const [dx, dy, dz] of NB6) {
          const nx = x + dx, ny = y + dy, nz = z + dz;
          const k = `${nx},${ny},${nz}`;
          if (seen.has(k)) continue;
          seen.add(k);
          const m = this.cellState(nx, ny, nz);
          if (m.b !== Block.Water) continue;
          if (m.p === 1 || (m.s === 0 && m.l === 7 && ny >= wy)) {
            return 7 - d;
          }
          next.push(k);
        }
      }
      frontier = next;
      if (frontier.length === 0) return 0; // the water body is exhausted: no feed at all
    }
    return 0; // water body deeper than 6 hops from any feed: out of reach → dry
  }

  // Source regeneration (the infinite-source rules): a body of placed water heals its own
  // one-cell holes so it behaves as one still body, not a set of independent drippers.
  //   (a) source above + a placed source alongside the Air below it → that Air becomes a
  //       source: the missing corner of  S S / S .  closes, and a one-cell pocket inside
  //       the body fills in.
  //   (b) a placed source flanking one cell of Air with a placed source at the far side
  //       of the gap → the gap becomes a source:  S . S  becomes  S S S — provided the
  //       gap is part of the body (a body source off-axis of it, or one directly above
  //       it), so two separate sources in open air never fuse into a phantom emitter.
  // Generation is limited to PLACED sources (p=1): worldgen water (the sea, p=0) never
  // grows, so the sea cannot creep into cave air. Both rules are strictly local checks
  // around one source cell, and a LONE source in the sky has neither a flanking source
  // nor a source beside the Air below it — so it never accumulates into a vertical run
  // of sources; it stays one static block with a drip running off each exposed side.
  private healSourceBody(wx: number, wy: number, wz: number): void {
    // (a) source above + placed source alongside the Air below
    if (wy - 1 >= MIN_CY * 16) {
      const a = this.cellState(wx, wy - 1, wz);
      if (a.b === Block.Air) {
        for (const [dx, dz] of HXZ) {
          const m = this.cellState(wx + dx, wy - 1, wz + dz);
          if (m.b === Block.Water && m.s === 1 && m.p === 1) {
            this.spawnSource(wx, wy - 1, wz);
            return;
          }
        }
      }
    }
    // (b) S . S → S S S — but only for a gap that is part of a body: at least one of
    //     the gap's other neighbours (the two perpendicular HXZ cells, or the cell above
    //     the gap) must be a source. Without this, two SEPARATE placed sources in open
    //     air (nothing but air around the gap) would fuse into a phantom third source —
    //     an eternal emitter the player never placed, whose fan keeps running long after
    //     the player broke both originals (the reported un-stoppable flow). A gap inside
    //     a body (an interior hole, an edge cell, or a row with the body above it) still
    //     heals; a lone flanking pair in the sky does not. Only SOURCE water counts
    //     (transient flow halos must not trigger generation — the check is
    //     order-independent).
    for (const [dx, dz] of HXZ) {
      const g = this.cellState(wx + dx, wy, wz + dz);
      if (g.b !== Block.Air) continue;
      const f = this.cellState(wx + 2 * dx, wy, wz + 2 * dz);
      if (!(f.b === Block.Water && f.s === 1 && f.p === 1)) continue;
      const ox = dx !== 0 ? 0 : 1, oz = dx !== 0 ? 1 : 0; // perpendicular HXZ offsets
      const o1 = this.cellState(wx + dx + ox, wy, wz + dz + oz);
      const o2 = this.cellState(wx + dx - ox, wy, wz + dz - oz);
      const above = this.cellState(wx + dx, wy + 1, wz + dz);
      const inBody = (o1.b === Block.Water && o1.s === 1) || (o2.b === Block.Water && o2.s === 1) || (above.b === Block.Water && above.s === 1);
      if (!inBody) continue;
      this.spawnSource(wx + dx, wy, wz + dz);
    }
  }

  // A regenerated source cell: indistinguishable from one the player placed — breakable,
  // and re-checked every pulse (eternal emitter once it is left alone).
  private spawnSource(x: number, y: number, z: number): void {
    this.writeCell(x, y, z, 7, 1, Block.Water, 1, 0);
    this.springs.add(`${x},${y},${z}`);
  }

  // Spread to horizontal AIR neighbours at one level less. Two guards keep the load path cheap: (1) never
  // call writeCell into missing space — a state write there is a no-op, but the re-mark of
  // the target's closure (self + HXZ + above) includes this cell; at a world edge that is
  // a self-re-enqueue loop that sat every ocean settle at the SETTLE_GUARD ceiling.
  // (2) spread targets AIR only: a loaded-unsettled neighbour's pristine worldgen water is
  // never touched — its own settle re-seeds it. A level-1 cell spreads nothing: the
  // flood's range is six blocks from full-level water (the user's 5–6 block fan).
  private spreadToAir(wx: number, wy: number, wz: number, l: number): void {
    if (l < 2) return;
    for (const [dx, dz] of HXZ) {
      const tx = wx + dx, tz = wz + dz;
      if (this.cellState(tx, wy, tz).b === Block.Air) {
if (this.world.hasChunk(chunkOf(tx), chunkOf(wy), chunkOf(tz))) {
          this.writeCell(tx, wy, tz, l - 1, 0, Block.Water);
        }
      }
    }
  }

  // Falling water: water can spread downward infinitely into nearby air blocks until
  // stopped by a block — the column completes in ONE deterministic pass, not one step per
  // tick (the drip pacing made tall cave falls read as a glitchy migrating drop; the
  // falling-drip animation in voxel games is a cosmetic effect on top of already-settled
  // voxels). Pass 1 walks the air below to find the landing; pass 2 writes the whole
  // column with its final flags already in place, so the first processing of any column
  // cell is a no-op fixpoint — nothing is ever recomputed (and nothing ever flickers)
  // until the path changes:
//   - landing on SOLID ground: the bottom cell rests as a sheet (it spreads its bounded
//     floor fan while the flow above it lives); everything above it rides the flow;
//   - landing on another water body one deep over solid (a pool the water meets on the way
//     down): the column joins it — visible through the surface, never spreads;
  //   - reaching anything DEEPER: absorbed one block above the surface — flow entering a
  //     pool does not raise the pool, and no transient cell is written on its surface
  //     (no per-pulse blink at the base of a falls-to-sea stream);
  //   - ending at the world floor: the bottom cell rests on the void (stable);
  //   - hitting not-yet-generated space: the column stops at the band edge and the
  //     caller's per-pulse wait-recheck extends it once the low band loads.
  // `s`/`p` are the SOURCE flags of the falling parcel: a spring or waterfall head pours
  // plain flow (0,0); a lone falling parcel keeps its own flags (a worldgen source lake
  // that falls is still a source lake where it lands).
  private dropColumn(x: number, y: number, z: number, s = 0, p = 0): void {
    // pass 1: where does this column end?
    let kind: 'connects' | 'solid' | 'sheet' | 'deep' | 'worldfloor' | 'edge' = 'connects';
    let bottom = y; // lowest cell the pass-2 write may touch (inclusive)
    for (let cy = y; cy >= MIN_CY * 16; cy--) {
      const c = this.cellState(x, cy, z);
      if (c.b !== Block.Air) { kind = 'connects'; bottom = cy - 1; break; } // column meets existing water/solid: it just connects (nothing written at/below the landing)
      if (cy === MIN_CY * 16) { kind = 'worldfloor'; bottom = cy; break; } // bottom row of the generated world: rests on the void
      if (!this.world.hasChunk(chunkOf(x), chunkOf(cy - 1), chunkOf(z))) { kind = 'edge'; bottom = cy; break; } // low band not loaded: stop at the boundary (the caller's wait-recheck extends it)
      const below = this.cellState(x, cy - 1, z);
      if (below.b === Block.Air) continue; // keep walking down
      bottom = cy;
      if (below.b === Block.Water) {
        const bb = this.cellState(x, cy - 2, z);
        kind = this.solid(bb.b) || cy - 2 < MIN_CY * 16 ? 'sheet' : 'deep';
      } else {
        kind = 'solid';
      }
      break;
    }
    if (kind === 'deep') return; // absorbed above the surface: nothing is written
    if (kind === 'connects' && bottom >= y) return; // the first cell itself met the body: nothing to write
    // pass 2: write the column with its final states. Every cell is born at full level 7
    // and RIDES its support (below is water → it spreads nothing until that support goes,
    // then resets to resting water and re-derives). A 'connects' landing writes only the
    // cells ABOVE the meeting point — the water below is left exactly as it was.
    for (let cy = y; cy > bottom; cy--) {
      this.writeCell(x, cy, z, 7, s, Block.Water, p, 1);
    }
    if (kind !== 'connects') {
      const st = kind === 'solid' || kind === 'worldfloor' ? 0 : 1; // a landing on ground rests (and re-derives from whatever feeds it); on a pool / the void it rides too
      this.writeCell(x, bottom, z, 7, s, Block.Water, p, st);
    }
  }

  // Process up to `budget` queued cells (insertion order); the remainder persists.
  // Does not clear `touched` — the caller drains it after re-meshing.
  tick(budget: number): number {
    // Cells waiting on not-yet-generated space below them (the fall branch parked them
    // there): requeue them every pulse so an extending column resumes the moment the low
    // band loads.
    for (const key of this.waiting) this.queue.add(key);
    this.waiting.clear();
    // Springs (placed / regenerated sources) are eternal emitters: requeue the live ones so
    // each pulse re-checks the Air beside it and re-emits its side halo (which keeps the
    // head columns poured through whatever gap is open). With that Air already filled, the
    // re-check writes nothing, which is what makes a settled source + its drips a true
    // fixpoint. A key whose cell is no longer a placed source (the player broke it, or its
    // chunk was evicted and reloaded as worldgen water) is dropped from the set.
    for (const key of this.springs) {
      const [sx, sy, sz] = key.split(',').map(Number);
      if (this.cellState(sx, sy, sz).p === 1) this.queue.add(key);
      else this.springs.delete(key);
    }
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
  // state — placing Water makes a level-7 SOURCE block (a spring), a non-water block
  // clears the cell's state — then re-marks the cell + all 6 neighbours so dependents
  // re-evaluate. The HXZ/below re-marks are what make mining a source cut its flow: its
  // halo cells and whatever they feed sit in the closure and are re-processed. Water
  // removed this way simply stops feeding: the re-marked closure re-derives the
  // disconnected body to air on the slow clock (no global audit exists).
  edit(wx: number, wy: number, wz: number, block: number): void {
    if (!this.inBand(wy)) return;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    if (block === Block.Water) {
      c.wlevel[i] = 7;
      c.wsource[i] = 1;
      c.wplaced[i] = 1; // only placement makes a true spring
      this.springs.add(`${wx},${wy},${wz}`); // eternal emitter: re-checked every pulse
    } else {
      c.wlevel[i] = 0;
      c.wsource[i] = 0;
      c.wplaced[i] = 0;
      this.springs.delete(`${wx},${wy},${wz}`);
    }
    c.wstream[i] = 0; // any riding cell here is overwritten/removed: it rests again (or is gone)
    this.queue.add(`${wx},${wy},${wz}`);
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
    this.queue.add(`${wx},${wy - 1},${wz}`);
  }
}