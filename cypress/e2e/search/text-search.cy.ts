import { graphql, HttpResponse } from 'msw'

describe('Search', () => {
  beforeEach(() => {
    cy.login()
  })

  it('shows search dropdown with results', () => {
    cy.visit('/my-collection')

    // Type in search input (desktop)
    cy.get('input[placeholder*="Search collections and items"]').type('Pikachu')

    // Dropdown should appear with results
    cy.get('[data-testid="search-results"]').should('be.visible')
    // Wait for search results to load (not "Searching...")
    cy.get('[data-testid="search-results"]').should('not.contain', 'Searching...')
    cy.get('[data-testid="search-results"]').contains('Pikachu #025').should('be.visible')
  })

  it('navigates to search results page on enter', () => {
    cy.visit('/my-collection')

    cy.get('input[placeholder*="Search collections and items"]').type('Pokemon{enter}')

    cy.url().should('include', '/search')
    cy.url().should('include', 'q=Pokemon')
  })

  it('displays search results with item cards', () => {
    cy.visit('/search?q=Pikachu')

    // Should show the search results page with items
    cy.contains('Search results for:').should('be.visible')
    cy.contains('Pikachu #025').should('be.visible')
    cy.contains('Pikachu Promo').should('be.visible')
  })

  it('clicking search result navigates to entity detail', () => {
    cy.visit('/search?q=Pikachu')

    // Click on a search result
    cy.contains('Pikachu #025').click()

    // Should navigate to item detail page
    cy.url().should('include', '/item/')
    cy.contains('Pikachu #025').should('be.visible')
  })

  it('shows empty state when no results', () => {
    cy.visit('/my-collection')

    // Override handler to return empty results
    cy.mswOverride(
      graphql.query('SemanticSearchDatabaseOfThings', () => {
        return HttpResponse.json({
          data: {
            databaseOfThingsSemanticSearch: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null
              }
            }
          }
        })
      })
    )

    cy.get('input[placeholder*="Search collections and items"]').type('nonexistent{enter}')

    // Navigate to search results page
    cy.url().should('include', '/search')

    // Should show empty state (SearchResultsPage shows "No results found for "query"")
    cy.contains('No results found for').should('be.visible')
  })

  it('shows view all results button when dropdown has results', () => {
    cy.visit('/my-collection')

    cy.get('input[placeholder*="Search collections and items"]').type('Pikachu')

    // Dropdown should appear
    cy.get('[data-testid="search-results"]').should('be.visible')

    // View all results button should be visible
    cy.get('[data-testid="view-all-results"]').should('be.visible')
  })

  it('clicking view all results navigates to search page', () => {
    cy.visit('/my-collection')

    cy.get('input[placeholder*="Search collections and items"]').type('Pikachu')

    // Wait for dropdown and click view all
    cy.get('[data-testid="search-results"]').should('be.visible')
    cy.get('[data-testid="view-all-results"]').click()

    cy.url().should('include', '/search')
    cy.url().should('include', 'q=Pikachu')
  })

  it('clears search input and closes dropdown when X clicked', () => {
    cy.visit('/my-collection')

    cy.get('input[placeholder*="Search collections and items"]').type('Pikachu')

    // Wait for dropdown to appear
    cy.get('[data-testid="search-results"]').should('be.visible')

    // Click clear button (X button)
    cy.get('input[placeholder*="Search collections and items"]')
      .parent()
      .find('button[type="button"]')
      .first()
      .click()

    // Dropdown should be hidden and input cleared
    cy.get('[data-testid="search-results"]').should('not.exist')
    cy.get('input[placeholder*="Search collections and items"]').should('have.value', '')
  })
})
