import { test } from '@playwright/test';
import { screenshot, authenticate, waitForPageReady, generateMarkdown, clearGuideSections } from '../utils/screenshot-helper';

const GUIDE = '03-building-collection';
const TITLE = 'Building Your Collection';

test.describe('Building Your Collection Guide', () => {

  test.beforeAll(() => {
    clearGuideSections(GUIDE);
  });

  test('01 - add to collection button', async ({ page }) => {
    await authenticate(page);
    // Navigate via search to find items
    await page.goto('/search?q=pokemon');
    await waitForPageReady(page);

    // Click into Pokemon collection
    const pokemonCollection = page.locator('[data-testid="collection-card"]').first();
    await pokemonCollection.waitFor({ timeout: 10000 }).catch(() => {});
    if (await pokemonCollection.isVisible()) {
      await pokemonCollection.click();
      await waitForPageReady(page);

      // Click into Base Set subcollection
      const baseSet = page.locator('[data-testid="collection-card"]').first();
      await baseSet.waitFor({ timeout: 5000 }).catch(() => {});
      if (await baseSet.isVisible()) {
        await baseSet.click();
        await waitForPageReady(page);
      }

      // Click first item to open modal
      const firstItem = page.locator('[data-testid="item-card"]').first();
      await firstItem.waitFor({ timeout: 10000 }).catch(() => {});
      if (await firstItem.isVisible()) {
        await firstItem.click();
        await page.waitForTimeout(500);
      }
    }

    await screenshot(page, GUIDE, '01-add-to-collection-button', {
      caption: 'Click "Add to Collection" to mark an item as owned',
    });
  });

  test('02 - add item modal', async ({ page }) => {
    await authenticate(page);
    // Navigate via search to find items
    await page.goto('/search?q=pokemon');
    await waitForPageReady(page);

    // Click into Pokemon collection, then Base Set
    const pokemonCollection = page.locator('[data-testid="collection-card"]').first();
    await pokemonCollection.waitFor({ timeout: 10000 }).catch(() => {});
    if (await pokemonCollection.isVisible()) {
      await pokemonCollection.click();
      await waitForPageReady(page);

      const baseSet = page.locator('[data-testid="collection-card"]').first();
      await baseSet.waitFor({ timeout: 5000 }).catch(() => {});
      if (await baseSet.isVisible()) {
        await baseSet.click();
        await waitForPageReady(page);
      }

      const firstItem = page.locator('[data-testid="item-card"]').first();
      await firstItem.waitFor({ timeout: 10000 }).catch(() => {});
      if (await firstItem.isVisible()) {
        await firstItem.click();
        await page.waitForTimeout(500);

        // Click add button to show modal/form
        const addButton = page.locator('[data-testid="add-to-collection-btn"], button:has-text("Add to Collection"), button:has-text("Add to My Collection")').first();
        await addButton.waitFor({ timeout: 5000 }).catch(() => {});
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(500);
        }
      }
    }

    await screenshot(page, GUIDE, '02-add-item-modal', {
      caption: 'Add personal notes when adding items to your collection',
    });
  });

  test('03 - owned item card', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Navigate into a collection that has items (Mixed Collection often has items)
    const mixedCollection = page.locator('[data-testid="collection-card"]').filter({ hasText: 'Mixed' }).first();
    await mixedCollection.waitFor({ timeout: 5000 }).catch(() => {});
    if (await mixedCollection.isVisible()) {
      await mixedCollection.click();
      await waitForPageReady(page);
      await page.waitForTimeout(500);
    }

    await screenshot(page, GUIDE, '03-owned-item-card', {
      caption: 'Items in your collection show an "owned" indicator',
    });
  });

  test('04 - my collection with items', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    // Wait for content to load
    await page.waitForTimeout(1000);
    await page.waitForSelector('[data-testid="collection-card"]', { timeout: 10000 }).catch(() => {});

    await screenshot(page, GUIDE, '04-my-collection-items', {
      caption: 'Your collection shows all owned items organized by collection',
    });
  });

  test.afterAll(() => {
    generateMarkdown(GUIDE, TITLE);
  });
});
