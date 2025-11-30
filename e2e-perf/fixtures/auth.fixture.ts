import { test as base, Page } from '@playwright/test';

export const PERF_TEST_USER = {
  email: 'perf-test@attic.local',
  name: 'Performance Test User',
};

// User data stored in localStorage by AuthContext
const PERF_TEST_USER_DATA = {
  id: 'perf-test-user-id',
  email: PERF_TEST_USER.email,
  name: PERF_TEST_USER.name,
};

type AuthFixtures = {
  authenticatedPage: Page;
};

/**
 * Generate a fresh API token for the perf test user.
 * This calls the backend to create a Sanctum token.
 */
async function getOrCreatePerfTestToken(): Promise<string> {
  const apiUrl = process.env.API_URL || 'http://localhost:8000';

  // Use a GraphQL mutation or custom endpoint to get a token
  // For now, we use a pre-generated token that can be refreshed by running:
  // docker exec attic-api php artisan tinker --execute="..."
  //
  // In production, you'd want a proper test token endpoint or use the seeder
  // to output the token. For local dev, this hardcoded token works.
  const token = process.env.PERF_TEST_TOKEN;

  if (!token) {
    throw new Error(
      'PERF_TEST_TOKEN environment variable not set.\n' +
      'Generate one with: docker exec attic-api php artisan tinker --execute="\n' +
      '  \\$user = \\App\\Models\\User::where(\'email\', \'perf-test@attic.local\')->first();\n' +
      '  echo \\$user->createToken(\'perf-test\')->plainTextToken;\n' +
      '"'
    );
  }

  return token;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const token = await getOrCreatePerfTestToken();

    // Set up localStorage before navigating
    // This is how Playwright injects storage state
    await page.addInitScript(({ token, userData }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
    }, { token, userData: PERF_TEST_USER_DATA });

    // Navigate to home - the app will read from localStorage
    await page.goto('/');

    // Wait for authenticated state to be recognized
    // When logged in, the page shows "My Collection" heading
    await page.waitForSelector('h1:has-text("My Collection"), h2:has-text("My Collection")', {
      timeout: 10000,
      state: 'visible'
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
