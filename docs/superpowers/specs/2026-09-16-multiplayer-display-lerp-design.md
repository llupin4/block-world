# Spec: multiplayer — display-lerp smoothing of a large reconciliation snap

Status: design (2026-09-16). Follow-up to ADR 0020 (prediction & reconciliation), which shipped
the immediate-snap POC and pinned the smoothing parameters (`NET_SNAP_EPS`, `SNAP_SMOOTH_FRAMES`)
in `messages.ts` without wiring them. Tiny, bounded change: a display pose on the client + a
camera read. No protocol change, no host-side change, no session-model change.

## Goal

When a reconciliation snap moves the client's own body by more than `NET_SNAP_EPS` (5 cm), the
camera's own-body position eases out over `SNAP_SMOOTH_FRAMES` (4) frames on a **display pose**
separate from the sim pose, instead of jumping instantly. A snap at or below `NET_SNAP_EPS` stays
instant. The **sim pose is untouched** — the Phase C gate keeps asserting the sim pose, and the
display pose is a pure render-side follower.

## Context (established)

- Phase C (ADR 0020): the client predicts its own body locally (`stepEntity` each substep) and
  reconciles against the host's `state`. `reconcile()` (client.ts:142) already captures `pre`
  (the pre-snap predicted pose) and computes `lastSnap` (the correction magnitude,
  `Math.hypot(post − pre)`). The POC applies the correction as an **immediate snap** of the sim
  pose + re-apply of the buffered intents.
- The render path: `syncPoses()` (client.ts:215, called once per frame at main.ts:1676)
  interpolates the **remote** entities from their pose rings and **skips the own body** (predicted
  + reconciled, never interpolated). `syncCamera()` (main.ts:892) then sets `camera.position`
  directly from `sim.viewed().pos` — the own body's **sim** pose — and, for a `ClientSession`,
  sets the look from `human.getLook()` (client-owned, immediate).
- Because the camera reads the sim pose, a large reconciliation snap is a visible instant jump of
  the camera. The ADR 0020 *Consequences* name this the deferred "display lerp" follow-up.
- The two smoothing constants are already pinned and exported from `messages.ts`:
  `NET_SNAP_EPS = 0.05` and `SNAP_SMOOTH_FRAMES = 4`.

## Design

### Display pose on the `ClientSession`

The display pose lives on the session (not the `Entity` model — the entity is the sim's, and the
display pose is a render-side concern the host/single-player path never touches). Add to
`ClientSession`:

- `displayPos: Vec3` — the own-body position the camera reads. Public (read by `syncCamera`).
- lerp state (private): `lerpFrom: Vec3`, `lerpTo: Vec3`, `lerpT: number` (frames of lerp
  consumed; `SNAP_SMOOTH_FRAMES` when done).

`displayPos` self-corrects: it is written every frame by `syncPoses` (below), so its initial
value is irrelevant — the first frame sets it to the sim pose.

### Reconcile: decide snap vs. lerp (client.ts `reconcile`)

`pre` and `lastSnap` are already computed. After the snap + re-apply (the sim pose is now `post`):

- If `lastSnap > NET_SNAP_EPS`: **start the lerp** — `lerpFrom = pre`, `lerpTo = post`,
  `lerpT = 0`. The display pose will ease from `pre` to `post` over the next
  `SNAP_SMOOTH_FRAMES` frames.
- Else: **instant** — `displayPos = post` (and leave the lerp inactive).

The sim pose is set exactly as today (the snap + re-apply); only the display pose branches.

### Per-frame advance (client.ts `syncPoses`)

`syncPoses` runs once per frame. For the own body (in addition to the existing remote
interpolation):

- If the lerp is active (`lerpT < SNAP_SMOOTH_FRAMES`): `lerpT++`;
  `displayPos = lerp(lerpFrom, lerpTo, lerpT / SNAP_SMOOTH_FRAMES)`.
- Else: `displayPos = current sim pose` (track the sim pose exactly — **no steady-state lag**).

At `lerpT = SNAP_SMOOTH_FRAMES` the display pose equals `lerpTo` exactly; the following frame sets
`displayPos = sim pose`, closing the few-cm residual from prediction continuing during the 4
frames. That residual is imperceptible and is closed within one frame.

### Camera read (main.ts `syncCamera`)

In `syncCamera`, when `mpSession instanceof ClientSession`, read the own-body **position** from
`mpSession.displayPos` instead of `ve.pos`. The look is unchanged (client-owned, immediate, from
`human.getLook()`). The host and single-player branches are untouched (they read `ve.pos`).

### Rejected alternatives

- *Smooth on the `Entity` (add a `displayPos` to the `Entity` model).* Rejected: the entity is the
  sim's; a render-side follower on the sim model would leak a client-only concept into the shared
  `Entity` and the host/single-player path. The session is the right owner.
- *Exponential chase (`displayPos += (sim − displayPos) * k` each frame).* Rejected for the POC:
  it never exactly converges and adds a per-frame coupling; the fixed-endpoint lerp over a known
  frame count is simpler, deterministic, and matches the pinned `SNAP_SMOOTH_FRAMES` literally.
- *Smooth the look too.* Rejected: the own body's look is client-owned and applied immediately
  (the camera's yaw/pitch come from the human controller); smoothing it would make aiming feel
  laggy. Only the position (the thing the snap moves) is smoothed.

## Tests (unit, appended to `src/__tests__/net-client.test.ts`)

The harness drives `ClientSession` directly (a `LoopbackHub`/fake transport, as the existing
net-client tests do). Three cases:

1. **Large snap lerps out:** drive the own body to a predicted pose, then deliver a `state` whose
   own-entity pose is far away (≫ `NET_SNAP_EPS`). Assert: the **sim pose** is correct immediately
   (the Phase C gate — unchanged); the **display pose** is *not* at the sim pose on the frame after
   the snap; over exactly `SNAP_SMOOTH_FRAMES` `syncPoses` calls it converges to the sim pose; and
   on the frame after, `displayPos` equals the sim pose.
2. **Small snap is instant:** deliver a `state` whose own-entity pose differs from the predicted
   pose by ≤ `NET_SNAP_EPS`. Assert: the display pose jumps to the sim pose on the same frame (no
   lerp).
3. **No steady-state lag:** with no snap pending, repeated `syncPoses` calls keep `displayPos`
   exactly equal to the sim pose (the follower tracks, it does not trail).

`npm test` + `npm run build` (typecheck) green; the existing net-client / net-predict / mp e2e
suites stay green (no protocol or sim-pose change).

## Non-goals

- No look smoothing (the own body's look stays client-owned and immediate).
- No break-predict (the optional visual block-break prediction — a separate follow-up).
- No host-side, protocol, or wire change (no new `Msg` fields; `state` is unchanged).
- No change to the remote-entity interpolation path (B1's pose-ring interpolation is untouched).
- No tuning of `NET_SNAP_EPS` / `SNAP_SMOOTH_FRAMES` (the pinned values are used as-is).
