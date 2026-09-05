// Heavy-chunk slice state (ADR 0013): the drain probes every candidate with a vertex budget;
// a truncated probe means "heavier than the budget" and the chunk is meshed in SLICE_COUNT
// contiguous row bands (balanced by non-air row counts), one per reserved frame, then merged.
// Pure TS, no three — vitest drives it directly (the streaming.ts pattern).
import { Block } from './blocks';
import type { Chunk, VoxelBuffer } from './world';
import type { ChunkMesh } from './chunk-mesher';

/**
 * floor(6312 × 16.7 / 28): the probe's vertex budget. At the ADR 0002 worst-case measured
 * density (28 ms / 6312 verts, the browser tail on the worst chunk `2,1,0`) a probe frame is
 * ≤ 16.7 ms — ≤ 1 vsync — BY CONSTRUCTION, on any machine. Pinned derivation + the 6312
 * worst-vertex pin: src/__tests__/remesh-perf.test.ts (Phase 0 gate).
 */
export const PROBE_VERTS = 3764;

/**
 * ceil(6312 / floor(6312 × 8 / 28)): 4. Each slice is ≤ 1803 verts ≈ ≤ ~7 ms at the
 * worst-case density (goal B: per-slice ≤ ~8 ms with headroom). Same pins as PROBE_VERTS.
 */
export const SLICE_COUNT = 4;

/**
 * n contiguous row bands [y0, y1) covering [0, 16), split at the non-air row-count
 * quantiles (balanced by cell count, which proxies loop cost). A band may be empty
 * (content concentrated in a few rows); an all-air chunk gets equal bands. The probe has
 * already decided the chunk is heavy — there is no threshold here.
 */
export function decideBands(chunk: Chunk, n: number): [number, number][] {
  const rows = new Array(16).fill(0);
  for (let ly = 0; ly < 16; ly++) {
    // localIndex(lx, ly, lz) = lx + lz*16 + ly*256: at fixed ly the row is ly*256 .. ly*256+255
    for (let i = 0; i < 256; i++) {
      if (chunk.blocks[ly * 256 + i] !== Block.Air) rows[ly]++;
    }
  }
  const total = rows.reduce((a, b) => a + b, 0);
  const edges: number[] = [0];
  if (total === 0) {
    for (let k = 1; k < n; k++) edges.push(Math.floor((16 * k) / n));
  } else {
    let acc = 0;
    let edge = 0;
    for (let k = 1; k < n; k++) {
      const target = (total * k) / n;
      while (edge < 15) {
        edge++;
        acc += rows[edge - 1];
        if (acc >= target) break;
      }
      edges.push(edge);
    }
  }
  edges.push(16);
  const bands: [number, number][] = [];
  for (let k = 0; k < n; k++) bands.push([edges[k], edges[k + 1]]);
  return bands;
}

/** Per-pass merge: concat the four attribute arrays in order; rebase each pass's indices by
 * the sum of preceding passes' vertex counts. Null passes contribute nothing. */
function mergePass(passes: (VoxelBuffer | null)[]): VoxelBuffer | null {
  const solid = passes.filter((p): p is VoxelBuffer => p !== null);
  if (solid.length === 0) return null;
  const totalVerts = solid.reduce((n, p) => n + p.positions.length / 3, 0);
  const positions = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 4);
  const uvs = new Float32Array(totalVerts * 2);
  const light = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(solid.reduce((n, p) => n + p.indices.length, 0));
  let vOff = 0, posOff = 0, colOff = 0, uvOff = 0, lightOff = 0, iOff = 0;
  for (const p of solid) {
    const v = p.positions.length / 3;
    // TypedArray.set offsets are ELEMENT units (pos ×3, color ×4, uv/light ×2 per vertex);
    // the index rebase below is VERTEX units — hence the parallel counters.
    positions.set(p.positions, posOff);
    colors.set(p.colors, colOff);
    uvs.set(p.uvs, uvOff);
    light.set(p.light, lightOff);
    for (let i = 0; i < p.indices.length; i++) indices[iOff + i] = p.indices[i] + vOff;
    iOff += p.indices.length;
    vOff += v; posOff += v * 3; colOff += v * 4; uvOff += v * 2; lightOff += v * 2;
  }
  return { positions, colors, uvs, indices, light };
}

/** Merge band meshes (in band order) into one. Exact: the band union IS the whole mesh —
 * per-cell emission independence (the spec's verified premise) makes vertex order
 * deterministic, so this is a concat + index rebase, not a rebuild. */
export function mergeSlices(meshes: ChunkMesh[]): ChunkMesh {
  return {
    opaque: mergePass(meshes.map((m) => m.opaque)),
    trans: mergePass(meshes.map((m) => m.trans)),
  };
}

interface Plan {
  bands: [number, number][];
  next: number;
  partial: (ChunkMesh | null)[];
}

/**
 * One in-flight slice plan at a time (the drain serializes starts; `start` enforces it).
 * Lifecycle: start → (advance + store) × bands.length → finish (merges, removes the plan);
 * cancel at any point (player edit / unload) discards the partial buffers — they are plain
 * typed arrays, so GC takes them; no GPU resources exist before the merge.
 */
export class SliceScheduler {
  private plans = new Map<string, Plan>();

  /** Returns false when a plan is already in flight (one at a time). */
  start(key: string, bands: [number, number][]): boolean {
    if (this.plans.size > 0) return false;
    this.plans.set(key, { bands, next: 0, partial: new Array(bands.length).fill(null) });
    return true;
  }

  has(key: string): boolean {
    return this.plans.has(key);
  }

  /** The single in-flight chunk key (or null). */
  inFlightKey(): string | null {
    const k = this.plans.keys().next();
    return k.done ? null : k.value;
  }

  /** The band to mesh now for `key` (or null — no plan / plan complete). */
  advance(key: string): [number, number] | null {
    const p = this.plans.get(key);
    if (!p || p.next >= p.bands.length) return null;
    return p.bands[p.next];
  }

  /** Record the just-meshed band's buffers (must follow an advance). */
  store(key: string, mesh: ChunkMesh): void {
    const p = this.plans.get(key);
    if (!p) return;
    p.partial[p.next] = mesh;
    p.next++;
  }

  /** When all bands are stored: merge them and remove the plan; otherwise null. */
  finish(key: string): ChunkMesh | null {
    const p = this.plans.get(key);
    if (!p || p.next < p.bands.length) return null;
    this.plans.delete(key);
    // finish implies every band was stored, so the filter is a no-op — it only narrows the
    // pre-store nulls for the type (an empty band is a zero-vertex ChunkMesh, never null).
    return mergeSlices(p.partial.filter((m): m is ChunkMesh => m !== null));
  }

  cancel(key: string): void {
    this.plans.delete(key);
  }
}