import type { Persistence } from '../persistence';
import type { World } from '../world';
import { snapshotWorldMeta, type WorldSnapshotSource } from './world-snapshot';

interface SaveSource extends WorldSnapshotSource {
  world: World;
  persist: Pick<Persistence, 'saveLoaded' | 'flush'>;
}

export class SavePoints {
  // Resolve on every save: startup may replace the active world, sim, and clock.
  constructor(private readonly current: () => SaveSource | null) {}

  saveMeta(target: Pick<Persistence, 'saveMeta'>): void {
    const source = this.current();
    if (source) target.saveMeta(snapshotWorldMeta(source));
  }

  saveAndFlush(): void {
    const source = this.current();
    if (!source) return;
    source.persist.saveLoaded(source.world.allChunks(), snapshotWorldMeta(source));
    void source.persist.flush();
  }
}

interface VisibilityEvents extends EventTarget {
  readonly visibilityState: string;
}

interface PageEvents extends EventTarget {
  setInterval(handler: () => void, timeout: number): number;
  clearInterval(id: number): void;
}

export function installSavePoints(
  saves: SavePoints,
  document: VisibilityEvents,
  page: PageEvents,
): () => void {
  const save = () => saves.saveAndFlush();
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') save();
  };
  document.addEventListener('visibilitychange', onVisibility);
  page.addEventListener('pagehide', save);
  // Page teardown is best-effort; periodic saves bound the usual crash-loss window to 5 s.
  const interval = page.setInterval(save, 5000);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    page.removeEventListener('pagehide', save);
    page.clearInterval(interval);
  };
}
