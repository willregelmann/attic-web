# E2E Tests (Cypress)

End-to-end tests for Will's Attic using Cypress.

## Test Structure

```
cypress/
├── e2e/                    # Test suites
│   ├── auth/               # Authentication tests
│   │   └── login.cy.ts     # Login, logout, session management
│   ├── collection/         # Collection management tests
│   │   └── collection-crud.cy.ts  # Create, read, update, delete collections
│   ├── item/               # Item management tests
│   │   └── item-lifecycle.cy.ts   # Add, edit, delete items
│   └── search/             # Search functionality tests
│       └── text-search.cy.ts      # Search input, results, navigation
├── fixtures/               # Test data and fixtures
├── support/                # Custom commands and utilities
│   ├── commands.ts         # Custom Cypress commands
│   └── e2e.ts              # E2E support configuration
└── component/              # Component tests (if applicable)
```

## Running Tests

### Prerequisites
- Node.js 18+
- Backend API running (`docker-compose up` from project root)
- Frontend running (`npm run dev`)

### Commands

```bash
# Open Cypress Test Runner (interactive)
npm run cy:open

# Run all tests headlessly
npm run cy:run

# Run specific test suite
npm run cy:run -- --spec "cypress/e2e/auth/**"
npm run cy:run -- --spec "cypress/e2e/collection/**"
npm run cy:run -- --spec "cypress/e2e/item/**"
npm run cy:run -- --spec "cypress/e2e/search/**"
```

## Test Coverage

| Suite | Tests | Description |
|-------|-------|-------------|
| **auth** | Login, logout | User authentication flow |
| **collection** | CRUD operations | Create, view, edit, delete collections |
| **item** | Item lifecycle | Add items, edit notes, delete items |
| **search** | Text search | Search input, dropdown results, full results page |

## Writing Tests

### Test File Naming
- Use `.cy.ts` extension for TypeScript tests
- Name files descriptively: `feature-action.cy.ts`

### Custom Commands
Custom commands are defined in `support/commands.ts`:
- `cy.login(email, password)` - Authenticate user
- `cy.waitForApi()` - Wait for API responses

### Selectors
Use `data-testid` attributes for reliable element selection:
```typescript
cy.get('[data-testid="collection-card"]').first().click();
cy.get('[data-testid="item-card"]').should('have.length.greaterThan', 0);
```

### Best Practices
1. **Isolation**: Each test should be independent
2. **Cleanup**: Tests should clean up created resources
3. **Waiting**: Use `cy.waitForApi()` instead of arbitrary delays
4. **Assertions**: Make assertions specific and meaningful

## Environment Variables

Tests require authentication tokens. Set these in `cypress.env.json` (not committed):
```json
{
  "TEST_USER_EMAIL": "test@example.com",
  "TEST_USER_PASSWORD": "password",
  "API_TOKEN": "your-api-token"
}
```

## Debugging

### Interactive Mode
```bash
npm run cy:open
```
- Watch tests run in browser
- Time-travel through test steps
- Inspect DOM at each step

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots: `cypress/screenshots/`
- Videos: `cypress/videos/`

### Console Output
```bash
npm run cy:run -- --headed  # Run with browser visible
```

## CI Integration

Tests run automatically on CI. The workflow:
1. Start services (API, database)
2. Run `npm run cy:run`
3. Upload test artifacts on failure
