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

// [chunk-local idx, block, meta, wlevel, wsource, wplaced, wstream]
export type CellWrite = [number, number, number, number, number, number, number];

export interface NetEntity {
  id: number; kindId: string;
  x: number; y: number; z: number;
  yaw: number; pitch: number;
  vx: number; vy: number; vz: number;
  flags: number; // bit 0 = inWater, bit 1 = onGround (render hints)
}

export type Msg =
  | { type: 'hello'; name: string; protocol: number }
  | { type: 'welcome'; seed: number; tick: number; worldTime: number; yourEntityId: number; snapshot: ReplaySnapshot }
  | { type: 'intent'; tick: number; intent: Intent }
  | { type: 'state'; tick: number; entities: NetEntity[] }
  | { type: 'spawn'; tick: number; id: number; kindId: string; pose: EntityRecord }
  | { type: 'despawn'; tick: number; id: number }
  | { type: 'cells'; tick: number; chunk: string; writes: CellWrite[] }
  | { type: 'chunkReq'; key: string }
  | { type: 'chunkRec'; key: string; rec: ChunkRecord | null }
  | { type: 'chunkLoaded'; key: string }
  | { type: 'chunkUnloaded'; key: string }
  | { type: 'time'; tick: number; worldTime: number };