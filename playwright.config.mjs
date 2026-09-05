// Playwright config — the deterministic profiling rig (tests/e2e). Runs against a dedicated
// vite dev server port (4173) so it never collides with a developer's default 5173 server.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 180_000,
  use: {
    headless: true,
    launchOptions: {
      // SwiftShader software WebGL for machines/GPUs where headless WebGL would not initialize;
      // ignored (harmless) on builds that do not need it.
      args: ['--enable-unsafe-swiftshader'],
    },
  },
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});