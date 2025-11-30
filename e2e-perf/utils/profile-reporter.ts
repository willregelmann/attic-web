import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface ProfileResult {
  testName: string;
  flow: string;
  scenario: string;
  durationMs: number;
  traceId: string | null;
  timestamp: string;
  status: string;
  tempoUrl: string | null;
}

class ProfileReporter implements Reporter {
  private results: ProfileResult[] = [];
  private outputDir: string;

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir || path.join(__dirname, '..', 'results');
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Extract trace ID from test annotations or attachments
    const traceId = this.extractTraceId(test, result);

    // Parse flow and scenario from test title path
    const [flow, scenario] = this.parseTestPath(test.titlePath());

    const profileResult: ProfileResult = {
      testName: test.title,
      flow,
      scenario,
      durationMs: result.duration,
      traceId,
      timestamp: new Date().toISOString(),
      status: result.status,
      tempoUrl: traceId ? `http://localhost:3000/explore?orgId=1&left=%5B%22now-1h%22,%22now%22,%22Tempo%22,%7B%22query%22:%22${traceId}%22%7D%5D` : null,
    };

    this.results.push(profileResult);

    // Log to console for immediate feedback
    const statusIcon = result.status === 'passed' ? '✓' : '✗';
    console.log(`\n${statusIcon} ${flow}/${scenario}: ${result.duration}ms`);
    if (traceId) {
      console.log(`  Trace: ${traceId}`);
    }
  }

  onEnd(result: FullResult) {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Write detailed results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(this.outputDir, `profile-${timestamp}.json`);

    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: result.duration,
      status: result.status,
      results: this.results,
      summary: this.generateSummary(),
    };

    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`\nProfile results written to: ${outputFile}`);

    // Also write latest.json for easy access
    const latestFile = path.join(this.outputDir, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(report, null, 2));
  }

  private extractTraceId(test: TestCase, result: TestResult): string | null {
    // Check for trace ID in test annotations
    for (const annotation of result.annotations) {
      if (annotation.type === 'traceId') {
        return annotation.description || null;
      }
    }
    return null;
  }

  private parseTestPath(titlePath: string[]): [string, string] {
    // titlePath is like ['flows/collection-tree.spec.ts', 'Collection Tree Performance', 'load root collection']
    const flow = titlePath[1]?.replace(' Performance', '').toLowerCase().replace(/\s+/g, '-') || 'unknown';
    const scenario = titlePath[2]?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
    return [flow, scenario];
  }

  private generateSummary() {
    const byFlow: Record<string, { count: number; totalMs: number; avgMs: number }> = {};

    for (const result of this.results) {
      if (!byFlow[result.flow]) {
        byFlow[result.flow] = { count: 0, totalMs: 0, avgMs: 0 };
      }
      byFlow[result.flow].count++;
      byFlow[result.flow].totalMs += result.durationMs;
    }

    for (const flow of Object.keys(byFlow)) {
      byFlow[flow].avgMs = Math.round(byFlow[flow].totalMs / byFlow[flow].count);
    }

    return {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'passed').length,
      failed: this.results.filter(r => r.status === 'failed').length,
      byFlow,
    };
  }
}

export default ProfileReporter;
