import { RequestHandler } from 'msw'
import { worker } from './msw/browser'

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
// Uses the imported worker directly instead of window property
// because cy.visit() creates new windows that don't have __mswWorker
Cypress.Commands.add('mswOverride', (...handlers: RequestHandler[]) => {
  worker.use(...handlers)
})

export {}
