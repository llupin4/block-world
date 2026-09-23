import type { PerspectiveCamera } from 'three';
import type { Entity, Vec3 } from '../entity';

export const AIR_FOV = 70;
const WATER_FOV = 62;

interface ClientView {
  entityId: number;
  displayPosition: Vec3 | null;
  look: { yaw: number; pitch: number };
}

export class CameraView {
  private currentMood: 'air' | 'water' = 'air';

  constructor(private readonly camera: PerspectiveCamera) {
    camera.rotation.order = 'YXZ';
  }

  get mood(): 'air' | 'water' {
    return this.currentMood;
  }

  syncPose(entity: Entity | undefined, client: ClientView | null): void {
    if (!entity) return;
    const position =
      client && entity.id === client.entityId ? (client.displayPosition ?? entity.pos) : entity.pos;
    this.camera.position.set(position.x, position.y + entity.kind.eye, position.z);
    // Client look stays immediate even when its body position is reconciled smoothly.
    const look = client?.look ?? entity;
    this.camera.rotation.set(look.pitch, look.yaw, 0);
  }

  syncWater(headInWater: boolean): void {
    const mood = headInWater ? 'water' : 'air';
    if (mood === this.currentMood) return;
    this.currentMood = mood;
    this.camera.fov = headInWater ? WATER_FOV : AIR_FOV;
    this.camera.updateProjectionMatrix();
  }
}
