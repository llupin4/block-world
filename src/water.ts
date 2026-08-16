import { Block, BLOCKS } from './blocks';
import { World, chunkOf, chunkKey, localIndex, WORLD_Y_MIN, WORLD_Y_MAX, type Chunk } from './world';

// WaterSim: the PROJECT.md §9 flow cellular automaton. Pure TS (no three) so vitest
// drives it in node, mirroring how streaming.ts is tested. State (wlevel/wsource)
// lives in the chunk, so it streams with the chunk: a missing neighbour chunk reads
// as dry and is not a spread escape; a falling cell whose destination is
// out-of-band or missing is destroyed (falls out of the world).

const HXZ: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const SETTLE_GUARD = 20000; // safety valve: cap on cell updates one settle run may perform

interface CellState { b: number; l: number; s: number }
const DRY: CellState = { b: Block.Air, l: 0, s: 0 };

export class WaterSim {
  private readonly world: World;
  private readonly queue = new Set<string>(); // insertion-ordered FIFO with dedup
  readonly touched = new Set<string>(); // chunk keys whose geometry changed (for re-mesh)
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

  // One update: process one water cell to its rule-driven action.
  private process(wx: number, wy: number, wz: number): void {
    const C = this.cellState(wx, wy, wz);
    if (C.b !== Block.Water) return; // dried / no longer water: neighbours+above already re-marked
    // A loaded-unsettled neighbour still carries pristine worldgen water (level 0, no
    // source) that its own settle has not seeded yet. Never re-level or dry it: settling
    // A may write levels / flood Air across the seam into B, but B's unseeded water stays
    // untouched until B's settle re-seeds it as (7,1) — this is what makes sequential
    // per-chunk settling order-independent and unable to eat worldgen water.
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

    // spread to horizontal neighbours at level-1, only from a loaded chunk (a missing
    // neighbour's writeCell is a no-op, so water never leaks into ungenerated space).
    if (nL >= 2) {
      for (const [dx, dz] of HXZ) {
        const m = this.cellState(wx + dx, wy, wz + dz);
        if (m.b === Block.Air || (m.b === Block.Water && m.s === 0 && nL - 1 > m.l)) {
          this.writeCell(wx + dx, wy, wz + dz, nL - 1, 0, Block.Water);
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

  // On-load settle: seed every worldgen Water cell as a level-7 source (a plain array
  // pre-mark would satisfy writeCell's exact-state early-return and queue nothing,
  // leaving the relaxation a no-op — caves would never flood on load), then relax to
  // a fixpoint (guarded). Idempotent via the settled flag.
  // NOTE: does NOT clear `touched` — marks accumulate for the whole frame and the
  // frame-end drain (main.ts) is the sole consumer. Clearing here would drop marks
  // made by an EARLIER settle of the same frame: a seam chunk flooded across from it
  // keeps a stale pre-flood mesh (visible level steps / dry corners at chunk edges).
  settle(cx: number, cy: number, cz: number): Set<string> {
    const c = this.world.getChunk(cx, cy, cz);
    if (!c || c.settled) return this.touched;
    this.settling = c; // during this settle, only c's own water may be modified (see the pristine-skip in process)
    const bx = cx * 16, by = cy * 16, bz = cz * 16;
    for (let lx = 0; lx < 16; lx++)
      for (let ly = 0; ly < 16; ly++)
        for (let lz = 0; lz < 16; lz++)
          if (c.blocks[localIndex(lx, ly, lz)] === Block.Water)
            this.writeCell(bx + lx, by + ly, bz + lz, 7, 1, Block.Water);
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
  }
}
