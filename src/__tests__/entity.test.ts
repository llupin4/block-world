import { describe, it, expect } from 'vitest';
import { Block, isDoor, doorOpen } from '../blocks';
import { World, localIndex } from '../world';
import { Player, WALK_SPEED, SWIM_SPEED, FLY_SPEED, FLY_V_SPEED, JUMP_VEL, HALF, HEIGHT, EYE } from '../player';
import { KINDS, NULL_INTENT, stepEntity, lookDir, eyeOf, applyIntent, type Entity, type Intent, type ApplyHooks } from '../entity';

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