import { useState, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { GET_DATABASE_OF_THINGS_COLLECTION_ITEMS } from '../queries';
import { isCollectionType, formatEntityType } from '../utils/formatters';

/**
 * ItemCardImage - Displays item image with fallback to child images
 */
export function ItemCardImage({ item, index = 0, isOwned = false, isFavorite = false }) {
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
  const representativeImages = item.representative_image_urls || [];
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
    // Use thumbnail_url for cards if available, fallback to image_url
    const imageUrl = item.thumbnail_url || item.image_url;

    if (imageUrl) {
      return `url(${imageUrl})`;
    }
    // Only use gradient if no representative or child images are available
    if (representativeImages.length === 0 && childImages.length === 0) {
      const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      ];
      return gradients[index % gradients.length];
    }
    // No background when showing representative or child images
    return 'transparent';
  };

  // Use representative images if available, otherwise use client-side fetched child images
  const imagesToDisplay = hasRepresentativeImages ? representativeImages : childImages;
  const hasMoreImages = imagesToDisplay.length > 4;
  const displayImages = hasMoreImages ? imagesToDisplay.slice(0, 4) : imagesToDisplay;

  return (
    <div className="item-image" ref={imageRef} style={{ background: getItemImage() }}>
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
      </div>
    </div>
  );
}

/**
 * ItemCard - Standard item/collection card component
 */
export function ItemCard({
  item,
  index = 0,
  onClick,
  isOwned = false,
  isFavorite = false,
  showCompletion = false,
  completionStats = null
}) {
  // Calculate completion percentage
  const completionPercentage = completionStats?.completionPercentage ?? (isOwned ? 100 : 0);

  return (
    <div
      className={`item-card ${isFavorite ? 'item-favorite' : ''} clickable`}
      onClick={onClick}
      title="Click to view details"
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

        {showCompletion && (
          <div className="item-completion-bar">
            <div className="completion-progress">
              <div className="completion-fill" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
