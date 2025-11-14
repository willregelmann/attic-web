import { useState, useEffect } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { MY_COLLECTION_TREE } from '../queries';
import { CollectionPickerTree } from './CollectionPickerTree';
import './BatchActionModal.css';

/**
 * BatchAddToCollectionModal - Modal for selecting destination collection for batch adding items
 *
 * @param {Object} props
 * @param {Boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onConfirm - Callback with selected collection ID: (collectionId) => void
 * @param {Number} props.itemCount - Number of items being added
 * @param {String} props.defaultCollectionId - Default collection to pre-select
 * @param {Boolean} props.loading - Whether the mutation is in progress
 */
export function BatchAddToCollectionModal({
  isOpen,
  onClose,
  onConfirm,
  itemCount = 0,
  defaultCollectionId = null,
  loading = false
}) {
  const apolloClient = useApolloClient();
  const [selectedCollectionId, setSelectedCollectionId] = useState(defaultCollectionId);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Find path to selected collection and expand parent collections
  useEffect(() => {
    if (!isOpen || !defaultCollectionId || !apolloClient) {
      setExpandedIds(new Set());
      return;
    }

    const findPathToCollection = async (targetId, parentId = null, path = []) => {
      try {
        const { data } = await apolloClient.query({
          query: MY_COLLECTION_TREE,
          variables: { parentId },
          fetchPolicy: 'cache-first'
        });

        const collections = data?.myCollectionTree?.collections || [];

        for (const col of collections) {
          const currentPath = [...path, col.id];

          if (col.id === targetId) {
            // Found it! Return the path (excluding the target itself)
            return path;
          }

          // Recursively search in this collection's children
          const childPath = await findPathToCollection(targetId, col.id, currentPath);
          if (childPath) {
            return childPath;
          }
        }

        return null;
      } catch (error) {
        console.error('Error finding collection path:', error);
        return null;
      }
    };

    findPathToCollection(defaultCollectionId).then((pathIds) => {
      if (pathIds && pathIds.length > 0) {
        setExpandedIds(new Set(pathIds));
        setIsRootExpanded(true);
      } else {
        // Not found or at root, just expand root
        setExpandedIds(new Set());
        setIsRootExpanded(true);
      }
    });
  }, [isOpen, defaultCollectionId, apolloClient]);

  // Reset selection when modal opens/closes or default changes
  useEffect(() => {
    if (isOpen) {
      setSelectedCollectionId(defaultCollectionId);
    }
  }, [isOpen, defaultCollectionId]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, loading]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(selectedCollectionId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="batch-modal-overlay" onClick={!loading ? onClose : undefined} role="dialog" aria-modal="true">
      <div
        className="batch-modal batch-modal-wide"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="batch-add-modal-title"
        data-testid="batch-add-collection-modal"
      >
        <div className="batch-modal-header">
          <h3 id="batch-add-modal-title">Add {itemCount} Items to Collection</h3>
          {!loading && (
            <button
              className="batch-modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              ×
            </button>
          )}
        </div>

        <div className="batch-modal-body">
          <p className="batch-modal-message">
            Select which collection to add these items to:
          </p>

          <CollectionPickerTree
            selectedId={selectedCollectionId}
            onSelect={setSelectedCollectionId}
            expandedIds={expandedIds}
            isAuthenticated={true}
          />

        </div>

        <div className="batch-modal-footer">
          <button
            onClick={onClose}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="confirm-button"
            disabled={loading}
          >
            {loading ? 'Adding...' : `Add ${itemCount} Items`}
          </button>
        </div>
      </div>
    </div>
  );
}
