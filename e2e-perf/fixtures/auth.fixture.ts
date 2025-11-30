import { test as base, Page } from '@playwright/test';

export const PERF_TEST_USER = {
  email: 'perf-test@attic.local',
  password: 'perf-test-password',
};

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');

    // Fill credentials
    await page.fill('[data-testid="email-input"], input[type="email"]', PERF_TEST_USER.email);
    await page.fill('[data-testid="password-input"], input[type="password"]', PERF_TEST_USER.password);

    // Submit
    await page.click('[data-testid="login-button"], button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL('/', { timeout: 10000 });

    await use(page);
  },
});

export { expect } from '@playwright/test';
