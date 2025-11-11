import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GET_DATABASE_OF_THINGS_ENTITY } from '../queries';
import { isCollectionType } from '../utils/formatters';
import ItemDetailContent from './ItemDetailContent';
import CircularMenu from './CircularMenu';
import MobileSearch from './MobileSearch';
import './ItemDetail.css';

/**
 * ItemDetailPage - Full-page view for catalog items
 * Route: /item/:entity_id
 * Shows DBoT entity with option to add to collection
 */
function ItemDetailPage() {
  const { entity_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [itemAddMode, setItemAddMode] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const saveItemRef = useRef(null);

  // Check if navigated from MyCollection (for wishlist styling and collection context)
  const fromMyCollection = location.state?.fromMyCollection || false;
  const currentCollection = location.state?.currentCollection || null;

  const { loading, error, data } = useQuery(GET_DATABASE_OF_THINGS_ENTITY, {
    variables: { id: entity_id },
    skip: !entity_id
  });

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
          <div className="detail-error">Error loading item: {error.message}</div>
        </div>
      </div>
    );
  }

  const item = data?.databaseOfThingsEntity;

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
        isUserItem={false}
        showAsWishlist={fromMyCollection && !isCollectionType(item.type)}
        currentCollection={currentCollection}
        onClose={handleClose}
        onNavigateToCollection={handleNavigateToCollection}
        externalAddMode={itemAddMode}
        onAddModeChange={setItemAddMode}
        onSaveRequest={saveItemRef}
      />

      {/* CircularMenu for mobile actions */}
      {isAuthenticated ? (
        itemAddMode ? (
          // Save button when in add mode
          <CircularMenu
            mainButtonMode="action"
            mainButtonIcon="fas fa-save"
            mainButtonLabel="Add to collection"
            mainButtonOnClick={() => {
              if (saveItemRef.current) {
                saveItemRef.current();
              }
            }}
            mainButtonVariant="save"
          />
        ) : (
          // Add button when viewing
          <CircularMenu
            actions={[
              {
                id: 'search',
                icon: 'fas fa-search',
                label: 'Search',
                onClick: () => setShowMobileSearch(true)
              },
              {
                id: 'add-item',
                icon: 'fas fa-plus-circle',
                label: 'Add to collection',
                onClick: () => setItemAddMode(true)
              }
            ]}
          />
        )
      ) : (
        // Just search button for non-authenticated users
        <CircularMenu
          actions={[
            {
              id: 'search',
              icon: 'fas fa-search',
              label: 'Search',
              onClick: () => setShowMobileSearch(true)
            }
          ]}
        />
      )}

      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />
    </div>
  );
}

export default ItemDetailPage;
