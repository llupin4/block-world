// Audit trystero's Nostr relays. Probes every relay in trystero's default list (read from the
// installed @trystero-p2p/nostr dist) + the pinned RELAY_URLS from src/net/trystero.ts: connects a
// WebSocket, publishes a signed trystero-format ephemeral event (["EVENT", {...}], kind 21001 — the
// same family trystero derives per topic), and records the relay's answer.
//
//   node scripts/probe-relays.mjs
//
// Statuses:
//   ok             anonymous event accepted (usable by trystero, which never authenticates)
//   auth-required  relay sent AUTH (NIP-42) — closes anonymous clients ("blocked: not authorized")
//   closed         socket closed (reason printed)
//   timeout        no OK/close within 15 s (treat as dead for our purposes)
//
// When a pinned relay from src/net/trystero.ts stops answering `ok`, swap it for a relay that does.
// (The failure mode this guards: relay operators start rejecting anonymous trystero traffic — see
// upstream dmotz/trystero #192 / #148.)
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const req = createRequire(new URL('../package.json', import.meta.url));
const { schnorr } = req('@noble/secp256k1');

// --- The installed trystero default list (single source of truth: the dist we actually run).
const nostrDist = readFileSync(new URL('../node_modules/@trystero-p2p/nostr/dist/index.mjs', import.meta.url), 'utf8');
const listStart = nostrDist.indexOf('const defaultRelayUrls = [');
const listEnd = nostrDist.indexOf('].map', listStart);
const defaultRelayHosts = [...nostrDist.slice(listStart, listEnd).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const defaultRelayUrls = defaultRelayHosts.map((u) => 'wss://' + u);

// --- The pinned set (kept in sync with src/net/trystero.ts by the test in net-trystero.test.ts).
const src = readFileSync(new URL('../src/net/trystero.ts', import.meta.url), 'utf8');
const pinStart = src.indexOf('export const RELAY_URLS');
const pinEnd = src.indexOf('];', pinStart);
const pinnedUrls = [...src.slice(pinStart, pinEnd).matchAll(/'([^']+)'/g)].map((m) => m[1]);

const urls = [...new Set([...pinnedUrls, ...defaultRelayUrls])];

// --- A signed trystero-format ephemeral event.
const { secretKey, publicKey } = schnorr.keygen();
const pubkey = Buffer.from(publicKey).toString('hex');
const topic = 'block-world@probe';
const kind = 21001;
const content = JSON.stringify({ probe: true, t: Date.now() });
const payload = { kind, tags: [['x', topic]], created_at: Math.floor(Date.now() / 1e3), content, pubkey };
const rawId = createHash('sha256')
  .update(JSON.stringify([0, payload.pubkey, payload.created_at, payload.kind, payload.tags, payload.content]))
  .digest();
const id = rawId.toString('hex');
const sig = Buffer.from(await schnorr.signAsync(rawId, secretKey)).toString('hex');
const event = JSON.stringify(['EVENT', { ...payload, id, sig }]);

function probe(url) {
  return new Promise((resolve) => {
    const out = { url, status: 'unknown', detail: '' };
    let ws;
    let done = false;
    const finish = (status, detail) => {
      if (done) return;
      done = true;
      out.status = status;
      out.detail = detail;
      try { ws.close(); } catch { /* already closed */ }
      setTimeout(() => resolve(out), 50);
    };
    const hardTimeout = setTimeout(() => finish('timeout', 'no ok/close in 15s'), 15_000);
    try {
      ws = new WebSocket(url);
    } catch (e) {
      clearTimeout(hardTimeout);
      return resolve({ url, status: 'connect-error', detail: String(e) });
    }
    ws.onopen = () => ws.send(event);
    ws.onmessage = (m) => {
      let msg;
      try { msg = JSON.parse(m.data); } catch { return; }
      if (msg[0] === 'OK' && msg[1] && msg[2]) {
        clearTimeout(hardTimeout);
        finish('ok', 'anonymous event accepted');
      } else if (msg[0] === 'AUTH') {
        clearTimeout(hardTimeout);
        finish('auth-required', 'relay sent AUTH (NIP-42)');
      }
    };
    ws.onclose = (e) => {
      clearTimeout(hardTimeout);
      finish('closed', `code=${e.code} reason=${JSON.stringify(e.reason || '')}`);
    };
    ws.onerror = () => { /* close follows */ };
  });
}

const results = [];
const queue = [...urls];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const url = queue.shift();
    results.push(await probe(url));
  }
}));
results.sort((a, b) => a.url.localeCompare(b.url));
const pinned = new Set(pinnedUrls);
for (const r of results) {
  const mark = pinned.has(r.url) ? '*' : ' ';
  console.log(`${mark} ${r.status.padEnd(14)} ${r.url.padEnd(40)} ${r.detail}`);
}
const okPinned = pinnedUrls.filter((u) => results.find((r) => r.url === u)?.status === 'ok');
console.log(`\npinned: ${okPinned.length}/${pinnedUrls.length} ok (${okPinned.length < pinnedUrls.length ? 'SWAP THE FAILING ONES IN src/net/trystero.ts' : 'all good'})`);
const okDefault = results.filter((r) => r.status === 'ok' && !pinned.has(r.url));
console.log(`default list: ${okDefault.length}/${defaultRelayUrls.length} ok`);