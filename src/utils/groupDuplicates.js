/**
 * Groups items by entity ID when groupDuplicates is enabled
 * @param {Array} items - Array of UserItem objects
 * @param {Boolean} shouldGroup - Whether to group duplicates
 * @returns {Array} - Array of items or grouped items
 */
export function groupDuplicateItems(items, shouldGroup) {
  if (!shouldGroup) {
    return items.map(item => ({ ...item, isDuplicate: false, duplicateCount: 1 }));
  }

  const grouped = {};

  items.forEach(item => {
    // Get the entity ID - items from MY_COLLECTION_TREE use 'id' for entity UUID
    // Items have: id (entity UUID), user_item_id (unique item ID)
    // Wishlists have: id (entity UUID), wishlist_id (unique wishlist ID)
    // Custom items may not have an entity reference
    const entityId = item.entity_id || item.id;

    // Treat items without any ID as unique (edge case)
    if (!entityId) {
      const uniqueKey = `_no_entity_${Math.random()}`;
      grouped[uniqueKey] = [item];
      return;
    }

    if (!grouped[entityId]) {
      grouped[entityId] = [];
    }

    grouped[entityId].push(item);
  });

  // For each group, return the oldest item with duplicate info
  return Object.values(grouped).map(group => {
    // Sort by created_at ascending (oldest first)
    group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const oldest = group[0];
    const count = group.length;

    return {
      ...oldest,
      isDuplicate: count > 1,
      duplicateCount: count,
      duplicateGroup: count > 1 ? group : null, // Store all items for expansion
    };
  });
}
