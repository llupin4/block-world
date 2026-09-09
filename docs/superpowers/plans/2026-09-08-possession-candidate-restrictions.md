# Possession Candidate Restrictions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop `P` from offering other players/bots and locally player-owned entities as possession targets, while keeping creature possession.

**Architecture:** Add a pure `possessableCandidates(sim, human)` helper in the entity layer and use it from the `P` key handler in `src/main.ts`. The helper owns the candidate rule; `possessToggle` keeps the exit-first behavior.

**Tech Stack:** TypeScript, Vitest, Vite, existing entity sim in `src/entity.ts`.

**Spec:** `docs/superpowers/specs/2026-09-08-possession-candidate-restrictions-design.md`

---

## File Structure

- Modify: `src/entity.ts`
  - Add `possessableCandidates(sim, human)` next to the existing possession primitives.
- Modify: `src/__tests__/entity.test.ts`
  - Add unit tests for `possessableCandidates`.
- Modify: `src/main.ts`
  - Import `possessableCandidates` and use it in `onPossess()` instead of the local candidate filter.

---

### Task 1: Add `possessableCandidates` helper with tests

**Files:**
- Modify: `src/entity.ts`
- Test: `src/__tests__/entity.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/__tests__/entity.test.ts`, update the entity import to include `possessableCandidates`:

```ts
import { KINDS, NULL_INTENT, stepEntity, lookDir, eyeOf, applyIntent, Sim, SimRng, deriveSimSeed, controllerKindOf, IdleController, HumanController, ScriptController, MobController, mobRefuseStep, possess, returnHome, spectate, possessToggle, possessableCandidates, type Entity, type Intent, type ApplyHooks, type ScriptStep } from '../entity';
```

Inside the existing `describe('entity — possession', ...)` block, add this test after the existing `possessToggle` test:

```ts
it('possessableCandidates excludes other players, human-controlled entities, viewed, and ghost', () => {
  const { sim, human, body, deer, ghost } = simWithBodyAndDeer();
  const bot = sim.spawn({ x: 2, y: 5, z: 0 }, new IdleController(), { kindId: 'player' });
  const otherDeer = sim.spawn({ x: 3, y: 5, z: 0 }, new IdleController(), { kindId: 'deer', baseController: new IdleController() });

  // At the body: the body (viewed), ghost, and another player are excluded; deer are allowed.
  sim.setViewed(body.id);
  let ids = possessableCandidates(sim, human).map((e) => e.id);
  expect(ids).not.toContain(body.id);
  expect(ids).not.toContain(ghost.id);
  expect(ids).not.toContain(bot.id);
  expect(ids).toContain(deer.id);
  expect(ids).toContain(otherDeer.id);

  // A deer currently controlled by the human is excluded even when it is not the viewed entity.
  possess(sim, human, otherDeer.id);
  sim.setViewed(body.id);
  ids = possessableCandidates(sim, human).map((e) => e.id);
  expect(ids).not.toContain(otherDeer.id);

  // From the ghost, the home body is still possessable (player-kind exception).
  possess(sim, human, body.id); // release otherDeer back to its base controller
  spectate(sim, human);
  ids = possessableCandidates(sim, human).map((e) => e.id);
  expect(ids).toContain(body.id);
  expect(ids).not.toContain(ghost.id);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run src/__tests__/entity.test.ts
```

Expected: FAIL with `possessableCandidates is not a function`.

- [ ] **Step 3: Implement the minimal helper**

In `src/entity.ts`, add this function after `possessToggle`:

```ts
/** Entities that the local human may possess with P: not the viewed entity, not the ghost, not
 * another player entity (the home body is the only player exception), and not an entity already
 * driven by this page's human controller. Creature possession (deer, future mobs) remains. */
export function possessableCandidates(sim: Sim, human: Controller): Entity[] {
  return sim.all().filter((e) =>
    e.id !== sim.viewedId &&
    e.id !== sim.ghostId &&
    (e.kind.id !== 'player' || e.id === sim.homeId) &&
    e.controller !== human);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npx vitest run src/__tests__/entity.test.ts
```

Expected: PASS, all entity tests green.

- [ ] **Step 5: Commit**

```bash
git add src/entity.ts src/__tests__/entity.test.ts
git commit -m "feat(entity): add possessableCandidates helper"
```

---

### Task 2: Use `possessableCandidates` in the `P` key handler

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Update the entity import**

In `src/main.ts`, change the entity import to include `possessableCandidates`:

```ts
import { Sim, HumanController, IdleController, MobController, eyeOf, lookDir, breakRayTarget, possessToggle, possessableCandidates, type ApplyHooks, type Controller, type EntityRecord } from './entity';
```

- [ ] **Step 2: Replace the candidate filter in `onPossess()`**

In `src/main.ts`, inside `onPossess()`, replace this block:

```ts
  // Exclude the spectator ghost from being picked: it is a non-colliding spectator (no rig) that can
  // be flown underground while spectating, so if it sits in the ray it would be picked over the
  // creature and the camera would jump to wherever the ghost is. The body<->ghost toggle still works
  // via the else branch (press P when nothing is targeted).
  const candidates = sim.all().filter((x) => x.id !== ve.id && x.id !== sim.ghostId);
```

with:

```ts
  // Possession candidates are owned by the entity layer (spec 2026-09-08): no ghost, no other
  // player entities, and no entity already driven by this page's human controller.
  const candidates = possessableCandidates(sim, human);
```

The rest of `onPossess()` stays the same:

```ts
  const hit = pickEntity(eyeOf(ve), lookDir(ve.yaw, ve.pitch), candidates, REACH);
  // P exits possession first when the human is already out of its home body; otherwise it
  // possesses the targeted entity (or toggles body<->ghost when nothing is targeted).
  possessToggle(sim, human, hit ? candidates[hit.index].id : null);
```

- [ ] **Step 3: Run build and targeted tests**

Run:

```bash
npm run build > /tmp/build.log 2>&1; echo "BUILD_EXIT=$?"
npx vitest run src/__tests__/entity.test.ts src/__tests__/net-client.test.ts src/__tests__/net-host.test.ts
```

Expected:

```text
BUILD_EXIT=0
```

and all targeted Vitest tests pass.

- [ ] **Step 4: Run full test suite and multiplayer e2e**

Run:

```bash
npm test
npx playwright test tests/e2e/mp-2tab.spec.ts
```

Expected: full Vitest suite passes and `mp-2tab` passes. If `remesh-perf` fails only as a timing flake, rerun:

```bash
npx vitest run src/__tests__/remesh-perf.test.ts
```

Expected: PASS on rerun.

- [ ] **Step 5: Commit**

```bash
git add src/main.ts
git commit -m "fix(main): restrict P possession candidates"
```

---

## Verification Checklist

- [ ] `P` cannot target another player/bot entity in multiplayer modes.
- [ ] `P` cannot target an entity whose local controller is the human controller.
- [ ] `P` can still target deer/creatures in single-player.
- [ ] `P` still exits possession first when already out of the home body.
- [ ] `npm run build` passes.
- [ ] `npm test` passes (or only the known timing-flaky `remesh-perf` test fails and passes on rerun).
- [ ] `tests/e2e/mp-2tab.spec.ts` passes.