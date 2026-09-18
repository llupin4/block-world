# Adaptive View Radius (Multiplayer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generalize the single-player adaptive view radius to multiplayer — every participant (host included) runs its own independent `ViewRadiusGovernor`; the host serves a union data ring (2D x/z superset); each client culls entity poses locally against its own radius.

**Architecture:** The host and each client each own a `ViewRadiusGovernor` driven by the frame loop (`noteFrame(workMs, ringFull)`). The host's `anchors()` is symmetric: the host's own governed ring (meshable) + each peer's reported radius (data-only). `broadcastState()` sends the union-ring superset to every peer; each client discards poses outside its own radius. The `radius` wire message carries a client's governed radius to the host. `PROTOCOL_VERSION` bumps 1→2.

**Tech Stack:** TypeScript, Three.js, Vitest (unit), Playwright (e2e). Frame budget 16.7 ms.

**Spec:** `docs/superpowers/specs/2026-09-17-adaptive-view-radius-mp-design.md`

---

## File Structure

- `src/net/messages.ts` — add the `radius` message; bump `PROTOCOL_VERSION` to 2.
- `src/net/host.ts` — `Peer.radius`; `anchors()` symmetric + public; `activeRadius` + governor + `noteFrame` + `ownRingFull`; `unionRing()` + `colKey`; `broadcastState()` superset.
- `src/net/client.ts` — governor + `activeRadius`; `tick()` anchor uses `activeRadius`; `noteFrame` + `radius` reporting; `ownAnchor()`; `state`/`spawn` local cull; `toRecord()`.
- `src/main.ts` — frame-loop governor hook for MP (drives `mpSession.noteFrame`).
- `src/__tests__/net-messages.test.ts` — `PROTOCOL_VERSION` is 2; `radius` round-trip.
- `src/__tests__/net-host.test.ts` — anchors symmetry; union-ring growth; `noteFrame`; broadcast superset.
- `src/__tests__/net-client.test.ts` — `noteFrame` + radius reporting; local pose-cull.
- `tests/e2e/view-radius-mp.spec.ts` — 2-client MP governor smoke (new).

---

## Task 1: `radius` message + `PROTOCOL_VERSION` bump

**Files:**
- Modify: `src/net/messages.ts`
- Modify: `src/__tests__/net-messages.test.ts`

**Step 1: Write the failing test.** In `src/__tests__/net-messages.test.ts`, update the imports and replace the `PROTOCOL_VERSION` test, and add a round-trip test:

```ts
import { describe, it, expect } from 'vitest';
import { WorldTime } from '../time';
import { PROTOCOL_VERSION, encodeMsg, decodeMsg } from '../net/messages';
import type { WorldTimeSnapshot, Msg } from '../net/messages';
```

Replace the line `it('PROTOCOL_VERSION is still 1 (no bump)', () => { expect(PROTOCOL_VERSION).toBe(1); });` with:

```ts
  it('PROTOCOL_VERSION is 2 (the radius message was added)', () => { expect(PROTOCOL_VERSION).toBe(2); });
  it('encode/decode round-trips a radius message', () => {
    const msg: Msg = { type: 'radius', radius: 4 };
    expect(decodeMsg(encodeMsg(msg))).toEqual({ type: 'radius', radius: 4 });
  });
```

**Step 2: Run test to verify it fails.** Run: `npx vitest run src/__tests__/net-messages.test.ts`
Expected: FAIL — `PROTOCOL_VERSION` is 1, and `Msg` has no `radius` member (type error).

**Step 3: Implement.** In `src/net/messages.ts`:
- Change `export const PROTOCOL_VERSION = 1;` to `export const PROTOCOL_VERSION = 2;`
- In the `Msg` union, add a member after the `chunkUnloaded` line:
```ts
  | { type: 'radius'; radius: number }
```
(Leave `NET_REMOTE_RADIUS` in place — it stays as a documented pinned number in the ADRs; `host.ts` stops importing it in Task 2.)

**Step 4: Run test to verify it passes.** Run: `npx vitest run src/__tests__/net-messages.test.ts`
Expected: PASS.

**Step 5: Commit.** Run: `git add src/net/messages.ts src/__tests__/net-messages.test.ts && git commit -m "net: add radius message, bump PROTOCOL_VERSION to 2"`

---

## Task 2: Host symmetric `anchors()` + `Peer.radius`

**Files:**
- Modify: `src/net/host.ts`
- Modify: `src/__tests__/net-host.test.ts`

**Step 1: Write the failing test.** In `src/__tests__/net-host.test.ts`, add `PROTOCOL_VERSION` to the messages import and replace all five `protocol: 1` with `protocol: PROTOCOL_VERSION` (lines 23, 38, 58, 74, 137). Then add two tests inside the `describe('HostSession', ...)`:

```ts
  it('anchors() is symmetric: the host uses its governed radius, each peer its reported radius', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: true });
    const client = hub.connect('client');
    const welcomed = welcomeOf(client);
    client.send('host', { type: 'hello', name: 'alice', protocol: PROTOCOL_VERSION });
    hub.pump(0);
    await welcomed;
    expect(host.anchors().find((a) => a.meshable)!.radius).toBe(2); // the host's own governed ring (default 2)
    expect(host.anchors().find((a) => !a.meshable)!.radius).toBe(2); // the peer's ring (default 2 until it reports)
    client.send('host', { type: 'radius', radius: 4 });
    hub.pump(0);
    expect(host.anchors().find((a) => !a.meshable)!.radius).toBe(4); // the peer reported a larger radius
    client.send('host', { type: 'radius', radius: 2 });
    hub.pump(0);
    expect(host.anchors().find((a) => !a.meshable)!.radius).toBe(2); // the peer reported a smaller radius
  });

  it('the union data ring grows when a peer reports a larger radius', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: true });
    const client = hub.connect('client');
    const welcomed = welcomeOf(client);
    client.send('host', { type: 'hello', name: 'alice', protocol: PROTOCOL_VERSION });
    hub.pump(0);
    await welcomed;
    const union = () => {
      const s = new Set<string>();
      for (const a of host.anchors())
        for (let dx = -a.radius; dx <= a.radius; dx++)
          for (let dz = -a.radius; dz <= a.radius; dz++)
            s.add(a.cx + dx + ',' + (a.cz + dz));
      return s.size;
    };
    const before = union();
    client.send('host', { type: 'radius', radius: 4 });
    hub.pump(0);
    expect(union()).toBeGreaterThan(before); // the union ring grew (the peer's ring is now radius 4)
    client.send('host', { type: 'radius', radius: 2 });
    hub.pump(0);
    expect(union()).toBe(before); // the union ring shrank back (the peer's ring is radius 2 again)
  });
```

**Step 2: Run test to verify it fails.** Run: `npx vitest run src/__tests__/net-host.test.ts`
Expected: FAIL — `host.anchors` is not a function (it is `private`), and `Peer` has no `radius`.

**Step 3: Implement.** In `src/net/host.ts`:
- Imports: add `VIEW_RADIUS` to the streaming import and drop `NET_REMOTE_RADIUS` from the messages import:
```ts
import { update as streamUpdate, type Anchor, type StreamingUpdate, VIEW_RADIUS, CY_MIN, CY_MAX } from '../streaming';
import { NET_STATE_STRIDE, CELLS_FULL_THRESHOLD, TIME_STRIDE, PROTOCOL_VERSION, type Msg, type NetEntity, type CellWrite } from './messages';
```
- `Peer` interface: add `radius: number`:
```ts
interface Peer { name: string; entityId: number; controller: RemoteController; loaded: Set<string>; radius: number }
```
- Add a field next to `meshable`:
```ts
  activeRadius = VIEW_RADIUS; // the host's own governed view radius (the governor drives it; mirrors single-player)
```
- In `onHello`, set `radius: VIEW_RADIUS` in both `this.peers.set(...)` calls (the rejoin and the new-peer branches).
- In `onMessage`, add a `radius` case before the `default`:
```ts
    case 'radius': { const p = this.peers.get(from); if (p) p.radius = msg.radius; break; }
```
- Make `anchors()` public and symmetric (own anchor uses `this.activeRadius`, peer anchors use `p.radius`):
```ts
  anchors(): Anchor[] { // public: the union data ring's anchors (the host's own governed ring + each peer's reported ring); tested directly
    const out: Anchor[] = [];
    const own = this.sim.viewed();
    if (own) out.push({ cx: chunkOf(own.pos.x), cz: chunkOf(own.pos.z), cy: chunkOf(own.pos.y), radius: this.activeRadius, meshable: true });
    for (const p of this.peers.values()) {
      const e = this.sim.entities.get(p.entityId);
      if (e) out.push({ cx: chunkOf(e.pos.x), cz: chunkOf(e.pos.z), cy: chunkOf(e.pos.y), radius: p.radius, meshable: false });
    }
    return out;
  }
```
- In `welcomeSnapshot()`, replace the two `SR_VIEW_RADIUS` uses with `VIEW_RADIUS` (drop the `SR_VIEW_RADIUS` alias from the import — `VIEW_RADIUS` now covers both).

**Step 4: Run test to verify it passes.** Run: `npx vitest run src/__tests__/net-host.test.ts`
Expected: PASS (all host tests, including the two new ones).

**Step 5: Commit.** Run: `git add src/net/host.ts src/__tests__/net-host.test.ts && git commit -m "net: host symmetric anchors() + Peer.radius (union data ring)"`

---

## Task 3: Host governor (`noteFrame` + `ownRingFull`)

**Files:**
- Modify: `src/net/host.ts`
- Modify: `src/__tests__/net-host.test.ts`

**Step 1: Write the failing test.** In `src/__tests__/net-host.test.ts`, add a test inside the `describe`:

```ts
  it('noteFrame drives the host activeRadius (grows with headroom + a full own ring)', () => {
    const host = new HostSession(new LoopbackHub().connect('host'), 1234, { withOwnPlayer: true });
    host.tick(0); // populate meshable (the host's own ring)
    for (const k of host.meshable) { // load the whole own ring so ownRingFull() is true
      const [cx, cy, cz] = k.split(',').map(Number);
      if (!host.world.hasChunk(cx, cy, cz)) host.world.ensureChunk(cx, cy, cz);
    }
    let r = 2;
    for (let i = 0; i < 200; i++) r = host.noteFrame(1); // light frames + full ring → grow
    expect(r).toBeGreaterThan(2); // the governor grew the host's own radius
  });
```

**Step 2: Run test to verify it fails.** Run: `npx vitest run src/__tests__/net-host.test.ts`
Expected: FAIL — `host.noteFrame` is not a function.

**Step 3: Implement.** In `src/net/host.ts`:
- Import the governor: `import { ViewRadiusGovernor } from '../view-radius';`
- Add a field: `private governor = new ViewRadiusGovernor(); // the host's own view radius governor (driven by the frame loop)`
- Add the methods (near `anchors()`):
```ts
  /** The frame loop feeds the host's own governor once per frame (mirrors single-player). The host's
   *  "ring full" is its OWN (meshable) ring being fully loaded — not the union data ring (which is
   *  larger, serving the peers). Returns the (possibly changed) radius. */
  noteFrame(workMs: number): number {
    this.activeRadius = this.governor.noteFrame(workMs, this.ownRingFull());
    return this.activeRadius;
  }

  private ownRingFull(): boolean {
    if (this.meshable.size === 0) return false; // before the first tick, the ring is unknown
    let n = 0;
    for (const k of this.meshable) {
      const [cx, cy, cz] = k.split(',').map(Number);
      if (this.world.hasChunk(cx, cy, cz)) n++;
    }
    return n === this.meshable.size;
  }
```

**Step 4: Run test to verify it passes.** Run: `npx vitest run src/__tests__/net-host.test.ts`
Expected: PASS.

**Step 5: Commit.** Run: `git add src/net/host.ts src/__tests__/net-host.test.ts && git commit -m "net: host ViewRadiusGovernor (noteFrame + ownRingFull)"`

---

## Task 4: Host `broadcastState()` union-ring superset

**Files:**
- Modify: `src/net/host.ts`
- Modify: `src/__tests__/net-host.test.ts`

**Step 1: Write the failing test.** In `src/__tests__/net-host.test.ts`, add `IdleController` to the entity import and add a test inside the `describe`:

```ts
  it('broadcastState sends the union-ring superset (far peer included, out-of-union excluded)', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: true });
    const near = hub.connect('near');
    let nearState: Extract<Msg, { type: 'state' }> | undefined;
    const welcomed = new Promise<void>((res) => {
      near.onMessage((_f, m: Msg) => { if (m.type === 'welcome') res(); else if (m.type === 'state') nearState = m; });
    });
    near.send('host', { type: 'hello', name: 'near', protocol: PROTOCOL_VERSION });
    hub.pump(0);
    await welcomed;
    const far = hub.connect('far');
    const farWelcomeP = new Promise<Extract<Msg, { type: 'welcome' }>>((res) => {
      far.onMessage((_f, m: Msg) => { if (m.type === 'welcome') res(m); });
    });
    far.send('host', { type: 'hello', name: 'far', protocol: PROTOCOL_VERSION });
    hub.pump(0);
    const farId = (await farWelcomeP).yourEntityId;
    host.sim.entities.get(farId)!.pos = { x: 64, y: 40, z: 64 }; // chunk (4,4) — far from the near peer (spawn)
    far.send('host', { type: 'radius', radius: 2 });
    const deerId = host.sim.spawn({ x: 200, y: 40, z: 200 }, new IdleController(), { kindId: 'deer' }).id; // chunk (12,12) — outside every ring
    hub.pump(0);
    host.tick(3); // broadcastState (NET_STATE_STRIDE = 3)
    hub.pump(3);
    expect(nearState).toBeDefined();
    expect(nearState!.entities.some((e) => e.id === farId), 'the far peer is in the union ring → included for the near peer').toBe(true);
    expect(nearState!.entities.some((e) => e.id === deerId), 'the deer is outside every ring → excluded').toBe(false);
  });
```

**Step 2: Run test to verify it fails.** Run: `npx vitest run src/__tests__/net-host.test.ts`
Expected: FAIL — the far peer is excluded (the current per-peer cull uses the near peer's own ring, not the union).

**Step 3: Implement.** In `src/net/host.ts`:
- Add a module-level helper and a `unionRing()` method:
```ts
const colKey = (cx: number, cz: number): string => cx + ',' + cz; // a 2D column key (x/z only)

  /** The union data ring's columns: the host's radius at the host's position ∪ each peer's radius at
   *  each peer's position. `broadcastState` sends every entity in this ring to every peer (the
   *  superset); each client culls to its own radius locally. Reuses `anchors()` so the broadcast and
   *  the data ring never disagree. */
  private unionRing(): Set<string> {
    const ring = new Set<string>();
    for (const a of this.anchors())
      for (let dx = -a.radius; dx <= a.radius; dx++)
        for (let dz = -a.radius; dz <= a.radius; dz++)
          ring.add(colKey(a.cx + dx, a.cz + dz));
    return ring;
  }
```
- Replace `broadcastState()` with the superset version (drop the per-peer cull):
```ts
  private broadcastState(): void {
    const ring = this.unionRing(); // the union data ring (2D x/z columns)
    for (const [id, p] of this.peers) {
      const e = this.sim.entities.get(p.entityId);
      if (!e) continue;
      const list: NetEntity[] = [];
      for (const ent of this.sim.all()) {
        if (!ring.has(colKey(chunkOf(ent.pos.x), chunkOf(ent.pos.z)))) continue; // 2D x/z cull (union ring)
        list.push({ id: ent.id, kindId: ent.kind.id, name: ent.name, x: ent.pos.x, y: ent.pos.y, z: ent.pos.z, yaw: ent.yaw, pitch: ent.pitch, vx: ent.vel.x, vy: ent.vel.y, vz: ent.vel.z, flags: (ent.inWater ? 1 : 0) | (ent.onGround ? 2 : 0) });
      }
      this.transport.send(id, { type: 'state', tick: this.worldTime.tick, entities: list });
    }
  }
```

**Step 4: Run test to verify it passes.** Run: `npx vitest run src/__tests__/net-host.test.ts`
Expected: PASS.

**Step 5: Commit.** Run: `git add src/net/host.ts src/__tests__/net-host.test.ts && git commit -m "net: host broadcastState sends the union-ring superset"`

---

## Task 5: Client governor + `activeRadius` + `radius` reporting

**Files:**
- Modify: `src/net/client.ts`
- Modify: `src/__tests__/net-client.test.ts`

**Step 1: Write the failing test.** In `src/__tests__/net-client.test.ts`, add a test inside the `describe('ClientSession', ...)`:

```ts
  it('noteFrame drives the client activeRadius and reports it to the host', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: false });
    const client = new ClientSession(hub.connect('client'), 'me', new HumanController(new Set()));
    const welcomed = new Promise<void>((res) => { client.on('welcome', () => res()); });
    for (let t = 0; t < 10; t++) { host.tick(t); client.tick(t); hub.pump(t); }
    await welcomed;
    // load the client's full radius-2 ring (125 chunks) so ringFull is true
    for (let dx = -2; dx <= 2; dx++)
      for (let dz = -2; dz <= 2; dz++)
        for (let cy = 0; cy <= 4; cy++)
          client.world.ensureChunk(dx, cy, 2 + dz);
    let r = 2;
    for (let i = 0; i < 100; i++) { r = client.noteFrame(1); hub.pump(0); } // light frames + full ring → grow
    expect(r).toBeGreaterThan(2); // the governor grew the client's radius
    const peer = host.anchors().find((a) => !a.meshable);
    expect(peer!.radius).toBe(r); // the host's data ring uses the client's reported radius
  });
```

**Step 2: Run test to verify it fails.** Run: `npx vitest run src/__tests__/net-client.test.ts`
Expected: FAIL — `client.noteFrame` is not a function.

**Step 3: Implement.** In `src/net/client.ts`:
- Imports: add `type EntityRecord` to the entity import, `type NetEntity` to the messages import, and import the governor:
```ts
import { Sim, NULL_INTENT, stepEntity, type Controller, type Intent, type Vec3, type EntityRecord } from '../entity';
import { type Msg, type CellWrite, type NetEntity, PROTOCOL_VERSION, NET_INTERP_TICKS, PREDICT_BUFFER, NET_SNAP_EPS, SNAP_SMOOTH_FRAMES } from './messages';
import { ViewRadiusGovernor } from '../view-radius';
```
- Add fields (near `activeRadius` is not present yet — add both):
```ts
  private governor = new ViewRadiusGovernor(); // the client's own view radius governor (driven by the frame loop)
  activeRadius = VIEW_RADIUS; // the client's own governed view radius (drives the local streaming ring + the local cull)
```
- In `tick()`, change the anchor to use `this.activeRadius` (drop the `VIEW_RADIUS` literal):
```ts
    const u = streamUpdate(this.world, this.pending, [{ cx: pcx, cz: pcz, cy: pcy, radius: this.activeRadius, meshable: true }], STEP);
```
- Add the `noteFrame` method (near `tick`):
```ts
  /** The frame loop feeds the client's own governor once per frame. The client's "ring full" is its
   *  own streaming ring being fully loaded. On a radius change, reports it to the host so the host's
   *  data ring (and broadcast) can grow to serve it. Returns the (possibly changed) radius. */
  noteFrame(workMs: number): number {
    const r = this.governor.noteFrame(workMs, this.world.count() >= targetChunks(this.activeRadius));
    if (r !== this.activeRadius) { this.activeRadius = r; this.transport.send('all', { type: 'radius', radius: r }); }
    return this.activeRadius;
  }
```
- Import `targetChunks` from `../view-radius` (extend the governor import): `import { ViewRadiusGovernor, targetChunks } from '../view-radius';`
- In the `welcome` handler, report the initial radius once (so the host's data ring is correct from the start):
```ts
      this.joined = true;
      this.transport.send('all', { type: 'radius', radius: this.activeRadius }); // report the initial radius to the host
```

**Step 4: Run test to verify it passes.** Run: `npx vitest run src/__tests__/net-client.test.ts`
Expected: PASS.

**Step 5: Commit.** Run: `git add src/net/client.ts src/__tests__/net-client.test.ts && git commit -m "net: client ViewRadiusGovernor + activeRadius + radius reporting"`

---

## Task 6: Client local pose-cull

**Files:**
- Modify: `src/net/client.ts`
- Modify: `src/__tests__/net-client.test.ts`

**Step 1: Write the failing test.** In `src/__tests__/net-client.test.ts`, add two tests inside the `describe`:

```ts
  it('the client culls entity poses to its own activeRadius (discards out-of-range)', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.entityId = 7;
    client.sim.restoreEntity(entityRec(7), NULL_CTRL); // the own body at (0,0,0) → anchor (0,0)
    client.tick(0);
    client.onMessage({ type: 'state', tick: 0, entities: [netEnt(10, 16), netEnt(11, 48)] });
    expect(client.sim.entities.has(10), 'the in-range entity (chunk 1,0) is kept').toBe(true);
    expect(client.sim.entities.has(11), 'the out-of-range entity (chunk 3,0) is discarded').toBe(false);
  });

  it('the client despawns an entity that moves out of its own activeRadius', () => {
    const client = new ClientSession(new LoopbackHub().connect('client'), 'me', new HumanController(new Set()));
    client.entityId = 7;
    client.sim.restoreEntity(entityRec(7), NULL_CTRL); // the own body at (0,0,0) → anchor (0,0)
    client.tick(0);
    client.onMessage({ type: 'state', tick: 0, entities: [netEnt(10, 16)] }); // in range (chunk 1,0)
    expect(client.sim.entities.has(10)).toBe(true);
    client.onMessage({ type: 'state', tick: 3, entities: [netEnt(10, 48)] }); // moves out of range (chunk 3,0)
    expect(client.sim.entities.has(10), 'the entity is despawned when it moves out of range').toBe(false);
  });
```

**Step 2: Run test to verify it fails.** Run: `npx vitest run src/__tests__/net-client.test.ts`
Expected: FAIL — the out-of-range entity is kept (no cull yet).

**Step 3: Implement.** In `src/net/client.ts`:
- Add an `ownAnchor()` helper and a `toRecord()` helper (near the `state` handler):
```ts
  /** The client's own anchor (chunk coords) for the local cull: the own body's chunk, or the spawn
   *  chunk before the first state. */
  private ownAnchor(): { cx: number; cz: number } {
    const v = this.sim.viewed();
    return v ? { cx: chunkOf(v.pos.x), cz: chunkOf(v.pos.z) } : { cx: chunkOf(this.own.x), cz: chunkOf(this.own.z) };
  }

  /** Build an EntityRecord from a wire pose, for re-adding an entity that came back in range. */
  private toRecord(n: NetEntity): EntityRecord {
    return { id: n.id, kindId: n.kindId, x: n.x, y: n.y, z: n.z, vx: n.vx, vy: n.vy, vz: n.vz, yaw: n.yaw, pitch: n.pitch, fly: false, noclip: false, controllerKind: 'script' };
  }
```
- In the `state` handler, replace the entity loop with the culling version:
```ts
    case 'state': {
      const a = this.ownAnchor();
      for (const n of msg.entities) {
        if (Math.abs(chunkOf(n.x) - a.cx) > this.activeRadius || Math.abs(chunkOf(n.z) - a.cz) > this.activeRadius) {
          if (this.sim.entities.has(n.id)) { this.sim.despawn(n.id); this.rings.delete(n.id); } // out of range: drop it
          continue;
        }
        let ring = this.rings.get(n.id);
        if (!ring) { ring = new PoseRing(); this.rings.set(n.id, ring); }
        ring.push({ x: n.x, y: n.y, z: n.z, yaw: n.yaw, pitch: n.pitch, t: msg.tick });
        const ent = this.sim.entities.get(n.id);
        if (ent) { ent.pos = { x: n.x, y: n.y, z: n.z }; ent.yaw = n.yaw; ent.pitch = n.pitch; ent.inWater = (n.flags & 1) !== 0; ent.onGround = (n.flags & 2) !== 0; }
        else this.sim.restoreEntity(this.toRecord(n), NULL_CTRL); // came back in range: re-add it
      }
      break;
    }
```
- In the `spawn` handler, cull out-of-range spawns (so a far spawn is not added then immediately despawned):
```ts
    case 'spawn': {
      const a = this.ownAnchor();
      if (Math.abs(chunkOf(msg.x) - a.cx) > this.activeRadius || Math.abs(chunkOf(msg.z) - a.cz) > this.activeRadius) break; // out of range: ignore
      const ent = this.sim.spawn({ x: msg.x, y: msg.y, z: msg.z }, NULL_CTRL, { kindId: msg.kindId, name: msg.name, yaw: msg.yaw, pitch: msg.pitch });
      this.rings.set(ent.id, new PoseRing());
      break;
    }
```

**Step 4: Run test to verify it passes.** Run: `npx vitest run src/__tests__/net-client.test.ts`
Expected: PASS.

**Step 5: Commit.** Run: `git add src/net/client.ts src/__tests__/net-client.test.ts && git commit -m "net: client local pose-cull against its own activeRadius"`

---

## Task 7: `main.ts` frame-loop governor hook for MP

**Files:**
- Modify: `src/main.ts`

**Step 1: Implement.** In `src/main.ts`, replace the single-player-only governor hook:
```ts
  if (!mpSession && !profMode) { // single-player game only
    const workMs = performance.now() - frameT0;
    const ringFull = world.count() >= targetChunks(governor.radius);
    streaming.setActiveRadius(governor.noteFrame(workMs, ringFull));
    (window as unknown as { __viewRadius?: number }).__viewRadius = governor.radius;
  }
```
with the MP/SP branch:
```ts
  if (!profMode) {
    const workMs = performance.now() - frameT0;
    if (mpSession) {
      mpSession.noteFrame(workMs); // the MP session's own governor (host or client)
      (window as unknown as { __viewRadius?: number }).__viewRadius = mpSession.activeRadius;
    } else {
      const ringFull = world.count() >= targetChunks(governor.radius);
      streaming.setActiveRadius(governor.noteFrame(workMs, ringFull));
      (window as unknown as { __viewRadius?: number }).__viewRadius = governor.radius;
    }
  }
```
(`mpSession` is `HostSession | ClientSession | null`; both now expose `noteFrame(workMs)` and `activeRadius`.)

**Step 2: Typecheck.** Run: `npx tsc --noEmit`
Expected: no errors. (No unit test — `main.ts` is the browser entry; the e2e in Task 8 covers it.)

**Step 3: Commit.** Run: `git add src/main.ts && git commit -m "main: drive the MP session's governor in the frame loop"`

---

## Task 8: e2e 2-client MP governor smoke

**Files:**
- Create: `tests/e2e/view-radius-mp.spec.ts`

**Step 1: Write the test.** Create `tests/e2e/view-radius-mp.spec.ts`:
```ts
// Adaptive view radius (MP) e2e smoke (spec 2026-09-17-adaptive-view-radius-mp-design.md).
// Two tabs over the real trystero transport (?host / ?join): the host + the client each run their
// own governor (main.ts drives mpSession.noteFrame). Reads window.__viewRadius (set every frame)
// and asserts the governor is wired in MP: it starts at 2 and stays within [2,4]. The deeper
// behaviors (independent radii, union data ring, local cull) are unit-tested in net-host/client.
import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:4173/';

const radiusMax = (page: Page) =>
  page.evaluate(() => new Promise<number>((resolve) => {
    let m = 0;
    const t0 = performance.now();
    const poll = (): void => {
      m = Math.max(m, (window as { __viewRadius?: number }).__viewRadius ?? 0);
      if (performance.now() - t0 < 8_000) requestAnimationFrame(poll);
      else resolve(m);
    };
    poll();
  }));

test('MP: the host + client governors are wired (start at 2, stay within [2,4])', async ({ browser }) => {
  const code = 'bw' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  const hostCtx = await browser.newContext(); const clientCtx = await browser.newContext();
  const host = await hostCtx.newPage(); const client = await clientCtx.newPage();
  const hostReady = host.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  const clientReady = client.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  const hostNav = host.goto(`${BASE}?host=${code}&name=Blue4402`);
  const clientNav = client.goto(`${BASE}?join=${code}&name=Red777`);
  await Promise.all([hostNav, clientNav, hostReady, clientReady]);
  // the handshake: the client sees the host's player
  await client.waitForFunction(() => {
    const l = (window as { __lobby?: { remotePlayers: () => unknown[] } }).__lobby;
    return !!l && l.remotePlayers().length >= 1;
  }, undefined, { timeout: 90_000 });
  const hFirst = await host.evaluate(() => (window as { __viewRadius?: number }).__viewRadius);
  const cFirst = await client.evaluate(() => (window as { __viewRadius?: number }).__viewRadius);
  expect(hFirst).toBe(2); // the host's governor starts at 2
  expect(cFirst).toBe(2); // the client's governor starts at 2
  const hMax = await radiusMax(host);
  const cMax = await radiusMax(client);
  console.log('MP VIEW-RADIUS host max: ' + hMax + ', client max: ' + cMax);
  expect(hMax).toBeGreaterThanOrEqual(2);
  expect(hMax).toBeLessThanOrEqual(4);
  expect(cMax).toBeGreaterThanOrEqual(2);
  expect(cMax).toBeLessThanOrEqual(4);
  await clientCtx.close(); await hostCtx.close();
}, 180_000);
```

**Step 2: Run the e2e test.** Run: `npx playwright test tests/e2e/view-radius-mp.spec.ts`
Expected: PASS (the governor is wired in MP; both start at 2 and stay within [2,4]).

**Step 3: Commit.** Run: `git add tests/e2e/view-radius-mp.spec.ts && git commit -m "e2e: MP adaptive view radius governor smoke (2-client)"`

---

## Final verification

Run the full suite to confirm nothing regressed:
- `npx tsc --noEmit` — no type errors.
- `npx vitest run` — all unit tests pass (the 5 `protocol: 1` host tests now use `PROTOCOL_VERSION`).
- `npx playwright test` — all e2e tests pass (including the new `view-radius-mp.spec.ts`).
