import { NULL_INTENT, type Controller, type Entity, type Intent } from '../entity';

// Feeds one remote peer's entity the peer's latest received intent. Sibling of
// ReplayController (replay.ts): a `RemoteController` per remote player; the host sets its
// last intent from `intent` messages. Returns a copy so a caller cannot mutate the held intent.
export class RemoteController implements Controller {
  private last: Intent | null = null;
  constructor(readonly peerId: string) {}
  setIntent(it: Intent): void { this.last = { ...it }; }
  intent(_e: Entity, _tick: number): Intent { return this.last ? { ...this.last } : { ...NULL_INTENT }; }
}