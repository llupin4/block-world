import * as THREE from 'three';
import { Block, BLOCKS, isOpaque, PLACEABLE, iconPosition, torchMeta, doorMeta, doorOpen, doorAxis, doorSide, isDoor, doorPlacementFromView } from './blocks';
import { World, chunkKey, chunkOf, CHUNK_SIZE, WORLD_Y_MAX, WORLD_Y_MIN } from './world';
import { TERRAIN_SEED, TerrainGen, generateChunkTerrain } from './terrain';
import * as streaming from './streaming';
import { Hotbar } from './ui';
import { meshChunk, meshChunkRange, probeMeshChunk, type ChunkMesh, type LightSampler } from './chunk-mesher';
import { SliceScheduler, decideBands, PROBE_VERTS, SLICE_COUNT } from './mesh-slices';
import { ProfRig, meshVerts, PROF_WORST_KEY } from './prof-rig';
import { toGeometry } from './geometry';
import { Sim, HumanController, IdleController, MobController, eyeOf, lookDir, breakRayTarget, possess, returnHome, spectate, type ApplyHooks, type Controller, type EntityRecord } from './entity';
import { raycastVoxel, pickEntity, REACH, type RayHit } from './raycast';
import { spawnDeer } from './spawn';
import { buildEntityRig, updateEntityRig, advanceRigAnim, newRigAnim, RIG_COLORS, LEG_RATE, buildPartAtlas, type Rig, type RigAnim } from './entity-mesh';
import { WaterSim } from './water';
import { WorldTime, formatClock, tickCrossed } from './time';
import { sampleSky, createSky } from './sky';
import { createClouds } from './clouds';
import { LIGHT_AMBIENT, LIGHT_TICK_BUDGET } from './light';
import { LightClient } from './light-transport';
import { Persistence, applyRecord, snapshotChunk, type WorldMeta } from './persistence';
import { IndexedDBChunkStore } from './idb-store';
import { Recorder, ReplayController, parseReplayParam, type Replay, type ReplaySnapshot } from './replay';

// === boot ===

const app = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.append(renderer.domElement);

// === scene ===

const scene = new THREE.Scene();
// T12: two "moods" — air vs water (submergence). The sky now paints both: the
// air mood carries the time-of-day gradient sky (src/sky.ts), the water mood a
// time-tinted deep blue (night underwater is darker). The mood still owns the
// FOV squeeze and which fog/background objects are active.
const BG_WATER = new THREE.Color(0x0a2a55);
const FOG_AIR = new THREE.FogExp2(0xcfe8ff, 0.004);
const FOG_WATER = new THREE.FogExp2(0x0a2a55, 0.35);
renderer.setClearColor(0x101a33); // fallback clear (night horizon): the sky dome covers every pixel anyway
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
  opacity: 0.85, // shared with water (no separate leaf material): leaves read denser; if water should differ later, leaves need their own material (see PROJECT.md)
  depthWrite: false,
  side: THREE.DoubleSide, // lets water be seen from under-side/side as well
});

// === per-vertex light (PROJECT.md §18) ===
// aLight = (blight, skylight) 0..1 baked per corner by the mesher. uDayness scales the
// sky component per frame (day/night fades in O(1) — no re-baking, no brightness
// wavefront at dusk); uAmbient is the unlit floor so deep night is dark but readable.
const daynessUniforms: { value: number }[] = [];
function addLightShader(mat: THREE.MeshBasicMaterial): void {
  const uDay = { value: 1.0 };
  const uAmb = { value: LIGHT_AMBIENT };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDayness = uDay;
    shader.uniforms.uAmbient = uAmb;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aLight;\nvarying vec2 vLight;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvLight = aLight;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDayness;\nuniform float uAmbient;\nvarying vec2 vLight;\n')
      .replace('#include <color_fragment>', '// per-vertex light: sky component fades with dayness; block light never does\nfloat bwLight = clamp(max(vLight.x, vLight.y * uDayness), 0.0, 1.0);\ndiffuseColor.rgb *= uAmbient + (1.0 - uAmbient) * bwLight;\n#include <color_fragment>');
  };
  daynessUniforms.push(uDay);
}
addLightShader(matOpaque);
addLightShader(matTrans);

// === sky ===
// World time is world state: advanced in the fixed substep loop below, then
// sampled per frame for the sky (src/sky.ts) and clouds (src/clouds.ts).
// ?phase=<0..1> dev-only: seeds the day phase (e.g. ?phase=0.5 = deep night) so
// headless/visual verification reaches any time of day without a 120 s real-time wait.
const phaseParam = new URLSearchParams(location.search).get('phase');
const startPhase = phaseParam !== null && phaseParam !== '' && Number.isFinite(+phaseParam) ? +phaseParam : 0;
// ?prof=remesh dev-only: the deterministic profiling rig (ADR 0013). Pins the player, tags the worst
// chunk's remesh events, and emits a PROF-RESULT JSON report (window.__profResult) that the
// Playwright harness (tests/e2e/remesh-prof.spec.ts) waits for. &norender skips
// renderer.render (the SwiftShader fallback; the report records which mode ran).
const profMode = new URLSearchParams(location.search).get('prof') === 'remesh';
const profNoRender = profMode && new URLSearchParams(location.search).has('norender');
const worldTime = new WorldTime(startPhase);
const sky = createSky(scene, FOG_AIR, FOG_WATER, BG_WATER);
const clouds = createClouds(scene);
const clockEl = document.getElementById('clock')!;
let clockLabel = '';
const scrubEl = document.getElementById('scrub')!; // phase 3: the recording/playback scrub HUD (ADR 0017)

// === world-state ===

const world = new World();

// T10 streams the rest of the world on demand; the spawn column itself is restored or
// generated in startGame (the boot gate below), so the measured-spawn scan runs after it.

// Water sim (PROJECT.md §9, src/water.ts): flow state streams with each chunk; it is
// settled per chunk as streaming loads them (tickStreaming) and advanced on the tick
// heartbeat (one pulse per WATER_STRIDE substeps; ADR 0011). The boot-generated spawn
// column is settled by the first tickStreaming, before the first rendered frame, so
// caves read as already filled.
const waterSim = new WaterSim(world);

// Light sim (PROJECT.md §18, src/light.ts): two 0..15 fields streamed with each chunk.
// Runs in a web worker (ADR 0012): the pin-identical LightSim drains/settles over a mirror of
// the chunk fields; the replies push the touched chunks' fields back into the world and
// feed the frame-end re-mesh via `touched` (the sim.touched contract, one reply late).
const lightSim = new LightClient(world, worldTime);
window.__lightDebug = lightSim; // debug surface: cumulative pops/seeds/fieldChanges, latest queue, lastTick

// The entity sim + its edit hooks (ADR 0015): world mutations flow through applyIntent,
// which calls these. remeshAround + lightSim.edit are the "onEdit"; waterSim.edit is the
// water-sim edit-origin; a placed spring (the water sim's `p` flag) is the only targetable water.
// remeshAround is a hoisted function declaration, so the onEdit closure can reference it here.
const simHooks: ApplyHooks = {
  onEdit: (x, y, z) => { remeshAround(x, y, z); lightSim.edit(x, y, z); },
  waterEdit: (x, y, z, block) => { waterSim.edit(x, y, z, block); },
  springTarget: (x, y, z) => waterSim.cellState(x, y, z).p === 1,
};
const sim = new Sim(world, simHooks, TERRAIN_SEED);
// Frozen non-viewed entities (restored from chunks / the meta) run on the idle controller —
// except a deer (kindId 'deer'; old saves use 'dolt'), which reattaches its wander AI on
// walk-back. Keying off the kind (not the saved controllerKind) means a dolt persisted while
// it was still idle (pre-mob save) still wakes up and wanders on restore.
const streamControllerFor = (r: EntityRecord): Controller =>
  (r.kindId === 'deer' || r.kindId === 'dolt')
    ? new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next())
    : new IdleController();

// World persistence (ADR 0014): edited chunks snapshot to IndexedDB on unload; on boot
// the key set + meta load, and previously edited chunks restore verbatim (warm: inline,
// cold: async fetch) instead of being re-generated from terrain. Persistence swallows
// store errors internally (D7: IDB failure → session-only persistence).
let persist: Persistence;
try {
  const idb = new IndexedDBChunkStore();
  persist = new Persistence(idb, TERRAIN_SEED, idb); // the IDB store is both a ChunkStore and a ReplayStore (phase 3)
} catch {
  persist = new Persistence(null, TERRAIN_SEED); // no IndexedDB in this environment
}
window.__persistDebug = persist; // debug surface: key set, warm cache, store counters

// === Replay recording + playback (phase 3, ADR 0017) ===
// The record: the sim's intent/spawn/despawn hooks feed a Recorder (delta-coded), which ends in
// a Replay (snapshot + intent log) saved to the `replays` IDB store under `seed:replay:startTick`.
// The playback: a fresh world restored from the snapshot, driven tick-by-tick by a
// ReplayController feeding recorded intents back into the sim (deterministic — no human input).
let recorder: Recorder | null = null;
let recording = false;
let playback: { replay: Replay; paused: boolean } | null = null;
let replayControllerFor: ((r: EntityRecord) => Controller) | null = null;
// Cold-restore in-flight keys (ADR 0014): one fetchRecord per key at a time. streaming
// re-pends a key every frame until its record lands, so without this we would re-attach a
// new .then continuation (re-running the whole apply) every frame. The key is added when
// the fetch starts and removed when it settles (apply or drop).
const restoring = new Set<string>();

// SPAWN is computed in startGame, after the boot column exists (it may be RESTORED from
// a persisted record — the scan must read the current world state, whatever that is).
let SPAWN: THREE.Vector3;

// === boot gate (ADR 0014) ===
// The game starts only once persistence has booted (key set + meta) — capped at 5 s:
// a stalled IDB must not hold the first frame hostage (the fallback starts a fresh
// world; a late meta is dropped, documented edge). startGame restores-or-generates the
// boot column, restores world state, and kicks the frame loop.
let booted = false;
async function startGame(meta: WorldMeta | null): Promise<void> {
  if (booted) return;
  booted = true;
  // === replay playback (phase 3, ADR 0017) ===
  // ?replay=<key> loads a saved session: a fresh world restored from the snapshot, driven
  // tick-by-tick by a ReplayController (deterministic — no human input). The boot-spawned
  // player id 1 would shadow the snapshot's entity id 1, so skip the normal spawn/restore.
  const replayKey = parseReplayParam(location.search);
  if (replayKey) {
    const replay = await persist.loadReplay(replayKey); // await (startGame is async) so the frame loop starts AFTER the load — no race with an empty sim
    if (replay) {
      for (const rec of replay.snapshot.chunks) {
        applyRecord(world, rec); // chunk arrays only (the 2-arg form: no entity restore)
        const c = world.getChunk(rec.cx, rec.cy, rec.cz);
        if (c) {
          waterSim.restore(c); // the water arrays ride in the chunk arrays; the world sim re-seats them
          lightSim.load(rec.cx, rec.cy, rec.cz); // light is never persisted: the worker re-settles it
          deferredFirstMesh.add(chunkKey(rec.cx, rec.cy, rec.cz));
        }
      }
      sim.rng.restore(replay.simPrng);
      worldTime.restore(replay.snapshot.meta.time); // the world tick resumes at the snapshot's tick (replay.startTick)
      // Each entity is driven by a ReplayController: a pull-model controller that reports the
      // LAST logged intent with tick <= the sim's current tick. The sim calls controller.intent(e,
      // worldTime.tick) each substep, so the world is driven deterministically by the log (no
      // human input). One ReplayController per entity (its own logged intents).
      replayControllerFor = (r: EntityRecord): Controller =>
        new ReplayController(replay.intents.filter((i) => i.entityId === r.id));
      sim.restoreEntities(replay.snapshot.meta.entities, replayControllerFor);
      // Derive the ghost (the single spectator); spawn one if the snapshot had none.
      sim.ghostId = sim.all().find((e) => e.kind.id === 'spectator')?.id ?? 0;
      if (sim.ghostId === 0) {
        const v = sim.viewed() ?? sim.all()[0]!;
        sim.ghostId = sim.spawn({ x: v.pos.x, y: v.pos.y + 4, z: v.pos.z }, new IdleController(), { kindId: 'spectator', baseController: new IdleController() }).id;
      }
      sim.setViewed(sim.ghostId); // camera follows the live spectator, not the recorded viewed entity
      playback = { replay, paused: false };
      console.log(`[replay] loaded ${replay.intents.length} deltas, playing ${replay.startTick}..${replay.endTick}`);
      syncCamera();
      requestAnimationFrame(frame); // the sim is now populated — the first frame is safe (no race with the async load)
      return;
    }
    console.warn(`[replay] not found: ${replayKey} — starting a fresh world instead`);
    // fall through to the normal boot path below (a missing replay must not leave a blank screen)
  }
  // T10: only the spawn column is generated up front — here it is either RESTORED (a
  // persisted, edited spawn column: arrays verbatim, settled = true, no settle) or
  // generated exactly as before (settled by the first tickStreaming's remesh path).
  for (let cy = 0; cy <= 4; cy++) {
    let rec = persist.syncRecord(0, cy, 2);
    if (!rec) rec = await persist.fetchRecord(0, cy, 2); // the record may exist but not be warm (first visit after a reload)
    if (rec) {
      applyRecord(world, rec, sim, streamControllerFor); // restore frozen entities (idle) + the chunk
      streaming.markNeighborsDirty(world, 0, cy, 2, 0, 2);
      waterSim.restore(world.getChunk(0, cy, 2)!);
      lightSim.load(0, cy, 2); // light is never persisted: the worker re-settles
      deferredFirstMesh.add(chunkKey(0, cy, 2));
    } else {
      const gen = new TerrainGen(TERRAIN_SEED);
      generateChunkTerrain(world, gen, 0, cy, 2); // chunk column (0,·,2) → world x 0..15, z 32..47 — contains the (T9) spawn (6,46)
      lightSim.load(0, cy, 2);
      deferredFirstMesh.add(chunkKey(0, cy, 2));
    }
  }
  // Spawn on MEASURED ground (the scan reads the boot column above — synchronous either way).
  // Plan deviation (recorded): the plan's probe reported (33,41) as a grass shelf at
  // surface y=33, but under the T4-pinned generator that column is a sea-basin cell (sand
  // at y=30, water to y=32) in neither PRNG variant — the plan's T9 probe must have used a
  // different scratch setup. (6,46) is the nearest clean grass column to the intended point
  // in the rendered world: surface y=33, no tree in the column, and the sea starts 3 m east
  // (toward the spawn's +x facing). The scan still drops from the top of the band (79) to
  // the surface voxel; for an open-sea column the player would land on the sand floor and swim up.
  const sx = 6, sz = 46;
  let sy = 79;
  while (sy >= 0 && !isOpaque(world.getBlock(sx, sy, sz))) sy--;
  SPAWN = new THREE.Vector3(sx + 0.5, sy + 1, sz + 0.5);
  sim.respawn = { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }; // the sim's fall-out-of-world respawn point (both branches)
  if (meta) {
    worldTime.restore(meta.time);
    // Restore controllers: the viewed entity is driven by the human (possession); a deer
    // (kindId 'deer'; old saves use 'dolt') reattaches its wander AI; the rest stand idle
    // (e.g. the home body when left). Keying off the kind — not the saved controllerKind —
    // means a dolt persisted while idle (pre-mob save) still wanders on restore.
    const controllerFor = (r: EntityRecord): Controller =>
      r.id === meta.viewedEntityId
        ? human
        : ((r.kindId === 'deer' || r.kindId === 'dolt')
            ? new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next())
            : new IdleController());
    sim.restoreEntities(meta.entities, controllerFor);
    sim.setViewed(meta.viewedEntityId);
    // The home body idles when left (not the human it was restored with); derive home/ghost from
    // the restored entities, and spawn the single ghost only if none was restored (it is a normal
    // entity and restores like any other — never spawn a second one).
    const body = sim.entities.get(meta.viewedEntityId);
    if (body && body.kind.id === 'player') body.baseController = new IdleController();
    sim.homeId = sim.all().find((e) => e.kind.id === 'player')?.id ?? 0;
    sim.ghostId = sim.all().find((e) => e.kind.id === 'spectator')?.id ?? 0;
    if (sim.ghostId === 0) {
      const v = sim.viewed()!;
      sim.ghostId = sim.spawn({ x: v.pos.x, y: v.pos.y + 4, z: v.pos.z }, new IdleController(), { kindId: 'spectator', baseController: new IdleController() }).id;
    }
    if (meta.simPrng !== undefined) sim.rng.restore(meta.simPrng);
    if (meta.hotbar?.slots?.length === 9) {
      for (let i = 0; i < 9; i++) hotbar.setSlot(i, meta.hotbar.slots[i]); // fires onSlotChange → icons refresh
      hotbar.select(meta.hotbar.selected ?? 0);
      // select() is a no-op when the selection is already at its default (0): refresh the
      // .sel borders directly so a restored selection of 0 still lights the slot.
      hotbarSlotEls.forEach((el, j) => el.classList.toggle('sel', j === hotbar.selected));
      refreshPaletteSel(hotbar.block);
    }
  } else {
    // Fresh world: the body runs the human controller but idles when left (baseController), and
    // the single spectator ghost is spawned (it restores like any entity on a later save).
    const p = sim.spawn(SPAWN, human, { yaw: -Math.PI / 2, kindId: 'player', baseController: new IdleController() }); // face +x (east), at the sea
    sim.setViewed(p.id);
    sim.homeId = p.id;
    sim.ghostId = sim.spawn({ x: SPAWN.x, y: SPAWN.y + 4, z: SPAWN.z }, new IdleController(), { kindId: 'spectator', baseController: new IdleController() }).id;
    hotbar.select(PALETTE_BLOCKS.indexOf(Block.Planks)); // default: planks, as T8's selectedBlock was
  }
  // The human controller's look is the source of truth (stepEntity adopts it each tick): sync it
  // to the entity's current look so the first tick does not clobber the spawn/restore facing.
  { const ve = sim.viewed(); if (ve) human.setLook(ve.yaw, ve.pitch); }
  if (profMode) { human.frozen = true; const ve = sim.viewed(); if (ve) ve.noclip = true; } // the rig owns the viewed entity
  profRig = profMode
    ? new ProfRig({ seed: TERRAIN_SEED, phase: meta ? worldTime.dayPhase : startPhase, render: !profNoRender, anchor: { x: sim.viewed()!.pos.x, y: sim.viewed()!.pos.y, z: sim.viewed()!.pos.z } })
    : null;
  syncCamera();
  requestAnimationFrame(frame);
}
const bootGate = window.setTimeout(() => { console.log('[persistence] boot gate: IDB stalled past 5 s — starting a fresh world (any late meta is dropped)'); void startGame(null); }, 5000); // fallback: a stalled boot still starts (fresh world)
void persist.boot().then((meta) => {
  window.clearTimeout(bootGate);
  void startGame(meta);
});

// === entity rigs ===

// One material per kind (a deterministic speckled part-atlas, block-atlas style). The rig
// renders every non-spectator entity; the viewed entity's rig is hidden (first person).
const rigOf: Record<string, THREE.MeshBasicMaterial> = {};
for (const [id, color] of Object.entries(RIG_COLORS)) rigOf[id] = new THREE.MeshBasicMaterial({ map: buildPartAtlas(color, 0x5eed) });
const rigs = new Map<number, { rig: Rig; anim: RigAnim }>();
const kindEl = document.getElementById('kind')!;

function syncEntityRigs(dt: number): void {
  const seen = new Set<number>();
  for (const e of sim.all()) {
    seen.add(e.id);
    if (e.kind.collides === false) continue; // spectator: no rig
    let entry = rigs.get(e.id);
    if (!entry) {
      const mat = rigOf[e.kind.id] ?? (rigOf[e.kind.id] = new THREE.MeshBasicMaterial({ map: buildPartAtlas(0x888888, 0x5eed) }));
      const rig = buildEntityRig(e.kind, mat);
      if (!rig) continue;
      entry = { rig, anim: newRigAnim() };
      rigs.set(e.id, entry);
      scene.add(rig.root);
    }
    advanceRigAnim(entry.anim, e, dt, LEG_RATE[e.kind.id] ?? 4);
    updateEntityRig(entry.rig, e, entry.anim);
    entry.rig.root.visible = e.id !== sim.viewedId; // hide the viewed entity in first person
  }
  for (const [id, entry] of rigs) if (!seen.has(id)) { scene.remove(entry.rig.root); rigs.delete(id); }
}

// The HUD kind label + hotbar visibility: show what you are viewing, and hide the hotbar when
// the viewed kind can't edit (a deer / the ghost can't place blocks).
function syncHud(): void {
  const ve = sim.viewed();
  kindEl.textContent = ve ? `viewing: ${ve.kind.id}` : '';
  hotbarEl.classList.toggle('hidden', !ve || !ve.kind.canEdit);
  // === replay scrub HUD (phase 3, ADR 0017) ===
  if (recording) { scrubEl.classList.remove('hidden'); scrubEl.textContent = '● recording… (R to stop)'; }
  else if (playback) { scrubEl.classList.remove('hidden'); scrubEl.textContent = `replay ${playback.paused ? '⏸ paused' : '▶ playing'}   t ${worldTime.tick} / ${playback.replay.endTick}`; }
  else scrubEl.classList.add('hidden');
}

// === chunks-meshing ===

const chunkObjs = new Map<string, { opaque: THREE.Mesh | null; trans: THREE.Mesh | null }>();

// Budgeted re-mesh of the light/water TOUCHED chunks. A cave's light convergence marks many
// chunks in one frame (up to ~7+); re-meshing all of them is a ~20ms spike (a re-mesh is a full
// rebuildChunkMesh, ~2-5ms each). Instead, this frame's sim.touched + lightSim.touched are merged
// into pendingRebuild and re-meshed CLOSEST-FIRST, up to REBUILD_BUDGET per frame; the rest carry
// one frame. That is safe because the light is a LOWER BOUND (the frontier relaxes inward) and the
// water settles converge, so a briefly-stale mesh self-corrects as the pending set drains — the
// visible (near) chunks are always re-meshed first. The streaming's own 1 load + 1 remesh join
// this same budgeted set (ADR 0012: their first/fresh mesh waits one frame for the worker's
// light fields).
const REBUILD_BUDGET = 3; // light/water-touched chunks re-meshed per frame
const pendingRebuild = new Set<string>(); // chunk keys awaiting a rebuildChunkMesh (carries across frames)
const deferredFirstMesh = new Set<string>(); // streamed-chunk keys whose FIRST/fresh mesh waits one frame for the worker's light fields (ADR 0012: replies are macrotasks — a load-frame drain would mesh from still-zero light) — moved into pendingRebuild at the frame end

const scheduler = new SliceScheduler(); // heavy-chunk slice plans (ADR 0013): at most one in flight
const lightSampler: LightSampler = (x, y, z) => world.getLight(x, y, z);

/** (dx^2+dz^2) dominates x/z; |cy-pcy| breaks ties — mirrors streaming.score so the nearest chunk re-meshes first. */
function rebuildScore(c: [number, number, number], pcx: number, pcy: number, pcz: number): number {
  const dx = c[0] - pcx, dz = c[2] - pcz;
  return (dx * dx + dz * dz) * 100 + Math.abs(c[1] - pcy);
}

/** Scene side of a finished mesh: dispose the old entry, build geometries, swap, clear dirty.
 * Shared by the sync edit path, the probe-complete drain path, and the slice-merge path. */
function swapChunkMesh(cx: number, cy: number, cz: number, mesh: ChunkMesh): void {
  const key = chunkKey(cx, cy, cz);
  const old = chunkObjs.get(key);
  for (const m of [old?.opaque, old?.trans]) {
    if (m) {
      scene.remove(m);
      m.geometry.dispose();
    }
  }
  const entry: { opaque: THREE.Mesh | null; trans: THREE.Mesh | null } = { opaque: null, trans: null };
  if (mesh.opaque) entry.opaque = new THREE.Mesh(toGeometry(mesh.opaque), matOpaque);
  if (mesh.trans) entry.trans = new THREE.Mesh(toGeometry(mesh.trans), matTrans);
  if (entry.opaque) scene.add(entry.opaque);
  if (entry.trans) scene.add(entry.trans);
  chunkObjs.set(key, entry);
  const ch = world.getChunk(cx, cy, cz);
  if (ch) ch.dirty = false; // a rebuilt mesh is up to date; streaming only reschedules stale chunks
}

/** Synchronous edit-remesh (setBlock / door toggle path). Still one-shot for heavy chunks —
 * documented residual, belongs to TODO items 2/3 (worker offload / adaptive budget). */
function rebuildChunkMesh(cx: number, cy: number, cz: number): void {
  scheduler.cancel(chunkKey(cx, cy, cz)); // a sync edit supersedes any in-flight split — a finished split must never clobber it
  swapChunkMesh(cx, cy, cz, meshChunk(world, cx, cy, cz, lightSampler));
}
// (T8 remeshes around edits via remeshAround; T10's streaming drives loads/remeshes via
//  rebuildChunkMesh and unloads via removeChunkMesh below.)

/** T10: scene side of an unload — update() has already removed the chunk from the world. */
function removeChunkMesh(cx: number, cy: number, cz: number): void {
  scheduler.cancel(chunkKey(cx, cy, cz)); // an in-flight split of a vanished chunk is discarded (partial buffers are CPU-only)
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

// Camera = the VIEWED entity's eyes (feet + the kind's eye height). Rotation order YXZ: yaw
// first, then pitch. (The legacy Player is gone from main.ts — the entity sim owns the player
// now; the kind supplies the eye, so the old EYE constant is no longer needed here.)
let profRig: ProfRig | null = null; // owned by startGame (it needs the restored viewed position)
let profDrainMs = 0;
camera.rotation.order = 'YXZ';

function syncCamera(): void {
  const ve = sim.viewed();
  if (!ve) return;
  if (playback) {
    // Live-spectator head-follow (phase 3): the camera follows the ghost, but its LOOK turns with
    // the live mouse (independent of the recorded world) — the ghost's recorded look is overridden.
    const look = human.getLook();
    ve.yaw = look.yaw;
    ve.pitch = look.pitch;
  }
  camera.position.set(ve.pos.x, ve.pos.y + ve.kind.eye, ve.pos.z);
  camera.rotation.set(ve.pitch, ve.yaw, 0);
}

// ?dbg dev-only: exposes the render triple for headless pixel verification (readPixels
// after a forced render). Never used outside that rig.
if (new URLSearchParams(location.search).has('dbg')) {
  (window as unknown as Record<string, unknown>).__bw = { renderer, scene, camera };
}

// === input ===

const keys = new Set<string>(); // shared with the human controller (it reads these to build its intent)
const human = new HumanController(keys, 0, 0); // the player's controller: hardware state -> one Intent per substep

window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'KeyF') human.toggleFly(); // fly toggle (a one-tick edge the sim consumes)
  if (e.code === 'KeyN') human.toggleNoclip(); // noclip toggle
  if (e.code === 'KeyR') toggleRecording(); // record start/stop (phase 3, ADR 0017)
  if (e.code === 'KeyE') togglePalette(); // creative palette: open (unlock) / close (re-lock)
  if (e.code === 'KeyH') toggleHelp(); // help overlay: same open (unlock) / close (re-lock)
  if (e.code === 'KeyC') setWireframe(!wireframeOn); // wireframe (PROJECT.md §14: chunk-edge bugs)
  if (e.code === 'KeyP') onPossess(); // possess the targeted entity, or toggle body<->ghost
  const d = e.code.startsWith('Digit') ? e.code.slice(5) : e.code.startsWith('Numpad') ? e.code.slice(6) : '';
  if (d >= '1' && d <= '9') { const s = Number(d) - 1; hotbar.select(s); human.select(s); } // 1-9 / numpad 1-9
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
  human.mouse(e.movementX, e.movementY); // the controller owns yaw/pitch + the pitch clamp
});

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

// The break/place/door/torch raycast (spring targeting, door pairing, torch faces) now lives
// in entity.ts (applyIntent): it runs from the VIEWED entity's eye, not the camera. main.ts
// keeps only the crosshair (updateHitbox) and the two-line input edge-setter (onMouseDown).

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

// The input edge-setter: LMB/RMB just record an edge on the human controller; the sim's
// substep loop (sim.tick -> applyIntent) performs the actual break/place from the viewed eye.
function onMouseDown(e: MouseEvent): void {
  if (e.button === 0) human.primary();
  else if (e.button === 2) human.secondary();
}

// The crosshair break cast (LMB targeting): identical math to the old camera cast, but from
// the viewed entity's eye + look direction. A placed spring stops the ray (breakRayTarget).
function castBreakFromViewed(): RayHit | null {
  const ve = sim.viewed();
  if (!ve) return null;
  return raycastVoxel(world, eyeOf(ve), lookDir(ve.yaw, ve.pitch), REACH, breakRayTarget(world, simHooks));
}

// Per-frame actions: re-target the wireframe from the just-synced camera (called after syncCamera).
// Shows the BREAK target (same cast as LMB): a spring lights up where you can break it. A closer
// entity shadows the voxel (pickEntity before the voxel, exactly as onPossess does).
function updateHitbox(): void {
  if (!pointerLocked) { hitbox.visible = false; return; }
  const ve = sim.viewed();
  if (!ve) { hitbox.visible = false; return; }
  const ent = pickEntity(eyeOf(ve), lookDir(ve.yaw, ve.pitch), sim.all().filter((x) => x.id !== ve.id), REACH);
  if (ent) { hitbox.visible = false; return; } // a closer entity shadows the voxel
  const hit = castBreakFromViewed();
  if (!hit) { hitbox.visible = false; return; }
  hitbox.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
  hitbox.visible = true;
}

// Possession (P): if the crosshair is on another entity within reach, drive it; otherwise toggle
// between the home body and the single spectator ghost.
function onPossess(): void {
  const ve = sim.viewed();
  if (!ve) return;
  const candidates = sim.all().filter((x) => x.id !== ve.id);
  const hit = pickEntity(eyeOf(ve), lookDir(ve.yaw, ve.pitch), candidates, REACH);
  if (hit) {
    possess(sim, human, candidates[hit.index].id);
  } else if (sim.viewedId === sim.homeId) {
    spectate(sim, human);   // at the body -> the ghost
  } else {
    returnHome(sim, human); // possessing/ghost -> back to the body
  }
}

// === replay recording (phase 3, ADR 0017) ===
// R toggles a recording: the sim's intent/spawn/despawn hooks feed a delta-coded Recorder, and on
// stop the current world is snapshotted (chunk arrays + meta) into a Replay saved to the `replays`
// IDB store under `seed:replay:startTick`. The snapshot is the initial state; the intent log is
// the delta (deterministic — replaying it into a restored snapshot reproduces the session).
function snapshotState(): ReplaySnapshot {
  return {
    chunks: [...world.allChunks()].map((c) => snapshotChunk(c)),
    meta: {
      v: 2, seed: TERRAIN_SEED, entities: sim.all().map((e) => sim.toRecord(e)), viewedEntityId: sim.viewedId,
      time: worldTime.snapshot(),
      hotbar: { slots: [...hotbar.slots], selected: hotbar.selected },
      simPrng: sim.rng.state(),
    },
  };
}

let recordStartTick = 0;
let recordStartPrng = 0;
let recordStartSnapshot: ReplaySnapshot | null = null;

function startRecording(): void {
  // The snapshot is the INITIAL state (record start) — the replay restores it, then plays back
  // the intent log (record start -> stop) deterministically. Capture the tick + PRNG + snapshot NOW.
  recordStartTick = worldTime.tick;
  recordStartPrng = sim.rng.state();
  recordStartSnapshot = snapshotState();
  const rec = new Recorder(recordStartTick);
  rec.attach(sim); // wire the sim's onIntent/onSpawn/onDespawn to the Recorder
  recorder = rec;
  recording = true;
  playback = null; // a recording is a live session, not a playback
  console.log(`[replay] recording from tick ${recordStartTick} (R to stop)`);
}

function stopRecording(): void {
  if (!recorder || !recording || !recordStartSnapshot) return;
  const replay: Replay = {
    seed: TERRAIN_SEED,
    startTick: recordStartTick,
    endTick: worldTime.tick,
    simPrng: recordStartPrng, // the PRNG at record start (restored before replaying)
    events: recorder.events,
    intents: recorder.intents, // delta-coded: an entity with no entry at a tick repeats its previous intent
    snapshot: recordStartSnapshot, // the initial state (record start)
  };
  const key = `${TERRAIN_SEED}:replay:${replay.startTick}`;
  persist.saveReplay(key, replay);
  sim.onIntent = sim.onSpawn = sim.onDespawn = undefined; // detach the Recorder
  recorder = null; recording = false; recordStartSnapshot = null;
  console.log(`[replay] saved ${key} — ${replay.intents.length} intents, ${replay.events.length} events (replay with ?replay=${key})`);
}

function toggleRecording(): void { if (recording) stopRecording(); else startRecording(); }

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

// The default hotbar select happens in startGame (a restored meta takes the slots instead).

// Wheel cycles the hotbar (down = next slot); while an overlay is open the wheel is left alone.
window.addEventListener(
  'wheel',
  (e) => {
    if (paletteOpen || helpOpen) return; // an open overlay owns the wheel (and the mouse is free)
    hotbar.cycle(e.deltaY > 0 ? 1 : -1);
    human.select(hotbar.selected); // reported for replay; unwired in phase 1
  },
  { passive: true },
);

// === streaming ===

// Once per frame (not per physics substep): stream the ring around the player. update() does the
// world side (generate new chunks, remove far ones); main.ts does the scene side (rebuild/dispose
// meshes). The stream is a pure function of the player position, so one call per frame is enough —
// and it enforces the §9 ≤1 load + ≤1 remesh/frame budget (calling it per substep let the frame
// clamp multiply the budget by the substep count, up to ~12 chunks/frame). The loaded/remeshed
// chunks' first/fresh mesh goes through the frame-end budgeted re-mesh below (REBUILD_BUDGET) —
// ADR 0012 defers it one frame so the mesh reads the worker's settled light; the light/water
// touched carry the same way.
function tickStreaming(): void {
  const ve = sim.viewed(); // the stream is a pure function of the VIEWED entity's position
  if (!ve) return;
  const pcx = chunkOf(ve.pos.x), pcz = chunkOf(ve.pos.z), pcy = chunkOf(ve.pos.y);
  const r = streaming.update(world, pcx, pcz, pcy, persist, sim); // sim = EntitySource: entities ride the unload
  for (const c of r.unloaded) {
    removeChunkMesh(c.cx, c.cy, c.cz);
    lightSim.unload(c.cx, c.cy, c.cz); // the worker re-seeds the surviving seams (the darkness wave)
    pendingRebuild.delete(chunkKey(c.cx, c.cy, c.cz)); // don't re-mesh a chunk we just unloaded
    deferredFirstMesh.delete(chunkKey(c.cx, c.cy, c.cz)); // it may still be waiting for its first mesh
    for (const d of sim.entitiesInChunk(c.cx, c.cy, c.cz)) // the deer leaving with the chunk persist via the entity-ride; restore on walk-back
      if (d.kind.id === 'deer' || d.kind.id === 'dolt') sim.despawn(d.id);
  }
  if (r.unloaded.length) persist.saveMeta(metaSnapshot()); // the world just changed durably (a chunk left): refresh the save point
  for (const c of r.rebuilt) {
    waterSim.settle(c.cx, c.cy, c.cz); // POC form of worldgen-fluid settling: settle BEFORE meshing so the new chunk's mesh already shows flooded caves. The settled flag makes re-settling a re-meshed chunk a no-op. settle() never clears waterSim.touched: cross-seam marks from any settle this frame survive here and to the end-of-frame drain below, which re-meshes them.
    lightSim.load(c.cx, c.cy, c.cz); // the worker settles it; the fields land with the tick reply
    deferredFirstMesh.add(chunkKey(c.cx, c.cy, c.cz)); // ADR 0012: the first/fresh mesh waits a guaranteed frame (replies are macrotasks — a load-frame drain would mesh from still-zero light); the frame end moves it into pendingRebuild after the first reply has landed
  }
  for (const c of r.rebuilt) spawnDeer(world, sim, c.cx, c.cz); // deer into freshly GENERATED (rebuilt) columns only — restored chunks already carry their persisted deer (re-rolling would double-populate and diverge)
  for (const c of r.restored) {
    const ch = world.getChunk(c.cx, c.cy, c.cz)!;
    waterSim.restore(ch); // D1: water restored as-is (settled = true) — rebuild springs/waiting/queue, NO settle
    lightSim.load(c.cx, c.cy, c.cz); // light is never persisted: the worker re-settles the chunk
    deferredFirstMesh.add(chunkKey(c.cx, c.cy, c.cz)); // first mesh of the restored chunk, same pacing as a load
  }
  for (const c of r.pending) {
    // Cold restore: the record is known (key set) but not warm. Fetch async; apply when it
    // lands. One in-flight fetch per key (restoring): streaming re-pends a key every frame
    // until the record lands, so re-attaching a .then each frame would re-run the whole apply.
    // A failed/stale fetch drops the key → the next update() generates the chunk fresh (confirmed
    // miss); a stale (out-of-range) record is NOT dropped — fetchRecord already cached it warm,
    // so the next walk-back restores it inline.
    const key = chunkKey(c.cx, c.cy, c.cz);
    if (restoring.has(key)) continue; // a fetch for this key is already in flight
    restoring.add(key);
    void persist.fetchRecord(c.cx, c.cy, c.cz).then((rec) => {
      restoring.delete(key); // free the slot whether we apply or drop
      if (!rec) { persist.dropPersisted(c.cx, c.cy, c.cz); return; }
      // Stale guard: the player may have moved on since the fetch started — apply only if the
      // chunk is still in range of the CURRENT viewed position (ve is the live entity, so
      // ve.pos reads the current position; the record stays warm either way).
      if (!streaming.inRange(c.cx, c.cz, chunkOf(ve.pos.x), chunkOf(ve.pos.z))) return;
      if (world.hasChunk(c.cx, c.cy, c.cz)) return; // a duplicate in-flight fetch applied it first
      applyRecord(world, rec, sim, streamControllerFor); // restore frozen entities into the sim (idle)
      streaming.markNeighborsDirty(world, c.cx, c.cy, c.cz, chunkOf(ve.pos.x), chunkOf(ve.pos.z));
      const ch = world.getChunk(c.cx, c.cy, c.cz)!;
      waterSim.restore(ch);
      lightSim.load(c.cx, c.cy, c.cz);
      deferredFirstMesh.add(key);
    });
  }
}

function metaSnapshot(): WorldMeta {
  return {
    v: 2, seed: TERRAIN_SEED,
    entities: sim.all().map((e) => sim.toRecord(e)),
    viewedEntityId: sim.viewedId,
    simPrng: sim.rng.state(),
    time: worldTime.snapshot(),
    hotbar: { slots: [...hotbar.slots], selected: hotbar.selected },
  };
}

// Save points (ADR 0014). Chunk records are written (a) when a chunk UNLOADS (the streaming
// path) and (b) at every save point below — every currently-loaded EDITED + OUT-OF-SYNC chunk
// is snapshotted in ONE putMany (one store transaction) along with the meta (saveLoaded). The
// gate is inside saveLoaded (isDue), so an untouched or already-saved world writes only the
// meta. The 5 s interval is what makes a hard reload safe: the pagehide put is best-effort (the
// page can be torn down mid-transaction, so it may not commit), and edits in still-loaded
// chunks are otherwise only saved when those chunks unload. Worst case, a hard kill loses
// ~5 s of edits **[POC shortcut]**.
const saveAndFlush = (): void => {
  persist.saveLoaded(world.allChunks(), metaSnapshot()); // one batched putMany: the DUE chunks + the meta
  void persist.flush();
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveAndFlush(); });
window.addEventListener('pagehide', () => saveAndFlush());
setInterval(() => saveAndFlush(), 5000); // best-effort periodic save: the crash window is ~5 s

// === water-fx ===

// T12: when the viewed entity's head voxel is water the whole scene swaps to the water mood —
// the FOV squeeze here; the time-driven sky (sky.apply) paints whichever
// background/fog is active, in both moods. Driven by headInWater
// (stepEntity samples it each physics step); called per frame below.
let waterFx: 'air' | 'water' = 'air';
function syncWaterFx(): void {
  const ve = sim.viewed();
  const m: 'air' | 'water' = ve?.headInWater ? 'water' : 'air';
  if (m === waterFx) return; // stable: one swap per (de)submersion, not per frame
  waterFx = m;
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
const WATER_STRIDE = 30;  // substep ticks per water pulse (ADR 0011): 30 × (1/60 s) = 0.5 sim s — water takes one "tick" per pulse, so placement and drain visibly take time (was a floating-point dt accumulator that could miss the 0.5 s boundary by a frame; measured in the deterministic 10 s replay: 19 pulses instead of 20)
const WATER_PULSE = 1000; // cell updates budgeted per pulse: big enough that a cut-off body's re-stabilization cascade (level wave + drain) finishes within a pulse or two, so a stopped flow settles in ~1 s instead of crawling for many seconds (and visibly re-expanding before it drains); smaller pulses made that crawl read as "flow that keeps moving"

let last = performance.now();
let acc = 0;

function frame(now: number): void {
  const profT0 = profMode ? performance.now() : 0; // the rig measures the whole frame's main-thread work
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // clamp after tab-switch/hitch
  acc += dt;
  const tickBefore = worldTime.tick; // ADR 0011: the water pulse strides the tick lattice; capture pre-substep tick for the frame-end crossing check
  human.heldBlock = hotbar.block; // sync the held block for intents (per frame, before the substeps)
  while (acc >= STEP) {
    acc -= STEP;
    if (playback && playback.paused) continue; // a paused replay holds the world (the substep is consumed but nothing advances)
    sim.tick(STEP, worldTime.tick); // the sim heartbeat: intent -> applyIntent -> stepEntity (ReplayController-driven during playback — deterministic)
    worldTime.advance(STEP);
    if (playback && worldTime.tick >= playback.replay.endTick) playback.paused = true; // reached the end of the session
  }
  tickStreaming(); // ONCE per frame (was inside the substep loop, where the frame-time clamp multiplied the streaming budget by the substep count, up to ~12 chunks/frame)
  if (profRig) {
    // The rig pins the player (segment A: the spawn anchor — the worst chunk (2,·,0) is already
    // in the spawn ring; segment B: the open ocean). worstLoaded is read AFTER this frame's
    // streaming so the window opens on the load frame itself. worstSettled does NOT use the
    // chunk's lightSettled flag: in production that flag is live only in the worker mirror
    // (the reply does not carry it) — the rig settles on quiescence + the 6312 baseline
    // signature instead (ProfRig.beginFrame).
    const wc = world.getChunk(2, 1, 0);
    const wp = profRig.beginFrame({
      worstLoaded: wc !== undefined,
      worstSettled: wc !== undefined && !pendingRebuild.has(PROF_WORST_KEY) && !scheduler.has(PROF_WORST_KEY),
    }).waypoint;
    const vep = sim.viewed(); // the rig pins the VIEWED entity (frame-end write, same as today)
    if (vep) { vep.pos.x = wp.x; vep.pos.y = wp.y; vep.pos.z = wp.z; vep.vel = { x: 0, y: 0, z: 0 }; }
  }
  lightSim.tick(LIGHT_TICK_BUDGET); // the worker drains once per frame (ADR 0012) — off the renderer's critical path; idle cost = one worker round-trip per frame (a small reply object)
  if (tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)) waterSim.tick(WATER_PULSE); // water on the tick heartbeat (ADR 0011): one pulse per 30 substeps = 0.5 sim s (was a wall-clock accumulator); settles are event-driven and stay snappy
  // Merge this frame's water + light touched chunks into the pending re-mesh set (both sims keep
  // their exact sim.touched contract: consumed and cleared exactly once per frame here).
  for (const key of waterSim.touched) pendingRebuild.add(key);
  waterSim.touched.clear();
  for (const key of lightSim.touched) pendingRebuild.add(key);
  lightSim.touched.clear();
  // First/fresh meshes of this frame's streamed chunks enter pendingRebuild only now — they were
  // loaded this frame or an earlier one, so their first worker reply has already landed (or the
  // chunk settled to all-zero light, which the move still meshes, correctly dark).
  deferredFirstMesh.forEach((key) => pendingRebuild.add(key));
  deferredFirstMesh.clear();
  // Re-mesh closest to the player first (light/water is a self-correcting lower bound, so a
  // briefly-stale mesh is fine — ADR 0012). A frame that runs a heavy-chunk slice — or starts
  // one (the probe already spent the frame's budget) — is RESERVED for it: a slice is ≤ ~7 ms
  // at the worst-case density, and the other budget slots would risk the 16.7 ms budget; the
  // skipped rebuilds carry one more frame. A probe-complete mesh is ≤ PROBE_VERTS verts =
  // ≤ 16.7 ms by construction, so it flows through the ordinary budget.
  const profDrainT0 = profMode ? performance.now() : 0; // the rig attributes the drain's share of the frame
  const vp = sim.viewed(); // re-mesh closest to the VIEWED entity first; ?? origin if the sim is (still) empty
  const pcx = chunkOf(vp?.pos.x ?? 0), pcy = chunkOf(vp?.pos.y ?? 0), pcz = chunkOf(vp?.pos.z ?? 0);
  const inFlight = scheduler.inFlightKey();
  if (inFlight) {
    const [cx, cy, cz] = inFlight.split(',').map(Number) as [number, number, number];
    if (world.hasChunk(cx, cy, cz)) {
      const band = scheduler.advance(inFlight)!;
      const sliceMesh = meshChunkRange(world, cx, cy, cz, lightSampler, band[0], band[1]);
      scheduler.store(inFlight, sliceMesh);
      const merged = scheduler.finish(inFlight);
      if (merged) {
        swapChunkMesh(cx, cy, cz, merged); // the old mesh was kept the whole split — swap at merge only
        if (inFlight === PROF_WORST_KEY) profRig?.noteRemesh('merge', meshVerts(merged));
        // The pending entry was deleted when the plan started; if it is back here, light/water
        // touched the chunk during the split (or streaming marked it dirty) — its slices saw
        // mixed per-frame light states, so the entry stays and the next frame re-meshes
        // (the self-correcting contract). No entry → the chunk is done.
      } else if (inFlight === PROF_WORST_KEY) {
        profRig?.noteRemesh('slice', meshVerts(sliceMesh));
      }
      // Non-final frames: nothing to delete — the entry was already gone at start, and the
      // pre-check finds the plan via the scheduler, not via pendingRebuild.
    } else {
      scheduler.cancel(inFlight); // unloaded between frames
      pendingRebuild.delete(inFlight);
    }
  } else if (pendingRebuild.size) {
    const list = [...pendingRebuild].map((k) => k.split(',').map(Number) as [number, number, number]);
    list.sort((a, b) => rebuildScore(a, pcx, pcy, pcz) - rebuildScore(b, pcx, pcy, pcz));
    for (const [cx, cy, cz] of list.slice(0, REBUILD_BUDGET)) {
      const key = `${cx},${cy},${cz}`;
      if (!world.hasChunk(cx, cy, cz)) {
        pendingRebuild.delete(key);
        continue;
      }
      const probe = probeMeshChunk(world, cx, cy, cz, lightSampler, PROBE_VERTS);
      pendingRebuild.delete(key);
      if (probe.complete) {
        swapChunkMesh(cx, cy, cz, probe.mesh); // the probe IS the full mesh — today's behavior
        if (key === PROF_WORST_KEY) profRig?.noteRemesh('probe-complete', meshVerts(probe.mesh));
      } else {
        // Heavy: the probe's partial buffer is discarded; start the slice plan and run band 0
        // this frame (the probe already spent the frame's budget — the frame is reserved).
        scheduler.start(key, decideBands(world.getChunk(cx, cy, cz)!, SLICE_COUNT));
        const [y0, y1] = scheduler.advance(key)!;
        const slice0 = meshChunkRange(world, cx, cy, cz, lightSampler, y0, y1);
        scheduler.store(key, slice0);
        if (key === PROF_WORST_KEY) profRig?.noteRemesh('plan', meshVerts(slice0));
        break;
      }
    }
  }
  profDrainMs = profMode ? performance.now() - profDrainT0 : 0;
  syncCamera();
  updateHitbox();
  syncEntityRigs(dt); // place/update the mob+player rigs; hide the viewed entity's rig (first person)
  syncHud(); // the "viewing: <kind>" label + hotbar visibility
  syncWaterFx();
  clouds.setVisible(waterFx === 'air');
  const skySample = sampleSky(worldTime.dayPhase);
  sky.apply(skySample, waterFx, camera);
  for (const u of daynessUniforms) u.value = skySample.dayness;
  for (const mat of Object.values(rigOf)) mat.color.setScalar(LIGHT_AMBIENT + (1 - LIGHT_AMBIENT) * skySample.dayness); // dim the rigs at night, matching the chunks' uDayness floor
  clouds.update(camera.position.x, camera.position.z, camera.position.y, worldTime.time, skySample.worldDim);
  const label = formatClock(worldTime.day, worldTime.hour);
  if (label !== clockLabel) {
    clockLabel = label;
    clockEl.textContent = label;
  }
  if (!profNoRender) renderer.render(scene, camera);
  if (profRig) {
    const rep = profRig.noteFrame(performance.now() - profT0, profDrainMs);
    if (rep) {
      console.log('PROF-RESULT ' + JSON.stringify(rep));
      (window as unknown as Record<string, unknown>).__profResult = rep;
    }
  }
  requestAnimationFrame(frame);
}

// The frame loop is kicked in startGame, once the boot gate has run (ADR 0014).