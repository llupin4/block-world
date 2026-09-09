# Multiplayer Names + `M` Menu + Host-Movement Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Players host/join from an in-game `M` menu with a typed-or-random name (`Blue4402` style); every player body — including the host's — carries a name tag to everyone else; the host's body moves in a `?host` lobby.

**Architecture:** `HostSession` gains `ownController?` + `ownName?` opts so the lobby host branch can drive the host's own body with the page's `HumanController` and name it; names travel through the existing `hello`/`state`/`welcome` wire fields (no protocol change). A `src/net/name.ts` module owns `randomName()`/`sanitizeName()`. The `M` menu is a standard overlay (index.html + ui.css + a `toggleMpMenu` in main.ts) that navigates to `?host&name=…` / `?join=<code>&name=…` — a reload into the existing boot path (the URL stays the source of truth).

**Tech Stack:** TypeScript, Vite, Vitest (unit), Playwright (e2e, `tests/e2e/`), three.js (tag sprites already exist — no render-path change).

**Spec:** `docs/superpowers/specs/2026-09-08-multiplayer-name-and-menu-design.md`

---

## File structure

| File | Change | Responsibility |
|---|---|---|
| `src/net/name.ts` | Create | `NAME_COLORS`, `randomName()`, `sanitizeName()` — pure, no deps |
| `src/__tests__/net-name.test.ts` | Create | unit tests for the above |
| `src/net/host.ts` | Modify | `HostOpts.ownController?` / `ownName?`; own-player spawn uses them |
| `src/__tests__/net-host.test.ts` | Modify | own-controller movement + ownName-in-`state` tests |
| `src/main.ts` | Modify | boot: read+persist `name` param, lobby host opts, client name, look sync, `showLobby` name + `__lobby.ownPos`, `M` menu wiring |
| `index.html` | Modify | `#mp-menu` overlay markup; help row for `M` |
| `src/ui.css` | Modify | `#mp-menu` styles (mirrors `#help`) |
| `tests/e2e/mp-2tab.spec.ts` | Modify | name + host-movement assertions |
| `tests/e2e/mp-menu.spec.ts` | Create | `M` menu host/join flow |
| `README.md` | Modify | `M` control row + multiplayer section note |

Conventions: no comments unless the code is non-obvious (existing codebase is comment-dense for exactly-this kind of "why" — follow the surrounding style). Tests run with `npx vitest run <file>`; e2e with `npx playwright test <file>` (the config auto-starts the dev server on :4173). Commit style: `feat(net): …`, `test(e2e): …`, `docs: …`.

---

### Task 1: `src/net/name.ts` (random + sanitized names)

**Files:**
- Create: `src/net/name.ts`
- Test: `src/__tests__/net-name.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/net-name.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { randomName, sanitizeName, NAME_COLORS } from '../net/name';

const NAME_RE = /^[A-Z][a-z]+[1-9][0-9]{3}$/; // "Blue4402"

describe('net/name', () => {
  it('randomName: a word from NAME_COLORS + a 4-digit number (1000–9999)', () => {
    for (let i = 0; i < 50; i++) {
      const n = randomName();
      expect(n, n).toMatch(NAME_RE);
      const m = n.match(/^([A-Z][a-z]+)([0-9]{4})$/)!;
      expect(NAME_COLORS).toContain(m[1]);
      expect(Number(m[2])).toBeGreaterThanOrEqual(1000);
      expect(Number(m[2])).toBeLessThanOrEqual(9999);
    }
  });
  it('sanitizeName: trims and collapses internal whitespace', () => {
    expect(sanitizeName('  Blue  4402 ')).toBe('Blue 4402');
  });
  it('sanitizeName: hard-caps at 16 chars', () => {
    expect(sanitizeName('abcdefghijklmnopqrs').length).toBe(16);
    expect(sanitizeName('abcdefghijklmnopqrs')).toBe('abcdefghijklmnop');
  });
  it('sanitizeName: passes short names through unchanged', () => {
    expect(sanitizeName('hi')).toBe('hi');
  });
  it('sanitizeName: empty/whitespace input becomes a random name', () => {
    expect(sanitizeName('')).toMatch(NAME_RE);
    expect(sanitizeName('   ')).toMatch(NAME_RE);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/net-name.test.ts`
Expected: FAIL — `Cannot find module '../net/name'` (or import errors).

- [ ] **Step 3: Write the implementation**

Create `src/net/name.ts`:

```ts
// Display names (ADR 0019 follow-up): a typed name or a random "<Color>4402"-style one. The name
// travels in the ?host/?join URL `name` param and over the existing wire fields (the client's
// `hello` name; the host's own entity name via `state`/`welcome`) — no protocol change.
export const NAME_COLORS = [
  'Blue', 'Red', 'Green', 'Orange', 'Purple', 'Indigo', 'Gold', 'Crimson', 'Amber', 'Coral',
  'Teal', 'Mint', 'Slate', 'Ivory', 'Ruby', 'Lime', 'Aqua', 'Scarlet', 'Sapphire', 'Topaz',
];

export function randomName(): string {
  const word = NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)]!;
  return word + String(1000 + Math.floor(Math.random() * 9000));
}

// Trim, collapse internal whitespace, hard-cap at 16 (the name-tag texture slices at 14, so 16 is
// safe); an empty result becomes a random name (the host/join always gets a name).
export function sanitizeName(input: string): string {
  const t = input.trim().replace(/\s+/g, ' ').slice(0, 16).trim();
  return t === '' ? randomName() : t;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/net-name.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/net/name.ts src/__tests__/net-name.test.ts
git commit -m "feat(net): random + sanitized display names (randomName/sanitizeName)"
```

---

### Task 2: `HostSession` own-controller + own-name opts

**Files:**
- Modify: `src/net/host.ts:19` (HostOpts), `src/net/host.ts:60-64` (own-player spawn)
- Test: `src/__tests__/net-host.test.ts`

Context: `host.ts` already imports `Sim, IdleController, type Controller` from `../entity` (line 3) and `human`-free `HostOpts` today is `interface HostOpts { withOwnPlayer?: boolean; persist?: Persistence; hooks?: ApplyHooks }`. The own-player spawn block today:

```ts
    if (opts.withOwnPlayer !== false) {
      const own = this.sim.spawn(this.spawn, new IdleController(), { yaw: -Math.PI / 2, kindId: 'player', baseController: new IdleController() });
      this.sim.setViewed(own.id);
      this.sim.homeId = own.id; // possession's return-to-body target
    }
```

- [ ] **Step 1: Write the failing tests**

Append to the `describe('HostSession', …)` block in `src/__tests__/net-host.test.ts` (the file already imports `HostSession`, `LoopbackHub`, `Msg`, `HumanController`, `NULL_INTENT`; the `tick` + `welcomeOf` helpers are at the top):

```ts
  it('ownController drives the host's own body (the lobby-host movement fix)', () => {
    const hub = new LoopbackHub();
    const human = new HumanController(new Set(['KeyW']), 0, 0);
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: true, ownController: human });
    const ownId = host.sim.viewedId;
    // settle (fall to the ground) before measuring
    tick(hub, host, [], 20);
    const b = host.sim.entities.get(ownId)!.pos;
    tick(hub, host, [], 30);
    const a = host.sim.entities.get(ownId)!.pos;
    expect(Math.abs(a.x - b.x) + Math.abs(a.z - b.z)).toBeGreaterThan(0.05); // W moved the own body
  });

  it('ownName lands on the own entity and in the `state` broadcast to a hello'd peer', async () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: true, ownName: 'Hosty' });
    const ownId = host.sim.viewedId;
    expect(host.sim.entities.get(ownId)!.name).toBe('Hosty');
    const client = hub.connect('client');
    const welcomed = welcomeOf(client);
    const states: Msg[] = [];
    client.onMessage((_f, m: Msg) => { if (m.type === 'state') states.push(m); });
    client.send('host', { type: 'hello', name: 'alice', protocol: 1 });
    hub.pump(0);
    await welcomed;
    tick(hub, host, [], 6); // state broadcasts on the NET_STATE_STRIDE (3) lattice
    const list = (states.at(-1) as Extract<Msg, { type: 'state' }>).entities;
    expect(list.some((e) => e.id === ownId && e.name === 'Hosty')).toBe(true);
  });

  it('without ownController the own body stays idle (B1 ?mp=host behavior unchanged)', () => {
    const hub = new LoopbackHub();
    const host = new HostSession(hub.connect('host'), 1234, { withOwnPlayer: true });
    const ownId = host.sim.viewedId;
    tick(hub, host, [], 20);
    const b = host.sim.entities.get(ownId)!.pos;
    tick(hub, host, [], 30);
    const a = host.sim.entities.get(ownId)!.pos;
    expect(a.x).toBe(b.x); expect(a.z).toBe(b.z); // no input, idle controller — no drift
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/__tests__/net-host.test.ts`
Expected: the two new opts tests FAIL (`ownController`/`ownName` not in `HostOpts` → TS error, and behavior absent); the idle test may already pass (it documents the default).

- [ ] **Step 3: Implement the opts**

In `src/net/host.ts`, change `HostOpts`:

```ts
export interface HostOpts {
  withOwnPlayer?: boolean;
  ownController?: Controller; // drives the own player (the lobby host passes the page's HumanController; default IdleController)
  ownName?: string;           // the own player's display name (the name tag joiners see)
  persist?: Persistence;
  hooks?: ApplyHooks;
}
```

and the own-player spawn block:

```ts
    if (opts.withOwnPlayer !== false) {
      const own = this.sim.spawn(this.spawn, opts.ownController ?? new IdleController(), { yaw: -Math.PI / 2, kindId: 'player', baseController: new IdleController() });
      if (opts.ownName) own.name = opts.ownName; // the display name (the name tag)
      this.sim.setViewed(own.id);
      this.sim.homeId = own.id; // possession's return-to-body target
    }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/net-host.test.ts`
Expected: PASS (all, including the pre-existing possession/homeId test).

- [ ] **Step 5: Commit**

```bash
git add src/net/host.ts src/__tests__/net-host.test.ts
git commit -m "feat(net): HostSession ownController/ownName opts (lobby host drives + names its own body)"
```

---

### Task 3: wire the lobby — boot `name` param, host movement, host name, e2e gate

**Files:**
- Modify: `tests/e2e/mp-2tab.spec.ts` (failing gate first)
- Modify: `src/main.ts:462-498` (lobby boot branch), `src/main.ts:414-443` (`showLobby`)

- [ ] **Step 1: Extend the e2e gate (failing)**

In `tests/e2e/mp-2tab.spec.ts`:

1. Change the `LobbySnap` type to include `ownPos`:

```ts
type LobbySnap = { code: string; isHost: boolean; peers: string[]; remote: RemotePlayer[]; ownPos: { x: number; y: number; z: number } | null };
```

2. Change `snap` to read it:

```ts
const snap = (page: Page) =>
  page.evaluate(() => {
    const l = (window as { __lobby?: { code: string; isHost: boolean; peers: () => string[]; remotePlayers: () => RemotePlayer[]; ownPos: () => { x: number; y: number; z: number } | null } }).__lobby;
    return l ? { code: l.code, isHost: l.isHost, peers: l.peers(), remote: l.remotePlayers(), ownPos: l.ownPos() } : null;
  });
```

3. Boot both tabs WITH names (replace the two `goto` lines):

```ts
  const hostNav = host.goto(`${BASE}?host=${code}&name=Blue4402`);
  const clientNav = client.goto(`${BASE}?join=${code}&name=Red777`);
```

4. After the existing handshake wait (the `client.waitForFunction` for `remotePlayers().length >= 1`), add the name + host-movement assertions:

```ts
  // Names over the wire: the client sees the host's body named (the host's own entity name,
  // broadcast in `state`); the host sees the client's `hello` name. (Before the fix: null / 'me'.)
  const c0 = await snap(client); const h0 = await snap(host);
  expect(c0!.remote.some((p) => p.name === 'Blue4402'), 'client sees the host named').toBe(true);
  expect(h0!.remote.some((p) => p.name === 'Red777'), 'host sees the client named').toBe(true);

  // The host's own body moves (the lobby-host movement fix): hold W a moment, the own body drifts.
  const start = h0!.ownPos!;
  await host.keyboard.down('w');
  await host.waitForTimeout(1200);
  await host.keyboard.up('w');
  await host.waitForFunction(
    ({ sx, sz }) => {
      const p = (window as { __lobby?: { ownPos: () => { x: number; y: number; z: number } | null } }).__lobby?.ownPos();
      return !!p && Math.abs(p.x - sx) + Math.abs(p.z - sz) > 0.05;
    },
    { sx: start.x, sz: start.z },
    { timeout: 15_000 },
  );
```

- [ ] **Step 2: Run the e2e to verify it fails**

Run: `npx playwright test tests/e2e/mp-2tab.spec.ts`
Expected: FAIL — `c0.remote.some(name === 'Blue4402')` is false (host entity name is null) and/or `ownPos` is not a function (the hook doesn't exist yet).

- [ ] **Step 3: Wire the lobby boot in `src/main.ts`**

Add the import at the top (with the other `./net` imports) — exactly this, nothing else:

```ts
import { sanitizeName } from './net/name';
```

In the `if (lobbyActive) {` branch (after the webCrypto guard, before `const code = …`), compute the name:

```ts
    // The display name (?host&name= / ?join=code&name=): typed (non-empty param) names are
    // remembered for the M menu; an empty param gets a random name (not remembered).
    const nameParam = new URLSearchParams(location.search).get('name') ?? '';
    const name = sanitizeName(nameParam);
    if (nameParam.trim() !== '') localStorage.setItem('bw.name', name);
```

Host branch — pass the page's `human` controller + the name (replace the `new HostSession(…)` line):

```ts
      const host = new HostSession(tr, TERRAIN_SEED, { withOwnPlayer: true, ownController: human, ownName: name, persist, hooks: simHooks });
```

Immediately after the host-branch global reassignment (after the line `world = host.world; sim = host.sim; waterSim = host.waterSim; worldTime = host.worldTime;`), sync the controller's look to the own body's spawn look (mirrors the single-player boot sync at the line with the comment "The human controller's look is the source of truth"):

```ts
      { const ve = host.sim.viewed(); if (ve) human.setLook(ve.yaw, ve.pitch); }
```

Client branch — use the name instead of `'me'` (replace the line `const client = new ClientSession(tr, 'me', human);`):

```ts
      const client = new ClientSession(tr, name, human);
```

- [ ] **Step 4: Extend `showLobby` (name display + `ownPos` hook)**

Change the signature of `showLobby` (main.ts):

```ts
function showLobby(code: string, isHost: boolean, tr: { peers(): string[] }, session: HostSession | ClientSession, name: string): void {
```

Keep the `el.innerHTML` template unchanged. After `document.body.appendChild(el);`, insert the name line as a separate element (textContent, so a pasted `<script>`-ish name cannot inject HTML) as the first child — right under the "Hosting a world" header:

```ts
  const nameEl = document.createElement('div');
  nameEl.style.cssText = 'color:#bbb;margin-bottom:6px';
  nameEl.textContent = `name: ${name}`;
  el.insertAdjacentElement('afterbegin', nameEl);
```

In the `(window as unknown as Record<string, unknown>).__lobby = { … }` object, add:

```ts
    ownPos: () => { const e = session.sim.viewed(); return e ? { x: e.pos.x, y: e.pos.y, z: e.pos.z } : null; },
```

Update the call site (the line `showLobby(code, lobbyHost, tr, session);`):

```ts
    showLobby(code, lobbyHost, tr, session, name);
```

- [ ] **Step 5: Run unit + typecheck, then the e2e gate**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5`
Expected: typecheck OK; 40 files / 329+ tests pass (3 new from Task 2 already committed; nothing new here at unit level).

Run: `npx playwright test tests/e2e/mp-2tab.spec.ts`
Expected: PASS — names visible both ways, host body moves under W.

- [ ] **Step 6: Commit**

```bash
git add src/main.ts tests/e2e/mp-2tab.spec.ts
git commit -m "feat(main): lobby names (host+joiner) + host drives its own body; e2e name/movement gate"
```

---

### Task 4: the `M` multiplayer menu

**Files:**
- Test: `tests/e2e/mp-menu.spec.ts` (failing gate first)
- Modify: `index.html` (overlay markup + help row)
- Modify: `src/ui.css` (`#mp-menu` styles)
- Modify: `src/main.ts` (menu state + toggle + buttons, overlay-invariant wiring)

- [ ] **Step 1: Write the failing e2e**

Create `tests/e2e/mp-menu.spec.ts`:

```ts
// The M multiplayer menu (single-player screen): a name field + Host / Join(code) buttons.
// Host/Join navigate to ?host&name=… / ?join=<code>&name=… (a reload into the boot path).
import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:4173/';
const lobbyOf = (page: Page) =>
  page.evaluate(() => (window as { __lobby?: { code: string; isHost: boolean } }).__lobby ?? null);

test('M menu: host with a typed name (remembered in localStorage)', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30_000);
  await page.goto(BASE);
  await page.keyboard.press('m');
  await expect(page.locator('#mp-menu')).toBeVisible();
  await page.fill('#mp-name', 'MenuHost');
  const nav = page.click('#mp-host'); // navigates to ?host&name=MenuHost
  await nav;
  await page.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  expect(new URL(page.url()).searchParams.get('host')).not.toBeNull();
  expect(new URL(page.url()).searchParams.get('name')).toBe('MenuHost');
  const lobby = await lobbyOf(page);
  expect(lobby?.isHost).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('bw.name'))).toBe('MenuHost');
  await ctx.close();
});

test('M menu: join by code (name remembered; empty code shows a hint, no nav)', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30_000);
  await page.goto(BASE);
  await page.keyboard.press('m');
  await expect(page.locator('#mp-menu')).toBeVisible();

  // empty code: the hint shows, the page does not navigate
  await page.fill('#mp-name', 'MenuJoiner');
  await page.click('#mp-join');
  await expect(page.locator('#mp-error')).toBeVisible();
  expect(page.url()).toBe(BASE);

  // with a code: navigates to ?join=<code>&name=MenuJoiner
  await page.fill('#mp-code', 'abc123');
  const nav = page.click('#mp-join');
  await nav;
  await page.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  expect(new URL(page.url()).searchParams.get('join')).toBe('abc123');
  expect(new URL(page.url()).searchParams.get('name')).toBe('MenuJoiner');
  expect((await lobbyOf(page))?.isHost).toBe(false);
  await ctx.close();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/mp-menu.spec.ts`
Expected: FAIL — `#mp-menu` never becomes visible (no overlay yet).

- [ ] **Step 3: Add the overlay markup to `index.html`**

After the `#replays` block (before `<div id="help-hint"…`), add:

```html
    <!-- multiplayer menu (M): name + host / join-by-code. Host/Join reload into ?host&name=… /
         ?join=<code>&name=… (the boot path is URL-driven; the menu is the convenience front). -->
    <div id="mp-menu" class="hidden">
      <div class="title">multiplayer</div>
      <div class="field">
        <span class="lbl">name</span>
        <input id="mp-name" maxlength="16" placeholder="blank = random (e.g. Blue4402)" autocomplete="off" spellcheck="false" />
      </div>
      <button id="mp-host" class="btn">host world</button>
      <div class="divider"></div>
      <div class="field">
        <span class="lbl">room code</span>
        <input id="mp-code" maxlength="6" placeholder="the 6-char code from the host" autocomplete="off" spellcheck="false" />
      </div>
      <button id="mp-join" class="btn">join</button>
      <div id="mp-error" class="err hidden"></div>
      <div class="foot">M to close</div>
    </div>
```

And add a help row inside `#help .rows` (after the `E` row):

```html
        <span class="key">M</span><span>multiplayer menu (host / join)</span>
```

- [ ] **Step 4: Add the styles to `src/ui.css`**

Append (mirrors `#help`):

```css
/* multiplayer menu (M): centered panel — name + host, then join-by-code. */
#mp-menu {
  position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(90vw, 380px);
  padding: 18px 22px;
  background: rgba(10, 14, 22, .85); border-radius: 10px;
  color: #e8eef7; font: 13px/1.6 system-ui, sans-serif;
  text-shadow: 0 1px 2px #000;
}
#mp-menu .title { font-weight: 600; font-size: 15px; margin-bottom: 10px; }
#mp-menu .field { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
#mp-menu .lbl { width: 64px; color: rgba(232, 238, 247, .6); font-size: 12px; }
#mp-menu input {
  flex: 1; background: rgba(0, 0, 0, .4); color: #e8eef7;
  border: 1px solid rgba(150, 170, 200, .35); border-radius: 6px;
  padding: 7px 10px; font: 14px system-ui, sans-serif; outline: none;
}
#mp-menu input:focus { border-color: rgba(159, 208, 160, .6); }
#mp-menu .btn {
  display: block; width: 100%; cursor: pointer; margin-top: 6px;
  background: rgba(159, 208, 160, .18); color: #e8eef7;
  border: 1px solid rgba(159, 208, 160, .4); border-radius: 6px;
  padding: 8px 10px; font: 600 14px system-ui, sans-serif;
}
#mp-menu .btn:hover { background: rgba(159, 208, 160, .3); }
#mp-menu .divider { height: 1px; background: rgba(150, 170, 200, .25); margin: 14px 0; }
#mp-menu .err { margin-top: 8px; color: #e0a0a0; font-size: 12px; }
#mp-menu .foot { margin-top: 10px; color: rgba(232, 238, 247, .6); font-size: 12px; }
```

- [ ] **Step 5: Wire the menu in `src/main.ts`**

Next to the other overlay state (the block starting `let paletteOpen = false; let helpOpen = false; let replaysOpen = false;`), add:

```ts
let mpMenuOpen = false;
const mpMenuEl = document.getElementById('mp-menu')!;
const mpNameEl = document.getElementById('mp-name')!;
const mpCodeEl = document.getElementById('mp-code')!;
const mpErrorEl = document.getElementById('mp-error')!;
```

Update `syncOverlays`:

```ts
  helpHintEl.classList.toggle('hidden', paletteOpen || helpOpen || replaysOpen || mpMenuOpen);
```

Add the open/close/toggle (place them right after `toggleHelp`, following the same shape — opening closes the others WITHOUT re-locking; closing re-locks):

```ts
function closeMpMenu(): void {
  mpMenuEl.classList.add('hidden');
  mpMenuOpen = false;
  syncOverlays();
  lockPointer();
}

function openMpMenu(): void {
  if (paletteOpen) { paletteOpen = false; paletteEl.classList.add('hidden'); }
  if (helpOpen) { helpOpen = false; helpEl.classList.add('hidden'); }
  if (replaysOpen) { replaysOpen = false; replaysEl.classList.add('hidden'); }
  mpMenuOpen = true;
  mpMenuEl.classList.remove('hidden');
  mpNameEl.value = localStorage.getItem('bw.name') ?? ''; // remember the typed name across visits
  mpErrorEl.classList.add('hidden');
  syncOverlays();
  document.exitPointerLock();
  mpNameEl.focus();
}

// The M menu is a single-player-screen affordance: while a session (?mp / ?host / ?join) or a
// replay is running the boot branch already ran — no-op.
function toggleMpMenu(): void {
  if (mpMenuOpen) { closeMpMenu(); return; }
  if (mpSession || playback) return;
  openMpMenu();
}
```

Add the key handler (in the `keydown` listener, next to `if (e.code === 'KeyH') toggleHelp();`):

```ts
  if (e.code === 'KeyM') toggleMpMenu(); // multiplayer menu: host / join (single-player screen only)
```

Add it to the canvas-click close chain (the `renderer.domElement.addEventListener('click', …)` handler):

```ts
  if (paletteOpen) closePalette();
  else if (helpOpen) closeHelp();
  else if (replaysOpen) closeReplays();
  else if (mpMenuOpen) closeMpMenu();
  else lockPointer();
```

Wire the buttons (right after the toggle functions; the code is normalized to the code alphabet's lowercase; the name goes in the URL, `sanitizeName` at boot handles blank → random):

```ts
document.getElementById('mp-host')!.addEventListener('click', () => {
  location.href = `?host&name=${encodeURIComponent(mpNameEl.value)}`;
});
document.getElementById('mp-join')!.addEventListener('click', () => {
  const code = mpCodeEl.value.trim().toLowerCase();
  if (code === '') { mpErrorEl.textContent = 'paste the room code the host shows'; mpErrorEl.classList.remove('hidden'); return; }
  location.href = `?join=${encodeURIComponent(code)}&name=${encodeURIComponent(mpNameEl.value)}`;
});
```

- [ ] **Step 6: Run typecheck + the menu e2e**

Run: `npx tsc --noEmit && npx playwright test tests/e2e/mp-menu.spec.ts`
Expected: typecheck OK; both menu tests PASS.

- [ ] **Step 7: Commit**

```bash
git add index.html src/ui.css src/main.ts tests/e2e/mp-menu.spec.ts
git commit -m "feat(main): M multiplayer menu (name + host / join-by-code)"
```

---

### Task 5: docs (README controls + multiplayer section)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the `M` control row**

In the Controls table (the row after `| H | Toggle the help overlay |`), add:

```md
| `M` | Multiplayer menu (host a world / join by room code) |
```

- [ ] **Step 2: Note the menu + names in the Multiplayer section**

In the `### Multiplayer` section, right after the "Real lobby (Trystero/WebRTC):" code block, add:

```md
Or from the game itself: press <kbd>M</kbd> for the multiplayer menu — type a name (blank = a
random one like `Blue4402`), click **host world**, or paste a room code and click **join**. The
menu reloads into `?host&name=…` / `?join=<code>&name=…`; the URL form above still works (e.g.
for deep links and the e2e). A typed name is remembered between visits. Every player body —
including the host's — shows a name tag to the other players; the host drives their own body
like in single-player.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: M multiplayer menu + names in README"
```

---

### Task 6: full verification

- [ ] **Step 1: Full unit suite + typecheck/build**

Run: `npm run build && npm test 2>&1 | tail -4`
Expected: typecheck + build OK; all test files pass (40 files, 329+ tests).

- [ ] **Step 2: All multiplayer e2e**

Run: `npx playwright test tests/e2e/mp-2tab.spec.ts tests/e2e/mp-menu.spec.ts tests/e2e/mp-lobby.spec.ts`
Expected: 3 spec files pass (the 2-tab gate asserts names both ways + host movement under W; the lobby spec is unaffected).

- [ ] **Step 3: Single-player pins (no regression)**

Run: `npx playwright test tests/e2e/mp-client.spec.ts`
Expected: pass (B1 loopback path — `?mp` is untouched; the idle own-body default holds).

- [ ] **Step 4: Final review**

```bash
git log --oneline -6
git status --short
```

Expected: the 5 commits from this plan; working tree clean except any pre-existing WIP that was present before this plan started.

---

## Self-review notes (run against the spec)

- Spec §1 (host movement) → Task 2 (session) + Task 3 (wiring + e2e gate). ✓
- Spec §2 (host name tag) → Task 2 (`ownName` + `state` test) + Task 3 (boot name + e2e both-direction names). ✓
- Spec §3 (names module) → Task 1. ✓
- Spec §4 (M menu, key, no-op in session/replay, lobby name line) → Task 4 (toggle guards `mpSession || playback`; `showLobby` name line is Task 3). ✓
- Spec §5 (unchanged: first-person tag hiding, boot gate, ADR 0019 constants, STUN-only) → no task touches them. ✓
- Spec §edge cases: >16 truncation (Task 1), empty → random not persisted (Task 3 boot logic), M in session no-op (Task 4 guard), empty code hint (Task 4), WebCrypto fatal overlay untouched. ✓
- Spec §tests: all listed tests appear in Tasks 1–4. ✓
- Types checked across tasks: `HostOpts.ownController?: Controller` / `ownName?: string` (Task 2) match the Task 3 call site; `sanitizeName` (Task 1) used at Task 3 boot; `showLobby(code, isHost, tr, session, name)` 5-arg (Task 3) matches its single call site; `__lobby.ownPos` shape `{x,y,z}|null` matches the e2e `snap` type (Task 3). `randomName` is NOT imported in main.ts (only `sanitizeName` is used there) — the Task 3 import line says exactly that.