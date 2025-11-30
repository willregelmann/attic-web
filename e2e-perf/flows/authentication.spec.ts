import { test as base, expect } from '@playwright/test';
import { generateTraceContext, injectTraceHeaders } from '../utils/trace-correlation';
import { PERF_TEST_USER } from '../fixtures/auth.fixture';

// Use base test without auth fixture for login tests
const test = base;

test.describe('Authentication Performance', () => {

  test('login flow', async ({ page }) => {
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    const startTime = Date.now();

    await page.goto('/login');

    // Wait for login form
    await page.waitForSelector('input[type="email"], [data-testid="email-input"]', { timeout: 10000 });

    const pageLoadTime = Date.now() - startTime;
    console.log(`  Login page load: ${pageLoadTime}ms`);

    // Fill and submit
    const submitStart = Date.now();

    await page.fill('input[type="email"], [data-testid="email-input"]', PERF_TEST_USER.email);
    await page.fill('input[type="password"], [data-testid="password-input"]', PERF_TEST_USER.password);
    await page.click('button[type="submit"], [data-testid="login-button"]');

    // Wait for redirect to home
    await page.waitForURL('/', { timeout: 10000 });

    const loginTime = Date.now() - submitStart;
    console.log(`  Login submission: ${loginTime}ms`);
  });

  test('logout flow', async ({ page }) => {
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // First login
    await page.goto('/login');
    await page.fill('input[type="email"], [data-testid="email-input"]', PERF_TEST_USER.email);
    await page.fill('input[type="password"], [data-testid="password-input"]', PERF_TEST_USER.password);
    await page.click('button[type="submit"], [data-testid="login-button"]');
    await page.waitForURL('/', { timeout: 10000 });

    const startTime = Date.now();

    // Find and click logout
    const userMenu = page.locator('[data-testid="user-menu"], .user-dropdown, .avatar');
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }

    await page.click('[data-testid="logout-button"], button:has-text("Logout"), a:has-text("Logout")');

    // Wait for redirect to login
    await page.waitForURL('**/login**', { timeout: 10000 });

    const logoutTime = Date.now() - startTime;
    console.log(`  Logout flow: ${logoutTime}ms`);
  });

  test('authenticated page load (with existing session)', async ({ page }) => {
    const trace = generateTraceContext();

    await injectTraceHeaders(page, trace);
    test.info().annotations.push({ type: 'traceId', description: trace.traceId });

    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"], [data-testid="email-input"]', PERF_TEST_USER.email);
    await page.fill('input[type="password"], [data-testid="password-input"]', PERF_TEST_USER.password);
    await page.click('button[type="submit"], [data-testid="login-button"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Now measure subsequent navigation
    const startTime = Date.now();

    await page.goto('/my-collection');
    await page.waitForSelector('[data-testid="collection-content"], .collection-grid', { timeout: 30000 });

    const loadTime = Date.now() - startTime;
    console.log(`  Authenticated page load: ${loadTime}ms`);
  });
});
