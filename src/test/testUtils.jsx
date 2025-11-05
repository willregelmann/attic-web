import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { FilterProvider } from '../contexts/FilterContext';
import { CollectionFilterProvider } from '../contexts/CollectionFilterContext';
import { BreadcrumbsProvider } from '../contexts/BreadcrumbsContext';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.Element} ui - Component to render
 * @param {Object} options - Render options
 * @param {Array} options.mocks - Apollo MockedProvider mocks
 * @param {Object} options.initialAuthState - Initial auth state
 * @param {Object} options.wrapperProps - Additional props for wrapper components
 */
export function renderWithProviders(
  ui,
  {
    mocks = [],
    initialAuthState = null,
    route = '/',
    ...renderOptions
  } = {}
) {
  // Set initial route
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        <BrowserRouter>
          <ThemeProvider>
            <FilterProvider>
              <CollectionFilterProvider>
                <AuthProvider>
                  <BreadcrumbsProvider>
                    {children}
                  </BreadcrumbsProvider>
                </AuthProvider>
              </CollectionFilterProvider>
            </FilterProvider>
          </ThemeProvider>
        </BrowserRouter>
      </MockedProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Minimal wrapper for components that don't need all providers
 */
export function renderWithRouter(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return {
    ...render(ui, { wrapper: Wrapper }),
  };
}

/**
 * Wait for Apollo MockedProvider to resolve
 * Use this after rendering with mocked queries
 */
export const waitForApollo = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
  };
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    ...overrides,
  };
}

/**
 * Create mock collection data
 */
export function createMockCollection(overrides = {}) {
  return {
    id: '1',
    name: 'Test Collection',
    type: 'collection',
    year: '2020',
    country: 'US',
    attributes: {},
    image_url: 'https://example.com/collection.jpg',
    thumbnail_url: 'https://example.com/collection-thumb.jpg',
    external_ids: {},
    ...overrides,
  };
}

/**
 * Create mock item data
 */
export function createMockItem(overrides = {}) {
  return {
    id: '1',
    name: 'Test Item',
    type: 'item',
    year: '2020',
    country: 'US',
    attributes: {},
    image_url: 'https://example.com/item.jpg',
    thumbnail_url: 'https://example.com/item-thumb.jpg',
    external_ids: {},
    ...overrides,
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
