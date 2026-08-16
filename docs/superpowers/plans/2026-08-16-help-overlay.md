# Help Overlay (H) + Hotbar Slot Numbers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the bottom-left control hints into a centered help overlay toggled by `H` (with a `?`/`h` badge in the lower-right that opens it), and label the hotbar slots with the `1`–`9` keys that select them.

**Architecture:** Pure presentation change, post-POC. `index.html` carries the static `#help` panel content + `#help-hint` badge (matching how the hotbar/palette divs are pre-placed), `src/ui.css` styles them, and `src/main.ts` reuses the existing palette overlay mechanics: at most one overlay (palette or help) is open at a time, opening one releases the pointer lock (or closes the other *without* re-locking, so swaps are flicker-free), closing re-locks. `src/ui.ts` (the node-tested `Hotbar` data class) is untouched, so the existing test suite is the regression guard — `main.ts` has no node tests by codebase convention (T11's palette was done the same way, with manual `npm run dev` verification).

**Tech Stack:** TypeScript + Vite + three.js (unchanged), vanilla DOM/CSS. Commands: `npm test` (vitest), `npm run build` (tsc --noEmit + vite build), `npm run dev` (manual pass).

**Spec:** `docs/superpowers/specs/2026-08-16-help-overlay-design.md`

---

### Task 1: `index.html` — replace `#hint` with `#help` panel + `#help-hint` badge

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Swap the hint line for the help panel and badge**

In `index.html`, delete the line `    <div id="hint"></div>` (line 12). After the `#palette` block (i.e. after its closing `</div>` on line 34, before `<script ...>`), insert:

```html
    <div id="help" class="hidden">
      <div class="title">block-world — how to play</div>
      <div class="rows">
        <span class="key">click</span><span>lock mouse</span><span class="key">1–9 / wheel</span><span>select hotbar slot</span>
        <span class="key">WASD</span><span>move</span><span class="key">LMB</span><span>break block</span>
        <span class="key">SPACE</span><span>jump / swim</span><span class="key">RMB</span><span>place block</span>
        <span class="key">SHIFT</span><span>sink / fly-down</span><span class="key">E</span><span>palette</span>
        <span class="key">F</span><span>toggle fly</span><span class="key">C</span><span>toggle wireframe</span>
        <span class="key">N</span><span>toggle noclip</span><span class="key">H</span><span>help (this overlay)</span>
        <span class="key">ESC</span><span>release mouse</span><span></span><span></span>
      </div>
      <div class="foot">H or click to close</div>
    </div>
    <div id="help-hint" title="How to play (H)">
      <span class="q">?</span>
      <span class="key">h</span>
    </div>
```

Notes: `#help` starts hidden (CSS `hidden` class exists). `#help-hint` starts visible. The last row's two empty `<span>` pairs keep the 4-column grid rectangular (ESC row has a single key+label pair).

- [ ] **Step 2: Verify HTML is well-formed (vite would catch a gross break; this is a cheap sanity check)**

Run: `npm run build`
Expected: build succeeds (CSS/JS untouched, but ensures the page shell parses). tsc step passes.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: help panel + ?/h badge markup (replaces bottom-left hint line)"
```

---

### Task 2: `src/ui.css` — styles for the panel, keycaps, badge, slot numbers

**Files:**
- Modify: `src/ui.css`

- [ ] **Step 1: Remove the `#hint` rule**

Delete this block (lines 20–25):

```css
#hint {
  position: fixed; left: 12px; bottom: 12px;
  color: #e8eef7; font: 12px/1.5 system-ui, sans-serif;
  text-shadow: 0 1px 2px #000;
  pointer-events: none;
}
```

- [ ] **Step 2: Add the help/badge/keycap styles**

After the `#palette` rule block (after line 37, `#palette { ... }`), insert:

```css
/* help overlay (H): centered panel + lower-right ? badge (post-POC polish) */
#help {
  position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(90vw, 560px);
  padding: 18px 22px;
  background: rgba(10, 14, 22, .85); border-radius: 10px;
  color: #e8eef7; font: 13px/1.6 system-ui, sans-serif;
  text-shadow: 0 1px 2px #000;
}
#help .title { font-weight: 600; font-size: 15px; margin-bottom: 10px; }
#help .rows {
  display: grid; grid-template-columns: auto 1fr auto 1fr;
  gap: 6px 12px; align-items: center;
}
#help .foot { margin-top: 10px; color: rgba(232, 238, 247, .6); font-size: 12px; }

/* shared keycap look: help grid, badge's "h", hotbar slot numbers */
.key {
  display: inline-block;
  padding: 2px 7px;
  background: rgba(255, 255, 255, .12);
  border: 1px solid rgba(255, 255, 255, .3);
  border-radius: 5px;
  font: 12px/1.4 system-ui, sans-serif;
  text-shadow: none;
}

#help-hint {
  position: fixed; right: 20px; bottom: 20px;
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(10, 14, 22, .55);
  border: 2px solid rgba(255, 255, 255, .25);
  border-radius: 50%;
  cursor: pointer;
}
#help-hint .q { color: #e8eef7; font: 20px/1 system-ui, sans-serif; text-shadow: 0 1px 2px #000; }
#help-hint .key { position: absolute; right: -8px; bottom: -10px; font-size: 11px; }
```

- [ ] **Step 3: Add the hotbar slot-keycap styles**

After the `#hotbar .slot { width: 44px; height: 44px; }` line (line 45), change it to also anchor the keycap, and add the `.num` rule:

```css
#hotbar .slot { width: 44px; height: 44px; position: relative; }
#hotbar .slot .num {
  position: absolute; top: 2px; left: 4px;
  font: 10px/1 system-ui, sans-serif;
  color: #e8eef7; text-shadow: 0 1px 2px #000;
  pointer-events: none;
}
```

(Keep the two existing border-rules for `#hotbar .sel` / `#palette .sel` untouched at the file's end.)

- [ ] **Step 4: Smoke-render in the dev server**

Run: `npm run dev` (leave it running for the manual pass in Task 4)
Expected: page loads; the `?`/`h` badge sits in the lower-right as a disc; the (hidden) help panel is not visible. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui.css
git commit -m "feat: styles for help panel, ?/h badge, keycaps, and hotbar slot numbers"
```

---

### Task 3: `src/main.ts` — H toggle, overlay swap, badge click, slot keycaps, drop the hint

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Handle `KeyH` and the badge in the input section**

In the `keydown` handler (find `if (e.code === 'KeyE') togglePalette(); // creative palette: open (unlock) / close (re-lock)`), add directly after it:

```ts
  if (e.code === 'KeyH') toggleHelp(); // help overlay: same open (unlock) / close (re-lock)
```

In the canvas click handler:

```ts
renderer.domElement.addEventListener('click', () => {
  if (paletteOpen) closePalette();
  else lockPointer();
});
```

change `else lockPointer();` to:

```ts
renderer.domElement.addEventListener('click', () => {
  if (paletteOpen) closePalette();
  else if (helpOpen) closeHelp();
  else lockPointer();
});
```

- [ ] **Step 2: Rework the overlay state section (palette mechanics + help)**

Replace this block:

```ts
let paletteOpen = false;

// Browsers enforce a ~1 s re-lock cooldown after ESC; a rejected request is benign
// (the cooldown is the only realistic failure), so swallow it rather than throw.
function lockPointer(): void {
  const r = renderer.domElement.requestPointerLock() as unknown;
  if (r instanceof Promise) r.catch(() => {}); // Safari rejects without a user gesture
}

function closePalette(): void {
  paletteEl.classList.add('hidden');
  paletteOpen = false;
  lockPointer();
}

function togglePalette(): void {
  if (paletteOpen) {
    closePalette();
  } else {
    paletteOpen = true;
    paletteEl.classList.remove('hidden');
    document.exitPointerLock(); // crosshair + hitbox hide via the existing pointerlockchange handler
  }
}
```

with:

```ts
let paletteOpen = false;
let helpOpen = false;
const helpEl = document.getElementById('help')!;
const helpHintEl = document.getElementById('help-hint')!;

// Browsers enforce a ~1 s re-lock cooldown after ESC; a rejected request is benign
// (the cooldown is the only realistic failure), so swallow it rather than throw.
function lockPointer(): void {
  const r = renderer.domElement.requestPointerLock() as unknown;
  if (r instanceof Promise) r.catch(() => {}); // Safari rejects without a user gesture
}

// Invariant: at most one overlay (palette/help) is open. The badge advertises help and is
// visible only when nothing is open.
function syncOverlays(): void {
  helpHintEl.classList.toggle('hidden', paletteOpen || helpOpen);
}

function closePalette(): void {
  paletteEl.classList.add('hidden');
  paletteOpen = false;
  syncOverlays();
  lockPointer();
}

// Opening an overlay closes the other WITHOUT re-locking, so a swap never flickers
// (and the single exitPointerLock below is the only lock call of the toggle).
function openPalette(): void {
  if (helpOpen) {
    helpOpen = false;
    helpEl.classList.add('hidden');
  }
  paletteOpen = true;
  paletteEl.classList.remove('hidden');
  syncOverlays();
  document.exitPointerLock(); // crosshair + hitbox hide via the existing pointerlockchange handler
}

function closeHelp(): void {
  helpEl.classList.add('hidden');
  helpOpen = false;
  syncOverlays();
  lockPointer();
}

function openHelp(): void {
  if (paletteOpen) {
    paletteOpen = false;
    paletteEl.classList.add('hidden');
  }
  helpOpen = true;
  helpEl.classList.remove('hidden');
  syncOverlays();
  document.exitPointerLock();
}

function togglePalette(): void {
  if (paletteOpen) closePalette();
  else openPalette();
}

function toggleHelp(): void {
  if (helpOpen) closeHelp();
  else openHelp();
}

helpHintEl.addEventListener('click', () => { if (!helpOpen) openHelp(); });
```

- [ ] **Step 3: Wheel ignores the help overlay too**

In the wheel listener:

```ts
  (e) => {
    if (paletteOpen) return;
    hotbar.cycle(e.deltaY > 0 ? 1 : -1);
  },
```

change to:

```ts
  (e) => {
    if (paletteOpen || helpOpen) return; // an open overlay owns the wheel (and the mouse is free)
    hotbar.cycle(e.deltaY > 0 ? 1 : -1);
  },
```

and update the comment line above the listener from `// Wheel cycles the hotbar (down = next slot); while the palette is open the wheel is left alone.` to `// Wheel cycles the hotbar (down = next slot); while an overlay is open the wheel is left alone.`

- [ ] **Step 4: Inject the 1-9 keycaps into the hotbar slots**

After:

```ts
hotbarSlotEls.forEach((el, i) => placeIcon(el, hotbar.slots[i], 40)); // 44px box minus 2px border each side
hotbarEl.classList.remove('hidden');
```

insert:

```ts
// Select-key keycap on each slot (1-9); palette slots are clicked, so they stay unnumbered.
hotbarSlotEls.forEach((el, i) => {
  const num = document.createElement('span');
  num.className = 'num';
  num.textContent = String(i + 1);
  el.append(num);
});
```

- [ ] **Step 5: Delete the bottom-left hint line**

In the `// === loop ===` section, delete these three lines:

```ts
const hint = document.getElementById('hint')!;
hint.textContent =
  'block-world — click to lock · WASD move · SPACE jump/swim · F fly · SHIFT sink/fly-down · N noclip · C wireframe · E palette · 1-9/wheel select · LMB break · RMB place · world streams in around you · ESC release';
```

- [ ] **Step 6: Typecheck + full test suite**

Run: `npm run build && npm test`
Expected: tsc clean, vite build succeeds; all vitest suites pass (Hotbar untouched).

- [ ] **Step 7: Commit**

```bash
git add src/main.ts
git commit -m "feat: help overlay on H (badge + panel, palette swaps) and keycap numbers on hotbar slots"
```

---

### Task 4: Manual verification pass

**Files:** none (verification only — run the dev server left open by Task 2, or `npm run dev`)

- [ ] **Step 1: Run the verification checklist in the browser**

Open the dev server URL and confirm each item:

1. The bottom-left hint line is gone; a `?` disc with a tiny `h` keycap sits in the lower-right.
2. `H` opens the centered `how to play` panel and releases the mouse (crosshair hides).
3. `H` again closes it and re-locks the mouse (crosshair returns). Clicking the canvas while it is open does the same. Clicking the `?` badge opens it (while not open).
4. `E` while help is open swaps straight to the palette (no lock flicker); `H` while the palette is open swaps back. The `?` badge is hidden while either overlay is open and returns once both are closed.
5. Hotbar slots show small `1`–`9` keycaps in their top-left corners; palette slots show no numbers; the yellow selection border still reads clearly over the keycap.
6. `1`–`9` and the wheel select hotbar slots as before (wheel ignored while any overlay is open); `LMB`/`RMB` break/place still work after re-lock.
7. No console errors in any of the above.

- [ ] **Step 2: Final gate**

Run: `npm test && npm run build`
Expected: all green. (No changes, so no commit.)