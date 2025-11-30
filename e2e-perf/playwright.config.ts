import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './flows',
  fullyParallel: false, // Run sequentially for consistent profiling
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for perf tests
  workers: 1, // Single worker for consistent results
  reporter: [
    ['html'],
    ['json', { outputFile: 'results/results.json' }],
    ['./utils/profile-reporter.ts']
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on', // Always capture traces
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Increase timeout for performance tests
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});
