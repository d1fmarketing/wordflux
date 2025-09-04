import { test, expect } from '@playwright/test';

test.describe('WIP validation (optional)', () => {
  test.skip(process.env.UI_TESTS !== '1', 'UI tests disabled (set UI_TESTS=1)');

  test.beforeAll(async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/board/seed`);
    if (!res.ok()) test.skip(true, 'Seeding failed; skipping UI test');
  });

  test('negative WIP does not save and keeps editor open', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="board-grid"]', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Doing' })).toBeVisible({ timeout: 15000 });
    const heading = page.getByRole('heading', { name: 'Doing' });
    await expect(heading).toBeVisible();
    const column = heading.locator('xpath=ancestor::div[contains(@class,"card")]').first();

    // Capture current WIP label text
    const wipButton = column.getByRole('button', { name: /WIP/ });
    const before = await wipButton.textContent();

    // Open editor
    await wipButton.click();
    const wipInput = column.getByLabel('WIP limit');
    await expect(wipInput).toBeVisible();
    await wipInput.fill('-1');
    await column.getByRole('button', { name: 'Save' }).click();

    // Editor remains open due to validation; show error and keep editor visible
    await expect(wipInput).toBeVisible();
    await expect(column.getByText('WIP must be 0 or more')).toBeVisible();
    // Now close editor and verify label unchanged
    await column.getByRole('button', { name: 'Cancel' }).click();
    const wipButtonAfter = column.getByRole('button', { name: /WIP/ });
    await expect(wipButtonAfter).toBeVisible();
    const after = await wipButtonAfter.textContent();
    expect(after).toBe(before);
  });
});
