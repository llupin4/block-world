# Task: multiplayer (host-authoritative, no hosted infrastructure)

Three phases, three ADRs, a gate per phase. Same rules as the entities project: spec + plan per phase under `docs/superpowers/`, stop at a phase boundary if context runs low and leave a handoff note.

Read ADRs 0014–0017 and their Consequences sections, `src/entity.ts` (`Sim`, `applyIntent`, controllers), `src/replay.ts`, `src/persistence.ts` (`PersistSource`, `snapshotChunk`/`applyRecord`), `src/streaming.ts`, and the `tickStreaming`/substep loop/`playback` branches in `src/main.ts`.

## The model

**One host runs the only authoritative sim.** Clients send intents; the host applies them through the exact `Sim.tick → applyIntent → stepEntity` path a local `HumanController` uses. Clients hold a *view* of the world: terrain they generate themselves from the shared seed, edits and water they receive from the host, entities whose transforms they receive from the host. Clients run no water sim, no mob AI, no spawning. Light runs client-side (derived state, ADR 0012).

Not lockstep. Lockstep would require every peer to have identical loaded-chunk sets on identical frames, and streaming is frame-budgeted (ADR 0017 already notes replay determinism only holds for the snapshot area). Host authority sidesteps that entirely.

Three things make this cheap given what's already there:

1. **`Intent` is already the wire format.** Absolute look, edge-triggered actions, `block` carried inline. `Recorder`'s delta-coding (`intentEqual`) is the compression. A `RemoteController` that feeds a peer's latest received intent to its entity is a sibling of `ReplayController`.
2. **`ChunkRecord` is already the sync payload.** A client's `PersistSource` becomes a network one: `syncRecord` → null, `fetchRecord` → ask the host, `onUnload` → no-op (clients never save; reuse the `playback` no-op pattern). The client generates pristine terrain locally; only chunks that differ on the host cross the wire.
3. **`ReplaySnapshot` is already the join payload.** Meta + the records the joiner needs.

## Pre-work (do first, its own commit)

The entity ride is gated on `c.edited` (`Persistence.onUnload` returns early), so entities in an unedited chunk are despawned on unload without being persisted, and `spawnDeer` tops the column back up on regeneration. Two consequences: a deer that wandered out of an edited chunk into a pristine one is lost, and a column remesh (`r.rebuilt` includes dirty chunks) tops up a column whose deer wandered away, so population grows over time. Fix: a chunk with entities in it is due for a snapshot on unload regardless of `edited` (entities are state that differs from worldgen by definition), and `spawnDeer` runs only for *freshly generated* columns — split `r.rebuilt` into `generated` and `remeshed`, or track spawned columns in `WorldMeta`. Pin both with tests. Also make `Sim.despawn`'s fallback viewed-id pick the lowest id, not `Map` insertion order.

Multiplayer depends on this because client rings will load and unload host chunks constantly.

---

## Phase A — session model, loopback transport, host union-ring, intents up / state down

### Transport

```ts
// net/transport.ts
interface Transport {
  readonly selfId: string;
  peers(): string[];
  send(peer: string | 'all', msg: Msg): void;          // reliable, ordered (WebRTC data channels are)
  onMessage(cb: (from: string, msg: Msg) => void): void;
  onPeerJoin(cb: (id: string) => void): void;
  onPeerLeave(cb: (id: string) => void): void;
}
```

`LoopbackTransport`: an in-process hub that connects N transports with an optional per-link delay in ticks and an optional reorder-free jitter. This is what tests use, and it's how one vitest process runs a host plus N clients. Design the session layer against `Transport` only; no WebRTC in phase A.

### Messages (versioned, plain data, `type` discriminant)

- `hello { name }` client → host on join.
- `welcome { seed, tick, worldTime, yourEntityId, snapshot: ReplaySnapshot }` host → client. The snapshot holds meta + records for the chunks in the joiner's initial ring only (see records below).
- `intent { tick, intent }` client → host, delta-coded exactly like `Recorder` (send only on change; host repeats the last one).
- `state { tick, entities: [{ id, kindId, x,y,z, yaw,pitch, vx,vy,vz, flags }] }` host → all, every N ticks (`NET_STATE_STRIDE = 3` → 20 Hz), for entities inside each recipient's ring (filter per peer).
- `spawn`/`despawn` events host → all (reuse `EntityEvent`).
- `cells { tick, chunk: key, writes: [idx, block, meta, wlevel, wsource, wplaced, wstream][] }` host → peers who have that chunk loaded. Collected per tick from the host's `World.setBlock` / `WaterSim.setState` hooks (add an `onCellWrite` hook alongside `waterEdit`/`onEdit`), flushed once per tick, coalesced by chunk. If a chunk's writes in one flush exceed `CELLS_FULL_THRESHOLD` (say 512), send its full `ChunkRecord` instead.
- `chunkReq { key }` / `chunkRec { key, rec | null }`. Host answers from: the live chunk if loaded (snapshot its arrays right now, regardless of `edited` — an unedited host chunk may hold eo=false water that's mid-flow), else the persistence record if any, else `null` (client generates pristine).
- `chunkLoaded { key }` / `chunkUnloaded { key }` client → host, so the host knows which peers get `cells` for which chunks and can size its own ring.
- `time { tick, worldTime }` host → all, low frequency; clients slew.

### Host

- `Session` wraps `Sim`. On `hello`: spawn a `player`-kind entity at `SPAWN` with a `RemoteController(peer)`; send `welcome`. On leave: persist the entity's pose in `WorldMeta.peers[name]` (so rejoining restores it) and despawn.
- **Streaming becomes union-ring.** `streaming.update` today takes one anchor. Add `anchors: {cx, cz, cy}[]`; a chunk is in range if in range of *any* anchor; the load budget is shared. The host's anchors = its own viewed entity + every remote player entity. Cap remote-anchor radius at `VIEW_RADIUS - 1` or a `NET_REMOTE_RADIUS` constant so a distant client doesn't double the host's memory; document the number. Mesh/light on the host only happen for chunks in the *host's own* ring — remote-only chunks are sim-loaded but never meshed (add a `meshed` set or a per-chunk flag; `pendingRebuild` must skip them).
- The host's `Recorder` keeps working unchanged: a recording of a multiplayer session replays all peers. Don't break that; add it to the phase A gate.
- Host ids are the only ids. Clients never call `sim.spawn`.

### Client

- Runs `World` + streaming (own ring, network `PersistSource`) + `LightClient` + meshing + rendering. Holds a `Sim` only as an entity container for rendering and picking; its `tick` is not called. Entity poses come from `state`; between states, interpolate (`NET_INTERP_TICKS`, render the world `state` stride behind).
- Own body in phase A: also host-driven (you'll feel RTT; phase C fixes it). The camera reads the interpolated own-entity pose; look (yaw/pitch) is client-owned and applied to the camera immediately even though the intent round-trips.
- Sends `intent` every substep on change; sends `chunkLoaded`/`chunkUnloaded` from the streaming result.
- Clients never touch `Persistence`. Possession is host-only in phase A (a client can't possess yet; note as deferred).

### Bots as clients

A `BotClient` = a client session driven by a `ScriptController` instead of hardware, over the loopback. This is the load rig: `npm run net:stress -- --clients 8` (or a vitest) that runs a host + 8 script bots for 1200 ticks and reports host tick ms, messages/s, bytes/s.

### Gate A

- Loopback tests: join handshake and snapshot; a client edit lands on the host and is echoed to a second client's world byte-identical; a spring placed by a client floods identically on host and both clients after N pulses; a client walking out of the host's ring keeps its chunks simulated (union ring); leaves persist the pose and rejoin restores it; the host recording of a 2-client session replays.
- Stress: 8 bots, pinned budgets for host tick ms and bytes/s per client.
- ADR 0018 — Multiplayer session model.

---

## Phase B — real transport, lobby, remote player rendering

- `TrysteroTransport` implementing `Transport` over `trystero` (the Nostr strategy by default, room = a short code). This is the only new dependency. Keep it thin — Trystero's `makeAction` per message type or one action with the `type` discriminant; measure and pick.
- Lobby: `?host` starts a session and shows the room code; `?join=<code>` joins. A minimal overlay with the code, peer list, and a copy button. The main menu stays single-player by default.
- Remote players render with the biped rig from ADR 0016 plus a name tag (`Sprite` or a canvas texture). Interpolation from phase A.
- Persistence: the host saves as today; a client's IDB is untouched by the session (already true from phase A's design, but verify with the real transport — the `visibilitychange` flush must not fire on clients).
- Handle peer leave (despawn + rig removal) and host leave (clients show "host left", return to single-player).
- NAT: STUN only via Trystero's defaults. Document in the ADR that some peer pairs won't connect without TURN and that TURN is the one place infrastructure could enter; don't add it.

### Gate B

- Two browser tabs on one machine over the real transport: join, see each other, edit, water, walk apart past the host ring, leave/rejoin.
- ADR 0019 — Transport & lobby (amends 0018 if that's cleaner; your call).

---

## Phase C — client-side prediction for the own body

- The client runs `stepEntity` on its own entity locally each substep using its own intent, against its local world (edits arrive slightly late; acceptable). Keeps a ring buffer of `{tick, intent, resultingPose}`.
- Each `state` from the host carries `lastIntentTick` per remote player. On receipt, the client snaps its own entity to the host pose at that tick and re-applies buffered intents after it (reconciliation). Smooth the visual correction over a few frames if the error exceeds `NET_SNAP_EPS`.
- Actions stay host-applied (no edit prediction). Optional: predict the *break* visually (hide the block) and revert if the host disagrees within `NET_EDIT_TIMEOUT` ticks. Do the optional only if the basic prediction lands cleanly.
- Test on loopback with a delayed link: a bot client's predicted path matches the host's within `1e-6` when the world doesn't change under it, and reconciliation corrects within K ticks when the host disagrees (place a block in its path from the host).

### Gate C

- The delayed-link tests above; the phase A stress rig still under budget.
- ADR 0020 — Prediction & reconciliation.
- TODO.md: client possession, edit prediction, host migration, TURN, per-peer chunk caching across sessions, an unreliable channel for `state`.

---

## Non-goals

- Host migration. Host leaves → session over.
- Any hosted infrastructure: no relay, no TURN, no lobby server.
- Voice, chat, anti-cheat, auth. Names are whatever the peer says.
- Cross-version compatibility. `PROTOCOL_VERSION` in `hello`/`welcome`; mismatch → refuse with a message.
- Client-side possession of mobs (deferred; the host path stays).

House style as before: pinned numbers verbatim, `[POC shortcut]` tags on deliberate punts, `npm test` + `npm run build` green per phase, ADR README table updated.