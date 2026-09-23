import { meshChunkRange, probeMeshChunk, type ChunkMesh, type LightSampler } from '../chunk-mesher';
import { SliceScheduler, decideBands, PROBE_VERTS, SLICE_COUNT } from '../mesh-slices';
import { chunkKey, type World } from '../world';

type Coordinates = [number, number, number];
type RemeshStage = 'plan' | 'slice' | 'merge' | 'probe-complete';
const REBUILD_BUDGET = 3;

interface MeshOperations {
  probe: typeof probeMeshChunk;
  slice: typeof meshChunkRange;
}

function coordinates(key: string): Coordinates {
  return key.split(',').map(Number) as Coordinates;
}

function score([cx, cy, cz]: Coordinates, [px, py, pz]: Coordinates): number {
  return ((cx - px) ** 2 + (cz - pz) ** 2) * 100 + Math.abs(cy - py);
}

export class ChunkRemesher {
  private readonly pending = new Set<string>();
  private readonly scheduler = new SliceScheduler();

  constructor(
    private readonly swap: (cx: number, cy: number, cz: number, mesh: ChunkMesh) => void,
    private readonly note: (key: string, stage: RemeshStage, mesh: ChunkMesh) => void = () => {},
    private readonly meshes: MeshOperations = { probe: probeMeshChunk, slice: meshChunkRange },
  ) {}

  request(key: string): void {
    this.pending.add(key);
  }

  has(key: string): boolean {
    return this.pending.has(key) || this.scheduler.has(key);
  }

  cancelSlice(key: string): void {
    this.scheduler.cancel(key);
  }

  remove(key: string): void {
    this.cancelSlice(key);
    this.pending.delete(key);
  }

  drain(world: World, light: LightSampler, center: Coordinates): void {
    const inFlight = this.scheduler.inFlightKey();
    if (inFlight) {
      this.advanceSlice(world, light, inFlight);
      return;
    }
    const nearest = [...this.pending].map(coordinates);
    nearest.sort((a, b) => score(a, center) - score(b, center));
    for (const position of nearest.slice(0, REBUILD_BUDGET)) {
      if (this.rebuild(world, light, position)) break;
    }
  }

  private rebuild(world: World, light: LightSampler, position: Coordinates): boolean {
    const key = chunkKey(...position);
    if (!world.hasChunk(...position)) {
      this.pending.delete(key);
      return false;
    }
    const probe = this.meshes.probe(world, ...position, light, PROBE_VERTS);
    this.pending.delete(key);
    if (probe.complete) {
      this.swap(...position, probe.mesh);
      this.note(key, 'probe-complete', probe.mesh);
      return false;
    }
    // A heavy probe starts band zero now and reserves the rest of this frame's budget.
    this.scheduler.start(key, decideBands(world.getChunk(...position)!, SLICE_COUNT));
    const mesh = this.meshSlice(world, light, key);
    this.note(key, 'plan', mesh);
    return true;
  }

  private meshSlice(world: World, light: LightSampler, key: string): ChunkMesh {
    const [y0, y1] = this.scheduler.advance(key)!;
    const mesh = this.meshes.slice(world, ...coordinates(key), light, y0, y1);
    this.scheduler.store(key, mesh);
    return mesh;
  }

  private advanceSlice(world: World, light: LightSampler, key: string): void {
    const position = coordinates(key);
    if (!world.hasChunk(...position)) {
      this.remove(key);
      return;
    }
    const mesh = this.meshSlice(world, light, key);
    const merged = this.scheduler.finish(key);
    if (merged) {
      this.swap(...position, merged);
      // New requests during slicing must survive: bands may have seen different light states.
      this.note(key, 'merge', merged);
    } else {
      this.note(key, 'slice', mesh);
    }
  }
}
