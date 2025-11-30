import { test } from '@playwright/test';
import { screenshot, authenticate, waitForPageReady, generateMarkdown, clearGuideSections } from '../utils/screenshot-helper';

const GUIDE = '02-discovering-items';
const TITLE = 'Discovering Items';

test.describe('Discovering Items Guide', () => {

  test.beforeAll(() => {
    clearGuideSections(GUIDE);
  });

  test('01 - search landing', async ({ page }) => {
    await authenticate(page);
    await page.goto('/browse');
    await waitForPageReady(page);

    await screenshot(page, GUIDE, '01-search-landing', {
      caption: 'Start by searching for collections and items',
    });
  });

  test('02 - search results', async ({ page }) => {
    await authenticate(page);
    // Navigate directly to search results to show collections
    await page.goto('/search?q=pokemon');
    await waitForPageReady(page);

    // Wait for results to load
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 10000 }).catch(() => {});

    await screenshot(page, GUIDE, '02-search-results', {
      caption: 'Search results show matching collections and items',
    });
  });

  test('03 - inside collection', async ({ page }) => {
    await authenticate(page);
    // Navigate to Pokemon TCG collection directly
    await page.goto('/search?q=pokemon');
    await waitForPageReady(page);

    // Click on Pokemon Trading Card Game collection
    const pokemonCollection = page.locator('[data-testid="collection-card"]').first();
    await pokemonCollection.waitFor({ timeout: 10000 }).catch(() => {});
    if (await pokemonCollection.isVisible()) {
      await pokemonCollection.click();
      await waitForPageReady(page);
    }

    await screenshot(page, GUIDE, '03-inside-collection', {
      caption: 'Inside a collection - browse subcollections and items',
    });
  });

  test('04 - search dropdown', async ({ page }) => {
    await authenticate(page);
    await page.goto('/my-collection');
    await waitForPageReady(page);

    // Find and focus search input
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill('pokemon');
      await page.waitForTimeout(800); // Wait for search results
    }

    await screenshot(page, GUIDE, '04-search-dropdown', {
      caption: 'Search shows instant results as you type',
    });
  });

  test('05 - item detail modal', async ({ page }) => {
    await authenticate(page);
    // Navigate to search results, then into a collection with items
    await page.goto('/search?q=pokemon');
    await waitForPageReady(page);

    // Click into Pokemon collection
    const pokemonCollection = page.locator('[data-testid="collection-card"]').first();
    await pokemonCollection.waitFor({ timeout: 10000 }).catch(() => {});
    if (await pokemonCollection.isVisible()) {
      await pokemonCollection.click();
      await waitForPageReady(page);

      // Click into Base Set subcollection to find actual items
      const baseSet = page.locator('[data-testid="collection-card"]').first();
      await baseSet.waitFor({ timeout: 5000 }).catch(() => {});
      if (await baseSet.isVisible()) {
        await baseSet.click();
        await waitForPageReady(page);
      }

      // Wait for and click first item
      const firstItem = page.locator('[data-testid="item-card"]').first();
      await firstItem.waitFor({ timeout: 10000 }).catch(() => {});
      if (await firstItem.isVisible()) {
        await firstItem.click();
        await page.waitForTimeout(500);
      }
    }

    await screenshot(page, GUIDE, '05-item-detail-modal', {
      caption: 'Item details show all information about a collectible',
    });
  });

  test.afterAll(() => {
    generateMarkdown(GUIDE, TITLE);
  });
});
