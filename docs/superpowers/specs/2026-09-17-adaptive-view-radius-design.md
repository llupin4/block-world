# Spec: adaptive view radius (single-player)

Status: design (2026-09-17). Follow-up to the chunk-size / render-distance spike (see
`src/__tests__/spike-chunk-size.test.ts` for the measured cost model). Implements the
"adaptive frame budget" item from `TODO.md`: instead of a fixed `VIEW_RADIUS = 2`, the
single-player ring grows toward radius 4 on machines with headroom and falls back to 2 under
load. Tiny, bounded change: one pure governor module + a mutable radius in `streaming.ts` + a
frame-loop hook in `main.ts`. No meshing change, no protocol change, no multiplayer change.

## Goal

Keep the 60 Hz frame budget (16.7 ms) while showing as much world as the machine can sustain.
On a fast machine the view radius settles at 4 (405 chunks, ~1296-block x/z extent); on a slow
machine it rests at 2 (125 chunks, the current behavior). The radius adapts continuously from
measured main-thread frame time, graduated 2 → 3 → 4, without oscillating.

## Context (established)

- `VIEW_RADIUS = 2` is a const in `src/streaming.ts:17`. The ring is `(2·r+1)²` columns × the
  fixed y band `CY_MIN..CY_MAX` (0..4, 5 levels) → 125 / 245 / 405 chunks for r = 2/3/4.
- The single-player stream is `tickStreaming()` (main.ts:1437) → `streaming.update(world, pcx,
  pcz, pcy, ...)`, whose single-anchor overload bakes in `VIEW_RADIUS` (streaming.ts:182).
- `inRange()` (streaming.ts:60) and `markNeighborsDirty()` (via `inRange`) also read the const.
- The frame loop (main.ts:1560) already measures the whole frame's main-thread work
  (`performance.now() - profT0`, consumed by the prof rig at main.ts:1707). That quantity — not
  the wall-clock `dt` (vsync-capped at ~16.7 ms) — is the correct load signal.
- Per the spike: per-chunk cost is unchanged by radius; radius 4 is 3.24× the chunks, draw calls,
  and initial-fill time of radius 2. The cost is streaming catch-up + draw calls, both addressable
  by simply not committing to radius 4 when the machine can't sustain it.
- Multiplayer (`net/client.ts`, `net/host.ts`) imports the `VIEW_RADIUS` const directly for its
  anchors; `NET_REMOTE_RADIUS = VIEW_RADIUS − 1` (net/messages.ts:13). Out of scope here.

## Design

### Pure governor module — `src/view-radius.ts`

No three/DOM; node-testable (project convention). One class:

```ts
export class ViewRadiusGovernor {
  radius: number;                              // current level, 2..4 (read by main.ts)
  noteFrame(workMs: number, ringFull: boolean): number;  // feed one frame; returns the radius
}
```

- `workMs` = the frame's main-thread work time (ms).
- `ringFull` = is the current-radius ring fully loaded (`world.count() >= targetChunks(radius)`).

Internal state (all private):
- `ema` — exponential moving average of `workMs`, `ALPHA = 0.1` (~10-frame time constant).
- `recent: number[]` — ring buffer of the last `MAX_WINDOW = 30` `workMs` samples (0.5 s).
- `cooldown` — frames remaining before the next change is allowed.

`targetChunks(r) = (2·r+1)² · 5` (exported for the ringFull computation and tests).

### Decision algorithm (`noteFrame`)

1. Always update `ema` and the `recent` window.
2. **If `!ringFull` → hold.** The ring is filling (initial load, or the load burst after a grow),
   so frame time is transient and expected — do not react. This is the anti-oscillation gate: it
   stops the grow → load-burst → shrink → load-burst cycle.
3. **If `cooldown > 0` → decrement, hold.**
4. Else evaluate (one step per call, graduated):
   - **Grow** (`radius < 4`): `ema < GROW_EMA (12.0)` **and** `max(recent) < GROW_MAX (15.0)`
     → `radius++`, `cooldown = COOLDOWN (60)`.
   - **Shrink** (`radius > 2`): `ema > SHRINK_EMA (15.0)` **or** `max(recent) > SHRINK_MAX (16.5)`
     → `radius--`, `cooldown = COOLDOWN (60)`.
   - Else hold.

Constants are exported (tunable): `MIN_RADIUS = 2`, `MAX_RADIUS = 4`, `ALPHA = 0.1`,
`MAX_WINDOW = 30`, `GROW_EMA = 12.0`, `GROW_MAX = 15.0`, `SHRINK_EMA = 15.0`, `SHRINK_MAX = 16.5`,
`COOLDOWN = 60`. The unit tests pin the *behavior* (monotone steps, clamps, the ringFull gate,
cooldown, spike absorption), not the exact threshold values.

Net behavior: spawn at 2; hold while the 125-chunk ring fills; on a fast machine grow to 3 once
that ring is full *and* steady, hold while the extra 120 load, grow to 4; on a slow machine the
EMA/max stay hot and it rests at 2. The `ringFull` gate + 1 s cooldown make it settle rather than
oscillate.

### `streaming.ts` — mutable active radius

- Keep `export const VIEW_RADIUS = 2` (the default + the multiplayer value).
- Add `let activeRadius = VIEW_RADIUS` and `export function setActiveRadius(r: number): void`.
- `inRange()` and the single-anchor `update()` overload use `activeRadius` instead of the const.
  `markNeighborsDirty` follows automatically (it calls `inRange`).
- Multiplayer keeps importing the `VIEW_RADIUS` const — unchanged.

### `main.ts` — frame-loop hook (single-player only)

- Module-level `const governor = new ViewRadiusGovernor()`.
- Top of `frame()`: `const frameT0 = performance.now()` (unconditionally, not just `profMode`).
- End of `frame()` (after all work, before `requestAnimationFrame`), **only when no `mpSession`**
  (so multiplayer never touches `activeRadius`):
  ```ts
  const workMs = performance.now() - frameT0;
  const ringFull = world.count() >= targetChunks(governor.radius);
  streaming.setActiveRadius(governor.noteFrame(workMs, ringFull));
  ```
- `tickStreaming()` is unchanged in shape; it reads `activeRadius` through the `update` call.
- Expose the current radius as `window.__viewRadius` (a live number, updated each frame) for the
  e2e smoke, mirroring how `__profResult` is exposed (main.ts:1710).

The radius used for streaming is always one frame behind the measurement — no within-frame
feedback, no thrash.

## Edge cases

- **World edge / y-band:** x/z is unbounded (procedural) and the y band is fixed 0..4, so the ring
  always fills to `targetChunks`; `ringFull` is well-defined everywhere.
- **Walking:** the ring is a sliding window; `world.count()` hovers at `targetChunks`, so
  `ringFull` stays true and decisions continue normally.
- **Tab switch / hitch:** `dt` is already clamped at 0.1 s (main.ts:1564). A hitch is one high
  `workMs` sample; the 30-frame max window + 1 s cooldown absorb a single spike rather than
  reacting to it.
- **First frames:** `radius` starts at 2 (the min), so it can only grow; the initial load keeps
  `ringFull` false, so there is no premature action.

## Testing

- **Unit — `src/__tests__/view-radius.test.ts`** (deterministic, exact, per project convention).
  Feed synthetic `noteFrame` sequences and assert:
  - starts at 2; grows 2→3→4 only when `ringFull` **and** EMA+max are in the grow band;
  - shrinks 4→3→2 when EMA or max breaches the shrink band;
  - **holds** while `ringFull` is false (the anti-oscillation gate) — the core property;
  - cooldown blocks a second change within 60 frames;
  - clamps at 2 and 4 (never below/above);
  - one step per call (no multi-step jumps);
  - a single spike in an otherwise-light sequence does **not** shrink (max-window + cooldown).
- **E2E smoke — `tests/e2e/view-radius.spec.ts`**: load the page, read `window.__viewRadius`,
  assert it starts at 2 and (on the CI machine) reaches ≥ 3 within 15 s once the ring is full;
  assert it never exceeds 4. (The 15 s bound is generous for slow CI; the governor's own cooldown
  is 1 s, so a healthy machine settles in a few seconds.)

## Out of scope

- Multiplayer radius adaptation (the governor is single-player only; MP keeps `VIEW_RADIUS`).
- Chunk-size change (16³ → 32³) — the separate, harder knob from the spike.
- A measured warmup seed for the starting radius (the governor starts at 2 and grows; a warmup
  probe is a clean later refinement if the "world expands on load" pop-in is undesirable).
