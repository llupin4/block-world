export enum Block {
  Air = 0,
  Stone,
  Dirt,
  Grass,
  Sand,
  Water,
  Wood,
  Leaves,
  Glass,
  Planks,
}

export interface BlockDef {
  solid: boolean;
  transparent: boolean;
  /** tile indices, order [+X, -X, +Y, -Y, +Z, -Z]; see the atlas layout in Task 6 */
  faces: [number, number, number, number, number, number];
}

// D1: Record<number, ...> so plain-number voxel data indexes freely; completeness is test-enforced.
export const BLOCKS: Record<number, BlockDef> = {
  [Block.Air]:    { solid: false, transparent: true,  faces: [0, 0, 0, 0, 0, 0] },
  [Block.Stone]:  { solid: true,  transparent: false, faces: [3, 3, 3, 3, 3, 3] },
  [Block.Dirt]:   { solid: true,  transparent: false, faces: [2, 2, 2, 2, 2, 2] },
  [Block.Grass]:  { solid: true,  transparent: false, faces: [1, 1, 0, 2, 1, 1] },
  [Block.Sand]:   { solid: true,  transparent: false, faces: [4, 4, 4, 4, 4, 4] },
  [Block.Water]:  { solid: false, transparent: true,  faces: [5, 5, 5, 5, 5, 5] },
  [Block.Wood]:   { solid: true,  transparent: false, faces: [6, 6, 7, 7, 6, 6] },
  [Block.Leaves]: { solid: true,  transparent: true,  faces: [8, 8, 8, 8, 8, 8] },
  [Block.Glass]:  { solid: true,  transparent: true,  faces: [9, 9, 9, 9, 9, 9] },
  [Block.Planks]: { solid: true,  transparent: false, faces: [10, 10, 10, 10, 10, 10] },
};

export const TILE_NAMES = ['grassTop', 'grassSide', 'dirt', 'stone', 'sand', 'water', 'woodSide', 'woodTop', 'leaves', 'glass', 'planks'] as const;

export function isOpaque(b: number): boolean {
  return b !== Block.Air && !BLOCKS[b].transparent;
}

export const PLACEABLE: Block[] = [Block.Grass, Block.Stone, Block.Dirt, Block.Sand, Block.Wood, Block.Leaves, Block.Glass, Block.Planks, Block.Water];

export function iconTile(b: Block): number {
  return BLOCKS[b].faces[2]; // top-face tile doubles as the UI icon
}