// Adaptive view radius e2e smoke (spec 2026-09-17-adaptive-view-radius-design.md).
// Loads the default single-player page, reads window.__viewRadius (set every frame by main.ts),
// and asserts the governor starts at 2, grows to >= 3 once the ring is full (on a healthy CI
// machine), and never exceeds 4.
import { test, expect } from '@playwright/test';

const URL = 'http://localhost:4173/';

test('view radius starts at 2, grows to >= 3, and never exceeds 4', async ({ page }) => {
  await page.goto(URL);
  // The governor starts at 2 and cannot grow until the 125-chunk ring is full (~2 s at
  // LOAD_BUDGET=1), so the first observed value is 2.
  const first = await page.waitForFunction(
    () => (window as { __viewRadius?: number }).__viewRadius,
    undefined,
    { timeout: 30_000 },
  );
  expect((await first.jsonValue()) as number).toBe(2);

  // On a healthy machine the governor settles at >= 3 within 15 s once the ring is full.
  // (If a given CI runner is too slow to sustain radius 3, raise this timeout or relax to >=3
  // within 30 s — the wiring is proven by the "starts at 2" + "never exceeds 4" asserts.)
  await page.waitForFunction(
    () => ((window as { __viewRadius?: number }).__viewRadius ?? 0) >= 3,
    undefined,
    { timeout: 15_000 },
  );

  // It never exceeds 4: sample the max over a short window.
  const max = await page.evaluate(() => new Promise<number>((resolve) => {
    let m = 0;
    const t0 = performance.now();
    const poll = (): void => {
      m = Math.max(m, (window as { __viewRadius?: number }).__viewRadius ?? 0);
      if (performance.now() - t0 < 3000) requestAnimationFrame(poll);
      else resolve(m);
    };
    poll();
  }));
  expect(max).toBeLessThanOrEqual(4);
}, 60_000);
