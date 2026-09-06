import { describe, it, expect } from 'vitest';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { IndexedDBChunkStore } from '../idb-store';
import { type ChunkRecord } from '../persistence';

// The browser IndexedDB backend, unit-tested with fake-indexeddb (ADR 0014):
// put/get round trip (typed arrays intact after structured clone), putMany
// (one transaction: all-or-nothing), keys(prefix) (the per-seed boot scan).
// The browser provides indexedDB + IDBKeyRange as globals; mirror both here.
const setIndexedDB = (): void => {
  const g = globalThis as { indexedDB?: unknown; IDBKeyRange?: unknown };
  g.indexedDB = new IDBFactory();
  g.IDBKeyRange = IDBKeyRange;
};

const rec = (cx: number, cy: number, cz: number): ChunkRecord => ({
  v: 1, cx, cy, cz,
  blocks: new Uint8Array([1, 2, 3, 4]),
  meta: new Uint8Array([0, 0, 0, 0]),
  wlevel: new Uint8Array([7, 0, 0, 0]),
  wsource: new Uint8Array([1, 0, 0, 0]),
  wplaced: new Uint8Array([0, 0, 0, 0]),
  wstream: new Uint8Array([0, 0, 0, 0]),
});

describe('IndexedDBChunkStore (fake-indexeddb)', () => {
  it('put/get round-trips a ChunkRecord with typed arrays intact', async () => {
    setIndexedDB();
    const store = new IndexedDBChunkStore('bw-idb-rt', 1);
    await store.put('1234:0,0,0', rec(0, 0, 0));
    const got = (await store.get('1234:0,0,0')) as ChunkRecord;
    expect(got).toBeDefined();
    expect(got.blocks).toBeInstanceOf(Uint8Array); // structured clone keeps the typed-array type
    expect([...got.blocks]).toEqual([1, 2, 3, 4]);
    expect([...got.wlevel]).toEqual([7, 0, 0, 0]);
    expect(got.cx).toBe(0);
    expect(await store.get('missing')).toBeUndefined();
  });

  it('putMany writes every entry (one readwrite transaction)', async () => {
    setIndexedDB();
    const store = new IndexedDBChunkStore('bw-idb-putmany', 1);
    await store.putMany([['1234:0,0,0', rec(0, 0, 0)], ['1234:1,0,0', rec(1, 0, 0)]]);
    expect(await store.get('1234:0,0,0')).toBeDefined();
    expect(await store.get('1234:1,0,0')).toBeDefined();
  });

  it('putMany is atomic: an aborted batch writes nothing', async () => {
    setIndexedDB();
    const store = new IndexedDBChunkStore('bw-idb-atomic', 1);
    const uncloneable = (() => {}) as unknown as ChunkRecord; // fails structured clone → tx abort
    await expect(store.putMany([['1234:0,0,0', rec(0, 0, 0)], ['1234:1,0,0', uncloneable]])).rejects.toBeTruthy();
    expect(await store.get('1234:0,0,0')).toBeUndefined(); // an aborted transaction commits nothing
  });

  it('keys() lists every key; keys(prefix) scans one seed', async () => {
    setIndexedDB();
    const store = new IndexedDBChunkStore('bw-idb-keys', 1);
    await store.putMany([
      ['1234:0,0,0', rec(0, 0, 0)],
      ['1234:1,0,0', rec(1, 0, 0)],
      ['1234:__meta__', {
        v: 1, seed: 1234,
        player: { x: 1, y: 2, z: 3, yaw: 0, pitch: 0 },
        time: { time: 0, tick: 0, phaseTotal: 0 },
        hotbar: { slots: [1, 1, 1, 1, 1, 1, 1, 1, 1], selected: 0 },
      }],
      ['9999:0,0,0', rec(0, 0, 0)],
    ]);
    expect((await store.keys()).length).toBe(4);
    expect([...(await store.keys('1234:'))].sort()).toEqual(['1234:0,0,0', '1234:1,0,0', '1234:__meta__'].sort());
    expect(await store.keys('9999:')).toEqual(['9999:0,0,0']);
    expect(await store.keys('nope:')).toEqual([]);
  });
});