import { type Intent, type EntityRecord } from '../entity';
import { type ChunkRecord, type WorldMeta } from '../persistence';
import { type ReplaySnapshot } from '../replay';

// The wire protocol: versioned, plain data, a `type` discriminant. `Intent`, `ChunkRecord`,
// `EntityRecord`, `WorldMeta`, `ReplaySnapshot` are reused verbatim as wire types.
export const PROTOCOL_VERSION = 1;

// Net pacing (the host's stride-based broadcasts + the client's remote ring). Pinned by the
// session spec (phase A); the loopback harness measures latency, not these.
export const NET_STATE_STRIDE = 3; // broadcast `state` every 3 substeps (~20 Hz @ 60 Hz sim)
export const CELLS_FULL_THRESHOLD = 512; // a cell batch over this sends a full chunkRec instead of `cells`
export const NET_REMOTE_RADIUS = 1; // the host keeps each remote's ring at this radius (VIEW_RADIUS − 1)
export const TIME_STRIDE = 60; // broadcast `time` every 60 substeps (once per sim second)
export const NET_INTERP_TICKS = 6; // the client's render reads the pose 6 substeps (100 ms) behind the host tick

// Phase C (own-body prediction + reconciliation): the capped buffer of the client's recent intents
// (keyed by tick), the snap distance below which a reconciliation correction is applied instantly,
// and the frames over which a larger snap is lerped out on the own body's display pose.
export const PREDICT_BUFFER = 120; // ~2 s of intents at 60 Hz
export const NET_SNAP_EPS = 0.05; // 5 cm — below this, a reconciliation snap is instant
export const SNAP_SMOOTH_FRAMES = 4; // the display-pose lerp-out frames for a larger snap

/** A host world-time snapshot on the wire (a `WorldTime.snapshot()`): `time` (s) + `tick` + `phaseTotal` (cycles). The client slews `time`+`phaseTotal` from it (keeping its own tick). */
export interface WorldTimeSnapshot { time: number; tick: number; phaseTotal: number }

// [chunk-local idx, block, meta, wlevel, wsource, wplaced, wstream]
export type CellWrite = [number, number, number, number, number, number, number];

export interface NetEntity {
  id: number; kindId: string; name?: string;
  x: number; y: number; z: number;
  yaw: number; pitch: number;
  vx: number; vy: number; vz: number;
  flags: number; // bit 0 = inWater, bit 1 = onGround (render hints)
}

export type Msg =
  | { type: 'hello'; name: string; protocol: number }
  | { type: 'welcome'; seed: number; tick: number; worldTime: WorldTimeSnapshot; yourEntityId: number; snapshot: ReplaySnapshot }
  | { type: 'intent'; tick: number; intent: Intent }
  | { type: 'state'; tick: number; entities: NetEntity[] }
  | { type: 'spawn'; tick: number; id: number; kindId: string; pose: EntityRecord }
  | { type: 'despawn'; tick: number; id: number }
  | { type: 'cells'; tick: number; chunk: string; writes: CellWrite[] }
  | { type: 'chunkReq'; key: string }
  | { type: 'chunkRec'; key: string; rec: ChunkRecord | null }
  | { type: 'chunkLoaded'; key: string }
  | { type: 'chunkUnloaded'; key: string }
  | { type: 'time'; tick: number; worldTime: WorldTimeSnapshot };

// --- Real-transport wire codec (B2) ---
// The loopback passes `Msg` objects in-memory (no serialization). A real transport (Trystero)
// crosses a text-oriented data channel (`RTCDataChannel.send` takes a DOMString), so a `Msg` is
// JSON-serialized here. The only non-JSON-safe fields are the six `Uint8Array` chunk arrays in
// `ChunkRecord` (carried by `welcome.snapshot.chunks` and `chunkRec.rec`); they are base64-encoded.
// Everything else (`Intent`, `EntityRecord`, `WorldMeta`, `NetEntity`, `cells`) is already plain
// JSON. The codec lives at the transport boundary so the session layer keeps dealing in `Msg`.
type ChunkBinField = 'blocks' | 'meta' | 'wlevel' | 'wsource' | 'wplaced' | 'wstream';
const CHUNK_BIN: ChunkBinField[] = ['blocks', 'meta', 'wlevel', 'wsource', 'wplaced', 'wstream'];

function b64e(u8: Uint8Array): string {
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}
function b64d(s: string): Uint8Array {
  const bin = atob(s);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
function encChunk(rec: ChunkRecord | null): Record<string, unknown> | null {
  if (!rec) return null;
  const o: Record<string, unknown> = { v: rec.v, cx: rec.cx, cy: rec.cy, cz: rec.cz };
  for (const k of CHUNK_BIN) o[k] = b64e(rec[k]);
  if (rec.entities) o.entities = rec.entities;
  return o;
}
function decChunk(o: Record<string, unknown> | null): ChunkRecord | null {
  if (!o) return null;
  const rec = { v: o.v, cx: o.cx, cy: o.cy, cz: o.cz } as ChunkRecord;
  for (const k of CHUNK_BIN) (rec as unknown as Record<string, Uint8Array>)[k] = b64d(o[k] as string);
  if (o.entities) rec.entities = o.entities as EntityRecord[];
  return rec;
}

/** Serialize a `Msg` for the real transport (JSON; the binary chunk arrays base64-encoded). */
export function encodeMsg(msg: Msg): string {
  if (msg.type === 'welcome') {
    return JSON.stringify({ ...msg, snapshot: { chunks: msg.snapshot.chunks.map(encChunk), meta: msg.snapshot.meta } });
  }
  if (msg.type === 'chunkRec') {
    return JSON.stringify({ ...msg, rec: encChunk(msg.rec) });
  }
  return JSON.stringify(msg);
}

/** Deserialize a real-transport wire string back into a `Msg` (the inverse of `encodeMsg`). */
export function decodeMsg(s: string): Msg {
  const o = JSON.parse(s) as Record<string, unknown>;
  if (o.type === 'welcome') {
    const snap = o.snapshot as unknown as { chunks: unknown[]; meta: WorldMeta };
    o.snapshot = { chunks: snap.chunks.map((c) => decChunk(c as Record<string, unknown>)), meta: snap.meta };
  } else if (o.type === 'chunkRec') {
    o.rec = decChunk(o.rec as Record<string, unknown> | null);
  }
  return o as Msg;
}