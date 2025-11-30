import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';
import { MetricsCollector } from '../utils/browser-metrics';

test.describe('Collection Tree Performance', () => {

  test('load root collection', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    await metrics.setup();
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');

    // Wait for collection cards to load
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', {
      timeout: 30000
    });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Root collection: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);
    if (browserMetrics.firstContentfulPaint) {
      console.log(`  FCP: ${Math.round(browserMetrics.firstContentfulPaint)}ms`);
    }

    // Verify content loaded
    await expect(page.locator('body')).not.toContainText('Loading');
  });

  test('load nested collection with items', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Navigate to root first
    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"]', { timeout: 30000 });

    // Set up metrics before the action we're measuring
    await metrics.setup();

    // Click on Large Collection (triggers pagination)
    await page.click('[data-testid="collection-card"]:has-text("Large Collection")');

    // Wait for items to load
    await page.waitForSelector('[data-testid="item-card"]', { timeout: 30000 });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Large Collection: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

    // Verify items loaded (should have 100)
    const itemCount = await page.locator('[data-testid="item-card"]').count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('navigate deep nested hierarchy', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Navigate to root
    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"]', { timeout: 30000 });

    // Set up metrics before navigation
    await metrics.setup();

    await page.click('[data-testid="collection-card"]:has-text("Nested Hierarchy")');
    await page.waitForSelector('[data-testid="collection-card"]:has-text("Level 2")', { timeout: 10000 });

    await page.click('[data-testid="collection-card"]:has-text("Level 2")');
    await page.waitForSelector('[data-testid="collection-card"]:has-text("Level 3")', { timeout: 10000 });

    await page.click('[data-testid="collection-card"]:has-text("Level 3")');
    await page.waitForSelector('[data-testid="item-card"]', { timeout: 10000 });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Deep navigation (3 levels): ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);
  });

  test('load mixed collection (owned + wishlisted)', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"]', { timeout: 30000 });

    // Set up metrics before the action
    await metrics.setup();

    await page.click('[data-testid="collection-card"]:has-text("Mixed Collection")');

    // Wait for items to load
    await page.waitForSelector('[data-testid="item-card"]', { timeout: 30000 });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Mixed Collection: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);
  });
});
