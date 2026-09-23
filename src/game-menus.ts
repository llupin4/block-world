import type { Replay } from './replay';
import { Overlays, type Overlay } from './overlays';

interface MenuOptions {
  document: Document;
  lockPointer(): void;
  unlockPointer(): void;
  canOpenMultiplayer(): boolean;
  rememberedName(): string;
  currentUrl(): string;
  navigate(url: string): void;
  listReplays(): Promise<Replay[]>;
  startRecording(): void;
  stepSeconds: number;
}

export function createGameMenus(options: MenuOptions) {
  const { document } = options;
  const panels: Record<Overlay, HTMLElement> = {
    palette: document.getElementById('palette')!,
    help: document.getElementById('help')!,
    replays: document.getElementById('replays')!,
    multiplayer: document.getElementById('mp-menu')!,
  };
  const helpHintEl = document.getElementById('help-hint')!;
  const replaysListEl = document.getElementById('replays-list')!;
  const mpNameEl = document.getElementById('mp-name') as HTMLInputElement;
  const mpCodeEl = document.getElementById('mp-code') as HTMLInputElement;
  const mpErrorEl = document.getElementById('mp-error')!;

  const overlays = new Overlays({
    render(active) {
      for (const [name, panel] of Object.entries(panels)) {
        panel.classList.toggle('hidden', name !== active);
      }
      helpHintEl.classList.toggle('hidden', active !== null);
    },
    lockPointer: options.lockPointer,
    unlockPointer: options.unlockPointer,
    opened(active) {
      if (active === 'multiplayer') {
        mpNameEl.value = options.rememberedName();
        mpErrorEl.classList.add('hidden');
        mpNameEl.focus();
      }
      if (active === 'replays') refreshReplayList();
    },
  });

  function refreshReplayList(): void {
    options.listReplays().then((replays) => {
      if (overlays.isOpen('replays')) buildReplayList(replays);
    });
  }

  function buildReplayList(replays: Replay[]): void {
    replaysListEl.replaceChildren();
    if (replays.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'no recordings yet — press R, then record something';
      replaysListEl.append(empty);
      return;
    }
    const sorted = [...replays].sort((a, b) => (b.recordedAt ?? 0) - (a.recordedAt ?? 0));
    for (const r of sorted) {
      const key = `${r.seed}:replay:${r.startTick}`;
      const row = document.createElement('div');
      row.className = 'row';
      const when = document.createElement('span');
      when.className = 'when';
      when.textContent = r.recordedAt ? new Date(r.recordedAt).toLocaleString() : '—';
      const len = document.createElement('span');
      len.className = 'len';
      len.textContent = `${((r.endTick - r.startTick) * options.stepSeconds).toFixed(1)} s`;
      const tick = document.createElement('span');
      tick.className = 'tick';
      tick.textContent = `#${r.startTick}`;
      row.append(when, len, tick);
      row.addEventListener('click', () => {
        const url = new URL(options.currentUrl());
        url.searchParams.set('replay', key);
        options.navigate(url.toString());
      });
      replaysListEl.append(row);
    }
  }

  document.getElementById('mp-host')!.addEventListener('click', () => {
    options.navigate(`?host&name=${encodeURIComponent(mpNameEl.value)}`);
  });
  document.getElementById('mp-join')!.addEventListener('click', () => {
    const code = mpCodeEl.value.trim().toLowerCase();
    if (!code) {
      mpErrorEl.textContent = 'paste the room code the host shows';
      mpErrorEl.classList.remove('hidden');
      return;
    }
    options.navigate(
      `?join=${encodeURIComponent(code)}&name=${encodeURIComponent(mpNameEl.value)}`,
    );
  });
  document.getElementById('replays-record')!.addEventListener('click', () => {
    options.startRecording();
    overlays.close();
  });
  helpHintEl.addEventListener('click', () => {
    if (!overlays.isOpen('help')) overlays.open('help');
  });

  return {
    isOpen: (overlay: Overlay) => overlays.isOpen(overlay),
    openReplays: () => overlays.open('replays'),
    close: () => overlays.close(),
    toggle(overlay: Overlay) {
      if (overlay === 'multiplayer' && !overlays.isOpen(overlay) && !options.canOpenMultiplayer())
        return;
      overlays.toggle(overlay);
    },
  };
}
