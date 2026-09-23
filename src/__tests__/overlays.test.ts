import { describe, expect, it, vi } from 'vitest';
import { Overlays } from '../ui/overlays';

function setup() {
  const effects = {
    render: vi.fn(),
    lockPointer: vi.fn(),
    unlockPointer: vi.fn(),
    opened: vi.fn(),
  };
  return { overlays: new Overlays(effects), effects };
}

describe('overlays', () => {
  it('switches panels without locking the pointer between them', () => {
    const { overlays, effects } = setup();
    overlays.open('palette');
    overlays.open('help');
    expect(overlays.isOpen('palette')).toBe(false);
    expect(overlays.isOpen('help')).toBe(true);
    expect(effects.render.mock.calls).toEqual([['palette'], ['help']]);
    expect(effects.lockPointer).not.toHaveBeenCalled();
    expect(effects.unlockPointer).toHaveBeenCalledTimes(2);
    expect(effects.opened).toHaveBeenLastCalledWith('help');
  });

  it('toggling the active panel hides it and restores pointer lock', () => {
    const { overlays, effects } = setup();
    overlays.toggle('replays');
    overlays.toggle('replays');
    expect(overlays.isOpen('replays')).toBe(false);
    expect(effects.render).toHaveBeenLastCalledWith(null);
    expect(effects.lockPointer).toHaveBeenCalledTimes(1);
    expect(effects.unlockPointer).toHaveBeenCalledTimes(1);
  });

  it('a canvas click can request pointer lock even with no panel open', () => {
    const { overlays, effects } = setup();
    overlays.close();
    expect(effects.render).toHaveBeenCalledWith(null);
    expect(effects.lockPointer).toHaveBeenCalledTimes(1);
  });
});
