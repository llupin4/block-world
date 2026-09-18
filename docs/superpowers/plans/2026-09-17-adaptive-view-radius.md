# Adaptive View Radius (single-player) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the single-player view radius adapt continuously from measured main-thread frame time — growing toward radius 4 on machines with headroom and falling back to 2 under load — while keeping every frame inside the 16.7 ms budget.

**Architecture:** A pure frame-time governor (`src/view-radius.ts`) is fed each frame's main-thread work + a "ring is fully loaded" flag; it returns the radius (2/3/4) using an EMA + recent-max signal, a `ringFull` anti-oscillation gate, and a 1 s cooldown. `streaming.ts` gains a mutable `activeRadius` (default `VIEW_RADIUS`) that the single-player stream reads; `main.ts` drives the governor from the frame loop and exposes the radius on `window` for the e2e smoke. Multiplayer is untouched (it keeps the `VIEW_RADIUS` const).

**Tech Stack:** TypeScript, Vite, Vitest (unit), Playwright (e2e). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-17-adaptive-view-radius-design.md`

---

## File Structure

- **Create** `src/view-radius.ts` — the pure governor: `ViewRadiusGovernor` class, `targetChunks()`, and the tuning constants. No three/DOM.
- **Create** `src/__tests__/view-radius.test.ts` — deterministic unit tests for the governor.
- **Modify** `src/streaming.ts` — add `activeRadius` + `setActiveRadius()`; make `inRange()` and the single-anchor `update()` overload read `activeRadius` instead of the `VIEW_RADIUS` const.
- **Modify** `src/__tests__/streaming.test.ts` — a test that `setActiveRadius` resizes the single-player ring.
- **Modify** `src/main.ts` — frame-loop hook: capture `frameT0`, feed the governor at frame-end (single-player only), expose `window.__viewRadius`.
- **Create** `tests/e2e/view-radius.spec.ts` — e2e smoke: radius starts at 2, grows to ≥3, never exceeds 4.

Commands used below:
- Unit tests: `npx vitest run <file>` (single file) or `npm test` (all).
- Typecheck: `npx tsc --noEmit`.
- E2E: `npx playwright test <file>`.

---

### Task 1: The governor module (pure, TDD)

**Files:**
- Create: `src/view-radius.ts`
- Test: `src/__tests__/view-radius.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/view-radius.test.ts`:

```ts
import { it, expect } from 'vitest';
import { ViewRadiusGovernor, targetChunks, MIN_RADIUS, MAX_RADIUS } from '../view-radius';

/** Feed `n` frames of `workMs` (all `ringFull`) and return the final radius. */
function feed(g: ViewRadiusGovernor, n: number, workMs: number, ringFull = true): number {
  let r = g.radius;
  for (let i = 0; i < n; i++) r = g.noteFrame(workMs, ringFull);
  return r;
}

it('starts at the minimum radius', () => {
  expect(new ViewRadiusGovernor().radius).toBe(2);
});

it('targetChunks is (2r+1)^2 x 5', () => {
  expect(targetChunks(2)).toBe(125);
  expect(targetChunks(3)).toBe(245);
  expect(targetChunks(4)).toBe(405);
});

it('grows 2 -> 3 -> 4 under sustained headroom', () => {
  const g = new ViewRadiusGovernor();
  expect(feed(g, 200, 5)).toBe(4); // light frames, ring full -> settle at the max
});

it('clamps at the maximum radius', () => {
  const g = new ViewRadiusGovernor();
  expect(feed(g, 1000, 1)).toBe(MAX_RADIUS); // never above 4
});

it('shrinks 4 -> 3 -> 2 under sustained load', () => {
  const g = new ViewRadiusGovernor();
  feed(g, 200, 5); // to 4
  expect(feed(g, 200, 20)).toBe(2); // heavy frames, ring full -> fall back to the min
});

it('clamps at the minimum radius', () => {
  const g = new ViewRadiusGovernor();
  feed(g, 200, 5); // to 4
  feed(g, 200, 20); // to 2
  expect(feed(g, 200, 20)).toBe(MIN_RADIUS); // never below 2
});

it('holds while the ring is not full (the anti-oscillation gate)', () => {
  const g = new ViewRadiusGovernor();
  expect(feed(g, 200, 5, false)).toBe(2); // light but ring not full -> no growth
});

it('the cooldown paces changes: no second change within 60 frames', () => {
  const g = new ViewRadiusGovernor();
  g.noteFrame(5, true); // -> 3, cooldown 60
  expect(g.radius).toBe(3);
  expect(feed(g, 60, 5)).toBe(3); // 60 more frames: cooldown expires, still 3
  expect(g.noteFrame(5, true)).toBe(4); // next frame: cooldown cleared, grows again
});

it('moves at most one step per frame', () => {
  const g = new ViewRadiusGovernor();
  expect(g.noteFrame(1, true)).toBe(3); // a single light frame: 2 -> 3, not 2 -> 4
});

it('a heavy frame during the cooldown does not reverse the change', () => {
  const g = new ViewRadiusGovernor();
  g.noteFrame(5, true); // -> 3, cooldown 60
  expect(g.noteFrame(50, true)).toBe(3); // a spike while cooling: absorbed, stays 3
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/view-radius.test.ts`
Expected: FAIL — `Cannot find module '../view-radius'` (the module does not exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `src/view-radius.ts`:

```ts
// Adaptive single-player view radius (spec 2026-09-17-adaptive-view-radius-design.md). A pure
// frame-time governor: feed it each frame's main-thread work + whether the current-radius ring is
// fully loaded; it returns the view radius (2..4), growing toward 4 with headroom and falling back
// to 2 under load. No three/DOM — node-testable.
export const MIN_RADIUS = 2;
export const MAX_RADIUS = 4;
const ALPHA = 0.1;       // EMA time constant (~10 frames)
const MAX_WINDOW = 30;   // recent-max window (0.5 s)
const GROW_EMA = 12.0;   // grow only when the EMA is under this (ms)
const GROW_MAX = 15.0;   // ... and the recent max is under this (ms)
const SHRINK_EMA = 15.0; // shrink when the EMA is over this (ms)
const SHRINK_MAX = 16.5; // ... or the recent max is over this (ms)
const COOLDOWN = 60;     // frames between changes (1 s)

/** Target loaded-chunk count for a radius: (2r+1)^2 columns x the 5-level y band. 125/245/405. */
export function targetChunks(radius: number): number {
  return (2 * radius + 1) ** 2 * 5;
}

export class ViewRadiusGovernor {
  radius = MIN_RADIUS;
  private ema = 0;
  private hasEma = false;
  private recent: number[] = [];
  private cooldown = 0;

  /** Feed one frame's main-thread work (ms) + whether the current-radius ring is fully loaded.
   *  Returns the (possibly changed) radius. */
  noteFrame(workMs: number, ringFull: boolean): number {
    this.ema = this.hasEma ? this.ema * (1 - ALPHA) + workMs * ALPHA : workMs;
    this.hasEma = true;
    this.recent.push(workMs);
    if (this.recent.length > MAX_WINDOW) this.recent.shift();
    if (!ringFull) return this.radius; // the ring is filling: frame time is transient, don't react
    if (this.cooldown > 0) { this.cooldown--; return this.radius; }
    const maxRecent = Math.max(...this.recent);
    if (this.radius < MAX_RADIUS && this.ema < GROW_EMA && maxRecent < GROW_MAX) {
      this.radius++; this.cooldown = COOLDOWN;
    } else if (this.radius > MIN_RADIUS && (this.ema > SHRINK_EMA || maxRecent > SHRINK_MAX)) {
      this.radius--; this.cooldown = COOLDOWN;
    }
    return this.radius;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/view-radius.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/view-radius.ts src/__tests__/view-radius.test.ts
git commit -m "feat(view-radius): pure frame-time governor (2/3/4, ringFull gate + cooldown)"
```

---

### Task 2: `streaming.ts` active radius (TDD)

**Files:**
- Modify: `src/streaming.ts`
- Test: `src/__tests__/streaming.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/__tests__/streaming.test.ts`, change the import on line 5 from
`import { update } from '../streaming';` to:

```ts
import { update, setActiveRadius, inRange } from '../streaming';
```

Then add this test inside the existing `describe('streaming', () => { ... })` block (after test C, before the closing `});` of the describe):

```ts
  it('D: setActiveRadius resizes the single-player ring (adaptive radius)', () => {
    try {
      setActiveRadius(4);
      const world = new World();
      let calls = 0;
      for (;;) {
        const r = update(world, 2, 2, 2);
        for (const c of r.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;
        if (r.rebuilt.length === 0 && r.unloaded.length === 0) break;
        if (++calls > 2000) throw new Error('did not converge at radius 4');
      }
      expect(world.count()).toBe(405); // 9 x 9 columns x 5 levels
      expect(inRange(6, 2, 2, 2)).toBe(true);  // |6-2| = 4 <= 4
      expect(inRange(7, 2, 2, 2)).toBe(false); // |7-2| = 5 > 4
    } finally {
      setActiveRadius(2); // restore the default (module state) for the other tests
    }
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/streaming.test.ts`
Expected: FAIL — `setActiveRadius is not a function` (not exported yet).

- [ ] **Step 3: Write the minimal implementation**

In `src/streaming.ts`, immediately after the `export const VIEW_RADIUS = 2;` line (line 17), add:

```ts
// The single-player's live view radius: the adaptive governor (main.ts) writes it each frame.
// Multiplayer keeps the VIEW_RADIUS const. Defaults to VIEW_RADIUS so a fresh world streams at 2.
let activeRadius = VIEW_RADIUS;
export function setActiveRadius(r: number): void { activeRadius = r; }
```

Change `inRange` (lines 60-62) to read `activeRadius`:

```ts
export function inRange(cx: number, cz: number, pcx: number, pcz: number): boolean {
  return Math.abs(cx - pcx) <= activeRadius && Math.abs(cz - pcz) <= activeRadius;
}
```

Change the single-anchor `update` overload's body (line 182) to read `activeRadius`:

```ts
  return _update(world, [{ cx: a, cz: b as number, cy: typeof c === 'number' ? c : 2, radius: activeRadius, meshable: true }], d, e);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/streaming.test.ts`
Expected: PASS (all streaming tests, including the new D).

- [ ] **Step 5: Commit**

```bash
git add src/streaming.ts src/__tests__/streaming.test.ts
git commit -m "feat(streaming): mutable activeRadius for the single-player adaptive ring"
```

---

### Task 3: `main.ts` frame-loop hook

**Files:**
- Modify: `src/main.ts`

This is frame-loop wiring (needs the browser to exercise), so it is verified by the typecheck
(Step 2) and the e2e smoke (Task 4) rather than a unit test.

- [ ] **Step 1: Add the import, governor, `frameT0`, and the frame-end hook**

In `src/main.ts`:

(a) After `import * as streaming from './streaming';` (line 5), add:

```ts
import { ViewRadiusGovernor, targetChunks } from './view-radius';
```

(b) Immediately before `let last = performance.now();` (line 1557), add:

```ts
const governor = new ViewRadiusGovernor(); // adaptive single-player view radius (spec 2026-09-17)
```

(c) At the top of `frame()`, immediately after `function frame(now: number): void {` (line 1560) and before the `profT0` line, add:

```ts
  const frameT0 = performance.now(); // the view-radius governor's load signal (whole-frame main-thread work)
```

(d) Immediately before `requestAnimationFrame(frame);` (line 1753), add:

```ts
  if (!mpSession) { // single-player only: multiplayer keeps the fixed VIEW_RADIUS
    const workMs = performance.now() - frameT0;
    const ringFull = world.count() >= targetChunks(governor.radius);
    streaming.setActiveRadius(governor.noteFrame(workMs, ringFull));
    (window as unknown as Record<string, unknown>).__viewRadius = governor.radius; // e2e smoke readout
  }
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat(main): drive the adaptive view radius from the frame loop (single-player)"
```

---

### Task 4: E2E smoke

**Files:**
- Create: `tests/e2e/view-radius.spec.ts`

- [ ] **Step 1: Write the e2e test**

Create `tests/e2e/view-radius.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run the e2e test**

Run: `npx playwright test tests/e2e/view-radius.spec.ts`
Expected: PASS (1 test). The dev server on port 4173 is started by `playwright.config.mjs`'s `webServer`.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/view-radius.spec.ts
git commit -m "test(e2e): adaptive view radius smoke (starts 2, grows >=3, never >4)"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`
Expected: PASS — all unit tests, including the new `view-radius.test.ts` and the updated `streaming.test.ts`.

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the full e2e suite**

Run: `npm run e2e`
Expected: PASS — all e2e specs, including the new `view-radius.spec.ts` and the existing `remesh-prof.spec.ts` (confirms the frame-loop change didn't regress the prof rig).

- [ ] **Step 4: Commit any fixes**

If any step required a fix, commit it:

```bash
git add -A
git commit -m "fix: adaptive view radius verification fixes"
```

(If no fixes were needed, no commit is required.)

---

## Self-Review

**Spec coverage:**
- Pure governor module + `targetChunks` → Task 1.
- Grow/shrink graduated 2/3/4, EMA + recent-max, `ringFull` gate, cooldown, clamps, one-step, spike absorption → Task 1 (all 10 unit tests).
- `streaming.ts` mutable `activeRadius` + `setActiveRadius`; `inRange` + single-anchor `update` read it; MP keeps `VIEW_RADIUS` → Task 2.
- `main.ts` frame-loop hook (single-player only), `frameT0`, `window.__viewRadius` → Task 3.
- E2E smoke (starts 2, grows ≥3, never >4) → Task 4.
- Unit + e2e acceptance bar → Tasks 1, 4, 5.

**Placeholder scan:** none — every code step shows the exact code; every command shows the expected output.

**Type consistency:** `ViewRadiusGovernor.radius`, `.noteFrame(workMs, ringFull)`, `targetChunks(radius)`, `MIN_RADIUS`, `MAX_RADIUS` (Task 1) match their use in Task 3. `setActiveRadius(r)`, `inRange(cx, cz, pcx, pcz)`, `activeRadius` (Task 2) match their use in Task 3 (`streaming.setActiveRadius(...)`) and the streaming test. `window.__viewRadius` (Task 3) matches the e2e read (Task 4).
