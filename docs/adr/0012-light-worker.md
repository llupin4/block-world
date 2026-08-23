# 0012. Light simulation on a web worker — the pin-identical engine over a chunk-field mirror, on a tick-numbered structured-clone protocol

- **Status:** Accepted
- **Last updated:** 2026-08-22
- **Sources:** (superseded by this ADR; recoverable via `git show <sha>:<path>` — both
  working docs committed on the `light-worker` branch before the working-docs removal)
  - `docs/superpowers/specs/2026-08-22-light-worker-design.md` (the design: architecture,
    protocol, main-thread integration, guarantees, tests, the water spec deliverable)
  - `docs/superpowers/plans/2026-08-22-light-worker.md` (the implementation plan)
  - `TODO.md` (the resolved "Web-worker offload of settle/propagation" item, originating
    from ADR 0007 — Dynamic lighting)

## Context

ADR 0007 — Dynamic lighting left its open follow-up: *web-worker offload of
settle/propagation*. The light sim is the heaviest simulation work on the main thread:
the spawn-ring boot cascade is **459,134 pops** (pinned by `light-load.test.ts`), open
caves keep a large live queue of `"x,y,z"` string entries (the SetIterator-allocation
cost at ~1e5 entries that already forced the array-queue redesign in `src/light.ts`),
and the drain (512 pops/frame) plus the inline load settles (512 pops each) run inside
the renderer's frame. ADR 0011 — Simulation clocks reserved the seam: `WorldTime.tick`
is the canonical heartbeat and *a future off-thread light worker receives tick numbers
in its message protocol*.

Four structural facts made the offload clean:

- The engine only talks to the world through `world.getChunk()` — a mirror of the chunk
  fields is a complete stand-in, so `LightSim` runs in the worker **pin-identical** (its
  one deliberate change: `settleChunk`'s fresh-settle `touched` mark — see Decision).
- The only main-thread consumer of the light fields is the mesher (`world.getLight`);
  `colSum`/`lightSettled` are engine-internal — so the worker→main traffic is the
  touched chunks' fields and nothing else.
- The engine is node-testable and vitest has no `Worker` — the engine tests and the
  459,134 lineage stay engine-level, and the worker logic is structured to be
  node-testable without a `Worker` runtime.
- Deployment is static GitHub Pages with no custom response headers —
  SharedArrayBuffer would require cross-origin isolation headers; structured-clone
  message passing needs none.

## Decision

**Approach A — a dedicated light worker on structured-clone messages.** Four new modules
plus a thin rewiring of `main.ts`; `src/light.ts` stays pin-identical (the sole change:
`settleChunk`'s fresh-settle `touched` mark — 705c663, below).

- **`src/light-worker-core.ts`** (node-importable): `LightWorkerState` owns a
  `MirrorWorld` (`Map<chunkKey, {cx,cy,cz,blocks,meta,blight,skylight,colSum,lightSettled}>`
  answering `getChunk`) and a pin-identical `LightSim` — the single localized
  `as unknown as World` cast at the construction site, since the engine is typed against
  `World`. `handle(msg)` applies one message and returns
  the reply (`null` for non-`tick` messages). `load` installs/refreshes the mirror chunk
  then `settleChunk` (fresh = prefill+frontier, duplicate = the seam-only remesh path,
  via the mirror's `lightSettled`); `unload` deletes the mirror chunk **then**
  `onChunkUnloaded` (main.ts's exact order); `edit` applies the message's `(block, meta)`
  to the mirror (it is otherwise stale after `world.setBlock`) **then** `LightSim.edit`;
  `tick` drains `budget` pops and replies with the touched chunks' whole fields
    (`blight`/`skylight` snapshots — `colSum` is worker-internal and never pushed), the
    post-drain `queue` size, and the cumulative `stats`. `touched` is the reply's push
    contract: `pop`/`edit` mark it on field change, and `settleChunk` marks a FRESH settle
    (prefill writes the fields without a pop — without the mark a changeless settle, e.g.
    an open flat surface, would never be pushed and the main copy would stay zero: the
    dark-surface bug, 705c663).
- **`src/light-worker.ts`**: ~10 lines of `self.onmessage` plumbing; Vite bundles it as
  the worker chunk via `new Worker(new URL(...))` (no `vite.config.ts` change).
- **`src/light-transport.ts`** (main side): `LightClient(world, worldTime)` spawns the
  worker at construction (boot messages queue FIFO until it is ready) and posts
  `load`/`unload`/`edit`/`tick`, each stamped with `worldTime.tick` (the ADR 0011 seam —
  the engine does not read it; it is the protocol's ordering/debug axis). Replies are
  applied by the pure `applyLightResult`: the pushed fields are copied into the real
  `Chunk` objects (the mesher's source) and the chunk keys accumulated into `touched` —
  consumed and cleared exactly once per frame at the existing merge site, so the contract
  is unchanged. Frame N's re-mesh consumes the reply to tick N−1 (one frame late).
- **No transfer lists anywhere** — every array is structured-cloned (4KB per field
  array; 8KB per `load`, 8KB per `changed` entry). Clone cost at this traffic is
  sub-millisecond.
- **Main-thread integration:** `new LightClient(world, worldTime)` replaces
  `new LightSim(world)` (the variable keeps the name `lightSim`); the `edit` call sites
  are unchanged (the client reads `world.getBlock/getMeta` itself); `onChunkUnloaded` →
  `unload`, `settleChunk` → `load`, and `tick(LIGHT_TICK_BUDGET)` keeps its shape (the
  tick stamping is inside the client). A newly loaded chunk's **first mesh is deferred**
  to the frame-end budgeted re-mesh path (`pendingRebuild.add` instead of the immediate
  `rebuildChunkMesh`): the chunk appears fully lit 1–2 frames later instead of dark and
  flashing to lit (the §9 load budget of ≤1/frame means it never queues; the geometry
  pop-in matches how budgeted re-meshes already appear). `window.__lightDebug` exposes
  the client (cumulative pops/seeds/fieldChanges, latest queue, lastTick).
- **Budgets and cadence unchanged:** `LIGHT_TICK_BUDGET = 512`/frame,
  `LIGHT_SETTLE_GUARD = 512` inline, the same frame slots — behavioral parity. The drain
  leaving the main thread *allows* raising the budget later; that is a tuning decision,
  not this change.

**Determinism — by construction.** Both sides are single-threaded FIFO queues with one
in-flight `tick`; the worker's engine therefore sees the same event sequence in the same
order as the main thread's inline calls — same loads (same data, captured at load time),
edits, unloads, budgets, frame slots — so the pop sequence is preserved structurally: the
inline lineage **459,134** (`light-load.test.ts` + the test's direct replay) and the
worker path its own **434,883** (the one-time redundant boot wave the mirror skips — the
boot settle seeds the two boot siblings' 512 face shells inline; the siblings' fresh-load
prefill redoes that work when streaming remeshes them). Pinned: the node engine suite's
pins are preserved (the engine's sole change is the 705c663 touched-mark — no pops), and a
boot-replay equivalence test (`light-worker-core.test.ts`) drives the production boot
sequence through the protocol and asserts identical per-chunk fields + both lineages. The
runtime sanity check is the browser stationary-spawn parity (the `__lightDebug` pops reach
≈434,883 at the drained queue — a band, as production water pulses shift remesh timing).

## Alternatives considered

- **B — SharedArrayBuffer + cross-origin isolation (the back pocket).** Move the light
  fields out of the `Chunk` object into a SAB; the worker writes in place, the mesher
  reads directly — zero per-frame field clones. Rejected for now: the clone traffic it
  saves is sub-millisecond at this scale, while it costs a `_headers` (COOP/COEP) file in
  the gh-pages deploy, a `world.ts` refactor touching the mesher's read path, and it
  breaks "engine pin-identical." **Revisit condition: profiling shows structured-clone
  cost is real** (e.g., the boot-cascade reply traffic measurably hitches the main thread).
- **Settle-only offload** (the worker does `settleChunk`; main keeps `tick`) — rejected:
  settle and tick share *one* queue; you cannot split a FIFO across threads without
  re-deriving the seam, and the heavy case (open caves) is precisely the propagation
  drain that would stay on main.
- **Cell-delta pushes** (push only changed cells, not whole fields) — rejected: applying
  a delta is still a memcpy of comparable size, and the per-chunk "which cells since the
  last push" bookkeeping adds state for no traffic gain at this scale.
- **Two workers, one per sim** — rejected for now: no parallelism to gain (both drains
  are small and budgeted), and one mirror / one `load` message is simpler. The
  water-worker design doc re-examines it and lands on one worker for both sims.
- **Typing the engine against a minimal world view** — rejected: it would touch
  `src/light.ts`, and "engine pin-identical" was a load-bearing constraint (the node pins
  stay exactly as they are; 705c663's touched-mark keeps them); the mirror is cast at the
  single construction site instead.
- **Offloading the mesher too** — out of scope: the worldgen/meshing worker is a separate
  project (TODO.md), a different pattern with a cross-worker data dependency (it needs
  the light fields the light worker owns).

## Consequences

- The renderer's critical path no longer runs light work: the boot cascade and cave
  propagation settle in the worker; the frame cost is one postMessage each way.
- **Accepted: one frame of latency on touched → re-mesh** (frame N's re-mesh consumes
  the reply to tick N−1) — `REBUILD_BUDGET` already spreads re-meshes over frames and a
  briefly-stale mesh is safe (ADR 0007 — the light is a self-correcting lower bound at
  the fixpoint).
- **Accepted: a new chunk's first mesh is 1–2 frames late** (fully lit on first
  appearance; no dark flash) — edge of view, consistent with the budgeted re-mesh
  pop-in.
- The main-thread `colSum`/`lightSettled` copies are vestigial in production (the mirror
  owns them); the `Chunk` fields stay because the engine API and the node tests are
  unchanged.
- **Failure mode:** a worker script error freezes the light (fields stop updating,
  `__lightDebug` goes stale); no restart logic (POC).
- Memory: the worker holds a mirror of the loaded ring — 125 chunks × ~16KB
  (blocks/meta + light fields + colSum) ≈ 2MB worst case.
- The deploy script pins only the entry assets to static names; the worker chunk keeps
  its hashed name (its runtime ref is a same-folder relative `new URL(...)`).
- The engine-level pins are preserved (the engine's sole change is the 705c663 fresh-settle
  touched mark — no pops/fields); the water lineage (10,690) is untouched.
- **Follow-ups:** the water offload — `docs/superpowers/specs/2026-08-22-water-worker-design.md`
  (draft; one worker for both sims, pulse pacing stays on main via `tickCrossed`); the
  worldgen/meshing worker (TODO.md — Streaming / rendering).
- **Browser acceptance (2026-08-22):** stationary-spawn parity via `window.__lightDebug`
  — `queue` drains to a stable 0 in ~14–18 s and `stats.pops` lands at ≈434,883 (the
  worker-path lineage pinned by `light-worker-core.test.ts`; a band of a few %, since
  production's 2 Hz water pulses shift remesh-op timing versus the node replay's collapsed
  drains). First run confirmed lit-on-load after the 705c663 fresh-settle touched-mark fix
  (before it, a chunk settling with zero pop-driven changes — e.g. an open flat surface —
  was never pushed and stayed dark).