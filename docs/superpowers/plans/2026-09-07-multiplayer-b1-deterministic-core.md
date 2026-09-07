# Plan: multiplayer — phase B1: host + client render (deterministic core, loopback-in-browser)

**Spec:** `docs/superpowers/specs/2026-09-07-multiplayer-b1-deterministic-core-design.md`
**Branch:** `multiplayer` (continue the phase-A commit chain)
**Build check (ALWAYS, pipe masks the exit code):** `npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log`
**Node test:** `npx vitest run src/__tests__/<file>.test.ts`
**E2E:** `npx playwright test tests/e2e/<file>.spec.ts` (webServer on 4173)
**Known flaky (ignore for gating):** `src/__tests__/remesh-perf.test.ts` (`maxRatio <= 1.25`).

## Objective

Wire the `main.ts` production render path to drive a `HostSession` (`?mp=host`) and a
`ClientSession` (`?mp=client`) over an in-page `LoopbackHub`, so the host renders its
authoritative world + the bot clients' remote players, and the client renders its
pristine-terrain world + host-fed `cells` + the other players' interpolated rigs + its own
interpolated body (immediate look). Verified by two headless Playwright specs reading a
`window.__mpResult` report + node tests for the pure interpolation math. Single-player is
byte-for-byte untouched (the pins protect it).

## Locked design decisions (from spec + user)

1. **Additive mode-branch** in `main.ts` (`[POC shortcut]`); single-player untouched. The
   `LocalSession` unification is B2 pre-work.
2. **WorldTime wire format = full snapshot.** `time` + `welcome` carry
   `{ time, tick, phaseTotal }` (a `WorldTime.snapshot()`). The host advances its clock per
   tick; the client slews `time`+`phaseTotal` from the messages (its `tick` stays per-frame for
   the `worldTime.tick − NET_INTERP_TICKS` render delay). No protocol bump (still v1).
3. **Streaming consumption = consume `lastStream` only.** Each session stores the last
   substep's `StreamingUpdate` as `lastStream`; the frame consumes it once per frame (light
   load/unload + `deferredFirstMesh`). Lagging frames defer a chunk's first mesh by one frame —
   `[POC shortcut]`, B2 accumulates. The frame's single-player `tickStreaming()` is **skipped**
   for host/client (the session's per-substep streaming supersedes it).
4. **`?mp` wins** over `?replay`/`?prof` (mutually exclusive; the replay/prof boot branches are
   skipped when `?mp` is present). `?phase`/`?dbg` still apply.
5. **`?mp=host&bots=N`** (default `bots=2`): host + N loopback `ScriptController` bot clients.
   **`?mp=client&bots=N`** (default `bots=1`): client + an in-page headless `HostSession`
   (`withOwnPlayer: false`, N bot "other players") over the same `LoopbackHub`.
6. **Persist injection now.** `HostSession` takes `opts.persist?: Persistence` (default
   `new Persistence(new InMemoryChunkStore(), seed)`). `?mp=host` + single-player pass the real
   `Persistence`; the `?mp=client` headless host uses the in-memory default (must not touch the
   client page's IndexedDB).
7. **Client runs its own `LightClient`** on its world; on a `cells` batch the client calls
   `lightSim.edit()` on the affected chunks.
8. **Interpolation** `NET_INTERP_TICKS = 6`, pure module `src/net/interp.ts` (a `PoseRing` of 8
   per entity + `interpose(samples, renderTick)`): bracketing pair, hold-last on gap,
   shortest-arc yaw. Node-tested first.
9. **Client look vs. body.** Camera yaw/pitch come straight from the human controller
   (immediate); only the own body's position is interpolated.
10. **Headless host is simulation-only** (`?mp=client`): the frame loop's light worker +
    re-mesh drain operate on the client's world (the page's session), so the headless host's
    world is never meshed/lit. The e2e asserts the client's meshed/lit chunk count is bounded to
    the client's ring (the headless host contributes 0).
11. **Name tags:** one `THREE.Sprite` per entity id (above the rig); texture cached by name,
    sprite keyed by entity id.
12. **Leave handling:** loopback peer disconnect → host `despawn` → `syncEntityRigs` cleanup
    removes the rig + name tag. `?mp=client` host-side leave → the client shows "host left" and
    stops driving the session (static view of the last-received world).

## Pinned constants

`NET_STATE_STRIDE 3`, `TIME_STRIDE 60`, `NET_REMOTE_RADIUS 1`, `CELLS_FULL_THRESHOLD 512`,
`PROTOCOL_VERSION 1`, `VIEW_RADIUS 2`, `CY_MIN 0` / `CY_MAX 4`, `TERRAIN_SEED 1234`, `STEP 1/60`,
`WATER_STRIDE 30`, `WATER_PULSE 1000`, `DAY_LENGTH 240`. **New: `NET_INTERP_TICKS 6`**,
**interpolation ring `INTERP_RING = 8`**.

## File map (what changes)

- `src/time.ts` — add `advanceClock(dt)` + `slew(snapshot)`.
- `src/net/messages.ts` — `time`/`welcome` carry `{time,tick,phaseTotal}`; add `NET_INTERP_TICKS`.
- `src/net/host.ts` — persist injection, worldTime → `WorldTime` instance + clock advance,
  `lastStream`, `opts.hooks`.
- `src/net/client.ts` — worldTime instance, `slew`, per-entity `PoseRing`, `syncPoses()`,
  `lastStream`, `lightEdit` on `cells`, `get worldTime`.
- `src/net/interp.ts` — **new** pure module (`PoseSample`, `PoseRing`, `interpose`).
- `src/main.ts` — `?mp` parse, mode branch (boot + frame loop), module globals → `let` +
  reassign, light-worker recreation, `consumeStream` extraction, name tags, `__mpResult`.
- `src/__tests__/net-interp.test.ts` — **new** node tests (interp math).
- `src/__tests__/net-host.test.ts` / `net-client.test.ts` — extend for persist/worldTime/lastStream/syncPoses.
- `tests/e2e/mp-host.spec.ts` / `mp-client.spec.ts` — **new** Playwright specs.

---

## Task 1 — `WorldTime.advanceClock` + `slew` + wire-format change

**Files:** `src/time.ts`, `src/net/messages.ts`, `src/net/host.ts`, `src/net/client.ts`,
`src/__tests__/net-messages.test.ts` (new).

### Step 1 — `src/time.ts`: add two methods (after `advance`, ~line 47)

`advanceClock(dt)` advances `time` + `phaseTotal` but NOT `tick` (the host sets `tick` from the
frame loop). `slew(s)` sets `time` + `phaseTotal` from a snapshot, keeping `tick` (the client
keeps its own tick for the render delay).

```ts
  /** Advance the simulation clock + daylight cycle WITHOUT the tick (the host sets `tick` from the frame loop; the client keeps its own tick for the render delay). */
  advanceClock(dt: number): void {
    this.time += dt;
    this.phaseTotal += dt / DAY_LENGTH;
  }

  /** Slew the clock from a host snapshot (set `time` + `phaseTotal`, keep `tick`). The client keeps its own tick so the `worldTime.tick − NET_INTERP_TICKS` render delay stays meaningful. */
  slew(s: { time: number; phaseTotal: number }): void {
    this.time = s.time;
    this.phaseTotal = s.phaseTotal;
  }
```

### Step 2 — `src/net/messages.ts`: full-snapshot wire format + `NET_INTERP_TICKS`

Add the constant (after `TIME_STRIDE`, ~line 14) and change the `time`/`welcome` `worldTime`
fields to a snapshot. Define a `WorldTimeSnapshot` type.

```ts
export const NET_INTERP_TICKS = 6; // the render reads the pose 6 substeps (100 ms) behind the host tick

/** A host world-time snapshot on the wire (a `WorldTime.snapshot()`): `time` (s) + `tick` + `phaseTotal` (cycles). */
export interface WorldTimeSnapshot { time: number; tick: number; phaseTotal: number }
```

Change the two message variants:

```ts
  | { type: 'welcome'; seed: number; tick: number; worldTime: WorldTimeSnapshot; yourEntityId: number; snapshot: ReplaySnapshot }
  // ...
  | { type: 'time'; tick: number; worldTime: WorldTimeSnapshot };
```

### Step 3 — `src/net/host.ts`: worldTime → `WorldTime` instance + clock advance + snapshot

Import `WorldTime` (from `../time`) + `DAY_LENGTH`. Replace the plain-object `worldTime` field
(line 32) with a `WorldTime` instance:

```ts
  worldTime = new WorldTime(); // the host's authoritative clock (advanced per tick; the client slews from it)
```

In `tick` (~line 197), set the tick from the frame loop + advance the clock (replacing
`this.worldTime.tick = tick;` at line 200):

```ts
    this.worldTime.tick = tick;
    this.worldTime.advanceClock(STEP); // advance time + phaseTotal (the frame loop owns the tick)
```

In `onHello` (line 103) + the `time` broadcast (line 209), carry the snapshot:

```ts
    this.transport.send(from, { type: 'welcome', seed: this.seed, tick: this.worldTime.tick, worldTime: this.worldTime.snapshot(), yourEntityId: id, snapshot: this.welcomeSnapshot() });
```

```ts
    if (tick % TIME_STRIDE === 0) this.broadcast({ type: 'time', tick: this.worldTime.tick, worldTime: this.worldTime.snapshot() });
```

In `metaSnapshot` (line 124) + `onPeerLeave` (line 145), use `snapshot()`:

```ts
      time: this.worldTime.snapshot(),
```

### Step 4 — `src/net/client.ts`: consume the snapshot (slew)

The `time` handler (line 83) slews the clock. The client's `worldTime` is introduced in
**Task 4** (a `WorldTime` instance); for now, store the snapshot + slew when the instance
exists. Add a `private clock = { time: 0, phaseTotal: 0 };` field and slew it:

```ts
      case 'time': this.clock = { time: msg.worldTime.time, phaseTotal: msg.worldTime.phaseTotal }; break;
```

(Replaced by a real `WorldTime.slew` in Task 4; this keeps the message shape exercised now.)

### Step 5 — Node test `src/__tests__/net-messages.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { WorldTime } from '../time';
import { PROTOCOL_VERSION } from '../net/messages';
import type { Msg, WorldTimeSnapshot } from '../net/messages';

describe('world-time wire format (B1)', () => {
  it('advanceClock advances time+phaseTotal, not tick', () => {
    const w = new WorldTime();
    w.advanceClock(240); // one full day
    expect(w.tick).toBe(0);
    expect(w.time).toBeCloseTo(240);
    expect(w.dayPhase).toBeCloseTo(0);
    expect(w.day).toBe(2);
  });
  it('slew sets time+phaseTotal, keeps tick', () => {
    const w = new WorldTime();
    w.advance(60); // tick 60
    const s: WorldTimeSnapshot = { time: 999, tick: 5000, phaseTotal: 0.25 };
    w.slew(s);
    expect(w.tick).toBe(60); // kept
    expect(w.time).toBe(999);
    expect(w.dayPhase).toBeCloseTo(0.25);
  });
  it('PROTOCOL_VERSION is still 1 (no bump)', () => { expect(PROTOCOL_VERSION).toBe(1); });
});
```

### Step 6 — verify + commit

Run the node test + the net suite + build. Then commit `feat(net): B1 world-time wire format (full snapshot) + advanceClock/slew`.

```
npx vitest run src/__tests__/net-messages.test.ts src/__tests__/net-host.test.ts src/__tests__/net-client.test.ts
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "feat(net): B1 world-time wire format (full snapshot) + advanceClock/slew"
```

---

## Task 2 — `HostSession` B1 prep: persist injection + `opts.hooks` + `lastStream`

**Files:** `src/net/host.ts`, `src/__tests__/net-host.test.ts`.

### Step 1 — `src/net/host.ts`: persist injection + hooks + lastStream

Extend `HostOpts` (line 18) + the constructor. Add `lastStream` (the last substep's
`StreamingUpdate`). Import `StreamingUpdate` (type) from `../streaming`.

```ts
export interface HostOpts { withOwnPlayer?: boolean; persist?: Persistence; hooks?: ApplyHooks }
```

In the constructor (~line 38), use the injected persist + hooks:

```ts
    this.persist = opts.persist ?? new Persistence(new InMemoryChunkStore(), seed);
    this.sim = new Sim(this.world, opts.hooks ?? {}, seed);
```

Add the `lastStream` field (near `meshable`, line 31):

```ts
  lastStream: StreamingUpdate | null = null; // the last substep's streaming result (the frame consumes it once per frame)
```

In `tick` (~line 202), store `lastStream` (replacing the `this.meshable = r.meshable;` block):

```ts
    const anchors = this.anchors();
    if (anchors.length) {
      const r = streamUpdate(this.world, anchors, this.persist, this.sim);
      this.meshable = r.meshable;
      this.lastStream = r; // [B1] the frame consumes it once per frame (consumeStream)
    } else {
      this.lastStream = null;
    }
```

Import `ApplyHooks` (type) from `../entity`.

### Step 2 — Node test `src/__tests__/net-host.test.ts` (extend)

Add a describe block: the injected persist is used (a cell edit persists to the injected store),
`lastStream` is set after a `tick` (the host streams), and the clock advances (`worldTime.time`
> 0 after a tick). Reuse the existing `LoopbackHub` harness pattern in the file.

```ts
  it('B1: persist is injected + lastStream is set + clock advances', () => {
    const store = new InMemoryChunkStore();
    const persist = new Persistence(store, 1234);
    const host = new HostSession(transport, 1234, { persist });
    host.tick(0); host.tick(1);
    expect(host.worldTime.time).toBeGreaterThan(0); // the clock advanced
    expect(host.lastStream).not.toBeNull(); // the host streams (the spawn column ring)
    expect(persist).toBeInstanceOf(Persistence); // the injected persist is used
  });
```

### Step 3 — verify + commit

```
npx vitest run src/__tests__/net-host.test.ts
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "feat(net): HostSession B1 prep (persist injection + hooks + lastStream)"
```

---

## Task 3 — `src/net/interp.ts` (pure) + node tests

**Files:** `src/net/interp.ts` (new), `src/__tests__/net-interp.test.ts` (new).

### Step 1 — `src/net/interp.ts`

A pure module (no three.js, no DOM — node-testable). `PoseSample` is a host-tick-tagged pose;
`PoseRing` is a fixed ring of 8 (per entity); `interpose` picks the bracketing pair at
`renderTick`, linearly interpolates, holds the last pose on a gap, and interpolates yaw by
shortest arc.

```ts
// Interpolation (B1): the client buffers a ring of host-tick-tagged poses per entity and
// renders the pose at renderTick = worldTime.tick - NET_INTERP_TICKS. Pure math (node-tested);
// the e2e verifies wiring (rigs land where the math says), not the math.
export const INTERP_RING = 8; // the per-entity jitter-buffer size

export interface PoseSample {
  tick: number; // the host tick (state.tick / time.tick)
  x: number; y: number; z: number;
  yaw: number; pitch: number;
}

/** A fixed ring of `n` pose samples, oldest evicted first. `push` appends (evicting the
 * oldest when full); `samples` returns them in tick order (oldest → newest). */
export class PoseRing {
  private buf: PoseSample[] = [];
  constructor(private readonly n: number = INTERP_RING) {}
  push(s: PoseSample): void {
    this.buf.push(s);
    if (this.buf.length > this.n) this.buf.shift();
  }
  get samples(): readonly PoseSample[] { return this.buf; }
  clear(): void { this.buf = []; }
}

/** Angle lerp by shortest arc (a 350°→10° turn sweeps through 0°, not 180°). */
export function lerpAngle(a: number, b: number, t: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The interpolated pose at `renderTick`. Picks the bracketing pair (s0.tick <= renderTick <=
 * s1.tick) in the tick-ordered samples and lerps. If no pair brackets (renderTick before the
 * first or after the last, or a gap), holds the nearest available pose (the last before
 * renderTick, or the first after). Yaw lerps by shortest arc. */
export function interpose(samples: readonly PoseSample[], renderTick: number): PoseSample {
  if (samples.length === 0) return { tick: renderTick, x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
  if (samples.length === 1) return samples[0]!;
  // renderTick before the first sample → hold the first.
  if (renderTick <= samples[0]!.tick) return samples[0]!;
  // renderTick at/after the last sample → hold the last.
  const last = samples[samples.length - 1]!;
  if (renderTick >= last.tick) return last;
  // Find the bracketing pair (the first s1 with s1.tick >= renderTick; s0 is its predecessor).
  for (let i = 1; i < samples.length; i++) {
    const s1 = samples[i]!;
    if (s1.tick >= renderTick) {
      const s0 = samples[i - 1]!;
      if (s1.tick === s0.tick) return s1; // duplicate ticks (shouldn't happen; be safe)
      const t = (renderTick - s0.tick) / (s1.tick - s0.tick);
      return { tick: renderTick, x: lerp(s0.x, s1.x, t), y: lerp(s0.y, s1.y, t), z: lerp(s0.z, s1.z, t), yaw: lerpAngle(s0.yaw, s1.yaw, t), pitch: lerp(s0.pitch, s1.pitch, t) };
    }
  }
  return last; // unreachable (renderTick < last.tick handled above)
}
```

### Step 2 — Node test `src/__tests__/net-interp.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { interpose, PoseRing, lerpAngle, INTERP_RING } from '../net/interp';
import type { PoseSample } from '../net/interp';

const s = (tick: number, x: number, yaw = 0): PoseSample => ({ tick, x, y: 0, z: 0, yaw, pitch: 0 });

describe('net-interp (B1 pure math)', () => {
  it('lerps between the bracketing pair at renderTick', () => {
    const p = interpose([s(0, 0), s(10, 10)], 5);
    expect(p.x).toBeCloseTo(5);
  });
  it('holds the first when renderTick is before the first sample', () => {
    expect(interpose([s(0, 0), s(10, 10)], -5).x).toBe(0);
    expect(interpose([s(0, 0), s(10, 10)], 0).x).toBe(0);
  });
  it('holds the last when renderTick is at/after the last sample', () => {
    expect(interpose([s(0, 0), s(10, 10)], 10).x).toBe(10);
    expect(interpose([s(0, 0), s(10, 10)], 20).x).toBe(10);
  });
  it('holds the last pose before renderTick on a gap (no bracketing pair)', () => {
    // samples at tick 0 and 20; renderTick 10 is a gap → hold the pose before (tick 0).
    const p = interpose([s(0, 1), s(20, 99)], 10);
    expect(p.x).toBe(1);
  });
  it('yaw lerps by shortest arc across the ±π seam', () => {
    // 350° → 10° (in radians): the short way is through 0° (360°), not through 180°.
    const a = (350 * Math.PI) / 180, b = (10 * Math.PI) / 180;
    const mid = lerpAngle(a, b, 0.5);
    expect(mid).toBeCloseTo(0); // halfway is ~0° (through the seam), not ~180°
  });
  it('a 6-tick render delay lands between the two expected samples', () => {
    // The host broadcasts every NET_STATE_STRIDE=3 ticks; the render reads 6 behind. With
    // samples at 0..30 (stride 3) and renderTick 24, the bracketing pair is (21, 24).
    const samples: PoseSample[] = [];
    for (let t = 0; t <= 30; t += 3) samples.push(s(t, t));
    const p = interpose(samples, 24);
    expect(p.x).toBeCloseTo(24);
  });
  it('PoseRing evicts the oldest beyond its size', () => {
    const r = new PoseRing(4);
    for (let t = 0; t < 8; t++) r.push(s(t, t));
    expect(r.samples.length).toBe(4);
    expect(r.samples[0]!.tick).toBe(4); // the oldest (0..3) evicted
  });
  it('INTERP_RING is 8', () => { expect(INTERP_RING).toBe(8); });
});
```

### Step 3 — verify + commit

```
npx vitest run src/__tests__/net-interp.test.ts
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "feat(net): B1 pure interpolation module (interp.ts) + node tests"
```

---

## Task 4 — `ClientSession` B1 prep: worldTime + PoseRing + `syncPoses` + `lastStream` + light edit on `cells`

**Files:** `src/net/client.ts`, `src/__tests__/net-client.test.ts`.

### Step 1 — `src/net/client.ts`: worldTime instance + per-entity rings + syncPoses + lastStream + light edit

Import `WorldTime` (from `../time`), `PoseRing`/`interpose`/`PoseSample` (from `./interp`),
`StreamingUpdate` (type, from `../streaming`), `NET_INTERP_TICKS` (from `./messages`).

Replace the `private clock` (Task 4 supersedes Task 1's stub) with a real `WorldTime` + a
per-entity `PoseRing` map. Add `lastStream` + a `lightEdit` callback (the main.ts boot sets it
to call the page's `lightSim.edit`).

```ts
  readonly worldTime = new WorldTime(); // the client's clock: tick per frame, time+phaseTotal sleet from the host's `time`
  lastStream: StreamingUpdate | null = null; // the last substep's own-ring streaming result (the frame consumes it)
  private rings = new Map<number, PoseRing>(); // per-entity jitter buffer (host-tick-tagged poses)
  private lightEdit: ((x: number, y: number, z: number) => void) | null = null; // set by the boot (the page's lightSim.edit)
```

Add a setter for the light-edit callback (the boot wires it):

```ts
  setLightEdit(fn: (x: number, y: number, z: number) => void): void { this.lightEdit = fn; }
```

In the `welcome` handler (line 59), slew the clock from the welcome's snapshot:

```ts
        this.worldTime.slew(msg.worldTime); // adopt the host's clock (time + phaseTotal)
        this.worldTime.tick = msg.tick; // the host tick at welcome
```

In the `state` handler (line 73), buffer the samples in the per-entity ring (in addition to the
immediate `ent.pos` set, which the `syncPoses` supersedes per frame):

```ts
      case 'state':
        for (const n of msg.entities) {
          if (n.id === this.entityId) this.own = { x: n.x, y: n.y, z: n.z, yaw: n.yaw, pitch: n.pitch };
          let ring = this.rings.get(n.id);
          if (!ring) { ring = new PoseRing(); this.rings.set(n.id, ring); }
          ring.push({ tick: msg.tick, x: n.x, y: n.y, z: n.z, yaw: n.yaw, pitch: n.pitch });
          const ent = this.sim.entities.get(n.id);
          if (ent) { ent.pos = { x: n.x, y: n.y, z: n.z }; ent.yaw = n.yaw; ent.pitch = n.pitch; }
        }
        break;
```

In the `time` handler (line 83), slew the clock (replacing Task 1's stub):

```ts
      case 'time': this.worldTime.slew(msg.worldTime); break; // the client keeps its own tick (the frame loop owns it)
```

In `applyCells` (line 88), call the light edit on the affected chunk's cells:

```ts
  private applyCells(key: string, writes: CellWrite[]): void {
    const [cx, cy, cz] = this.parse(key);
    const c = this.world.getChunk(cx, cy, cz);
    if (!c) return;
    for (const [idx, block, meta, l, s, p, st] of writes) {
      c.blocks[idx] = block; c.meta[idx] = meta;
      c.wlevel[idx] = l; c.wsource[idx] = s; c.wplaced[idx] = p; c.wstream[idx] = st;
      if (this.lightEdit) this.lightEdit(cx * 16 + (idx % 16), cy * 16 + ((idx / 16) % 4), cz * 16 + Math.floor(idx / 64)); // the client's light tracks the host's edits
    }
  }
```

In the `despawn` handler (line 82), clear the ring:

```ts
      case 'despawn': this.sim.despawn(msg.id); this.rings.delete(msg.id); break;
```

In `tick` (line 107), set `lastStream`:

```ts
    const r = streamUpdate(this.world, [anchor], this.persist, this.sim);
    this.lastStream = r; // [B1] the frame consumes it once per frame (consumeStream)
```

Add `syncPoses` (the frame calls it once per frame, after the substep): interpolate each entity's
pose at `renderTick = worldTime.tick − NET_INTERP_TICKS` and write it to the sim entity.

```ts
  /** The frame calls this once per frame (after the substep): interpolate each entity's pose at
   * renderTick = worldTime.tick − NET_INTERP_TICKS and write it to the sim (so the rig + camera
   * use the interpolated pose). The own body's position is interpolated; its look is
   * client-owned (the camera's yaw/pitch come from the human controller, not this). */
  syncPoses(): void {
    const renderTick = this.worldTime.tick - NET_INTERP_TICKS;
    for (const [id, ring] of this.rings) {
      const ent = this.sim.entities.get(id);
      if (!ent) continue;
      const p = interpose(ring.samples, renderTick);
      ent.pos = { x: p.x, y: p.y, z: p.z }; ent.yaw = p.yaw; ent.pitch = p.pitch;
    }
  }
```

### Step 2 — Node test `src/__tests__/net-client.test.ts` (extend)

Add a describe block: the worldTime slews from a `time` message (time+phaseTotal set, tick kept);
`syncPoses` writes the interpolated pose (a ring with two samples, renderTick between them → the
lerped pose); `lastStream` is set after a `tick`. Reuse the existing `LoopbackHub` +
`ClientSession` harness pattern in the file.

```ts
  it('B1: worldTime slews from a time message (tick kept)', () => {
    const client = new ClientSession(transport, 'test', ctrl);
    client.worldTime.advance(30); // tick 30
    client.onMessage({ type: 'time', tick: 5000, worldTime: { time: 42, tick: 5000, phaseTotal: 0.25 } });
    expect(client.worldTime.tick).toBe(30); // kept (the frame loop owns the tick)
    expect(client.worldTime.time).toBe(42);
    expect(client.worldTime.dayPhase).toBeCloseTo(0.25);
  });
  it('B1: syncPoses writes the interpolated pose at renderTick', () => {
    const client = new ClientSession(transport, 'test', ctrl);
    client.worldTime.tick = 20; // renderTick = 20 - 6 = 14
    // seed the ring for entity 7 (the host tick-tagged samples)
    const ring = client['rings'].get(7) ?? new PoseRing();
    ring.push({ tick: 12, x: 0, y: 0, z: 0, yaw: 0, pitch: 0 });
    ring.push({ tick: 18, x: 6, y: 0, z: 0, yaw: 0, pitch: 0 });
    client['rings'].set(7, ring);
    const ent = client.sim.entities.get(7); // (the harness must have a container entity 7; if not, restoreEntity one)
    client.syncPoses();
    // renderTick 14 is between 12 and 18 → lerp at t=(14-12)/(18-12)=1/3 → x=2
    if (ent) expect(ent.pos.x).toBeCloseTo(2);
  });
  it('B1: lastStream is set after a tick', () => {
    const client = new ClientSession(transport, 'test', ctrl);
    client.tick(0);
    expect(client.lastStream).not.toBeNull();
  });
```

> Note: the `syncPoses` test needs a container entity in `client.sim` (the harness must
> `restoreEntity` or the welcome must seed one). Adjust to the file's existing harness pattern
> (it likely already seeds a welcome + entities). If entity 7 is absent, seed it via
> `client.sim.restoreEntity({ id: 7, kindId: 'player', ... }, NULL_CTRL)`.

### Step 3 — verify + commit

```
npx vitest run src/__tests__/net-client.test.ts
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "feat(net): ClientSession B1 prep (worldTime slew + PoseRing + syncPoses + lastStream + light edit)"
```

---

## Task 5 — `main.ts` boot + mode: parse `?mp`, create the session, reassign globals, recreate the light worker, spawn the bots

**Files:** `src/main.ts`.

This is the biggest task. It makes the module globals `let`, parses `?mp`, creates the
session + the in-page `LoopbackHub` + the bot clients (or the headless host), reassigns the
globals to the session's objects, and recreates the light worker for the session's world +
worldTime. `?mp` wins over `?replay`/`?prof`.

### Step 1 — `src/main.ts`: module globals → `let`

Change the `const` world-state globals to `let` (so the boot can reassign them for host/client):

- `const worldTime = new WorldTime(startPhase);` → `let worldTime = new WorldTime(startPhase);` (line 240)
- `const world = new World();` → `let world = new World();` (line 259)
- `const waterSim = new WaterSim(world);` → `let waterSim: WaterSim | null = new WaterSim(world);` (line 269)
- `const lightSim = new LightClient(world, worldTime);` → `let lightSim: LightClient;` (line 275) — reassigned in the boot
- `const sim = new Sim(world, simHooks, TERRAIN_SEED);` → `let sim: Sim;` (line 287) — reassigned in the boot

Keep the `window.__lightDebug = lightSim` + `window.__persistDebug = persist` lines (they reference
the reassigned values; move them after the boot reassignment if needed).

> Guard the `simHooks` closures for a null `waterSim` (the client has none): `waterEdit: (x,y,z,block) => { waterSim?.edit(x,y,z,block); }` and `springTarget: (x,y,z) => waterSim ? waterSim.cellState(x,y,z).p === 1 : false`.

### Step 2 — `src/main.ts`: parse `?mp` + the mode

After the `phaseParam`/`profMode` parse (~line 239), parse `?mp`:

```ts
// ?mp=host|client dev/e2e (B1): drive the render path with a HostSession / ClientSession over an
// in-page LoopbackHub. ?mp wins over ?replay/?prof (mutually exclusive). ?phase/?dbg still apply.
const mpMode = new URLSearchParams(location.search).get('mp'); // 'host' | 'client' | null
const mpBots = mpMode ? Math.max(1, parseInt(new URLSearchParams(location.search).get('bots') ?? (mpMode === 'host' ? '2' : '1'), 10) || (mpMode === 'host' ? 2 : 1)) : 0;
const mpActive = mpMode === 'host' || mpMode === 'client';
```

### Step 3 — `src/main.ts`: the `startGame` `?mp` branch

In `startGame` (~line 347), BEFORE the replay/prof branches, add the `?mp` branch (it wins). It
creates the session + the `LoopbackHub` + the bots (or the headless host), reassigns the globals,
recreates the light worker, and kicks the frame loop.

```ts
  // === multiplayer (B1) ===
  // ?mp wins over ?replay/?prof. The session is created + the module globals are reassigned to the
  // session's objects so the whole render path (light, re-mesh, syncCamera, syncEntityRigs) runs
  // unchanged against the session's world/sim. The light worker is recreated for the session's
  // world + worldTime.
  if (mpActive) {
    const hub = new LoopbackHub();
    const hostTransport = new LoopbackTransport(hub, 'host');
    let session: HostSession | ClientSession;
    if (mpMode === 'host') {
      // The host renders its authoritative world + the bot clients' remote players. The bots use a
      // ScriptController with a ScriptStep[] (a list of walkTo steps, repeated) so they move.
      session = new HostSession(hostTransport, TERRAIN_SEED, { withOwnPlayer: true, persist, hooks: simHooks });
      const host = session as HostSession;
      const botSteps: ScriptStep[] = [
        { op: 'walkTo', x: 8, z: 48, timeout: 120 },
        { op: 'walkTo', x: 12, z: 44, timeout: 120 },
        { op: 'walkTo', x: 6, z: 50, timeout: 120 },
        { op: 'wait', ticks: 60 },
      ];
      for (let i = 0; i < mpBots; i++) {
        const c = new ClientSession(new LoopbackTransport(hub, `bot${i}`), `bot${i}`, new ScriptController(botSteps, true));
        c.setLightEdit(() => { /* the bot clients are remote (no page light); no-op */ });
      }
      world = host.world; sim = host.sim; waterSim = host.waterSim; worldTime = host.worldTime;
    } else {
      // The client renders its pristine-terrain world + host-fed cells + the other players'
      // interpolated rigs + its own body. The in-page headless host is simulation-only.
      const headless = new HostSession(new LoopbackTransport(hub, 'headless'), TERRAIN_SEED, { withOwnPlayer: false });
      const otherSteps: ScriptStep[] = [
        { op: 'walkTo', x: 8, z: 48, timeout: 120 },
        { op: 'walkTo', x: 12, z: 44, timeout: 120 },
        { op: 'wait', ticks: 60 },
      ];
      for (let i = 0; i < mpBots; i++) {
        new ClientSession(new LoopbackTransport(hub, `other${i}`), `other${i}`, new ScriptController(otherSteps, true));
      }
      const name = 'me';
      session = new ClientSession(new LoopbackTransport(hub, name), name, human); // the client's own body is driven by the page's HumanController (immediate look + movement)
      const client = session as ClientSession;
      client.setLightEdit((x, y, z) => { lightSim?.edit(x, y, z); });
      world = client.world; sim = client.sim; waterSim = null; worldTime = client.worldTime;
    }
    lightSim = new LightClient(world, worldTime); // the page's light worker runs on the session's world
    window.__lightDebug = lightSim;
    // The frame loop drives session.tick(worldTime.tick) per substep + hub.pump per substep.
    mpSession = session; // a module-level ref the frame loop uses (declared below)
    mpHub = hub;
    syncCamera();
    requestAnimationFrame(frame);
    return;
  }
```

Add the module-level refs (near the other module globals, ~line 330):

```ts
import { LoopbackHub, LoopbackTransport } from './net/transport';
import { HostSession } from './net/host';
import { ClientSession } from './net/client';
import { ScriptController, type ScriptStep } from './entity';
let mpSession: HostSession | ClientSession | null = null; // the B1 session (the frame loop drives it)
let mpHub: LoopbackHub | null = null; // the B1 in-page LoopbackHub (the frame loop pumps it)
```

> The bot clients use a `ScriptController` wrapping a `MobController` (a wander AI) so they move.
> The `ScriptController`'s `intent` is fed by the `MobController`'s wander (the bot's own body is
> driven by the host's sim; the `ScriptController` reports the intent). Adjust the
> `ScriptController`/`MobController` wiring to the existing `src/entity.ts` API (the `ScriptController`
> takes a base controller + an initial yaw; its `intent` delegates to the base).

### Step 4 — verify the boot (manual)

Build + a manual `?mp=host` / `?mp=client` check (the page boots without crashing, the world
renders, the bots appear). No e2e yet (Task 13).

```
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
```

### Step 5 — commit

```
git add -A && git commit -m "feat(main): B1 ?mp boot (mode branch + session + global reassign + light worker + bots)"
```

---

## Task 6 — `main.ts` frame loop mode branch

**Files:** `src/main.ts`.

Make the frame loop mode-aware: the substep drives `mpSession.tick(worldTime.tick)` (host/client)
or `sim.tick + worldTime.advance` (single-player); the `?mp` substep also pumps the `LoopbackHub`;
the water pulse is skipped for the client (no `waterSim`); the single-player `tickStreaming()` is
skipped for host/client (the session's streaming supersedes it — the frame consumes
`mpSession.lastStream` via `consumeStream`, Task 7).

### Step 1 — `src/main.ts`: the substep mode branch

In the `frame` substep loop (~line 1215), branch on `mpSession`:

```ts
  while (acc >= STEP) {
    acc -= STEP;
    if (playback && playback.paused) continue;
    if (mpSession) {
      mpSession.tick(worldTime.tick); // the session drives the sim (host) or the intent (client); it advances the host's clock (the client's tick is the frame loop's)
      mpHub?.pump(worldTime.tick); // deliver the in-page loopback messages
    } else {
      sim.tick(STEP, worldTime.tick); // the single-player sim heartbeat
      worldTime.advance(STEP);
    }
    if (playback) {
      sim.setViewed(viewedAt(playback.replay, worldTime.tick));
      if (worldTime.tick >= playback.replay.endTick) playback.paused = true;
    }
  }
```

> For the host, `mpSession.tick` advances `worldTime` (the host's `WorldTime` is the frame loop's
> `worldTime`, reassigned at boot). For the client, `mpSession.tick` does NOT advance
> `worldTime` (the client's tick is the frame loop's; the frame loop does NOT call
> `worldTime.advance` for the client — the client's `time`+`phaseTotal` are sleet from the host's
> `time` messages). So the frame loop's `worldTime.advance(STEP)` is single-player-only.

### Step 2 — `src/main.ts`: the water pulse + tickStreaming mode branch

After the substep loop (~line 1227), branch the water pulse + streaming:

```ts
  if (mpSession) {
    if (mpSession instanceof HostSession && waterSim) {
      if (tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)) waterSim.tick(WATER_PULSE); // the host's water heartbeat
    }
    // the client has no waterSim (water arrives via cells) → no water pulse
    const r = (mpSession as HostSession | ClientSession).lastStream;
    if (r) consumeStream(r); // the session's per-substep streaming (Task 7); the frame consumes it once per frame
  } else {
    tickStreaming(); // the single-player's per-frame streaming (compat form + consumeStream)
    if (tickCrossed(tickBefore, worldTime.tick, WATER_STRIDE)) waterSim!.tick(WATER_PULSE);
  }
```

> The host's `waterSim` is the page's `waterSim` (reassigned at boot to the host's `WaterSim`). The
> client's `waterSim` is `null`. So the water pulse runs for the host, not the client.

### Step 3 — verify + commit

```
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "feat(main): B1 frame-loop mode branch (session.tick + hub.pump + water/streaming skip)"
```

---

## Task 7 — `main.ts` `consumeStream` extraction (from `tickStreaming`)

**Files:** `src/main.ts`.

Extract the mesh-adjacent work (light load/unload, `deferredFirstMesh`, water settle/restore,
deer spawn, pending fetch) from `tickStreaming` into a `consumeStream(r: StreamingUpdate)`
function. `tickStreaming` (single-player) = `streaming.update(...) + consumeStream(r)`. The frame
loop, for host/client, calls `consumeStream(mpSession.lastStream)` (Task 6).

### Step 1 — `src/main.ts`: read the current `tickStreaming` (line ~1087)

Read the full `tickStreaming` function to capture the exact mesh-adjacent work (the unloads, the
light load/unload, the water settle/restore, the deer spawn, the `deferredFirstMesh`, the pending
fetch). (The prior summary noted it does: unloads → `removeChunkMesh` + `lightSim.unload` +
despawn deer; `rebuilt` → `waterSim.settle` + `lightSim.load` + `deferredFirstMesh.add`;
`generated` → `spawnDeer`; `restored` → `waterSim.restore` + `lightSim.load` + `deferredFirstMesh.add`;
`pending` → async `persist.fetchRecord` + apply.)

### Step 2 — `src/main.ts`: extract `consumeStream(r)`

Create `consumeStream(r: StreamingUpdate): void` with the mesh-adjacent work (the body of
`tickStreaming` after the `streaming.update` call). Guard the water work for a null `waterSim`
(the client): `if (waterSim) waterSim.settle(...)`. Gate the deer spawn to the host (the client
doesn't spawn deer — they come from the host): `if (mpSession instanceof HostSession) ...`.
Rewrite `tickStreaming` to call `streaming.update(...)` then `consumeStream(r)`.

```ts
/** The mesh-adjacent work for a streaming result: light load/unload, deferred first mesh, water
 * settle/restore (host), deer spawn (host), pending fetch. The single-player's tickStreaming and
 * the B1 frame loop (host/client) both consume a StreamingUpdate via this. */
function consumeStream(r: StreamingUpdate): void {
  // (the extracted body: unloads / rebuilt / generated / restored / pending — with the
  //  waterSim?. guards + the HostSession-gated deer spawn)
}

function tickStreaming(): void {
  const ve = sim.viewed();
  if (!ve) return;
  const r = streaming.update(world, { cx: chunkOf(ve.pos.x), cz: chunkOf(ve.pos.z), cy: chunkOf(ve.pos.y), radius: VIEW_RADIUS, meshable: true }, playback ? noopPersist : persist, sim);
  consumeStream(r);
}
```

> Adjust `consumeStream`'s body to the EXACT current `tickStreaming` code (read it first). The
> key guards: `waterSim?.settle` / `waterSim?.restore` (the client has none); the deer spawn is
> `if (mpSession instanceof HostSession)`.

### Step 3 — verify + commit

```
npx vitest run src/__tests__/streaming.test.ts
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "feat(main): B1 consumeStream extraction (mesh-adjacent work, shared by single-player + host/client)"
```

---

## Task 8 — Host render: remote players via `syncEntityRigs` (verify)

**Files:** `src/main.ts` (likely no change).

`syncEntityRigs` (main.ts:497) already renders every `sim.all()` entity (the ADR 0016 box-part
rig) and hides the viewed entity. For the host, the bot clients' entities are in `sim.all()`
(the host's sim spawns them on `hello`). So the remote players appear for free. **Verify** the
host's `sim.all()` includes the bot clients' entities (the `simHooks` don't block it). No change
expected — this task is a verification + a comment.

### Step 1 — verify (manual `?mp=host`)

Boot `?mp=host&bots=2` and confirm the 2 bot players' rigs appear + move (their intents are
applied by the host's sim). The host's own player is the viewed entity (hidden, first person).

### Step 2 — commit (if any change)

```
git add -A && git commit -m "feat(main): B1 host render (remote players via syncEntityRigs — verified)"
```

---

## Task 9 — Client render: own-body camera + immediate look + interpolation wiring

**Files:** `src/main.ts`.

For the client, the camera follows the own body's interpolated position (the `syncPoses` writes
the own entity's pose) with an immediate look (the camera's yaw/pitch come from the human
controller, not the interpolated pose). The frame loop calls `mpSession.syncPoses()` (client) once
per frame (after the substep, before `syncCamera`).

### Step 1 — `src/main.ts`: call `syncPoses` + the immediate look

In the `frame` loop, after the substep + before `syncCamera` (~line 1316), call the client's
`syncPoses` + set the camera's look from the human controller:

```ts
  if (mpSession instanceof ClientSession) {
    mpSession.syncPoses(); // interpolate the entities' poses at renderTick (the own body's position)
    const ve = sim.viewed(); // the client's own body
    if (ve) {
      camera.position.set(ve.pos.x, ve.pos.y + ve.kind.eye, ve.pos.z); // the interpolated position
      const look = human.getLook(); // the page's HumanController's immediate look (the live mouse)
      camera.rotation.set(look.pitch, look.yaw, 0);
    }
  } else {
    syncCamera(); // the host + single-player (the camera follows the viewed entity's pose)
  }
```

> The client's controller is the page's `HumanController` (`human`), which exposes `getLook()`
> (the live mouse look). So the immediate look is `human.getLook()`. The `syncCamera` is skipped
> for the client (the immediate look + interpolated position replace it). The client's own
> body's orientation follows the mouse live (the immediate look).

### Step 2 — verify (manual `?mp=client`)

Boot `?mp=client&bots=1` and confirm the own-body camera follows the interpolated position + the
look is immediate (the mouse). The other player's rig appears + moves (interpolated).

### Step 3 — commit

```
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "feat(main): B1 client render (own-body camera + immediate look + syncPoses wiring)"
```

---

## Task 10 — Name tags (sprite per entity id, texture by name)

**Files:** `src/main.ts`.

A name tag is one `THREE.Sprite` per **entity id** (positioned above the rig). The tag's texture
(a small canvas with the name) is **cached by name** (many "Louis"es share one texture) but the
sprite is **keyed by entity id** (two "Louis"es don't share one tag). The tags are added/updated
in `syncEntityRigs` (alongside the rigs) and removed on despawn.

### Step 1 — `src/main.ts`: the name-tag texture cache + the tag map

Add a texture cache (by name) + a tag map (by entity id) near `syncEntityRigs` (~line 492):

```ts
const tagTextureCache = new Map<string, THREE.CanvasTexture>(); // name → texture (shared by name)
const nameTags = new Map<number, THREE.Sprite>(); // entity id → sprite (keyed by id)

function tagTexture(name: string): THREE.CanvasTexture {
  let t = tagTextureCache.get(name);
  if (!t) {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d')!; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#fff'; ctx.fillText(name, 128, 32);
    t = new THREE.CanvasTexture(canvas);
    tagTextureCache.set(name, t);
  }
  return t;
}
```

### Step 2 — `src/main.ts`: the tag name lookup + the tag update in `syncEntityRigs`

The tag's name is the entity's name. For the host, the remote players' names are the bot names
(`bot0`, `bot1`, ...); for the client, the other players' names are the bot names (`other0`, ...).
The name is stored on the entity (the host's `sim` stores the name on the remote player's entity;
the client's `sim` stores the name on the remote player's entity). **Add a `name` field to the
entity** (the host's `onHello` sets it; the client's `welcome`/`spawn` sets it).

In `syncEntityRigs` (after the rig update, ~line 513), add/update the tag:

```ts
    // Name tag (B1): one sprite per entity id, positioned above the rig; the texture is cached by name.
    const name = e.name; // the entity's name (set by the host's onHello / the client's welcome)
    if (name) {
      let tag = nameTags.get(e.id);
      if (!tag) {
        tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTexture(name), depthTest: false }));
        tag.scale.set(1.6, 0.4, 1);
        scene.add(tag);
        nameTags.set(e.id, tag);
      }
      tag.position.set(e.pos.x, e.pos.y + 1.8, e.pos.z); // above the rig
      tag.visible = e.id !== sim.viewedId; // hide the viewed entity's tag (first person)
    }
```

In the despawn cleanup (line 515), remove the tag:

```ts
  for (const [id, entry] of rigs) if (!seen.has(id)) {
    scene.remove(entry.rig.root); rigs.delete(id);
    const tag = nameTags.get(id);
    if (tag) { scene.remove(tag); tag.material.map?.dispose(); nameTags.delete(id); }
  }
```

> The entity's `name` field: the `Entity` type (src/entity.ts:53) has NO `name` field today.
> **Add `name?: string` to the `Entity` interface** (and to the `Sim.spawn` opts + `toRecord` if
> needed). The host's `onHello` sets `e.name = name` (the bot's name) on the spawned/restored
> entity. The client's `welcome`/`spawn`/`state` sets `ent.name = ...` (the other players' names
> — the host's `state`/`spawn` must carry the name; add a `name` field to `NetEntity`). The own
> body's name is hidden (the viewed entity's tag is hidden).
>
> **`NetEntity` name:** add `name?: string` to the `NetEntity` interface (src/net/messages.ts) +
> the host's `broadcastState` carries `name: ent.name`. The client's `state` handler sets
> `ent.name = n.name`. The `spawn` handler sets `ent.name` from the `EntityRecord` (add `name` to
> the `spawn` message's `pose` or a separate field).

### Step 3 — verify + commit

```
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "feat(main): B1 name tags (sprite per entity id, texture cached by name)"
```

---

## Task 11 — Leave handling: "host left" static view + rig/tag cleanup

**Files:** `src/main.ts`.

A loopback peer disconnects → `Transport.onPeerLeave` → the host `despawn`s the entity →
`syncEntityRigs` cleanup removes the rig + name tag (Task 10). `?mp=client` host-side leave → the
client shows "host left" and stops driving the session (static view of the last-received world).

### Step 1 — `src/main.ts`: the "host left" handler

The client's `Transport` fires `onPeerLeave` when the headless host disconnects. In the boot
(`?mp=client` branch), register a `onPeerLeave` handler on the client's transport that shows
"host left" + stops driving the session:

```ts
      // The client's transport: when the headless host leaves, show "host left" + stop driving.
      (session as ClientSession).transport.onPeerLeave((id) => {
        if (id === 'headless') {
          mpSession = null; // stop driving the session (the frame loop falls back to a static view)
          document.body.classList.add('mp-host-left'); // the "host left" overlay (a simple CSS class)
          const el = document.createElement('div'); el.className = 'mp-host-left-msg'; el.textContent = 'host left';
          document.body.appendChild(el);
        }
      });
```

> The `ClientSession.transport` is `private`. Expose a `onPeerLeave` registration method on the
> `ClientSession` (or make the transport accessible). Add a `ClientSession.onPeerLeave(cb)` method
> that registers on the transport.

### Step 2 — verify + commit

```
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "feat(main): B1 leave handling (host left static view + rig/tag cleanup)"
```

---

## Task 12 — `?mp=` scenario + `__mpResult` report

**Files:** `src/main.ts`.

Add the `?mp=host` / `?mp=client` scenario report (`window.__mpResult`), mirroring `?prof=remesh`.
The report is emitted after ~N ticks (e.g., 300 ticks = 5 s) and includes the rig count, the
remote players' positions, the interpolation (the own body's camera position), the leave
(disconnect a bot + assert the rig is removed), and the headless host's meshed/lit chunk count.

### Step 1 — `src/main.ts`: the `__mpResult` report

In the `frame` loop, when `mpActive` + `worldTime.tick >= 300`, emit the `__mpResult` report:

```ts
  if (mpActive && worldTime.tick >= 300 && !(window as any).__mpResult) {
    const rep: Record<string, unknown> = { mode: mpMode, tick: worldTime.tick, bots: mpBots };
    if (mpMode === 'host') {
      // The bot clients' remote-player rigs are present + move (their positions track their intents).
      rep.rigCount = rigs.size; // the number of rigs in the scene (the host's remote players)
      rep.remotePlayers = sim.all().filter((e) => e.kind.id === 'player' && e.id !== sim.viewedId).map((e) => ({ id: e.id, x: e.pos.x, y: e.pos.y, z: e.pos.z, moved: e.pos.x !== e.homeX || e.pos.z !== e.homeZ }));
      // Editing a cell on the host is reflected in the host's world.
      const testCell = { x: 10, y: 40, z: 10 };
      world.setBlock(testCell.x, testCell.y, testCell.z, Block.Planks);
      rep.editReflected = world.getBlock(testCell.x, testCell.y, testCell.z) === Block.Planks;
    } else {
      // The other players' rigs are present + move (interpolated); the own-body camera follows the
      // interpolated position with an immediate look; the headless host's meshed/lit chunk count is
      // bounded to the client's ring (the headless host contributes 0).
      rep.rigCount = rigs.size;
      rep.otherPlayers = sim.all().filter((e) => e.kind.id === 'player' && e.id !== sim.viewedId).map((e) => ({ id: e.id, x: e.pos.x, y: e.pos.y, z: e.pos.z }));
      const ve = sim.viewed();
      rep.camera = ve ? { x: ve.pos.x, y: ve.pos.y, z: ve.pos.z } : null; // the own body's interpolated position
      rep.clientMeshedChunks = chunkObjs.size; // the client's meshed chunk count (bounded to the client's ring)
      rep.headlessHostMeshedChunks = 0; // the headless host is simulation-only (never meshed/lit)
    }
    (window as any).__mpResult = rep;
    console.log('MP-RESULT ' + JSON.stringify(rep));
  }
```

> The `e.homeX` / `e.homeZ` fields (the entity's home position) may not exist. Use a simpler
> "moved" check: record the entity's position at tick 100 + compare at tick 300. Adjust to the
> existing `Entity` API. The `chunkObjs.size` is the client's meshed chunk count (the `chunkObjs`
> map, main.ts:538). The `headlessHostMeshedChunks` is 0 (the headless host's world is never
> meshed/lit — it's not the frame loop's world).

### Step 2 — verify + commit

```
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "feat(main): B1 ?mp scenario + __mpResult report"
```

---

## Task 13 — E2E specs (`mp-host`, `mp-client`)

**Files:** `tests/e2e/mp-host.spec.ts` (new), `tests/e2e/mp-client.spec.ts` (new).

Two Playwright specs hit `?mp=host` / `?mp=client`, let the production loop run ~300 ticks, read
`window.__mpResult`, and assert the Gate B1 criteria. Mirror the `?prof=remesh` e2e pattern
(`tests/e2e/remesh-prof.spec.ts`).

### Step 1 — `tests/e2e/mp-host.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('mp-host: bot remote-player rigs present + move + edit reflected', async ({ page }) => {
  await page.goto('/?mp=host&bots=2');
  const result = await page.waitForFunction(() => (window as any).__mpResult, undefined, { timeout: 30000 });
  const rep = await result.jsonValue();
  expect(rep.mode).toBe('host');
  expect(rep.rigCount).toBeGreaterThanOrEqual(2); // the 2 bot clients' rigs are present
  expect(rep.remotePlayers.length).toBe(2);
  for (const p of rep.remotePlayers) expect(p.moved).toBe(true); // their positions track their intents
  expect(rep.editReflected).toBe(true); // editing a cell on the host is reflected
});
```

### Step 2 — `tests/e2e/mp-client.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('mp-client: other-players' rigs present + move (interpolated) + camera + headless-host no-mesh + leave', async ({ page }) => {
  await page.goto('/?mp=client&bots=1');
  const result = await page.waitForFunction(() => (window as any).__mpResult, undefined, { timeout: 30000 });
  const rep = await result.jsonValue();
  expect(rep.mode).toBe('client');
  expect(rep.rigCount).toBeGreaterThanOrEqual(1); // the other player's rig is present
  expect(rep.otherPlayers.length).toBe(1);
  expect(rep.camera).not.toBeNull(); // the own-body camera follows the interpolated position
  expect(rep.clientMeshedChunks).toBeLessThanOrEqual(125); // bounded to the client's ring (VIEW_RADIUS 2 → 5x5x5 = 125)
  expect(rep.headlessHostMeshedChunks).toBe(0); // the headless host contributes 0 (simulation-only)
  // Leave: a bot disconnect → its rig + tag are removed. (The __mpResult includes a leave check:
  // the bot disconnects at tick 250, and the rig count at tick 300 reflects the removal.)
  expect(rep.leaveRigRemoved).toBe(true); // the bot's rig + tag are removed on disconnect
});
```

> The `leaveRigRemoved` check: the `?mp=client` scenario disconnects a bot at tick 250 (via the
> headless host's `Transport.disconnect`), and the `__mpResult` at tick 300 asserts the bot's rig
> + tag are removed (the `rigCount` reflects the removal). Add the bot disconnect + the
> `leaveRigRemoved` field to the `__mpResult` report (Task 12).

### Step 3 — verify + commit

```
npx playwright test tests/e2e/mp-host.spec.ts tests/e2e/mp-client.spec.ts
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
git add -A && git commit -m "test(e2e): B1 mp-host + mp-client specs (Gate B1)"
```

---

## Task 14 — Regression: `npm test` + `npm run build` green, no single-player pin regresses

**Files:** (none, or fixes).

Run the full node suite + the build. Confirm the single-player pins (the `remesh-perf` + the
other e2e pins) are green (the additive branch leaves single-player byte-for-byte untouched).
The known flaky `remesh-perf` is ignored for gating.

### Step 1 — run the full suite + build

```
npx vitest run 2>&1 | tail -40
npm run build > /tmp/build.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/build.log
npx playwright test 2>&1 | tail -40
```

### Step 2 — fix any regressions + commit

If any single-player pin regresses, fix it (the additive branch must not touch single-player).
Then commit the fixes.

```
git add -A && git commit -m "test: B1 regression (full suite + build green, no single-player pin regresses)"
```

---

## Final: ADR 0019 + docs

After the 14 tasks are green, write **ADR 0019 — Transport & lobby** (covers B1 + B2; B1 lands
first) + update `README.md` + `PROJECT.md` (§ multi-player). Commit:

```
git add -A && git commit -m "docs: ADR 0019 (Transport & lobby, B1 landed) + README + PROJECT.md"
```