import * as THREE from 'three';
import { MultiplayerProbe } from './diagnostics/multiplayer-probe';
import { createBlockAtlas } from './block-atlas';
import { Block, PLACEABLE, torchMeta, doorMeta, doorOpen, doorAxis, doorSide, isDoor, doorPlacementFromView } from './blocks';
import { World, chunkKey, chunkOf, CHUNK_SIZE, WORLD_Y_MAX, WORLD_Y_MIN } from './world';
import { TERRAIN_SEED } from './terrain';
import * as streaming from './streaming';
import { StreamEffects } from './streaming/stream-effects';
import { ViewRadiusGovernor, targetChunks } from './view-radius';
import { PointerControls } from './input/pointer-controls';
import { KeyboardControls, installKeyboardControls } from './input/keyboard-controls';
import { Hotbar } from './ui/hotbar';
import { InventoryView } from './ui/inventory-view';
import { Hud } from './ui/hud';
import { createGameMenus } from './ui/game-menus';
import { meshChunk, type ChunkMesh, type LightSampler } from './chunk-mesher';
import { ChunkRemesher } from './rendering/chunk-remesher';
import { ProfRig, meshVerts, PROF_WORST_KEY } from './prof-rig';
import { ChunkRenderer } from './rendering/chunk-renderer';
import { ChunkMaterials } from './rendering/chunk-materials';
import { CameraView, AIR_FOV } from './rendering/camera-view';
import { Sim, HumanController, type ApplyHooks, type Controller, type EntityRecord } from './entity';
import { findBlockTarget, possessFromView } from './input/targeting';
import { TargetOutline } from './rendering/target-outline';
import { MobPopulation } from './simulation/mob-population';
import { hasMeshedGround } from './rendering/entity-visibility';
import { EntityRenderer } from './rendering/entity-renderer';
import { WaterSim } from './water';
import { WorldTime, tickCrossed } from './time';
import { sampleSky, createSky } from './sky';
import { createClouds } from './clouds';
import { LIGHT_AMBIENT, LIGHT_TICK_BUDGET } from './light';
import { LightClient } from './light-transport';
import { Persistence, type WorldMeta, type PersistSource } from './persistence';
import { SavePoints, installSavePoints } from './persistence/save-points';
import { IndexedDBChunkStore } from './idb-store';
import type { Replay } from './replay';
import { FrameStepper } from './simulation/frame-stepper';
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
renderer.setClearColor(0x101a33);
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
const APP_ID = 'block-world';
// Multiplayer startup replaces the active world, simulation, clock, and light client.
let worldTime = new WorldTime(startPhase);
const sky = createSky(scene, FOG_AIR, FOG_WATER, BG_WATER);
const clouds = createClouds(scene);
// === world-state ===

let world = new World();

let waterSim = new WaterSim(world);

let lightSim = new LightClient(world, worldTime);
window.__lightDebug = lightSim;

// Only player-placed springs are targetable water.
const simHooks: ApplyHooks = {
  onEdit: (x, y, z) => { remeshAround(x, y, z); lightSim.edit(x, y, z); },
  waterEdit: (x, y, z, block) => { waterSim.edit(x, y, z, block); },
  springTarget: (x, y, z) => waterSim.cellState(x, y, z).p === 1,
};
let sim = new Sim(world, simHooks, TERRAIN_SEED);
const streamControllerFor = (record: EntityRecord): Controller => restoredController(world, sim, record);

// IndexedDB failure falls back to session-only persistence.
let persist: Persistence;
try {
  const idb = new IndexedDBChunkStore();
  persist = new Persistence(idb, TERRAIN_SEED, idb);
} catch {
  persist = new Persistence(null, TERRAIN_SEED);
}
window.__persistDebug = persist;

// Replays are self-contained: never read or overwrite the player's saved world.
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
const streamEffects = new StreamEffects();
const population = new MobPopulation();

// === multiplayer ===

let mpSession: HostSession | ClientSession | null = null;
let mpHub: LoopbackHub | null = null;
// Loopback client mode also runs a headless authoritative host.
let mpHost: HostSession | null = null;
let mpClients: ClientSession[] = [];
let mpOtherTransports: { transport: { disconnect(): void }; name: string }[] = [];
const multiplayerProbe = new MultiplayerProbe(mpActive ? mpMode as 'host' | 'client' : null, mpBots);

// === startup ===

// Start once; a stalled persistence boot falls back after 5 s and late metadata is ignored.
let booted = false;
async function startGame(meta: WorldMeta | null): Promise<void> {
  if (booted) return;
  booted = true;

  // Lobby URLs take precedence over loopback, replay, and profiling.
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
  const generated = await initializeSinglePlayer({
    world, sim, water: waterSim, clock: worldTime, human, hotbar,
    persist, seed: TERRAIN_SEED, chunkReady,
  }, meta);
  population.update(world, sim, { generated, unloaded: [] });

  // Preserve restored facing before the human controller supplies its first intent.
  { const ve = sim.viewed(); if (ve) human.setLook(ve.yaw, ve.pitch); }
  if (profMode) { human.frozen = true; const ve = sim.viewed(); if (ve) ve.noclip = true; }
  { const ve = sim.viewed(); profRig = profMode ? new ProfRig({ seed: TERRAIN_SEED, phase: meta ? worldTime.dayPhase : startPhase, render: !profNoRender, anchor: { x: ve?.pos.x ?? 0, y: ve?.pos.y ?? 0, z: ve?.pos.z ?? 0 } }) : null; }
  syncCamera();
  requestAnimationFrame(frame);
}
const startFatal = (err: unknown): void => { console.error(err); showFatalOverlay('Boot failed', String(err instanceof Error ? err.message : err)); };
const bootGate = window.setTimeout(() => { console.log('[persistence] boot gate: IDB stalled past 5 s — starting a fresh world (any late meta is dropped)'); void startGame(null).catch(startFatal); }, 5000);
void persist.boot().then((meta) => {
  window.clearTimeout(bootGate);
  void startGame(meta).catch(startFatal);
});

const entityRenderer = new EntityRenderer(scene);

// === chunks-meshing ===

const chunkRenderer = new ChunkRenderer(scene, chunkMaterials.opaque, chunkMaterials.transparent);

// Streamed meshes wait for worker lighting.
const deferredFirstMesh = new Set<string>();

const lightSampler: LightSampler = (x, y, z) => world.getLight(x, y, z);
const chunkRemesher = new ChunkRemesher(swapChunkMesh, (key, stage, mesh) => {
  if (key === PROF_WORST_KEY) profRig?.noteRemesh(stage, meshVerts(mesh));
});

function swapChunkMesh(cx: number, cy: number, cz: number, mesh: ChunkMesh): void {
  const key = chunkKey(cx, cy, cz);
  chunkRenderer.replace(key, mesh);
  const ch = world.getChunk(cx, cy, cz);
  if (ch) ch.dirty = false;
}

function rebuildChunkMesh(cx: number, cy: number, cz: number): void {
  // An unfinished slice must not overwrite this synchronous edit.
  chunkRemesher.cancelSlice(chunkKey(cx, cy, cz));
  swapChunkMesh(cx, cy, cz, meshChunk(world, cx, cy, cz, lightSampler));
}

function removeChunkMesh(cx: number, cy: number, cz: number): void {
  chunkRemesher.cancelSlice(chunkKey(cx, cy, cz));
  const key = chunkKey(cx, cy, cz);
  chunkRenderer.remove(key);
}

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

if (startup.debug) {
  (window as unknown as Record<string, unknown>).__bw = { renderer, scene, camera };
}

// === input ===

const keys = new Set<string>();
const human = new HumanController(keys, 0, 0);

// === actions ===

const targetOutline = new TargetOutline(scene);

// Border edits also invalidate the neighboring chunk's exposed faces.
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

function onPossess(): void {
  if (possessFromView(sim, human)) recording.recordViewed();
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

    // Browsers may reject re-locking during the cooldown after Escape.
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

installKeyboardControls(window, new KeyboardControls({
  keys, human, hotbar, menus,
  isRecording: () => recording.active,
  stopRecording,
  toggleWireframe: () => setWireframe(!wireframeOn),
  possess: onPossess,
}));

const pointerControls = new PointerControls({
  document,
  canvas: renderer.domElement,
  crosshair: document.getElementById('crosshair')!,
  keys,
  human,
  closeMenus: () => menus.close(),
  onUnlock: () => targetOutline.update(null),
});

// === streaming ===

// Stream once per frame so multiple physics steps cannot multiply the load budget.
function tickStreaming(): void {
  const ve = sim.viewed();
  if (!ve) return;
  const pcx = chunkOf(ve.pos.x), pcz = chunkOf(ve.pos.z), pcy = chunkOf(ve.pos.y);
  const r = streaming.update(world, pcx, pcz, pcy, playback ? noopPersist : persist, sim);
  population.update(world, sim, { generated: playback ? [] : r.generated, unloaded: r.unloaded });
  consumeStream(r, playback ? noopPersist : persist, false);
}

function consumeStream(update: streaming.StreamingUpdate, source: PersistSource, isClient: boolean): void {
  // Hosts restore records per simulation tick, including when no renderer exists.
  const visualUpdate = mpSession instanceof HostSession ? { ...update, pending: [] } : update;
  void streamEffects.consume(visualUpdate, {
    world,
    sim,
    persist: source,
    water: isClient ? null : waterSim,
    light: lightSim,
    removeMesh: removeChunkMesh,
    removeRemesh: (key) => chunkRemesher.remove(key),
    deferredMeshes: deferredFirstMesh,
    saveMeta: !playback && !isClient ? () => savePoints.saveMeta(source as Persistence) : null,
    controllerFor: streamControllerFor,
  }).catch((error) => console.error('[streaming] restore failed', error));
}

const savePoints = new SavePoints(() => playback ? null : {
  seed: TERRAIN_SEED, world, sim, clock: worldTime, hotbar, persist,
});
installSavePoints(savePoints, document, window);

// === debug ===

let wireframeOn = false;
function setWireframe(on: boolean): void {
  wireframeOn = on;
  chunkMaterials.setWireframe(on);
}

// === loop ===

// Pulse every 0.5 simulation seconds, with up to 1000 cell updates per pulse (ADR 0011).
const WATER_STRIDE = 30;
const WATER_PULSE = 1000;

const governor = new ViewRadiusGovernor();

const frameStepper = new FrameStepper(performance.now());

function frame(now: number): void {
  const frameT0 = performance.now();
  const profT0 = profMode ? performance.now() : 0;
  const tickBefore = worldTime.tick;
  human.heldBlock = hotbar.block;
  const dt = frameStepper.advance(now, {
    sim,
    clock: worldTime,
    multiplayer: mpSession ? { clients: mpClients, hub: mpHub, host: mpHost } : null,
    playback,
  });
  if (mpSession) {

    const r = mpSession.lastStream;
    if (r) consumeStream(r, mpSession.persist, mpSession instanceof ClientSession);
  } else {
    tickStreaming();
  }
  if (profRig) {

    // lightSettled lives in the worker; the profiling rig uses remesh quiescence instead.
    const wc = world.getChunk(2, 1, 0);
    const wp = profRig.beginFrame({
      worstLoaded: wc !== undefined,
      worstSettled: wc !== undefined && !chunkRemesher.has(PROF_WORST_KEY),
    }).waypoint;
    const vep = sim.viewed();
    if (vep) { vep.pos.x = wp.x; vep.pos.y = wp.y; vep.pos.z = wp.z; vep.vel = { x: 0, y: 0, z: 0 }; }
  }
  lightSim.tick(LIGHT_TICK_BUDGET);

  // Clients receive water updates from the host; only authoritative worlds simulate water.
  if (!(mpSession instanceof ClientSession) && tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)) waterSim.tick(WATER_PULSE);

  // Consume each touched set exactly once per frame.
  for (const key of waterSim.touched) chunkRemesher.request(key);
  waterSim.touched.clear();
  for (const key of lightSim.touched) chunkRemesher.request(key);
  lightSim.touched.clear();

  deferredFirstMesh.forEach((key) => chunkRemesher.request(key));
  deferredFirstMesh.clear();
  const profDrainT0 = profMode ? performance.now() : 0;
  const vp = sim.viewed();
  chunkRemesher.drain(world, lightSampler, [
    chunkOf(vp?.pos.x ?? 0), chunkOf(vp?.pos.y ?? 0), chunkOf(vp?.pos.z ?? 0),
  ]);
  profDrainMs = profMode ? performance.now() - profDrainT0 : 0;
  // Interpolate client poses before positioning the camera and targeting.
  if (mpSession instanceof ClientSession) mpSession.syncPoses();
  syncCamera();
  targetOutline.update(pointerControls.locked ? findBlockTarget(world, sim, simHooks) : null);
  entityRenderer.update(sim.all(), sim.viewedId, dt, (entity) =>
    hasMeshedGround(entity, (key) => chunkRenderer.has(key)));
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
  const report = multiplayerProbe.update({
    mode: mpSession ? (mpSession instanceof HostSession ? 'host' : 'client') : null,
    tick: worldTime.tick,
    sim,
    world,
    rigCount: entityRenderer.rigCount,
    hasRig: (id) => entityRenderer.hasRig(id),
    meshedChunks: chunkRenderer.chunkCount,
    otherTransports: mpOtherTransports,
  }, (window as unknown as Record<string, unknown>).__mpResult !== undefined);
  if (report) {
    console.log('MP-RESULT ' + JSON.stringify(report));
    (window as unknown as Record<string, unknown>).__mpResult = report;
  }
  if (!profMode) {
    const workMs = performance.now() - frameT0;
    if (mpSession) {
      mpSession.noteFrame(workMs);
      (window as unknown as Record<string, unknown>).__viewRadius = mpSession.activeRadius;
    } else {
      const ringFull = world.count() >= targetChunks(governor.radius);
      streaming.setActiveRadius(governor.noteFrame(workMs, ringFull));
      (window as unknown as Record<string, unknown>).__viewRadius = governor.radius;
    }
  }
  requestAnimationFrame(frame);
}
