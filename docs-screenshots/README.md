# Documentation Screenshot Generator

Playwright-based tool for generating screenshots for Will's Attic user guides.

## Overview

This tool automatically captures screenshots of key workflows to create illustrated documentation. When the UI changes, simply regenerate screenshots with a single command.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Generate all screenshots (requires running frontend and valid auth token)
DOCS_TOKEN="your-api-token" npm run generate
```

## Prerequisites

1. **Frontend running** at http://localhost:5173
2. **Backend API running** with database populated
3. **Valid API token** - Get one from Settings > API Tokens in the app

## Commands

| Command | Description |
|---------|-------------|
| `npm run generate` | Run all guides, output screenshots and markdown |
| `npm run generate:ui` | Open Playwright UI for interactive runs |
| `npm run generate:headed` | Run with visible browser |

## Output

Screenshots are saved to `docs/guides/images/`:
```
docs/guides/
├── images/
│   ├── 01-getting-started/
│   │   ├── 01-login-page.png
│   │   ├── 02-my-collection-view.png
│   │   └── ...
│   ├── 02-discovering-items/
│   └── ...
├── 01-getting-started.md      # Auto-generated markdown stub
├── 02-discovering-items.md
└── ...
```

## Guide Scripts

| Script | Screenshots | Topics |
|--------|-------------|--------|
| `01-getting-started.ts` | 4 | Login, navigation, user menu |
| `02-discovering-items.ts` | 5 | Browse, search, item details |
| `03-building-collection.ts` | 4 | Adding items, owned badges |
| `04-organizing-collections.ts` | 4 | Create collections, nesting |
| `05-tracking-wishlist.ts` | 4 | Wishlist, linked collections |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DOCS_TOKEN` | API authentication token | Yes |
| `PERF_TEST_TOKEN` | Alternative token name (fallback) | No |
| `BASE_URL` | Frontend URL (default: localhost:5173) | No |

## Customizing Screenshots

### Adding a Screenshot

```typescript
await screenshot(page, 'guide-name', 'screenshot-name', {
  caption: 'Description for documentation',
  highlight: '[data-testid="element"]', // Optional: highlight element
  delay: 500, // Wait before capture (ms)
});
```

### Highlight Options

The `highlight` option adds a red outline around an element:
```typescript
highlight: '[data-testid="search-input"]'  // Single element
highlight: 'button, .action-item'          // Multiple selectors
```

### Full Page Screenshots

```typescript
await screenshot(page, 'guide', 'full-page', {
  fullPage: true,
});
```

## Workflow

1. **Generate screenshots**: `DOCS_TOKEN="..." npm run generate`
2. **Review output**: Check `docs/guides/images/` for screenshots
3. **Edit markdown**: Fill in explanatory text in generated `.md` files
4. **Regenerate as needed**: Run again when UI changes

## Tips

- Use `npm run generate:headed` to watch the browser during capture
- Screenshots include a 500ms delay by default for animations
- The markdown generator creates stubs with all images pre-linked
- Captions become alt text and italicized descriptions in markdown
