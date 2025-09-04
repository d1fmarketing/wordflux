import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    // Point tests at the already-running PM2 server
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
});
