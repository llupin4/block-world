import { SimRng } from '../entity';
import { type Msg } from './messages';

// The transport contract the session layer programs against. Reliable + ordered (WebRTC data
// channels are). Phase A is loopback only; phase B adds a Trystero implementation.
export interface Transport {
  readonly selfId: string;
  peers(): string[];
  send(peer: string | 'all', msg: Msg): void;
  onMessage(cb: (from: string, msg: Msg) => void): void;
  onPeerJoin(cb: (id: string) => void): void;
  onPeerLeave(cb: (id: string) => void): void;
}

interface Pending { from: string; at: number; msg: Msg }

export class LoopbackTransport implements Transport {
  readonly selfId: string;
  hub!: LoopbackHub; // set by the hub on connect (internal: loopback only)
  private msgCb: (from: string, msg: Msg) => void = () => {};
  private joinCb: (id: string) => void = () => {};
  private leaveCb: (id: string) => void = () => {};
  private peerList: string[] = [];

  constructor(selfId: string) { this.selfId = selfId; }
  peers(): string[] { return [...this.peerList]; }
  send(peer: string | 'all', msg: Msg): void { this.hub.route(this.selfId, peer, msg); }
  onMessage(cb: (from: string, msg: Msg) => void): void { this.msgCb = cb; }
  onPeerJoin(cb: (id: string) => void): void { this.joinCb = cb; }
  onPeerLeave(cb: (id: string) => void): void { this.leaveCb = cb; }
  // hub-internal:
  fire(from: string, msg: Msg): void { this.msgCb(from, msg); }
  addPeer(id: string): void { this.peerList.push(id); this.joinCb(id); }
  removePeer(id: string): void { this.peerList = this.peerList.filter((p) => p !== id); this.leaveCb(id); }
}

// An in-process hub wiring N transports. Pump-driven and deterministic: the harness calls
// pump(tick) once per sim tick. Each (from->to) link is a FIFO of {from, at, msg}; send
// enqueues at = hub.tick + delay(from,to) + jitter. pump delivers each link's HEAD while
// head.at <= tick — delivering only the head makes the link reorder-free even when a later
// message carries a smaller delay.
export class LoopbackHub {
  readonly transports = new Map<string, LoopbackTransport>();
  tick = 0;
  sentCount = 0;
  sentBytes = 0;
  private readonly delay: (from: string, to: string) => number;
  private readonly maxJitter: number;
  private readonly rng: SimRng;
  private links = new Map<string, { to: string; q: Pending[] }>();

  constructor(opts: { delay?: (from: string, to: string) => number; jitterTicks?: number; seed?: number } = {}) {
    this.delay = opts.delay ?? (() => 0);
    this.maxJitter = opts.jitterTicks ?? 0;
    this.rng = new SimRng(opts.seed ?? 1234);
  }

  connect(id: string): LoopbackTransport {
    const t = new LoopbackTransport(id);
    t.hub = this;
    this.transports.set(id, t);
    for (const [otherId, other] of this.transports) {
      if (otherId === id) continue;
      other.addPeer(id); // an existing peer learns about the newcomer
      t.addPeer(otherId); // and the newcomer about the existing peers
    }
    return t;
  }

  disconnect(id: string): void {
    const t = this.transports.get(id);
    if (!t) return;
    for (const other of this.transports.values()) if (other.selfId !== id) other.removePeer(id);
    this.transports.delete(id);
  }

  route(from: string, peer: string | 'all', msg: Msg): void {
    const targets = peer === 'all'
      ? [...this.transports.values()].filter((t) => t.selfId !== from)
      : [this.transports.get(peer)].filter((t): t is LoopbackTransport => !!t);
    for (const to of targets) {
      const jitter = this.maxJitter > 0 ? Math.floor(this.rng.next() * (this.maxJitter + 1)) : 0;
      const key = `${from}\u0000${to.selfId}`;
      const link = this.links.get(key) ?? { to: to.selfId, q: [] };
      link.q.push({ from, at: this.tick + this.delay(from, to.selfId) + jitter, msg });
      this.links.set(key, link);
      this.sentCount++;
      this.sentBytes += JSON.stringify(msg).length;
    }
  }

  pump(tick: number): void {
    for (const { to, q } of this.links.values()) {
      while (q.length && q[0].at <= tick) {
        const p = q.shift()!;
        this.transports.get(to)?.fire(p.from, p.msg);
      }
    }
  }
}