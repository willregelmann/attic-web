import { gql } from '@apollo/client';

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
    addItemToMyCollection(item_id: $itemId, metadata: $metadata) {
      id
      item_id
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