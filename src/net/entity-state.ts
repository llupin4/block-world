import type { Entity } from '../entity';
import { NET_MOB_STATE_STRIDE, type NetEntity } from './messages';

export function shouldSendEntity(entity: Entity, tick: number): boolean {
  return entity.kind.id === 'player' || tick % NET_MOB_STATE_STRIDE === 0;
}

export function entityState(entity: Entity): NetEntity {
  // Player reconciliation retains full precision. Mob poses are presentation-only on clients.
  const scalar =
    entity.kind.id === 'player' ? (n: number) => n : (n: number) => Math.round(n * 1000) / 1000;
  return {
    id: entity.id,
    kindId: entity.kind.id,
    name: entity.name,
    x: scalar(entity.pos.x),
    y: scalar(entity.pos.y),
    z: scalar(entity.pos.z),
    yaw: scalar(entity.yaw),
    pitch: scalar(entity.pitch),
    vx: scalar(entity.vel.x),
    vy: scalar(entity.vel.y),
    vz: scalar(entity.vel.z),
    flags: (entity.inWater ? 1 : 0) | (entity.onGround ? 2 : 0),
  };
}
