import type { Sim } from '../entity';
import { snapshotChunk } from '../persistence';
import { snapshotWorldMeta } from '../persistence/world-snapshot';
import { Recorder, type Replay, type ReplaySnapshot } from '../replay';
import type { WorldTime } from '../time';
import type { Hotbar } from '../ui/hotbar';
import type { World } from '../world';

interface RecordingSource {
  seed: number;
  world: World;
  sim: Sim;
  clock: WorldTime;
  hotbar: Hotbar;
}

interface ActiveRecording {
  source: RecordingSource;
  recorder: Recorder;
  snapshot: ReplaySnapshot;
  startTick: number;
  simPrng: number;
}

function captureSnapshot({ seed, world, sim, clock, hotbar }: RecordingSource): ReplaySnapshot {
  return {
    chunks: [...world.allChunks()].map((chunk) => snapshotChunk(chunk)),
    meta: snapshotWorldMeta({ seed, sim, clock, hotbar }),
  };
}

export class RecordingSession {
  private current: ActiveRecording | null = null;

  constructor(
    private readonly saveReplay: (key: string, replay: Replay) => void,
    private readonly now: () => number = Date.now,
  ) {}

  get active(): boolean {
    return this.current !== null;
  }

  start(source: RecordingSource): void {
    if (this.current) return;
    const startTick = source.clock.tick;
    const simPrng = source.sim.rng.state();
    // Playback restores the initial state, then applies the recorded deltas.
    const snapshot = captureSnapshot(source);
    const recorder = new Recorder(startTick);
    recorder.attach(source.sim);
    this.current = { source, recorder, snapshot, startTick, simPrng };
  }

  recordViewed(): void {
    if (!this.current) return;
    const { source, recorder } = this.current;
    recorder.onViewed(source.clock.tick, source.sim.viewedId);
  }

  stop(): { key: string; replay: Replay } | null {
    if (!this.current) return null;
    const { source, recorder, snapshot, startTick, simPrng } = this.current;
    const replay: Replay = {
      seed: source.seed,
      startTick,
      endTick: source.clock.tick,
      simPrng,
      events: recorder.events,
      intents: recorder.intents,
      viewed: recorder.viewed,
      recordedAt: this.now(),
      snapshot,
    };
    const key = `${source.seed}:replay:${startTick}`;
    this.saveReplay(key, replay);
    source.sim.onIntent = source.sim.onSpawn = source.sim.onDespawn = undefined;
    this.current = null;
    return { key, replay };
  }
}
