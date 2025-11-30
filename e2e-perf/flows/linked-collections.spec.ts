import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';

test.describe('Linked Collections Performance', () => {

  test('wishlist DBoT collection modal', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Go to browse
    await page.goto('/browse');
    await page.waitForSelector('.collection-card, [data-testid="collection-card"]', { timeout: 30000 });

    const startTime = Date.now();

    // Find wishlist/track button on a collection card
    const collectionCard = page.locator('.collection-card, [data-testid="collection-card"]').first();
    const wishlistButton = collectionCard.locator('[data-testid="wishlist-button"], button:has-text("Track"), button:has-text("Wishlist")');

    if (await wishlistButton.isVisible()) {
      await wishlistButton.click();

      // Wait for modal
      await page.waitForSelector('[data-testid="wishlist-modal"], .modal, [role="dialog"]', {
        timeout: 10000
      });

      const modalTime = Date.now() - startTime;
      console.log(`  Wishlist modal open: ${modalTime}ms`);
    } else {
      // Alternative: hover and click
      await collectionCard.hover();
      await page.waitForTimeout(500);

      const hoverButton = collectionCard.locator('button').first();
      if (await hoverButton.isVisible()) {
        await hoverButton.click();
      }

      console.log('  Wishlist button not found in expected location');
    }
  });

  test('view linked collection progress', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Navigate to my collection
    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid', { timeout: 30000 });

    // Look for a linked collection (should show progress indicator)
    const linkedCollection = page.locator('.collection-card:has(.progress-bar), [data-testid="linked-collection"]');

    if (await linkedCollection.first().isVisible()) {
      const startTime = Date.now();

      await linkedCollection.first().click();

      // Wait for collection with progress stats
      await page.waitForSelector('.progress-stats, [data-testid="collection-progress"], .item-card', {
        timeout: 30000
      });

      const loadTime = Date.now() - startTime;
      console.log(`  Linked collection load: ${loadTime}ms`);
    } else {
      console.log('  No linked collections found, skipping progress test');
    }
  });

  test('load linked collection with many items (pagination test)', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // This test specifically targets the pagination optimization we just made
    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid', { timeout: 30000 });

    // Count collections with progress indicators (linked collections)
    const linkedCollections = page.locator('.collection-card:has(.progress-bar), .collection-card:has([data-testid="progress"])');
    const count = await linkedCollections.count();

    console.log(`  Found ${count} linked collections`);

    if (count > 0) {
      const startTime = Date.now();

      // Click the first linked collection
      await linkedCollections.first().click();

      // Wait for all items to load (including DBoT items via pagination)
      await page.waitForSelector('.item-card, [data-testid="item-card"]', { timeout: 30000 });

      // Wait a bit more to ensure all pagination completes
      await page.waitForTimeout(1000);

      const loadTime = Date.now() - startTime;
      console.log(`  Linked collection with items: ${loadTime}ms`);

      // Count items loaded
      const itemCount = await page.locator('.item-card, [data-testid="item-card"]').count();
      console.log(`  Items loaded: ${itemCount}`);
    }
  });
});
