import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';
import { MetricsCollector } from '../utils/browser-metrics';

test.describe('Linked Collections Performance', () => {

  test('browse DBoT and interact with collection', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    await metrics.setup();
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Go to browse
    await page.goto('/browse');
    await page.waitForSelector('[data-testid="collection-card"]', { timeout: 30000 });

    // Hover over first collection card to reveal action buttons
    const collectionCard = page.locator('[data-testid="collection-card"]').first();
    await collectionCard.hover();
    await page.waitForTimeout(300);

    // Look for any button that appears on hover
    const actionButtons = collectionCard.locator('button');
    const buttonCount = await actionButtons.count();

    if (buttonCount > 0) {
      await actionButtons.first().click();

      // Wait for any modal or dialog to appear
      await page.waitForSelector('[role="dialog"], .modal', {
        timeout: 10000
      }).catch(() => {});
    }

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  DBoT interaction: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);
  });

  test('view user collection with linked items', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Navigate to my collection
    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    // Set up metrics before the action
    await metrics.setup();

    // Click on Large Collection which should have linked DBoT items
    const largeCollection = page.locator('[data-testid="collection-card"]:has-text("Large Collection")');
    if (await largeCollection.isVisible()) {
      await largeCollection.click();
    } else {
      // Fallback to first collection
      await page.locator('[data-testid="collection-card"]').first().click();
    }

    // Wait for items to load
    await page.waitForSelector('[data-testid="item-card"], [data-testid="collection-card"]', {
      timeout: 30000
    });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Linked collection: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

    const itemCount = await page.locator('[data-testid="item-card"]').count();
    const collectionCount = await page.locator('[data-testid="collection-card"]').count();
    console.log(`  Loaded: ${itemCount} items, ${collectionCount} collections`);
  });

  test('load large collection with pagination', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    // Set up metrics before the action
    await metrics.setup();

    // Click on Large Collection
    const largeCollection = page.locator('[data-testid="collection-card"]:has-text("Large Collection")');
    if (await largeCollection.isVisible()) {
      await largeCollection.click();

      // Wait for items to load
      await page.waitForSelector('[data-testid="item-card"]', { timeout: 30000 });

      // Count initial items
      const initialCount = await page.locator('[data-testid="item-card"]').count();
      console.log(`  Initial items loaded: ${initialCount}`);

      // Wait a bit for any additional pagination
      await page.waitForTimeout(1500);

      // Count final items
      const finalCount = await page.locator('[data-testid="item-card"]').count();

      const browserMetrics = await metrics.collectAndAnnotate(test.info());
      console.log(`  Large collection: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);
      console.log(`  Final items loaded: ${finalCount}`);

      if (finalCount > initialCount) {
        console.log(`  Additional items loaded via pagination: ${finalCount - initialCount}`);
      }
    } else {
      console.log('  Large Collection not found, skipping test');
      await metrics.collectAndAnnotate(test.info());
    }
  });
});
