import { test, expect } from '@playwright/test';

test('a saved recording boots through replay restoration', async ({ page }) => {
  await page.goto('http://localhost:4173');
  await expect(page.locator('#hotbar')).toBeVisible();
  await page.keyboard.press('r');
  await page.locator('#replays-record').click();
  await expect(page.locator('#scrub-label')).toContainText('recording');
  await page.keyboard.press('r');
  await expect(page.locator('#replays-list .row')).toHaveCount(1);
  await page.locator('#replays-list .row').click();
  await expect(page).toHaveURL(/replay=/);
  await expect(page.locator('#scrub-label')).toContainText('replay');
  await expect(page.getByRole('heading', { name: 'Boot failed' })).toHaveCount(0);
  await expect(page.locator('#scrub-quit')).toBeVisible();
  await page.locator('#scrub-quit').click();
  await expect(page).not.toHaveURL(/replay=/);
  await expect(page.locator('#hotbar')).toBeVisible();
  await expect(page.locator('#scrub')).toBeHidden();
});
