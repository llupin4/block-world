# Spec (DRAFT): multiplayer — phase B: real transport, lobby, remote-player rendering

**Status: DRAFT (2026-09-07).** This is a design-of-record sketch, **not** a frozen spec and
**not** a plan. It exists so the phase B design is not lost while pre-work + phase A are
implemented. It will be **adjusted/redefined after pre-work + phase A land** (against the
actual `src/net/` code, the measured `NET_INTERP_TICKS`, and what the loopback gate taught
us), then finalized into a spec + an execution-ready plan. Durable record after
implementation: **ADR 0019 — Transport & lobby** (amends 0018 if cleaner).

## Goal (draft)

Replace the loopback transport with a real network path, add a minimal lobby, and render
remote players. Everything in phase A (session model, union-ring, cells, state) is reused
unchanged — phase B swaps the `Transport` implementation and wires the browser, it does not
redesign the protocol.

## Design of record (draft)

### `TrysteroTransport`
- Implements the `Transport` contract (transport.ts) over `trystero` — the **only new
  dependency**. Strategy: Nostr by default; a "room" is a short code.
- Keep it thin: `makeAction` per message type, **or** one action carrying the `type`
  discriminant — **measure and pick** (the loopback already proves the session layer is
  agnostic to the transport, so this is isolated).
- Must preserve the loopback guarantees the session layer relies on: reliable + ordered
  delivery, `onPeerJoin`/`onPeerLeave`.

### Lobby
- `?host` starts a session and shows the room code; `?join=<code>` joins.
- A minimal overlay: the room code, the peer list, a copy button.
- The main menu stays single-player by default.
- **Boot gating in `main.ts`:** phase A deliberately touched no `main.ts` render path; phase B
  is where `?host`/`?join` are parsed at boot and the `HostSession`/`ClientSession` are wired
  into the existing frame loop (the host drives `HostSession.tick` inside the substep loop;
  the client drives `ClientSession.tick` + interpolation in `syncEntityRigs`/`syncCamera`).
  This must coexist cleanly with the existing `?replay`/`?phase`/`?prof` boot branches.

### Remote-player rendering
- Render remote players with the ADR 0016 biped rig (box-part) + a name tag (`Sprite` or a
  canvas texture).
- Interpolation from phase A (`NET_INTERP_TICKS`, render `state` stride behind).

### Persistence
- The host saves as today (IndexedDB). A client's IDB is untouched by the session (already
  true by design) — **verify with the real transport**: the `visibilitychange` flush must not
  fire on clients.

### Leave handling
- Peer leave → despawn + rig removal (phase A's `onPeerLeave`).
- Host leave → clients show "host left" and return to single-player.

### NAT
- STUN only via Trystero's defaults. The ADR must document that some peer pairs will not
  connect without TURN, and that **TURN is the one place infrastructure could enter — do not
  add it**.

## Gate B (draft)
- Two browser tabs on one machine over the real transport: join, see each other, edit, water,
  walk apart past the host ring, leave/rejoin.
- `npm test` + `npm run build` green; no single-player pin regresses.
- ADR 0019.

## Open questions (resolve when finalizing)
- Trystero action shape (per-type vs single discriminant) — benchmark.
- Name-tag rendering path (`Sprite` vs canvas texture) — pick the cheap one.
- Exactly how `?host`/`?join` boot interacts with `startGame`/`?replay` in main.ts (the phase A
  loopback never exercised main.ts).
- The client's render-path wiring: where in `frame()`/`syncEntityRigs` the `ClientSession`
  interpolated poses feed the rigs + camera (phase A had no render path).
- `NET_INTERP_TICKS` final value (measured in phase A; confirm under real RTT).
- Reconnect behavior (a dropped peer rejoins by `name`; host is authoritative).
- Whether `state` should move to an **unreliable** channel (candidate for the phase C TODO).