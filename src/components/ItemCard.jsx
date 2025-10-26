import { useState, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { GET_DATABASE_OF_THINGS_COLLECTION_ITEMS } from '../queries';
import { isCollectionType, formatEntityType } from '../utils/formatters';

/**
 * ItemCardImage - Displays item image with fallback to child images
 */
export function ItemCardImage({ item, index = 0, isOwned = false, isFavorite = false }) {
  const [childImages, setChildImages] = useState([]);
  const [fetchChildren, { data: childrenData }] = useLazyQuery(
    GET_DATABASE_OF_THINGS_COLLECTION_ITEMS,
    {
      fetchPolicy: 'cache-first'
    }
  );

  // Fetch children if item has no image and is a collection type
  useEffect(() => {
    if (!item.image_url && isCollectionType(item.type) && item.id) {
      fetchChildren({ variables: { collectionId: item.id, first: 50 } });
    }
  }, [item.image_url, item.type, item.id, fetchChildren]);

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
    if (item.image_url) {
      return `url(${item.image_url})`;
    }
    // Only use gradient if no child images are available
    if (childImages.length === 0) {
      const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      ];
      return gradients[index % gradients.length];
    }
    // No background when showing child images
    return 'transparent';
  };

  const hasMoreImages = childImages.length > 4;
  const displayImages = hasMoreImages ? childImages.slice(0, 3) : childImages;

  return (
    <div className="item-image" style={{ background: getItemImage() }}>
      {/* Child images - special handling for 1 or 2 images */}
      {!item.image_url && childImages.length === 1 && (
        <div
          className="child-image-single"
          style={{ backgroundImage: `url(${childImages[0]})` }}
        />
      )}

      {!item.image_url && childImages.length === 2 && (
        <div className="child-images-grid child-images-diagonal">
          <div className="child-image" style={{ backgroundImage: `url(${childImages[0]})` }} />
          <div className="child-image child-image-empty" />
          <div className="child-image child-image-empty" />
          <div className="child-image" style={{ backgroundImage: `url(${childImages[1]})` }} />
        </div>
      )}

      {/* Standard grid for 3+ images */}
      {!item.image_url && childImages.length >= 3 && (
        <div className="child-images-grid">
          {displayImages.map((imageUrl, idx) => (
            <div
              key={idx}
              className="child-image"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          ))}
          {hasMoreImages && (
            <div className="child-image child-image-more">
              <div className="more-indicator">...</div>
            </div>
          )}
        </div>
      )}

      <div className="item-overlay">
        {isOwned && (
          <div className="owned-badge">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
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
  showCompletion = false
}) {
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
              <div className="completion-fill" style={{ width: isOwned ? '100%' : '0%' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
