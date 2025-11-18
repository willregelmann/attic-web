import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useRef } from 'react';
import { GET_MY_ITEM, BATCH_REMOVE_ITEMS_FROM_MY_COLLECTION, MY_COLLECTION_TREE } from '../queries';
import { useRadialMenu, useRadialMenuMainButton } from '../contexts/RadialMenuContext';
import EntityDetail from './EntityDetail';
import EntityDetailModal from './EntityDetailModal';
import MobileSearch from './MobileSearch';
import { ImageSearchModal } from './ImageSearchModal';
import { ConfirmationModal } from './ConfirmationModal';
import Toast from './Toast';

/**
 * UserEntityDetailPage - Full-page view for user's owned items
 * Route: /my-item/:user_item_id
 * Shows user's owned item with notes and collection context
 */
function UserEntityDetailPage() {
  const { user_item_id } = useParams();
  const navigate = useNavigate();
  const [itemEditMode, setItemEditMode] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [duplicateItem, setDuplicateItem] = useState(null);
  const [itemAddMode, setItemAddMode] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [entityActions, setEntityActions] = useState([]);
  const saveItemRef = useRef(null);

  // Fetch item data - must be before useRadialMenu which depends on it
  const { loading, error, data } = useQuery(GET_MY_ITEM, {
    variables: { userItemId: user_item_id },
    skip: !user_item_id
  });

  const [batchRemoveMutation, { loading: isDeleting }] = useMutation(
    BATCH_REMOVE_ITEMS_FROM_MY_COLLECTION,
    {
      refetchQueries: [{ query: MY_COLLECTION_TREE, variables: { parentId: null } }],
      awaitRefetchQueries: true,
      onCompleted: () => {
        setToastMessage({ text: 'Item deleted successfully', type: 'success' });
        setShowDeleteModal(false);
        // Navigate back after successful deletion
        setTimeout(() => navigate(-1), 500);
      },
      onError: (error) => {
        setToastMessage({ text: `Error deleting item: ${error.message}`, type: 'error' });
        setShowDeleteModal(false);
      }
    }
  );

  // Set RadialMenu actions via context
  useRadialMenu([
    {
      id: 'search',
      icon: 'fas fa-search',
      label: 'Search',
      onClick: () => setShowMobileSearch(true)
    },
    // EntityDetail actions (edit, delete)
    ...entityActions,
    {
      id: 'duplicate-item',
      icon: 'fas fa-copy',
      label: 'Duplicate',
      onClick: () => {
        // Open EntityDetailModal in add mode with this entity
        if (data?.myItem) {
          setDuplicateItem(data.myItem);
          setItemAddMode(true);
        }
      }
    }
  ], [entityActions, data?.myItem]);

  // Set main button when in edit mode
  useRadialMenuMainButton(
    itemEditMode ? {
      icon: 'fas fa-save',
      label: 'Save changes',
      onClick: () => {
        if (saveItemRef.current) {
          saveItemRef.current();
        }
      },
      variant: 'save'
    } : null,
    [itemEditMode]
  );

  const handleClose = () => {
    navigate(-1); // Go back in browser history
  };

  const handleNavigateToCollection = (collection) => {
    if (collection.type === 'user_collection' || collection.type === 'custom' || collection.type === 'linked') {
      // Navigate to My Collection view
      if (collection.id) {
        navigate(`/my-collection/${collection.id}`);
      } else {
        navigate('/my-collection');
      }
    } else {
      // Navigate to DBoT collection view
      navigate(`/collection/${collection.id}`);
    }
  };

  const handleDeleteItem = async () => {
    if (!item?.id) return;

    try {
      await batchRemoveMutation({
        variables: {
          entityIds: [item.id]
        }
      });
    } catch (error) {
      // Error handled in mutation onError
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="flex flex-col md:flex-row p-4 md:p-8 gap-4 md:gap-8">
          <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="flex flex-col md:flex-row p-4 md:p-8 gap-4 md:gap-8">
          <div className="text-center py-12 text-red-500">
            Error loading item: {error.message}
            {error.message.includes('Cannot query field') && (
              <p className="mt-4 text-sm">
                Note: The backend GraphQL query 'myItem' needs to be implemented.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const item = data?.myItem;

  if (!item) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="flex flex-col md:flex-row p-4 md:p-8 gap-4 md:gap-8">
          <div className="text-center py-12 text-red-500">Item not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <EntityDetail
        item={item}
        isUserItem={true}
        onClose={handleClose}
        onNavigateToCollection={handleNavigateToCollection}
        externalEditMode={itemEditMode}
        onEditModeChange={setItemEditMode}
        onSaveRequest={saveItemRef}
        onDeleteItem={() => setShowDeleteModal(true)}
        onActionsReady={setEntityActions}
      />

      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        onOpenImageSearch={() => setShowImageSearchModal(true)}
      />

      <ImageSearchModal
        isOpen={showImageSearchModal}
        onClose={() => setShowImageSearchModal(false)}
      />

      {/* Duplicate Item Modal */}
      {duplicateItem && (
        <EntityDetailModal
          item={duplicateItem}
          isOwned={false}
          onClose={() => {
            setDuplicateItem(null);
            setItemAddMode(false);
          }}
          externalAddMode={itemAddMode}
          onAddModeChange={setItemAddMode}
          onItemAdded={() => {
            setToastMessage({ text: 'Item duplicated successfully', type: 'success' });
            setDuplicateItem(null);
            setItemAddMode(false);
          }}
        />
      )}

      {/* Delete Item Modal */}
      {showDeleteModal && item && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteItem}
          title="Delete Item"
          message={`Delete "${item.name}" from your collection?`}
          confirmText="Delete"
          confirmVariant="danger"
          loading={isDeleting}
        />
      )}

      {/* Toast Notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

export default UserEntityDetailPage;
