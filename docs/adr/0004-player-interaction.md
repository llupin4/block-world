# 0004. Player & interaction — AABB physics with axis-separated bisection collision, pointer-lock YXZ camera, and a DDA voxel raycast driving LMB break / RMB place

- **Status:** Accepted
- **Last updated:** 2026-08-20
- **Sources:** (superseded by this ADR; recoverable via `git show 0cf878c:<path>`)
  - `docs/superpowers/plans/2026-08-15-voxel-sandbox-poc.md` (Task 7 — player, Task 8 — raycast/break/place)
  - `PROJECT.md` (§7 Voxel raycast, §8 Player controller)
  - `docs/superpowers/2026-08-15-voxel-sandbox-poc-execution-notes.md` (deviation D3)

## Context

The sandbox needs a first-person body that can walk, swim, fly, and debug its way through terrain, plus a reliable way to target individual voxels for breaking and placing. Two constraints shaped the design:

- The whole physics model must be **node-testable** without a DOM or WebGL, so it cannot depend on `three` (no `Vector3`, no `Raycaster`).
- Block targeting must return the **voxel coordinate and the face entered**, not a mesh triangle hit — `THREE.Raycaster` tests triangles, gives back a point but not the voxel, and degrades as chunk geometry grows.

## Decision

### Player controller (`src/player.ts`)

A pure-TypeScript `Player` class (no `three` import) whose position is the **feet** of an AABB body: half-width `HALF = 0.3` on x/z, `HEIGHT = 1.8` feet-to-head, eye at `EYE = 1.62` above the feet.

**Constants.** `WALK_SPEED = 5.6` m/s, `SWIM_SPEED = 3.0` m/s (horizontal in water), `FLY_SPEED = 13.0`, `FLY_V_SPEED = 8.0`, `GRAVITY = 28` m/s² (applied in air *and* water — water then clamps), `JUMP_VEL = 9.5` (apex ≈ 1.6 m). Collision uses `EPS = 1e-7` to keep a box sitting exactly on a voxel boundary from "touching" the next voxel, and `BISECT_ITER = 24` bisection iterations for the snap.

**Collision.** Each axis move is tested whole; if it collides, 24 bisection iterations find the farthest proven-free fraction along that axis, so the player stops flush with walls and floors instead of sticking or clipping (a ~10 cm/step move resolves to ~6 nm). Solid = `isOpaque(getBlock)` over the voxels the body AABB overlaps. Axis order is x, z, then y; a blocked vertical move zeroes `vel.y` (floor or ceiling).

**Movement modes.**
- *Walk/jump:* horizontal velocity is set directly each step (no acceleration/inertia for the POC); `onGround` latches at step end (probe at `y − 0.02`) and is read at the top of the next step for the jump test — the standard pattern that makes jumping work right after landing.
- *Swim:* gravity still applies but water clamps fall speed to `−SWIM_SPEED × 0.6` (no free-fall) and SPACE rises at net +2 m/s² up to `SWIM_SPEED`. `inWater` is true when any body voxel is water; `headInWater` is true when the eye voxel is water.
- *Fly (F toggle):* gravity off, SPACE up / SHIFT down at `FLY_V_SPEED`, horizontal at `FLY_SPEED`.
- *Noclip (N toggle):* free movement — no gravity, no collision — used to escape spawning inside terrain.

**Camera.** Pointer Lock API; `mousemove` deltas accumulate yaw/pitch, pitch clamped to ±(π/2 − 0.01) so it never gimbals. Camera rotation order is **YXZ** (yaw then pitch) — the order that keeps "up" stable while looking around. Yaw 0 faces −Z; `forward = (−sin yaw, 0, −cos yaw)`, `right = (cos yaw, 0, −sin yaw)`. The camera sits at `pos.y + EYE`.

**Fixed timestep.** Physics steps at a fixed `STEP = 1/60` with an accumulator in the main loop (frame dt clamped to 0.1). Variable-dt collision tunnels at low framerates, which shows up the moment a chunk batch loads.

### Voxel raycast (`src/raycast.ts`)

DDA (Amanatides & Woo) ray-march through the integer lattice: one iteration enters the next voxel through the nearest grid plane, so oblique rays don't tunnel through thin geometry. `Math.abs(1 / dir.x)` is `Infinity` when `dir.x === 0`, so a parallel axis is never stepped (IEEE-754 does the special-casing). `dir` is normalized so the parametric `t` is meters. Reach is `REACH = 6` m.

- **Target = breakable solid:** the ray stops only on `b !== Air && b !== Water`. Water is pass-through, so you can target through pools, and a water cell is never the hit cell (water can't be broken). Placing *into* a water cell is allowed, so pools can be filled in.
- **Return shape:** `{ x, y, z, nx, ny, nz }` — the hit voxel plus the unit face normal entered from (or `0,0,0` when the origin voxel itself is solid). The normal is the negated step direction: it points back toward where the ray came from, i.e. the face being looked at and where a placed block goes.

### Break / place interaction

Actions are event-driven: `mousedown` (LMB = break, RMB = place) and `contextmenu` handlers attach to `document` **only while the pointer is locked**, so the click that requests the lock and any later UI click can never mutate the world. The per-frame part is a single `updateHitbox()` after `syncCamera()`, so the ray starts from the just-synced eye position.

- **Break (LMB):** `setBlock(hit, Air)`.
- **Place (RMB):** on the face being looked at (`hit + normal`), guarded in order: target y inside `[WORLD_Y_MIN, WORLD_Y_MAX)`; target cell is Air or Water (Water ⇒ fill the pool); and the placed block must not overlap the player's AABB unless `player.noclip` (via `Player.intersectsVoxel`). RMB precedence with special blocks (torch/door toggle) is owned by ADR 0009 — Special blocks.
- **`remeshAround`:** an edit at `(x,y,z)` rebuilds the cell's chunk mesh and, when the cell sits on a chunk face, the touched neighbour's mesh (guarded by `hasChunk`). `World.setBlock` only marks data dirty; the remesh is driven explicitly here (cross-ref ADR 0002 — World model & terrain).
- **Hitbox:** a white `LineSegments` around an `EdgesGeometry` box sized 1.002³ (tiny overhang avoids z-fighting the target face); visible only while locked and while the ray hits.

## Alternatives considered

- **`THREE.Raycaster` for targeting** — rejected: it tests triangles, returns a mesh point rather than the voxel coordinate, and gets slow as chunks grow (PROJECT.md §7).
- **Stepped sampler raycast** — rejected: stepping a fixed distance per sample tunnels through thin geometry on oblique rays; DDA is exact.
- **Acceleration/inertia horizontal movement** — deferred: direct per-step velocity is simpler and sufficient for the POC feel.

## Consequences

- The physics model is fully node-testable (plain `{x,y,z}` positions, injected `getBlock`), which is why the player suite runs under vitest with no DOM.
- `intersectsVoxel` and `headInWater` ship with the player even though their consumers (the place-guard, the underwater mood) land later — `headInWater` was consumed by the POC's static underwater FX, since superseded by the time-driven moods of ADR 0008 — Sky & day/night.
- Known limit: swim behaviour is only the gravity/speed clamp above — buoyancy bob, underwater particles, and drag trails are an open follow-up, tracked in TODO.md.

## Deviations & execution notes

- **D3 — raycast signature widened.** The plan specified `raycastVoxel(world: World, …)`; the implementation widens the first parameter to `{ getBlock(x,y,z) } | ((x,y,z) => number)`. This lets the same DDA run against ad-hoc `getBlock` functions (tests) without constructing a `World`; zero behaviour change.