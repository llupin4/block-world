import { describe, expect, it, vi } from 'vitest';
import {
  DoubleSide,
  ShaderLib,
  Texture,
  UniformsUtils,
  type MeshBasicMaterial,
  type WebGLRenderer,
} from 'three';
import { ChunkMaterials } from '../rendering/chunk-materials';
import { LIGHT_AMBIENT } from '../light';

function compile(material: MeshBasicMaterial) {
  const shader = {
    vertexShader: ShaderLib.basic.vertexShader,
    fragmentShader: ShaderLib.basic.fragmentShader,
    uniforms: UniformsUtils.clone(ShaderLib.basic.uniforms),
  };
  material.onBeforeCompile(
    shader as Parameters<MeshBasicMaterial['onBeforeCompile']>[0],
    {} as WebGLRenderer,
  );
  return shader;
}

describe('chunk materials', () => {
  it('preserves opaque and transparent rendering settings', () => {
    const atlas = new Texture();
    const materials = new ChunkMaterials(atlas);
    expect(materials.opaque.map).toBe(atlas);
    expect(materials.opaque.vertexColors).toBe(true);
    expect(materials.opaque.transparent).toBe(false);
    expect(materials.opaque.depthWrite).toBe(true);
    expect(materials.transparent.map).toBe(atlas);
    expect(materials.transparent.vertexColors).toBe(true);
    expect(materials.transparent.transparent).toBe(true);
    expect(materials.transparent.opacity).toBe(0.85);
    expect(materials.transparent.depthWrite).toBe(false);
    expect(materials.transparent.side).toBe(DoubleSide);
    materials.setWireframe(true);
    expect(materials.opaque.wireframe).toBe(true);
    expect(materials.transparent.wireframe).toBe(true);
    materials.setWireframe(false);
    expect(materials.opaque.wireframe).toBe(false);
    expect(materials.transparent.wireframe).toBe(false);
    materials.dispose();
    atlas.dispose();
  });

  it('keeps compiled and recompiled shaders connected to the day/night uniform', () => {
    const atlas = new Texture();
    const materials = new ChunkMaterials(atlas);
    materials.setDayness(0.25);
    const opaque = compile(materials.opaque);
    const transparent = compile(materials.transparent);
    expect(opaque.uniforms.uDayness.value).toBe(0.25);
    expect(opaque.uniforms.uAmbient.value).toBe(LIGHT_AMBIENT);
    expect(opaque.vertexShader).toContain('attribute vec2 aLight;');
    expect(opaque.vertexShader).toContain('vLight = aLight;');
    expect(opaque.fragmentShader).toContain('max(vLight.x, vLight.y * uDayness)');
    expect(opaque.fragmentShader).toContain('#include <color_fragment>');
    materials.setDayness(0.8);
    expect(opaque.uniforms.uDayness.value).toBe(0.8);
    expect(transparent.uniforms.uDayness.value).toBe(0.8);
    expect(compile(materials.opaque).uniforms.uDayness.value).toBe(0.8);
    materials.dispose();
    atlas.dispose();
  });

  it('releases its materials without disposing the shared atlas', () => {
    const atlas = new Texture();
    const materials = new ChunkMaterials(atlas);
    const disposeAtlas = vi.spyOn(atlas, 'dispose');
    const disposeOpaque = vi.spyOn(materials.opaque, 'dispose');
    const disposeTransparent = vi.spyOn(materials.transparent, 'dispose');
    materials.dispose();
    expect(disposeOpaque).toHaveBeenCalledOnce();
    expect(disposeTransparent).toHaveBeenCalledOnce();
    expect(disposeAtlas).not.toHaveBeenCalled();
    atlas.dispose();
  });
});
