import { useState, useEffect } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { USER_COLLECTION_DELETION_PREVIEW, DELETE_USER_COLLECTION, MY_COLLECTION_TREE } from '../queries';
import './DeleteCollectionModal.css';

/**
 * DeleteCollectionModal - Confirmation dialog for deleting a collection
 * Shows preview of items and subcollections that will be deleted
 *
 * @param {Object} collection - Collection to delete (requires id and name)
 * @param {Function} onClose - Callback when modal is closed
 * @param {Function} onDelete - Callback when deletion is confirmed and successful
 */
export function DeleteCollectionModal({ collection, onClose, onDelete }) {
  const [deleteError, setDeleteError] = useState(null);

  // Preview query to get counts
  const [getPreview, { data: previewData, loading: previewLoading }] = useLazyQuery(
    USER_COLLECTION_DELETION_PREVIEW,
    {
      variables: { id: collection.id },
      fetchPolicy: 'network-only'
    }
  );

  // Delete mutation
  const [deleteCollection, { loading: deleteLoading }] = useMutation(
    DELETE_USER_COLLECTION,
    {
      refetchQueries: [{ query: MY_COLLECTION_TREE, variables: { parentId: collection.parent_collection_id || null } }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        if (data.deleteUserCollection.success) {
          onDelete();
        }
      },
      onError: (error) => {
        setDeleteError(error.message);
      }
    }
  );

  // Load preview when modal opens
  useEffect(() => {
    if (collection) {
      getPreview();
    }
  }, [collection, getPreview]);

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    await deleteCollection({ variables: { id: collection.id } });
  };

  const preview = previewData?.userCollectionDeletionPreview;
  const totalItems = preview?.total_items || 0;
  const totalSubcollections = preview?.total_subcollections || 0;
  const totalNested = totalItems + totalSubcollections;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          {previewLoading ? (
            <div className="loading-preview">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              <p className="confirmation-text">
                Are you sure you want to delete the collection <strong>{collection.name}</strong>
                {totalNested > 0 && ` and ${totalNested} nested item${totalNested !== 1 ? 's' : ''}`}?
              </p>

              {deleteError && (
                <div className="error-message">
                  <p>Error: {deleteError}</p>
                </div>
              )}

              <div className="button-group">
                <button
                  className="cancel-button"
                  onClick={onClose}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="delete-button"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading || previewLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
