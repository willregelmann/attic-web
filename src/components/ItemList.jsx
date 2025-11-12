import { useState, useMemo, useEffect, useRef } from 'react';
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
import MobileSearch from './MobileSearch';
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
  const [isWishlistMode, setIsWishlistMode] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const saveCollectionRef = useRef(null); // Ref to trigger save from CircularMenu

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

  // Collection header action buttons (filter + wishlist)
  const headerActions = !isRootView && (
    <>
      <button
        className={`filter-toggle-button ${hasActiveFilters(collection.id) ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setShowCollectionFilters(true);
        }}
        title="Filter collection items"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {hasActiveFilters(collection.id) && (
          <span className="filter-badge"></span>
        )}
      </button>

      {/* Wishlist button - desktop only */}
      {isAuthenticated && (
        <button
          className="wishlist-button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedItem(collection);
            setSelectedItemIndex(null);
            setIsWishlistMode(true);
          }}
          title="Add collection to wishlist"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </>
  );

  // Title action removed - now in CircularMenu

  return (
    <div className="item-list">
      {/* Collection Header */}
      <CollectionHeader
        collection={collection}
        subtitle={`${formatEntityType(collection.type)}${collection.year ? ` • ${collection.year}` : ''}`}
        ownedCount={stats.owned}
        totalCount={stats.total}
        actions={headerActions}
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
            // Check viewport: on mobile (<=768px), navigate to full-page view
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
              // Navigate to full-page view on mobile
              navigate(`/item/${item.id}`);
            } else {
              // Open modal on desktop
              setSelectedItem(item);
              setSelectedItemIndex(index);
            }
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
          externalWishlistMode={isWishlistMode}
          onWishlistModeChange={setIsWishlistMode}
          onCollectionWishlisted={(result) => {
            // Handle successful wishlist addition
            const { items_added, items_already_owned, created_collection } = result;
            let message;
            if (created_collection) {
              message = `Created "${created_collection.name}" with ${items_added} wishlist items`;
            } else if (items_already_owned > 0 && items_added === 0) {
              message = `All ${items_already_owned} items already owned`;
            } else if (items_already_owned > 0) {
              message = `Wishlisted ${items_added} items, ${items_already_owned} already owned`;
            } else {
              message = `Wishlisted ${items_added} items`;
            }
            setToastMessage({ text: message, type: 'success' });
            setIsWishlistMode(false);
          }}
          onSaveRequest={saveCollectionRef}
          onClose={() => {
            setSelectedItem(null);
            setSelectedItemIndex(null);
            setIsWishlistMode(false);
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
      {!isRoot && collection?.id && (() => {
        // If in wishlist mode, show save button
        if (isWishlistMode) {
          return (
            <CircularMenu
              mainButtonMode="action"
              mainButtonIcon="fas fa-save"
              mainButtonLabel="Save wishlist"
              mainButtonOnClick={() => {
                if (saveCollectionRef.current) {
                  saveCollectionRef.current();
                }
              }}
              mainButtonVariant="save"
            />
          );
        }

        const actions = [
          {
            id: 'search',
            icon: 'fas fa-search',
            label: 'Search',
            onClick: () => setShowMobileSearch(true)
          },
          {
            id: 'filter',
            icon: 'fas fa-filter',
            label: 'Filter collection',
            onClick: () => setShowCollectionFilters(true)
          }
        ];

        // Add wishlist button when no item is selected and user is authenticated
        if (isAuthenticated && !selectedItem && !isRootView) {
          actions.push({
            id: 'add-to-wishlist',
            icon: 'fas fa-heart',
            label: 'Add collection to wishlist',
            onClick: () => {
              setSelectedItem(collection);
              setSelectedItemIndex(null);
              setIsWishlistMode(true);
            }
          });
        }

        // Add item action buttons when viewing an item (not a collection) in ItemDetail
        if (isAuthenticated && selectedItem && !isCollectionType(selectedItem.type) && selectedItemIndex !== null) {
          if (userOwnership.has(selectedItem.id)) {
            // For owned items: show remove button
            actions.push({
              id: 'remove-from-collection',
              icon: 'fas fa-minus-circle',
              label: 'Remove from collection',
              onClick: () => {
                if (window.confirm(`Remove "${selectedItem.name}" from your collection?`)) {
                  toggleItemOwnership(selectedItem.id);
                }
              }
            });
          } else {
            // For non-owned items: show add button
            actions.push({
              id: 'add-to-collection',
              icon: 'fas fa-plus-circle',
              label: 'Add to collection',
              onClick: () => toggleItemOwnership(selectedItem.id)
            });
          }
        }

        return <CircularMenu actions={actions} />;
      })()}

      {/* Mobile Search Modal */}
      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />

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
