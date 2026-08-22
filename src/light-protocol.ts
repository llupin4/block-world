// The message protocol between the main thread and the light worker (ADR 0012).
//
// Tick numbers come from WorldTime.tick (ADR 0011's worker seam): the engine does not
// read them (the light drain is a per-frame budget, not a clocked system) — they are the
// protocol's ordering/debug axis. FIFO both ways; one `result` reply per `tick` message
// (even when empty). No transfer lists: every array is structured-cloned by postMessage
// (main keeps ownership of blocks/meta; the worker keeps its light fields).

export interface LoadMsg {
  t: 'load';
  tick: number;
  cx: number; cy: number; cz: number;
  blocks: Uint8Array; // 4096 — a clone of the chunk's block ids at load time
  meta: Uint8Array;   // 4096 — a clone of the chunk's per-cell meta at load time
}

export interface UnloadMsg {
  t: 'unload';
  tick: number;
  cx: number; cy: number; cz: number;
}

export interface EditMsg {
  t: 'edit';
  tick: number;
  x: number; y: number; z: number;
  block: number; // the new block id (post world.setBlock) — the mirror is stale without it
  meta: number;  // the new per-cell meta
}

export interface TickMsg {
  t: 'tick';
  tick: number;
  budget: number; // pops to drain (main's LIGHT_TICK_BUDGET)
}

export type LightMsg = LoadMsg | UnloadMsg | EditMsg | TickMsg;

export interface ChangedChunk {
  cx: number; cy: number; cz: number;
  blight: Uint8Array;   // 4096 — a snapshot of the mirror's field at reply time
  skylight: Uint8Array; // 4096
}

export interface LightResult {
  t: 'result';
  tick: number;
  queue: number; // queueSize() after this drain (watch it reach 0 — the acceptance check)
  changed: ChangedChunk[]; // chunks touched since the previous reply (whole fields, not deltas)
  stats: { pops: number; seeds: number; fieldChanges: number }; // cumulative, from the engine's stats block
}