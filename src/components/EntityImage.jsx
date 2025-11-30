import { useState, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { GET_DATABASE_OF_THINGS_COLLECTION_ITEMS } from '../queries';
import { isCollectionType } from '../utils/formatters';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getTypeIcon } from '../utils/iconUtils.jsx';

/**
 * EntityImage - Universal image display component for entities (items and collections)
 *
 * Displays entity images with intelligent fallback logic:
 * 1. User-uploaded images (for owned items)
 * 2. DBoT canonical images (image_url/thumbnail_url)
 * 3. Representative images from child entities (for collections)
 * 4. Type icon fallback
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Grid layouts for representative images (1-4 child images)
 * - Optional owned/favorite badges
 * - Configurable for different contexts (card, header, detail)
 *
 * @param {Object} item - Entity data (with image_url, representative_images, etc.)
 * @param {Number} index - Optional index for lazy loading key
 * @param {Boolean} isOwned - Whether user owns this entity (shows checkmark badge)
 * @param {Boolean} isFavorite - Whether entity is favorited (shows star badge)
 * @param {Boolean} showBadges - Whether to show owned/favorite badges (default: true)
 * @param {String} className - Optional CSS class name for the container
 * @param {Number} iconSize - Size of fallback icon (default: 64)
 * @param {Boolean} lazyLoad - Enable lazy loading with Intersection Observer (default: true)
 */
export function EntityImage({
  item,
  isOwned = false,
  isFavorite = false,
  showBadges = true,
  className = '',
  iconSize = 64,
  lazyLoad = true
}) {
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [childImages, setChildImages] = useState([]);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
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

  // Intersection Observer to detect when component enters viewport
  useEffect(() => {
    if (!lazyLoad) return;

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
  }, [lazyLoad]);

  // Fetch children only when visible and needed (no canonical image and no representative images)
  useEffect(() => {
    const hasCanonicalImg = item.image_url || item.thumbnail_url;
    if (isVisible && !hasCanonicalImg && !hasRepresentativeImages && isCollectionType(item) && item.id) {
      fetchChildren({ variables: { collectionId: item.id, first: 10 } }); // Reduced from 50 to 10
    }
  }, [isVisible, item.image_url, item.thumbnail_url, hasRepresentativeImages, item.type, item.id, fetchChildren]);

  // Extract child images using breadth-first search
  useEffect(() => {
    if (!childrenData?.databaseOfThingsCollectionItems?.edges) return;

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

    // Extract nodes from edges
    const items = childrenData.databaseOfThingsCollectionItems.edges.map(e => e.node);
    const images = findChildImages(items);
    setChildImages(images);
  }, [childrenData]);

  const getItemImage = () => {
    // Priority 1: User uploaded image (for owned items)
    const userImages = item.user_images || item.images;
    if (isOwned && userImages && userImages.length > 0) {
      const userImage = userImages[0]; // Primary image is first in array
      // Image path needs /storage/ prefix
      const thumbnailPath = userImage.thumbnail || userImage.thumbnail_url;
      return `url(/storage/${thumbnailPath})`;
    }

    // Priority 2: DBoT canonical image
    // Use thumbnail_url for cards if available, fallback to image_url
    const imageUrl = item.thumbnail_url || item.image_url;

    if (imageUrl) {
      return `url(${imageUrl})`;
    }

    // Priority 3: No background when no images are available (just show icon)
    return 'none';
  };

  // Use representative images if available, otherwise use client-side fetched child images
  const imagesToDisplay = hasRepresentativeImages ? representativeImages : childImages;
  const hasMoreImages = imagesToDisplay.length > 4;
  const displayImages = hasMoreImages ? imagesToDisplay.slice(0, 4) : imagesToDisplay;

  // Determine icon color and get icon
  const iconColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const userImages = item.user_images || item.images;
  const hasUserImages = isOwned && userImages && userImages.length > 0;
  const hasCanonicalImage = item.image_url || item.thumbnail_url;
  const shouldShowIcon = !hasUserImages && !hasCanonicalImage && imagesToDisplay.length === 0;
  const typeIcon = shouldShowIcon ? getTypeIcon(item.type, iconColor, iconSize) : null;

  // Build base classes - minimal defaults, allow customization via className
  // Mobile-first: base is mobile, md: is tablet/desktop
  // Using ! prefix for important to override any conflicting CSS
  const defaultClasses = className || '!h-[120px] md:!h-[160px] !m-2 md:!m-3';
  const baseClasses = `relative flex items-center justify-center bg-contain bg-center bg-no-repeat ${defaultClasses}`;

  return (
    <div className={baseClasses} ref={imageRef} style={{ backgroundImage: getItemImage() }}>
      {/* Type icon for items without images */}
      {typeIcon && (
        <div className="flex items-center justify-center w-full h-full">
          {typeIcon}
        </div>
      )}

      {/* Representative/child images - special handling for 1 or 2 images */}
      {!hasCanonicalImage && imagesToDisplay.length === 1 && (
        <div
          className="absolute inset-2.5 bg-contain bg-center bg-no-repeat rounded-lg"
          style={{ backgroundImage: `url(${imagesToDisplay[0]})` }}
        />
      )}

      {!hasCanonicalImage && imagesToDisplay.length === 2 && (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-2 md:p-2.5">
          <div className="bg-contain bg-center bg-no-repeat rounded" style={{ backgroundImage: `url(${imagesToDisplay[0]})` }} />
          <div className="bg-transparent" />
          <div className="bg-transparent" />
          <div className="bg-contain bg-center bg-no-repeat rounded" style={{ backgroundImage: `url(${imagesToDisplay[1]})` }} />
        </div>
      )}

      {/* Standard grid for 3+ images */}
      {!hasCanonicalImage && imagesToDisplay.length >= 3 && (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-2 md:p-2.5">
          {displayImages.map((imageUrl, idx) => (
            <div
              key={idx}
              className={`relative bg-contain bg-center bg-no-repeat rounded ${hasMoreImages && idx === 3 ? 'after:absolute after:inset-0 after:bg-black/40 after:rounded' : ''}`}
              style={{ backgroundImage: `url(${imageUrl})` }}
            >
              {hasMoreImages && idx === 3 && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className="md:w-4 md:h-4">
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

      {/* Badges overlay */}
      {showBadges && (
        <div className="absolute inset-0 p-2 md:p-3 flex justify-between items-start">
          {isFavorite && (
            <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 text-yellow-400 drop-shadow-md animate-pulse">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" className="md:w-5 md:h-5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          )}
          {isOwned && isAuthenticated && (
            <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-5 h-5 md:w-6 md:h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className="md:w-4 md:h-4">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
