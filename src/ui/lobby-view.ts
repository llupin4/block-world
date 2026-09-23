import type { HostSession } from '../net/host';
import type { ClientSession } from '../net/client';

interface LobbyViewOptions {
  document: Document;
  code: string;
  isHost: boolean;
  name: string;
  transport: { peers(): string[] };
  session: HostSession | ClientSession;
  copyCode(code: string): Promise<void> | undefined;
  confirmLeave(): boolean;
  leave(): void;
}

export function createLobbyView(options: LobbyViewOptions) {
  const { document, code, isHost, name, transport: tr, session } = options;
  const el = document.createElement('div');
  el.id = 'lobby';
  el.style.cssText =
    'position:fixed;top:12px;right:12px;z-index:9998;background:rgba(0,0,0,.72);color:#fff;font:13px/1.5 sans-serif;padding:10px 12px;border-radius:8px;max-width:300px';
  el.innerHTML =
    `<div style="font-weight:600;margin-bottom:6px">${isHost ? 'Hosting a world' : 'Joined a world'}</div>` +
    `<div>Room code</div>` +
    `<div id="lobby-code" style="font:600 20px monospace;letter-spacing:2px;margin:2px 0 6px;user-select:all"></div>` +
    `<button id="lobby-copy" style="cursor:pointer;font:12px sans-serif;padding:4px 8px;background:#2a2a2a;color:#fff;border:1px solid #555;border-radius:4px">copy code</button>` +
    `<button id="lobby-leave" style="display:block;width:100%;margin-top:6px;cursor:pointer;font:12px sans-serif;padding:4px 8px;background:#2a2a2a;color:#fff;border:1px solid #555;border-radius:4px">${isHost ? 'stop hosting' : 'leave lobby'}</button>` +
    `<div id="lobby-peers" style="margin-top:8px;color:#bbb">Peers: ${isHost ? 'waiting for players…' : 'connecting to host…'}</div>`;
  document.body.appendChild(el);
  el.querySelector('#lobby-code')!.textContent = code;
  const nameEl = document.createElement('div');
  nameEl.style.cssText = 'color:#bbb;margin-bottom:6px';
  nameEl.textContent = `name: ${name}`;
  el.firstElementChild?.after(nameEl);
  const copyBtn = document.getElementById('lobby-copy')!;
  copyBtn.addEventListener('click', () => {
    options
      .copyCode(code)
      ?.then(() => {
        copyBtn.textContent = 'copied!';
        setTimeout(() => {
          copyBtn.textContent = 'copy code';
        }, 1200);
      })
      .catch(() => {});
  });
  const leaveBtn = document.getElementById('lobby-leave')!;
  leaveBtn.addEventListener('click', () => {
    if (isHost && !options.confirmLeave()) return;
    options.leave();
  });
  const peersEl = document.getElementById('lobby-peers')!;
  const render = () => {
    const p = tr.peers();
    peersEl.textContent = p.length
      ? 'Peers: ' + p.join(', ')
      : isHost
        ? 'Peers: waiting for players…'
        : 'Peers: connecting to host…';
  };
  const timer = setInterval(render, 500);
  render();
  return {
    code,
    isHost,
    peers: () => tr.peers(),
    remotePlayers: () =>
      session.sim
        .all()
        .filter((e) => e.kind.id === 'player' && e.id !== session.sim.viewedId)
        .map((e) => ({
          id: e.id,
          name: e.name ?? null,
          x: Math.round(e.pos.x * 10) / 10,
          z: Math.round(e.pos.z * 10) / 10,
        })),
    ownPos: () => {
      const e = session.sim.viewed();
      return e ? { x: e.pos.x, y: e.pos.y, z: e.pos.z } : null;
    },
    _dispose: () => clearInterval(timer),
  };
}

export function showHostLeft(document: Document): void {
  const message = document.createElement('div');
  message.style.cssText =
    'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font:600 24px sans-serif;z-index:9999;pointer-events:none;text-shadow:0 0 8px #000';
  message.textContent = 'host left';
  document.body.appendChild(message);
}
