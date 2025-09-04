import { test, expect } from '@playwright/test';

test.describe('UI add card (optional)', () => {
  test.skip(process.env.UI_TESTS !== '1', 'UI tests disabled (set UI_TESTS=1)');

  test.beforeAll(async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/board/seed`);
    if (!res.ok()) test.skip(true, 'Seeding failed; skipping UI test');
  });

  test('adds a card to Backlog', async ({ page }) => {
    const title = `E2E Card ${Date.now()}`;
    await page.goto('/');
    await page.waitForSelector('[data-testid="board-grid"]', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Backlog' })).toBeVisible({ timeout: 15000 });

    // Find the Backlog column container
    const heading = page.getByRole('heading', { name: 'Backlog' });
    await expect(heading).toBeVisible();
    const column = heading.locator('xpath=ancestor::div[contains(@class,"card")]').first();

    // Open add form, fill and submit
    await column.getByRole('button', { name: '+ Add card' }).click();
    await column.getByLabel('New card title').fill(title);
    await column.getByRole('button', { name: 'Add' }).click();

    // Expect card to appear
    await expect(column.getByText(title)).toBeVisible({ timeout: 10000 });
  });
});
