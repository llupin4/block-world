import { formatClock } from '../time';

interface HudState {
  viewedKind: string | null;
  canEdit: boolean;
  recording: boolean;
  playback: { paused: boolean; endTick: number } | null;
  tick: number;
  day: number;
  hour: number;
}

interface HudActions {
  setInventoryVisible(visible: boolean): void;
  quitReplay(): void;
}

export class Hud {
  private readonly clock: HTMLElement;
  private readonly kind: HTMLElement;
  private readonly scrub: HTMLElement;
  private readonly scrubLabel: HTMLElement;
  private readonly quit: HTMLElement;
  private clockLabel = '';

  constructor(
    document: Document,
    private readonly actions: HudActions,
  ) {
    this.clock = document.getElementById('clock')!;
    this.kind = document.getElementById('kind')!;
    this.scrub = document.getElementById('scrub')!;
    this.scrubLabel = document.getElementById('scrub-label')!;
    this.quit = document.getElementById('scrub-quit')!;
    this.quit.addEventListener('click', actions.quitReplay);
  }

  update(state: HudState): void {
    this.kind.textContent = state.viewedKind === null ? '' : `viewing: ${state.viewedKind}`;
    this.actions.setInventoryVisible(state.canEdit);
    this.updateRecording(state);
    const label = formatClock(state.day, state.hour);
    if (label !== this.clockLabel) {
      this.clockLabel = label;
      this.clock.textContent = label;
    }
  }

  private updateRecording(state: HudState): void {
    if (state.recording) {
      this.scrub.classList.remove('hidden');
      this.scrubLabel.textContent = '● recording… (R to stop)';
      this.quit.classList.add('hidden');
    } else if (state.playback) {
      this.scrub.classList.remove('hidden');
      const status = state.playback.paused ? '⏸ paused' : '▶ playing';
      this.scrubLabel.textContent = `replay ${status}   t ${state.tick} / ${state.playback.endTick}`;
      this.quit.classList.remove('hidden');
    } else {
      this.scrub.classList.add('hidden');
    }
  }
}
