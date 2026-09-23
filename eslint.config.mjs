import tsParser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';

// Expand this list as modules are cleaned up. Legacy modules are not gated yet.
export const complexityFiles = [
  'src/block-atlas.ts',
  'src/game-menus.ts',
  'src/multiplayer-menu.ts',
  'src/overlays.ts',
  'src/replay-list.ts',
];

export default [
  {
    files: complexityFiles,
    languageOptions: { parser: tsParser },
    plugins: { sonarjs },
    rules: { 'sonarjs/cognitive-complexity': ['error', 15] },
  },
];
