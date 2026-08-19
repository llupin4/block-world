import { describe, it, expect } from 'vitest';
import {
  Block, BLOCKS, isOpaque, PLACEABLE, iconPosition,
  torchMeta, torchFace, doorMeta, doorOpen, doorAxis, doorSide, isDoor,
} from '../blocks';

describe('blocks', () => {
  it('assigns the spec values in order (0..12)', () => {
    expect([
      Block.Air, Block.Stone, Block.Dirt, Block.Grass, Block.Sand, Block.Water,
      Block.Wood, Block.Leaves, Block.Glass, Block.Planks,
      Block.Torch, Block.DoorBottom, Block.DoorTop,
    ]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('BLOCKS has a definition for every block value', () => {
    for (let b = 0; b <= 12; b++) expect(BLOCKS[b], `def for ${b}`).toBeDefined();
    expect(Object.keys(BLOCKS).length).toBe(13);
  });

  it('classifies solidity/transparency per spec section 3', () => {
    expect(isOpaque(Block.Stone)).toBe(true);
    expect(isOpaque(Block.Dirt)).toBe(true);
    expect(isOpaque(Block.Grass)).toBe(true);
    expect(isOpaque(Block.Sand)).toBe(true);
    expect(isOpaque(Block.Wood)).toBe(true);
    expect(isOpaque(Block.Planks)).toBe(true);
    expect(isOpaque(Block.Leaves)).toBe(false); // transparent (still solid)
    expect(isOpaque(Block.Glass)).toBe(false);
    expect(isOpaque(Block.Water)).toBe(false);
    expect(isOpaque(Block.Air)).toBe(false);
    expect(isOpaque(Block.Torch)).toBe(false);      // partial geometry, never opaque
    expect(isOpaque(Block.DoorBottom)).toBe(false); // a panel, even closed, never culls
    expect(isOpaque(Block.DoorTop)).toBe(false);
    expect(BLOCKS[Block.Water].solid).toBe(false);
    expect(BLOCKS[Block.Leaves].solid).toBe(true);
    expect(BLOCKS[Block.Glass].solid).toBe(true);
    expect(BLOCKS[Block.Torch].solid).toBe(false);
    expect(BLOCKS[Block.DoorBottom].solid).toBe(true); // solid when CLOSED (open ⇒ world.isSolid)
    expect(BLOCKS[Block.DoorTop].solid).toBe(true);
  });

  it('kind: the first ten are cubes, torch and doors are special', () => {
    for (const b of [Block.Air, Block.Stone, Block.Dirt, Block.Grass, Block.Sand, Block.Water, Block.Wood, Block.Leaves, Block.Glass, Block.Planks])
      expect(BLOCKS[b].kind, BLOCKS[b].name).toBe('cube');
    expect(BLOCKS[Block.Torch].kind).toBe('torch');
    expect(BLOCKS[Block.DoorBottom].kind).toBe('door');
    expect(BLOCKS[Block.DoorTop].kind).toBe('door');
    expect(isDoor(Block.DoorBottom)).toBe(true);
    expect(isDoor(Block.DoorTop)).toBe(true);
    expect(isDoor(Block.Torch)).toBe(false);
    expect(isDoor(Block.Stone)).toBe(false);
  });

  it('every block has a name, and names are unique', () => {
    const names = new Set<string>();
    for (let b = 0; b <= 12; b++) {
      expect(BLOCKS[b].name, `name for ${b}`).toMatch(/\w+/);
      names.add(BLOCKS[b].name);
    }
    expect(names.size).toBe(13);
  });

  it('tile map: grass top vs sides vs bottom, wood sides vs top', () => {
    const g = BLOCKS[Block.Grass].faces; // order: +X,-X,+Y,-Y,+Z,-Z
    expect(g[2]).toBe(0);  // +Y top face -> grassTop
    expect(g[3]).toBe(2);  // -Y bottom -> dirt
    expect([g[0], g[1], g[4], g[5]]).toEqual([1, 1, 1, 1]); // sides -> grassSide
    const w = BLOCKS[Block.Wood].faces;
    expect([w[0], w[1], w[4], w[5]]).toEqual([6, 6, 6, 6]); // woodSide
    expect([w[2], w[3]]).toEqual([7, 7]);                   // woodTop
  });

  it('PLACEABLE: 11 logical blocks (9 cubes + torch + door), never Air', () => {
    expect(PLACEABLE).toHaveLength(11);
    expect(PLACEABLE).not.toContain(Block.Air);
    expect(PLACEABLE).toContain(Block.Torch);
    expect(PLACEABLE).toContain(Block.DoorBottom); // the door's logical id
    expect(PLACEABLE).not.toContain(Block.DoorTop); // halves are never picked directly
  });

  // Regression: main.ts once built this string as static text (a `-$((` typo broke the
  // template interpolation), so every slot got the same invalid position, CSS dropped
  // it, and all icons defaulted to atlas tile 0 (grass). The string must embed real
  // per-block numbers and stay valid CSS.
  it('iconPosition: per-block pixel offset from the top row, at the given icon scale', () => {
    expect(iconPosition(Block.Grass, 40)).toBe('-0px 0px'); // tile 0, no shift
    expect(iconPosition(Block.Stone, 40)).toBe('-120px 0px'); // tile 3 * 40
    expect(iconPosition(Block.Dirt, 40)).toBe('-80px 0px'); // tile 2 * 40
    expect(iconPosition(Block.Sand, 40)).toBe('-160px 0px'); // tile 4 * 40
    expect(iconPosition(Block.Water, 44)).toBe('-220px 0px'); // tile 5 * 44 (palette scale)
    expect(iconPosition(Block.Wood, 40)).toBe('-280px 0px'); // top face tile 7
    expect(iconPosition(Block.Leaves, 40)).toBe('-320px 0px'); // tile 8
    expect(iconPosition(Block.Glass, 40)).toBe('-360px 0px'); // tile 9
    expect(iconPosition(Block.Planks, 40)).toBe('-400px 0px'); // tile 10
    expect(iconPosition(Block.Torch, 40)).toBe('-440px 0px'); // tile 11 (torchStem, via +Y face)
    expect(iconPosition(Block.DoorBottom, 40)).toBe('-520px 0px'); // tile 13 (door; tile 12 = flame, unused as icon)
    // must stay a number, not the raw expression text
    expect(iconPosition(Block.Stone, 40)).not.toContain('iconTile');
  });

  it('torch meta: 0 = floor post, otherwise 1 | (face << 1); round-trips', () => {
    expect(torchMeta(0)).toBe(0); // floor post
    for (const face of [1, 2, 3, 4]) { // 1:+X 2:-X 3:+Z 4:-Z
      expect(torchFace(torchMeta(face)), `face ${face}`).toBe(face);
    }
    expect(torchFace(0)).toBe(0);
  });

  it('door meta: bit0 = open, bit1 = axis, bit2 = side; round-trips', () => {
    for (const open of [false, true])
      for (const axis of [0, 1])
        for (const side of [0, 1]) {
          expect(doorOpen(doorMeta(open, axis, side)), `${open}/${axis}/${side}: open`).toBe(open);
          expect(doorAxis(doorMeta(open, axis, side)), `${open}/${axis}/${side}: axis`).toBe(axis);
          expect(doorSide(doorMeta(open, axis, side)), `${open}/${axis}/${side}: side`).toBe(side);
        }
    expect(doorMeta(false, 0)).toBe(0); // a fresh closed X-thin door carries 0
    expect(doorSide(doorMeta(false, 0, 0))).toBe(0);
    expect(doorSide(doorMeta(false, 0, 1))).toBe(1);
    expect(doorSide(doorMeta(true, 1, 1))).toBe(1); // side survives the open+axis bits
    for (const axis of [0, 1])
      expect(doorSide(doorMeta(false, axis)), `two-arg axis ${axis}`).toBe(0); // default side 0
  });
});