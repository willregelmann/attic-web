/**
 * Format entity type for display
 * Converts snake_case to uppercase with spaces
 * Example: "pokemon_card" -> "POKEMON CARD"
 */
export const formatEntityType = (type) => {
  if (!type) return 'STANDARD';
  return type.replace(/_/g, ' ').toUpperCase();
};

/**
 * Check if an entity type should be treated as a collection
 * Collections are browsable and can contain child items
 *
 * @param {string|Object} itemOrType - The item object (with type property) or type string
 * @returns {boolean} True if the type should be treated as a collection
 */
export const isCollectionType = (itemOrType) => {
  if (!itemOrType) return false;

  // If it's an object, check the type property
  if (typeof itemOrType === 'object') {
    return itemOrType.type === 'collection';
  }

  // If it's a string, check for collection type values
  const normalizedType = itemOrType.toLowerCase();
  const collectionTypes = [
    'collection',
    'trading_card_game',
    'franchise',
    'video_game_series'
  ];
  return collectionTypes.includes(normalizedType);
};

/**
 * Check if an entity is a custom collection (user-created, not linked to DBoT)
 * A custom collection has type='collection' and NO linked_dbot_collection_id
 *
 * @param {Object} item - The item object
 * @returns {boolean} True if the entity is a custom collection
 */
export const isCustomCollection = (item) => {
  if (!item) return false;

  // Must be a collection type
  if (item.type !== 'collection') return false;

  // Must be a user collection (has parent_collection_id field from our database)
  // DBoT collections from the external API won't have this field
  if (!('parent_collection_id' in item)) return false;

  // Custom = no linked DBoT collection
  return !item.linked_dbot_collection_id;
};

/**
 * Check if an entity is a linked collection (linked to a DBoT collection)
 * A linked collection has type='collection' AND a linked_dbot_collection_id
 *
 * @param {Object} item - The item object
 * @returns {boolean} True if the entity is a linked collection
 */
export const isLinkedCollection = (item) => {
  if (!item) return false;

  // Must be a collection type
  if (item.type !== 'collection') return false;

  // Must be a user collection (has parent_collection_id field from our database)
  // DBoT collections from the external API won't have this field
  if (!('parent_collection_id' in item)) return false;

  // Linked = has linked DBoT collection ID
  return !!item.linked_dbot_collection_id;
};

/**
 * Check if an entity is a user collection (either custom or linked)
 *
 * @param {Object} item - The item object with type property
 * @returns {boolean} True if the entity is a user collection
 */
export const isUserCollection = (item) => {
  if (!item) return false;
  return item.type === 'collection';
};

/**
 * Check if an entity is a custom item (user-created item, not from DBoT)
 *
 * @param {Object} item - The item object with type and category properties
 * @returns {boolean} True if the entity is a custom item
 *
 * Custom items have:
 * - type='item' and category='custom'
 * - OR user_item_id is set and id is null (no DBoT entity)
 */
export const isCustomItem = (item) => {
  if (!item) return false;

  // Check for custom category
  if (item.type === 'item' && item.category === 'custom') {
    return true;
  }

  // Fallback: check for user_item_id with no entity id
  if (item.user_item_id && !item.id) {
    return true;
  }

  return false;
};

/**
 * Check if a collection is 100% complete (all items owned, nothing on wishlist)
 * @param {Object} item - Item/collection object with progress data
 * @returns {boolean} True if collection is complete
 */
export const isCollectionComplete = (item) => {
  if (!isCollectionType(item) || !item?.progress) {
    return false;
  }

  return item.progress.wishlist_count === 0
    && item.progress.owned_count === item.progress.total_count
    && item.progress.total_count > 0;
};
