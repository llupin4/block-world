import { Mesh, MeshBasicMaterial, Scene, Sprite, SpriteMaterial, type Texture } from 'three';
import type { Entity } from '../entity';
import {
  advanceRigAnim,
  buildEntityRig,
  buildPartAtlas,
  LEG_RATE,
  newRigAnim,
  RIG_COLORS,
  updateEntityRig,
  type Rig,
  type RigAnim,
} from '../entity-mesh';
import { createNameTexture } from './name-texture';

interface TextureFactories {
  part(color: number, seed: number): Texture;
  name(name: string): Texture;
}

interface RenderedEntity {
  rig: Rig;
  animation: RigAnim;
}

export class EntityRenderer {
  private readonly materials = new Map<string, MeshBasicMaterial>();
  private readonly rigs = new Map<number, RenderedEntity>();
  private readonly nameTextures = new Map<string, Texture>();
  private readonly nameTags = new Map<number, Sprite>();
  private brightness = 1;

  constructor(
    private readonly scene: Scene,
    private readonly textures: TextureFactories = { part: buildPartAtlas, name: createNameTexture },
  ) {}

  get rigCount(): number {
    return this.rigs.size;
  }

  hasRig(id: number): boolean {
    return this.rigs.has(id);
  }

  update(
    entities: readonly Entity[],
    viewedId: number,
    dt: number,
    isVisible: (entity: Entity) => boolean = () => true,
  ): void {
    const seen = new Set<number>();
    for (const entity of entities) {
      seen.add(entity.id);
      if (!entity.kind.collides) continue;
      this.updateEntity(entity, entity.id !== viewedId && isVisible(entity), dt);
    }
    for (const id of this.rigs.keys()) {
      if (!seen.has(id)) this.removeEntity(id);
    }
  }

  setBrightness(brightness: number): void {
    this.brightness = brightness;
    for (const material of this.materials.values()) material.color.setScalar(brightness);
  }

  private materialFor(kind: string): MeshBasicMaterial {
    let material = this.materials.get(kind);
    if (!material) {
      material = new MeshBasicMaterial({
        map: this.textures.part(RIG_COLORS[kind] ?? 0x888888, 0x5eed),
      });
      material.color.setScalar(this.brightness);
      this.materials.set(kind, material);
    }
    return material;
  }

  private updateEntity(entity: Entity, visible: boolean, dt: number): void {
    let rendered = this.rigs.get(entity.id);
    if (!rendered) {
      const rig = buildEntityRig(entity.kind, this.materialFor(entity.kind.id));
      if (!rig) return;
      rendered = { rig, animation: newRigAnim() };
      this.rigs.set(entity.id, rendered);
      this.scene.add(rig.root);
    }
    advanceRigAnim(rendered.animation, entity, dt, LEG_RATE[entity.kind.id] ?? 4);
    updateEntityRig(rendered.rig, entity, rendered.animation);
    rendered.rig.root.visible = visible;
    if (entity.name) this.updateNameTag(entity, entity.name, visible);
  }

  private updateNameTag(entity: Entity, name: string, visible: boolean): void {
    let tag = this.nameTags.get(entity.id);
    if (!tag) {
      let texture = this.nameTextures.get(name);
      if (!texture) {
        texture = this.textures.name(name);
        this.nameTextures.set(name, texture);
      }
      tag = new Sprite(new SpriteMaterial({ map: texture, depthTest: false }));
      tag.scale.set(1.6, 0.4, 1);
      this.scene.add(tag);
      this.nameTags.set(entity.id, tag);
    }
    tag.position.set(entity.pos.x, entity.pos.y + 1.8, entity.pos.z);
    tag.visible = visible;
  }

  private removeEntity(id: number): void {
    const rendered = this.rigs.get(id);
    if (rendered) {
      this.scene.remove(rendered.rig.root);
      rendered.rig.root.traverse((part) => {
        if (part instanceof Mesh) part.geometry.dispose();
      });
      this.rigs.delete(id);
    }
    const tag = this.nameTags.get(id);
    if (tag) {
      this.scene.remove(tag);
      tag.material.dispose();
      this.nameTags.delete(id);
    }
  }

  dispose(): void {
    for (const id of this.rigs.keys()) this.removeEntity(id);
    for (const material of this.materials.values()) {
      material.map?.dispose();
      material.dispose();
    }
    // Name textures belong to the renderer; multiple sprites can share one.
    for (const texture of this.nameTextures.values()) texture.dispose();
    this.materials.clear();
    this.nameTextures.clear();
  }
}
