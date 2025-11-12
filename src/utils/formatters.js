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
 * @param {string} type - The entity type to check
 * @returns {boolean} True if the type should be treated as a collection
 */
export const isCollectionType = (type) => {
  if (!type) return false;
  const normalizedType = type.toLowerCase();
  const collectionTypes = [
    'collection',
    'custom',
    'linked',
    'custom_collection', // Keep for backwards compatibility
    'trading_card_game',
    'franchise',
    'video_game_series'
  ];
  return collectionTypes.includes(normalizedType);
};

/**
 * Check if an entity type is a custom collection
 * Handles both "custom" and "CUSTOM COLLECTION" formats
 * @param {string} type - The entity type to check
 * @returns {boolean} True if the type is a custom collection
 */
export const isCustomCollection = (type) => {
  if (!type) return false;
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_');
  return normalizedType === 'custom' || normalizedType === 'custom_collection';
};

/**
 * Check if an entity type is a linked collection
 * Handles both "linked" and "LINKED COLLECTION" formats
 * @param {string} type - The entity type to check
 * @returns {boolean} True if the type is a linked collection
 */
export const isLinkedCollection = (type) => {
  if (!type) return false;
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_');
  return normalizedType === 'linked' || normalizedType === 'linked_collection';
};
