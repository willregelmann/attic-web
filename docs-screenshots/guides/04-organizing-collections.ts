import { test } from '@playwright/test';
import { screenshot, authenticate, waitForPageReady, generateMarkdown, clearGuideSections } from '../utils/screenshot-helper';

const GUIDE = '04-organizing-collections';
const TITLE = 'Organizing with Collections';

test.describe('Organizing with Collections Guide', () => {

  test.beforeAll(() => {
    clearGuideSections(GUIDE);
  });

  test('01 - create collection button', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    await screenshot(page, GUIDE, '01-create-collection-button', {
      caption: 'Click the + button to create a new collection',
    });
  });

  test('02 - create collection modal', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    // Wait for page to load collections
    await page.waitForTimeout(1000);

    // Click create collection button (uses role-based selector)
    const createBtn = page.getByRole('button', { name: 'Create new collection' });
    await createBtn.waitFor({ timeout: 5000 }).catch(() => {});
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);
    }

    await screenshot(page, GUIDE, '02-create-collection-modal', {
      caption: 'Give your collection a name and optional description',
    });
  });

  test('03 - collection tree', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    // Wait for content to load
    await page.waitForTimeout(1000);
    await page.waitForSelector('[data-testid="collection-card"]', { timeout: 10000 }).catch(() => {});

    // Navigate into Nested Hierarchy collection to show nested structure
    const nestedCollection = page.locator('[data-testid="collection-card"]').filter({ hasText: 'Nested Hierarchy' }).first();
    await nestedCollection.waitFor({ timeout: 5000 }).catch(() => {});
    if (await nestedCollection.isVisible()) {
      await nestedCollection.click();
      await waitForPageReady(page);
      await page.waitForTimeout(500);
    }

    await screenshot(page, GUIDE, '03-collection-tree', {
      caption: 'Collections can be nested to organize your items hierarchically',
    });
  });

  test('04 - breadcrumb navigation', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Navigate into Nested Hierarchy collection
    const nestedCollection = page.locator('[data-testid="collection-card"]').filter({ hasText: 'Nested Hierarchy' }).first();
    await nestedCollection.waitFor({ timeout: 5000 }).catch(() => {});
    if (await nestedCollection.isVisible()) {
      await nestedCollection.click();
      await waitForPageReady(page);
      await page.waitForTimeout(500);

      // Click first subcollection to go deeper
      const subCollection = page.locator('[data-testid="collection-card"]').first();
      await subCollection.waitFor({ timeout: 5000 }).catch(() => {});
      if (await subCollection.isVisible()) {
        await subCollection.click();
        await waitForPageReady(page);
        await page.waitForTimeout(500);
      }
    }

    await screenshot(page, GUIDE, '04-breadcrumb-navigation', {
      caption: 'Use breadcrumbs to navigate back up the collection hierarchy',
    });
  });

  test.afterAll(() => {
    generateMarkdown(GUIDE, TITLE);
  });
});
