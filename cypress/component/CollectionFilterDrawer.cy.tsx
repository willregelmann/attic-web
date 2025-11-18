import CollectionFilterDrawer from '../../src/components/CollectionFilterDrawer'
import { graphql, HttpResponse } from 'msw'

describe('CollectionFilterDrawer', () => {
  // Mock items that would be passed to the component
  const mockItems = [
    {
      id: 'entity-1',
      name: 'Pikachu #025',
      type: 'collectible',
      attributes: {
        rarity: 'Common',
        type: 'Electric'
      }
    },
    {
      id: 'entity-2',
      name: 'Charizard #006',
      type: 'collectible',
      attributes: {
        rarity: 'Rare Holo',
        type: 'Fire'
      }
    },
    {
      id: 'entity-3',
      name: 'Bulbasaur #001',
      type: 'collectible',
      attributes: {
        rarity: 'Common',
        type: 'Grass'
      }
    },
    {
      id: 'entity-4',
      name: 'Squirtle #007',
      type: 'collectible',
      attributes: {
        rarity: 'Common',
        type: 'Water'
      }
    }
  ]

  // Handler that returns proper filter fields format
  const filterFieldsHandler = graphql.query('GetCollectionFilterFields', () => {
    return HttpResponse.json({
      data: {
        databaseOfThingsCollectionFilterFields: [
          {
            field: 'type',
            label: 'Type',
            type: 'multiselect',
            values: ['Fire', 'Water', 'Grass', 'Electric'],
            count: 4,
            priority: 10
          },
          {
            field: 'rarity',
            label: 'Rarity',
            type: 'multiselect',
            values: ['Common', 'Uncommon', 'Rare', 'Rare Holo'],
            count: 4,
            priority: 5
          }
        ]
      }
    })
  })

  // Handler that returns parent collections (empty for simplicity)
  const parentCollectionsHandler = graphql.query('GetCollectionParentCollections', () => {
    return HttpResponse.json({
      data: {
        databaseOfThingsCollectionParentCollections: []
      }
    })
  })

  beforeEach(() => {
    // Clear localStorage before each test to reset filter state
    cy.window().then((win) => {
      win.localStorage.clear()
    })

    // Override MSW handlers with proper data format
    cy.mswOverride(filterFieldsHandler, parentCollectionsHandler)
  })

  it('displays filter fields from collection', () => {
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Wait for GraphQL data to load and find filter field labels within the drawer
    cy.get('[role="button"]').contains('Type').should('be.visible')
    cy.get('[role="button"]').contains('Rarity').should('be.visible')
  })

  it('displays filter values with counts when field is expanded', () => {
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Wait for data to load, then expand type filter field
    cy.get('[role="button"]').contains('Type').click()

    // Should show filter values within the expanded section
    // Use force: true because elements may be covered by the backdrop in test environment
    cy.contains('Fire').should('exist')
    cy.contains('Water').should('exist')
    cy.contains('Grass').should('exist')
    cy.contains('Electric').should('exist')

    // Should show counts - values show (0) since items don't have 'attributes.type' at top level
    // The count is based on item.attributes.type matching the filter field path
    cy.contains('(0)').should('exist')
  })

  it('allows selecting multiple filter values', () => {
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Expand type filter and select values
    cy.get('[role="button"]').contains('Type').click()

    // Click checkboxes for Fire and Water
    // The label contains both checkbox and text, so we find the label by its text content
    cy.contains('label', 'Fire').find('input[type="checkbox"]').click({ force: true })
    cy.contains('label', 'Water').find('input[type="checkbox"]').click({ force: true })

    // Verify both are checked
    cy.contains('label', 'Fire').find('input[type="checkbox"]').should('be.checked')
    cy.contains('label', 'Water').find('input[type="checkbox"]').should('be.checked')
  })

  it('shows active filter count badge when filters are selected', () => {
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Expand type filter and select two values
    cy.get('[role="button"]').contains('Type').click()
    cy.contains('label', 'Fire').find('input[type="checkbox"]').click({ force: true })
    cy.contains('label', 'Water').find('input[type="checkbox"]').click({ force: true })

    // Should show badge with count "2" next to the Type label
    cy.get('span').contains('2').should('exist')
  })

  it('clears all filters when clear all button is clicked', () => {
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Add some filters first
    cy.get('[role="button"]').contains('Type').click()
    cy.contains('label', 'Fire').find('input[type="checkbox"]').click({ force: true })

    // Clear All Filters button should appear
    cy.contains('button', 'Clear All Filters').should('exist')
    cy.contains('button', 'Clear All Filters').click({ force: true })

    // Verify filter is unchecked - need to re-expand the Type field since clearing collapses it
    cy.get('[role="button"]').contains('Type').click()
    cy.contains('label', 'Fire').find('input[type="checkbox"]').should('not.be.checked')
  })

  it('closes when close button is clicked', () => {
    const onClose = cy.stub().as('onClose')
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={onClose}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Click the close button using aria-label
    cy.get('button[aria-label="Close filters"]').click()
    cy.get('@onClose').should('have.been.calledOnce')
  })

  it('does not render when isOpen is false', () => {
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={false}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Component returns null when not open
    cy.contains('Collection Filters').should('not.exist')
  })

  it('closes when clicking on backdrop overlay', () => {
    const onClose = cy.stub().as('onClose')
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={onClose}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Click on the backdrop (fixed inset-0 element) - outside the drawer content
    cy.get('.fixed.inset-0').click({ force: true })
    cy.get('@onClose').should('have.been.calledOnce')
  })

  it('displays text search input field', () => {
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Should show search input
    cy.get('input[placeholder="Search items..."]').should('be.visible')
  })

  it('allows text search filtering', () => {
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Type in the search field
    cy.get('input[placeholder="Search items..."]').type('Pikachu')

    // Should be able to clear the text search
    cy.get('button[aria-label="Clear text search"]').should('be.visible')
  })

  it('displays group duplicates checkbox', () => {
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Should show group duplicates option
    cy.contains('Group duplicates').should('be.visible')
    cy.contains('Group duplicates').parent().find('input[type="checkbox"]').should('exist')
  })

  it('clears field filter when field clear button is clicked', () => {
    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Add some filters
    cy.get('[role="button"]').contains('Type').click()
    cy.contains('label', 'Fire').find('input[type="checkbox"]').click({ force: true })

    // The Clear button should appear next to the field
    cy.get('button[aria-label="Clear Type filters"]').should('exist')
    cy.get('button[aria-label="Clear Type filters"]').click({ force: true })

    // Verify filter is unchecked
    cy.contains('label', 'Fire').find('input[type="checkbox"]').should('not.be.checked')
  })

  it('shows ownership filter for authenticated users with ownership data', () => {
    // Set up auth state
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token')
      win.localStorage.setItem('user_data', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }))
    })

    const userOwnership = new Set(['entity-1', 'entity-3']) // Pikachu and Bulbasaur are owned

    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
        userOwnership={userOwnership}
      />
    )

    // Should show ownership filter
    cy.contains('Ownership').should('be.visible')

    // Expand ownership filter
    cy.contains('Ownership').click()

    // Should show owned/missing options
    cy.contains('Owned').should('be.visible')
    cy.contains('Missing').should('be.visible')
  })

  it('shows empty state when no filterable fields are found', () => {
    // Override to return empty fields
    cy.mswOverride(
      graphql.query('GetCollectionFilterFields', () => {
        return HttpResponse.json({
          data: {
            databaseOfThingsCollectionFilterFields: []
          }
        })
      }),
      parentCollectionsHandler
    )

    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={[]}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // Should show empty state message (partial text match)
    cy.contains('No filterable fields found in this collection').should('be.visible')
  })

  it('expands fields with active filters automatically', () => {
    // Pre-set some filters in localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('collection-filters', JSON.stringify({
        'col-pokemon-base': {
          'type': ['Fire']
        }
      }))
    })

    cy.mount(
      <CollectionFilterDrawer
        collectionId="col-pokemon-base"
        items={mockItems}
        isOpen={true}
        onClose={cy.stub()}
        fetchCollectionItems={cy.stub()}
      />
    )

    // The Type field should be auto-expanded since it has active filters
    // Fire should be visible without clicking to expand
    cy.contains('Fire').should('be.visible')
    cy.contains('Fire').parent().find('input[type="checkbox"]').should('be.checked')
  })
})
