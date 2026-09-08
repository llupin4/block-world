// Multiplayer (B2) lobby e2e (design: docs/superpowers/specs/2026-09-07-multiplayer-transport-lobby-design.md).
// Single-page, robust: ?host / ?join boot the lobby over a real TrysteroTransport. The lobby overlay
// renders (room code + copy + peer list) as soon as the session boots — a peer is NOT required, so
// this passes with or without relay reachability. The two-tab real-WebRTC gate is mp-2tab.spec.ts.
import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:4173/';

// Pick only the serializable fields (the __lobby object carries function properties).
const lobby = (page: Page) =>
  page.evaluate(() => {
    const l = (window as { __lobby?: { code: string; isHost: boolean; peers: () => string[] } }).__lobby;
    return l ? { code: l.code, isHost: l.isHost, peers: l.peers() } : null;
  });

test('lobby: ?host shows the room code + isHost', async ({ page }) => {
  const code = 'hostA';
  const ready = page.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  await page.goto(`${BASE}?host=${code}`);
  await ready;
  const l = await lobby(page);
  expect(l, 'the host emitted the lobby').toBeTruthy();
  expect(l!.isHost).toBe(true);
  expect(l!.code).toBe(code);
  await expect(page.locator('#lobby-code')).toHaveText(code);
  await expect(page.locator('#lobby-copy')).toBeVisible();
});

test('lobby: ?join shows the room code + !isHost', async ({ page }) => {
  const code = 'joinB';
  const ready = page.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  await page.goto(`${BASE}?join=${code}`);
  await ready;
  const l = await lobby(page);
  expect(l, 'the client emitted the lobby').toBeTruthy();
  expect(l!.isHost).toBe(false);
  expect(l!.code).toBe(code);
  await expect(page.locator('#lobby-code')).toHaveText(code);
});