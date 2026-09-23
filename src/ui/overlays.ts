export type Overlay = 'palette' | 'help' | 'replays' | 'multiplayer';

interface OverlayEffects {
  render(active: Overlay | null): void;
  lockPointer(): void;
  unlockPointer(): void;
  opened(active: Overlay): void;
}

export class Overlays {
  private active: Overlay | null = null;

  constructor(private readonly effects: OverlayEffects) {}

  isOpen(overlay: Overlay): boolean {
    return this.active === overlay;
  }

  open(overlay: Overlay): void {
    this.active = overlay;
    this.effects.render(overlay);
    // Switching panels must not briefly re-lock the pointer.
    this.effects.unlockPointer();
    this.effects.opened(overlay);
  }

  close(): void {
    this.active = null;
    this.effects.render(null);
    this.effects.lockPointer();
  }

  toggle(overlay: Overlay): void {
    if (this.isOpen(overlay)) this.close();
    else this.open(overlay);
  }
}
