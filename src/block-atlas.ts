import { CanvasTexture, NearestFilter } from 'three';
import { TILE_NAMES } from './blocks';

const TILE_SIZE = 16;
const ATLAS_SIZE = 256;

function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paintPixel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: readonly [number, number, number],
) {
  context.fillStyle = `rgb(${color[0] | 0},${color[1] | 0},${color[2] | 0})`;
  context.fillRect(x, y, 1, 1);
}

function paintSpeckles(
  context: CanvasRenderingContext2D,
  base: readonly [number, number, number],
  variation: number,
  random: () => number,
) {
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < 16; x++) {
      const offset = (random() - 0.5) * 2 * variation;
      paintPixel(context, x, y, [base[0] + offset, base[1] + offset, base[2] + offset]);
    }
  }
}

type TilePainter = (context: CanvasRenderingContext2D, random: () => number) => void;

const tilePainters: Record<(typeof TILE_NAMES)[number], TilePainter> = {
  grassTop: (context, random) => paintSpeckles(context, [92, 158, 66], 24, random),
  grassSide: (context, random) => {
    paintSpeckles(context, [120, 86, 52], 16, random);
    context.save();
    context.beginPath();
    context.rect(0, 0, 16, 3);
    context.clip();
    paintSpeckles(context, [92, 158, 66], 18, random);
    context.restore();
  },
  dirt: (context, random) => paintSpeckles(context, [120, 86, 52], 18, random),
  stone: (context, random) => {
    paintSpeckles(context, [112, 112, 118], 14, random);
    context.fillStyle = 'rgba(58,58,64,.85)';
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(random() * 14);
      const y = Math.floor(random() * 16);
      const width = 2 + Math.floor(random() * 3);
      context.fillRect(x, y, width, 1);
    }
  },
  sand: (context, random) => paintSpeckles(context, [216, 204, 152], 14, random),
  water: (context, random) => {
    paintSpeckles(context, [48, 104, 196], 12, random);
    context.fillStyle = 'rgba(130,185,255,.55)';
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(random() * 13);
      const y = Math.floor(random() * 16);
      context.fillRect(x, y, 3, 1);
    }
  },
  woodSide: (context, random) => {
    for (let x = 0; x < 16; x++) {
      const base: readonly [number, number, number] = x % 4 < 2 ? [112, 78, 44] : [98, 68, 40];
      for (let y = 0; y < 16; y++) {
        const offset = (random() - 0.5) * 14;
        paintPixel(context, x, y, [base[0] + offset, base[1] + offset, base[2] + offset]);
      }
    }
  },
  woodTop: (context, random) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const distance = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
        const base: readonly [number, number, number] =
          distance % 3 < 1.5 ? [152, 112, 64] : [114, 82, 48];
        const offset = (random() - 0.5) * 10;
        paintPixel(context, x, y, [base[0] + offset, base[1] + offset, base[2] + offset]);
      }
    }
  },
  leaves: (context, random) => paintSpeckles(context, [54, 118, 46], 30, random),
  glass: (context) => {
    context.fillStyle = 'rgb(196,232,250)';
    context.fillRect(0, 0, 16, 16);
    context.fillStyle = 'rgba(255,255,255,.95)';
    context.fillRect(0, 0, 16, 1);
    context.fillRect(0, 15, 16, 1);
    context.fillRect(0, 0, 1, 16);
    context.fillRect(15, 0, 1, 16);
    context.fillStyle = 'rgba(255,255,255,.55)';
    context.fillRect(3, 3, 2, 6);
  },
  planks: (context, random) => {
    for (let y = 0; y < 16; y++) {
      const base: readonly [number, number, number] = y % 4 === 3 ? [70, 48, 28] : [150, 108, 62];
      for (let x = 0; x < 16; x++) {
        const offset = (random() - 0.5) * 14;
        paintPixel(context, x, y, [base[0] + offset, base[1] + offset, base[2] + offset]);
      }
    }
  },
  torchStem: (context, random) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const base: readonly [number, number, number] =
          x < 2 || x > 13 ? [74, 50, 28] : [112, 78, 44];
        const offset = (random() - 0.5) * 14;
        paintPixel(context, x, y, [base[0] + offset, base[1] + offset, base[2] + offset]);
      }
    }
  },
  torchFlame: (context) => {
    context.fillStyle = 'rgb(255,150,40)';
    context.fillRect(3, 4, 10, 10);
    context.fillStyle = 'rgb(255,214,80)';
    context.fillRect(5, 6, 6, 7);
    context.fillStyle = 'rgb(255,246,205)';
    context.fillRect(7, 8, 2, 4);
  },
  door: (context, random) => {
    paintSpeckles(context, [150, 108, 62], 10, random);
    context.fillStyle = 'rgba(70,48,28,.9)';
    context.fillRect(0, 0, 16, 2);
    context.fillRect(0, 14, 16, 2);
    context.fillRect(0, 0, 2, 16);
    context.fillRect(14, 0, 2, 16);
    context.fillRect(7, 3, 2, 10);
    context.fillStyle = 'rgb(220,200,120)';
    context.fillRect(11, 8, 2, 2);
  },
};

export function paintBlockAtlas(context: CanvasRenderingContext2D): void {
  context.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
  // Tile order and seeds must stay stable: meshes and inventory icons share this layout.
  TILE_NAMES.forEach((name, index) => {
    context.save();
    context.translate((index % 16) * TILE_SIZE, Math.floor(index / 16) * TILE_SIZE);
    tilePainters[name](context, createRandom(0x5eed + index * 0x9e3779b9));
    context.restore();
  });
}

export function createBlockAtlas(canvas: HTMLCanvasElement): {
  texture: CanvasTexture;
  iconUrl: string;
} {
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Block atlas requires a 2D canvas context');
  paintBlockAtlas(context);

  const texture = new CanvasTexture(canvas);
  // Nearest filtering without mipmaps prevents neighboring tiles bleeding together.
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  return { texture, iconUrl: canvas.toDataURL() };
}
