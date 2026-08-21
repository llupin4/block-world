# 0010. UI & inventory — a data-only nine-slot hotbar with atlas-crop icons, a scrollable block palette, and an H-toggled help overlay over plain DOM/CSS

- **Status:** Accepted
- **Last updated:** 2026-08-20
- **Sources:** (superseded by this ADR; recoverable via `git show 0cf878c:<path>`)
  - `docs/superpowers/plans/2026-08-15-voxel-sandbox-poc.md` (Task 11 — hotbar + palette)
  - `docs/superpowers/specs/2026-08-16-help-overlay-design.md`
  - `docs/superpowers/plans/2026-08-16-help-overlay.md`
  - `docs/superpowers/specs/2026-08-18-torches-doors-palette-design.md` ("UI: scrollable palette" section)
  - `docs/superpowers/plans/2026-08-18-torches-doors-palette.md` (Task 6 — main.ts visuals)

## Context

The POC needed a way to choose which block to place without leaving first-person view, and the control hints lived in a long one-line `#hint` pinned bottom-left that was hard to read over gameplay. Two constraints shaped the design: the selection model must be **node-testable** (no DOM in the logic), and the whole UI is plain DOM/CSS — no UI framework. The work landed in three steps: the POC hotbar + palette (T11), the help overlay + slot numbers (2026-08-16), and the scrollable named palette (2026-08-18, alongside the torch/door blocks).

## Decision

### Hotbar (`src/ui.ts`)

`Hotbar` is **data-only**: nine slot values, the current selection index, and two optional change callbacks (`onSelectChange`, `onSlotChange`). All DOM lives in `main.ts`, so the class stays node-testable (zero `document` references). Construction pads short default lists with their first slot, trims long ones to nine, and falls back to stone slots when empty. `select(i)` wraps both directions (`((i % 9) + 9) % 9`) and no-ops a repeat select (key mashing / held wheel); `cycle(dir)` moves one slot by sign only; `setSlot(i, b)` writes a slot (wrapping the index). `get block()` returns the selected slot's block — the value RMB placement reads (ADR 0004 — Player & interaction). T8's single-block `selectedBlock` shortcut was retired in favour of `hotbar.block`; the default selection is Planks, preserving the original "RMB places planks" behaviour.

**Icons are atlas crops, not images:** each slot's `background-image` is the whole 256×256 canvas atlas (ADR 0003 — Chunk meshing & rendering) as a data URL, scaled to the slot box with `background-position` offset to the block's top-row tile column (`iconTile(b) % 16`) — the same tile the mesh top face shows, so the icon matches what you place. Nearest filtering keeps the 16px art crisp at 40/44px.

**Selection paths** (all funnel through `hotbar.select`): keys `1`–`9` (top row *and* numpad), the mouse wheel over the canvas (scroll down = next slot, up = previous, both wrap), and the palette. Each of the nine `.slot` divs (pre-placed in `index.html`) shows its select-key `1`–`9` as a tiny corner keycap, injected from `main.ts` — display-only, since `#hotbar` has `pointer-events: none`.

### Palette

`E` toggles an open-creative state. Opening releases pointer lock (crosshair + hitbox hide via the existing `pointerlockchange` handler, which also clears held keys); closing (via `E` or a canvas click) re-requests the lock. Browsers enforce a ~1 s re-lock cooldown after ESC, so the first click right after closing can land on the canvas without re-locking — a second click works (inherent, accepted behaviour).

The palette started as nine static tiles and became a **scrollable, named strip** with the torch/door work: `main.ts` builds one row per `PLACEABLE` entry (registry order) — icon (the existing `placeIcon` atlas crop) + a name label (`BLOCKS[b].name`). CSS: a right-side vertical strip (`position: fixed; top/right: 12px`, flex column, ~176px wide, `max-height: 88vh; overflow-y: auto`, the hotbar's dark translucent panel style). Row click assigns the block into the **currently selected** hotbar slot; the palette stays open so several slots can be filled in one sitting. Rows carrying the selected slot's block show the yellow `.sel` border (a block can appear in multiple slots, so several rows may highlight). Palette slots get no number keycaps (they're clicked, not keyed). `ui.ts` is unchanged throughout — the palette is presentation code in `main.ts`, consistent with how T11 did it (not node-tested, like the other DOM in `main.ts`).

### Help overlay

`H` toggles a centered `#help` panel replacing the removed bottom-left `#hint`: a compact two-column key → action grid (keycaps + labels) covering click/WASD/SPACE/SHIFT/F/N/ESC, `1-9`/wheel, LMB/RMB, `E`, `C`, and `H`, titled `block-world — how to play` with a `H or click to close` footer. Opening shows the panel, exits pointer lock, and hides the badge; closing hides the panel, re-locks (same swallow-the-promise pattern as palette close), and shows the badge. Overlays swap: opening help while the palette is open closes the palette and vice versa (shared `closeOverlay`/state check). A canvas click while open closes help and re-locks. There is no pause — with the lock released the simulation keeps ticking, exactly as with the palette open (the POC has no pause mechanism; a falling player keeps falling while the overlay is up). While open, gameplay keys still work (1-9 selects slots) — harmless and consistent. A small circular `?`/`h` badge (`#help-hint`) sits bottom-right at the hotbar's vertical offset; clicking it opens help (identical to `H`), and it is hidden while any overlay is up.

**Visual conventions:** `ui.css` is the single stylesheet; the app shell is static DOM in `index.html` (`#app`, `#crosshair`, `#hotbar`, `#palette`, `#help`, `#help-hint`, `#clock`). Panels use a dark translucent background (`rgba(10,14,22,.85)`, 10px radius) with `pointer-events: auto` on the panel only, so clicks outside fall through to the canvas. Keycaps (`.key`) are small rounded boxes (`rgba(255,255,255,.12)` fill, 1px brighter border, monospace-ish) reused across the grid, the palette `E`/`H` labels, the badge's `h`, and the hotbar digits.

## Consequences

- The selection model is fully node-testable (`Hotbar` has no DOM), which is why the ui suite runs under vitest; the DOM side in `main.ts` is verified manually, matching the POC's treatment of all `main.ts` UI.
- Known limits: no custom keybindings, no per-slot block counts/stacks (slots hold a single block id), and no pause — overlays release the mouse but the world keeps simulating.