describe('Authentication', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage()
  })

  it('shows landing page for unauthenticated users', () => {
    cy.visit('/')
    // Landing page shows "Search to get started" when no recently viewed items
    cy.contains('Search to get started').should('be.visible')
  })

  it('redirects authenticated users from home to my-collection', () => {
    cy.login()
    cy.visit('/')
    cy.url().should('include', '/my-collection')
  })

  it('shows user menu button for login access', () => {
    cy.visit('/')
    // The user menu button contains the profile icon (SVG with path for user)
    cy.get('button[aria-label="User menu"]').should('be.visible')
  })

  it('persists auth state across page reloads', () => {
    cy.login()
    cy.visit('/my-collection')
    // Should see "My Collection" as page title (h1)
    cy.get('h1').contains('My Collection').should('be.visible')

    cy.reload()
    // Should still see My Collection after reload
    cy.get('h1').contains('My Collection').should('be.visible')
    cy.url().should('include', '/my-collection')
  })

  it('authenticated user can access my-collection page', () => {
    cy.login()
    cy.visit('/my-collection')
    // Should display the collection content without error (check h1 title)
    cy.get('h1').contains('My Collection').should('be.visible')
  })

  it('logs out and redirects to landing page', () => {
    cy.login()
    cy.visit('/my-collection')
    cy.get('h1').contains('My Collection').should('be.visible')

    // Open user menu (desktop)
    cy.get('button[aria-label="User menu"]').click()
    // Click logout
    cy.contains('Log Out').click()

    // Should redirect to landing page
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    // Token should be removed from localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null
      expect(win.localStorage.getItem('user_data')).to.be.null
    })
  })

  it('shows personalized attic name when logged in', () => {
    cy.login()
    cy.visit('/my-collection')
    // The navigation should show "Test's Attic" based on the mock user's given_name
    cy.contains("Test's Attic").should('be.visible')
  })

  it('shows default attic name when logged out', () => {
    cy.visit('/')
    // Should show "Will's Attic" as the default
    cy.contains("Will's Attic").should('be.visible')
  })
})
