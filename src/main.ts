import * as THREE from 'three';
import { Block, isOpaque, PLACEABLE, iconTile } from './blocks';
import { World, chunkKey, chunkOf, CHUNK_SIZE, WORLD_Y_MAX, WORLD_Y_MIN, type VoxelBuffer } from './world';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from './terrain';
import * as streaming from './streaming';
import { Hotbar } from './ui';
import { meshChunk } from './chunk-mesher';
import { Player, EYE, type MoveInput } from './player';
import { raycastVoxel, REACH, type RayHit } from './raycast';

// === boot ===

const app = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.append(renderer.domElement);

// === scene ===

const scene = new THREE.Scene();
const BG_AIR = 0x87ceeb; // T12 reuses this (air/underwater background + fog swap)
scene.background = new THREE.Color(BG_AIR);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 512);
// SPAWN is computed in world-state, after the terrain exists (scan of a measured column).

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);
onResize();

// === textures ===

// 256x256 canvas atlas: 11 tiles, all in the top row (cols 0..10, row 0).
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
  if (e.code === 'KeyN') player.noclip = !player.noclip; // noclip toggle (T13 adds KeyC here)
  if (e.code === 'KeyE') togglePalette(); // creative palette: open (unlock) / close (re-lock)
  const d = e.code.startsWith('Digit') ? e.code.slice(5) : e.code.startsWith('Numpad') ? e.code.slice(6) : '';
  if (d >= '1' && d <= '9') hotbar.select(Number(d) - 1); // 1-9 / numpad 1-9 selects a slot
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

// Click the canvas: close the palette if it is open, otherwise pointer-lock (WASD + mouse steer; ESC releases).
renderer.domElement.addEventListener('click', () => {
  if (paletteOpen) closePalette();
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

function castFromCamera(): RayHit | null {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir); // view direction in world space, normalized
  return raycastVoxel((x, y, z) => world.getBlock(x, y, z), camera.position, dir, REACH);
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
  const hit = castFromCamera();
  if (!hit) return;
  if (e.button === 0) {
    // `hit` is always a breakable solid (water is pass-through in the raycast).
    world.setBlock(hit.x, hit.y, hit.z, Block.Air);
    remeshAround(hit.x, hit.y, hit.z);
  } else if (e.button === 2) {
    const tx = hit.x + hit.nx;
    const ty = hit.y + hit.ny;
    const tz = hit.z + hit.nz;
    if (ty < WORLD_Y_MIN || ty >= WORLD_Y_MAX) return;
    const target = world.getBlock(tx, ty, tz);
    if (target !== Block.Air && target !== Block.Water) return; // empty or water (filling pools)
    if (!player.noclip && player.intersectsVoxel(tx, ty, tz)) return; // no placing through yourself
    world.setBlock(tx, ty, tz, hotbar.block);
    remeshAround(tx, ty, tz);
  }
}

// Per-frame actions: re-target the wireframe from the just-synced camera (called after syncCamera).
function updateHitbox(): void {
  const hit = pointerLocked ? castFromCamera() : null;
  if (!hit) {
    hitbox.visible = false;
    return;
  }
  hitbox.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
  hitbox.visible = true;
}

// === ui ===

// T11: hotbar (bottom, display-only) + palette (top-right, click targets). The nine `.slot`
// divs are pre-placed in index.html; each is painted with the atlas crop of the block it holds.
const PALETTE_BLOCKS = [...PLACEABLE];
const hotbar = new Hotbar(PALETTE_BLOCKS);
const atlasURL = atlasCanvas.toDataURL();

// Crop the block's top-row tile into a `px`-sized icon: full atlas scaled 16·px wide, shifted
// to the tile column (iconTile — same tile as the mesh top face). Nearest keeps it crisp.
function placeIcon(el: HTMLElement, b: number, px: number): void {
  el.style.backgroundImage = `url(${atlasURL})`;
  el.style.backgroundSize = `${px * 16}px ${px * 16}px`;
  el.style.backgroundPosition = `-$((iconTile(b) % 16) * px}px 0px`;
  el.title = String(Block[b]);
}

const hotbarEl = document.getElementById('hotbar')!;
const paletteEl = document.getElementById('palette')!;
const hotbarSlotEls = Array.from(hotbarEl.children) as HTMLElement[];
const paletteSlotEls = Array.from(paletteEl.children) as HTMLElement[];

hotbarSlotEls.forEach((el, i) => placeIcon(el, hotbar.slots[i], 40)); // 44px box minus 2px border each side
hotbarEl.classList.remove('hidden');
paletteSlotEls.forEach((el, i) => {
  placeIcon(el, PALETTE_BLOCKS[i], 44); // 48px box minus 2px border each side
  el.addEventListener('click', () => hotbar.setSlot(hotbar.selected, PALETTE_BLOCKS[i])); // the arrow reads the *current* selection
});

hotbar.onSelectChange = (i) => {
  hotbarSlotEls.forEach((el, j) => el.classList.toggle('sel', j === i));
};
hotbar.onSlotChange = (i) => {
  placeIcon(hotbarSlotEls[i], hotbar.slots[i], 40); // the palette wrote into a slot
};

let paletteOpen = false;

// Browsers enforce a ~1 s re-lock cooldown after ESC; a rejected request is benign
// (the cooldown is the only realistic failure), so swallow it rather than throw.
function lockPointer(): void {
  const r = renderer.domElement.requestPointerLock() as unknown;
  if (r instanceof Promise) r.catch(() => {}); // Safari rejects without a user gesture
}

function closePalette(): void {
  paletteEl.classList.add('hidden');
  paletteOpen = false;
  lockPointer();
}

function togglePalette(): void {
  if (paletteOpen) {
    closePalette();
  } else {
    paletteOpen = true;
    paletteEl.classList.remove('hidden');
    document.exitPointerLock(); // crosshair + hitbox hide via the existing pointerlockchange handler
  }
}

// Callbacks are wired above, so this initial select lights the .sel border.
hotbar.select(PALETTE_BLOCKS.indexOf(Block.Planks)); // default: planks, as T8's selectedBlock was

// Wheel cycles the hotbar (down = next slot); while the palette is open the wheel is left alone.
window.addEventListener(
  'wheel',
  (e) => {
    if (paletteOpen) return;
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
  for (const c of r.rebuilt) rebuildChunkMesh(c.cx, c.cy, c.cz);
}

// === water-fx ===
// T12: underwater fog / background / FOV swap driven by player.headInWater.

// === debug ===
// T13: C = chunk-wireframe / AO demo scene (F fly / N noclip toggles live in the T7 input section).

// === loop ===

const STEP = 1 / 60;
const hint = document.getElementById('hint')!;
hint.textContent =
  'block-world T11 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · E palette · 1-9/wheel select · LMB break · RMB place · ESC release · world streams in around you';

let last = performance.now();
let acc = 0;

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
  syncCamera();
  updateHitbox();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);