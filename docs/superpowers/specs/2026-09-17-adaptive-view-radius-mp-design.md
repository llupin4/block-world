# Spec: adaptive view radius (multiplayer)

Status: design (2026-09-17). Follow-up to the single-player adaptive view radius
(`2026-09-17-adaptive-view-radius-design.md`, implemented on `feat/adaptive-view-radius`).
Generalizes the per-client frame-time governor to multiplayer: every participant — host included —
is a client with its own independent view radius. The host is the source of truth for world data;
each client culls entities locally against its own radius. Bounded change: one new `radius`
message, a symmetric union data ring in `host.ts`, a local pose-cull in `client.ts`, and the
host's `broadcastState()` switching from per-peer culling to a union-ring superset.

## Goal

Keep the single-player governor (2 → 3 → 4, frame-time driven) working in multiplayer, with:

- **Independent per-client radius.** Each client — host included — runs its own governor off its
  own frame time. No client's radius affects another's.
- **Host serves, client culls.** The host keeps a data ring wide enough to serve every client's
  view (the union of all participants' radii, at each one's own position) and is the source of
  truth for world data. Each client discards entity poses outside *its own* radius, locally.
- **The edge case.** A slow host with a shallow *own* view (radius 2) still serves a far client's
  larger view (radius 4): the host keeps + serves those far chunks as data-only, without meshing
  them.

## Context (established)

- The single-player governor (`src/view-radius.ts`) is a pure, node-testable class; `streaming.ts`
  exposes `activeRadius`/`setActiveRadius`; `main.ts` drives it from the frame loop (single-player
  only, gated `!mpSession && !profMode`).
- The deer-spawn-to-mesh-completion fix (`deerPendingMesh` → `swapChunkMesh` in `main.ts`) is
  host-side and already shipped.
- **Host** (`net/host.ts`) owns the only sim. `anchors()` builds a union ring: its own anchor at
  `SR_VIEW_RADIUS = 2` (meshable) + each peer's anchor at `NET_REMOTE_RADIUS = 1` (data-only).
  `tick()` calls `streaming.update(world, anchors, ...)`; the frame consumes it via
  `consumeStream`. `broadcastState()` culls entity poses to `SR_VIEW_RADIUS = 2` per peer.
  `welcomeSnapshot()` sends the spawn ring at `SR_VIEW_RADIUS`.
- **Client** (`net/client.ts`) has no sim/mob-AI/spawning. It generates its own ring locally
  (shared seed) at `VIEW_RADIUS = 2`, meshes it, and gets water/edits/poses pushed from the host.
  `tick()` streams its own ring and announces `chunkLoaded`/`chunkUnloaded` to the host.
- **Wire** (`net/messages.ts`): `PROTOCOL_VERSION = 1`; `Msg` is a discriminated union; the real
  transport JSON-serializes it (chunk arrays base64). `NET_REMOTE_RADIUS = 1`.

## Design

### Principle

Every participant is a client with an independent view radius. The host is the source of truth for
world data (chunks/cells/poses); it does **not** cull poses per client. Each client culls locally
against its own radius. The host's *data ring* is a separate, larger concern from its *own view*.

### `radius` message (client→host)

```ts
| { type: 'radius'; radius: number }
```

- Sent by each client whenever its `activeRadius` changes, and once on join (in `welcome` handling
  or right after).
- The host stores it per-peer (`Peer.radius`, default `VIEW_RADIUS`). It sizes the host's **data
  ring only** — it is not a cull hint.
- Bump `PROTOCOL_VERSION` to 2 (a new message type is added; old clients won't send it, so the
  host falls back to the default radius for peers that never report — see Edge cases).

### Host — symmetric union data ring

`anchors()` becomes fully symmetric; the host is just another participant:

```ts
private anchors(): Anchor[] {
  const out: Anchor[] = [];
  const own = this.sim.viewed();
  if (own) out.push({ cx: chunkOf(own.pos.x), cz: chunkOf(own.pos.z), cy: chunkOf(own.pos.y),
    radius: this.activeRadius, meshable: true });            // host's own governed radius
  for (const p of this.peers.values()) {
    const e = this.sim.entities.get(p.entityId);
    if (e) out.push({ cx: chunkOf(e.pos.x), cz: chunkOf(e.pos.z), cy: chunkOf(e.pos.y),
      radius: p.radius, meshable: false });                  // each peer's reported radius
  }
  return out;
}
```

- The host's own anchor uses its governed `activeRadius` (meshable) — exactly like any peer.
- Each peer's anchor uses that peer's *reported* `radius` (data-only).
- The host meshes only its own anchor's ring; peer rings are data-only (served via `chunkRec`/
  `cells`). This is the "serve far chunks, don't render them" case.
- The host runs its own `ViewRadiusGovernor` (driven by its own frame time) → its own
  `activeRadius`, mirroring single-player. The host's governor is gated the same way
  (`!profMode`); in MP the host's own view adapts independently of the peers.

### Host — `broadcastState()` sends the union-ring superset

`broadcastState()` stops culling per-peer. It sends every entity whose position falls inside the
**union data ring** (host's radius at host's position ∪ each peer's radius at each peer's
position) to all peers. Each client discards poses outside its own radius locally.

```ts
private broadcastState(): void {
  const ring = this.unionRing();          // the set of (cx, cz) columns in the union data ring
  for (const [id] of this.peers) {
    const list: NetEntity[] = [];
    for (const ent of this.sim.all()) {
      if (!ring.has(colKey(chunkOf(ent.pos.x), chunkOf(ent.pos.z)))) continue; // 2D x/z cull
      list.push({ /* ...NetEntity... */ });
    }
    this.transport.send(id, { type: 'state', tick: this.worldTime.tick, entities: list });
  }
}
```

(The cull is 2D x/z, matching the existing per-peer cull. The exact `unionRing()`/`colKey` helpers
are implementation details; `unionRing()` reuses the same anchor math as `anchors()` so the
broadcast and the data ring never disagree.)

### Client — local pose-cull

The client culls entity poses against its **own** `activeRadius`, locally, using the same radius it
uses for terrain (so deer and ground stay in lockstep):

- In the `state` handler (when poses arrive), discard poses whose (cx, cz) column is outside
  `activeRadius` of the client's own anchor — a 2D x/z cull matching the terrain ring.
- The client runs its own `ViewRadiusGovernor` (driven by its own frame time) → its own
  `activeRadius`, and streams/meshes its own ring at that radius — exactly like single-player.
- The client reports its `activeRadius` to the host via `radius` whenever it changes.

### Unchanged

- `welcome` snapshot (spawn ring at `SR_VIEW_RADIUS`), `cells`/`chunkRec` delivery, the
  `chunkLoaded`/`chunkUnloaded` handshake, prediction/reconciliation of the own body.
- The single-player path (it already reads `activeRadius`).
- The deer-spawn-to-mesh-completion fix (host-side, already shipped).

## Deer in MP

The single-player deer fix carries over with no new MP-specific work:

- **Host:** its deer spawn stays tied to the host's own mesh completion (`deerPendingMesh` →
  `swapChunkMesh`). The host is a client, so this is unchanged.
- **Broadcast:** `sim.onSpawn`/`onDespawn` already broadcast `spawn`/`despawn`; the client
  restores the deer frozen. No change.
- **Client:** the client does not spawn deer — it receives them. The local pose-cull keeps a client
  from rendering a deer outside its own view radius. Because the host broadcasts only the
  union-ring superset and the client culls to its own radius, a client never shows a deer it can't
  see the ground for.

## Edge cases

- **Peer that never reports a radius** (old client, pre-protocol-2): the host uses the default
  `VIEW_RADIUS` for that peer's data ring. The peer culls locally at its own (fixed) radius. No
  crash; just no adaptation for that peer.
- **Host slow + shallow, client far:** the host's own view rests at 2, but a client reporting 4
  makes the host keep + serve that client's radius-4 ring as data-only. The host never meshes it.
- **Two clients, independent radii:** each client's radius is driven by its own frame time; the
  host's data ring is the union, so both are served. Culling is local, so one client's large radius
  never forces the other to render more.
- **Radius change mid-flight:** a `radius` message only resizes the host's data ring on the next
  `anchors()` call (next tick). A client's local cull uses its current `activeRadius` each frame.
  No within-frame feedback.
- **World edge / y-band:** x/z is unbounded (procedural) and the y band is fixed 0..4, so every
  ring fills to its target; the union ring is well-defined everywhere.

## Testing

- **Unit — governor:** already covered (10 tests). No change.
- **Unit — host data ring (`net/host`):** new test — `anchors()` returns the host's governed radius
  for its own anchor and each peer's *reported* radius for peer anchors; verify the union ring
  grows when a peer reports a larger radius and shrinks when it reports a smaller one.
- **Unit — broadcast superset (`net/host`):** new test — `broadcastState()` sends the union-ring
  superset (not per-peer culled); verify a far peer's poses are included for a near peer and
  excluded for a peer outside the union ring.
- **Unit — client local cull (`net/client`):** new test — the client discards poses outside its own
  `activeRadius` and keeps those inside.
- **E2E:** extend `tests/e2e/view-radius.spec.ts` to a 2-client MP session: verify each client's
  radius is independent, the host serves the union ring, and a client culls deer to its own radius.

## Out of scope

- Per-client *terrain* culling on the host (the host still serves the full union data ring; only
  pose broadcast is a superset + client cull).
- A host-side estimate of a client's frame time (the client reports its radius; the host does not
  infer it).
- Chunk-size change (16³ → 32³) — the separate, harder knob from the spike.
