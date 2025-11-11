import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { useAuth } from '../contexts/AuthContext';
import { useCollectionFilter } from '../contexts/CollectionFilterContext';
import { useNavigate } from 'react-router-dom';
import {
  GET_DATABASE_OF_THINGS_COLLECTION_ITEMS,
  GET_DATABASE_OF_THINGS_COLLECTIONS,
  GET_MY_COLLECTION,
  GET_MY_ITEMS,
  ADD_ITEM_TO_MY_COLLECTION,
  REMOVE_ITEM_FROM_MY_COLLECTION,
  GET_COLLECTION_PARENT_COLLECTIONS
} from '../queries';
import ItemDetail from './ItemDetail';
import CollectionFilterPanel from './CollectionFilterPanel';
import CircularMenu from './CircularMenu';
import AddCollectionModal from './AddCollectionModal';
import Toast from './Toast';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import { formatEntityType, isCollectionType } from '../utils/formatters';
import { ItemCard, ItemCardImage } from './ItemCard';
import { CollectionHeader } from './CollectionHeader';
import { ItemGrid } from './ItemGrid';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import './ItemList.css';

function ItemList({ collection, onBack, onSelectCollection, isRootView = false, onRefresh, navigationPath = [] }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { setBreadcrumbItems, setLoading: setBreadcrumbsLoading } = useBreadcrumbs();
  const { getFiltersForCollection, applyFilters, hasActiveFilters } = useCollectionFilter();
  const [filter, setFilter] = useState('all'); // all, owned, missing
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [sortBy, setSortBy] = useState('default'); // default, name-asc, name-desc, type, owned
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [showCollectionFilters, setShowCollectionFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // GraphQL queries and mutations
  const [fetchCollectionItems] = useLazyQuery(GET_DATABASE_OF_THINGS_COLLECTION_ITEMS, {
    fetchPolicy: 'cache-first'
  });
  const [addItemMutation] = useMutation(ADD_ITEM_TO_MY_COLLECTION);
  const [removeItemMutation] = useMutation(REMOVE_ITEM_FROM_MY_COLLECTION);

  // Fetch parent collections for filtering
  const { data: parentCollectionsData } = useQuery(GET_COLLECTION_PARENT_COLLECTIONS, {
    variables: { collectionId: collection?.id },
    skip: !collection?.id || isRootView,
    fetchPolicy: 'cache-first'
  });

  // Use different queries for root vs nested collections
  const isRoot = collection.id === 'root';

  // Determine which query to use
  let query;
  let variables = {};

  if (isRoot) {
    // For root: always show all collections
    query = GET_DATABASE_OF_THINGS_COLLECTIONS;
    variables = { first: 50 };
  } else {
    query = GET_DATABASE_OF_THINGS_COLLECTION_ITEMS;
    variables = { collectionId: collection.id, first: 1000 };
  }

  const { loading, error, data, refetch } = useQuery(query, {
    variables,
    skip: !collection.id,
    fetchPolicy: 'cache-and-network'
  });

  // Ownership data - fetched from backend for authenticated users
  const [userOwnership, setUserOwnership] = useState(new Set());

  // Fetch user's owned items from backend
  const { data: myItemsData, refetch: refetchMyItems } = useQuery(GET_MY_ITEMS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network'
  });

  // Update ownership state when backend data is fetched
  useEffect(() => {
    if (myItemsData?.myItems) {
      const ownedEntityIds = new Set(
        myItemsData.myItems.map(item => item.entity_id)
      );
      setUserOwnership(ownedEntityIds);
    } else if (!isAuthenticated) {
      setUserOwnership(new Set());
    }
  }, [myItemsData, isAuthenticated]);

  // Toggle item ownership (add or remove from collection)
  const toggleItemOwnership = async (itemId) => {
    if (!isAuthenticated) {
      return; // Silently return, the UI will show the auth prompt
    }

    const isOwned = userOwnership.has(itemId);

    try {
      if (isOwned) {
        // Remove from collection
        await removeItemMutation({
          variables: { itemId }
        });
      } else {
        // Add to collection
        await addItemMutation({
          variables: { itemId, metadata: null, notes: null }
        });
      }

      // Refetch owned items to update UI
      await refetchMyItems();
    } catch (error) {
      console.error('Error toggling ownership:', error);
    }
  };


  // Handle successful addition from AddCollectionModal
  const handleAddCollectionSuccess = (result) => {
    const { items_added, items_already_owned, created_collection } = result;

    // Build toast message based on result
    let message;
    if (created_collection) {
      // Track mode - new collection created
      message = `Created "${created_collection.name}" with ${items_added} wishlist items`;
    } else if (items_already_owned > 0 && items_added === 0) {
      // All items already owned
      message = `All ${items_already_owned} items already owned`;
    } else if (items_already_owned > 0) {
      // Partial - some already owned
      message = `Wishlisted ${items_added} items, ${items_already_owned} already owned`;
    } else {
      // All items added
      message = `Wishlisted ${items_added} items`;
    }

    setToastMessage({ text: message, type: 'success' });
    setIsAddModalOpen(false);
  };

  // Get items from the appropriate query result
  const items = useMemo(() => {
    if (isRoot) {
      return data?.databaseOfThingsCollections || [];
    }
    return data?.databaseOfThingsCollectionItems || [];
  }, [data, isRoot]);


  // Filter and search items
  const filteredItems = useMemo(() => {
    if (!items.length) return [];

    let filtered = items;

    // Apply collection-specific filters (metadata filtering)
    // Note: Collections always pass through filters so users can navigate into them
    // Only non-collection items are filtered based on their attributes
    if (!isRoot && collection?.id) {
      const collectionFilters = getFiltersForCollection(collection.id);
      const parentCollections = parentCollectionsData?.databaseOfThingsCollectionParentCollections || [];
      filtered = applyFilters(filtered, collectionFilters, parentCollections, userOwnership);
    }

    // Apply ownership filter
    if (filter === 'owned') {
      filtered = filtered.filter(item => userOwnership.has(item.id));
    } else if (filter === 'missing') {
      filtered = filtered.filter(item => !userOwnership.has(item.id));
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (!isRoot) {
      filtered = [...filtered];

      switch (sortBy) {
        case 'name-asc':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;

        case 'name-desc':
          filtered.sort((a, b) => b.name.localeCompare(a.name));
          break;

        case 'type':
          filtered.sort((a, b) => {
            const typeCompare = (a.type || '').localeCompare(b.type || '');
            return typeCompare !== 0 ? typeCompare : a.name.localeCompare(b.name);
          });
          break;

        case 'owned':
          filtered.sort((a, b) => {
            const aOwned = userOwnership.has(a.id);
            const bOwned = userOwnership.has(b.id);
            if (aOwned === bOwned) {
              return a.name.localeCompare(b.name);
            }
            return aOwned ? -1 : 1;
          });
          break;

        case 'missing':
          filtered.sort((a, b) => {
            const aOwned = userOwnership.has(a.id);
            const bOwned = userOwnership.has(b.id);
            if (aOwned === bOwned) {
              return a.name.localeCompare(b.name);
            }
            return aOwned ? 1 : -1;
          });
          break;

        default:
          // Default sorting by year if available
          filtered.sort((a, b) => {
            if (a.year && b.year) {
              return a.year - b.year;
            }
            return a.name.localeCompare(b.name);
          });
          break;
      }
    }

    return filtered;
  }, [items, isRoot, filter, searchTerm, userOwnership, sortBy, collection?.id, getFiltersForCollection, applyFilters, parentCollectionsData]);

  // Calculate stats based on filtered items
  const stats = useMemo(() => {
    if (!filteredItems.length) return { total: 0, owned: 0, percentage: 0 };

    const total = filteredItems.length;
    const owned = filteredItems.filter(item => userOwnership.has(item.id)).length;
    const percentage = total > 0 ? Math.round((owned / total) * 100) : 0;

    return { total, owned, percentage };
  }, [filteredItems, userOwnership]);

  // Hide breadcrumbs in ItemList
  useEffect(() => {
    setBreadcrumbItems([]);
    setBreadcrumbsLoading(false);
  }, [setBreadcrumbItems, setBreadcrumbsLoading]);


  if (loading) {
    return (
      <div className="item-list">
        <CollectionHeaderSkeleton />
        <ItemListSkeleton count={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="items-error">
        <h3>Error loading items</h3>
        <p>{error.message}</p>
        <button onClick={onBack}>Back to Collections</button>
      </div>
    );
  }

  // Collection header action buttons (filter only)
  const headerActions = !isRootView && (
    <button
      className={`admin-button ${hasActiveFilters(collection.id) ? 'active' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        setShowCollectionFilters(true);
      }}
      title="Filter collection items"
    >
      <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
        <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      {hasActiveFilters(collection.id) && (
        <span className="filter-active-indicator"></span>
      )}
    </button>
  );

  // Title action button (add to wishlist)
  const titleAction = !isRootView && isAuthenticated && (
    <button
      className="wishlist-button"
      onClick={(e) => {
        e.stopPropagation();
        setIsAddModalOpen(true);
      }}
      title="Add collection to wishlist"
    >
      <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  );

  return (
    <div className="item-list">
      {/* Collection Header */}
      <CollectionHeader
        collection={collection}
        subtitle={`${formatEntityType(collection.type)}${collection.year ? ` • ${collection.year}` : ''}`}
        ownedCount={stats.owned}
        totalCount={stats.total}
        actions={headerActions}
        titleAction={titleAction}
        onClick={() => {
          setSelectedItem(collection);
          setSelectedItemIndex(null);
        }}
        clickable={true}
        showProgress={!isRootView && isAuthenticated}
      />

      {/* Items Grid/List */}
      {filteredItems.length > 0 ? (
        <ItemGrid
          items={filteredItems}
          onItemClick={(item, index) => {
            setSelectedItem(item);
            setSelectedItemIndex(index);
          }}
          onCollectionClick={onSelectCollection}
          userOwnership={userOwnership}
          userFavorites={new Set()}
          isRoot={isRoot}
          viewMode={viewMode}
        />
      ) : (
        <div className="no-items">
          {searchTerm || filter !== 'all' ? (
            <>
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>No items found</h3>
              <p>Try adjusting your filters or search term</p>
            </>
          ) : isRoot && isAuthenticated ? (
            <>
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>No starred collections yet</h3>
              <p>Star your favorite collections to see them here</p>
            </>
          ) : (
            <>
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="12" stroke="currentColor" strokeWidth="2" rx="2"/>
                <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>No items yet</h3>
              <p>Check back soon for new items in this collection</p>
            </>
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          index={selectedItemIndex}
          collection={collection}
          isOwned={userOwnership.has(selectedItem.id)}
          isUserItem={false}  // ItemList shows DBoT collections, not user items
          onToggleOwnership={() => {
            toggleItemOwnership(selectedItem.id);
          }}
          onNavigateToCollection={(collection) => {
            // Navigate directly without appending to current path
            // This is used from tree navigation in the detail modal
            navigate(`/collection/${collection.id}`);
          }}
          onClose={() => {
            setSelectedItem(null);
            setSelectedItemIndex(null);
          }}
        />
      )}

      {/* Collection Filter Panel */}
      {!isRoot && collection?.id && (
        <CollectionFilterPanel
          collectionId={collection.id}
          items={items}
          fetchCollectionItems={fetchCollectionItems}
          isOpen={showCollectionFilters}
          onClose={() => setShowCollectionFilters(false)}
          userOwnership={userOwnership}
        />
      )}

      {/* Collection-specific Circular Menu with Filter */}
      {!isRoot && collection?.id && (
        <CircularMenu
          onSearch={() => {
            // Navigate to search - could enhance this later
            navigate('/');
          }}
          onAccount={() => {
            if (isAuthenticated) {
              navigate('/profile');
            } else {
              navigate('/');
            }
          }}
          onFilter={() => setShowCollectionFilters(true)}
          showFilter={true}
        />
      )}

      {/* AddCollectionModal for adding collection to wishlist */}
      {!isRootView && collection && (
        <AddCollectionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          dbotCollection={{
            id: collection.id,
            name: collection.name
          }}
          onSuccess={handleAddCollectionSuccess}
        />
      )}

      {/* Toast Notification */}
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

export default ItemList;
