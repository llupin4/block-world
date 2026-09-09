# Spec: multiplayer — leave-lobby button (stop hosting / leave lobby)

Status: design (2026-09-08). Follow-up to ADR 0019 (transport & lobby), ADR 0020 (prediction
& reconciliation), and the 2026-09-08 names/menu spec. Tiny, bounded change: one button in the
lobby overlay. No protocol change, no session-model change, no boot-gate change.

## Goal

A player in a `?host` / `?join=<code>` lobby can leave the multiplayer world and return to the
normal single-player game from the lobby overlay — instead of hand-editing the URL back to the
base path. The host's button reads **stop hosting** (it kicks everyone); the joiner's reads
**leave lobby** (it only affects them).

## Context (established)

- Boot mode is URL-driven (ADR 0014): `lobbyActive` is computed from the query at module load
  (main.ts:283-285). The lobby boot branch (main.ts:469) reassigns the module globals to the
  session's objects, creates the `TrysteroTransport`, and calls `showLobby`.
- The lobby session runs on the **same persisted save** as single-player: the host branch passes
  the page's `persist` into `HostSession` (main.ts), so block edits made in the lobby are written
  to the same IDB store. Leaving and rejoining single-player therefore resumes the same world,
  lobby edits included.
- The M menu already establishes the navigate-to-reload pattern (`location.href = '?host&name=…'`);
  a reload is an accepted way to change boot mode.
- A joiner whose host leaves already gets a static "host left" overlay (the client's
  `onPeerLeave` hook, main.ts).
- The codebase has no styled dialog system; the app is a POC. `window.confirm` is available and
  used nowhere yet.

## Design

### Mechanism: navigate to the base URL (approach A)

The leave button sets `location.href = location.pathname` — the whole query is dropped
(`host`, `join`, `name`, …), so `lobbyActive` is false on the next load and the normal
single-player boot runs: the IDB save is restored (lobby edits persist) and the game starts.

Tear-down is free: page unload kills the WebRTC data channels, the Nostr room subscription,
and the 500 ms lobby peer poller. No explicit session/transport dispose is added.

**Rejected alternatives:**
- *In-place teardown* (dispose the session, restore the module globals, re-run the single-player
  boot without reloading): the `booted` gate, the light worker bound to the session's world, and
  the meshing/streaming state all make this a deep unwind that fights the URL-is-source-of-truth
  architecture. Not worth it for a POC.
- *Null the session but stay on `?host`*: the URL would lie about the mode — a reload would drop
  the player back into the lobby.

### Button

- Rendered in `showLobby` (main.ts) as `#lobby-leave`, directly under the existing `#lobby-copy`
  button, styled identically (the copy button's inline `style`).
- Label is role-aware: **stop hosting** when `isHost`, else **leave lobby** — it advertises the
  consequence (the host's click drops every connected player).
- Click behavior:
  - **Host:** `confirm('Leave? Connected players will be dropped.')` → on OK navigate to
    `location.pathname`; on cancel stay (no state change). The host always confirms, even with
    zero peers, so the rule stays one line.
  - **Joiner:** navigate immediately (no confirm — leaving only affects the joiner).

### Joiner whose host leaves

Unchanged: the existing "host left" static overlay appears (the client's `onPeerLeave` fires when
the host's peer connection drops), and the joiner's own lobby panel is still up with the
**leave lobby** button to get back to single-player.

## Tests (e2e, appended to `tests/e2e/mp-lobby.spec.ts`)

`mp-lobby.spec.ts` is the single-page, relay-independent lobby spec — the natural home. All three
tests boot the lobby (no peer required) and then click the button:

1. **Host leaves (confirmed):** `?host` → `#lobby` visible → click `#lobby-leave` → accept the
   `confirm` dialog (Playwright `page.on('dialog')`) → the page navigates: the URL has no
   `host` param, `window.__lobby` is undefined, `#lobby` is gone, and the single-player game
   booted (the WebGL canvas is present).
2. **Host cancels:** `?host` → click `#lobby-leave` → **dismiss** the dialog → still in the lobby
   (`#lobby-code` visible, `__lobby` present).
3. **Joiner leaves (no dialog):** `?join=<code>` → click `#lobby-leave` → no dialog (assert none
   was auto-accepted) → back to the base URL, lobby gone.

No unit tests: the change is DOM/`location` wiring with no pure logic. Typecheck + the existing
e2e suite (mp-lobby, mp-2tab, mp-menu, mp-client) guard against regressions.

## Non-goals

- No in-place teardown / no-reload leave (approach B above).
- No keyboard shortcut for leave (Esc already releases the pointer lock).
- No host "kick player" control (a session feature, not a lobby affordance).
- No styled dialog system — native `confirm` for the host, nothing for the joiner.
- No explicit `TrysteroTransport`/room destroy call (page unload suffices).