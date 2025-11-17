import { useState } from 'react';
import { EntityCard } from './EntityCard';
import { isCollectionType } from '../utils/formatters';

/**
 * EntityCardGrid - Reusable grid wrapper for rendering entity cards (items and collections)
 *
 * @param {Array} items - Array of items/collections to render
 * @param {Function} onItemClick - Click handler for items (receives item, index)
 * @param {Function} onCollectionClick - Click handler for collections (receives collection)
 * @param {Set} userOwnership - Set of owned item IDs
 * @param {Set} userFavorites - Set of favorited collection IDs
 * @param {Boolean} isRoot - Whether this is root view (for favorites styling)
 * @param {String} viewMode - 'grid' or 'list'
 * @param {Boolean} showWishlistStyling - Whether to dim non-owned items (MyCollection context)
 * @param {Boolean} isMultiSelectMode - Whether multi-select mode is active
 * @param {Set} selectedItems - Set of selected item IDs
 * @param {Function} onItemSelectionToggle - Callback for selection toggle (itemId, itemType)
 * @param {Boolean} allowCollectionSelection - Whether collections can be selected in multi-select mode
 */
export function EntityCardGrid({
  items = [],
  onItemClick,
  onCollectionClick,
  userOwnership = new Set(),
  userFavorites = new Set(),
  isRoot = false,
  viewMode = 'grid',
  showWishlistStyling = false,
  isMultiSelectMode = false,
  selectedItems = new Set(),
  onItemSelectionToggle = null,
  allowCollectionSelection = false
}) {
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const gridClass = viewMode === 'grid' ? 'items-grid' : 'items-list';

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
        const isCollection = isCollectionType(item.type);

        // Collections are selectable in MyCollection context (allowCollectionSelection)
        const isCollectionSelectable = isCollection && allowCollectionSelection;
        const canParticipateInMultiSelect = !isCollection || isCollectionSelectable;

        // For collections, only show owned indicator if complete (100% owned, no wishlist)
        const isCollectionComplete = isCollection && item.progress
          && item.progress.wishlist_count === 0
          && item.progress.owned_count === item.progress.total_count
          && item.progress.total_count > 0;

        const shouldShowAsOwned = isCollection ? isCollectionComplete : isOwned;

        // Determine item type for multi-select
        const getItemType = () => {
          if (showWishlistStyling && item.wishlist_id) return 'wishlisted';
          if (isOwned || isCollectionSelectable) return 'owned';
          return 'dbot-item';
        };

        // Check if this is a duplicate group that's expanded
        const isDuplicateGroup = item.isDuplicate && item.duplicateGroup && item.duplicateGroup.length > 0;
        const isExpanded = expandedGroups.has(item.id);

        // If it's an expanded duplicate group, render all duplicates
        if (isDuplicateGroup && isExpanded) {
          return (
            <div key={item.id} className="duplicate-group-expanded">
              <div className="duplicate-group-header">
                All {item.duplicateCount} copies:
              </div>
              {item.duplicateGroup.map((duplicateItem, dupIndex) => (
                <div key={duplicateItem.id} className="duplicate-item-wrapper">
                  <EntityCard
                    item={duplicateItem}
                    index={index}
                    onClick={() => isCollection ? onCollectionClick?.(duplicateItem) : onItemClick?.(duplicateItem, index)}
                    isOwned={userOwnership.has(duplicateItem.id)}
                    isFavorite={isRoot && userFavorites.has(duplicateItem.id)}
                    showAsWishlist={showWishlistStyling && !userOwnership.has(duplicateItem.id) && !isCollectionType(duplicateItem.type)}
                    progress={duplicateItem.progress || null}
                    isMultiSelectMode={isMultiSelectMode && canParticipateInMultiSelect}
                    isSelected={selectedItems.has(duplicateItem.id)}
                    isDisabled={isMultiSelectMode && !canParticipateInMultiSelect}
                    onSelectionToggle={onItemSelectionToggle}
                    itemType={getItemType()}
                    isDuplicate={false}
                    duplicateCount={1}
                    onExpandToggle={null}
                  />
                </div>
              ))}
              <button
                className="duplicate-group-collapse"
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
            itemType={getItemType()}
            isDuplicate={item.isDuplicate || false}
            duplicateCount={item.duplicateCount || 1}
            onExpandToggle={isDuplicateGroup ? toggleExpansion : null}
          />
        );
      })}
    </div>
  );
}
