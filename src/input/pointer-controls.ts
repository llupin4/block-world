import type { HumanController } from '../entity';

interface PointerDocument extends EventTarget {
  readonly pointerLockElement: EventTarget | null;
}

interface PointerOptions {
  document: PointerDocument;
  canvas: EventTarget;
  crosshair: { style: { display: string } };
  keys: Set<string>;
  human: Pick<HumanController, 'mouse' | 'primary' | 'secondary'>;
  closeMenus(): void;
  onUnlock(): void;
}

export class PointerControls {
  private pointerLocked = false;

  constructor(private readonly options: PointerOptions) {
    options.canvas.addEventListener('click', this.onClick);
    options.document.addEventListener('pointerlockchange', this.onLockChange);
    options.document.addEventListener('mousemove', this.onMouseMove);
  }

  get locked(): boolean {
    return this.pointerLocked;
  }

  dispose(): void {
    const { document, canvas } = this.options;
    canvas.removeEventListener('click', this.onClick);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.detachActions();
    this.clearLockState();
  }

  private readonly onClick = () => this.options.closeMenus();

  private readonly onLockChange = () => {
    const { document, canvas, crosshair } = this.options;
    this.pointerLocked = document.pointerLockElement === canvas;
    crosshair.style.display = this.pointerLocked ? 'block' : 'none';
    if (this.pointerLocked) {
      // Attach only after lock: the click requesting it must never edit the world.
      document.addEventListener('mousedown', this.onMouseDown);
      document.addEventListener('contextmenu', this.onContextMenu);
    } else {
      this.detachActions();
      this.clearLockState();
    }
  };

  private readonly onMouseMove = (event: Event) => {
    const { document, canvas, human } = this.options;
    if (document.pointerLockElement !== canvas) return;
    const mouse = event as MouseEvent;
    human.mouse(mouse.movementX, mouse.movementY);
  };

  private readonly onMouseDown = (event: Event) => {
    const mouse = event as MouseEvent;
    if (mouse.button === 0) this.options.human.primary();
    else if (mouse.button === 2) this.options.human.secondary();
  };

  private readonly onContextMenu = (event: Event) => event.preventDefault();

  private detachActions(): void {
    this.options.document.removeEventListener('mousedown', this.onMouseDown);
    this.options.document.removeEventListener('contextmenu', this.onContextMenu);
  }

  private clearLockState(): void {
    this.pointerLocked = false;
    this.options.crosshair.style.display = 'none';
    this.options.keys.clear();
    this.options.onUnlock();
  }
}
