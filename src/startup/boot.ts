import type { WorldMeta } from '../persistence';

interface BootOptions {
  load: () => Promise<WorldMeta | null>;
  start: (meta: WorldMeta | null) => Promise<void>;
  onTimeout: () => void;
  onError: (error: unknown) => void;
  timeoutMs?: number;
}

export async function bootGame({
  load,
  start,
  onTimeout,
  onError,
  timeoutMs = 5000,
}: BootOptions): Promise<void> {
  const timedOut = Symbol('boot timeout');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const fallback = new Promise<typeof timedOut>((resolve) => {
    timer = setTimeout(() => resolve(timedOut), timeoutMs);
  });

  try {
    // Defer loading so callers can finish assembling the game before startup runs.
    const result = await Promise.race([Promise.resolve().then(load), fallback]);
    clearTimeout(timer);
    if (result === timedOut) onTimeout();
    await start(result === timedOut ? null : result);
  } catch (error) {
    onError(error);
  } finally {
    clearTimeout(timer);
  }
}
