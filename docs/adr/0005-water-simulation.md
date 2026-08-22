# 0005. Water simulation — local re-derivation cellular automaton with static worldgen sources, eternal placed springs, instant whole-column falls, and a 0.5 s slow clock (1000 updates per pulse)

- **Status:** Accepted
- **Last updated:** 2026-08-22
- **Sources:** (superseded by this ADR; recoverable via `git show 0cf878c:<path>`)
  - `docs/superpowers/specs/2026-08-16-water-simulation-design.md` (original design: data model, tick rules, queue, clock & budget, settle, chunk-boundary & streaming rules)
  - `docs/superpowers/plans/2026-08-16-water-simulation.md` (original implementation plan: data-model and terrain-fix details)
  - `docs/superpowers/plans/2026-08-16-water-sim-defect-fixes.md` (defect fixes #1–4 and the controller addenda recording redesign rounds 1–7)
  - `TODO.md` (resolved items under "Water" and "Water sim (model)" — substance carried into this ADR; the items are deleted from TODO.md)
  - `PROJECT.md` (§9 Water)

## Context

Two problems, one system:

1. **Caves were fully submerged.** Terrain generation carved underwater caves to
   `Block.Water`, so every underwater cave was a solid water blob — no air
   pockets, no "cave" feel.
2. **Water was inert.** Break a seafloor block and the hole stayed dry under a
   water column; break the source of a hand-placed pool and the pool floated
   forever.

User decisions (brainstorming, 2026-08-16): all water is dynamic — generated
ocean and player-placed water share one code path; water severed from support
drains within a second or two; caves flood where water can physically reach,
with air pockets (like typical voxel engines) — a cave touching the sea fills
from the opening and keeps trapped air, a sealed cave stays dry; settle standing
water on chunk load, then tick flows in time.

The simulation is a pure-TS cellular automaton (`WaterSim` in `src/water.ts`, no
three, unit-testable in node) over the streamed chunk store (ADR 0002 — World
model & terrain), with all water state riding in each chunk so it streams with
the chunk. Live browser testing then drove seven redesign rounds of the water
model (Superseded decisions below); this ADR records the final model after round
7.

## Decision

**Data model.** Four parallel `Uint8Array`s ride alongside `Chunk.blocks` (4096
cells per chunk):

- `wlevel` — 0 dry, 1..7 water. A real decay number: every fresh start is level
  7; a sideways spread writes its neighbour at level − 1; any fall resets the
  parcel to 7.
- `wsource` — 0/1: this cell is a source — immortal, re-derives to itself. Two
  kinds, distinguished by `wplaced`.
- `wplaced` — 0/1: this source is a placed spring — created only by the player
  placing water, or regenerated inside a placed body; set by `edit(Water)`,
  cleared by any other block.
- `wstream` — 0/1: this cell is a stream cell — a falling column or flow riding
  a support: visible, never spreads, never climbs, dries when its emitter is
  gone.

Invariant: `block == Water ⇔ wlevel ≥ 1 || wsource == 1`; a write that makes a
cell stop being water clears all four fields. State lives in the chunk: a
missing neighbour chunk reads as dry and is not a spread escape; unloading a
chunk drains its water state with it.

**Sources.** Two kinds:

- **Placed water is a spring** (`wplaced`): level 7, immortal, static — it never
  falls (not even alone in the sky) and pours no column through the space below
  itself; its only emission is a side halo into the air beside it (level 7→6→…),
  and that halo's water then falls off edges by the ordinary flow rules. A lone
  sky source stays a single static block with a drip running off each exposed
  side — an eternal emitter until the player breaks it (user-accepted
  behaviour). It is the only water the player can remove (water is pass-through
  for placement, but a placed source is targetable on break — ADR 0004 — Player
  & interaction); breaking it is the way to stop the flow it feeds. Springs are
  re-checked at every slow-clock pulse (a `springs` set maintained by `edit()`),
  so a blocked halo pours again once its gap reopens.
- **Worldgen water (sea, lakes, cave pools) is a static source**: settle
  re-seeds it as level-7 sources (a bulk pass per chunk load) so falls are
  handled in the load path, but it never moves — never emits, never grows, never
  feeds flow. The sea stands: it cannot flood caves through a breach by its own
  push, no placed block can raise its level, and a player pool touching the sea
  drains away completely once its sources are gone. A fed static source with air
  below (water above or beside it) pours through the gap in its support like any
  waterfall head — the sea column above a breached floor drops into the cave and
  becomes the cave's stream; a lone unfed static source that falls keeps its
  source flag where it lands (a falling worldgen lake is still a lake).

**Heal rule (source regeneration).** A body of placed water behaves as one still
body: it regenerates missing source cells within itself. (a) A source above + a
placed source alongside the air below → that air becomes a source (the missing
corner of `S S / S .` closes; a one-cell pocket inside the body fills). (b) `S .
S` → `S S S` only when the one-cell gap is part of a source body — at least one
of the gap's other neighbours (the two perpendicular side cells, or the cell
above the gap) is a source — so two separate placed sources in open air never
fuse into a phantom third source (an eternal emitter the player never placed).
Only placed sources are generated; worldgen water never grows, so the sea cannot
creep into cave air. A lone source in the sky never accumulates into a vertical
run of sources.

**Flow rules.**

- **Water falls first.** A non-source cell with air below is either a waterfall
  head — water directly above it or in a horizontal neighbour — which stays put
  and pours the whole column down through the gap in one pass, or a lone falling
  parcel (no water around it), which falls the whole column at once and keeps
  its source flag.
- **Falls are whole-column writes.** A fall writes its full column at once in
  one deterministic two-pass: pass 1 walks the air below to classify the
  landing; pass 2 writes every air cell of the column at level 7 with final
  flags in place (`wstream` marking the falling cells), so the first processing
  of a column is a no-op fixpoint — nothing is recomputed (nothing flickers)
  until the path changes. Landing outcomes: solid ground or the world floor →
  the bottom cell rests as a sheet (it spreads its bounded floor fan while the
  flow above it lives) and the shaft above it rides (`wstream=1`); a pool one
  deep over solid (a sheet) or another stream → the column joins it — visible
  through the surface, never spreads, nothing written below the meeting point;
  anything deeper (a deep pool, the sea) → absorbed one block above the surface
  — nothing is written on the body's surface, so a falls-to-sea pour is lost at
  the surface, no water body's level ever rises, and nothing blinks at the base
  of a falls-to-sea stream; not-yet-generated space (low band not loaded) → the
  column stops at the band edge and the cell is parked in a `waiting` set
  re-checked every pulse, extending once the band loads (replaces the old
  destroy-out-of-the-world behaviour). The world floor (bottom row of the
  generated world) is solid: water at it rests on the void — no
  drain-out-of-the-world, no blink — so a source at the world edge is a stable
  side-fountain.
- **A cell with no air below rests and spreads sideways** into open side
  neighbours: a cell spreads to Air only at level ≥ 2, writing the neighbour at
  level − 1 — fresh flow starts at 7, loses one level per sideways spread step,
  and a level-1 cell spreads nothing, so a spring's flood is a ~6-block bounded
  fan (rounded by the 4-way spread: 85 cells on an open pad). Any fall resets
  the parcel to 7, so water always prefers to run down a slope, ledge by ledge.
- **Flow over deep water vanishes**: a resting flow cell over a body whose
  surface is below it is absorbed, and spread never happens sideways over a
  source surface.
- **Adoption & drying.** Falling flow that lands on a source surface (a one-deep
  sea, a cave lake) is taken on as a rider — it rides the source surface like
  still water and dries when its feed is cut. Nothing is ever adopted into a
  source body (no flow cell is ever given source status inside it), so a body's
  level never rises and a cut-off flow can never be left behind as an immortal
  source over the sea — this fixed the immortal flow above the sea. A rider
  stays a rider only while something alive holds it — flow pouring in from
  above, or a spring / active column alongside; when the emitter is gone the
  dead column top resets to resting water and re-derives, so a frozen column can
  never outlive its source.

**Level re-derivation (drying).** A water cell stores only its own state —
source-or-flow plus level; it remembers no origin, holds no sustained flag, and
no global reachability audit runs. A resting flow cell re-derives its level from
its neighbourhood:

- **7** — it is a placed spring, or level-7 water sits directly above it (flow
  landing on / pouring into it — what keeps a floor sheet under a live stream
  full and pushing);
- **7 − d** — the nearest feed is d hops away through the water body (bounded
  6-neighbour probe): a feed is a placed spring (any direction — its fan) or a
  level-7 flow cell at the same level or above (a landed sheet centre, a
  column's cells); a level-7 cell strictly below is never a feed (a cut-off
  pool's sheet would otherwise keep feeding itself), and worldgen water is never
  a feed (the sea stands; it does not push);
- **0 (dry)** — no feed within 6 hops: the cell re-derives to air.

That is the entire decay: a flow exists only because of its source. Remove the
spring (or plug the breach that feeds a stream) and the disconnected level wave
walks through the dirty closure to air, cell by cell: a plugged cave drains
itself completely, a shoreline pool drains all of it even though the static sea
touches it, a springless fan dries to the last cell. Two flows that merge share
one level field — the probe finds the strongest feed and the merged water
"belongs" to nothing.

**Clock & budget.** An independent slow clock, decoupled from physics and from
WorldTime: `main.ts` accumulates frame time and calls `sim.tick(1000)` on a
pulse every 0.5 s (≈2 Hz). Budget: 1000 cell updates per pulse (was 250 before
round 7); the remainder of the queue persists into later pulses. The budget is
sized so a cut-off body's re-stabilization cascade — the level wave re-deriving
the disconnected water to air — finishes within a pulse or two: a stopped flow
settles in ~1–2 s instead of crawling for seconds and visibly re-expanding
before it drains. Per-frame sim cost is ≈ zero; placement and drain visibly take
time. Every pulse start re-queues the `waiting` cells (fall extension) and the
live `springs` (halo re-emission).

**Settle & chunk rules.**

- **On chunk load** — cheap settle: pass 1 bulk-writes every worldgen Water cell
  of the chunk to (level 7, source, `wplaced=0`, `wstream=0`) straight into the
  chunk arrays — no per-cell queue work; pass 2 enqueues only a seeded cell
  whose rule would act at seed time — a fall (below reads Air) or a spread (a
  horizontal neighbour reads Air); interior ocean triggers neither and is never
  processed. Then a guarded relaxation to fixpoint (cap 2000 cell updates, ~5–10
  ms; a cave still mid-fill when the cap hits keeps relaxing over later
  slow-clock pulses). Idempotent via a per-chunk `settled` flag.
- **Band-order guard**: a chunk whose low y-band is in the generated range but
  not yet loaded defers its settle — settling it would fall its bottom water out
  of the still-unloaded world through a hole that does not exist (the visible
  "raised/stepped ocean" at spawn); the low band's settle cascades upward and
  wakes it. `process()` likewise refuses to fall into not-yet-generated space.
- **Pristine-skip**: a loaded-unsettled neighbour's unseeded worldgen water
  (level 0, no source) is never re-leveled or dried — settling A may flood Air
  across the seam into B, but B's water stays exactly as generated until B's own
  settle re-seeds it; sequential per-chunk settling is order-independent and can
  never eat worldgen water.
- **Sea-connected pockets equalize to the sea level on load** (connected
  vessels): a cave opened to the sea is filled to the sea's surface by the
  settle relaxation plus the instant column writes — the cave holds a stream +
  floor pool at sea level, and the sea surface itself never rises.
- **On unload** — drain: water state dies with its chunk; on reload it is
  re-derived by settling (idempotent, so a reloaded region converges to the same
  state).
- **Edits re-mark the dirty closure**: `edit()` (break → Air; place → new block;
  placed Water → a level-7 spring + a `springs` entry; anything else clears the
  cell) and every state write re-mark the cell, its 4 horizontal neighbours, the
  cell above, and the cell below — each state change re-marks exactly the cells
  whose re-derivation could differ. There is no global reachability audit: the
  old `runAudit()` BFS (the `wflow` sustained-flag model) was replaced by this
  local re-derivation and is moot.
- **Mesh-freshness contract**: `sim.touched` accumulates across every settle of
  a frame and is consumed and cleared exactly once by the frame-end drain in
  `main.ts` — `settle()` never clears it, so a seam chunk flooded across is
  re-meshed in the same frame instead of keeping a stale pre-flood mesh (the
  mesher side is ADR 0003 — Chunk meshing & rendering).
- **Missing chunks stop spread**: spread writes Air only and never into
  ungenerated space (a state write into a missing chunk is skipped, which also
  breaks the world-edge self-re-enqueue loop); a fall stopped at a missing band
  is re-checked every pulse and extends once the band loads.

**Terrain carve (input to the sim).** Underwater caves carve to `Block.Air` (was
`Block.Water`) — cave flooding comes entirely from the sim; the exact
water-count pin re-pinned 45395 → 24936.

## Alternatives considered

Rejected options, as recorded:

- **Re-promotion to immortal sources** (original POC model): any settled water
  on solid support (or level-7 water above) re-promoted to a permanent source,
  and falling water carried its source bit — the sea itself left immortal
  sources anywhere it poured. Rejected (user, model redesign): covering a
  flooded hole should make the water go away; placing a water block should
  create exactly one source, not a diamond of them; flow water should be
  distinguishable from source water.
- **Instant bulk equalization (connected vessels by BFS)** (defect fix #4,
  `equalize()`): an air pocket connected to a large water body (body > 512 cells
  with a level-7 surface found by an up-first probe capped at 4096 cells; pocket
  ≤ 8192 cells; ungenerated space treated as wall) bulk-filled to the body's
  surface level in one write, at settle and on player breaks. The user rejected
  the result — instant fill of the entire cave is "wrong and bad" (the desired
  behaviour is a gradual flow-in), and equalize's `(7,1)` bulk writes made a
  placed block spawn several source rings around it — and it was reverted;
  faster cave flooding, if wanted later, must look like a gradual flow-in, a
  different design that needs its own plan.
- **Unlimited-range flow with cosmetic levels + a global reachability audit**
  (round 4 redesign): levels a cosmetic constant 7 (no decay — resting water a
  zero-work fixpoint), spread unlimited (terrain/reachability, not level decay,
  bound it), flow sustained by a per-cell `wflow` flag re-derived globally by
  `runAudit()` BFS after any water-removing edit. Replaced by local
  re-derivation (no sustained flag, no audit) and real level decay — the
  unlimited range backfired on hillside placement, and the global BFS is now
  moot.
- **One-step-per-pulse fall pacing** (round 3): a column dropped one level per
  0.5 s pulse as a rigid body. Replaced by instant whole-column writes — a
  10-block cave fall read as 5 s of a migrating/blinking drop, and the world
  edge re-dripped one cell out of the void every pulse.
- **Per-frame tick at 200 updates every 5th frame (~12 ticks/s)** (original
  clock): replaced by the 0.5 s slow-clock pulse — placement and drain should
  visibly take time, per-frame sim cost becomes ≈ zero (the user asked for
  exactly this, noting it should also help performance).
- **250 updates per pulse** (slow-clock budget before round 7): a cut-off body's
  re-stabilization crawled for seconds, visibly re-expanding before draining —
  the budget is now 1000.

## Consequences

- Levels now drive rendering (ADR 0006 — Water rendering): a resting flow cell's
  surface sits at `wlevel / 8` (a spring's fan reads as a stepped gradient),
  while source water and stream cells draw full height; a taller water cell
  emits a skirt face against a lower water neighbour. Levels were dynamics-only
  for most of the design's life; rendering them as surface height was resolved
  2026-08-20.
- Isotropic sideways spread is a known simplification: a cell flows into all
  open side neighbours at once, so a flow reaching a ledge spills its fan
  equally to every open side. The reference engine's bounded directional search
  ("which way can I fall first" — water seeking out a hole in a specific
  direction) is not modelled. Open follow-up, tracked in TODO.md.
- ~~The sim clock is independent of `WorldTime` (the canonical 60 Hz clock the
  sky/cloud systems read): water keeps its own `WATER_STEP`/`waterAcc` slow
  clock in `main.ts`.~~ Resolved 2026-08-22 by **ADR 0011 — Simulation clocks**:
  `WorldTime.tick` is the canonical heartbeat and the water pulse strides it
  (every 30th tick).
- Performance: the 1000-update / 0.5 s budget keeps a cut-off body settling in
  ~1–2 s. The load path stays cheap: one settle run is capped at 2000 cell
  updates (~5–10 ms), and the two-pass settle took the 60-frame boot replay from
  2,463,202 cell updates (6.1 s of a 6.7 s wall) to ~10.7 k updates across the
  redesign lineage, pinned against the pre-fix floor of 1,231,601; walking runs
  at p95 ≈ 7 ms with zero frames over 25 ms (pre-fix p95 ≈ 80 ms, max ≈ 138 ms).
- Source water is immortal and the sea stands: the sea, natural cave lakes, and
  every spring left in place persist on their own forever; flow is not — it
  exists only while a source or an active fall still feeds it, and re-derives to
  air once cut off.
- A placed source is the only water the player can remove: covering a water body
  only seals the air around it — a live source keeps emitting its halo into
  whatever air is still open, and a placed body keeps re-healing its gaps until
  the player breaks its water blocks.
- Cave flicker caveat (carried from round 7): if any flicker remains in
  multi-depth cave water, the next suspect is the render layer — transparent
  water quads are not depth-sorted across chunk borders (a documented POC
  shortcut).
- No persistence: water state dies with its chunk on unload and is re-derived on
  reload (settling is idempotent, so a reloaded region is the same as its first
  load for unedited terrain).

## Superseded decisions

**Original design and defect fixes (#1–#4).** The 2026-08-16 design shipped a
spread/drain cellular automaton: water fell one cell per tick (source bit
carried); settled water on solid support (or level-7 water above) re-promoted to
an immortal source (a rule typical of voxel engines); spread decayed one level
per sideways step to a level-1 front at Manhattan radius 6; the only drain was a
fall out of the world; a string-keyed FIFO dirty queue ticked at 200 updates
every 5th frame (~12 ticks/s); on chunk load, settle seeded worldgen water as
level-7 sources per cell and relaxed to a guarded fixpoint. Live testing exposed
four defects, fixed in the same arc: (1) multi-second load stalls — a 60-frame
boot replay cost 2,463,202 `process()` calls, 6.1 s of a 6.7 s wall, dominated
by a world-edge self-re-enqueue loop (an edge spread re-enqueued its own cell,
so every ocean settle ran to the guard ceiling) → #1 cheap settle: two-pass
seeding (bulk write of all worldgen water to level-7 sources; enqueue only
trigger cells — a fall or a spread at seed time) + two spread guards (no write
into missing space — breaks the self-loop; never re-level a neighbour's pristine
worldgen water) → 358,734 processes (6.9× fewer), settle ~8.6× faster; (2) the
ocean spawning with multiple visible water levels, and (3) dry ocean
corners/edges — a settle of chunk A re-leveled/flooded sibling chunk B, but the
next settle's `touched.clear()` wiped B's re-mesh mark, leaving a stale
pre-flood mesh → #2/#3 `settle()` stops clearing `sim.touched`: touched marks
survive sibling settles, the frame-end drain is the sole consumer; (4) punching
into an under-ocean cave never raised a water column — no upward fill, only a
one-cell-per-tick trickle → #4 `equalize()`: a sea/lake-connected air pocket
(body > 512 cells with a level-7 surface by an up-first probe; pocket ≤ 8192
cells) bulk-filled to the body's surface level at settle and on player breaks
(instant connected vessels). The user then rejected #4's result — instant fill
of the entire cave is "wrong and bad", and equalize's bulk writes made a placed
block spawn several source rings — and it was reverted (re-scoped: faster cave
flooding must look like a gradual flow-in, a different design). The residual
"raised/stepped ocean" sections traced to a band-order defect — streaming loads
y-bands in arbitrary order, so a high band's settle destroyed its bottom water
through a hole that does not exist; the fix defers a settle whose low band is
not yet loaded, cascading it upward once the low band settles, and makes
`process()` refuse to fall into not-yet-generated space.

**Round 3 — frame-time stutters + persistent waterfalls.** The user's round-3
re-test: walking still stutters, and falling water reads as a migrating drop —
water must hold a persistent falling column and spread where it lands. Stutter
was measured (a moving-camera replay over open ocean: walking p95 ≈ 80 ms, max ≈
138 ms against a 16.7 ms frame budget): a freshly streamed-in chunk's settle ran
its full 20,000-update guard in one frame (~80 ms, the biggest offender) →
`SETTLE_GUARD` lowered to 2000 (~5–10 ms; the saturated remainder relaxes over
later slow-clock pulses); the 2+2 streaming load/remesh budgets walked the rest
of the heavy frames → dropped to 1 chunk per frame; and the settle seed pass and
the mesher both paid a string-keyed chunk lookup per neighbour cell → both now
read in-chunk neighbours straight from the chunk's own arrays. Result: walking
p95 ≈ 7 ms, max ≈ 22 ms, zero frames over 25 ms. Waterfalls: a water cell with
air below and water above or beside it became a head — it stays put and pours
flow down through the gap each pulse, so a falling stream is a persistent
column; a cell that just dropped was skipped for the rest of the pulse and
re-queued at the next pulse's start, so a column dropped as a rigid body one
level per pulse instead of teleporting to the ground. The re-queue was
load-bearing: an early draft let a skipped fall cell consume its queue token
without re-enqueueing, and columns froze in mid-air forever (starve cascades
stalled; the load replay spiked back to 2.46 M processes) — the re-queue fixed
all three at once.

**Round 4 — water model split: sources vs flow + reachability, slow clock.** The
user rejected the remaining water model outright — four complaints: a punched
cave should not fill the whole cave instantly; covering a flooded hole should
make the water go away; placing a water block should create exactly one source,
not a diamond of them; flow water should be distinguishable from source water.
Root cause of the first three: the sim re-promoted any settled water to an
immortal source (a rule typical of voxel engines — documented, but wrong for
this user's model), and falling water carried its source bit, so the sea itself
(all re-seeded sources) left immortal sources anywhere it poured. New model:
sources are created only by placing a water block; water that falls lands as
flow; levels a cosmetic constant 7 (no decay → resting water a zero-work
fixpoint); spread unlimited — water floods everywhere it can connect (terrain
and reachability bound it, not level decay: a breached cave fills fully, "place
on a hill" fills everything downstream); flow is sustained (a new per-cell
`wflow` flag) while 6-neighbour reachability reaches a source; after any
water-removing edit `runAudit()` re-derives the flags globally (BFS from all
sources through water) and starves unreachable flow at the slow-clock pace (one
cell per update) — plug a hole and the cave drains itself, cell by cell; break
the plug and it refills. The water clock moved from a tick every 5th frame to
one pulse per 0.5 s (250 updates): placement/drain visibly take time and
per-frame sim cost is ≈ zero (the user asked for exactly this, noting it should
also help performance). The flow-vs-source distinction is in state (`wsource`),
but the mesher still renders both identically — distinct flow-water visuals
deferred.

**Round 5 — springs vs static sea.** The user's re-test after round 4: (a) a
waterfall flowing down a cave face then fills the cave — wanted "flowing" water
that adds no sources; (b) a placed source in a basin/walled area keeps creating
more source blocks / water piles up; (c) placing a source high on the shore
raised the ocean to the source's level. Root cause for all three: worldgen water
was re-seeded as an eternal spreading source at settle, so the settled sea
pushed sideways forever — across seams into caves, over pool surfaces (flow over
water spread sideways and climbed), and up to any high placed level. Fix,
approved by the user before implementation: split the world by provenance, not
by level. Placed water is the only true spring (`wplaced`, set by `edit(Water)`,
cleared for any other block): immortal, and the only kind that spreads to air at
rest — a spring in a sealed basin pours flow in but the basin does not climb.
Worldgen water is static: settle still re-seeds it as level-7 sources (bulk
pass, one settle per chunk load) so falls are handled in the load path, but a
static source never spreads — the sea no longer floods caves through a breach
(it pours down — see streams) and no placed block can raise its level. New
stream cells (`wstream`): flow that rests on a stream cell, or on a shallow
sheet (water one deep over solid), becomes a stream cell — visible, never
spreads, starves with its body. Flow over anything deeper (deep pool/sea)
vanishes: a falls-to-sea pour is lost at the surface, so no water body's level
ever rises (kills (a)/(b)/(c) at the root) — basins hold a floor sheet, caves
take a stream + floor pool.

**Round 6 — level decay + eternal springs.** Two new bugs: (A) water placed on a
hill fanned out far at the source height — wanted at most ~5–6 blocks out, and
water should prefer to run down a block rather than keep spreading sideways
(round 4's "no levels: unlimited range" — a design choice — was now backfiring
on hillside placement); (B) a source placed in a cave wall (under the ocean,
air-filled) dropped once and disappeared — the "lone unfed source falls" rule
applied to placed water too, and a falling source becomes flow, which then
starves (no source reached). Fixes, both user-approved semantics: level decay
restored for sideways flow — `wlevel` is a real decay number again (still
render-cosmetic at the time): a fresh start is level 7; a cell spreads to Air
sideways only at level ≥ 2, writing the neighbour at level − 1 — a spring's
flood is a ~6-block fan (85 cells on an open pad); any fall (pour or drop)
resets the parcel to 7, so water always runs down a slope first, ledge by ledge.
Placed springs never fall: a `wplaced` source with air below pours
unconditionally (no fed check) and is re-queued at every slow-clock pulse via a
`springs` set maintained by `edit()` (lazy-dropped when the cell stops being a
placed spring — chunk evicted, or the player removed it) — a sky spring or a
wall spring is an eternal emitter until mined out; removing one lets the water
it fed starve away. Static worldgen sources keep the old behaviour: fed → pour,
lone unfed drip → fall.

**Round 7 — instant falls + three fixes.** Symptom: water in caves "flickered"
while it dropped over tall heights. Probing showed the steady-state CA was
already a fixpoint (zero voxel changes per settled pulse) — the flicker was the
fill-in transient of the one-level-per-pulse fall: a 10-block cave fall took 5 s
of a visibly migrating/blinking drop, and the world-edge case re-dripped one
cell out of the void every pulse. Fix — the principle that water spreads
downward indefinitely into nearby air until stopped by a block, and the
falling-drip look is a cosmetic animation over already-settled voxels: a fall
now writes the whole column in one deterministic two-pass — pass 1 classifies
the landing (solid / sheet / deep / world floor / not-yet-generated edge /
already-connected); pass 2 writes every cell of the column at level 7 with final
flags in place — a sheet + riding shaft over solid or the world floor, a join
over a one-deep pool sheet or stream, an absorb one block above the surface over
anything deeper (no blink, no level rise), a stop at the band edge over
not-yet-generated space (per-pulse wait-recheck). The world floor is solid (no
per-pulse drain blink — a world-edge spring is a stable fountain whose column
lands and fans out on the y=0 plane). The one-step-per-pulse pacing (`inPulse`
gate + `falling` re-queue) is gone: a column's first processing is a no-op
fixpoint and a settled waterfall is exactly at rest. Three fixes on the user's
final re-test (cut flow "kept moving and flickering" and never stopped — sources
broken over the sea left flow above the sea surface), all in `src/water.ts`: (1)
falling flow that landed on a source surface had been adopted into the source
body — immortal `s=1` cells above the sea / cave lakes that never dried; it now
rides the source surface (a rider, never a source) and dries with its feed; (2)
the `S . S` heal rule fused two separate placed sources into a phantom
regenerated spring the player never broke (an eternal emitter) — healing now
only fills one-cell holes that are part of a body; (3) at the old slow-clock
budget (250 updates / 0.5 s pulse) the re-stabilization cascade crawled for
seconds, visibly re-expanding before draining — the budget is now 1000, so a
cut-off body settles in ~1–2 s (a handful of pulses).
