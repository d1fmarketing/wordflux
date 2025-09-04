import { test, expect } from '@playwright/test';

test.describe('Move card via menu (deterministic)', () => {
  test.skip(process.env.UI_TESTS !== '1', 'UI tests disabled (set UI_TESTS=1)');

  test.beforeAll(async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/board/seed`);
    if (!res.ok()) test.skip(true, 'Seeding failed; skipping UI test');
  });

  test('move first Backlog card to Done via menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="board-grid"]', { timeout: 15000 });
    // Wait for seeded card to appear
    await expect(page.getByText('Define flow stages')).toBeVisible({ timeout: 15000 });

    const backlogHeading = page.getByRole('heading', { name: 'Backlog' });
    const doneHeading = page.getByRole('heading', { name: 'Done' });
    await Promise.all([
      expect(backlogHeading).toBeVisible({ timeout: 15000 }),
      expect(doneHeading).toBeVisible({ timeout: 15000 }),
    ]);

    const backlog = backlogHeading.locator('xpath=ancestor::div[contains(@class,"card")]').first();
    const done = doneHeading.locator('xpath=ancestor::div[contains(@class,"card")]').first();

    const firstCard = backlog.locator('div').filter({ hasText: 'Define flow stages' }).first();
    await firstCard.hover();
    await firstCard.getByRole('button', { name: 'Move card' }).first().click();
    await page.getByRole('menu').getByRole('menuitem', { name: 'Done' }).click();

    await expect(done.locator('div').filter({ hasText: 'Define flow stages' }).first()).toBeVisible({ timeout: 5000 });
  });
});
