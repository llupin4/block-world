import { describe, expect, it, vi } from 'vitest';
import { Group, Mesh, MeshBasicMaterial, Scene, Sprite, Texture } from 'three';
import { Sim, IdleController } from '../entity';
import { World } from '../world';
import { EntityRenderer } from '../rendering/entity-renderer';

function setup() {
  const scene = new Scene();
  const sim = new Sim(new World(), {}, 1234);
  const textures = { part: vi.fn(() => new Texture()), name: vi.fn(() => new Texture()) };
  const renderer = new EntityRenderer(scene, textures);
  return { scene, sim, textures, renderer };
}

describe('entity renderer', () => {
  it('tracks pose and animation, hides the viewed body, and skips spectators', () => {
    const { scene, sim, renderer } = setup();
    const player = sim.spawn({ x: 1, y: 2, z: 3 }, new IdleController());
    player.name = 'Player';
    player.vel.x = 2;
    player.yaw = 0.5;
    player.pitch = 0.25;
    sim.spawn({ x: 0, y: 5, z: 0 }, new IdleController(), { kindId: 'spectator' });
    renderer.update(sim.all(), player.id, 0.1);
    expect(renderer.rigCount).toBe(1);
    const body = scene.children.find((child) => child instanceof Group)!;
    const tag = scene.children.find((child) => child instanceof Sprite)!;
    expect(body.position.toArray()).toEqual([1, 2, 3]);
    expect(body.rotation.y).toBe(0.5);
    expect(body.visible).toBe(false);
    expect(tag.visible).toBe(false);
    expect(tag.position.toArray()).toEqual([1, 3.8, 3]);
    const legs = body.children.filter((child) => child instanceof Group).slice(0, 2);
    expect(legs[0].rotation.x).toBeCloseTo(Math.sin(0.8) * 0.5);
    expect(legs[1].rotation.x).toBeCloseTo(-Math.sin(0.8) * 0.5);
    renderer.update(sim.all(), -1, 0);
    expect(body.visible).toBe(true);
    expect(tag.visible).toBe(true);
    renderer.dispose();
  });

  it('shares textures, removes departed rigs, and releases resources at their owner lifetime', () => {
    const { scene, sim, textures, renderer } = setup();
    const first = sim.spawn({ x: 0, y: 0, z: 0 }, new IdleController());
    const second = sim.spawn({ x: 1, y: 0, z: 0 }, new IdleController());
    first.name = second.name = 'Same Name';
    renderer.update(sim.all(), -1, 0);
    expect(textures.part).toHaveBeenCalledTimes(1);
    expect(textures.name).toHaveBeenCalledTimes(1);
    const nameTexture = textures.name.mock.results[0].value;
    const disposeTexture = vi.spyOn(nameTexture, 'dispose');
    const firstRig = scene.children.find((child) => child instanceof Group)!;
    const geometries = [] as ReturnType<typeof vi.spyOn>[];
    firstRig.traverse((part) => {
      if (part instanceof Mesh) geometries.push(vi.spyOn(part.geometry, 'dispose'));
    });
    const firstTag = scene.children.find((child) => child instanceof Sprite) as Sprite;
    const disposeTag = vi.spyOn(firstTag.material, 'dispose');
    sim.despawn(first.id);
    renderer.update(sim.all(), -1, 0);
    expect(renderer.rigCount).toBe(1);
    expect(scene.children).not.toContain(firstRig);
    for (const dispose of geometries) expect(dispose).toHaveBeenCalledTimes(1);
    expect(disposeTag).toHaveBeenCalledTimes(1);
    expect(disposeTexture).not.toHaveBeenCalled();
    renderer.dispose();
    expect(scene.children).toHaveLength(0);
    expect(renderer.rigCount).toBe(0);
    expect(disposeTexture).toHaveBeenCalledTimes(1);
    renderer.dispose();
    expect(disposeTexture).toHaveBeenCalledTimes(1);
  });

  it('applies brightness to existing and newly created kind materials', () => {
    const { scene, sim, renderer } = setup();
    sim.spawn({ x: 0, y: 0, z: 0 }, new IdleController());
    renderer.update(sim.all(), -1, 0);
    renderer.setBrightness(0.3);
    sim.spawn({ x: 1, y: 0, z: 0 }, new IdleController(), { kindId: 'deer' });
    renderer.update(sim.all(), -1, 0);
    scene.traverse((part) => {
      if (part instanceof Mesh && part.material instanceof MeshBasicMaterial) {
        expect(part.material.color.toArray()).toEqual([0.3, 0.3, 0.3]);
      }
    });
    renderer.dispose();
  });
});
