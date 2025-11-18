import { graphql, HttpResponse } from 'msw'

// Import fixtures
import collectionsFixture from '../../fixtures/dbot-responses/collections.json'
import myItemsFixture from '../../fixtures/dbot-responses/my-items.json'
import searchResultsFixture from '../../fixtures/dbot-responses/search-results.json'
import entityDetailFixture from '../../fixtures/dbot-responses/entity-detail.json'
import myCollectionTreeFixture from '../../fixtures/dbot-responses/my-collection-tree.json'

// Mock user for auth
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  picture: null,
}

export const handlers = [
  // Auth mutations
  graphql.mutation('Login', () => {
    return HttpResponse.json({
      data: {
        login: {
          token: 'mock-token-12345',
          user: mockUser,
        },
      },
    })
  }),

  graphql.mutation('GoogleLogin', () => {
    return HttpResponse.json({
      data: {
        googleLogin: {
          token: 'mock-token-12345',
          user: mockUser,
        },
      },
    })
  }),

  // User queries
  graphql.query('GetMyItems', () => {
    return HttpResponse.json({
      data: myItemsFixture,
    })
  }),

  graphql.query('GetMyCollectionTree', () => {
    return HttpResponse.json({
      data: myCollectionTreeFixture,
    })
  }),

  graphql.query('GetMyCollectionStats', () => {
    return HttpResponse.json({
      data: {
        myCollectionStats: {
          total_items: 25,
          unique_items_owned: 20,
          total_collections: 3,
        },
      },
    })
  }),

  // DBoT queries
  graphql.query('GetDatabaseOfThingsCollections', () => {
    return HttpResponse.json({
      data: collectionsFixture,
    })
  }),

  graphql.query('SearchDatabaseOfThingsEntities', ({ variables }) => {
    return HttpResponse.json({
      data: searchResultsFixture,
    })
  }),

  graphql.query('GetDatabaseOfThingsEntity', ({ variables }) => {
    return HttpResponse.json({
      data: entityDetailFixture,
    })
  }),

  graphql.query('GetCollectionFilterFields', () => {
    return HttpResponse.json({
      data: {
        databaseOfThingsCollectionFilterFields: [
          {
            field: 'type',
            values: [
              { value: 'Fire', count: 15 },
              { value: 'Water', count: 12 },
              { value: 'Grass', count: 10 },
            ],
          },
          {
            field: 'rarity',
            values: [
              { value: 'Common', count: 20 },
              { value: 'Uncommon', count: 10 },
              { value: 'Rare', count: 7 },
            ],
          },
        ],
      },
    })
  }),

  // User mutations
  graphql.mutation('AddItemToMyCollection', ({ variables }) => {
    return HttpResponse.json({
      data: {
        addItemToMyCollection: {
          id: 'new-item-' + Date.now(),
          entity_id: variables.entity_id,
          notes: variables.notes || null,
          created_at: new Date().toISOString(),
        },
      },
    })
  }),

  graphql.mutation('CreateUserCollection', ({ variables }) => {
    return HttpResponse.json({
      data: {
        createUserCollection: {
          id: 'new-collection-' + Date.now(),
          name: variables.name,
          description: variables.description || null,
          parent_id: variables.parent_id || null,
          created_at: new Date().toISOString(),
        },
      },
    })
  }),

  graphql.mutation('UpdateUserCollection', ({ variables }) => {
    return HttpResponse.json({
      data: {
        updateUserCollection: {
          id: variables.id,
          name: variables.name,
          description: variables.description || null,
          parent_id: variables.parent_id || null,
        },
      },
    })
  }),

  graphql.mutation('DeleteUserCollection', ({ variables }) => {
    return HttpResponse.json({
      data: {
        deleteUserCollection: {
          id: variables.id,
          success: true,
        },
      },
    })
  }),

  graphql.mutation('DeleteUserItem', ({ variables }) => {
    return HttpResponse.json({
      data: {
        deleteUserItem: {
          id: variables.id,
          success: true,
        },
      },
    })
  }),
]
