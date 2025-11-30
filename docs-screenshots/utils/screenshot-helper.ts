import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Output directory for screenshots (relative to project root)
const SCREENSHOTS_DIR = path.join(__dirname, '..', '..', '..', 'docs', 'guides', 'images');
const GUIDES_DIR = path.join(__dirname, '..', '..', '..', 'docs', 'guides');

export interface ScreenshotOptions {
  caption?: string;
  highlight?: string; // CSS selector to highlight
  highlightColor?: string;
  fullPage?: boolean;
  delay?: number; // ms to wait before screenshot
}

export interface GuideSection {
  image: string;
  caption: string;
  text?: string;
}

// Store sections for markdown generation
const guideSections: Map<string, GuideSection[]> = new Map();

/**
 * Take a screenshot and save it to the appropriate guide directory
 */
export async function screenshot(
  page: Page,
  guide: string,
  name: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const { caption = '', highlight, highlightColor = '#ef4444', fullPage = false, delay = 500 } = options;

  // Ensure guide directory exists
  const guideDir = path.join(SCREENSHOTS_DIR, guide);
  if (!fs.existsSync(guideDir)) {
    fs.mkdirSync(guideDir, { recursive: true });
  }

  // Wait for any animations to settle
  await page.waitForTimeout(delay);

  // Add highlight if specified
  if (highlight) {
    await page.evaluate(({ selector, color }) => {
      const element = document.querySelector(selector);
      if (element) {
        (element as HTMLElement).style.outline = `3px solid ${color}`;
        (element as HTMLElement).style.outlineOffset = '2px';
      }
    }, { selector: highlight, color: highlightColor });

    // Brief pause to ensure highlight renders
    await page.waitForTimeout(100);
  }

  // Take screenshot
  const screenshotPath = path.join(guideDir, `${name}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage,
  });

  // Remove highlight after screenshot
  if (highlight) {
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        (element as HTMLElement).style.outline = '';
        (element as HTMLElement).style.outlineOffset = '';
      }
    }, highlight);
  }

  // Track section for markdown generation
  if (!guideSections.has(guide)) {
    guideSections.set(guide, []);
  }
  guideSections.get(guide)!.push({ image: name, caption });

  console.log(`  📸 ${guide}/${name}.png - ${caption || '(no caption)'}`);
}

// Mock user data for authentication
const DOCS_USER_DATA = {
  id: 'docs-user-id',
  email: 'docs@attic.local',
  name: 'Documentation User',
};

/**
 * Authenticate user using API token
 * Must be called BEFORE navigating to any page
 */
export async function authenticate(page: Page): Promise<void> {
  const token = process.env.DOCS_TOKEN || process.env.PERF_TEST_TOKEN;

  if (!token) {
    throw new Error('No authentication token provided. Set DOCS_TOKEN or PERF_TEST_TOKEN environment variable.');
  }

  // Use addInitScript to inject auth BEFORE page loads
  // This is more reliable than setting after navigation
  await page.addInitScript(({ token, userData }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
  }, { token, userData: DOCS_USER_DATA });
}

/**
 * Generate markdown file for a guide with all screenshots embedded
 */
export function generateMarkdown(guide: string, title: string): void {
  const sections = guideSections.get(guide) || [];

  if (sections.length === 0) {
    console.warn(`No screenshots captured for guide: ${guide}`);
    return;
  }

  const guideNumber = guide.split('-')[0];
  const lines: string[] = [
    `# ${title}`,
    '',
  ];

  for (const section of sections) {
    // Convert image name to section heading
    const heading = section.image
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    lines.push(`## ${heading}`);
    lines.push('');
    lines.push(`![${section.caption || heading}](images/${guide}/${section.image}.png)`);
    lines.push('');
    if (section.caption) {
      lines.push(`*${section.caption}*`);
      lines.push('');
    }
    lines.push('<!-- Add your explanation here -->');
    lines.push('');
  }

  // Write markdown file
  const mdPath = path.join(GUIDES_DIR, `${guide}.md`);
  fs.writeFileSync(mdPath, lines.join('\n'));
  console.log(`  📝 Generated ${guide}.md with ${sections.length} sections`);
}

/**
 * Wait for page to be fully loaded and idle
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  // Additional wait for React renders
  await page.waitForTimeout(300);
}

/**
 * Clear guide sections (call at start of each guide)
 */
export function clearGuideSections(guide: string): void {
  guideSections.delete(guide);
}
