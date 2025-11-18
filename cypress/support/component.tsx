import './commands'
import { mount } from 'cypress/react18'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { ThemeProvider } from '../../src/contexts/ThemeContext'
import { FilterProvider } from '../../src/contexts/FilterContext'
import { CollectionFilterProvider } from '../../src/contexts/CollectionFilterContext'
import { BreadcrumbsProvider } from '../../src/contexts/BreadcrumbsContext'
import { SearchProvider } from '../../src/contexts/SearchContext'
import { worker } from './msw/browser'
import '../../src/index.css'

// Create a mock Apollo client for component tests
const createMockClient = () => {
  return new ApolloClient({
    uri: '/graphql',
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
      },
    },
  })
}

// Augment Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

// Start MSW before all component tests
before(() => {
  worker.start({
    onUnhandledRequest: 'warn',
    quiet: true,
  })
})

// Custom mount command with all providers
Cypress.Commands.add('mount', (component, options = {}) => {
  const client = createMockClient()

  const wrapped = (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <FilterProvider>
              <CollectionFilterProvider>
                <BreadcrumbsProvider>
                  <SearchProvider>
                    {component}
                  </SearchProvider>
                </BreadcrumbsProvider>
              </CollectionFilterProvider>
            </FilterProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ApolloProvider>
  )

  return mount(wrapped, options)
})
