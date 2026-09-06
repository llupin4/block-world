import { describe, it, expect } from 'vitest';
import { Block, isDoor, doorOpen } from '../blocks';
import { World, localIndex } from '../world';
import { Player, WALK_SPEED, SWIM_SPEED, FLY_SPEED, FLY_V_SPEED, JUMP_VEL, HALF, HEIGHT, EYE } from '../player';
import { KINDS, NULL_INTENT, stepEntity, lookDir, eyeOf, applyIntent, Sim, SimRng, deriveSimSeed, controllerKindOf, IdleController, HumanController, ScriptController, MobController, mobRefuseStep, possess, returnHome, spectate, type Entity, type Intent, type ApplyHooks, type ScriptStep } from '../entity';
import { TERRAIN_SEED } from '../terrain';

const STEP = 1 / 60;

// A 3x3 column of chunks around the origin: a stone floor (top at y=5) everywhere, and a
// 2-deep water basin behind (−z) so the script exercises swimming. Enough floor/water to
// exercise walk, jump, fly, noclip and look without leaving the generated column.
function testWorld(): World {
  const w = new World();
  for (let cx = -1; cx <= 1; cx++)
    for (let cz = -1; cz <= 1; cz++) {
      const c = w.ensureChunk(cx, 0, cz);
      for (let lx = 0; lx < 16; lx++)
        for (let lz = 0; lz < 16; lz++) {
          c.blocks[localIndex(lx, 4, lz)] = Block.Stone; // floor, top at y=5
          if (cz === -1) { // water basin (−z): y=5 and y=6
            c.blocks[localIndex(lx, 5, lz)] = Block.Water;
            c.blocks[localIndex(lx, 6, lz)] = Block.Water;
          }
        }
    }
  return w;
}

// A fixed 300-tick input script shared by the old Player and stepEntity. It turns, looks
// up/down, jumps, and toggles fly and noclip, so every branch of the physics is covered.
function driveScript(i: number) {
  const yaw = i < 80 ? 0 : i < 160 ? 0.7 : -0.4;
  const pitch = i >= 200 ? -0.2 : 0;
  const fly = i >= 90 && i < 130;
  const noclip = i >= 140 && i < 170;
  return {
    forward: i < 60 ? 1 : 0,
    strafe: i >= 60 && i < 90 ? 1 : 0,
    up: (i >= 20 && i < 26) || (i >= 90 && i < 130), // one ground jump + rise while flying
    down: i >= 100 && i < 125,                       // sink while flying
    fly, noclip, yaw, pitch,
  };
}

describe('entity — the player kind', () => {
  it('KINDS.player is exactly the old player.ts constants', () => {
    const k = KINDS.player;
    expect(k.half).toBe(HALF);
    expect(k.height).toBe(HEIGHT);
    expect(k.eye).toBe(EYE);
    expect(k.walkSpeed).toBe(WALK_SPEED);
    expect(k.swimSpeed).toBe(SWIM_SPEED);
    expect(k.jumpVel).toBe(JUMP_VEL);
    expect(k.flySpeed).toBe(FLY_SPEED);
    expect(k.flyVSpeed).toBe(FLY_V_SPEED);
    expect(k.canFly).toBe(true);
    expect(k.canNoclip).toBe(true);
    expect(k.canEdit).toBe(true);
    expect(k.collides).toBe(true);
  });

  it('lookDir: yaw 0 faces -Z, +pitch looks up, always normalized (YXZ convention)', () => {
    const d0 = lookDir(0, 0); // yaw 0, pitch 0 -> faces -Z exactly
    expect(d0.x).toBeCloseTo(0, 12);
    expect(d0.y).toBeCloseTo(0, 12);
    expect(d0.z).toBeCloseTo(-1, 12);
    const d1 = lookDir(0, Math.PI / 2); // +pitch = straight up
    expect(d1.x).toBeCloseTo(0, 12);
    expect(d1.y).toBeCloseTo(1, 12);
    expect(d1.z).toBeCloseTo(0, 12);
    const e = lookDir(Math.PI / 2, 0); // yaw +90° faces -X (matches groundDir forward = (-sin yaw, -cos yaw))
    expect(e.x).toBeCloseTo(-1, 12);
    expect(e.z).toBeCloseTo(0, 12);
    const v = lookDir(0.3, 0.4);
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1, 12);
  });

  it('stepEntity(player) ≡ old Player.update on the fixed 300-tick script (1e-9)', () => {
    const world = testWorld();
    // The old Player reads collision from world.isSolid and water from world.getBlock.
    const A = new Player((x, y, z) => world.getBlock(x, y, z), (x, y, z) => world.isSolid(x, y, z));
    A.place({ x: 0, y: 5, z: 0 });
    const B: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 5, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0, pitch: 0, onGround: false, inWater: false, headInWater: false,
      fly: false, noclip: false,
      controller: { intent: () => NULL_INTENT }, baseController: { intent: () => NULL_INTENT },
    };
    for (let i = 0; i < 300; i++) {
      const s = driveScript(i);
      A.fly = s.fly; A.noclip = s.noclip; A.yaw = s.yaw; A.pitch = s.pitch;
      A.update(STEP, { forward: s.forward, strafe: s.strafe, up: s.up, down: s.down });
      B.fly = s.fly; B.noclip = s.noclip;
      const it: Intent = { ...NULL_INTENT, forward: s.forward, strafe: s.strafe, up: s.up, down: s.down, yaw: s.yaw, pitch: s.pitch };
      stepEntity(world, B, it, STEP);
      expect(B.pos.x).toBeCloseTo(A.pos.x, 9);
      expect(B.pos.y).toBeCloseTo(A.pos.y, 9);
      expect(B.pos.z).toBeCloseTo(A.pos.z, 9);
      expect(B.vel.y).toBeCloseTo(A.vel.y, 9);
      expect(B.onGround).toBe(A.onGround);
      expect(B.inWater).toBe(A.inWater);
      expect(B.headInWater).toBe(A.headInWater);
      expect(B.yaw).toBe(A.yaw);
      expect(B.pitch).toBe(A.pitch);
    }
  });
});

function editHooks(world: World): { hooks: ApplyHooks; edits: [number, number, number][]; water: [number, number, number, number][] } {
  const edits: [number, number, number][] = [];
  const water: [number, number, number, number][] = [];
  const hooks: ApplyHooks = {
    onEdit: (x, y, z) => edits.push([x, y, z]),
    waterEdit: (x, y, z, b) => water.push([x, y, z, b]),
    springTarget: (x, y, z) => world.getBlock(x, y, z) === Block.Water, // stand-in: all water is a spring here
  };
  return { hooks, edits, water };
}

// Entity at (0,5,0) facing -Z (yaw 0), pitch 0 -> eye (0, ~6.62, 0), ray along -Z. A
// full-height stone column stands at world z=-4 (chunk cz=-1, local z=12) so the eye ray
// (y~6.62) meets it at (0,6,-4); the cells z=0..-3 are air between the eye and the wall.
function wallWorld(): { world: World; e: Entity } {
  const world = new World();
  const c = world.ensureChunk(0, 0, -1); // chunk cz=-1: world z = -16..-1
  for (let y = 0; y < 8; y++) c.blocks[localIndex(0, y, 12)] = Block.Stone; // world z=-4
  const e: Entity = {
    id: 1, kind: KINDS.player,
    pos: { x: 0, y: 5, z: 0 }, vel: { x: 0, y: 0, z: 0 },
    yaw: 0, pitch: 0, onGround: true, inWater: false, headInWater: false,
    fly: false, noclip: false,
    controller: { intent: () => NULL_INTENT }, baseController: { intent: () => NULL_INTENT },
  };
  return { world, e };
}

describe('entity — applyIntent (sim-owned actions)', () => {
  it('eyeOf is feet + kind eye', () => {
    const { e } = wallWorld();
    expect(eyeOf(e)).toEqual({ x: 0, y: 5 + EYE, z: 0 });
  });

  it('primary breaks the block the eye ray hits (and reports the edit + water)', () => {
    const { world, e } = wallWorld();
    const { hooks, edits, water } = editHooks(world);
    applyIntent(world, e, { ...NULL_INTENT, primary: true }, hooks);
    // The ray from the eye goes -Z and meets the z=-4 column at y=6.
    expect(world.getBlock(0, 6, -4)).toBe(Block.Air);
    expect(edits).toContainEqual([0, 6, -4]);
    expect(water).toContainEqual([0, 6, -4, Block.Air]);
  });

  it('secondary places `block` on the face behind the hit', () => {
    const { world, e } = wallWorld();
    const { hooks } = editHooks(world);
    applyIntent(world, e, { ...NULL_INTENT, secondary: true, block: Block.Planks }, hooks);
    // Hit at (0,6,-4), entered from +Z (nz=+1) -> target (0,6,-3).
    expect(world.getBlock(0, 6, -3)).toBe(Block.Planks);
  });

  it('secondary on a door toggles the pair (always wins over placement)', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, -1);
    c.blocks[localIndex(0, 5, 13)] = Block.DoorBottom; // world (0,5,-3)
    c.blocks[localIndex(0, 6, 13)] = Block.DoorTop;    // world (0,6,-3)
    const e: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 5, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0, pitch: 0, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false,
      controller: { intent: () => NULL_INTENT }, baseController: { intent: () => NULL_INTENT },
    };
    const { hooks } = editHooks(world);
    applyIntent(world, e, { ...NULL_INTENT, secondary: true }, hooks);
    expect(isDoor(world.getBlock(0, 5, -3))).toBe(true);
    expect(doorOpen(world.getMeta(0, 5, -3))).toBe(true);
    expect(doorOpen(world.getMeta(0, 6, -3))).toBe(true);
  });

  it('a kind with canEdit=false performs no edit (only the toggles would apply)', () => {
    const { world, e } = wallWorld();
    e.kind = { ...KINDS.player, canEdit: false };
    const { hooks, edits, water } = editHooks(world);
    applyIntent(world, e, { ...NULL_INTENT, primary: true, secondary: true, block: Block.Planks }, hooks);
    expect(world.getBlock(0, 6, -4)).toBe(Block.Stone); // nothing broken
    expect(edits).toEqual([]);
    expect(water).toEqual([]);
  });
});

describe('entity — SimRng', () => {
  it('is deterministic and snapshot/restore round-trips', () => {
    const a = new SimRng(deriveSimSeed(TERRAIN_SEED));
    const b = new SimRng(deriveSimSeed(TERRAIN_SEED));
    const xs = [a.next(), a.next(), a.next()];
    expect([b.next(), b.next(), b.next()]).toEqual(xs);
    a.restore(a.state());
    expect([a.next(), a.next()]).toEqual([b.next(), b.next()]);
    expect(deriveSimSeed(1234)).toBe((1234 ^ 0x5eed1234) >>> 0);
  });
});

describe('entity — Sim (registry + tick)', () => {
  function flat(world: World): number[] {
    return [...world.allChunks()].flatMap((c) => Array.from(c.blocks));
  }

  function runTwoBots(seed: number): { initial: number[]; final: number[] } {
    const world = new World();
    for (let cx = 0; cx <= 1; cx++)
      for (let cz = 0; cz <= 1; cz++) {
        const c = world.ensureChunk(cx, 0, cz);
        for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, 4, lz)] = Block.Stone;
      }
    // A full-height stone wall at world z=12 (chunk cz=0, local z=12), ~4-5 m ahead of the
    // bots (z~16.5/17.5) so their REACH-6 dig ray actually meets it.
    for (let cx = 0; cx <= 1; cx++)
      for (let y = 0; y < 8; y++) world.ensureChunk(cx, 0, 0).blocks[localIndex(0, y, 12)] = Block.Stone;
    const sim = new Sim(world, {}, seed);
    const script = (): import('../entity').ScriptStep[] => [
      { op: 'lookAt', x: 0, y: 6, z: -16 }, // face -Z (toward the z=12 wall)
      { op: 'dig', ticks: 12 },
      { op: 'place', block: Block.Planks, ticks: 12 },
      { op: 'wait', ticks: 564 },
    ];
    sim.spawn({ x: 0.5, y: 5, z: 16.5 }, new ScriptController(script()));
    sim.spawn({ x: 0.5, y: 5, z: 17.5 }, new ScriptController(script()));
    const initial = flat(world);
    for (let i = 0; i < 600; i++) sim.tick(STEP, i);
    return { initial, final: flat(world) };
  }

  it('assigns monotonic ids and exposes the viewed entity', () => {
    const world = new World();
    const sim = new Sim(world, {}, 1);
    const a = sim.spawn({ x: 0, y: 0, z: 0 }, new IdleController());
    const b = sim.spawn({ x: 1, y: 0, z: 0 }, new IdleController());
    expect(a.id).toBeLessThan(b.id);
    expect(sim.viewed()?.id).toBe(a.id);
    expect(controllerKindOf(a.controller)).toBe('idle');
  });

  it('falls out of the world: a player kind respawns, a non-player kind despawns', () => {
    const world = new World();
    const sim = new Sim(world, {}, 1);
    sim.respawn = { x: 0, y: 5, z: 0 };
    const p = sim.spawn({ x: 0, y: -40, z: 0 }, new IdleController()); // below WORLD_Y_MIN
    const mob = sim.spawn({ x: 5, y: -40, z: 0 }, new IdleController());
    mob.kind = { ...mob.kind, id: 'dolt' }; // a non-player kind
    sim.tick(STEP, 0);
    expect(sim.viewed()?.id).toBe(p.id);
    expect(p.pos).toEqual({ x: 0, y: 5, z: 0 }); // respawned
    expect(sim.entities.has(mob.id)).toBe(false); // despawned
  });

  it('two bots with identical scripts produce an identical world across two runs (determinism)', () => {
    const a = runTwoBots(1234);
    const b = runTwoBots(1234);
    expect(a.final).toEqual(b.final);   // deterministic
    expect(a.final).not.toEqual(a.initial); // and the bots actually edited the world
  });
});

describe('entity — controllers', () => {
  it('HumanController: edges fire exactly one tick then clear; mouse accumulates absolute look', () => {
    const keys = new Set<string>();
    const h = new HumanController(keys, 0, 0);
    h.primary();
    const dummy: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0.3, pitch: -0.1, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: h, baseController: h,
    };
    const it1 = h.intent(dummy, 0);
    expect(it1.primary).toBe(true);
    expect(it1.yaw).toBe(0); // absolute look held at the controller's accumulated yaw
    const it2 = h.intent(dummy, 1);
    expect(it2.primary).toBe(false); // the edge was consumed on the first substep
    h.mouse(100, 0);
    const it3 = h.intent(dummy, 2);
    expect(it3.yaw).toBeCloseTo(-0.25, 9); // 100px * 0.0025 rad/px
    expect(it3.block).toBe(Block.Stone);   // heldBlock default
    keys.add('KeyW');
    expect(h.intent(dummy, 3).forward).toBe(1);
  });

  it('HumanController: frozen (prof rig) emits zero movement but holds current look', () => {
    const h = new HumanController(new Set<string>(), 0.9, 0.2);
    h.frozen = true;
    const dummy: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0.9, pitch: 0.2, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: h, baseController: h,
    };
    const it = h.intent(dummy, 0);
    expect(it.forward).toBe(0); expect(it.up).toBe(false);
    expect(it.primary).toBe(false);
    expect(it.yaw).toBe(0.9); expect(it.pitch).toBe(0.2); // sticky, from the entity
  });

  it('IdleController holds the entity\'s current yaw/pitch (sticky look)', () => {
    const c = new IdleController();
    const dummy: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0.5, pitch: -0.2, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: c, baseController: c,
    };
    const it = c.intent(dummy, 0);
    expect(it.yaw).toBe(0.5); expect(it.pitch).toBe(-0.2);
    expect(it.forward).toBe(0); expect(it.primary).toBe(false);
  });

  it('ScriptController: lookAt aims the entity, dig fires primary, place fires secondary+block', () => {
    const e: Entity = {
      id: 1, kind: KINDS.player,
      pos: { x: 0, y: 5, z: 0 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0, pitch: 0, onGround: true, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: null as never, baseController: null as never,
    };
    const steps: ScriptStep[] = [
      { op: 'lookAt', x: 0, y: 5, z: -3 }, // face -Z (one tick)
      { op: 'dig', ticks: 2 },
      { op: 'place', block: Block.Planks, ticks: 2 },
      { op: 'wait', ticks: 1 },
    ];
    const c = new ScriptController(steps);
    e.controller = c;
    const it0 = c.intent(e, 0);   // lookAt
    expect(it0.yaw).toBeCloseTo(0, 9);          // facing -Z (yaw 0)
    const itDig = c.intent(e, 1);               // dig #1
    expect(itDig.primary).toBe(true);
    c.intent(e, 2);                             // dig #2 (advances to place)
    const itPlace = c.intent(e, 3);             // place #1
    expect(itPlace.secondary).toBe(true);
    expect(itPlace.block).toBe(Block.Planks);
  });
});

describe('entity — dolt + spectator kinds', () => {
  it('KINDS.dolt is the grazing quadruped (all pinned numbers)', () => {
    const k = KINDS.dolt;
    expect(k.half).toBeCloseTo(0.45, 9);
    expect(k.height).toBeCloseTo(0.9, 9);
    expect(k.eye).toBeCloseTo(0.7, 9);
    expect(k.walkSpeed).toBeCloseTo(1.6, 9);
    expect(k.swimSpeed).toBeCloseTo(1.0, 9);
    expect(k.jumpVel).toBeCloseTo(8.0, 9); // apex 8^2/56 ~ 1.14 m: clears a 1-block ledge
    expect(k.flySpeed).toBeCloseTo(0, 9); expect(k.flyVSpeed).toBeCloseTo(0, 9);
    expect(k.canEdit).toBe(false); expect(k.canFly).toBe(false);
    expect(k.canNoclip).toBe(false); expect(k.collides).toBe(true);
  });

  it('KINDS.spectator is a non-colliding ghost (all pinned numbers)', () => {
    const k = KINDS.spectator;
    expect(k.half).toBeCloseTo(0.3, 9); expect(k.height).toBeCloseTo(1.8, 9);
    expect(k.eye).toBeCloseTo(1.62, 9);
    expect(k.walkSpeed).toBeCloseTo(8, 9); expect(k.swimSpeed).toBeCloseTo(5, 9);
    expect(k.jumpVel).toBeCloseTo(0, 9);
    expect(k.flySpeed).toBeCloseTo(8, 9); expect(k.flyVSpeed).toBeCloseTo(8, 9);
    expect(k.canFly).toBe(true); expect(k.canNoclip).toBe(true);
    expect(k.canEdit).toBe(false); expect(k.collides).toBe(false);
  });

  it('controllerKindOf recognizes a MobController', () => {
    const c = new MobController(() => Block.Air, () => 0.5);
    expect(controllerKindOf(c)).toBe('mob');
  });
});

describe('entity — MobController', () => {
  it('mobRefuseStep: water ahead, a >=3 drop, and a flat step', () => {
    const water = (x: number, _y: number, z: number) => (z <= 0 ? Block.Water : Block.Air);
    expect(mobRefuseStep(water, 0, 5, 1, 0)).toBe('water'); // facing -Z into water
    const floor = (x: number, y: number, z: number) => (y <= 4 ? Block.Stone : Block.Air);
    expect(mobRefuseStep(floor, 0.5, 5, 0.5, 0)).toBeNull(); // flat floor ahead
    const pit = (x: number, y: number, z: number) => (y === 4 && x >= 0 ? Block.Stone : Block.Air);
    expect(mobRefuseStep(pit, 0.5, 5, 0.5, Math.PI / 2)).toBe('drop'); // -X is a pit
  });

  function doltPath(seed: number): number[] {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) c.blocks[localIndex(lx, 4, lz)] = Block.Grass;
    const rng = new SimRng(seed);
    const ctrl = new MobController((x, y, z) => world.getBlock(x, y, z), () => rng.next());
    const e: Entity = {
      id: 1, kind: KINDS.dolt, pos: { x: 8, y: 5, z: 8 }, vel: { x: 0, y: 0, z: 0 },
      yaw: 0, pitch: 0, onGround: false, inWater: false, headInWater: false,
      fly: false, noclip: false, controller: ctrl, baseController: ctrl,
    };
    const pts: number[] = [];
    for (let i = 0; i < 1200; i++) {
      const it = ctrl.intent(e, i);
      stepEntity(world, e, it, STEP);
      pts.push(Math.round(e.pos.x * 1000), Math.round(e.pos.z * 1000));
    }
    return pts;
  }

  it('a fixed seed drives a deterministic 1200-tick path', () => {
    expect(doltPath(1234)).toEqual(doltPath(1234));
  });

  it('the dolt actually wanders (a non-trivial path)', () => {
    const p = doltPath(1234);
    const cells = new Set<string>();
    for (let i = 0; i < p.length; i += 2) cells.add([p[i], p[i + 1]].join(','));
    expect(cells.size).toBeGreaterThan(10);
  });
});

describe('entity — possession', () => {
  function simWithBodyAndDolt() {
    const world = new World();
    const sim = new Sim(world, {}, 1234);
    const human = new HumanController(new Set<string>());
    // The player body's home controller is IdleController (it stands idle when left); pass
    // it explicitly — the spawn default would otherwise re-bind baseController to `human`.
    const body = sim.spawn({ x: 0, y: 5, z: 0 }, human, { kindId: 'player', baseController: new IdleController() });
    sim.homeId = body.id;
    const mob = new MobController((x, y, z) => world.getBlock(x, y, z), () => sim.rng.next());
    const dolt = sim.spawn({ x: 1, y: 5, z: 0 }, mob, { kindId: 'dolt', baseController: mob });
    const ghost = sim.spawn({ x: 0, y: 9, z: 0 }, new IdleController(), { kindId: 'spectator', baseController: new IdleController() });
    sim.ghostId = ghost.id;
    return { sim, world, human, body, dolt, ghost };
  }

  it('possess swaps the human to the target and releases the body to idle; returnHome restores', () => {
    const { sim, human, body, dolt } = simWithBodyAndDolt();
    expect(sim.viewedId).toBe(body.id);
    possess(sim, human, dolt.id);
    expect(sim.viewedId).toBe(dolt.id);
    expect(dolt.controller).toBe(human);
    expect(body.controller).toBeInstanceOf(IdleController); // body released to idle
    returnHome(sim, human);
    expect(sim.viewedId).toBe(body.id);
    expect(body.controller).toBe(human);
    expect(dolt.controller).toBeInstanceOf(MobController); // dolt resumed its AI
  });

  it('spectate moves the human to the single ghost; returnHome restores the body', () => {
    const { sim, human, body, ghost } = simWithBodyAndDolt();
    spectate(sim, human);
    expect(sim.viewedId).toBe(ghost.id);
    expect(ghost.controller).toBe(human);
    expect(body.controller).toBeInstanceOf(IdleController); // the body was released to idle
    returnHome(sim, human);
    expect(sim.viewedId).toBe(body.id);
    expect(body.controller).toBe(human);
    expect(ghost.controller).toBeInstanceOf(IdleController); // the ghost is released
  });

  it('spawn default: baseController defaults to the passed controller (a bot keeps its script)', () => {
    const { sim } = simWithBodyAndDolt();
    const script = new IdleController(); // stand-in for a ScriptController instance
    const bot = sim.spawn({ x: 2, y: 5, z: 0 }, script, { kindId: 'player' });
    expect(bot.baseController).toBe(script); // not re-bound to a fresh IdleController
  });
});