import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';

test.describe('Collection Tree Performance', () => {

  test('load root collection', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    // Inject trace headers
    await injectTraceHeaders(page, trace);

    // Record trace ID for reporter
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Navigate to My Collection (root)
    const startTime = Date.now();
    await page.goto('/my-collection');

    // Wait for collection content to load
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid, .item-card', {
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;
    console.log(`  Root collection load: ${loadTime}ms`);

    // Verify content loaded
    await expect(page.locator('body')).not.toContainText('Loading');
  });

  test('load nested collection with items', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Navigate to root first
    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid', { timeout: 30000 });

    // Click on Large Collection (triggers pagination)
    const startTime = Date.now();
    await page.click('text=Large Collection');

    // Wait for items to load
    await page.waitForSelector('.item-card, [data-testid="item-card"]', { timeout: 30000 });

    const loadTime = Date.now() - startTime;
    console.log(`  Large Collection load: ${loadTime}ms`);

    // Verify items loaded (should have 100)
    const itemCount = await page.locator('.item-card, [data-testid="item-card"]').count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('navigate deep nested hierarchy', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Navigate to root
    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid', { timeout: 30000 });

    // Navigate through hierarchy
    const startTime = Date.now();

    await page.click('text=Nested Hierarchy');
    await page.waitForSelector('text=Level 2', { timeout: 10000 });

    await page.click('text=Level 2');
    await page.waitForSelector('text=Level 3', { timeout: 10000 });

    await page.click('text=Level 3');
    await page.waitForSelector('.item-card, [data-testid="item-card"]', { timeout: 10000 });

    const totalNavTime = Date.now() - startTime;
    console.log(`  Deep navigation (3 levels): ${totalNavTime}ms`);
  });

  test('load mixed collection (owned + wishlisted)', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid', { timeout: 30000 });

    const startTime = Date.now();
    await page.click('text=Mixed Collection');

    // Wait for both owned and wishlisted items
    await page.waitForSelector('.item-card, [data-testid="item-card"]', { timeout: 30000 });

    const loadTime = Date.now() - startTime;
    console.log(`  Mixed Collection load: ${loadTime}ms`);
  });
});
