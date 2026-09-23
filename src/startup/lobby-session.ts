import { HostSession } from '../net/host';
import { ClientSession } from '../net/client';
import type { Transport } from '../net/transport';
import type { ApplyHooks, Controller } from '../entity';
import type { Persistence } from '../persistence';

interface LobbySessionOptions {
  isHost: boolean;
  transport: Transport;
  seed: number;
  name: string;
  controller: Controller;
  persist: Persistence;
  hooks: ApplyHooks;
  lightEdit(x: number, y: number, z: number): void;
  hostLeft(client: ClientSession): void;
}

export function createLobbySession(options: LobbySessionOptions) {
  if (options.isHost) {
    const host = new HostSession(options.transport, options.seed, {
      withOwnPlayer: true,
      ownController: options.controller,
      ownName: options.name,
      persist: options.persist,
      hooks: options.hooks,
    });
    return { session: host, host, clients: [] as ClientSession[] };
  }
  const client = new ClientSession(options.transport, options.name, options.controller);
  client.setLightEdit(options.lightEdit);
  client.onPeerLeave((id) => {
    if (id === client.hostId) options.hostLeft(client);
  });
  return { session: client, host: null, clients: [client] };
}

export function generateRoomCode(random: () => number = Math.random): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(random() * alphabet.length)]).join('');
}
