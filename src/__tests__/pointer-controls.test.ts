import { describe, expect, it, vi } from 'vitest';
import { PointerControls } from '../input/pointer-controls';

function setup() {
  const canvas = new EventTarget();
  const document = Object.assign(new EventTarget(), {
    pointerLockElement: null as EventTarget | null,
  });
  const options = {
    canvas,
    document,
    crosshair: { style: { display: 'none' } },
    keys: new Set(['KeyW']),
    human: { mouse: vi.fn(), primary: vi.fn(), secondary: vi.fn() },
    closeMenus: vi.fn(),
    onUnlock: vi.fn(),
  };
  const controls = new PointerControls(options);
  const lock = (target: EventTarget | null = canvas) => {
    document.pointerLockElement = target;
    document.dispatchEvent(new Event('pointerlockchange'));
  };
  const mouseDown = (button: number) =>
    document.dispatchEvent(Object.assign(new Event('mousedown'), { button }));
  const move = () =>
    document.dispatchEvent(Object.assign(new Event('mousemove'), { movementX: 12, movementY: -4 }));
  return { controls, options, lock, mouseDown, move };
}

describe('PointerControls', () => {
  it('closes menus on canvas click but ignores unlocked mouse actions and movement', () => {
    const { options, controls, mouseDown, move } = setup();
    mouseDown(0);
    options.canvas.dispatchEvent(new Event('click'));
    move();
    expect(options.closeMenus).toHaveBeenCalledTimes(1);
    expect(options.human.primary).not.toHaveBeenCalled();
    expect(options.human.mouse).not.toHaveBeenCalled();
    expect(controls.locked).toBe(false);
  });

  it('routes locked mouse-look and primary/secondary edges without duplicate listeners', () => {
    const { options, controls, lock, mouseDown, move } = setup();
    lock();
    lock();
    expect(controls.locked).toBe(true);
    expect(options.crosshair.style.display).toBe('block');
    move();
    mouseDown(0);
    mouseDown(1);
    mouseDown(2);
    expect(options.human.mouse).toHaveBeenCalledWith(12, -4);
    expect(options.human.primary).toHaveBeenCalledTimes(1);
    expect(options.human.secondary).toHaveBeenCalledTimes(1);
  });

  it('suppresses the context menu only while this canvas is locked', () => {
    const { options, lock } = setup();
    const menu = () => {
      const event = new Event('contextmenu', { cancelable: true });
      options.document.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(menu()).toBe(false);
    lock();
    expect(menu()).toBe(true);
    lock(new EventTarget());
    expect(menu()).toBe(false);
  });

  it('clears held keys and targeting on unlock, then allows relocking', () => {
    const { options, controls, lock, mouseDown, move } = setup();
    lock();
    lock(null);
    expect(controls.locked).toBe(false);
    expect(options.crosshair.style.display).toBe('none');
    expect(options.keys.size).toBe(0);
    expect(options.onUnlock).toHaveBeenCalledTimes(1);
    mouseDown(0);
    move();
    expect(options.human.primary).not.toHaveBeenCalled();
    expect(options.human.mouse).not.toHaveBeenCalled();
    lock();
    mouseDown(0);
    expect(options.human.primary).toHaveBeenCalledTimes(1);
  });

  it('disposes all listeners and clears visible and held-key state', () => {
    const { options, controls, lock, mouseDown, move } = setup();
    lock();
    controls.dispose();
    options.canvas.dispatchEvent(new Event('click'));
    lock();
    mouseDown(0);
    mouseDown(2);
    move();
    expect(options.closeMenus).not.toHaveBeenCalled();
    expect(options.human.primary).not.toHaveBeenCalled();
    expect(options.human.secondary).not.toHaveBeenCalled();
    expect(options.human.mouse).not.toHaveBeenCalled();
    expect(controls.locked).toBe(false);
    expect(options.keys.size).toBe(0);
    expect(options.crosshair.style.display).toBe('none');
  });
});
