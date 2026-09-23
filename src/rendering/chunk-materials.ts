import { DoubleSide, MeshBasicMaterial, type Texture } from 'three';
import { LIGHT_AMBIENT } from '../light';

interface LightUniforms {
  dayness: { value: number };
  ambient: { value: number };
}

function applyVertexLighting(material: MeshBasicMaterial, uniforms: LightUniforms): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDayness = uniforms.dayness;
    shader.uniforms.uAmbient = uniforms.ambient;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec2 aLight;\nvarying vec2 vLight;',
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLight = aLight;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uDayness;\nuniform float uAmbient;\nvarying vec2 vLight;',
      )
      .replace(
        '#include <color_fragment>',
        `float bwLight = clamp(max(vLight.x, vLight.y * uDayness), 0.0, 1.0);
diffuseColor.rgb *= uAmbient + (1.0 - uAmbient) * bwLight;
#include <color_fragment>`,
      );
  };
}

export class ChunkMaterials {
  readonly opaque: MeshBasicMaterial;
  readonly transparent: MeshBasicMaterial;
  private readonly uniforms: LightUniforms = {
    dayness: { value: 1 },
    ambient: { value: LIGHT_AMBIENT },
  };

  constructor(atlas: Texture) {
    this.opaque = new MeshBasicMaterial({ map: atlas, vertexColors: true });
    this.transparent = new MeshBasicMaterial({
      map: atlas,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: DoubleSide,
    });
    applyVertexLighting(this.opaque, this.uniforms);
    applyVertexLighting(this.transparent, this.uniforms);
  }

  setDayness(dayness: number): void {
    // Sky light fades without remeshing; block light remains independent of time of day.
    this.uniforms.dayness.value = dayness;
  }

  setWireframe(enabled: boolean): void {
    this.opaque.wireframe = enabled;
    this.transparent.wireframe = enabled;
  }

  dispose(): void {
    this.opaque.dispose();
    this.transparent.dispose();
    // The atlas is borrowed and remains available to its other consumers.
  }
}
