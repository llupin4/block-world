// Adaptive view radius e2e smoke (spec 2026-09-17-adaptive-view-radius-design.md).
// Loads the default single-player page, reads window.__viewRadius (set every frame by main.ts),
// and asserts the governor is wired: it starts at 2 and stays within [2,4]. Growth toward 4 is
// machine-dependent (a software-WebGL headless machine holds at 2) and is unit-tested
// deterministically in src/__tests__/view-radius.test.ts; here we only assert the wiring + clamp.
import { test, expect } from '@playwright/test';

const URL = 'http://localhost:4173/';

test('view radius is driven by the governor: starts at 2 and stays within [2,4]', async ({ page }) => {
  await page.goto(URL);
  // The governor starts at 2 and cannot grow until the 125-chunk ring is full (~2 s at
  // LOAD_BUDGET=1), so the first observed value is 2.
  const first = await page.waitForFunction(
    () => (window as { __viewRadius?: number }).__viewRadius,
    undefined,
    { timeout: 30_000 },
  );
  expect((await first.jsonValue()) as number).toBe(2);

  // Sample the radius over a window: it must stay within [2,4] (the governor's clamp). On a fast
  // machine it grows toward 4; on a slow/software-WebGL machine it holds at 2.
  const max = await page.evaluate(() => new Promise<number>((resolve) => {
    let m = 0;
    const t0 = performance.now();
    const poll = (): void => {
      m = Math.max(m, (window as { __viewRadius?: number }).__viewRadius ?? 0);
      if (performance.now() - t0 < 10_000) requestAnimationFrame(poll);
      else resolve(m);
    };
    poll();
  }));
  console.log('VIEW-RADIUS max over 10s: ' + max);
  expect(max).toBeGreaterThanOrEqual(2);
  expect(max).toBeLessThanOrEqual(4);
}, 60_000);
