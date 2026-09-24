import { test, expect } from '@playwright/test';

test('mob visuals follow terrain meshes without removing the simulated mob', async ({ page }) => {
  await page.goto('http://localhost:4173');
  const result = await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const [three, entities, worlds, rendering, chunks, visibility, meshing] = await Promise.all([
      load('/node_modules/three/build/three.module.js'),
      load('/src/entity.ts'),
      load('/src/world.ts'),
      load('/src/rendering/entity-renderer.ts'),
      load('/src/rendering/chunk-renderer.ts'),
      load('/src/rendering/entity-visibility.ts'),
      load('/src/chunk-mesher.ts'),
    ]);
    const scene = new three.Scene();
    const world = new worlds.World();
    world.ensureChunk(0, 0, 0);
    world.setBlock(1, 4, 1, 1);
    const sim = new entities.Sim(world, {}, 1);
    const mob = sim.spawn({ x: 1.5, y: 5, z: 1.5 }, new entities.IdleController(), {
      kindId: 'deer',
    });
    mob.name = 'Test mob';
    const material = new three.MeshBasicMaterial();
    const chunkRenderer = new chunks.ChunkRenderer(scene, material, material);
    const entityRenderer = new rendering.EntityRenderer(scene);
    const refresh = () => {
      entityRenderer.update(sim.all(), -1, 0, (entity: any) =>
        visibility.hasMeshedGround(entity, (key: string) => chunkRenderer.has(key)),
      );
      return {
        body: scene.children.find((object: any) => object.type === 'Group').visible,
        tag: scene.children.find((object: any) => object.type === 'Sprite').visible,
        entities: sim.all().length,
      };
    };
    const before = refresh();
    chunkRenderer.replace(
      '0,0,0',
      meshing.meshChunk(world, 0, 0, 0, () => [0, 0]),
    );
    const meshed = refresh();
    chunkRenderer.remove('0,0,0');
    const removed = refresh();
    entityRenderer.dispose();
    chunkRenderer.dispose();
    material.dispose();
    return { before, meshed, removed };
  });
  expect(result.before).toEqual({ body: false, tag: false, entities: 1 });
  expect(result.meshed).toEqual({ body: true, tag: true, entities: 1 });
  expect(result.removed).toEqual({ body: false, tag: false, entities: 1 });
});
