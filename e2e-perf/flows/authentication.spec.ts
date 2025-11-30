import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';
import { MetricsCollector } from '../utils/browser-metrics';

// Note: App uses Google OAuth only, so we use token-based authentication via the auth fixture
// These tests measure authenticated page load performance, not login form performance

test.describe('Authentication Performance', () => {

  test('initial authenticated page load', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    await metrics.setup();
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Auth fixture already loaded the page, measure a navigation
    await page.goto('/my-collection');
    // Wait for collection cards or items to load
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Authenticated page load: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);
  });

  test('navigation between pages (authenticated)', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    await metrics.setup();
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Start on my-collection (from fixture), navigate to browse
    await page.goto('/browse');
    await page.waitForSelector('[data-testid="collection-card"]', { timeout: 30000 });

    // Navigate back to my-collection
    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Navigation total: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);
  });

  test('authenticated API request (token validation)', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    await metrics.setup();
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // This test measures the GraphQL request with token validation
    // Navigate to a page that requires authentication
    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Authenticated API: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

    // Verify we're authenticated by checking for user-specific content
    const collectionCount = await page.locator('[data-testid="collection-card"]').count();
    expect(collectionCount).toBeGreaterThan(0);
  });
});
