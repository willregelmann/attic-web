import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery, useLazyQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { useState, useEffect, memo } from 'react';
import { GET_DATABASE_OF_THINGS_ITEM_PARENTS, GET_DATABASE_OF_THINGS_COLLECTION_ITEMS, UPDATE_MY_ITEM, UPDATE_USER_COLLECTION, CREATE_USER_COLLECTION, BATCH_ADD_ITEMS_TO_MY_COLLECTION, MY_COLLECTION_TREE, MOVE_USER_ITEM, MOVE_USER_COLLECTION, ADD_COLLECTION_TO_WISHLIST, GET_MY_ITEMS, UPLOAD_ITEM_IMAGES, REORDER_ITEM_IMAGES } from '../queries';
import { formatEntityType, isCollectionType, isCustomCollection, isLinkedCollection } from '../utils/formatters';
import { isFormBusy } from '../utils/formUtils';
import { CollectionTreeSkeleton } from './SkeletonLoader';
import { CollectionPickerTree } from './CollectionPickerTree';
import { ImageUpload } from './ImageUpload';
import { getTypeIcon } from '../utils/iconUtils.jsx';
import './ItemDetail.css';
import './ItemList.css'; // Import for child-images-grid styles

// Recursive component to render collection tree - memoized to prevent unnecessary re-renders
const CollectionTreeNode = memo(({ collection, depth = 0, onNavigateToCollection, onClose }) => {
  const hasParents = collection.parents && collection.parents.length > 0;

  return (
    <li className="tree-item">
      <button
        className="tree-collection-link"
        style={{ paddingLeft: `${12 + (depth * 20)}px` }}
        onClick={(e) => {
          e.stopPropagation();
          onNavigateToCollection?.(collection);
          // Don't call onClose() - navigation handles leaving current view
        }}
        title={`View ${collection.name}`}
      >
        {depth > 0 && (
          <svg className="tree-branch" viewBox="0 0 16 16" width="16" height="16">
            <path d="M8 0 L8 8 L16 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        )}
        <span className="tree-collection-name">
          {collection.name}
          {collection.year && <span className="tree-year"> • {collection.year}</span>}
        </span>
        <svg className="tree-arrow" viewBox="0 0 24 24" fill="none" width="16" height="16">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {hasParents && (
        <ul className="tree-nested-list">
          {collection.parents.map((parent) => (
            <CollectionTreeNode
              key={parent.id}
              collection={parent}
              depth={depth + 1}
              onNavigateToCollection={onNavigateToCollection}
              onClose={onClose}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

function ItemDetailContent({
  item,
  index,
  isOwned,
  onToggleOwnership,
  onClose,
  onNavigateToCollection,
  collection,
  isSuggestionPreview = false,
  onAcceptSuggestion,
  onRejectSuggestion,
  isUserItem = false,  // New prop: indicates this is from My Collection
  showAsWishlist = false,  // New prop: show gray overlay for unowned items in collection tracking context
  currentCollection = null,  // New prop: current collection context (for defaulting collection picker)
  externalEditMode = false,  // New prop: externally controlled edit mode
  onEditModeChange = null,  // New prop: callback when edit mode changes
  externalAddMode = false,  // New prop: externally controlled add mode
  onAddModeChange = null,  // New prop: callback when add mode changes
  externalWishlistMode = false,  // New prop: externally controlled wishlist mode
  onWishlistModeChange = null,  // New prop: callback when wishlist mode changes
  onCollectionWishlisted = null,  // New prop: called when a collection is wishlisted
  onSaveRequest = null,  // New prop: called when parent wants to trigger save
  onCollectionCreated = null,  // New prop: called when a collection is successfully created
  onDeleteCollection = null,  // New prop: called when delete button is clicked
  onDeleteItem = null,  // New prop: called when delete item button is clicked
  onItemAdded = null,  // New prop: called when an item is added to collection
  onSavingChange = null  // New prop: callback when saving state changes
}) {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const client = useApolloClient();

  // Edit mode state for user items
  const [isEditMode, setIsEditMode] = useState(externalEditMode);
  const [editNotes, setEditNotes] = useState('');
  const [originalParentCollectionId, setOriginalParentCollectionId] = useState(null);
  const [uploadImages, setUploadImages] = useState([]);
  const [removeImageIndices, setRemoveImageIndices] = useState([]);

  // Edit mode state for collections
  const [editCollectionName, setEditCollectionName] = useState('');
  const [editCollectionDescription, setEditCollectionDescription] = useState('');

  // Sync external edit mode (don't notify parent here to avoid loop)
  useEffect(() => {
    setIsEditMode(externalEditMode);
  }, [externalEditMode]);

  // Notify parent when edit mode changes
  const handleSetEditMode = (newEditMode) => {
    setIsEditMode(newEditMode);
    if (onEditModeChange) {
      onEditModeChange(newEditMode);
    }
  };

  // Add mode state for non-owned items
  const [isAddMode, setIsAddMode] = useState(externalAddMode);

  // Sync external add mode (don't notify parent here to avoid loop)
  useEffect(() => {
    setIsAddMode(externalAddMode);
  }, [externalAddMode]);

  // Notify parent when add mode changes
  const handleSetAddMode = (newAddMode) => {
    setIsAddMode(newAddMode);
    if (onAddModeChange) {
      onAddModeChange(newAddMode);
    }
  };

  // Wishlist mode state for collections - always using 'track' mode (linked collection)
  const [isWishlistMode, setIsWishlistMode] = useState(externalWishlistMode);
  const [wishlistCollectionName, setWishlistCollectionName] = useState('');
  const [wishlistTargetCollectionId, setWishlistTargetCollectionId] = useState(null);

  // Sync external wishlist mode
  useEffect(() => {
    setIsWishlistMode(externalWishlistMode);
    if (externalWishlistMode && item) {
      // Initialize wishlist state when entering wishlist mode
      setWishlistCollectionName(item.name || '');
      setWishlistTargetCollectionId(null);
    }
  }, [externalWishlistMode, item]);

  // Notify parent when wishlist mode changes
  const handleSetWishlistMode = (newWishlistMode) => {
    setIsWishlistMode(newWishlistMode);
    if (onWishlistModeChange) {
      onWishlistModeChange(newWishlistMode);
    }
  };

  const [selectedCollection, setSelectedCollection] = useState(currentCollection?.id || null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Initialize edit state when item changes
  useEffect(() => {
    if (isUserItem && item) {
      setEditNotes(item.user_notes || '');
      // Store the original parent collection ID
      setOriginalParentCollectionId(item.parent_collection_id || null);
      setSelectedCollection(item.parent_collection_id || null);
    }

    // Initialize collection edit state
    if (item && isCustomCollection(item.type)) {
      setEditCollectionName(item.name || '');
      setEditCollectionDescription(item.description || '');
      // Set selected collection to the parent of this collection
      setSelectedCollection(item.parent_collection_id || null);
      setOriginalParentCollectionId(item.parent_collection_id || null);

      // Auto-enter edit mode if creating a new collection (no ID)
      if (!item.id) {
        handleSetEditMode(true);
      }
    }

    // Initialize linked collection edit state
    if (item && isLinkedCollection(item.type)) {
      // Set selected collection to the parent of this linked collection
      setSelectedCollection(item.parent_collection_id || null);
      setOriginalParentCollectionId(item.parent_collection_id || null);
    }
  }, [isUserItem, item.user_notes, item.parent_collection_id, item.type, item.name, item.description, item.id]);

  // Fetch user's collections for the picker and for building collection hierarchy
  const { data: collectionsData, loading: collectionsLoading } = useQuery(MY_COLLECTION_TREE, {
    variables: { parentId: null },
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network'
  });

  // Find path to selected collection and auto-expand
  useEffect(() => {
    if (!selectedCollection || !client) {
      setExpandedIds(new Set());
      return;
    }

    const findPathToCollection = async (targetId, parentId = null, path = []) => {
      try {
        const { data } = await client.query({
          query: MY_COLLECTION_TREE,
          variables: { parentId },
          fetchPolicy: 'cache-first'
        });

        const collections = data?.myCollectionTree?.collections || [];

        for (const col of collections) {
          const currentPath = [...path, col.id];

          if (col.id === targetId) {
            // Found it! Return the path (excluding the target itself)
            return path;
          }

          // Recursively search in this collection's children
          const childPath = await findPathToCollection(targetId, col.id, currentPath);
          if (childPath) {
            return childPath;
          }
        }

        return null;
      } catch (error) {
        console.error('Error finding collection path:', error);
        return null;
      }
    };

    findPathToCollection(selectedCollection).then((pathIds) => {
      if (pathIds && pathIds.length > 0) {
        setExpandedIds(new Set(pathIds));
      } else {
        // Not found or at root
        setExpandedIds(new Set());
      }
    });
  }, [selectedCollection, client]);

  // Build user collection hierarchy for owned items, linked collections, and custom collections
  const [userCollectionPath, setUserCollectionPath] = useState([]);

  useEffect(() => {
    const buildCollectionPath = async () => {
      // Build path for user items, linked collections, or custom collections that have a parent_collection_id
      if ((isUserItem || isLinkedCollection(item.type) || isCustomCollection(item.type)) && item.parent_collection_id && !collectionsLoading) {
        // Build path from parent_collection_id upward through user collections
        const path = [];
        let currentId = item.parent_collection_id;

        // Recursively fetch parent collections to build the full path
        while (currentId) {
          try {
            const { data } = await client.query({
              query: MY_COLLECTION_TREE,
              variables: { parentId: currentId },
              fetchPolicy: 'cache-first'
            });

            if (data?.myCollectionTree?.current_collection) {
              const col = data.myCollectionTree.current_collection;
              path.unshift({  // Add to beginning to build path from root to item
                id: col.id,
                name: col.name,
                type: col.type
              });
              currentId = col.parent_collection_id;  // Move up to parent
            } else {
              break;
            }
          } catch (error) {
            console.error('Error fetching collection path:', error);
            break;
          }
        }

        setUserCollectionPath(path);
      } else {
        setUserCollectionPath([]);
      }
    };

    buildCollectionPath();
  }, [isUserItem, item.type, item.parent_collection_id, collectionsLoading, client]);

  // Update mutation for owned items
  const [updateMyItem, { loading: isUpdating }] = useMutation(UPDATE_MY_ITEM, {
    onCompleted: () => {
      handleSetEditMode(false);
      // Optionally refetch or update cache
    },
    onError: (error) => {
      console.error('Failed to update item:', error);
      alert('Failed to save changes. Please try again.');
    }
  });

  // Update mutation for collections
  const [updateUserCollection, { loading: isUpdatingCollection }] = useMutation(UPDATE_USER_COLLECTION, {
    onCompleted: () => {
      handleSetEditMode(false);
      // Refetch collection tree to update the display
    },
    onError: (error) => {
      console.error('Failed to update collection:', error);
      alert('Failed to save changes. Please try again.');
    },
    refetchQueries: [
      { query: MY_COLLECTION_TREE, variables: { parentId: item.parent_collection_id || null } }
    ],
    awaitRefetchQueries: true
  });

  // Create mutation for new collections
  const [createUserCollection, { loading: isCreatingCollection }] = useMutation(CREATE_USER_COLLECTION, {
    onCompleted: (data) => {
      // If we have a callback for collection creation, use it to transition to edit mode
      // Otherwise, just close the modal (default behavior)
      if (onCollectionCreated && data?.createUserCollection) {
        onCollectionCreated(data.createUserCollection);
      } else {
        // No callback provided, exit edit mode and close
        handleSetEditMode(false);
        onClose();
      }
    },
    onError: (error) => {
      console.error('Failed to create collection:', error);
      if (error.message.includes('Unauthenticated') || error.networkError?.statusCode === 401) {
        alert('You must be logged in to create collections. Please log in and try again.');
      } else {
        alert('Failed to create collection: ' + error.message);
      }
    },
    refetchQueries: [
      { query: MY_COLLECTION_TREE, variables: { parentId: null } },
      { query: MY_COLLECTION_TREE, variables: { parentId: selectedCollection } }
    ],
    awaitRefetchQueries: true
  });

  // Add mutation for new items
  const [addItemToMyCollection, { loading: isAdding }] = useMutation(BATCH_ADD_ITEMS_TO_MY_COLLECTION, {
    refetchQueries: [
      { query: GET_MY_ITEMS },
      { query: MY_COLLECTION_TREE, variables: { parentId: null } },
      { query: MY_COLLECTION_TREE, variables: { parentId: selectedCollection } }
    ],
    awaitRefetchQueries: true,
    onError: (error) => {
      console.error('Failed to add item:', error);
      if (error.message.includes('Unauthenticated') || error.networkError?.statusCode === 401) {
        alert('You must be logged in to add items. Please log in and try again.');
      } else {
        alert('Failed to add item: ' + error.message);
      }
    }
  });

  // Move item mutation (for setting parent collection after adding)
  const [moveUserItem, { loading: isMoving }] = useMutation(MOVE_USER_ITEM, {
    refetchQueries: [
      { query: MY_COLLECTION_TREE, variables: { parentId: null } },
      { query: MY_COLLECTION_TREE, variables: { parentId: originalParentCollectionId } },
      { query: MY_COLLECTION_TREE, variables: { parentId: selectedCollection } }
    ],
    awaitRefetchQueries: true,
    onError: (error) => {
      console.error('Failed to move item to collection:', error);
      alert('Item was added but could not be moved to the selected collection.');
    }
  });

  // Move collection mutation (for changing parent collection)
  const [moveUserCollection, { loading: isMovingCollection }] = useMutation(MOVE_USER_COLLECTION, {
    refetchQueries: [
      { query: MY_COLLECTION_TREE, variables: { parentId: null } },
      { query: MY_COLLECTION_TREE, variables: { parentId: originalParentCollectionId } },
      { query: MY_COLLECTION_TREE, variables: { parentId: selectedCollection } }
    ],
    awaitRefetchQueries: true,
    onError: (error) => {
      console.error('Failed to move collection:', error);
      alert('Failed to move collection. Please try again.');
    }
  });

  // Wishlist collection mutation
  const [addCollectionToWishlist, { loading: isWishlisting }] = useMutation(ADD_COLLECTION_TO_WISHLIST, {
    refetchQueries: [
      { query: MY_COLLECTION_TREE, variables: { parentId: null } }
    ],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      if (onCollectionWishlisted && data?.addCollectionToWishlist) {
        onCollectionWishlisted(data.addCollectionToWishlist);
      }
      handleSetWishlistMode(false);
      onClose();
    },
    onError: (error) => {
      console.error('Failed to wishlist collection:', error);
      alert('Failed to add collection to wishlist: ' + error.message);
    }
  });

  // Image upload mutations
  const [uploadItemImages] = useMutation(UPLOAD_ITEM_IMAGES);
  const [reorderItemImages] = useMutation(REORDER_ITEM_IMAGES);

  const isSaving = isFormBusy(
    isUpdating,
    isUpdatingCollection,
    isCreatingCollection,
    isAdding,
    isMoving,
    isMovingCollection,
    isWishlisting,
    collectionsLoading
  );

  // Notify parent when saving state changes
  useEffect(() => {
    if (onSavingChange) {
      onSavingChange(isSaving);
    }
  }, [isSaving, onSavingChange]);

  // Save changes (handles both edit mode, add mode, and wishlist mode)
  const handleSave = async () => {
    try {
      // Check if we're in wishlist mode - always creates linked collection
      if (isWishlistMode && isCollectionType(item.type)) {
        // Validate collection name
        if (!wishlistCollectionName.trim()) {
          alert('Collection name cannot be empty');
          return;
        }

        // Build mutation variables for TRACK mode
        const variables = {
          dbot_collection_id: item.id,
          mode: 'TRACK',
          new_collection_name: wishlistCollectionName.trim()
        };

        // Include parent collection if selected
        if (wishlistTargetCollectionId) {
          variables.target_collection_id = wishlistTargetCollectionId;
        }

        // Execute mutation
        await addCollectionToWishlist({ variables });

        // Success - mutation's onCompleted will handle closing and callback
        return;
      }

      // Check if we're creating a new collection
      if (isEditMode && isCustomCollection(item.type) && !item.id) {
        // Validate collection name
        if (!editCollectionName.trim()) {
          alert('Collection name cannot be empty');
          return;
        }

        // Create collection
        const variables = {
          name: editCollectionName.trim(),
          description: editCollectionDescription.trim() || null
        };

        // Only include parentId if a parent collection is selected
        if (selectedCollection) {
          variables.parentId = selectedCollection;
        }

        await createUserCollection({ variables });

        // Success - modal will close via onCompleted callback
        return;
      }

      // Check if we're editing an existing collection
      if (isEditMode && isCustomCollection(item.type)) {
        // Validate collection name
        if (!editCollectionName.trim()) {
          alert('Collection name cannot be empty');
          return;
        }

        // Update collection
        await updateUserCollection({
          variables: {
            id: item.id,
            name: editCollectionName.trim(),
            description: editCollectionDescription.trim() || null
          }
        });

        // Success - exit edit mode
        handleSetEditMode(false);
        return;
      }

      // Check if we're editing a linked collection
      if (isEditMode && isLinkedCollection(item.type)) {
        // Only update parent collection for linked collections
        await moveUserCollection({
          variables: {
            id: item.id,
            newParentId: selectedCollection
          }
        });

        // Success - exit edit mode and close modal to refresh parent view
        handleSetEditMode(false);
        onClose();
        return;
      }

      if (isAddMode) {
        // Add new item to collection using batch mutation
        await addItemToMyCollection({
          variables: {
            entityIds: [item.id],
            parentCollectionId: selectedCollection
          }
        });

        // Notify parent that item was added (triggers refetch in MyCollection)
        if (onItemAdded) {
          onItemAdded();
        }

        // Success - close modal and reset state
        handleSetAddMode(false);
        setEditNotes('');
        onClose();
        return;
      } else {
        // Update existing item
        await updateMyItem({
          variables: {
            userItemId: item.user_item_id,
            notes: editNotes
          }
        });

        // Handle image uploads if any
        if (uploadImages.length > 0 || removeImageIndices.length > 0) {
          await uploadItemImages({
            variables: {
              user_item_id: item.user_item_id,
              images: uploadImages.length > 0 ? uploadImages : undefined,
              remove_image_indices: removeImageIndices.length > 0 ? removeImageIndices : undefined
            },
            refetchQueries: [{ query: MY_COLLECTION_TREE }]
          });
        }

        // Check if collection has changed and move if needed
        if (selectedCollection !== originalParentCollectionId) {
          await moveUserItem({
            variables: {
              itemId: item.user_item_id,
              newParentCollectionId: selectedCollection
            }
          });
        }

        // Success - exit edit mode
        handleSetEditMode(false);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // Enter add mode
  const handleEnterAddMode = () => {
    handleSetAddMode(true);
    setEditNotes('');
    // Default to current collection if viewing one
    const defaultCollection = currentCollection?.id || null;
    setSelectedCollection(defaultCollection);
  };

  // Fetch parent collections for this item
  const { data: parentsData, loading: parentsLoading } = useQuery(
    GET_DATABASE_OF_THINGS_ITEM_PARENTS,
    {
      variables: { itemId: item?.id },
      skip: !item?.id || isSuggestionPreview,
    }
  );

  // Expose save function to parent via ref
  useEffect(() => {
    if (onSaveRequest) {
      onSaveRequest.current = handleSave;
    }
  });

  if (!item) return null;

  const parentCollections = parentsData?.databaseOfThingsItemParents || [];

  // Child images state for collections without images
  const [childImages, setChildImages] = useState([]);

  // Determine if this is a user collection (custom or linked)
  const isUserCollection = isCustomCollection(item.type) || isLinkedCollection(item.type) ||
    (item.parent_collection_id !== undefined && item.parent_collection_id !== null);

  // Query for DBoT collections
  const [fetchChildren, { data: childrenData }] = useLazyQuery(
    GET_DATABASE_OF_THINGS_COLLECTION_ITEMS,
    {
      fetchPolicy: 'cache-first'
    }
  );

  // Query for user collections
  const [fetchUserChildren, { data: userChildrenData }] = useLazyQuery(
    MY_COLLECTION_TREE,
    {
      fetchPolicy: 'cache-first'
    }
  );

  // Use representative images from backend if available, otherwise fetch children client-side
  const representativeImages = item.representative_image_urls || item.representative_images || [];
  const hasRepresentativeImages = representativeImages.length > 0;

  // Fetch children if item has no image and no representative images and is a collection type
  useEffect(() => {
    if (!item.image_url && !hasRepresentativeImages && isCollectionType(item.type) && item.id) {
      if (isUserCollection) {
        // Fetch user collection items
        fetchUserChildren({ variables: { parentId: item.id } });
      } else {
        // Fetch DBoT collection items
        fetchChildren({ variables: { collectionId: item.id, first: 50 } });
      }
    }
  }, [item.image_url, hasRepresentativeImages, item.type, item.id, isUserCollection, fetchChildren, fetchUserChildren]);

  // Extract child images from DBoT collections using breadth-first search
  useEffect(() => {
    if (!childrenData?.databaseOfThingsCollectionItems) return;

    const findChildImages = (items) => {
      const images = [];
      const queue = [...items];

      // Fetch up to 5 images to know if there are more than 4
      while (queue.length > 0 && images.length < 5) {
        const current = queue.shift();
        if (current.image_url) {
          images.push(current.image_url);
        }
      }

      return images;
    };

    const images = findChildImages(childrenData.databaseOfThingsCollectionItems);
    setChildImages(images);
  }, [childrenData]);

  // Extract child images from user collections
  useEffect(() => {
    if (!userChildrenData?.myCollectionTree) return;

    const items = userChildrenData.myCollectionTree.items || [];
    const collections = userChildrenData.myCollectionTree.collections || [];
    const images = [];

    // First, try to get images from items
    for (let i = 0; i < items.length && images.length < 5; i++) {
      const item = items[i];
      if (item.image_url) {
        images.push(item.image_url);
      }
    }

    // If not enough images from items, try subcollection images
    if (images.length < 5) {
      for (let i = 0; i < collections.length && images.length < 5; i++) {
        const collection = collections[i];
        if (collection.image_url) {
          images.push(collection.image_url);
        }
      }
    }

    setChildImages(images);
  }, [userChildrenData]);

  const getItemImage = () => {
    // Use image_url for detail view (full quality)
    if (item.image_url) {
      return `url(${item.image_url})`;
    }
    // No background when no images are available (just show icon)
    return 'transparent';
  };

  // Use representative images if available, otherwise use client-side fetched child images
  const imagesToDisplay = hasRepresentativeImages ? representativeImages : childImages;
  const hasMoreImages = imagesToDisplay.length > 4;
  const displayImages = hasMoreImages ? imagesToDisplay.slice(0, 4) : imagesToDisplay;

  // Determine icon color and get icon
  const iconColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const shouldShowIcon = !item.image_url && imagesToDisplay.length === 0;
  const typeIcon = shouldShowIcon ? getTypeIcon(item.type, iconColor, 96) : null;

  return (
    <>
      {/* Suggestion Preview Header */}
      {isSuggestionPreview && item._suggestion && (
        <div className="suggestion-preview-header">
          <div className="preview-badge">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M12 2v6m0 4v6m0 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
            SUGGESTION PREVIEW
          </div>
          <div className="suggestion-info">
            <span className={`confidence-badge ${item._suggestion.confidence_score >= 80 ? 'high' : item._suggestion.confidence_score >= 60 ? 'medium' : 'low'}`}>
              {item._suggestion.confidence_score}% Confidence
            </span>
            <span className="action-type">
              {item._suggestion.action_type === 'add_item' ? 'New Item' : 'Update Item'}
            </span>
          </div>
        </div>
      )}

      <div className="detail-content">
        <div className="detail-image-section">
          {(isEditMode || isAddMode) && isUserItem ? (
            // Show ImageUpload component in edit/add mode
            <ImageUpload
              existingImages={item.images || []}
              onImagesChange={(newFiles, removedIndices) => {
                setUploadImages(newFiles);
                setRemoveImageIndices(removedIndices);
              }}
              onReorder={async (newOrder) => {
                if (item.user_item_id) {
                  await reorderItemImages({
                    variables: { user_item_id: item.user_item_id, image_ids: newOrder },
                    refetchQueries: [{ query: MY_COLLECTION_TREE }]
                  });
                }
              }}
              maxImages={10}
            />
          ) : (
            // Show existing image display in view mode
            <div className={`detail-image ${showAsWishlist ? 'detail-image-unowned' : ''}`} style={{
              background: getItemImage(),
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
              {/* Type icon for items without images */}
              {typeIcon && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%'
                }}>
                  {typeIcon}
                </div>
              )}

              {/* Representative/child images - special handling for 1 or 2 images */}
              {!item.image_url && imagesToDisplay.length === 1 && (
                <div
                  className="child-image-single"
                  style={{ backgroundImage: `url(${imagesToDisplay[0]})` }}
                />
              )}

              {!item.image_url && imagesToDisplay.length === 2 && (
                <div className="child-images-grid child-images-diagonal">
                  <div className="child-image" style={{ backgroundImage: `url(${imagesToDisplay[0]})` }} />
                  <div className="child-image child-image-empty" />
                  <div className="child-image child-image-empty" />
                  <div className="child-image" style={{ backgroundImage: `url(${imagesToDisplay[1]})` }} />
                </div>
              )}

              {/* Standard grid for 3+ images */}
              {!item.image_url && imagesToDisplay.length >= 3 && (
                <div className="child-images-grid">
                  {displayImages.map((imageUrl, idx) => (
                    <div
                      key={idx}
                      className={`child-image ${hasMoreImages && idx === 3 ? 'child-image-more' : ''}`}
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    >
                      {hasMoreImages && idx === 3 && (
                        <div className="more-indicator">
                          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <circle cx="4" cy="12" r="2" fill="white"/>
                            <circle cx="12" cy="12" r="2" fill="white"/>
                            <circle cx="20" cy="12" r="2" fill="white"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="detail-info-section">
          <div className="detail-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Editable collection name */}
              {isEditMode && isCustomCollection(item.type) ? (
                <input
                  type="text"
                  value={editCollectionName}
                  onChange={(e) => setEditCollectionName(e.target.value)}
                  className="detail-title-edit"
                  placeholder="Collection name"
                />
              ) : (
                <h2 className="detail-title" style={{ margin: 0 }}>{item.name}</h2>
              )}
              {/* Edit icon for custom collections - Hidden on mobile (use CircularMenu) */}
              {!isSuggestionPreview && isAuthenticated && isCustomCollection(item.type) && (
                <div className="desktop-only-actions" style={{ display: 'flex', gap: '8px' }}>
                  {isEditMode ? (
                    <button
                      className="icon-btn save-icon"
                      onClick={handleSave}
                      disabled={isSaving}
                      title="Save changes"
                    >
                      <i className="fas fa-save"></i>
                    </button>
                  ) : (
                    <>
                      <button
                        className="icon-btn edit-icon"
                        onClick={() => handleSetEditMode(true)}
                        title="Edit collection"
                      >
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {onDeleteCollection && (
                        <button
                          className="icon-btn delete-icon"
                          onClick={onDeleteCollection}
                          title="Delete collection"
                          style={{ color: '#ef4444' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              {/* Edit icon for linked collections - Hidden on mobile (use CircularMenu) */}
              {!isSuggestionPreview && isAuthenticated && isLinkedCollection(item.type) && (
                <div className="desktop-only-actions" style={{ display: 'flex', gap: '8px' }}>
                  {isEditMode ? (
                    <button
                      className="icon-btn save-icon"
                      onClick={handleSave}
                      disabled={isSaving}
                      title="Save changes"
                    >
                      <i className="fas fa-save"></i>
                    </button>
                  ) : (
                    <>
                      <button
                        className="icon-btn edit-icon"
                        onClick={() => handleSetEditMode(true)}
                        title="Move collection"
                      >
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {onDeleteCollection && (
                        <button
                          className="icon-btn delete-icon"
                          onClick={onDeleteCollection}
                          title="Delete collection"
                          style={{ color: '#ef4444' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              {/* View Full Page icon for non-custom collections - Hidden on mobile and in wishlist mode */}
              {isCollectionType(item.type) && !isCustomCollection(item.type) && !isLinkedCollection(item.type) && !isWishlistMode && onNavigateToCollection && (
                <button
                  className="icon-btn desktop-only-actions"
                  onClick={() => {
                    onNavigateToCollection(item);
                    onClose();
                  }}
                  title="View full page"
                >
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              {/* Edit/Save/Delete icons for user items - Hidden on mobile (use CircularMenu) */}
              {!isSuggestionPreview && isAuthenticated && !isCollectionType(item.type) && isUserItem && (
                <div className="desktop-only-actions" style={{ display: 'flex', gap: '8px' }}>
                  {isEditMode ? (
                    <>
                      <button
                        className="icon-btn save-icon"
                        onClick={handleSave}
                        disabled={isSaving}
                        title="Save changes"
                      >
                        <i className="fas fa-save"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="icon-btn edit-icon"
                        onClick={() => handleSetEditMode(true)}
                        title="Edit item"
                      >
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {onDeleteItem && (
                        <button
                          className="icon-btn delete-icon"
                          onClick={onDeleteItem}
                          title="Delete item"
                        >
                          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              {/* Save icon for add mode - Hidden on mobile (use CircularMenu) */}
              {!isSuggestionPreview && isAuthenticated && !isCollectionType(item.type) && isAddMode && (
                <button
                  className="icon-btn save-icon desktop-only-actions"
                  onClick={handleSave}
                  disabled={isSaving}
                  title="Add to collection"
                >
                  <i className="fas fa-save"></i>
                </button>
              )}
              {/* Add to Collection icon for non-owned items - Hidden on mobile (use CircularMenu) */}
              {!isSuggestionPreview && isAuthenticated && !isCollectionType(item.type) && !isUserItem && !isAddMode && (
                <button
                  className="icon-btn add-icon desktop-only-actions"
                  onClick={handleEnterAddMode}
                  title="Add to collection"
                >
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
              {/* Save icon for wishlist mode (linking DBoT collection) - Hidden on mobile (use CircularMenu) */}
              {!isSuggestionPreview && isAuthenticated && isCollectionType(item.type) && isWishlistMode && (
                <button
                  className="icon-btn save-icon desktop-only-actions"
                  onClick={handleSave}
                  disabled={isWishlisting || !wishlistCollectionName.trim()}
                  title="Create linked collection"
                >
                  <i className="fas fa-save"></i>
                </button>
              )}
            </div>
            <p className="detail-subtitle">
              {isLinkedCollection(item.type) ? 'LINKED' : formatEntityType(item.type)}
              {item.year && ` • ${item.year}`}
            </p>
          </div>

          {/* Collection Description - Editable for custom collections */}
          {isCustomCollection(item.type) && (
            <div>
              <label className="meta-label" style={{ display: 'block', marginBottom: '6px' }}>Description:</label>
              {isEditMode ? (
                <textarea
                  className="notes-textarea-inline"
                  value={editCollectionDescription}
                  onChange={(e) => setEditCollectionDescription(e.target.value)}
                  placeholder="Add a description for this collection..."
                  rows={3}
                />
              ) : (
                <p className="meta-value notes-value" style={{ margin: 0, lineHeight: 1.6 }}>
                  {item.description || 'No description'}
                </p>
              )}
            </div>
          )}

          {/* Wishlist Mode UI - Creates linked collection */}
          {isWishlistMode && isCollectionType(item.type) && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label className="meta-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Collection Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="collection-name-input"
                  value={wishlistCollectionName}
                  onChange={(e) => setWishlistCollectionName(e.target.value)}
                  placeholder="Enter a name for your collection"
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            </div>
          )}

          {/* Metadata Section (DBoT attributes - read-only) */}
          {(() => {
            // Parse item attributes
            let attributes = item.attributes;
            if (typeof attributes === 'string') {
              try {
                attributes = JSON.parse(attributes);
              } catch (e) {
                attributes = {};
              }
            }

            const hasAttributes = attributes && typeof attributes === 'object' && Object.keys(attributes).length > 0;

            return hasAttributes && (
              <table className="detail-metadata-table">
                <tbody>
                  {/* Database of Things attributes (read-only) */}
                  {Object.entries(attributes)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, value]) => (
                      <tr key={key}>
                        <td className="meta-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                        <td className="meta-value">{Array.isArray(value) ? value.join(', ') : value}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            );
          })()}

          {/* Notes Section - Always shown for owned items */}
          {(isUserItem || isAddMode) && (
            <div>
              <label className="meta-label" style={{ display: 'block', marginBottom: '6px' }}>Notes:</label>
              {(isEditMode || isAddMode) ? (
                <textarea
                  className="notes-textarea-inline"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add your notes about this item..."
                  rows={3}
                />
              ) : (
                <p className="meta-value notes-value" style={{ margin: 0, lineHeight: 1.6 }}>
                  {item.user_notes || ''}
                </p>
              )}
            </div>
          )}

          {/* Collection Picker - Shows in add/edit/wishlist mode */}
          {!isSuggestionPreview && (isEditMode || isAddMode || isWishlistMode) && (
            <div>
              <h5 className="collections-tree-header">
                {isWishlistMode ? 'Parent Collection' : 'Collection'}
              </h5>
              <CollectionPickerTree
                selectedId={isWishlistMode ? wishlistTargetCollectionId : selectedCollection}
                onSelect={isWishlistMode ? setWishlistTargetCollectionId : setSelectedCollection}
                expandedIds={expandedIds}
                excludeCollectionId={isCustomCollection(item.type) || isLinkedCollection(item.type) ? item.id : null}
                isAuthenticated={isAuthenticated}
              />
            </div>
          )}

          {/* Collections Tree View */}
          {!isSuggestionPreview && !isEditMode && !isAddMode && !isWishlistMode && (
            <>
              {/* Show user collection hierarchy for owned items, linked collections, and custom collections */}
              {(isUserItem || isLinkedCollection(item.type) || isCustomCollection(item.type)) && (
                <div className="detail-collections-tree">
                  <h5 className="collections-tree-header">Collections</h5>
                  <div className="collections-tree-list">
                    {collectionsLoading ? (
                      <CollectionTreeSkeleton count={1} />
                    ) : (
                      <ul className="tree-list">
                        {/* Show path in reverse order (most specific first) like DBoT collections */}
                        {[...userCollectionPath].reverse().map((collection, index) => (
                          <li key={collection.id} className="tree-item">
                            <button
                              className="tree-collection-link"
                              style={{ paddingLeft: `${12 + (index * 20)}px` }}
                              onClick={() => {
                                // Navigate to this collection
                                if (onNavigateToCollection) {
                                  onNavigateToCollection({ ...collection, type: 'user_collection' });
                                }
                                onClose();
                              }}
                              title={`View ${collection.name}`}
                            >
                              {index > 0 && (
                                <svg className="tree-branch" viewBox="0 0 16 16" width="16" height="16">
                                  <path d="M8 0 L8 8 L16 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                </svg>
                              )}
                              <span className="tree-collection-name">
                                {collection.name}
                              </span>
                              <svg className="tree-arrow" viewBox="0 0 24 24" fill="none" width="16" height="16">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </li>
                        ))}
                        {/* Always show "My Collection" root at the bottom */}
                        <li className="tree-item">
                          <button
                            className="tree-collection-link"
                            style={{ paddingLeft: `${12 + (userCollectionPath.length * 20)}px` }}
                            onClick={() => {
                              // Navigate to root of My Collection
                              if (onNavigateToCollection) {
                                onNavigateToCollection({ id: null, name: 'My Collection', type: 'user_collection' });
                              }
                              onClose();
                            }}
                            title="View My Collection"
                          >
                            {userCollectionPath.length > 0 && (
                              <svg className="tree-branch" viewBox="0 0 16 16" width="16" height="16">
                                <path d="M8 0 L8 8 L16 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              </svg>
                            )}
                            <span className="tree-collection-name">
                              My Collection
                            </span>
                            <svg className="tree-arrow" viewBox="0 0 24 24" fill="none" width="16" height="16">
                              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Show DBoT parent collections for non-owned items (excluding linked and custom collections) */}
              {!isUserItem && !isLinkedCollection(item.type) && !isCustomCollection(item.type) && (parentsLoading || parentCollections.length > 0) && (
                <div className="detail-collections-tree">
                  <h5 className="collections-tree-header">Collections</h5>
                  <div className="collections-tree-list">
                    {parentsLoading ? (
                      <CollectionTreeSkeleton count={3} />
                    ) : (
                      <ul className="tree-list">
                        {parentCollections.map((parent) => (
                          <CollectionTreeNode
                            key={parent.id}
                            collection={parent}
                            depth={0}
                            onNavigateToCollection={onNavigateToCollection}
                            onClose={onClose}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Show suggestion actions in preview mode */}
          {isSuggestionPreview ? (
            <div className="suggestion-actions-section">
              {item._suggestion && (
                <div className="suggestion-reasoning">
                  <h4>AI Reasoning:</h4>
                  <p>{item._suggestion.reasoning}</p>
                </div>
              )}

              <div className="suggestion-action-buttons">
                <button
                  className="suggestion-accept-btn"
                  onClick={onAcceptSuggestion}
                >
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Accept Suggestion
                </button>

                <button
                  className="suggestion-reject-btn"
                  onClick={onRejectSuggestion}
                >
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Reject Suggestion
                </button>
              </div>
            </div>
          ) : null}

          {/* Additional details if available */}
          {item.metadata?.description && (
            <div className="detail-description">
              <h3>Description</h3>
              <p>{item.metadata.description}</p>
            </div>
          )}

          {item.metadata?.artist && (
            <div className="detail-extra">
              <span className="extra-label">Artist:</span>
              <span className="extra-value">{item.metadata.artist}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ItemDetailContent;
