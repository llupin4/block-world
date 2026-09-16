# Multiplayer Display-Lerp Smoothing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ease out a large client-side reconciliation snap over `SNAP_SMOOTH_FRAMES` frames on a display pose (separate from the sim pose), so the camera's own body no longer jumps instantly.

**Architecture:** Add a `displayPos` + lerp state to `ClientSession`. `reconcile` decides snap-vs-lerp (using the already-computed `lastSnap` vs `NET_SNAP_EPS`); `syncPoses` advances the lerp once per frame (or tracks the sim pose exactly when no lerp is pending). `syncCamera` reads `displayPos` for the client's own body only. The sim pose is untouched — the Phase C gate keeps asserting it.

**Tech Stack:** TypeScript, Three.js (camera), Vitest (unit tests). No protocol/host change.

---

## File Structure

- **Modify** `src/net/client.ts` — add `displayPos` + lerp state; wire the snap-vs-lerp decision into `reconcile`; advance the lerp in `syncPoses`.
- **Modify** `src/main.ts` — `syncCamera` reads `mpSession.displayPos` for the client's own body.
- **Modify** `src/__tests__/net-client.test.ts` — three new unit tests (large snap lerps, small snap instant, no steady-state lag).
- **No change** `src/net/messages.ts` — `NET_SNAP_EPS` and `SNAP_SMOOTH_FRAMES` are already pinned and exported.

Constants in play (already in `src/net/messages.ts`): `NET_SNAP_EPS = 0.05`, `SNAP_SMOOTH_FRAMES = 4`.

---

### Task 1: Display pose + lerp on `ClientSession` (TDD)

**Files:**
- Modify: `src/net/client.ts`
- Test: `src/__tests__/net-client.test.ts`

- [ ] **Step 1: Write the failing tests**

Append these three tests inside the existing `describe('ClientSession', () => { ... })` block in `src/__tests__/net-client.test.ts` (after the "possession on a client can return to the own body" test, before the closing `});`).

Also add `SNAP_SMOOTH_FRAMES, NET_SNAP_EPS` to the imports at the top of the file. The import line becomes:

```ts
import { SNAP_SMOOTH_FRAMES, NET_SNAP_EPS } from '../net/messages';
```

(Add it as a new import line; the file currently has no `../net/messages` import.)

The three tests (use the existing `netEnt` and `entityRec` helpers already defined at the top of the file):

```ts
  it('Phase C follow-up: a large reconciliation snap lerps the display pose out over SNAP_SMOOTH_FRAMES frames', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.entityId = 7;
    client.sim.restoreEntity(entityRec(7), NULL_CTRL); // the own body at (0,0,0)
    client.tick(0); // sets the client tick (no buffered intents)
    // A state that snaps the own body far away (x 0 -> 10, >> NET_SNAP_EPS).
    client.onMessage({ type: 'state', tick: 0, entities: [netEnt(7, 10)] });
    // the sim pose is correct immediately (the Phase C gate — unchanged by the display lerp)
    expect(client.sim.entities.get(7)!.pos.x).toBeCloseTo(10);
    // the display pose has NOT jumped (a large snap starts a lerp from the pre-snap position)
    expect(client.displayPos.x).toBeCloseTo(0);
    // over exactly SNAP_SMOOTH_FRAMES frames the display pose converges to the sim pose
    for (let f = 0; f < SNAP_SMOOTH_FRAMES; f++) client.syncPoses();
    expect(client.displayPos.x).toBeCloseTo(10);
    // the frame after, the display pose tracks the sim pose exactly
    client.syncPoses();
    expect(client.displayPos.x).toBeCloseTo(client.sim.entities.get(7)!.pos.x);
  });

  it('Phase C follow-up: a small reconciliation snap (<= NET_SNAP_EPS) is instant', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.entityId = 7;
    client.sim.restoreEntity(entityRec(7), NULL_CTRL);
    client.tick(0);
    // a small snap: x 0 -> 0.03 (<= NET_SNAP_EPS = 0.05)
    expect(0.03).toBeLessThan(NET_SNAP_EPS); // sanity: the test's snap is genuinely "small"
    client.onMessage({ type: 'state', tick: 0, entities: [netEnt(7, 0.03)] });
    expect(client.sim.entities.get(7)!.pos.x).toBeCloseTo(0.03);
    // instant: the display pose jumps to the sim pose on the same message (no lerp)
    expect(client.displayPos.x).toBeCloseTo(0.03);
  });

  it('Phase C follow-up: with no snap pending, the display pose tracks the sim pose exactly (no lag)', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.entityId = 7;
    client.sim.restoreEntity(entityRec(7), NULL_CTRL);
    client.tick(0);
    client.sim.entities.get(7)!.pos.x = 5;
    client.syncPoses();
    expect(client.displayPos.x).toBeCloseTo(5);
    client.sim.entities.get(7)!.pos.x = 9;
    client.syncPoses();
    expect(client.displayPos.x).toBeCloseTo(9);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/__tests__/net-client.test.ts`
Expected: FAIL — `client.displayPos` is `undefined` (the property does not exist yet), so the assertions on `displayPos.x` throw / are `NaN`.

- [ ] **Step 3: Add the display pose + lerp state fields**

In `src/net/client.ts`, update the two import lines:

The `../entity` import (line 2) becomes:
```ts
import { Sim, NULL_INTENT, stepEntity, type Controller, type Intent, type Vec3 } from '../entity';
```

The `./messages` import (line 5) becomes:
```ts
import { type Msg, type CellWrite, PROTOCOL_VERSION, NET_INTERP_TICKS, PREDICT_BUFFER, NET_SNAP_EPS, SNAP_SMOOTH_FRAMES } from './messages';
```

Then add the display-pose fields to the class, immediately after the existing Phase C fields (after the `private lastSnap = 0;` line, ~line 47):
```ts
  // Phase C follow-up: the own body's DISPLAY pose (what the camera reads) — a smoothed follower
  // of the sim pose that eases out a large reconciliation snap over SNAP_SMOOTH_FRAMES frames.
  // `lerpFrom`/`lerpTo` bracket the snap; `lerpT` counts frames consumed (== SNAP_SMOOTH_FRAMES
  // means no lerp pending, so the display pose tracks the sim pose exactly — no steady-state lag).
  displayPos: Vec3 = { x: 0, y: 0, z: 0 };
  private lerpFrom: Vec3 = { x: 0, y: 0, z: 0 };
  private lerpTo: Vec3 = { x: 0, y: 0, z: 0 };
  private lerpT = SNAP_SMOOTH_FRAMES;
```

- [ ] **Step 4: Wire the snap-vs-lerp decision into `reconcile`**

In `reconcile` (client.ts:142), after the existing line `this.lastSnap = Math.hypot(...);` (the last statement of the method), append:
```ts
    // Display-lerp (Phase C follow-up): a large snap eases out on the display pose over
    // SNAP_SMOOTH_FRAMES frames; a small one is instant. The sim pose is set above (the gate).
    if (this.lastSnap > NET_SNAP_EPS) {
      this.lerpFrom = { ...pre };
      this.lerpTo = { x: e.pos.x, y: e.pos.y, z: e.pos.z };
      this.lerpT = 0;
    } else {
      this.displayPos = { x: e.pos.x, y: e.pos.y, z: e.pos.z };
    }
```

- [ ] **Step 5: Advance the lerp in `syncPoses`**

In `syncPoses` (client.ts:215), after the existing `for (const [id, ring] of this.rings) { ... }` loop (the remote-interpolation loop), append the own-body display-pose block:
```ts
    // The own body's display pose (Phase C follow-up): ease out a large reconciliation snap over
    // SNAP_SMOOTH_FRAMES frames; otherwise track the sim pose exactly (no steady-state lag).
    const own = this.sim.entities.get(this.entityId);
    if (own) {
      if (this.lerpT < SNAP_SMOOTH_FRAMES) {
        this.lerpT++;
        const f = this.lerpT / SNAP_SMOOTH_FRAMES;
        this.displayPos = {
          x: this.lerpFrom.x + (this.lerpTo.x - this.lerpFrom.x) * f,
          y: this.lerpFrom.y + (this.lerpTo.y - this.lerpFrom.y) * f,
          z: this.lerpFrom.z + (this.lerpTo.z - this.lerpFrom.z) * f,
        };
      } else {
        this.displayPos = { x: own.pos.x, y: own.pos.y, z: own.pos.z };
      }
    }
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/net-client.test.ts`
Expected: PASS — all tests in the file pass, including the three new ones.

- [ ] **Step 7: Commit**

```bash
git add src/net/client.ts src/__tests__/net-client.test.ts
git commit -m "feat(net): display-lerp smoothing of a large reconciliation snap (client)"
```

---

### Task 2: Camera reads the display pose (`main.ts`)

**Files:**
- Modify: `src/main.ts:892-906` (`syncCamera`)

- [ ] **Step 1: Update `syncCamera` to read the display pose for the client's own body**

Replace the body of `syncCamera` (main.ts:892-906) with:
```ts
function syncCamera(): void {
  const ve = sim.viewed();
  if (!ve) return;
  // The client's own body reads the display pose (a smoothed follower of the sim pose that eases
  // out a large reconciliation snap). A possessed remote entity — or the host/single-player —
  // reads the sim pose directly. The inline `instanceof` narrows `mpSession` (a
  // `HostSession | ClientSession | null`) so `displayPos`/`entityId` typecheck.
  const ownDisplay = mpSession instanceof ClientSession && ve.id === mpSession.entityId
    ? mpSession.displayPos : null;
  const p = ownDisplay ?? ve.pos;
  camera.position.set(p.x, p.y + ve.kind.eye, p.z);
  if (mpSession instanceof ClientSession) {
    const look = human.getLook();
    camera.rotation.set(look.pitch, look.yaw, 0);
  } else {
    camera.rotation.set(ve.pitch, ve.yaw, 0);
  }
}
```

This keeps the host/single-player path reading `ve.pos` (unchanged) and only switches to `displayPos` when the viewed entity is the client's own body (`ve.id === mpSession.entityId`), so a possessed remote entity is unaffected.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the full unit suite**

Run: `npm test`
Expected: PASS — the full Vitest suite is green (the known `remesh-perf` timing flake may occasionally fail; re-run once if so — it is unrelated to this change).

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "feat(main): camera reads the client display pose for the own body"
```

---

## Verification (final)

Run: `npm run build`
Expected: `tsc --noEmit` clean + Vite bundle succeeds.

The three new unit tests pin the behavior: a large snap lerps the display pose out over exactly `SNAP_SMOOTH_FRAMES` frames and converges to the sim pose; a small snap (≤ `NET_SNAP_EPS`) is instant; and with no snap pending the display pose tracks the sim pose exactly (no steady-state lag). The sim pose is asserted correct immediately in the large-snap test (the Phase C gate is preserved).
