import { test, expect } from '@playwright/test';

test('menus coordinate replay loading, navigation, recording, and multiplayer eligibility', async ({
  page,
}) => {
  await page.goto('http://localhost:4173');
  const result = await page.evaluate(async () => {
    const moduleUrl = '/src/game-menus.ts';
    const { createGameMenus } = await import(moduleUrl);
    const document = window.document.implementation.createHTMLDocument();
    document.body.innerHTML = `
      <div id="palette"></div><div id="help"></div><div id="replays"></div>
      <div id="mp-menu"></div><button id="help-hint"></button>
      <div id="replays-list"></div><button id="replays-record"></button>
      <input id="mp-name"><input id="mp-code"><div id="mp-error"></div>
      <button id="mp-host"></button><button id="mp-join"></button>`;
    const navigations: string[] = [];
    let recordings = 0;
    let eligible = false;
    let resolveList: (value: unknown[]) => void = () => {};
    const menus = createGameMenus({
      document,
      lockPointer() {},
      unlockPointer() {},
      canOpenMultiplayer: () => eligible,
      rememberedName: () => 'Test Player',
      currentUrl: () => 'http://localhost:4173/?phase=0.5',
      navigate: (url: string) => navigations.push(url),
      listReplays: () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
      startRecording: () => recordings++,
      stepSeconds: 1 / 60,
    });
    menus.toggle('multiplayer');
    const blocked = !menus.isOpen('multiplayer');
    eligible = true;
    menus.toggle('multiplayer');
    eligible = false;
    menus.toggle('multiplayer');
    const canCloseWhenIneligible = !menus.isOpen('multiplayer');

    const list = document.getElementById('replays-list')!;
    menus.openReplays();
    resolveList([]);
    await Promise.resolve();
    const emptyHint = list.querySelector('.empty') !== null;
    menus.openReplays();
    menus.close();
    resolveList([{ seed: 1, startTick: 60, endTick: 180, recordedAt: 1000 }]);
    await Promise.resolve();
    const ignoresClosedResult = list.querySelector('.empty') !== null;
    menus.openReplays();
    resolveList([
      { seed: 1, startTick: 60, endTick: 180, recordedAt: 1000 },
      { seed: 2, startTick: 120, endTick: 300, recordedAt: 2000 },
      { seed: 3, startTick: 0, endTick: 60 },
    ]);
    await Promise.resolve();
    const ticks = Array.from(list.querySelectorAll('.tick'), (el) => el.textContent);
    const durations = Array.from(list.querySelectorAll('.len'), (el) => el.textContent);
    const missingDate = list.querySelectorAll('.when')[2].textContent;
    (list.querySelector('.row') as HTMLElement).click();
    document.getElementById('replays-record')!.click();
    return {
      blocked,
      canCloseWhenIneligible,
      emptyHint,
      ignoresClosedResult,
      ticks,
      durations,
      missingDate,
      navigations,
      recordings,
      closedAfterRecording: !menus.isOpen('replays'),
    };
  });
  expect(result).toEqual({
    blocked: true,
    canCloseWhenIneligible: true,
    emptyHint: true,
    ignoresClosedResult: true,
    ticks: ['#120', '#60', '#0'],
    durations: ['3.0 s', '2.0 s', '1.0 s'],
    missingDate: '—',
    navigations: ['http://localhost:4173/?phase=0.5&replay=2%3Areplay%3A120'],
    recordings: 1,
    closedAfterRecording: true,
  });
});
