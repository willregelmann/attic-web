import { Page } from '@playwright/test';
import { randomBytes } from 'crypto';

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceparent: string;
}

/**
 * Generate a unique trace context for correlation
 */
export function generateTraceContext(): TraceContext {
  const traceId = randomBytes(16).toString('hex');
  const spanId = randomBytes(8).toString('hex');
  const traceparent = `00-${traceId}-${spanId}-01`;

  return { traceId, spanId, traceparent };
}

/**
 * Inject traceparent header into all API requests
 */
export async function injectTraceHeaders(page: Page, traceContext: TraceContext): Promise<void> {
  await page.route('**/graphql**', async (route) => {
    const headers = {
      ...route.request().headers(),
      'traceparent': traceContext.traceparent,
    };
    await route.continue({ headers });
  });
}

/**
 * Build Tempo query URL for a trace
 */
export function getTempoUrl(traceId: string, grafanaBaseUrl = 'http://localhost:3000'): string {
  return `${grafanaBaseUrl}/explore?orgId=1&left=%5B%22now-1h%22,%22now%22,%22Tempo%22,%7B%22query%22:%22${traceId}%22%7D%5D`;
}

/**
 * Build Tempo API URL for fetching trace data
 */
export function getTempoApiUrl(traceId: string, tempoBaseUrl = 'http://localhost:3201'): string {
  return `${tempoBaseUrl}/api/traces/${traceId}`;
}
