import { gql } from '@apollo/client';

// ===== DATABASE OF THINGS QUERIES (Canonical Data) =====

export const GET_DATABASE_OF_THINGS_COLLECTIONS = gql`
  query GetDatabaseOfThingsCollections($first: Int, $after: String, $category: CategoryType) {
    databaseOfThingsCollections(first: $first, after: $after, category: $category) {
      edges {
        node {
          id
          name
          type
          category
          year
          country
          language
          attributes
          image_url
          thumbnail_url
          additional_images {
            id
            image_url
            thumbnail_url
          }
          external_ids
          source_url
          entity_variants {
            id
            name
            attributes
            image_url
            thumbnail_url
          }
          entity_components {
            id
            name
            quantity
            order
            attributes
            image_url
            thumbnail_url
          }
          representative_image_urls
          created_at
          updated_at
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_DATABASE_OF_THINGS_COLLECTION_ITEMS = gql`
  query GetDatabaseOfThingsCollectionItems($collectionId: ID!, $first: Int, $after: String) {
    databaseOfThingsCollectionItems(collection_id: $collectionId, first: $first, after: $after) {
      edges {
        node {
          id
          name
          type
          category
          year
          country
          language
          attributes
          image_url
          thumbnail_url
          additional_images {
            id
            image_url
            thumbnail_url
          }
          external_ids
          source_url
          entity_variants {
            id
            name
            attributes
            image_url
            thumbnail_url
          }
          entity_components {
            id
            name
            quantity
            order
            attributes
            image_url
            thumbnail_url
          }
          representative_image_urls
          created_at
          updated_at
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const SEARCH_DATABASE_OF_THINGS_ENTITIES = gql`
  query SearchDatabaseOfThingsEntities($query: String!, $type: EntityType, $category: CategoryType, $first: Int, $after: String) {
    databaseOfThingsSearch(query: $query, type: $type, category: $category, first: $first, after: $after) {
      edges {
        node {
          id
          name
          type
          category
          year
          country
          language
          attributes
          image_url
          thumbnail_url
          additional_images {
            id
            image_url
            thumbnail_url
          }
          external_ids
          source_url
          entity_variants {
            id
            name
            attributes
            image_url
            thumbnail_url
          }
          entity_components {
            id
            name
            quantity
            order
            attributes
            image_url
            thumbnail_url
          }
          representative_image_urls
          created_at
          updated_at
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const SEMANTIC_SEARCH_DATABASE_OF_THINGS = gql`
  query SemanticSearchDatabaseOfThings($query: String!, $type: EntityType, $category: CategoryType, $first: Int, $after: String) {
    databaseOfThingsSemanticSearch(query: $query, type: $type, category: $category, first: $first, after: $after) {
      edges {
        node {
          id
          name
          type
          category
          year
          country
          language
          attributes
          image_url
          thumbnail_url
          additional_images {
            id
            image_url
            thumbnail_url
          }
          external_ids
          source_url
          entity_variants {
            id
            name
            attributes
            image_url
            thumbnail_url
          }
          entity_components {
            id
            name
            quantity
            order
            attributes
            image_url
            thumbnail_url
          }
          representative_image_urls
          similarity
          created_at
          updated_at
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_DATABASE_OF_THINGS_ENTITY = gql`
  query GetDatabaseOfThingsEntity($id: ID!) {
    databaseOfThingsEntity(id: $id) {
      id
      name
      type
      category
      year
      country
      language
      attributes
      image_url
      thumbnail_url
      additional_images {
        id
        image_url
        thumbnail_url
      }
      external_ids
      source_url
      entity_variants {
        id
        name
        attributes
        image_url
        thumbnail_url
      }
      entity_components {
        id
        name
        quantity
        order
        attributes
        image_url
        thumbnail_url
      }
      representative_image_urls
      parents {
        id
        name
        type
      }
      created_at
      updated_at
    }
  }
`;

export const GET_DATABASE_OF_THINGS_ITEM_PARENTS = gql`
  query GetDatabaseOfThingsItemParents($itemId: ID!) {
    databaseOfThingsItemParents(item_id: $itemId) {
      id
      name
      type
      category
      year
      country
      language
      attributes
      image_url
      thumbnail_url
      additional_images {
        id
        image_url
        thumbnail_url
      }
      external_ids
      source_url
      entity_variants {
        id
        name
        attributes
        image_url
        thumbnail_url
      }
      entity_components {
        id
        name
        quantity
        order
        attributes
        image_url
        thumbnail_url
      }
      representative_image_urls
      created_at
      updated_at
      parents {
        id
        name
        type
        category
        year
        country
        language
        attributes
        image_url
        thumbnail_url
        additional_images {
          id
          image_url
          thumbnail_url
        }
        external_ids
        source_url
        entity_variants {
          id
          name
          attributes
          image_url
          thumbnail_url
        }
        entity_components {
          id
          name
          quantity
          order
          attributes
          image_url
          thumbnail_url
        }
        representative_image_urls
        created_at
        updated_at
        parents {
          id
          name
          type
          category
          year
          country
          language
          attributes
          image_url
          thumbnail_url
          additional_images {
            id
            image_url
            thumbnail_url
          }
          external_ids
          source_url
          entity_variants {
            id
            name
            attributes
            image_url
            thumbnail_url
          }
          entity_components {
            id
            name
            quantity
            order
            attributes
            image_url
            thumbnail_url
          }
          representative_image_urls
          created_at
          updated_at
          parents {
            id
            name
            type
            category
            year
            country
            language
            attributes
            image_url
            thumbnail_url
            additional_images {
              id
              image_url
              thumbnail_url
            }
            external_ids
            source_url
            entity_variants {
              id
              name
              attributes
              image_url
              thumbnail_url
            }
            entity_components {
              id
              name
              quantity
              order
              attributes
              image_url
              thumbnail_url
            }
            representative_image_urls
            created_at
            updated_at
            parents {
              id
              name
              type
              category
              year
              country
              language
              attributes
              image_url
              thumbnail_url
              additional_images {
                id
                image_url
                thumbnail_url
              }
              external_ids
              source_url
              entity_variants {
                id
                name
                attributes
                image_url
                thumbnail_url
              }
              entity_components {
                id
                name
                quantity
                order
                attributes
                image_url
                thumbnail_url
              }
              representative_image_urls
              created_at
              updated_at
            }
          }
        }
      }
    }
  }
`;

export const GET_COLLECTION_FILTER_FIELDS = gql`
  query GetCollectionFilterFields($collectionId: ID!) {
    databaseOfThingsCollectionFilterFields(collection_id: $collectionId) {
      field
      label
      type
      values
      count
      priority
    }
  }
`;

export const GET_COLLECTION_PARENT_COLLECTIONS = gql`
  query GetCollectionParentCollections($collectionId: ID!) {
    databaseOfThingsCollectionParentCollections(collection_id: $collectionId) {
      id
      name
      type
      category
      year
      country
      language
      attributes
      image_url
      thumbnail_url
      additional_images {
        id
        image_url
        thumbnail_url
      }
      external_ids
      source_url
      entity_variants {
        id
        name
        attributes
        image_url
        thumbnail_url
      }
      entity_components {
        id
        name
        quantity
        order
        attributes
        image_url
        thumbnail_url
      }
      representative_image_urls
      created_at
      updated_at
    }
  }
`;

// ===== LEGACY LOCAL QUERIES (Deprecated - Use Supabase) =====

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
  mutation AddItemToMyCollection($itemId: ID!, $variantId: ID, $metadata: JSON, $notes: String, $images: [Upload!]) {
    addItemToMyCollection(entity_id: $itemId, variant_id: $variantId, metadata: $metadata, notes: $notes, images: $images) {
      id
      entity_id
      variant_id
      user_id
      metadata
      notes
      images {
        id
        original
        thumbnail
      }
      created_at
    }
  }
`;

export const ADD_CUSTOM_ITEM_TO_MY_COLLECTION = gql`
  mutation AddCustomItemToMyCollection($name: String!, $parentCollectionId: ID, $notes: String, $images: [Upload!]) {
    addCustomItemToMyCollection(name: $name, parent_collection_id: $parentCollectionId, notes: $notes, images: $images) {
      id
      name
      entity_id
      user_id
      notes
      images {
        id
        original
        thumbnail
      }
      created_at
    }
  }
`;

export const UPDATE_MY_ITEM = gql`
  mutation UpdateMyItem($userItemId: ID!, $variantId: ID, $metadata: JSON, $notes: String) {
    updateMyItem(user_item_id: $userItemId, variant_id: $variantId, metadata: $metadata, notes: $notes) {
      id
      entity_id
      variant_id
      user_id
      metadata
      notes
      images {
        id
        original
        thumbnail
      }
      updated_at
    }
  }
`;

export const REMOVE_ITEM_FROM_MY_COLLECTION = gql`
  mutation RemoveItemFromMyCollection($itemId: ID!) {
    removeItemFromMyCollection(entity_id: $itemId)
  }
`;

export const BATCH_ADD_ITEMS_TO_MY_COLLECTION = gql`
  mutation BatchAddItemsToMyCollection($entityIds: [ID!]!, $parentCollectionId: ID) {
    batchAddItemsToMyCollection(entity_ids: $entityIds, parent_collection_id: $parentCollectionId) {
      success
      items_processed
      items_skipped
      message
    }
  }
`;

export const BATCH_REMOVE_ITEMS_FROM_MY_COLLECTION = gql`
  mutation BatchRemoveItemsFromMyCollection($entityIds: [ID!]!) {
    batchRemoveItemsFromMyCollection(entity_ids: $entityIds) {
      success
      items_processed
      items_skipped
      message
    }
  }
`;

export const BATCH_ADD_ITEMS_TO_WISHLIST = gql`
  mutation BatchAddItemsToWishlist($entityIds: [ID!]!, $parentCollectionId: ID) {
    batchAddItemsToWishlist(entity_ids: $entityIds, parent_collection_id: $parentCollectionId) {
      success
      items_processed
      items_skipped
      message
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

export const GET_MY_ITEMS = gql`
  query GetMyItems {
    myItems {
      id
      entity_id
      variant_id
      notes
      metadata
      created_at
    }
  }
`;

// TODO: Backend needs to implement this query
// For now, we'll use GET_MY_ITEMS and filter client-side
export const GET_MY_ITEM = gql`
  query GetMyItem($userItemId: ID!) {
    myItem(user_item_id: $userItemId) {
      user_item_id
      user_id
      user_metadata
      user_notes
      user_images {
        id
        original
        thumbnail
      }
      parent_collection_id
      variant_id
      id
      type
      name
      year
      attributes
      image_url
      thumbnail_url
      entity_variants {
        id
        name
        attributes
        image_url
        thumbnail_url
      }
    }
  }
`;

export const GET_MY_COLLECTION = gql`
  query GetMyCollection {
    myCollection {
      # UserItem fields
      user_item_id
      user_id
      user_metadata
      user_notes
      user_images {
        id
        original
        thumbnail
      }
      user_created_at
      user_updated_at
      variant_id

      # Entity fields (from Database of Things)
      id
      name
      type
      year
      country
      attributes
      image_url
      thumbnail_url
      representative_image_urls
      external_ids
      entity_variants {
        id
        name
        attributes
        image_url
        thumbnail_url
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
        original
        thumbnail
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
  mutation AddItemToWishlist($itemId: ID!, $variantId: ID) {
    addItemToWishlist(entity_id: $itemId, variant_id: $variantId) {
      id
      entity_id
      variant_id
      created_at
    }
  }
`;

export const REMOVE_ITEM_FROM_WISHLIST = gql`
  mutation RemoveItemFromWishlist($itemId: ID!) {
    removeItemFromWishlist(entity_id: $itemId)
  }
`;

// ===== CUSTOM COLLECTIONS =====

export const MY_COLLECTION_TREE = gql`
  query MyCollectionTree($parentId: ID) {
    myCollectionTree(parent_id: $parentId) {
      collections {
        id
        name
        type
        description
        custom_image
        linked_dbot_collection_id
        image_url
        progress {
          owned_count
          wishlist_count
          total_count
          percentage
        }
        created_at
      }
      items {
        user_item_id
        user_id
        user_metadata
        user_notes
        user_images {
        id
        original
        thumbnail
      }
        parent_collection_id
        id
        type
        name
        year
        attributes
        image_url
        thumbnail_url
        entity_variants {
        id
        name
        attributes
        image_url
        thumbnail_url
      }
        variant_id
      }
      wishlists {
        wishlist_id
        wishlist_created_at
        id
        type
        name
        year
        attributes
        image_url
        thumbnail_url
        entity_variants {
        id
        name
        attributes
        image_url
        thumbnail_url
      }
        variant_id
      }
      current_collection {
        id
        name
        parent_collection_id
        linked_dbot_collection_id
        type
        description
        custom_image
        image_url
        representative_images
        progress {
          owned_count
          wishlist_count
          total_count
          percentage
        }
      }
    }
  }
`;

export const CREATE_USER_COLLECTION = gql`
  mutation CreateUserCollection(
    $name: String!
    $description: String
    $parentId: ID
    $linkedDbotCollectionId: ID
  ) {
    createUserCollection(
      name: $name
      description: $description
      parent_id: $parentId
      linked_dbot_collection_id: $linkedDbotCollectionId
    ) {
      id
      name
      description
      parent_collection_id
      linked_dbot_collection_id
      created_at
    }
  }
`;

export const UPDATE_USER_COLLECTION = gql`
  mutation UpdateUserCollection(
    $id: ID!
    $name: String
    $description: String
  ) {
    updateUserCollection(
      id: $id
      name: $name
      description: $description
    ) {
      id
      name
      description
      updated_at
    }
  }
`;

export const MOVE_USER_COLLECTION = gql`
  mutation MoveUserCollection($id: ID!, $newParentId: ID) {
    moveUserCollection(id: $id, new_parent_id: $newParentId) {
      id
      name
      parent_collection_id
    }
  }
`;

export const USER_COLLECTION_DELETION_PREVIEW = gql`
  query UserCollectionDeletionPreview($id: ID!) {
    userCollectionDeletionPreview(id: $id) {
      collection_id
      collection_name
      total_items
      total_subcollections
    }
  }
`;

export const DELETE_USER_COLLECTION = gql`
  mutation DeleteUserCollection($id: ID!) {
    deleteUserCollection(id: $id) {
      success
      deleted_collection_id
      items_deleted
      subcollections_deleted
    }
  }
`;

export const MOVE_USER_ITEM = gql`
  mutation MoveUserItem($itemId: ID!, $newParentCollectionId: ID) {
    moveUserItem(
      item_id: $itemId
      new_parent_collection_id: $newParentCollectionId
    ) {
      id
      parent_collection_id
    }
  }
`;

export const MOVE_WISHLIST_ITEM = gql`
  mutation MoveWishlistItem($wishlistId: ID!, $newParentCollectionId: ID) {
    moveWishlistItem(
      wishlist_id: $wishlistId
      new_parent_collection_id: $newParentCollectionId
    ) {
      id
      parent_collection_id
    }
  }
`;

export const ADD_COLLECTION_TO_WISHLIST = gql`
  mutation AddCollectionToWishlist(
    $dbot_collection_id: ID!
    $mode: WishlistMode!
    $new_collection_name: String
    $target_collection_id: ID
  ) {
    addCollectionToWishlist(
      dbot_collection_id: $dbot_collection_id
      mode: $mode
      new_collection_name: $new_collection_name
      target_collection_id: $target_collection_id
    ) {
      created_collection {
        id
        name
      }
      items_added
      items_already_owned
      items_skipped
    }
  }
`;

// ===== IMAGE UPLOAD MUTATIONS =====

// Image upload mutations for user items
export const UPLOAD_ITEM_IMAGES = gql`
  mutation UploadItemImages($user_item_id: ID!, $images: [Upload!], $remove_image_indices: [Int!]) {
    updateMyItem(
      user_item_id: $user_item_id
      images: $images
      remove_image_indices: $remove_image_indices
    ) {
      id
      images {
        id
        original
        thumbnail
      }
      entity_id
      notes
      metadata
    }
  }
`;

export const REORDER_ITEM_IMAGES = gql`
  mutation ReorderItemImages($user_item_id: ID!, $image_ids: [ID!]!) {
    reorderItemImages(user_item_id: $user_item_id, image_ids: $image_ids) {
      id
      images {
        id
        original
        thumbnail
      }
    }
  }
`;

// Image upload mutations for user collections
export const UPLOAD_COLLECTION_IMAGES = gql`
  mutation UploadCollectionImages($collection_id: ID!, $images: [Upload!]!) {
    uploadCollectionImages(collection_id: $collection_id, images: $images) {
      id
      images {
        id
        original
        thumbnail
      }
      name
      type
    }
  }
`;

export const REMOVE_COLLECTION_IMAGES = gql`
  mutation RemoveCollectionImages($collection_id: ID!, $image_indices: [Int!]!) {
    removeCollectionImages(collection_id: $collection_id, image_indices: $image_indices) {
      id
      images {
        id
        original
        thumbnail
      }
    }
  }
`;

export const REORDER_COLLECTION_IMAGES = gql`
  mutation ReorderCollectionImages($collection_id: ID!, $image_ids: [ID!]!) {
    reorderCollectionImages(collection_id: $collection_id, image_ids: $image_ids) {
      id
      images {
        id
        original
        thumbnail
      }
    }
  }
`;

// ===== IMAGE SEARCH MUTATIONS =====

export const SEARCH_BY_IMAGE = gql`
  mutation SearchByImage($image: Upload!, $limit: Int, $minSimilarity: Float) {
    searchByImage(image: $image, limit: $limit, min_similarity: $minSimilarity) {
      image_id
      image_url
      thumbnail_url
      similarity
      parent_type
      parent_id
      parent_name
    }
  }
`;
