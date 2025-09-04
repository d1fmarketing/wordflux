import { test, expect } from '@playwright/test';

test('GET /api/health returns ok', async ({ request, baseURL }) => {
  const res = await request.get(`${baseURL}/api/health`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toMatchObject({ ok: true });
});

