import { test } from '@playwright/test';
import { screenshot, authenticate, waitForPageReady, generateMarkdown, clearGuideSections } from '../utils/screenshot-helper';

const GUIDE = '01-getting-started';
const TITLE = 'Getting Started with Will\'s Attic';

test.describe('Getting Started Guide', () => {

  test.beforeAll(() => {
    clearGuideSections(GUIDE);
  });

  test('01 - login page', async ({ page }) => {
    // Show the unauthenticated login page
    await page.goto('/');
    await waitForPageReady(page);

    await screenshot(page, GUIDE, '01-login-page', {
      caption: 'The login page - sign in with Google or create an account',
    });
  });

  test('02 - my collection view', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    // Wait for content to load
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"], [data-testid="empty-state"]', {
      timeout: 10000
    }).catch(() => {});

    await screenshot(page, GUIDE, '02-my-collection-view', {
      caption: 'Your personal collection view - this is your home base',
    });
  });

  test('03 - navigation bar', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    await screenshot(page, GUIDE, '03-navigation-bar', {
      caption: 'The navigation bar with search, browse, and your collection',
      highlight: 'nav, [data-testid="navbar"]',
    });
  });

  test('04 - user menu', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    // Click user menu button (has accessible name "User menu")
    const userButton = page.getByRole('button', { name: 'User menu' });
    await userButton.waitFor({ timeout: 5000 }).catch(() => {});
    if (await userButton.isVisible()) {
      await userButton.click();
      await page.waitForTimeout(300);
    }

    await screenshot(page, GUIDE, '04-user-menu', {
      caption: 'Access your account settings and sign out from the user menu',
    });
  });

  test.afterAll(() => {
    generateMarkdown(GUIDE, TITLE);
  });
});
