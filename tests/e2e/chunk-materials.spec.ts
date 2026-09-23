import { test, expect } from '@playwright/test';

test('chunk shaders render at noon and night, including wireframe recompilation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /shader|WebGLProgram/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  for (const phase of [0, 0.5]) {
    await page.goto(`http://localhost:4173/?dbg&phase=${phase}`);
    await page.waitForFunction(() => {
      const debug = (window as any).__bw;
      return debug?.scene.children.some((object: any) => object.geometry?.getAttribute('aLight'));
    });
    await page.keyboard.press('c');
    const compiled = await page.evaluate(() => {
      const { renderer, scene, camera } = (window as any).__bw;
      renderer.render(scene, camera);
      const chunks = scene.children.filter((object: any) =>
        object.geometry?.getAttribute('aLight'),
      );
      return {
        wireframe: chunks.every((object: any) => object.material.wireframe),
        programs: renderer.info.programs.length,
        runnable: renderer.info.programs.every(
          (program: any) => program.diagnostics?.runnable !== false,
        ),
      };
    });
    expect(compiled.wireframe).toBe(true);
    expect(compiled.programs).toBeGreaterThan(0);
    expect(compiled.runnable).toBe(true);
  }
  expect(errors).toEqual([]);
});
