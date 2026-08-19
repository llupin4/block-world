import { describe, expect, it } from 'vitest';
import { Block } from '../blocks';
import { Player, type MoveInput } from '../player';

const STEP = 1 / 60;

const input = (over: Partial<MoveInput> = {}): MoveInput =>
  ({ forward: 0, strafe: 0, up: false, down: false, ...over });

function run(p: Player, n: number, over: Partial<MoveInput> = {}): void {
  for (let i = 0; i < n; i++) p.update(STEP, input(over));
}

describe('player', () => {
  it('falls in empty space under gravity', () => {
    const p = new Player(() => Block.Air);
    p.place({ x: 0, y: 0, z: 0 });
    run(p, 60);
    expect(p.vel.y).toBeCloseTo(-28, 0); // full 1 s of gravity, no floor
    expect(p.pos.y).toBeLessThan(-5.5);
    expect(p.onGround).toBe(false);
  });

  it('lands on a floor and settles', () => {
    const p = new Player((_x, y) => (y <= 4 ? Block.Stone : Block.Air)); // floor top at y=5
    p.place({ x: 0, y: 6, z: 0 });
    run(p, 300);
    expect(p.pos.y).toBeCloseTo(5, 1);
    expect(p.onGround).toBe(true);
    expect(p.vel.y).toBeCloseTo(0, 1);
  });

  it('cannot walk through a solid wall', () => {
    // Full-height wall column (no y bound): the player falls alongside it for the whole
    // 1.5 s, so the x-stop must hold even while falling. (A short wall would let the
    // falling player drop under it and walk away.)
    const wall = (x: number, _y: number, z: number) =>
      (x >= 10 && x <= 13 && z >= 4 && z <= 7 ? Block.Stone : Block.Air);
    const p = new Player(wall);
    p.place({ x: 8, y: 5, z: 8 });
    p.yaw = -Math.PI / 2; // face +x, straight into the wall
    run(p, 90, { forward: 1 });
    expect(p.pos.x).toBeGreaterThan(9.6); // stopped flush at 9.7 (x + HALF = wall face at 10)
    expect(p.pos.x).toBeLessThan(10);
    expect(p.pos.y).toBeLessThan(-5);     // and it was falling the whole time
  });

  it('jumps from the ground and lands again', () => {
    const p = new Player((_x, y) => (y <= 4 ? Block.Stone : Block.Air));
    p.place({ x: 0, y: 5, z: 0 });
    let maxY = p.pos.y;
    for (let i = 0; i < 300; i++) {
      p.update(STEP, input({ up: i === 5 })); // jump once onGround has latched
      if (p.pos.y > maxY) maxY = p.pos.y;
    }
    expect(maxY).toBeGreaterThan(6.2); // apex ≈ 5 + 9.5^2 / (2*28) ≈ 6.6
    expect(p.pos.y).toBeCloseTo(5, 1);
    expect(p.onGround).toBe(true);
  });

  it('noclip phases through solid and ignores gravity', () => {
    const wall = (x: number, _y: number, z: number) =>
      (x >= 10 && x <= 13 && z >= 4 && z <= 7 ? Block.Stone : Block.Air);
    const p = new Player(wall);
    p.place({ x: 8, y: 5, z: 8 });
    p.yaw = -Math.PI / 2;
    p.noclip = true;
    run(p, 60, { forward: 1 });
    expect(p.pos.x).toBeGreaterThan(10); // walked straight through
    expect(p.pos.y).toBeCloseTo(5, 1);   // no gravity in noclip
  });

  it('fly: SPACE rises, SHIFT sinks', () => {
    const p = new Player(() => Block.Air);
    p.place({ x: 0, y: 0, z: 0 });
    p.fly = true;
    run(p, 30, { up: true });   // 0.5 s @ 8 m/s
    expect(p.pos.y).toBeCloseTo(4, 1);
    run(p, 30, { down: true }); // and back down
    expect(p.pos.y).toBeCloseTo(0, 1);
  });

  it('swim: sinking is clamped, SPACE rises', () => {
    // 1-voxel-thick water sheet at y=0 (surface at y=1).
    const sheet = (_x: number, y: number) => (y <= 0 ? Block.Water : Block.Air);
    const sink = new Player(sheet);
    sink.place({ x: 0, y: 0.5, z: 0 }); // submerged
    run(sink, 60);
    expect(sink.vel.y).toBeCloseTo(-1.8, 1); // clamp at -SWIM_SPEED*0.6, not -28t
    expect(sink.pos.y).toBeGreaterThan(-2);  // slow sink, not free-fall (~-13.5 without the clamp)
    expect(sink.pos.y).toBeLessThan(0.4);

    const deep = (_x: number, y: number) => (y <= 4 ? Block.Water : Block.Air); // deep pool
    const rise = new Player(deep);
    rise.place({ x: 0, y: 0, z: 0 });
    run(rise, 90, { up: true });
    expect(rise.vel.y).toBeCloseTo(3, 0);  // SWIM_SPEED cap
    expect(rise.pos.y).toBeCloseTo(2.3, 1);
  });

  it('door state drives collision via isSolidAt: a closed door blocks, opening it lets the player through', () => {
    // A full-height door column stands in for a door pair: collision only asks "is this
    // cell solid", and the answer flips with the door's state.
    const state = { closed: true };
    const inDoorColumn = (x: number, z: number) =>
      x >= 10 && x <= 13 && z >= 4 && z <= 7;
    const getBlock = (x: number, _y: number, z: number): number =>
      inDoorColumn(x, z) ? Block.DoorBottom : Block.Air;
    const isSolidAt = (x: number, _y: number, z: number) => inDoorColumn(x, z) && state.closed;
    const p = new Player(getBlock, isSolidAt);
    p.place({ x: 8, y: 5, z: 8 });
    p.yaw = -Math.PI / 2; // face +x, straight into the closed door
    run(p, 90, { forward: 1 });
    expect(p.pos.x).toBeLessThan(10); // held back by the closed door, like a wall
    state.closed = false; // right-click: the door opens
    run(p, 90, { forward: 1 });
    expect(p.pos.x).toBeGreaterThan(13); // walked straight through the open door
  });
});