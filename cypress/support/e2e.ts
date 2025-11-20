import './commands'
import { worker } from './msw/browser'

before(() => {
  // Use cy.wrap to make Cypress wait for the promise
  cy.wrap(
    worker.start({
      onUnhandledRequest: 'warn',
      quiet: true,
    })
  )
})

afterEach(() => {
  // Reset handlers after each test to ensure test isolation
  worker.resetHandlers()
})
