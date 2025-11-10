import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { MY_COLLECTION_TREE, CREATE_USER_COLLECTION, GET_DATABASE_OF_THINGS_ENTITY } from '../queries';
import { CollectionCard } from './CollectionCard';
import { ItemCard } from './ItemCard';
import { CollectionHeader } from './CollectionHeader';
import { ItemGrid } from './ItemGrid';
import ItemDetail from './ItemDetail';
import CircularMenu from './CircularMenu';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import './MyCollection.css';

function MyCollection({ onAddToCollection }) {
  const navigate = useNavigate();
  const { setBreadcrumbItems, setLoading: setBreadcrumbsLoading } = useBreadcrumbs();
  const [currentParentId, setCurrentParentId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [showCreateCollectionPrompt, setShowCreateCollectionPrompt] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [navigationPath, setNavigationPath] = useState([]); // Track navigation breadcrumb trail

  const { loading, error, data, refetch } = useQuery(MY_COLLECTION_TREE, {
    variables: { parentId: currentParentId },
    fetchPolicy: 'cache-and-network'
  });

  // Fetch DBoT collection metadata for linked collections
  const linkedDbotCollectionId = data?.myCollectionTree?.current_collection?.linked_dbot_collection_id;
  const { data: dbotCollectionData } = useQuery(GET_DATABASE_OF_THINGS_ENTITY, {
    variables: { id: linkedDbotCollectionId },
    skip: !linkedDbotCollectionId,
    fetchPolicy: 'cache-first'
  });

  const [createCollection] = useMutation(CREATE_USER_COLLECTION, {
    onCompleted: () => {
      refetch();
      setShowCreateCollectionPrompt(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
    },
    onError: (error) => {
      console.error('Error creating collection:', error);
      if (error.message.includes('Unauthenticated') || error.networkError?.statusCode === 401) {
        alert('You must be logged in to create collections. Please log in and try again.');
      } else if (error.networkError?.statusCode === 500) {
        alert('Server error. Please try logging out and logging back in, then try again.');
      } else {
        alert('Failed to create collection: ' + error.message);
      }
    }
  });

  const handleCollectionClick = (collection) => {
    setCurrentParentId(collection.id);
    // Add to navigation path
    setNavigationPath(prev => [...prev, { id: collection.id, name: collection.name }]);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      alert('Please enter a collection name');
      return;
    }

    const variables = {
      name: newCollectionName.trim(),
    };

    // Only include description if provided
    if (newCollectionDescription.trim()) {
      variables.description = newCollectionDescription.trim();
    }

    // Only include parentId if we're in a subcollection
    if (currentParentId) {
      variables.parentId = currentParentId;
    }

    await createCollection({ variables });
  };

  const handleItemClick = (item, index) => {
    setSelectedItem(item);
    setSelectedItemIndex(index);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
    setSelectedItemIndex(null);
  };

  const handleNavigateItem = (direction) => {
    if (!data?.myCollectionTree) return;

    const allItems = [
      ...(data.myCollectionTree.items || []),
      ...(data.myCollectionTree.wishlists || [])
    ];

    const newIndex = direction === 'next'
      ? (selectedItemIndex + 1) % allItems.length
      : (selectedItemIndex - 1 + allItems.length) % allItems.length;

    setSelectedItemIndex(newIndex);
    setSelectedItem(allItems[newIndex]);
  };

  // Update breadcrumbs in context
  useEffect(() => {
    const items = [
      {
        label: 'My Collection',
        onClick: () => {
          setCurrentParentId(null);
          setNavigationPath([]);
        }
      }
    ];

    // Add navigation path items
    navigationPath.forEach((pathItem, index) => {
      items.push({
        label: pathItem.name,
        onClick: () => {
          // Navigate to this collection
          setCurrentParentId(pathItem.id);
          // Trim navigation path to this point
          setNavigationPath(navigationPath.slice(0, index + 1));
        }
      });
    });

    setBreadcrumbItems(items);
  }, [navigationPath, setBreadcrumbItems]);

  // Update breadcrumbs loading state
  useEffect(() => {
    setBreadcrumbsLoading(loading);
  }, [loading, setBreadcrumbsLoading]);

  if (loading) {
    return (
      <div className="my-collection">
        <CollectionHeaderSkeleton />
        <ItemListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-collection">
        <div className="error-message">
          <p>Error loading your collection: {error.message}</p>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const { collections = [], items = [], wishlists = [], current_collection } = data?.myCollectionTree || {};
  const allItems = [...items, ...wishlists];

  // For linked collections, use DBoT collection data for display
  const isLinkedCollection = current_collection?.linked_dbot_collection_id;
  const dbotCollection = dbotCollectionData?.databaseOfThingsEntity;
  const displayCollection = isLinkedCollection && dbotCollection ? dbotCollection : current_collection;

  // Calculate progress
  const ownedCount = items.length;
  const totalCount = allItems.length;

  // Combine collections and items for rendering
  const displayItems = [...collections, ...allItems];

  // Create ownership set for ItemGrid
  const userOwnership = new Set(items.map(item => item.id));

  // Collection header action buttons
  const headerActions = (
    <>
      <button className="create-collection-button" onClick={() => setShowCreateCollectionPrompt(true)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4M3 7h18" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11v6m-3-3h6" strokeLinecap="round"/>
        </svg>
        Create Collection
      </button>
      {onAddToCollection && (
        <button className="add-item-button" onClick={onAddToCollection}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14m-7-7h14" strokeLinecap="round"/>
          </svg>
          Add Item
        </button>
      )}
    </>
  );

  return (
    <div className="my-collection">
      {/* Collection Header */}
      <CollectionHeader
        collection={displayCollection || { name: 'My Collection' }}
        subtitle={
          displayCollection
            ? isLinkedCollection
              ? `${displayCollection.type?.replace(/_/g, ' ').toUpperCase()}${displayCollection.year ? ` • ${displayCollection.year}` : ''}`
              : 'Custom Collection'
            : 'Your personal collection of items'
        }
        ownedCount={ownedCount}
        totalCount={totalCount}
        actions={headerActions}
        showProgress={totalCount > 0}
      />

      {/* Collections and Items Grid */}
      {displayItems.length > 0 ? (
        <ItemGrid
          items={displayItems}
          onItemClick={(item, index) => {
            // Calculate actual index in allItems array (skip collections)
            const itemIndex = index - collections.length;
            handleItemClick(item, itemIndex >= 0 ? itemIndex : 0);
          }}
          onCollectionClick={handleCollectionClick}
          userOwnership={userOwnership}
          userFavorites={new Set()}
          isRoot={false}
          viewMode="grid"
          showWishlistStyling={true}
        />
      ) : (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" width="64" height="64" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4M3 7h18"/>
          </svg>
          <h3>No items yet</h3>
          <p>Start building your collection by browsing and adding items</p>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={handleCloseDetail}
          onNext={() => handleNavigateItem('next')}
          onPrevious={() => handleNavigateItem('prev')}
          hasNext={selectedItemIndex < allItems.length - 1}
          hasPrevious={selectedItemIndex > 0}
        />
      )}

      {/* Circular Menu */}
      {onAddToCollection && (
        <CircularMenu onAddToCollection={onAddToCollection} />
      )}

      {/* Create Collection Modal */}
      {showCreateCollectionPrompt && (
        <div className="modal-overlay" onClick={() => setShowCreateCollectionPrompt(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Collection</h2>
            <p className="modal-description">
              {currentParentId
                ? `This will create a new collection under "${data?.myCollectionTree?.current_collection?.name}"`
                : 'This will create a new collection at the root level'}
            </p>

            <div className="form-group">
              <label htmlFor="collection-name">Collection Name *</label>
              <input
                id="collection-name"
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Pokémon Cards, Action Figures"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleCreateCollection()}
              />
            </div>

            <div className="form-group">
              <label htmlFor="collection-description">Description (optional)</label>
              <textarea
                id="collection-description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Add a description for your collection"
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowCreateCollectionPrompt(false);
                  setNewCollectionName('');
                  setNewCollectionDescription('');
                }}
              >
                Cancel
              </button>
              <button
                className="create-button"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                Create Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyCollection;
