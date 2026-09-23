import { Mesh, type Material, type Scene } from 'three';
import type { ChunkMesh } from '../chunk-mesher';
import { toGeometry } from '../geometry';

interface ChunkObjects {
  opaque: Mesh | null;
  transparent: Mesh | null;
}

export class ChunkRenderer {
  private readonly chunks = new Map<string, ChunkObjects>();

  constructor(
    private readonly scene: Scene,
    private readonly opaqueMaterial: Material,
    private readonly transparentMaterial: Material,
  ) {}

  get chunkCount(): number {
    return this.chunks.size;
  }

  replace(key: string, mesh: ChunkMesh): void {
    this.remove(key);
    const objects = {
      opaque: mesh.opaque ? new Mesh(toGeometry(mesh.opaque), this.opaqueMaterial) : null,
      transparent: mesh.trans ? new Mesh(toGeometry(mesh.trans), this.transparentMaterial) : null,
    };
    if (objects.opaque) this.scene.add(objects.opaque);
    if (objects.transparent) this.scene.add(objects.transparent);
    // Empty meshes still count as completed chunks in profiling reports.
    this.chunks.set(key, objects);
  }

  remove(key: string): void {
    const objects = this.chunks.get(key);
    if (!objects) return;
    for (const mesh of [objects.opaque, objects.transparent]) {
      if (!mesh) continue;
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.chunks.delete(key);
  }

  dispose(): void {
    for (const key of this.chunks.keys()) this.remove(key);
    // Shared materials and their atlas remain owned by the caller.
  }
}
