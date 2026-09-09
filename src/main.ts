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
import { Sim, HumanController, IdleController, MobController, eyeOf, lookDir, breakRayTarget, possessToggle, possessableCandidates, type ApplyHooks, type Controller, type EntityRecord } from './entity';
import { raycastVoxel, pickEntity, REACH, type RayHit } from './raycast';
import { spawnDeer } from './spawn';
import { buildEntityRig, updateEntityRig, advanceRigAnim, newRigAnim, RIG_COLORS, LEG_RATE, buildPartAtlas, type Rig, type RigAnim } from './entity-mesh';
import { WaterSim } from './water';
import { WorldTime, formatClock, tickCrossed } from './time';
import { sampleSky, createSky } from './sky';
import { createClouds } from './clouds';
import { LIGHT_AMBIENT, LIGHT_TICK_BUDGET } from './light';
import { LightClient } from './light-transport';
import { Persistence, applyRecord, snapshotChunk, type WorldMeta, type PersistSource } from './persistence';
import { IndexedDBChunkStore } from './idb-store';
import { Recorder, ReplayController, parseReplayParam, viewedAt, type Replay, type ReplaySnapshot } from './replay';
// Multiplayer (B1): the in-page LoopbackHub + the HostSession/ClientSession the render path drives.
import { LoopbackHub } from './net/transport';
import { HostSession } from './net/host';
import { ClientSession } from './net/client';
import { sanitizeName } from './net/name';
import { ScriptController, type ScriptStep } from './entity';
// Multiplayer (B2): the real-network Transport (trystero) + the ?host/?join lobby.
import { TrysteroTransport, webCryptoUnavailableMessage } from './net/trystero';

// === boot ===

function showFatalOverlay(title: string, body: string): void {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(0,0,0,0.78);z-index:10000';
  const box = document.createElement('div');
  box.style.cssText = 'max-width:680px;margin:24px;padding:24px;border:1px solid #666;border-radius:8px;background:#111';
  const h = document.createElement('h2');
  h.style.margin = '0 0 8px';
  h.textContent = title;
  const p = document.createElement('p');
  p.style.cssText = 'margin:0;white-space:pre-wrap;line-height:1.5';
  p.textContent = body;
  box.append(h, p);
  el.appendChild(box);
  document.body.appendChild(el);
}

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
// ?mp=host|client (B1): drive the render path with a HostSession / ClientSession over an in-page
// LoopbackHub. ?mp wins over ?replay/?prof (mutually exclusive; the replay/prof boot branches are
// skipped). ?phase/?dbg still apply. ?mp=host&bots=N (default 2); ?mp=client&bots=N (default 1).
const mpMode = new URLSearchParams(location.search).get('mp'); // 'host' | 'client' | null
const mpActive = mpMode === 'host' || mpMode === 'client';
const mpBots = mpActive
  ? Math.max(1, parseInt(new URLSearchParams(location.search).get('bots') ?? (mpMode === 'host' ? '2' : '1'), 10) || (mpMode === 'host' ? 2 : 1))
  : 0;
// ?mp=client&delay=N (dev): delay the in-page host→client links by N ticks, so Phase C's own-body
// prediction is VISIBLE (the body moves immediately on your intent, then snaps to the host's pose
// once the delayed `state`/`cells` arrive). No real network — it exercises the full predict/reconcile
// loop in-page. 0 (the default) is the immediate in-page loopback.
const mpDelay = mpActive
  ? Math.max(0, parseInt(new URLSearchParams(location.search).get('delay') ?? '0', 10) || 0)
  : 0;
// ?host / ?join=<code> (B2): the real lobby over a TrysteroTransport (a real network, not the ?mp
// in-page LoopbackHub). ?host starts a session and shows the room code (an optional ?host=<code>
// fixes it, so the e2e can pass the same code to both tabs); ?join=<code> joins. The lobby wins
// over ?mp/?replay/?prof (they are mutually exclusive; only one boot branch runs).
const lobbyHost = new URLSearchParams(location.search).has('host'); // ?host (presence, with or without a code)
const lobbyJoinCode = new URLSearchParams(location.search).get('join'); // ?join=<code>
const lobbyActive = lobbyHost || lobbyJoinCode !== null;
const APP_ID = 'block-world'; // the trystero namespace (a shared constant both sides must match on)
let worldTime = new WorldTime(startPhase); // let: the B1 boot reassigns it to the session's clock
const sky = createSky(scene, FOG_AIR, FOG_WATER, BG_WATER);
const clouds = createClouds(scene);
const clockEl = document.getElementById('clock')!;
let clockLabel = '';
const scrubEl = document.getElementById('scrub')!; // phase 3: the recording/playback scrub HUD (ADR 0017)
const scrubLabelEl = document.getElementById('scrub-label')!; // the scrub label (recording… / replay t…)
const scrubQuitEl = document.getElementById('scrub-quit')!; // the "quit replay" button (playback only)

// Quit a replay: reload the page WITHOUT the ?replay param, which boots the normal world from the
// real save (the replay is read-only, so the real save is untouched — see the playback persist guards).
scrubQuitEl.addEventListener('click', () => {
  const url = new URL(location.href);
  url.searchParams.delete('replay');
  location.href = url.toString();
});

// === world-state ===

let world = new World(); // let: the B1 boot reassigns it to the session's world

// T10 streams the rest of the world on demand; the spawn column itself is restored or
// generated in startGame (the boot gate below), so the measured-spawn scan runs after it.

// Water sim (PROJECT.md §9, src/water.ts): flow state streams with each chunk; it is
// settled per chunk as streaming loads them (tickStreaming) and advanced on the tick
// heartbeat (one pulse per WATER_STRIDE substeps; ADR 0011). The boot-generated spawn
// column is settled by the first tickStreaming, before the first rendered frame, so
// caves read as already filled. The client (B1) has no WaterSim (water arrives via cells), so this
// is nullable and the water-pulse / water-settle paths guard on it.
let waterSim = new WaterSim(world);

// Light sim (PROJECT.md §18, src/light.ts): two 0..15 fields streamed with each chunk.
// Runs in a web worker (ADR 0012): the pin-identical LightSim drains/settles over a mirror of
// the chunk fields; the replies push the touched chunks' fields back into the world and
// feed the frame-end re-mesh via `touched` (the sim.touched contract, one reply late). The B1 boot
// recreates this for the session's world + clock.
let lightSim = new LightClient(world, worldTime);
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
let sim = new Sim(world, simHooks, TERRAIN_SEED); // let: the B1 boot reassigns it to the session's sim
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

// A no-op PersistSource for PLAYBACK: a replay is read-only and self-contained — it regenerates
// new areas deterministically (never reads the real save) and never writes (no onUnload/saveMeta/
// saveLoaded). Passing it to streaming.update during playback means the pending list stays empty
// (hasPersisted is false) so the async fetch path is skipped too.
const noopPersist: PersistSource = {
  hasPersisted: () => false,
  syncRecord: () => undefined,
  fetchRecord: () => Promise.resolve(undefined),
  onUnload: () => undefined,
  dropPersisted: () => undefined,
};

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

// === Multiplayer (B1) ===
// The B1 session (a HostSession for ?mp=host, a ClientSession for ?mp=client) that the frame loop
// drives (session.tick per substep) + the in-page LoopbackHub (pumped per substep). Null in
// single-player. The module globals (world/sim/waterSim/worldTime) are reassigned to the
// session's objects at boot so the render path runs unchanged against them.
let mpSession: HostSession | ClientSession | null = null;
let mpHub: LoopbackHub | null = null;
let mpHost: HostSession | null = null; // the authoritative session (host mode: the host; client mode: the in-page headless host)
let mpClients: ClientSession[] = []; // the intent-sending clients (host mode: the bots; client mode: the other players + the page's own body)
let mpOtherTransports: { transport: { disconnect(): void }; name: string }[] = []; // the ?mp=client other players' transports (the leave check disconnects one at tick 250)
let mpFirstPos: Map<number, { x: number; z: number }> | null = null; // the ?mp=host remote players' first-observed positions (the report asserts they moved off it)
let mpLeaveFired = false; // one-shot: the ?mp=client leave check disconnects an other player once, at the first tick >= 250 (the frame loop can run multiple substeps/frame, so an exact === match would be flaky)

// SPAWN is computed in startGame, after the boot column exists (it may be RESTORED from
// a persisted record — the scan must read the current world state, whatever that is).
let SPAWN: THREE.Vector3;

// === multiplayer lobby (B2) helpers ===
// A short, unambiguous room code (no l/o/0/1 — they read alike). The host shows it; a peer types
// it as ?join=<code>. ?host=<code> fixes it (the e2e passes the same code to both tabs).
function genRoomCode(): string {
  const A = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}
// The lobby overlay: the room code + a copy button + a live peer list (polled every 500 ms — the
// HostSession/ClientSession own the transport's onPeerJoin/onPeerLeave, so the lobby reads peers()
// instead of registering its own callback). `window.__lobby` is the e2e hook.
function showLobby(code: string, isHost: boolean, tr: { peers(): string[] }, session: HostSession | ClientSession, name: string): void {
  const el = document.createElement('div');
  el.id = 'lobby';
  el.style.cssText = 'position:fixed;top:12px;right:12px;z-index:9998;background:rgba(0,0,0,.72);color:#fff;font:13px/1.5 sans-serif;padding:10px 12px;border-radius:8px;max-width:300px';
  el.innerHTML =
    `<div style="font-weight:600;margin-bottom:6px">${isHost ? 'Hosting a world' : 'Joined a world'}</div>` +
    `<div>Room code</div>` +
    `<div id="lobby-code" style="font:600 20px monospace;letter-spacing:2px;margin:2px 0 6px;user-select:all">${code}</div>` +
    `<button id="lobby-copy" style="cursor:pointer;font:12px sans-serif;padding:4px 8px;background:#2a2a2a;color:#fff;border:1px solid #555;border-radius:4px">copy code</button>` +
    `<div id="lobby-peers" style="margin-top:8px;color:#bbb">Peers: ${isHost ? 'waiting for players…' : 'connecting to host…'}</div>`;
  document.body.appendChild(el);
  // The display name (textContent, so a pasted `<script>`-ish name cannot inject HTML) — under the header.
  const nameEl = document.createElement('div');
  nameEl.style.cssText = 'color:#bbb;margin-bottom:6px';
  nameEl.textContent = `name: ${name}`;
  el.firstElementChild?.after(nameEl);
  const copyBtn = document.getElementById('lobby-copy')!;
  copyBtn.addEventListener('click', () => {
    navigator.clipboard?.writeText(code).then(() => { copyBtn.textContent = 'copied!'; setTimeout(() => { copyBtn.textContent = 'copy code'; }, 1200); }).catch(() => {});
  });
  const peersEl = document.getElementById('lobby-peers')!;
  const render = () => { const p = tr.peers(); peersEl.textContent = p.length ? 'Peers: ' + p.join(', ') : (isHost ? 'Peers: waiting for players…' : 'Peers: connecting to host…'); };
  const timer = setInterval(render, 500);
  render();
  // The e2e hook: the connected peer ids (the transport connection) + the remote players this side
  // sees in its sim (the "see each other" render sense — the host's clients / the client's host).
  (window as unknown as Record<string, unknown>).__lobby = {
    code, isHost,
    peers: () => tr.peers(),
    remotePlayers: () => session.sim.all()
      .filter((e) => e.kind.id === 'player' && e.id !== session.sim.viewedId)
      .map((e) => ({ id: e.id, name: e.name ?? null, x: Math.round(e.pos.x * 10) / 10, z: Math.round(e.pos.z * 10) / 10 })),
    ownPos: () => { const e = session.sim.viewed(); return e ? { x: e.pos.x, y: e.pos.y, z: e.pos.z } : null; },
    _dispose: () => clearInterval(timer),
  };
}

// === boot gate (ADR 0014) ===
// The game starts only once persistence has booted (key set + meta) — capped at 5 s:
// a stalled IDB must not hold the first frame hostage (the fallback starts a fresh
// world; a late meta is dropped, documented edge). startGame restores-or-generates the
// boot column, restores world state, and kicks the frame loop.
let booted = false;
async function startGame(meta: WorldMeta | null): Promise<void> {
  if (booted) return;
  booted = true;
  // === multiplayer lobby (B2) ===
  // ?host/?join win over ?mp/?replay/?prof. The session is wired exactly like the B1 ?mp boot
  // (reassign the module globals to the session's objects so the render path runs unchanged; the
  // frame loop ticks the clients -> delivers transport msgs -> ticks the local host -> advanceTick),
  // differing only in the Transport: a real TrysteroTransport (WebRTC data channels) instead of the
  // in-page LoopbackHub. A host has no local clients (real peers are remote; their intents arrive
  // via the transport's onMessage); a client has no in-page headless host (the real host is a
  // separate tab), so the frame loop's host-tick step is conditional on mpHost (null here).
  if (lobbyActive) {
    const webCryptoError = webCryptoUnavailableMessage();
    if (webCryptoError) {
      showFatalOverlay('Multiplayer unavailable', webCryptoError);
      return;
    }
    // The display name (?host&name= / ?join=code&name=): typed (non-empty param) names are
    // remembered for the M menu; an empty param gets a random name (not remembered).
    const nameParam = new URLSearchParams(location.search).get('name') ?? '';
    const name = sanitizeName(nameParam);
    if (nameParam.trim() !== '') localStorage.setItem('bw.name', name);
    const code = lobbyHost ? (new URLSearchParams(location.search).get('host') || genRoomCode()) : (lobbyJoinCode as string);
    const tr = new TrysteroTransport(APP_ID, code);
    let session: HostSession | ClientSession;
    if (lobbyHost) {
      const host = new HostSession(tr, TERRAIN_SEED, { withOwnPlayer: true, ownController: human, ownName: name, persist, hooks: simHooks });
      session = host; mpHost = host; mpClients = []; // no local clients: real peers are remote
      world = host.world; sim = host.sim; waterSim = host.waterSim; worldTime = host.worldTime;
      { const ve = host.sim.viewed(); if (ve) human.setLook(ve.yaw, ve.pitch); } // sync the look to the own body's spawn look (mirrors the single-player boot sync)
    } else {
      const client = new ClientSession(tr, name, human);
      session = client; mpHost = null; mpClients = [client]; // the page's own body (tick it to send intents)
      client.setLightEdit((x, y, z) => { lightSim?.edit(x, y, z); }); // the client's light tracks the host's edits
      client.onPeerLeave((id) => { // the host (the welcome sender) left -> a static view of the last world
        if (id === client.hostId && mpSession === client) {
          mpSession = null;
          const el = document.createElement('div');
          el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font:600 24px sans-serif;z-index:9999;pointer-events:none;text-shadow:0 0 8px #000';
          el.textContent = 'host left';
          document.body.appendChild(el);
        }
      });
      world = client.world; sim = client.sim; worldTime = client.worldTime;
    }
    lightSim = new LightClient(world, worldTime); // the page's light worker runs on the session's world
    window.__lightDebug = lightSim;
    mpSession = session;
    mpHub = null; // no in-page hub to pump (a real transport delivers messages asynchronously)
    showLobby(code, lobbyHost, tr, session, name);
    syncCamera();
    requestAnimationFrame(frame);
    return;
  }
  // === multiplayer (B1) ===
  // ?mp wins over ?replay/?prof. The session is created + the module globals are reassigned to the
  // session's objects so the whole render path (light, re-mesh, syncCamera, syncEntityRigs) runs
  // unchanged against the session's world/sim. The light worker is recreated for the session's
  // world + worldTime. The in-page LoopbackHub is pumped per substep (the frame loop).
  if (mpActive) {
    // ?mp=client&delay=N: delay the authoritative host's outgoing links (host→client `state`/`cells`)
    // so the client's own-body prediction is visible (it moves on your intent, then reconciles when
    // the delayed host word arrives). The host's id is 'host' (?mp=host) or 'headless' (?mp=client).
    const hub = new LoopbackHub({ delay: (from) => (from === 'host' || from === 'headless') ? mpDelay : 0 });
    let session: HostSession | ClientSession;
    if (mpMode === 'host') {
      // The host renders its authoritative world + the bot clients' remote players (their rigs
      // appear + move as their intents are applied by the host's sim).
      session = new HostSession(hub.connect('host'), TERRAIN_SEED, { withOwnPlayer: true, persist, hooks: simHooks });
      const host = session as HostSession;
      mpHost = host; // the authoritative session
      const botSteps: ScriptStep[] = [
        { op: 'walkTo', x: 8, z: 48, timeout: 120 },
        { op: 'walkTo', x: 12, z: 44, timeout: 120 },
        { op: 'walkTo', x: 6, z: 50, timeout: 120 },
        { op: 'wait', ticks: 60 },
      ];
      for (let i = 0; i < mpBots; i++) {
        const c = new ClientSession(hub.connect(`bot${i}`), `bot${i}`, new ScriptController(botSteps, true));
        c.setLightEdit(() => { /* the bot clients are remote (no page light); no-op */ });
        mpClients.push(c); // the bots send intents each substep (the frame loop ticks them)
      }
      world = host.world; sim = host.sim; waterSim = host.waterSim; worldTime = host.worldTime;
    } else {
      // The client renders its pristine-terrain world + host-fed cells + the other players'
      // interpolated rigs + its own body. The in-page headless host is simulation-only (never
      // meshed/lit — it is not the frame loop's world). waterSim stays the page's (the frame loop
      // + consumeStream skip water work for the client via the mode check — it has no WaterSim).
      const headless = new HostSession(hub.connect('headless'), TERRAIN_SEED, { withOwnPlayer: false });
      mpHost = headless; // the authoritative session (simulation-only — never meshed/lit)
      const otherSteps: ScriptStep[] = [
        { op: 'walkTo', x: 8, z: 48, timeout: 120 },
        { op: 'walkTo', x: 12, z: 44, timeout: 120 },
        { op: 'wait', ticks: 60 },
      ];
      for (let i = 0; i < mpBots; i++) {
        const t = hub.connect(`other${i}`);
        const c = new ClientSession(t, `other${i}`, new ScriptController(otherSteps, true));
        c.setLightEdit(() => { /* the other players are remote (no page light); no-op */ });
        mpClients.push(c); // the other players send intents each substep (the frame loop ticks them)
        mpOtherTransports.push({ transport: t, name: `other${i}` });
      }
      session = new ClientSession(hub.connect('me'), 'me', human); // the client's own body is driven by the page's HumanController (immediate look + movement)
      const client = session as ClientSession;
      mpClients.push(client); // the page's own body sends intents too
      client.setLightEdit((x, y, z) => { lightSim?.edit(x, y, z); }); // the client's light tracks the host's edits
      client.onPeerLeave((id) => { // the headless host leaves → "host left" + stop driving (static view of the last-received world)
        if (id !== 'headless') return;
        mpSession = null;
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font:600 24px sans-serif;z-index:9999;pointer-events:none;text-shadow:0 0 8px #000';
        el.textContent = 'host left';
        document.body.appendChild(el);
      });
      world = client.world; sim = client.sim; worldTime = client.worldTime;
    }
    lightSim = new LightClient(world, worldTime); // the page's light worker runs on the session's world
    window.__lightDebug = lightSim;
    mpSession = session;
    mpHub = hub;
    syncCamera();
    requestAnimationFrame(frame);
    return;
  }
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
      // Follow the user's recorded PERSPECTIVE: the viewed entity at record start (the snapshot's
      // viewedEntityId). The frame loop (viewedAt) switches it as they possessed other entities
      // during recording — so the viewer sees what the recorder actually saw, not always the body.
      sim.setViewed(replay.snapshot.meta.viewedEntityId); // no-op if the entity doesn't exist (old recording)
      if (!sim.viewed()) { const body = sim.all().find((e) => e.kind.id === 'player'); sim.setViewed(body ? body.id : sim.ghostId); }
      { const ve = sim.viewed(); if (ve) human.setLook(ve.yaw, ve.pitch); } // sync the live look to the recorded look (the initial view faces where they were)
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
const startFatal = (err: unknown): void => { console.error(err); showFatalOverlay('Boot failed', String(err instanceof Error ? err.message : err)); };
const bootGate = window.setTimeout(() => { console.log('[persistence] boot gate: IDB stalled past 5 s — starting a fresh world (any late meta is dropped)'); void startGame(null).catch(startFatal); }, 5000); // fallback: a stalled boot still starts (fresh world)
void persist.boot().then((meta) => {
  window.clearTimeout(bootGate);
  void startGame(meta).catch(startFatal);
});

// === entity rigs ===

// One material per kind (a deterministic speckled part-atlas, block-atlas style). The rig
// renders every non-spectator entity; the viewed entity's rig is hidden (first person).
const rigOf: Record<string, THREE.MeshBasicMaterial> = {};
for (const [id, color] of Object.entries(RIG_COLORS)) rigOf[id] = new THREE.MeshBasicMaterial({ map: buildPartAtlas(color, 0x5eed) });
const rigs = new Map<number, { rig: Rig; anim: RigAnim }>();
// Name tags (B1): one THREE.Sprite per entity id (positioned above the rig); the texture (a small
// canvas with the name) is cached by name (many "Louis"es share one texture) but the sprite is
// keyed by entity id (two peers who both type "Louis" don't share one tag / position).
const tagTextureCache = new Map<string, THREE.CanvasTexture>();
const nameTags = new Map<number, THREE.Sprite>();
function tagTexture(name: string): THREE.CanvasTexture {
  let t = tagTextureCache.get(name);
  if (!t) {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d')!; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#fff'; ctx.fillText(name.slice(0, 14), 128, 34);
    t = new THREE.CanvasTexture(canvas);
    tagTextureCache.set(name, t);
  }
  return t;
}
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
    // Name tag (B1): one sprite per entity id, positioned above the rig; the texture is cached by name.
    if (e.name) {
      let tag = nameTags.get(e.id);
      if (!tag) {
        tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTexture(e.name), depthTest: false }));
        tag.scale.set(1.6, 0.4, 1);
        scene.add(tag);
        nameTags.set(e.id, tag);
      }
      tag.position.set(e.pos.x, e.pos.y + 1.8, e.pos.z); // above the rig
      tag.visible = e.id !== sim.viewedId; // hide the viewed entity's tag (first person)
    }
  }
  for (const [id, entry] of rigs) if (!seen.has(id)) { scene.remove(entry.rig.root); rigs.delete(id); }
  for (const [id, tag] of nameTags) if (!seen.has(id)) { scene.remove(tag); tag.material.map?.dispose(); nameTags.delete(id); }
}

// The HUD kind label + hotbar visibility: show what you are viewing, and hide the hotbar when
// the viewed kind can't edit (a deer / the ghost can't place blocks).
function syncHud(): void {
  const ve = sim.viewed();
  kindEl.textContent = ve ? `viewing: ${ve.kind.id}` : '';
  hotbarEl.classList.toggle('hidden', !ve || !ve.kind.canEdit);
  // === replay scrub HUD (phase 3, ADR 0017) ===
  if (recording) {
    scrubEl.classList.remove('hidden');
    scrubLabelEl.textContent = '● recording… (R to stop)';
    scrubQuitEl.classList.add('hidden');
  } else if (playback) {
    scrubEl.classList.remove('hidden');
    scrubLabelEl.textContent = `replay ${playback.paused ? '⏸ paused' : '▶ playing'}   t ${worldTime.tick} / ${playback.replay.endTick}`;
    scrubQuitEl.classList.remove('hidden'); // the "quit replay" button (reload without ?replay)
  } else scrubEl.classList.add('hidden');
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
  // The camera follows the viewed entity's position + look. The client's own body: the position is
  // interpolated (syncPoses wrote it at renderTick); the look is immediate (the page's
  // HumanController's live mouse look, not the interpolated pose) — so the look never feels 100 ms
  // behind, even though the body's position lags by NET_INTERP_TICKS.
  camera.position.set(ve.pos.x, ve.pos.y + ve.kind.eye, ve.pos.z);
  if (mpSession instanceof ClientSession) {
    const look = human.getLook();
    camera.rotation.set(look.pitch, look.yaw, 0);
  } else {
    camera.rotation.set(ve.pitch, ve.yaw, 0);
  }
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
  // Typing in a text input (the MP menu's name/code fields) must not drive the game: the letters
  // would land in `keys` (the typed characters move the player) and fire the toggle keys (typing
  // "m" in the name would close the very menu being typed in; digits would pick hotbar slots).
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  keys.add(e.code);
  if (e.repeat) return;
  // The MP menu is a menu, not a game state: while it is open (and focus has left the inputs)
  // only the overlay keys switch overlays — movement/entity toggles stay inert.
  if (mpMenuOpen && !(e.code === 'KeyE' || e.code === 'KeyH' || e.code === 'KeyM' || e.code === 'KeyR')) return;
  if (e.code === 'KeyF') human.toggleFly(); // fly toggle (a one-tick edge the sim consumes)
  if (e.code === 'KeyN') human.toggleNoclip(); // noclip toggle
  if (e.code === 'KeyR') {
    if (recording) { stopRecording(); openReplays(); } // stop + auto-open the list (the new recording is there)
    else toggleReplays(); // open/close the recordings list
  }
  if (e.code === 'KeyE') togglePalette(); // creative palette: open (unlock) / close (re-lock)
  if (e.code === 'KeyH') toggleHelp(); // help overlay: same open (unlock) / close (re-lock)
  if (e.code === 'KeyM') toggleMpMenu(); // multiplayer menu: host / join (single-player screen only)
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
  else if (replaysOpen) closeReplays();
  else if (mpMenuOpen) closeMpMenu();
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
  // Possession candidates are owned by the entity layer (spec 2026-09-08): no ghost, no other
  // player entities, and no entity already driven by this page's human controller.
  const candidates = possessableCandidates(sim, human);
  const hit = pickEntity(eyeOf(ve), lookDir(ve.yaw, ve.pitch), candidates, REACH);
  // P exits possession first when the human is already out of its home body; otherwise it
  // possesses the targeted entity (or toggles body<->ghost when nothing is targeted).
  possessToggle(sim, human, hit ? candidates[hit.index].id : null);
  // Log the new perspective for replay: the user's view switches to whatever is now viewed, so the
  // playback follows what they actually saw (a possessed deer, not always the player body).
  if (recording && recorder) recorder.onViewed(worldTime.tick, sim.viewedId);
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
    viewed: recorder.viewed,   // the user's perspective over time (possession changes)
    recordedAt: Date.now(),    // wall-clock save time (for the recordings list)
    snapshot: recordStartSnapshot, // the initial state (record start)
  };
  const key = `${TERRAIN_SEED}:replay:${replay.startTick}`;
  persist.saveReplay(key, replay);
  sim.onIntent = sim.onSpawn = sim.onDespawn = undefined; // detach the Recorder
  recorder = null; recording = false; recordStartSnapshot = null;
  console.log(`[replay] saved ${key} — ${replay.intents.length} intents, ${replay.events.length} events (replay with ?replay=${key})`);
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
let replaysOpen = false;
let mpMenuOpen = false;
const helpEl = document.getElementById('help')!;
const helpHintEl = document.getElementById('help-hint')!;
const replaysEl = document.getElementById('replays')!;
const replaysListEl = document.getElementById('replays-list')!;
const replaysRecordEl = document.getElementById('replays-record')!;
const mpMenuEl = document.getElementById('mp-menu')!;
const mpNameEl = document.getElementById('mp-name') as HTMLInputElement;
const mpCodeEl = document.getElementById('mp-code') as HTMLInputElement;
const mpErrorEl = document.getElementById('mp-error')!;

// Browsers enforce a ~1 s re-lock cooldown after ESC; a rejected request is benign
// (the cooldown is the only realistic failure), so swallow it rather than throw.
function lockPointer(): void {
  const r = renderer.domElement.requestPointerLock() as unknown;
  if (r instanceof Promise) r.catch(() => {}); // Safari rejects without a user gesture
}

// Invariant: at most one overlay (palette/help/replays/mp-menu) is open. The badge advertises help and is
// visible only when nothing is open.
function syncOverlays(): void {
  helpHintEl.classList.toggle('hidden', paletteOpen || helpOpen || replaysOpen || mpMenuOpen);
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
  if (replaysOpen) {
    replaysOpen = false;
    replaysEl.classList.add('hidden');
  }
  if (mpMenuOpen) {
    mpMenuOpen = false;
    mpMenuEl.classList.add('hidden');
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
  if (replaysOpen) {
    replaysOpen = false;
    replaysEl.classList.add('hidden');
  }
  if (mpMenuOpen) {
    mpMenuOpen = false;
    mpMenuEl.classList.add('hidden');
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

function closeMpMenu(): void {
  mpMenuEl.classList.add('hidden');
  mpMenuOpen = false;
  syncOverlays();
  lockPointer();
}

function openMpMenu(): void {
  if (paletteOpen) { paletteOpen = false; paletteEl.classList.add('hidden'); }
  if (helpOpen) { helpOpen = false; helpEl.classList.add('hidden'); }
  if (replaysOpen) { replaysOpen = false; replaysEl.classList.add('hidden'); }
  mpMenuOpen = true;
  mpMenuEl.classList.remove('hidden');
  mpNameEl.value = localStorage.getItem('bw.name') ?? ''; // remember the typed name across visits
  mpErrorEl.classList.add('hidden');
  syncOverlays();
  document.exitPointerLock();
  mpNameEl.focus();
}

// The M menu is a single-player-screen affordance: while a session (?mp / ?host / ?join) or a
// replay is running the boot branch already ran — no-op.
function toggleMpMenu(): void {
  if (mpMenuOpen) { closeMpMenu(); return; }
  if (mpSession || playback) return;
  openMpMenu();
}

// Host/Join reload into ?host&name=… / ?join=<code>&name=… (the code is normalized to the code
// alphabet's lowercase; the name goes in the URL — sanitizeName at boot handles blank → random).
document.getElementById('mp-host')!.addEventListener('click', () => {
  location.href = `?host&name=${encodeURIComponent(mpNameEl.value)}`;
});
document.getElementById('mp-join')!.addEventListener('click', () => {
  const code = mpCodeEl.value.trim().toLowerCase();
  if (code === '') { mpErrorEl.textContent = 'paste the room code the host shows'; mpErrorEl.classList.remove('hidden'); return; }
  location.href = `?join=${encodeURIComponent(code)}&name=${encodeURIComponent(mpNameEl.value)}`;
});

// The recordings list (R): a centered panel of the saved recordings (newest first) + a
// "record new" button. Opening it fetches the list from the replay store and closes the
// other overlays. A row click reloads the page with ?replay=<key> (a full-page load of that session).
function openReplays(): void {
  if (paletteOpen) {
    paletteOpen = false;
    paletteEl.classList.add('hidden');
  }
  if (helpOpen) {
    helpOpen = false;
    helpEl.classList.add('hidden');
  }
  if (mpMenuOpen) {
    mpMenuOpen = false;
    mpMenuEl.classList.add('hidden');
  }
  replaysOpen = true;
  replaysEl.classList.remove('hidden');
  syncOverlays();
  document.exitPointerLock();
  refreshReplayList(); // (re)load the recordings (async; renders into the panel when resolved)
}

function closeReplays(): void {
  replaysEl.classList.add('hidden');
  replaysOpen = false;
  syncOverlays();
  lockPointer();
}

function toggleReplays(): void {
  if (replaysOpen) closeReplays();
  else openReplays();
}

// Fetch the saved recordings and render them (newest first). Called on open and after a save.
function refreshReplayList(): void {
  persist.listReplays().then((replays) => {
    if (!replaysOpen) return; // closed while the fetch was in flight — don't render into a hidden panel
    buildReplayList(replays);
  });
}

// Render the recordings list: one row per recording (date, length, start tick). An empty store
// shows a hint. Each row is a full-page load of its session (?replay=<key>).
function buildReplayList(replays: Replay[]): void {
  replaysListEl.replaceChildren();
  if (replays.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'no recordings yet — press R, then record something';
    replaysListEl.append(empty);
    return;
  }
  const sorted = [...replays].sort((a, b) => (b.recordedAt ?? 0) - (a.recordedAt ?? 0)); // newest first
  for (const r of sorted) {
    const key = `${r.seed}:replay:${r.startTick}`;
    const row = document.createElement('div');
    row.className = 'row';
    const when = document.createElement('span');
    when.className = 'when';
    when.textContent = r.recordedAt ? new Date(r.recordedAt).toLocaleString() : '—';
    const len = document.createElement('span');
    len.className = 'len';
    len.textContent = `${((r.endTick - r.startTick) * STEP).toFixed(1)} s`;
    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.textContent = `#${r.startTick}`;
    row.append(when, len, tick);
    row.addEventListener('click', () => {
      const url = new URL(location.href);
      url.searchParams.set('replay', key);
      location.href = url.toString(); // full-page load of the session
    });
    replaysListEl.append(row);
  }
}

replaysRecordEl.addEventListener('click', () => {
  startRecording(); // begin a recording (the list closes; the new recording appears on stop)
  closeReplays();
});

helpHintEl.addEventListener('click', () => { if (!helpOpen) openHelp(); });

// The default hotbar select happens in startGame (a restored meta takes the slots instead).

// Wheel cycles the hotbar (down = next slot); while an overlay is open the wheel is left alone.
window.addEventListener(
  'wheel',
  (e) => {
    if (paletteOpen || helpOpen || replaysOpen) return; // an open overlay owns the wheel (and the mouse is free)
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
  const r = streaming.update(world, pcx, pcz, pcy, playback ? noopPersist : persist, sim); // sim = EntitySource: entities ride the unload. playback → no-op source (read-only, self-contained)
  consumeStream(r, playback ? noopPersist : persist, false);
}

/** The mesh-adjacent work for a streaming result: light load/unload, deferred first mesh, water
 * settle/restore (host), deer spawn (host), pending fetch. The single-player's tickStreaming and
 * the B1 frame loop (host/client) both consume a StreamingUpdate via this. `isClient` skips the
 * water work + the deer spawn/despawn + the save point (the client has no WaterSim — water arrives
 * via cells; its deer come from the host; it has no save point). `persist` is the session's persist
 * (the host's Persistence / the client's NetworkPersistSource / the single-player's Persistence). */
function consumeStream(r: streaming.StreamingUpdate, persist: PersistSource, isClient: boolean): void {
  const ve = sim.viewed();
  const pcx = ve ? chunkOf(ve.pos.x) : 0, pcz = ve ? chunkOf(ve.pos.z) : 0;
  for (const c of r.unloaded) {
    removeChunkMesh(c.cx, c.cy, c.cz);
    lightSim.unload(c.cx, c.cy, c.cz); // the worker re-seeds the surviving seams (the darkness wave)
    pendingRebuild.delete(chunkKey(c.cx, c.cy, c.cz)); // don't re-mesh a chunk we just unloaded
    deferredFirstMesh.delete(chunkKey(c.cx, c.cy, c.cz)); // it may still be waiting for its first mesh
    if (!isClient) for (const d of sim.entitiesInChunk(c.cx, c.cy, c.cz)) // the deer leaving with the chunk persist via the entity-ride; restore on walk-back (host)
      if (d.kind.id === 'deer' || d.kind.id === 'dolt') sim.despawn(d.id);
  }
  if (r.unloaded.length && !playback && !isClient) (persist as Persistence).saveMeta(metaSnapshot()); // the world just changed durably (a chunk left): refresh the save point (host). NEVER during playback.
  for (const c of r.rebuilt) {
    if (!isClient) waterSim.settle(c.cx, c.cy, c.cz); // the host's water settle BEFORE meshing (the client has no WaterSim — water arrives via cells)
    lightSim.load(c.cx, c.cy, c.cz); // the worker settles it; the fields land with the tick reply
    deferredFirstMesh.add(chunkKey(c.cx, c.cy, c.cz)); // ADR 0012: the first/fresh mesh waits a guaranteed frame
  }
  if (!isClient) for (const c of r.generated) spawnDeer(world, sim, c.cx, c.cz); // deer into freshly GENERATED columns only (host); the client's deer come from the host
  for (const c of r.restored) {
    const ch = world.getChunk(c.cx, c.cy, c.cz)!;
    if (!isClient) waterSim.restore(ch); // the host's water restore (the client has no WaterSim)
    lightSim.load(c.cx, c.cy, c.cz); // light is never persisted: the worker re-settles the chunk
    deferredFirstMesh.add(chunkKey(c.cx, c.cy, c.cz)); // first mesh of the restored chunk, same pacing as a load
  }
  for (const c of r.pending) {
    const key = chunkKey(c.cx, c.cy, c.cz);
    if (restoring.has(key)) continue; // a fetch for this key is already in flight
    restoring.add(key);
    void persist.fetchRecord(c.cx, c.cy, c.cz).then((rec) => {
      restoring.delete(key); // free the slot whether we apply or drop
      if (!rec) { persist.dropPersisted(c.cx, c.cy, c.cz); return; }
      if (!ve || !streaming.inRange(c.cx, c.cz, pcx, pcz)) return; // stale guard: the player may have moved on
      if (world.hasChunk(c.cx, c.cy, c.cz)) return; // a duplicate in-flight fetch applied it first
      applyRecord(world, rec, sim, streamControllerFor); // restore frozen entities into the sim (idle)
      streaming.markNeighborsDirty(world, c.cx, c.cy, c.cz, pcx, pcz);
      const ch = world.getChunk(c.cx, c.cy, c.cz)!;
      if (!isClient) waterSim.restore(ch);
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
  if (playback) return; // a replay is read-only: never overwrite the real save with the replay's state (player pos / edits)
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
    if (mpSession) {
      for (const c of mpClients) c.tick(worldTime.tick); // the clients send intents (?mp bots; lobby: the own body)
      mpHub?.pump(worldTime.tick); // deliver the in-page loopback (a no-op for a real transport, mpHub null)
      if (mpHost) { // a local authoritative host (?mp=host / ?mp=client headless host / ?host lobby)
        mpHost.worldTime.tick = worldTime.tick; // sync the host's tick to the frame tick (a no-op in host mode, where the host's worldTime IS the page's; in client mode the headless host's own tick would otherwise stay 0 and its `state` ticks would collapse the client's pose rings)
        mpHost.tick(worldTime.tick); // the authoritative host applies the intents + broadcasts state/time
      }
      worldTime.advanceTick(); // the frame loop owns the tick (the host/client sessions don't advance it)
    } else {
      sim.tick(STEP, worldTime.tick); // the single-player sim heartbeat: intent -> applyIntent -> stepEntity
      worldTime.advance(STEP);
    }
    if (playback) {
      // Follow the user's recorded perspective: switch the viewed entity as they possessed others
      // during recording (viewedAt resolves the current tick's perspective).
      sim.setViewed(viewedAt(playback.replay, worldTime.tick));
      if (worldTime.tick >= playback.replay.endTick) playback.paused = true; // reached the end of the session
    }
  }
  if (mpSession) {
    // The session's per-substep streaming supersedes the single-player's tickStreaming; the frame
    // consumes the last substep's result (light load/unload + deferred first mesh) once per frame.
    const r = mpSession.lastStream;
    if (r) consumeStream(r, mpSession.persist, mpSession instanceof ClientSession);
  } else {
    tickStreaming(); // ONCE per frame (the single-player's compat-form streaming + consumeStream)
  }
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
  lightSim.tick(LIGHT_TICK_BUDGET); // the worker drains once per frame (ADR 0012)
  // The host's + single-player's water heartbeat (ADR 0011). The client has no WaterSim (water
  // arrives via cells), so skip it — the module waterSim is the single-player's (untouched).
  if (!(mpSession instanceof ClientSession) && tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)) waterSim.tick(WATER_PULSE);
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
  if (mpSession instanceof ClientSession) mpSession.syncPoses(); // interpolate the entities' poses at renderTick (the own body's position)
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
  // Multiplayer (B1) scenario report: ?mp=host / ?mp=client, mirrored by the Playwright e2e
  // (tests/e2e/mp-{host,client}.spec.ts). The leave check disconnects an other player at tick 250
  // (the rig + tag are removed by syncEntityRigs); the report at tick 300 asserts the removal.
  if (mpActive && mpMode === 'client' && !mpLeaveFired && worldTime.tick >= 250 && mpOtherTransports.length > 1) {
    mpLeaveFired = true; // fire once (the tick can jump past 250 when a frame runs multiple substeps)
    mpOtherTransports[1]!.transport.disconnect(); // disconnect an other player (its rig + tag are removed)
  }
  // ?mp=host: record each remote player's first-observed position (the report asserts they moved off it —
  // catches the "host never applies the bots' intents" regression, where the bots stay frozen at spawn).
  if (mpActive && mpMode === 'host') {
    if (!mpFirstPos) mpFirstPos = new Map();
    for (const e of sim.all()) {
      if (e.kind.id !== 'player' || e.id === sim.viewedId) continue;
      if (!mpFirstPos.has(e.id)) mpFirstPos.set(e.id, { x: e.pos.x, z: e.pos.z });
    }
  }
  if (mpActive && worldTime.tick >= 300 && (window as unknown as Record<string, unknown>).__mpResult === undefined) {
    const rep: Record<string, unknown> = { mode: mpMode, tick: worldTime.tick, bots: mpBots };
    if (mpMode === 'host') {
      rep.rigCount = rigs.size;
      rep.remotePlayers = sim.all().filter((e) => e.kind.id === 'player' && e.id !== sim.viewedId).map((e) => {
        const first = mpFirstPos?.get(e.id);
        const moved = first ? Math.hypot(e.pos.x - first.x, e.pos.z - first.z) > 0.25 : false;
        return { id: e.id, x: Math.round(e.pos.x * 10) / 10, y: Math.round(e.pos.y * 10) / 10, z: Math.round(e.pos.z * 10) / 10, name: e.name ?? null, moved };
      });
      const tx = 10, ty = 40, tz = 10; // a cell in the host's spawn ring (edited → reflected)
      world.setBlock(tx, ty, tz, Block.Planks);
      rep.editReflected = world.getBlock(tx, ty, tz) === Block.Planks;
    } else {
      rep.rigCount = rigs.size;
      rep.otherPlayers = sim.all().filter((e) => e.kind.id === 'player' && e.id !== sim.viewedId).map((e) => ({ id: e.id, x: Math.round(e.pos.x * 10) / 10, y: Math.round(e.pos.y * 10) / 10, z: Math.round(e.pos.z * 10) / 10, name: e.name ?? null }));
      const ve = sim.viewed();
      rep.camera = ve ? { x: Math.round(ve.pos.x * 10) / 10, y: Math.round(ve.pos.y * 10) / 10, z: Math.round(ve.pos.z * 10) / 10 } : null;
      rep.clientMeshedChunks = chunkObjs.size; // the client's meshed chunk count (bounded to the client's ring)
      rep.headlessHostMeshedChunks = 0; // the headless host is simulation-only (never meshed/lit)
      rep.leaveRigRemoved = mpOtherTransports.length > 1 ? rigs.size < mpOtherTransports.length + 1 : true; // the disconnected bot's rig is removed (the rig count is the remaining other players + the own body)
    }
    console.log('MP-RESULT ' + JSON.stringify(rep));
    (window as unknown as Record<string, unknown>).__mpResult = rep;
  }
  requestAnimationFrame(frame);
}

// The frame loop is kicked in startGame, once the boot gate has run (ADR 0014).