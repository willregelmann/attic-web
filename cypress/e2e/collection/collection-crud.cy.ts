describe('Collection Management', () => {
  beforeEach(() => {
    cy.login()
  })

  it('displays user collections on my collection page', () => {
    cy.visit('/my-collection')

    // Wait for page to load and verify collections are displayed
    cy.contains('My Collection').should('be.visible')

    // Verify both collections from fixture are displayed
    cy.contains('Pokemon Cards').should('be.visible')
    cy.contains('Magic Cards').should('be.visible')

    // Verify collection cards have proper structure
    cy.get('[data-testid="collection-card"]').should('have.length', 2)
  })

  it('creates a new collection', () => {
    cy.visit('/my-collection')

    // Wait for page to load
    cy.contains('My Collection').should('be.visible')

    // Click the create collection action button (folder with plus icon)
    // This is a header action that's only visible on desktop
    cy.get('button[title="Create new collection"]').click()

    // Modal should open with collection form in edit mode
    cy.get('[data-testid="collection-name-input"]').should('be.visible')

    // Fill in collection details
    cy.get('[data-testid="collection-name-input"]').clear().type('Test Collection')
    cy.get('[data-testid="collection-description-input"]').clear().type('A test collection for e2e testing')

    // Find and click the save button in the modal header actions
    // The save button has the label "Save changes"
    cy.get('button[title="Save changes"]').click()

    // Verify success feedback - Toast notification
    cy.contains('Collection created').should('be.visible')
  })

  it('navigates into a collection', () => {
    cy.visit('/my-collection')

    // Wait for collections to load
    cy.contains('Pokemon Cards').should('be.visible')

    // Click on the Pokemon Cards collection card
    cy.contains('Pokemon Cards').click()

    // Should navigate to the collection page
    cy.url().should('include', '/my-collection/user-col-1')

    // The collection header should show the collection name
    cy.get('h1').contains('Pokemon Cards').should('be.visible')

    // Breadcrumbs should show the collection path
    cy.contains('My Collection').should('be.visible')
  })

  it('edits collection name and description', () => {
    // Visit a specific collection page
    cy.visit('/my-collection/user-col-1')

    // Wait for collection to load
    cy.get('h1').contains('Pokemon Cards').should('be.visible')

    // Click on the collection header to open detail modal
    // The header is clickable when viewing a nested collection
    cy.get('h1').contains('Pokemon Cards').click()

    // Modal should open showing collection details
    // Click edit button - this is in the header actions with label "Edit collection" or similar
    cy.get('button[title*="Edit"]').click()

    // Should now be in edit mode with form fields visible
    cy.get('[data-testid="collection-name-input"]').should('be.visible')

    // Update the collection name and description
    cy.get('[data-testid="collection-name-input"]').clear().type('Updated Pokemon Cards')
    cy.get('[data-testid="collection-description-input"]').clear().type('Updated description for testing')

    // Save changes
    cy.get('button[title="Save changes"]').click()

    // Verify success feedback
    cy.contains('Collection updated').should('be.visible')
  })

  it('deletes a collection', () => {
    // Visit a specific collection page
    cy.visit('/my-collection/user-col-3')

    // Wait for collection to load
    cy.get('h1').contains('Magic Cards').should('be.visible')

    // Click on the collection header to open detail modal
    cy.get('h1').contains('Magic Cards').click()

    // Click delete button - this triggers the delete confirmation modal
    cy.get('button[title*="Delete"]').click()

    // Confirmation modal should appear
    cy.get('[data-testid="batch-action-modal"]').should('be.visible')
    cy.contains('Delete Collection').should('be.visible')

    // Confirm deletion
    cy.get('[data-testid="batch-modal-confirm"]').click()

    // Verify success feedback
    cy.contains('Collection deleted').should('be.visible')

    // Should redirect back to my-collection root
    cy.url().should('match', /\/my-collection\/?$/)
  })

  it('shows collection progress information', () => {
    cy.visit('/my-collection')

    // Wait for collections to load
    cy.contains('Pokemon Cards').should('be.visible')

    // Collections should show progress counts (15 / 25 for Pokemon Cards)
    // The progress is displayed in the collection card
    cy.contains('15').should('exist')
    cy.contains('25').should('exist')
  })

  it('can cancel collection creation', () => {
    cy.visit('/my-collection')

    // Wait for page to load
    cy.contains('My Collection').should('be.visible')

    // Click the create collection button
    cy.get('button[title="Create new collection"]').click()

    // Modal should open
    cy.get('[data-testid="collection-name-input"]').should('be.visible')

    // Start typing a name
    cy.get('[data-testid="collection-name-input"]').type('Test')

    // Close the modal by clicking the close button or pressing escape
    cy.get('body').type('{esc}')

    // Modal should close
    cy.get('[data-testid="collection-name-input"]').should('not.exist')
  })
})
