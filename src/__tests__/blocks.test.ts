import { describe, it, expect } from 'vitest';
import { Block, BLOCKS, isOpaque, PLACEABLE, iconTile, iconPosition } from '../blocks';

describe('blocks', () => {
  it('assigns the spec values in order (0..9)', () => {
    expect([Block.Air, Block.Stone, Block.Dirt, Block.Grass, Block.Sand, Block.Water, Block.Wood, Block.Leaves, Block.Glass, Block.Planks])
      .toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('BLOCKS has a definition for every block value', () => {
    for (let b = 0; b <= 9; b++) expect(BLOCKS[b], `def for ${b}`).toBeDefined();
    expect(Object.keys(BLOCKS).length).toBe(10);
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
    expect(BLOCKS[Block.Water].solid).toBe(false);
    expect(BLOCKS[Block.Leaves].solid).toBe(true);
    expect(BLOCKS[Block.Glass].solid).toBe(true);
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

  it('PLACEABLE: 9 blocks, never Air', () => {
    expect(PLACEABLE).toHaveLength(9);
    expect(PLACEABLE).not.toContain(Block.Air);
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
    // must stay a number, not the raw expression text
    expect(iconPosition(Block.Stone, 40)).not.toContain('iconTile');
  });
});