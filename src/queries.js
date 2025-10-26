import { gql } from '@apollo/client';

// ===== DATABASE OF THINGS QUERIES (Canonical Data) =====

export const GET_DATABASE_OF_THINGS_COLLECTIONS = gql`
  query GetDatabaseOfThingsCollections($first: Int, $after: String) {
    databaseOfThingsCollections(first: $first, after: $after) {
      id
      name
      type
      year
      country
      attributes
      image_url
      external_ids
    }
  }
`;

export const GET_DATABASE_OF_THINGS_COLLECTION_ITEMS = gql`
  query GetDatabaseOfThingsCollectionItems($collectionId: ID!, $first: Int, $after: String) {
    databaseOfThingsCollectionItems(collection_id: $collectionId, first: $first, after: $after) {
      id
      name
      type
      year
      country
      attributes
      image_url
      external_ids
    }
  }
`;

export const SEARCH_DATABASE_OF_THINGS_ENTITIES = gql`
  query SearchDatabaseOfThingsEntities($query: String!, $type: String, $first: Int) {
    databaseOfThingsSearch(query: $query, type: $type, first: $first) {
      id
      name
      type
      year
      country
      attributes
      image_url
      external_ids
    }
  }
`;

export const SEMANTIC_SEARCH_DATABASE_OF_THINGS = gql`
  query SemanticSearchDatabaseOfThings($query: String!, $type: String, $first: Int) {
    databaseOfThingsSemanticSearch(query: $query, type: $type, first: $first) {
      id
      name
      type
      year
      country
      attributes
      image_url
      external_ids
      similarity
    }
  }
`;

export const GET_DATABASE_OF_THINGS_ENTITY = gql`
  query GetDatabaseOfThingsEntity($id: ID!) {
    databaseOfThingsEntity(id: $id) {
      id
      name
      type
      year
      country
      attributes
      image_url
      external_ids
    }
  }
`;

export const GET_DATABASE_OF_THINGS_ITEM_PARENTS = gql`
  query GetDatabaseOfThingsItemParents($itemId: ID!) {
    databaseOfThingsItemParents(item_id: $itemId) {
      id
      name
      type
      year
      image_url
      parents {
        id
        name
        type
        year
        image_url
        parents {
          id
          name
          type
          year
          image_url
          parents {
            id
            name
            type
            year
            image_url
            parents {
              id
              name
              type
              year
              image_url
            }
          }
        }
      }
    }
  }
`;

// ===== LEGACY LOCAL QUERIES (Deprecated - Use Supabase) =====

export const GET_COLLECTIONS = gql`
  query GetCollections {
    collections {
      id
      name
      type
      primaryImage {
        url
        alt_text
      }
    }
  }
`;

export const GET_COLLECTION_ITEMS = gql`
  query GetCollectionItems($collectionId: ID!) {
    collectionItems(collection_id: $collectionId) {
      id
      name
      type
      metadata
      primaryImage {
        url
        alt_text
      }
    }
  }
`;

export const GET_COLLECTION = gql`
  query GetCollection($id: ID!) {
    collection(id: $id) {
      id
      name
      type
      metadata
      primaryImage {
        url
        alt_text
      }
      maintainers {
        id
        user_id
        role
      }
    }
  }
`;

export const GET_COLLECTION_DETAILS = gql`
  query GetCollectionDetails($id: ID!) {
    collection(id: $id) {
      id
      name
      type
      metadata
      primaryImage {
        url
        alt_text
      }
      children {
        id
        name
        type
        metadata
        primaryImage {
          url
          alt_text
        }
      }
    }
  }
`;

export const SEARCH_ITEMS = gql`
  query SearchItems($name: String!) {
    searchItems(name: $name) {
      id
      name
      type
    }
  }
`;

export const ADD_ITEM_TO_MY_COLLECTION = gql`
  mutation AddItemToMyCollection($itemId: ID!, $metadata: JSON) {
    addItemToMyCollection(entity_id: $itemId, metadata: $metadata) {
      id
      entity_id
      user_id
      metadata
      created_at
    }
  }
`;

export const GOOGLE_LOGIN = gql`
  mutation GoogleLogin($googleToken: String!) {
    googleLogin(google_token: $googleToken) {
      access_token
      token_type
      user {
        id
        name
        email
      }
    }
  }
`;

export const FAVORITE_COLLECTION = gql`
  mutation FavoriteCollection($collectionId: ID!) {
    favoriteCollection(collection_id: $collectionId) {
      id
      favoriteCollections {
        id
      }
    }
  }
`;

export const UNFAVORITE_COLLECTION = gql`
  mutation UnfavoriteCollection($collectionId: ID!) {
    unfavoriteCollection(collection_id: $collectionId) {
      id
      favoriteCollections {
        id
      }
    }
  }
`;

export const GET_MY_FAVORITE_COLLECTIONS = gql`
  query GetMyFavoriteCollections {
    myFavoriteCollections {
      collection {
        id
        name
        type
      }
      stats {
        totalItems
        ownedItems
        completionPercentage
      }
    }
  }
`;

export const GET_ITEM_DETAILS = gql`
  query GetItemDetails($id: ID!) {
    item(id: $id) {
      id
      name
      type
      metadata
      primaryImage {
        url
        alt_text
      }
      images {
        id
        url
        alt_text
        is_primary
      }
      parents {
        id
        name
        type
        primaryImage {
          url
          alt_text
        }
      }
      children {
        id
        name
        type
        metadata
        primaryImage {
          url
          alt_text
        }
      }
    }
  }
`;

export const GET_ALL_ITEMS = gql`
  query GetAllItems($type: ItemType) {
    items(type: $type) {
      id
      name
      type
      metadata
      primaryImage {
        url
        alt_text
      }
      parents {
        id
        name
        type
      }
    }
  }
`;

// ===== API TOKEN QUERIES =====

export const GET_MY_API_TOKENS = gql`
  query GetMyApiTokens {
    myApiTokens {
      id
      name
      abilities
      last_used_at
      expires_at
      created_at
    }
  }
`;

// ===== API TOKEN MUTATIONS =====

export const CREATE_API_TOKEN = gql`
  mutation CreateApiToken($name: String!, $abilities: [String!], $expiresAt: DateTime) {
    createApiToken(name: $name, abilities: $abilities, expires_at: $expiresAt) {
      token {
        id
        name
        abilities
        expires_at
        created_at
      }
      plainTextToken
    }
  }
`;

export const REVOKE_API_TOKEN = gql`
  mutation RevokeApiToken($id: ID!) {
    revokeApiToken(id: $id)
  }
`;

// ===== WISHLIST QUERIES =====

export const GET_MY_WISHLIST = gql`
  query GetMyWishlist {
    myWishlist {
      id
      entity_id
      created_at
    }
  }
`;

// ===== WISHLIST MUTATIONS =====

export const ADD_ITEM_TO_WISHLIST = gql`
  mutation AddItemToWishlist($itemId: ID!) {
    addItemToWishlist(entity_id: $itemId) {
      id
      entity_id
      created_at
    }
  }
`;

export const REMOVE_ITEM_FROM_WISHLIST = gql`
  mutation RemoveItemFromWishlist($itemId: ID!) {
    removeItemFromWishlist(entity_id: $itemId)
  }
`;
