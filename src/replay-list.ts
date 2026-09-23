import type { Replay } from './replay';

interface ReplayListOptions {
  stepSeconds: number;
  currentUrl(): string;
  navigate(url: string): void;
}

function replayRow(document: Document, replay: Replay, options: ReplayListOptions): HTMLElement {
  const row = document.createElement('div');
  row.className = 'row';
  const when = document.createElement('span');
  when.className = 'when';
  when.textContent = replay.recordedAt ? new Date(replay.recordedAt).toLocaleString() : '—';
  const duration = document.createElement('span');
  duration.className = 'len';
  duration.textContent = `${((replay.endTick - replay.startTick) * options.stepSeconds).toFixed(1)} s`;
  const tick = document.createElement('span');
  tick.className = 'tick';
  tick.textContent = `#${replay.startTick}`;
  row.append(when, duration, tick);
  row.addEventListener('click', () => {
    const url = new URL(options.currentUrl());
    url.searchParams.set('replay', `${replay.seed}:replay:${replay.startTick}`);
    options.navigate(url.toString());
  });
  return row;
}

export function renderReplayList(
  container: HTMLElement,
  replays: Replay[],
  options: ReplayListOptions,
): void {
  const document = container.ownerDocument;
  container.replaceChildren();
  if (replays.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'no recordings yet — press R, then record something';
    container.append(empty);
    return;
  }
  const newestFirst = [...replays].sort((a, b) => (b.recordedAt ?? 0) - (a.recordedAt ?? 0));
  for (const replay of newestFirst) container.append(replayRow(document, replay, options));
}
