import type { Replay } from './replay';
import { Overlays, type Overlay } from './overlays';
import { MultiplayerMenu } from './multiplayer-menu';
import { renderReplayList } from './replay-list';

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

class GameMenus {
  private readonly panels: Record<Overlay, HTMLElement>;
  private readonly helpHint: HTMLElement;
  private readonly replayList: HTMLElement;
  private readonly multiplayer: MultiplayerMenu;
  private readonly overlays: Overlays;

  constructor(private readonly options: MenuOptions) {
    const { document } = options;
    this.panels = {
      palette: document.getElementById('palette')!,
      help: document.getElementById('help')!,
      replays: document.getElementById('replays')!,
      multiplayer: document.getElementById('mp-menu')!,
    };
    this.helpHint = document.getElementById('help-hint')!;
    this.replayList = document.getElementById('replays-list')!;
    this.multiplayer = new MultiplayerMenu(document, options);
    this.overlays = new Overlays({
      render: (active) => this.render(active),
      opened: (active) => this.opened(active),
      lockPointer: options.lockPointer,
      unlockPointer: options.unlockPointer,
    });
    document.getElementById('replays-record')!.addEventListener('click', () => this.record());
    this.helpHint.addEventListener('click', () => this.showHelp());
  }

  isOpen(overlay: Overlay): boolean {
    return this.overlays.isOpen(overlay);
  }

  openReplays(): void {
    this.overlays.open('replays');
  }

  close(): void {
    this.overlays.close();
  }

  toggle(overlay: Overlay): void {
    if (overlay === 'multiplayer' && !this.isOpen(overlay) && !this.options.canOpenMultiplayer())
      return;
    this.overlays.toggle(overlay);
  }

  private render(active: Overlay | null): void {
    for (const [name, panel] of Object.entries(this.panels)) {
      panel.classList.toggle('hidden', name !== active);
    }
    this.helpHint.classList.toggle('hidden', active !== null);
  }

  private opened(active: Overlay): void {
    if (active === 'multiplayer') this.multiplayer.open();
    if (active === 'replays') void this.refreshReplays();
  }

  private async refreshReplays(): Promise<void> {
    const replays = await this.options.listReplays();
    if (this.isOpen('replays')) renderReplayList(this.replayList, replays, this.options);
  }

  private record(): void {
    this.options.startRecording();
    this.close();
  }

  private showHelp(): void {
    if (!this.isOpen('help')) this.overlays.open('help');
  }
}

export function createGameMenus(options: MenuOptions) {
  return new GameMenus(options);
}
