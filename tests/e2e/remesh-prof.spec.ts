// Deterministic profiling rig (spec: docs/superpowers/specs/2026-09-05-prof-rig-design.md).
// Runs ?prof=remesh headless against the dev server (playwright.config.mjs webServer, port 4173),
// waits for the rig's JSON report, ALWAYS prints it (pass or fail), records the artifact, and
// asserts report.pass.
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const RIG_URL = 'http://localhost:4173/?prof=remesh';

test('worst-chunk remesh stays inside the vsync budget; ocean is unchanged', async ({ page }) => {
  const done = page.waitForFunction(
    () => (window as { __profResult?: unknown }).__profResult,
    undefined,
    { timeout: 150_000 },
  );
  await page.goto(RIG_URL);
  const r = (await (await done).jsonValue()) as {
    pass?: boolean;
    failReason?: string;
    worstChunk?: unknown;
  };
  console.log('PROF-RESULT ' + JSON.stringify(r, null, 2));
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/prof-remesh.json', JSON.stringify(r, null, 2));
  expect(r, 'rig did not emit a report — see the browser console output above').toBeTruthy();
  expect(r.pass, `failReason: ${r.failReason} (full report: test-results/prof-remesh.json)`).toBe(true);
}, 180_000);