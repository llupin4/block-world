# 0020. Own-body prediction & reconciliation — the client simulates its own entity locally and reconciles against the host's `state`, so the local player no longer lags the round trip

- **Status:** Accepted
- **Last updated:** 2026-09-07
- **Sources:** `docs/superpowers/specs/2026-09-07-multiplayer-prediction-reconciliation-design.md`
  (the design of record), `docs/superpowers/plans/2026-09-07-multiplayer-c-prediction-reconciliation.md`
  (implemented)
- **Extends:** ADR 0019 (B1's own body was the interpolation *exception* — host-confirmed position,
  immediate look; this ADR replaces that exception with local prediction + reconciliation),
  ADR 0018 (the session model + the host's authoritative `state`), and ADR 0015 (`stepEntity` is the
  per-substep, deterministic pose update the prediction reuses).

## Context

ADR 0019 shipped the deterministic core + the real transport, with the client's **own body** as the
one host-confirmed entity: its *position* is interpolated from its own pose ring (a `NET_INTERP_TICKS`
stride behind the host tick) and its *look* is applied immediately. That is correct but the local
player feels the round trip — you press W and the body starts moving ~100 ms later, and any host
correction (a block placed in your path) is only visible once the next `state` round-trips. This is
the documented pre-C behavior (ADR 0019, *Alternatives*).

The load-bearing question is *how much of the sim the client owns*. The host remains the only
authoritative sim (ADR 0018); the client's sim is an entity *container* (its `tick` is never called).
The seam is `stepEntity` (ADR 0015): a pure-ish per-substep pose update — same world + intent + `dt`
→ same pose. Because the client holds the same terrain (shared seed + host-fed `cells`) and its own
intents, it can run `stepEntity` on **its own entity** locally and get a pose that — on an in-sync
world — matches the host's authoritative pose to float noise. That is prediction. Reconciliation
(corrects the drift) rides on the `state` the host already broadcasts per peer.

## Decision

**The client predicts its own body locally, each substep, and reconciles against the host's
`state`.** The change is confined to `ClientSession`; the host, the protocol, and the remote-entity
path (B1's pose-ring interpolation) are untouched.

- **Prediction** (`ClientSession.tick`): the client computes its own intent (its `Controller`),
  buffers it per tick in a capped ring (`PREDICT_BUFFER 120` ~ 2 s at 60 Hz), sends it on change
  (as before), and — once joined (the welcome loaded the spawn ring, so the local world has the
  terrain) — runs `stepEntity(world, own, intent, STEP)` to advance the own entity's pose **locally**.
  Movement only: `applyIntent` (edits/actions) stays host-applied. The streaming anchor follows the
  predicted pose, not the last host state.
- **Reconciliation** (the `state` handler, own entity only): the client **snaps the full authoritative
  state** — pose, look, **velocity**, and the `inWater`/`onGround` flags (all already carried by
  `NetEntity` as `vx/vy/vz` + `flags`) — then **re-applies the buffered intents** for
  `(state.tick + 1 .. clientTick)` via `stepEntity` to fast-forward to the client's current tick. The
  client's current tick is the last `tick(t)` argument (stored as `tick_`; the frame loop owns it, not
  `worldTime.tick`, which is stale in the node harness). The correction magnitude is recorded
  (`lastSnap`) for metrics.
- **Render:** `syncPoses` skips the own entity (it is predicted + reconciled, never interpolated);
  remote entities keep B1's ring + `NET_INTERP_TICKS` interpolation. The own body's *look* stays
  client-owned (the camera's yaw/pitch come from the controller, immediately).

**`state.tick` is the reconciliation reference (no new field).** The host's `state` is per-peer and
already carries `tick` (the host's tick at broadcast) — the pose reflects that peer's intents applied
up to and including `tick` (the delta-coded held intent is applied at every host tick). Re-applying
the buffered intents for `(tick + 1 .. clientTick)` is the dead reckoning. This resolves the design's
open question: the reference is the host's global tick (identical for every peer; the per-peer state
targets the right entity), so a separate `lastIntentTick` field is redundant.

**The vel + flags *must* be snapped, not just the pose.** A pose-only snap leaves the client's
divergent velocity/ground to drift the re-apply away from the host (measured: the own body ran away —
~3.4 blocks ahead and lower in a lake where the delayed client-side water made its local physics
diverge). Snapping the host's `vx/vy/vz` + `inWater`/`onGround` starts the re-apply from the host's
exact entity state, so on an in-sync world the re-apply reproduces the host's pose.

**A display lerp is a follow-up (not the gate).** The POC reconciliation is an immediate snap +
re-apply (the sim pose is corrected on the `state`). The parameters for smoothing a large visible
snap (`NET_SNAP_EPS 0.05`, `SNAP_SMOOTH_FRAMES 4`) are pinned in `messages.ts`, but the lerp is not
wired into the render path in this pass (it needs a display pose separate from the sim pose; the gate
asserts the sim pose). The optional visual **break-predict** (predict a block *break*, revert on
host disagreement within `NET_EDIT_TIMEOUT`) is likewise deferred.

## Alternatives

- **Keep B1's host-confirmed own body (interpolated position).** Rejected: it is exactly the lag this
  ADR removes. It stays the correct fallback for remote entities (which the client does not own).
- **Interpolate the own body like a remote entity.** Rejected: the client owns the own body's intents,
  so it can (and should) predict it; interpolation only helps entities whose input the client does not
  own.
- **A separate `lastIntentTick` field on `state`.** Rejected (redundant): the per-peer `state.tick`
  already carries the reference; adding a field would widen the protocol for no information.
- **Predict edits/actions client-side.** Rejected for the base: actions stay host-applied (the host is
  the only authority on the world). The optional visual break-predict is a follow-up, not the gate.
- **Reconcile on the client's `worldTime.tick`.** Rejected: the node harness never advances
  `worldTime.tick` (the frame loop owns it in the browser), so the reconciliation would fast-forward
  to a stale tick; the last `tick(t)` argument is the client's true current tick in both contexts.

## Consequences

- **The local player is immediate.** The own body moves on the client's own substep (no RTT); a host
  correction is applied on the next reconciling `state` (snap + re-apply). Remote players, the host,
  the protocol, and single-player are all unchanged.
- **The `NetEntity` vel + flags are now load-bearing.** They were "render hints" (ADR 0019); the
  reconciliation relies on them to start the re-apply from the host's exact entity state. Dropping
  them from `state` would silently re-introduce the run-away drift.
- **The client's world must approximate the host's for the prediction to match.** On an in-sync world
  (zero link delay) the prediction reproduces the host's pose to `1e-6` (gate test 1). Under a real
  link delay the client's terrain/water lags the host's, so the *prediction* drifts — which is the
  intended behavior (the client simulates with what it has); the *reconciliation* corrects it on each
  `state` (gate test 2: the own body diverges when the host places a block in its path, then comes back
  within a bounded distance). This is the honest model: prediction is only as good as the client's
  world, and reconciliation is what keeps it honest.
- **Gate C** (`src/__tests__/net-predict.test.ts`, a `LoopbackHub` with a per-link `host→client`
  delay): (1) unchanged world, in sync (zero delay) — the predicted own-body pose matches the host's
  authoritative pose within `1e-6`; (2) host disagrees (a wall placed in the path) under a 30-tick
  link delay — the prediction diverges (the body runs through the not-yet-arrived wall) and the
  reconciliation pulls it back within a bounded gap (it does not run away). `npm test` + `npm run build`
  green (the A stress rig stays under budget; only the known `remesh-perf` flake fails), and the B1/B2
  e2e (`mp-{host,client}`, `mp-lobby`, `mp-2tab`) still pass.
- **Follow-ups** (tracked in [`TODO.md`](../TODO.md) → **Multiplayer**): the display-lerp smoothing
  of a large snap (`NET_SNAP_EPS`/`SNAP_SMOOTH_FRAMES` are pinned but unwired), the optional visual
  break-predict, the B2 pre-work (`LocalSession` unification, `Persistence` light-worker refactor), and
  the deferred non-goals (host migration, client mob possession, an unreliable `state` channel,
  per-peer chunk caching, TURN).