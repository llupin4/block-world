# Spec: multiplayer — host/join names, the `M` multiplayer menu, host-movement fix

Status: design (2026-09-08). Follow-up to ADR 0019 (transport & lobby) and ADR 0020
(prediction & reconciliation). Small, bounded change: two lobby bugs + one input feature.
No protocol change, no session-model change, no TURN (ADR 0019's non-goal holds).

## Goal

A player can host or join a multiplayer world from an in-game menu (key `M`) instead of
editing URL params by hand, and every player body — including the host's — carries a
display name (typed or randomly assigned, e.g. `Blue4402`) shown as a name tag to everyone
else. Along the way, two observed bugs are fixed:

1. **The host cannot move in a `?host` lobby** — the host's own body stands still.
2. **The host has no name tag over their head** — joiners see the host's rig with no tag.

## Root causes (established by investigation)

- **Host movement:** the lobby host branch (main.ts) constructs
  `new HostSession(tr, TERRAIN_SEED, { withOwnPlayer: true, ... })`. `HostSession` spawns the
  own player with an `IdleController` (host.ts), and nothing ever attaches the page's
  `HumanController` to it. Single-player spawns the body with `human` (main.ts), and the
  lobby *client* branch passes `human` into `ClientSession` — the lobby host does neither,
  so the authoritative sim ticks the host's body under `IdleController` and it never moves.
- **Host name tag:** the own entity is spawned with no `name` field. `broadcastState`
  ships `name` per entity (undefined for the host), so clients render the host's rig
  tagless. The host's *own* first-person rig/tag is hidden by existing design (the viewed
  entity's rig and tag are hidden — first person), which is correct and unchanged.

## Design

### 1. HostSession opts: `ownController?` + `ownName?`

`HostOpts` (src/net/host.ts) gains:

```ts
interface HostOpts {
  withOwnPlayer?: boolean;
  ownController?: Controller; // drives the own player (default: IdleController)
  ownName?: string;           // display name for the own player (default: none)
  persist?: Persistence;
  hooks?: ApplyHooks;
}
```

The own-player spawn (today `new IdleController()`) becomes
`opts.ownController ?? new IdleController()` and, when `opts.ownName` is set, the spawned
entity gets `e.name = opts.ownName`. `?mp=host` B1 passes neither (behavior unchanged: idle
own body). The lobby host branch passes `{ ownController: human, ownName: <boot name> }`, so
keyboard/mouse drive the host's body through the normal `sim.tick → applyIntent` path —
movement, look, and block editing exactly like single-player.

The lobby *client* branch stops hardcoding `'me'`: `new ClientSession(tr, <boot name>, human)`.

### 2. Names (new module `src/net/name.ts`)

```ts
export function randomName(): string        // e.g. "Blue4402"
export function sanitizeName(input: string): string  // trimmed, ≤ 16 chars; empty → randomName()
```

- `randomName()`: a word from a ~20-entry color list (Blue, Red, Green, Orange, Purple,
  Indigo, …) + a 4-digit number (`1000`–`9999`).
- `sanitizeName()`: trim; collapse internal whitespace; hard-cap at 16 chars (the name-tag
  texture already slices at 14, so 16 is safe); if the result is empty, return
  `randomName()`.

Boot (main.ts, where `?host`/`?join` are already parsed): the name comes from the `name`
URL param, run through `sanitizeName`. A **typed** name (non-empty `name` param) is written
to `localStorage['bw.name']`; a random name (empty/absent param) is not. The name travels
only in the URL — no protocol field changes (the client's `hello` already carries `name`;
the host's name arrives via the existing `state`/`welcome` entity records).

### 3. The `M` menu (new overlay)

Key `M` (currently unbound) toggles a multiplayer overlay, styled like the existing
palette/help overlays (index.html + ui.css). Contents:

- **Name** input — prefilled from `localStorage['bw.name']` (blank if none).
- **Host world** button → `location.href = '?host&name=' + encodeURIComponent(name)`
  (the page reloads into the existing boot path — same pattern as the replay-quit button).
- **Room code** input (lowercase-normalized; the code alphabet is already lowercase) +
  **Join** button → `location.href = '?join=' + code + '&name=' + encodeURIComponent(name)`.
  Empty code → inline hint, no navigation.

Behavior:

- Opening `M` while any session or replay is active (`mpSession !== null` or `playback`)
  does nothing (the boot branch ran; the menu is a single-player-screen affordance).
- The overlay closes on `M` again / `Esc`; focus handling matches the palette overlay.
- The lobby panel (`showLobby`) shows the player's name under its header (host and client).

### 4. Unchanged

- First-person rig/tag hiding (main.ts `syncEntityRigs`) — the host still cannot see their
  own head; joiners see the host's named rig.
- The ADR 0014 boot gate, the ADR 0019 protocol constants, STUN-only NAT posture.
- `genRoomCode()` and the e2e's URL-driven boot (a fixed `?host=<code>` still works; the
  `name` param is additive).

## Error handling / edge cases

- Name > 16 chars (pasted): truncated by `sanitizeName`.
- Empty name at host/join time: `randomName()` is used; the random name is *not* persisted.
- `M` inside an active `?host`/`?join` page (or any `?mp`/`?replay` session): no-op.
- Joining a room whose host never announces: the existing "connecting to host…" lobby state
  (no new machinery).
- WebCrypto unavailable: the existing fatal overlay (unchanged).
- Reloading from the menu discards the in-progress single-player view the same way the
  replay-quit button does (persistence flush on unload is existing behavior).

## Tests (TDD — failing tests first)

Unit:

- `src/__tests__/net-name.test.ts`: `randomName()` matches `^[A-Z][a-z]+[1-9][0-9]{3}$` and
  uses a word from the list; `sanitizeName()` trims/caps at 16, collapses whitespace, and
  returns a random name for empty/whitespace input.
- `src/__tests__/net-host.test.ts`: with `ownController` (a scripted `HumanController`), the
  host's own entity moves off spawn after a run of intents; with `ownName`, the own entity
  carries the name, and a `state` broadcast to a hello'd peer includes it.
- Existing `net-host`/`net-client`/possession tests stay green (the B1 `?mp=host` path is
  unchanged: default `IdleController`).

E2E (extend `tests/e2e/mp-2tab.spec.ts` + a new menu spec):

- **Names + host movement gate:** boot the host with `&name=Blue4402`; the client's
  `__lobby.remotePlayers()` shows the host's body named `Blue4402` (today: `null`); the
  host's own body moves when the host tab presses `W` (expose the own entity's position via
  `window.__lobby.ownPos()` for the assertion — a read-only hook, no behavior).
- **Menu spec:** on the single-player page, press `M`, type a name, click **Host world** →
  lands on a `?host` URL, the lobby overlay renders the typed name, and `localStorage`
  holds it; with a code present, **Join** lands on `?join=<code>`.

## Non-goals

- No in-place session start (no reload): the URL stays the source of truth (Approach A).
- No third-person camera (seeing your own body/tag from behind) — first person stays.
- No name colors/styling beyond the existing tag sprite; no in-game name editing after boot.
- No protocol changes (names flow through the existing `hello`/`state`/`welcome` fields).
- No TURN; no relay-list changes (the 2026-09-08 relay pin stands).

## Success criteria

- From the single-player screen, `M` → host or join works without URL editing; the typed
  name is remembered and prefilled next visit.
- In a live game, every player body shows a name tag to every *other* player, including the
  host's (e.g. `Blue4402`).
- The host's body moves (and can edit blocks) in a `?host` lobby.
- `npm test`, `npm run build` (typecheck), and the e2e gates are green; single-player pins
  hold.