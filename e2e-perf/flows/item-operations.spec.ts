import { test, expect } from '../fixtures/auth.fixture';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';

test.describe('Item Operations Performance', () => {

  test('open add item modal', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid', { timeout: 30000 });

    // Click on Small Collection first
    await page.click('text=Small Collection');
    await page.waitForSelector('.item-card, [data-testid="item-card"]', { timeout: 10000 });

    const startTime = Date.now();

    // Open add item modal
    await page.click('[data-testid="add-item-button"], button:has-text("Add Item")');

    // Wait for modal to open
    await page.waitForSelector('[data-testid="add-item-modal"], .modal, [role="dialog"]', {
      timeout: 10000
    });

    const openTime = Date.now() - startTime;
    console.log(`  Open add item modal: ${openTime}ms`);
  });

  test('view item details', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid', { timeout: 30000 });

    // Navigate to Small Collection
    await page.click('text=Small Collection');
    await page.waitForSelector('.item-card, [data-testid="item-card"]', { timeout: 10000 });

    const startTime = Date.now();

    // Click first item to view details
    await page.locator('.item-card, [data-testid="item-card"]').first().click();

    // Wait for details to load
    await page.waitForSelector('[data-testid="item-details"], .item-detail, .modal', {
      timeout: 10000
    });

    const loadTime = Date.now() - startTime;
    console.log(`  View item details: ${loadTime}ms`);
  });

  test('edit item notes', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid', { timeout: 30000 });

    await page.click('text=Small Collection');
    await page.waitForSelector('.item-card, [data-testid="item-card"]', { timeout: 10000 });

    // Open item details
    await page.locator('.item-card, [data-testid="item-card"]').first().click();
    await page.waitForSelector('[data-testid="item-details"], .item-detail, .modal', { timeout: 10000 });

    // Start timing edit operation
    const startTime = Date.now();

    // Click edit button
    await page.click('[data-testid="edit-item-button"], button:has-text("Edit")');

    // Fill notes
    const notesInput = page.locator('[data-testid="notes-input"], textarea[name="notes"]');
    await notesInput.fill(`Performance test note ${Date.now()}`);

    // Save
    await page.click('[data-testid="save-button"], button:has-text("Save")');

    // Wait for save confirmation
    await page.waitForSelector('[data-testid="toast-success"], .toast, .notification', {
      timeout: 10000
    }).catch(() => {}); // Toast may not appear

    const editTime = Date.now() - startTime;
    console.log(`  Edit item: ${editTime}ms`);
  });
});
