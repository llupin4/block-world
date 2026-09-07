import { describe, it, expect } from 'vitest';
import { runStress } from '../net/stress';

describe('net:stress — host + N script bots for 1200 ticks', () => {
  it('stays under the pinned budgets (8 bots)', () => {
    const clients = 8;
    const report = runStress({ clients, ticks: 1200 });
    console.log('[net:stress]', JSON.stringify(report));
    expect(report.hostTickMs).toBeLessThanOrEqual(8);        // host tick budget (pinned)
    expect(report.bytesPerSecPerClient).toBeLessThanOrEqual(60000); // bytes/s per client (pinned)
    expect(report.msgPerSec).toBeGreaterThan(0);
  }, 30000);
});