# Plan: multiplayer B2 — real transport (Trystero) + `?host`/`?join` lobby

**Status: executing (2026-09-07).** Pre-work + phase A + **B1** (the deterministic core in the
browser) are done and green (ADR 0018, 0019). This plan lands B2: replace the in-page
`LoopbackHub` with a real `Transport` (trystero, Nostr strategy), add a minimal `?host`/`?join`
lobby, and prove it with a two-tab e2e (Gate B). The DRAFT spec
(`docs/superpowers/specs/2026-09-07-multiplayer-transport-lobby-design.md`) is the design of
record; the decisions it left open are resolved here. Durable record: **ADR 0019** (B1+B2).

## Resolved open questions

- **Trystero action shape.** One message action (namespace `msg`) carrying the JSON-encoded `Msg`
  (the `type` discriminant is inside the JSON) — not one action per message type. Simpler, and the
  session layer is already transport-agnostic (proven by the loopback), so this is isolated to
  `src/net/trystero.ts`.
- **Binary on the wire.** `RTCDataChannel.send` takes a `DOMString`, so a `Msg` is JSON-serialized;
  the only non-JSON-safe fields are the six `Uint8Array` chunk arrays in `ChunkRecord` (carried by
  `welcome.snapshot.chunks` + `chunkRec.rec`), base64-encoded. Everything else (`Intent`,
  `EntityRecord`, `WorldMeta`, `NetEntity`, `cells`) is already plain JSON. A codec
  (`encodeMsg`/`decodeMsg`) keeps this inside the transport boundary.
- **`?host`/`?join` boot.** A new `startGame` branch *before* the B1 `?mp` branch. It reuses the
  exact B1 session-wiring + frame-loop pattern (reassign the module globals to the session's
  objects; the frame loop ticks the clients → delivers transport msgs → ticks the local host →
  `advanceTick`), differing only in the `Transport` (a `TrysteroTransport` instead of a
  `LoopbackHub`) and the peer set (real peers over the network instead of in-page bots). Coexists
  with `?replay`/`?phase`/`?prof` (the lobby wins over them, as `?mp` does).
- **No in-page headless host for a real client.** `?mp=client` runs an in-page headless `HostSession`
  (one page, loopback). `?join=<code>` runs *only* the page's `ClientSession` — the real host is a
  separate tab. So the frame loop's host-tick step becomes conditional on `mpHost` being present.
- **`NET_INTERP_TICKS 6` holds** (measured in B1). Reconnect (a dropped peer rejoining by `name`)
  and an **unreliable** `state` channel are deferred (the phase C TODO / non-goals), per the DRAFT.

## Tasks

1. **Codec** (`src/net/messages.ts`): `encodeMsg(msg): string` / `decodeMsg(s): Msg`. JSON; the six
   `ChunkRecord` `Uint8Array` fields base64-encoded (`btoa`/`atob`, loop-built). Only `welcome` +
   `chunkRec` touch the binary; all other `Msg`s are a plain `JSON.stringify`.
2. **`TrysteroTransport`** (`src/net/trystero.ts`): a thin `Transport` over `trystero` (Nostr
   strategy, the only new dep — `trystero@0.25.4`, `joinRoom({appId}, roomId)` → `Room`,
   `room.makeAction('msg')`, `action.send(str, {target})`, `room.onPeerJoin/Leave`, `selfId`).
   Reliable + ordered (data-channel guarantee) → the session layer runs unchanged. `send`
   `encodeMsg`s to a string and delivers to a peer / `null` (all); `onMessage` `decodeMsg`s.
   Peer join/leave from the room's signals. **Injectable** `trystero` surface (a structural
   `TrysteroLike`) so a node test injects a fake (the real module imports fine in node, but there's
   no RTC). `disconnect` → `room.leave()`.
3. **Node test** (`src/__tests__/net-trystero.test.ts`): with a **mocked trystero** (two in-process
   fake rooms wired to each other): a `send` from A reaches B's `onMessage` decoded to the same
   `Msg` (binary `chunkRec`/`welcome` round-trips byte-identical); `onPeerJoin`/`onPeerLeave` fire
   on join/leave; `send('all')` fans out; `peers()` tracks the set.
4. **`main.ts` boot + lobby:**
   - Parse `?host` (presence → host; optional `?host=<code>` to fix the room code for e2e) and
     `?join=<code>`; `genRoomCode()` a 6-char unambiguous code when the host has none.
   - A `startGame` branch (before `?mp`): build a `TrysteroTransport(appId='block-world', code)`.
     `?host` → `HostSession(tr, seed, {withOwnPlayer, persist, hooks:simHooks})`, `mpHost=host`,
     `mpClients=[]`. `?join` → `ClientSession(tr,'me',human)`, `mpHost=null`,
     `mpClients=[client]`, `client.setLightEdit` → `lightSim.edit`, `client.onPeerLeave` (host
     gone) → "host left" static view. Reassign the module globals; `lightSim=new LightClient(world,
     worldTime)`; `mpHub=null` (no in-page hub).
   - **Lobby overlay** (`showLobby`): fixed panel (room code + copy button + a peer list updated by
     polling `tr.peers()` every 500 ms — no `onPeerJoin` conflict, the sessions own it). A
     `window.__lobby = {code, isHost, peers:()=>tr.peers()}` hook for the e2e.
   - **Frame loop**: `if (mpSession)` (was `if (mpSession && mpHost)`); inside, the host-tick step
     is `if (mpHost) { … }` (a real client has no local host). `mpHub?.pump` is a no-op when null.
5. **e2e (Gate B):**
   - `mp-lobby.spec.ts` (single page, robust): `?host=<code>` → the lobby overlay shows that code;
     `?join=<code>` → the overlay shows "joined". No peer required (boot renders the lobby even
     before a peer connects).
   - `mp-2tab.spec.ts` (the real gate): one page `?host=<code>`, one page `?join=<code>` over the
     real trystero transport (a fresh random `code` per run to avoid relay cross-talk). Assert they
     see each other: the client's `__mpResult.otherPlayers` includes a host player, and/or the
     host's `remotePlayers` includes the client. Generous timeout (room join + WebRTC handshake +
     first `state` can take ~10 s). STUN only (trystero default); no TURN.
6. **Regression + record:** `npm test` + `npm run build` green (the loopback `net-*` suites + the
   new `net-trystero` suite); the single-player `remesh-prof` pin holds; update ADR 0019 status
   (B2 implemented) + the TODO Multiplayer section (B2 done; C remains).

## Gate B
Two browser tabs on one machine over the real transport: join, see each other, edit, (water),
leave; `npm test` + `npm run build` green; no single-player pin regresses; ADR 0019 updated.