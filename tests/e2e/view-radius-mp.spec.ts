// Adaptive view radius (MP) e2e smoke (spec 2026-09-17-adaptive-view-radius-mp-design.md).
// Two tabs over the real trystero transport (?host / ?join): the host + the client each run their
// own governor (main.ts drives mpSession.noteFrame). Reads window.__viewRadius (set every frame)
// and asserts the governor is wired in MP: it starts at 2 and stays within [2,4]. The deeper
// behaviors (independent radii, union data ring, local cull) are unit-tested in net-host/client.
import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:4173/';

const radiusMax = (page: Page) =>
  page.evaluate(() => new Promise<number>((resolve) => {
    let m = 0;
    const t0 = performance.now();
    const poll = (): void => {
      m = Math.max(m, (window as { __viewRadius?: number }).__viewRadius ?? 0);
      if (performance.now() - t0 < 8_000) requestAnimationFrame(poll);
      else resolve(m);
    };
    poll();
  }));

test('MP: the host + client governors are wired (start at 2, stay within [2,4])', async ({ browser }) => {
  const code = 'bw' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  const hostCtx = await browser.newContext(); const clientCtx = await browser.newContext();
  const host = await hostCtx.newPage(); const client = await clientCtx.newPage();
  const hostReady = host.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  const clientReady = client.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  const hostNav = host.goto(`${BASE}?host=${code}&name=Blue4402`);
  const clientNav = client.goto(`${BASE}?join=${code}&name=Red777`);
  await Promise.all([hostNav, clientNav, hostReady, clientReady]);
  // the handshake: the client sees the host's player
  await client.waitForFunction(() => {
    const l = (window as { __lobby?: { remotePlayers: () => unknown[] } }).__lobby;
    return !!l && l.remotePlayers().length >= 1;
  }, undefined, { timeout: 90_000 });
  const hFirst = await host.evaluate(() => (window as { __viewRadius?: number }).__viewRadius);
  const cFirst = await client.evaluate(() => (window as { __viewRadius?: number }).__viewRadius);
  expect(hFirst).toBe(2); // the host's governor starts at 2
  expect(cFirst).toBe(2); // the client's governor starts at 2
  const hMax = await radiusMax(host);
  const cMax = await radiusMax(client);
  console.log('MP VIEW-RADIUS host max: ' + hMax + ', client max: ' + cMax);
  expect(hMax).toBeGreaterThanOrEqual(2);
  expect(hMax).toBeLessThanOrEqual(4);
  expect(cMax).toBeGreaterThanOrEqual(2);
  expect(cMax).toBeLessThanOrEqual(4);
  await clientCtx.close(); await hostCtx.close();
}, 180_000);
