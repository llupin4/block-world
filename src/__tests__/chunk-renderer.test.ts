import { describe, expect, it, vi } from 'vitest';
import { Mesh, MeshBasicMaterial, Scene } from 'three';
import { Block } from '../blocks';
import { meshChunk } from '../chunk-mesher';
import { World } from '../world';
import { ChunkRenderer } from '../rendering/chunk-renderer';

function setup() {
  const scene = new Scene();
  const opaque = new MeshBasicMaterial();
  const transparent = new MeshBasicMaterial({ transparent: true });
  const renderer = new ChunkRenderer(scene, opaque, transparent);
  const world = new World();
  world.ensureChunk(1, 0, 0);
  world.setBlock(16, 0, 0, Block.Stone);
  world.setBlock(18, 0, 0, Block.Glass);
  const mesh = meshChunk(world, 1, 0, 0);
  return { scene, opaque, transparent, renderer, mesh };
}

describe('chunk renderer', () => {
  it('renders both mesh layers with world-space vertices and shared materials', () => {
    const { scene, opaque, transparent, renderer, mesh } = setup();
    renderer.replace('1,0,0', mesh);
    const [solid, glass] = scene.children as Mesh[];
    expect(renderer.chunkCount).toBe(1);
    expect(scene.children).toHaveLength(2);
    expect(solid.material).toBe(opaque);
    expect(glass.material).toBe(transparent);
    expect(solid.position.toArray()).toEqual([0, 0, 0]);
    expect(solid.geometry.getAttribute('position').array).toEqual(mesh.opaque!.positions);
    expect(glass.geometry.getAttribute('aLight').array).toEqual(mesh.trans!.light);
    renderer.dispose();
    opaque.dispose();
    transparent.dispose();
  });

  it('replaces both layers and counts an empty completed mesh', () => {
    const { scene, opaque, transparent, renderer, mesh } = setup();
    renderer.replace('1,0,0', mesh);
    const previous = scene.children.slice() as Mesh[];
    const disposals = previous.map((object) => vi.spyOn(object.geometry, 'dispose'));
    renderer.replace('1,0,0', { opaque: null, trans: null });
    expect(scene.children).toHaveLength(0);
    expect(renderer.chunkCount).toBe(1);
    for (const dispose of disposals) expect(dispose).toHaveBeenCalledTimes(1);
    renderer.remove('1,0,0');
    expect(renderer.chunkCount).toBe(0);
    renderer.remove('missing');
    renderer.dispose();
    for (const dispose of disposals) expect(dispose).toHaveBeenCalledTimes(1);
    opaque.dispose();
    transparent.dispose();
  });

  it('unloads only the requested chunk and leaves borrowed materials alive', () => {
    const { scene, opaque, transparent, renderer, mesh } = setup();
    const disposeOpaque = vi.spyOn(opaque, 'dispose');
    const disposeTransparent = vi.spyOn(transparent, 'dispose');
    renderer.replace('first', mesh);
    renderer.replace('second', mesh);
    renderer.remove('first');
    expect(scene.children).toHaveLength(2);
    expect(renderer.chunkCount).toBe(1);
    renderer.dispose();
    renderer.dispose();
    expect(scene.children).toHaveLength(0);
    expect(renderer.chunkCount).toBe(0);
    expect(disposeOpaque).not.toHaveBeenCalled();
    expect(disposeTransparent).not.toHaveBeenCalled();
    opaque.dispose();
    transparent.dispose();
  });
});
