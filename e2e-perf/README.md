# Performance Testing Suite

Browser-based performance profiling tests for Will's Attic using Playwright.

## Overview

This suite measures real-world performance by instrumenting browser tests with:
- **Network timing**: API response times, total network duration
- **Render timing**: Time from data receipt to UI render completion
- **Trace correlation**: Links browser metrics to backend OpenTelemetry traces

## Test Structure

```
e2e-perf/
├── flows/                      # Performance test flows
│   ├── authentication.spec.ts  # Login/logout performance
│   ├── browse-dbot.spec.ts     # Collection browsing, navigation
│   ├── collection-tree.spec.ts # Collection tree operations
│   ├── item-operations.spec.ts # Item CRUD operations
│   ├── linked-collections.spec.ts # Linked collection workflows
│   └── search.spec.ts          # Search performance
├── fixtures/
│   └── auth.fixture.ts         # Authenticated page fixture
├── utils/
│   ├── browser-metrics.ts      # MetricsCollector class
│   └── trace-correlation.ts    # OpenTelemetry trace context
├── results/                    # JSON output (gitignored)
├── playwright.config.ts        # Playwright configuration
└── package.json
```

## Running Tests

### Prerequisites
- Node.js 18+
- Backend API running with valid auth token
- Frontend running at http://localhost:5173

### Setup

```bash
cd attic-web/e2e-perf
npm install
```

### Commands

```bash
# Run all performance tests
PERF_TEST_TOKEN="your-api-token" npm run perf

# Run with UI (interactive)
PERF_TEST_TOKEN="your-api-token" npm run perf:ui

# Run headed (watch in browser)
PERF_TEST_TOKEN="your-api-token" npm run perf:interactive

# View HTML report
npm run perf:report
```

### Getting an API Token

1. Log in to Will's Attic
2. Go to Settings > API Tokens
3. Create a new token with sufficient expiration
4. Use the plain text token (not the hashed version)

## Output

### Console Output
Each test prints timing metrics:
```
  My Collection: 156ms API, 234ms render
  Loaded: 5 collections, 12 items
```

### JSON Results
Detailed metrics saved to `results/profile-{timestamp}.json`:
```json
{
  "timestamp": "2025-11-30T12:00:00.000Z",
  "tests": [
    {
      "name": "load my-collection page",
      "metrics": {
        "totalNetworkTime": 156,
        "estimatedRenderTime": 234,
        "firstContentfulPaint": 312,
        "apiCalls": [...]
      }
    }
  ]
}
```

### HTML Report
Interactive Playwright report with:
- Test results and timing
- Trace viewer for debugging
- Screenshots on failure

## Metrics Collected

| Metric | Description |
|--------|-------------|
| `totalNetworkTime` | Sum of all API call durations |
| `estimatedRenderTime` | Time from last API response to UI ready |
| `firstContentfulPaint` | Browser FCP metric |
| `domContentLoaded` | DOMContentLoaded event timing |
| `apiCalls` | Array of individual API timings |

## Test Suites

### authentication.spec.ts
- Login page load
- Authentication flow timing
- Token validation

### browse-dbot.spec.ts
- My Collection page load
- Nested collection navigation
- DBoT collection browsing
- Large collection pagination

### collection-tree.spec.ts
- Collection tree expansion
- Breadcrumb navigation
- Collection CRUD operations

### item-operations.spec.ts
- Item detail modal load
- Item edit flow
- Batch operations

### linked-collections.spec.ts
- Linked collection creation
- Progress tracking load
- Collection unlinking

### search.spec.ts
- Search dropdown performance
- Full search results page
- Semantic search timing

## Trace Correlation

Tests inject OpenTelemetry trace context headers:
```typescript
const trace = generateTraceContext();
await injectTraceHeaders(page, trace);
```

This allows correlating browser metrics with backend traces in Grafana/Jaeger.

## Interpreting Results

### Good Performance Targets
| Operation | API Time | Render Time |
|-----------|----------|-------------|
| Page load | < 200ms | < 300ms |
| Navigation | < 150ms | < 200ms |
| Search | < 100ms | < 150ms |
| Modal open | < 100ms | < 100ms |

### Common Issues
- **High API time**: Check backend N+1 queries, caching
- **High render time**: Check React re-renders, memoization
- **Inconsistent times**: Check network conditions, data size

## Configuration

### playwright.config.ts
```typescript
export default defineConfig({
  testDir: './flows',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
});
```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `PERF_TEST_TOKEN` | API authentication token | Yes |
| `BASE_URL` | Frontend URL (default: localhost:5173) | No |
