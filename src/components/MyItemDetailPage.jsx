import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useRef } from 'react';
import { GET_MY_ITEM, BATCH_REMOVE_ITEMS_FROM_MY_COLLECTION, MY_COLLECTION_TREE } from '../queries';
import ItemDetailContent from './ItemDetailContent';
import CircularMenu from './CircularMenu';
import MobileSearch from './MobileSearch';
import { BatchActionModal } from './BatchActionModal';
import Toast from './Toast';
import './ItemDetail.css';

/**
 * MyItemDetailPage - Full-page view for user's owned items
 * Route: /my-item/:user_item_id
 * Shows user's owned item with notes and collection context
 */
function MyItemDetailPage() {
  const { user_item_id } = useParams();
  const navigate = useNavigate();
  const [itemEditMode, setItemEditMode] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const saveItemRef = useRef(null);

  // TODO: Backend needs to implement the 'myItem' query
  // For now, this will fail gracefully until implemented
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
      <div className="item-detail-page">
        <div className="detail-content">
          <div className="detail-loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-detail-page">
        <div className="detail-content">
          <div className="detail-error">
            Error loading item: {error.message}
            {error.message.includes('Cannot query field') && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
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
      <div className="item-detail-page">
        <div className="detail-content">
          <div className="detail-error">Item not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="item-detail-page">
      <ItemDetailContent
        item={item}
        isUserItem={true}
        onClose={handleClose}
        onNavigateToCollection={handleNavigateToCollection}
        externalEditMode={itemEditMode}
        onEditModeChange={setItemEditMode}
        onSaveRequest={saveItemRef}
      />

      {/* CircularMenu for mobile actions */}
      {itemEditMode ? (
        // Save button when in edit mode
        <CircularMenu
          mainButtonMode="action"
          mainButtonIcon="fas fa-save"
          mainButtonLabel="Save changes"
          mainButtonOnClick={() => {
            if (saveItemRef.current) {
              saveItemRef.current();
            }
          }}
          mainButtonVariant="save"
        />
      ) : (
        // Edit and delete buttons when viewing
        <CircularMenu
          actions={[
            {
              id: 'search',
              icon: 'fas fa-search',
              label: 'Search',
              onClick: () => setShowMobileSearch(true)
            },
            {
              id: 'edit-item',
              icon: 'fas fa-edit',
              label: 'Edit item',
              onClick: () => setItemEditMode(true)
            },
            {
              id: 'delete-item',
              icon: 'fas fa-trash',
              label: 'Delete item',
              onClick: () => setShowDeleteModal(true),
              variant: 'danger'
            }
          ]}
        />
      )}

      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />

      {/* Delete Item Modal */}
      {showDeleteModal && item && (
        <BatchActionModal
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

export default MyItemDetailPage;
