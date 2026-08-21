# TODO — deferred / follow-up

Open items only. Resolved/superseded entries were removed during the 2026-08-20 ADR
restructure; their substance now lives in the relevant ADR under `docs/adr/`.

## Water

- Player-swim interaction beyond the current gravity/speed tweaks (buoyancy bob, underwater
  particles, drag trails).

## Streaming / rendering

- **Adaptive frame budget.** Load/remesh budgets are fixed at 1 chunk per frame (dropped from 2
  after the stutter measurements in PROJECT.md §9 — at 2+2, walking over open ocean walked
  25–138 ms frames). A measured-but-blunt fix: a cheap frame-time governor could raise the
  budget to 2–3 on a fast machine when the last frame was < 8 ms and drop it to 0–1 when a
  heavy water/cave band is streaming in. (ADR 0002 — World model & terrain.)
- One-shot heavy remesh still shows as a 15–28 ms hiccup on the single largest water/cave chunk
  (accepted: zero >25 ms frames now except that tail; see §9 numbers). Slicing a huge remesh
  over 2 frames (half the vertices per frame) would remove the last visible hitch. (ADR 0002.)

## Water sim (model)

- Sideways spread is **isotropic** (a cell flows into all open side neighbours at once). The
  reference engine's bounded directional search ("which way can I fall first" — water seeking out
  a hole in a specific direction) is not modelled: a flow reaching a ledge spills equally to
  every open side. Offered as a follow-up if that ever reads as wrong (see PROJECT.md §9).
  (ADR 0005 — Water simulation.)

## General

- The `TODO` probe methodology that found the water stutters (a moving-camera vitest replay
  logging per-phase ms) was deleted with the fix; if more frame-time work is needed, recreate
  it — a 400-frame walk over open ocean with load/mesh/settle/tick split beats guessing.

## World time & simulation clocks

- **Align the simulation clocks on one tick system.** The day/night project introduced
  `src/time.ts` — a canonical `WorldTime` advanced in the fixed 60 Hz physics substep — which
  the sky/cloud systems read, but the water sim keeps its own independent slow clock
  (`WATER_STEP`/`waterAcc` in `src/main.ts`). Backlog: converge on a single heartbeat that every
  simulation system derives from (water's pulse as one stride on the shared tick; world time,
  cloud wind, and future weather/lighting as siblings). Worth it eventually for determinism and
  for multiplayer, where a shared tick basis is what lets a server own the simulation.
  (ADR 0008 — Sky & day/night.)

## Sky & lighting

Open follow-ups from the dynamic-lighting work (ADR 0007 — Dynamic lighting):

- More light-emitting blocks (glowstone-class) — a one-line registry `light` value.
- Light persistence once a world save system exists.
- Flow-level-dependent water opacity (O by `wlevel`).
- Cloud shadows (attenuation by the cloud layer — requires the layer to become world state).
- Web-worker offload of settle/propagation.
- Per-flow "which way" directional light / colored light.