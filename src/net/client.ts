import { World, chunkKey, chunkOf } from '../world';
import { Sim, NULL_INTENT, type Controller, type Intent } from '../entity';
import { applyRecord, type ChunkRecord } from '../persistence';
import { update as streamUpdate, VIEW_RADIUS, type Anchor } from '../streaming';
import { type Msg, type CellWrite, PROTOCOL_VERSION } from './messages';
import { NetworkPersistSource } from './network-persist';
import { intentEqual } from '../replay';
import { type Transport } from './transport';

// A frozen container controller: client entities never self-drive (their poses come from `state`),
// so their controller just reports NULL_INTENT.
const NULL_CTRL: Controller = { intent: () => ({ ...NULL_INTENT }) };

// A client view of the host's world. No WaterSim, no mob AI, no spawning: terrain is
// generated locally (shared seed), edits/water arrive via `cells`/`chunkRec`, and entity
// poses arrive via `state`. The local Sim is an entity CONTAINER only — its tick is never
// called. Look (yaw/pitch) is client-owned.
export class ClientSession {
  readonly world = new World();
  readonly sim: Sim; // container only
  readonly persist: NetworkPersistSource;
  readonly controller: Controller;
  private readonly transport: Transport;
  private name = '';
  private entityId = -1;
  private own = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 }; // the last state pose for the own entity
  private lastIntent: Intent | undefined;
  private joined = false;
  private handlers = new Map<string, (() => void)[]>();

  constructor(transport: Transport, name: string, controller: Controller) {
    this.transport = transport;
    this.name = name;
    this.controller = controller;
    this.sim = new Sim(this.world, {}, 1234); // seed is irrelevant: no sim randomness on the client
    this.persist = new NetworkPersistSource(transport);
    // One message handler: route the chunkRec side channel to the persist source; the rest to onMessage.
    transport.onMessage((_from, msg) => {
      if (msg.type === 'chunkRec') { this.persist.resolveChunk(msg.key, msg.rec); return; }
      this.onMessage(msg);
    });
    // Join: the host spawns the remote player and replies with a welcome (snapshot).
    transport.send('all', { type: 'hello', name, protocol: PROTOCOL_VERSION });
  }

  on(ev: 'welcome', cb: () => void): void {
    const l = this.handlers.get(ev) ?? [];
    l.push(cb); this.handlers.set(ev, l);
  }
  private fire(ev: string): void { for (const cb of this.handlers.get(ev) ?? []) cb(); }

  private parse(key: string): [number, number, number] {
    const [a, b, c] = key.split(',').map(Number);
    return [a, b, c];
  }

  private onMessage(msg: Msg): void {
    switch (msg.type) {
      case 'welcome': {
        this.entityId = msg.yourEntityId;
        this.joined = true;
        for (const rec of msg.snapshot.chunks) {
          applyRecord(this.world, rec, this.sim, () => NULL_CTRL);
          // the client now HAS these chunks (not just streamed ones): announce them so the
          // host's cells flush reaches them.
          this.transport.send('all', { type: 'chunkLoaded', key: chunkKey(rec.cx, rec.cy, rec.cz) });
        }
        for (const er of msg.snapshot.meta.entities) this.sim.restoreEntity(er, NULL_CTRL);
        this.sim.setViewed(this.entityId);
        this.fire('welcome');
        break;
      }
      case 'state':
        for (const n of msg.entities) if (n.id === this.entityId) this.own = { x: n.x, y: n.y, z: n.z, yaw: n.yaw, pitch: n.pitch };
        break;
      case 'cells': this.applyCells(msg.chunk, msg.writes); break;
      case 'spawn': this.sim.restoreEntity(msg.pose, NULL_CTRL); break;
      case 'despawn': this.sim.despawn(msg.id); break;
      case 'time': break; // [POC shortcut] client slews worldTime here (phase B/C)
      default: break;
    }
  }

  private applyCells(key: string, writes: CellWrite[]): void {
    const [cx, cy, cz] = this.parse(key);
    const c = this.world.getChunk(cx, cy, cz);
    if (!c) return;
    for (const [idx, block, meta, l, s, p, st] of writes) {
      c.blocks[idx] = block; c.meta[idx] = meta;
      c.wlevel[idx] = l; c.wsource[idx] = s; c.wplaced[idx] = p; c.wstream[idx] = st;
    }
  }

  private applyChunkRec(key: string, rec: ChunkRecord | null): void {
    if (!rec) { this.persist.resolveChunk(key, null); return; } // keep pristine terrain
    const [cx, cy, cz] = this.parse(key);
    if (!this.world.hasChunk(cx, cy, cz)) return;
    applyRecord(this.world, rec, this.sim, () => NULL_CTRL);
    this.persist.resolveChunk(key, rec);
  }

  /** One 60 Hz substep: send the intent (on change), stream the own ring, announce chunk loads. */
  tick(_tick: number): void {
    const it = this.controller.intent(this.sim.viewed() ?? ({} as never), _tick);
    if (!intentEqual(this.lastIntent, it)) {
      this.lastIntent = { ...it };
      if (this.joined) this.transport.send('all', { type: 'intent', tick: _tick, intent: it });
    }
    const anchor: Anchor = { cx: chunkOf(this.own.x), cz: chunkOf(this.own.z), cy: 2, radius: VIEW_RADIUS, meshable: true };
    const r = streamUpdate(this.world, [anchor], this.persist, this.sim);
    for (const c of r.generated) this.transport.send('all', { type: 'chunkLoaded', key: chunkKey(c.cx, c.cy, c.cz) });
    for (const c of r.unloaded) this.transport.send('all', { type: 'chunkUnloaded', key: chunkKey(c.cx, c.cy, c.cz) });
  }
}