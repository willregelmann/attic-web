import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery, useLazyQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { useState, useEffect, useMemo, memo } from 'react';
import { GET_DATABASE_OF_THINGS_ITEM_PARENTS, GET_DATABASE_OF_THINGS_COLLECTION_ITEMS, UPDATE_MY_ITEM, UPDATE_USER_COLLECTION, CREATE_USER_COLLECTION, BATCH_ADD_ITEMS_TO_MY_COLLECTION, MY_COLLECTION_TREE, MOVE_USER_ITEM, MOVE_USER_COLLECTION, ADD_COLLECTION_TO_WISHLIST, GET_MY_ITEMS, UPLOAD_ITEM_IMAGES, REORDER_ITEM_IMAGES, GET_MY_ITEM, ADD_CUSTOM_ITEM_TO_MY_COLLECTION } from '../queries';
import { formatEntityType, isCollectionType, isCustomCollection, isLinkedCollection } from '../utils/formatters';
import { isFormBusy } from '../utils/formUtils';
import { CollectionTreeSkeleton } from './SkeletonLoader';
import { CollectionPickerTree } from './CollectionPickerTree';
import { ImageUpload } from './ImageUpload';
import { getTypeIcon } from '../utils/iconUtils.jsx';
import { IconButton } from './IconButton';
// Tailwind CSS - no external CSS imports needed

// Recursive component to render collection tree - memoized to prevent unnecessary re-renders
const CollectionTreeNode = memo(({ collection, depth = 0, onNavigateToCollection, onClose }) => {
  const hasParents = collection.parents && collection.parents.length > 0;

  return (
    <li className="m-0 p-0 block">
      <button
        className="w-full flex items-center gap-2 py-1 bg-transparent border-none text-left cursor-pointer transition-opacity duration-200 hover:opacity-70"
        style={{ paddingLeft: `${12 + (depth * 20)}px` }}
        onClick={(e) => {
          e.stopPropagation();
          onNavigateToCollection?.(collection);
          // Don't call onClose() - navigation handles leaving current view
        }}
        title={`View ${collection.name}`}
      >
        {depth > 0 && (
          <svg className="flex-shrink-0 text-[var(--text-secondary)] mr-[-4px] opacity-60" viewBox="0 0 16 16" width="16" height="16">
            <path d="M8 0 L8 8 L16 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        )}
        <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">
          {collection.name}
          {collection.year && <span className="font-normal text-[var(--text-secondary)] text-[13px]"> • {collection.year}</span>}
        </span>
        <svg className="flex-shrink-0 text-[var(--text-secondary)] transition-colors duration-200" viewBox="0 0 24 24" fill="none" width="16" height="16">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {hasParents && (
        <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
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

function EntityDetail({
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
  onSavingChange = null,  // New prop: callback when saving state changes
  onActionsReady = null  // New prop: callback with actions array for parent to use with RadialMenu
}) {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const client = useApolloClient();

  // Edit mode state for user items
  const [isEditMode, setIsEditMode] = useState(externalEditMode);
  const [editName, setEditName] = useState('');  // For custom items
  const [editNotes, setEditNotes] = useState('');
  const [editVariant, setEditVariant] = useState(null);
  const [viewVariant, setViewVariant] = useState(null);  // For browsing DBoT item variants
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

  // Sync external modes with internal state
  useEffect(() => {
    setIsEditMode(externalEditMode);
  }, [externalEditMode]);

  useEffect(() => {
    setIsAddMode(externalAddMode);
  }, [externalAddMode]);

  useEffect(() => {
    setIsWishlistMode(externalWishlistMode);
  }, [externalWishlistMode]);

  // Initialize edit state when item changes
  useEffect(() => {
    // Initialize for custom item creation (no entity_id or id)
    if (isAddMode && !item.entity_id && !item.id) {
      setEditName('');
      setEditNotes('');
      setUploadImages([]);
    } else if (isUserItem && item) {
      setEditNotes(item.user_notes || '');
      setEditVariant(item.variant_id || null);
      // Store the original parent collection ID
      setOriginalParentCollectionId(item.parent_collection_id || null);
      setSelectedCollection(item.parent_collection_id || null);
    }

    // Initialize collection edit state
    if (item && isCustomCollection(item)) {
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
    if (item && isLinkedCollection(item)) {
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
      if ((isUserItem || isLinkedCollection(item) || isCustomCollection(item)) && item.parent_collection_id && !collectionsLoading) {
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

  // Add custom item mutation (for items not in DBoT)
  const [addCustomItem, { loading: isAddingCustom }] = useMutation(ADD_CUSTOM_ITEM_TO_MY_COLLECTION, {
    refetchQueries: [
      { query: MY_COLLECTION_TREE, variables: { parentId: null } },
      { query: MY_COLLECTION_TREE, variables: { parentId: selectedCollection } }
    ],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      if (onItemAdded && data?.addCustomItemToMyCollection) {
        onItemAdded(data.addCustomItemToMyCollection);
      }
      handleSetAddMode(false);
      onClose();
    },
    onError: (error) => {
      console.error('Failed to add custom item:', error);
      if (error.message.includes('Unauthenticated') || error.networkError?.statusCode === 401) {
        alert('You must be logged in to add items. Please log in and try again.');
      } else {
        alert('Failed to add custom item: ' + error.message);
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

  // Query to get fresh item data (for images in view mode)
  const { data: freshItemData } = useQuery(GET_MY_ITEM, {
    variables: { userItemId: item.user_item_id },
    skip: !isUserItem || !item.user_item_id,
    fetchPolicy: 'cache-first'
  });

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
      if (isWishlistMode && isCollectionType(item)) {
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
      if (isEditMode && isCustomCollection(item) && !item.id) {
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
      if (isEditMode && isCustomCollection(item)) {
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
      if (isEditMode && isLinkedCollection(item)) {
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
        // Check if we're adding a custom item (no entity_id)
        if (!item.entity_id && !item.id) {
          // Validate custom item name
          if (!editName.trim()) {
            alert('Item name cannot be empty');
            return;
          }

          // Add custom item
          if (uploadImages.length > 0 && uploadImages.every(f => f instanceof File)) {
            // Manual file upload using fetch with multipart/form-data
            const token = localStorage.getItem('token');
            const formData = new FormData();

            // Build GraphQL multipart request according to spec
            const operations = {
              query: `
                mutation AddCustomItemToMyCollection($name: String!, $parentCollectionId: ID, $notes: String, $images: [Upload!]) {
                  addCustomItemToMyCollection(name: $name, parent_collection_id: $parentCollectionId, notes: $notes, images: $images) {
                    id
                    name
                    entity_id
                    user_id
                    notes
                    images {
                      id
                      original
                      thumbnail
                    }
                    created_at
                  }
                }
              `,
              variables: {
                name: editName.trim(),
                notes: editNotes.trim() || null,
                parentCollectionId: selectedCollection || null,
                images: uploadImages.map(() => null)
              }
            };

            formData.append('operations', JSON.stringify(operations));

            const map = {};
            uploadImages.forEach((file, index) => {
              map[index] = [`variables.images.${index}`];
            });
            formData.append('map', JSON.stringify(map));

            uploadImages.forEach((file, index) => {
              formData.append(index.toString(), file);
            });

            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/graphql`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              credentials: 'include',
              body: formData
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Upload failed:', response.status, errorText);
              throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.errors) {
              console.error('GraphQL errors:', result.errors);
              throw new Error(result.errors[0].message);
            }

            // Clear upload state
            setUploadImages([]);

            // Refetch queries to update the UI
            await client.refetchQueries({
              include: [
                { query: MY_COLLECTION_TREE, variables: { parentId: null } },
                { query: MY_COLLECTION_TREE, variables: { parentId: selectedCollection } }
              ]
            });

            // Call onItemAdded callback with the result
            if (onItemAdded && result.data?.addCustomItemToMyCollection) {
              onItemAdded(result.data.addCustomItemToMyCollection);
            }

            handleSetAddMode(false);
            onClose();
          } else {
            // No images - use Apollo Client directly
            await addCustomItem({
              variables: {
                name: editName.trim(),
                notes: editNotes.trim() || null,
                parentCollectionId: selectedCollection || null,
                images: null
              }
            });

            // Success handled by mutation's onCompleted
          }
          return;
        }

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
            variantId: editVariant || null,
            notes: editNotes
          }
        });

        // Handle image uploads if any
        if (uploadImages.length > 0 || removeImageIndices.length > 0) {
          if (uploadImages.length > 0 && uploadImages.every(f => f instanceof File)) {
            // Manual file upload using fetch with multipart/form-data
            const token = localStorage.getItem('token');
            const formData = new FormData();

            // Build GraphQL multipart request according to spec
            const operations = {
              query: `
                mutation UploadItemImages($user_item_id: ID!, $images: [Upload!], $remove_image_indices: [Int!]) {
                  updateMyItem(user_item_id: $user_item_id, images: $images, remove_image_indices: $remove_image_indices) {
                    id images entity_id notes metadata
                  }
                }
              `,
              variables: {
                user_item_id: item.user_item_id,
                images: uploadImages.map(() => null),
                remove_image_indices: removeImageIndices.length > 0 ? removeImageIndices : undefined
              }
            };

            formData.append('operations', JSON.stringify(operations));

            const map = {};
            uploadImages.forEach((file, index) => {
              map[index] = [`variables.images.${index}`];
            });
            formData.append('map', JSON.stringify(map));

            uploadImages.forEach((file, index) => {
              formData.append(index.toString(), file);
            });

            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/graphql`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              credentials: 'include',
              body: formData
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Upload failed:', response.status, errorText);
              throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.errors) {
              console.error('GraphQL errors:', result.errors);
              throw new Error(result.errors[0].message);
            }

            // Clear upload state
            setUploadImages([]);
            setRemoveImageIndices([]);

            // Refetch queries to update the UI
            await client.refetchQueries({
              include: [
                { query: MY_COLLECTION_TREE },
                { query: GET_MY_ITEM, variables: { userItemId: item.user_item_id } }
              ]
            });
          } else if (removeImageIndices.length > 0) {
            // Just removing images, no files to upload
            await uploadItemImages({
              variables: {
                user_item_id: item.user_item_id,
                remove_image_indices: removeImageIndices
              },
              refetchQueries: [
                { query: MY_COLLECTION_TREE },
                { query: GET_MY_ITEM, variables: { userItemId: item.user_item_id } }
              ],
              awaitRefetchQueries: true
            });
          }
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
    // Carry over selected variant from view mode
    setEditVariant(viewVariant);
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

  // Selected image index for user-uploaded images
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Reset selected image index when item changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [item.id]);

  // Determine if this is a user collection (custom or linked)
  const isUserCollection = isCustomCollection(item) || isLinkedCollection(item) ||
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
    if (!item.image_url && !hasRepresentativeImages && isCollectionType(item) && item.id) {
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
    if (!childrenData?.databaseOfThingsCollectionItems?.edges) return;

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

    // Extract nodes from edges
    const items = childrenData.databaseOfThingsCollectionItems.edges.map(e => e.node);
    const images = findChildImages(items);
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
    // Priority 1: User uploaded image (for owned items)
    // Use freshItemData if available (has latest cache data), otherwise fall back to prop
    const freshItem = freshItemData?.myItem || item;
    const userImages = freshItem.user_images || freshItem.images;
    if (isUserItem && userImages && userImages.length > 0) {
      const userImage = userImages[selectedImageIndex] || userImages[0]; // Use selected image
      // Image path needs /storage/ prefix
      const imagePath = userImage.original || userImage.original_url;
      return `url(/storage/${imagePath})`;
    }

    // Priority 2: Variant image (when viewing a variant for DBoT items)
    if (viewVariant && freshItem.entity_variants && freshItem.entity_variants.length > 0) {
      const variant = freshItem.entity_variants.find(v => v.id === viewVariant);
      if (variant && variant.image_url) {
        return `url(${variant.image_url})`;
      }
    }

    // Priority 3: DBoT canonical image - use full quality for detail view
    // Check both image_url and thumbnail_url (some entities only have thumbnail)
    const canonicalImage = freshItem.image_url || freshItem.thumbnail_url;
    if (canonicalImage) {
      return `url(${canonicalImage})`;
    }

    // Priority 4: No background when no images are available (just show icon)
    return 'none';
  };

  // Use representative images if available, otherwise use client-side fetched child images
  const imagesToDisplay = hasRepresentativeImages ? representativeImages : childImages;
  const hasMoreImages = imagesToDisplay.length > 4;
  const displayImages = hasMoreImages ? imagesToDisplay.slice(0, 4) : imagesToDisplay;

  // Determine icon color and get icon
  const iconColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const freshItem = freshItemData?.myItem || item;
  const userImages = freshItem.user_images || freshItem.images;
  const hasUserImages = isUserItem && userImages && userImages.length > 0;
  const shouldShowIcon = !hasUserImages && !freshItem.image_url && imagesToDisplay.length === 0;
  const typeIcon = shouldShowIcon ? getTypeIcon(freshItem.type, iconColor, 96) : null;

  // Build actions array for header buttons and RadialMenu
  const headerActions = useMemo(() => {
    const actions = [];

    // Icons as React elements
    const editIcon = (
      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
    const deleteIcon = (
      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
    const addIcon = (
      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );

    // Custom collections
    if (!isSuggestionPreview && isAuthenticated && isCustomCollection(item)) {
      if (isEditMode) {
        actions.push({
          id: 'save-collection',
          icon: 'fas fa-save',
          label: 'Save changes',
          onClick: handleSave,
          disabled: isSaving,
          variant: 'success',
          testid: 'save-collection-btn'
        });
      } else {
        actions.push({
          id: 'edit-collection',
          icon: editIcon,
          label: 'Edit collection',
          onClick: () => handleSetEditMode(true),
          testid: 'edit-collection-btn'
        });
        if (onDeleteCollection) {
          actions.push({
            id: 'delete-collection',
            icon: deleteIcon,
            label: 'Delete collection',
            onClick: onDeleteCollection,
            variant: 'danger'
          });
        }
      }
    }

    // Linked collections
    if (!isSuggestionPreview && isAuthenticated && isLinkedCollection(item)) {
      if (isEditMode) {
        actions.push({
          id: 'save-linked',
          icon: 'fas fa-save',
          label: 'Save changes',
          onClick: handleSave,
          disabled: isSaving,
          variant: 'success'
        });
      } else {
        actions.push({
          id: 'edit-linked',
          icon: editIcon,
          label: 'Move collection',
          onClick: () => handleSetEditMode(true)
        });
        if (onDeleteCollection) {
          actions.push({
            id: 'delete-linked',
            icon: deleteIcon,
            label: 'Delete collection',
            onClick: onDeleteCollection,
            variant: 'danger'
          });
        }
      }
    }

    // User items (owned)
    if (!isSuggestionPreview && isAuthenticated && !isCollectionType(item) && isUserItem) {
      if (isEditMode) {
        actions.push({
          id: 'save-item',
          icon: 'fas fa-save',
          label: 'Save changes',
          onClick: handleSave,
          disabled: isSaving,
          variant: 'success',
          testid: 'save-item-btn'
        });
      } else {
        actions.push({
          id: 'edit-item',
          icon: editIcon,
          label: 'Edit item',
          onClick: () => handleSetEditMode(true),
          testid: 'edit-item-btn'
        });
        if (onDeleteItem) {
          actions.push({
            id: 'delete-item',
            icon: deleteIcon,
            label: 'Delete item',
            onClick: onDeleteItem,
            variant: 'danger',
            testid: 'delete-item-btn'
          });
        }
      }
    }

    // Add mode (saving new item)
    if (!isSuggestionPreview && isAuthenticated && !isCollectionType(item) && isAddMode) {
      actions.push({
        id: 'save-add',
        icon: 'fas fa-save',
        label: 'Add to collection',
        onClick: handleSave,
        disabled: isSaving,
        variant: 'success'
      });
    }

    // Add to collection for DBoT items
    if (!isSuggestionPreview && isAuthenticated && !isCollectionType(item) && !isUserItem && !isAddMode) {
      actions.push({
        id: 'add-to-collection',
        icon: addIcon,
        label: 'Add to collection',
        onClick: handleEnterAddMode
      });
    }

    // Wishlist mode (linking DBoT collection)
    if (!isSuggestionPreview && isAuthenticated && isCollectionType(item) && isWishlistMode) {
      actions.push({
        id: 'save-wishlist',
        icon: 'fas fa-save',
        label: 'Create linked collection',
        onClick: handleSave,
        disabled: isWishlisting || !wishlistCollectionName.trim(),
        variant: 'success'
      });
    }

    return actions;
  }, [
    isSuggestionPreview, isAuthenticated, item.type, isEditMode, isSaving, isWishlistMode,
    onNavigateToCollection, onClose, isUserItem, onDeleteItem, isAddMode, onDeleteCollection,
    handleSave, handleSetEditMode, handleEnterAddMode, isWishlisting, wishlistCollectionName, item
  ]);

  // Notify parent of actions for RadialMenu
  useEffect(() => {
    if (onActionsReady) {
      onActionsReady(headerActions);
    }
  }, [headerActions, onActionsReady]);

  return (
    <>
      {/* Suggestion Preview Header */}
      {isSuggestionPreview && item._suggestion && (
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-900 text-white py-4 px-6 flex flex-col md:flex-row justify-between items-center rounded-t-2xl -m-px mb-0 gap-3">
          <div className="flex items-center gap-2 font-semibold text-sm tracking-wide">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M12 2v6m0 4v6m0 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
            SUGGESTION PREVIEW
          </div>
          <div className="flex gap-3 items-center">
            <span className={`py-1 px-3 rounded-full text-[13px] font-medium ${item._suggestion.confidence_score >= 80 ? 'bg-emerald-300/30' : item._suggestion.confidence_score >= 60 ? 'bg-yellow-400/30' : 'bg-red-500/30'}`}>
              {item._suggestion.confidence_score}% Confidence
            </span>
            <span className="py-1 px-3 bg-white/20 rounded-full text-[13px] font-medium">
              {item._suggestion.action_type === 'add_item' ? 'New Item' : 'Update Item'}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row !p-4 md:!p-8 !gap-4 md:!gap-8">
        <div className="flex-shrink-0 w-full md:w-[280px]">
          {(isEditMode || isAddMode) && (isUserItem || (!item.entity_id && !item.id)) ? (
            // Show ImageUpload component in edit/add mode (for user items and custom items)
            <ImageUpload
              key={`image-upload-${item.user_item_id}-${(freshItem.user_images || freshItem.images || []).map(i => i.id).join(',')}`}
              existingImages={freshItem.user_images || freshItem.images || []}
              onImagesChange={(newFiles, removedIndices) => {
                setUploadImages(newFiles);
                setRemoveImageIndices(removedIndices);
              }}
              onReorder={async (newOrder) => {
                if (item.user_item_id) {
                  await reorderItemImages({
                    variables: { user_item_id: item.user_item_id, image_ids: newOrder },
                    refetchQueries: [
                      { query: MY_COLLECTION_TREE },
                      { query: GET_MY_ITEM, variables: { userItemId: item.user_item_id } }
                    ],
                    awaitRefetchQueries: true
                  });
                }
              }}
              maxImages={10}
            />
          ) : (
            // Show existing image display in view mode
            <div
              className={`w-full md:w-[280px] h-[240px] md:h-[360px] rounded-xl relative flex items-center justify-center p-4 bg-contain bg-center bg-no-repeat ${showAsWishlist ? 'opacity-50 grayscale-[50%]' : ''}`}
              style={{
                backgroundImage: getItemImage()
              }}>
              {/* Type icon for items without images */}
              {typeIcon && (
                <div className="flex items-center justify-center w-full h-full">
                  {typeIcon}
                </div>
              )}

              {/* Representative/child images - special handling for 1 or 2 images */}
              {!item.image_url && imagesToDisplay.length === 1 && (
                <div
                  className="absolute inset-1 bg-cover bg-center rounded-lg"
                  style={{ backgroundImage: `url(${imagesToDisplay[0]})` }}
                />
              )}

              {!item.image_url && imagesToDisplay.length === 2 && (
                <div className="absolute inset-1 grid grid-cols-2 grid-rows-2 gap-1 rounded-lg overflow-hidden">
                  <div className="bg-cover bg-center" style={{ backgroundImage: `url(${imagesToDisplay[0]})` }} />
                  <div className="bg-transparent" />
                  <div className="bg-transparent" />
                  <div className="bg-cover bg-center" style={{ backgroundImage: `url(${imagesToDisplay[1]})` }} />
                </div>
              )}

              {/* Standard grid for 3+ images */}
              {!item.image_url && imagesToDisplay.length >= 3 && (
                <div className="absolute inset-1 grid grid-cols-2 grid-rows-2 gap-1 rounded-lg overflow-hidden">
                  {displayImages.map((imageUrl, idx) => (
                    <div
                      key={idx}
                      className={`bg-cover bg-center relative ${hasMoreImages && idx === 3 ? 'after:absolute after:inset-0 after:bg-black/40' : ''}`}
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    >
                      {hasMoreImages && idx === 3 && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
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

          {/* Image gallery thumbnails (show all images) */}
          {!isEditMode && !isAddMode && isUserItem && (freshItem.user_images || freshItem.images || []).length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap w-full md:w-[280px]">
              {(freshItem.user_images || freshItem.images || []).map((img, idx) => (
                <div
                  key={img.id || idx}
                  className={`w-[60px] h-[60px] rounded-lg bg-cover bg-center cursor-pointer border-2 transition-all duration-200 hover:scale-105 hover:border-blue-500 ${idx === selectedImageIndex ? 'border-blue-500 border-[3px] shadow-[0_0_0_2px_rgba(59,130,246,0.2)]' : 'border-gray-200'}`}
                  style={{ backgroundImage: `url(/storage/${img.thumbnail || img.original})` }}
                  onClick={() => setSelectedImageIndex(idx)}
                  title={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col" style={{ gap: (!isEditMode && !isAddMode && isUserItem) ? '0' : undefined }}>
            <div className="flex items-center gap-3">
              {/* Editable collection name */}
              {isEditMode && isCustomCollection(item) ? (
                <input
                  type="text"
                  value={editCollectionName}
                  onChange={(e) => setEditCollectionName(e.target.value)}
                  className="text-xl md:text-2xl font-bold text-[var(--text-primary)] m-0 py-2 px-3 border-2 border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] flex-1 max-w-full md:max-w-[350px] min-w-0 font-[inherit] focus:outline-none focus:border-[var(--bright-blue)] focus:shadow-[0_0_0_3px_rgba(74,144,226,0.15)]"
                  placeholder="Collection name"
                  data-testid="collection-name-input"
                />
              ) : (
                <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] m-0">{item.name}</h2>
              )}
              {/* Action buttons - Hidden on mobile (use RadialMenu) */}
              {headerActions.length > 0 && (
                <div className="hidden md:flex gap-2">
                  {headerActions.map(action => (
                    <IconButton key={action.id} action={action} />
                  ))}
                </div>
              )}
            </div>

            {/* Variant Selection - Shown between title and subtitle */}
            {(() => {
              if (!item.entity_variants || item.entity_variants.length === 0) return null;

              const variants = item.entity_variants;
              const isDBoTItem = !isUserItem && !isAddMode;

              return (
                <div style={{ marginTop: (isEditMode || isAddMode || isDBoTItem) ? '8px' : '4px' }}>
                  {(isEditMode || isAddMode || isDBoTItem) ? (
                    <select
                      className="w-full py-1.5 px-2 border rounded text-[13px]"
                      value={isDBoTItem ? (viewVariant || '') : (editVariant || '')}
                      onChange={(e) => {
                        const newValue = e.target.value || null;
                        if (isDBoTItem) {
                          setViewVariant(newValue);
                        } else {
                          setEditVariant(newValue);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#ddd'}`,
                        borderRadius: '4px',
                        fontSize: '13px',
                        backgroundColor: isDarkMode ? '#1f2937' : 'white',
                        color: isDarkMode ? '#f3f4f6' : '#1f2937'
                      }}
                    >
                      <option value="">Base</option>
                      {variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p style={{ margin: '0 0 2px 0', fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', fontStyle: 'italic' }}>
                      {(() => {
                        // In view mode for user items, check item.variant_id (from backend)
                        // In edit mode, check editVariant (from state)
                        const variantId = isUserItem ? item.variant_id : editVariant;
                        if (variantId) {
                          const variant = variants.find(v => v.id === variantId);
                          return variant ? variant.name : 'Base';
                        }
                        return 'Base';
                      })()}
                    </p>
                  )}
                </div>
              );
            })()}

            <p className="text-sm md:text-base text-[var(--text-secondary)] mt-1 mb-0 font-medium">
              {isLinkedCollection(item) ? 'LINKED' : formatEntityType(item.type)}
              {(() => {
                // Show variant year if viewing a variant, otherwise base item year
                if (viewVariant && item.entity_variants && item.entity_variants.length > 0) {
                  const variant = item.entity_variants.find(v => v.id === viewVariant);
                  const variantYear = variant?.attributes?.year;
                  if (variantYear) return ` • ${variantYear}`;
                }
                return item.year ? ` • ${item.year}` : '';
              })()}
            </p>
          </div>

          {/* Collection Description - Editable for custom collections (not custom items) */}
          {isCustomCollection(item) && !item.user_item_id && (
            <div>
              <label className="block mb-1.5 text-xs uppercase text-[var(--text-secondary)] font-medium tracking-wide">Description:</label>
              {isEditMode ? (
                <textarea
                  className="w-full p-3 border border-[var(--border-color)] rounded-lg font-[inherit] text-sm leading-normal resize-y min-h-[80px] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                  value={editCollectionDescription}
                  onChange={(e) => setEditCollectionDescription(e.target.value)}
                  placeholder="Add a description for this collection..."
                  rows={3}
                  data-testid="collection-description-input"
                />
              ) : (
                <p className="text-sm text-[var(--text-primary)] font-normal m-0 leading-relaxed whitespace-pre-wrap">
                  {item.description || 'No description'}
                </p>
              )}
            </div>
          )}

          {/* Wishlist Mode UI - Creates linked collection */}
          {isWishlistMode && isCollectionType(item) && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label className="block mb-1.5 text-xs uppercase text-[var(--text-secondary)] font-medium tracking-wide">
                  Collection Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="w-full py-2 px-3 border border-[var(--border-color)] rounded-lg font-[inherit] text-sm leading-relaxed bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
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
              <table className="!w-full !border-collapse !my-3 md:!my-4">
                <tbody>
                  {/* Database of Things attributes (read-only) */}
                  {Object.entries(attributes)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, value]) => (
                      <tr key={key} className="!border-b !border-[var(--border-color)] last:!border-0">
                        <td className="!text-[10px] md:!text-xs !uppercase !text-[var(--text-secondary)] !font-medium !tracking-wide !py-1.5 md:!py-2 !pr-4 md:!pr-6 !align-top !whitespace-nowrap">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                        <td className="!text-xs md:!text-sm !text-[var(--text-primary)] !font-normal !py-1.5 md:!py-2 !align-top">{Array.isArray(value) ? value.join(', ') : value}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            );
          })()}

          {/* Name Input - For custom items only */}
          {isAddMode && !item.entity_id && !item.id && (
            <div style={{ marginBottom: '16px' }}>
              <label className="block mb-1.5 text-xs uppercase text-[var(--text-secondary)] font-medium tracking-wide">
                Item Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="w-full py-2 px-3 border border-[var(--border-color)] rounded-lg font-[inherit] text-sm leading-relaxed bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter item name"
                style={{ width: '100%', padding: '8px' }}
                autoFocus
                maxLength={255}
              />
            </div>
          )}

          {/* Notes Section - Always shown for owned items */}
          {(isUserItem || isAddMode) && (
            <div>
              <label className="block mb-1.5 text-xs uppercase text-[var(--text-secondary)] font-medium tracking-wide">Notes:</label>
              {(isEditMode || isAddMode) ? (
                <textarea
                  className="w-full p-3 border border-[var(--border-color)] rounded-lg font-[inherit] text-sm leading-normal resize-y min-h-[80px] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add your notes about this item..."
                  rows={3}
                  data-testid="item-notes-input"
                />
              ) : (
                <p className="text-sm text-[var(--text-primary)] font-normal m-0 leading-relaxed whitespace-pre-wrap">
                  {item.user_notes || ''}
                </p>
              )}
            </div>
          )}

          {/* Collection Picker - Shows in add/edit/wishlist mode */}
          {!isSuggestionPreview && (isEditMode || isAddMode || isWishlistMode) && (
            <div>
              <h5 className="text-xs uppercase text-[var(--text-secondary)] font-medium tracking-wide m-0 mb-2">
                {isWishlistMode ? 'Parent Collection' : 'Collection'}
              </h5>
              <CollectionPickerTree
                selectedId={isWishlistMode ? wishlistTargetCollectionId : selectedCollection}
                onSelect={isWishlistMode ? setWishlistTargetCollectionId : setSelectedCollection}
                expandedIds={expandedIds}
                excludeCollectionId={isCustomCollection(item) || isLinkedCollection(item) ? item.id : null}
                isAuthenticated={isAuthenticated}
              />
            </div>
          )}

          {/* Collections Tree View */}
          {!isSuggestionPreview && !isEditMode && !isAddMode && !isWishlistMode && (
            <>
              {/* Show user collection hierarchy for owned items, linked collections, and custom collections */}
              {(isUserItem || isLinkedCollection(item) || isCustomCollection(item)) && (
                <div className="flex flex-col">
                  <h5 className="text-xs uppercase text-[var(--text-secondary)] font-medium tracking-wide m-0 mb-2">Collections</h5>
                  <div className="m-0 flex flex-col">
                    {collectionsLoading ? (
                      <CollectionTreeSkeleton count={1} />
                    ) : (
                      <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
                        {/* Show path in reverse order (most specific first) like DBoT collections */}
                        {[...userCollectionPath].reverse().map((collection, index) => (
                          <li key={collection.id} className="m-0 p-0 block">
                            <button
                              className="w-full flex items-center gap-2 py-1 bg-transparent border-none text-left cursor-pointer transition-opacity duration-200 hover:opacity-70"
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
                                <svg className="flex-shrink-0 text-[var(--text-secondary)] mr-[-4px] opacity-60" viewBox="0 0 16 16" width="16" height="16">
                                  <path d="M8 0 L8 8 L16 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                </svg>
                              )}
                              <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">
                                {collection.name}
                              </span>
                              <svg className="flex-shrink-0 text-[var(--text-secondary)] transition-colors duration-200" viewBox="0 0 24 24" fill="none" width="16" height="16">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </li>
                        ))}
                        {/* Always show "My Collection" root at the bottom */}
                        <li className="m-0 p-0 block">
                          <button
                            className="w-full flex items-center gap-2 py-1 bg-transparent border-none text-left cursor-pointer transition-opacity duration-200 hover:opacity-70"
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
                              <svg className="flex-shrink-0 text-[var(--text-secondary)] mr-[-4px] opacity-60" viewBox="0 0 16 16" width="16" height="16">
                                <path d="M8 0 L8 8 L16 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              </svg>
                            )}
                            <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">
                              My Collection
                            </span>
                            <svg className="flex-shrink-0 text-[var(--text-secondary)] transition-colors duration-200" viewBox="0 0 24 24" fill="none" width="16" height="16">
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
              {!isUserItem && !isLinkedCollection(item) && !isCustomCollection(item) && (
                <div className="flex flex-col">
                  <h5 className="text-xs uppercase text-[var(--text-secondary)] font-medium tracking-wide m-0 mb-2">Collections</h5>
                  <div className="m-0 flex flex-col">
                    {parentsLoading ? (
                      <CollectionTreeSkeleton count={3} />
                    ) : parentCollections.length > 0 ? (
                      <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
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
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)] m-0">No parent collections found</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Show suggestion actions in preview mode */}
          {isSuggestionPreview ? (
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl mt-6">
              {item._suggestion && (
                <div className="mb-6">
                  <h4>AI Reasoning:</h4>
                  <p>{item._suggestion.reasoning}</p>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                <button
                  className="flex-1 py-3 px-5 border-none rounded-lg font-semibold text-[15px] cursor-pointer flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all duration-200"
                  onClick={onAcceptSuggestion}
                >
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Accept Suggestion
                </button>

                <button
                  className="flex-1 py-3 px-5 rounded-lg font-semibold text-[15px] cursor-pointer flex items-center justify-center gap-2 bg-white text-red-500 border-2 border-red-500 hover:bg-red-500 hover:text-white hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] transition-all duration-200"
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
            <div className="pt-5 border-t border-[var(--medium-gray)]">
              <h3>Description</h3>
              <p>{item.metadata.description}</p>
            </div>
          )}

          {item.metadata?.artist && (
            <div className="flex items-center gap-2 py-2">
              <span className="text-sm text-[var(--text-secondary)] font-medium">Artist:</span>
              <span className="text-sm text-[var(--text-primary)]">{item.metadata.artist}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default EntityDetail;
