#!/usr/bin/env node
// Build the site and publish it to the gh-pages branch.
//
// Vite's default build emits hashed asset names, a `crossorigin` attribute and
// absolute `/assets/...` paths — none of which suit GitHub Pages: the site is
// served under /block-world/ (so paths must be relative), and the gh-pages
// branch pins the entry files to assets/index.js + assets/index.css.
//
// This script:
//   1. builds (tsc --noEmit && vite build),
//   2. rewrites dist/ to the gh-pages pattern (static index.js/index.css,
//      relative ./assets/..., no crossorigin),
//   3. mirrors dist/ into the gh-pages branch, commits and pushes,
//   4. restores the branch it was run from.
//
// Usage (from main, clean working tree):
//   npm run deploy:gh-pages            # build, mirror, commit and push
//   npm run deploy:gh-pages -- --dry-run  # preview the deploy (no commit/push)

import { execSync } from 'node:child_process';
import { cpSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sh = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' }); // visible: build / checkout / commit / push
const q = (cmd) => execSync(cmd, { cwd: root }).toString().trim(); // captured: git queries

const dryRun = process.argv.includes('--dry-run');
const from = q('git rev-parse --abbrev-ref HEAD');
if (q('git status --porcelain')) {
  console.error('Working tree is not clean — commit or stash changes first.');
  process.exit(1);
}

// 1. Build (type-check + vite). A build/type error throws and aborts the deploy.
sh('npm run build');

// 2. Rewrite dist/ to the gh-pages pattern.
{
  const dist = join(root, 'dist');
  const assets = join(dist, 'assets');

  // Pin the ENTRY files to static names — only the assets index.html references. Worker
  // chunks (the light worker, ADR 0012) and any future extra assets keep their hashed
  // names: the worker ref inside the bundle is a hashed sibling in the same folder, so
  // renaming it would break the new URL(...) resolution at runtime.
  const html0 = readFileSync(join(dist, 'index.html'), 'utf8');
  const entryJs = html0.match(/src="(?:\.\/)?\/?assets\/([^"]+\.js)"/)?.[1];
  const entryCss = html0.match(/href="(?:\.\/)?\/?assets\/([^"]+\.css)"/)?.[1];
  for (const f of readdirSync(assets)) {
    if (f === entryJs) renameSync(join(assets, f), join(assets, 'index.js'));
    else if (f === entryCss) renameSync(join(assets, f), join(assets, 'index.css'));
  }

  // index.html: drop `crossorigin`, and point the entry files at the static relative
  // paths (works whether vite emitted /assets/ or ./assets/).
  const html = html0
    .replace(/ crossorigin/g, '')
    .replace(/src="(?:\.\/)?\/?assets\/[^"]+\.js"/g, 'src="./assets/index.js"')
    .replace(/href="(?:\.\/)?\/?assets\/[^"]+\.css"/g, 'href="./assets/index.css"');
  writeFileSync(join(dist, 'index.html'), html);
}

// 3. Mirror dist/ into gh-pages, commit + push; restore the branch on exit.
sh('git checkout gh-pages');
try {
  // Replace the deployed assets + index.html with the fresh build (keep .gitignore).
  rmSync(join(root, 'assets'), { recursive: true, force: true });
  rmSync(join(root, 'index.html'), { force: true });
  cpSync(join(root, 'dist', 'assets'), join(root, 'assets'), { recursive: true });
  cpSync(join(root, 'dist', 'index.html'), join(root, 'index.html'));
  // Stage only the site files. (Not `git add -A`: a build leaves .vite/ and other
  // untracked cruft in the tree, which the gh-pages .gitignore does not cover.)
  sh('git add index.html assets');
  const staged = q('git diff --cached --name-only');
  if (!staged) {
    console.log('No changes to deploy.');
  } else if (dryRun) {
    console.log('\n[dry-run] changes that would be committed + pushed to origin/gh-pages:\n');
    sh('git diff --cached --stat');
    console.log('\n[dry-run] Skipping commit/push.');
  } else {
    const fromSha = q(`git rev-parse --short ${from}`); // the commit this build was made from
    sh(`git commit -m "deploy: ${fromSha}"`);
    sh('git push origin gh-pages');
    console.log(`Deployed build of ${fromSha} to gh-pages.`);
  }
} finally {
  if (dryRun) sh('git reset --hard'); // discard the mirrored build (no commit was made)
  sh(`git checkout ${from}`);
}