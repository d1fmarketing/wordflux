import { test, expect } from '@playwright/test';

test.describe('WordFlux Chat Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#chat-input');
  });

  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle(/WordFlux/);
    await expect(page.locator('h2:text("GPT-5 Assistant")')).toBeVisible();
    await expect(page.locator('#chat-input')).toBeVisible();
    await expect(page.locator('#chat-send')).toBeVisible();
  });

  test('should display initial chat message', async ({ page }) => {
    const initialMessage = page.locator('#chat-log > div').first();
    await expect(initialMessage).toContainText('I help organize work');
  });

  test('should send a chat message', async ({ page }) => {
    // Type a message
    await page.fill('#chat-input', 'Test message from Playwright');
    
    // Click send button
    await page.click('#chat-send');
    
    // Wait for message to appear in chat log
    await page.waitForTimeout(1000);
    
    // Check that message appears
    const chatLog = page.locator('#chat-log');
    await expect(chatLog).toContainText('Test message from Playwright');
  });

  test('should receive AI response', async ({ page }) => {
    // Type a message
    await page.fill('#chat-input', 'What should we prioritize?');
    
    // Click send button
    await page.click('#chat-send');
    
    // Wait for API response (longer timeout for API call)
    await page.waitForTimeout(3000);
    
    // Check that response appears (even if it's "No response")
    const chatLog = page.locator('#chat-log');
    const messages = await chatLog.locator('div').count();
    
    // Should have at least 3 messages: initial, user message, AI response
    expect(messages).toBeGreaterThanOrEqual(3);
  });

  test('should handle Enter key to send message', async ({ page }) => {
    // Type a message
    await page.fill('#chat-input', 'Testing Enter key');
    
    // Press Enter
    await page.press('#chat-input', 'Enter');
    
    // Wait for message to appear
    await page.waitForTimeout(1000);
    
    // Check that message appears
    const chatLog = page.locator('#chat-log');
    await expect(chatLog).toContainText('Testing Enter key');
  });

  test('should clear input after sending', async ({ page }) => {
    // Type a message
    await page.fill('#chat-input', 'This should be cleared');
    
    // Click send button
    await page.click('#chat-send');
    
    // Wait for processing
    await page.waitForTimeout(500);
    
    // Check that input is cleared
    const inputValue = await page.inputValue('#chat-input');
    expect(inputValue).toBe('');
  });

  test('board should not have special characters', async ({ page }) => {
    // Get the page content as text
    const content = await page.content();
    
    // Check that there's no non-breaking hyphen (U+2011)
    expect(content).not.toContain('\u2011');
    
    // Check that normal hyphen exists
    expect(content).toContain('Auto-move');
  });
});

test.describe('API Tests', () => {
  test('chat API should respond without errors', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/chat', {
      data: {
        message: 'Test from Playwright API',
        board: null
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    
    // Should have response structure
    expect(json).toHaveProperty('response');
    expect(json).toHaveProperty('suggestions');
    expect(json).toHaveProperty('model');
    
    // Model should be GPT-5
    expect(json.model).toContain('gpt-5');
  });
});