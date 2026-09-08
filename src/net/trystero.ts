import { joinRoom, selfId } from 'trystero';
import type { Transport } from './transport';
import type { Msg } from './messages';
import { encodeMsg, decodeMsg } from './messages';

// The trystero surface the transport programs against — a structural subset of the real API, so a
// node test can inject a fake (the real module imports fine in node, but there is no RTC there).
// `joinRoom` returns a Room; the transport uses ONE message action (namespace `msg`) carrying the
// JSON-encoded `Msg` as a string (reliable + ordered — a data-channel guarantee), + the room's
// peer join/leave signals. `send`'s `target` is a peer id or null (= all peers).
export interface TrysteroActionLike {
  send: (data: string, options?: { target?: string | string[] | null }) => Promise<void>;
  onMessage: ((data: string, context: { peerId: string }) => void) | null;
}
export interface TrysteroRoomLike {
  makeAction: (namespace: string, config?: unknown) => TrysteroActionLike;
  onPeerJoin: ((peerId: string) => void) | null;
  onPeerLeave: ((peerId: string) => void) | null;
  leave: () => Promise<void>;
}
export interface TrysteroLike {
  readonly selfId: string;
  joinRoom: (config: { appId: string }, roomId: string) => TrysteroRoomLike;
}

const defaultTrystero: TrysteroLike = {
  selfId,
  // The real `Room` is structurally compatible with `TrysteroRoomLike`; the cast papers over the
  // generic `makeAction` overload so the transport stays typed against the narrow surface.
  joinRoom: (config, roomId) => joinRoom(config, roomId) as unknown as TrysteroRoomLike,
};

// A real-network `Transport` (B2): trystero (Nostr strategy) over WebRTC data channels. The session
// layer (transport-agnostic — proven by the loopback) runs unchanged: it sends/receives `Msg`s and
// tracks peers by id. `send` serializes a `Msg` to a JSON string (binary chunk arrays base64,
// `encodeMsg`) and delivers it; the action's `onMessage` deserializes it (`decodeMsg`) and forwards
// it to the session. Peer join/leave come from the room's signals. STUN only (trystero default);
// TURN is deliberately not added (the one place infrastructure could enter — see ADR 0019).
export class TrysteroTransport implements Transport {
  readonly selfId: string;
  private room: TrysteroRoomLike;
  private action: TrysteroActionLike;
  private peerSet = new Set<string>();
  private msgCb: (from: string, msg: Msg) => void = () => {};
  private joinCb: (id: string) => void = () => {};
  private leaveCb: (id: string) => void = () => {};

  constructor(appId: string, roomId: string, trystero: TrysteroLike = defaultTrystero) {
    this.selfId = trystero.selfId;
    this.room = trystero.joinRoom({ appId }, roomId);
    this.action = this.room.makeAction('msg');
    this.action.onMessage = (data, { peerId }) => {
      if (data == null) return;
      this.msgCb(peerId, decodeMsg(data));
    };
    this.room.onPeerJoin = (peerId) => { this.peerSet.add(peerId); this.joinCb(peerId); };
    this.room.onPeerLeave = (peerId) => { this.peerSet.delete(peerId); this.leaveCb(peerId); };
  }
  peers(): string[] { return [...this.peerSet]; }
  send(peer: string | 'all', msg: Msg): void {
    const target = peer === 'all' ? null : peer;
    // A dropped send (the peer left mid-flight) is not fatal: the session re-derives state.
    void this.action.send(encodeMsg(msg), { target }).catch(() => {});
  }
  onMessage(cb: (from: string, msg: Msg) => void): void { this.msgCb = cb; }
  onPeerJoin(cb: (id: string) => void): void { this.joinCb = cb; }
  onPeerLeave(cb: (id: string) => void): void { this.leaveCb = cb; }
  disconnect(): void { void this.room.leave().catch(() => {}); }
}