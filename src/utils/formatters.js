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
    'custom_collection',
    'trading_card_game',
    'franchise',
    'video_game_series'
  ];
  return collectionTypes.includes(normalizedType);
};
