import './commands'
import { worker } from './msw/browser'

before(() => {
  worker.start({
    onUnhandledRequest: 'warn',
    quiet: true,
  }).then(() => {
    // Expose worker on window for cy.mswOverride
    cy.window().then((win) => {
      win.__mswWorker = worker
    })
  })
})

afterEach(() => {
  // Reset handlers after each test
  cy.window().then((win) => {
    win.__mswWorker?.resetHandlers()
  })
})
