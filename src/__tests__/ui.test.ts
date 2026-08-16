import { describe, expect, it } from 'vitest';
import { Block } from '../blocks';
import { Hotbar } from '../ui';

describe('A — Hotbar construction', () => {
  it('keeps a full nine-slot default list as-is', () => {
    const h = new Hotbar([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(h.slots).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(h.selected).toBe(0);
    expect(h.block).toBe(1);
  });

  it('trims longer lists to nine', () => {
    expect(new Hotbar(Array.from({ length: 15 }, (_, i) => i)).slots).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('pads shorter lists with their first slot', () => {
    expect(new Hotbar([Block.Glass]).slots).toEqual(Array(9).fill(Block.Glass));
  });

  it('falls back to stone slots for an empty list', () => {
    const h = new Hotbar([]);
    expect(h.slots).toEqual(Array(9).fill(Block.Stone));
    expect(h.selected).toBe(0);
    expect(h.block).toBe(Block.Stone);
  });
});

describe('B — Hotbar selection', () => {
  it('wraps both ways and no-ops a repeat select', () => {
    const h = new Hotbar(Array(9).fill(1));
    const seen: number[] = [];
    h.onSelectChange = (i) => seen.push(i);
    h.select(11); // 11 % 9 -> 2
    h.select(2); // already selected: no event
    h.select(-1); // ((-1) % 9 + 9) % 9 -> 8
    expect(h.selected).toBe(8);
    expect(h.block).toBe(1);
    expect(seen).toEqual([2, 8]);
  });
});

describe('C — Hotbar wheel cycling', () => {
  it('cycles forward and backward across the wrap', () => {
    const h = new Hotbar(Array(9).fill(1));
    const seen: number[] = [];
    h.onSelectChange = (i) => seen.push(i);
    h.select(8);
    h.cycle(1); // 8 -> 0
    h.cycle(-1); // 0 -> 8
    h.select(3);
    h.cycle(1); // 3 -> 4
    h.cycle(5); // only the sign matters: 4 -> 5
    expect(h.selected).toBe(5);
    expect(seen).toEqual([8, 0, 8, 3, 4, 5]);
  });
});

describe('D — Hotbar slot assignment (palette click)', () => {
  it('wraps the slot index and reports the written value', () => {
    const h = new Hotbar(Array(9).fill(1));
    const writes: [number, number][] = [];
    h.onSlotChange = (i) => writes.push([i, h.slots[i]]);
    h.setSlot(11, 42); // 11 % 9 -> slot 2
    expect(h.slots[2]).toBe(42);
    expect(writes).toEqual([[2, 42]]);
    h.select(2);
    expect(h.block).toBe(42);
  });
});