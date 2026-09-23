import { test, expect } from '@playwright/test';

test('inventory renders restored slots, follows selection, and assigns palette clicks to the current slot', async ({
  page,
}) => {
  await page.goto('http://localhost:4173');
  const result = await page.evaluate(async () => {
    const viewUrl = '/src/ui/inventory-view.ts';
    const modelUrl = '/src/ui/hotbar.ts';
    const blocksUrl = '/src/blocks.ts';
    const { InventoryView } = await import(viewUrl);
    const { Hotbar } = await import(modelUrl);
    const { Block, PLACEABLE, iconPosition } = await import(blocksUrl);
    const document = window.document.implementation.createHTMLDocument();
    const hotbarElement = document.createElement('div');
    const palette = document.createElement('div');
    for (let index = 0; index < 9; index++) hotbarElement.append(document.createElement('div'));
    const hotbar = new Hotbar(PLACEABLE);
    const view = new InventoryView(
      { hotbar: hotbarElement, palette },
      hotbar,
      PLACEABLE,
      'atlas.png',
    );
    const selectedSlot = () =>
      Array.from(hotbarElement.children).findIndex((el) => el.classList.contains('sel'));
    const selectedBlock = () => palette.querySelector('.sel .name')?.textContent;
    const initialSelection = selectedSlot();

    // Restoration can select zero again, which intentionally emits no selection event.
    hotbar.setSlot(0, Block.Glass);
    hotbar.select(0);
    const restored = {
      selected: selectedSlot(),
      block: selectedBlock(),
      title: (hotbarElement.children[0] as HTMLElement).title,
      crop: (hotbarElement.children[0] as HTMLElement).style.backgroundPosition,
    };
    hotbar.select(4);
    (palette.children[PLACEABLE.indexOf(Block.Torch)] as HTMLElement).click();
    const assigned = { selected: selectedSlot(), block: selectedBlock(), value: hotbar.slots[4] };
    hotbar.setSlot(1, Block.Water);
    const selectionAfterOtherSlotEdit = selectedBlock();
    view.setVisible(false);
    const hidden = hotbarElement.classList.contains('hidden');
    view.setVisible(true);
    return {
      initialSelection,
      restored,
      assigned,
      selectionAfterOtherSlotEdit,
      hidden,
      visible: !hotbarElement.classList.contains('hidden'),
      keycaps: Array.from(hotbarElement.querySelectorAll('.num'), (el) => el.textContent),
      paletteCount: palette.children.length,
      expectedCount: PLACEABLE.length,
      expectedCrop: iconPosition(Block.Glass, 40),
      expectedTorch: Block.Torch,
    };
  });
  expect(result.initialSelection).toBe(0);
  expect(result.restored).toEqual({
    selected: 0,
    block: 'glass',
    title: 'glass',
    crop: result.expectedCrop,
  });
  expect(result.assigned).toEqual({ selected: 4, block: 'torch', value: result.expectedTorch });
  expect(result.selectionAfterOtherSlotEdit).toBe('torch');
  expect(result.hidden).toBe(true);
  expect(result.visible).toBe(true);
  expect(result.keycaps).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
  expect(result.paletteCount).toBe(result.expectedCount);
});

test('game palette updates the selected hotbar slot', async ({ page }) => {
  await page.goto('http://localhost:4173');
  await page.keyboard.press('e');
  await expect(page.locator('#palette')).toBeVisible();
  await page.keyboard.press('2');
  await page
    .locator('#palette .slot')
    .filter({ hasText: /^torch$/ })
    .click();
  await expect(page.locator('#hotbar > .slot').nth(1)).toHaveAttribute('title', 'torch');
  await expect(page.locator('#hotbar > .slot').nth(1)).toHaveClass(/sel/);
  await expect(page.locator('#palette .sel .name')).toHaveText('torch');
});
