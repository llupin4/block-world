import type { ClientSession } from '../net/client';
import type { HostSession } from '../net/host';
import type { LoopbackHub, Transport } from '../net/transport';

export interface SessionRuntime {
  session: HostSession | ClientSession;
  host: HostSession | null;
  clients: ClientSession[];
  hub: LoopbackHub | null;
  otherTransports: { transport: Transport; name: string }[];
}
