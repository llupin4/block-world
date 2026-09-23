import { test, expect } from '@playwright/test';

test('overlay shortcuts switch the visible panel and restore the help hint on close', async ({
  page,
}) => {
  await page.goto('http://localhost:4173');
  const panels = ['palette', 'help', 'replays', 'mp-menu'];
  for (const [key, active] of [
    ['e', 'palette'],
    ['h', 'help'],
    ['r', 'replays'],
    ['m', 'mp-menu'],
  ]) {
    await page.keyboard.press(key);
    for (const panel of panels) {
      if (panel === active) await expect(page.locator('#' + panel)).toBeVisible();
      else await expect(page.locator('#' + panel)).toBeHidden();
    }
    await expect(page.locator('#help-hint')).toBeHidden();
  }
  await page.locator('#mp-name').blur();
  await page.keyboard.press('m');
  await expect(page.locator('#mp-menu')).toBeHidden();
  await expect(page.locator('#help-hint')).toBeVisible();
});
