import { useState, useEffect } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { MY_COLLECTION_TREE } from '../queries';
import { Modal, ModalButton } from './Modal';
import { CollectionPickerTree } from './CollectionPickerTree';
import { CollectionTreeSkeleton } from './SkeletonLoader';

/**
 * BatchAddToUserCollectionModal - Modal for selecting user collection to add items to
 *
 * @param {Object} props
 * @param {Boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onConfirm - Callback with selected collection ID: (collectionId) => void
 * @param {Number} props.itemCount - Number of items being added
 * @param {String} props.defaultCollectionId - Default collection to pre-select
 * @param {Boolean} props.loading - Whether the mutation is in progress
 */
export function BatchAddToUserCollectionModal({
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
  // Start in loading state if we need to find path to a nested collection
  const [isPathFinding, setIsPathFinding] = useState(!!defaultCollectionId);

  // Find path to selected collection and expand parent collections
  useEffect(() => {
    if (!isOpen || !defaultCollectionId || !apolloClient) {
      setExpandedIds(new Set());
      setIsPathFinding(false);
      return;
    }

    setIsPathFinding(true);

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
      } else {
        // Not found or at root, just expand root
        setExpandedIds(new Set());
      }
      setIsPathFinding(false);
    });
  }, [isOpen, defaultCollectionId, apolloClient]);

  // Reset selection and path finding state when modal opens/closes or default changes
  useEffect(() => {
    if (isOpen) {
      setSelectedCollectionId(defaultCollectionId);
      // Reset to loading state if we need to find a path
      if (defaultCollectionId) {
        setIsPathFinding(true);
      }
    }
  }, [isOpen, defaultCollectionId]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(selectedCollectionId);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={`Add ${itemCount} Items to Collection`}
      size="lg"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      testId="batch-add-user-collection-modal"
      footer={
        <>
          <ModalButton onClick={onClose} disabled={loading}>
            Cancel
          </ModalButton>
          <ModalButton
            onClick={handleConfirm}
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Adding...' : `Add ${itemCount} Items`}
          </ModalButton>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-[var(--text-secondary)] m-0 mb-2">
        Select which collection to add these items to:
      </p>

      {/* Wait for path finding to complete before rendering tree to ensure proper initial expansion */}
      {isPathFinding ? (
        <CollectionTreeSkeleton count={3} />
      ) : (
        <CollectionPickerTree
          selectedId={selectedCollectionId}
          onSelect={setSelectedCollectionId}
          expandedIds={expandedIds}
          isAuthenticated={true}
        />
      )}
    </Modal>
  );
}
