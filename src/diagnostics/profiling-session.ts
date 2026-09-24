import type { ChunkMesh } from '../chunk-mesher';
import type { Entity, HumanController } from '../entity';
import {
  ProfRig,
  PROF_WORST_KEY,
  meshVerts,
  type ProfRigOptions,
  type RemeshKind,
  type ProfReport,
} from '../prof-rig';
import type { World } from '../world';

export class ProfilingSession {
  private rig: ProfRig | null = null;
  private frameStart = 0;
  private drainMs = 0;

  constructor(private readonly now: () => number = () => performance.now()) {}

  start(
    options: Omit<ProfRigOptions, 'anchor'>,
    human: Pick<HumanController, 'frozen'>,
    viewed: Entity | undefined,
  ): void {
    human.frozen = true;
    if (viewed) viewed.noclip = true;
    this.rig = new ProfRig({
      ...options,
      anchor: viewed ? { ...viewed.pos } : { x: 0, y: 0, z: 0 },
    });
  }

  startFrame(): void {
    if (!this.rig) return;
    this.frameStart = this.now();
    this.drainMs = 0;
  }

  positionView(
    world: Pick<World, 'hasChunk'>,
    remesher: { has(key: string): boolean },
    viewed: Entity | undefined,
  ): void {
    if (!this.rig) return;
    const worstLoaded = world.hasChunk(2, 1, 0);
    // Worker lighting has no local settled flag; use remesh quiescence.
    const { waypoint } = this.rig.beginFrame({
      worstLoaded,
      worstSettled: worstLoaded && !remesher.has(PROF_WORST_KEY),
    });
    if (!viewed) return;
    Object.assign(viewed.pos, waypoint);
    viewed.vel = { x: 0, y: 0, z: 0 };
  }

  noteRemesh(key: string, stage: RemeshKind, mesh: ChunkMesh): void {
    if (key === PROF_WORST_KEY) this.rig?.noteRemesh(stage, meshVerts(mesh));
  }

  measureDrain(drain: () => void): void {
    if (!this.rig) {
      drain();
      return;
    }
    const start = this.now();
    drain();
    this.drainMs = this.now() - start;
  }

  finishFrame(): ProfReport | null {
    return this.rig?.noteFrame(this.now() - this.frameStart, this.drainMs) ?? null;
  }
}
