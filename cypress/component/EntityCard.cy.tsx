import { EntityCard } from '../../src/components/EntityCard'

describe('EntityCard', () => {
  const mockItem = {
    id: 'entity-pikachu',
    name: 'Pikachu #025',
    type: 'collectible',
    image_url: 'https://example.com/pikachu.jpg',
    thumbnail_url: 'https://example.com/pikachu-thumb.jpg',
    year: '1999',
    attributes: {
      rarity: 'Common',
      type: 'Electric',
    },
  }

  const mockCollection = {
    id: 'col-pokemon-base',
    name: 'Pokemon Base Set',
    type: 'collection',
    image_url: 'https://example.com/pokemon-base.jpg',
    attributes: {
      year: '1999',
    },
  }

  it('displays item name', () => {
    cy.mount(<EntityCard item={mockItem} onClick={cy.stub()} />)

    cy.contains('Pikachu #025').should('be.visible')
  })

  it('displays item type badge', () => {
    cy.mount(<EntityCard item={mockItem} onClick={cy.stub()} />)

    // The formatEntityType function converts 'collectible' to display format
    cy.contains(/collectible/i).should('be.visible')
  })

  it('displays year when available', () => {
    cy.mount(<EntityCard item={mockItem} onClick={cy.stub()} />)

    cy.contains('1999').should('be.visible')
  })

  it('calls onClick when clicked (not in multi-select mode)', () => {
    const onClick = cy.stub().as('onClick')
    cy.mount(<EntityCard item={mockItem} onClick={onClick} />)

    cy.get('[data-testid="item-card"]').click()
    cy.get('@onClick').should('have.been.calledOnce')
  })

  it('uses collection-card testid for collection types', () => {
    cy.mount(<EntityCard item={mockCollection} onClick={cy.stub()} />)

    cy.get('[data-testid="collection-card"]').should('exist')
  })

  it('uses item-card testid for collectible types', () => {
    cy.mount(<EntityCard item={mockItem} onClick={cy.stub()} />)

    cy.get('[data-testid="item-card"]').should('exist')
  })

  it('shows owned indicator when isOwned is true', () => {
    cy.mount(<EntityCard item={mockItem} onClick={cy.stub()} isOwned={true} />)

    // The owned indicator is a checkmark badge in EntityImage
    // It's an SVG with a checkmark path in an emerald-500 circle
    cy.get('.bg-emerald-500').should('exist')
  })

  it('does not show owned indicator when isOwned is false', () => {
    cy.mount(<EntityCard item={mockItem} onClick={cy.stub()} isOwned={false} />)

    cy.get('.bg-emerald-500').should('not.exist')
  })

  it('shows duplicate count badge when isDuplicate, duplicateCount > 1, and onExpandToggle provided', () => {
    const onExpandToggle = cy.stub().as('onExpandToggle')
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        isDuplicate={true}
        duplicateCount={3}
        onExpandToggle={onExpandToggle}
      />
    )

    cy.contains('button', /\u00d73/).should('be.visible') // ×3 (multiplication sign)
  })

  it('calls onExpandToggle when duplicate badge is clicked', () => {
    const onExpandToggle = cy.stub().as('onExpandToggle')
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        isDuplicate={true}
        duplicateCount={3}
        onExpandToggle={onExpandToggle}
      />
    )

    cy.contains('button', /\u00d73/).click()
    cy.get('@onExpandToggle').should('have.been.calledOnce')
    cy.get('@onExpandToggle').should('have.been.calledWith', mockItem.id)
  })

  it('does not show duplicate badge when duplicateCount is 1', () => {
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        isDuplicate={false}
        duplicateCount={1}
        onExpandToggle={cy.stub()}
      />
    )

    cy.get('button').contains(/\u00d7/).should('not.exist')
  })

  it('does not show duplicate badge when onExpandToggle is not provided', () => {
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        isDuplicate={true}
        duplicateCount={3}
      />
    )

    cy.get('button').contains(/\u00d7/).should('not.exist')
  })

  it('shows selected state in multi-select mode', () => {
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        isMultiSelectMode={true}
        isSelected={true}
      />
    )

    // Selected state has blue border and background tint
    cy.get('[data-testid="item-card"]')
      .should('have.class', 'border-blue-500')
      .and('have.class', 'bg-blue-500/10')
  })

  it('does not show selected state when isSelected is false', () => {
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        isMultiSelectMode={true}
        isSelected={false}
      />
    )

    cy.get('[data-testid="item-card"]')
      .should('not.have.class', 'border-blue-500')
  })

  it('shows disabled state when type is locked in multi-select mode', () => {
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        isMultiSelectMode={true}
        isDisabled={true}
      />
    )

    // Disabled state has reduced opacity and not-allowed cursor
    cy.get('[data-testid="item-card"]')
      .should('have.class', 'opacity-40')
      .and('have.class', 'cursor-not-allowed')
  })

  it('calls onSelectionToggle in multi-select mode when clicked', () => {
    const onSelectionToggle = cy.stub().as('onSelectionToggle')
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        isMultiSelectMode={true}
        isSelected={false}
        onSelectionToggle={onSelectionToggle}
      />
    )

    cy.get('[data-testid="item-card"]').click()
    cy.get('@onSelectionToggle').should('have.been.calledOnce')
  })

  it('does not call onSelectionToggle when disabled in multi-select mode', () => {
    const onSelectionToggle = cy.stub().as('onSelectionToggle')
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        isMultiSelectMode={true}
        isDisabled={true}
        onSelectionToggle={onSelectionToggle}
      />
    )

    cy.get('[data-testid="item-card"]').click()
    cy.get('@onSelectionToggle').should('not.have.been.called')
  })

  it('shows favorite styling when isFavorite is true', () => {
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        isFavorite={true}
      />
    )

    // Favorite items have gold border
    cy.get('[data-testid="item-card"]')
      .should('have.class', 'border-2')
  })

  it('shows wishlist styling when showAsWishlist is true', () => {
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        showAsWishlist={true}
      />
    )

    // Wishlist items are grayed out
    cy.get('[data-testid="item-card"]')
      .should('have.class', 'opacity-50')
      .and('have.class', 'grayscale-[50%]')
  })

  it('displays variant name when item has variant_id and entity_variants', () => {
    const itemWithVariant = {
      ...mockItem,
      variant_id: 'var-1',
      entity_variants: [
        { id: 'var-1', name: 'Holo' },
        { id: 'var-2', name: 'First Edition' },
      ],
    }

    cy.mount(<EntityCard item={itemWithVariant} onClick={cy.stub()} />)

    cy.contains('Pikachu #025 (Holo)').should('be.visible')
  })

  it('shows progress bar when progress prop is provided', () => {
    cy.mount(
      <EntityCard
        item={mockCollection}
        onClick={cy.stub()}
        progress={{ owned_count: 10, total_count: 20, percentage: 50 }}
      />
    )

    // Progress displays count
    cy.contains('10/20').should('be.visible')
  })

  it('shows completion bar when showCompletion is true', () => {
    cy.mount(
      <EntityCard
        item={mockItem}
        onClick={cy.stub()}
        showCompletion={true}
        completionStats={{ completionPercentage: 75 }}
      />
    )

    // Completion bar should be rendered
    cy.get('[data-testid="item-card"]').within(() => {
      cy.get('.bg-gradient-to-r').should('exist')
    })
  })
})
