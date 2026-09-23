import { BoxGeometry, EdgesGeometry, LineBasicMaterial, LineSegments, type Scene } from 'three';
import type { RayHit } from '../raycast';

export class TargetOutline {
  private readonly mesh: LineSegments<EdgesGeometry, LineBasicMaterial>;

  constructor(private readonly scene: Scene) {
    // Slightly oversized edges avoid z-fighting with the target's faces.
    const box = new BoxGeometry(1.002, 1.002, 1.002);
    this.mesh = new LineSegments(
      new EdgesGeometry(box),
      new LineBasicMaterial({ color: 0xffffff }),
    );
    box.dispose();
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  update(hit: RayHit | null): void {
    this.mesh.visible = hit !== null;
    if (hit) this.mesh.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
