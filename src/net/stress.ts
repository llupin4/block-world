import { ScriptController, type ScriptStep } from '../entity';
import { LoopbackHub } from './transport';
import { HostSession } from './host';
import { ClientSession } from './client';

export interface StressReport { ticks: number; clients: number; hostTickMs: number; msgPerSec: number; bytesPerSecPerClient: number }

// A deterministic bot script: aim, then walk forward a long way (exercises streaming/loading,
// the union ring, cell sync, and the state broadcast). One per bot.
function botScript(): ScriptStep[] {
  return [
    { op: 'lookAt', x: 100, y: 40, z: 100 },
    { op: 'walkTo', x: 100, z: 100, timeout: 1190 },
  ];
}

// The load rig: a host + N script bots over the loopback for `ticks`. Reports the host's
// per-tick cost (ms), messages/s, and bytes/s per client. Wired as `npm run net:stress`
// (the vitest reads NET_CLIENTS). The loopback has zero real network cost — this measures
// the HOST's per-tick CPU (the authoritative sim + union-ring streaming + cell coalescing).
export function runStress(opts: { clients: number; ticks: number }): StressReport {
  const hub = new LoopbackHub();
  const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
  const bots: ClientSession[] = [];
  for (let i = 0; i < opts.clients; i++) bots.push(new ClientSession(hub.connect(`bot${i}`), `bot${i}`, new ScriptController(botScript())));
  // Warmup: the one-time join (welcome snapshot = full ChunkRecords) + initial ring load.
  const warmup = Math.floor(opts.ticks / 2);
  for (let t = 0; t < warmup; t++) { host.tick(t); for (const b of bots) b.tick(t); hub.pump(t); }
  // Steady-state window: the SUSTAINED host tick cost + sync bandwidth (excludes the join cost).
  const b0 = hub.sentBytes, c0 = hub.sentCount;
  let hostAccum = 0; // ms
  for (let t = warmup; t < opts.ticks; t++) {
    const h0 = performance.now();
    host.tick(t);
    hostAccum += performance.now() - h0;
    for (const b of bots) b.tick(t);
    hub.pump(t);
  }
  const n = opts.ticks - warmup;
  const hostTickMs = hostAccum / n;
  const seconds = n / 60;
  return {
    ticks: opts.ticks, clients: opts.clients,
    hostTickMs,
    msgPerSec: (hub.sentCount - c0) / seconds,
    bytesPerSecPerClient: (hub.sentBytes - b0) / seconds / opts.clients,
  };
}