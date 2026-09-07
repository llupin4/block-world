# 0018. Multiplayer session model — one host runs the only authoritative sim; clients send intents and hold a view over a reliable, ordered Transport

- **Status:** Accepted
- **Last updated:** 2026-09-07
- **Sources:** `docs/superpowers/specs/2026-09-07-multiplayer-session-design.md`,
  `docs/superpowers/plans/2026-09-07-multiplayer-session.md`
- **Extends:** ADR 0014 (the `ChunkRecord`/`WorldMeta`/`applyRecord` persistence shapes),
  ADR 0015 (every world change flows through an `Intent` on the tick, via `applyIntent`;
  the sim is deterministic), and ADR 0017 (a session is a `ReplaySnapshot` + a delta-coded
  intent log, replayed deterministically on a fresh world; `intentEqual` compares intents).

## Context

ADR 0015 makes every world mutation an `Intent` applied on the tick, and ADR 0017 shows the
consequence: a whole session re-derives from a **snapshot + a delta-coded intent log**. Multiplayer
is that fact lifted to N machines. The load-bearing question is *who runs the sim*. Two answers
were on the table: every machine runs the sim (**lockstep**) and reconciles, or exactly one
machine (the **host**) runs the only authoritative sim and the rest hold a view. ADR 0017's
determinism caveat settles it: lockstep is only as good as the sim's byte-for-byte determinism
across machines — one platform-dependent bit (a `Set` iteration order, a `performance.now()` leak)
and every client desyncs, invisibly. A single authoritative host makes the sim's determinism a
*single-machine* property (already pinned by the ADR 0017 round-trip gate), and the only thing
that crosses the wire is each player's `Intent` — the minimal complete shared input. Phase A
proves that model end-to-end on a loopback transport with a deterministic harness, before any
real network exists.

## Decision

**The model (`src/net/`).** One `HostSession` owns the only authoritative `Sim` (plus the water
sim and the world). Each client is a `ClientSession`: it holds a **view** — pristine terrain
generated *locally* from the shared `TERRAIN_SEED` (so unedited chunks are identical on every
machine without being sent), with the host's edits/water arriving via `cells` and entity poses
arriving via `state`. The client's `Sim` is an **entity container only**: its `tick` is never
called, so a client can never diverge from the host (it has no sim of its own to diverge). Only
the host calls `sim.spawn`/`sim.restoreEntity` for authoritative entities — **clients never
`sim.spawn`** (their entities come from the `welcome` snapshot and the host's `spawn`/`despawn`).

**`Intent` as the wire format.** A client sends its `Intent` (the exact type the sim consumes)
over the `Transport`, **delta-coded**: the client computes the intent each tick and sends it only
when `intentEqual` says it changed. The host stores each client's last intent in a
`RemoteController` (a `Controller` that returns the held intent) and feeds the authoritative sim,
so a remote player is driven exactly like a local one — the same `applyIntent` path, no new sim
branch. The host replies with the resulting poses as a stride-batched `state` (every
`NET_STATE_STRIDE` ticks), so a client's own body is server-confirmed (prediction is a phase C
follow-up).

**`ChunkRecord` as the sync payload.** The host streams world state as `ChunkRecord`s (the ADR
0014 shape). On join (`hello`) the host replies `welcome` with a `ReplaySnapshot` (the spawn-ring
chunks + `WorldMeta`) and the client's `yourEntityId`. Thereafter, the host coalesces per-tick
**cell writes** (fired by the new `World.onCellWrite` hook — `setBlock` and the water sim's
`setState`) into per-chunk `cells` messages, batched on a tick stride; a chunk whose writes in a
tick exceed `CELLS_FULL_THRESHOLD` is sent as a full `ChunkRecord` instead. A client that needs a
chunk it cannot generate locally issues a `chunkReq`; the host answers `chunkRec` (this is the
client's network `PersistSource`, `NetworkPersistSource` — the streaming load path is unchanged).
Because pristine terrain is generated locally, `chunkReq`/`chunkRec` are rare (only edited or
entity-bearing chunks the client hasn't generated).

**The union ring.** The host streams **one** ring under the shared `LOAD_BUDGET`/`REMESH_BUDGET`
(the `streaming.update` union of multiple anchors): the host's own ring (meshable) **plus** each
peer's anchor, capped at `NET_REMOTE_RADIUS` and non-meshable. So a player who wanders far from
the host still has their chunks *simulated* on the host (water + entities run there), even though
the host never meshes them — the cap bounds the host's cost per remote.

**The `Transport` contract + loopback.** The `Transport` interface is
`send`/`onMessage`/`onPeerJoin`/`onPeerLeave`/`disconnect` — reliable, ordered, bidirectional.
Phase A ships a pump-driven `LoopbackHub` (in-process, zero loss/reorder, a `pump(tick)` the
harness calls once per sim tick) so the whole session model is testable **without a network**. A
`BotClient` (a `ClientSession` driven by a `ScriptController`) + a stress rig (`npm run
net:stress`) load a host + N bots and pin the host's per-tick cost and the steady-state bytes/s
per client (the one-time `welcome` join is excluded — it is a join cost, not a sustained rate).
Phase B swaps the loopback for a real transport (Trystero WebRTC) behind the same interface.

**Enabling repairs (pre-work).** The model required three single-player fixes, made first:
**D1** — `persistence.onUnload` persists an *unedited* chunk that carries entities (an entity in a
pristine chunk was dropped on unload); **D2** — `streaming` splits `rebuilt` into
`generated`/`remeshed` so `spawnDeer` tops only *freshly generated* columns (it previously re-spawned
on every remesh); **D3** — `Sim.despawn`'s viewed-fallback picks the *lowest* id (deterministic,
was insertion-order).

## Alternatives

- **Lockstep (every client runs the sim).** Rejected: it inherits ADR 0017's determinism caveat as
  a *cross-machine* property — one platform bit and the whole session desyncs with no error. A
  single host confines determinism to one machine (already gated by the replay round-trip), and
  the `Intent` is the minimal complete shared input either way.
- **Full per-tick state broadcast (no delta coding).** Rejected: the delta-coded `Intent` +
  per-chunk `cells` coalescing is far smaller; the `state` (poses) is stride-batched. A per-tick
  full snapshot of the world is the same waste ADR 0017 rejected for replay.
- **Clients generate edits locally and reconcile.** Rejected: the host is authoritative; clients
  *apply* host-fed `cells`. Local generation is reserved for **pristine** terrain (the shared
  `TERRAIN_SEED` guarantees it is identical), which is what keeps the `welcome`/`cells` small.
- **A client-driven `chunkReq` for all terrain.** Rejected: pristine terrain is generated locally,
  so fetching it would multiply the bandwidth by the ring size for nothing.

## Consequences

- **The loopback is the phase A deliverable.** `net-gate.test.ts` pins the "what must be true"
  (join+snapshot consistency, a host edit echoes byte-identical to two clients, the union ring
  sim-loads a far remote's chunks, leave persists the pose and rejoin restores the same id);
  `net-stress.test.ts` pins the host tick ms + steady bytes/s per client. **No real network, lobby,
  `?host`/`?join` URL, or remote-player rendering yet** — that is ADR 0019 (transport/lobby).
- **Clients are views, not simulations.** A client has no sim of its own, so it cannot diverge —
  but it also has **no own-body prediction**: its body moves at the host's `state` stride
  (phase C, ADR 0020, adds client-side prediction + reconciliation).
- **The host carries the meshing/lighting asymmetry.** Phase A's host runs the sim + water but the
  loopback asserts *world/entity state*, not pixels (the host has no mesher/light worker in the
  harness); `InMemoryChunkStore` stands in for IndexedDB (no IDB in node). These are `[POC
  shortcut]`s, not design.
- **Pinned numbers stay verbatim.** `TERRAIN_SEED 1234`, `VIEW_RADIUS 2`, `CY 0..4`,
  `LOAD_BUDGET`/`REMESH_BUDGET` 1; the net constants are `NET_STATE_STRIDE 3`,
  `CELLS_FULL_THRESHOLD 512`, `NET_REMOTE_RADIUS 1`, `PROTOCOL_VERSION 1`.
- **Follow-ups.** ADR 0019 (a real `Transport` — Trystero WebRTC — + the lobby/`?host`/`?join` +
  remote-player rendering) and ADR 0020 (own-body prediction) are the two next decisions this one
  unblocks; the specific items are tracked in [`TODO.md`](../TODO.md) → **Multiplayer**.