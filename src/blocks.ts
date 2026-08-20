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
  Torch,
  DoorBottom,
  DoorTop,
}

/** 'cube' flows through the normal mesher path; 'torch'/'door' are partial geometry. */
export type BlockKind = 'cube' | 'torch' | 'door';

export interface BlockDef {
  name: string; // display name: palette rows, slot tooltips
  solid: boolean;        // solid to the WATER SIM (unconditionally — doors block water even while open; PROJECT.md §16); for doors this marks the closed state as well. Player collision uses world.isSolid, not this flag.
  transparent: boolean;  // culls neighbor faces? (never for torch/door — they are partial geometry)
  kind: BlockKind;
  light: number;         // block-light emission, 0..15 (0 = emits nothing; torch 14). Read by src/light.ts at seed time.
  opacity: number;       // extra light attenuation paid when light EXITS this cell: 0 air-like, 1 glass, 2 leaves/water, 15 nothing passes. Doors are meta-dependent via lightOpacity() (closed = 15, open = 0).
  /** tile indices, order [+X, -X, +Y, -Y, +Z, -Z]; see the atlas layout in main.ts. faces[2] doubles as the UI icon tile */
  faces: [number, number, number, number, number, number];
}

// D1: Record<number, ...> so plain-number voxel data indexes freely; completeness is test-enforced.
export const BLOCKS: Record<number, BlockDef> = {
  [Block.Air]:        { name: 'air',    solid: false, transparent: true,  kind: 'cube',  light: 0,   opacity: 0,  faces: [0, 0, 0, 0, 0, 0] },
  [Block.Stone]:      { name: 'stone',  solid: true,  transparent: false, kind: 'cube',  light: 0,   opacity: 15, faces: [3, 3, 3, 3, 3, 3] },
  [Block.Dirt]:       { name: 'dirt',   solid: true,  transparent: false, kind: 'cube',  light: 0,   opacity: 15, faces: [2, 2, 2, 2, 2, 2] },
  [Block.Grass]:      { name: 'grass',  solid: true,  transparent: false, kind: 'cube',  light: 0,   opacity: 15, faces: [1, 1, 0, 2, 1, 1] },
  [Block.Sand]:       { name: 'sand',   solid: true,  transparent: false, kind: 'cube',  light: 0,   opacity: 15, faces: [4, 4, 4, 4, 4, 4] },
  [Block.Water]:      { name: 'water',  solid: false, transparent: true,  kind: 'cube',  light: 0,   opacity: 2,  faces: [5, 5, 5, 5, 5, 5] },
  [Block.Wood]:       { name: 'wood',   solid: true,  transparent: false, kind: 'cube',  light: 0,   opacity: 15, faces: [6, 6, 7, 7, 6, 6] },
  [Block.Leaves]:     { name: 'leaves', solid: true,  transparent: true,  kind: 'cube',  light: 0,   opacity: 2,  faces: [8, 8, 8, 8, 8, 8] },
  [Block.Glass]:      { name: 'glass',  solid: true,  transparent: true,  kind: 'cube',  light: 0,   opacity: 1,  faces: [9, 9, 9, 9, 9, 9] },
  [Block.Planks]:     { name: 'planks', solid: true,  transparent: false, kind: 'cube',  light: 0,   opacity: 15, faces: [10, 10, 10, 10, 10, 10] },
  [Block.Torch]:      { name: 'torch',  solid: false, transparent: true,  kind: 'torch', light: 14,  opacity: 0,  faces: [11, 11, 11, 11, 11, 11] },
  [Block.DoorBottom]: { name: 'door',   solid: true,  transparent: true,  kind: 'door',  light: 0,   opacity: 15, faces: [13, 13, 13, 13, 13, 13] },
  [Block.DoorTop]:    { name: 'doorTop',solid: true,  transparent: true,  kind: 'door',  light: 0,   opacity: 15, faces: [13, 13, 13, 13, 13, 13] },
};

export const TILE_NAMES = [
  'grassTop', 'grassSide', 'dirt', 'stone', 'sand', 'water',
  'woodSide', 'woodTop', 'leaves', 'glass', 'planks',
  'torchStem', 'torchFlame', 'door',
] as const;

export function isOpaque(b: number): boolean {
  return b !== Block.Air && !BLOCKS[b].transparent;
}

// DoorBottom is the door's LOGICAL id (palette/hotbar); placement expands it to the
// bottom + top pair. Torch/DoorBottom are the only new entries -> 11 logical placeables.
export const PLACEABLE: Block[] = [
  Block.Grass, Block.Stone, Block.Dirt, Block.Sand, Block.Wood,
  Block.Leaves, Block.Glass, Block.Planks, Block.Water,
  Block.Torch, Block.DoorBottom,
];

export function iconTile(b: Block): number {
  return BLOCKS[b].faces[2]; // top-face tile doubles as the UI icon
}

// CSS background-position that crops the block's top-row tile column out of the full
// atlas, scaled to `px` per tile (16 tiles across). Kept as a pure string helper so the
// interpolation stays unit-tested (main.ts's `-$((` typo once made it static, invalid
// CSS, and every slot fell back to tile 0 — grass).
export function iconPosition(b: Block, px: number): string {
  return `-${(iconTile(b) % 16) * px}px 0px`;
}

// === per-cell state (stored in World.meta; design doc section "Per-cell state") ===
//
// Torch meta: 0 = a floor post; a wall stub is 1 | (face << 1) where `face` is the
// normal of the support face the player aimed at: 1:+X, 2:-X, 3:+Z, 4:-Z (no ceilings).
// Door meta (stored in BOTH halves, identical): bit 0 = open, bit 1 = axis
// (0 = panel thin in X, 1 = panel thin in Z), bit 2 = side (0 = the panel hinges on
// the thin axis's MIN edge of the cell, 1 = its MAX edge). The closed panel hugs that
// edge, flush against the support wall the player aimed at; the open state is the SAME
// full-size panel swung 90 degrees about the hinge corner — never clamped.

export function torchMeta(face: number): number {
  return face === 0 ? 0 : 1 | (face << 1);
}

export function torchFace(meta: number): number {
  return meta === 0 ? 0 : (meta >> 1) & 7;
}

export function doorMeta(open: boolean, axis: number, side = 0): number {
  return (open ? 1 : 0) | ((axis & 1) << 1) | ((side & 1) << 2);
}

export function doorOpen(meta: number): boolean {
  return (meta & 1) !== 0;
}

export function doorAxis(meta: number): number {
  return (meta >> 1) & 1;
}

export function doorSide(meta: number): number {
  return (meta >> 2) & 1;
}

export function isDoor(b: number): boolean {
  return b === Block.DoorBottom || b === Block.DoorTop;
}

/** Door axis (0 = panel thin in X, 1 = thin in Z) from the player's LEVEL FACING so the
 * closed panel's wide face is perpendicular to where the player is looking (covers a
 * hallway they're facing down); side (0 = min edge, 1 = max edge of the thin axis) from
 * the aimed-face normal along the thin axis (a -X/aimed-far-side -> side 1). If the
 * level facing is degenerate (looking straight down), fall back to the aimed normal. */
export function doorPlacementFromView(fx: number, fz: number, nx: number, nz: number): { axis: 0 | 1; side: 0 | 1 } {
  let axis: 0 | 1;
  if (Math.abs(fx) >= 1e-3 || Math.abs(fz) >= 1e-3) {
    axis = Math.abs(fx) >= Math.abs(fz) ? 0 : 1;
  } else {
    axis = nz !== 0 ? 1 : 0;
  }
  const side = (axis === 1 ? nz : nx) < 0 ? 1 : 0;
  return { axis, side };
}