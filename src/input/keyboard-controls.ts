import type { HumanController } from '../entity';
import type { Hotbar } from '../ui/hotbar';
import type { Overlay } from '../ui/overlays';

interface KeyboardOptions {
  keys: Set<string>;
  human: Pick<HumanController, 'toggleFly' | 'toggleNoclip' | 'select'>;
  hotbar: Hotbar;
  menus: {
    isOpen(overlay: Overlay): boolean;
    toggle(overlay: Overlay): void;
    openReplays(): void;
  };
  isRecording(): boolean;
  stopRecording(): void;
  toggleWireframe(): void;
  possess(): void;
}

const OVERLAY_KEYS = new Set(['KeyE', 'KeyH', 'KeyM', 'KeyR']);

export class KeyboardControls {
  private readonly shortcuts: Record<string, () => void>;

  constructor(private readonly options: KeyboardOptions) {
    const { human, menus } = options;
    this.shortcuts = {
      KeyF: () => human.toggleFly(),
      KeyN: () => human.toggleNoclip(),
      KeyR: () => this.toggleReplays(),
      KeyE: () => menus.toggle('palette'),
      KeyH: () => menus.toggle('help'),
      KeyM: () => menus.toggle('multiplayer'),
      KeyC: () => options.toggleWireframe(),
      KeyP: () => options.possess(),
    };
  }

  keyDown(code: string, repeat: boolean, typing: boolean): void {
    if (typing) return;
    this.options.keys.add(code);
    if (repeat) return;
    if (this.options.menus.isOpen('multiplayer') && !OVERLAY_KEYS.has(code)) return;
    this.shortcuts[code]?.();
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(code);
    if (!digit) return;
    const slot = Number(digit[1]) - 1;
    this.options.hotbar.select(slot);
    this.options.human.select(slot);
  }

  keyUp(code: string): void {
    this.options.keys.delete(code);
  }

  wheel(deltaY: number): void {
    const { menus, hotbar, human } = this.options;
    if (menus.isOpen('palette') || menus.isOpen('help') || menus.isOpen('replays')) return;
    hotbar.cycle(deltaY > 0 ? 1 : -1);
    human.select(hotbar.selected);
  }

  private toggleReplays(): void {
    const { menus } = this.options;
    if (!this.options.isRecording()) {
      menus.toggle('replays');
      return;
    }
    this.options.stopRecording();
    menus.openReplays();
  }
}

export function installKeyboardControls(window: Window, controls: KeyboardControls): () => void {
  const keyDown = (event: KeyboardEvent) => {
    const typing =
      event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
    controls.keyDown(event.code, event.repeat, typing);
  };
  const keyUp = (event: KeyboardEvent) => controls.keyUp(event.code);
  const wheel = (event: WheelEvent) => controls.wheel(event.deltaY);
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('wheel', wheel, { passive: true });
  return () => {
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    window.removeEventListener('wheel', wheel);
  };
}
