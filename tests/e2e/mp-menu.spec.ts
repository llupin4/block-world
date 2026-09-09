// The M multiplayer menu (single-player screen): a name field + Host / Join(code) buttons.
// Host/Join navigate to ?host&name=… / ?join=<code>&name=… (a reload into the boot path).
import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:4173/';
const lobbyOf = (page: Page) =>
  page.evaluate(() => (window as { __lobby?: { code: string; isHost: boolean } }).__lobby ?? null);

test('M menu: host with a typed name (remembered in localStorage)', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30_000);
  await page.goto(BASE);
  await page.keyboard.press('m');
  await expect(page.locator('#mp-menu')).toBeVisible();
  await page.fill('#mp-name', 'MenuHost');
  const nav = page.click('#mp-host'); // navigates to ?host&name=MenuHost
  await nav;
  await page.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  expect(new URL(page.url()).searchParams.get('host')).not.toBeNull();
  expect(new URL(page.url()).searchParams.get('name')).toBe('MenuHost');
  const lobby = await lobbyOf(page);
  expect(lobby?.isHost).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('bw.name'))).toBe('MenuHost');
  await ctx.close();
});

test('M menu: join by code (name remembered; empty code shows a hint, no nav)', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30_000);
  await page.goto(BASE);
  await page.keyboard.press('m');
  await expect(page.locator('#mp-menu')).toBeVisible();

  // empty code: the hint shows, the page does not navigate
  await page.fill('#mp-name', 'MenuJoiner');
  await page.click('#mp-join');
  await expect(page.locator('#mp-error')).toBeVisible();
  expect(page.url()).toBe(BASE);

  // with a code: navigates to ?join=<code>&name=MenuJoiner
  await page.fill('#mp-code', 'abc123');
  const nav = page.click('#mp-join');
  await nav;
  await page.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  expect(new URL(page.url()).searchParams.get('join')).toBe('abc123');
  expect(new URL(page.url()).searchParams.get('name')).toBe('MenuJoiner');
  expect((await lobbyOf(page))?.isHost).toBe(false);
  await ctx.close();
});

test('M menu: typing a name does not fire game controls (M/H/E stay inert while editing)', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30_000);
  await page.goto(BASE);
  await page.keyboard.press('m');
  await expect(page.locator('#mp-menu')).toBeVisible();
  // Real key events targeted at the input: none of them must reach the game's key handler
  // (m = close this very menu, e = palette, h = help; the letters would also land in the
  // movement keys set). page.type (not fill) so real keydown events fire.
  await page.type('#mp-name', 'meh');
  await expect(page.locator('#mp-menu')).toBeVisible();
  await expect(page.locator('#help')).toBeHidden();
  await expect(page.locator('#palette')).toBeHidden();
  await ctx.close();
});