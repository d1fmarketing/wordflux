import { test, expect } from '@playwright/test';
import { seedTestBoard, createTestCard } from './helpers/board-utils';

test.describe('P0 Features - Drag and Drop', () => {
  test.beforeEach(async ({ page, request, baseURL }) => {
    // Seed test board with known state
    if (process.env.ENABLE_TEST_ENDPOINTS === '1') {
      await seedTestBoard(request, baseURL!, [
        {
          id: 'Backlog',
          name: 'Backlog',
          cards: [
            { id: 'drag-test-1', title: 'Drag Test Card 1', priority: 'h' },
            { id: 'drag-test-2', title: 'Drag Test Card 2', priority: 'm' }
          ]
        },
        {
          id: 'Doing',
          name: 'In Progress',
          cards: []
        },
        {
          id: 'Done',
          name: 'Done',
          cards: []
        }
      ]);
    }
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="column-Backlog"]');
  });

  test('should drag card from Backlog to In Progress', async ({ page }) => {
    // Find the draggable card
    const card = page.locator('[data-testid="card-drag-test-1"]').first();
    const targetColumn = page.locator('[data-droppable="Doing"]').first();
    
    // Perform drag and drop
    await card.dragTo(targetColumn);
    
    // Wait for the move to complete
    await page.waitForTimeout(1000);
    
    // Verify card is now in Doing column
    await expect(
      page.locator('[data-testid="column-Doing"] [data-testid="card-drag-test-1"]')
    ).toBeVisible();
    
    // Verify card is no longer in Backlog
    await expect(
      page.locator('[data-testid="column-Backlog"] [data-testid="card-drag-test-1"]')
    ).not.toBeVisible();
  });

  test('should drag card between columns multiple times', async ({ page }) => {
    const card = page.locator('[data-testid="card-drag-test-2"]').first();
    
    // Drag to In Progress
    await card.dragTo(page.locator('[data-droppable="Doing"]').first());
    await page.waitForTimeout(500);
    
    // Verify in In Progress
    await expect(
      page.locator('[data-testid="column-Doing"] [data-testid="card-drag-test-2"]')
    ).toBeVisible();
    
    // Drag to Done
    await page.locator('[data-testid="card-drag-test-2"]').first()
      .dragTo(page.locator('[data-droppable="Done"]').first());
    await page.waitForTimeout(500);
    
    // Verify in Done
    await expect(
      page.locator('[data-testid="column-Done"] [data-testid="card-drag-test-2"]')
    ).toBeVisible();
  });

  test('should show drag feedback while dragging', async ({ page }) => {
    const card = page.locator('[data-testid="card-drag-test-1"]').first();
    const targetColumn = page.locator('[data-droppable="Doing"]').first();
    
    // Start dragging
    await card.hover();
    await page.mouse.down();
    
    // Move mouse to target
    const targetBox = await targetColumn.boundingBox();
    if (targetBox) {
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
      
      // Check for visual feedback (column highlight)
      // The column should have the dragging-over style
      await expect(targetColumn).toHaveClass(/bg-\[var\(--wf-soft\)\]\/10/);
      
      // Complete the drag
      await page.mouse.up();
    }
  });
});

test.describe('P0 Features - AI Backlog Generation', () => {
  test.beforeEach(async ({ page, request, baseURL }) => {
    // Clear board for AI generation test
    if (process.env.ENABLE_TEST_ENDPOINTS === '1') {
      await seedTestBoard(request, baseURL!, [
        { id: 'Backlog', name: 'Backlog', cards: [] },
        { id: 'Doing', name: 'In Progress', cards: [] },
        { id: 'Done', name: 'Done', cards: [] }
      ]);
    }
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="column-Backlog"]');
  });

  test('should generate backlog items with AI', async ({ page }) => {
    // Mock the API response
    await page.route('/api/ai/backlog', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generated: 6,
          created: 6,
          cards: [
            { id: 'ai-1', title: 'User Registration', priority: 'h' },
            { id: 'ai-2', title: 'Product Catalog', priority: 'h' },
            { id: 'ai-3', title: 'Shopping Cart', priority: 'h' },
            { id: 'ai-4', title: 'Checkout Flow', priority: 'm' },
            { id: 'ai-5', title: 'Payment Integration', priority: 'm' },
            { id: 'ai-6', title: 'Order Tracking', priority: 'l' }
          ]
        })
      });
    });

    // Click Generate Backlog button
    const generateBtn = page.locator('#generate-backlog');
    await generateBtn.click();
    
    // Handle the prompt dialog
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toContain('backlog items');
      await dialog.accept('Create e-commerce features');
    });
    
    // Wait for the button to change text
    await expect(generateBtn).toContainText('Generating...');
    
    // Wait for page reload
    await page.waitForLoadState('networkidle');
    
    // Verify cards were created in Backlog
    const backlogCards = page.locator('[data-testid="column-Backlog"] [data-card-id]');
    
    // Should have at least some cards
    await expect(backlogCards).toHaveCount(6, { timeout: 10000 });
  });

  test('should handle AI generation errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('/api/ai/backlog', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'OpenAI API error' })
      });
    });

    // Click Generate Backlog button
    const generateBtn = page.locator('#generate-backlog');
    await generateBtn.click();
    
    // Handle the prompt dialog
    page.once('dialog', async dialog => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('Test prompt');
      } else if (dialog.type() === 'alert') {
        expect(dialog.message()).toContain('Failed to generate backlog');
        await dialog.accept();
      }
    });
    
    // Wait for alert
    await page.waitForTimeout(1000);
    
    // Button should be re-enabled
    await expect(generateBtn).toBeEnabled();
    await expect(generateBtn).toContainText('Generate Backlog');
  });

  test('should cancel AI generation on prompt cancel', async ({ page }) => {
    const generateBtn = page.locator('#generate-backlog');
    
    // Setup dialog handler before clicking
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      await dialog.dismiss(); // Cancel the prompt
    });
    
    await generateBtn.click();
    
    // Button should remain unchanged
    await expect(generateBtn).toContainText('Generate Backlog');
    await expect(generateBtn).toBeEnabled();
  });
});

test.describe('P0 Features - Integration', () => {
  test('should generate backlog and then drag cards', async ({ page, request, baseURL }) => {
    // Clear board first
    if (process.env.ENABLE_TEST_ENDPOINTS === '1') {
      await seedTestBoard(request, baseURL!, [
        { id: 'Backlog', name: 'Backlog', cards: [] },
        { id: 'Doing', name: 'In Progress', cards: [] },
        { id: 'Done', name: 'Done', cards: [] }
      ]);
    }
    
    await page.goto('/');
    
    // Mock AI generation
    await page.route('/api/ai/backlog', async route => {
      // First create cards via API
      const card1 = await createTestCard(request, baseURL!, 'Backlog', 'AI Generated Card 1');
      const card2 = await createTestCard(request, baseURL!, 'Backlog', 'AI Generated Card 2');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generated: 2,
          created: 2,
          cards: [
            { id: card1, title: 'AI Generated Card 1', priority: 'h' },
            { id: card2, title: 'AI Generated Card 2', priority: 'm' }
          ]
        })
      });
    });
    
    // Generate backlog
    const generateBtn = page.locator('#generate-backlog');
    
    page.once('dialog', async dialog => {
      await dialog.accept('Generate test cards');
    });
    
    await generateBtn.click();
    await page.waitForLoadState('networkidle');
    
    // Wait for cards to appear
    await page.waitForSelector('[data-card-id]', { timeout: 10000 });
    
    // Now drag the first generated card to In Progress
    const firstCard = page.locator('[data-card-id]').first();
    const doingColumn = page.locator('[data-droppable="Doing"]').first();
    
    await firstCard.dragTo(doingColumn);
    await page.waitForTimeout(1000);
    
    // Verify card moved
    const doingCards = page.locator('[data-testid="column-Doing"] [data-card-id]');
    await expect(doingCards).toHaveCount(1);
  });
});