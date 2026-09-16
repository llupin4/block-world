// Regression (boot crash): a persisted meta whose viewedEntityId does not match any restored
// entity (an older save persisted only loaded entities, so the viewed entity's chunk may have been
// absent) used to crash boot at main.ts:694 (`const v = sim.viewed()!` → "can't access property
// 'pos', v is undefined"). This seeds such a meta (a lone deer, viewedEntityId=99, no spectator),
// reloads, and asserts the page boots (no "Boot failed" overlay) — the fix: Sim.ensureViewed()
// falls back to a live entity before the ghost-spawn reads the viewed pose.
import { test, expect } from '@playwright/test';

const URL = 'http://localhost:4173/';

test('boots from a meta whose viewedEntityId is not a restored entity (no crash)', async ({ page }) => {
  // 1. Load fresh (no meta → fresh world) and wait for the persistence debug surface.
  await page.goto(URL);
  await page.waitForFunction(() => (window as { __persistDebug?: unknown }).__persistDebug, undefined, { timeout: 30_000 });

  // 2. Seed a bad meta: the ONLY entity is a deer (id 5), but viewedEntityId=99 (not restored) and
  //    there is no spectator. Before the fix this crashed boot at the ghost-spawn (viewed() undefined).
  await page.evaluate(() => {
    const p = (window as { __persistDebug: { saveMeta(m: unknown): void; flush(): Promise<void> } }).__persistDebug;
    p.saveMeta({
      v: 2, seed: 1234,
      entities: [{ id: 5, kindId: 'deer', x: 6, y: 33, z: 46, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, fly: false, noclip: false, controllerKind: 'idle' }],
      viewedEntityId: 99,
      time: { time: 0, tick: 0, phaseTotal: 0 },
      hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 0 },
    });
    return p.flush(); // ensure the meta is written before the reload
  });

  // 3. Reload → boot reads the bad meta → the `if (meta)` branch.
  await page.reload();

  // 4. The crash (if any) happens synchronously in startGame right after persist.boot() resolves.
  //    Give the boot a moment to run, then assert the fatal overlay is absent.
  await page.waitForTimeout(2000);
  const fatal = await page.locator('h2', { hasText: 'Boot failed' }).count();
  expect(fatal, 'boot crashed on the bad meta (a "Boot failed" overlay is present)').toBe(0);
});
