import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';
import { MetricsCollector } from '../utils/browser-metrics';

test.describe('Search Performance', () => {

  test('text search from header dropdown', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    // Find the search input by placeholder (it's in the desktop nav)
    const searchInput = page.locator('input[placeholder*="Search"]');

    // Set up metrics before the action
    await metrics.setup();

    await searchInput.fill('Pokemon');

    // Wait for search results dropdown to appear
    await page.waitForSelector('[data-testid="search-results"]', {
      timeout: 10000
    });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Search dropdown: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

    // Count results shown in dropdown
    const resultCount = await page.locator('[data-testid="search-results"] button').count();
    console.log(`  Results in dropdown: ${resultCount}`);
  });

  test('full search results page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    await metrics.setup();
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Navigate directly to search results page
    await page.goto('/search?q=Alpha');

    // Wait for either item cards or collection cards to load
    await page.waitForSelector('[data-testid="item-card"], [data-testid="collection-card"]', {
      timeout: 30000
    });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Search results page: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

    // Count results
    const itemCount = await page.locator('[data-testid="item-card"]').count();
    const collectionCount = await page.locator('[data-testid="collection-card"]').count();
    console.log(`  Results: ${itemCount} items, ${collectionCount} collections`);
  });

  test('search with different queries', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    await metrics.setup();
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Test search with a specific term
    await page.goto('/search?q=test');

    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', {
      timeout: 30000
    });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Search 'test': ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

    const resultCount = await page.locator('[data-testid="item-card"], [data-testid="collection-card"]').count();
    console.log(`  Total results: ${resultCount}`);
  });

  test('semantic search query', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    await metrics.setup();
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Test semantic search with natural language query
    await page.goto('/search?q=vintage%20collectible%20cards');

    // Wait for results to load
    await page.waitForSelector('[data-testid="item-card"], [data-testid="collection-card"]', {
      timeout: 30000
    });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Semantic search: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

    const resultCount = await page.locator('[data-testid="item-card"], [data-testid="collection-card"]').count();
    console.log(`  Results: ${resultCount}`);
  });
});
