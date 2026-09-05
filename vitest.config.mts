import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit suite only — tests/e2e is the Playwright rig's (npm run prof), not vitest's.
    include: ['src/__tests__/**/*.test.ts'],
  },
});