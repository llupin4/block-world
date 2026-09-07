import { World, chunkKey, chunkOf } from '../world';
import { WaterSim } from '../water';
import { Sim, IdleController, type Controller, type Entity, type EntityRecord, type ApplyHooks } from '../entity';
import { Persistence, snapshotChunk, InMemoryChunkStore, type ChunkRecord, type WorldMeta } from '../persistence';
import { Recorder, type ReplaySnapshot } from '../replay';
import { update as streamUpdate, type Anchor, type StreamingUpdate, VIEW_RADIUS as SR_VIEW_RADIUS, CY_MIN, CY_MAX } from '../streaming';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from '../terrain';
import { Block } from '../blocks';
import { WorldTime } from '../time';
import { NET_STATE_STRIDE, CELLS_FULL_THRESHOLD, NET_REMOTE_RADIUS, TIME_STRIDE, PROTOCOL_VERSION, type Msg, type NetEntity, type CellWrite } from './messages';
import { RemoteController } from './remote-controller';
import { type Transport } from './transport';

// The 60 Hz heartbeat + water pulse (the host runs the sim at the fixed timestep).
const STEP = 1 / 60, WATER_STRIDE = 30, WATER_PULSE = 1000;

interface Peer { name: string; entityId: number; controller: RemoteController; loaded: Set<string> }

export interface HostOpts { withOwnPlayer?: boolean; persist?: Persistence; hooks?: ApplyHooks }

// The authoritative host: owns the ONLY sim. Clients send intents; the host applies them
// through each peer's RemoteController. One tick(tick) = one 60 Hz substep, in order:
// sim → water heartbeat → cell flush → union-ring streaming → state broadcast (stride) → time.
// Clients never call sim.spawn — the host's ids are the only ids.
export class HostSession {
  readonly world = new World();
  readonly waterSim: WaterSim;
  readonly sim: Sim;
  readonly persist: Persistence;
  readonly recorder: Recorder;
  readonly spawn: { x: number; y: number; z: number };
  meshable = new Set<string>(); // chunk keys the host meshes (its own anchor's ring)
  lastStream: StreamingUpdate | null = null; // the last substep's streaming result (the frame consumes it once per frame)
  worldTime = new WorldTime(); // the host's authoritative clock (advanced per tick; the client slews from it)
  private readonly transport: Transport;
  private readonly seed: number;
  private peers = new Map<string, Peer>();
  private pendingCells = new Map<string, Map<number, CellWrite>>();

  constructor(transport: Transport, seed: number, opts: HostOpts = {}) {
    this.transport = transport;
    this.seed = seed;
    this.waterSim = new WaterSim(this.world);
    this.persist = opts.persist ?? new Persistence(new InMemoryChunkStore(), seed);
    this.sim = new Sim(this.world, opts.hooks ?? {}, seed);
    this.recorder = new Recorder(0);
    this.recorder.attach(this.sim);
    // Generate the spawn column (mirrors main.ts's boot column 0,·,2) and scan the topmost
    // non-air block for the SPAWN point (the host mirrors main.ts's spawn scan).
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = CY_MIN; cy <= CY_MAX; cy++) generateChunkTerrain(this.world, gen, 0, cy, 2);
    let sy = 79; while (sy > 0 && !this.isOpaque(this.world.getBlock(6, sy, 46))) sy--;
    this.spawn = { x: 6.5, y: sy + 1, z: 46.5 };
    this.sim.respawn = { ...this.spawn };
    if (opts.withOwnPlayer !== false) {
      const own = this.sim.spawn(this.spawn, new IdleController(), { yaw: -Math.PI / 2, kindId: 'player', baseController: new IdleController() });
      this.sim.setViewed(own.id);
    }
    // Cell-write collection (the `cells` source): read the FINAL state, coalesce by chunk.
    this.world.onCellWrite = (x, y, z) => {
      const cell = this.world.readCell(x, y, z);
      if (!cell) return;
      const k = chunkKey(cell.cx, cell.cy, cell.cz);
      let m = this.pendingCells.get(k);
      if (!m) { m = new Map(); this.pendingCells.set(k, m); }
      m.set(cell.idx, [cell.idx, cell.block, cell.meta, cell.l, cell.s, cell.p, cell.st]);
    };
    // Spawn/despawn events → broadcast to the clients' entity containers.
    this.sim.onSpawn = (e: Entity) => { this.broadcast({ type: 'spawn', tick: this.worldTime.tick, id: e.id, kindId: e.kind.id, pose: this.sim.toRecord(e) }); };
    this.sim.onDespawn = (e: Entity) => { this.broadcast({ type: 'despawn', tick: this.worldTime.tick, id: e.id }); };
    this.transport.onMessage((from, msg) => this.onMessage(from, msg));
    this.transport.onPeerLeave((id) => this.onPeerLeave(id));
  }

  private isOpaque(b: number): boolean {
    return b !== Block.Air && b !== Block.Torch; // [POC shortcut] spawn-scan only; the sim uses isSolid for collision
  }

  private onMessage(from: string, msg: Msg): void {
    switch (msg.type) {
      case 'hello': this.onHello(from, msg.name, msg.protocol); break;
      case 'intent': { const p = this.peers.get(from); if (p) p.controller.setIntent(msg.intent); break; }
      case 'chunkReq': this.onChunkReq(from, msg.key); break;
      case 'chunkLoaded': this.peers.get(from)?.loaded.add(msg.key); break;
      case 'chunkUnloaded': this.peers.get(from)?.loaded.delete(msg.key); break;
      default: break; // state/cells/chunkRec/time are host→client
    }
  }

  private onHello(from: string, name: string, protocol: number): void {
    if (protocol !== PROTOCOL_VERSION) { console.warn(`[host] refusing ${name}: protocol ${protocol} != ${PROTOCOL_VERSION}`); return; } // [POC shortcut] no version-mismatch message yet
    let id = 0;
    const rc = new RemoteController(from);
    const saved = this.persist.meta?.peers?.[name];
    if (saved) {
      // rejoin: restore the saved entity (id + pose) and take it back under a fresh controller
      this.sim.restoreEntity(saved, rc);
      id = saved.id;
      this.peers.set(from, { name, entityId: id, controller: rc, loaded: new Set() });
    } else {
      const e = this.sim.spawn(this.spawn, rc, { yaw: -Math.PI / 2, kindId: 'player', baseController: rc });
      id = e.id;
      this.peers.set(from, { name, entityId: id, controller: rc, loaded: new Set() });
    }
    this.transport.send(from, { type: 'welcome', seed: this.seed, tick: this.worldTime.tick, worldTime: this.worldTime.snapshot(), yourEntityId: id, snapshot: this.welcomeSnapshot() });
  }

  private welcomeSnapshot(): ReplaySnapshot {
    const pcx = chunkOf(this.spawn.x), pcz = chunkOf(this.spawn.z);
    const chunks: ChunkRecord[] = [];
    for (let dx = -SR_VIEW_RADIUS; dx <= SR_VIEW_RADIUS; dx++)
      for (let dz = -SR_VIEW_RADIUS; dz <= SR_VIEW_RADIUS; dz++)
        for (let cy = CY_MIN; cy <= CY_MAX; cy++) {
          const c = this.world.getChunk(pcx + dx, cy, pcz + dz);
          if (c) chunks.push(snapshotChunk(c, this.sim.entitiesInChunk(c.cx, c.cy, c.cz).map((e) => this.sim.toRecord(e))));
        }
    return { chunks, meta: this.metaSnapshot() };
  }

  private metaSnapshot(): WorldMeta {
    return {
      v: 2, seed: this.seed,
      entities: this.sim.all().map((e) => this.sim.toRecord(e)),
      viewedEntityId: this.sim.viewedId,
      simPrng: this.sim.rng.state(),
      time: this.worldTime.snapshot(),
      hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 0 },
      peers: this.persist.meta?.peers,
    };
  }

  private onChunkReq(from: string, key: string): void {
    const [cx, cy, cz] = key.split(',').map(Number);
    const c = this.world.getChunk(cx, cy, cz);
    if (c) { this.transport.send(from, { type: 'chunkRec', key, rec: snapshotChunk(c, this.sim.entitiesInChunk(cx, cy, cz).map((e) => this.sim.toRecord(e))) }); return; }
    const rec = this.persist.syncRecord(cx, cy, cz);
    if (rec) { this.transport.send(from, { type: 'chunkRec', key, rec }); return; }
    this.transport.send(from, { type: 'chunkRec', key, rec: null }); // the client keeps its pristine terrain
  }

  private onPeerLeave(id: string): void {
    const p = this.peers.get(id);
    if (!p) return;
    const e = this.sim.entities.get(p.entityId);
    const rec: EntityRecord | undefined = e ? this.sim.toRecord(e) : undefined;
    if (e) this.sim.despawn(p.entityId); // fires onDespawn → broadcast
    if (!this.persist.meta) this.persist.meta = { v: 2, seed: this.seed, entities: [], viewedEntityId: this.sim.viewedId, time: this.worldTime.snapshot(), hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 0 } };
    if (rec) this.persist.meta.peers = { ...(this.persist.meta.peers ?? {}), [p.name]: rec };
    this.persist.saveMeta(this.metaSnapshot());
    this.peers.delete(id);
  }

  private anchors(): Anchor[] {
    const out: Anchor[] = [];
    const own = this.sim.viewed();
    if (own) out.push({ cx: chunkOf(own.pos.x), cz: chunkOf(own.pos.z), cy: chunkOf(own.pos.y), radius: SR_VIEW_RADIUS, meshable: true });
    for (const p of this.peers.values()) {
      const e = this.sim.entities.get(p.entityId);
      if (e) out.push({ cx: chunkOf(e.pos.x), cz: chunkOf(e.pos.z), cy: chunkOf(e.pos.y), radius: NET_REMOTE_RADIUS, meshable: false });
    }
    return out;
  }

  private flushCells(): void {
    if (this.pendingCells.size === 0) return;
    const byChunk = this.pendingCells;
    this.pendingCells = new Map();
    for (const [key, writes] of byChunk) {
      const arr = [...writes.values()];
      for (const [id, p] of this.peers) if (p.loaded.has(key)) {
        if (arr.length > CELLS_FULL_THRESHOLD) {
          const [cx, cy, cz] = key.split(',').map(Number);
          const c = this.world.getChunk(cx, cy, cz);
          if (c) this.transport.send(id, { type: 'chunkRec', key, rec: snapshotChunk(c, this.sim.entitiesInChunk(cx, cy, cz).map((e) => this.sim.toRecord(e))) });
        } else {
          this.transport.send(id, { type: 'cells', tick: this.worldTime.tick, chunk: key, writes: arr });
        }
      }
    }
  }

  private broadcastState(): void {
    for (const [id, p] of this.peers) {
      const e = this.sim.entities.get(p.entityId);
      if (!e) continue;
      const pcx = chunkOf(e.pos.x), pcz = chunkOf(e.pos.z);
      const list: NetEntity[] = [];
      for (const ent of this.sim.all()) {
        if (Math.abs(chunkOf(ent.pos.x) - pcx) > SR_VIEW_RADIUS || Math.abs(chunkOf(ent.pos.z) - pcz) > SR_VIEW_RADIUS) continue;
        list.push({ id: ent.id, kindId: ent.kind.id, x: ent.pos.x, y: ent.pos.y, z: ent.pos.z, yaw: ent.yaw, pitch: ent.pitch, vx: ent.vel.x, vy: ent.vel.y, vz: ent.vel.z, flags: (ent.inWater ? 1 : 0) | (ent.onGround ? 2 : 0) });
      }
      this.transport.send(id, { type: 'state', tick: this.worldTime.tick, entities: list });
    }
  }

  private broadcast(msg: Msg): void { this.transport.send('all', msg); }

  /** One 60 Hz substep: sim → water heartbeat → cell flush → union-ring streaming → state (stride) → time (stride). */
  tick(tick: number): void {
    this.sim.tick(STEP, tick);
    if (tick % WATER_STRIDE === 0) this.waterSim.tick(WATER_PULSE);
    this.worldTime.tick = tick;
    this.worldTime.advanceClock(STEP); // advance time + phaseTotal (the frame loop owns the tick)
    this.flushCells();
    const anchors = this.anchors();
    if (anchors.length) {
      const r = streamUpdate(this.world, anchors, this.persist, this.sim);
      this.meshable = r.meshable;
      this.lastStream = r; // [B1] the frame consumes it once per frame (consumeStream)
    } else {
      this.lastStream = null;
    }
    if (tick % NET_STATE_STRIDE === 0) this.broadcastState();
    if (tick % TIME_STRIDE === 0) this.broadcast({ type: 'time', tick: this.worldTime.tick, worldTime: this.worldTime.snapshot() });
  }
}