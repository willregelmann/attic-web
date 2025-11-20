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

  graphql.query('MyCollectionTree', ({ variables }) => {
    const parentId = variables.parentId

    // If requesting subcollections of Pokemon Cards, return Base Set
    if (parentId === 'user-col-1') {
      return HttpResponse.json({
        data: {
          myCollectionTree: {
            collections: [
              {
                id: 'user-col-2',
                name: 'Base Set',
                type: 'custom',
                description: 'Original base set cards',
                custom_image: null,
                linked_dbot_collection_id: null,
                image_url: null,
                progress: {
                  owned_count: 10,
                  wishlist_count: 3,
                  total_count: 15,
                  percentage: 67
                },
                representative_images: [],
                created_at: '2024-01-03T10:00:00Z'
              }
            ],
            items: [],
            wishlists: [],
            current_collection: {
              id: 'user-col-1',
              name: 'Pokemon Cards',
              parent_collection_id: null,
              linked_dbot_collection_id: null,
              type: 'custom',
              description: 'My Pokemon card collection',
              custom_image: null,
              image_url: null,
              progress: {
                owned_count: 15,
                wishlist_count: 5,
                total_count: 25,
                percentage: 60
              },
              representative_images: [],
              created_at: '2024-01-01T10:00:00Z'
            }
          }
        },
      })
    }

    if (parentId === 'user-col-3') {
      return HttpResponse.json({
        data: {
          myCollectionTree: {
            collections: [],
            items: [],
            wishlists: [],
            current_collection: {
              id: 'user-col-3',
              name: 'Magic Cards',
              parent_collection_id: null,
              linked_dbot_collection_id: null,
              type: 'custom',
              description: 'My MTG collection',
              custom_image: null,
              image_url: null,
              progress: {
                owned_count: 8,
                wishlist_count: 2,
                total_count: 10,
                percentage: 80
              },
              representative_images: [],
              created_at: '2024-01-02T10:00:00Z'
            }
          }
        },
      })
    }

    // Default: return root collection tree
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

  // Semantic search (used by Navigation.jsx and SearchResultsPage.jsx)
  graphql.query('SemanticSearchDatabaseOfThings', ({ variables }) => {
    // Generate 10 results so "View all results" button appears
    const baseResults = [
      { id: 'entity-pikachu', name: 'Pikachu #025', number: '025', rarity: 'Common' },
      { id: 'entity-pikachu-promo', name: 'Pikachu Promo', number: '001', rarity: 'Promo' },
      { id: 'entity-pikachu-v', name: 'Pikachu V', number: '043', rarity: 'Ultra Rare' },
      { id: 'entity-pikachu-vmax', name: 'Pikachu VMAX', number: '044', rarity: 'Ultra Rare' },
      { id: 'entity-pikachu-ex', name: 'Pikachu EX', number: '051', rarity: 'Rare' },
      { id: 'entity-pikachu-gx', name: 'Pikachu GX', number: '066', rarity: 'Rare' },
      { id: 'entity-pikachu-star', name: 'Pikachu Star', number: '104', rarity: 'Secret Rare' },
      { id: 'entity-pikachu-delta', name: 'Pikachu Delta', number: '035', rarity: 'Rare' },
      { id: 'entity-pikachu-lv-x', name: 'Pikachu Lv.X', number: '099', rarity: 'Lv.X' },
      { id: 'entity-pikachu-legend', name: 'Pikachu Legend', number: '111', rarity: 'Legend' },
    ];

    const edges = baseResults.map((item, index) => ({
      node: {
        id: item.id,
        name: item.name,
        type: 'collectible',
        category: 'trading_card_games',
        year: 1999 + index,
        country: 'Japan',
        language: 'en',
        attributes: {
          number: item.number,
          rarity: item.rarity,
          type: 'Electric'
        },
        image_url: `https://example.com/${item.id}.jpg`,
        thumbnail_url: `https://example.com/${item.id}-thumb.jpg`,
        additional_images: [],
        external_ids: {},
        source_url: null,
        entity_variants: [],
        entity_components: [],
        representative_image_urls: [`https://example.com/${item.id}.jpg`],
        similarity: 0.95 - (index * 0.05),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      cursor: `cursor-${index + 1}`
    }));

    return HttpResponse.json({
      data: {
        databaseOfThingsSemanticSearch: {
          edges,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'cursor-1',
            endCursor: 'cursor-10'
          }
        }
      },
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
          },
        ],
      },
    })
  }),

  graphql.query('GetCollectionParentCollections', () => {
    return HttpResponse.json({
      data: {
        databaseOfThingsCollectionParentCollections: []
      }
    })
  }),

  // User mutations
  graphql.mutation('AddItemToMyCollection', ({ variables }) => {
    return HttpResponse.json({
      data: {
        addItemToMyCollection: {
          id: 'new-item-' + Date.now(),
          entity_id: variables.itemId,
          variant_id: variables.variantId || null,
          user_id: 'user-123',
          metadata: variables.metadata || null,
          notes: variables.notes || null,
          images: [],
          created_at: new Date().toISOString(),
        },
      },
    })
  }),

  graphql.mutation('BatchAddItemsToMyCollection', ({ variables }) => {
    return HttpResponse.json({
      data: {
        batchAddItemsToMyCollection: {
          items_added: variables.entityIds?.length || 0,
          items_already_owned: 0,
          message: `Added ${variables.entityIds?.length || 0} items to collection`,
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
          success: true,
          deleted_collection_id: variables.id,
          items_deleted: 0,
          subcollections_deleted: 0,
        },
      },
    })
  }),

  graphql.query('UserCollectionDeletionPreview', ({ variables }) => {
    return HttpResponse.json({
      data: {
        userCollectionDeletionPreview: {
          collection_id: variables.id,
          collection_name: 'Test Collection',
          total_items: 0,
          total_subcollections: 0,
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

  // Get single user item
  graphql.query('GetMyItem', ({ variables }) => {
    // Return a mock item based on the userItemId
    return HttpResponse.json({
      data: {
        myItem: {
          user_item_id: variables.userItemId,
          user_id: 'user-123',
          user_metadata: null,
          user_notes: 'Test notes',
          user_images: [],
          parent_collection_id: null,
          variant_id: null,
          id: 'entity-pikachu',
          type: 'collectible',
          name: 'Pikachu #025',
          year: 1999,
          attributes: {
            number: '025',
            rarity: 'Common',
            type: 'Electric',
          },
          image_url: 'https://example.com/pikachu.jpg',
          thumbnail_url: 'https://example.com/pikachu-thumb.jpg',
          entity_variants: [],
        },
      },
    })
  }),

  // Remove item from collection (uses itemId which maps to entity_id)
  graphql.mutation('RemoveItemFromMyCollection', ({ variables }) => {
    return HttpResponse.json({
      data: {
        removeItemFromMyCollection: true,
      },
    })
  }),

  // Update user item
  graphql.mutation('UpdateMyItem', ({ variables }) => {
    return HttpResponse.json({
      data: {
        updateMyItem: {
          id: variables.userItemId,
          entity_id: 'entity-pikachu',
          variant_id: variables.variantId || null,
          user_id: 'user-123',
          metadata: variables.metadata || null,
          notes: variables.notes || null,
          images: [],
          updated_at: new Date().toISOString(),
        },
      },
    })
  }),
]
