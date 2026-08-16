import { Block } from './blocks';

export const SLOTS = 9;

// Data-only: no DOM here (main.ts owns the DOM side), which keeps this node-testable.
export class Hotbar {
  slots: number[];
  selected = 0;
  onSelectChange?: (index: number) => void;
  onSlotChange?: (index: number) => void;

  constructor(defaults: number[]) {
    // pad short lists with their first slot, trim long ones, fall back to stone when empty
    this.slots = Array.from({ length: SLOTS }, (_, i) => defaults[i] ?? defaults[0] ?? Block.Stone);
    if (defaults.length > SLOTS) this.slots.length = SLOTS;
  }

  // The block to place: whatever sits in the selected slot.
  get block(): number {
    return this.slots[this.selected];
  }

  select(i: number): void {
    const n = ((i % SLOTS) + SLOTS) % SLOTS; // wrap both directions
    if (n === this.selected) return; // repeat is a no-op (key mashing / held wheel)
    this.selected = n;
    this.onSelectChange?.(n);
  }

  cycle(dir: number): void {
    this.select(this.selected + (dir >= 0 ? 1 : -1));
  }

  setSlot(i: number, b: number): void {
    const n = ((i % SLOTS) + SLOTS) % SLOTS;
    this.slots[n] = b;
    this.onSlotChange?.(n);
  }
}