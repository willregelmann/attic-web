import { useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { formatEntityType, isCollectionType } from '../utils/formatters';
import { EntityImage } from './EntityImage';

/**
 * EntityCard - Universal card component for entities (items and collections)
 * Memoized to prevent unnecessary re-renders in large lists.
 *
 * @param {Object} item - Item or collection data
 * @param {Number} index - Index in the list (for key generation)
 * @param {Function} onClick - Click handler for the card
 * @param {Boolean} isOwned - Whether user owns this entity
 * @param {Boolean} isFavorite - Whether entity is favorited
 * @param {Boolean} showCompletion - Whether to show completion bar
 * @param {Object} completionStats - Optional completion statistics
 * @param {Boolean} showAsWishlist - Whether to show as wishlisted (grayed out)
 * @param {Object} progress - Optional progress data for collections { owned_count, total_count, percentage }
 * @param {Boolean} isMultiSelectMode - Whether multi-select mode is active
 * @param {Boolean} isSelected - Whether this card is selected
 * @param {Boolean} isDisabled - Whether this card is disabled (wrong type in multi-select)
 * @param {Function} onSelectionToggle - Callback for selection toggle (itemId, itemType)
 * @param {String} itemType - Optional explicit item type for multi-select (overrides computed type)
 * @param {Boolean} isDuplicate - Whether this item has duplicates (count > 1)
 * @param {Number} duplicateCount - Number of duplicate copies (1 if not duplicated)
 * @param {Function} onExpandToggle - Callback when duplicate expand/collapse badge is clicked (receives itemId)
 */
function EntityCardInner({
  item,
  index = 0,
  onClick,
  isOwned = false,
  isFavorite = false,
  showCompletion = false,
  completionStats = null,
  showAsWishlist = false,
  progress = null,
  isMultiSelectMode = false,
  isSelected = false,
  isDisabled = false,
  onSelectionToggle = null,
  itemType = null,
  isDuplicate = false,
  duplicateCount = 1,
  onExpandToggle = null
}) {
  const longPressTimer = useRef(null);

  // Cleanup effect for long-press timer
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Calculate completion percentage
  const completionPercentage = completionStats?.completionPercentage ?? (isOwned ? 100 : 0);

  // Determine item type for multi-select (use explicit type if provided)
  const getItemType = () => {
    if (itemType) return itemType;
    if (showAsWishlist) return 'wishlisted';
    if (isOwned) return 'owned';
    return 'dbot-item';
  };

  // Handle click - either select or navigate
  const handleClick = (e) => {
    // Desktop: ctrl+click or cmd+click enters multi-select
    if ((e.ctrlKey || e.metaKey) && !isMultiSelectMode && onSelectionToggle) {
      e.stopPropagation();
      onSelectionToggle(item.id, getItemType());
      return;
    }

    // Already in multi-select mode
    if (isMultiSelectMode && onSelectionToggle) {
      e.stopPropagation();
      if (!isDisabled) {
        onSelectionToggle(item.id, getItemType());
      }
    } else if (onClick) {
      onClick(e);
    }
  };

  // Mobile long-press handler
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      if (onSelectionToggle && !isMultiSelectMode && !isDisabled) {
        onSelectionToggle(item.id, getItemType());
      }
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchMove = () => {
    // Cancel long press if user moves finger (scrolling)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleContextMenu = (e) => {
    // Prevent context menu from appearing
    e.preventDefault();
  };

  // Build className dynamically
  const cardClasses = [
    // Base card styles - recreated from visual appearance
    'relative overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
    'bg-white dark:bg-[#1A1A1A]',
    // Default border - only when not selected or favorited (they have their own borders)
    !isSelected && !isFavorite && 'border border-[#DEE2E6] dark:border-[#3A3A3A]',
    'shadow-[0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]',
    '', // Border radius applied via inline style

    // Hover state (normal clickable mode)
    !isMultiSelectMode && !isDisabled && 'hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.5)]',

    // Clickable state
    !isMultiSelectMode && 'cursor-pointer select-none active:scale-[0.98]',

    // Favorite styles
    isFavorite && !isSelected && 'border-2 border-[#F5C842] dark:border-[#FFD966] shadow-[0_4px_12px_rgba(245,200,66,0.15)]',
    isFavorite && !isSelected && 'hover:shadow-[0_8px_24px_rgba(245,200,66,0.25)]',

    // Wishlist styles - don't apply when selected (selection border should be full contrast)
    showAsWishlist && !isSelected && 'opacity-50 grayscale-[50%] hover:opacity-75 hover:grayscale-[20%]',

    // Multi-select mode
    isMultiSelectMode && 'cursor-pointer select-none [-webkit-touch-callout:none] [-webkit-user-select:none]',

    // Selected state in multi-select
    isSelected && 'border-2 border-blue-500 bg-blue-500/10 shadow-[0_0_0_3px_rgba(74,144,226,0.2)]',

    // Disabled state in multi-select
    isDisabled && 'opacity-40 cursor-not-allowed',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      style={{ borderRadius: '1rem' }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={handleContextMenu}
      title={isMultiSelectMode ? (isDisabled ? 'Cannot select this type' : 'Click to select') : 'Click to view details'}
      data-testid={isCollectionType(item) ? "collection-card" : "item-card"}
    >
      {/* Favorite gradient overlay */}
      {isFavorite && !isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,249,230,0.3)] to-[rgba(255,253,247,0.1)] pointer-events-none z-0" />
      )}

      {/* Content wrapper with z-index for favorite overlay */}
      <div className={isFavorite ? 'relative z-[1]' : ''}>
        <EntityImage
          item={item}
          index={index}
          isOwned={isOwned}
          isFavorite={isFavorite}
        />

        <div style={{ padding: '0.75rem' }}>
          <h4 className="m-0 mb-0.5 text-[#212529] dark:text-[#F5F5F5] text-[1rem] font-semibold leading-tight">
            {item.name}
            {item.variant_id && item.entity_variants && (() => {
              const variant = item.entity_variants.find(v => v.id === item.variant_id);
              return variant ? ` (${variant.name})` : '';
            })()}
          </h4>
          <div className="flex justify-between items-center">
            <span className="text-[#6C757D] dark:text-[#B0B0B0] text-[0.6875rem] uppercase tracking-wide">
              {formatEntityType(item.type)}
              {item.year && ` • ${item.year}`}
            </span>
          </div>

          {showCompletion && (
            <div className="mt-3">
              <div className="h-[6px] bg-[#e9ecef] dark:bg-[rgba(255,255,255,0.15)] rounded-[3px] overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#4CAF50] to-[#45a049] rounded-[3px] transition-[width] duration-300 ease-in-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          {progress && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-[6px] bg-black/15 dark:bg-white/15 rounded-[3px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4A90E2] to-[#357ABD] transition-[width] duration-300 rounded-[3px]"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="text-[0.6875rem] text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                {progress.owned_count}/{progress.total_count}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Count badge for grouped duplicates */}
      {isDuplicate && duplicateCount > 1 && onExpandToggle && (
        <button
          className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors z-10 border-0"
          onClick={(e) => {
            e.stopPropagation();
            // Use unique ID: user_item_id for owned items, wishlist_id for wishlisted, id for DBoT
            const uniqueKey = item.user_item_id || item.wishlist_id || item.id;
            onExpandToggle(uniqueKey);
          }}
          aria-label={`${duplicateCount} duplicates`}
          type="button"
        >
          ×{duplicateCount}
        </button>
      )}
    </div>
  );
}

// Memoize EntityCard to prevent re-renders when props haven't changed
// Custom comparison function for better performance with complex objects
function arePropsEqual(prevProps, nextProps) {
  // Fast path: check primitive props first
  if (
    prevProps.isOwned !== nextProps.isOwned ||
    prevProps.isFavorite !== nextProps.isFavorite ||
    prevProps.isSelected !== nextProps.isSelected ||
    prevProps.isDisabled !== nextProps.isDisabled ||
    prevProps.isMultiSelectMode !== nextProps.isMultiSelectMode ||
    prevProps.showCompletion !== nextProps.showCompletion ||
    prevProps.showAsWishlist !== nextProps.showAsWishlist ||
    prevProps.isDuplicate !== nextProps.isDuplicate ||
    prevProps.duplicateCount !== nextProps.duplicateCount ||
    prevProps.index !== nextProps.index ||
    prevProps.itemType !== nextProps.itemType
  ) {
    return false;
  }

  // Check item identity (by id, not deep equality)
  if (prevProps.item?.id !== nextProps.item?.id) {
    return false;
  }

  // Check progress object (shallow)
  if (prevProps.progress?.percentage !== nextProps.progress?.percentage) {
    return false;
  }

  // Functions are assumed stable (callbacks should be memoized by parent)
  return true;
}

export const EntityCard = memo(EntityCardInner, arePropsEqual);
