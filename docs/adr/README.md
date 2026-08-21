# Architecture Decision Records

One ADR per system. Each records the decision, the context that forced it, the
alternatives considered, and the consequences — distilled from the feature specs
and plans that preceded it (those were removed on 2026-08-20; the originals remain
recoverable via git history at pre-restructure `main`, `0cf878c`).

| # | ADR | One line |
|---|-----|----------|
| [0001](0001-project-foundation.md) | Project foundation & tooling | Vite + strict-TS + vitest stack, the gate suite, POC boundaries, gh-pages deploy |
| [0002](0002-world-model-terrain.md) | World model & terrain | 16³ chunk store, cross-seam get/set, seeded terrain, measured spawn, streaming |
| [0003](0003-meshing-rendering.md) | Chunk meshing & rendering | two-buffer mesher, baked per-vertex AO, canvas atlas, shared unlit materials |
| [0004](0004-player-interaction.md) | Player & interaction | AABB bisection physics, pointer-lock YXZ camera, DDA raycast break/place |
| [0005](0005-water-simulation.md) | Water simulation | level/source/stream cellular automaton, seven-round evolution, settle rules |
| [0006](0006-water-rendering.md) | Water rendering | per-level graded surfaces (`wlevel/8`), skirt faces at level steps |
| [0007](0007-dynamic-lighting.md) | Dynamic lighting | two 0–15 light fields, pop/relaxation propagation, dayness shader pass |
| [0008](0008-sky-day-night.md) | Sky & day/night | `WorldTime`, keyframed sky sampler, dome/stars/sun-moon, world-locked clouds |
| [0009](0009-special-blocks.md) | Special blocks | per-cell `meta`, torch/door partial geometry, state-dependent solidity |
| [0010](0010-ui-inventory.md) | UI & inventory | data-only hotbar, scrollable palette, H-toggled help overlay |

## Conventions

- An ADR is a **decision record**, not a spec or a plan: it states what was decided,
  why, what was rejected, and what it costs. Step-by-step build content, gate logs,
  and manual checklists deliberately do not live here.
- **New work:** feature specs/plans continue to be written under `docs/superpowers/`
  as working documents. When a project merges, its decisions are distilled into the
  relevant ADR(s) — creating a new one if a new system appears — and the working docs
  are superseded.
- **House style:** no reference engine is named (the euphemisms are "the reference
  engine" / "typical voxel engines"); pinned constants and numbers are kept verbatim.
- Open follow-ups are tracked in [`TODO.md`](../TODO.md); each ADR's Consequences
  section points at the items it owns.