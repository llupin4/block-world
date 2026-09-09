// Multiplayer (B2) GATE B e2e: two browser tabs on one machine over the REAL trystero transport
// (Nostr strategy for signaling + WebRTC data channels for the session). One tab hosts (?host=<code>),
// one joins (?join=<code>). Asserts they see each other: each lists the other as a connected peer AND
// each renders the other's player (the host spawns the joiner's remote player on `hello`; the joiner
// restores the host's entities from the `welcome` snapshot). A fresh random room code per run avoids
// relay cross-talk. STUN only (trystero default) — no TURN.
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4173/';
type RemotePlayer = { id: number; name: string | null; x: number; z: number };
type LobbySnap = { code: string; isHost: boolean; peers: string[]; remote: RemotePlayer[]; ownPos: { x: number; y: number; z: number } | null };

// Snapshot the serializable __lobby fields (the object carries function properties).
const snap = (page: Page) =>
  page.evaluate(() => {
    const l = (window as { __lobby?: { code: string; isHost: boolean; peers: () => string[]; remotePlayers: () => RemotePlayer[]; ownPos: () => { x: number; y: number; z: number } | null } }).__lobby;
    return l ? { code: l.code, isHost: l.isHost, peers: l.peers(), remote: l.remotePlayers(), ownPos: l.ownPos() } : null;
  });

test('Gate B: two tabs over the real transport see each other', async ({ browser }) => {
  const code = 'bw' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  // Separate contexts: isolated storage (IDB) per tab; the relay + WebRTC are per-page.
  const hostCtx = await browser.newContext(); const clientCtx = await browser.newContext();
  const host = await hostCtx.newPage(); const client = await clientCtx.newPage();
  host.setDefaultTimeout(30_000); client.setDefaultTimeout(30_000);

  const hostReady = host.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });
  const clientReady = client.waitForFunction(() => (window as { __lobby?: unknown }).__lobby, undefined, { timeout: 30_000 });

  // Kick both tabs in parallel (the host must be reachable on the relay before the client's hello lands).
  const hostNav = host.goto(`${BASE}?host=${code}&name=Blue4402`);
  const clientNav = client.goto(`${BASE}?join=${code}&name=Red777`);
  await Promise.all([hostNav, clientNav, hostReady, clientReady]);

  // The full handshake: the client's sim holds the host's player (implies connect + hello + welcome).
  // Room join + WebRTC handshake + the first state can take ~10 s over the public relay.
  await client.waitForFunction(() => {
    const l = (window as { __lobby?: { remotePlayers: () => RemotePlayer[] } }).__lobby;
    return !!l && l.remotePlayers().length >= 1;
  }, undefined, { timeout: 90_000 });

  const h = await snap(host); const c = await snap(client);
  const out = { code, host: h, client: c };
  console.log('GATE-B ' + JSON.stringify(out, null, 2));
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/mp-2tab.json', JSON.stringify(out, null, 2));

  expect(h, 'host emitted the lobby').toBeTruthy();
  expect(c, 'client emitted the lobby').toBeTruthy();
  expect(h!.isHost).toBe(true); expect(c!.isHost).toBe(false);
  expect(h!.peers.length, 'host lists the client as a connected peer').toBeGreaterThanOrEqual(1);
  expect(c!.peers.length, 'client lists the host as a connected peer').toBeGreaterThanOrEqual(1);
  expect(h!.remote.length, 'host renders the client\'s player').toBeGreaterThanOrEqual(1);
  expect(c!.remote.length, 'client renders the host\'s player').toBeGreaterThanOrEqual(1);

  // Names over the wire: the host sees the client's `hello` name immediately; the client sees the
  // host's body name on the first `state` after the welcome (the welcome snapshot's records carry
  // no name — the host's own entity name is broadcast in `state` only). (Before the fix: null / 'me'.)
  const h0 = await snap(host);
  expect(h0!.remote.some((p) => p.name === 'Red777'), 'host sees the client named').toBe(true);
  await client.waitForFunction(
    () => {
      const l = (window as { __lobby?: { remotePlayers: () => RemotePlayer[] } }).__lobby;
      return !!l && l.remotePlayers().some((p) => p.name === 'Blue4402');
    },
    undefined,
    { timeout: 15_000 },
  );
  const c0 = await snap(client);
  expect(c0!.remote.some((p) => p.name === 'Blue4402'), 'client sees the host named').toBe(true);

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

  await clientCtx.close(); await hostCtx.close();
}, 180_000);