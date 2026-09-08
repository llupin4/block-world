// Multiplayer (B1) client-mode e2e (design: docs/superpowers/specs/2026-09-07-multiplayer-b1-deterministic-core-design.md).
// Runs ?mp=client&bots=2 headless against the dev server (playwright.config.mjs webServer, port 4173),
// waits for the page's __mpResult report, ALWAYS prints it (pass or fail), records the artifact,
// and asserts: the other players' rigs are rendered (interpolated), the client's own-body camera is
// at the interpolated position, the client's meshed chunk count is bounded (≤125, the client's ring),
// the in-page headless host never meshes (0), and the other player's disconnect removes its rig.
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL = 'http://localhost:4173/?mp=client&bots=2';

test('client renders other players + own-body camera + bounded chunks + leave cleanup', async ({ page }) => {
  const done = page.waitForFunction(
    () => (window as { __mpResult?: unknown }).__mpResult,
    undefined,
    { timeout: 120_000 },
  );
  await page.goto(URL);
  const r = (await (await done).jsonValue()) as {
    mode: string;
    tick: number;
    bots: number;
    rigCount: number;
    otherPlayers: { id: number; x: number; y: number; z: number; name: string | null }[];
    camera: { x: number; y: number; z: number } | null;
    clientMeshedChunks: number;
    headlessHostMeshedChunks: number;
    leaveRigRemoved: boolean;
  };
  console.log('MP-RESULT ' + JSON.stringify(r, null, 2));
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/mp-client.json', JSON.stringify(r, null, 2));
  expect(r, 'client did not emit a report — see the browser console output above').toBeTruthy();
  expect(r.mode).toBe('client');
  expect(r.tick, 'client clock advanced (5 s ≈ 300 ticks)').toBeGreaterThanOrEqual(300);
  expect(r.otherPlayers.length, 'the client renders the remaining other player(s) after the leave').toBeGreaterThanOrEqual(1);
  expect(r.otherPlayers.length, 'exactly one of the two other players remains after the tick-250 disconnect').toBe(1);
  for (const p of r.otherPlayers) {
    expect(p.name, `other player ${p.id} has a name tag`).toBeTruthy();
  }
  expect(r.camera, "the client's own-body camera is at the interpolated position").toBeTruthy();
  expect(r.clientMeshedChunks, 'the client meshes only its ring (bounded to ≤125 chunks)').toBeLessThanOrEqual(125);
  expect(r.headlessHostMeshedChunks, 'the in-page headless host never meshes (simulation-only)').toBe(0);
  expect(r.leaveRigRemoved, 'the disconnected other players rig is removed').toBe(true);
}, 150_000);