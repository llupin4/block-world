# Browser Voxel Sandbox — POC Plan

A minimal block building voxel engine simulation in the browser: fly around, break and place blocks, procedurally generated terrain, hotbar, basic water.

**Scope note:** this is a proof of concept. Where there's a tradeoff between "correct/fast" and "working this week," this plan picks working. Places where the shortcut will eventually hurt are flagged as **[POC shortcut]** so you know what you're deferring.

---

## 1. Stack

| Piece | Choice | Why |
|---|---|---|
| Renderer | Three.js | WebGL boilerplate, camera, scene graph. Doesn't hide `BufferGeometry`, which you need. |
| Build | Vite + TypeScript | Instant HMR, zero config. TS pays for itself the moment you start indexing flat arrays. |
| Noise | `simplex-noise` | Small, fast, seedable. |
| Physics | None — hand-rolled | Voxel AABB collision is ~100 lines. A general engine will fight the grid. |
| UI | Plain DOM overlay | Flexbox and hover states for free. Do not draw the hotbar in-canvas. |

```bash
npm create vite@latest voxel -- --template vanilla-ts
cd voxel && npm i three simplex-noise
npm i -D @types/three
```

**[POC shortcut]** Everything runs on the main thread. No Web Workers. Generation and meshing will hitch when chunks load — acceptable at small render distance, and moving to workers later is a mechanical refactor since both are already pure functions over buffers.

---

## 2. Core constants

Pick these once and never deviate. Most voxel bugs are indexing bugs.

```ts
export const CHUNK_SIZE = 16;        // cubic chunks, 16³
export const CHUNK_VOL  = 4096;      // 16 * 16 * 16
export const WORLD_MIN_Y = -2;       // in chunk units
export const WORLD_MAX_Y = 4;        // → world height 96 blocks
export const SEA_LEVEL  = 32;
export const RENDER_DIST = 6;        // chunks, horizontal

// Index order: x + z*16 + y*256  (y-major, so vertical columns are strided)
export const idx = (x: number, y: number, z: number) => x + z * 16 + y * 256;
```

Cubic chunks over tall `16×16×256` columns: cheaper remesh on a single block edit, cheaper frustum culling, and vertical culling actually works.

---

## 3. Block registry

```ts
export const enum Block {
  Air = 0, Stone, Dirt, Grass, Sand, Water, Wood, Leaves, Glass, Planks,
}

interface BlockDef {
  name: string;
  solid: boolean;        // collides with player
  transparent: boolean;  // rendered in transparent pass
  faces: [number, number, number, number, number, number]; // atlas tile per +X,-X,+Y,-Y,+Z,-Z
}

export const BLOCKS: Record<Block, BlockDef> = { /* ... */ };

export const isOpaque = (b: Block) => b !== Block.Air && !BLOCKS[b].transparent;
```

Two flags, not one. `Air` is transparent and non-solid; `Water` is transparent and non-solid; `Glass` is transparent and solid; `Leaves` is transparent and solid. Conflating them causes the classic "can't walk through leaves but can walk through glass" bug.

---

## 4. World representation

```ts
class Chunk {
  blocks = new Uint16Array(CHUNK_VOL);   // block IDs, 0 = air
  dirty = true;                          // needs remesh
  opaqueMesh: THREE.Mesh | null = null;
  transMesh: THREE.Mesh | null = null;
  constructor(public cx: number, public cy: number, public cz: number) {}
}

class World {
  chunks = new Map<string, Chunk>();     // key: `${cx},${cy},${cz}`

  getBlock(x: number, y: number, z: number): Block {
    const c = this.chunks.get(key(x >> 4, y >> 4, z >> 4));
    if (!c) return Block.Air;
    return c.blocks[idx(x & 15, y & 15, z & 15)];
  }

  setBlock(x: number, y: number, z: number, b: Block) {
    const cx = x >> 4, cy = y >> 4, cz = z >> 4;
    const c = this.chunks.get(key(cx, cy, cz));
    if (!c) return;
    c.blocks[idx(x & 15, y & 15, z & 15)] = b;
    c.dirty = true;
    // border edit → neighbor's culling changes too
    for (const [dx, dy, dz] of NEIGHBOR_OFFSETS) {
      const n = this.chunks.get(key(cx + dx, cy + dy, cz + dz));
      if (n) n.dirty = true;
    }
  }
}
```

`>> 4` and `& 15` handle negative coordinates correctly; `Math.floor(x / 16)` and `x % 16` do not. This is worth internalizing early — `-1 >> 4 === -1` and `-1 & 15 === 15`, which is exactly what you want.

**[POC shortcut]** `setBlock` marks all 6 neighbors dirty rather than only the one actually affected. Costs a few wasted remeshes, saves a branch you'll get wrong.

---

## 5. Terrain generation

Runs once per chunk on creation. Pure function of `(seed, cx, cy, cz)` → `Uint16Array`.

```ts
function generateChunk(chunk: Chunk, noise2D, noise3D) {
  const baseX = chunk.cx * 16, baseY = chunk.cy * 16, baseZ = chunk.cz * 16;

  for (let lx = 0; lx < 16; lx++) {
    for (let lz = 0; lz < 16; lz++) {
      const wx = baseX + lx, wz = baseZ + lz;

      // multi-octave heightmap
      let h = 0, amp = 1, freq = 0.008, norm = 0;
      for (let o = 0; o < 4; o++) {
        h += noise2D(wx * freq, wz * freq) * amp;
        norm += amp; amp *= 0.5; freq *= 2;
      }
      const height = Math.floor(SEA_LEVEL + (h / norm) * 20);

      for (let ly = 0; ly < 16; ly++) {
        const wy = baseY + ly;
        let b = Block.Air;

        if (wy < height - 4)       b = Block.Stone;
        else if (wy < height)      b = Block.Dirt;
        else if (wy === height)    b = wy < SEA_LEVEL + 1 ? Block.Sand : Block.Grass;
        else if (wy <= SEA_LEVEL)  b = Block.Water;

        // caves: carve AIR where 3D noise crosses a threshold; the water sim (§9, src/water.ts)
        // floods caves from any sea-facing opening and leaves sealed caves dry
        if (b === Block.Stone || b === Block.Dirt) {
          const cave = noise3D(wx * 0.05, wy * 0.05, wz * 0.05);
          if (cave > 0.55) b = Block.Air;
        }

        chunk.blocks[idx(lx, ly, lz)] = b;
      }
    }
  }
}
```

Trees: a separate pass after terrain, seeded per-column so it's deterministic. Cross-chunk trunk overhang is a real problem — **[POC shortcut]** just reject tree placement within 3 blocks of a chunk edge. You'll see a faint grid pattern in forests. Nobody will notice in a POC.

---

## 6. Chunk meshing (reference implementation)

The single most important piece. **One mesh per chunk, not per block.** A 16³ chunk of solid stone is 4096 blocks but only 1536 visible faces on its shell — and interior faces should never be emitted at all.

Naive face culling: for each solid voxel, for each of 6 directions, emit a quad only if the neighbor in that direction is not opaque.

```ts
// Face definitions: normal, then 4 corner offsets in CCW winding when viewed from outside
const FACES = [
  { dir: [ 1, 0, 0], corners: [[1,0,1],[1,1,1],[1,1,0],[1,0,0]] }, // +X
  { dir: [-1, 0, 0], corners: [[0,0,0],[0,1,0],[0,1,1],[0,0,1]] }, // -X
  { dir: [ 0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] }, // +Y
  { dir: [ 0,-1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] }, // -Y
  { dir: [ 0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] }, // +Z
  { dir: [ 0, 0,-1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] }, // -Z
];

const ATLAS_COLS = 16;               // 16x16 grid of tiles
const T = 1 / ATLAS_COLS;

interface MeshData {
  positions: number[]; normals: number[]; uvs: number[];
  colors: number[];    // vertex AO baked as grayscale
  indices: number[];
}

function buildMesh(world: World, chunk: Chunk, transparentPass: boolean): MeshData {
  const m: MeshData = { positions: [], normals: [], uvs: [], colors: [], indices: [] };
  const baseX = chunk.cx * 16, baseY = chunk.cy * 16, baseZ = chunk.cz * 16;

  for (let ly = 0; ly < 16; ly++) {
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const b = chunk.blocks[idx(lx, ly, lz)] as Block;
        if (b === Block.Air) continue;

        const def = BLOCKS[b];
        if (def.transparent !== transparentPass) continue;

        const wx = baseX + lx, wy = baseY + ly, wz = baseZ + lz;

        for (let f = 0; f < 6; f++) {
          const { dir, corners } = FACES[f];
          const nb = world.getBlock(wx + dir[0], wy + dir[1], wz + dir[2]) as Block;

          // cull rule
          if (isOpaque(nb)) continue;                  // hidden by solid neighbor
          if (transparentPass && nb === b) continue;   // no internal water/glass seams

          const tile = def.faces[f];
          const u0 = (tile % ATLAS_COLS) * T;
          const v0 = Math.floor(tile / ATLAS_COLS) * T;
          const UV = [[u0, v0 + T], [u0 + T, v0 + T], [u0 + T, v0], [u0, v0]];

          const base = m.positions.length / 3;

          for (let i = 0; i < 4; i++) {
            const c = corners[i];
            m.positions.push(lx + c[0], ly + c[1], lz + c[2]);
            m.normals.push(dir[0], dir[1], dir[2]);
            m.uvs.push(UV[i][0], UV[i][1]);
            const ao = vertexAO(world, wx, wy, wz, dir, c);
            m.colors.push(ao, ao, ao);
          }

          m.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
    }
  }
  return m;
}
```

Vertex ambient occlusion — cheap, and it's most of what makes voxel terrain read as three-dimensional rather than as flat colored squares:

```ts
// For a face vertex, sample the 3 voxels touching that corner on the outside of the face.
function vertexAO(world: World, wx, wy, wz, dir: number[], corner: number[]): number {
  // Build the two tangent axes of this face
  const ax = dir[0] !== 0 ? 1 : 0;              // which axis is normal
  const t1 = ax === 0 ? [0,1,0] : [1,0,0];
  const t2 = ax === 1 ? [0,0,1] : (ax === 0 ? [0,0,1] : [0,1,0]);

  // corner offsets are 0/1 → convert to -1/+1 direction along each tangent
  const s1 = corner[t1.indexOf(1)] === 1 ? 1 : -1;
  const s2 = corner[t2.indexOf(1)] === 1 ? 1 : -1;

  const p = (dx, dy, dz) =>
    isOpaque(world.getBlock(wx + dir[0] + dx, wy + dir[1] + dy, wz + dir[2] + dz) as Block) ? 1 : 0;

  const side1 = p(t1[0]*s1, t1[1]*s1, t1[2]*s1);
  const side2 = p(t2[0]*s2, t2[1]*s2, t2[2]*s2);
  const cornerBlock = p(t1[0]*s1 + t2[0]*s2, t1[1]*s1 + t2[1]*s2, t1[2]*s1 + t2[2]*s2);

  const occ = (side1 && side2) ? 3 : side1 + side2 + cornerBlock;
  return [1.0, 0.8, 0.62, 0.48][occ];
}
```

Uploading to Three:

```ts
function toGeometry(m: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
  g.setAttribute('normal',   new THREE.Float32BufferAttribute(m.normals, 3));
  g.setAttribute('uv',       new THREE.Float32BufferAttribute(m.uvs, 2));
  g.setAttribute('color',    new THREE.Float32BufferAttribute(m.colors, 3));
  g.setIndex(m.indices);
  g.computeBoundingSphere();
  return g;
}

// Opaque material
new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true });
// Transparent material
new THREE.MeshBasicMaterial({
  map: atlas, vertexColors: true, transparent: true,
  opacity: 0.75, depthWrite: false, side: THREE.DoubleSide,
});
```

Position the mesh at `(cx*16, cy*16, cz*16)` so vertices stay chunk-local — keeps float precision sane far from origin.

**Atlas gotcha:** set `magFilter = NearestFilter` and `generateMipmaps = false`. With mipmaps on, distant tiles bleed into their atlas neighbors and you get colored fringes on everything. The real fix is a `DataArrayTexture` (one layer per tile, WebGL2), which also removes all the UV offset math — worth doing if the fringing bothers you, but not required for a POC.

**[POC shortcut]** No greedy meshing. Greedy merges coplanar same-type quads into rectangles and cuts vertex count enormously, but it conflicts with per-vertex AO — you can only merge quads whose AO values match on the shared edge. Add it later if you're vertex-bound, and expect to rewrite the AO handling when you do.

---

## 7. Voxel raycast — DDA (reference implementation)

Do **not** use `THREE.Raycaster` for block targeting. It tests triangles, so it gives you a mesh and a point but not the voxel coordinate, and it gets slow as chunks grow. The Amanatides & Woo algorithm walks the grid directly and hands you exactly what you need: the hit voxel, and the face normal you entered through.

```ts
interface RayHit { x: number; y: number; z: number; nx: number; ny: number; nz: number; }

function raycastVoxel(world: World, origin: THREE.Vector3, dir: THREE.Vector3,
                      maxDist = 8): RayHit | null {
  let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);

  const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z);

  // distance along the ray to cross one full cell on each axis
  const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;

  // distance along the ray to the first boundary on each axis
  const boundary = (o: number, s: number) => s > 0 ? Math.floor(o) + 1 - o : o - Math.floor(o);
  let tMaxX = stepX !== 0 ? boundary(origin.x, stepX) * tDeltaX : Infinity;
  let tMaxY = stepY !== 0 ? boundary(origin.y, stepY) * tDeltaY : Infinity;
  let tMaxZ = stepZ !== 0 ? boundary(origin.z, stepZ) * tDeltaZ : Infinity;

  let nx = 0, ny = 0, nz = 0;
  let t = 0;

  while (t <= maxDist) {
    const b = world.getBlock(x, y, z) as Block;
    if (b !== Block.Air && b !== Block.Water) {
      return { x, y, z, nx, ny, nz };
    }

    // advance along whichever axis has the nearest boundary
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX; t = tMaxX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0;
    } else if (tMaxY < tMaxZ) {
      y += stepY; t = tMaxY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0;
    } else {
      z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ;
    }
  }
  return null;
}
```

The normal is negated step direction because it points back toward where the ray came from — which is exactly the face you're looking at, and exactly where a placed block goes.

Usage:

```ts
const dir = new THREE.Vector3();
camera.getWorldDirection(dir);
const hit = raycastVoxel(world, camera.position, dir, 8);

// break
if (hit) world.setBlock(hit.x, hit.y, hit.z, Block.Air);

// place — on the face you're looking at, but never inside yourself
if (hit) {
  const px = hit.x + hit.nx, py = hit.y + hit.ny, pz = hit.z + hit.nz;
  if (!aabbIntersectsVoxel(player.aabb, px, py, pz)) {
    world.setBlock(px, py, pz, hotbar.selected);
  }
}
```

Highlight box: a `THREE.LineSegments` wireframe cube, repositioned to `hit + 0.5` each frame, hidden when `hit === null`. Scale it to 1.002 to avoid z-fighting with the block face.

---

## 8. Player controller

**Camera & input.** Pointer Lock API. `mousemove` deltas accumulate into yaw/pitch; clamp pitch to ±(π/2 − 0.01) so you never gimbal at straight up/down.

**Collision.** Player is an AABB roughly `0.6 × 1.8 × 0.6`, eye height ~1.62. Resolve each axis independently, in order:

```ts
function moveAndCollide(world: World, pos: Vec3, vel: Vec3, dt: number) {
  // X
  pos.x += vel.x * dt;
  if (collides(world, pos)) { pos.x -= vel.x * dt; vel.x = 0; }
  // Y
  pos.y += vel.y * dt;
  if (collides(world, pos)) {
    pos.y -= vel.y * dt;
    if (vel.y < 0) player.onGround = true;
    vel.y = 0;
  } else if (vel.y !== 0) player.onGround = false;
  // Z
  pos.z += vel.z * dt;
  if (collides(world, pos)) { pos.z -= vel.z * dt; vel.z = 0; }
}

function collides(world: World, pos: Vec3): boolean {
  const minX = Math.floor(pos.x - 0.3), maxX = Math.floor(pos.x + 0.3);
  const minY = Math.floor(pos.y),       maxY = Math.floor(pos.y + 1.8);
  const minZ = Math.floor(pos.z - 0.3), maxZ = Math.floor(pos.z + 0.3);
  for (let y = minY; y <= maxY; y++)
    for (let z = minZ; z <= maxZ; z++)
      for (let x = minX; x <= maxX; x++)
        if (BLOCKS[world.getBlock(x, y, z)].solid) return true;
  return false;
}
```

Axis order matters — resolving Y separately is what gives you clean landing and prevents wall-sticking on corners.

**Creative mode.** Double-tap space toggles fly. While flying: gravity off, space = up, shift = down, no ground check. Fly speed ~2.5× walk. Also worth adding a noclip toggle for debugging — it saves you when you spawn inside terrain.

**Fixed timestep.** Accumulate frame time and step physics at a fixed 1/60s regardless of render rate. Variable-dt collision produces tunneling at low framerates, which you will hit the moment a chunk batch loads.

---

## 9. Water

**Rendering.** Transparent pass, `depthWrite: false`, and the `nb === b` cull in the mesher so you don't see quads between adjacent water cells. Render transparent chunks after all opaque ones. **[POC shortcut]** don't sort transparent chunks back-to-front — with a single mostly-flat water plane the artifacts are minor.

**Camera submersion.** Each frame, sample the block at the camera position. If it's water: set `scene.fog` to a dense blue `FogExp2`, tint the clear color, and drop the FOV slightly. It's a two-line effect that sells the whole thing.

**Swimming.** In water: gravity × 0.3, horizontal speed × 0.5, vertical damping, space swims upward at a constant rate rather than impulse-jumping.

**Flow.** A cellular automaton over a 0–7 level and two per-cell flags, stored in parallel `Uint8Array`s (`wlevel` is a constant 7 for every live water cell and does not render — the `source`/`sustained` flags do the work):

- A **source** is created only by *placing* a water block. It is level 7, immortal, and keeps spreading. Water that *falls* from a source lands as **flow**.
- A water cell tries to flow **down** one cell per update first; at rest (solid or water below) it spreads to horizontal neighbours at full level — unlimited range: terrain and reachability, not levels, bound the water.
- Flow is **sustained** while it can reach a source through the water body (6-neighbour reachability, remembered per cell). Cut it off from every source — a plugged hole, a sealed pocket, a removed source block — and it starves away, one cell per slow-clock update: plug the hole and the cave you flooded empties itself, visibly.
- Run from a dirty-cell queue with a fixed budget per **slow-clock pulse** (≈0.5 s, a few hundred updates), not per frame: placement and drain take visible time, and per-frame sim cost is ≈zero.

Tick water on a much slower clock than physics — one pulse every ½ s instead of every 5th frame — so a placed block floods its reach gradually instead of instantly, and an emptied cave drains cell by cell.
**[Implemented]** The flow sim shipped in `src/water.ts` (unit-tested in `src/__tests__/water.test.ts`; the load path is pinned by a 10-second boot-and-play replay in `src/__tests__/water-load.test.ts`). Water state (`wlevel`/`wsource`/`wflow`) is stored in each chunk (`src/world.ts`) and streams with it. On top of the rules above it also: **settles** standing water once per chunk load, cheaply — worldgen water is re-seeded to level-7 sources in one bulk array pass and only cells that will actually fall (below is air) or spread (an air neighbour) are queued, so an interior ocean chunk settles in milliseconds inline in the load path (replay lineage: unguarded per-cell code = 2,463,202 updates / 6.1 s of a 6.7 s load; two-pass settle + spread guards = 358,734; after the band-order fix a 10-second / 125-chunk replay holds **12,595** updates with a 59 ms settle wall of a ≌680 ms total — pinned against the pre-fix floor of 1,231,601); **audits** reachability after every edit that removes water (one BFS from all sources through the water body), so flow cut off from a source is marked and starves away gradually instead of vanishing all at once; and **drains** only water that falls out of the world. Band-order guard: a chunk whose low y-band is in the generated range but not yet loaded settles *deferred* (settling it would fall its bottom water out of the still-unloaded world — the visible “raised/stepped ocean” at spawn), its settle cascades to the band above once the low band loads, and `process()` likewise refuses to fall into not-yet-generated space. Mesh-freshness contract: `sim.touched` **accumulates** across every settle of a frame and is consumed and cleared exactly once, by the frame-end drain in `main.ts` — `settle()` never clears it, which is what guarantees a chunk flooded across a seam is re-meshed in the same frame instead of keeping a stale pre-flood mesh (the visible “multiple ocean levels on spawn” bug). Documented POC-model deviations: water never spreads into ungenerated space (missing chunks stop spread — only a *falling* cell into a missing/void destination is destroyed); a settle that exhausts its 20,000-update guard marks its chunk settled anyway (the saturated remainder relaxes over later slow-clock pulses); levels are cosmetic constants, so “flow depth” is not simulated (a flooded cave reads as full water, not a graded slope).

---

## 10. Inventory & hotbar

Creative mode means infinite stacks, so this isn't really an inventory — it's a block palette plus a 9-slot quick-select.

```html
<div id="hotbar">
  <div class="slot selected"><img src="..."></div>
  <!-- ×9 -->
</div>
<div id="palette" class="hidden">
  <!-- grid of every placeable block -->
</div>
```

- **Number keys 1–9** select a hotbar slot.
- **Scroll wheel** cycles the selection, wrapping.
- **E** toggles the palette overlay and calls `document.exitPointerLock()`; closing re-locks.
- Palette entries are click-to-assign into the currently selected hotbar slot.
- Slot icons: just crop the atlas with CSS `background-position`. No need to render 3D previews.

Position the hotbar with `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%)` above the canvas, and put `pointer-events: none` on the container so clicks pass through to the game except on the palette.

---

## 11. Chunk streaming

Each frame, compute the player's chunk coords, then:

1. **Load** — for chunks within `RENDER_DIST` that aren't in the map: create, generate, mark dirty. **Budget: max 2 per frame.**
2. **Mesh** — for dirty chunks: rebuild geometry, dispose the old one, swap. **Budget: max 2 per frame.**
3. **Unload** — for chunks beyond `RENDER_DIST + 2`: dispose geometry, delete from map.

The budgets are the whole trick. Without them, walking into ungenerated terrain generates and meshes 40 chunks in one frame and the tab freezes for two seconds. Sort the pending queue by distance from the player so the nearest ones appear first.

```ts
if (chunk.opaqueMesh) {
  scene.remove(chunk.opaqueMesh);
  chunk.opaqueMesh.geometry.dispose();   // ← forget this and you leak GPU memory
}
```

Three does not garbage-collect GPU buffers. Every geometry you replace must be explicitly disposed.

---

## 12. Persistence

`localStorage` for the seed and player position. For block edits, IndexedDB storing **diffs only** — a per-chunk `Map<voxelIndex, blockId>` of player changes. On load, regenerate base terrain from the seed and replay the diff.

Storing full chunk arrays will blow past quota within a few minutes of play. The diff for a normal session is a few kilobytes.

**[POC shortcut]** Skip persistence entirely for v1. Regenerating from a fixed seed on refresh is fine while you're still iterating on the generator.

---

## 13. Milestones

Each of these is independently runnable. Don't skip ahead — the value is that you always have something on screen.

| # | Milestone | Proves | Rough effort |
|---|---|---|---|
| 1 | One hardcoded chunk, face-culled mesh, orbit camera | Meshing + atlas UVs | half day |
| 2 | Pointer lock, AABB collision, gravity, jump | Controller + physics | half day |
| 3 | DDA raycast, break/place, highlight box, remesh | Interaction loop | half day |
| 4 | Noise terrain, chunk streaming, load/unload budgets | The world | 1 day |
| 5 | Hotbar + block palette DOM UI | **This is where it becomes a game** | half day |
| 6 | Vertex AO + simple directional shading | Biggest visual upgrade per line of code | few hours |
| 7 | Water rendering, submersion fog, swimming | Feel | half day |
| 8 | Fly mode, frustum culling, trees, polish | Shipping | 1 day |

Milestone 5 is the one to rush toward. Everything before it is engine work that feels like nothing; the moment you can pick a block and place it, the project stops being a tech demo.

---

## 14. Known traps

- **Chunk boundary bugs are the dominant bug class.** Missing faces at seams, AO discontinuities, edits that don't propagate. Build a debug key that renders chunk borders as wireframe boxes in milestone 1, before you need it.
- **Remesh thrash.** Never remesh synchronously inside `setBlock`. Mark dirty, flush once per frame with a budget.
- **Negative coordinate math.** `Math.floor(x/16)` and `x % 16` are wrong for negative x. Use `x >> 4` and `x & 15`.
- **Geometry leaks.** Every `dispose()` you skip is permanently held GPU memory. Watch the heap in DevTools while walking in a straight line for a minute.
- **Atlas bleeding.** `NearestFilter`, mipmaps off, or move to `DataArrayTexture`.
- **Winding order.** If faces are invisible from outside but visible from inside, your corner order is clockwise instead of counter-clockwise. Temporarily set `side: DoubleSide` to confirm that's the cause, then fix the winding rather than shipping DoubleSide.
- **Tunneling at low framerate.** Fixed timestep physics.
- **Frustum culling isn't enough.** At render distance 12 you have 600+ chunks. For a POC, keep `RENDER_DIST` at 6 and cap vertical chunks.

---

## 15. Deferred (explicitly out of scope for POC)

These are all real and all worth doing eventually. None belong in v1.

- Web Workers for generation and meshing
- Greedy meshing
- Flood-fill skylight and blocklight propagation (the de-propagation pass on block removal is the hard part)
- `DataArrayTexture` instead of an atlas
- Biomes beyond a surface-block swap
- Survival mechanics: health, mining time, item stacks, crafting
- Entities, mobs, day/night cycle
- Multiplayer

---

## Appendix: alternative starting point

If the engine layer isn't the part you want to build, `noa-engine` is an open-source voxel engine that gives you chunks, meshing, and physics out of the box so you can go straight to gameplay. For a POC where you want to learn the internals, rolling it yourself is more useful — the meshing and raycast code above is genuinely most of the hard part.
