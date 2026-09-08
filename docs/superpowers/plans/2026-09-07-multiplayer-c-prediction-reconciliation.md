# Plan: multiplayer C — client-side prediction + reconciliation for the own body

**Status: done (2026-09-07).** Pre-work + A + B1 + B2 were done and green (ADR 0018/0019).
This plan lands Phase C — **implemented and green** (ADR 0020). The client **predicts** its own
entity locally (runs `stepEntity` on it each substep with its own intent) and **reconciles** against
the host's word (snap the full authoritative state — pose + vel + `inWater`/`onGround` — to the host
pose at `state.tick`, then re-apply the buffered intents after it). Remote entities
stay host-driven (interpolated, B1). Durable record: **ADR 0020 — Prediction & reconciliation.**

## Resolved open questions

- **`lastIntentTick` source.** The host's `state` is sent *per peer* and already carries `tick`
  (the host's tick at broadcast). That `tick` is the reconciliation reference: the host's pose in
  the state reflects the peer's intents applied up to and including `tick` (the delta-coded held
  intent is applied at every host tick). The client re-applies its buffered intents for
  `(tick+1 .. clientTick)`. **No new field** — `state.tick` is the reference (resolves the
  "all players vs the joiner's own entity" question: it is the host's global tick, the same for
  every peer, and the state is per-peer so it targets the right entity).
- **The delayed-link rig reuses `LoopbackHub({ delay })`.** The per-link `delay(from,to)` suffices:
  delay the `host→client` link only (so the client's `state`/`cells` arrive late while the client's
  prediction stays local + immediate). No new knob needed.
- **`dt` is the fixed sim step.** The client's `tick(t)` is one 60 Hz substep (the frame loop in the
  browser, the harness in node), so prediction/reconciliation use `STEP = 1/60` (matching the host).
  The client's current tick for the fast-forward is the last `t` passed to `tick(t)` (stored as
  `this.tick`) — in node the harness never advances `worldTime.tick`, so the frame-loop-owned tick
  must not be the reference.
- **`NET_SNAP_EPS` + the smoothing.** The core reconciliation is an immediate snap + re-apply
  (the sim pose is corrected on the `state`). A small visual snap is smoothed by lerping the own
  body's *display* pose toward the sim pose over a few frames when the correction exceeds
  `NET_SNAP_EPS` (a rendering nicety; the node gate checks the sim pose, so the gate does not
  depend on it). `NET_SNAP_EPS 0.05` (5 cm) + a 4-frame lerp, pinned.
- **Actions stay host-applied** (no edit prediction in the base). The optional visual break-predict
  is deferred (only if the base lands cleanly — it does not for this gate).

## Tasks

1. **Constants** (`src/net/messages.ts`): `NET_SNAP_EPS = 0.05`, `PREDICT_BUFFER = 120` (~2 s at
   60 Hz), and the reconciliation lerp frames (`SNAP_SMOOTH_FRAMES = 4`).
2. **Client prediction + reconciliation** (`src/net/client.ts`):
   - `private tick = 0` (the current tick, set in `tick(t)`), `private predicted = new Map<number,
     Intent>()` (the buffered intents, capped at `PREDICT_BUFFER`), `private snap = { x:0, y:0, z:0,
     frames: 0 }` (the residual visual correction being lerped out).
   - `tick(t)`: set `this.tick = t`; compute the own intent; record `predicted.set(t, it)` (cap the
     map); send on change (as now); **predict** — if `joined` + the own entity exists, run
     `stepEntity(this.world, e, it, STEP)` locally (movement only — no `applyIntent`, actions are
     host-applied). The streaming anchor uses the own entity's current (predicted) pos.
   - `state` handler: for the **own** entity (`n.id === this.entityId`), **reconcile** (not
     interpolate) — snap the own entity to the host pose (pos/vel/look/flags from the `NetEntity`),
     then re-apply the buffered intents for `(msg.tick+1 .. this.tick)` via `stepEntity`; record the
     snap distance in `this.snap` (for the display lerp). Skip the own entity from the pose ring.
     Remote entities keep the B1 ring + interpolation.
   - `syncPoses`: skip the own entity (it is predicted + reconciled, not interpolated); apply the
     residual `snap` lerp to the own body's *display* offset (decays over `SNAP_SMOOTH_FRAMES`).
3. **Delayed-link loopback test** (`src/__tests__/net-predict.test.ts`), with a `host→client` link
   delay of 6 ticks and a constant-forward client (`HumanController` with `KeyW` held):
   - **Unchanged world:** the client's predicted own-body pose matches the host's authoritative pose
     for that entity within `1e-6` (the prediction is local + immediate; the delayed `state` does
     not perturb it).
   - **Host disagrees:** the host places a block in the client's forward path (the client's world
     lacks it during the delay window, so the prediction diverges). After the delayed `cells` +
     `state` arrive + reconcile, the client's pose corrects to the host's within `K` ticks
     (`K = NET_STATE_STRIDE + delay + slack`); assert the client catches up (within `1e-6`) and the
     divergence is bounded (the client does not run away).
4. **Regression + record:** `npm test` + `npm run build` green (the loopback `net-*` suites incl.
   the new `net-predict` suite; the A stress rig stays under budget); the B1/B2 e2e + the
   single-player pin hold; update ADR 0020 + the TODO Multiplayer section (C done; the deferred
   follow-ups — client possession, edit prediction, host migration, TURN, per-peer chunk caching,
   an unreliable `state` channel — remain).

## Gate C
The delayed-link tests above (predicted path matches the host within `1e-6` on an unchanged world;
reconciliation corrects within K ticks when the host disagrees); the phase A stress rig stays under
budget; `npm test` + `npm run build` green; ADR 0020.