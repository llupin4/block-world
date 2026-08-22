# Design: light simulation offloaded to a web worker

- **Date:** 2026-08-22
- **Status:** approved design (brainstormed 2026-08-22)
- **Supersedes:** the open TODO.md item "Web-worker offload of settle/propagation"
  (originating from ADR 0007 — Dynamic lighting, Consequences).
- **Produces:** ADR 0012 — Light simulation on a web worker (written at implementation
  time), ADR 0007's follow-up marked resolved, the TODO.md item removed, and a draft
  water-worker design doc (the sibling project, `2026-08-22-water-worker-design.md`).

## Context

The light sim (ADR 0007 — Dynamic lighting) is the heaviest simulation work on the main
thread:

- **The boot cascade is 459,134 pops** — the spawn ring's load settles plus the skylight
  wave through every open cave, pinned exactly by `src/__tests__/light-load.test.ts`
  (a deterministic node boot replay).
- **Open caves keep a large live queue** in steady state; the queue is an array of
  `"x,y,z"` strings with a dedup `Set`, and at ~1e5 entries it was the site of the
  SetIterator-allocation cost that already forced the array-queue redesign
  (`src/light.ts` header). That churn — string allocation per seed, array compaction,
  GC — is exactly what the renderer's critical path should not do while frames are
  being drawn.
- **The drain runs on the main thread once per frame** (`lightSim.tick(LIGHT_TICK_BUDGET)`,
  `src/main.ts`, 512 pops), and **load settles drain inline** (`settleChunk` →
  `LIGHT_SETTLE_GUARD = 512`) inside the streaming budget.

Four structural facts make a worker offload clean:

1. **The engine only talks to the world through `world.getChunk()`.** `LightSim`
   (`src/light.ts`) never calls `getBlock`/`getMeta` on the world — it reads the chunk's
   `blocks`/`meta` arrays directly. A mirror of the chunk fields is a complete stand-in,
   so the engine can run **unmodified** in a worker.
2. **The only main-thread consumer of the light fields is the mesher** —
   `rebuildChunkMesh` → `world.getLight` (the `aLight` vertex attribute, ADR 0007).
   `colSum` and `lightSettled` are engine-internal (the `skyEmit`/prefill walks and the
   fresh-load flag). So the worker→main traffic is the light fields of touched chunks and
   nothing else.
3. **The engine is node-testable and vitest has no `Worker`.** All engine tests, the
   same-edit-sequence determinism pin, and the 459,134 lineage must therefore stay
   engine-level — which works because the engine is unchanged. The worker-specific logic
   must be structured so the *same* logic is node-testable without a `Worker` runtime.
4. **Deployment is static GitHub Pages** (`scripts/deploy-gh-pages.mjs`), with no custom
   response headers by default — SharedArrayBuffer would require cross-origin isolation
   headers (a `_headers` file plus a deploy-script change). Structured-clone message
   passing needs none of that.

ADR 0011 — Simulation clocks reserved the seam: the canonical heartbeat is
`WorldTime.tick` and *a future off-thread light worker receives tick numbers in its
message protocol*. This design consumes it.

## Scope

**In:**

- A light worker: a node-importable core (mirror + unmodified `LightSim` + a message
  reducer), a thin worker entry, a shared protocol module, and a main-thread client.
- The minimal `main.ts` rewiring (Section "Main-thread integration").
- New-chunk first mesh deferred to the frame-end budgeted re-mesh path.
- A `window.__lightDebug` stats handle (cumulative pops/seeds/fieldChanges, latest queue
  size, last tick) — the runtime debug surface the ADR 0007 `stats` block was standing
  in for.
- New node tests (worker-core equivalence + push content + edges; main-side apply).
- Documentation: ADR 0012, ADR 0007 follow-up resolved, ADR README index row, TODO.md
  item removed.
- The **water-worker design doc** (sibling project): a draft living doc written after the
  light transport exists, updated as implementation lessons emerge, reviewed at the end
  of this project (see Section "Water-worker design doc (sibling deliverable)").

**Out (deliberate):**

- **Implementing the water offload.** Sibling project; this project's mirror +
  tick-numbered protocol is its design base (the water doc records that).
- **Worldgen/meshing worker offload.** Separate project — worldgen is pure seeded noise
  (no mirror, no queue, poolable) and would make the load path an async two-hop,
  reworking the §9 streaming budget model; it reuses this project's worker lifecycle,
  protocol shape, and debug-stats pattern. Tracked as the TODO.md item "Offload chunk
  generation/meshing to workers" (added 2026-08-22).
- **Any change to `LIGHT_TICK_BUDGET`, `LIGHT_SETTLE_GUARD`, the light rule, or the drain
  cadence.** Behavioral parity: 512 pops/frame, 512 inline settle pops, same frame slots.
  (The drain leaving the main thread *allows* raising the budget later; that is a tuning
  decision, not this project.)
- **Worker fault tolerance.** A dead worker freezes the light (observable via the stats
  handle going stale); no restart logic (POC).
- **SharedArrayBuffer transport.** The back-pocket optimization, recorded in ADR 0012
  with its revisit condition (Section "Alternatives considered").

## Decision

### Module layout

| module | side | responsibility |
|---|---|---|
| `src/light.ts` | both | **Unchanged.** The engine, its constants, and the 459,134 lineage stay exactly as they are. |
| `src/light-worker-core.ts` | worker (node-importable) | `LightWorkerState`: owns a `LightSim` over a `MirrorWorld`. `handle(msg)` applies one message and returns the reply (or `null` for non-tick messages). All worker logic lives here so node tests drive it without a `Worker`. |
| `src/light-worker.ts` | worker (thin, ~10 lines) | Instantiate the state; `self.onmessage = (e) => { const r = state.handle(e.data); if (r) postMessage(r); }`. Bundled by Vite via `new Worker(new URL('./light-worker.ts', import.meta.url), { type: 'module' })` — no `vite.config.ts` change (Vite handles worker chunks in dev and build). |
| `src/light-transport.ts` | main | `LightClient(world)`: spawns the worker at construction (before the first frame; boot messages queue FIFO until the worker is ready), posts messages, and on each reply copies the pushed fields into the real `Chunk` objects and fills `touched: Set<string>` (the consume-once-per-frame contract, same as today's `lightSim.touched`) plus the stats/queue state for `__lightDebug`. Exposes `load/unload/edit/tick` with today's call shapes. |
| `src/light-protocol.ts` | shared | Message types only; imported by both sides and the tests. |

### The mirror (world stand-in)

`MirrorWorld` is a `Map<string, MirrorChunk>` keyed by `chunkKey(cx, cy, cz)`, with
`getChunk(cx, cy, cz)` returning the entry or `undefined` — the missing-chunk
contract (missing = air = contributes nothing, exactly the engine's today).
`MirrorChunk` is a structural twin of `world.ts`'s `Chunk` for the fields the engine
touches: `{ cx, cy, cz, blocks: Uint8Array(4096), meta: Uint8Array(4096), blight:
Uint8Array(4096), skylight: Uint8Array(4096), colSum: Uint8Array(256), lightSettled:
boolean }`. The unmodified engine is instantiated as `new LightSim(mirrorWorld)`.

- `load` installs the mirror chunk (fresh: zeroed light fields, `lightSettled = false`,
  then `LightSim.settleChunk` — including the seam re-seeding of already-loaded
  neighbors). A duplicate `load` (the remesh path) updates `blocks`/`meta` in place and
  re-runs `settleChunk` — the engine's `lightSettled` flag makes that the cheap
  seam-only path, exactly as today.
- `unload` deletes the mirror chunk and calls `LightSim.onChunkUnloaded` (seam
  re-seeding in the surviving neighbors — the darkness wave).
- `edit` writes `(block, meta)` into the mirror chunk's arrays (if present) and calls
  `LightSim.edit` (colSum recompute + column re-seed + the cell/neighbors). The
  `(block, meta)` must come from the message — after `world.setBlock` the mirror is
  otherwise stale (today the engine reads the live world).

### Message protocol

Tick-numbered per the ADR 0011 seam; FIFO both ways; one reply per `tick` message.

```
main → worker
  { t: 'load',   tick, cx, cy, cz, blocks: Uint8Array(4096), meta: Uint8Array(4096) }
  { t: 'unload', tick, cx, cy, cz }
  { t: 'edit',   tick, x, y, z, block, meta }
  { t: 'tick',   tick, budget }                       // budget = LIGHT_TICK_BUDGET (512)

worker → main (one per tick message, even when empty)
  { t: 'result', tick, queue,                         // queueSize() after the drain
    changed: [ { cx, cy, cz, blight: Uint8Array(4096), skylight: Uint8Array(4096) }, … ],
    stats: { pops, seeds, fieldChanges } }            // cumulative, from the engine's stats block
```

- **`tick` is `WorldTime.tick` at send time.** The engine does not read it (the light
  drain is a per-frame budget, not a clocked system — ADR 0011's explicit out-of-scope
  note); it is the protocol's ordering/debug axis, the seam ADR 0011 reserved.
- **No transfer lists anywhere.** All arrays are structured-cloned (4KB per field array:
  8KB per `load` message for `blocks`+`meta`, 8KB per `changed` entry for
  `blight`+`skylight` — `colSum` is worker-internal and never pushed). Main keeps
  ownership of `blocks`/`meta` (the mesher and `world.getBlock` read them); the worker
  keeps its field arrays (cloned back on each reply). Clone cost at this traffic is
  sub-millisecond; SAB is the back-pocket optimization, not the design.
- **`changed` carries whole fields, not cell deltas**, for each chunk touched since the
  last reply — one memcpy to apply either way, and no per-chunk "which cells since last
  push" bookkeeping (see Alternatives).
- **Determinism by construction.** Both sides are single-threaded FIFO queues with one
  in-flight `tick` (main sends tick N at frame N, tick N+1 at frame N+1; the worker
  fully processes N before N+1 regardless of reply timing). The worker's engine therefore
  sees the same event sequence in the same order as today's inline calls — same loads,
  edits, unloads, budgets, frame slots — so the pop sequence, and the **459,134 lineage,
  is preserved structurally**. It stays pinned at engine level (node, untouched); the
  runtime sanity check is the browser parity check below.

### Main-thread integration

The `main.ts` diff is deliberately tiny:

| today | after |
|---|---|
| `new LightSim(world)` | `new LightClient(world)` — the variable keeps the name `lightSim` |
| 6× `lightSim.edit(x, y, z)` | **unchanged** — the client reads `world.getBlock/getMeta` itself to build the message |
| `lightSim.onChunkUnloaded(...)` | `lightSim.unload(...)` |
| `lightSim.settleChunk(...)` | `lightSim.load(...)` — the client clones the chunk's `blocks`/`meta` from the real `World` |
| `lightSim.tick(LIGHT_TICK_BUDGET)` | `lightSim.tick(LIGHT_TICK_BUDGET, worldTime.tick)` |
| touched merge (`for (const key of lightSim.touched) …; lightSim.touched.clear()`) | **unchanged** — `lightSim.touched` is now the client's set, same consume-once-per-frame contract |

Plus three deliberate changes:

1. **First mesh of a newly loaded chunk is deferred.** The load path's immediate
   `rebuildChunkMesh` becomes `pendingRebuild.add(chunkKey(...))`. The chunk's first
   mesh then goes through the frame-end budgeted path *after* the load's settle fields
   have arrived with the tick reply — the chunk appears fully lit 1–2 frames later
   instead of appearing instantly dark and flashing to lit. §9 bounds loads to
   ≤1/frame so this never queues, and the geometry pop-in matches how budgeted
   re-meshes already appear. (The alternative — instant dark mesh corrected within
   ≤3 frames via the touched flow — was rejected: a visible light-flash artifact at
   the view edge for no gain.) Water's inline `sim.settle` stays where it is; the
   deferred mesh reads settled `wlevel` either way (the water field is main-side).
2. **The reply carries `queue`** — `queueSize()` after the drain, what makes the
   acceptance check readable (watch it reach 0).
3. **`window.__lightDebug`** — one line in `main.ts`: the client's stats object
   (cumulative `pops`/`seeds`/`fieldChanges`, latest `queue`, last `tick`). There is no
   stats UI today; this is the debug surface.

`world.ts`: `colSum` and `lightSettled` stay on `Chunk` — the engine API and all node
tests are unchanged (the engine still writes them, just on the mirror's chunks). Their
comments are updated to say the main-thread copies are vestigial in production: owned
by the light worker's mirror.

### Guarantees

- **Determinism:** by construction (above) — identical event sequences yield identical
  light fields and identical stats; the 459,134 node lineage remains the pin and must
  stay green unchanged. The water lineage (10,690, `water-load.test.ts`) is untouched —
  this project does not touch the water sim.
- **`touched` contract:** preserved — accumulated from the latest applied reply,
  consumed and cleared exactly once per frame at the existing merge site. Accepted
  consequence: frame N's re-mesh consumes the reply to tick N−1 (one frame of latency).
  Harmless by the existing argument: `REBUILD_BUDGET` already spreads re-meshes over
  frames and a briefly-stale mesh is safe (ADR 0007 — light is a self-correcting
  lower bound at the fixpoint).
- **First-appearance light:** a new chunk's first mesh is fully lit (deferred, above);
  its geometry appears ≤1–2 frames later than today (accepted: edge of view, consistent
  with the budgeted re-mesh pop-in).
- **Memory:** the worker holds a mirror of the loaded ring — 125 chunks × ~8.4KB
  (fields + colSum) + blocks/meta ≈ 2MB worst case.
- **Failure mode:** a worker script error freezes the light (fields stop updating,
  `__lightDebug` goes stale); no restart logic (POC, documented in ADR 0012).

## Tests

- **Engine: byte-identical, untouched.** `light.test.ts`, `light-load.test.ts` (the
  459,134 lineage), and `blocks.test.ts` keep passing unchanged — that is the
  determinism pin.
- **New `src/__tests__/light-worker-core.test.ts`** (node, drives
  `LightWorkerState.handle` directly):
  1. *Equivalence (the key test)* — the same event sequence (load a chunk set, edits,
     ticks to drain) run (a) directly on `World` + `LightSim` and (b) through the worker
     core from the same chunk data + messages: every chunk's final `blight`/`skylight`
     and the cumulative `stats` must be identical. Proves the protocol is
     determinism-transparent.
  2. *Push content* — each tick reply's `changed` entries carry the mirror's current
     fields; a chunk appears only if touched since the last reply; exactly one reply per
     `tick` (empty `changed` when idle).
  3. *Edges* — unload darkens through seam re-seeding (matches `onChunkUnloaded`);
     unload→reload of the same key re-settles fresh (the mirror's `lightSettled` reset);
     an edit targeting a chunk absent from the mirror (no crash; the engine no-ops); a
     duplicate load (the remesh path — no prefill, seam only).
- **New `src/__tests__/light-transport.test.ts`** (main-side apply): applying a
  `result` copies fields into the real `Chunk`s, fills `touched`, accumulates the
  stats; a reply for a chunk unloaded in flight is a guarded no-op; `touched` semantics
  match the consume-once contract.
- **Browser acceptance (manual):**
  - *Stationary-spawn parity* — stand still at spawn; watch `__lightDebug` until
    `queue` hits 0; cumulative `pops` should equal the node replay's **459,134** (same
    seed, same stationary load order; light events are frame-ordered, not
    time-ordered, so an exact match is expected).
  - *Free play* — torch place/break wave reads as before; boot-cave cascade; no
    dark-edge flicker on streaming; light frozen only if the worker died (stats go
    stale).
  - *Deploy* — `npm run deploy:gh-pages -- --dry-run` verifies the worker chunk is
    emitted and its asset path survives the gh-pages rewrite (the deploy script's
    index.html rewrite must not touch the worker reference inside the bundle).

## Water-worker design doc (sibling deliverable)

A draft living doc at `docs/superpowers/specs/2026-08-22-water-worker-design.md`,
written **after** the light transport is built (so it documents the actual pattern, not
a prediction), updated as implementation lessons emerge, and reviewed at the end of this
project. Its design, settled now:

- **Same pattern, extended mirror.** `src/water.ts` stays byte-identical (the 10,690
  lineage pinned in node). The mirror chunk gains `wlevel: Uint8Array(4096)` + the
  water `settled` flag; the `load` message gains the chunk's initial `wlevel`
  (worldgen's water levels — the water engine's state, exactly as `blight`/`skylight`
  are light's); pushed fields gain `wlevel` for changed chunks (the mesher reads it for
  water surfaces).
- **One worker, both sims.** The light worker evolves into the sim worker (the core
  module is structured for this; rename at that project): one lifecycle, one mirror,
  one `load` message feeding both engines. The light/water queues are independent and
  the sims never touch each other's state (ADR 0007), so interleaving within one worker
  changes nothing — and there is no parallelism to gain from a second worker (a
  1,000-cell pulse per 30 frames vs a 512/frame drain).
- **Pulse pacing stays on main — the ADR 0011 seam, exactly as designed.** Main keeps
  the `tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)` decision and sends the
  water `tick` message (budget `WATER_PULSE`) only on pulse frames; load-settles stay
  event-driven via `load`. The water `touched` merge moves to the client's reply, same
  one-frame-late pattern.
- **First-mesh deferral is shared.** The light project already defers new-chunk first
  meshes; water's settled `wlevel` arrives with the same reply, so the deferred mesh
  reads water that is *fresher* than today's inline mesh (settle + the first pulse
  drain).
- **Determinism:** the engine-level 10,690 pin is untouched; the worker-core
  equivalence test gains a water arm (same shape as light's: same sequence → identical
  `wlevel` fields + stats).

## Documentation

- **New ADR 0012 — Light simulation on a web worker** (`docs/adr/0012-light-worker.md`):
  Context (ADR 0007's follow-up, ADR 0011's worker seam, the motivation), Decision
  (approach A: unmodified engine over a mirror, structured-clone tick-numbered
  protocol, one-frame-late `touched`, first-mesh deferral, `queue`/stats debug
  handle), Alternatives (including SharedArrayBuffer as the back-pocket optimization
  with its revisit condition), Consequences (determinism-by-construction + the
  equivalence test, the accepted one-frame latency, vestigial main-side
  `colSum`/`lightSettled`, the failure mode, the deploy/worker-asset note, follow-ups:
  the water spec and the worldgen/meshing worker). Follow the ADR house style
  (Status / Last updated / Sources / Context / Decision / Alternatives considered /
  Consequences).
- **ADR 0007** — the "web-worker offload of settle/propagation" open follow-up under
  Consequences is marked resolved (strikethrough + pointer to ADR 0012); `Last updated`
  bumped.
- **ADR 0011** — a pointer added at its worker-seam note (small; if the note is only the
  seam statement, ADR 0012 citing it suffices and 0011 is untouched).
- **ADR README index** — ADR 0012 added.
- **TODO.md** — the "web-worker offload of settle/propagation" item removed (resolved by
  ADR 0012); the worldgen/meshing item stays open.
- **Working docs** — this spec and the implementation plan are committed and left on
  disk (same treatment as the simulation-clocks project's docs). The water-worker doc
  remains a draft living doc for the sibling project.

## Alternatives considered

- **B — SharedArrayBuffer + cross-origin isolation (the back pocket).** Move the light
  fields out of the `Chunk` object into a SAB; the worker writes in place, the mesher
  reads directly — zero per-frame field clones. Rejected for now: the clone traffic it
  saves is sub-millisecond at this scale, while it costs a `_headers` (COOP/COEP) file
  in the gh-pages deploy, a `world.ts` refactor touching the mesher's read path, and it
  breaks "engine unchanged" (`LightSim` would write to the SAB instead of `Chunk`
  fields). **Revisit condition (recorded in ADR 0012): profiling shows
  structured-clone cost is real** (e.g., the boot-cascade reply traffic measurably
  hitches the main thread).
- **C — Settle-only offload** (the worker does `settleChunk`; main keeps `tick`) —
  rejected: settle and tick share *one* queue; you cannot split a FIFO across threads
  without re-deriving the seam, and the heavy case (open caves) is precisely the
  propagation drain that would stay on main.
- **Cell-delta pushes** (push only changed cells, not whole fields) — rejected: a
  changed cell is re-touched across replies anyway, applying a delta is still a memcpy
  of comparable size, and the per-chunk "which cells since last push" bookkeeping adds
  state for no traffic gain at this scale.
- **Two workers, one per sim** — rejected for now: no parallelism to gain (both drains
  are small and budgeted), and one mirror / one `load` message is simpler. The
  water-worker doc re-examines it and lands on one worker for both sims.
- **Offloading the mesher too** (geometry built in the worker) — out of scope: that is
  the worldgen/meshing worker project (TODO.md), a different pattern (it needs the
  light fields the light worker owns — a cross-worker data dependency).