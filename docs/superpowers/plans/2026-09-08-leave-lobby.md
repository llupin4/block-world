# Leave-Lobby Button (Stop Hosting / Leave Lobby) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A player in a `?host`/`?join=<code>` lobby can leave back to the normal single-player game from a button in the lobby overlay — the host's button (**stop hosting**) confirms first because it drops connected players; the joiner's (**leave lobby**) navigates immediately.

**Architecture:** The button navigates to `location.pathname` (drops the whole query), so the URL-driven boot gate (ADR 0014) re-runs the normal single-player boot on reload — the IDB save is restored (the lobby session runs on the same `persist`, so lobby edits persist), and page unload tears down the WebRTC channels + Nostr room for free. One button in `showLobby` (main.ts) + a click handler; no protocol/session/boot-gate change.

**Tech Stack:** TypeScript, Vite, Vitest (unit — no new unit tests for this change), Playwright (e2e, `tests/e2e/`, dev server auto-started on `:4173`).

**Spec:** `docs/superpowers/specs/2026-09-08-leave-lobby-design.md`

---

## File structure

| File | Change | Responsibility |
|---|---|---|
| `tests/e2e/mp-lobby.spec.ts` | Modify | 3 new e2e tests: host leaves (confirm accepted), host cancels (dialog dismissed), joiner leaves (no dialog) |
| `src/main.ts` (`showLobby`, ~line 415) | Modify | `#lobby-leave` button in the lobby panel + click handler (confirm for host, navigate) |

Conventions: the lobby overlay is built in `showLobby` with inline styles (no CSS file involvement — the button mirrors the `#lobby-copy` inline style). Tests run with `npx playwright test <file>`; the full unit suite with `npm test`. Commit style: `feat(main): …`.

---

### Task 1: leave-lobby button + e2e

**Files:**
- Modify: `tests/e2e/mp-lobby.spec.ts` (append 3 tests — failing gate first)
- Modify: `src/main.ts:419-434` (`showLobby` innerHTML template + copy-button handler area)

Context: `showLobby(code, isHost, tr, session, name)` builds the `#lobby` panel (room code, `#lobby-copy` button, `#lobby-peers` list) and sets the `__lobby` e2e hook. The existing `#lobby-copy` button's inline style is:
`cursor:pointer;font:12px sans-serif;padding:4px 8px;background:#2a2a2a;color:#fff;border:1px solid #555;border-radius:4px`.
The single-player page renders a three.js `<canvas>` on boot. `location.pathname` of the dev page is `/`, so navigating there drops all query params.

- [ ] **Step 1: Write the failing tests**

Append to `tests/e2e/mp-lobby.spec.ts`:

```ts
test('lobby: host stops hosting (confirm → back to single-player)', async ({ page }) => {
  const ready = page.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  await page.goto(`${BASE}?host=hostL`);
  await ready;
  await expect(page.locator('#lobby-leave')).toBeVisible();
  await expect(page.locator('#lobby-leave')).toHaveText('stop hosting');
  page.on('dialog', (d) => d.accept());
  const nav = page.click('#lobby-leave');
  await nav;
  expect(new URL(page.url()).search).toBe('');
  expect(await page.evaluate(() => (window as { __lobby?: unknown }).__lobby)).toBeUndefined();
  await expect(page.locator('#lobby')).toHaveCount(0);
  await expect(page.locator('canvas').first()).toBeVisible();
});

test('lobby: host cancels the leave (dismiss → still in the lobby)', async ({ page }) => {
  const ready = page.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  await page.goto(`${BASE}?host=hostM`);
  await ready;
  page.on('dialog', (d) => d.dismiss());
  await page.click('#lobby-leave');
  await expect(page.locator('#lobby-code')).toBeVisible();
  const l = await lobby(page);
  expect(l?.isHost).toBe(true);
});

test('lobby: joiner leaves (no dialog → back to single-player)', async ({ page }) => {
  const ready = page.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  await page.goto(`${BASE}?join=joinN`);
  await ready;
  await expect(page.locator('#lobby-leave')).toHaveText('leave lobby');
  let dialogs = 0; // a joiner must not be asked — count any dialog that fires
  page.on('dialog', () => { dialogs += 1; });
  const nav = page.click('#lobby-leave');
  await nav;
  expect(dialogs).toBe(0);
  expect(new URL(page.url()).search).toBe('');
  expect(await page.evaluate(() => (window as { __lobby?: unknown }).__lobby)).toBeUndefined();
  await expect(page.locator('#lobby')).toHaveCount(0);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/e2e/mp-lobby.spec.ts`
Expected: the 3 new tests FAIL (`#lobby-leave` never resolves — the button doesn't exist); the 2 existing tests still pass.

- [ ] **Step 3: Implement the button**

In `src/main.ts` `showLobby`, add the leave button to the `el.innerHTML` template — right after the `#lobby-copy` line (line 423):

```ts
    `<button id="lobby-copy" style="cursor:pointer;font:12px sans-serif;padding:4px 8px;background:#2a2a2a;color:#fff;border:1px solid #555;border-radius:4px">copy code</button>` +
    `<button id="lobby-leave" style="display:block;width:100%;margin-top:6px;cursor:pointer;font:12px sans-serif;padding:4px 8px;background:#2a2a2a;color:#fff;border:1px solid #555;border-radius:4px">${isHost ? 'stop hosting' : 'leave lobby'}</button>` +
```

and the click handler, right after the `copyBtn` handler block (after line 434):

```ts
  // Leave the lobby → the normal single-player game: navigate to the base URL (the whole query is
  // dropped, so the URL-driven boot gate re-runs the single-player boot; the lobby session runs on
  // the same `persist`, so lobby edits are kept). The host's click drops every connected player
  // (they see the static "host left" screen) — confirm; a joiner's leave only affects them.
  // Page unload tears down the transport (WebRTC + Nostr) — no explicit dispose.
  const leaveBtn = document.getElementById('lobby-leave')!;
  leaveBtn.addEventListener('click', () => {
    if (isHost && !confirm('Leave? Connected players will be dropped.')) return;
    location.href = location.pathname;
  });
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx playwright test tests/e2e/mp-lobby.spec.ts`
Expected: PASS — all 5 tests (the 2 pre-existing + the 3 new).

- [ ] **Step 5: Typecheck + full regression**

Run: `npx tsc --noEmit && npm test 2>&1 | grep -E "Test Files|Tests "`
Expected: typecheck OK; 41 files / 334 tests pass.

Run: `npx playwright test tests/e2e/mp-lobby.spec.ts tests/e2e/mp-2tab.spec.ts tests/e2e/mp-menu.spec.ts tests/e2e/mp-client.spec.ts`
Expected: all pass (10 tests: 5 lobby, 1 two-tab gate, 3 menu, 1 client pin).

- [ ] **Step 6: Commit**

```bash
git add src/main.ts tests/e2e/mp-lobby.spec.ts
git commit -m "feat(main): leave-lobby button (stop hosting / leave lobby) → base URL"
```

---

## Self-review notes (run against the spec)

- Spec §mechanism (navigate to `location.pathname`, no explicit dispose) → Task 1 Step 3 handler. ✓
- Spec §button (under `#lobby-copy`, copy-button style, role-aware label **stop hosting** / **leave lobby**) → Task 1 Step 3 template line (same style string + `display:block;width:100%;margin-top:6px` so it sits directly under the copy button). ✓
- Spec §behavior (host confirms — always, even with zero peers; joiner instant) → handler `isHost && !confirm(…)`. ✓
- Spec §joiner-whose-host-leaves (unchanged "host left" overlay) → not touched. ✓
- Spec §tests (3 e2e in `mp-lobby.spec.ts`: host confirmed, host cancelled, joiner no-dialog; assertions: URL query empty, `__lobby` gone, `#lobby` gone, canvas visible for the single-player boot) → Task 1 Step 1. ✓
- Spec §non-goals (no in-place teardown, no keyboard shortcut, no kick, no styled dialogs, no transport destroy) → none present in the plan. ✓
- Types: `confirm`/`location` are DOM globals (no new imports); `#lobby-leave` id is consistent between the template and the tests. No unit-level type surface changes.