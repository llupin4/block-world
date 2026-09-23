import {
  eyeOf,
  lookDir,
  breakRayTarget,
  possessableCandidates,
  possessToggle,
  type Sim,
  type Controller,
  type ApplyHooks,
} from '../entity';
import { pickEntity, raycastVoxel, REACH, type RayHit } from '../raycast';
import type { World } from '../world';

export function findBlockTarget(world: World, sim: Sim, hooks: ApplyHooks): RayHit | null {
  const viewed = sim.viewed();
  if (!viewed) return null;
  const eye = eyeOf(viewed);
  const direction = lookDir(viewed.yaw, viewed.pitch);
  const others = sim.all().filter((entity) => entity.id !== viewed.id);
  // Preserve entity-first targeting: any entity hit within reach suppresses the block outline.
  if (pickEntity(eye, direction, others, REACH)) return null;
  return raycastVoxel(world, eye, direction, REACH, breakRayTarget(world, hooks));
}

export function possessFromView(sim: Sim, human: Controller): boolean {
  const viewed = sim.viewed();
  if (!viewed) return false;
  const candidates = possessableCandidates(sim, human);
  const hit = pickEntity(eyeOf(viewed), lookDir(viewed.yaw, viewed.pitch), candidates, REACH);
  possessToggle(sim, human, hit ? candidates[hit.index].id : null);
  return true;
}
