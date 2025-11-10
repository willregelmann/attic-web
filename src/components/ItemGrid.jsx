import { ItemCard } from './ItemCard';
import { CollectionCard } from './CollectionCard';
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
 */
export function ItemGrid({
  items = [],
  onItemClick,
  onCollectionClick,
  userOwnership = new Set(),
  userFavorites = new Set(),
  isRoot = false,
  viewMode = 'grid',
  showWishlistStyling = false
}) {
  const gridClass = viewMode === 'grid' ? 'items-grid' : 'items-list';

  return (
    <div className={gridClass}>
      {items.map((item, index) => {
        const isOwned = userOwnership.has(item.id);
        const isFavorite = isRoot && userFavorites.has(item.id);

        // Handle collections with CollectionCard
        if (isCollectionType(item.type)) {
          return (
            <CollectionCard
              key={item.id}
              collection={item}
              onClick={() => onCollectionClick?.(item)}
            />
          );
        }

        // Handle regular items with ItemCard
        return (
          <ItemCard
            key={item.id}
            item={item}
            index={index}
            onClick={() => onItemClick?.(item, index)}
            isOwned={isOwned}
            isFavorite={isFavorite}
            showAsWishlist={showWishlistStyling && !isOwned}
          />
        );
      })}
    </div>
  );
}
