import { describe, expect, it, vi } from 'vitest';
import { KeyboardControls } from '../input/keyboard-controls';
import { Hotbar } from '../ui/hotbar';
import type { Overlay } from '../ui/overlays';

function setup() {
  const open = new Set<Overlay>();
  const options = {
    keys: new Set<string>(),
    human: { toggleFly: vi.fn(), toggleNoclip: vi.fn(), select: vi.fn() },
    hotbar: new Hotbar([1]),
    menus: {
      isOpen: (overlay: Overlay) => open.has(overlay),
      toggle: vi.fn(),
      openReplays: vi.fn(),
    },
    isRecording: vi.fn(() => false),
    stopRecording: vi.fn(),
    toggleWireframe: vi.fn(),
    possess: vi.fn(),
  };
  const controls = new KeyboardControls(options);
  return { options, open, controls, press: (code: string) => controls.keyDown(code, false, false) };
}

describe('KeyboardControls', () => {
  it('ignores typing, tracks held keys, and does not repeat shortcut edges', () => {
    const { options, controls, press } = setup();
    controls.keyDown('KeyF', false, true);
    expect(options.keys.size).toBe(0);
    expect(options.human.toggleFly).not.toHaveBeenCalled();
    press('KeyF');
    controls.keyDown('KeyF', true, false);
    expect(options.keys.has('KeyF')).toBe(true);
    expect(options.human.toggleFly).toHaveBeenCalledTimes(1);
    controls.keyUp('KeyF');
    expect(options.keys.size).toBe(0);
  });

  it('routes entity and debug shortcuts', () => {
    const { options, press } = setup();
    press('KeyN');
    press('KeyC');
    press('KeyP');
    expect(options.human.toggleNoclip).toHaveBeenCalledTimes(1);
    expect(options.toggleWireframe).toHaveBeenCalledTimes(1);
    expect(options.possess).toHaveBeenCalledTimes(1);
  });

  it('allows only overlay shortcuts while the multiplayer menu is open', () => {
    const { options, open, press } = setup();
    open.add('multiplayer');
    for (const code of ['KeyF', 'KeyN', 'KeyC', 'KeyP', 'Digit4']) press(code);
    expect(options.human.toggleFly).not.toHaveBeenCalled();
    expect(options.human.toggleNoclip).not.toHaveBeenCalled();
    expect(options.toggleWireframe).not.toHaveBeenCalled();
    expect(options.possess).not.toHaveBeenCalled();
    expect(options.human.select).not.toHaveBeenCalled();
    for (const code of ['KeyE', 'KeyH', 'KeyM', 'KeyR']) press(code);
    expect(options.menus.toggle.mock.calls).toEqual([
      ['palette'],
      ['help'],
      ['multiplayer'],
      ['replays'],
    ]);
  });

  it('stops recording before opening the updated replay list', () => {
    const { options, press } = setup();
    options.isRecording.mockReturnValue(true);
    const order: string[] = [];
    options.stopRecording.mockImplementation(() => order.push('stop'));
    options.menus.openReplays.mockImplementation(() => order.push('open'));
    press('KeyR');
    expect(order).toEqual(['stop', 'open']);
    expect(options.menus.toggle).not.toHaveBeenCalled();
  });

  it('selects matching hotbar and intent slots for digits and numpad keys', () => {
    const { options, press } = setup();
    press('Digit9');
    expect(options.hotbar.selected).toBe(8);
    expect(options.human.select).toHaveBeenLastCalledWith(8);
    press('Numpad1');
    expect(options.hotbar.selected).toBe(0);
    expect(options.human.select).toHaveBeenLastCalledWith(0);
    for (const code of ['Digit0', 'Numpad0', 'KeyW', 'Space']) press(code);
    expect(options.human.select).toHaveBeenCalledTimes(2);
  });

  it('cycles the hotbar with wraparound and leaves palette/help/replay scrolling alone', () => {
    const { options, open, controls } = setup();
    controls.wheel(-1);
    expect(options.hotbar.selected).toBe(8);
    expect(options.human.select).toHaveBeenLastCalledWith(8);
    controls.wheel(1);
    expect(options.hotbar.selected).toBe(0);
    for (const overlay of ['palette', 'help', 'replays'] as const) {
      open.add(overlay);
      controls.wheel(1);
      open.delete(overlay);
    }
    expect(options.human.select).toHaveBeenCalledTimes(2);
  });
});
