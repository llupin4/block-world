import { ScriptController, type ScriptStep, type Controller, type ApplyHooks } from '../entity';
import type { Persistence } from '../persistence';
import { HostSession } from '../net/host';
import { ClientSession } from '../net/client';
import { LoopbackHub } from '../net/transport';
import type { SessionRuntime } from './session-runtime';

interface LoopbackOptions {
  mode: 'host' | 'client';
  bots: number;
  delay: number;
  seed: number;
  controller: Controller;
  persist: Persistence;
  hooks: ApplyHooks;
  lightEdit(x: number, y: number, z: number): void;
  hostLeft(): void;
}

export interface LoopbackSession extends SessionRuntime {
  hub: LoopbackHub;
  host: HostSession;
}

const HOST_BOT_STEPS: ScriptStep[] = [
  { op: 'walkTo', x: 8, z: 48, timeout: 120 },
  { op: 'walkTo', x: 12, z: 44, timeout: 120 },
  { op: 'walkTo', x: 6, z: 50, timeout: 120 },
  { op: 'wait', ticks: 60 },
];
const CLIENT_BOT_STEPS: ScriptStep[] = [
  { op: 'walkTo', x: 8, z: 48, timeout: 120 },
  { op: 'walkTo', x: 12, z: 44, timeout: 120 },
  { op: 'wait', ticks: 60 },
];

function createHost(hub: LoopbackHub, options: LoopbackOptions): LoopbackSession {
  const host = new HostSession(hub.connect('host'), options.seed, {
    withOwnPlayer: true,
    persist: options.persist,
    hooks: options.hooks,
  });
  const clients = Array.from({ length: options.bots }, (_, index) => {
    const name = `bot${index}`;
    return new ClientSession(hub.connect(name), name, new ScriptController(HOST_BOT_STEPS, true));
  });
  return { session: host, host, hub, clients, otherTransports: [] };
}

function createClient(hub: LoopbackHub, options: LoopbackOptions): LoopbackSession {
  const host = new HostSession(hub.connect('headless'), options.seed, { withOwnPlayer: false });
  const otherTransports: LoopbackSession['otherTransports'] = [];
  const clients: ClientSession[] = [];
  for (let index = 0; index < options.bots; index++) {
    const name = `other${index}`;
    const transport = hub.connect(name);
    clients.push(new ClientSession(transport, name, new ScriptController(CLIENT_BOT_STEPS, true)));
    otherTransports.push({ transport, name });
  }
  const session = new ClientSession(hub.connect('me'), 'me', options.controller);
  session.setLightEdit(options.lightEdit);
  session.onPeerLeave((id) => {
    if (id === 'headless') options.hostLeft();
  });
  clients.push(session);
  return { session, host, hub, clients, otherTransports };
}

export function createLoopbackSession(options: LoopbackOptions): LoopbackSession {
  const hub = new LoopbackHub({
    delay: (from) => (from === 'host' || from === 'headless' ? options.delay : 0),
  });
  return options.mode === 'host' ? createHost(hub, options) : createClient(hub, options);
}
