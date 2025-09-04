import { test, expect } from '@playwright/test';

test('Home SSR contains brand and main regions', async ({ request, baseURL }) => {
  const res = await request.get(`${baseURL}/`);
  expect(res.ok()).toBeTruthy();
  const html = await res.text();
  expect(html).toContain('WORDFLUX');
  // Assistant panel or board skeleton hooks present
  expect(html.includes('assistant-panel') || html.includes('board-skeleton')).toBeTruthy();
});
