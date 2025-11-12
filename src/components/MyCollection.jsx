import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useApolloClient } from '@apollo/client/react';
import { useNavigate, useParams } from 'react-router-dom';
import { MY_COLLECTION_TREE, GET_DATABASE_OF_THINGS_ENTITY, GET_DATABASE_OF_THINGS_COLLECTION_ITEMS, GET_COLLECTION_PARENT_COLLECTIONS } from '../queries';
import { CollectionHeader } from './CollectionHeader';
import { ItemGrid } from './ItemGrid';
import ItemDetail from './ItemDetail';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { formatEntityType, isCustomCollection, isLinkedCollection } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useCollectionFilter } from '../contexts/CollectionFilterContext';
import CircularMenu from './CircularMenu';
import MobileSearch from './MobileSearch';
import CollectionFilterPanel from './CollectionFilterPanel';
import './MyCollection.css';

function MyCollection() {
  const navigate = useNavigate();
  const { id } = useParams();
  const client = useApolloClient();
  const { isAuthenticated } = useAuth();
  const { setBreadcrumbItems, setLoading: setBreadcrumbsLoading } = useBreadcrumbs();
  const { getFiltersForCollection, applyFilters, hasActiveFilters } = useCollectionFilter();
  const [currentParentId, setCurrentParentId] = useState(id || null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [itemEditMode, setItemEditMode] = useState(false);
  const [itemAddMode, setItemAddMode] = useState(false);
  const [collectionCreateMode, setCollectionCreateMode] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showCollectionFilters, setShowCollectionFilters] = useState(false);
  const saveItemRef = useRef(null); // Ref to trigger save from ItemDetail

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

  // Fetch DBoT collection items for linked collections to maintain proper ordering
  const { data: dbotCollectionItemsData } = useQuery(GET_DATABASE_OF_THINGS_COLLECTION_ITEMS, {
    variables: {
      collectionId: linkedDbotCollectionId,
      first: 1000 // Fetch a large number to get all items
    },
    skip: !linkedDbotCollectionId,
    fetchPolicy: 'cache-first'
  });

  // Fetch parent collections for filtering (for linked collections)
  const { data: parentCollectionsData } = useQuery(GET_COLLECTION_PARENT_COLLECTIONS, {
    variables: { collectionId: linkedDbotCollectionId },
    skip: !linkedDbotCollectionId,
    fetchPolicy: 'cache-first'
  });

  // Sync currentParentId with URL parameter
  useEffect(() => {
    setCurrentParentId(id || null);
  }, [id]);

  // Reset edit/add/create mode when selected item changes
  useEffect(() => {
    setItemEditMode(false);
    setItemAddMode(false);
    setCollectionCreateMode(false);
  }, [selectedItem]);

  const handleCollectionClick = (collection) => {
    navigate(`/my-collection/${collection.id}`);
  };

  const handleItemClick = (item, index) => {
    // Check viewport: on mobile (<=768px), navigate to full-page view
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Navigate to appropriate full-page view on mobile
      if (item.user_item_id) {
        // Owned item - go to my-item page
        navigate(`/my-item/${item.user_item_id}`);
      } else {
        // Unowned item - go to catalog item page with MyCollection context
        navigate(`/item/${item.id}`, {
          state: {
            fromMyCollection: true,
            currentCollection: current_collection
          }
        });
      }
    } else {
      // Open modal on desktop
      setSelectedItem(item);
      setSelectedItemIndex(index);
    }
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
    setSelectedItemIndex(null);
    setItemEditMode(false);
    setItemAddMode(false);
    setCollectionCreateMode(false);
  };

  const handleCollectionCreated = (newCollection) => {
    // Transition from create mode to edit mode with the newly created collection
    setCollectionCreateMode(false);
    setItemEditMode(true);
    setSelectedItem({
      ...newCollection,
      type: newCollection.type || 'custom'
    });
    // Refetch will happen automatically via the mutation's refetchQueries
  };

  const handleNavigateItem = (direction) => {
    if (!data?.myCollectionTree) return;

    // Use the same filtered items that are displayed
    const { items: rawItems = [], wishlists: rawWishlists = [] } = data.myCollectionTree;
    const rawAllItems = [...rawItems, ...rawWishlists];

    // Apply filters if collection supports filtering
    let navigableItems = rawAllItems;
    const currentSupportsFiltering = currentParentId && (
      isLinkedCollection(data.myCollectionTree.current_collection?.type) ||
      isCustomCollection(data.myCollectionTree.current_collection?.type)
    );

    if (currentSupportsFiltering && rawAllItems.length > 0) {
      const currentFilterCollectionId = isLinkedCollection(data.myCollectionTree.current_collection?.type)
        ? data.myCollectionTree.current_collection?.linked_dbot_collection_id
        : currentParentId;
      const collectionFilters = getFiltersForCollection(currentFilterCollectionId);
      const parentCollections = parentCollectionsData?.databaseOfThingsCollectionParentCollections || [];
      const ownership = new Set(rawItems.map(item => item.id));
      navigableItems = applyFilters(rawAllItems, collectionFilters, parentCollections, ownership);
    }

    const newIndex = direction === 'next'
      ? (selectedItemIndex + 1) % navigableItems.length
      : (selectedItemIndex - 1 + navigableItems.length) % navigableItems.length;

    setSelectedItemIndex(newIndex);
    setSelectedItem(navigableItems[newIndex]);
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

  // Extract data before early returns (hooks must be called unconditionally)
  const { collections = [], items = [], wishlists = [], current_collection } = data?.myCollectionTree || {};

  // For linked collections, maintain DBoT ordering instead of frontloading owned items
  // Use the DBoT collection items as the canonical order
  const isLinkedCollectionForSorting = isLinkedCollection(current_collection?.type);
  const dbotItems = dbotCollectionItemsData?.databaseOfThingsCollectionItems || [];
  const allItems = isLinkedCollectionForSorting && dbotItems.length > 0
    ? (() => {
        // Create a map of owned items by their entity ID
        const ownedItemsMap = new Map(items.map(item => [item.id, item]));
        // Create a map of wishlist items by their entity ID
        const wishlistItemsMap = new Map(wishlists.map(item => [item.id, item]));

        // Use DBoT items order, replacing with owned/wishlist version if it exists
        const orderedItems = dbotItems.map(dbotItem => {
          // Prefer owned version, then wishlist version, then DBoT version
          return ownedItemsMap.get(dbotItem.id) || wishlistItemsMap.get(dbotItem.id) || dbotItem;
        });

        // Add any owned items that weren't in the DBoT collection (edge case)
        const dbotItemIds = new Set(dbotItems.map(item => item.id));
        items.forEach(item => {
          if (!dbotItemIds.has(item.id)) {
            orderedItems.push(item);
          }
        });

        return orderedItems;
      })()
    : [...items, ...wishlists];

  // For linked collections, merge user collection data with DBoT collection data
  const isLinkedCollectionForHeader = isLinkedCollection(current_collection?.type);
  const dbotCollection = dbotCollectionData?.databaseOfThingsEntity;
  const displayCollection = isLinkedCollectionForHeader && dbotCollection
    ? {
        ...dbotCollection, // Use DBoT's image, attributes, year, etc.
        type: 'linked', // Override type to 'linked'
        parent_collection_id: current_collection.parent_collection_id, // Preserve user collection hierarchy
        id: current_collection.id, // Use user collection ID for navigation
      }
    : current_collection;

  // Create ownership set for ItemGrid
  const userOwnership = new Set(items.map(item => item.id));

  // Determine if current collection supports filtering
  // Root level (currentParentId === null) always supports filtering
  // Nested levels support filtering for linked and custom collections
  const supportsFiltering = !currentParentId || isLinkedCollectionForHeader || isCustomCollection(current_collection?.type);
  const filterCollectionId = isLinkedCollectionForHeader ? linkedDbotCollectionId : (currentParentId || 'root');

  // Apply collection-specific filters for linked and custom collections (must be before early returns)
  const filteredItems = useMemo(() => {
    if (!supportsFiltering || allItems.length === 0) {
      return allItems;
    }

    // Apply collection-specific filters (metadata filtering)
    const collectionFilters = getFiltersForCollection(filterCollectionId);
    const parentCollections = parentCollectionsData?.databaseOfThingsCollectionParentCollections || [];
    return applyFilters(allItems, collectionFilters, parentCollections, userOwnership);
  }, [allItems, supportsFiltering, filterCollectionId, getFiltersForCollection, applyFilters, parentCollectionsData, userOwnership]);

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

  // Use backend's recursive progress calculation if available, otherwise fallback to filtered count
  const ownedCount = current_collection?.progress?.owned_count ?? items.length;
  const totalCount = current_collection?.progress?.total_count ?? filteredItems.length;

  // Combine collections and filtered items for rendering
  const displayItems = [...collections, ...filteredItems];

  // Collection header action buttons
  const headerActions = (
    <>
      {/* Filter button - show for collections that support filtering */}
      {supportsFiltering && (
        <button
          className={`filter-toggle-button ${hasActiveFilters(filterCollectionId) ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowCollectionFilters(true);
          }}
          title="Filter collection"
          aria-label="Filter collection"
        >
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {hasActiveFilters(filterCollectionId) && <span className="filter-badge" />}
        </button>
      )}

      {/* Create collection button - hide in linked collections */}
      {!linkedDbotCollectionId && (
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
            setCollectionCreateMode(true);
          }}
          title="Create new collection"
          aria-label="Create new collection"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11v6m-3-3h6" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </>
  );

  // Subtitle action - "jump to" button for linked collections
  const subtitleAction = linkedDbotCollectionId ? (
    <button
      className="icon-btn"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/collection/${linkedDbotCollectionId}`);
      }}
      title="Jump to original collection"
      aria-label="Jump to original collection"
    >
      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
        subtitleAction={subtitleAction}
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
          hasNext={selectedItemIndex < filteredItems.length - 1}
          hasPrevious={selectedItemIndex > 0}
          onNavigateToCollection={(collection) => {
            // Check if it's a user collection or DBoT collection
            if (collection.type === 'user_collection' || isCustomCollection(collection.type) || isLinkedCollection(collection.type)) {
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
          showAsWishlist={!selectedItem.user_item_id && !isCustomCollection(selectedItem.type) && !isLinkedCollection(selectedItem.type)}
          externalEditMode={itemEditMode || collectionCreateMode}
          onEditModeChange={setItemEditMode}
          externalAddMode={itemAddMode}
          onAddModeChange={setItemAddMode}
          onSaveRequest={saveItemRef}
          onCollectionCreated={handleCollectionCreated}
        />
      )}

      {/* MyCollection-specific Circular Menu */}
      {(itemEditMode || itemAddMode || collectionCreateMode) ? (
        // Action mode - Direct save button when in edit, add, or create mode
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
        // Menu mode - Normal circular menu
        <CircularMenu
          actions={[
            {
              id: 'search',
              icon: 'fas fa-search',
              label: 'Search',
              onClick: () => setShowMobileSearch(true)
            },
            // Show filter button for linked and custom collections when no item is selected
            ...(supportsFiltering && !selectedItem ? [{
              id: 'filter',
              icon: 'fas fa-filter',
              label: 'Filter collection',
              onClick: () => setShowCollectionFilters(true)
            }] : []),
            // Show "Jump to" for linked collections when no item is selected
            ...(linkedDbotCollectionId && !selectedItem ? [{
              id: 'jump-to-collection',
              icon: 'fas fa-external-link-alt',
              label: 'Jump to original collection',
              onClick: () => navigate(`/collection/${linkedDbotCollectionId}`)
            }] : []),
            // Show "Create Collection" if not in a linked DBoT collection AND no item is selected
            ...(!linkedDbotCollectionId && !selectedItem ? [{
              id: 'create-collection',
              icon: 'fas fa-folder-plus',
              label: 'Create Collection',
              onClick: () => {
                // Open ItemDetail with a new collection object
                setSelectedItem({
                  type: 'custom',
                  name: '',
                  description: '',
                  parent_collection_id: currentParentId
                });
                setSelectedItemIndex(null);
                setCollectionCreateMode(true);
              }
            }] : []),
            // Show edit button for custom and linked collections
            ...(selectedItem && (isCustomCollection(selectedItem.type) || isLinkedCollection(selectedItem.type)) ? [{
              id: 'edit-collection',
              icon: 'fas fa-edit',
              label: isLinkedCollection(selectedItem.type) ? 'Move collection' : 'Edit collection',
              onClick: () => setItemEditMode(true)
            }] : []),
            // Show item action buttons when viewing a regular item in ItemDetail
            ...(selectedItem && !isCustomCollection(selectedItem.type) && !isLinkedCollection(selectedItem.type) ?
              selectedItem.user_item_id ? [
                // For owned items: show edit button
                {
                  id: 'edit-item',
                  icon: 'fas fa-edit',
                  label: 'Edit item',
                  onClick: () => setItemEditMode(true)
                }
              ] : [
                // For non-owned items: show add button
                {
                  id: 'add-item',
                  icon: 'fas fa-plus-circle',
                  label: 'Add to collection',
                  onClick: () => setItemAddMode(true)
                }
              ]
            : [])
          ]}
        />
      )}

      {/* Mobile Search Modal */}
      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />

      {/* Collection Filter Panel - for linked and custom collections */}
      {supportsFiltering && (
        <CollectionFilterPanel
          collectionId={filterCollectionId}
          items={allItems}
          isOpen={showCollectionFilters}
          onClose={() => setShowCollectionFilters(false)}
          userOwnership={userOwnership}
        />
      )}

    </div>
  );
}

export default MyCollection;
