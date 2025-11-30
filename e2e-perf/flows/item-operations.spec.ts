import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';
import { MetricsCollector } from '../utils/browser-metrics';

test.describe('Item Operations Performance', () => {

  test('navigate to collection with items', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    // Set up metrics before the action
    await metrics.setup();

    // Click on Small Collection (use proper selector)
    const smallCollection = page.locator('[data-testid="collection-card"]:has-text("Small Collection")');
    if (await smallCollection.isVisible()) {
      await smallCollection.click();
    } else {
      // Fallback: click first collection
      await page.locator('[data-testid="collection-card"]').first().click();
    }

    // Wait for items to load
    await page.waitForSelector('[data-testid="item-card"]', { timeout: 30000 });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  Navigate to collection: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);

    const itemCount = await page.locator('[data-testid="item-card"]').count();
    console.log(`  Items loaded: ${itemCount}`);
  });

  test('view item details', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    // Navigate to Small Collection or first collection with items
    const smallCollection = page.locator('[data-testid="collection-card"]:has-text("Small Collection")');
    if (await smallCollection.isVisible()) {
      await smallCollection.click();
    } else {
      await page.locator('[data-testid="collection-card"]').first().click();
    }

    // Wait for items
    await page.waitForSelector('[data-testid="item-card"]', { timeout: 30000 });

    // Set up metrics before the action
    await metrics.setup();

    // Click first item to view details
    await page.locator('[data-testid="item-card"]').first().click();

    // Wait for detail view/modal to appear (look for notes input as indicator)
    await page.waitForSelector('[data-testid="item-notes-input"], [role="dialog"], .modal', {
      timeout: 10000
    });

    const browserMetrics = await metrics.collectAndAnnotate(test.info());
    console.log(`  View item details: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);
  });

  test('edit item notes', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();
    const metrics = new MetricsCollector(page);

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-card"], [data-testid="item-card"]', { timeout: 30000 });

    // Navigate to Small Collection
    const smallCollection = page.locator('[data-testid="collection-card"]:has-text("Small Collection")');
    if (await smallCollection.isVisible()) {
      await smallCollection.click();
    } else {
      await page.locator('[data-testid="collection-card"]').first().click();
    }

    await page.waitForSelector('[data-testid="item-card"]', { timeout: 30000 });

    // Open item details
    await page.locator('[data-testid="item-card"]').first().click();
    await page.waitForSelector('[data-testid="item-notes-input"], [role="dialog"]', { timeout: 10000 });

    // Set up metrics before edit operation
    await metrics.setup();

    // Find and fill the notes input
    const notesInput = page.locator('[data-testid="item-notes-input"]');
    if (await notesInput.isVisible()) {
      await notesInput.fill(`Performance test note ${Date.now()}`);

      // Look for a save button or the input might auto-save
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000); // Allow save to complete
      }

      const browserMetrics = await metrics.collectAndAnnotate(test.info());
      console.log(`  Edit item notes: ${browserMetrics.totalNetworkTime}ms API, ${browserMetrics.estimatedRenderTime}ms render`);
    } else {
      console.log('  Notes input not visible, skipping edit test');
      await metrics.collectAndAnnotate(test.info());
    }
  });
});
