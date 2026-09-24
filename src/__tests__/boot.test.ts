import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldMeta } from '../persistence';
import { bootGame } from '../startup/boot';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function setup() {
  const metadata = deferred<WorldMeta | null>();
  const options = {
    load: vi.fn(() => metadata.promise),
    start: vi.fn(async (_meta: WorldMeta | null) => {}),
    onTimeout: vi.fn(),
    onError: vi.fn(),
  };
  return { metadata, options };
}

const saved: WorldMeta = {
  v: 2,
  seed: 1234,
  entities: [],
  viewedEntityId: 1,
  time: { time: 0, tick: 0, phaseTotal: 0 },
  hotbar: { slots: [], selected: 0 },
};

describe('boot coordination', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each([saved, null])('starts with the loaded metadata: %j', async (meta) => {
    const { metadata, options } = setup();
    metadata.resolve(meta);
    const boot = bootGame(options);
    expect(options.start).not.toHaveBeenCalled();
    await boot;
    expect(options.start.mock.calls).toEqual([[meta]]);
    expect(options.onTimeout).not.toHaveBeenCalled();
    expect(options.onError).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('waits five seconds before falling back and ignores late metadata', async () => {
    const { metadata, options } = setup();
    const boot = bootGame(options);
    await vi.advanceTimersByTimeAsync(4999);
    expect(options.start).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await boot;
    metadata.resolve(saved);
    await vi.advanceTimersByTimeAsync(0);
    expect(options.start.mock.calls).toEqual([[null]]);
    expect(options.onTimeout).toHaveBeenCalledTimes(1);
    expect(options.onError).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('handles a late load rejection without failing the running game', async () => {
    const { metadata, options } = setup();
    const boot = bootGame(options);
    await vi.advanceTimersByTimeAsync(5000);
    await boot;
    metadata.reject(new Error('late load failure'));
    await vi.advanceTimersByTimeAsync(0);
    expect(options.start).toHaveBeenCalledTimes(1);
    expect(options.onError).not.toHaveBeenCalled();
  });

  it('does not time out while startup itself is still pending', async () => {
    const { metadata, options } = setup();
    const started = deferred<void>();
    options.start.mockReturnValue(started.promise);
    metadata.resolve(saved);
    const boot = bootGame(options);
    await vi.advanceTimersByTimeAsync(10000);
    expect(options.start.mock.calls).toEqual([[saved]]);
    expect(options.onTimeout).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    started.resolve();
    await boot;
  });

  it.each(['throw', 'reject'])('reports a load %s and cancels fallback', async (mode) => {
    const { options } = setup();
    const error = new Error('load failed');
    options.load.mockImplementation(() => {
      if (mode === 'throw') throw error;
      return Promise.reject(error);
    });
    await bootGame(options);
    await vi.advanceTimersByTimeAsync(10000);
    expect(options.onError.mock.calls).toEqual([[error]]);
    expect(options.start).not.toHaveBeenCalled();
    expect(options.onTimeout).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['loaded', 'fallback'])('reports startup failure once after %s boot', async (mode) => {
    const { metadata, options } = setup();
    const error = new Error('startup failed');
    options.start.mockRejectedValue(error);
    if (mode === 'loaded') metadata.resolve(saved);
    const boot = bootGame(options);
    await vi.advanceTimersByTimeAsync(5000);
    await boot;
    metadata.resolve(saved);
    await vi.advanceTimersByTimeAsync(5000);
    expect(options.start).toHaveBeenCalledTimes(1);
    expect(options.onError.mock.calls).toEqual([[error]]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
