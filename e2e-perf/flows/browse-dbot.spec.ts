import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';
import { MetricsCollector } from '../utils/browser-metrics';

// Note: There is no /browse route - authenticated users go to /my-collection
// DBoT collections are accessed via /collection/:id
test.describe('Browse DBoT Performance', () => {

  test('load my-collection page (authenticated home)', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    await metrics.setup();
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');

    // Wait for collections or items to load
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', {
      timeout: 30000
    });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  My Collection: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

    // Verify content loaded
    const collectionCount = await page.locator('[data-testid="collection-card"]').count();
    const itemCount = await page.locator('[data-testid="item-card"]').count();
    console.log(`  Loaded: ${collectionCount} collections, ${itemCount} items`);
    expect(collectionCount + itemCount).toBeGreaterThan(0);
  });

  test('navigate to nested user collection', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    // Set up metrics capture before the action we're measuring
    await metrics.setup();

    // Click first collection to navigate into it
    const collections = page.locator('[data-testid="collection-card"]');
    if (await collections.count() > 0) {
      await collections.first().click();

      // Wait for navigation and content to load
      await page.waitForLoadState('networkidle', { timeout: 15000 });

      const browserMetrics = await metrics.collectAndAnnotate(test.info());
      console.log(`  Nested collection: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

      // Count what loaded
      const itemCount = await page.locator('[data-testid="item-card"]').count();
      const nestedCollections = await page.locator('[data-testid="collection-card"]').count();
      console.log(`  Loaded: ${itemCount} items, ${nestedCollections} collections`);
    } else {
      console.log('  No collections to navigate into');
      await metrics.collectAndAnnotate(test.info());
    }
  });

  test('navigate through collection hierarchy', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    // Set up metrics capture before navigation
    await metrics.setup();

    // Navigate through multiple levels
    let depth = 0;
    const maxDepth = 3;

    while (depth < maxDepth) {
      const collections = page.locator('[data-testid="collection-card"]');
      const collectionCount = await collections.count();

      if (collectionCount > 0) {
        await collections.first().click();
        // Wait for navigation to complete
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        depth++;
        console.log(`  Navigated to depth ${depth}`);
      } else {
        console.log(`  No more collections at depth ${depth}`);
        break;
      }
    }

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Hierarchy navigation (${depth} levels): ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);
  });

  test('my-collection with many items', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    await metrics.setup();
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');

    // Wait for initial load
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    // Count total content visible
    const collectionCount = await page.locator('[data-testid="collection-card"]').count();
    const itemCount = await page.locator('[data-testid="item-card"]').count();
    console.log(`  Initial: ${collectionCount} collections, ${itemCount} items`);

    // If there's pagination or scroll loading, wait for more
    await page.waitForTimeout(1000);
    const finalCollections = await page.locator('[data-testid="collection-card"]').count();
    const finalItems = await page.locator('[data-testid="item-card"]').count();

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Many items: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

    if (finalCollections > collectionCount || finalItems > itemCount) {
      console.log(`  After wait: ${finalCollections} collections, ${finalItems} items`);
    }
  });
});
