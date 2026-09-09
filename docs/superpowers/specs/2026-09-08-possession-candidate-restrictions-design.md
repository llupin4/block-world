# Spec: restrict P-possession candidates (no other players / player-owned entities)

Status: design (2026-09-08). Follow-up to ADR 0016 (mobs, possession, spectator) and the
multiplayer B1/B2/Phase C work. This is a small input-rule change, not a possession protocol
change.

## Goal

Make `P` stop offering other players and player-owned entities as possession targets, while
keeping single-player creature possession (deer, future mobs) available.

The motivation is that multiplayer possession of remote players is not host-authoritative:
a client can locally attach the human controller to another player's entity, but the host
still applies that client's intents to the client's own body. Until possession becomes a real
game-design feature, it should not be possible to accidentally possess another player.

## Current behavior

`onPossess()` in `src/main.ts` builds candidates as:

```ts
sim.all().filter((x) => x.id !== ve.id && x.id !== sim.ghostId)
```

then ray-picks one and calls `possessToggle(sim, human, targetId | null)`.

This allows targeting:

- other player entities (remote players, bots, the host's own body in some modes),
- entities that are already locally controlled by the human controller,
- deer/creatures.

The last is desired. The first two are not.

## Desired behavior

`P` may target only entities that are:

1. not the currently viewed entity,
2. not the spectator ghost,
3. not a player entity, except the local home body,
4. not currently controlled by the local human controller.

In practice:

- single-player: deer/creatures remain possessable; the home body and ghost keep the existing
  toggle behavior;
- `?mp=client`: remote player bots and other players are not possessable;
- `?mp=host` / lobby host: other local/player entities are not possessable; creature
  possession remains available where creatures exist;
- if an entity is already `controller === human`, it is not offered as a new target.

## Design

Add a small pure helper in `src/entity.ts`:

```ts
export function possessableCandidates(sim: Sim, human: Controller): Entity[]
```

It returns `sim.all()` filtered by the rules above:

```ts
e.id !== sim.viewedId
&& e.id !== sim.ghostId
&& (e.kind.id !== 'player' || e.id === sim.homeId)
&& e.controller !== human
```

`src/main.ts`'s `onPossess()` uses this helper instead of its local filter:

```ts
const candidates = possessableCandidates(sim, human);
const hit = pickEntity(eyeOf(ve), lookDir(ve.yaw, ve.pitch), candidates, REACH);
possessToggle(sim, human, hit ? candidates[hit.index].id : null);
```

`possessToggle()` remains unchanged:

- if the human is already out of the home body (and not in the ghost), `P` exits possession
  first;
- otherwise, a targeted candidate is possessed;
- otherwise, home toggles to ghost and ghost returns home.

## Error handling / edge cases

- No candidates: `pickEntity` returns null; `possessToggle` handles the no-target case.
- Home body while possessing another entity: `P` still exits first because `possessToggle`
  checks out-of-home before considering the target.
- Home body while in ghost: the home body is still a valid player exception, so aiming at the
  body can return home; no-target `P` also returns home.
- Ghost: never possessable.
- Remote possession by another player: not represented in the local client sim's controller
  state. This design does not solve that; it only avoids the local misfeature of possessing
  other player-kind entities.

## Tests

Add unit tests around `possessableCandidates` in `src/__tests__/entity.test.ts`:

- excludes another player entity (bot/remote player),
- excludes an entity whose `controller === human`,
- includes a deer/creature with a non-human controller,
- includes the home body even though it is player-kind,
- excludes the currently viewed entity,
- excludes the spectator ghost.

Existing possession tests must remain green:

- `possess` / `returnHome` / `spectate`,
- `possessToggle` exits possession first,
- host/client `homeId` regression tests.

## Non-goals

- No host-authoritative possession protocol.
- No networked "possessed by player" flag.
- No changes to how intents are routed for possessed entities.
- No game-design rules for shared creature ownership.
- No changes to replay recording beyond the existing `onViewed` log after `possessToggle`.

## Success criteria

- `P` cannot target another player/bot in multiplayer modes.
- `P` cannot target an entity already locally controlled by the human controller.
- `P` can still target deer/creatures in single-player.
- `P` still exits possession reliably when already out of the home body.
- `npm test` and `npm run build` are green.