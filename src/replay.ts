import { type ChunkRecord, type WorldMeta } from './persistence';
import { NULL_INTENT, type Entity, type Intent, type EntityRecord, type Controller } from './entity';

// A replay = an initial snapshot + a delta-coded intent log. Every state change flows
// through intents on the tick (ADR 0015), so this is a complete, replayable record.
export interface IntentEntry { tick: number; entityId: number; intent: Intent }
export interface EntityEvent { tick: number; type: 'spawn' | 'despawn'; id: number; kindId?: string; pose?: EntityRecord }
export interface ReplaySnapshot { chunks: ChunkRecord[]; meta: WorldMeta }
export interface Replay {
  seed: number; startTick: number; endTick: number;
  simPrng: number;           // the sim PRNG state at record start (restore before replaying)
  events: EntityEvent[];
  intents: IntentEntry[];    // delta-coded: an entity with no entry at a tick REPEATS its previous intent
  viewed?: { tick: number; id: number }[]; // the user's PERSPECTIVE over time (possession changes), tick-ordered.
                                            // Optional: old recordings lack it (they follow the snapshot's
                                            // viewedEntityId for the whole session).
  snapshot: ReplaySnapshot;  // every loaded chunk + the WorldMeta at record start (ADR 0014 shapes)
}

/** Delta-coding comparison. Optional fields (`select`/`block`/toggles) compare with a
 *  sentinel so "absent" and "present-but-default" are distinguished. */
export function intentEqual(a: Intent | undefined, b: Intent): boolean {
  if (!a) return false;
  return a.forward === b.forward && a.strafe === b.strafe && a.up === b.up && a.down === b.down
    && a.yaw === b.yaw && a.pitch === b.pitch && a.primary === b.primary && a.secondary === b.secondary
    && (a.select ?? -1) === (b.select ?? -1) && (a.block ?? -1) === (b.block ?? -1)
    && (a.toggleFly ?? false) === (b.toggleFly ?? false) && (a.toggleNoclip ?? false) === (b.toggleNoclip ?? false);
}

/**
 * Captures a session: intents (delta-coded, via `sim.onIntent`) and entity spawn/despawn
 * events (via `sim.onSpawn`/`sim.onDespawn`). `attach` wires the sim's callbacks.
 */
export class Recorder {
  readonly events: EntityEvent[] = [];
  readonly intents: IntentEntry[] = [];
  readonly viewed: { tick: number; id: number }[] = []; // the user's perspective over time (possession)
  private last = new Map<number, Intent>();
  private lastTick: number;
  onIntent: (tick: number, e: Entity, it: Intent) => void;
  constructor(startTick: number) {
    this.lastTick = startTick;
    this.onIntent = (tick, e, it) => {
      this.lastTick = tick;
      const prev = this.last.get(e.id);
      if (!intentEqual(prev, it)) {
        this.intents.push({ tick, entityId: e.id, intent: { ...it } });
        this.last.set(e.id, it);
      }
    };
  }
  /** Log a change in the viewed entity (possession). The replay follows this timeline so the
   *  viewer sees what the recorder was actually looking at (a possessed deer, not always the body). */
  onViewed(tick: number, id: number): void { this.viewed.push({ tick, id }); }
  attach(sim: { onIntent?: any; onSpawn?: any; onDespawn?: any; toRecord: (e: Entity) => EntityRecord }): void {
    sim.onIntent = this.onIntent;
    // A spawn event carries the entity's pose (via toRecord) so playback can re-spawn it.
    sim.onSpawn = (e: Entity) => this.events.push({ tick: this.lastTick, type: 'spawn', id: e.id, kindId: e.kind.id, pose: sim.toRecord(e) });
    sim.onDespawn = (e: Entity) => this.events.push({ tick: this.lastTick, type: 'despawn', id: e.id });
  }
}

/**
 * Feeds one entity its logged intents: at tick T it returns the LAST logged intent with
 * tick <= T (the "no entry means repeat previous" semantic); before the first entry it
 * returns NULL_INTENT. Entries must be in tick order (the recorder emits them so).
 */
export class ReplayController {
  private idx = 0;
  private last: Intent | null = null;
  constructor(private readonly entries: IntentEntry[]) {}
  intent(_e: Entity, tick: number): Intent {
    while (this.idx < this.entries.length && this.entries[this.idx].tick <= tick) {
      this.last = this.entries[this.idx].intent;
      this.idx++;
    }
    return this.last ? { ...this.last } : { ...NULL_INTENT };
  }
}

/** Spawn the entities whose spawn event fires at `tick` (from the event's pose + their
 *  controller). `restoreEntity` is a no-op for ids already present. Despawns are re-derived
 *  by the sim's fall-out-of-world rule, so only spawn events are re-applied. */
export function applySpawnAt(
  sim: { restoreEntity(rec: EntityRecord, c: Controller): Entity | null },
  replay: Replay, tick: number, controllerFor: (r: EntityRecord) => Controller,
): void {
  for (const ev of replay.events)
    if (ev.type === 'spawn' && ev.tick === tick && ev.pose)
      sim.restoreEntity(ev.pose, controllerFor(ev.pose));
}

/** Parse the `?replay=<key>` URL param (pure, node-testable). Returns the key or null. */
export function parseReplayParam(search: string): string | null {
  return new URLSearchParams(search).get('replay');
}

/** The viewed entity id at `tick` during playback: the snapshot's viewedEntityId (record start),
 *  switched to whatever the user possessed at each recorded viewed change. The `viewed` entries
 *  are tick-ordered (logged as the user presses P), so the last entry with tick <= the given tick
 *  wins. Old recordings (no `viewed`) follow the snapshot's viewedEntityId for the whole session. */
export function viewedAt(replay: Replay, tick: number): number {
  let id = replay.snapshot.meta.viewedEntityId;
  for (const vc of replay.viewed ?? []) {
    if (vc.tick <= tick) id = vc.id; else break;
  }
  return id;
}

export interface ReplayStore {
  putReplay(key: string, replay: Replay): Promise<void>;
  getReplay(key: string): Promise<Replay | undefined>;
}
/** Node-test backend (mirrors InMemoryChunkStore). */
export class InMemoryReplayStore implements ReplayStore {
  private data = new Map<string, Replay>();
  async putReplay(key: string, replay: Replay): Promise<void> { this.data.set(key, replay); }
  async getReplay(key: string): Promise<Replay | undefined> { return this.data.get(key); }
}