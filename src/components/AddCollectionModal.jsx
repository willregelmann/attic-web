import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { ADD_COLLECTION_TO_WISHLIST, MY_COLLECTION_TREE } from '../queries';
import TreePicker from './TreePicker';
import './AddCollectionModal.css';

/**
 * AddCollectionModal - Modal for adding DBoT collections to user's wishlist
 *
 * Two modes:
 * 1. TRACK - Create new linked collection tracking DBoT collection completion
 * 2. ADD_TO_EXISTING - Add all items from DBoT collection to existing custom collection
 *
 * @param {Object} props
 * @param {Boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.dbotCollection - DBoT collection to add { id, name, ... }
 * @param {Function} props.onSuccess - Callback after successful addition
 */
function AddCollectionModal({ isOpen, onClose, dbotCollection, onSuccess, onSaveRequest = null }) {
  // Form state
  const [mode, setMode] = useState('track'); // 'track' or 'add_to_existing'
  const [collectionName, setCollectionName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's collections for TreePicker
  const { data: collectionsData, loading: collectionsLoading, error: collectionsError, refetch: refetchCollections } = useQuery(MY_COLLECTION_TREE, {
    variables: { parentId: null },
    skip: !isOpen,
    fetchPolicy: 'cache-and-network'
  });

  // GraphQL mutation
  const [addCollectionToWishlist] = useMutation(ADD_COLLECTION_TO_WISHLIST, {
    refetchQueries: [{ query: MY_COLLECTION_TREE, variables: { parentId: null } }],
    awaitRefetchQueries: true
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode('track');
      setCollectionName(dbotCollection?.name || '');
      setSelectedCollectionId(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, dbotCollection]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Form validation
  const isFormValid = () => {
    if (mode === 'track') {
      return collectionName.trim().length > 0;
    } else {
      return selectedCollectionId !== null;
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setLoading(true);
    setError(null);

    try {
      const variables = {
        dbot_collection_id: dbotCollection.id,
        mode: mode === 'track' ? 'TRACK' : 'ADD_TO_EXISTING'
      };

      // Add mode-specific variables
      if (mode === 'track') {
        variables.new_collection_name = collectionName.trim();
        if (selectedCollectionId !== null) {
          variables.target_collection_id = selectedCollectionId;
        }
      } else {
        variables.target_collection_id = selectedCollectionId;
      }

      const { data } = await addCollectionToWishlist({ variables });

      // Check if we got a valid response
      if (!data || !data.addCollectionToWishlist) {
        throw new Error('Invalid response from server');
      }

      // Call success callback with result
      if (onSuccess) {
        onSuccess(data.addCollectionToWishlist);
      }

      onClose();
    } catch (err) {
      console.error('Error adding collection to wishlist:', err);
      setError(err.message || 'Failed to add collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Expose save function to parent via ref (for mobile circular menu button)
  useEffect(() => {
    if (onSaveRequest) {
      onSaveRequest.current = handleSubmit;
    }
  });

  // Build collections array from tree data
  const collections = collectionsData?.myCollectionTree?.collections || [];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-collection-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <h2>Add Collection to Wishlist</h2>
            {dbotCollection && (
              <p className="collection-subtitle">{dbotCollection.name}</p>
            )}
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Collection Info */}
          {dbotCollection && (
            <div className="modal-info">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01" strokeLinecap="round"/>
              </svg>
              <div className="info-text">
                <p>
                  You are about to add items from "<strong>{dbotCollection.name}</strong>" to your wishlist.
                  {dbotCollection.item_count > 0 && (
                    <span> This collection contains {dbotCollection.item_count} items.</span>
                  )}
                  {dbotCollection.item_count === 0 && (
                    <span> This collection is currently empty but you can still track it.</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Mode Selection */}
          <div className="modal-section">
            <h3>How would you like to add this collection?</h3>

            <div className="mode-options">
              {/* Track Mode */}
              <label className={`mode-option ${mode === 'track' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="track"
                  checked={mode === 'track'}
                  onChange={(e) => setMode(e.target.value)}
                />
                <div className="mode-content">
                  <div className="mode-header">
                    <span className="radio-indicator"></span>
                    <span className="mode-title">Track this collection (linked)</span>
                  </div>
                  <p className="mode-description">
                    Track official completion with dual progress bars showing both your owned items and wishlist
                  </p>
                </div>
              </label>

              {/* Add to Existing Mode */}
              <label className={`mode-option ${mode === 'add_to_existing' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="add_to_existing"
                  checked={mode === 'add_to_existing'}
                  onChange={(e) => setMode(e.target.value)}
                />
                <div className="mode-content">
                  <div className="mode-header">
                    <span className="radio-indicator"></span>
                    <span className="mode-title">Add items to existing collection</span>
                  </div>
                  <p className="mode-description">
                    Add all items from this collection to one of your custom collections
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Fields */}
          {mode === 'track' ? (
            // Track Mode Fields
            <>
              <div className="modal-section">
                <label htmlFor="collection-name" className="field-label required">
                  Collection Name
                </label>
                <input
                  id="collection-name"
                  type="text"
                  className="text-input"
                  placeholder="Enter a name for your collection"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="modal-section">
                <label className="field-label">
                  Parent Collection (optional)
                </label>
                <p className="field-description">
                  Choose where to place this collection, or leave unselected for root level
                </p>
                <div className="tree-picker-container">
                  <TreePicker
                    collections={collections}
                    loading={collectionsLoading}
                    error={collectionsError}
                    onRetry={refetchCollections}
                    onSelect={setSelectedCollectionId}
                    allowRoot={true}
                    selectedId={selectedCollectionId}
                  />
                </div>
              </div>
            </>
          ) : (
            // Add to Existing Mode Fields
            <div className="modal-section">
              <label className="field-label required">
                Target Collection
              </label>
              <p className="field-description">
                Select the collection to add all items to
              </p>
              <div className="tree-picker-container">
                <TreePicker
                  collections={collections}
                  loading={collectionsLoading}
                  error={collectionsError}
                  onRetry={refetchCollections}
                  onSelect={setSelectedCollectionId}
                  allowRoot={true}
                  selectedId={selectedCollectionId}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-confirm"
            onClick={handleSubmit}
            disabled={!isFormValid() || loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Adding...
              </>
            ) : (
              mode === 'track' ? 'Track Collection' : 'Add Items'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddCollectionModal;
