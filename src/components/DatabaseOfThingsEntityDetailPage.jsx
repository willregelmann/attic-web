import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GET_DATABASE_OF_THINGS_ENTITY } from '../queries';
import { isCollectionType } from '../utils/formatters';
import { useRadialMenu, useRadialMenuMainButton } from '../contexts/RadialMenuContext';
import EntityDetail from './EntityDetail';
import MobileSearch from './MobileSearch';
import { ImageSearchModal } from './ImageSearchModal';

/**
 * DatabaseOfThingsEntityDetailPage - Full-page view for catalog items
 * Route: /item/:entity_id
 * Shows DBoT entity with option to add to collection
 */
function DatabaseOfThingsEntityDetailPage() {
  const { entity_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [itemAddMode, setItemAddMode] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [entityActions, setEntityActions] = useState([]);
  const saveItemRef = useRef(null);

  // Check if navigated from MyCollection (for wishlist styling and collection context)
  const fromMyCollection = location.state?.fromMyCollection || false;
  const currentCollection = location.state?.currentCollection || null;

  // Set RadialMenu actions via context
  useRadialMenu(
    isAuthenticated
      ? [
          {
            id: 'search',
            icon: 'fas fa-search',
            label: 'Search',
            onClick: () => setShowMobileSearch(true)
          },
          // EntityDetail actions (add-to-collection)
          ...entityActions
        ]
      : [
          {
            id: 'search',
            icon: 'fas fa-search',
            label: 'Search',
            onClick: () => setShowMobileSearch(true)
          }
        ],
    [isAuthenticated, entityActions]
  );

  // Set main button when in add mode
  useRadialMenuMainButton(
    itemAddMode ? {
      icon: 'fas fa-save',
      label: 'Add to collection',
      onClick: () => {
        if (saveItemRef.current) {
          saveItemRef.current();
        }
      },
      variant: 'save'
    } : null,
    [itemAddMode]
  );

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
          <div className="text-center py-12 text-red-500">Error loading item: {error.message}</div>
        </div>
      </div>
    );
  }

  const item = data?.databaseOfThingsEntity;

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
        isUserItem={false}
        showAsWishlist={fromMyCollection && !isCollectionType(item.type)}
        currentCollection={currentCollection}
        onClose={handleClose}
        onNavigateToCollection={handleNavigateToCollection}
        externalAddMode={itemAddMode}
        onAddModeChange={setItemAddMode}
        onSaveRequest={saveItemRef}
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
    </div>
  );
}

export default DatabaseOfThingsEntityDetailPage;
