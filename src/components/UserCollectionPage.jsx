import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useApolloClient, useMutation, useLazyQuery } from '@apollo/client/react';
import { useNavigate, useParams } from 'react-router-dom';
import { MY_COLLECTION_TREE, MY_COLLECTION_PROGRESS, GET_DATABASE_OF_THINGS_ENTITY, GET_DATABASE_OF_THINGS_COLLECTION_ITEMS, GET_COLLECTION_PARENT_COLLECTIONS, BATCH_REMOVE_ITEMS_FROM_MY_COLLECTION, BATCH_ADD_ITEMS_TO_WISHLIST, BATCH_ADD_ITEMS_TO_MY_COLLECTION, DELETE_USER_COLLECTION, USER_COLLECTION_DELETION_PREVIEW, REMOVE_ITEM_FROM_MY_COLLECTION } from '../queries';
import { CollectionHeader } from './CollectionHeader';
import { EntityCardGrid } from './EntityCardGrid';
import EntityDetailModal from './EntityDetailModal';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { formatEntityType, isCustomCollection, isLinkedCollection } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useCollectionFilter } from '../contexts/CollectionFilterContext';
import { useFilters } from '../contexts/FilterContext';
import { groupDuplicateItems } from '../utils/groupDuplicates';
import { useRadialMenu, useRadialMenuMainButton } from '../contexts/RadialMenuContext';
import MobileSearch from './MobileSearch';
import { ImageSearchModal } from './ImageSearchModal';
import CollectionFilterDrawer from './CollectionFilterDrawer';
import { useMultiSelect } from '../hooks/useMultiSelect';
import { ConfirmationModal } from './ConfirmationModal';
import { BatchAddToUserCollectionModal } from './BatchAddToUserCollectionModal';
import Toast from './Toast';

function UserCollectionPage() {
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
  const saveItemRef = useRef(null); // Ref to trigger save from ItemDetail

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

  // Collection deletion preview state
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [deletionPreview, setDeletionPreview] = useState(null);
  const [isDeletingCollection, setIsDeletingCollection] = useState(false);

  // Lazy query for collection deletion preview
  const [getCollectionDeletionPreview, { loading: previewLoading }] = useLazyQuery(
    USER_COLLECTION_DELETION_PREVIEW,
    {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        setDeletionPreview(data?.userCollectionDeletionPreview);
      },
      onError: (error) => {
        console.error('Failed to load deletion preview:', error);
        // Still allow deletion even if preview fails
        setDeletionPreview({ total_items: 0, total_subcollections: 0 });
      }
    }
  );

  // Progress data fetched separately (async loading for better perceived performance)
  const [progressData, setProgressData] = useState({});
  const [getCollectionProgress] = useLazyQuery(MY_COLLECTION_PROGRESS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.myCollectionProgress) {
        const progressMap = {};
        data.myCollectionProgress.forEach(({ collection_id, progress }) => {
          progressMap[collection_id] = progress;
        });
        setProgressData(prev => ({ ...prev, ...progressMap }));
      }
    }
  });

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

  // Single item delete mutation (uses user_item_id)
  const [deleteItemMutation, { loading: isDeletingItem }] = useMutation(
    REMOVE_ITEM_FROM_MY_COLLECTION,
    {
      refetchQueries: [{ query: MY_COLLECTION_TREE, variables: { parentId: currentParentId } }],
      awaitRefetchQueries: true
    }
  );

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

  // Fetch progress data separately after collections load (async for better UX)
  useEffect(() => {
    const collections = data?.myCollectionTree?.collections || [];
    const currentCollection = data?.myCollectionTree?.current_collection;

    // Get all collection IDs that need progress (visible collections + current)
    const collectionIds = collections.map(c => c.id);
    if (currentCollection?.id) {
      collectionIds.push(currentCollection.id);
    }

    if (collectionIds.length > 0) {
      getCollectionProgress({ variables: { collectionIds } });
    }
  }, [data?.myCollectionTree?.collections, data?.myCollectionTree?.current_collection, getCollectionProgress]);

  const handleCollectionClick = (collection) => {
    // Check if this is a user collection (has parent_collection_id) or a DBoT collection
    // User collections have parent_collection_id field from our database
    // DBoT collections from the external API won't have this field
    if ('parent_collection_id' in collection) {
      // User collection - navigate within my-collection
      navigate(`/my-collection/${collection.id}`);
    } else {
      // DBoT collection - navigate to DBoT browse view
      navigate(`/collection/${collection.id}`);
    }
  };

  const handleItemClick = (item, index) => {
    // Open modal for both mobile and desktop
    // Reset modes when opening a new item (not in edit/add/create mode by default)
    setItemEditMode(false);
    setItemAddMode(false);
    setCollectionCreateMode(false);
    setSelectedItem(item);
    setSelectedItemIndex(index);
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
      await deleteItemMutation({
        variables: {
          userItemId: selectedItem.user_item_id
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

  // Handler to open delete collection modal with preview
  const handleOpenDeleteCollectionModal = (collection) => {
    setCollectionToDelete(collection);
    setDeletionPreview(null);
    setShowDeleteModal(true);
    getCollectionDeletionPreview({ variables: { id: collection.id } });
  };

  // Handler to execute collection deletion
  const handleDeleteCollection = async () => {
    if (!collectionToDelete?.id) {
      console.error('handleDeleteCollection: No collection ID available', collectionToDelete);
      setToastMessage({ text: 'Error: No collection selected', type: 'error' });
      return;
    }

    setIsDeletingCollection(true);
    try {
      const result = await deleteCollectionMutation({
        variables: { id: collectionToDelete.id }
      });

      if (result.data?.deleteUserCollection?.success) {
        setToastMessage({ text: 'Collection deleted successfully', type: 'success' });
        setShowDeleteModal(false);
        handleCloseDetail();

        // Navigate to parent collection or root
        const parentId = collectionToDelete.parent_collection_id;
        if (parentId) {
          navigate(`/my-collection/${parentId}`);
        } else {
          navigate('/my-collection');
        }
      } else {
        // Handle case where mutation returned but success is false
        setToastMessage({ text: 'Failed to delete collection', type: 'error' });
      }
    } catch (error) {
      console.error('handleDeleteCollection error:', error);
      setToastMessage({ text: `Error deleting collection: ${error.message}`, type: 'error' });
    } finally {
      setIsDeletingCollection(false);
      setCollectionToDelete(null);
      setDeletionPreview(null);
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
      isLinkedCollection(data.myCollectionTree.current_collection) ||
      isCustomCollection(data.myCollectionTree.current_collection)
    );

    if (currentSupportsFiltering && rawAllItems.length > 0) {
      const currentFilterCollectionId = isLinkedCollection(data.myCollectionTree.current_collection)
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

  // Determine if current collection supports filtering
  // Root level (currentParentId === null) always supports filtering
  // Nested levels support filtering for linked and custom collections
  const supportsFiltering = !currentParentId || isLinkedCollection(current_collection) || isCustomCollection(current_collection);
  const filterCollectionId = isLinkedCollection(current_collection) ? linkedDbotCollectionId : (currentParentId || 'root');

  // For linked collections, maintain DBoT ordering instead of frontloading owned items
  // Use the DBoT collection items as the canonical order
  const isLinkedCollectionForSorting = isLinkedCollection(current_collection);
  const dbotItems = dbotCollectionItemsData?.databaseOfThingsCollectionItems?.edges?.map(e => e.node) || [];
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
  const isLinkedCollectionForHeader = isLinkedCollection(current_collection);
  const dbotCollection = dbotCollectionData?.databaseOfThingsEntity;
  const displayCollection = isLinkedCollectionForHeader && dbotCollection
    ? {
        ...dbotCollection, // Use DBoT's image, attributes, year, etc.
        type: 'collection', // Type is always 'collection' for collections
        category: 'linked', // Category indicates it's a linked collection
        parent_collection_id: current_collection.parent_collection_id, // Preserve user collection hierarchy
        id: current_collection.id, // Use user collection ID for navigation
      }
    : current_collection;

  // Create ownership set for EntityCardGrid
  const userOwnership = new Set(items.map(item => item.id));

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

  // Batch action handlers - wrapped in useCallback to prevent infinite re-renders
  const handleBatchDelete = useCallback(() => {
    setBatchAction('delete');
    setShowBatchConfirm(true);
  }, []);

  const handleBatchWishlist = useCallback(() => {
    setBatchAction('wishlist');
    setShowBatchConfirm(true);
  }, []);

  const handleBatchAdd = useCallback(() => {
    setBatchAction('add');
    setShowBatchConfirm(true);
  }, []);

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

  // Build header actions array (used for both desktop header and mobile menu)
  // Must be before early returns to avoid hook ordering issues
  const headerActions = useMemo(() => {
    const actions = [];

    // Jump to original collection - for linked collections
    if (linkedDbotCollectionId) {
      actions.push({
        id: 'jump-to-collection',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        label: 'Jump to original collection',
        onClick: (e) => {
          e?.stopPropagation();
          navigate(`/collection/${linkedDbotCollectionId}`);
        }
      });
    }

    // Filter button - show for collections that support filtering
    if (supportsFiltering) {
      actions.push({
        id: 'filter',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        label: 'Filter collection',
        onClick: (e) => {
          e?.stopPropagation();
          setShowCollectionFilters(true);
        },
        variant: hasActiveFilters(filterCollectionId) ? 'active' : undefined,
        badge: hasActiveFilters(filterCollectionId) ? <span className="filter-badge" /> : undefined
      });
    }

    // Create collection button - hide in linked collections
    if (!linkedDbotCollectionId) {
      actions.push({
        id: 'create-collection',
        icon: (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11v6m-3-3h6" strokeLinecap="round"/>
          </svg>
        ),
        label: 'Create new collection',
        onClick: (e) => {
          e?.stopPropagation();
          setSelectedItem({
            type: 'collection',
            name: '',
            description: '',
            parent_collection_id: currentParentId
          });
          setSelectedItemIndex(null);
          setCollectionCreateMode(true);
        }
      });
    }

    // Quick Add Custom Item button
    actions.push({
      id: 'quick-add-custom-item',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Quick Add Custom Item',
      onClick: (e) => {
        e?.stopPropagation();
        setSelectedItem({ name: '', type: 'custom_item' });
        setItemAddMode(true);
      }
    });

    return actions;
  }, [linkedDbotCollectionId, supportsFiltering, hasActiveFilters, filterCollectionId, currentParentId, navigate]);

  // Build RadialMenu actions for normal mode
  const radialMenuActions = useMemo(() => {
    const actions = [
      {
        id: 'search',
        icon: 'fas fa-search',
        label: 'Search',
        onClick: () => setShowMobileSearch(true)
      }
    ];

    // Add header actions when no item is selected
    if (!selectedItem) {
      actions.push(...headerActions);
    } else if (isCustomCollection(selectedItem) || isLinkedCollection(selectedItem)) {
      // Edit/delete buttons for custom and linked collections
      // Collections have type='collection', items have type='item'
      actions.push({
        id: 'edit-collection',
        icon: 'fas fa-edit',
        label: isLinkedCollection(selectedItem) ? 'Move collection' : 'Edit collection',
        onClick: () => setItemEditMode(true),
        testid: 'edit-collection-action'
      });
      actions.push({
        id: 'delete-collection',
        icon: 'fas fa-trash',
        label: 'Delete collection',
        onClick: () => handleOpenDeleteCollectionModal(selectedItem),
        variant: 'danger'
      });
    } else if (selectedItem.user_item_id) {
      // For owned items: show edit, duplicate, and delete buttons
      actions.push(
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
          onClick: () => setItemAddMode(true)
        },
        {
          id: 'delete-item',
          icon: 'fas fa-trash',
          label: 'Delete item',
          onClick: () => setShowDeleteItemModal(true),
          variant: 'danger'
        }
      );
    } else {
      // For non-owned items: show add button
      actions.push({
        id: 'add-item',
        icon: 'fas fa-plus-circle',
        label: 'Add to collection',
        onClick: () => setItemAddMode(true)
      });
    }

    return actions;
  }, [selectedItem, headerActions]);

  // Set RadialMenu actions via context (normal mode)
  useRadialMenu(
    (itemEditMode || itemAddMode || collectionCreateMode || isMultiSelectMode) ? [] : radialMenuActions,
    [itemEditMode, itemAddMode, collectionCreateMode, isMultiSelectMode, radialMenuActions]
  );

  // Set main button for save/action modes
  useRadialMenuMainButton(
    (itemEditMode || itemAddMode || collectionCreateMode) ? {
      icon: 'fas fa-save',
      label: 'Save changes',
      onClick: () => {
        if (saveItemRef.current) {
          saveItemRef.current();
        }
      },
      variant: 'save'
    } : isMultiSelectMode ? {
      icon: selectedType === 'owned' ? 'fas fa-trash' : 'fas fa-plus-circle',
      label: (() => {
        if (selectedType === 'owned') {
          const selectedCollections = collections.filter(col => selectedIds.includes(col.id));
          const selectedItemCount = selectedIds.filter(id => !selectedCollections.some(col => col.id === id)).length;
          const parts = [];
          if (selectedCollections.length > 0) parts.push(`${selectedCollections.length} collection${selectedCollections.length > 1 ? 's' : ''}`);
          if (selectedItemCount > 0) parts.push(`${selectedItemCount} item${selectedItemCount > 1 ? 's' : ''}`);
          return `Delete ${parts.join(' & ')}`;
        }
        return `Add ${selectedCount} item${selectedCount !== 1 ? 's' : ''}`;
      })(),
      onClick: selectedType === 'owned' ? handleBatchDelete : handleBatchAdd,
      variant: selectedType === 'owned' ? 'danger' : 'save'
    } : null,
    [itemEditMode, itemAddMode, collectionCreateMode, isMultiSelectMode, selectedType, selectedIds, selectedCount, collections, handleBatchDelete, handleBatchAdd]
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-3 max-w-[1400px] mx-auto">
        <CollectionHeaderSkeleton />
        <ItemListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-3 max-w-[1400px] mx-auto">
        <div className="text-center py-12 px-8 md:py-8 md:px-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p>Error loading your collection: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 py-2 px-6 bg-red-800 text-white border-none rounded-md cursor-pointer transition-colors hover:bg-red-900 md:py-3 md:px-6 md:text-base md:min-h-[48px] md:rounded-lg active:scale-[0.98]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use backend's progress data from separate async query (or fallback to filtered count)
  const currentProgress = current_collection?.id ? progressData[current_collection.id] : null;
  const ownedCount = currentProgress?.owned_count ?? items.length;
  const totalCount = currentProgress?.total_count ?? filteredItems.length;

  // Merge progress data into collections for rendering (no useMemo - after early returns)
  const collectionsWithProgress = collections.map(col => ({
    ...col,
    progress: progressData[col.id] || null
  }));

  // Combine collections and grouped items for rendering
  const displayItems = [...collectionsWithProgress, ...groupedItems];

  return (
    <div className="p-4 sm:p-3 max-w-[1400px] mx-auto">
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

      {/* Multi-select toolbar (desktop) */}
      {isMultiSelectMode && (
        <div className="hidden md:flex bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg py-3 px-4 my-4 items-center justify-between" data-testid="multi-select-toolbar">
          <span className="text-sm font-medium text-[var(--text-primary)]" data-testid="selection-count">{selectedCount} items selected</span>
          <div className="flex gap-2">
            <button
              onClick={exitMultiSelectMode}
              className="py-2 px-4 rounded-md text-sm font-medium cursor-pointer transition-all border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              data-testid="cancel-multi-select-btn"
            >
              Cancel
            </button>
            {selectedType === 'owned' && (
              <button
                onClick={handleBatchDelete}
                className="py-2 px-4 rounded-md text-sm font-medium cursor-pointer transition-all border-none bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedCount === 0}
                data-testid="batch-delete-btn"
              >
                Delete
              </button>
            )}
            {(selectedType === 'wishlisted' || selectedType === 'dbot-item') && (
              <button
                onClick={handleBatchAdd}
                className="py-2 px-4 rounded-md text-sm font-medium cursor-pointer transition-all border-none bg-[var(--primary)] text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
          onClick={{
            item: (item, index) => {
              // In multi-select mode, handled by ItemCard
              if (isMultiSelectMode) {
                return;
              }

              // Calculate actual index in allItems array (skip collections)
              const itemIndex = index - collections.length;
              handleItemClick(item, itemIndex >= 0 ? itemIndex : 0);
            },
            collection: handleCollectionClick
          }}
          ownership={{
            owned: userOwnership,
            favorites: new Set()
          }}
          multiSelect={{
            active: isMultiSelectMode,
            selected: new Set(selectedIds),
            onToggle: toggleItemSelection,
            allowCollections: true
          }}
          isRoot={false}
          viewMode="grid"
          showWishlistStyling={true}
        />
      ) : (
        <div className="col-span-full text-center py-16 px-8 md:py-12 md:px-6 sm:py-10 sm:px-4 text-gray-500">
          <h3 className="my-4 text-[var(--text-primary)] text-2xl md:text-xl sm:text-lg">No items yet</h3>
          <p className="m-0 mb-6 text-base md:text-[15px] sm:text-sm">Start building your collection by browsing and adding items</p>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <EntityDetailModal
          key={selectedItem.user_item_id || selectedItem.id || 'new'}
          item={selectedItem}
          onClose={handleCloseDetail}
          onNext={() => handleNavigateItem('next')}
          onPrevious={() => handleNavigateItem('prev')}
          hasNext={selectedItemIndex < filteredItems.length - 1}
          hasPrevious={selectedItemIndex > 0}
          onNavigateToCollection={(collection) => {
            // Check if it's a user collection (type='collection') or DBoT collection
            if (collection.type === 'collection') {
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
          showAsWishlist={!selectedItem.user_item_id && selectedItem.type !== 'collection'}
          externalEditMode={itemEditMode || collectionCreateMode}
          onEditModeChange={setItemEditMode}
          externalAddMode={itemAddMode}
          onAddModeChange={setItemAddMode}
          onItemAdded={() => refetch()}
          onSaveRequest={saveItemRef}
          onCollectionCreated={handleCollectionCreated}
          onDeleteCollection={() => handleOpenDeleteCollectionModal(selectedItem)}
          onDeleteItem={() => setShowDeleteItemModal(true)}
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

      {/* Collection Filter Drawer - for linked and custom collections */}
      {supportsFiltering && (
        <CollectionFilterDrawer
          collectionId={filterCollectionId}
          items={allItems}
          isOpen={showCollectionFilters}
          onClose={() => setShowCollectionFilters(false)}
          userOwnership={userOwnership}
        />
      )}

      {/* Delete Collection Modal */}
      {showDeleteModal && collectionToDelete && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setCollectionToDelete(null);
            setDeletionPreview(null);
          }}
          onConfirm={handleDeleteCollection}
          title="Delete Collection"
          message={
            previewLoading
              ? 'Loading...'
              : (() => {
                  const totalItems = deletionPreview?.total_items || 0;
                  const totalSubcollections = deletionPreview?.total_subcollections || 0;
                  const totalNested = totalItems + totalSubcollections;
                  return `Are you sure you want to delete "${collectionToDelete.name}"${totalNested > 0 ? ` and ${totalNested} nested item${totalNested !== 1 ? 's' : ''}` : ''}?`;
                })()
          }
          confirmText="Delete"
          confirmVariant="danger"
          loading={isDeletingCollection || previewLoading}
        />
      )}

      {/* Delete Item Modal */}
      {showDeleteItemModal && selectedItem && selectedItem.user_item_id && (
        <ConfirmationModal
          isOpen={showDeleteItemModal}
          onClose={() => setShowDeleteItemModal(false)}
          onConfirm={handleDeleteItem}
          title="Delete Item"
          message={`Delete "${selectedItem.name}" from your collection?`}
          confirmText="Delete"
          confirmVariant="danger"
          loading={isDeletingItem}
        />
      )}

      {/* Duplicate action uses EntityDetailModal in add mode (above) */}

      {/* Batch Action Confirmation - Delete */}
      {batchAction === 'delete' && (
        <ConfirmationModal
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
        <BatchAddToUserCollectionModal
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
        <BatchAddToUserCollectionModal
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

    </div>
  );
}

export default UserCollectionPage;
