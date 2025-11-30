import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';

test.describe('Browse DBoT Performance', () => {

  test('load browse collections page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    const startTime = Date.now();
    await page.goto('/browse');

    // Wait for collections to load
    await page.waitForSelector('.collection-card, [data-testid="collection-card"], .browse-grid', {
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;
    console.log(`  Browse page load: ${loadTime}ms`);

    // Verify collections loaded
    const collectionCount = await page.locator('.collection-card, [data-testid="collection-card"]').count();
    expect(collectionCount).toBeGreaterThan(0);
  });

  test('view DBoT collection items', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/browse');
    await page.waitForSelector('.collection-card, [data-testid="collection-card"]', { timeout: 30000 });

    const startTime = Date.now();

    // Click first collection
    await page.locator('.collection-card, [data-testid="collection-card"]').first().click();

    // Wait for collection items to load
    await page.waitForSelector('.item-card, [data-testid="item-card"], .collection-items', {
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;
    console.log(`  DBoT collection items load: ${loadTime}ms`);
  });

  test('filter DBoT collection', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/browse');
    await page.waitForSelector('.collection-card, [data-testid="collection-card"]', { timeout: 30000 });

    // Navigate to a collection with filters
    await page.locator('.collection-card, [data-testid="collection-card"]').first().click();
    await page.waitForSelector('.item-card, [data-testid="item-card"]', { timeout: 30000 });

    // Look for filter panel
    const filterPanel = page.locator('[data-testid="filter-panel"], .filter-sidebar, .filters');

    if (await filterPanel.isVisible()) {
      const startTime = Date.now();

      // Click first filter option
      await filterPanel.locator('input[type="checkbox"], .filter-option').first().click();

      // Wait for filtered results
      await page.waitForTimeout(1000); // Allow for filter to apply

      const filterTime = Date.now() - startTime;
      console.log(`  Apply filter: ${filterTime}ms`);
    } else {
      console.log('  No filter panel found, skipping filter test');
    }
  });

  test('paginate through DBoT collection', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/browse');
    await page.waitForSelector('.collection-card, [data-testid="collection-card"]', { timeout: 30000 });

    // Navigate to a large collection
    await page.locator('.collection-card, [data-testid="collection-card"]').first().click();
    await page.waitForSelector('.item-card, [data-testid="item-card"]', { timeout: 30000 });

    // Look for pagination or load more
    const loadMore = page.locator('[data-testid="load-more"], button:has-text("Load More"), .pagination');

    if (await loadMore.isVisible()) {
      const startTime = Date.now();

      await loadMore.click();

      // Wait for more items to load
      await page.waitForTimeout(2000);

      const paginateTime = Date.now() - startTime;
      console.log(`  Load more items: ${paginateTime}ms`);
    } else {
      console.log('  No pagination found, skipping');
    }
  });
});
