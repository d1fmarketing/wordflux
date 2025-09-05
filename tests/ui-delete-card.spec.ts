import { test, expect } from '@playwright/test';

test.describe('Card deletion flows', () => {
  test('bulk delete via selection bar', async ({ page }) => {
    await page.goto('/');
    const backlog = page.locator('[data-testid="column-Backlog"]');
    await expect(backlog).toBeVisible();

    // Create via API and resolve ID
    const title = `E2E Delete A ${Date.now()}`;
    const resp = await page.request.post('/api/board/apply', {
      data: { op: 'create_card', args: { columnId: 'Backlog', title } }
    });
    expect(resp.ok()).toBeTruthy();
    const j = await resp.json();
    const createdId = j.created || j.results?.[0]?.created;
    expect(createdId).toBeTruthy();
    await page.reload();

    const cardRoot = page.locator(`[data-testid="card-${createdId}"]`);
    await expect(cardRoot).toBeVisible({ timeout: 10000 });
    await cardRoot.locator('[data-role="selector"]').click();

    // Bulk bar appears
    const bulkBar = page.locator('.wf-bulkbar');
    await expect(bulkBar).toBeVisible();

    // Accept confirmation and click Delete
    page.once('dialog', d => d.accept());
    await bulkBar.getByRole('button', { name: 'Delete' }).click();

    // Card is gone
    await expect(cardByTitle).toHaveCount(0);
  });

  test('delete from Card Inspector', async ({ page }) => {
    await page.goto('/');
    const backlog = page.locator('[data-testid="column-Backlog"]');
    await expect(backlog).toBeVisible();

    // Create via API and resolve ID
    const title = `E2E Delete B ${Date.now()}`;
    const resp = await page.request.post('/api/board/apply', {
      data: { op: 'create_card', args: { columnId: 'Backlog', title } }
    });
    expect(resp.ok()).toBeTruthy();
    const j = await resp.json();
    const createdId = j.created || j.results?.[0]?.created;
    expect(createdId).toBeTruthy();
    await page.reload();

    const cardRoot = page.locator(`[data-testid=\"card-${createdId}\"]`);
    await expect(cardRoot).toBeVisible({ timeout: 10000 });

    // Open inspector by clicking on the card body (avoid selector and drag handle)
    await cardRoot.click();
    const inspector = page.getByText('Quick Edit');
    await expect(inspector).toBeVisible();

    // Confirm delete from inspector
    page.once('dialog', d => d.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    // Card disappears and inspector closes
    await expect(cardByTitle).toHaveCount(0);
  });
});
