import { Page } from '@playwright/test';

export interface NetworkTiming {
  url: string;
  method: string;
  duration: number;
  timestamp: number;
}

export interface BrowserMetrics {
  // Network timing
  networkRequests: NetworkTiming[];
  totalNetworkTime: number;

  // Paint timing
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;

  // Calculated
  estimatedRenderTime: number;
}

/**
 * Capture network request timing for GraphQL requests
 */
export async function setupNetworkCapture(page: Page): Promise<() => NetworkTiming[]> {
  const requests: NetworkTiming[] = [];
  const pendingRequests = new Map<string, number>();

  page.on('request', (request) => {
    if (request.url().includes('/graphql')) {
      pendingRequests.set(request.url() + request.postData(), Date.now());
    }
  });

  page.on('response', async (response) => {
    const request = response.request();
    if (request.url().includes('/graphql')) {
      const key = request.url() + request.postData();
      const startTime = pendingRequests.get(key);
      if (startTime) {
        requests.push({
          url: request.url(),
          method: request.method(),
          duration: Date.now() - startTime,
          timestamp: startTime,
        });
        pendingRequests.delete(key);
      }
    }
  });

  return () => requests;
}

/**
 * Get paint timing metrics from the browser
 */
export async function getPaintTiming(page: Page): Promise<{
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
}> {
  return await page.evaluate(() => {
    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    const fcp = fcpEntry ? fcpEntry.startTime : null;

    // Largest Contentful Paint (needs PerformanceObserver)
    // This is a fallback - for accurate LCP, we need to set up observer earlier
    let lcp: number | null = null;
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      lcp = lcpEntries[lcpEntries.length - 1].startTime;
    }

    return {
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
    };
  });
}

/**
 * Collect all browser metrics for a test
 */
export function calculateMetrics(
  networkRequests: NetworkTiming[],
  paintTiming: { firstContentfulPaint: number | null; largestContentfulPaint: number | null },
  totalTestDuration: number
): BrowserMetrics {
  const totalNetworkTime = networkRequests.reduce((sum, req) => sum + req.duration, 0);

  // Estimate render time = total duration - network time
  // This is approximate since network requests may overlap
  const estimatedRenderTime = Math.max(0, totalTestDuration - totalNetworkTime);

  return {
    networkRequests,
    totalNetworkTime,
    firstContentfulPaint: paintTiming.firstContentfulPaint,
    largestContentfulPaint: paintTiming.largestContentfulPaint,
    estimatedRenderTime,
  };
}

/**
 * MetricsCollector class to simplify metrics collection in tests
 */
export class MetricsCollector {
  private page: Page;
  private getNetworkRequests: (() => NetworkTiming[]) | null = null;
  private startTime: number = 0;

  constructor(page: Page) {
    this.page = page;
  }

  async setup(): Promise<void> {
    this.getNetworkRequests = await setupNetworkCapture(this.page);
    this.startTime = Date.now();
  }

  async collect(): Promise<BrowserMetrics> {
    const duration = Date.now() - this.startTime;
    const networkRequests = this.getNetworkRequests ? this.getNetworkRequests() : [];
    const paintTiming = await getPaintTiming(this.page);
    return calculateMetrics(networkRequests, paintTiming, duration);
  }

  async collectAndAnnotate(testInfo: { annotations: { push: (a: { type: string; description: string }) => void } }): Promise<BrowserMetrics> {
    const metrics = await this.collect();
    testInfo.annotations.push({
      type: 'browserMetrics',
      description: JSON.stringify(metrics)
    });
    return metrics;
  }
}
