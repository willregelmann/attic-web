import { RequestHandler } from 'msw'

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string): Chainable<void>
      mswOverride(...handlers: RequestHandler[]): Chainable<void>
    }
  }
}

// Set auth token in localStorage (no real login needed with full mocking)
Cypress.Commands.add('login', (email = 'test@example.com') => {
  const mockUser = {
    id: 'user-123',
    email,
    name: 'Test User',
    picture: null,
  }

  cy.window().then((win) => {
    win.localStorage.setItem('token', 'mock-token-12345')
    win.localStorage.setItem('user_data', JSON.stringify(mockUser))
  })
})

// Override MSW handlers for specific test scenarios
Cypress.Commands.add('mswOverride', (...handlers: RequestHandler[]) => {
  cy.window().then((win) => {
    if (win.__mswWorker) {
      win.__mswWorker.use(...handlers)
    }
  })
})

export {}
