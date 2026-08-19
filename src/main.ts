import * as THREE from 'three';
import { Block, BLOCKS, isOpaque, PLACEABLE, iconPosition, torchMeta, doorMeta, doorOpen, doorAxis, isDoor } from './blocks';
import { World, chunkKey, chunkOf, CHUNK_SIZE, WORLD_Y_MAX, WORLD_Y_MIN, type VoxelBuffer } from './world';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from './terrain';
import * as streaming from './streaming';
import { Hotbar } from './ui';
import { meshChunk } from './chunk-mesher';
import { Player, EYE, type MoveInput } from './player';
import { raycastVoxel, REACH, type RayHit } from './raycast';
import { WaterSim } from './water';

// === boot ===

const app = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.append(renderer.domElement);

// === scene ===

const scene = new THREE.Scene();
// T12: two "moods" — air (sky blue, faint distance fog) vs water (deep blue, dense fog).
const BG_AIR = new THREE.Color(0x87ceeb);
const BG_WATER = new THREE.Color(0x0a2a55);
const FOG_AIR = new THREE.FogExp2(0xcfe8ff, 0.004);
const FOG_WATER = new THREE.FogExp2(0x0a2a55, 0.35);
scene.background = BG_AIR;
scene.fog = FOG_AIR;
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 512);
const FOV_AIR = 70; // must equal the perspective camera fov above
const FOV_WATER = 62;
// SPAWN is computed in world-state, after the terrain exists (scan of a measured column).

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);
onResize();

// === textures ===

// 256x256 canvas atlas: 14 tiles, all in the top row (cols 0..13, row 0).
const atlasCanvas = document.createElement('canvas');
atlasCanvas.width = 256;
atlasCanvas.height = 256;
const actx = atlasCanvas.getContext('2d')!;

function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function px(g: CanvasRenderingContext2D, x: number, y: number, c: readonly [number, number, number]) {
  g.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  g.fillRect(x, y, 1, 1);
}

function speck(g: CanvasRenderingContext2D, base: readonly [number, number, number], amt: number, rnd: () => number) {
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const d = (rnd() - 0.5) * 2 * amt;
      px(g, x, y, [base[0] + d, base[1] + d, base[2] + d]);
    }
}

type TilePainter = (g: CanvasRenderingContext2D, rnd: () => number) => void;

// One painter per face-tile id (index = tile from blocks.ts BLOCKS[b].faces), all deterministic.
const TILES: TilePainter[] = [
  (g, r) => speck(g, [92, 158, 66], 24, r), // 0 grassTop
  (g, r) => {                                // 1 grassSide (dirt with a 3px grass lip)
    speck(g, [120, 86, 52], 16, r);
    g.save();
    g.beginPath();
    g.rect(0, 0, 16, 3);
    g.clip();
    speck(g, [92, 158, 66], 18, r);
    g.restore();
  },
  (g, r) => speck(g, [120, 86, 52], 18, r),  // 2 dirt
  (g, r) => {                                 // 3 stone
    speck(g, [112, 112, 118], 14, r);
    g.fillStyle = 'rgba(58,58,64,.85)';
    for (let i = 0; i < 4; i++) g.fillRect((r() * 14) | 0, (r() * 16) | 0, 2 + ((r() * 3) | 0), 1);
  },
  (g, r) => speck(g, [216, 204, 152], 14, r), // 4 sand
  (g, r) => {                                 // 5 water
    speck(g, [48, 104, 196], 12, r);
    g.fillStyle = 'rgba(130,185,255,.55)';
    for (let i = 0; i < 5; i++) g.fillRect((r() * 13) | 0, (r() * 16) | 0, 3, 1);
  },
  (g, r) => {                                 // 6 woodSide (vertical strips)
    for (let x = 0; x < 16; x++) {
      const base: readonly [number, number, number] = x % 4 < 2 ? [112, 78, 44] : [98, 68, 40];
      for (let y = 0; y < 16; y++) {
        const d = (r() - 0.5) * 14;
        px(g, x, y, [base[0] + d, base[1] + d, base[2] + d]);
      }
    }
  },
  (g, r) => {                                 // 7 woodTop (concentric squares)
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
        const base: readonly [number, number, number] = d % 3 < 1.5 ? [152, 112, 64] : [114, 82, 48];
        const j = (r() - 0.5) * 10;
        px(g, x, y, [base[0] + j, base[1] + j, base[2] + j]);
      }
  },
  (g, r) => speck(g, [54, 118, 46], 30, r),  // 8 leaves
  (g) => {                                    // 9 glass (frame + highlight)
    g.fillStyle = 'rgb(196,232,250)';
    g.fillRect(0, 0, 16, 16);
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.fillRect(0, 0, 16, 1);
    g.fillRect(0, 15, 16, 1);
    g.fillRect(0, 0, 1, 16);
    g.fillRect(15, 0, 1, 16);
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.fillRect(3, 3, 2, 6);
  },
  (g, r) => {                                 // 10 planks (4px horizontal boards)
    for (let y = 0; y < 16; y++) {
      const base: readonly [number, number, number] = y % 4 === 3 ? [70, 48, 28] : [150, 108, 62];
      for (let x = 0; x < 16; x++) {
        const d = (r() - 0.5) * 14;
        px(g, x, y, [base[0] + d, base[1] + d, base[2] + d]);
      }
    }
  },
  (g, r) => {                                 // 11 torchStem (whole-tile wood: the post stretches the tile in-world, so every pixel must read as wood)
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const base: readonly [number, number, number] = x < 2 || x > 13 ? [74, 50, 28] : [112, 78, 44];
        const d = (r() - 0.5) * 14;
        px(g, x, y, [base[0] + d, base[1] + d, base[2] + d]);
      }
  },
  (g) => {                                     // 12 torchFlame
    g.fillStyle = 'rgb(255,150,40)';
    g.fillRect(3, 4, 10, 10);
    g.fillStyle = 'rgb(255,214,80)';
    g.fillRect(5, 6, 6, 7);
    g.fillStyle = 'rgb(255,246,205)';
    g.fillRect(7, 8, 2, 4);
  },
  (g, r) => {                                  // 13 door (plank panel, darker frame, latch)
    speck(g, [150, 108, 62], 10, r);
    g.fillStyle = 'rgba(70,48,28,.9)';
    g.fillRect(0, 0, 16, 2);
    g.fillRect(0, 14, 16, 2);
    g.fillRect(0, 0, 2, 16);
    g.fillRect(14, 0, 2, 16);
    g.fillRect(7, 3, 2, 10);
    g.fillStyle = 'rgb(220,200,120)';
    g.fillRect(11, 8, 2, 2);
  },
];

for (let t = 0; t < TILES.length; t++) {
  actx.save();
  actx.translate((t % 16) * 16, ((t / 16) | 0) * 16);
  TILES[t](actx, prng(0x5eed + t * 0x9e3779b9));
  actx.restore();
}

const atlas = new THREE.CanvasTexture(atlasCanvas); // flipY defaults true: canvas row 0 -> v≈1
atlas.magFilter = THREE.NearestFilter; // pixel look; no mip bleed across tiles
atlas.minFilter = THREE.NearestFilter;
atlas.generateMipmaps = false;

// No lights (spec): MeshBasicMaterial + vertex colors carry the baked face-shade/AO.
const matOpaque = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true });
const matTrans = new THREE.MeshBasicMaterial({
  map: atlas,
  vertexColors: true,
  transparent: true,
  opacity: 0.75,
  depthWrite: false,
  side: THREE.DoubleSide, // lets water be seen from under-side/side as well
});

// === world-state ===

const world = new World();

// T10 streams the rest of the world on demand: only the spawn column is generated up front,
// so the measured-spawn scan below reads real terrain before the first frame. Streaming uses
// the same generator/seed, so this column is byte-identical to what it would generate later.
const gen = new TerrainGen(TERRAIN_SEED);
for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(world, gen, 0, cy, 2); // chunk column (0,·,2) → world x 0..15, z 32..47 — contains the (T9) spawn (6,46)

// Water sim (PROJECT.md §9, src/water.ts): flow state streams with each chunk; it is
// settled per chunk as streaming loads them (tickStreaming) and advanced on a slower
// clock than physics (every 5th frame). The boot-generated spawn column is settled by
// the first tickStreaming, before the first rendered frame, so caves read as already filled.
const sim = new WaterSim(world);

// Spawn on MEASURED ground. Plan deviation (recorded): the plan's probe reported (33,41) as a
// grass shelf at surface y=33, but under the T4-pinned generator that column is a sea-basin
// cell (sand at y=30, water to y=32) in neither PRNG variant — the plan's T9 probe must have
// used a different scratch setup. (6,46) is the nearest clean grass column to the intended
// point in the rendered world: surface y=33, no tree in the column, and the sea starts 3 m
// east (toward the spawn's +x facing). The scan still drops from the top of the band (79)
// to the surface voxel; for an open-sea column the player would land on the sand floor and swim up.
const sx = 6, sz = 46;
let sy = 79;
while (sy >= 0 && !isOpaque(world.getBlock(sx, sy, sz))) sy--;
const SPAWN = new THREE.Vector3(sx + 0.5, sy + 1, sz + 0.5);

// === chunks-meshing ===

// T5 emits world-space vertex positions; meshes live at the origin.
// (POC deviation from the spec's "chunk-local vertices + per-chunk mesh offset":
//  identical rendered output, and T10 streaming avoids per-frame offset bookkeeping.)
function toGeometry(b: VoxelBuffer): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(b.positions, 3));
  g.setAttribute('color', new THREE.BufferAttribute(b.colors, 4)); // rgb + baked alpha
  g.setAttribute('uv', new THREE.BufferAttribute(b.uvs, 2));
  g.setIndex(new THREE.BufferAttribute(b.indices, 1));
  g.computeBoundingSphere();
  return g;
}

const chunkObjs = new Map<string, { opaque: THREE.Mesh | null; trans: THREE.Mesh | null }>();

function rebuildChunkMesh(cx: number, cy: number, cz: number): void {
  const key = chunkKey(cx, cy, cz);
  const old = chunkObjs.get(key);
  for (const m of [old?.opaque, old?.trans]) {
    if (m) {
      scene.remove(m);
      m.geometry.dispose();
    }
  }
  const { opaque, trans } = meshChunk(world, cx, cy, cz);
  const entry: { opaque: THREE.Mesh | null; trans: THREE.Mesh | null } = { opaque: null, trans: null };
  if (opaque) entry.opaque = new THREE.Mesh(toGeometry(opaque), matOpaque);
  if (trans) entry.trans = new THREE.Mesh(toGeometry(trans), matTrans);
  if (entry.opaque) scene.add(entry.opaque);
  if (entry.trans) scene.add(entry.trans);
  chunkObjs.set(key, entry);
  const ch = world.getChunk(cx, cy, cz);
  if (ch) ch.dirty = false; // T10: a rebuilt mesh is up to date; streaming only reschedules stale chunks
}
// (T8 remeshes around edits via remeshAround; T10's streaming drives loads/remeshes via
//  rebuildChunkMesh and unloads via removeChunkMesh below.)

/** T10: scene side of an unload — update() has already removed the chunk from the world. */
function removeChunkMesh(cx: number, cy: number, cz: number): void {
  const key = chunkKey(cx, cy, cz);
  const old = chunkObjs.get(key);
  for (const m of [old?.opaque, old?.trans]) {
    if (m) {
      scene.remove(m);
      m.geometry.dispose();
    }
  }
  chunkObjs.delete(key);
}

// T10: no static build — the streaming section keeps a 5x5 chunk ring (cy 0..4) around the
// player and generates/remeshes/unloads chunks as the player moves.

// === camera ===

// Camera = the player's eyes (feet + EYE). Rotation order YXZ: yaw first, then pitch.
const player = new Player((x, y, z) => world.getBlock(x, y, z));
player.place(SPAWN);
player.yaw = -Math.PI / 2; // face +x (east), at the sea — the shoreline starts ~6 m from spawn
camera.rotation.order = 'YXZ';

function syncCamera(): void {
  camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
}
syncCamera();

// === input ===

const MAX_PITCH = Math.PI / 2 - 0.01; // never go over the top
const keys = new Set<string>();

window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'KeyF') player.fly = !player.fly; // fly toggle
  if (e.code === 'KeyN') player.noclip = !player.noclip; // noclip toggle
  if (e.code === 'KeyE') togglePalette(); // creative palette: open (unlock) / close (re-lock)
  if (e.code === 'KeyH') toggleHelp(); // help overlay: same open (unlock) / close (re-lock)
  if (e.code === 'KeyC') setWireframe(!wireframeOn); // wireframe (PROJECT.md §14: chunk-edge bugs)
  const d = e.code.startsWith('Digit') ? e.code.slice(5) : e.code.startsWith('Numpad') ? e.code.slice(6) : '';
  if (d >= '1' && d <= '9') hotbar.select(Number(d) - 1); // 1-9 / numpad 1-9 selects a slot
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

// Click the canvas: close any open overlay (palette/help), otherwise pointer-lock (WASD + mouse steer; ESC releases).
renderer.domElement.addEventListener('click', () => {
  if (paletteOpen) closePalette();
  else if (helpOpen) closeHelp();
  else lockPointer();
});

const crosshair = document.getElementById('crosshair')!;
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  crosshair.style.display = locked ? 'block' : 'none';
  if (!locked) keys.clear(); // never drift on stuck keys after ESC
});

document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  player.yaw -= e.movementX * 0.0025;
  player.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, player.pitch - e.movementY * 0.0025));
});

function readMove(): MoveInput {
  return {
    forward: (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0),
    strafe: (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0),
    up: keys.has('Space'),
    down: keys.has('ShiftLeft') || keys.has('ShiftRight'),
  };
}

// === actions ===

// T8: crosshair break (LMB) / place (RMB); the placed block comes from the selected hotbar slot (T11).

// Targeting wireframe: box edges, 1.002 so it never z-fights the target face.
const hitbox = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0xffffff }),
);
hitbox.visible = false;
scene.add(hitbox);

// Attach the action handlers only while the pointer is locked, so the click that
// requests the lock (and any later UI click) can never mutate the world.
let pointerLocked = false;
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
  if (pointerLocked) {
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('contextmenu', onContextMenu);
  } else {
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('contextmenu', onContextMenu);
    hitbox.visible = false;
  }
});
// RMB must suppress the browser menu, which would also drop the pointer lock.
function onContextMenu(e: Event): void {
  e.preventDefault();
}

// A placed spring — water the player created (sim's `p` flag) — is the only water the
// player can break (LMB); breaking it is the way to stop the flow it feeds (a live
// spring is an eternal emitter; with it gone, the flow it fed re-derives away through
// the dirty closure — except water that landed on solid, which stands as a pool).
const springTarget = (x: number, y: number, z: number): boolean => {
  const b = world.getBlock(x, y, z);
  if (b !== Block.Air && b !== Block.Water) return true;
  return b === Block.Water && sim.cellState(x, y, z).p === 1;
};

function castFromCamera(springs: boolean): RayHit | null {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir); // view direction in world space, normalized
  // `springs` cast = BREAK targeting (LMB + crosshair): a spring stops the ray.
  // Plain cast = PLACE targeting (RMB): water stays pass-through, so aiming at a water
  // column reaches the solid behind/below it and the placement lands on the water cell
  // adjacent to that solid (cap or replace a surface cell) — the long-standing placement
  // behavior, which spring-stop targeting would break (it would displace the target to
  // the cell beyond the spring).
  return raycastVoxel(world, camera.position, dir, REACH, springs ? springTarget : undefined);
}

// Rebuild the edited cell's chunk, plus — when the cell sits on a chunk face — the
// touched neighbor, so faces on the shared border are regenerated (setBlock only
// marks data dirty; the static build has no dirty consumer until T10's streaming scan).
function remeshAround(wx: number, wy: number, wz: number): void {
  const cx = chunkOf(wx);
  const cy = chunkOf(wy);
  const cz = chunkOf(wz);
  rebuildChunkMesh(cx, cy, cz);
  const lx = wx - cx * CHUNK_SIZE;
  const ly = wy - cy * CHUNK_SIZE;
  const lz = wz - cz * CHUNK_SIZE;
  const touch: [number, number, number][] = [];
  if (lx === 0) touch.push([cx - 1, cy, cz]);
  if (lx === CHUNK_SIZE - 1) touch.push([cx + 1, cy, cz]);
  if (lz === 0) touch.push([cx, cy, cz - 1]);
  if (lz === CHUNK_SIZE - 1) touch.push([cx, cy, cz + 1]);
  if (ly === 0) touch.push([cx, cy - 1, cz]);
  if (ly === CHUNK_SIZE - 1) touch.push([cx, cy + 1, cz]);
  for (const [nx, ny, nz] of touch) if (world.hasChunk(nx, ny, nz)) rebuildChunkMesh(nx, ny, nz);
}

function onMouseDown(e: MouseEvent): void {
  if (e.button === 0) {
    const hit = castFromCamera(true); // break targeting: placed springs are targetable
    if (!hit) return;
    // `hit` is a breakable solid or a placed spring (the only targetable water —
    // see castFromCamera). Breaking a spring removes the emitter: the flow it fed
    // re-derives to air through the dirty closure, so the player can always stop a flood.
    world.setBlock(hit.x, hit.y, hit.z, Block.Air);
    remeshAround(hit.x, hit.y, hit.z);
    sim.edit(hit.x, hit.y, hit.z, Block.Air); // clears the cell's water state + re-marks dependents (source/support removed)
  } else if (e.button === 2) {
    const hit = castFromCamera(false); // place targeting: water stays pass-through
    if (!hit) return;
    const tx = hit.x + hit.nx;
    const ty = hit.y + hit.ny;
    const tz = hit.z + hit.nz;
    if (ty < WORLD_Y_MIN || ty >= WORLD_Y_MAX) return;
    const target = world.getBlock(tx, ty, tz);
    if (target !== Block.Air && target !== Block.Water) return; // empty or water (filling pools)
    if (!player.noclip && player.intersectsVoxel(tx, ty, tz)) return; // no placing through yourself
    world.setBlock(tx, ty, tz, hotbar.block);
    remeshAround(tx, ty, tz);
    sim.edit(tx, ty, tz, hotbar.block); // Water → a level-7 source; any other block dries this cell (surrounding water re-relaxes on the next tick)
  }
}

// Per-frame actions: re-target the wireframe from the just-synced camera (called after syncCamera).
// Shows the BREAK target (same cast as LMB): a spring lights up where you can break it.
function updateHitbox(): void {
  const hit = pointerLocked ? castFromCamera(true) : null;
  if (!hit) {
    hitbox.visible = false;
    return;
  }
  hitbox.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
  hitbox.visible = true;
}

// === ui ===

// T11: hotbar (bottom, display-only) + palette (right strip, click targets). The nine hotbar
// `.slot` divs are pre-placed in index.html; the palette rows (icon + name) are generated below
// — one per PALETTE_BLOCKS entry — so the strip grows with the registry. Each is painted with
// the atlas crop of the block it holds.
const PALETTE_BLOCKS = [...PLACEABLE];
const hotbar = new Hotbar(PALETTE_BLOCKS);
const atlasURL = atlasCanvas.toDataURL();

// Crop the block's top-row tile into a `px`-sized icon: full atlas scaled 16·px wide, shifted
// via iconPosition (same tile as the mesh top face). Nearest keeps it crisp.
function placeIcon(el: HTMLElement, b: number, px: number): void {
  el.style.backgroundImage = `url(${atlasURL})`;
  el.style.backgroundSize = `${px * 16}px ${px * 16}px`;
  el.style.backgroundPosition = iconPosition(b, px);
  el.title = BLOCKS[b].name; // real names (was: the numeric block id)
}

const hotbarEl = document.getElementById('hotbar')!;
const paletteEl = document.getElementById('palette')!;
const hotbarSlotEls = Array.from(hotbarEl.children) as HTMLElement[];

// The palette is a generated scrolling list: one .slot row per PLACEABLE entry
// (icon + name), so it grows with the registry. index.html holds no static rows.
const paletteSlotEls: HTMLElement[] = PALETTE_BLOCKS.map((b) => {
  const el = document.createElement('div');
  el.className = 'slot';
  const icon = document.createElement('div');
  icon.className = 'icon';
  placeIcon(icon, b, 40); // the icon div is 40px square (no border of its own)
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = BLOCKS[b].name;
  el.append(icon, name);
  el.addEventListener('click', () => hotbar.setSlot(hotbar.selected, b)); // the arrow reads the *current* selection
  paletteEl.append(el);
  return el;
});
// Rows holding the selected slot's block highlight (several rows can match one block).
const refreshPaletteSel = (b: number): void => {
  paletteSlotEls.forEach((el, j) => el.classList.toggle('sel', PALETTE_BLOCKS[j] === b));
};

hotbarSlotEls.forEach((el, i) => placeIcon(el, hotbar.slots[i], 40)); // 44px box minus 2px border each side
hotbarEl.classList.remove('hidden');
// Select-key keycap on each slot (1-9); palette rows are clicked, so they stay unnumbered.
hotbarSlotEls.forEach((el, i) => {
  const num = document.createElement('span');
  num.className = 'num';
  num.textContent = String(i + 1);
  el.append(num);
});

hotbar.onSelectChange = (i) => {
  hotbarSlotEls.forEach((el, j) => el.classList.toggle('sel', j === i));
  refreshPaletteSel(hotbar.block);
};
hotbar.onSlotChange = (i) => {
  placeIcon(hotbarSlotEls[i], hotbar.slots[i], 40); // the palette wrote into a slot
  refreshPaletteSel(hotbar.block); // hotbar.block is the selected slot's block — same source both callbacks
};

let paletteOpen = false;
let helpOpen = false;
const helpEl = document.getElementById('help')!;
const helpHintEl = document.getElementById('help-hint')!;

// Browsers enforce a ~1 s re-lock cooldown after ESC; a rejected request is benign
// (the cooldown is the only realistic failure), so swallow it rather than throw.
function lockPointer(): void {
  const r = renderer.domElement.requestPointerLock() as unknown;
  if (r instanceof Promise) r.catch(() => {}); // Safari rejects without a user gesture
}

// Invariant: at most one overlay (palette/help) is open. The badge advertises help and is
// visible only when nothing is open.
function syncOverlays(): void {
  helpHintEl.classList.toggle('hidden', paletteOpen || helpOpen);
}

function closePalette(): void {
  paletteEl.classList.add('hidden');
  paletteOpen = false;
  syncOverlays();
  lockPointer();
}

// Opening an overlay closes the other WITHOUT re-locking, so a swap never flickers
// (the single exitPointerLock below is the only lock call of the toggle).
function openPalette(): void {
  if (helpOpen) {
    helpOpen = false;
    helpEl.classList.add('hidden');
  }
  paletteOpen = true;
  paletteEl.classList.remove('hidden');
  syncOverlays();
  document.exitPointerLock(); // crosshair + hitbox hide via the existing pointerlockchange handler
}

function closeHelp(): void {
  helpEl.classList.add('hidden');
  helpOpen = false;
  syncOverlays();
  lockPointer();
}

function openHelp(): void {
  if (paletteOpen) {
    paletteOpen = false;
    paletteEl.classList.add('hidden');
  }
  helpOpen = true;
  helpEl.classList.remove('hidden');
  syncOverlays();
  document.exitPointerLock();
}

function togglePalette(): void {
  if (paletteOpen) closePalette();
  else openPalette();
}

function toggleHelp(): void {
  if (helpOpen) closeHelp();
  else openHelp();
}

helpHintEl.addEventListener('click', () => { if (!helpOpen) openHelp(); });

// Callbacks are wired above, so this initial select lights the .sel border.
hotbar.select(PALETTE_BLOCKS.indexOf(Block.Planks)); // default: planks, as T8's selectedBlock was

// Wheel cycles the hotbar (down = next slot); while an overlay is open the wheel is left alone.
window.addEventListener(
  'wheel',
  (e) => {
    if (paletteOpen || helpOpen) return; // an open overlay owns the wheel (and the mouse is free)
    hotbar.cycle(e.deltaY > 0 ? 1 : -1);
  },
  { passive: true },
);

// === streaming ===

// Per physics substep: stream the ring around the player. update() does the world side
// (generate new chunks, remove far ones); main.ts does the scene side (rebuild/dispose
// meshes). The 2 loads + 2 remeshes per call keep the frame cost bounded.
function tickStreaming(): void {
  const r = streaming.update(world, chunkOf(player.pos.x), chunkOf(player.pos.z), chunkOf(player.pos.y));
  for (const c of r.unloaded) removeChunkMesh(c.cx, c.cy, c.cz);
  for (const c of r.rebuilt) {
    sim.settle(c.cx, c.cy, c.cz); // POC form of worldgen-fluid settling: settle BEFORE meshing so the new chunk's mesh already shows flooded caves. The settled flag makes re-settling a re-meshed chunk a no-op. settle() never clears sim.touched: cross-seam marks from any settle this frame survive here and to the end-of-frame drain below, which re-meshes them.
    rebuildChunkMesh(c.cx, c.cy, c.cz);
  }
}

// === water-fx ===

// T12: when the eye voxel is water, the whole scene swaps to the water mood — background,
// fog, and a slight FOV squeeze, in one frame, in both directions. Driven by
// player.headInWater (T7 samples it each physics step); called per frame below.
let waterFx: 'air' | 'water' = 'air';
function syncWaterFx(): void {
  const m: 'air' | 'water' = player.headInWater ? 'water' : 'air';
  if (m === waterFx) return; // stable: one swap per (de)submersion, not per frame
  waterFx = m;
  scene.background = m === 'water' ? BG_WATER : BG_AIR;
  scene.fog = m === 'water' ? FOG_WATER : FOG_AIR;
  camera.fov = m === 'water' ? FOV_WATER : FOV_AIR;
  camera.updateProjectionMatrix(); // a fov change only reaches the GPU via this call
}

// === debug ===

// PROJECT.md §14 trap #1: chunk-boundary bugs. A global wireframe pass makes seams,
// missing/duplicate faces, and stray geometry visible at a glance. The two mesher
// materials are shared by every chunk mesh, so two flags flip the whole world
// (per-chunk box outlines are a post-POC nicety).
let wireframeOn = false;
function setWireframe(on: boolean): void {
  wireframeOn = on;
  matOpaque.wireframe = on;
  matTrans.wireframe = on;
}

// === loop ===

const STEP = 1 / 60;
const WATER_STEP = 0.5;   // slow-clock pulse interval (s): water takes one "tick" per pulse — placement and drain visibly take time
const WATER_PULSE = 1000; // cell updates budgeted per pulse: big enough that a cut-off body's re-stabilization cascade (level wave + drain) finishes within a pulse or two, so a stopped flow settles in ~1 s instead of crawling for many seconds (and visibly re-expanding before it drains); smaller pulses made that crawl read as "flow that keeps moving"

let last = performance.now();
let acc = 0;
let waterAcc = 0;

function frame(now: number): void {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // clamp after tab-switch/hitch
  acc += dt;
  while (acc >= STEP) {
    acc -= STEP;
    player.update(STEP, readMove());
    tickStreaming();
    if (player.pos.y < WORLD_Y_MIN) player.place(SPAWN); // fell out of the world (open cave / dug-away floor)
  }
  waterAcc += dt;
  if (waterAcc >= WATER_STEP) {
    waterAcc = 0;
    sim.tick(WATER_PULSE); // water on a ~2 Hz slow clock (PROJECT.md §9); settles are event-driven and stay snappy
  }
  const touched = sim.touched; // re-mesh any chunk the sim changed this frame (settles from substeps + ticks), then drain
  if (touched.size) {
    for (const key of touched) {
      const [cx, cy, cz] = key.split(',').map(Number);
      if (world.hasChunk(cx, cy, cz)) rebuildChunkMesh(cx, cy, cz);
    }
    touched.clear();
  }
  syncCamera();
  updateHitbox();
  syncWaterFx();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);