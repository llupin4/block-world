// The light worker entry (ADR 0012): thin plumbing around LightWorkerState (the logic lives
// in src/light-worker-core.ts so vitest can drive it without a Worker runtime). Vite bundles
// this file as the worker chunk (dev and build, no vite.config change); main.ts's side spawns
// it via new Worker(new URL('./light-worker.ts', import.meta.url)) in src/light-transport.ts.

import { LightWorkerState } from './light-worker-core';
import type { LightMsg } from './light-protocol';

// The DOM lib types `self` as Window (whose postMessage wants a targetOrigin); in the worker
// context the single-argument postMessage is the real one. Localized cast.
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage: (msg: unknown) => void;
};

const state = new LightWorkerState();
ctx.onmessage = (e: MessageEvent<LightMsg>) => {
  const r = state.handle(e.data);
  if (r) ctx.postMessage(r);
};