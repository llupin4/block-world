import { defineConfig } from 'vite';

// Relative base: the site deploys under the /block-world/ GitHub Pages subpath
// (scripts/deploy-gh-pages.mjs rewrites the HTML's asset refs to relative, but the
// in-bundle light-worker URL — new Worker(new URL('/assets/light-worker-<hash>.js', ...))
// — would 404 under the subpath with the default base '/', and the light would freeze).
// './' makes every emitted URL relative to the document, so the bundle works under
// any subpath; the deploy script's regexes accept both shapes.
export default defineConfig({ base: './' });