import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './guides',
  testMatch: '**/*.ts', // Match all TypeScript files in guides
  fullyParallel: false, // Run sequentially for consistent state
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'off',
    screenshot: 'off', // We handle screenshots manually
    video: 'off',

    // Consistent viewport for all screenshots
    viewport: { width: 1280, height: 800 },
  },

  // Single project - desktop only for docs
  projects: [
    {
      name: 'docs-screenshots',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
