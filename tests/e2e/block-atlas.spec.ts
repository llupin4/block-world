import { test, expect } from '@playwright/test';

test('block atlas preserves seeded pixels and shares them with inventory icons', async ({
  page,
}) => {
  await page.goto('http://localhost:4173');
  const atlas = await page.evaluate(async () => {
    // Load the module through Vite without requiring a WebGL renderer.
    const moduleUrl = '/src/block-atlas.ts';
    const { createBlockAtlas, paintBlockAtlas } = await import(moduleUrl);
    const canvas = document.createElement('canvas');
    const { texture, iconUrl } = createBlockAtlas(canvas);
    const context = canvas.getContext('2d')!;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const digest = await crypto.subtle.digest('SHA-256', pixels);
    paintBlockAtlas(context);
    return {
      width: canvas.width,
      height: canvas.height,
      hash: Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      ),
      sharedCanvas: texture.image === canvas,
      repeatable: iconUrl === canvas.toDataURL(),
      nearestFiltering: texture.magFilter === 1003 && texture.minFilter === 1003,
      mipmaps: texture.generateMipmaps,
    };
  });

  expect(atlas).toEqual({
    width: 256,
    height: 256,
    // Captured from the original main.ts atlas before extraction.
    hash: '154f9a37cd01f2b2b39e9b9c9d7d952274b0cc3fc1a2c81b556472e76817371d',
    sharedCanvas: true,
    repeatable: true,
    nearestFiltering: true,
    mipmaps: false,
  });
});
