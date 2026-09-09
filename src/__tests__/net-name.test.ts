import { describe, it, expect } from 'vitest';
import { randomName, sanitizeName, NAME_COLORS } from '../net/name';

const NAME_RE = /^[A-Z][a-z]+[1-9][0-9]{3}$/; // "Blue4402"

describe('net/name', () => {
  it('randomName: a word from NAME_COLORS + a 4-digit number (1000–9999)', () => {
    for (let i = 0; i < 50; i++) {
      const n = randomName();
      expect(n, n).toMatch(NAME_RE);
      const m = n.match(/^([A-Z][a-z]+)([0-9]{4})$/)!;
      expect(NAME_COLORS).toContain(m[1]);
      expect(Number(m[2])).toBeGreaterThanOrEqual(1000);
      expect(Number(m[2])).toBeLessThanOrEqual(9999);
    }
  });
  it('sanitizeName: trims and collapses internal whitespace', () => {
    expect(sanitizeName('  Blue  4402 ')).toBe('Blue 4402');
  });
  it('sanitizeName: hard-caps at 16 chars', () => {
    expect(sanitizeName('abcdefghijklmnopqrs').length).toBe(16);
    expect(sanitizeName('abcdefghijklmnopqrs')).toBe('abcdefghijklmnop');
  });
  it('sanitizeName: passes short names through unchanged', () => {
    expect(sanitizeName('hi')).toBe('hi');
  });
  it('sanitizeName: empty/whitespace input becomes a random name', () => {
    expect(sanitizeName('')).toMatch(NAME_RE);
    expect(sanitizeName('   ')).toMatch(NAME_RE);
  });
});