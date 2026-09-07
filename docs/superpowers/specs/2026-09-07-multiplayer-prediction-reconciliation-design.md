# Spec (DRAFT): multiplayer — phase C: client-side prediction for the own body

**Status: DRAFT (2026-09-07).** This is a design-of-record sketch, **not** a frozen spec and
**not** a plan. It exists so the phase C design is not lost while pre-work + phase A are
implemented. It will be **adjusted/redefined after pre-work + phase A land** (the delayed-link
test rig and the `NET_SNAP_EPS`/reconcile-K values must be chosen against the real
`ClientSession` interpolation), then finalized into a spec + an execution-ready plan. Durable
record after implementation: **ADR 0020 — Prediction & reconciliation.**

## Goal (draft)

Stop the own body from lagging the host. In phase A the client's own entity is host-driven
(the client feels the RTT). Phase C adds **client-side prediction** of the own entity and
**reconciliation** against the host, so the own body responds to local input immediately and
smoothly corrects when the host's word arrives. Remote entities stay host-driven (interpolated).

## Design of record (draft)

### Prediction
- The client runs `stepEntity` on **its own entity** locally each substep, using its own
  intent, against its local world (edits arrive slightly late — acceptable for the own body).
- It keeps a ring buffer of `{ tick, intent, resultingPose }` (the intents sent, with the
  pose each one produced).

### Reconciliation
- Each host `state` carries `lastIntentTick` per remote player (the tick of the intent the
  host last applied for that peer). On receipt, the client:
  1. Snaps its own entity to the host pose at `lastIntentTick`.
  2. Re-applies the buffered intents after `lastIntentTick` (fast-forward the ring buffer).
- Smooth the visual correction over a few frames if the position error exceeds `NET_SNAP_EPS`
  (avoid a visible teleport when the host disagrees).

### Actions
- Actions (break/place/door/torch) stay **host-applied** — no edit prediction in the base.
- **Optional** (only if the base lands cleanly): predict the *break* visually (hide the block
  immediately) and revert if the host disagrees within `NET_EDIT_TIMEOUT` ticks.

## Gate C (draft)
- **Delayed-link loopback tests** (reuse `LoopbackTransport`'s per-link delay): a bot client's
  predicted path matches the host's within `1e-6` when the world doesn't change under it, and
  reconciliation corrects within K ticks when the host disagrees (place a block in the path
  from the host).
- The phase A stress rig stays under budget.
- `npm test` + `npm run build` green.
- ADR 0020.
- **TODO.md** follow-ups (this phase adds them): client possession, edit prediction, host
  migration, TURN, per-peer chunk caching across sessions, an unreliable channel for `state`.

## Open questions (resolve when finalizing)
- The delayed-link test rig: drive it with `LoopbackHub({ delay })` (per-link delay in ticks)
  — confirm the existing hub API suffices or needs a "delay the host→client state link only"
  knob.
- `NET_SNAP_EPS` (snap threshold) and the reconcile K (max correction ticks) — pick by
  measurement in the delayed-link test, then freeze.
- Whether `state` carries `lastIntentTick` for **all** players or just the joiner's own entity.
- How prediction interacts with the `state`-stride interpolation (phase A) — the own entity is
  predicted (not interpolated), remote entities are interpolated.
- Whether the optional visual break-prediction is in scope for the gate (default: only if the
  base lands cleanly).