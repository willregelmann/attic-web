import { useState, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { GET_DATABASE_OF_THINGS_COLLECTION_ITEMS } from '../queries';
import { isCollectionType, formatEntityType } from '../utils/formatters';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getTypeIcon } from '../utils/iconUtils.jsx';
import './ItemCard.css';

/**
 * ItemCardImage - Displays item image with fallback to child images
 */
export function ItemCardImage({ item, index = 0, isOwned = false, isFavorite = false }) {
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [childImages, setChildImages] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const imageRef = useRef(null);
  const [fetchChildren, { data: childrenData }] = useLazyQuery(
    GET_DATABASE_OF_THINGS_COLLECTION_ITEMS,
    {
      fetchPolicy: 'cache-first'
    }
  );

  // Use representative images from backend if available, otherwise fetch children client-side
  // Support both field names: representative_image_urls (DBoT entities) and representative_images (UserCollections)
  const representativeImages = item.representative_image_urls || item.representative_images || [];
  const hasRepresentativeImages = representativeImages.length > 0;

  // Intersection Observer to detect when card enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, stop observing
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading slightly before entering viewport
        threshold: 0.01
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Fetch children only when visible and needed
  useEffect(() => {
    if (isVisible && !item.image_url && !hasRepresentativeImages && isCollectionType(item.type) && item.id) {
      fetchChildren({ variables: { collectionId: item.id, first: 10 } }); // Reduced from 50 to 10
    }
  }, [isVisible, item.image_url, hasRepresentativeImages, item.type, item.id, fetchChildren]);

  // Extract child images using breadth-first search
  useEffect(() => {
    if (!childrenData?.databaseOfThingsCollectionItems) return;

    const findChildImages = (items) => {
      const images = [];
      const queue = [...items];

      // Fetch up to 5 images to know if there are more than 4
      while (queue.length > 0 && images.length < 5) {
        const current = queue.shift();
        if (current.image_url) {
          images.push(current.image_url);
        }
      }

      return images;
    };

    const images = findChildImages(childrenData.databaseOfThingsCollectionItems);
    setChildImages(images);
  }, [childrenData]);

  const getItemImage = () => {
    // Priority 1: User uploaded image (for owned items)
    if (isOwned && item.images && item.images.length > 0) {
      const userImage = item.images[0]; // Primary image is first in array
      return `url(${userImage.thumbnail_url})`;
    }

    // Priority 2: DBoT canonical image
    // Use thumbnail_url for cards if available, fallback to image_url
    const imageUrl = item.thumbnail_url || item.image_url;

    if (imageUrl) {
      return `url(${imageUrl})`;
    }

    // Priority 3: No background when no images are available (just show icon)
    return 'transparent';
  };

  // Use representative images if available, otherwise use client-side fetched child images
  const imagesToDisplay = hasRepresentativeImages ? representativeImages : childImages;
  const hasMoreImages = imagesToDisplay.length > 4;
  const displayImages = hasMoreImages ? imagesToDisplay.slice(0, 4) : imagesToDisplay;

  // Determine icon color and get icon
  const iconColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const shouldShowIcon = !item.image_url && imagesToDisplay.length === 0;
  const typeIcon = shouldShowIcon ? getTypeIcon(item.type, iconColor, 64) : null;

  return (
    <div className="item-image" ref={imageRef} style={{ background: getItemImage() }}>
      {/* Type icon for items without images */}
      {typeIcon && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}>
          {typeIcon}
        </div>
      )}

      {/* Representative/child images - special handling for 1 or 2 images */}
      {!item.image_url && imagesToDisplay.length === 1 && (
        <div
          className="child-image-single"
          style={{ backgroundImage: `url(${imagesToDisplay[0]})` }}
        />
      )}

      {!item.image_url && imagesToDisplay.length === 2 && (
        <div className="child-images-grid child-images-diagonal">
          <div className="child-image" style={{ backgroundImage: `url(${imagesToDisplay[0]})` }} />
          <div className="child-image child-image-empty" />
          <div className="child-image child-image-empty" />
          <div className="child-image" style={{ backgroundImage: `url(${imagesToDisplay[1]})` }} />
        </div>
      )}

      {/* Standard grid for 3+ images */}
      {!item.image_url && imagesToDisplay.length >= 3 && (
        <div className="child-images-grid">
          {displayImages.map((imageUrl, idx) => (
            <div
              key={idx}
              className={`child-image ${hasMoreImages && idx === 3 ? 'child-image-more' : ''}`}
              style={{ backgroundImage: `url(${imageUrl})` }}
            >
              {hasMoreImages && idx === 3 && (
                <div className="more-indicator">
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <circle cx="4" cy="12" r="2" fill="white"/>
                    <circle cx="12" cy="12" r="2" fill="white"/>
                    <circle cx="20" cy="12" r="2" fill="white"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="item-overlay">
        {isFavorite && (
          <div className="favorite-indicator">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        )}
        {isOwned && isAuthenticated && (
          <div className="owned-indicator">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ItemCard - Universal card component for items and collections
 *
 * @param {Object} item - Item or collection data
 * @param {Object} progress - Optional progress data for user collections { owned_count, total_count, percentage }
 * @param {Boolean} isMultiSelectMode - Whether multi-select mode is active
 * @param {Boolean} isSelected - Whether this item is selected
 * @param {Boolean} isDisabled - Whether this item is disabled (wrong type in multi-select)
 * @param {Function} onSelectionToggle - Callback for selection toggle (itemId, itemType)
 * @param {Function} onDuplicate - Callback for duplicate action (entityId)
 * @param {String} itemType - Optional explicit item type for multi-select (overrides computed type)
 * @param {Boolean} isDuplicate - Whether this item has duplicates (count > 1)
 * @param {Number} duplicateCount - Number of duplicate copies (1 if not duplicated)
 * @param {Array} duplicateGroup - Array of all duplicate items for expansion
 */
export function ItemCard({
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
  onDuplicate = null,
  itemType = null,
  isDuplicate = false,
  duplicateCount = 1,
  duplicateGroup = null,
  onEdit = null,
  onDelete = null
}) {
  const { isAuthenticated } = useAuth();
  const longPressTimer = useRef(null);
  const [isPressing, setIsPressing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle duplicate action
  const handleDuplicate = () => {
    // Open AddItemModal with entity_id but blank fields
    // This will be passed to the parent component that controls the modal
    if (onDuplicate) {
      onDuplicate(item.entity_id || item.id);
    }
  };

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
  const handleTouchStart = (e) => {
    setIsPressing(true);
    longPressTimer.current = setTimeout(() => {
      if (onSelectionToggle && !isMultiSelectMode && !isDisabled) {
        onSelectionToggle(item.id, getItemType());
      }
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    setIsPressing(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchMove = () => {
    // Cancel long press if user moves finger (scrolling)
    setIsPressing(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleContextMenu = (e) => {
    // Prevent context menu from appearing
    e.preventDefault();
  };

  return (
    <>
      <div
        className={`item-card ${isFavorite ? 'item-favorite' : ''} ${showAsWishlist ? 'item-wishlist' : ''} ${isMultiSelectMode ? 'multi-select-mode' : 'clickable'} ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={handleContextMenu}
        title={isMultiSelectMode ? (isDisabled ? 'Cannot select this type' : 'Click to select') : 'Click to view details'}
        data-testid={isOwned ? "collection-item" : "entity-card"}
      >
        <ItemCardImage
          item={item}
          index={index}
          isOwned={isOwned}
          isFavorite={isFavorite}
        />

        <div className="item-content">
          <h4 className="item-name">{item.name}</h4>
          <div className="item-meta">
            <span className="item-type">
              {formatEntityType(item.type)}
              {item.year && ` • ${item.year}`}
            </span>
          </div>

          {showCompletion && isAuthenticated && (
            <div className="item-completion-bar">
              <div className="completion-progress">
                <div className="completion-fill" style={{ width: `${completionPercentage}%` }}></div>
              </div>
            </div>
          )}

          {progress && isAuthenticated && (
            <div className="item-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="progress-text">
                {progress.owned_count}/{progress.total_count}
              </div>
            </div>
          )}
        </div>

        {/* Count badge for grouped duplicates */}
        {isDuplicate && duplicateCount > 1 && (
          <button
            className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors z-10 border-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label={`${duplicateCount} duplicates`}
            type="button"
          >
            ×{duplicateCount}
          </button>
        )}
      </div>

      {/* Expanded view showing all duplicates */}
      {isExpanded && duplicateGroup && (
        <div className="mt-4 space-y-2 border-t pt-4">
          <div className="text-sm font-semibold text-gray-600 mb-2">
            All {duplicateCount} copies:
          </div>
          <div className="space-y-2">
            {duplicateGroup.map(duplicateItem => (
              <div key={duplicateItem.id} className="ml-4 p-2 bg-gray-50 rounded">
                <ItemCard
                  item={duplicateItem}
                  index={index}
                  isOwned={isOwned}
                  isFavorite={isFavorite}
                  showCompletion={showCompletion}
                  completionStats={completionStats}
                  showAsWishlist={showAsWishlist}
                  progress={progress}
                  isMultiSelectMode={isMultiSelectMode}
                  onSelectionToggle={onSelectionToggle}
                  onDuplicate={onDuplicate}
                  itemType={itemType}
                  isDuplicate={false}
                  duplicateCount={1}
                  duplicateGroup={null}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onClick={onClick}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
