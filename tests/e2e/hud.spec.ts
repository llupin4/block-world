import { test, expect } from '@playwright/test';

test('HUD reflects viewing permissions and recording/playback transitions', async ({ page }) => {
  await page.goto('http://localhost:4173');
  const result = await page.evaluate(async () => {
    const moduleUrl = '/src/ui/hud.ts';
    const { Hud } = await import(moduleUrl);
    const document = window.document.implementation.createHTMLDocument();
    document.body.innerHTML = `
      <div id="clock"></div><div id="kind"></div>
      <div id="scrub"><span id="scrub-label"></span><button id="scrub-quit"></button></div>`;
    let inventoryVisible = false;
    let quitCount = 0;
    const hud = new Hud(document, {
      setInventoryVisible: (visible: boolean) => {
        inventoryVisible = visible;
      },
      quitReplay: () => {
        quitCount++;
      },
    });
    const read = () => ({
      kind: document.getElementById('kind')!.textContent,
      clock: document.getElementById('clock')!.textContent,
      scrubHidden: document.getElementById('scrub')!.classList.contains('hidden'),
      label: document.getElementById('scrub-label')!.textContent,
      quitHidden: document.getElementById('scrub-quit')!.classList.contains('hidden'),
      inventoryVisible,
    });
    const base = {
      viewedKind: 'player',
      canEdit: true,
      recording: false,
      playback: null,
      tick: 10,
      day: 1,
      hour: 12,
    };
    hud.update(base);
    const normal = read();
    hud.update({ ...base, viewedKind: 'deer', canEdit: false, recording: true });
    const recording = read();
    hud.update({ ...base, playback: { paused: false, endTick: 100 } });
    const playing = read();
    hud.update({ ...base, tick: 100, playback: { paused: true, endTick: 100 } });
    const paused = read();
    document.getElementById('scrub-quit')!.click();
    hud.update({ ...base, viewedKind: null, canEdit: false });
    const empty = read();
    return { normal, recording, playing, paused, empty, quitCount };
  });
  expect(result.normal).toMatchObject({
    kind: 'viewing: player',
    inventoryVisible: true,
    scrubHidden: true,
  });
  expect(result.normal.clock).toContain('12:00');
  expect(result.recording).toMatchObject({
    kind: 'viewing: deer',
    inventoryVisible: false,
    scrubHidden: false,
    quitHidden: true,
  });
  expect(result.recording.label).toContain('recording');
  expect(result.playing).toMatchObject({ scrubHidden: false, quitHidden: false });
  expect(result.playing.label).toBe('replay ▶ playing   t 10 / 100');
  expect(result.paused.label).toBe('replay ⏸ paused   t 100 / 100');
  expect(result.empty).toMatchObject({ kind: '', inventoryVisible: false, scrubHidden: true });
  expect(result.quitCount).toBe(1);
});
