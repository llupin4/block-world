import { CanvasTexture } from 'three';

export function createNameTexture(name: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext('2d')!;
  context.font = 'bold 40px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = 'rgba(0,0,0,0.55)';
  context.fillRect(0, 0, 256, 64);
  context.fillStyle = '#fff';
  context.fillText(name.slice(0, 14), 128, 34);
  return new CanvasTexture(canvas);
}
