# Water Flow + Drain + Cave-Fix — Design

Date: 2026-08-16 · Follows the static-water POC; implements the deferred PROJECT.md §9 flow sim

## Context

Two problems, one system:

1. **Caves are fully submerged.** `generateChunkTerrain` carves stone/dirt at
   `caveAt > 0.55 && wy <= SEA_LEVEL` to `Block.Water`, so every underwater
   cave is a solid water blob — no air pockets, no "cave" feel.
2. **Water is inert.** Break a seafloor block and the hole stays dry under a
   water column; break the source of a hand-placed pool and the pool floats
   forever. PROJECT.md §9 sketches the intended sim (0–7 levels, dirty-cell
   queue, slower clock, ~200 updates/tick) and defers it as a POC shortcut.

User decisions (brainstorming, 2026-08-16):

- **All water is dynamic** — generated ocean and player-placed water share one
  code path. Break the seafloor: water falls in. Dig under a lake: it floods.
- **Full draining** — remove a source (or sever the flow chain) and the
  connected flow dries within a second or two.
- **Caves flood where water can physically reach, with air pockets** (typical voxel engines-like):
  a cave touching the sea fills from the opening and keeps trapped air; a
  sealed cave stays dry. No special "cave air" state.
- **Settle standing water on chunk load, then tick flows in time** — the
  on-load pass is the POC form of worldgen fluid settling: a
  freshly loaded chunk shows caves already filled (no visible in-view
  flooding); runtime ticks handle edits, waterfalls, and leaks.

## Data model

Two parallel per-chunk arrays ride alongside `Chunk.blocks` (world.ts):

- `wlevel: Uint8Array(CHUNK_VOL)` — flow level. `0` = dry (no water);
  `1..7` = water. **7 = full** (PROJECT.md convention: "a source block is
  level 7", spread happens at `level - 1`, stops at 0 — in the POC the
  level-0 terminus block is never materialized; a level-1 cell is the flow
  front and does not fill further, a documented deviation below).
- `wsource: Uint8Array(CHUNK_VOL)` — 0/1, this cell is a source (level is
  read as 7, never dries while its block is Water). The source bit is
  **carried when water falls** (a player-placed source that falls off a
  ledge lands as a source at the bottom of its pool, so the stream persists
  and breaks are meaningful; typical voxel engines keep block state through falls the same
  way).

Invariants (strict):

- `block == Water  ⇔  wlevel >= 1 || wsource == 1`.
- Any write that makes a cell stop being water clears both `wlevel` (→ 0)
  and `wsource` (→ 0); any write that makes a cell water sets `wlevel >= 1`
  (or the source bit). No `wlevel == 0, wsource == 0 + Water` state exists.
- Level affects **dynamics only, not rendering**: all water still meshes as a
  full transparent block (the mesher's `nb === b` water/water cull and the
  single-material water look are unchanged). POC simplification, same as POC
  §9: no per-level surface height in the mesh.

State lives in the chunk, so it streams with the chunk: a missing neighbour
chunk offers no water state (reads as dry) and is not a spread escape (a
spreading cell simply stops at the face of ungenerated space); a *falling*
cell whose destination is missing/out-of-band is destroyed (same treatment
as a player falling out of the world); and unloading a chunk drops its
water state with it.

## Terrain fix (terrain.ts)

- Cave carve becomes `c.blocks[i] = Block.Air` (was `Water`). Carve condition
  unchanged (`stone/dirt && wy <= SEA_LEVEL && caveAt > 0.55`) — caves still
  only exist below sea level, matching today's generation; above-sea-level
  caves are out of scope. Cave flooding then comes entirely from the sim.
- The pinned mulberry32 comment and the exact water-count pin
  (`expect(water).toBe(45395)`) go stale: every carved underwater-cave cell
  leaves `blocks` as Air instead of Water, so the count drops by the number
  of carved cave cells in the -2..2 test region. Re-measure and re-pin
  (expect `45395 − carvedCaveCells`); update the comment in `terrain.ts` and
  the reference in the 2026-08-15 execution-notes doc. All other terrain
  tests are unaffected (the surface-column test only constrains
  `wy > SEA_LEVEL` rows, which never carve).

## Simulation (new file `src/water.ts`)

`class WaterSim` wraps the `World`. All writes to `blocks` go through
`world.setBlock` (which already marks the touched chunk + 6 face-neighbours
`dirty` for the mesher); the sim additionally maintains `wlevel`/`wsource`
and a global dirty-cell queue. Pure TS, no three — unit-testable like the
streaming module.

### Queue

- `queue: Set<number>`, key = packed int
  `((wx + 2^20) << 26) | ((wz + 2^20) << 13) | (wy + 32)` (|wx|,|wz| < 2^20,
  wy in [-32, 2^12-32); out-of-range coordinates are simply not markable —
  they can't hold state anyway). Set insertion order gives a stable,
  deterministic FIFO-with-dedup, so tests can reason about tick order.
- `dirty(wx,wy,wz)` adds the key; no chunk lookup at mark time (a mark for a
  missing chunk becomes a no-op at tick time).
- When a cell's water state **changes** (wet↔dry transition, level change
  on a wet cell, or a fall destination receiving water) the sim marks: the
  cell, its 4 horizontal neighbours, and the cell **above** it (water above
  may need to fall into the new air, re-spread, or — if the cell just
  dried — fall into it). A cell *below* is never re-marked from a change
  above it: a resting cell's level is a function of its horizontal
  neighbours and the cell above (its below only decides fall-vs-rest, and
  a changing below re-triggers the cell above it via this rule). A
  falling cell additionally marks its destination (below) explicitly.

### Tick rules

One "update" = processing one queued cell. Per water cell C (L = level,
src = wsource), in queue order:

1. **Not water** → nothing to do; return. (When C dried, its neighbours and
   the cell above were already marked, so dependents get re-evaluated.)
2. **below(C) is air** (missing chunk / out-of-band included) → C
   **falls**: C becomes dry (block → Air, clear state); the cell below
   (if it exists in-range) becomes water at level 7 with **source bit
   carried** (`wsource := wsource(C)`); if the cell below is
   out-of-band/missing the water is destroyed (falls out of the world).
   Mark the origin cell (now dry), the moved cell, each of their 4
   horizontal neighbours, and the cell above each (change rules). Falling
   1 cell/tick is what makes waterfalls read as streams at the ~12 ticks/s
   clock. A *source* falls the same way and stays a source (a placed
   source at the top of a stream lands in the pool and keeps the stream
   fed until the landed block is broken).
3. **below(C) is solid or water** (C is *resting*):
   - **src** → L := 7.
   - Else `aboveIsWater` = the cell above C holds water at level ≥ 1 →
     L := 7. (The "above is water" hold-7 rule keeps a landed column fed
     full end-to-end, typical voxel engines-style: every cell of a falling/standing stream
     has water above it, so the whole stream + the pool beneath read as
     full.)
   - Else `best` = max over C's 4 horizontal neighbours M that hold water
     at level ≥ 1 of `(level(M) − 1)`, or −1 if none; `L := best`.
   - If `L < 1` → C **dries** (block → Air, clear `wlevel`/`wsource`).
     (A source cell can only reach this via its block having changed —
     rule 2 keeps a live source pinned at 7.)
   - **Spread**: if `L >= 2`, for each of C's 4 horizontal neighbours M
     in a *loaded* chunk: if M is Air → M becomes non-source water at
     level `L − 1` (dirty M); if M is non-source water and `L − 1 >
     level(M)` → raise `level(M)` to `L − 1` (dirty M). A missing
     neighbour chunk is *not* an escape — water cannot spread into
     ungenerated space (it is only destroyed while *falling* out of the
     world). Water at level 1 does not fill neighbours (flow "stops at
     level 0" — the level-0 terminus block is not materialized).

Consequences this buys (all user-accepted behaviour):

- **Spreading**: a source at level 7 fills a ring to level 1 at Manhattan
  distance 6 (the POC form of the typical voxel-engine 7-block reach, which includes a
  level-0 terminus block we do not materialize); the level-1 front is the
  terminus.
- **Draining**: sever the chain and levels decay one ring per tick
  (~0.1 s per ring): the stream collapses top-down (the top cell loses
  its `aboveIsWater` support first), a level-1 front cell dries the tick
  its level-2 feeder drops to 1, a uniform full pool decays 7→1 in a
  tick and dries one tick after. No re-promotion to source (a typical voxel engines
  deviation, accepted): the user asked that removing a source dry the
  connected flow, whereas typical voxel engines would re-promote trapped full water and leave
  a rimmed pool full forever.
- **All-water dynamic**: generated ocean water is seeded (at settle) as
  level-7 sources, so a broken seafloor cell fills by fall, and an
  underwater tunnel dug toward the sea floods from the sea to within
  typical voxel engines's reach (level-1 front at 6 POC) — deeper/distant cave branches
  stay air, the user-accepted minority case.

### Clock & budget

- Ticks on a slower clock than physics: main.ts calls `sim.tick(200)` every
  5th render frame (~12 water ticks/s at 60 fps, per PROJECT.md §9).
- `tick(budget)` processes at most `budget` queued cells; the remainder of
  the queue persists into later ticks. Edits and settle keep the queue
  short, so normal play sees effects on the same frame they happen (queue
  drains in ≤ 1–2 ticks for local edits).

### Settle (on chunk load)

- After `generateChunkTerrain` fills a brand-new chunk: seed it — every
  cell whose block is Water becomes `wlevel = 7, wsource = 1` (the
  generated ocean — a brand-new chunk can only contain worldgen water, so
  "any player water in this chunk" is empty by construction). Player edits
  to a chunk after load go through the normal tick path, not settling.
- Mark all wet cells of the chunk plus a 1-cell ring on faces touching
  already-loaded chunks, then run `tick(∞)`-style relaxation — drain the
  queue until empty, with an iteration guard (queue-size iterations, cap
  ~20 000) as a safety valve. Falling columns bulk-settle within the guard:
  each column's front is one queued cell per relaxation pass, so a 70-deep
  sea-cave column settles in ~70 passes.
- Effect: newly loaded chunks show sea-caves **already filled to their
  resting level with trapped air pockets**, sealed caves dry — the user's
  "standing in place on load, then flow ticks in" behaviour. Worst-case
  settle cost is a few thousand cell updates (≈ low ms), one-time per chunk.
- Settle is triggered per chunk via a `Chunk.settled` flag (added to
  world.ts): main.ts settles each `rebuilt` chunk whose flag is false (a
  pure re-mesh skip is a flag-set no-op), then sets the flag. The initial
  spawn column generated at boot is settled by the first `tickStreaming`,
  before the first render → no visible pop.
- Settle is idempotent: settling an already-settled chunk over a stable
  region is a no-op (everything already satisfies the rules).

## Chunk-boundary & streaming rules

- Neighbour reads: missing chunk = no water (levels treated as dry for the
  above/level rules) and no spread escape (treated like solid for the
  spread step); only a *falling* cell whose destination is missing /
  out-of-band is destroyed. The sim never needs the neighbour's level array
  beyond `blocks` + its own arrays, so cross-chunk reads are exactly
  `world.getBlock` + the neighbour chunk's `wlevel`/`wsource` (via a small
  `sim.cellState(wx,wy,wz)` helper that treats missing chunks as dry).
  Cross-chunk *writes* (a spread/fall landing in a loaded neighbour) go
  through the same `world.setBlock` + neighbour-array path.
- Load: the 1-cell neighbour ring dirty-marked at settle covers culling
  staleness; existing streaming `markNeighborsDirty` already handles the
  mesher side.
- Unload: nothing to do — state lives in the chunk; the existing
  mark-neighbours-dirty + remesh covers exposed faces (block data is
  unchanged by unloading, so water meshes don't need re-meshing).
- A chunk whose water was fed by a *later-unloaded* neighbour: the
  boundary cell now sees no water level from that neighbour; if it was
  resting on it (via the above/level rules it only depends on horizontal +
  above), it relaxes on the next tick and either dries or holds at its
  neighbour-driven level — no crash, no stuck-full cell. On reload the
  neighbour re-settles and re-feeds it (settling is idempotent, so the
  converged state is the same as if the chunk had never unloaded).

## Edits (main.ts hooks)

In `onMouseDown`, after a successful `world.setBlock` (i.e. the returned
flag is true):

- **Break** (LMB, new block Air): `sim.edit(x, y, z, Block.Air)` — clears
  the cell's water state (this is the "source removed" / "support removed"
  entry point), marks cell + horizontal neighbours + above.
- **Place** (RMB): `sim.edit(x, y, z, hotbar.block)` — if the new block is
  Water, set `wlevel = 7, wsource = 1` (placed water is a source); if not,
  clear the cell's water state (filling a pool cell with stone dries that
  cell only — surrounding water re-relaxes around it on the next tick,
  exactly as typical voxel engines behave for a block dropped into water).

`remeshAround` still runs immediately for the edited cell (existing T8
path), so the player sees the edit on the same click; the sim-driven
re-mesh catches the propagated changes within 1–2 water ticks (main.ts
rebuilds any chunk the sim touched during a tick, same as T10 picks up
`dirty` chunks).

## Rendering / UX (unchanged, listed for completeness)

- Mesher: no change (water = full transparent block, `nb === b` cull
  unchanged).
- Raycast: water remains pass-through (can't target it, can place into
  it) — targeting and water edits are unaffected.
- Player: `headInWater`/`inWater` sample `world.getBlock`, so the T12
  underwater mood, swim physics, and sink-cap automatically follow dynamic
  water (swim through a newly-flooded tunnel the frame it fills).
- UI/hotbar: water stays placeable (source placement) — no change.

## Files touched

| File | Change |
|---|---|
| `src/terrain.ts` | cave carve → `Block.Air`; update the pinned-variant comment (45395 reference) after re-measure |
| `src/world.ts` | `Chunk` gains `wlevel: Uint8Array`, `wsource: Uint8Array`, `settled: boolean` (initialized zero/false in `ensureChunk`) |
| `src/water.ts` | **new** — `WaterSim`: `cellState`, `dirty`, `tick(budget)`, `settle(world, cx, cy, cz)`, `edit(x, y, z, newBlock)`; packed-int queue key |
| `src/main.ts` | construct `WaterSim` after boot-world generation; settle newly-generated chunks in `tickStreaming` (flag-based); `sim.tick(200)` every 5th frame; call `sim.edit(...)` after the two `setBlock` call sites; rebuild chunks the sim touched in a tick |
| `src/__tests__/terrain.test.ts` | re-pin exact water count (45395 → re-measured after carve→Air fix) |
| `src/__tests__/water.test.ts` | **new** — see Verification |
| `PROJECT.md` | §9: de-defer the flow sim (now `src/water.ts`), note the POC model deviations (fall = move-down 1 cell/tick; source bit carried on fall (landed full = level-7 source or non-source); above-is-water → hold 7; flow front stops at a level-1 ring (level-0 terminus not materialized); missing chunks = no spread, falling water destroyed; no re-promotion to source; no persistence), update the pseudo-generator's cave line (145) to carve Air |
| `docs/superpowers/2026-08-15-voxel-sandbox-poc-execution-notes.md` | note the re-pinned water constant where it cites 45395 |

No changes to `blocks.ts`, `chunk-mesher.ts`, `raycast.ts`, `player.ts`,
`ui.ts`, `streaming.ts` (the settle trigger rides on the existing
`rebuilt` list + the per-chunk flag).

## Verification

1. `npm test` — all suites green. New `water.test.ts` drives `World` +
   `WaterSim` in node (pure TS), covering:
   - **Cave fix**: in a generated region, a cell the carve rule picks
     (stone column, `caveAt > 0.55`, `wy <= SEA_LEVEL`) is `Air`, not Water.
    - **Source spread radius**: a lone source in air (on a stone pad)
      settles to exactly the reach ring: level 7 center, level
      `7 − Manhattan distance` at distances 1–6, air everywhere at
      distance ≥ 7 (measured via `cellState`; include a diagonal probe,
      e.g. (1,1) → 6, (7,0) → air).
   - **Falling**: a water cell with air below moves down one cell per tick
     until it lands on a solid; a seafloor break (sim.edit Air under a
     generated sea column) is filled by water within a few ticks.
   - **Settle-on-load**: a hand-built 2-chunk seam with a sea-opening cave
     generates + settles so the cave holds water at rest with air above
     (no in-view flood); a sealed cave (air pocket with solid ceiling)
     holds air after settle; re-settling is a no-op (arrays unchanged).
    - **Drain**: a pool (stone rim + placed source) ticks to a stable fill;
      `sim.edit` removing the source → all water is dry within a bounded
      tick count (queue empty, `blocks` check). A falling source: a source
      dropped under a ledge lands in the pool below with its source bit
      intact (`cellState` shows `wsource == 1` at the pool floor); breaking
      that landed block dries the stream *and* the pool.
    - **Chunk boundary**: a source on a chunk face spreads into the loaded
      neighbour chunk (water appears on the other side with the expected
      level); with the neighbour missing, spread stops at the face and
      falling water across the edge is destroyed, without crashing and
      with invariants preserved.
   - **Edit invariants**: placing Water via `sim.edit` creates a source;
     placing Stone into a water cell clears that cell's water state;
     invariants (`block == Water ⇔ wet`) hold after a scripted edit script.
2. `npm run build` — `tsc --noEmit` clean + vite build succeeds.
3. `npm run dev` manual pass:
   - spawn area (x≈6, z≈46): ocean water renders as before; no cave-blob
     water visible when approaching an underwater cliff (caves read as dark
     air pockets, partially flooded where they open to the sea).
    - break a sand block on the seafloor: a falling stream fills the hole
      top-down within ~2 s; the hole's water is swim-through (mood swap
      under it).
    - place water on a high ledge: it falls as a stream and settles at the
      base; break the landed source block at the pool (the placed source
      falls with the stream and stays a source) and the stream + pool dry
      within a couple of seconds.
    - dig a tunnel down through the seafloor: the tunnel floods from above
      (falling water), and breaking the source block upstream lets it drain.
    - swim through a flooded cave: air pockets visible above the water, mood
      swap works in and out.
4. Wireframe check (`C`): no water quads left behind dried cells (the
   sim's setBlock-driven dirty flags catch the re-mesh; the T10 streaming
   scan is the backstop).

Commit style: `feat: water flow + draining + cave air (src/water.ts)` —
post-POC feature, no T-number (consistent with the help-overlay commit).

## POC deviations from typical voxel engines (accepted, documented)

- **Falling** is "move down 1 cell/tick" with no separate falling state; a
  landed full cell is `level 7` with the source bit it had when it fell
  (the POC carries block state through falls, as typical voxel engines do). Typical voxel engines track
  falling as a block *state* with bottom-up drain of the column; the POC
  drags the whole chain top-down via the level-relaxation cascade —
  visually equivalent within the ~2 s drain window.
- **Flow reach**: level = 7 − path length to a source, with falls and the
  above-is-water rule resetting to 7. The level-0 terminus block typical voxel engines
  materialize at distance 7 is never stored (levels are 1–7 only), so a
  source wets a Manhattan radius of 6 instead of 7 — at most a 1-block
  edge difference, invisible since levels don't render. Vertical-drop level
  bookkeeping (waterfall distance resetting flow length) is not modelled —
  a long waterfall feeds its pool as if short. Fine at POC scale.
- **No re-promotion to source**: in typical voxel engines, non-source water that is trapped
  (full below, no air escape) becomes a source block, so a stone-rimmed
  pool stays full forever even after its source is broken. The POC drains
  it instead (level decays to < 1 → air) — the user-requested behaviour.
- **No persistence**: water state dies with its chunk on unload and is
  re-derived by settling on reload (settling is idempotent, so a reloaded
  region is byte-identical to its first load for unedited terrain).
- **Missing chunks stop spread**: water cannot spread into ungenerated
  space (reads as no-escape, like solid); only a *falling* cell whose
  destination is out-of-band/missing is destroyed (falls out of the world).
  This keeps the sea edge at the streaming boundary stable while the
  player moves.
- **Levels don't affect rendering**: every water cell is a full transparent
  block regardless of level 1–7.

## Open questions (resolved during design)

- *Do caves need an "immune" flag to stay air?* No — the user accepted
  typical voxel-engine physical flooding (caves fill where the sea can reach, air
  pockets persist), so caves are plain Air and the sim decides everything.
- *Settle at generation or at first load?* At load: a bounded relaxation
  run after terrain generation (the `settled` flag), so the settle sees the
  exact final blocks and neighbouring settled chunks — the typical voxel-engine "standing in
  place on load" behaviour, one-time cost.