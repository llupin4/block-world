import * as THREE from 'three';
import { Block } from './blocks';
import { World, chunkKey, localIndex, type VoxelBuffer } from './world';
import { SEA_LEVEL } from './terrain';
import { meshChunk } from './chunk-mesher';
import { Player, EYE, type MoveInput } from './player';

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
// reserved for T7's player: one above the center chunk's ground top (surface y=40)
const SPAWN = new THREE.Vector3(30.5, 41, 19.5);

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

/** Synthetic M1 plateau: 3x3 x 3-high chunk band, per-chunk plateau height h = 38..41. */
function demoFill(w: World): void {
  for (let cx = 0; cx <= 2; cx++)
    for (let cz = 0; cz <= 2; cz++) {
      const h = SEA_LEVEL + 6 + ((cx * 5 + cz * 9 + 32) % 4);
      for (let cy = 0; cy <= 2; cy++) {
        const ch = w.ensureChunk(cx, cy, cz);
        const by = cy * 16;
        for (let lz = 0; lz < 16; lz++)
          for (let lx = 0; lx < 16; lx++)
            for (let wy = by; wy < by + 16; wy++) {
              if (wy > h) continue; // leave Air (new chunks are zeroed)
              const b: number = wy === h ? (h < SEA_LEVEL + 1 ? Block.Sand : Block.Grass)
                : wy < h - 2 ? Block.Stone
                : Block.Dirt;
              ch.blocks[localIndex(lx, wy - by, lz)] = b;
            }
      }
    }

  // Hand-placed features: top band of the center chunk only (world x/z 16..31, y 32..47).
  const c = w.ensureChunk(1, 2, 1);
  const h = SEA_LEVEL + 6 + ((1 * 5 + 1 * 9 + 32) % 4); // = 40, same expression as above
  const setL = (lx: number, ly: number, lz: number, b: number, airOnly = false) => {
    if (lx < 0 || lx >= 16 || ly < 0 || ly >= 16 || lz < 0 || lz >= 16) return;
    const i = localIndex(lx, ly, lz);
    if (airOnly && c.blocks[i] !== Block.Air) return;
    c.blocks[i] = b;
  };
  for (let lz = 11; lz <= 14; lz++) // 4x4 pool: sand floor, water column flush with terrain
    for (let lx = 11; lx <= 14; lx++) {
      setL(lx, h - 35, lz, Block.Sand);
      for (let ly = h - 34; ly <= h - 32; ly++) setL(lx, ly, lz, Block.Water);
    }
  for (let lz = 0; lz <= 3; lz++) // sand patch in the chunk's south-west corner
    for (let lx = 0; lx <= 3; lx++) setL(lx, h - 32, lz, Block.Sand);
  for (let t = 0; t <= 2; t++) setL(5, h + t - 32, 5, Block.Wood); // 3-tall tree trunk
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      if (Math.abs(dx) === 1 && Math.abs(dz) === 1) continue;
      setL(5 + dx, h + 3 - 32, 5 + dz, Block.Leaves, true);
    }
  setL(5, h + 4 - 32, 5, Block.Leaves, true); // single top leaf
  for (let lz = 5; lz <= 7; lz++) // 3x3 plank deck
    for (let lx = 10; lx <= 12; lx++) setL(lx, h - 32, lz, Block.Planks);
  for (const lx of [13, 14]) // glass tower on the pool edge — written AFTER the pool
    for (const lz of [10, 11]) // so glass wins where their surface cells overlap (lz=11)
      for (let ly = h - 32; ly <= h - 30; ly++) setL(lx, ly, lz, Block.Glass);
}

demoFill(world);

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
}
// (T8/T10 reuse rebuildChunkMesh for edits and streaming loads.)

// M1: static build of the whole demo band (T10 replaces this with streaming).
for (let cx = 0; cx <= 2; cx++)
  for (let cz = 0; cz <= 2; cz++)
    for (let cy = 0; cy <= 2; cy++) rebuildChunkMesh(cx, cy, cz);

// === camera ===

// Camera = the player's eyes (feet + EYE). Rotation order YXZ: yaw first, then pitch.
const player = new Player((x, y, z) => world.getBlock(x, y, z));
player.place(SPAWN);
player.yaw = Math.PI; // face south, toward the deck/pool features
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
  if (e.code === 'KeyF') player.fly = !player.fly;         // fly toggle
  if (e.code === 'KeyN') player.noclip = !player.noclip;   // noclip toggle (T13 adds KeyC here)
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

// Click the canvas to pointer-lock (then WASD + mouse steer the character); ESC releases.
renderer.domElement.addEventListener('click', () => {
  const r = renderer.domElement.requestPointerLock() as unknown;
  if (r instanceof Promise) r.catch(() => {}); // Safari rejects without a user gesture
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
// T8: break/place on mouse click (remeshes affected chunks); T11: selected hotbar slot.

// === streaming ===
// T10: replace the static build above with streaming.update(world, pcx, pcz, pcy) in the loop.

// === water-fx ===
// T12: underwater fog / background / FOV swap driven by player.headInWater.

// === debug ===
// T13: C = chunk-wireframe / AO demo scene (F fly / N noclip toggles live in the T7 input section).

// === loop ===

const STEP = 1 / 60;
const hint = document.getElementById('hint')!;
hint.textContent =
  'block-world T7 — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · ESC release';

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
    // T10: streaming.update(world, pcx, pcz, pcy)
    // T8:  tickInteractions()
  }
  syncCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);