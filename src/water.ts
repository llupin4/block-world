import { Block, BLOCKS } from './blocks';
import { World, chunkOf, chunkKey, localIndex, WORLD_Y_MIN, WORLD_Y_MAX, type Chunk } from './world';

// WaterSim: the PROJECT.md §9 flow cellular automaton. Pure TS (no three) so vitest
// drives it in node, mirroring how streaming.ts is tested. State (wlevel/wsource/wflow)
// lives in the chunk, so it streams with the chunk: a missing neighbour chunk reads
// as dry and is not a spread escape; water at the bottom row of the generated world
// rests on the void (stable), and a fall that stopped at not-yet-generated space is
// re-checked every pulse until the low band loads.
//
// Model: SOURCES (wsource=1) are immortal. Two kinds: a PLACED source (wplaced=1, created
// only by placing a water block) is a spring — it NEVER falls (not even alone in the sky),
// it pours down through whatever air is below and keeps pushing flow into horizontal air at
// rest; a SETTLED worldgen source (the sea, re-seeded on load) is static — it stands, falls
// and pours through gaps in its support, but never pushes, so the sea does not fill caves.
// Everything that is not a source is FLOW: it spreads and rests, and it is SUSTAINED
// (wflow=1) while it can reach a source through the water body (6-neighbour reachability;
// the flag updates locally cell-by-cell and is re-derived globally by runAudit after any
// water-removing edit). Flow that loses all reachability — a plugged hole, a sealed pocket,
// a removed source, a cut stream — starves away at the slow-clock pace: plug the hole and
// the cave you flooded (floor pool + stream) empties itself, visibly.
//
// RANGE: wlevel is a real (render-cosmetic) decay number: every live start is level 7; a
// water cell spreads sideways to Air only at level >= 2, and the neighbour it writes is at
// level-1. So a spring's flood reaches ~6 blocks out from the nearest full-level water —
// a rounded fan (4-way spread) — and any fall (pour or drop) RESETS the parcel to 7, so
// water always prefers to run down a slope: a hillside spring fans out a few blocks, then
// runs off down to the next ledge instead of flooding the whole contour. Levels do not
// render (a cell is always a full-height quad) and a cell keeps the level it was written
// with.
//
// Waterfalls: water in typical voxel engines spreads downward through nearby air
// blocks until stopped by a block": a placed spring with air below writes the WHOLE
// falling column in one deterministic pass (dropColumn), the way typical voxel engines's flow state
// is set (its "falling water" drip look is a cosmetic animation over already-settled
// voxels). The column is then a fixpoint: the spring re-checks it every pulse and the
// spring above it, and writes nothing while the gap below is full. A static worldgen
// source pours the same way when fed by its own body; a static source with no water
// around it (a lone drip) still falls and lands as flow.
//
// Where that water goes is the whole point of the model:
//   - flow that lands on SOLID ground rests and spreads sideways (a floor sheet, hugging
//     terrain) — a stream into a cave leaves a pool on the cave floor;
//   - flow that reaches a water body one deep on solid ground (a pool sheet) or another
//     stream cell becomes a STREAM cell: visible water that never spreads — the waterfall's
//     column and its base, without ever climbing the pool or filling the cave;
//   - flow that reaches anything DEEPER (the sea, a deep pool) disappears into it: water
//     levels never rise, so placing a source high on the shore feeds the sea without raising
//     it;
//   - only water the player PLACED is a true source (spring): immortal AND the only water
//     that pushes flow sideways while at rest. Worldgen water (the sea) is re-seeded as a
//     source purely so settled standing water behaves; it stands, falls and pours, but never
//     pushes — the sea does not erupt into caves.

const HXZ: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB6: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0],
]; // 6-neighbour water adjacency: reachability (sustained-flow BFS) walks vertically too
const SETTLE_GUARD = 2000; // safety valve: cap on cell updates one settle run may perform — ~5–10 ms of work so a chunk's settle never owns a full frame; a cave that is still mid-fill when the cap hits keeps relaxing through later slow-clock ticks (the queue is closed and persistent)
const MIN_CY = 0; // lowest GENERATED y band (streaming's CY_MIN): below it is ungenerated world floor — a fall through it drains (legitimate), a settle above it defers

interface CellState { b: number; l: number; s: number; f: number; p: number; st: number }
const DRY: CellState = { b: Block.Air, l: 0, s: 0, f: 0, p: 0, st: 0 };

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
  private waiting = new Set<string>(); // cells whose fall stopped at not-yet-generated space below: re-checked every pulse until the low band loads (their column then extends)
  private springs = new Set<string>(); // live PLACED sources (springs): re-queued at every pulse's start so a spring keeps pouring through whatever gap has opened below it (a sky spring never dries out, a wall spring keeps flowing) — maintained by edit()

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
    return { b: c.blocks[i], l: c.wlevel[i], s: c.wsource[i], f: c.wflow[i], p: c.wplaced[i], st: c.wstream[i] };
  }

  // Write a cell's full state. Only records the chunk in `touched` when the *block*
  // actually changed (level/flag changes alone never re-mesh: they don't render).
  private setState(wx: number, wy: number, wz: number, l: number, s: number, b: number, f: number, p: number, st: number): void {
    if (!this.inBand(wy)) return;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    c.wlevel[i] = l;
    c.wsource[i] = s;
    c.wflow[i] = f;
    c.wplaced[i] = p;
    c.wstream[i] = st;
    if (c.blocks[i] !== b) {
      if (this.world.setBlock(wx, wy, wz, b)) this.touched.add(chunkKey(c.cx, c.cy, c.cz));
    }
  }

  // Write only when state differs, then re-mark the cell + 4 horizontal neighbours +
  // the cell above (a below cell is never re-marked from above: a resting level is a
  // function of horizontal + above, and a changing below re-triggers via this rule).
  private writeCell(wx: number, wy: number, wz: number, l: number, s: number, b: number, f: number = 0, p: number = 0, st: number = 0): void {
    const c = this.cellState(wx, wy, wz);
    if (c.b === b && c.l === l && c.s === s && c.f === f && c.p === p && c.st === st) return;
    this.setState(wx, wy, wz, l, s, b, f, p, st);
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
      c.wflow[i] = 0; // worldgen water becomes a STATIC source (stands, falls, pours; never pushes)
      c.wplaced[i] = 0; // not player-placed: never a spring
      c.wstream[i] = 0; // not part of any stream
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

    // below is Air (missing / out-of-band reads as Air).
    if (below.b === Block.Air && wy > MIN_CY * 16) {
      // In-band space whose chunk is not generated YET also reads as Air; falling into it
      // would write a column through a hole that does not exist (streaming loads bands in
      // arbitrary order). Known space = the band below is loaded, or the fall exits the
      // generated world below its floor (the world-floor case rests instead — see below).
      const belowKnown = wy - 1 < MIN_CY * 16 || this.world.hasChunk(chunkOf(wx), chunkOf(wy - 1), chunkOf(wz));
      if (!belowKnown) { this.waiting.add(`${wx},${wy},${wz}`); return; } // waiting on the low band: re-checked every pulse
      if (C.s === 1) {
        if (C.p === 1) {
          // A placed spring NEVER falls, even alone in the sky: it stays a permanent
          // emitter and pours a flow column down through any gap (the user's "wall
          // spring" — a spring placed in a hollow keeps flowing, it is not a falling block).
          // f=1: the poured column is born sustained BY THE SPRING above it, so the stream
          // and its floor pool never starve off an instant.
          this.dropColumn(wx, wy - 1, wz, 1);
          return;
        }
        // A fed static source on a ledge is a waterfall head: it stays put and pours FLOW
        // down through the gap. Fed = water directly above, or water in a horizontal
        // neighbour (a lake edge, a sea surface cell above a hole in the floor). A static
        // source with no water around it is a lone drip: it falls and lands as flow.
        let fed = this.cellState(wx, wy + 1, wz).b === Block.Water;
        if (!fed) {
          for (const [dx, dz] of HXZ) {
            const m = this.cellState(wx + dx, wy, wz + dz);
            if (m.b === Block.Water && (m.s === 1 || m.f === 1)) { fed = true; break; }
          }
        }
        if (fed) {
          this.dropColumn(wx, wy - 1, wz, 1);
          return;
        }
      }
      this.writeCell(wx, wy, wz, 0, 0, Block.Air); // dry origin, re-marked
      this.dropColumn(wx, wy - 1, wz, C.f); // instantaneous full-column drop; the bottom re-lands as flow
      return;
    }

    // resting: below is not air — or this is the bottom row of the generated world (water at
    // the world floor rests on the void: the old "drains out of the world" rule kept
    // re-dripping one cell per pulse forever at the world edge, a visible blink). Sources (s=1) are immortal: a PLACED source (wplaced=1, a spring) keeps
    // pushing flow into horizontal air at rest; a settled worldgen source (the sea) pushes
    // nothing. A flow cell (s=0) is alive while sustained: its own wflow flag (set by
    // propagation through the water body, or born f=1 from a pour — see the fall branch),
    // or some 6-neighbour that is a source or a sustained flow. runAudit re-derives the
    // flags globally after any water-removing edit, so water cut off from every source
    // (a plugged hole, a sealed pocket, a removed source, a cut stream) loses its flag and
    // starves away, one cell per slow-clock update.
    let nF = C.f;
    if (C.s !== 1 && C.l >= 1) {
      let sus = C.f; // its own (still-audit-valid) sustained flag keeps a fresh pool/stream alive between pulses
      for (const [dx, dy, dz] of NB6) {
        const m = this.cellState(wx + dx, wy + dy, wz + dz);
        if (m.b === Block.Water && (m.s === 1 || m.f === 1)) { sus = 1; break; }
      }
      if (sus === 0) {
        this.writeCell(wx, wy, wz, 0, 0, Block.Air, 0, 0, 0); // starved: cut off from every source (pools and streams alike)
        return;
      }
      nF = 1;
    }

    if (C.s === 1) {
      // A resting source spreads only if the player placed it: the spring pushes flow into
      // whatever air is beside it (at one level less per step — see spreadToAir). Settled
      // worldgen water stays put — it falls and pours where support goes, but the sea never
      // erupts into cave air.
      if (nF !== C.f) this.writeCell(wx, wy, wz, C.l, C.s, Block.Water, nF, C.p, 0);
      if (C.p === 1) this.spreadToAir(wx, wy, wz, C.l);
      return;
    }

    if (below.b === Block.Water) {
      // Flow over a water body. One deep on solid ground (a pool sheet), over another
      // stream cell, or over water at the world floor (a column base over the void) →
      // this cell is part of a VISIBLE waterfall: mark it stream (st=1) and let it stand —
      // a stream never spreads, so it cannot climb a pool, fill a basin or raise the sea.
      // Over anything deeper (the sea, a deep pool) the cell joins the body and
      // disappears: no water body's level ever rises.
      const bb = this.cellState(wx, wy - 2, wz);
      if (below.st === 1 || wy - 2 < MIN_CY * 16 || this.solid(bb.b)) {
        if (nF !== C.f || C.st !== 1) this.writeCell(wx, wy, wz, C.l, 0, Block.Water, nF, 0, 1);
        return; // stream cell: no spread, ever
      }
      this.writeCell(wx, wy, wz, 0, 0, Block.Air, 0, 0, 0); // disappears into the water body
      return;
    }

    // over solid ground: rest, and (still alive, level >= 2) spread to horizontal air at
    // one level less per step — bounded floor sheets hugging terrain. A level-1 cell is
    // the flood's outer lip: it stands (and still falls if its support goes), but pushes
    // nothing, so a spring on a hillside fans out a handful of blocks instead of drowning
    // the whole contour. A falling water cell resets to 7, so water keeps running down
    // slopes ledge by ledge.
    if (nF !== C.f) this.writeCell(wx, wy, wz, C.l, C.s, Block.Water, nF, C.p, C.st);
    if (C.l >= 2) this.spreadToAir(wx, wy, wz, C.l);
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
          this.writeCell(tx, wy, tz, l - 1, 0, Block.Water, 0, 0, 0);
        }
      }
    }
  }

  // Falling water in typical voxel engines: water can spread downward infinitely into nearby air
  // blocks until stopped by a block" — the column completes in ONE deterministic pass,
  // not one step per tick (the drip pacing made tall cave falls read as a glitchy
  // migrating drop; the falling-drip animation in voxel games is a cosmetic effect on top of
  // already-settled voxels). Pass 1 walks the air below to find the landing; pass 2
  // writes the whole column with its final flags already in place, so the first
  // processing of any column cell is a no-op fixpoint — nothing is ever recomputed (and
  // nothing ever flickers) until the path changes:
  //   - landing on SOLID ground: the bottom cell is a sheet (st=0 — it spreads its bounded
  //     floor fan), everything above it a stream (st=1);
  //   - landing on a sheet/stream over solid (a pool the water meets on the way down): the
  //     whole column is stream (st=1) — a waterfall meeting a pool;
  //   - reaching anything DEEPER: absorbed one block above the surface — flow entering a
  //     pool does not raise the pool, and no transient cell is written on its surface
  //     (no per-pulse blink at the base of a falls-to-sea stream);
  //   - ending at the world floor: the bottom cell rests on the void (stable);
  //   - hitting not-yet-generated space: the column stops at the band edge and the
  //     caller's per-pulse wait-recheck extends it once the low band loads.
  private dropColumn(x: number, y: number, z: number, f: number): void {
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
        kind = below.st === 1 || this.solid(bb.b) || cy - 2 < MIN_CY * 16 ? 'sheet' : 'deep';
      } else {
        kind = 'solid';
      }
      break;
    }
    if (kind === 'deep') return; // absorbed above the surface: nothing is written
    if (kind === 'connects' && bottom < y) return; // the first cell itself met the body: nothing to write
    // pass 2: write the column with its final states.
    for (let cy = y; cy >= bottom; cy--) {
      const isBottom = cy === bottom;
      // A column that lands on ground (solid, or the world floor) bottoms out as a SHEET (st=0:
      // it spreads its bounded floor fan); every other landing (a pool sheet/stream, the void
      // beneath a loaded column's edge) is all stream (st=1: visible, never spreads).
      const st = kind === 'solid' || kind === 'worldfloor' ? (isBottom ? 0 : 1) : 1;
      this.writeCell(x, cy, z, 7, 0, Block.Water, f, 0, st);
    }
  }

  // Process up to `budget` queued cells (insertion order); the remainder persists.
  // Does not clear `touched` — the caller drains it after re-meshing. If a water-removing
  // edit is pending, its reachability audit runs first (it is free work: the starves it
  // schedules then drain through the normal budget, one cell per update).
  tick(budget: number): number {
    // Cells waiting on not-yet-generated space below them (the fall branch parked them
    // there): requeue them every pulse so an extending column resumes the moment the low
    // band loads.
    for (const key of this.waiting) this.queue.add(key);
    this.waiting.clear();
    // Springs are eternal emitters: requeue the live ones so each pulse re-checks (and
    // re-pours through) the gap below them — with the column below full, the re-check
    // writes nothing, which is what makes a settled waterfall a true fixpoint. A key whose
    // cell is no longer a placed spring (the player broke it, or its chunk was evicted
    // and reloaded as worldgen water) is dropped from the set.
    for (const key of this.springs) {
      const [sx, sy, sz] = key.split(',').map(Number);
      if (this.cellState(sx, sy, sz).p === 1) this.queue.add(key);
      else this.springs.delete(key);
    }
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
      c.wplaced[i] = 1; // only placement makes a true spring
      this.springs.add(`${wx},${wy},${wz}`); // eternal emitter: re-checked every pulse
    } else {
      c.wlevel[i] = 0;
      c.wsource[i] = 0;
      c.wplaced[i] = 0;
      this.springs.delete(`${wx},${wy},${wz}`);
    }
    c.wflow[i] = 0;
    c.wstream[i] = 0; // any stream cell here is overwritten/removed: not a stream
    this.queue.add(`${wx},${wy},${wz}`);
    for (const [dx, dz] of HXZ) this.queue.add(`${wx + dx},${wy},${wz + dz}`);
    this.queue.add(`${wx},${wy + 1},${wz}`);
    if (wasWater && block !== Block.Water) this.auditPending = true; // water removed: re-derive reachability on the next pulse
  }
}
