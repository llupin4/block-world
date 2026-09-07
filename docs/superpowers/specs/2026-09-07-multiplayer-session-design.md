# Spec: multiplayer — phase A: session model, loopback transport, host union-ring, intents up / state down

Status: design frozen for implementation (2026-09-07). Prerequisite: the **pre-work**
(`2026-09-07-multiplayer-prework-design.md`) is implemented and green. Followed by phase B
(transport & lobby, DRAFT) and phase C (prediction, DRAFT). Durable record after
implementation: **ADR 0018 — Multiplayer session model.**

## Goal

One host runs the **only authoritative sim**. Clients send **intents**; the host applies
them through the exact `Sim.tick → applyIntent → stepEntity` path a local `HumanController`
uses. Clients hold a **view** of the world: terrain they generate themselves from the shared
seed, edits and water they receive from the host, entities whose transforms they receive from
the host. Clients run **no** water sim, **no** mob AI, **no** spawning. Light runs
client-side (derived state, ADR 0012). Phase A proves the whole model end-to-end over an
in-process `LoopbackTransport`, with a `BotClient` stress rig, before any real network.

**Not lockstep.** Lockstep would require every peer to hold identical loaded-chunk sets on
identical frames; streaming is frame-budgeted and replay determinism only holds for the
snapshot area (ADR 0017). Host authority sidesteps that entirely.

The model is cheap given what already exists:
1. `Intent` is already the wire format (absolute look, edge-triggered actions, `block`
   inline). `Recorder`'s delta-coding (`intentEqual`, replay.ts:24) is the compression.
2. `ChunkRecord` is already the sync payload (persistence.ts:14). A client's `PersistSource`
   becomes a network one.
3. `ReplaySnapshot` is already the join payload (replay.ts:8).

## What must be true (Gate A)

1. **Join handshake + snapshot:** a client's `hello` yields a `welcome` whose snapshot
   (meta + the chunks in the joiner's initial ring) restores the joiner's world and entities
   to the host's current state.
2. **Client edit → host → second client, byte-identical:** an edit a client sends lands on
   the host and is echoed to a second client's world, byte-for-byte identical (all six arrays
   per affected chunk).
3. **Spring floods identically:** a spring placed by a client floods identically on the host
   and on both clients after N pulses (water byte arrays match).
4. **Union ring:** a client walking out of the host's own ring keeps its chunks **simulated**
   on the host (sim-loaded, marked non-meshable); the host's load budget is shared.
5. **Leave persists + rejoin restores:** a client leaving persists its pose to
   `WorldMeta.peers[name]`; rejoining restores it (same entity id, same pose).
6. **Host recording still works:** the host's `Recorder` is untouched; a recording of a
   2-client session replays (the existing `replay` round-trip determinism gate holds for a
   multiplayer session).
7. **Stress:** 8 `BotClient`s for 1200 ticks; host tick ms and bytes/s per client are within
   **pinned budgets** (set by measurement in the gate, then frozen).
8. `npm test` and `npm run build` green; **no** single-player pin regresses.

## File layout (new, under `src/net/` — all pure TS, no three.js)

| File | Responsibility |
|------|----------------|
| `src/net/messages.ts` | `PROTOCOL_VERSION`; the `Msg` discriminated union; `NetEntity`, `CellWrite` |
| `src/net/transport.ts` | `Transport` interface; `LoopbackTransport` + `LoopbackHub` (in-process, N peers, per-link delay-in-ticks + reorder-free jitter) |
| `src/net/remote-controller.ts` | `RemoteController` — sibling of `ReplayController`; holds a peer's latest intent |
| `src/net/network-persist.ts` | the client's network `PersistSource` (chunkReq/Rec + no-op unload) |
| `src/net/host.ts` | `HostSession` — the authoritative sim owner + union-ring + cell flush + state broadcast |
| `src/net/client.ts` | `ClientSession` — the world/entity view + interpolation + intent send |
| `src/net/stress.ts` | `BotClient` (ScriptController-driven client) + the load rig |
| `src/__tests__/net-*.test.ts` | the Gate A loopback tests |

**Existing edits:** `src/world.ts` + `src/water.ts` (add an optional `onCellWrite` hook);
`src/streaming.ts` (union-ring `update` — replaces the single-anchor signature the pre-work
plan left intact); `src/persistence.ts` (`WorldMeta.peers?` optional field). `src/main.ts` is
**not** touched in phase A — the loopback tests are the harness; the browser `?host`/`?join`
gate lands in phase B.

## Transport (`src/net/transport.ts`)

```ts
export interface Transport {
  readonly selfId: string;
  peers(): string[];
  send(peer: string | 'all', msg: Msg): void;         // reliable + ordered (WebRTC data channels are)
  onMessage(cb: (from: string, msg: Msg) => void): void;
  onPeerJoin(cb: (id: string) => void): void;
  onPeerLeave(cb: (id: string) => void): void;
}
```

`LoopbackTransport` + `LoopbackHub`: an in-process hub wiring N transports. Design:
- **Deterministic, pump-driven.** No timers. The hub has a `tick` counter and a
  `pump(tick)` the harness calls once per sim tick. Each link is a FIFO queue of
  `{ from, at, msg }`; `send` enqueues with `at = hub.tick + delay(from,to) + jitter`.
  `pump(t)` delivers, per link, the head while `head.at <= t`. Delivering only the head
  makes the link **reorder-free** even when a later message has a smaller `at`.
- **Delay + jitter:** `delay(from,to)` is a caller-supplied per-link constant (ticks);
  `jitter` is an optional per-message non-negative draw from a seeded `SimRng` (reuses the
  entity PRNG). Both are 0 by default (the base loopback tests).
- **Stats for the stress rig:** `sentCount`, `sentBytes` (≈ `JSON.stringify(msg).length`),
  readable from the hub.

The session layer depends on `Transport` **only** — no WebRTC in phase A.

## Messages (`src/net/messages.ts`)

Versioned, plain data, `type` discriminant. `Intent` (entity.ts:68) and `ChunkRecord`
(persistence.ts:16) and `EntityRecord` (entity.ts:92) are reused verbatim as wire types.

```ts
export const PROTOCOL_VERSION = 1;
export type CellWrite = [number, number, number, number, number, number, number]; // [idx, block, meta, wlevel, wsource, wplaced, wstream]
export interface NetEntity { id: number; kindId: string; x: number; y: number; z: number;
  yaw: number; pitch: number; vx: number; vy: number; vz: number; flags: number }
type Msg =
  | { type: 'hello'; name: string; protocol: number }
  | { type: 'welcome'; seed: number; tick: number; worldTime: number; yourEntityId: number;
     snapshot: ReplaySnapshot }                       // meta + records for the joiner's initial ring
  | { type: 'intent'; tick: number; intent: Intent }   // delta-coded (intentEqual); the host repeats the last
  | { type: 'state'; tick: number; entities: NetEntity[] } // every NET_STATE_STRIDE ticks, per-peer ring filter
  | { type: 'spawn'; tick: number; id: number; kindId: string; pose: EntityRecord }
  | { type: 'despawn'; tick: number; id: number }
  | { type: 'cells'; tick: number; chunk: string; writes: CellWrite[] }
  | { type: 'chunkReq'; key: string }
  | { type: 'chunkRec'; key: string; rec: ChunkRecord | null }   // null → the client keeps its pristine terrain
  | { type: 'chunkLoaded'; key: string }
  | { type: 'chunkUnloaded'; key: string }
  | { type: 'time'; tick: number; worldTime: number };
```

`PROTOCOL_VERSION` mismatch on `hello` → the host refuses with a message (non-goal:
cross-version compatibility is out).

## Host (`src/net/host.ts`)

`HostSession` wraps `World` + `WaterSim` + `Sim` + `Persistence` + the host's `Recorder`
(unchanged — a recording of a multiplayer session must replay all peers). One
`tick(tick)` = one 60 Hz substep. Order within a tick:

1. `sim.tick(STEP, tick)` — steps the host's own entity and every remote player (each
   `RemoteController` feeds its peer's latest received intent).
2. `if (tick % WATER_STRIDE === 0) waterSim.tick(WATER_PULSE)` — the ADR 0011 heartbeat.
3. **Cell flush:** drain the per-tick `onCellWrite` accumulation into per-chunk
   `Map<idx, CellWrite>` (dedups a cell written by both a block edit and a water write);
   for each chunk, send `cells` to every peer that `chunkLoaded` that chunk — or the full
   `ChunkRecord` when a chunk's writes exceed `CELLS_FULL_THRESHOLD` (sent as `chunkRec`).
4. **Union-ring streaming:** build `anchors` = the host's own viewed entity (radius
   `VIEW_RADIUS`, meshable) + every remote player (radius `NET_REMOTE_RADIUS`, non-meshable);
   call `streaming.update(world, anchors, persist, sim)`. Track the meshable chunk set (the
   host's own ring) so remote-only chunks are sim-loaded but never meshed.
5. **State broadcast:** every `NET_STATE_STRIDE` ticks, send each peer a `state` filtered to
   the entities inside *that* peer's ring.
6. **Time:** send `time` at a low cadence (`TIME_STRIDE`).

**Join/leave.** On `hello`: spawn a `player`-kind entity at `SPAWN` with a
`RemoteController(peer)`; send `welcome` (snapshot = meta + records for the joiner's initial
ring). Host ids are the only ids — clients never call `sim.spawn`. On `despawn`
(`sim.onDespawn`), fire a `despawn` message. On peer leave: persist the entity's pose to
`WorldMeta.peers[name]` (new optional field, so rejoining restores it) and despawn.

**`onCellWrite` hook.** `World.setBlock` (world.ts:145) and `WaterSim.setState`
(water.ts:142) fire an optional `world.onCellWrite?.(x, y, z)`; the host sets it to read the
**final** cell state (block, meta, 4 water bytes) from the chunk and record the write. A cell
touched by both a block write and a water write fires twice; the per-chunk `Map` dedups by
idx, so the recorded value is the final one. Single-player (no hook set) is unchanged.

## Client (`src/net/client.ts`)

`ClientSession` = `World` + `streaming` (own ring) + a `Sim` used **only** as an entity
container (its `tick` is **never** called) + a network `PersistSource`. No `WaterSim`, no
mob AI, no spawning.

- **Terrain:** generates pristine terrain locally from the shared seed (identical to the
  host's pristine terrain — same seed, deterministic). Edits/water arrive via `cells` + the
  initial `chunkRec`.
- **Chunk load:** on a newly generated chunk, send `chunkLoaded` (host starts `cells` +
  sizes its ring) and `chunkReq` (host answers `chunkRec` with the chunk's current record,
  live-snapshotted regardless of `edited` — an unedited host chunk may hold eo=false water
  mid-flow — else the persistence record, else `null`). Apply the record over the pristine
  terrain. On unload, send `chunkUnloaded`.
- **Entities:** host ids only. Add entities to the `Sim` container via `restoreEntity`
  (never `sim.spawn`); view `yourEntityId`. Poses come from `state`; between states,
  interpolate and render the world `NET_STATE_STRIDE` ticks behind (absorb jitter).
- **Own body (phase A):** also host-driven — the client renders its own entity from the host
  `state` (you'll feel the RTT; phase C fixes it). Look (yaw/pitch) is **client-owned** and
  applied to the camera immediately, even though the intent round-trips.
- **Intent send:** the client's own `HumanController`/`ScriptController` emits an intent each
  substep; send `intent` on change (delta-coded with `intentEqual`), the host repeats the
  last.
- **Persistence:** the client never touches `Persistence`. `[POC shortcut]` the network
  `PersistSource`'s `fetchRecord` is a stub (never called — the client always generates);
  the actual sync is the `chunkReq`/`chunkRec` side channel.

## Bots as clients + stress rig (`src/net/stress.ts`)

A `BotClient` = a `ClientSession` driven by a `ScriptController` instead of hardware, over
the loopback. The load rig runs a host + N script bots for 1200 ticks and reports host tick
ms, messages/s, bytes/s. Wired as an npm script (`net:stress`) running a vitest test
(`src/__tests__/net-stress.test.ts`); the client count is a constant (default 8, overridable
via `NET_CLIENTS`). The gate pins host tick ms and bytes/s per client.

## Pinned numbers

New: `PROTOCOL_VERSION 1`, `NET_STATE_STRIDE 3` (20 Hz), `CELLS_FULL_THRESHOLD 512`,
`NET_REMOTE_RADIUS 1` (`VIEW_RADIUS − 1`), `NET_INTERP_TICKS` (fixed by measurement in the
gate, then frozen), `TIME_STRIDE` (low cadence, e.g. 60). Stress budgets: host tick ms and
bytes/s per client (set by measurement, then frozen).

Unchanged: `STEP 1/60`, `WATER_STRIDE 30`, `WATER_PULSE 1000`, `VIEW_RADIUS 2`,
`CY 0..4`, `LOAD_BUDGET 1`, `REMESH_BUDGET 1`, `TERRAIN_SEED 1234`, `WARM_CAP 512`,
`SPAWN` (main.ts:424).

## Non-goals

- Real transport (Trystero), lobby, `?host`/`?join`, remote-player rendering — **phase B**.
- Client-side prediction of the own body — **phase C**.
- Host migration; hosted infrastructure (relay/TURN); voice/chat/anti-cheat/auth;
  cross-version compatibility; client-side possession of mobs.