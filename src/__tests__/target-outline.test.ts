import { describe, expect, it, vi } from 'vitest';
import { Scene, LineSegments, type EdgesGeometry, type LineBasicMaterial } from 'three';
import { TargetOutline } from '../rendering/target-outline';

describe('TargetOutline', () => {
  it('centers the outline on the target voxel and hides it when there is no target', () => {
    const scene = new Scene();
    const outline = new TargetOutline(scene);
    const mesh = scene.children[0];
    expect(mesh.visible).toBe(false);
    outline.update({ x: -2, y: 3, z: 4, nx: 1, ny: 0, nz: 0 });
    expect(mesh.position.toArray()).toEqual([-1.5, 3.5, 4.5]);
    expect(mesh.visible).toBe(true);
    outline.update(null);
    expect(mesh.visible).toBe(false);
  });

  it('removes the outline and disposes its geometry and material', () => {
    const scene = new Scene();
    const outline = new TargetOutline(scene);
    const mesh = scene.children[0] as LineSegments<EdgesGeometry, LineBasicMaterial>;
    const geometry = vi.spyOn(mesh.geometry, 'dispose');
    const material = vi.spyOn(mesh.material, 'dispose');
    outline.dispose();
    expect(scene.children).toHaveLength(0);
    expect(geometry).toHaveBeenCalledTimes(1);
    expect(material).toHaveBeenCalledTimes(1);
  });
});
