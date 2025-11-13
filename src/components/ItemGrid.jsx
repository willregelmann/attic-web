import { ItemCard } from './ItemCard';
import { isCollectionType } from '../utils/formatters';

/**
 * ItemGrid - Reusable grid wrapper for rendering items and collections
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
 */
export function ItemGrid({
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
  onItemSelectionToggle = null
}) {
  const gridClass = viewMode === 'grid' ? 'items-grid' : 'items-list';

  return (
    <div className={gridClass}>
      {items.map((item, index) => {
        const isOwned = userOwnership.has(item.id);
        const isFavorite = isRoot && userFavorites.has(item.id);
        const isCollection = isCollectionType(item.type);

        // Determine item type for multi-select
        const getItemType = () => {
          if (showWishlistStyling && item.wishlist_id) return 'wishlisted';
          if (isOwned) return 'owned';
          return 'dbot-item';
        };

        // Universal ItemCard for both items and collections
        return (
          <ItemCard
            key={item.id}
            item={item}
            index={index}
            onClick={() => isCollection ? onCollectionClick?.(item) : onItemClick?.(item, index)}
            isOwned={isOwned}
            isFavorite={isFavorite}
            showAsWishlist={showWishlistStyling && !isOwned && !isCollection}
            progress={item.progress || null}
            isMultiSelectMode={isMultiSelectMode && !isCollection}
            isSelected={selectedItems.has(item.id)}
            isDisabled={isMultiSelectMode && isCollection}
            onSelectionToggle={onItemSelectionToggle}
          />
        );
      })}
    </div>
  );
}
