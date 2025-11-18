import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// Expose worker on window for cy.mswOverride command
declare global {
  interface Window {
    __mswWorker?: typeof worker
  }
}
