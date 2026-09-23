import { BLOCKS, iconPosition } from '../blocks';
import type { Hotbar } from './hotbar';

const ICON_SIZE = 40;

interface InventoryElements {
  hotbar: HTMLElement;
  palette: HTMLElement;
}

export class InventoryView {
  private readonly slots: HTMLElement[];
  private readonly paletteRows: HTMLElement[];

  constructor(
    private readonly elements: InventoryElements,
    private readonly hotbar: Hotbar,
    private readonly paletteBlocks: readonly number[],
    private readonly atlasUrl: string,
  ) {
    this.slots = Array.from(elements.hotbar.children) as HTMLElement[];
    this.paletteRows = paletteBlocks.map((block) => this.createPaletteRow(block));
    elements.palette.replaceChildren(...this.paletteRows);
    this.slots.forEach((slot, index) => {
      const keycap = slot.ownerDocument.createElement('span');
      keycap.className = 'num';
      keycap.textContent = String(index + 1);
      slot.append(keycap);
      this.renderSlot(index);
    });
    hotbar.onSelectChange = () => this.renderSelection();
    hotbar.onSlotChange = (index) => {
      this.renderSlot(index);
      this.renderSelection();
    };
    this.renderSelection();
    this.setVisible(true);
  }

  setVisible(visible: boolean): void {
    this.elements.hotbar.classList.toggle('hidden', !visible);
  }

  private paintIcon(element: HTMLElement, block: number): void {
    element.style.backgroundImage = `url(${this.atlasUrl})`;
    element.style.backgroundSize = `${ICON_SIZE * 16}px ${ICON_SIZE * 16}px`;
    element.style.backgroundPosition = iconPosition(block, ICON_SIZE);
    element.title = BLOCKS[block].name;
  }

  private createPaletteRow(block: number): HTMLElement {
    const document = this.elements.palette.ownerDocument;
    const row = document.createElement('div');
    row.className = 'slot';
    const icon = document.createElement('div');
    icon.className = 'icon';
    this.paintIcon(icon, block);
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = BLOCKS[block].name;
    row.append(icon, name);
    row.addEventListener('click', () => this.hotbar.setSlot(this.hotbar.selected, block));
    return row;
  }

  private renderSlot(index: number): void {
    this.paintIcon(this.slots[index], this.hotbar.slots[index]);
  }

  private renderSelection(): void {
    this.slots.forEach((slot, index) => {
      slot.classList.toggle('sel', index === this.hotbar.selected);
    });
    this.paletteRows.forEach((row, index) => {
      row.classList.toggle('sel', this.paletteBlocks[index] === this.hotbar.block);
    });
  }
}
