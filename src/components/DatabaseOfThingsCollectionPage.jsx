import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useLazyQuery, useApolloClient } from '@apollo/client/react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCollectionFilter } from '../contexts/CollectionFilterContext';
import {
  GET_DATABASE_OF_THINGS_COLLECTION_ITEMS,
  GET_DATABASE_OF_THINGS_COLLECTIONS,
  GET_MY_COLLECTION,
  GET_MY_ITEMS,
  ADD_ITEM_TO_MY_COLLECTION,
  REMOVE_ITEM_FROM_MY_COLLECTION,
  GET_COLLECTION_PARENT_COLLECTIONS,
  BATCH_ADD_ITEMS_TO_MY_COLLECTION,
  MY_COLLECTION_TREE,
  GET_DATABASE_OF_THINGS_ENTITY
} from '../queries';
import { addToRecentlyViewed } from '../utils/recentlyViewed';
import { isFormBusy } from '../utils/formUtils';
import EntityDetailModal from './EntityDetailModal';
import CollectionFilterDrawer from './CollectionFilterDrawer';
import { useRadialMenu, useRadialMenuMainButton } from '../contexts/RadialMenuContext';
import MobileSearch from './MobileSearch';
import { ImageSearchModal } from './ImageSearchModal';
import Toast from './Toast';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import { formatEntityType, isCollectionType } from '../utils/formatters';
import { EntityCard } from './EntityCard';
import { CollectionHeader } from './CollectionHeader';
import { EntityCardGrid } from './EntityCardGrid';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { useMultiSelect } from '../hooks/useMultiSelect';
import { ConfirmationModal } from './ConfirmationModal';
import { BatchAddToUserCollectionModal } from './BatchAddToUserCollectionModal';

function DatabaseOfThingsCollectionPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const { setBreadcrumbItems, setLoading: setBreadcrumbsLoading } = useBreadcrumbs();
  const { getFiltersForCollection, applyFilters, hasActiveFilters, setActiveCollection } = useCollectionFilter();

  // If no ID, we're at the root
  const isRootView = !id || id === 'root';

  // Get navigation path from URL query params
  // Path format: "id1:name1,id2:name2,id3:name3"
  const pathParam = searchParams.get('path');
  const navigationPath = useMemo(() =>
    pathParam
      ? pathParam.split(',').map(item => {
          const [id, ...nameParts] = item.split(':');
          return { id, name: decodeURIComponent(nameParts.join(':')) }; // Join back in case name contains ':'
        })
      : [],
    [pathParam]
  );

  // Fetch collection data if not root
  const { data: collectionData, loading: collectionLoading, error: collectionError, refetch: refetchCollection } = useQuery(GET_DATABASE_OF_THINGS_ENTITY, {
    variables: { id: id },
    skip: isRootView,
    fetchPolicy: 'cache-and-network'
  });

  // Create virtual root collection based on auth state
  const getRootCollection = () => {
    if (isAuthenticated) {
      return {
        id: 'root',
        name: 'My Starred Collections',
        type: 'COLLECTION',
        metadata: {
          description: 'Your favorite collections'
        }
      };
    } else {
      return {
        id: 'root',
        name: 'Featured Collections',
        type: 'COLLECTION',
        metadata: {
          description: 'Explore collectibles from various collections'
        }
      };
    }
  };

  const collection = isRootView ? getRootCollection() : (collectionData?.databaseOfThingsEntity || null);

  // Track collection views
  useEffect(() => {
    if (collection && !isRootView) {
      addToRecentlyViewed(collection);
    }
  }, [collection, isRootView]);

  // Set active collection
  useEffect(() => {
    if (!isRootView && id) {
      setActiveCollection(id);
    }
  }, [id, isRootView, setActiveCollection]);
  const [filter, setFilter] = useState('all'); // all, owned, missing
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [sortBy, setSortBy] = useState('default'); // default, name-asc, name-desc, type, owned
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [showCollectionFilters, setShowCollectionFilters] = useState(false);
  const [isWishlistMode, setIsWishlistMode] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const saveCollectionRef = useRef(null); // Ref to trigger save from RadialMenu

  // Multi-select state
  const {
    isMultiSelectMode,
    selectedCount,
    selectedIds,
    toggleItemSelection,
    isItemSelected,
    isItemDisabled,
    exitMultiSelectMode
  } = useMultiSelect();

  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [showSingleItemPicker, setShowSingleItemPicker] = useState(false);
  const [singleItemToAdd, setSingleItemToAdd] = useState(null);

  const [batchAddMutation, { loading: isBatchAdding }] = useMutation(BATCH_ADD_ITEMS_TO_MY_COLLECTION, {
    refetchQueries: [{ query: GET_MY_ITEMS }],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      setToastMessage({ text: data.batchAddItemsToMyCollection.message, type: 'success' });
      exitMultiSelectMode();
      setShowBatchConfirm(false);
      setShowSingleItemPicker(false);
      setSingleItemToAdd(null);
    },
    onError: (error) => {
      setToastMessage({ text: `Error: ${error.message}`, type: 'error' });
      setShowBatchConfirm(false);
      setShowSingleItemPicker(false);
      setSingleItemToAdd(null);
    }
  });

  // GraphQL queries and mutations
  const [fetchCollectionItems] = useLazyQuery(GET_DATABASE_OF_THINGS_COLLECTION_ITEMS, {
    fetchPolicy: 'cache-first'
  });
  const [addItemMutation, { loading: isAddingItem }] = useMutation(ADD_ITEM_TO_MY_COLLECTION, {
    refetchQueries: [{ query: GET_MY_ITEMS }],
    awaitRefetchQueries: true
  });
  const [removeItemMutation, { loading: isRemovingItem }] = useMutation(REMOVE_ITEM_FROM_MY_COLLECTION, {
    refetchQueries: [{ query: GET_MY_ITEMS }],
    awaitRefetchQueries: true
  });

  // Fetch parent collections for filtering
  const { data: parentCollectionsData } = useQuery(GET_COLLECTION_PARENT_COLLECTIONS, {
    variables: { collectionId: collection?.id },
    skip: !collection?.id || isRootView,
    fetchPolicy: 'cache-first'
  });

  // Use different queries for root vs nested collections
  const isRoot = collection?.id === 'root';

  // Always call both queries unconditionally (Rules of Hooks), but skip the one we don't need
  const { loading: loadingCollections, error: errorCollections, data: dataCollections, refetch: refetchCollections } = useQuery(GET_DATABASE_OF_THINGS_COLLECTIONS, {
    variables: { first: 50 },
    skip: !isRoot || !collection?.id,
    fetchPolicy: 'cache-and-network'
  });

  const { loading: loadingItems, error: errorItems, data: dataItems, refetch: refetchItems } = useQuery(GET_DATABASE_OF_THINGS_COLLECTION_ITEMS, {
    variables: { collectionId: collection?.id, first: 1000 },
    skip: isRoot || !collection?.id,
    fetchPolicy: 'cache-and-network'
  });

  // Use the appropriate query result based on which query ran
  const loading = isRoot ? loadingCollections : loadingItems;
  const error = isRoot ? errorCollections : errorItems;
  const data = isRoot ? dataCollections : dataItems;
  const refetch = isRoot ? refetchCollections : refetchItems;

  // Ownership data - fetched from backend for authenticated users
  const [userOwnership, setUserOwnership] = useState(new Set());

  // Fetch user's owned items from backend
  const { data: myItemsData } = useQuery(GET_MY_ITEMS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network'
  });

  // Fetch user's collections to check if DBoT collection is already linked
  const { data: userCollectionsData } = useQuery(MY_COLLECTION_TREE, {
    variables: { parentId: null },
    skip: !isAuthenticated || !collection?.id,
    fetchPolicy: 'cache-and-network'
  });

  // Check if this DBoT collection is already linked (recursively check all levels)
  const [isCollectionLinked, setIsCollectionLinked] = useState(false);
  const [linkedCollectionId, setLinkedCollectionId] = useState(null);
  const [linkedCollection, setLinkedCollection] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !collection?.id || !apolloClient) {
      setIsCollectionLinked(false);
      setLinkedCollectionId(null);
      setLinkedCollection(null);
      return;
    }

    const checkLinkedRecursively = async (parentId = null) => {
      try {
        const { data } = await apolloClient.query({
          query: MY_COLLECTION_TREE,
          variables: { parentId },
          fetchPolicy: 'cache-first'
        });

        const collections = data?.myCollectionTree?.collections || [];

        // Check current level
        for (const col of collections) {
          if (col.linked_dbot_collection_id === collection?.id) {
            return col; // Return the full collection object
          }
        }

        // Check nested levels
        for (const col of collections) {
          const foundCol = await checkLinkedRecursively(col.id);
          if (foundCol) {
            return foundCol;
          }
        }

        return null;
      } catch (error) {
        console.error('Error checking linked collection:', error);
        return null;
      }
    };

    checkLinkedRecursively().then((col) => {
      if (col) {
        setIsCollectionLinked(true);
        setLinkedCollectionId(col.id);
        setLinkedCollection(col);
      } else {
        setIsCollectionLinked(false);
        setLinkedCollectionId(null);
        setLinkedCollection(null);
      }
    });
  }, [isAuthenticated, collection?.id, apolloClient, userCollectionsData]);

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
        // Show collection picker for adding item
        const item = filteredItems.find(i => i.id === itemId);
        setSingleItemToAdd(item);
        setShowSingleItemPicker(true);
      }
      // No manual refetch needed - refetchQueries handles it automatically
    } catch (error) {
      console.error('Error toggling ownership:', error);
    }
  };

  // Handle single item addition through collection picker
  const handleSingleItemAdd = async (parentCollectionId) => {
    if (!singleItemToAdd) return;

    await batchAddMutation({
      variables: {
        entityIds: [singleItemToAdd.id],
        parentCollectionId: parentCollectionId
      }
    });
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

  // Batch action handler
  const handleBatchAdd = async (parentCollectionId) => {
    await batchAddMutation({
      variables: {
        entityIds: selectedIds,
        parentCollectionId: parentCollectionId
      }
    });
  };

  // Build header actions array (used for both desktop header and mobile menu)
  const headerActions = useMemo(() => {
    const actions = [];

    // Filter action - always available when not in root view
    if (!isRootView) {
      actions.push({
        id: 'filter',
        icon: (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        label: 'Filter collection items',
        onClick: (e) => {
          e?.stopPropagation();
          setShowCollectionFilters(true);
        },
        variant: hasActiveFilters(collection?.id) ? 'active' : undefined,
        badge: hasActiveFilters(collection?.id) ? <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--yellow-accent)] border-2 border-[#2C4B7B] rounded-full animate-[pulse-badge_2s_ease-in-out_infinite]"></span> : undefined
      });
    }

    // Wishlist/heart action - available when authenticated
    if (!isRootView && isAuthenticated) {
      actions.push({
        id: 'wishlist',
        icon: (
          <svg viewBox="0 0 24 24" width="20" height="20" fill={isCollectionLinked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        label: isCollectionLinked ? 'View in My Collection' : 'Add collection to wishlist',
        onClick: (e) => {
          e?.stopPropagation();
          if (isCollectionLinked && linkedCollectionId) {
            navigate(`/my-collection/${linkedCollectionId}`);
          } else {
            setSelectedItem(collection);
            setSelectedItemIndex(null);
            setIsWishlistMode(true);
          }
        },
        className: isCollectionLinked ? 'linked-collection' : undefined
      });
    }

    return actions;
  }, [isRootView, isAuthenticated, isCollectionLinked, linkedCollectionId, collection, hasActiveFilters, navigate]);

  // Build RadialMenu actions for normal mode
  const radialMenuActions = useMemo(() => {
    // Don't show menu in root view
    if (isRoot || !collection?.id) return [];

    const actions = [
      {
        id: 'search',
        icon: 'fas fa-search',
        label: 'Search',
        onClick: () => setShowMobileSearch(true)
      }
    ];

    // Add header actions (filter, wishlist)
    actions.push(...headerActions);

    // Add item action buttons when viewing an item in ItemDetail
    if (isAuthenticated && selectedItem && !isCollectionType(selectedItem.type) && selectedItemIndex !== null) {
      if (userOwnership.has(selectedItem.id)) {
        actions.push({
          id: 'remove-from-collection',
          icon: 'fas fa-minus-circle',
          label: 'Remove from collection',
          onClick: () => {
            if (window.confirm(`Remove "${selectedItem.name}" from your collection?`)) {
              toggleItemOwnership(selectedItem.id);
            }
          },
          disabled: isFormBusy(isAddingItem, isRemovingItem)
        });
      } else {
        actions.push({
          id: 'add-to-collection',
          icon: 'fas fa-plus-circle',
          label: 'Add to collection',
          onClick: () => toggleItemOwnership(selectedItem.id),
          disabled: isFormBusy(isAddingItem, isRemovingItem)
        });
      }
    }

    return actions;
  }, [isRoot, collection?.id, headerActions, isAuthenticated, selectedItem, selectedItemIndex, userOwnership, toggleItemOwnership, isAddingItem, isRemovingItem]);

  // Set RadialMenu actions via context (normal mode)
  useRadialMenu(
    (isMultiSelectMode || isWishlistMode) ? [] : radialMenuActions,
    [isMultiSelectMode, isWishlistMode, radialMenuActions]
  );

  // Set main button for action modes
  useRadialMenuMainButton(
    isMultiSelectMode ? {
      icon: 'fas fa-plus',
      label: `Add ${selectedCount} items`,
      onClick: () => setShowBatchConfirm(true),
      variant: 'save'
    } : isWishlistMode ? {
      icon: 'fas fa-save',
      label: 'Save wishlist',
      onClick: () => {
        if (saveCollectionRef.current) {
          saveCollectionRef.current();
        }
      },
      variant: 'save'
    } : null,
    [isMultiSelectMode, isWishlistMode, selectedCount]
  );

  // Handle collection loading/error first (before items)
  if (!isRootView && collectionLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] max-w-[1400px] mx-auto">
        <CollectionHeaderSkeleton />
        <ItemListSkeleton count={12} />
      </div>
    );
  }

  if (!isRootView && collectionError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12">
        <h3>Error loading collection</h3>
        <p>{collectionError.message}</p>
        <button onClick={() => navigate('/')}>Back to Collections</button>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12">
        <h3>Collection not found</h3>
        <button onClick={() => navigate('/')}>Back to Collections</button>
      </div>
    );
  }

  // Handle items loading/error
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] max-w-[1400px] mx-auto">
        <CollectionHeaderSkeleton />
        <ItemListSkeleton count={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12">
        <h3>Error loading items</h3>
        <p>{error.message}</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-[1400px] mx-auto">
      {/* Collection Header */}
      <CollectionHeader
        collection={collection}
        subtitle={`${formatEntityType(collection?.type)}${collection?.year ? ` • ${collection.year}` : ''}`}
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

      {/* Multi-select toolbar (desktop) */}
      {isMultiSelectMode && (
        <div className="hidden md:flex bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg py-3 px-4 my-4 items-center justify-between" data-testid="multi-select-toolbar">
          <span className="text-sm font-medium text-[var(--text-primary)]" data-testid="selection-count">{selectedCount} items selected</span>
          <div className="flex gap-2">
            <button onClick={exitMultiSelectMode} className="py-2 px-4 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]" data-testid="cancel-multi-select-btn">
              Cancel
            </button>
            <button
              onClick={() => setShowBatchConfirm(true)}
              className="py-2 px-4 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 border-none bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedCount === 0}
              data-testid="batch-add-collection-btn"
            >
              Add to My Collection
            </button>
          </div>
        </div>
      )}

      {/* Items Grid/List */}
      {filteredItems.length > 0 ? (
        <EntityCardGrid
          items={filteredItems}
          onClick={{
            item: (item, index) => {
              // In multi-select mode, handle via ItemCard
              if (isMultiSelectMode) {
                return;
              }

              // Open modal for both mobile and desktop
              setSelectedItem(item);
              setSelectedItemIndex(index);
            },
            collection: (selectedCollection) => {
              // Build new path: ancestors + current collection
              const newPath = isRootView
                ? [] // From root, no ancestors
                : [
                    ...navigationPath.map(p => `${p.id}:${encodeURIComponent(p.name)}`),
                    `${id}:${encodeURIComponent(collection?.name || '')}`
                  ];

              // Navigate to the collection's URL with updated path
              const pathParam = newPath.length > 0 ? `?path=${newPath.join(',')}` : '';
              navigate(`/collection/${selectedCollection.id}${pathParam}`);
            }
          }}
          ownership={{
            owned: userOwnership,
            favorites: new Set()
          }}
          multiSelect={{
            active: isMultiSelectMode,
            selected: new Set(selectedIds),
            onToggle: toggleItemSelection,
            allowCollections: false
          }}
          isRoot={isRoot}
          viewMode={viewMode}
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-12">
          {searchTerm || filter !== 'all' ? (
            <>
              <svg className="w-16 h-16 text-[var(--text-secondary)] mb-4" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>No items found</h3>
              <p>Try adjusting your filters or search term</p>
            </>
          ) : isRoot && isAuthenticated ? (
            <>
              <svg className="w-16 h-16 text-[var(--text-secondary)] mb-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>No starred collections yet</h3>
              <p>Star your favorite collections to see them here</p>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 text-[var(--text-secondary)] mb-4" viewBox="0 0 24 24" fill="none">
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
        <EntityDetailModal
          item={selectedItem}
          index={selectedItemIndex}
          collection={collection}
          currentCollection={linkedCollection}
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

      {/* Collection Filter Drawer */}
      {!isRoot && collection?.id && (
        <CollectionFilterDrawer
          collectionId={collection.id}
          items={items}
          fetchCollectionItems={fetchCollectionItems}
          isOpen={showCollectionFilters}
          onClose={() => setShowCollectionFilters(false)}
          userOwnership={userOwnership}
        />
      )}

      {/* Mobile Search Modal */}
      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        onOpenImageSearch={() => setShowImageSearchModal(true)}
      />

      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={showImageSearchModal}
        onClose={() => setShowImageSearchModal(false)}
      />

      {/* Batch Add to Collection Modal */}
      <BatchAddToUserCollectionModal
        isOpen={showBatchConfirm}
        onClose={() => setShowBatchConfirm(false)}
        onConfirm={handleBatchAdd}
        itemCount={selectedCount}
        defaultCollectionId={linkedCollectionId}
        loading={isBatchAdding}
      />

      {/* Single Item Add to Collection Modal */}
      <BatchAddToUserCollectionModal
        isOpen={showSingleItemPicker}
        onClose={() => {
          setShowSingleItemPicker(false);
          setSingleItemToAdd(null);
        }}
        onConfirm={handleSingleItemAdd}
        itemCount={1}
        defaultCollectionId={linkedCollectionId}
        loading={isBatchAdding}
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

export default DatabaseOfThingsCollectionPage;
