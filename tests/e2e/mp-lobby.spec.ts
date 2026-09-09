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