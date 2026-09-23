import * as THREE from 'three';
import { createBlockAtlas } from './block-atlas';
import { Block, PLACEABLE, torchMeta, doorMeta, doorOpen, doorAxis, doorSide, isDoor, doorPlacementFromView } from './blocks';
import { World, chunkKey, chunkOf, CHUNK_SIZE, WORLD_Y_MAX, WORLD_Y_MIN } from './world';
import { TERRAIN_SEED } from './terrain';
import * as streaming from './streaming';
import { ViewRadiusGovernor, targetChunks } from './view-radius';
import { Hotbar } from './ui/hotbar';
import { InventoryView } from './ui/inventory-view';
import { Hud } from './ui/hud';
import { createGameMenus } from './ui/game-menus';
import { meshChunk, meshChunkRange, probeMeshChunk, type ChunkMesh, type LightSampler } from './chunk-mesher';
import { SliceScheduler, decideBands, PROBE_VERTS, SLICE_COUNT } from './mesh-slices';
import { ProfRig, meshVerts, PROF_WORST_KEY } from './prof-rig';
import { ChunkRenderer } from './rendering/chunk-renderer';
import { ChunkMaterials } from './rendering/chunk-materials';
import { CameraView, AIR_FOV } from './rendering/camera-view';
import { Sim, HumanController, eyeOf, lookDir, breakRayTarget, possessToggle, possessableCandidates, type ApplyHooks, type Controller, type EntityRecord } from './entity';
import { raycastVoxel, pickEntity, REACH, type RayHit } from './raycast';
import { spawnDeer } from './spawn';
import { EntityRenderer } from './rendering/entity-renderer';
import { WaterSim } from './water';
import { WorldTime, tickCrossed } from './time';
import { sampleSky, createSky } from './sky';
import { createClouds } from './clouds';
import { LIGHT_AMBIENT, LIGHT_TICK_BUDGET } from './light';
import { LightClient } from './light-transport';
import { Persistence, applyRecord, type WorldMeta, type PersistSource } from './persistence';
import { IndexedDBChunkStore } from './idb-store';
import { viewedAt, type Replay } from './replay';
import { RecordingSession } from './replay/recording-session';
import { LoopbackHub } from './net/transport';
import { HostSession } from './net/host';
import { ClientSession } from './net/client';
import { sanitizeName } from './net/name';
import { parseStartupOptions } from './startup/options';
import { createLoopbackSession } from './startup/loopback-session';
import { initializeSinglePlayer } from './startup/single-player';
import { restoreReplay } from './startup/replay-session';
import { restoredController } from './startup/restore-entities';
import { createLobbySession, generateRoomCode } from './startup/lobby-session';
import { createLobbyView, showHostLeft } from './ui/lobby-view';
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
const BG_WATER = new THREE.Color(0x0a2a55);
const FOG_AIR = new THREE.FogExp2(0xcfe8ff, 0.004);
const FOG_WATER = new THREE.FogExp2(0x0a2a55, 0.35);
renderer.setClearColor(0x101a33); // fallback clear (night horizon): the sky dome covers every pixel anyway
const camera = new THREE.PerspectiveCamera(AIR_FOV, 1, 0.1, 512);
const cameraView = new CameraView(camera);

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);
onResize();

const { texture: atlas, iconUrl: atlasURL } = createBlockAtlas(document.createElement('canvas'));

const chunkMaterials = new ChunkMaterials(atlas);

// === sky ===
const startup = parseStartupOptions(location.search);
const {
  startPhase, profMode, profNoRender, mpMode, mpActive, mpBots,
  lobbyHost, lobbyJoinCode, lobbyActive,
} = startup;
const APP_ID = 'block-world'; // the trystero namespace (a shared constant both sides must match on)
let worldTime = new WorldTime(startPhase); // let: the B1 boot reassigns it to the session's clock
const sky = createSky(scene, FOG_AIR, FOG_WATER, BG_WATER);
const clouds = createClouds(scene);
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
const streamControllerFor = (record: EntityRecord): Controller => restoredController(world, sim, record);

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

const recording = new RecordingSession((key, replay) => persist.saveReplay(key, replay));
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

// === boot gate (ADR 0014) ===
// The game starts only once persistence has booted (key set + meta) — capped at 5 s:
// a stalled IDB must not hold the first frame hostage (the fallback starts a fresh
// world; a late meta is dropped, documented edge). startGame restores-or-generates the
// boot column, restores world state, and kicks the frame loop.
let booted = false;
async function startGame(meta: WorldMeta | null): Promise<void> {
  if (booted) return;
  booted = true;
  // Lobby URLs take precedence over loopback, replay, and profiling modes.
  if (lobbyActive) {
    const webCryptoError = webCryptoUnavailableMessage();
    if (webCryptoError) {
      showFatalOverlay('Multiplayer unavailable', webCryptoError);
      return;
    }
    const name = sanitizeName(startup.name);
    if (startup.name.trim() !== '') localStorage.setItem('bw.name', name);
    const code = lobbyHost ? (startup.hostCode || generateRoomCode()) : (lobbyJoinCode as string);
    const transport = new TrysteroTransport(APP_ID, code);
    const runtime = createLobbySession({
      isHost: lobbyHost,
      transport,
      seed: TERRAIN_SEED,
      name,
      controller: human,
      persist,
      hooks: simHooks,
      lightEdit: (x, y, z) => lightSim.edit(x, y, z),
      hostLeft: (client) => {
        if (mpSession !== client) return;
        mpSession = null;
        showHostLeft(document);
      },
    });
    mpSession = runtime.session;
    mpHost = runtime.host;
    mpClients = runtime.clients;
    mpHub = null;
    world = runtime.session.world;
    sim = runtime.session.sim;
    worldTime = runtime.session.worldTime;
    if (runtime.host) {
      waterSim = runtime.host.waterSim;
      const viewed = sim.viewed();
      if (viewed) human.setLook(viewed.yaw, viewed.pitch);
    }
    lightSim = new LightClient(world, worldTime);
    window.__lightDebug = lightSim;
    (window as unknown as Record<string, unknown>).__lobby = createLobbyView({
      document, code, isHost: lobbyHost, name, transport, session: runtime.session,
      copyCode: (value) => navigator.clipboard?.writeText(value),
      confirmLeave: () => confirm('Leave? Connected players will be dropped.'),
      leave: () => { location.href = location.pathname; },
    });
    syncCamera();
    requestAnimationFrame(frame);
    return;
  }
  if (mpMode === 'host' || mpMode === 'client') {
    const runtime = createLoopbackSession({
      mode: mpMode,
      bots: mpBots,
      delay: startup.mpDelay,
      seed: TERRAIN_SEED,
      controller: human,
      persist,
      hooks: simHooks,
      lightEdit: (x, y, z) => lightSim.edit(x, y, z),
      hostLeft: () => {
        mpSession = null;
        showHostLeft(document);
      },
    });
    mpSession = runtime.session;
    mpHost = runtime.host;
    mpClients = runtime.clients;
    mpOtherTransports = runtime.otherTransports;
    mpHub = runtime.hub;
    world = runtime.session.world;
    sim = runtime.session.sim;
    worldTime = runtime.session.worldTime;
    if (runtime.session instanceof HostSession) waterSim = runtime.session.waterSim;
    lightSim = new LightClient(world, worldTime);
    window.__lightDebug = lightSim;
    syncCamera();
    requestAnimationFrame(frame);
    return;
  }
  const chunkReady = (cx: number, cy: number, cz: number): void => {
    lightSim.load(cx, cy, cz);
    deferredFirstMesh.add(chunkKey(cx, cy, cz));
  };
  const replayKey = startup.replayKey;
  if (replayKey) {
    const replay = await persist.loadReplay(replayKey);
    if (replay) {
      replayControllerFor = restoreReplay({ world, sim, water: waterSim, clock: worldTime, chunkReady }, replay);
      const viewed = sim.viewed();
      if (viewed) human.setLook(viewed.yaw, viewed.pitch);
      playback = { replay, paused: false };
      console.log(`[replay] loaded ${replay.intents.length} deltas, playing ${replay.startTick}..${replay.endTick}`);
      syncCamera();
      requestAnimationFrame(frame);
      return;
    }
    console.warn(`[replay] not found: ${replayKey} — starting a fresh world instead`);
  }
  await initializeSinglePlayer({
    world, sim, water: waterSim, clock: worldTime, human, hotbar,
    persist, seed: TERRAIN_SEED, chunkReady,
  }, meta);
  // The human controller's look is the source of truth (stepEntity adopts it each tick): sync it
  // to the entity's current look so the first tick does not clobber the spawn/restore facing.
  { const ve = sim.viewed(); if (ve) human.setLook(ve.yaw, ve.pitch); }
  if (profMode) { human.frozen = true; const ve = sim.viewed(); if (ve) ve.noclip = true; } // the rig owns the viewed entity
  { const ve = sim.viewed(); profRig = profMode ? new ProfRig({ seed: TERRAIN_SEED, phase: meta ? worldTime.dayPhase : startPhase, render: !profNoRender, anchor: { x: ve?.pos.x ?? 0, y: ve?.pos.y ?? 0, z: ve?.pos.z ?? 0 } }) : null; }
  syncCamera();
  requestAnimationFrame(frame);
}
const startFatal = (err: unknown): void => { console.error(err); showFatalOverlay('Boot failed', String(err instanceof Error ? err.message : err)); };
const bootGate = window.setTimeout(() => { console.log('[persistence] boot gate: IDB stalled past 5 s — starting a fresh world (any late meta is dropped)'); void startGame(null).catch(startFatal); }, 5000); // fallback: a stalled boot still starts (fresh world)
void persist.boot().then((meta) => {
  window.clearTimeout(bootGate);
  void startGame(meta).catch(startFatal);
});

const entityRenderer = new EntityRenderer(scene);

// === chunks-meshing ===

const chunkRenderer = new ChunkRenderer(scene, chunkMaterials.opaque, chunkMaterials.transparent);

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
const deerPendingMesh = new Set<string>(); // generated-column keys whose deer spawn is deferred until the column's mesh is built (swapChunkMesh): a deer runs its wander AI from spawn, so spawning at generation put it in a not-yet-meshed column (visible with no ground)

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
  chunkRenderer.replace(key, mesh);
  const ch = world.getChunk(cx, cy, cz);
  if (ch) ch.dirty = false; // a rebuilt mesh is up to date; streaming only reschedules stale chunks
  if (deerPendingMesh.has(key)) { // the column's ground is now visible: spawn its deer (idempotent per column)
    deerPendingMesh.delete(key);
    spawnDeer(world, sim, cx, cz);
  }
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
  chunkRenderer.remove(key);
  deerPendingMesh.delete(key); // the column is gone before its mesh was built: don't spawn its deer
}

// T10: no static build — the streaming section keeps a 5x5 chunk ring (cy 0..4) around the
// player and generates/remeshes/unloads chunks as the player moves.

// === camera ===

let profRig: ProfRig | null = null;
let profDrainMs = 0;

function syncCamera(): void {
  const client = mpSession instanceof ClientSession ? {
    entityId: mpSession.entityId,
    displayPosition: mpSession.displayPos,
    look: human.getLook(),
  } : null;
  cameraView.syncPose(sim.viewed(), client);
}

// ?dbg dev-only: exposes the render triple for headless pixel verification (readPixels
// after a forced render). Never used outside that rig.
if (startup.debug) {
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
  if (menus.isOpen('multiplayer') && !(e.code === 'KeyE' || e.code === 'KeyH' || e.code === 'KeyM' || e.code === 'KeyR')) return;
  if (e.code === 'KeyF') human.toggleFly(); // fly toggle (a one-tick edge the sim consumes)
  if (e.code === 'KeyN') human.toggleNoclip(); // noclip toggle
  if (e.code === 'KeyR') {
    if (recording.active) { stopRecording(); menus.openReplays(); } // stop + auto-open the list (the new recording is there)
    else menus.toggle('replays'); // open/close the recordings list
  }
  if (e.code === 'KeyE') menus.toggle('palette'); // creative palette: open (unlock) / close (re-lock)
  if (e.code === 'KeyH') menus.toggle('help'); // help overlay: same open (unlock) / close (re-lock)
  if (e.code === 'KeyM') menus.toggle('multiplayer'); // multiplayer menu: host / join (single-player screen only)
  if (e.code === 'KeyC') setWireframe(!wireframeOn); // wireframe (PROJECT.md §14: chunk-edge bugs)
  if (e.code === 'KeyP') onPossess(); // possess the targeted entity, or toggle body<->ghost
  const d = e.code.startsWith('Digit') ? e.code.slice(5) : e.code.startsWith('Numpad') ? e.code.slice(6) : '';
  if (d >= '1' && d <= '9') { const s = Number(d) - 1; hotbar.select(s); human.select(s); } // 1-9 / numpad 1-9
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

// Click the canvas: close any open overlay (palette/help), otherwise pointer-lock (WASD + mouse steer; ESC releases).
renderer.domElement.addEventListener('click', () => {
  menus.close();
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
  recording.recordViewed();
}

function startRecording(): void {
  recording.start({ seed: TERRAIN_SEED, world, sim, clock: worldTime, hotbar });
  playback = null;
  console.log(`[replay] recording from tick ${worldTime.tick} (R to stop)`);
}

function stopRecording(): void {
  const saved = recording.stop();
  if (!saved) return;
  const { key, replay } = saved;
  console.log(`[replay] saved ${key} — ${replay.intents.length} intents, ${replay.events.length} events (replay with ?replay=${key})`);
}

// === ui ===

const hotbar = new Hotbar(PLACEABLE);
const inventory = new InventoryView(
  {
    hotbar: document.getElementById('hotbar')!,
    palette: document.getElementById('palette')!,
  },
  hotbar,
  PLACEABLE,
  atlasURL,
);

const hud = new Hud(document, {
  setInventoryVisible: (visible) => inventory.setVisible(visible),
  quitReplay: () => {
    const url = new URL(location.href);
    url.searchParams.delete('replay');
    location.href = url.toString();
  },
});

const menus = createGameMenus({
  document,
  lockPointer() {
    // Browsers can reject re-locking during the cooldown after Escape.
    const request = renderer.domElement.requestPointerLock() as unknown;
    if (request instanceof Promise) request.catch(() => {});
  },
  unlockPointer: () => document.exitPointerLock(),
  canOpenMultiplayer: () => !mpSession && !playback,
  rememberedName: () => localStorage.getItem('bw.name') ?? '',
  currentUrl: () => location.href,
  navigate: (url) => { location.href = url; },
  listReplays: () => persist.listReplays(),
  startRecording,
  stepSeconds: 1 / 60,
});

// The default hotbar select happens in startGame (a restored meta takes the slots instead).

// Wheel cycles the hotbar (down = next slot); while an overlay is open the wheel is left alone.
window.addEventListener(
  'wheel',
  (e) => {
    if (menus.isOpen('palette') || menus.isOpen('help') || menus.isOpen('replays')) return; // an open overlay owns the wheel (and the mouse is free)
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
    const key = chunkKey(c.cx, c.cy, c.cz);
    if (!isClient) waterSim.settle(c.cx, c.cy, c.cz); // the host's water settle BEFORE meshing (the client has no WaterSim — water arrives via cells)
    if (r.meshable.has(key)) { // the host draws only its own ring; peer-only chunks are data-served, not meshed
      lightSim.load(c.cx, c.cy, c.cz); // the worker settles it; the fields land with the tick reply
      deferredFirstMesh.add(key); // ADR 0012: the first/fresh mesh waits a guaranteed frame
    }
  }
  if (!isClient) for (const c of r.generated) deerPendingMesh.add(chunkKey(c.cx, c.cy, c.cz)); // deer into freshly GENERATED columns only (host); the client's deer come from the host — deferred until the column's mesh is built (swapChunkMesh) so a wandering deer never appears in a not-yet-meshed column
  for (const c of r.restored) {
    const key = chunkKey(c.cx, c.cy, c.cz);
    const ch = world.getChunk(c.cx, c.cy, c.cz)!;
    if (!isClient) waterSim.restore(ch); // the host's water restore (the client has no WaterSim)
    if (r.meshable.has(key)) { // the host draws only its own ring; peer-only chunks are data-served, not meshed
      lightSim.load(c.cx, c.cy, c.cz); // light is never persisted: the worker re-settles the chunk
      deferredFirstMesh.add(key); // first mesh of the restored chunk, same pacing as a load
    }
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
      if (r.meshable.has(key)) { // the host draws only its own ring; peer-only chunks are data-served, not meshed
        lightSim.load(c.cx, c.cy, c.cz);
        deferredFirstMesh.add(key);
      }
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

// === debug ===

// PROJECT.md §14 trap #1: chunk-boundary bugs. A global wireframe pass makes seams,
// missing/duplicate faces, and stray geometry visible at a glance. The two mesher
// materials are shared by every chunk mesh, so two flags flip the whole world
// (per-chunk box outlines are a post-POC nicety).
let wireframeOn = false;
function setWireframe(on: boolean): void {
  wireframeOn = on;
  chunkMaterials.setWireframe(on);
}

// === loop ===

const STEP = 1 / 60;
const WATER_STRIDE = 30;  // substep ticks per water pulse (ADR 0011): 30 × (1/60 s) = 0.5 sim s — water takes one "tick" per pulse, so placement and drain visibly take time (was a floating-point dt accumulator that could miss the 0.5 s boundary by a frame; measured in the deterministic 10 s replay: 19 pulses instead of 20)
const WATER_PULSE = 1000; // cell updates budgeted per pulse: big enough that a cut-off body's re-stabilization cascade (level wave + drain) finishes within a pulse or two, so a stopped flow settles in ~1 s instead of crawling for many seconds (and visibly re-expanding before it drains); smaller pulses made that crawl read as "flow that keeps moving"

const governor = new ViewRadiusGovernor(); // adaptive single-player view radius (spec 2026-09-17)

let last = performance.now();
let acc = 0;

function frame(now: number): void {
  const frameT0 = performance.now(); // the view-radius governor's load signal (whole-frame main-thread work)
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
  entityRenderer.update(sim.all(), sim.viewedId, dt);
  const viewed = sim.viewed();
  hud.update({
    viewedKind: viewed?.kind.id ?? null,
    canEdit: Boolean(viewed?.kind.canEdit),
    recording: recording.active,
    playback: playback ? { paused: playback.paused, endTick: playback.replay.endTick } : null,
    tick: worldTime.tick,
    day: worldTime.day,
    hour: worldTime.hour,
  });
  cameraView.syncWater(Boolean(sim.viewed()?.headInWater));
  clouds.setVisible(cameraView.mood === 'air');
  const skySample = sampleSky(worldTime.dayPhase);
  sky.apply(skySample, cameraView.mood, camera);
  chunkMaterials.setDayness(skySample.dayness);
  entityRenderer.setBrightness(LIGHT_AMBIENT + (1 - LIGHT_AMBIENT) * skySample.dayness);
  clouds.update(camera.position.x, camera.position.z, camera.position.y, worldTime.time, skySample.worldDim);
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
  if (mpSession && worldTime.tick >= 300 && (window as unknown as Record<string, unknown>).__mpResult === undefined) {
    const isHost = mpSession instanceof HostSession; // works for B1 (?mp=) and B2 (?host/?join lobby) alike
    const rep: Record<string, unknown> = { mode: isHost ? 'host' : 'client', tick: worldTime.tick, bots: mpBots };
    if (isHost) {
      rep.rigCount = entityRenderer.rigCount;
      rep.hostMeshedChunks = chunkRenderer.chunkCount;
      rep.remotePlayers = sim.all().filter((e) => e.kind.id === 'player' && e.id !== sim.viewedId).map((e) => {
        const first = mpFirstPos?.get(e.id);
        const moved = first ? Math.hypot(e.pos.x - first.x, e.pos.z - first.z) > 0.25 : false;
        return { id: e.id, x: Math.round(e.pos.x * 10) / 10, y: Math.round(e.pos.y * 10) / 10, z: Math.round(e.pos.z * 10) / 10, name: e.name ?? null, moved };
      });
      const tx = 10, ty = 40, tz = 10; // a cell in the host's spawn ring (edited → reflected)
      world.setBlock(tx, ty, tz, Block.Planks);
      rep.editReflected = world.getBlock(tx, ty, tz) === Block.Planks;
    } else {
      rep.rigCount = entityRenderer.rigCount;
      rep.otherPlayers = sim.all().filter((e) => e.kind.id === 'player' && e.id !== sim.viewedId).map((e) => ({ id: e.id, x: Math.round(e.pos.x * 10) / 10, y: Math.round(e.pos.y * 10) / 10, z: Math.round(e.pos.z * 10) / 10, name: e.name ?? null }));
      const ve = sim.viewed();
      rep.camera = ve ? { x: Math.round(ve.pos.x * 10) / 10, y: Math.round(ve.pos.y * 10) / 10, z: Math.round(ve.pos.z * 10) / 10 } : null;
      rep.clientMeshedChunks = chunkRenderer.chunkCount;
      rep.headlessHostMeshedChunks = 0; // the headless host is simulation-only (never meshed/lit)
      rep.leaveRigRemoved = mpOtherTransports.length > 1 ? entityRenderer.rigCount < mpOtherTransports.length + 1 : true; // the disconnected bot's rig is removed (the rig count is the remaining other players + the own body)
    }
    console.log('MP-RESULT ' + JSON.stringify(rep));
    (window as unknown as Record<string, unknown>).__mpResult = rep;
  }
  if (!profMode) {
    const workMs = performance.now() - frameT0;
    if (mpSession) {
      mpSession.noteFrame(workMs); // the MP session's own governor (host or client)
      (window as unknown as Record<string, unknown>).__viewRadius = mpSession.activeRadius; // e2e smoke readout
    } else {
      const ringFull = world.count() >= targetChunks(governor.radius);
      streaming.setActiveRadius(governor.noteFrame(workMs, ringFull));
      (window as unknown as Record<string, unknown>).__viewRadius = governor.radius; // e2e smoke readout
    }
  }
  requestAnimationFrame(frame);
}

// The frame loop is kicked in startGame, once the boot gate has run (ADR 0014).
