import { it, expect } from 'vitest';
import { World, chunkOf, localIndex } from '../world';
import type { VoxelBuffer } from '../world';
import { Block } from '../blocks';
import { TerrainGen, generateChunkTerrain, TERRAIN_SEED } from '../terrain';
import * as streaming from '../streaming';
import { WaterSim } from '../water';
import { LightSim } from '../light';
import { meshChunk, meshChunkRange } from '../chunk-mesher';
import type { ChunkMesh } from '../chunk-mesher';
import { toGeometry } from '../geometry';
import { decideBands, mergeSlices, PROBE_VERTS, SLICE_COUNT } from '../mesh-slices';

// Phase 0 measurement gate (spec §Phase 0, revision R1). The band is deterministic
// (TERRAIN_SEED 1234 + pinned pipeline), so the pins are exact counts, not timings
// (wall time is logged for the record, never asserted — project convention).
//   WORST_KEY/WORST_VERTS: the ADR 0002 "single largest water/cave chunk" — world x 32..47,
//   y 16..31, z 0..15 — at 6312 opaque+trans verts with settled light.
//   WORST_BYTES: the merged geometry's attribute+index bytes (the single merge-frame upload).
//   OVER_BUDGET: band chunks whose mesh exceeds PROBE_VERTS — the streaming-reservation cost
//   the spec accepts (20 × (1 probe + 4 slice frames) per full ring refill).
const SPAWN_X = 6, SPAWN_Z = 46; // main.ts's spawn column (world x 0..15, z 32..47)
const WORST_KEY = '2,1,0';
const WORST_VERTS = 6312;
const WORST_BYTES = 315_600;
const OVER_BUDGET = 20;

/** The pinned 125-chunk band at the stable state — the light-load.test.ts harness. */
function buildBand(): { world: World; lightAt: (x: number, y: number, z: number) => [number, number] } {
  const world = new World();
  const gen = new TerrainGen(TERRAIN_SEED);
  for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2); // main.ts boot column (0,·,2)
  const sim = new WaterSim(world);
  const lightSim = new LightSim(world);
  sim.settle(0, 2, 2);
  lightSim.settleChunk(0, 2, 2);
  let guard = 0;
  for (;;) {
    const r = streaming.update(world, chunkOf(SPAWN_X), chunkOf(SPAWN_Z), 2);
    if (r.rebuilt.length === 0 && r.unloaded.length === 0) break;
    for (const c of r.rebuilt) {
      sim.settle(c.cx, c.cy, c.cz);
      lightSim.settleChunk(c.cx, c.cy, c.cz);
      const ch = world.getChunk(c.cx, c.cy, c.cz);
      if (ch) ch.dirty = false; // main.ts rebuildChunkMesh clears dirty (scene side stubbed)
    }
    for (const c of r.unloaded) lightSim.onChunkUnloaded(c.cx, c.cy, c.cz);
    lightSim.tick(100_000); // collapsed full drain (light-load pattern)
    sim.tick(100_000);
    if (++guard > 500) throw new Error('replay did not stabilize in 500 streaming calls');
  }
  return { world, lightAt: (x, y, z) => world.getLight(x, y, z) };
}

const vertsOf = (b: VoxelBuffer | null): number => (b ? b.positions.length / 3 : 0);
const bytesOf = (m: ChunkMesh): number => {
  let n = 0;
  for (const b of [m.opaque, m.trans]) {
    if (!b) continue;
    n += b.positions.byteLength + b.colors.byteLength + b.uvs.byteLength + b.indices.byteLength + b.light.byteLength;
  }
  return n;
};

it('the worst remesh is CPU-mesh-bound (gate) and the slice constants hold (pins + derivations)', () => {
  const { world, lightAt } = buildBand();
  const chunks = [...world.allChunks()];
  const scan = () => {
    const rows: { key: string; verts: number; bytes: number; meshT: number; geomT: number }[] = [];
    for (const c of chunks) {
      const t0 = performance.now();
      const m = meshChunk(world, c.cx, c.cy, c.cz, lightAt);
      const t1 = performance.now();
      if (m.opaque) toGeometry(m.opaque);
      if (m.trans) toGeometry(m.trans);
      const t2 = performance.now();
      rows.push({
        key: `${c.cx},${c.cy},${c.cz}`,
        verts: vertsOf(m.opaque) + vertsOf(m.trans),
        bytes: bytesOf(m),
        meshT: t1 - t0,
        geomT: t2 - t1,
      });
    }
    return rows;
  };
  scan(); // JIT warm-up (timings below are the second, warm pass)
  const res = scan();

  const worst = res.find((r) => r.key === WORST_KEY)!;
  expect(world.count()).toBe(125); // the band really walked to the full 5x5x5 ring
  expect(worst.verts).toBe(WORST_VERTS);
  expect(worst.bytes).toBe(WORST_BYTES);

  // Gate: the merge frame = 28×r_geom + upload_est(B) + last slice (≤ 8 ms by construction)
  // must fit 16.7 ms ⇔ 28×r_geom + upload_est(B) ≤ 8.7 ms. upload_est = B / 1 MB.
  const rMesh = worst.meshT / (worst.meshT + worst.geomT);
  expect(rMesh).toBeGreaterThanOrEqual(0.9); // CPU-mesh-bound (measured 0.982)
  expect(28 * (1 - rMesh) + worst.bytes / 1e6).toBeLessThanOrEqual(8.7);

  // The constant derivations (worst verts × browser tail / target budgets):
  expect(PROBE_VERTS).toBe(Math.floor(WORST_VERTS * 16.7 / 28));
  expect(SLICE_COUNT).toBe(Math.ceil(WORST_VERTS / Math.floor(WORST_VERTS * 8 / 28)));
  // The reservation cost the spec accepts:
  expect(res.filter((r) => r.verts > PROBE_VERTS).length).toBe(OVER_BUDGET);

  // Linearity: the SLICE_COUNT bands of the worst chunk split its mesh time within 1.25×
  // (measured max ratio 1.107) — catches hidden per-slice fixed cost.
  const worstChunk = world.getChunk(2, 1, 0)!;
  const bands = decideBands(worstChunk, SLICE_COUNT);
  let maxRatio = 0;
  for (const [y0, y1] of bands) {
    const t0 = performance.now();
    meshChunkRange(world, 2, 1, 0, lightAt, y0, y1);
    maxRatio = Math.max(maxRatio, (performance.now() - t0) / (worst.meshT / SLICE_COUNT));
  }
  expect(maxRatio).toBeLessThanOrEqual(1.25);

  console.log('PERF worst=', WORST_KEY, 'verts=', worst.verts, 'bytes=', worst.bytes,
    'mesh=', worst.meshT.toFixed(2), 'ms geom=', worst.geomT.toFixed(2), 'ms rMesh=', rMesh.toFixed(3),
    'gate=', (28 * (1 - rMesh) + worst.bytes / 1e6).toFixed(2), 'ms maxBandRatio=', maxRatio.toFixed(3));
}, 60_000);

function expectSplitUnion(world: World, cx: number, cy: number, cz: number,
  lightAt: (x: number, y: number, z: number) => [number, number]): void {
  const whole = meshChunk(world, cx, cy, cz, lightAt);
  const merged = mergeSlices(
    decideBands(world.getChunk(cx, cy, cz)!, SLICE_COUNT)
      .map(([y0, y1]) => meshChunkRange(world, cx, cy, cz, lightAt, y0, y1)),
  );
  for (const [name, a, b] of [
    ['opaque.positions', merged.opaque?.positions, whole.opaque?.positions],
    ['opaque.colors', merged.opaque?.colors, whole.opaque?.colors],
    ['opaque.uvs', merged.opaque?.uvs, whole.opaque?.uvs],
    ['opaque.light', merged.opaque?.light, whole.opaque?.light],
    ['opaque.indices', merged.opaque?.indices, whole.opaque?.indices],
    ['trans.positions', merged.trans?.positions, whole.trans?.positions],
    ['trans.colors', merged.trans?.colors, whole.trans?.colors],
    ['trans.uvs', merged.trans?.uvs, whole.trans?.uvs],
    ['trans.light', merged.trans?.light, whole.trans?.light],
    ['trans.indices', merged.trans?.indices, whole.trans?.indices],
  ] as const) {
    expect(a, name).toEqual(b); // exact: same vertex order, rebased indices
  }
}

it('the row-band split reproduces the whole mesh exactly (worst + all-water + all-air + special chunks)', () => {
  const { world, lightAt } = buildBand();
  expectSplitUnion(world, 2, 1, 0, lightAt); // the pinned worst chunk, settled light

  const noLight = (): [number, number] => [0, 0];
  // all-water (trans pass only, every face emitted)
  const ww = new World();
  const wc = ww.ensureChunk(0, 0, 0);
  for (let i = 0; i < 4096; i++) {
    wc.blocks[i] = Block.Water;
    wc.wlevel[i] = 7;
    wc.wsource[i] = 1;
  }
  expectSplitUnion(ww, 0, 0, 0, noLight);
  // all-air (both passes null)
  const aw = new World();
  aw.ensureChunk(0, 0, 0);
  expectSplitUnion(aw, 0, 0, 0, noLight);
  // special blocks: a stone floor (y=0), a floor torch (0,5,0), a closed X-thin door at (1,5..6,0)
  const sw = new World();
  const sc = sw.ensureChunk(0, 0, 0);
  for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) sc.blocks[localIndex(lx, 0, lz)] = Block.Stone;
  sw.setBlock(0, 5, 0, Block.Torch, 0);
  sw.setBlock(1, 5, 0, Block.DoorBottom, 0); // closed, axis X-thin, hinge min
  sw.setBlock(1, 6, 0, Block.DoorTop, 0);
  expectSplitUnion(sw, 0, 0, 0, noLight);
}, 60_000);