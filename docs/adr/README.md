# Architecture Decision Records

One ADR per system. Each records the decision, the context that forced it, the
alternatives considered, and the consequences — distilled from the feature specs
and plans that preceded it (those were removed on 2026-08-20; the originals remain
recoverable via git history at pre-restructure `main`, `0cf878c`).

| # | ADR | One line |
|---|-----|----------|
| [0001](0001-project-foundation.md) | Project foundation & tooling | Vite + strict-TS + vitest stack, the gate suite, POC boundaries, gh-pages deploy |
| [0002](0002-world-model-terrain.md) | World model & terrain | 16³ chunk store, cross-seam get/set, seeded terrain, measured spawn, streaming |
| [0003](0003-meshing-rendering.md) | Chunk meshing & rendering | two-buffer mesher, baked per-vertex AO, canvas atlas, shared unlit materials |
| [0004](0004-player-interaction.md) | Player & interaction | AABB bisection physics, pointer-lock YXZ camera, DDA raycast break/place |
| [0005](0005-water-simulation.md) | Water simulation | level/source/stream cellular automaton, seven-round evolution, settle rules |
| [0006](0006-water-rendering.md) | Water rendering | per-level graded surfaces (`wlevel/8`), skirt faces at level steps |
| [0007](0007-dynamic-lighting.md) | Dynamic lighting | two 0–15 light fields, pop/relaxation propagation, dayness shader pass |
| [0008](0008-sky-day-night.md) | Sky & day/night | `WorldTime`, keyframed sky sampler, dome/stars/sun-moon, world-locked clouds |
| [0009](0009-special-blocks.md) | Special blocks | per-cell `meta`, torch/door partial geometry, state-dependent solidity |
| [0010](0010-ui-inventory.md) | UI & inventory | data-only hotbar, scrollable palette, H-toggled help overlay |
| [0011](0011-simulation-clocks.md) | Simulation clocks | `WorldTime.tick` heartbeat, water pulse on a 30-tick stride, frame-end crossing rule |
| [0012](0012-light-worker.md) | Light simulation on a web worker | pin-identical engine over a chunk-field mirror, tick-numbered structured-clone protocol |
| [0013](0013-heavy-remesh-slicing.md) | Heavy-chunk remesh | vertex-budget probe + 4 balanced row-band slices on reserved frames (exact partition, merge at end) |
| [0014](0014-world-persistence.md) | World persistence | edited chunks snapshot to IndexedDB on unload and restore verbatim (water state included); light recomputes on load; 1.5 s boot gate |
| [0015](0015-entities-controllers.md) | Entities & controllers | the player is an entity driven by a controller; edits flow through the sim (`applyIntent`), not the camera; persistence `v: 2` |
| [0016](0016-mobs-possession-spectator.md) | Mobs, possession & spectator | a deer kind with sim-owned wander AI, drive-any-entity possession (view + controller swap), and the single spectator ghost; box-part rigs |
| [0017](0017-replay.md) | Replay | a session is a snapshot + a delta-coded intent log, recorded (`R`) to a `replays` IDB store (browsable via the `#replays` panel) and played back deterministically on a fresh world; the camera follows the recorded perspective |
| [0018](0018-multiplayer-session-model.md) | Multiplayer session model | one host runs the only authoritative sim; clients send `Intent`s (delta-coded) and hold a view (pristine terrain + host-fed `cells`/`state`) over a reliable, ordered `Transport`; the host streams a union ring and coalesces per-tick cell writes; loopback transport + BotClient stress rig |
| [0019](0019-multiplayer-transport-lobby.md) | Multiplayer transport & lobby | the session model runs in the browser over a swappable `Transport` — B1 lands the deterministic core in-browser (`?mp` loopback-in-page, full-snapshot `WorldTime` wire, `NET_INTERP_TICKS` pose-ring interpolation, rig + name-tag remote rendering, leave handling); B2 swaps in a real `TrysteroTransport` (Nostr, room code) + a minimal `?host`/`?join` lobby (STUN only, no TURN) |
| [0020](0020-multiplayer-prediction-reconciliation.md) | Own-body prediction & reconciliation | the client runs `stepEntity` on its own entity locally each substep (prediction) and, on each host `state`, snaps the full authoritative state (pose + vel + `inWater`/`onGround`) then re-applies the buffered intents after `state.tick` (reconciliation) — the local player no longer lags the round trip; actions stay host-applied |

## Conventions

- An ADR is a **decision record**, not a spec or a plan: it states what was decided,
  why, what was rejected, and what it costs. Step-by-step build content, gate logs,
  and manual checklists deliberately do not live here.
- **New work:** feature specs/plans continue to be written under `docs/superpowers/`
  as working documents. When a project merges, its decisions are distilled into the
  relevant ADR(s) — creating a new one if a new system appears — and the working docs
  are superseded.
- **House style:** no reference engine is named (the euphemisms are "the reference
  engine" / "typical voxel engines"); pinned constants and numbers are kept verbatim.
- Open follow-ups are tracked in [`TODO.md`](../TODO.md); each ADR's Consequences
  section points at the items it owns.