# Spec: multiplayer — phase B1: host + client render (deterministic core, loopback-in-browser)

**Status: Final (2026-09-07).** This is the execution-ready design for **B1**, the deterministic
core of multiplayer phase B. It finalizes the B1 portion of the draft
`2026-09-07-multiplayer-transport-lobby-design.md` (which remains the B2 sketch — real
Trystero transport, lobby, `?host`/`?join`, two-tab e2e). Durable record after implementation:
**ADR 0019 — Transport & lobby** (this ADR covers B1 + B2; B1 lands first).

Everything from phase A (the session model, union-ring, `cells`, `state`, the `Transport`
contract, `LoopbackHub`) is reused unchanged. B1 swaps the loopback for the **browser render
path**: it makes the game actually render a host's world with remote players, and a client's
world fed by a host — verified deterministically with the loopback running **inside the
browser** (no network, no relay).

## Goal (B1)

Make the `main.ts` render path drive a `HostSession` (`?mp=host`) and a `ClientSession`
(`?mp=client`) over an in-page `LoopbackHub`, so that:

- **Host side** (`?mp=host`): the page renders the host's authoritative world **plus** the
  script-bot clients' remote players (their entity rigs appear and move as their intents are
  applied by the host's sim).
- **Client side** (`?mp=client`): the page renders the client's world (pristine local terrain +
  host-fed `cells`) **plus** the other players' remote-player rigs **plus** its own interpolated
  body; the camera follows the interpolated own body with an immediate (non-lagged) look.

Verified deterministically by two headless playwright specs (`?mp=host` / `?mp=client`) reading a
`window.__mpResult` report, plus **node tests** for the pure interpolation math. The real
`TrysteroTransport` + lobby + two-tab e2e are **B2**, not this spec.

## Context

- Phase A shipped `src/net/{host,client,messages,transport,remote-controller,network-persist,
  stress}.ts`: a `HostSession` (authoritative `Sim` + `WaterSim` + world + `InMemoryChunkStore`
  persist), a `ClientSession` (a view: local terrain + host-fed `cells`/`state`, its `Sim` is a
  container — `tick` is never called), the `Msg` union, the `Transport` contract, and a
  pump-driven `LoopbackHub`. The loopback is pure TS (no node-only APIs) — **it runs in the
  browser**.
- `main.ts` keeps `world`/`sim`/`waterSim`/`lightSim` as module globals driven by one `frame()`
  loop: a fixed-`STEP` substep loop (`sim.tick` + `worldTime.advance`), then once per frame
  `tickStreaming()`, the light worker tick, the water pulse (on the `WATER_STRIDE` crossing), a
  budgeted re-mesh drain, `syncCamera()`, `syncEntityRigs(dt)`, and the render. `syncEntityRigs`
  (main.ts:497) already renders **every** entity in `sim.all()` with the ADR 0016 box-part rig
  and hides the viewed entity — so remote players appear for free once they're in `sim.all()`.
- The e2e pattern is `?prof=remesh` → `window.__profResult` → playwright
  (`tests/e2e/remesh-prof.spec.ts`, `playwright.config.mjs` webServer on 4173). `@playwright/test`
  + headless chromium are already installed.

## Design

### Loop wiring — additive mode-branch (`[POC shortcut]`; the unification is B2 pre-work)

The frame loop becomes mode-aware; **single-player is untouched** (the pins protect it). At boot
`?mp=host|client` is parsed; the session is created and the module globals (`world`/`sim`/
`waterSim`, switched to `let`) are pointed at the session's world/sim so the whole render path
(light, re-mesh, `syncCamera`, `syncEntityRigs`) runs unchanged against the session's objects:

- **Single-player** (default): exactly as today.
- **`?mp=host`**: `session = new HostSession(transport, seed, { persist, withOwnPlayer: true })`
  + N `ScriptController` bot clients over a `LoopbackHub`; the substep drives
  `hostSession.tick(worldTime.tick)` (sim + water heartbeat + `cells` flush + `state` + union-ring
  streaming); the frame's `tickStreaming()` is **skipped** (the session's union-ring streaming
  supersedes it); the host's own player is the viewed entity (hidden, first person).
- **`?mp=client`**: `session = new ClientSession(transport, name, humanController)` + an **in-page
  headless `HostSession`** (authoritative, `withOwnPlayer: false`, N bot "other players") over the
  same `LoopbackHub`; the substep drives `clientSession.tick(worldTime.tick)` (intent + own-ring
  streaming) — **no `sim.tick`** (container); the water pulse is **skipped** (the client has no
  `WaterSim` — water arrives via `cells`).

**Why not the full unification now.** The clean end-state (user-preferred) is
**`LocalSession` = `HostSession` with a `null` transport**, so `frame()` always drives
`session.tick()` + reads `session.world`/`session.sim` and `?mp=host` merely adds a `Transport`.
That requires the `HostSession` to stop spawning in its constructor (single-player instead
restores a saved world from IndexedDB) and to split its per-substep streaming from a per-frame
`stream()` (single-player streams per-frame, the host per-substep today). That is a real refactor
of phase A code + the `main.ts` boot, and B1 is already large. So B1 ships the additive branch
(tagged `[POC shortcut]`) and **the `LocalSession` unification is B2 pre-work** (it also has to
happen before the real transport can drive the loop). The single-player path is byte-for-byte
untouched in B1, so the pins keep it safe.

### Boot + mode precedence

- `?mp=host&bots=N` (default `bots=2`): host + N loopback script-bot clients. `?mp=client&bots=N`
  (default `bots=1`): client + an in-page headless host with N bot "other players" (+ the client
  itself). The loopback is `new LoopbackHub()` (in-page, `pump(tick)` called once per substep).
- **`?mp` wins** over `?replay`/`?prof` (mutually exclusive; if `?mp` is present, the replay/prof
  boot branches are skipped). `?phase`/`?dbg` still apply.
- The headless host in `?mp=client` uses `InMemoryChunkStore` (it must **not** touch the page's
  IndexedDB — that's the client's machine). `?mp=host` (real, B2) and single-player use the real
  `Persistence` (IndexedDB). This is why the persist is injected now (below).

### Persist injection (host, now not later)

`HostSession`'s constructor takes `persist?: Persistence` (default `new Persistence(new
InMemoryChunkStore(), seed)` — the headless case). Single-player and `?mp=host` pass the real
`Persistence`; the `?mp=client` headless host uses the in-memory default. B2 therefore does not
reopen `HostSession` to wire the host as the save owner.

### Client light worker

The client **runs its own `LightClient`** on its world. Light is derived state: the worker
re-settles from the block arrays it is handed, and the client's world already reflects the host's
edits (applied via `cells`). Sending light over the wire would be larger than the `cells` and
pointless. When a `cells` batch lands, the client's `lightSim.edit()` is called on the affected
chunks (the existing edit path), so the client's light tracks the host's edits. Endorsed without
reservation.

### Interpolation (`NET_INTERP_TICKS = 6`, pure, node-tested)

The client buffers a **ring of 8 pose samples per entity** (a small jitter buffer), each tagged
with the **host tick**
(`state.tick`, `time.tick`). The render reads the pose at `renderTick = worldTime.tick −
NET_INTERP_TICKS` (6 substeps = 100 ms behind), picks the **bracketing pair** in the ring, and
linearly interpolates between them — **holding the last pose if no pair brackets** (jitter on the
loopback delay, certainly on WebRTC, means the newest two are not always the bracketing pair).
**Yaw interpolates by shortest arc** (a 350°→10° turn sweeps through 0°, not 180°).

- **World-time alignment.** The client's `worldTime.tick` is **slewed from the host's `time`
  messages** (phase A's message, currently a client no-op). In the loopback (zero RTT) the clocks
  run in lockstep, so the slew is a ~no-op; on a real transport it corrects the RTT offset. The
  render math (`worldTime.tick − 6`) is only meaningful because that clock tracks the host.
- **Extracted as a pure module** `src/net/interp.ts` (a `PoseRing` per entity + `interpose(
  samples, renderTick)`), so the selection + math are **node-tested first**; the e2e verifies
  wiring (rigs land where the math says), not the math.

**Node tests** (`src/__tests__/net-interp.test.ts`): bracketing-pair selection across a jittery
sample set; renderTick before the first sample → hold first; after the last → hold last; a gap
(no bracketing pair) → hold the last pose before it; yaw shortest-arc across the ±π seam; the
6-tick render delay lands between the two expected samples.

### Client look vs. body

The camera's **yaw/pitch come straight from the human controller** (immediate), not from the
interpolated own-body pose — so the look never feels 100 ms behind, even though the body's
**position** lags by the intended `NET_INTERP_TICKS`. Only the own body's position is interpolated;
its orientation follows the mouse live.

### Remote-player rendering + name tags

`syncEntityRigs` already renders every `sim.all()` entity, so remote players (in the client's /
host's `sim`) get their ADR 0016 box-part rig automatically; their poses come from the
interpolation (client) or the host's sim (host). A **name tag** is one `THREE.Sprite` per
**entity id** (positioned above the rig). The tag's **texture** (a small canvas with the name) is
**cached by name** (so many "Louis"es share one texture) but the **sprite is keyed by entity id**
(so two peers who both type "Louis" don't share one tag / position).

### Leave handling

- A loopback peer disconnects → `Transport.onPeerLeave` → the host `despawn`s the entity →
  `syncEntityRigs` cleanup (main.ts:515) removes the rig **and** its name tag.
- `?mp=client`, host-side leave: the client shows **"host left"** and stops driving the session
  (returns to a static view of the last-received world — no further `cells`/`state`).

### Headless host is simulation-only (`?mp=client`)

The in-page headless host shares the client page's main thread. In the additive branch the frame
loop's light worker + re-mesh drain operate on the **client's** world (the page's session), so the
headless host's world is **never meshed or lit** — it is purely simulation (its union-ring
streaming loads + marks the bot-only chunks dirty, but nothing meshes them, because they're not
the frame loop's world). That keeps the client page's frame budget to **one** world's worth of
light work. The e2e result asserts the client's **meshed/lit chunk count is bounded to the
client's ring** (the headless host contributes 0).

## Verification (Gate B1)

- **Node (pure math):** `src/__tests__/net-interp.test.ts` (ring selection, bracketing, gap,
  shortest-arc yaw, render delay) — the interpolation is verified here, not in the e2e.
- **E2E (wiring, deterministic):** two playwright specs hit `?mp=host` / `?mp=client`, let the
  production loop run ~N ticks, read `window.__mpResult` (mirroring `?prof=remesh`) and assert:
  - `?mp=host`: the bot clients' remote-player rigs are present and move (their positions track
    their intents); editing a cell on the host is reflected in the host's world.
  - `?mp=client`: the other-players' rigs are present + move (interpolated); the own-body camera
    follows the interpolated position with an immediate look; the headless host's meshed/lit
    chunk count is bounded to its meshable ring (no remote-only light work); a bot disconnect →
    its rig + tag are removed.
- **Regression:** `npm test` (node) + `npm run build` green; **no single-player pin regresses**
  (the additive branch leaves single-player byte-for-byte untouched).

## Alternatives

- **Full `LocalSession` unification in B1** (single-player = `HostSession` with a null transport,
  one loop path). Rejected for B1 on scope (see Loop wiring); it is B2 pre-work and the stated
  end-state. The additive branch is the `[POC shortcut]`.
- **A parallel `?mp=` scenario loop** (a separate render loop, not the production one). Rejected:
  it would verify the rigs but leave the production loop unwired for host/client, slipping the
  real integration to B2. B1 wires the production loop (mode branch) so host/client is genuinely
  playable.
- **Client light from the host over the wire.** Rejected: larger than `cells`, and light is
  re-derivable on the client (the worker settles from the arrays it's handed).

## Consequences

- **B2 pre-work:** the `LocalSession` unification (single-player as a `HostSession` with a null
  transport; one loop path; `HostSession` split into `tick()` + per-frame `stream()`; spawn
  moved out of the constructor so a saved world can restore) **and** the real `TrysteroTransport`
  + lobby + `?host`/`?join` + two-tab e2e (the draft spec). ADR 0019 covers both.
- **Phase C (ADR 0020):** own-body prediction (the client's body lags `NET_INTERP_TICKS`; the look
  is already immediate). The interpolation ring is the hook prediction reconciles into.
- **Pinned numbers (verbatim):** `NET_STATE_STRIDE 3`, `TIME_STRIDE 60`, `NET_REMOTE_RADIUS 1`,
  `CELLS_FULL_THRESHOLD 512`, `PROTOCOL_VERSION 1`, `VIEW_RADIUS 2`, `TERRAIN_SEED 1234`; new:
  **`NET_INTERP_TICKS 6`** (100 ms render delay), **interpolation ring 8** samples per entity.
- **`[POC shortcut]`:** the additive loop branch (unification deferred to B2); the headless host
  uses `InMemoryChunkStore`; the `?mp` scenarios are loopback-only (no real transport).
- **Follow-ups:** tracked in `TODO.md` → **Multiplayer** (B2 real transport/lobby; C prediction).