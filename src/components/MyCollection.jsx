import { useState, useEffect } from 'react';
import { useQuery, useApolloClient } from '@apollo/client/react';
import { useNavigate, useParams } from 'react-router-dom';
import { MY_COLLECTION_TREE, GET_DATABASE_OF_THINGS_ENTITY } from '../queries';
import { CollectionHeader } from './CollectionHeader';
import { ItemGrid } from './ItemGrid';
import ItemDetail from './ItemDetail';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { formatEntityType } from '../utils/formatters';
import './MyCollection.css';

function MyCollection() {
  const navigate = useNavigate();
  const { id } = useParams();
  const client = useApolloClient();
  const { setBreadcrumbItems, setLoading: setBreadcrumbsLoading } = useBreadcrumbs();
  const [currentParentId, setCurrentParentId] = useState(id || null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

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

  // Sync currentParentId with URL parameter
  useEffect(() => {
    setCurrentParentId(id || null);
  }, [id]);

  const handleCollectionClick = (collection) => {
    navigate(`/my-collection/${collection.id}`);
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

  // Build breadcrumbs dynamically from collection hierarchy
  useEffect(() => {
    const buildBreadcrumbs = async () => {
      const items = [
        {
          label: 'My Collection',
          onClick: () => navigate('/my-collection')
        }
      ];

      // Build path by walking up parent chain
      if (currentParentId && data?.myCollectionTree?.current_collection) {
        const path = [];
        let currentId = currentParentId;

        // Walk up the parent chain
        while (currentId) {
          try {
            const { data: collectionData } = await client.query({
              query: MY_COLLECTION_TREE,
              variables: { parentId: currentId },
              fetchPolicy: 'cache-first'
            });

            if (collectionData?.myCollectionTree?.current_collection) {
              const col = collectionData.myCollectionTree.current_collection;
              path.unshift({
                id: col.id,
                name: col.name
              });
              currentId = col.parent_collection_id;
            } else {
              break;
            }
          } catch (error) {
            console.error('Error building breadcrumb path:', error);
            break;
          }
        }

        // Add path items as breadcrumbs
        path.forEach(pathItem => {
          items.push({
            label: pathItem.name,
            onClick: () => navigate(`/my-collection/${pathItem.id}`)
          });
        });
      }

      setBreadcrumbItems(items);
    };

    buildBreadcrumbs();
  }, [currentParentId, data?.myCollectionTree?.current_collection, client, navigate, setBreadcrumbItems]);

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

  // For linked collections, merge user collection data with DBoT collection data
  const isLinkedCollection = current_collection?.type === 'linked';
  const dbotCollection = dbotCollectionData?.databaseOfThingsEntity;
  const displayCollection = isLinkedCollection && dbotCollection
    ? {
        ...dbotCollection, // Use DBoT's image, attributes, year, etc.
        type: 'linked', // Override type to 'linked'
        parent_collection_id: current_collection.parent_collection_id, // Preserve user collection hierarchy
        id: current_collection.id, // Use user collection ID for navigation
      }
    : current_collection;

  // Use backend's recursive progress calculation if available, otherwise fallback to local count
  const ownedCount = current_collection?.progress?.owned_count ?? items.length;
  const totalCount = current_collection?.progress?.total_count ?? allItems.length;

  // Combine collections and items for rendering
  const displayItems = [...collections, ...allItems];

  // Create ownership set for ItemGrid
  const userOwnership = new Set(items.map(item => item.id));

  // Collection header action buttons - hide in linked collections
  const headerActions = !linkedDbotCollectionId ? (
    <button
      className="create-collection-button"
      onClick={(e) => {
        e.stopPropagation();
        // Open ItemDetail with a new collection object
        setSelectedItem({
          type: 'custom',
          name: '',
          description: '',
          parent_collection_id: currentParentId
        });
        setSelectedItemIndex(null);
      }}
      title="Create new collection"
      aria-label="Create new collection"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 11v6m-3-3h6" strokeLinecap="round"/>
      </svg>
    </button>
  ) : null;

  return (
    <div className="my-collection">
      {/* Collection Header */}
      <CollectionHeader
        collection={displayCollection || { name: 'My Collection' }}
        subtitle={
          currentParentId && current_collection
            ? `${formatEntityType(current_collection.type)}${displayCollection?.year ? ` • ${displayCollection.year}` : ''}`
            : null
        }
        ownedCount={ownedCount}
        totalCount={totalCount}
        actions={headerActions}
        showProgress={currentParentId && (ownedCount > 0 || totalCount > 0)}
        onClick={currentParentId && displayCollection ? () => {
          setSelectedItem(displayCollection);
          setSelectedItemIndex(null);
        } : undefined}
        clickable={!!currentParentId && !!displayCollection}
        hideImage={!currentParentId}
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
          onNavigateToCollection={(collection) => {
            // Check if it's a user collection or DBoT collection
            if (collection.type === 'user_collection' || collection.type === 'custom' || collection.type === 'linked') {
              // Navigate to My Collection view (root if id is null)
              if (collection.id) {
                navigate(`/my-collection/${collection.id}`);
              } else {
                navigate(`/my-collection`);
              }
            } else {
              // Navigate to DBoT collection view
              navigate(`/collection/${collection.id}`);
            }
          }}
          currentCollection={current_collection}
          isUserItem={selectedItem.user_item_id ? true : false}
        />
      )}

    </div>
  );
}

export default MyCollection;
