# 0019. Transport & lobby — the session model runs in the browser over a swappable `Transport` (loopback → Trystero WebRTC), with a minimal `?host`/`?join` lobby and interpolated remote-player rendering

- **Status:** Accepted
- **Last updated:** 2026-09-07
- **Sources:** `docs/superpowers/specs/2026-09-07-multiplayer-b1-deterministic-core-design.md`
  (B1, implemented), `docs/superpowers/specs/2026-09-07-multiplayer-transport-lobby-design.md`
  (B2, the transport/lobby design of record), `docs/superpowers/plans/2026-09-07-multiplayer-b1-deterministic-core.md`,
  and `docs/superpowers/plans/2026-09-07-multiplayer-b2-transport-lobby.md` (B2, implemented)
- **Extends:** ADR 0018 (the session model over a reliable, ordered `Transport` — this ADR is the
  *transport/lobby/rendering* half it deferred), ADR 0016 (the biped rig a remote player renders
  with), ADR 0014 (persistence — a client's IDB stays untouched by a session), and ADR 0012 (the
  light worker, whose wiring moves out of the `Persistence` constructor in the B2 pre-work).

## Context

ADR 0018 fixed the *model* (one host, the only authoritative sim; clients hold a view over a
reliable, ordered `Transport`) and proved it end-to-end on a **node** loopback harness with a
deterministic test. What it deliberately left out was everything that makes the model *a game*
rather than a test: running the whole loop inside the **browser** render path (the node harness
asserts world/entity state, not pixels, and has no mesher/light worker), interpolating remote
players between the host's stride-batched `state` messages, rendering them (rig + name tag),
handling a peer/host leaving, and — finally — replacing the loopback with a **real network** and a
lobby so two actual browsers can play.

The load-bearing question for this ADR is *how much of the loop the browser owns*. ADR 0018's
`Transport` contract was the seam: the session layer (`HostSession`/`ClientSession`) is
transport-agnostic, so the browser can run the *entire* session loop over the in-page
`LoopbackHub` (B1) and later swap in a real transport (B2) without touching the session layer.
That single seam is what lets B1 land the deterministic core in-browser with zero network, and B2
land the real transport with zero session-layer changes.

## Decision

**B1 — the deterministic core, in the browser (implemented).** `main.ts` gains a `?mp` boot branch
(`?mp=host`, `?mp=client`) that wins over `?replay`/`?prof`. It builds an in-page `LoopbackHub` and
the session(s), then **reassigns the module globals** (`world`/`sim`/`worldTime`/`waterSim`) to the
session's objects so the *existing* render path (light worker, re-mesh, `syncCamera`,
`syncEntityRigs`) runs unchanged against the session's world — no separate multiplayer render path.
The light worker is recreated for the session's world + worldTime.

The frame loop gains one **additive mode-branch** (`[POC shortcut]`; the unification is B2
pre-work). When a session is active, each substep: ticks every intent-sending client
(`c.tick(worldTime.tick)` — the clients compute + send their intents) → `mpHub.pump(tick)`
(deliver the in-page loopback messages, so the intents reach the host's `RemoteController`s) →
**sync the host's `worldTime.tick` to the frame tick** (a no-op in host mode, where the host's
`worldTime` *is* the page's; in client mode the in-page headless host would otherwise keep its tick
at 0 and its `state` ticks would collapse the client's pose rings) → `mpHost.tick(tick)` (the
authoritative host applies the intents + broadcasts `state`/`time`) → `worldTime.advanceTick()`
(the frame loop owns the tick; the sessions do not advance it). The single-player path is the
`else` branch, unchanged.

- **Host mode** (`?mp=host`): the page is the `HostSession` (`withOwnPlayer`, the real
  `persist` + `simHooks`) + N bot `ClientSession`s driven by a `ScriptController`. The host renders
  its authoritative world + the bots' remote players (their rigs appear + move as their intents are
  applied by the host's sim).
- **Client mode** (`?mp=client`): the page is a `ClientSession` (its own body driven by the page's
  `HumanController`) **plus** an in-page **headless** `HostSession` (`withOwnPlayer: false`,
  in-memory persistence) that runs only the authoritative sim — it is *never* meshed/lit (it is not
  the frame loop's world), so a single page exercises the full intent-up/state-down/cells/spawn/
  despawn loop with the page's own body + N scripted other players. `client.setLightEdit` tracks
  the host's edits into the page's light; `client.onPeerLeave('headless')` shows a "host left"
  static view and stops driving.

**The `WorldTime` wire format is a full snapshot.** `WorldTime` gains `advanceClock` (advance the
continuous `time` + `phaseTotal` without advancing the integer `tick`) and `slew`. A host
`state`/`time` carries the whole clock (`{ time, tick, phaseTotal }` via `snapshot()`); the client
**slews** `time` + `phaseTotal` to the host's and keeps its own integer `tick` (the `tick` is what
drives the pose ring; the continuous clock is what drives sky/day-night + the water pulse stride).
No protocol bump: `PROTOCOL_VERSION` stays `1`.

**Streaming is consumed from the session's `lastStream` only (no merge).** Each frame the render
path consumes the session's `lastStream` (the streaming result for that tick) exactly once; the
mesh-adjacent work was extracted into a shared `consumeStream` so the single-player and
multiplayer paths do the same mesh/light/settle work. Deferring a lagging frame's stream is a
`[POC shortcut]`.

**Interpolation.** `src/net/interp.ts` is a pure module (unit-tested, no three.js): a `PoseRing`
holds the last `INTERP_RING` (8) host-confirmed poses per entity, and `interpose` renders
`NET_INTERP_TICKS` (6) behind the current tick (`renderTick = worldTime.tick − NET_INTERP_TICKS`),
linearly interpolating position and shortest-arc yaw between the two bracketing poses. This is the
phase-A "render `state` stride behind" made concrete: the client never renders a pose it has not
seen confirmed. A client's **own body** is the exception — its *position* is interpolated from its
own pose ring (it is one of the host's entities) but its *look* is client-owned and applied to the
camera **immediately** (the intent round-trips; the view does not wait for `state`).

**Remote-player rendering + name tags.** Remote players render with the ADR 0016 biped (box-part)
rig, synced from the interpolated pose in `syncEntityRigs`. Each has a **name tag**: an `Entity.name`
(new) carried on the `NetEntity`, set by the client's `state` handler, drawn as a canvas-sprite
`tagTexture(name)` (cached by name, one sprite per entity id) hovering at `e.pos.y + 1.8`
(`depthTest` off, hidden for the viewed id). Despawn removes the rig *and* the tag (disposing the
per-entity sprite material; the shared name texture is kept).

**`?mp` scenario + `__mpResult` (e2e gate).** The `?mp` boot doubles as the Gate B1 e2e scenario,
reporting a `window.__mpResult` once past a tick threshold. Host: `rigCount`, per-remote-player
`{ id, x, y, z, name, moved }` (`moved` = first-observed vs current, guarding that intents were
actually applied), `editReflected` (a host `setBlock` then `getBlock`). Client: `rigCount`,
`otherPlayers`, `camera`, `clientMeshedChunks` (≤ 125, the bounded ring), `headlessHostMeshedChunks`
(0 — the headless host never meshes), `leaveRigRemoved` (a scripted peer disconnect at the first
tick ≥ 250 must remove its rig). The disconnect is one-shot (`mpLeaveFired`): the frame loop can run
multiple substeps per frame, so an exact `=== 250` tick match would be flaky.

**B2 — real transport + lobby (implemented).**
- **`TrysteroTransport`** (`src/net/trystero.ts`) implements the same `Transport` contract over
  `trystero` — the **only new dependency** (`trystero@0.25.4`). Strategy: Nostr (the default); a
  "room" is a short code. It is thin: **one** message action (namespace `msg`) carrying the
  JSON-encoded `Msg` (the `type` discriminant inside the JSON) — not one action per message type.
  It preserves the loopback guarantees (reliable + ordered — a data-channel guarantee) and
  `onPeerJoin`/`onPeerLeave`. The `trystero` surface is a structural `TrysteroLike`, injectable so a
  node test wires two fake rooms together (no RTC in node).
- **Wire codec** (`src/net/messages.ts`): `RTCDataChannel.send` takes a `DOMString`, so a `Msg` is
  JSON-serialized; the only non-JSON-safe fields are the six `Uint8Array` chunk arrays in
  `ChunkRecord` (in `welcome.snapshot.chunks` + `chunkRec.rec`), base64-encoded
  (`encodeMsg`/`decodeMsg`). Everything else is already plain JSON.
- **Lobby:** `?host` starts a session + shows the room code (an optional `?host=<code>` fixes it);
  `?join=<code>` joins. A minimal overlay (the code, a copy button, a peer list polled every 500 ms
  — the sessions own the transport's `onPeerJoin`/`onPeerLeave`, so the lobby reads `peers()`); the
  main menu stays single-player by default. A new `startGame` branch (before `?mp`) reuses B1's
  session-wiring (reassign the module globals to the session's objects) + the frame loop, differing
  only in the `Transport` (a `TrysteroTransport`, `mpHub = null` so `pump` is a no-op). A host has no
  local clients (`mpClients = []`); a client has no in-page headless host (`mpHost = null`), so the
  frame loop's host-tick step is conditional on `mpHost`. Coexists with `?replay`/`?phase`/`?prof`.
- **Real-network join is async** (the data channel opens seconds after construction), so two
  session-layer behaviors are **required**, not just nice: the `ClientSession` **re-sends `hello` on
  `onPeerJoin`** (until the welcome arrives) — the construction-time hello is dropped when no peer is
  connected yet — and `HostSession.onHello` is **idempotent** (a re-hello re-sends the `welcome` for
  the existing entity instead of spawning a duplicate). Both are harmless for the loopback (the host
  peer is added before the client's constructor registers the `onPeerJoin` callback).
- **B2 pre-work (deferred).** The `LocalSession` **unification** (single-player as a `HostSession`
  with a null transport) + the `Persistence` light-worker refactor are **not** done: B2 reuses B1's
  global-reassignment session-wiring for the lobby, so single-player is untouched (the single-player
  pin holds). They remain a `[POC shortcut]` follow-up (the additive frame-loop mode-branch stays).
- **NAT:** STUN only, via Trystero's defaults. Some peer pairs will not connect without TURN, and
  **TURN is the one place infrastructure could enter — do not add it** (non-goal: any hosted
  infrastructure).
- **Persistence:** the host saves as today (IndexedDB); a client's IDB is untouched by the session
  (the `visibilitychange` flush on clients is unverified — a follow-up; the two-tab e2e does not
  trigger it).
- **Gate B (two tabs, real transport).** `tests/e2e/mp-lobby.spec.ts` (single page: the lobby
  renders + the code shows, robust with/without relay reachability) + `tests/e2e/mp-2tab.spec.ts`
  (two tabs over the real transport: each lists the other as a connected peer **and** renders the
  other's player — the host spawns the joiner's remote player on `hello`; the joiner restores the
  host's entities from the `welcome` snapshot). A fresh random room code per run avoids relay
  cross-talk.

**Pinned numbers stay verbatim.** ADR 0018's net constants hold: `NET_STATE_STRIDE 3`,
`CELLS_FULL_THRESHOLD 512`, `NET_REMOTE_RADIUS 1`, `PROTOCOL_VERSION 1`. B1 adds the render
constants `NET_INTERP_TICKS 6` and `INTERP_RING 8`; `TERRAIN_SEED 1234`, `VIEW_RADIUS 2`,
`CY 0..4`, and the `STEP 1/60` / `WATER_STRIDE 30` frame lattice are unchanged.

## Alternatives

- **Run the session loop only in node (never in-browser).** Rejected (B1's point): the node
  harness asserts state, not pixels, and has no mesher/light worker — it cannot catch a render-path
  regression (a pose ring that collapses, a light that doesn't track host edits, a rig that never
  despawns). Running the full loop in the browser over the in-page `LoopbackHub` exercises the real
  render path with zero network, and the same code path later runs over the real transport.
- **A unified `LocalSession` from the start.** Rejected for B1 on scope: it requires the
  `Persistence` constructor refactor (light-worker wiring out of the constructor) and re-derives the
  single-player path as a host-with-null-transport. It is the stated B2 pre-work; B1 ships the
  additive mode-branch (`[POC shortcut]`) so host/client is genuinely wired to the production loop
  without reworking single-player.
- **A client-side `Transport`-agnostic render path (separate from single-player).** Rejected:
  reassigning the module globals to the session's objects lets the *existing* render path run
  unchanged, so there is one render path, not two to keep in sync.
- **Predict the client's own body in B1.** Rejected: prediction + reconciliation is phase C (ADR
  0020). B1's own body is host-confirmed (interpolated position, immediate look) — you feel the RTT,
  and that is the documented pre-C behavior.
- **WebRTC directly (a hand-rolled peer connection).** Rejected: `trystero` (Nostr strategy) is the
  thin, dependency-light real transport with the `onPeerJoin`/`onPeerLeave` + reliable/ordered
  delivery the session layer needs; hand-rolling WebRTC signaling is exactly the hosted-infrastructure
  surface the project refuses.

## Consequences

- **The browser runs the whole deterministic core.** `?mp=host` and `?mp=client` are the Gate B1
  e2e (`tests/e2e/mp-{host,client}.spec.ts`): the host sees its remote players rendered, named,
  *moved*, and a host edit reflected; the client sees other players rendered + named, its own
  body + camera, a bounded meshed ring (≤ 125 chunks), a headless host that never meshes, and
  leave-cleanup that removes a disconnected peer's rig. `npm test` + `npm run build` green; the
  single-player pin (`remesh-prof` e2e) does not regress.
- **The host's `worldTime` must be sync-able.** Because the frame loop owns the tick and the
  client-mode headless host is not the page's `worldTime`, the host's `worldTime.tick` is a mutable
  field the frame loop syncs each substep (a `HostSession.worldTime` is non-readonly for exactly
  this; a `ClientSession.worldTime` is readonly — a client never owns the tick).
- **Two `worldTime`s coexist in client mode** (the page's client clock + the headless host's
  clock). They share `tick` (the frame loop's) but the host's continuous clock is the authority the
  client slews toward. The headless host's `state` ticks *must* track the frame tick or the
  client's pose rings collapse (the bug B1's e2e caught: remote players frozen at spawn).
- **The loopback is the node deliverable; the browser loop (B1) + the real transport (B2) are the
  in-browser deliverables.** ADR 0018's node `net-gate`/`net-stress` are unchanged and still green;
  B1 adds the in-browser `?mp` e2e; B2 adds the real-network `?host`/`?join` lobby + the two-tab
  e2e (`net-trystero.test.ts` pins the transport against a fake trystero). **Cross-browser play over
  a real network is now implemented** — the next decision is ADR 0020 (prediction).
- **`[POC shortcut]`s, not design.** The additive frame-loop mode-branch (unified in B2 pre-work),
  the headless in-page host (B2 runs a real remote host), the `lastStream`-only consumption with
  lagging-frame deferral, and the `?mp` bot-driven scenario (B2 replaces it with a real lobby +
  real peers) are all deliberate puns tagged in the code.
- **Follow-ups.** ADR 0020 (own-body prediction + reconciliation) is the next decision this
  unblocks. Deferred B2 pre-work (a follow-up, not a blocker): the `LocalSession` unification
  (single-player as a `HostSession` with a null transport — collapsing the additive frame-loop
  mode-branch) + the `Persistence` light-worker refactor; and verifying a client's `visibilitychange`
  flush does not fire. The specific items are tracked in [`TODO.md`](../TODO.md) → **Multiplayer**.