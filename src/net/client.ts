import { World, chunkKey, chunkOf } from '../world';
import { Sim, NULL_INTENT, stepEntity, type Controller, type Intent } from '../entity';
import { applyRecord, type ChunkRecord } from '../persistence';
import { update as streamUpdate, VIEW_RADIUS, type Anchor, type StreamingUpdate } from '../streaming';
import { type Msg, type CellWrite, PROTOCOL_VERSION, NET_INTERP_TICKS, PREDICT_BUFFER, NET_SNAP_EPS } from './messages';
import { NetworkPersistSource } from './network-persist';
import { intentEqual } from '../replay';
import { type Transport } from './transport';
import { WorldTime } from '../time';
import { PoseRing, interpose } from './interp';

// The fixed sim step (matches the host): the client's `tick(t)` is one 60 Hz substep (the frame
// loop in the browser, the harness in node), so prediction + reconciliation advance by this dt.
const STEP = 1 / 60;

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
  // Phase C: the own body is predicted locally (stepEntity on it each substep) + reconciled against
  // the host's `state`. `tick` is the client's current tick (the last `tick(t)` arg — the frame
  // loop owns it, not `worldTime.tick`); `predicted` is the buffer of the client's recent intents
  // (capped at PREDICT_BUFFER) that the reconciliation re-applies after the host's tick; `lastSnap`
  // records the magnitude of the most recent reconciliation correction (metrics; the immediate
  // snap + re-apply is the POC — a display lerp for a large snap is a follow-up).
  private tick_ = 0; // renamed to avoid clashing with the `tick(t)` method
  private predicted = new Map<number, Intent>();
  private lastSnap = 0;
  hostId = ''; // the host's peer id (the `welcome` sender) — the boot's "host left" handler keys off it
  private handlers = new Map<string, (() => void)[]>();

  constructor(transport: Transport, name: string, controller: Controller) {
    this.transport = transport;
    this.name = name;
    this.controller = controller;
    this.sim = new Sim(this.world, {}, 1234); // seed is irrelevant: no sim randomness on the client
    this.persist = new NetworkPersistSource(transport);
    // One message handler: route the chunkRec side channel to the persist source; the rest to onMessage.
    transport.onMessage((from, msg) => {
      if (msg.type === 'chunkRec') { this.applyChunkRec(msg.key, msg.rec); return; }
      if (msg.type === 'welcome' && !this.hostId) this.hostId = from; // the host is the welcome sender
      this.onMessage(msg);
    });
    // Join: the host spawns the remote player and replies with a welcome (snapshot).
    transport.send('all', { type: 'hello', name, protocol: PROTOCOL_VERSION });
    // A real transport's data channel opens seconds after construction (the loopback is already
    // connected), so the construction-time hello is dropped when no peer is connected yet. Re-send
    // it when a peer joins, until the welcome arrives (then it is a no-op). The loopback is
    // unaffected: the host peer is added before the constructor registers this callback.
    transport.onPeerJoin((_id) => {
      if (!this.joined) transport.send('all', { type: 'hello', name: this.name, protocol: PROTOCOL_VERSION });
    });
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
        if (this.sim.entities.has(this.entityId)) this.sim.homeId = this.entityId; // possession's return-to-body target
        this.fire('welcome');
        break;
      }
      case 'state':
        for (const n of msg.entities) {
          if (n.id === this.entityId) {
            this.own = { x: n.x, y: n.y, z: n.z, yaw: n.yaw, pitch: n.pitch };
            this.reconcile(n, msg.tick); // the own body: snap to the host pose + re-apply the buffered intents
            continue; // not ring-interpolated (predicted + reconciled instead)
          }
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

  /** Phase C: reconcile the own body against the host's word. Snap the own entity to the host's
   * authoritative pose + velocity + flags (pos/vel/look/inWater/onGround from the `NetEntity`),
   * then re-apply the buffered intents for `(refTick+1 .. this.tick_)` to fast-forward the
   * prediction to the client's current tick (dead reckoning on the client's local world). The
   * vel + flags MUST be snapped (not just the pose): the state carries them, and a pose-only snap
   * leaves the client's divergent vel/ground to drift the re-apply away from the host. `refTick`
   * is the state's `tick` (the host's tick at broadcast — the pose reflects the peer's intents
   * applied up to and including it). Record the correction magnitude in `lastSnap` (a
   * > NET_SNAP_EPS correction is a visible snap; the immediate snap + re-apply is the POC — a
   * display lerp for a large snap is a follow-up). */
  private reconcile(n: { x: number; y: number; z: number; yaw: number; pitch: number; vx: number; vy: number; vz: number; flags: number }, refTick: number): void {
    const e = this.sim.entities.get(this.entityId);
    if (!e) return;
    const pre = { x: e.pos.x, y: e.pos.y, z: e.pos.z }; // the pre-reconcile (predicted) pose
    // snap the full authoritative state (pose + vel + flags) so the re-apply starts from the host's
    // exact entity state, not the client's divergent prediction.
    e.pos = { x: n.x, y: n.y, z: n.z }; e.yaw = n.yaw; e.pitch = n.pitch;
    e.vel = { x: n.vx, y: n.vy, z: n.vz };
    e.inWater = (n.flags & 1) !== 0; e.onGround = (n.flags & 2) !== 0;
    for (let t = refTick + 1; t <= this.tick_; t++) { // re-apply the buffered intents (fast-forward)
      const it = this.predicted.get(t);
      if (it) stepEntity(this.world, e, it, STEP);
    }
    this.lastSnap = Math.hypot(e.pos.x - pre.x, e.pos.y - pre.y, e.pos.z - pre.z);
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
    const ch = this.world.getChunk(cx, cy, cz);
    if (ch) ch.dirty = true; // force the client's streaming remesh pass to rebuild the host-corrected chunk
    this.persist.resolveChunk(key, rec);
  }

  /** One 60 Hz substep: record + predict the own body (Phase C), send the intent (on change),
   * stream the own ring, announce chunk loads. */
  tick(tick: number): void {
    this.tick_ = tick; // the client's current tick (the frame loop / harness owns it)
    const e = this.sim.viewed();
    if (e) {
      const it = this.controller.intent(e, tick);
      // Phase C: buffer the intent (capped) for the reconciliation's re-apply + predict the own
      // body locally (movement only — actions are host-applied). Predict only once joined (the own
      // entity exists + the welcome loaded the spawn ring, so the local world has the terrain).
      this.predicted.set(tick, it);
      if (this.predicted.size > PREDICT_BUFFER) {
        const oldest = Math.min(...this.predicted.keys());
        this.predicted.delete(oldest);
      }
      if (!intentEqual(this.lastIntent, it)) {
        this.lastIntent = { ...it };
        if (this.joined) this.transport.send('all', { type: 'intent', tick, intent: it });
      }
      if (this.joined) stepEntity(this.world, e, it, STEP);
    }
    // the streaming anchor follows the predicted own-body pos (not the last host state pose).
    const anchor: Anchor = { cx: chunkOf(e ? e.pos.x : this.own.x), cz: chunkOf(e ? e.pos.z : this.own.z), cy: 2, radius: VIEW_RADIUS, meshable: true };
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
      if (id === this.entityId) continue; // the own body is predicted + reconciled, never interpolated
      const ent = this.sim.entities.get(id);
      if (!ent) continue;
      const p = interpose(ring.samples, renderTick);
      ent.pos = { x: p.x, y: p.y, z: p.z }; ent.yaw = p.yaw; ent.pitch = p.pitch;
    }
  }

  /** Drop the connection (the host sees the peer leave and persists the pose). */
  disconnect(): void { this.transport.disconnect(); }
}