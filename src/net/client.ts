import { World, chunkKey, chunkOf } from '../world';
import { Sim, NULL_INTENT, type Controller, type Intent } from '../entity';
import { applyRecord, type ChunkRecord } from '../persistence';
import { update as streamUpdate, VIEW_RADIUS, type Anchor, type StreamingUpdate } from '../streaming';
import { type Msg, type CellWrite, PROTOCOL_VERSION, NET_INTERP_TICKS } from './messages';
import { NetworkPersistSource } from './network-persist';
import { intentEqual } from '../replay';
import { type Transport } from './transport';
import { WorldTime } from '../time';
import { PoseRing, interpose } from './interp';

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
  readonly worldTime = new WorldTime(); // the client's clock: tick per frame, time+phaseTotal sleet from the host's `time`
  private readonly transport: Transport;
  private name = '';
  entityId = -1; // the host-assigned id for this client's entity (set on welcome); public for tests/rejoin
  lastStream: StreamingUpdate | null = null; // the last substep's own-ring streaming result (the frame consumes it)
  private rings = new Map<number, PoseRing>(); // per-entity jitter buffer (host-tick-tagged poses)
  private lightEdit: ((x: number, y: number, z: number) => void) | null = null; // set by the boot (the page's lightSim.edit)
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

  /** The boot wires the page's light worker here: on a `cells` batch the client's light tracks the host's edits. */
  setLightEdit(fn: (x: number, y: number, z: number) => void): void { this.lightEdit = fn; }

  /** The boot registers a leave handler here: when the host disconnects, the client shows "host left" + stops driving. */
  onPeerLeave(cb: (id: string) => void): void { this.transport.onPeerLeave(cb); }

  private parse(key: string): [number, number, number] {
    const [a, b, c] = key.split(',').map(Number);
    return [a, b, c];
  }

  onMessage(msg: Msg): void {
    switch (msg.type) {
      case 'welcome': {
        this.entityId = msg.yourEntityId;
        this.joined = true;
        this.worldTime.slew(msg.worldTime); // adopt the host's clock (time + phaseTotal)
        this.worldTime.tick = msg.tick; // the host tick at welcome
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
        for (const n of msg.entities) {
          if (n.id === this.entityId) this.own = { x: n.x, y: n.y, z: n.z, yaw: n.yaw, pitch: n.pitch };
          let ring = this.rings.get(n.id);
          if (!ring) { ring = new PoseRing(); this.rings.set(n.id, ring); }
          ring.push({ tick: msg.tick, x: n.x, y: n.y, z: n.z, yaw: n.yaw, pitch: n.pitch }); // host-tick-tagged sample (interpolation)
          const ent = this.sim.entities.get(n.id);
          if (ent) { ent.pos = { x: n.x, y: n.y, z: n.z }; ent.yaw = n.yaw; ent.pitch = n.pitch; if (n.name) ent.name = n.name; }
        }
        break;
      case 'cells': this.applyCells(msg.chunk, msg.writes); break;
      case 'spawn': this.sim.restoreEntity(msg.pose, NULL_CTRL); break;
      case 'despawn': this.sim.despawn(msg.id); this.rings.delete(msg.id); break;
      case 'time': this.worldTime.slew(msg.worldTime); break; // the client keeps its own tick (the frame loop owns it)
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
      if (this.lightEdit) { // the client's light tracks the host's edits (localIndex = lx + lz*16 + ly*256)
        const lx = idx % 16, lz = ((idx / 16) | 0) % 16, ly = ((idx / 256) | 0) % 16;
        this.lightEdit(cx * 16 + lx, cy * 16 + ly, cz * 16 + lz);
      }
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
    const e = this.sim.viewed();
    if (e) {
      const it = this.controller.intent(e, _tick);
      if (!intentEqual(this.lastIntent, it)) {
        this.lastIntent = { ...it };
        if (this.joined) this.transport.send('all', { type: 'intent', tick: _tick, intent: it });
      }
    }
    const anchor: Anchor = { cx: chunkOf(this.own.x), cz: chunkOf(this.own.z), cy: 2, radius: VIEW_RADIUS, meshable: true };
    const r = streamUpdate(this.world, [anchor], this.persist, this.sim);
    this.lastStream = r; // [B1] the frame consumes it once per frame (consumeStream)
    for (const c of r.generated) this.transport.send('all', { type: 'chunkLoaded', key: chunkKey(c.cx, c.cy, c.cz) });
    for (const c of r.unloaded) this.transport.send('all', { type: 'chunkUnloaded', key: chunkKey(c.cx, c.cy, c.cz) });
  }

  /** The frame calls this once per frame (after the substep): interpolate each entity's pose at
   * renderTick = worldTime.tick − NET_INTERP_TICKS and write it to the sim (so the rig + camera
   * use the interpolated pose). The own body's position is interpolated; its look is client-owned
   * (the camera's yaw/pitch come from the human controller, not this). */
  syncPoses(): void {
    const renderTick = this.worldTime.tick - NET_INTERP_TICKS;
    for (const [id, ring] of this.rings) {
      const ent = this.sim.entities.get(id);
      if (!ent) continue;
      const p = interpose(ring.samples, renderTick);
      ent.pos = { x: p.x, y: p.y, z: p.z }; ent.yaw = p.yaw; ent.pitch = p.pitch;
    }
  }

  /** Drop the connection (the host sees the peer leave and persists the pose). */
  disconnect(): void { this.transport.disconnect(); }
}