import { useAuth } from '../contexts/AuthContext';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useState, useEffect, memo } from 'react';
import { GET_DATABASE_OF_THINGS_ITEM_PARENTS, GET_DATABASE_OF_THINGS_COLLECTION_ITEMS } from '../queries';
import { formatEntityType, isCollectionType } from '../utils/formatters';
import { CollectionTreeSkeleton } from './SkeletonLoader';
import './ItemDetail.css';
import './ItemList.css'; // Import for child-images-grid styles

// Recursive component to render collection tree - memoized to prevent unnecessary re-renders
const CollectionTreeNode = memo(({ collection, depth = 0, onNavigateToCollection, onClose }) => {
  const hasParents = collection.parents && collection.parents.length > 0;

  return (
    <li className="tree-item">
      <button
        className="tree-collection-link"
        style={{ paddingLeft: `${12 + (depth * 20)}px` }}
        onClick={() => {
          onNavigateToCollection?.(collection);
          onClose();
        }}
        title={`View ${collection.name}`}
      >
        {depth > 0 && (
          <svg className="tree-branch" viewBox="0 0 16 16" width="16" height="16">
            <path d="M8 0 L8 8 L16 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        )}
        <span className="tree-collection-name">
          {collection.name}
          {collection.year && <span className="tree-year"> • {collection.year}</span>}
        </span>
        <svg className="tree-arrow" viewBox="0 0 24 24" fill="none" width="16" height="16">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {hasParents && (
        <ul className="tree-nested-list">
          {collection.parents.map((parent) => (
            <CollectionTreeNode
              key={parent.id}
              collection={parent}
              depth={depth + 1}
              onNavigateToCollection={onNavigateToCollection}
              onClose={onClose}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

function ItemDetail({
  item,
  index,
  isOwned,
  onToggleOwnership,
  onAddToCollection,
  onClose,
  onNavigateToCollection,
  collection,
  isSuggestionPreview = false,
  onAcceptSuggestion,
  onRejectSuggestion
}) {
  const { isAuthenticated } = useAuth();

  // Fetch parent collections for this item
  const { data: parentsData, loading: parentsLoading } = useQuery(
    GET_DATABASE_OF_THINGS_ITEM_PARENTS,
    {
      variables: { itemId: item?.id },
      skip: !item?.id || isSuggestionPreview,
    }
  );

  if (!item) return null;

  const parentCollections = parentsData?.databaseOfThingsItemParents || [];

  // Child images state for collections without images
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
    // Use image_url for detail view (full quality)
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
    <div className="item-detail-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="item-detail-title">
      <div className={`item-detail-modal ${isSuggestionPreview ? 'suggestion-preview' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="detail-close-btn" onClick={onClose} aria-label="Close item details">
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Suggestion Preview Header */}
        {isSuggestionPreview && item._suggestion && (
          <div className="suggestion-preview-header">
            <div className="preview-badge">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M12 2v6m0 4v6m0 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
              SUGGESTION PREVIEW
            </div>
            <div className="suggestion-info">
              <span className={`confidence-badge ${item._suggestion.confidence_score >= 80 ? 'high' : item._suggestion.confidence_score >= 60 ? 'medium' : 'low'}`}>
                {item._suggestion.confidence_score}% Confidence
              </span>
              <span className="action-type">
                {item._suggestion.action_type === 'add_item' ? 'New Item' : 'Update Item'}
              </span>
            </div>
          </div>
        )}

        <div className="detail-content">
          <div className="detail-image-section">
            <div className="detail-image" style={{
              background: getItemImage(),
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
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

              {isOwned && (
                <div className="detail-owned-badge">
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Show "View Full Page" button if this is a collection */}
            {isCollectionType(item.type) && onNavigateToCollection && (
              <div className="detail-collection-section">
                <button
                  className="view-collection-btn"
                  onClick={() => {
                    onNavigateToCollection(item);
                    onClose();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  View Full Page
                </button>
              </div>
            )}

            {/* Show "Add to Collection" button for non-collection items */}
            {!isSuggestionPreview && isAuthenticated && !isCollectionType(item.type) && (
              <div className="detail-collection-section">
                <button
                  className={`ownership-toggle-btn ${isOwned ? 'remove' : 'add'}`}
                  onClick={(e) => {
                    if (isOwned) {
                      onToggleOwnership();
                    } else {
                      // Call handler to open add items modal with this item pre-selected
                      if (onAddToCollection) {
                        onAddToCollection(item);
                        onClose(); // Close the detail modal
                      }
                    }
                  }}
                >
                  {isOwned ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                        <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Remove from Collection
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Add to Collection
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="detail-info-section">
            <div className="detail-header">
              <h2 className="detail-title">{item.name}</h2>
              <p className="detail-subtitle">
                {formatEntityType(item.type)}
                {item.year && ` • ${item.year}`}
              </p>
            </div>

            {item.attributes && Object.keys(item.attributes).length > 0 && (
              <div className="detail-metadata">
                {Object.entries(item.attributes)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => (
                    <div key={key} className="detail-meta-item">
                      <span className="meta-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                      <span className="meta-value">{value}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Parent Collections Tree View */}
            {!isSuggestionPreview && (parentsLoading || parentCollections.length > 0) && (
              <div className="detail-collections-tree">
                <h5 className="collections-tree-header">Collections</h5>
                <div className="collections-tree-list">
                  {parentsLoading ? (
                    <CollectionTreeSkeleton count={3} />
                  ) : (
                    <ul className="tree-list">
                      {parentCollections.map((parent) => (
                        <CollectionTreeNode
                          key={parent.id}
                          collection={parent}
                          depth={0}
                          onNavigateToCollection={onNavigateToCollection}
                          onClose={onClose}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Show suggestion actions in preview mode */}
            {isSuggestionPreview ? (
              <div className="suggestion-actions-section">
                {item._suggestion && (
                  <div className="suggestion-reasoning">
                    <h4>AI Reasoning:</h4>
                    <p>{item._suggestion.reasoning}</p>
                  </div>
                )}

                <div className="suggestion-action-buttons">
                  <button
                    className="suggestion-accept-btn"
                    onClick={onAcceptSuggestion}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Accept Suggestion
                  </button>

                  <button
                    className="suggestion-reject-btn"
                    onClick={onRejectSuggestion}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Reject Suggestion
                  </button>
                </div>
              </div>
            ) : null}

            {/* Additional details if available */}
            {item.metadata?.description && (
              <div className="detail-description">
                <h3>Description</h3>
                <p>{item.metadata.description}</p>
              </div>
            )}

            {item.metadata?.artist && (
              <div className="detail-extra">
                <span className="extra-label">Artist:</span>
                <span className="extra-value">{item.metadata.artist}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;
