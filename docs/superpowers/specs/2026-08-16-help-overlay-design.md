# Help Overlay (H) + Hotbar Slot Numbers — Design

Date: 2026-08-16 · Post-POC UI polish (follows the T13 "final polish" commit)

## Context

The control hints live in a long one-line `#hint` pinned to the bottom-left
(`src/main.ts` loop section), which is hard to read over gameplay. The user
wants: (1) the help text moved into an overlay opened with `H`, (2) a small
`?` + `h` badge in the lower-right that advertises the overlay and opens it
on click, (3) the hotbar slots labelled with the `1`–`9` keys that select
them.

## Behaviour

### Help overlay

- `#hint` (bottom-left line) is removed.
- New `#help` panel, centered, styled like the hotbar (dark translucent
  background, rounded corners, `pointer-events: auto` on the panel only —
  clicks outside the panel still fall through to the canvas).
- Content: a compact two-column key → action grid (keycaps + labels), same
  information as today's one-liner:

  | key | action | key | action |
  |---|---|---|---|
  | click | lock mouse | 1-9 / wheel | select hotbar slot |
  | WASD | move | LMB | break block |
  | SPACE | jump / swim | RMB | place block |
  | SHIFT | sink / fly-down | E | palette |
  | F | toggle fly | C | toggle wireframe |
  | N | toggle noclip | H | help (this overlay) |
  | ESC | release mouse | | |

- Title above the grid: `block-world — how to play`. Footer line: `H or
  click to close`.
- Toggle with `H` (keydown, `e.repeat` ignored — the existing `e.repeat`
  early-return in the keydown handler already covers it):
  - **Open**: show panel, `document.exitPointerLock()` (crosshair/hitbox hide
    via the existing `pointerlockchange` handler, which also clears held keys;
    no-op if not currently locked),
    hide the badge.
  - **Close**: hide panel, `lockPointer()` (same swallow-the-promise pattern
    as palette close), show the badge.
- **Swapping overlays**: opening help while the palette is open closes the
  palette; opening the palette (`E`) while help is open closes help. Both use
  the same open/close + re-lock mechanics, so this is a shared
  `closeOverlay`/state check rather than duplicated logic.
- **Canvas click while open** closes help and re-locks (same path the canvas
  click already takes for the palette).
- No pause: with the lock released the simulation keeps ticking, exactly as
  it does with the palette open (the POC has no pause mechanism; a falling
  player keeps falling while the overlay is up — acceptable, consistent).
- While open, gameplay keys still work as before (1-9 selects hotbar slots);
  harmless and consistent with palette behaviour.

### `?` badge (lower-right)

- Small circular badge (`#help-hint`), bottom-right, same vertical offset as
  the hotbar (`bottom: 20px`): a translucent dark disc with `?` centred and a
  tiny `h` keycap at its lower-right edge.
- `pointer-events: auto`; clicking it opens help (identical to pressing `H`).
- Hidden while any overlay (help or palette) is open.

### Hotbar slot numbers

- Each of the nine hotbar slots shows its select-key (`1`–`9`) as a tiny
  keycap in the slot's corner. Injected from `main.ts` (the `.slot` divs are
  pre-placed in `index.html` with no inner markup; JS appends a `.num` span
  per slot).
- Purely display-only: slots already have `pointer-events: none` on
  `#hotbar`, so the keycaps can't intercept palette/hotbar interaction.
- Palette slots get **no** numbers (they're clicked, not keyed).

## Files touched

| File | Change |
|---|---|
| `index.html` | Remove `#hint`; add `#help` panel (static content: title, key grid, footer) and `#help-hint` badge |
| `src/ui.css` | Styles: `#help` panel + key grid + `.key` keycap; `#help-hint` badge; `.num` slot keycap. Remove `#hint` block |
| `src/main.ts` | `KeyH` handler + overlay open/close (share mechanics with the palette: `closeOverlay`/swap); badge click → open help; badge visibility tied to overlay state; inject `.num` keycaps into hotbar slots; drop the `hint` text setup |

Data model (`src/ui.ts`) is unchanged: `Hotbar` stays a data-only class, `E`/
digit/wheel handling untouched, so `src/__tests__/ui.test.ts` and all other
tests stay green. The overlay is static DOM + presentation code in
`main.ts` (which is not node-tested, matching how the palette was done in T11).

## Visual details

- Panel: `rgba(10, 14, 22, .85)` background, 10px radius, ~16-20px padding,
  `min(90vw, 560px)` wide — dark enough to read over any terrain, lighter
  than the hotbar's `.55` since it holds more text.
- Keycaps (`.key`): small rounded boxes, `rgba(255,255,255,.12)` fill, 1px
  brighter border, monospace-ish — used for the grid, the palette `E`/`H`
  labels, the badge's `h`, and the hotbar `.num` digits.
- Grid: `display: grid; grid-template-columns: auto 1fr auto 1fr;` (two
  key+label pairs per row, gap 6/16px), 13px text, `#e8eef7`, same text-
  shadow as the old hint.

## Verification

1. `npm test` — all suites green (no expected changes).
2. `npm run build` — `tsc --noEmit` clean + vite build succeeds.
3. `npm run dev` manual pass:
   - bottom-left hint is gone; `?`/`h` badge visible lower-right.
   - `H` opens the centered panel, releases the mouse; `H` again (or canvas
     click) closes it and re-locks the mouse.
   - `E` while help is open swaps to the palette and vice versa; badge hidden
     while either overlay is up, returns after.
   - Hotbar slots show 1-9 keycaps in their corners; palette slots don't;
     selection highlight (yellow border) still renders over the keycap.
   - 1-9 / wheel still select slots while help is open.

Commit style: `feat: ...` (post-POC work; no T-number to stay consistent
with).