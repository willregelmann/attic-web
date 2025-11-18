import { useState } from 'react';
import { EntityCard } from './EntityCard';
import { isCollectionType, isCollectionComplete } from '../utils/formatters';

/**
 * EntityCardGrid - Reusable grid wrapper for rendering entity cards (items and collections)
 *
 * @param {Array} items - Array of items/collections to render
 * @param {Object} onClick - Click handlers { item, collection }
 * @param {Object} ownership - Ownership state { owned: Set, favorites: Set }
 * @param {Object} multiSelect - Multi-select state { active, selected: Set, onToggle, allowCollections }
 * @param {Boolean} isRoot - Whether this is root view (for favorites styling)
 * @param {String} viewMode - 'grid' or 'list'
 * @param {Boolean} showWishlistStyling - Whether to dim non-owned items (MyCollection context)
 */
export function EntityCardGrid({
  items = [],
  onClick = {},
  ownership = { owned: new Set(), favorites: new Set() },
  multiSelect = { active: false, selected: new Set(), onToggle: null, allowCollections: false },
  isRoot = false,
  viewMode = 'grid',
  showWishlistStyling = false
}) {
  const { item: onItemClick, collection: onCollectionClick } = onClick;
  const { owned: userOwnership, favorites: userFavorites } = ownership;
  const { active: isMultiSelectMode, selected: selectedItems, onToggle: onItemSelectionToggle, allowCollections: allowCollectionSelection } = multiSelect;
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Tailwind grid classes - mobile-first responsive
  // Using ! prefix for important to override any conflicting CSS
  const gridClass = viewMode === 'grid'
    ? '!grid !grid-cols-3 sm:!grid-cols-3 md:!grid-cols-4 lg:!grid-cols-5 xl:!grid-cols-6 !gap-4 md:!gap-5 !px-4 md:!px-8 !pt-8 md:!pt-10 !pb-4'
    : '!flex !flex-col !gap-4 !px-4 md:!px-8 !pt-8 md:!pt-10 !pb-4';

  // Toggle expansion state for a duplicate group
  const toggleExpansion = (itemId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <div className={gridClass}>
      {items.map((item, index) => {
        const isOwned = userOwnership.has(item.id);
        const isFavorite = isRoot && userFavorites.has(item.id);
        // Custom items have type 'custom' but also have user_item_id - they're items, not collections
        const isCollection = isCollectionType(item.type) && !item.user_item_id;

        // Collections are selectable in MyCollection context (allowCollectionSelection)
        const isCollectionSelectable = isCollection && allowCollectionSelection;
        const canParticipateInMultiSelect = !isCollection || isCollectionSelectable;

        // For collections, only show owned indicator if complete (100% owned, no wishlist)
        const shouldShowAsOwned = isCollection ? isCollectionComplete(item) : isOwned;

        // Check if this is a duplicate group that's expanded
        const isDuplicateGroup = item.isDuplicate && item.duplicateGroup && item.duplicateGroup.length > 0;
        const isExpanded = expandedGroups.has(item.id);

        // Compute item type for multi-select type locking
        const computeItemType = () => {
          if (isCollection) return 'collection';
          if (showWishlistStyling && item.wishlist_id) return 'wishlisted';
          if (isOwned) return 'owned';
          return 'dbot-item';
        };
        const itemType = computeItemType();

        // If it's an expanded duplicate group, render inline
        if (isDuplicateGroup && isExpanded) {

          return (
            <div key={item.id} className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                All {item.duplicateCount} copies:
              </div>

              {item.duplicateGroup.map((duplicateItem) => (
                <div key={duplicateItem.id} className="pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                  <EntityCard
                    item={duplicateItem}
                    index={index}
                    onClick={() => isCollection ? onCollectionClick?.(duplicateItem) : onItemClick?.(duplicateItem, index)}
                    isOwned={userOwnership.has(duplicateItem.id)}
                    isFavorite={isRoot && userFavorites.has(duplicateItem.id)}
                    showAsWishlist={showWishlistStyling && !userOwnership.has(duplicateItem.id) && !isCollection}
                    progress={duplicateItem.progress || null}
                    isMultiSelectMode={isMultiSelectMode && canParticipateInMultiSelect}
                    isSelected={selectedItems.has(duplicateItem.id)}
                    isDisabled={isMultiSelectMode && !canParticipateInMultiSelect}
                    onSelectionToggle={onItemSelectionToggle}
                    itemType={itemType}
                    isDuplicate={false}
                    duplicateCount={1}
                    onExpandToggle={null}
                  />
                </div>
              ))}

              <button
                className="w-full mt-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                onClick={() => toggleExpansion(item.id)}
              >
                Collapse
              </button>
            </div>
          );
        }

        // Otherwise, render a single card (possibly with duplicate count badge)
        return (
          <EntityCard
            key={item.id}
            item={item}
            index={index}
            onClick={() => isCollection ? onCollectionClick?.(item) : onItemClick?.(item, index)}
            isOwned={shouldShowAsOwned}
            isFavorite={isFavorite}
            showAsWishlist={showWishlistStyling && !isOwned && !isCollection}
            progress={item.progress || null}
            isMultiSelectMode={isMultiSelectMode && canParticipateInMultiSelect}
            isSelected={selectedItems.has(item.id)}
            isDisabled={isMultiSelectMode && !canParticipateInMultiSelect}
            onSelectionToggle={onItemSelectionToggle}
            itemType={itemType}
            isDuplicate={item.isDuplicate || false}
            duplicateCount={item.duplicateCount || 1}
            onExpandToggle={isDuplicateGroup ? toggleExpansion : null}
          />
        );
      })}
    </div>
  );
}
