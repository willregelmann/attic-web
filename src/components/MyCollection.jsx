import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useApolloClient, useMutation } from '@apollo/client/react';
import { useNavigate, useParams } from 'react-router-dom';
import { MY_COLLECTION_TREE, GET_DATABASE_OF_THINGS_ENTITY, GET_DATABASE_OF_THINGS_COLLECTION_ITEMS, GET_COLLECTION_PARENT_COLLECTIONS, BATCH_REMOVE_ITEMS_FROM_MY_COLLECTION, BATCH_ADD_ITEMS_TO_WISHLIST, BATCH_ADD_ITEMS_TO_MY_COLLECTION, DELETE_USER_COLLECTION, UPLOAD_ITEM_IMAGES, REORDER_ITEM_IMAGES } from '../queries';
import { CollectionHeader } from './CollectionHeader';
import { EntityCardGrid } from './EntityCardGrid';
import ItemDetail from './ItemDetail';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import { DeleteCollectionModal } from './DeleteCollectionModal';
import { ImageGalleryModal } from './ImageGalleryModal';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { formatEntityType, isCustomCollection, isLinkedCollection } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useCollectionFilter } from '../contexts/CollectionFilterContext';
import { useFilters } from '../contexts/FilterContext';
import { groupDuplicateItems } from '../utils/groupDuplicates';
import CircularMenu from './CircularMenu';
import MobileSearch from './MobileSearch';
import { ImageSearchModal } from './ImageSearchModal';
import CollectionFilterPanel from './CollectionFilterPanel';
import { useMultiSelect } from '../hooks/useMultiSelect';
import { BatchActionModal } from './BatchActionModal';
import { BatchAddToCollectionModal } from './BatchAddToCollectionModal';
import AddItemsModal from './AddItemsModal';
import AddCustomItemModal from './AddCustomItemModal';
import Toast from './Toast';
import './MyCollection.css';
import './MultiSelectToolbar.css';

function MyCollection() {
  const navigate = useNavigate();
  const { id } = useParams();
  const client = useApolloClient();
  const { isAuthenticated } = useAuth();
  const { setBreadcrumbItems, setLoading: setBreadcrumbsLoading } = useBreadcrumbs();
  const { getFiltersForCollection, applyFilters, hasActiveFilters } = useCollectionFilter();
  const { groupDuplicates } = useFilters();
  const [currentParentId, setCurrentParentId] = useState(id || null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [itemEditMode, setItemEditMode] = useState(false);
  const [itemAddMode, setItemAddMode] = useState(false);
  const [collectionCreateMode, setCollectionCreateMode] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [showCollectionFilters, setShowCollectionFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddCustomItemModal, setShowAddCustomItemModal] = useState(false);
  const [preSelectedItemForAdd, setPreSelectedItemForAdd] = useState(null);
  const saveItemRef = useRef(null); // Ref to trigger save from ItemDetail

  // Image gallery state
  const [galleryItem, setGalleryItem] = useState(null);

  // Multi-select state
  const {
    isMultiSelectMode,
    selectedType,
    selectedCount,
    selectedIds,
    toggleItemSelection,
    isItemSelected,
    isItemDisabled,
    exitMultiSelectMode
  } = useMultiSelect();

  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [batchAction, setBatchAction] = useState(null); // 'delete' | 'wishlist' | 'add'
  const [toastMessage, setToastMessage] = useState(null);

  // Batch mutations
  const [batchRemoveMutation, { loading: isBatchRemoving }] = useMutation(
    BATCH_REMOVE_ITEMS_FROM_MY_COLLECTION,
    {
      refetchQueries: [{ query: MY_COLLECTION_TREE, variables: { parentId: currentParentId } }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        setToastMessage({ text: data.batchRemoveItemsFromMyCollection.message, type: 'success' });
        exitMultiSelectMode();
        setShowBatchConfirm(false);
      },
      onError: (error) => {
        setToastMessage({ text: `Error: ${error.message}`, type: 'error' });
        setShowBatchConfirm(false);
      }
    }
  );

  const [batchWishlistMutation, { loading: isBatchWishlisting }] = useMutation(
    BATCH_ADD_ITEMS_TO_WISHLIST,
    {
      refetchQueries: [{ query: MY_COLLECTION_TREE, variables: { parentId: currentParentId } }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        setToastMessage({ text: data.batchAddItemsToWishlist.message, type: 'success' });
        exitMultiSelectMode();
        setShowBatchConfirm(false);
      },
      onError: (error) => {
        setToastMessage({ text: `Error: ${error.message}`, type: 'error' });
        setShowBatchConfirm(false);
      }
    }
  );

  const [deleteCollectionMutation] = useMutation(DELETE_USER_COLLECTION, {
    refetchQueries: [{ query: MY_COLLECTION_TREE, variables: { parentId: currentParentId } }],
    awaitRefetchQueries: true
  });

  // Image gallery mutations
  const [uploadImagesMutation] = useMutation(UPLOAD_ITEM_IMAGES, {
    refetchQueries: [{ query: MY_COLLECTION_TREE, variables: { parentId: currentParentId } }],
    awaitRefetchQueries: true
  });

  const [reorderImagesMutation] = useMutation(REORDER_ITEM_IMAGES, {
    refetchQueries: [{ query: MY_COLLECTION_TREE, variables: { parentId: currentParentId } }],
    awaitRefetchQueries: true
  });

  const [batchAddMutation, { loading: isBatchAdding }] = useMutation(
    BATCH_ADD_ITEMS_TO_MY_COLLECTION,
    {
      refetchQueries: [{ query: MY_COLLECTION_TREE, variables: { parentId: currentParentId } }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        setToastMessage({ text: data.batchAddItemsToMyCollection.message, type: 'success' });
        exitMultiSelectMode();
        setShowBatchConfirm(false);
      },
      onError: (error) => {
        setToastMessage({ text: `Error: ${error.message}`, type: 'error' });
        setShowBatchConfirm(false);
      }
    }
  );

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

  // Close modal when navigating to a different collection
  useEffect(() => {
    setSelectedItem(null);
    setSelectedItemIndex(null);
  }, [id]);

  // Reset edit/add/create mode when selected item is cleared (set to null)
  // Don't reset when opening a new item, as we might be setting edit/create mode at the same time
  useEffect(() => {
    if (!selectedItem) {
      setItemEditMode(false);
      setItemAddMode(false);
      setCollectionCreateMode(false);
    }
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
    // Close the modal after successful creation
    setCollectionCreateMode(false);
    setItemEditMode(false);
    setSelectedItem(null);
    setSelectedItemIndex(null);
    // Refetch will happen automatically via the mutation's refetchQueries
  };

  const handleDeleteItem = async () => {
    if (!selectedItem?.user_item_id) return;

    try {
      await batchRemoveMutation({
        variables: {
          entityIds: [selectedItem.id]
        }
      });

      // Close modals and reset state
      setShowDeleteItemModal(false);
      handleCloseDetail();

      // Show success message
      setToastMessage({ text: 'Item deleted successfully', type: 'success' });
    } catch (error) {
      setToastMessage({ text: `Error deleting item: ${error.message}`, type: 'error' });
      setShowDeleteItemModal(false);
    }
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

  // Create ownership set for EntityCardGrid
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

  // Apply duplicate grouping to items (only to items, not collections)
  const groupedItems = useMemo(() => {
    return groupDuplicateItems(filteredItems, groupDuplicates);
  }, [filteredItems, groupDuplicates]);

  // Batch action handlers
  const handleBatchDelete = () => {
    setBatchAction('delete');
    setShowBatchConfirm(true);
  };

  const handleBatchWishlist = () => {
    setBatchAction('wishlist');
    setShowBatchConfirm(true);
  };

  const handleBatchAdd = () => {
    setBatchAction('add');
    setShowBatchConfirm(true);
  };

  // Image gallery update handler
  const handleImageUpdate = async (newFiles, removeIndices, reorderIds) => {
    if (!galleryItem) return;

    try {
      if (reorderIds && reorderIds.length > 0) {
        await reorderImagesMutation({
          variables: {
            user_item_id: galleryItem.user_item_id,
            image_ids: reorderIds,
          },
        });
      }

      if (newFiles.length > 0 || removeIndices.length > 0) {
        await uploadImagesMutation({
          variables: {
            user_item_id: galleryItem.user_item_id,
            images: newFiles.length > 0 ? newFiles : undefined,
            remove_image_indices: removeIndices.length > 0 ? removeIndices : undefined,
          },
        });
      }
    } catch (error) {
      console.error('Failed to update images:', error);
      setToastMessage({ text: 'Failed to update images', type: 'error' });
    }
  };

  const executeBatchAction = async (parentCollectionId = null) => {
    if (batchAction === 'delete') {
      try {
        // Separate collections from items
        const selectedCollections = collections.filter(col => selectedIds.includes(col.id));
        const selectedItemIds = selectedIds.filter(id => !selectedCollections.some(col => col.id === id));

        let collectionsDeleted = 0;
        let itemsDeleted = 0;

        // Delete collections
        if (selectedCollections.length > 0) {
          await Promise.all(
            selectedCollections.map(collection =>
              deleteCollectionMutation({ variables: { id: collection.id } })
            )
          );
          collectionsDeleted = selectedCollections.length;
        }

        // Delete items
        if (selectedItemIds.length > 0) {
          const result = await batchRemoveMutation({ variables: { entityIds: selectedItemIds } });
          itemsDeleted = result.data.batchRemoveItemsFromMyCollection.items_processed;
        }

        // Show success message
        const parts = [];
        if (collectionsDeleted > 0) parts.push(`${collectionsDeleted} collection${collectionsDeleted > 1 ? 's' : ''}`);
        if (itemsDeleted > 0) parts.push(`${itemsDeleted} item${itemsDeleted > 1 ? 's' : ''}`);
        setToastMessage({ text: `Deleted ${parts.join(' and ')}`, type: 'success' });

        exitMultiSelectMode();
        setShowBatchConfirm(false);
      } catch (error) {
        setToastMessage({ text: `Error: ${error.message}`, type: 'error' });
        setShowBatchConfirm(false);
      }
    } else if (batchAction === 'wishlist') {
      await batchWishlistMutation({
        variables: {
          entityIds: selectedIds,
          parentCollectionId: parentCollectionId !== undefined ? parentCollectionId : currentParentId
        }
      });
    } else if (batchAction === 'add') {
      await batchAddMutation({
        variables: {
          entityIds: selectedIds,
          parentCollectionId: parentCollectionId !== undefined ? parentCollectionId : currentParentId
        }
      });
    }
  };

  const getBatchConfirmationProps = () => {
    if (batchAction === 'delete') {
      // Count collections and items separately
      const selectedCollections = collections.filter(col => selectedIds.includes(col.id));
      const selectedItemCount = selectedIds.filter(id => !selectedCollections.some(col => col.id === id)).length;

      const parts = [];
      if (selectedCollections.length > 0) parts.push(`${selectedCollections.length} collection${selectedCollections.length > 1 ? 's' : ''}`);
      if (selectedItemCount > 0) parts.push(`${selectedItemCount} item${selectedItemCount > 1 ? 's' : ''}`);

      return {
        title: 'Delete from Collection',
        message: `Delete ${parts.join(' and ')}?`,
        confirmText: 'Delete',
        confirmVariant: 'danger',
        loading: isBatchRemoving
      };
    } else if (batchAction === 'wishlist') {
      return {
        title: 'Add to Wishlist',
        message: `Add ${selectedCount} items to your wishlist?`,
        confirmText: 'Add to Wishlist',
        confirmVariant: 'default',
        loading: isBatchWishlisting
      };
    } else if (batchAction === 'add') {
      return {
        title: 'Add to Collection',
        message: `Add ${selectedCount} items to your collection?`,
        confirmText: 'Add Items',
        confirmVariant: 'default',
        loading: isBatchAdding
      };
    }
    return {};
  };

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

  // Combine collections and grouped items for rendering
  const displayItems = [...collections, ...groupedItems];

  // Title action - "jump to" button for linked collections (appears next to collection name)
  // Hidden on mobile since it's available in the circular menu
  const titleAction = linkedDbotCollectionId ? (
    <button
      className="icon-btn desktop-only-actions"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/collection/${linkedDbotCollectionId}`);
      }}
      title="Jump to original collection"
      aria-label="Jump to original collection"
    >
      <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  ) : null;

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
        titleAction={titleAction}
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

      {/* Multi-select toolbar (desktop) */}
      {isMultiSelectMode && (
        <div className="multi-select-toolbar" data-testid="multi-select-toolbar">
          <span className="selection-count" data-testid="selection-count">{selectedCount} items selected</span>
          <div className="toolbar-actions">
            <button onClick={exitMultiSelectMode} className="cancel-btn" data-testid="cancel-multi-select-btn">
              Cancel
            </button>
            {selectedType === 'owned' && (
              <button
                onClick={handleBatchDelete}
                className="action-btn danger"
                disabled={selectedCount === 0}
                data-testid="batch-delete-btn"
              >
                Delete
              </button>
            )}
            {(selectedType === 'wishlisted' || selectedType === 'dbot-item') && (
              <button
                onClick={handleBatchAdd}
                className="action-btn"
                disabled={selectedCount === 0}
                data-testid="batch-add-collection-btn"
              >
                Add to Collection
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collections and Items Grid */}
      {displayItems.length > 0 ? (
        <EntityCardGrid
          items={displayItems}
          onItemClick={(item, index) => {
            // In multi-select mode, handled by ItemCard
            if (isMultiSelectMode) {
              return;
            }

            // If item has images and is owned, open gallery instead of detail modal
            if (item.user_item_id && item.images && item.images.length > 0) {
              setGalleryItem(item);
              return;
            }

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
          isMultiSelectMode={isMultiSelectMode}
          selectedItems={new Set(selectedIds)}
          onItemSelectionToggle={toggleItemSelection}
          allowCollectionSelection={true}
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
          onItemAdded={() => refetch()}
          onSaveRequest={saveItemRef}
          onCollectionCreated={handleCollectionCreated}
          onDeleteCollection={() => setShowDeleteModal(true)}
          onDeleteItem={() => setShowDeleteItemModal(true)}
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
      ) : isMultiSelectMode ? (
        // Multi-select mode
        <CircularMenu
          mainButtonMode="action"
          mainButtonIcon={selectedType === 'owned' ? 'fas fa-trash' : 'fas fa-plus-circle'}
          mainButtonLabel={
            (() => {
              if (selectedType === 'owned') {
                // Count collections and items separately
                const selectedCollections = collections.filter(col => selectedIds.includes(col.id));
                const selectedItemCount = selectedIds.filter(id => !selectedCollections.some(col => col.id === id)).length;

                const parts = [];
                if (selectedCollections.length > 0) parts.push(`${selectedCollections.length} collection${selectedCollections.length > 1 ? 's' : ''}`);
                if (selectedItemCount > 0) parts.push(`${selectedItemCount} item${selectedItemCount > 1 ? 's' : ''}`);

                return `Delete ${parts.join(' & ')}`;
              }
              return `Add ${selectedCount} item${selectedCount !== 1 ? 's' : ''}`;
            })()
          }
          mainButtonOnClick={selectedType === 'owned' ? handleBatchDelete : handleBatchAdd}
          mainButtonVariant={selectedType === 'owned' ? 'danger' : 'save'}
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
            // Show "Quick Add Custom Item" if no item is selected
            ...(!selectedItem ? [{
              id: 'quick-add-custom-item',
              icon: 'fas fa-plus',
              label: 'Quick Add Custom Item',
              onClick: () => setShowAddCustomItemModal(true)
            }] : []),
            // Show edit button for custom and linked collections
            ...(selectedItem && (isCustomCollection(selectedItem.type) || isLinkedCollection(selectedItem.type)) ? [{
              id: 'edit-collection',
              icon: 'fas fa-edit',
              label: isLinkedCollection(selectedItem.type) ? 'Move collection' : 'Edit collection',
              onClick: () => setItemEditMode(true),
              testid: 'edit-collection-action'
            }] : []),
            // Show delete button for custom and linked collections
            ...(selectedItem && (isCustomCollection(selectedItem.type) || isLinkedCollection(selectedItem.type)) ? [{
              id: 'delete-collection',
              icon: 'fas fa-trash',
              label: 'Delete collection',
              onClick: () => setShowDeleteModal(true),
              variant: 'danger'
            }] : []),
            // Show item action buttons when viewing a regular item in ItemDetail
            ...(selectedItem && !isCustomCollection(selectedItem.type) && !isLinkedCollection(selectedItem.type) ?
              selectedItem.user_item_id ? [
                // For owned items: show edit, duplicate, and delete buttons
                {
                  id: 'edit-item',
                  icon: 'fas fa-edit',
                  label: 'Edit item',
                  onClick: () => setItemEditMode(true)
                },
                {
                  id: 'duplicate-item',
                  icon: 'fas fa-copy',
                  label: 'Duplicate',
                  onClick: () => {
                    setPreSelectedItemForAdd(selectedItem);
                    setShowAddItemModal(true);
                  }
                },
                {
                  id: 'delete-item',
                  icon: 'fas fa-trash',
                  label: 'Delete item',
                  onClick: () => setShowDeleteItemModal(true),
                  variant: 'danger'
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
        onOpenImageSearch={() => setShowImageSearchModal(true)}
      />

      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={showImageSearchModal}
        onClose={() => setShowImageSearchModal(false)}
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

      {/* Delete Collection Modal */}
      {showDeleteModal && selectedItem && (isCustomCollection(selectedItem.type) || isLinkedCollection(selectedItem.type)) && (
        <DeleteCollectionModal
          collection={selectedItem}
          onClose={() => setShowDeleteModal(false)}
          onDelete={() => {
            setShowDeleteModal(false);
            handleCloseDetail(); // Close the detail modal
            // Navigate to parent collection or root
            const parentId = selectedItem.parent_collection_id;
            if (parentId) {
              navigate(`/my-collection/${parentId}`);
            } else {
              navigate('/my-collection');
            }
          }}
        />
      )}

      {/* Delete Item Modal */}
      {showDeleteItemModal && selectedItem && selectedItem.user_item_id && (
        <BatchActionModal
          isOpen={showDeleteItemModal}
          onClose={() => setShowDeleteItemModal(false)}
          onConfirm={handleDeleteItem}
          title="Delete Item"
          message={`Delete "${selectedItem.name}" from your collection?`}
          confirmText="Delete"
          confirmVariant="danger"
          loading={isBatchRemoving}
        />
      )}

      {/* Add Items Modal (for duplicate action) */}
      <AddItemsModal
        isOpen={showAddItemModal}
        onClose={() => {
          setShowAddItemModal(false);
          setPreSelectedItemForAdd(null);
        }}
        onItemsAdded={() => {
          setToastMessage({ text: 'Item duplicated successfully', type: 'success' });
        }}
        preSelectedItem={preSelectedItemForAdd}
      />

      {/* Add Custom Item Modal */}
      <AddCustomItemModal
        isOpen={showAddCustomItemModal}
        onClose={() => setShowAddCustomItemModal(false)}
        parentCollectionId={currentParentId}
        onSuccess={() => {
          setToastMessage({ text: 'Custom item added successfully', type: 'success' });
        }}
      />

      {/* Batch Action Confirmation - Delete */}
      {batchAction === 'delete' && (
        <BatchActionModal
          isOpen={showBatchConfirm}
          onClose={() => {
            setShowBatchConfirm(false);
            setBatchAction(null);
          }}
          onConfirm={executeBatchAction}
          {...getBatchConfirmationProps()}
        />
      )}

      {/* Batch Add to Wishlist - Collection Picker */}
      {batchAction === 'wishlist' && (
        <BatchAddToCollectionModal
          isOpen={showBatchConfirm}
          onClose={() => {
            setShowBatchConfirm(false);
            setBatchAction(null);
          }}
          onConfirm={executeBatchAction}
          itemCount={selectedCount}
          defaultCollectionId={currentParentId}
          loading={isBatchWishlisting}
        />
      )}

      {/* Batch Add Items - Collection Picker */}
      {batchAction === 'add' && (
        <BatchAddToCollectionModal
          isOpen={showBatchConfirm}
          onClose={() => {
            setShowBatchConfirm(false);
            setBatchAction(null);
          }}
          onConfirm={executeBatchAction}
          itemCount={selectedCount}
          defaultCollectionId={currentParentId}
          loading={isBatchAdding}
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

      {/* Image Gallery Modal */}
      {galleryItem && (
        <ImageGalleryModal
          item={galleryItem}
          onClose={() => setGalleryItem(null)}
          onUpdate={handleImageUpdate}
        />
      )}

    </div>
  );
}

export default MyCollection;
