// Multiplayer (B1) host-mode e2e (design: docs/superpowers/specs/2026-09-07-multiplayer-b1-deterministic-core-design.md).
// Runs ?mp=host headless against the dev server (playwright.config.mjs webServer, port 4173),
// waits for the page's __mpResult report, ALWAYS prints it (pass or fail), records the artifact,
// and asserts: the bot clients' remote players are rendered (rigs + name tags) and the host's
// edits are reflected in its authoritative world. The host renders its own sim; the bot clients
// (ScriptController-driven) send intents that the host applies, so their remote players appear + move.
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL = 'http://localhost:4173/?mp=host';

test('host renders remote players (rigs + name tags) + edits are reflected', async ({ page }) => {
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
    remotePlayers: { id: number; x: number; y: number; z: number; name: string | null; moved: boolean }[];
    editReflected: boolean;
  };
  console.log('MP-RESULT ' + JSON.stringify(r, null, 2));
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/mp-host.json', JSON.stringify(r, null, 2));
  expect(r, 'host did not emit a report — see the browser console output above').toBeTruthy();
  expect(r.mode).toBe('host');
  expect(r.tick, 'host clock advanced (5 s ≈ 300 ticks)').toBeGreaterThanOrEqual(300);
  expect(r.rigCount, 'host renders the remote players (rigs)').toBeGreaterThanOrEqual(r.bots);
  expect(r.remotePlayers.length, 'each remote player is present in the host sim').toBe(r.bots);
  for (const p of r.remotePlayers) {
    expect(p.name, `remote player ${p.id} has a name tag`).toBeTruthy();
    // The bots walk a script; the host applies their intents, so each remote player moves off its
    // first-observed (spawn) position. Catches the "host never ticks the bots' intents" regression.
    expect(p.moved, `remote player ${p.id} moved off its first-observed position (host applied its intents)`).toBe(true);
  }
  expect(r.editReflected, 'host edits are reflected in its authoritative world').toBe(true);
}, 150_000);