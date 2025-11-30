import { test } from '@playwright/test';
import { screenshot, authenticate, waitForPageReady, generateMarkdown, clearGuideSections } from '../utils/screenshot-helper';

const GUIDE = '05-tracking-wishlist';
const TITLE = 'Tracking Your Wishlist';

test.describe('Tracking Your Wishlist Guide', () => {

  test.beforeAll(() => {
    clearGuideSections(GUIDE);
  });

  test('01 - add to wishlist button', async ({ page }) => {
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
      }
    }

    await screenshot(page, GUIDE, '01-add-to-wishlist-button', {
      caption: 'Click the heart icon to add items to your wishlist',
    });
  });

  test('02 - wishlist view', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Click Filter button and look for wishlist filter
    const filterBtn = page.getByRole('button', { name: 'Filter collection' });
    await filterBtn.waitFor({ timeout: 5000 }).catch(() => {});
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(300);

      // Look for wishlist toggle/checkbox
      const wishlistToggle = page.locator('text=Wishlist').first();
      if (await wishlistToggle.isVisible()) {
        await wishlistToggle.click();
        await page.waitForTimeout(500);
      }
    }

    await screenshot(page, GUIDE, '02-wishlist-view', {
      caption: 'Your wishlist shows items you want to acquire',
    });
  });

  test('03 - track collection flow', async ({ page }) => {
    await authenticate(page);
    // Navigate via search to show collection details
    await page.goto('/search?q=pokemon');
    await waitForPageReady(page);

    // Click into Pokemon collection
    const pokemonCollection = page.locator('[data-testid="collection-card"]').first();
    await pokemonCollection.waitFor({ timeout: 10000 }).catch(() => {});
    if (await pokemonCollection.isVisible()) {
      await pokemonCollection.click();
      await waitForPageReady(page);
    }

    await screenshot(page, GUIDE, '03-track-collection-flow', {
      caption: 'Track an entire collection to monitor your progress toward completion',
    });
  });

  test('04 - collection progress', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    // Wait for content to load
    await page.waitForTimeout(1000);
    await page.waitForSelector('[data-testid="collection-card"]', { timeout: 10000 }).catch(() => {});

    // Click into a collection that shows progress stats (any collection shows 0/0 or similar)
    const collection = page.locator('[data-testid="collection-card"]').first();
    await collection.waitFor({ timeout: 5000 }).catch(() => {});
    if (await collection.isVisible()) {
      await collection.click();
      await waitForPageReady(page);
      await page.waitForTimeout(500);
    }

    await screenshot(page, GUIDE, '04-collection-progress', {
      caption: 'Linked collections show your progress toward completion',
    });
  });

  test.afterAll(() => {
    generateMarkdown(GUIDE, TITLE);
  });
});
