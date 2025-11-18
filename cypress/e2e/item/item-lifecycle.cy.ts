describe('Item Management', () => {
  beforeEach(() => {
    cy.login()
  })

  it('displays user items in collection', () => {
    cy.visit('/my-collection')

    // Wait for page to load and verify items are displayed
    cy.contains('My Collection').should('be.visible')

    // Verify items from fixture are displayed
    cy.contains('Pikachu #025').should('be.visible')
    cy.contains('Charizard #006').should('be.visible')

    // Verify item cards have proper structure
    cy.get('[data-testid="item-card"]').should('have.length', 2)
  })

  it('adds an item from search', () => {
    cy.visit('/my-collection')

    // Wait for page to load
    cy.contains('My Collection').should('be.visible')

    // Click the "Quick Add Custom Item" or similar add button
    // The UserCollectionPage has a header action with title "Quick Add Custom Item"
    cy.get('button[title="Quick Add Custom Item"]').click()

    // Modal opens in add mode for creating a custom item
    // Enter a name for the custom item (since this creates a custom item, not a DBoT search)
    cy.get('input[placeholder="Enter item name"]').type('Test Custom Item')

    // Optionally add notes
    cy.get('[data-testid="item-notes-input"]').type('Test notes for the item')

    // Save the item by clicking the save button
    cy.get('button[title="Add to collection"]').click()

    // Verify success feedback - Toast notification
    cy.contains(/added|created/i).should('be.visible')
  })

  it('views item details', () => {
    cy.visit('/my-collection')

    // Wait for items to load
    cy.contains('Pikachu #025').should('be.visible')

    // Click on the item card to view details
    cy.contains('Pikachu #025').click()

    // Modal should open showing item details
    // Verify item name is displayed
    cy.get('h2').contains('Pikachu #025').should('be.visible')

    // Verify notes are displayed
    cy.contains('First edition').should('be.visible')

    // Verify attributes are displayed (type from attributes)
    cy.contains('Electric').should('be.visible')
  })

  it('edits item notes', () => {
    cy.visit('/my-collection')

    // Wait for items to load
    cy.contains('Pikachu #025').should('be.visible')

    // Click on the item card to open detail modal
    cy.contains('Pikachu #025').click()

    // Verify modal opened
    cy.get('h2').contains('Pikachu #025').should('be.visible')

    // Click edit button using the testid
    cy.get('button[title="Edit item"]').click()

    // Should now be in edit mode with notes textarea visible
    cy.get('[data-testid="item-notes-input"]').should('be.visible')

    // Update the notes
    cy.get('[data-testid="item-notes-input"]').clear().type('Updated notes - excellent condition')

    // Save changes using the save button
    cy.get('button[title="Save changes"]').click()

    // Verify success feedback
    cy.contains(/updated|saved/i).should('be.visible')
  })

  it('deletes an item', () => {
    cy.visit('/my-collection')

    // Wait for items to load
    cy.contains('Charizard #006').should('be.visible')

    // Click on the item card to open detail modal
    cy.contains('Charizard #006').click()

    // Verify modal opened
    cy.get('h2').contains('Charizard #006').should('be.visible')

    // Click delete button using the title
    cy.get('button[title="Delete item"]').click()

    // Confirmation modal should appear
    cy.get('[data-testid="batch-action-modal"]').should('be.visible')
    cy.contains(/delete|remove/i).should('be.visible')

    // Confirm deletion
    cy.get('[data-testid="batch-modal-confirm"]').click()

    // Verify success feedback
    cy.contains(/deleted|removed/i).should('be.visible')
  })

  it('shows item attributes in detail view', () => {
    cy.visit('/my-collection')

    // Click on Pikachu to view details
    cy.contains('Pikachu #025').click()

    // Verify various attributes are shown
    cy.contains('Common').should('be.visible') // rarity
    cy.contains('Electric').should('be.visible') // type
    cy.contains('025').should('be.visible') // number
  })

  it('can cancel editing without saving', () => {
    cy.visit('/my-collection')

    // Click on item to open modal
    cy.contains('Pikachu #025').click()

    // Enter edit mode
    cy.get('button[title="Edit item"]').click()

    // Modify notes
    cy.get('[data-testid="item-notes-input"]').clear().type('Temporary edit')

    // Close modal without saving (press escape)
    cy.get('body').type('{esc}')

    // Modal should close
    cy.get('[data-testid="item-notes-input"]').should('not.exist')

    // Re-open modal to verify notes weren't saved
    cy.contains('Pikachu #025').click()

    // Original notes should still be there
    cy.contains('First edition').should('be.visible')
  })

  it('displays item type badge', () => {
    cy.visit('/my-collection')

    // Verify item cards show the type
    cy.get('[data-testid="item-card"]').first().within(() => {
      cy.contains(/collectible/i).should('be.visible')
    })
  })
})
