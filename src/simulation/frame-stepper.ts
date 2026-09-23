import type { Sim } from '../entity';
import { viewedAt, type Replay } from '../replay';
import type { WorldTime } from '../time';

const STEP = 1 / 60;
const MAX_FRAME_SECONDS = 0.1;

interface TickClient {
  tick(tick: number): void;
}

interface MultiplayerTicks {
  clients: readonly TickClient[];
  hub: { pump(tick: number): void } | null;
  host: (TickClient & { worldTime: Pick<WorldTime, 'tick'> }) | null;
}

interface FrameSimulation {
  sim: Pick<Sim, 'tick' | 'setViewed'>;
  clock: WorldTime;
  multiplayer: MultiplayerTicks | null;
  playback: { replay: Replay; paused: boolean } | null;
}

function tickMultiplayer({ clients, hub, host }: MultiplayerTicks, tick: number): void {
  for (const client of clients) client.tick(tick);
  hub?.pump(tick);
  if (host) {
    // A loopback client's headless host has a separate clock; align it before broadcast.
    host.worldTime.tick = tick;
    host.tick(tick);
  }
}

function stepSimulation({ sim, clock, multiplayer, playback }: FrameSimulation): void {
  if (playback?.paused) return;
  if (multiplayer) {
    tickMultiplayer(multiplayer, clock.tick);
    clock.advanceTick();
  } else {
    sim.tick(STEP, clock.tick);
    clock.advance(STEP);
  }
  if (playback) {
    sim.setViewed(viewedAt(playback.replay, clock.tick));
    if (clock.tick >= playback.replay.endTick) playback.paused = true;
  }
}

export class FrameStepper {
  private accumulated = 0;

  constructor(private last: number) {}

  advance(now: number, simulation: FrameSimulation): number {
    const dt = Math.min((now - this.last) / 1000, MAX_FRAME_SECONDS);
    this.last = now;
    this.accumulated += dt;
    while (this.accumulated >= STEP) {
      this.accumulated -= STEP;
      // Consume paused substeps too, so resuming never catches up the paused duration.
      stepSimulation(simulation);
    }
    return dt;
  }
}
