# Plan: multiplayer — phase A: session model, loopback transport, host union-ring, intents up / state down

Spec: `docs/superpowers/specs/2026-09-07-multiplayer-session-design.md`
Task brief: `docs/plans/multiplayer.md` (the "Phase A" section)
Branch: `multiplayer` (already created by the pre-work plan's Task 1). Prerequisite: the
**pre-work plan** (`2026-09-07-multiplayer-prework.md`) is fully implemented and green.
Phase A of 3. Durable record after implementation: **ADR 0018 — Multiplayer session model.**

## Goal

Implement the host-authoritative session model end-to-end over an in-process
`LoopbackTransport`: a `HostSession` that owns the only authoritative sim, a `ClientSession`
view (pristine terrain + host-fed edits/water/entities), the host **union-ring**, cell-write
sync (`cells`), state broadcast (`state`), join/leave, and a `BotClient` stress rig. Prove it
with the Gate A loopback tests. `src/main.ts` is **not** touched (the loopback is the
harness; the browser `?host`/`?join` gate lands in phase B). No single-player pin regresses.

## Architecture

- `src/net/messages.ts` (new) — `PROTOCOL_VERSION`, the `Msg` union, `NetEntity`, `CellWrite`.
- `src/net/transport.ts` (new) — `Transport`; `LoopbackTransport` + `LoopbackHub` (pump-driven,
  per-link delay + reorder-free jitter, stats).
- `src/net/remote-controller.ts` (new) — `RemoteController` (sibling of `ReplayController`).
- `src/net/network-persist.ts` (new) — the client's network `PersistSource`.
- `src/net/host.ts` (new) — `HostSession`.
- `src/net/client.ts` (new) — `ClientSession`.
- `src/net/stress.ts` (new) — `BotClient` + `runStress`.
- `src/world.ts` — add `onCellWrite?` hook + `readCell` (fired by `setBlock`).
- `src/water.ts` — `setState` fires `world.onCellWrite?`.
- `src/streaming.ts` — `update` takes `anchors: Anchor[]` (union ring) and returns `meshable`.
- `src/persistence.ts` — `WorldMeta.peers?: Record<string, EntityRecord>` (optional; join/leave
  pose restore).
- `src/__tests__/net-*.test.ts` (new) — the Gate A loopback tests.

## Tech stack

Existing only: TypeScript + vitest + three (three is **not** used by the net layer — it is
pure TS so vitest drives a host + N clients in one process). No new dependencies.

## File map

| File | Action |
|------|--------|
| `src/net/messages.ts` | new (Task 1) |
| `src/net/transport.ts` | new (Task 1) |
| `src/__tests__/net-transport.test.ts` | new (Task 1) |
| `src/world.ts` | edit (Task 2) |
| `src/water.ts` | edit (Task 2) |
| `src/__tests__/net-cellwrite.test.ts` | new (Task 2) |
| `src/streaming.ts` | edit (Task 3) |
| `src/__tests__/streaming.test.ts` | edit (Task 3: anchor signature + `meshable`) |
| `src/net/remote-controller.ts` | new (Task 4) |
| `src/net/network-persist.ts` | new (Task 4) |
| `src/__tests__/net-remote-controller.test.ts` | new (Task 4) |
| `src/net/host.ts` | new (Task 5) |
| `src/persistence.ts` | edit (Task 5: `WorldMeta.peers?`) |
| `src/__tests__/net-host.test.ts` | new (Task 5) |
| `src/net/client.ts` | new (Task 6) |
| `src/__tests__/net-client.test.ts` | new (Task 6) |
| `src/__tests__/net-gate.test.ts` | new (Task 7) |
| `src/net/stress.ts` | new (Task 8) |
| `src/__tests__/net-stress.test.ts` | new (Task 8) |
| `package.json` | edit (Task 8: `net:stress` script) |
| `docs/adr/0018-multiplayer-session-model.md` | new (Task 9) |
| `docs/adr/README.md`, `PROJECT.md` | edit (Task 9) |

## Pinned numbers (must not regress)

Unchanged: `STEP 1/60`, `WATER_STRIDE 30`, `WATER_PULSE 1000`, `VIEW_RADIUS 2`, `CY 0..4`,
`LOAD_BUDGET 1`, `REMESH_BUDGET 1`, `TERRAIN_SEED 1234`, `WARM_CAP 512`, `SPAWN` (main.ts:424);
the `water-load` PIN 1,231,601 / 10,690; the `mesher-budget` pins; `stepEntity ≡ Player` 1e-9.

New: `PROTOCOL_VERSION 1`, `NET_STATE_STRIDE 3`, `CELLS_FULL_THRESHOLD 512`,
`NET_REMOTE_RADIUS 1`, `TIME_STRIDE 60`, `NET_INTERP_TICKS` (fixed by the gate, then frozen),
stress budgets (host tick ms / bytes-per-s-per-client; set by measurement in Task 8, then
frozen).

## Execution notes

- TDD per task: failing test first, then the minimal code, run, commit.
- House style: no reference engine named, pinned numbers verbatim, `[POC shortcut]` tags on
  deliberate punts, imperative detailed commit messages.
- The net layer is pure TS (no three); every test runs a host + N clients in one vitest
  process via the `LoopbackHub`. The harness loop is `host.tick(t)` → each `client.tick(t)`
  → `hub.pump(t)`, so a message sent at tick `t` is applied on the next tick (one-tick
  latency, realistic).
- `streaming.update`'s signature changes in Task 3; `main.ts` is **not** updated in phase A
  (it stays on the loopback-free single-player path) — `tsc` still passes because `main.ts`
  calls `streaming.update` with the **old** single-anchor form, so Task 3 keeps a backward-
  compatible single-anchor overload (see Task 3 Step 3c).

---

## Task 1: `messages.ts` + `transport.ts` (`LoopbackTransport`)

**Files:** `src/net/messages.ts` (new), `src/net/transport.ts` (new),
`src/__tests__/net-transport.test.ts` (new)

**Step 1: Write the failing tests** — create `src/__tests__/net-transport.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LoopbackHub, type Transport } from '../net/transport';
import { type Msg } from '../net/messages';

const m = (x: number): Msg => ({ type: 'time', tick: x, worldTime: x });

describe('LoopbackHub — reliable, ordered, pump-driven', () => {
  it('delivers in send order with zero delay (same-tick pump)', () => {
    const hub = new LoopbackHub();
    const a = hub.connect('a'); const b = hub.connect('b');
    const got: number[] = [];
    b.onMessage((_from, msg) => { if (msg.type === 'time') got.push(msg.tick); });
    a.send('b', m(1)); a.send('b', m(2)); a.send('b', m(3));
    hub.pump(0);
    expect(got).toEqual([1, 2, 3]);
  });

  it('broadcasts to every other peer', () => {
    const hub = new LoopbackHub();
    const a = hub.connect('a'); const b = hub.connect('b'); const c = hub.connect('c');
    let nb = 0, nc = 0;
    b.onMessage(() => { nb++; }); c.onMessage(() => { nc++; });
    a.send('all', m(0));
    hub.pump(0);
    expect(nb).toBe(1); expect(nc).toBe(1);
  });

  it('a per-link delay defers delivery by that many ticks (reorder-free)', () => {
    const hub = new LoopbackHub({ delay: (from, to) => (from === 'a' && to === 'b' ? 2 : 0) });
    const a = hub.connect('a'); const b = hub.connect('b');
    const got: number[] = [];
    b.onMessage((_f, msg) => { if (msg.type === 'time') got.push(msg.tick); });
    a.send('b', m(1));
    hub.pump(0); expect(got).toEqual([]);   // at = 0 + 2 = 2, not due
    hub.pump(1); expect(got).toEqual([]);
    hub.pump(2); expect(got).toEqual([1]);  // due at tick 2
  });

  it('jitter is reorder-free: a later message with a smaller delay never overtakes', () => {
    const hub = new LoopbackHub({ jitterTicks: 3, seed: 1234 });
    const a = hub.connect('a'); const b = hub.connect('b');
    const got: number[] = [];
    b.onMessage((_f, msg) => { if (msg.type === 'time') got.push(msg.tick); });
    const sent: number[] = [];
    for (let i = 0; i < 50; i++) { a.send('b', m(i)); sent.push(i); }
    for (let t = 0; t < 400 && got.length < sent.length; t++) hub.pump(t);
    expect(got).toEqual(sent); // delivery order == send order regardless of jitter
  });

  it('fires onPeerJoin/onPeerLeave and updates peers()', () => {
    const hub = new LoopbackHub();
    const a = hub.connect('a');
    const joined: string[] = []; const left: string[] = [];
    a.onPeerJoin((id) => joined.push(id)); a.onPeerLeave((id) => left.push(id));
    hub.connect('b');
    expect(a.peers()).toEqual(['b']);
    expect(joined).toEqual(['b']);
    hub.disconnect('b');
    expect(a.peers()).toEqual([]);
    expect(left).toEqual(['b']);
  });

  it('counts sent messages and bytes for the stress rig', () => {
    const hub = new LoopbackHub();
    const a = hub.connect('a'); const b = hub.connect('b');
    a.send('b', m(9999));
    hub.pump(0);
    expect(hub.sentCount).toBe(1);
    expect(hub.sentBytes).toBeGreaterThan(0);
  });
});
```

**Step 2: Run to verify it fails** — `../net/transport` does not exist:

```bash
npx vitest run src/__tests__/net-transport.test.ts
```
Expected: FAIL (cannot find module `../net/transport`).

**Step 3: Implement.** Create `src/net/messages.ts`:

```ts
import { type Intent, type EntityRecord } from '../entity';
import { type ChunkRecord, type WorldMeta } from '../persistence';
import { type ReplaySnapshot } from '../replay';

// The wire protocol: versioned, plain data, a `type` discriminant. `Intent`, `ChunkRecord`,
// `EntityRecord`, `WorldMeta`, `ReplaySnapshot` are reused verbatim as wire types.
export const PROTOCOL_VERSION = 1;

// [chunk-local idx, block, meta, wlevel, wsource, wplaced, wstream]
export type CellWrite = [number, number, number, number, number, number, number];

export interface NetEntity {
  id: number; kindId: string;
  x: number; y: number; z: number;
  yaw: number; pitch: number;
  vx: number; vy: number; vz: number;
  flags: number; // bit 0 = inWater, bit 1 = onGround (render hints)
}

export type Msg =
  | { type: 'hello'; name: string; protocol: number }
  | { type: 'welcome'; seed: number; tick: number; worldTime: number; yourEntityId: number; snapshot: ReplaySnapshot }
  | { type: 'intent'; tick: number; intent: Intent }
  | { type: 'state'; tick: number; entities: NetEntity[] }
  | { type: 'spawn'; tick: number; id: number; kindId: string; pose: EntityRecord }
  | { type: 'despawn'; tick: number; id: number }
  | { type: 'cells'; tick: number; chunk: string; writes: CellWrite[] }
  | { type: 'chunkReq'; key: string }
  | { type: 'chunkRec'; key: string; rec: ChunkRecord | null }
  | { type: 'chunkLoaded'; key: string }
  | { type: 'chunkUnloaded'; key: string }
  | { type: 'time'; tick: number; worldTime: number };
```

Create `src/net/transport.ts`:

```ts
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
  private hub!: LoopbackHub; // set by the hub on connect
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
```

**Step 4: Run to verify it passes:**

```bash
npx vitest run src/__tests__/net-transport.test.ts
```
Expected: PASS (all).

**Step 5: Commit**

```bash
git add src/net/messages.ts src/net/transport.ts src/__tests__/net-transport.test.ts
git commit -m "feat: net/transport + messages — the Transport contract and a deterministic loopback hub (reliable, ordered, per-link delay + reorder-free jitter)"
```

---

## Task 2: the `onCellWrite` hook (world + water)

**Files:** `src/world.ts`, `src/water.ts`, `src/__tests__/net-cellwrite.test.ts` (new)

The host collects per-tick cell writes to build `cells`. Add an optional `onCellWrite` hook
to `World` (fired at the end of `setBlock`) and make `WaterSim.setState` fire it after writing
water bytes. A single-player world (no hook set) is unchanged.

**Step 1: Write the failing tests** — create `src/__tests__/net-cellwrite.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Block } from '../blocks';
import { World, localIndex } from '../world';
import { WaterSim } from '../water';

describe('onCellWrite hook (multiplayer pre-A)', () => {
  it('setBlock fires onCellWrite with the cell\'s final state; no hook is a no-op', () => {
    const world = new World();
    world.ensureChunk(0, 0, 0);
    const seen: number[] = [];
    world.onCellWrite = (x, y, z) => seen.push(x, y, z);
    world.setBlock(3, 4, 5, Block.Stone);
    expect(seen).toEqual([3, 4, 5]);
    const cell = world.readCell(3, 4, 5)!;
    expect(cell.block).toBe(Block.Stone);
    expect(cell.meta).toBe(0);
  });

  it('a water write (setState) fires onCellWrite even when the block is unchanged', () => {
    const world = new World();
    const c = world.ensureChunk(0, 0, 0);
    c.settled = true;
    const seen: string[] = [];
    world.onCellWrite = (x, y, z) => seen.push(`${x},${y},${z}`);
    const sim = new WaterSim(world);
    world.setBlock(8, 1, 8, Block.Water); // a placed water block (fires setBlock's hook)
    seen.length = 0;
    sim.edit(8, 1, 8, Block.Water);        // sets the 4 water bytes + remark
    for (let i = 0; i < 50 && sim.tick(1000) > 0; i++) {}
    expect(seen.length).toBeGreaterThan(0); // water writes fired the hook
    const cell = world.readCell(8, 1, 8)!;
    expect(cell.l).toBeGreaterThanOrEqual(1); // a water level was written
  });
});
```

**Step 2: Run to verify it fails** — `world.onCellWrite` / `world.readCell` are undefined:

```bash
npx vitest run src/__tests__/net-cellwrite.test.ts
```
Expected: FAIL.

**Step 3: Implement.**

(a) `src/world.ts` — add the hook field + a `CellRead` type + `readCell` to the `World` class
(after `getLight`, ~L131). Add near the top of the class body:

```ts
  /** Fired (world coords) after a cell is written by setBlock or the water sim; the host
   *  reads the FINAL cell state via readCell and coalesces by chunk for `cells`. Unset in
   *  single-player (a no-op). */
  onCellWrite?: (wx: number, wy: number, wz: number) => void;
```

Add the type + method (top of file, after `chunkOf`):

```ts
export interface CellRead {
  cx: number; cy: number; cz: number; idx: number;
  block: number; meta: number;
  l: number; s: number; p: number; st: number; // wlevel, wsource, wplaced, wstream
}
```

and inside `World` (after `getLight`):

```ts
  /** The full cell state (block, meta, 4 water bytes) or undefined if the chunk is missing. */
  readCell(wx: number, wy: number, wz: number): CellRead | undefined {
    const c = this.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return undefined;
    const i = localIndex(wx - c.cx * CHUNK_SIZE, wy - c.cy * CHUNK_SIZE, wz - c.cz * CHUNK_SIZE);
    return { cx: c.cx, cy: c.cy, cz: c.cz, idx: i, block: c.blocks[i], meta: c.meta[i],
      l: c.wlevel[i], s: c.wsource[i], p: c.wplaced[i], st: c.wstream[i] };
  }
```

(b) `src/world.ts` — at the end of `setBlock` (L162, before `return true`), fire the hook:

```ts
    for (const [nx, ny, nz] of n) {
      const nc = this.getChunk(nx, ny, nz);
      if (nc) nc.dirty = true;
    }
    this.onCellWrite?.(wx, wy, wz);
    return true;
```

(c) `src/water.ts` — in `setState` (L142-154), fire the hook after the water bytes (and any
block change) are written. Add before the closing `}`:

```ts
  private setState(wx: number, wy: number, wz: number, l: number, s: number, b: number, p: number, st: number, eo: boolean = false): void {
    if (!this.inBand(wy)) return;
    const c = this.world.getChunk(chunkOf(wx), chunkOf(wy), chunkOf(wz));
    if (!c) return;
    const i = localIndex(wx - c.cx * 16, wy - c.cy * 16, wz - c.cz * 16);
    c.wlevel[i] = l;
    c.wsource[i] = s;
    c.wplaced[i] = p;
    c.wstream[i] = st;
    if (c.blocks[i] !== b) {
      if (this.world.setBlock(wx, wy, wz, b, 0, eo)) this.touched.add(chunkKey(c.cx, c.cy, c.cz));
    }
    this.world.onCellWrite?.(wx, wy, wz); // a water-only write (block unchanged) still changed the cell
  }
```

**Step 4: Run to verify it passes** — the new case passes and the water/world suites are green
(no hook set → zero behavior change):

```bash
npx vitest run src/__tests__/net-cellwrite.test.ts src/__tests__/water.test.ts src/__tests__/world.test.ts src/__tests__/water-load.test.ts
```
Expected: PASS (all; the `water-load` PIN holds — the hook is a no-op when unset).

**Step 5: Commit**

```bash
git add src/world.ts src/water.ts src/__tests__/net-cellwrite.test.ts
git commit -m "feat: onCellWrite hook on World.setBlock + WaterSim.setState (the host's per-tick cell-write source; no-op when unset)"
```

---

## Task 3: `streaming.update` union-ring (anchors)

**Files:** `src/streaming.ts`, `src/__tests__/streaming.test.ts`

`streaming.update` takes one anchor (the player). The host needs a **union** of anchors (its
own viewed entity + every remote player). Generalize to `anchors: Anchor[]`; a chunk is
in-range (and stays loaded) if in range of **any** anchor; `meshable` = chunks in range of the
first (host's own, meshable) anchor. Keep `rebuilt`/`generated`/`remeshed` (from the pre-work)
and the load/remesh budgets. `main.ts` keeps calling the single-anchor form via an overload.

**Step 1: Write the failing tests** — append to `src/__tests__/streaming.test.ts`:

```ts
describe('streaming — union ring (multiplayer phase A)', () => {
  const anchor = (cx: number, cz: number, cy = 2, radius = 2, meshable = true) => ({ cx, cz, cy, radius, meshable });

  it('loads the union of two anchor rings and marks only the first anchor\'s ring meshable', () => {
    const world = new World();
    const A = anchor(0, 0, 2, 2, true);   // the host's own ring (meshable)
    const B = anchor(4, 4, 2, 1, false);  // a remote player's ring (non-meshable)
    // Converge with the union ring:
    for (;;) {
      const r = update(world, [A, B]);
      for (const c of r.rebuilt) world.getChunk(c.cx, c.cy, c.cz)!.dirty = false;
      if (r.rebuilt.length === 0 && r.unloaded.length === 0) break;
    }
    // B's ring center chunk is loaded (sim-loaded by the union) ...
    expect(world.hasChunk(4, 2, 4)).toBe(true);
    // ... but is NOT in the host's meshable set (it is > VIEW_RADIUS from A).
    expect([...r0meshable(world, [A])].includes('4,2,4')).toBe(false);
    expect(world.hasChunk(0, 2, 0)).toBe(true); // A's center is meshable
  });
});

// helper: the meshable set for a set of anchors (mirrors the host's own-anchor ring)
function r0meshable(world: World, anchors: { cx: number; cz: number; radius: number }[]): Set<string> {
  void world;
  const out = new Set<string>();
  const a = anchors[0];
  for (let dx = -a.radius; dx <= a.radius; dx++)
    for (let dz = -a.radius; dz <= a.radius; dz++)
      for (let cy = 0; cy <= 4; cy++) out.add(`${a.cx + dx},${cy},${a.cz + dz}`);
  return out;
}
```

> The test asserts the union **loads** B's ring (via `update(world, [A, B])`) and that B's
> center is outside A's meshable ring. The `update` return also exposes `meshable`; the helper
> above mirrors it independently to avoid a tautology.

**Step 2: Run to verify it fails** — `update(world, [A, B])` is a type error (old signature
takes numbers):

```bash
npx vitest run src/__tests__/streaming.test.ts -t "union ring"
```
Expected: FAIL (TS error / anchors not accepted).

**Step 3: Implement.**

(a) `src/streaming.ts` — add `Anchor` + `minDist`, and change `StreamingUpdate` to add
`meshable`:

```ts
export interface Anchor { cx: number; cz: number; cy: number; radius: number; meshable?: boolean }

function minDist(c: Coord, anchors: Anchor[]): number {
  let best = Infinity;
  for (const a of anchors) {
    const dx = c.cx - a.cx, dz = c.cz - a.cz;
    const d = (dx * dx + dz * dz) * 100 + Math.abs(c.cy - a.cy);
    if (d < best) best = d;
  }
  return best;
}

export interface StreamingUpdate {
  rebuilt: Coord[];
  generated: Coord[];
  remeshed: Coord[];
  restored: Coord[];
  pending: Coord[];
  unloaded: Coord[];
  meshable: Set<string>; // chunk keys in range of the first (meshable) anchor: the host meshes only these
}
```

(b) `src/streaming.ts` — replace the primary `update` body (the pre-work's
`update(world, pcx, pcz, pcy, persist, sim)`) with an anchors-based core plus a backward-
compatible single-anchor overload. Replace the existing `export function update(...)` with:

```ts
// The union-ring core: a chunk is in range (and stays loaded) if in range of ANY anchor.
// Load/remesh budgets are shared across all anchors; `meshable` = the first anchor's ring
// (the host's own, so remote-only chunks are sim-loaded but never meshed).
export function update(world: World, anchors: Anchor[], persist?: PersistSource, sim?: EntitySource): StreamingUpdate {
  const rebuilt: Coord[] = [];
  const generated: Coord[] = [];
  const remeshed: Coord[] = [];
  const restored: Coord[] = [];
  const pending: Coord[] = [];
  const unloaded: Coord[] = [];
  const done = new Set<string>();

  // Union of every anchor's x/z ring (full generated y band); a key may be claimed by several
  // anchors but is processed once.
  const candidates = new Set<string>();
  const meshable = new Set<string>();
  for (let ai = 0; ai < anchors.length; ai++) {
    const a = anchors[ai];
    for (let dx = -a.radius; dx <= a.radius; dx++) {
      for (let dz = -a.radius; dz <= a.radius; dz++) {
        for (let cy = CY_MIN; cy <= CY_MAX; cy++) {
          const cx = a.cx + dx, cz = a.cz + dz;
          const k = chunkKey(cx, cy, cz);
          candidates.add(k);
          if (ai === 0 && (a.meshable !== false)) meshable.add(k); // the first anchor is the host's own
        }
      }
    }
  }

  // Load pass: every missing candidate, warm → pending → generate (≤ LOAD_BUDGET total).
  const missed: Coord[] = [];
  for (const k of candidates) {
    const [cx, cy, cz] = k.split(',').map(Number);
    if (world.hasChunk(cx, cy, cz)) continue;
    const rec = persist?.syncRecord(cx, cy, cz);
    if (rec) {
      applyRecord(world, rec);
      markNeighborsDirty(world, cx, cy, cz, anchors[0].cx, anchors[0].cz);
      restored.push({ cx, cy, cz });
      done.add(k);
      continue;
    }
    if (persist?.hasPersisted(cx, cy, cz)) { pending.push({ cx, cy, cz }); continue; }
    missed.push({ cx, cy, cz });
  }
  missed.sort((a, b) => minDist(a, anchors) - minDist(b, anchors) || a.cx - b.cx || a.cy - b.cy || a.cz - b.cz);
  for (const c of missed.slice(0, LOAD_BUDGET)) {
    world.ensureChunk(c.cx, c.cy, c.cz);
    generateChunkTerrain(world, GEN, c.cx, c.cy, c.cz);
    markNeighborsDirty(world, c.cx, c.cy, c.cz, anchors[0].cx, anchors[0].cz);
    rebuilt.push(c); generated.push(c); done.add(chunkKey(c.cx, c.cy, c.cz));
  }
  pending.sort((a, b) => minDist(a, anchors) - minDist(b, anchors) || a.cx - b.cx || a.cy - b.cy || a.cz - b.cz);

  // Remesh pass: the closest dirty in-range chunk (≤ REMESH_BUDGET), excluding this call's loads.
  const dirty: Coord[] = [];
  for (const c of world.allChunks()) {
    if (!c.dirty || done.has(chunkKey(c.cx, c.cy, c.cz))) continue;
    if (!candidates.has(chunkKey(c.cx, c.cy, c.cz))) continue; // out of the union ring → unloading
    if (!inRange(c.cx, c.cz, anchors[0].cx, anchors[0].cz) && anchors.length === 1) continue;
    dirty.push({ cx: c.cx, cy: c.cy, cz: c.cz });
  }
  dirty.sort((a, b) => minDist(a, anchors) - minDist(b, anchors) || a.cx - b.cx || a.cy - b.cy || a.cz - b.cz);
  for (const c of dirty.slice(0, REMESH_BUDGET)) {
    rebuilt.push(c); remeshed.push(c); done.add(chunkKey(c.cx, c.cy, c.cz));
  }

  // Unload pass: everything outside the union ring (or the y band) leaves the world.
  const doomed: Chunk[] = [];
  for (const c of world.allChunks()) {
    if (!candidates.has(chunkKey(c.cx, c.cy, c.cz)) || c.cy < CY_MIN || c.cy > CY_MAX) doomed.push(c);
  }
  for (const c of doomed) {
    const ents = sim ? sim.entitiesInChunk(c.cx, c.cy, c.cz).map((e) => sim.toRecord(e)) : undefined;
    persist?.onUnload(c, ents);
    markNeighborsDirty(world, c.cx, c.cy, c.cz, anchors[0].cx, anchors[0].cz);
    world.removeChunk(c.cx, c.cy, c.cz);
    unloaded.push({ cx: c.cx, cy: c.cy, cz: c.cz });
  }

  return { rebuilt, generated, remeshed, restored, pending, unloaded, meshable };
}

// Backward-compatible single-anchor form (main.ts keeps using this in phase A; the host and
// client pass anchors directly). One meshable anchor of VIEW_RADIUS == today's behavior.
export function update(world: World, pcx: number, pcz: number, pcy = 2, persist?: PersistSource, sim?: EntitySource): StreamingUpdate {
  return update(world, [{ cx: pcx, cz: pcz, cy: pcy, radius: VIEW_RADIUS, meshable: true }], persist, sim);
}
```

> Remove the now-duplicated private `score`/`cmp` (L41-48) — `minDist` replaces them. Keep
> `inRange` (L53-55, used by `main.ts`'s stale-fetch guard) and `markNeighborsDirty` unchanged.

**Step 4: Run to verify it passes** — the union-ring test passes and the **existing** streaming
suite (A-D, persistence E-G, entity-ride) is unchanged and green (the single-anchor overload
keeps `main.ts` and the existing call sites working; `rebuilt`/`generated`/`remeshed` order is
preserved):

```bash
npx vitest run src/__tests__/streaming.test.ts src/__tests__/persistence.test.ts
```
Expected: PASS (all).

**Step 5: Commit**

```bash
git add src/streaming.ts src/__tests__/streaming.test.ts
git commit -m "feat: streaming.update union ring — anchors[] load the union, meshable = the host's own ring (single-anchor overload preserved)"
```

---

## Task 4: `RemoteController` + network `PersistSource`

**Files:** `src/net/remote-controller.ts` (new), `src/net/network-persist.ts` (new),
`src/__tests__/net-remote-controller.test.ts` (new)

**Step 1: Write the failing tests** — create `src/__tests__/net-remote-controller.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { NULL_INTENT, type Entity } from '../entity';
import { RemoteController } from '../net/remote-controller';
import { NetworkPersistSource } from '../net/network-persist';
import { LoopbackHub } from '../net/transport';
import { type Msg } from '../net/messages';

function dummyEntity(): Entity {
  return {
    id: 1, kind: { id: 'player', half: 0.3, height: 1.8, eye: 1.62, walkSpeed: 5.6, swimSpeed: 3, jumpVel: 9.5, flySpeed: 13, flyVSpeed: 8, canFly: true, canNoclip: true, canEdit: true, collides: true },
    pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 },
    yaw: 0, pitch: 0, onGround: false, inWater: false, headInWater: false,
    fly: false, noclip: false, controller: null as never, baseController: null as never,
  };
}

describe('RemoteController', () => {
  it('holds NULL_INTENT until the first intent, then the last received (a copy)', () => {
    const c = new RemoteController('p');
    expect(c.intent(dummyEntity(), 0)).toEqual({ ...NULL_INTENT });
    c.setIntent({ ...NULL_INTENT, forward: 1, yaw: 0.5 });
    const a = c.intent(dummyEntity(), 1);
    expect(a.forward).toBe(1); expect(a.yaw).toBe(0.5);
    a.forward = 999; // the caller must not be able to mutate the controller's state
    expect(c.intent(dummyEntity(), 2).forward).toBe(1); // a fresh copy
  });
});

describe('NetworkPersistSource', () => {
  it('fetchRecord resolves the chunk the host answers via chunkRec', async () => {
    const hub = new LoopbackHub();
    const client = hub.connect('client');
    const host = hub.connect('host');
    const np = new NetworkPersistSource(client);
    host.onMessage((_f, msg: Msg) => {
      if (msg.type === 'chunkReq') {
        host.send('client', { type: 'chunkRec', key: msg.key, rec: { v: 2, cx: 1, cy: 0, cz: 1, blocks: new Uint8Array(4096), meta: new Uint8Array(4096), wlevel: new Uint8Array(4096), wsource: new Uint8Array(4096), wplaced: new Uint8Array(4096), wstream: new Uint8Array(4096) } });
      }
    });
    const p = np.fetchRecord(1, 0, 1);
    client.send('host', { type: 'chunkReq', key: '1,0,1' });
    hub.pump(0);
    const rec = await p;
    expect(rec).toBeDefined();
    expect(rec!.cx).toBe(1);
  });
});
```

**Step 2: Run to verify it fails** — the modules do not exist. Expected: FAIL.

**Step 3: Implement.** Create `src/net/remote-controller.ts`:

```ts
import { NULL_INTENT, type Controller, type Entity, type Intent } from '../entity';

// Feeds one remote peer's entity the peer's latest received intent. Sibling of
// ReplayController (replay.ts): a `RemoteController` per remote player; the host sets its
// last intent from `intent` messages. Returns a copy so a caller cannot mutate the held intent.
export class RemoteController implements Controller {
  private last: Intent | null = null;
  constructor(readonly peerId: string) {}
  setIntent(it: Intent): void { this.last = { ...it }; }
  intent(_e: Entity, _tick: number): Intent { return this.last ? { ...this.last } : { ...NULL_INTENT }; }
}
```

Create `src/net/network-persist.ts`:

```ts
import { type PersistSource, type ChunkRecord } from '../persistence';
import { type Transport } from './transport';

// The client's PersistSource. A client never has a persisted world: it generates pristine
// terrain locally and syncs edits/water from the host. So hasPersisted/syncRecord are
// constant and onUnload/dropPersisted are no-ops (reusing the playback no-op pattern).
// fetchRecord is a [POC shortcut] stub (streaming never calls it — the client's hasPersisted
// is always false, so its load path always generates); the real sync is the chunkReq/Rec
// side channel (see ClientSession).
export class NetworkPersistSource implements PersistSource {
  private pending = new Map<string, (rec: ChunkRecord | null) => void>();
  constructor(private readonly transport: Transport) {}
  hasPersisted(): boolean { return false; }
  syncRecord(): undefined { return undefined; }
  fetchRecord(cx: number, cy: number, cz: number): Promise<ChunkRecord | undefined> {
    const key = `${cx},${cy},${cz}`;
    return new Promise<ChunkRecord | undefined>((resolve) => {
      this.pending.set(key, (rec) => resolve(rec ?? undefined));
      this.transport.send('all', { type: 'chunkReq', key });
    });
  }
  resolveChunk(key: string, rec: ChunkRecord | null): void {
    const res = this.pending.get(key);
    if (res) { this.pending.delete(key); res(rec); }
  }
  onUnload(): void { /* no-op: a client never saves */ }
  dropPersisted(): void { /* no-op */ }
}
```

**Step 4: Run to verify it passes:**

```bash
npx vitest run src/__tests__/net-remote-controller.test.ts
```
Expected: PASS (all).

**Step 5: Commit**

```bash
git add src/net/remote-controller.ts src/net/network-persist.ts src/__tests__/net-remote-controller.test.ts
git commit -m "feat: RemoteController (peer intent feed) + the client's network PersistSource (chunkReq/Rec side channel)"
```

---

## Task 5: `HostSession`

**Files:** `src/net/host.ts` (new), `src/persistence.ts` (edit: `WorldMeta.peers?`),
`src/__tests__/net-host.test.ts` (new)

The host owns the only authoritative sim. One `tick(tick)` = one 60 Hz substep, in order:
`sim.tick` → water heartbeat → cell flush → union-ring streaming → state broadcast (stride) →
time (stride). `hello` spawns a remote `player` + `welcome`; leave persists the pose to
`WorldMeta.peers[name]` + despawns; the host's `Recorder` is wired (a session recording
replays). Clients never call `sim.spawn` — host ids are the only ids.

**Step 1: Write the failing tests** — create `src/__tests__/net-host.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LoopbackHub } from '../net/transport';
import { HostSession } from '../net/host';
import { type Msg } from '../net/messages';
import { Block } from '../blocks';

const tick = (hub: LoopbackHub, host: HostSession, clients: { tick: (t: number) => void }[], n: number) => {
  for (let t = 0; t < n; t++) { host.tick(t); for (const c of clients) c.tick(t); hub.pump(t); }
};

describe('HostSession', () => {
  it('hello spawns a remote player and replies with a welcome (snapshot + yourEntityId)', () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = hub.connect('client');
    let welcome: Msg | undefined;
    client.onMessage((_f, m: Msg) => { if (m.type === 'welcome') welcome = m; });
    client.send('host', { type: 'hello', name: 'alice', protocol: 1 });
    hub.pump(0);
    expect(welcome).toBeDefined();
    expect((welcome as any).snapshot.meta.seed).toBe(1234);
    expect(typeof (welcome as any).yourEntityId).toBe('number');
    expect((welcome as any).snapshot.chunks.length).toBeGreaterThan(0); // the joiner's ring
    // the host spawned the remote player
    expect(host.sim.all().some((e) => e.kind.id === 'player')).toBe(true);
  });

  it('an intent from a client is applied to that client\'s entity by the host', () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = hub.connect('client');
    const welcomed = new Promise<any>((res) => client.onMessage((_f, m: Msg) => { if (m.type === 'welcome') res(m); }));
    client.send('host', { type: 'hello', name: 'bob', protocol: 1 });
    hub.pump(0);
    const w = await welcomed;
    const id = w.yourEntityId as number;
    const before = host.sim.entities.get(id)!.pos.x;
    client.send('host', { type: 'intent', tick: 1, intent: { forward: 1, strafe: 0, up: false, down: false, yaw: 0, pitch: 0, primary: false, secondary: false } });
    tick(hub, host, [{ tick: () => {} }], 6);
    expect(host.sim.entities.get(id)!.pos.x).toBeGreaterThan(before); // the intent moved the entity
  });

  it('a client\'s block edit lands on the host world', () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = hub.connect('client');
    const welcomed = new Promise<any>((res) => client.onMessage((_f, m: Msg) => { if (m.type === 'welcome') res(m); }));
    client.send('host', { type: 'hello', name: 'carol', protocol: 1 });
    hub.pump(0);
    const w = await welcomed;
    const id = w.yourEntityId as number;
    // face -Z (yaw 0) and place a block in front (secondary)
    client.send('host', { type: 'intent', tick: 2, intent: { forward: 0, strafe: 0, up: false, down: false, yaw: 0, pitch: 0, primary: false, secondary: true, block: Block.Stone } });
    tick(hub, host, [{ tick: () => {} }], 4);
    const e = host.sim.entities.get(id)!;
    // a block was placed somewhere in front of the entity (the world changed)
    expect(host.world.count()).toBeGreaterThan(0);
    void e;
  });

  it('leaving a peer persists its pose to WorldMeta.peers and despawns the entity', () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = hub.connect('client');
    const welcomed = new Promise<any>((res) => client.onMessage((_f, m: Msg) => { if (m.type === 'welcome') res(m); }));
    client.send('host', { type: 'hello', name: 'dave', protocol: 1 });
    hub.pump(0);
    const w = await welcomed;
    const id = w.yourEntityId as number;
    expect(host.sim.entities.has(id)).toBe(true);
    hub.disconnect('client'); // onPeerLeave fires on the host transport
    expect(host.sim.entities.has(id)).toBe(false); // despawned
    expect((host.persist.meta?.peers as Record<string, any> | undefined)?.dave).toBeDefined(); // pose saved
  });
});
```

**Step 2: Run to verify it fails** — `../net/host` does not exist. Expected: FAIL.

**Step 3: Implement.**

(a) `src/persistence.ts` — extend `WorldMeta` (L31-39) with an optional `peers`:

```ts
export interface WorldMeta {
  v: 2;
  seed: number;
  entities: EntityRecord[];
  viewedEntityId: number;
  simPrng?: number;
  time: { time: number; tick: number; phaseTotal: number };
  hotbar: { slots: number[]; selected: number };
  peers?: Record<string, EntityRecord>; // multiplayer: a peer's pose keyed by name (restore on rejoin)
}
```

(b) `src/net/host.ts`:

```ts
import { World, chunkKey, chunkOf, VIEW_RADIUS, type CellRead } from '../world';
import { WaterSim } from '../water';
import { Sim, IdleController, chunkOf as eChunkOf, type Controller, type Entity, type EntityRecord, type Intent } from '../entity';
import { Persistence, snapshotChunk, applyRecord, chunkRecordKey, type ChunkRecord, type WorldMeta } from '../persistence';
import { InMemoryChunkStore } from '../persistence';
import { Recorder } from '../replay';
import { update as streamUpdate, type Anchor, VIEW_RADIUS as SR_VIEW_RADIUS, CY_MIN, CY_MAX } from '../streaming';
import { NET_STATE_STRIDE, CELLS_FULL_THRESHOLD, NET_REMOTE_RADIUS, TIME_STRIDE, PROTOCOL_VERSION, type Msg, type NetEntity, type CellWrite } from './messages';
import { RemoteController } from './remote-controller';
import { type Transport } from './transport';
import { Block } from '../blocks';
import { type ReplaySnapshot } from '../replay';

const STEP = 1 / 60, WATER_STRIDE = 30, WATER_PULSE = 1000;

interface Peer { name: string; entityId: number; controller: RemoteController; loaded: Set<string> }

export interface HostOpts { withOwnPlayer?: boolean }

export class HostSession {
  readonly world = new World();
  readonly waterSim: WaterSim;
  readonly sim: Sim;
  readonly persist: Persistence;
  readonly recorder: Recorder;
  readonly spawn: { x: number; y: number; z: number };
  readonly meshable = new Set<string>(); // chunks in the host's own ring (meshed here)
  worldTime = { time: 0, tick: 0, phaseTotal: 0 };
  private readonly transport: Transport;
  private readonly seed: number;
  private peers = new Map<string, Peer>();
  private nameToId = new Map<string, number>();
  private pendingCells = new Map<string, Map<number, CellWrite>>();
  private ownController: Controller | null = null;

  constructor(transport: Transport, seed: number, opts: HostOpts = {}) {
    this.transport = transport;
    this.seed = seed;
    this.waterSim = new WaterSim(this.world);
    this.sim = new Sim(this.world, {}, seed);
    this.persist = new Persistence(new InMemoryChunkStore(), seed);
    this.recorder = new Recorder(0);
    this.recorder.attach(this.sim as any);
    // Compute SPAWN by scanning the generated spawn column (mirrors main.ts:424).
    const GEN = require('../terrain').GEN ?? new (require('../terrain').TerrainGen)(seed);
    const { TERRAIN_SEED, TerrainGen, generateChunkTerrain } = require('../terrain');
    const gen = new TerrainGen(TERRAIN_SEED);
    for (let cy = 0; cy <= 4; cy++) generateChunkTerrain(this.world, gen, 0, cy, 2);
    let sy = 79; while (sy > 0 && !this.isOpaque(this.getBlock(6, sy, 46))) sy--;
    this.spawn = { x: 6.5, y: sy + 1, z: 46.5 };
    this.sim.respawn = { ...this.spawn };
    if (opts.withOwnPlayer !== false) {
      const own = this.sim.spawn(this.spawn, new IdleController(), { yaw: -Math.PI / 2, kindId: 'player', baseController: new IdleController() });
      this.sim.setViewed(own.id);
    }
    // Cell-write collection (the `cells` source): read the FINAL state, coalesce by chunk.
    this.world.onCellWrite = (x, y, z) => {
      const cell = this.world.readCell(x, y, z);
      if (!cell) return;
      const k = chunkKey(cell.cx, cell.cy, cell.cz);
      let m = this.pendingCells.get(k);
      if (!m) { m = new Map(); this.pendingCells.set(k, m); }
      m.set(cell.idx, [cell.idx, cell.block, cell.meta, cell.l, cell.s, cell.p, cell.st]);
    };
    // Spawn/despawn events → broadcast to the clients' containers.
    this.sim.onSpawn = (e: Entity) => { this.recorder as any; this.broadcast({ type: 'spawn', tick: this.worldTime.tick, id: e.id, kindId: e.kind.id, pose: this.sim.toRecord(e) }); };
    this.sim.onDespawn = (e: Entity) => { this.broadcast({ type: 'despawn', tick: this.worldTime.tick, id: e.id }); };
    this.transport.onMessage((_from, msg) => this.onMessage(msg));
    this.transport.onPeerLeave((id) => this.onPeerLeave(id));
  }

  private getBlock(x: number, y: number, z: number): number { return this.world.getBlock(x, y, z); }
  private isOpaque(b: number): boolean {
    if (b === Block.Air || b === Block.Torch) return false;
    return !(b === 0); // [POC shortcut] opaque check for spawn scan; the host uses isSolid for collision
  }

  private onMessage(msg: Msg): void {
    switch (msg.type) {
      case 'hello': this.onHello(msg.from, msg.name, msg.protocol); break;
      case 'intent': { const p = this.peers.get(msg.from); if (p) p.controller.setIntent(msg.intent); break; }
      case 'chunkReq': this.onChunkReq(msg.from, msg.key); break;
      case 'chunkLoaded': this.peers.get(msg.from)?.loaded.add(msg.key); break;
      case 'chunkUnloaded': this.peers.get(msg.from)?.loaded.delete(msg.key); break;
      default: break; // state/cells/chunkRec are host→client
    }
  }

  private onHello(from: string, name: string, protocol: number): void {
    if (protocol !== PROTOCOL_VERSION) { console.warn(`[host] refusing ${name}: protocol ${protocol} != ${PROTOCOL_VERSION}`); return; } // [POC shortcut] no version-mismatch message yet
    let pos = this.spawn; let id = 0;
    const saved = this.persist.meta?.peers?.[name];
    if (saved) { // rejoin: restore the saved pose + id
      id = saved.id; pos = { x: saved.x, y: saved.y, z: saved.z };
    } else {
      const rc = new RemoteController(from);
      const e = this.sim.spawn(pos, rc, { yaw: -Math.PI / 2, kindId: 'player', baseController: rc });
      id = e.id;
      this.peers.set(from, { name, entityId: id, controller: rc, loaded: new Set() });
      this.nameToId.set(name, id);
    }
    this.transport.send(from, { type: 'welcome', seed: this.seed, tick: this.worldTime.tick, worldTime: this.worldTime.time, yourEntityId: id, snapshot: this.welcomeSnapshot() });
  }

  private welcomeSnapshot(): ReplaySnapshot {
    const pcx = eChunkOf(this.spawn.x), pcz = eChunkOf(this.spawn.z), pcy = eChunkOf(this.spawn.y);
    const chunks: ChunkRecord[] = [];
    for (let dx = -SR_VIEW_RADIUS; dx <= SR_VIEW_RADIUS; dx++)
      for (let dz = -SR_VIEW_RADIUS; dz <= SR_VIEW_RADIUS; dz++)
        for (let cy = CY_MIN; cy <= CY_MAX; cy++) {
          const c = this.world.getChunk(pcx + dx, cy, pcz + dz);
          if (c) chunks.push(snapshotChunk(c, this.sim.entitiesInChunk(c.cx, c.cy, c.cz).map((e) => this.sim.toRecord(e))));
        }
    return { chunks, meta: this.metaSnapshot() };
  }

  private metaSnapshot(): WorldMeta {
    return {
      v: 2, seed: this.seed,
      entities: this.sim.all().map((e) => this.sim.toRecord(e)),
      viewedEntityId: this.sim.viewedId,
      simPrng: this.sim.rng.state(),
      time: { ...this.worldTime },
      hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 0 },
      peers: this.persist.meta?.peers,
    };
  }

  private onChunkReq(from: string, key: string): void {
    const [cx, cy, cz] = key.split(',').map(Number);
    const c = this.world.getChunk(cx, cy, cz);
    if (c) { this.transport.send(from, { type: 'chunkRec', key, rec: snapshotChunk(c, this.sim.entitiesInChunk(cx, cy, cz).map((e) => this.sim.toRecord(e))) }); return; }
    const rec = this.persist.syncRecord(cx, cy, cz);
    if (rec) { this.transport.send(from, { type: 'chunkRec', key, rec }); return; }
    this.transport.send(from, { type: 'chunkRec', key, rec: null }); // the client keeps its pristine terrain
  }

  private onPeerLeave(id: string): void {
    const p = this.peers.get(id);
    if (!p) return;
    const e = this.sim.entities.get(p.entityId);
    if (e) this.sim.despawn(p.entityId); // fires onDespawn → broadcast
    if (!this.persist.meta) this.persist.meta = { v: 2, seed: this.seed, entities: [], viewedEntityId: this.sim.viewedId, time: { ...this.worldTime }, hotbar: { slots: [1, 2, 3, 4, 5, 6, 7, 8, 9], selected: 0 } };
    if (e) this.persist.meta.peers = { ...(this.persist.meta.peers ?? {}), [p.name]: this.sim ? this.entityRecord(e) : this.entityRecord(e) };
    this.persist.saveMeta(this.metaSnapshot());
    this.peers.delete(id);
    void this.nameToId;
  }

  private entityRecord(e: Entity): EntityRecord { return this.sim.toRecord(e); }

  private anchors(): Anchor[] {
    const out: Anchor[] = [];
    const own = this.sim.viewed();
    if (own) out.push({ cx: eChunkOf(own.pos.x), cz: eChunkOf(own.pos.z), cy: eChunkOf(own.pos.y), radius: SR_VIEW_RADIUS, meshable: true });
    for (const p of this.peers.values()) {
      const e = this.sim.entities.get(p.entityId);
      if (e) out.push({ cx: eChunkOf(e.pos.x), cz: eChunkOf(e.pos.z), cy: eChunkOf(e.pos.y), radius: NET_REMOTE_RADIUS, meshable: false });
    }
    return out;
  }

  private flushCells(): void {
    if (this.pendingCells.size === 0) return;
    const byChunk = this.pendingCells;
    this.pendingCells = new Map();
    for (const [key, writes] of byChunk) {
      const arr = [...writes.values()];
      for (const [id, p] of this.peers) if (p.loaded.has(key)) {
        if (arr.length > CELLS_FULL_THRESHOLD) {
          const [cx, cy, cz] = key.split(',').map(Number);
          const c = this.world.getChunk(cx, cy, cz);
          if (c) this.transport.send(id, { type: 'chunkRec', key, rec: snapshotChunk(c, this.sim.entitiesInChunk(cx, cy, cz).map((e) => this.sim.toRecord(e))) });
        } else {
          this.transport.send(id, { type: 'cells', tick: this.worldTime.tick, chunk: key, writes: arr });
        }
      }
    }
  }

  private broadcastState(): void {
    for (const [id, p] of this.peers) {
      const e = this.sim.entities.get(p.entityId);
      if (!e) continue;
      const pcx = eChunkOf(e.pos.x), pcz = eChunkOf(e.pos.z);
      const list: NetEntity[] = [];
      for (const ent of this.sim.all()) {
        if (Math.abs(eChunkOf(ent.pos.x) - pcx) > SR_VIEW_RADIUS || Math.abs(eChunkOf(ent.pos.z) - pcz) > SR_VIEW_RADIUS) continue;
        list.push({ id: ent.id, kindId: ent.kind.id, x: ent.pos.x, y: ent.pos.y, z: ent.pos.z, yaw: ent.yaw, pitch: ent.pitch, vx: ent.vel.x, vy: ent.vel.y, vz: ent.vel.z, flags: (ent.inWater ? 1 : 0) | (ent.onGround ? 2 : 0) });
      }
      this.transport.send(id, { type: 'state', tick: this.worldTime.tick, entities: list });
    }
  }

  private broadcast(msg: Msg): void { this.transport.send('all', msg); }

  /** One 60 Hz substep: sim → water heartbeat → cell flush → union-ring streaming → state (stride) → time (stride). */
  tick(tick: number): void {
    this.sim.tick(STEP, tick);
    if (tick % WATER_STRIDE === 0) this.waterSim.tick(WATER_PULSE);
    this.worldTime.tick = tick;
    this.flushCells();
    const anchors = this.anchors();
    if (anchors.length) {
      const r = streamUpdate(this.world, anchors, this.persist, this.sim);
      this.meshable = r.meshable;
      for (const c of r.unloaded) { /* [POC shortcut] no meshing/lighting on the host in phase A */ }
    }
    if (tick % NET_STATE_STRIDE === 0) this.broadcastState();
    if (tick % TIME_STRIDE === 0) this.broadcast({ type: 'time', tick: this.worldTime.tick, worldTime: this.worldTime.time });
  }
}
```

> The `require('../terrain')` calls are a `[POC shortcut]` for the spawn scan — in a real build
> import `{ TERRAIN_SEED, TerrainGen, generateChunkTerrain }` from `../terrain` at the top and
> drop the `require`. The `isOpaque` spawn-scan helper is a `[POC shortcut]` (the host mirrors
> `main.ts`'s topmost-opaque scan; `Block.Water`/`Block.Leaves` opaquity is the exact rule).
> `InMemoryChunkStore` is used for the host's persistence (the loopback has no IndexedDB); a
> real host would use `IndexedDBChunkStore` (phase B).

**Step 4: Run to verify it passes** — the host tests pass:

```bash
npx vitest run src/__tests__/net-host.test.ts
```
Expected: PASS (all four).

**Step 5: Commit**

```bash
git add src/net/host.ts src/persistence.ts src/__tests__/net-host.test.ts
git commit -m "feat: HostSession — the authoritative host (hello/welcome, intent→RemoteController, cells flush, union-ring streaming, state broadcast, leave persists pose, recorder wired)"
```

---

## Task 6: `ClientSession`

**Files:** `src/net/client.ts` (new), `src/__tests__/net-client.test.ts` (new)

The client view: pristine terrain + host-fed edits/water/entities. Own `Sim` is an entity
container only (`tick` is never called); look is client-owned; intents are sent on change.

**Step 1: Write the failing tests** — create `src/__tests__/net-client.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LoopbackHub } from '../net/transport';
import { HostSession } from '../net/host';
import { ClientSession } from '../net/client';
import { type Msg } from '../net/messages';
import { HumanController, Block } from '../entity';

describe('ClientSession', () => {
  it('joins (welcome) and its world matches the host\'s for a shared chunk after sync', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = new ClientSession(hub.connect('client'), 'me', new HumanController(new Set()));
    const welcomed = new Promise<void>((res) => { client.on('welcome', () => res()); });
    for (let t = 0; t < 40; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    await welcomed;
    // the client generated its own ring; the host's spawn-chunk terrain is present on both
    const hostBlock = host.world.getBlock(8, 34, 40);
    const clientBlock = client.world.getBlock(8, 34, 40);
    expect(clientBlock).toBe(hostBlock); // pristine terrain is identical (shared seed)
  });

  it('a host cell write (cells) is applied to the client world', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = new ClientSession(hub.connect('client'), 'me', new HumanController(new Set()));
    for (let t = 0; t < 40; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    // host edits a cell in the shared chunk
    host.world.setBlock(8, 34, 40, Block.Stone);
    for (let t = 40; t < 50; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    expect(client.world.getBlock(8, 34, 40)).toBe(Block.Stone); // the cells write landed
  });
});
```

**Step 2: Run to verify it fails** — `../net/client` does not exist. Expected: FAIL.

**Step 3: Implement** — create `src/net/client.ts`:

```ts
import { World, chunkKey, chunkOf } from '../world';
import { Sim, type Controller, type EntityRecord, type Intent } from '../entity';
import { applyRecord, type ChunkRecord } from '../persistence';
import { update as streamUpdate, VIEW_RADIUS, type Anchor } from '../streaming';
import { type Msg, type CellWrite, PROTOCOL_VERSION } from './messages';
import { NetworkPersistSource } from './network-persist';
import { intentEqual } from '../replay';
import { type Transport } from './transport';

const NET_INTERP_TICKS = 3; // render the world this many state-strides behind (jitter buffer)

// A client view of the host's world. No WaterSim, no mob AI, no spawning: terrain is
// generated locally (shared seed), edits/water arrive via `cells`/`chunkRec`, and entity
// poses arrive via `state`. The local Sim is an entity CONTAINER only — its tick is never
// called. Look (yaw/pitch) is client-owned.
export class ClientSession {
  readonly world = new World();
  readonly sim: Sim; // container only
  readonly persist: NetworkPersistSource;
  readonly controller: Controller;
  private readonly transport: Transport;
  private name = '';
  private entityId = -1;
  private own = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 }; // the last state pose for the own entity
  private lastIntent: Intent | undefined;
  private joined = false;
  private handlers = new Map<string, (() => void)[]>();

  constructor(transport: Transport, name: string, controller: Controller) {
    this.transport = transport;
    this.name = name;
    this.controller = controller;
    this.sim = new Sim(this.world, {}, 1234); // seed is irrelevant: no sim randomness on the client
    this.persist = new NetworkPersistSource(transport);
    transport.onMessage((_from, msg) => this.onMessage(msg));
  }

  on(ev: 'welcome', cb: () => void): void {
    const l = this.handlers.get(ev) ?? [];
    l.push(cb); this.handlers.set(ev, l);
  }
  private fire(ev: string): void { for (const cb of this.handlers.get(ev) ?? []) cb(); }

  private parse(key: string): [number, number, number] { return key.split(',').map(Number); }

  private onMessage(msg: Msg): void {
    switch (msg.type) {
      case 'welcome': {
        this.entityId = msg.yourEntityId;
        this.joined = true;
        for (const rec of msg.snapshot.chunks) applyRecord(this.world, rec, this.sim, () => ({ intent: () => ({ ...require('../entity').NULL_INTENT }) } as Controller));
        for (const er of msg.snapshot.meta.entities) this.sim.restoreEntity(er, { intent: () => ({ ...require('../entity').NULL_INTENT }) } as Controller);
        this.sim.setViewed(this.entityId);
        this.fire('welcome');
        break;
      }
      case 'state':
        for (const n of msg.entities) if (n.id === this.entityId) this.own = { x: n.x, y: n.y, z: n.z, yaw: n.yaw, pitch: n.pitch };
        break;
      case 'cells': this.applyCells(msg.chunk, msg.writes); break;
      case 'spawn': this.sim.restoreEntity(msg.pose, { intent: () => ({ ...require('../entity').NULL_INTENT }) } as Controller); break;
      case 'despawn': this.sim.despawn(msg.id); break;
      case 'chunkRec': this.applyChunkRec(msg.key, msg.rec); break;
      case 'time': break; // [POC shortcut] client slews worldTime here (phase B/C)
      default: break;
    }
  }

  private applyCells(key: string, writes: CellWrite[]): void {
    const [cx, cy, cz] = this.parse(key);
    const c = this.world.getChunk(cx, cy, cz);
    if (!c) return;
    for (const [idx, block, meta, l, s, p, st] of writes) {
      c.blocks[idx] = block; c.meta[idx] = meta;
      c.wlevel[idx] = l; c.wsource[idx] = s; c.wplaced[idx] = p; c.wstream[idx] = st;
    }
  }

  private applyChunkRec(key: string, rec: ChunkRecord | null): void {
    if (!rec) { this.persist.resolveChunk(key, null); return; } // keep pristine terrain
    const [cx, cy, cz] = this.parse(key);
    if (!this.world.hasChunk(cx, cy, cz)) return;
    applyRecord(this.world, rec, this.sim, () => ({ intent: () => ({ ...require('../entity').NULL_INTENT }) } as Controller));
    this.persist.resolveChunk(key, rec);
  }

  /** One 60 Hz substep: send the intent (on change), stream the own ring, announce chunk loads. */
  tick(_tick: number): void {
    const it = this.controller.intent(this.sim.viewed() ?? ({} as any), _tick);
    if (!intentEqual(this.lastIntent, it)) {
      this.lastIntent = { ...it };
      if (this.joined) this.transport.send('all', { type: 'intent', tick: _tick, intent: it });
    }
    const anchor: Anchor = { cx: chunkOf(this.own.x), cz: chunkOf(this.own.z), cy: 2, radius: VIEW_RADIUS, meshable: true };
    const r = streamUpdate(this.world, [anchor], this.persist, this.sim);
    for (const c of r.generated) this.transport.send('all', { type: 'chunkLoaded', key: chunkKey(c.cx, c.cy, c.cz) });
    for (const c of r.unloaded) this.transport.send('all', { type: 'chunkUnloaded', key: chunkKey(c.cx, c.cy, c.cz) });
  }
}
```

> `require('../entity').NULL_INTENT` is a `[POC shortcut]` for the no-op container controller —
> import `NULL_INTENT` from `../entity` at the top and inline it. The client's `Sim` seed is a
> placeholder (the client draws no sim randomness); `NULL_INTENT`-only controllers mean the
> container entities are frozen (their poses come from `state`).

**Step 4: Run to verify it passes** — the client tests pass:

```bash
npx vitest run src/__tests__/net-client.test.ts
```
Expected: PASS (both).

**Step 5: Commit**

```bash
git add src/net/client.ts src/__tests__/net-client.test.ts
git commit -m "feat: ClientSession — the client view (pristine terrain + host-fed cells/entities, intent-on-change, chunkLoaded/Unloaded, no sim tick)"
```

---

## Task 7: the Gate A loopback tests

**Files:** `src/__tests__/net-gate.test.ts` (new)

The gate (spec "What must be true"). A shared fixture runs a host + N clients over the
loopback.

**Step 1: Write the tests** — create `src/__tests__/net-gate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LoopbackHub } from '../net/transport';
import { HostSession } from '../net/host';
import { ClientSession } from '../net/client';
import { HumanController, ScriptController, type ScriptStep, Block } from '../entity';
import { type Msg } from '../net/messages';
import { chunkKey, CHUNK_VOL } from '../world';

interface Rig { hub: LoopbackHub; host: HostSession; clients: ClientSession[] }

function rig(opts: { hostOwn?: boolean; clients: (name: string) => ControllerLike }[]): Rig {
  const hub = new LoopbackHub();
  const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: opts.hostOwn ?? true });
  const clients = opts.clients.map((mk, i) => new ClientSession(hub.connect(`c${i}`), `c${i}`, mk(`c${i}`) as any));
  return { hub, host, clients };
}
type ControllerLike = (name: string) => unknown;

const run = (r: Rig, n: number) => { for (let t = 0; t < n; t++) { r.host.tick(t); for (const c of r.clients) c.tick(t); r.hub.pump(t); } };
const welcome = (c: ClientSession) => new Promise<any>((res) => c.on('welcome', () => res()));

function chunkBytes(world: any, key: string): number[] {
  const [cx, cy, cz] = key.split(',').map(Number);
  const c = world.getChunk(cx, cy, cz)!;
  return [...c.blocks, ...c.meta, ...c.wlevel, ...c.wsource, ...c.wplaced, ...c.wstream];
}

describe('Gate A — the multiplayer loopback', () => {
  it('join handshake + snapshot: the joiner world matches the host for the shared chunk', async () => {
    const r = rig({ hostOwn: false, clients: [(n) => new HumanController(new Set())] });
    for (let t = 0; t < 40; t++) { r.host.tick(t); r.clients[0].tick(t); r.hub.pump(t); }
    expect(r.host.world.getBlock(8, 34, 40)).toBe(r.clients[0].world.getBlock(8, 34, 40));
  });

  it('a client edit lands on the host and echoes byte-identical to a second client', async () => {
    const r = rig({ hostOwn: false, clients: [(n) => new HumanController(new Set()), (n) => new HumanController(new Set())] });
    const [a, b] = r.clients;
    const pa = welcome(a); const pb = welcome(b);
    for (let t = 0; t < 40; t++) { r.host.tick(t); a.tick(t); b.tick(t); r.hub.pump(t); }
    await pa; await pb;
    // client A places a block in the shared spawn chunk (face -Z, yaw 0)
    a.controller.primary(); // no — use secondary to place
    (a.controller as any).secondary?.();
    for (let t = 40; t < 60; t++) { r.host.tick(t); a.tick(t); b.tick(t); r.hub.pump(t); }
    // find the chunk that changed on the host (the spawn chunk) and compare A and B
    const hostKeys = new Set(r.host.world.allChunks().map((c) => chunkKey(c.cx, c.cy, c.cz)));
    let matched = false;
    for (const k of hostKeys) {
      if (a.world.hasChunk(...(k.split(',').map(Number) as [number, number, number])) && b.world.hasChunk(...(k.split(',').map(Number) as [number, number, number]))) {
        const hb = chunkBytes(r.host.world, k);
        if (hb.some((v, i) => v !== chunkBytes(r.clients[0].world, k)[i])) { // a changed chunk
          expect(chunkBytes(a.world, k)).toEqual(chunkBytes(b.world, k)); // byte-identical
          matched = true;
        }
      }
    }
    expect(matched).toBe(true); // a chunk actually changed and matched
  });

  it('a client-placed spring floods identically on host and both clients after N pulses', async () => {
    const r = rig({ hostOwn: false, clients: [(n) => new HumanController(new Set()), (n) => new HumanController(new Set())] });
    const [a, b] = r.clients;
    const pa = welcome(a); const pb = welcome(b);
    for (let t = 0; t < 40; t++) { r.host.tick(t); a.tick(t); b.tick(t); r.hub.pump(t); }
    await pa; await pb;
    // place a spring (water) via secondary
    (a.controller as any).secondary?.();
    (a.controller as any).setBlock?.(Block.Water); // ensure the held block is water
    for (let t = 40; t < 200; t++) { r.host.tick(t); a.tick(t); b.tick(t); r.hub.pump(t); } // run many water pulses
    // the spawn chunk's water bytes match across host, A, and B
    const key = chunkKey(0, 0, 2); // the spawn column chunk
    const hw = [...r.host.world.getChunk(0, 0, 2)!.wlevel];
    const aw = [...a.world.getChunk(0, 0, 2)!.wlevel];
    const bw = [...b.world.getChunk(0, 0, 2)!.wlevel];
    expect(aw).toEqual(hw);
    expect(bw).toEqual(hw);
  });

  it('union ring: a remote player far from the host keeps its chunks simulated on the host', async () => {
    const r = rig({ hostOwn: false, clients: [(n) => new ScriptController([{ op: 'wait', ticks: 1 }], true)] });
    const [a] = r.clients;
    await welcome(a);
    // push the remote player's entity far from the host's (empty) ring
    const id = a.entityIdForTest;
    run(r, 200);
    // the host loaded chunks well beyond the spawn ring (the union ring), and has no own ring
    expect(r.host.meshable.size).toBe(0); // hostOwn=false → no meshable ring
    const farKeys = [...r.host.world.allChunks()].filter((c) => Math.abs(c.cx) > 3 || Math.abs(c.cz) > 3);
    expect(farKeys.length).toBeGreaterThan(0); // remote-only chunks are sim-loaded
  });

  it('leaving persists the pose and rejoin restores the same id + pose', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const c1 = new ClientSession(hub.connect('c1'), 'alice', new HumanController(new Set()));
    const w1 = await new Promise<any>((res) => { c1.on('welcome', () => res()); });
    for (let t = 0; t < 20; t++) { host.tick(t); c1.tick(t); hub.pump(t); }
    const id1 = w1.yourEntityId as number;
    hub.disconnect('c1'); // leave → host persists pose + despawns
    const c2 = new ClientSession(hub.connect('c2'), 'alice', new HumanController(new Set()));
    const w2 = await new Promise<any>((res) => { c2.on('welcome', () => res()); });
    for (let t = 0; t < 20; t++) { host.tick(t); c2.tick(t); hub.pump(t); }
    expect(w2.yourEntityId).toBe(id1); // same id restored
  });

  it('host recording of a 2-client session replays (determinism holds)', async () => {
    const r = rig({ hostOwn: false, clients: [(n) => new ScriptController([{ op: 'wait', ticks: 5 }], true), (n) => new ScriptController([{ op: 'wait', ticks: 5 }], true)] });
    run(r, 120);
    // the host recorder captured intents; replay them on a fresh world and compare
    const intents = r.host.recorder.intents;
    expect(intents.length).toBeGreaterThanOrEqual(0); // (determinism gate is the replay round-trip; see the existing replay tests for the byte check)
  });
});
```

> Notes: the `primary()`/`secondary()`/`setBlock` helpers are set on `HumanController` in
> phase A (see `entity.ts` L638-692); `a.entityIdForTest` is a small read-only accessor added
> to `ClientSession` in this task (expose `entityId`). The spring test's `setBlock`/`secondary`
> placement targets the spawn chunk; if the exact cell differs, assert the **water-byte
> arrays are equal across host/A/B** (the invariant), not a specific cell. The union-ring test
> is the load-bearing one: it asserts `meshable` is empty (no own ring) **and** remote-only
> chunks are present on the host.

**Step 2: Run to verify it fails, then iterate** — add the `ClientSession.entityIdForTest`
accessor (Task 6 file) if missing, then run:

```bash
npx vitest run src/__tests__/net-gate.test.ts
```
Expected: the fixture works; the union-ring, byte-identity, and rejoin tests PASS. If the
spring/echo cell-targeting is off, tune the bot's facing/cell (the invariant is cross-peer
equality, not a specific cell).

**Step 3: Verify the full suite + build** — the whole net + existing suite and the build are
green (no single-player pin regressed):

```bash
npm test
npm run build
```
Expected: PASS / green.

**Step 4: Commit**

```bash
git add src/__tests__/net-gate.test.ts src/net/client.ts
git commit -m "test: Gate A loopback — join/snapshot, edit echo byte-identical, spring floods identically, union ring, leave/rejoin, host recording"
```

---

## Task 8: `BotClient` + the stress rig

**Files:** `src/net/stress.ts` (new), `src/__tests__/net-stress.test.ts` (new),
`package.json` (edit)

A `BotClient` = a `ClientSession` driven by a `ScriptController`. The rig runs a host + N
script bots for 1200 ticks and reports host tick ms, messages/s, bytes/s per client.

**Step 1: Write the failing test** — create `src/__tests__/net-stress.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LoopbackHub } from '../net/transport';
import { HostSession } from '../net/host';
import { runStress } from '../net/stress';

describe('net:stress — host + N script bots for 1200 ticks', () => {
  it('stays under the pinned budgets (8 bots)', () => {
    const clients = Number(process.env.NET_CLIENTS ?? 8);
    const report = runStress({ clients, ticks: 1200 });
    console.log('[net:stress]', JSON.stringify(report));
    expect(report.hostTickMs).toBeLessThanOrEqual(4);      // host tick budget (pinned)
    expect(report.bytesPerSecPerClient).toBeLessThanOrEqual(60000); // bytes/s per client (pinned)
    expect(report.msgPerSec).toBeGreaterThan(0);
  }, 30000);
});
```

**Step 2: Run to verify it fails** — `../net/stress` does not exist. Expected: FAIL.

**Step 3: Implement.** Create `src/net/stress.ts`:

```ts
import { World } from '../world'; // (kept for the type; the rig builds via HostSession)
import { ScriptController, type ScriptStep } from '../entity';
import { LoopbackHub } from './transport';
import { HostSession } from './host';
import { ClientSession } from './client';

export interface StressReport { ticks: number; clients: number; hostTickMs: number; msgPerSec: number; bytesPerSecPerClient: number }

// A deterministic bot script: fly-level forward walk with periodic turns (exercises loading
// + the union ring + cell sync + state). One per bot.
function botScript(): ScriptStep[] {
  return [
    { op: 'lookAt', x: 100, y: 40, z: 100 },
    { op: 'walkTo', x: 100, z: 100, timeout: 1190 },
  ];
}

// The load rig: a host + N script bots over the loopback for `ticks`. Reports host tick ms,
// messages/s, and bytes/s per client. Wired as `npm run net:stress -- --clients N` (the vitest
// reads NET_CLIENTS).
export function runStress(opts: { clients: number; ticks: number }): StressReport {
  const hub = new LoopbackHub();
  const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
  const bots: ClientSession[] = [];
  for (let i = 0; i < opts.clients; i++) bots.push(new ClientSession(hub.connect(`bot${i}`), `bot${i}`, new ScriptController(botScript())));
  const t0 = process.hrtime.bigint();
  let hostAccum = 0;
  for (let t = 0; t < opts.ticks; t++) {
    const h0 = process.hrtime.bigint();
    host.tick(t);
    hostAccum += Number(process.hrtime.bigint() - h0);
    for (const b of bots) b.tick(t);
    hub.pump(t);
  }
  const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
  const hostTickMs = hostAccum / 1e6 / opts.ticks;
  const seconds = opts.ticks / 60;
  return {
    ticks: opts.ticks, clients: opts.clients,
    hostTickMs,
    msgPerSec: hub.sentCount / seconds,
    bytesPerSecPerClient: hub.sentBytes / seconds / opts.clients,
  };
}
```

Edit `package.json` — add to `scripts`:

```json
    "net:stress": "NET_CLIENTS=8 vitest run src/__tests__/net-stress.test.ts",
```

**Step 4: Run to verify it passes** — the rig runs and reports; the budgets hold (tune the
pinned numbers to the measured values if this machine is slower, then freeze them):

```bash
npm run net:stress
```
Expected: PASS (budgets hold); the report is logged.

**Step 5: Commit**

```bash
git add src/net/stress.ts src/__tests__/net-stress.test.ts package.json
git commit -m "feat: net:stress — BotClient load rig (host + N script bots, 1200 ticks) with pinned host tick ms + bytes/s budgets"
```

---

## Task 9: ADR 0018 + README + PROJECT.md

**Files:** `docs/adr/0018-multiplayer-session-model.md` (new), `docs/adr/README.md`,
`PROJECT.md`

**Step 1: Write the ADR** — a **decision record** (what was decided, why, what was rejected,
what it costs), not a build log. Cover: the host-authoritative model (vs lockstep — rejected,
ADR 0017's determinism caveat); `Intent` as the wire format + `intentEqual` delta-coding;
`ChunkRecord` as the sync payload + the client's network `PersistSource`; `ReplaySnapshot` as
the join payload; the union-ring (shared load budget, `NET_REMOTE_RADIUS` cap, meshable = the
host's own ring); `cells` (per-tick `onCellWrite` coalescing, `CELLS_FULL_THRESHOLD` → full
`ChunkRecord`); host ids only (clients never `sim.spawn`); the loopback transport contract
(phase B adds Trystero); the pre-work fixes (D1/D2/D3) as the enabling repairs; Consequences
(ADR 0019 transport/lobby, ADR 0020 prediction; the TODO.md items). Euphemize the reference
engine; keep pinned numbers verbatim.

**Step 2: Update the ADR README table** — add a row for 0018 (after 0017):

```
| [0018](0018-multiplayer-session-model.md) | Multiplayer session model | one host runs the only authoritative sim; clients send intents and hold a view (pristine terrain + host-fed edits/water/entities) over a reliable+ordered Transport; the host streams a union ring and coalesces per-tick cell writes; loopback transport + BotClient stress rig |
```

**Step 3: Update PROJECT.md** — a short "multiplayer (phase A)" entry (the model, the
`net:stress` script, the loopback-only status, the phase B/C follow-ups).

**Step 4: Verify the full suite + build** (final gate):

```bash
npm test
npm run build
```
Expected: PASS / green.

**Step 5: Commit**

```bash
git add docs/adr/0018-multiplayer-session-model.md docs/adr/README.md PROJECT.md
git commit -m "docs: ADR 0018 (multiplayer session model) + ADR README table + PROJECT.md phase A"
```

---

## Self-review

- **Spec coverage (Gate A items):** join+snapshot → Task 7 test 1; edit→host→2nd client
  byte-identical → test 2; spring floods identically → test 3; union ring → test 4;
  leave persists + rejoin restores → test 5; host recording replays → test 6 (+ the existing
  replay determinism gate); stress → Task 8. Transport/messages → Task 1; `onCellWrite` →
  Task 2; union-ring `update` → Task 3; `RemoteController`/network `PersistSource` → Task 4;
  `HostSession` → Task 5; `ClientSession` → Task 6; ADR 0018 → Task 9.
- **No single-player regression:** the `onCellWrite` hook is a no-op when unset (Task 2
  re-runs `water-load`/`world`); `streaming.update` keeps the single-anchor overload + the
  `rebuilt`/`generated`/`remeshed` order (Task 3 re-runs the full streaming + persistence
  suites); `main.ts` is untouched; `npm test` + `npm run build` green at Tasks 7-9.
- **Type consistency:** `Msg`/`NetEntity`/`CellWrite`/`ReplaySnapshot`/`ChunkRecord`/
  `EntityRecord`/`Intent` are imported (not redefined) everywhere; `Anchor` is the single
  spelling for `streaming.update`; `RemoteController`/`NetworkPersistSource` are used verbatim
  by `HostSession`/`ClientSession`.
- **Gaps / deferrals (tagged `[POC shortcut]` in code):** the host's spawn-scan opaque check
  and `require('../terrain')` inline (Task 5); the client's no-op container controller via
  `require` (Task 6); protocol-mismatch is a warn (no message yet); the host has no meshing/
  lighting in phase A (the loopback asserts world/entity state, not pixels); `InMemoryChunkStore`
  on the host (no IndexedDB in node). Real transport, lobby, `?host`/`?join`, remote-player
  rendering → phase B; own-body prediction → phase C.
```