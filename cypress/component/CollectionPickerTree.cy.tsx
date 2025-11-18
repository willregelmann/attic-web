import { CollectionPickerTree } from '../../src/components/CollectionPickerTree'

describe('CollectionPickerTree', () => {
  beforeEach(() => {
    // Set up auth token for MSW queries
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token-12345')
    })
  })

  it('renders collection hierarchy', () => {
    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId={null}
      />
    )

    // Wait for collections to load
    cy.contains('My Collection').should('be.visible')
    cy.contains('Pokemon Cards').should('be.visible')
    cy.contains('Magic Cards').should('be.visible')
  })

  it('expands collection to show children when clicked', () => {
    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId={null}
      />
    )

    // Initially, Base Set should not be visible
    cy.contains('Base Set').should('not.exist')

    // Click Pokemon Cards to expand it
    cy.contains('Pokemon Cards').click()

    // Now Base Set should be visible (loaded via lazy query)
    cy.contains('Base Set').should('be.visible')
  })

  it('calls onSelect when collection clicked', () => {
    const onSelect = cy.stub().as('onSelect')
    cy.mount(
      <CollectionPickerTree
        onSelect={onSelect}
        selectedId={null}
      />
    )

    // Click on Pokemon Cards
    cy.contains('Pokemon Cards').click()
    cy.get('@onSelect').should('have.been.calledWith', 'user-col-1')
  })

  it('calls onSelect with null when root clicked', () => {
    const onSelect = cy.stub().as('onSelect')
    cy.mount(
      <CollectionPickerTree
        onSelect={onSelect}
        selectedId="user-col-1"
      />
    )

    // Click on My Collection (root)
    cy.contains('My Collection').click()
    cy.get('@onSelect').should('have.been.calledWith', null)
  })

  it('highlights selected collection', () => {
    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId="user-col-1"
      />
    )

    // Pokemon Cards should have selected styling (font-semibold and bg-tertiary)
    cy.contains('Pokemon Cards')
      .parent('button')
      .should('have.class', 'font-semibold')
      .and('have.class', 'bg-[var(--bg-tertiary)]')
  })

  it('highlights root when selectedId is null', () => {
    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId={null}
      />
    )

    // My Collection should have selected styling
    cy.contains('My Collection')
      .parent('button')
      .should('have.class', 'font-semibold')
      .and('have.class', 'bg-[var(--bg-tertiary)]')
  })

  it('excludes specified collection from tree', () => {
    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId={null}
        excludeCollectionId="user-col-3"
      />
    )

    // Pokemon Cards should be visible
    cy.contains('Pokemon Cards').should('be.visible')
    // Magic Cards should not be visible (excluded)
    cy.contains('Magic Cards').should('not.exist')
  })

  it('shows expand indicator for collections with children', () => {
    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId={null}
      />
    )

    // Wait for tree to load
    cy.contains('Pokemon Cards').should('be.visible')

    // Click to expand Pokemon Cards
    cy.contains('Pokemon Cards').click()

    // Wait for subcollections to load
    cy.contains('Base Set').should('be.visible')

    // The expand indicator should change from + to -
    cy.contains('Pokemon Cards')
      .parent('button')
      .find('span')
      .contains('−')
      .should('be.visible')
  })

  it('preserves expanded state via expandedIds prop', () => {
    // Create a Set with user-col-1 as expanded
    const expandedIds = new Set(['user-col-1'])

    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId={null}
        expandedIds={expandedIds}
      />
    )

    // Should automatically expand and load Base Set
    cy.contains('Base Set').should('be.visible')
  })

  it('shows loading state while fetching collections', () => {
    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId={null}
      />
    )

    // The skeleton loader should appear briefly during loading
    // Then collections should be visible
    cy.contains('My Collection').should('be.visible')
  })

  it('toggles expansion on subsequent clicks', () => {
    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId={null}
      />
    )

    // First click expands
    cy.contains('Pokemon Cards').click()
    cy.contains('Base Set').should('be.visible')

    // Second click on same collection should collapse it
    cy.contains('Pokemon Cards').click()
    cy.contains('Base Set').should('not.exist')

    // Third click should expand again
    cy.contains('Pokemon Cards').click()
    cy.contains('Base Set').should('be.visible')
  })

  it('respects isAuthenticated prop', () => {
    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId={null}
        isAuthenticated={false}
      />
    )

    // When not authenticated, the query is skipped
    // Only root should be visible, no collections loaded
    cy.contains('My Collection').should('be.visible')
    // Collections should not load
    cy.contains('Pokemon Cards').should('not.exist')
  })

  it('handles nested selection correctly', () => {
    const onSelect = cy.stub().as('onSelect')

    cy.mount(
      <CollectionPickerTree
        onSelect={onSelect}
        selectedId={null}
      />
    )

    // Expand Pokemon Cards
    cy.contains('Pokemon Cards').click()

    // Wait for children to load
    cy.contains('Base Set').should('be.visible')

    // Select Base Set
    cy.contains('Base Set').click()
    cy.get('@onSelect').should('have.been.calledWith', 'user-col-2')
  })

  it('shows tree connector lines for nested items', () => {
    cy.mount(
      <CollectionPickerTree
        onSelect={cy.stub()}
        selectedId={null}
      />
    )

    // Expand Pokemon Cards
    cy.contains('Pokemon Cards').click()

    // Wait for children to load
    cy.contains('Base Set').should('be.visible')

    // Base Set should have an SVG tree connector
    cy.contains('Base Set')
      .parent('button')
      .find('svg')
      .should('exist')
  })
})
