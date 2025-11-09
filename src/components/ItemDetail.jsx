import { useAuth } from '../contexts/AuthContext';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import { useState, useEffect, memo } from 'react';
import { GET_DATABASE_OF_THINGS_ITEM_PARENTS, GET_DATABASE_OF_THINGS_COLLECTION_ITEMS, UPDATE_MY_ITEM } from '../queries';
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
  onRejectSuggestion,
  isUserItem = false,  // New prop: indicates this is from My Collection
  onEditItem  // New prop: handler for editing user item
}) {
  const { isAuthenticated } = useAuth();

  // Edit mode state for user items
  const [isEditMode, setIsEditMode] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editMetadata, setEditMetadata] = useState({});
  const [newMetadataKey, setNewMetadataKey] = useState('');
  const [newMetadataValue, setNewMetadataValue] = useState('');

  // Initialize edit state when item changes
  useEffect(() => {
    if (isUserItem && item) {
      setEditNotes(item.user_notes || '');

      let metadata = item.user_metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          metadata = {};
        }
      }
      setEditMetadata(metadata || {});
    }
  }, [isUserItem, item]);

  // Update mutation
  const [updateMyItem, { loading: isSaving }] = useMutation(UPDATE_MY_ITEM, {
    onCompleted: () => {
      setIsEditMode(false);
      // Optionally refetch or update cache
    },
    onError: (error) => {
      console.error('Failed to update item:', error);
      alert('Failed to save changes. Please try again.');
    }
  });

  // Save changes
  const handleSave = async () => {
    try {
      await updateMyItem({
        variables: {
          userItemId: item.user_item_id,
          notes: editNotes,
          metadata: editMetadata
        }
      });
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // Cancel edit mode
  const handleCancel = () => {
    setIsEditMode(false);
    // Reset to original values
    setEditNotes(item.user_notes || '');
    let metadata = item.user_metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }
    setEditMetadata(metadata || {});
  };

  // Add new metadata field
  const handleAddMetadata = () => {
    if (newMetadataKey && newMetadataValue) {
      setEditMetadata({
        ...editMetadata,
        [newMetadataKey]: newMetadataValue
      });
      setNewMetadataKey('');
      setNewMetadataValue('');
    }
  };

  // Remove metadata field
  const handleRemoveMetadata = (key) => {
    const updated = { ...editMetadata };
    delete updated[key];
    setEditMetadata(updated);
  };

  // Update metadata field
  const handleUpdateMetadata = (key, value) => {
    setEditMetadata({
      ...editMetadata,
      [key]: value
    });
  };

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

  // Use representative images from backend if available, otherwise fetch children client-side
  const representativeImages = item.representative_image_urls || [];
  const hasRepresentativeImages = representativeImages.length > 0;

  // Fetch children if item has no image and no representative images and is a collection type
  useEffect(() => {
    if (!item.image_url && !hasRepresentativeImages && isCollectionType(item.type) && item.id) {
      fetchChildren({ variables: { collectionId: item.id, first: 50 } });
    }
  }, [item.image_url, hasRepresentativeImages, item.type, item.id, fetchChildren]);

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

            {/* Show "Edit Item" button for user items, or "Add to Collection" for non-collection items */}
            {!isSuggestionPreview && isAuthenticated && !isCollectionType(item.type) && (
              <div className="detail-collection-section">
                {isUserItem ? (
                  isEditMode ? (
                    // Save and Cancel buttons in edit mode
                    <div className="edit-actions">
                      <button
                        className="ownership-toggle-btn save"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        className="ownership-toggle-btn cancel"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    // Edit button in view mode
                    <button
                      className="ownership-toggle-btn edit"
                      onClick={() => setIsEditMode(true)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Edit
                    </button>
                  )
                ) : (
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
                )}
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

            {/* Unified Metadata Section (DBoT attributes, user metadata, and notes) */}
            {(() => {
              // Parse item attributes
              let attributes = item.attributes;
              if (typeof attributes === 'string') {
                try {
                  attributes = JSON.parse(attributes);
                } catch (e) {
                  attributes = {};
                }
              }

              // Parse user metadata
              let userMetadata = {};
              if (isUserItem) {
                userMetadata = item.user_metadata;
                if (typeof userMetadata === 'string') {
                  try {
                    userMetadata = JSON.parse(userMetadata);
                  } catch (e) {
                    userMetadata = {};
                  }
                }
              }

              const hasAttributes = attributes && typeof attributes === 'object' && Object.keys(attributes).length > 0;
              const hasUserMetadata = userMetadata && typeof userMetadata === 'object' && Object.keys(userMetadata).length > 0;
              const hasNotes = isUserItem && (isEditMode || item.user_notes);

              return (hasAttributes || hasUserMetadata || isEditMode || hasNotes) && (
                <div className="detail-metadata">
                  {/* Database of Things attributes (read-only) */}
                  {hasAttributes && Object.entries(attributes)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, value]) => (
                      <div key={key} className="detail-meta-item">
                        <span className="meta-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                        <span className="meta-value">{Array.isArray(value) ? value.join(', ') : value}</span>
                      </div>
                    ))}

                  {/* User custom properties (editable for user items) */}
                  {isUserItem && isEditMode ? (
                    // Edit mode: editable user metadata fields
                    <>
                      {Object.keys(editMetadata).length > 0 && (
                        <div className="metadata-fields">
                          {Object.entries(editMetadata)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([key, value]) => (
                              <div key={key} className="detail-meta-item editable">
                                <span className="meta-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                                <div className="meta-value-edit">
                                  <input
                                    type="text"
                                    value={Array.isArray(value) ? value.join(', ') : value}
                                    onChange={(e) => handleUpdateMetadata(key, e.target.value)}
                                    className="meta-input"
                                  />
                                  <button
                                    className="meta-remove-btn"
                                    onClick={() => handleRemoveMetadata(key)}
                                    title="Remove field"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Add new metadata field */}
                      <div className="add-metadata-section">
                        <div className="add-metadata-inputs">
                          <input
                            type="text"
                            placeholder="Property name"
                            value={newMetadataKey}
                            onChange={(e) => setNewMetadataKey(e.target.value)}
                            className="meta-key-input"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={newMetadataValue}
                            onChange={(e) => setNewMetadataValue(e.target.value)}
                            className="meta-value-input"
                          />
                          <button
                            className="meta-add-btn"
                            onClick={handleAddMetadata}
                            disabled={!newMetadataKey || !newMetadataValue}
                            title="Add property"
                          >
                            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Add Property
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // View mode: display user metadata if exists
                    hasUserMetadata && Object.entries(userMetadata)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([key, value]) => (
                        <div key={key} className="detail-meta-item">
                          <span className="meta-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                          <span className="meta-value">{Array.isArray(value) ? value.join(', ') : value}</span>
                        </div>
                      ))
                  )}

                  {/* Notes (last in table, editable for user items) */}
                  {isUserItem && (isEditMode || item.user_notes) && (
                    <div className="detail-meta-item notes-item">
                      <span className="meta-label">Notes:</span>
                      {isEditMode ? (
                        <textarea
                          className="notes-textarea-inline"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Add your notes about this item..."
                          rows={3}
                        />
                      ) : (
                        <span className="meta-value notes-value">{item.user_notes}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Parent Collections Tree View */}
            {!isSuggestionPreview && !isEditMode && (parentsLoading || parentCollections.length > 0) && (
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
