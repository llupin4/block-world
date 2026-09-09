import { describe, it, expect, vi } from 'vitest';
import type { ChunkRecord, WorldMeta } from '../persistence';
import type { ReplaySnapshot } from '../replay';
import { encodeMsg, decodeMsg } from '../net/messages';
import type { Msg } from '../net/messages';
import { TrysteroTransport, webCryptoUnavailableMessage, RELAY_URLS } from '../net/trystero';
import type { TrysteroLike, TrysteroRoomLike, TrysteroActionLike } from '../net/trystero';

// --- An in-process fake trystero: two fake rooms wired to each other, so the TrysteroTransport's
// mapping of the Transport contract onto the trystero API is testable without a real network/RTC.
class FakeRoom {
  onPeerJoin: ((peerId: string) => void) | null = null;
  onPeerLeave: ((peerId: string) => void) | null = null;
  readonly id: string;
  private action: TrysteroActionLike = {
    send: async () => {},
    onMessage: null,
  };
  private targets = new Map<string, FakeRoom>(); // peerId -> remote room

  constructor(id: string) { this.id = id; }
  makeAction(_ns: string): TrysteroActionLike {
    this.action.send = (data, options) => {
      const targetIds = options?.target == null
        ? [...this.targets.keys()]
        : (Array.isArray(options.target) ? options.target : [options.target]);
      for (const tid of targetIds) {
        const remote = this.targets.get(tid);
        const cb = remote?.action.onMessage;
        if (remote && cb) cb(data, { peerId: this.id }); // deliver synchronously (a data channel's head)
      }
      return Promise.resolve();
    };
    return this.action;
  }
  link(other: FakeRoom): void {
    this.targets.set(other.id, other);
    other.targets.set(this.id, this);
    this.onPeerJoin?.(other.id);
    other.onPeerJoin?.(this.id);
  }
  unlink(other: FakeRoom): void {
    this.targets.delete(other.id);
    other.targets.delete(this.id);
    this.onPeerLeave?.(other.id);
    other.onPeerLeave?.(this.id);
  }
  leave(): Promise<void> { return Promise.resolve(); }
}

class FakeTrystero implements TrysteroLike {
  readonly selfId: string;
  readonly room: FakeRoom;
  lastConfig: { appId: string; relayConfig?: { urls: string[] } } | null = null;
  constructor(selfId: string) { this.selfId = selfId; this.room = new FakeRoom(selfId); }
  joinRoom(config: { appId: string; relayConfig?: { urls: string[] } }, _roomId: string): TrysteroRoomLike {
    this.lastConfig = config;
    return this.room;
  }
}

const u8 = (seed: number): Uint8Array => { const a = new Uint8Array(16); for (let i = 0; i < 16; i++) a[i] = (seed * 7 + i) & 0xff; return a; };
const eqU8 = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

const makeChunk = (): ChunkRecord => ({ v: 2, cx: 0, cy: 0, cz: 0, blocks: u8(1), meta: u8(2), wlevel: u8(3), wsource: u8(4), wplaced: u8(5), wstream: u8(6) });
const makeMeta = (): WorldMeta => ({ v: 2, seed: 1234, entities: [], viewedEntityId: 1, time: { time: 0, tick: 0, phaseTotal: 0 }, hotbar: { slots: new Array(9).fill(1), selected: 0 } });

describe('wire codec (encodeMsg/decodeMsg)', () => {
  it('a plain Msg round-trips byte-identical', () => {
    const m: Msg = { type: 'state', tick: 42, entities: [{ id: 1, kindId: 'player', x: 1, y: 2, z: 3, yaw: 0, pitch: 0, vx: 0, vy: 0, vz: 0, flags: 0 }] };
    expect(decodeMsg(encodeMsg(m))).toEqual(m);
  });
  it('a chunkRec round-trips its six Uint8Array fields byte-identically', () => {
    const rec = makeChunk();
    const m: Msg = { type: 'chunkRec', key: '0,0,0', rec };
    const got = decodeMsg(encodeMsg(m)) as Extract<Msg, { type: 'chunkRec' }>;
    expect(got.rec!.blocks).toBeInstanceOf(Uint8Array);
    for (const k of ['blocks', 'meta', 'wlevel', 'wsource', 'wplaced', 'wstream'] as const) {
      expect(eqU8(got.rec![k], rec[k]), k).toBe(true);
    }
  });
  it('a welcome round-trips its snapshot chunks byte-identically', () => {
    const c1 = makeChunk(); const c2 = makeChunk();
    const snap: ReplaySnapshot = { chunks: [c1, c2], meta: makeMeta() };
    const m: Msg = { type: 'welcome', seed: 1234, tick: 7, worldTime: { time: 0, tick: 7, phaseTotal: 0 }, yourEntityId: 1, snapshot: snap };
    const got = decodeMsg(encodeMsg(m)) as Extract<Msg, { type: 'welcome' }>;
    expect(got.snapshot.chunks).toHaveLength(2);
    for (let i = 0; i < 2; i++) {
      const g = got.snapshot.chunks[i]!; const o = snap.chunks[i]!;
      for (const k of ['blocks', 'meta', 'wlevel', 'wsource', 'wplaced', 'wstream'] as const) expect(eqU8(g[k], o[k]), `${i}.${k}`).toBe(true);
    }
    expect(got.snapshot.meta.viewedEntityId).toBe(1);
  });
});

describe('TrysteroTransport (over a fake trystero)', () => {
  it('maps the Transport contract: send reaches the peer decoded, join/leave fire, peers() tracks', () => {
    const trA = new FakeTrystero('A'); const trB = new FakeTrystero('B');
    const a = new TrysteroTransport('block-world', 'room', trA);
    const b = new TrysteroTransport('block-world', 'room', trB);
    expect(a.selfId).toBe('A');
    expect(b.selfId).toBe('B');
    expect(a.peers()).toEqual([]);

    const gotB: { from: string; msg: Msg }[] = [];
    b.onMessage((from, msg) => { gotB.push({ from, msg }); });
    const joinedB: string[] = []; const leftB: string[] = [];
    b.onPeerJoin((id) => { joinedB.push(id); });
    b.onPeerLeave((id) => { leftB.push(id); });

    trA.room.link(trB.room); // the rooms connect: each learns the other's peer id
    expect(a.peers()).toEqual(['B']);
    expect(b.peers()).toEqual(['A']);
    expect(joinedB).toEqual(['A']);

    const rec = makeChunk();
    a.send('B', { type: 'chunkRec', key: '0,0,0', rec });
    expect(gotB).toHaveLength(1);
    expect(gotB[0]!.from).toBe('A');
    expect(gotB[0]!.msg).toEqual({ type: 'chunkRec', key: '0,0,0', rec });
    expect(eqU8((gotB[0]!.msg as Extract<Msg, { type: 'chunkRec' }>).rec!.blocks, rec.blocks)).toBe(true);

    a.send('all', { type: 'time', tick: 1, worldTime: { time: 0, tick: 1, phaseTotal: 0 } });
    expect(gotB).toHaveLength(2);
    expect(gotB[1]!.msg).toEqual({ type: 'time', tick: 1, worldTime: { time: 0, tick: 1, phaseTotal: 0 } });

    trA.room.unlink(trB.room);
    expect(leftB).toEqual(['A']);
    expect(a.peers()).toEqual([]);
    expect(b.peers()).toEqual([]);
  });
});

describe('webCryptoUnavailableMessage', () => {
  it('returns a secure-context explanation when crypto.subtle is absent', () => {
    vi.stubGlobal('crypto', {});
    try {
      expect(webCryptoUnavailableMessage()).toMatch(/secure context/i);
      expect(webCryptoUnavailableMessage()).toMatch(/localhost/i);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('returns null when crypto.subtle is available', () => {
    expect(webCryptoUnavailableMessage()).toBeNull();
  });
});

describe('Nostr relay set (RELAY_URLS)', () => {
  // trystero's default relay list is rotated per appId (5 of ~28 public relays) and the list rots:
  // operators start rejecting anonymous (unauthenticated) clients with NIP-42 "blocked: not
  // authorized" closes (upstream dmotz/trystero #192, #148). 2026-09-08 audit (scripts/probe-relays.mjs):
  // 9 of 28 defaults failed — incl. the two our appId resolves to. We pin a verified set instead.
  const KNOWN_DEAD_2026_09_08 = [
    'wss://basspistol.org', 'wss://chorus.pjv.me', 'wss://koru.bitcointxoko.org',
    'wss://nostr-01.uid.ovh', 'wss://relay-can.zombi.cloudrodion.com',
    'wss://relay.artio.inf.unibe.ch', 'wss://relay-rpi.edufeed.org',
    'wss://social.amanah.eblessing.co', 'wss://relay.agorist.space',
  ];
  it('pins a non-empty set of wss:// public relays', () => {
    expect(RELAY_URLS.length).toBeGreaterThanOrEqual(3);
    for (const url of RELAY_URLS) expect(url, url).toMatch(/^wss:\/\//);
  });
  it('excludes every relay that failed the 2026-09-08 audit', () => {
    for (const dead of KNOWN_DEAD_2026_09_08) expect(RELAY_URLS, dead).not.toContain(dead);
  });
  it('TrysteroTransport pins the curated set via relayConfig (appId unchanged)', () => {
    const tr = new FakeTrystero('A');
    new TrysteroTransport('block-world', 'room', tr);
    expect(tr.lastConfig?.appId).toBe('block-world');
    expect(tr.lastConfig?.relayConfig?.urls).toEqual([...RELAY_URLS]);
  });
});
