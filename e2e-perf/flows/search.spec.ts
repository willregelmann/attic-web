import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';

test.describe('Search Performance', () => {

  test('text search from header', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid', { timeout: 30000 });

    // Open search
    const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="Search"]');

    const startTime = Date.now();
    await searchInput.fill('Pokemon');

    // Wait for search results dropdown
    await page.waitForSelector('[data-testid="search-results"], .search-dropdown, .search-results', {
      timeout: 10000
    });

    const searchTime = Date.now() - startTime;
    console.log(`  Text search: ${searchTime}ms`);
  });

  test('full search results page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Navigate directly to search results
    const startTime = Date.now();
    await page.goto('/search?q=Alpha');

    // Wait for results to load
    await page.waitForSelector('.item-card, [data-testid="search-result-item"], .search-results', {
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;
    console.log(`  Search results page: ${loadTime}ms`);
  });

  test('search with type filter', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    const startTime = Date.now();
    await page.goto('/search?q=test&type=collection');

    await page.waitForSelector('.collection-card, [data-testid="collection-card"], .search-results', {
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;
    console.log(`  Filtered search: ${loadTime}ms`);
  });

  test('semantic search', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Navigate to semantic search if available
    const startTime = Date.now();
    await page.goto('/search?q=vintage%20collectible%20cards&semantic=true');

    // Wait for results
    await page.waitForSelector('.item-card, .search-results, [data-testid="search-result"]', {
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;
    console.log(`  Semantic search: ${loadTime}ms`);
  });
});
