# TODO — deferred / follow-up

Open items only. Resolved/superseded entries were removed during the 2026-08-20 ADR
restructure; their substance now lives in the relevant ADR under `docs/adr/`.

## Water

- Player-swim interaction beyond the current gravity/speed tweaks (buoyancy bob, underwater
  particles, drag trails).

## Streaming / rendering

- **Offload chunk generation/meshing to workers.** Worldgen (pure seeded noise — no mirror or
  queue, poolable) and the mesh build (~2–5 ms per chunk, the load path in `main.ts`) both run on
  the main thread inside the §9 ≤1 load + ≤1 remesh per frame budget. A worldgen worker makes the
  load path an async two-hop (generate in thread → insert chunk → settle → forward to the light
  worker) and reworks that budget model; a separate project. Reuse the light-worker project's
  worker lifecycle, tick-numbered message protocol, and debug-stats pattern. (ADR 0002 — World
  model & terrain; pattern from the light web-worker offload, ADR 0007's follow-up.)
- **Adaptive frame budget.** Load/remesh budgets are fixed at 1 chunk per frame (dropped from 2
  after the stutter measurements in PROJECT.md §9 — at 2+2, walking over open ocean walked
  25–138 ms frames). A measured-but-blunt fix: a cheap frame-time governor could raise the
  budget to 2–3 on a fast machine when the last frame was < 8 ms and drop it to 0–1 when a
  heavy water/cave band is streaming in. (ADR 0002 — World model & terrain.)

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

## Sky & lighting

Open follow-ups from the dynamic-lighting work (ADR 0007 — Dynamic lighting):

- More light-emitting blocks (glowstone-class) — a one-line registry `light` value.
- Light fields are intentionally NOT persisted (ADR 0014): the worker re-settles every restored chunk.
- Flow-level-dependent water opacity (O by `wlevel`).
- Cloud shadows (attenuation by the cloud layer — requires the layer to become world state).
- Per-flow "which way" directional light / colored light.

## Persistence (ADR 0014)

- **Compress the ChunkRecords.** Six raw 4096-byte `Uint8Array`s (~24 KB/chunk); whole
  columns of identical block ids are highly run-length-compressible — RLE first, brotli if
  RLE leaves it fat.
- **Full async load path.** Fetch-first streaming: the (future) worldgen worker fetches
  the record and the chunk never synchronously touches the main thread — the current
  warm-inline / pending-fetch / confirmed-miss path is the POC form, and the record is
  already the sync payload. Reworks the streaming budget model the way the worldgen-worker
  item (Streaming / rendering) does for generation.
- **Shrink the periodic-save window (optional).** The save-generation gate (ADR 0014,
  2026-09-06) removed the old "re-save every edited chunk unconditionally every 5 s" cost —
  a steady-state walk now writes only the ~200 B meta, and the batched `putMany` makes the
  changed-set write one store transaction. Shrinking the ~5 s crash window itself (a shorter
  interval, or a trigger on the water sim's `touched` set) remains an option.
- **Byte-budgeted LRU warm cache.** The 512-record cap is a record-count shortcut
  (~15 MB); it spans both unloaded and cold-fetched (then-loaded) records. Budget by bytes
  and evict to fit.
- **Boot key-set growth.** The prefix-bounded scan (`IDBKeyRange.bound("seed:", …)`, an
  in-memory `startsWith` otherwise) is fine at POC sizes; an IDB index on the seed prefix
  scales it further.
- **Persist cross-seam settled water.** When a player edit in chunk A lets water settle
  across a seam into an unedited chunk B, B is NOT persisted (the write is settle-origin,
  not edit-origin) — B regenerates and re-settles to the identical water on reload
  (self-correcting; pinned by a round-trip test). Propagate the edit-origin flag across
  seams so B is persisted and skips the regenerate + re-settle.

## Replay (ADR 0017)

- **Seek bar (scrub the replay timeline).** The scrub HUD (`#scrub`) has a placeholder `.bar`
  style but no seek: jumping to tick `T` requires re-simulating the replay from its snapshot to
  `T` (deterministic, but a full re-sim of `T − startTick` ticks), which ADR 0017 deferred as
  expensive for the MVP. Design the seek as a re-simulate-from-snapshot (reset world/sim/PRNG/
  time to the snapshot, fast-forward the `ReplayController`s to `T` without rendering), then wire
  the `.bar` as a click/drag target that triggers it and updates the camera.

## Multiplayer (ADR 0018, 0019)

Phase A (the session model over a node loopback), **B1** (the deterministic core in the
browser: `?mp` loopback-in-page, full-snapshot `WorldTime` wire, `NET_INTERP_TICKS 6` pose-ring
interpolation, biped + name-tag remote rendering, leave handling), and **B2** (the real transport
+ lobby: a thin `TrysteroTransport` over `trystero`/Nostr, the `?host`/`?join` lobby overlay, the
wire codec, the async-join `hello` re-send + idempotent `onHello`, and the two-tab Gate B e2e) are
implemented and green (ADR 0019). The remaining decisions, in order:

- **Phase C — own-body prediction + reconciliation (ADR 0020).** The client runs `stepEntity` on
  its own entity locally each substep against its local world, keeping a ring of
  `{tick, intent, resultingPose}`; on each host `state` it snaps to the host pose at
  `lastIntentTick` and re-applies the buffered intents after it, smoothing a correction over a few
  frames if the error exceeds `NET_SNAP_EPS`. Actions stay host-applied (optional: predict a
  *break* visually and revert on disagreement within `NET_EDIT_TIMEOUT`). Test on loopback with a
  delayed link: a predicted path matches the host within `1e-6` on an unchanged world, and
  reconciliation corrects within K ticks when the host disagrees.
- **B2 pre-work (deferred follow-up, not a blocker).** The `LocalSession` unification (single-player
  as a `HostSession` with a null transport — collapsing B1's additive frame-loop mode-branch) + the
  `Persistence` light-worker refactor (light-edit worker wiring out of the constructor). B2 reuses
  B1's global-reassignment session-wiring for the lobby, so single-player is untouched (the pin
  holds). Also: verify a client's `visibilitychange` flush does not fire (the two-tab e2e does not
  trigger it).
- **Deferred (non-goals for the MVP, revisit later):** host migration (host leaves → session over),
  client-side mob possession (host path stays), an **unreliable** channel for `state` (a candidate
  optimization), per-peer chunk caching across sessions, and any hosted infrastructure (relay/
  TURN/lobby server).