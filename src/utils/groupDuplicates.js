/**
 * Groups items by entity_id when groupDuplicates is enabled
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
    // Treat items without entity_id as unique (cannot be duplicated)
    if (!item.entity_id) {
      const uniqueKey = `_no_entity_${item.id || Math.random()}`;
      grouped[uniqueKey] = [item];
      return;
    }

    const entityId = item.entity_id;

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
