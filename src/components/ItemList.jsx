import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  GET_COLLECTION_ITEMS,
  GET_COLLECTIONS,
  GET_MY_FAVORITE_COLLECTIONS,
  FAVORITE_COLLECTION,
  UNFAVORITE_COLLECTION,
  UPDATE_COLLECTION,
  DELETE_COLLECTION,
  UPLOAD_COLLECTION_IMAGE
} from '../queries';
import ItemDetail from './ItemDetail';
import CuratorConfig from './CuratorConfig';
import HierarchicalSuggestions from './HierarchicalSuggestions';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import './ItemList.css';
import './CollectionAdmin.css';

function ItemList({ collection, onBack, onSelectCollection, isRootView = false, onRefresh }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, owned, missing
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [userFavorites, setUserFavorites] = useState(new Set());
  const [showManageModal, setShowManageModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // GraphQL mutations for favorites
  const [favoriteCollectionMutation] = useMutation(FAVORITE_COLLECTION);
  const [unfavoriteCollectionMutation] = useMutation(UNFAVORITE_COLLECTION);

  // GraphQL mutations for collection management
  const [updateCollection] = useMutation(UPDATE_COLLECTION, {
    onCompleted: () => {
      setFormData({ name: '', description: '', category: '' });
      setImagePreview(null);
      setSelectedFile(null);
      setIsEditMode(false);
      refetch();
    },
    onError: (err) => {
      alert(`Error updating collection: ${err.message}`);
    }
  });

  const [deleteCollection] = useMutation(DELETE_COLLECTION, {
    onCompleted: () => {
      setShowManageModal(false);
      onBack(); // Go back to collections list after deletion
    },
    onError: (err) => {
      alert(`Error deleting collection: ${err.message}`);
    }
  });

  const [uploadCollectionImage] = useMutation(UPLOAD_COLLECTION_IMAGE, {
    onCompleted: (data) => {
      setUploadingImage(false);
      // Update the image preview with the uploaded image URL
      if (data?.uploadCollectionImage?.url) {
        setImagePreview(data.uploadCollectionImage.url);
      }
      refetch();
      // Also trigger a refresh of the parent component if available
      if (onRefresh) {
        onRefresh();
      }
    },
    onError: (err) => {
      setUploadingImage(false);
      alert(`Error uploading image: ${err.message}`);
    }
  });

  // Fetch user's favorite collections from database
  const { data: favoritesData, refetch: refetchFavorites } = useQuery(GET_MY_FAVORITE_COLLECTIONS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network'
  });

  // Update local favorites state when data is fetched
  useEffect(() => {
    if (favoritesData?.myFavoriteCollections) {
      const favoriteIds = new Set(
        favoritesData.myFavoriteCollections.map(fav => fav.collection.id)
      );
      setUserFavorites(favoriteIds);
    }
  }, [favoritesData]);

  // Use different queries for root vs nested collections
  const isRoot = collection.id === 'root';

  // For root: use favorites for authenticated users, all collections for others
  const rootQuery = isAuthenticated ? GET_MY_FAVORITE_COLLECTIONS : GET_COLLECTIONS;

  const { loading, error, data, refetch } = useQuery(
    isRoot ? rootQuery : GET_COLLECTION_ITEMS,
    {
      variables: isRoot ? {} : { collectionId: collection.id },
      skip: !collection.id,
      fetchPolicy: 'cache-and-network'
    }
  );

  // Ownership data - stored locally for authenticated users
  const [userOwnership, setUserOwnership] = useState(() => {
    if (!isAuthenticated || !user) return new Set();

    // Load user's ownership from localStorage
    const storageKey = `ownership_${user.id}_${collection.id}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Save ownership changes to localStorage
  const toggleItemOwnership = (itemId) => {
    if (!isAuthenticated) {
      return; // Silently return, the UI will show the auth prompt
    }

    setUserOwnership(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }

      // Save to localStorage
      const storageKey = `ownership_${user.id}_${collection.id}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));

      return newSet;
    });
  };

  // Handler functions for collection management
  const handleEditInModal = () => {
    setFormData({
      name: collection.name,
      description: collection.metadata?.description || '',
      category: collection.metadata?.category || ''
    });
    setImagePreview(collection.primaryImage?.url || null);
    setActiveTab('edit');
    setIsEditMode(true);
  };

  const handleUpdateCollection = async (e) => {
    e.preventDefault();

    const metadata = {
      description: formData.description,
      category: formData.category
    };

    // Update the collection
    await updateCollection({
      variables: {
        id: collection.id,
        name: formData.name,
        metadata
      }
    });

    // Handle image upload if a new file was selected
    if (selectedFile && collection.id) {
      setUploadingImage(true);

      // Convert file to base64 using a Promise
      const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      try {
        const base64Data = await readFileAsBase64(selectedFile);

        await uploadCollectionImage({
          variables: {
            collectionId: collection.id,
            imageData: base64Data,
            filename: selectedFile.name,
            mimeType: selectedFile.type,
            altText: formData.name
          }
        });
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert(`Failed to upload image: ${error.message}`);
        setUploadingImage(false);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the collection "${collection.name}"? This action cannot be undone.`)) {
      await deleteCollection({
        variables: { id: collection.id }
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setFormData({ name: '', description: '', category: '' });
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveTab('details');
  };

  const handleCloseModal = () => {
    setShowManageModal(false);
    setIsEditMode(false);
    setActiveTab('details');
    setFormData({ name: '', description: '', category: '' });
    setImagePreview(null);
    setSelectedFile(null);
  };

  // Toggle collection favorite status
  const toggleFavorite = async () => {
    if (!isAuthenticated || !collection || collection.id === 'root') {
      return;
    }

    const isFavorited = userFavorites.has(collection.id);

    try {
      if (isFavorited) {
        // Remove from favorites
        await unfavoriteCollectionMutation({
          variables: { collectionId: collection.id }
        });

        // Update local state
        setUserFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(collection.id);
          return newSet;
        });
      } else {
        // Add to favorites
        await favoriteCollectionMutation({
          variables: { collectionId: collection.id }
        });

        // Update local state
        setUserFavorites(prev => {
          const newSet = new Set(prev);
          newSet.add(collection.id);
          return newSet;
        });
      }

      // Optionally refetch favorites to ensure consistency
      refetchFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Get items from the appropriate query result
  const items = useMemo(() => {
    if (isRoot) {
      // For authenticated users, extract collections from myFavoriteCollections
      if (isAuthenticated && data?.myFavoriteCollections) {
        return data.myFavoriteCollections.map(fav => fav.collection);
      }
      // For unauthenticated users, use collections directly
      return data?.collections || [];
    }
    return data?.collectionItems || [];
  }, [data, isRoot, isAuthenticated]);

  // Separate favorites from other items for root view
  const { favoriteItems, otherItems } = useMemo(() => {
    if (!isRoot || !items.length) {
      return { favoriteItems: [], otherItems: items };
    }

    // For authenticated users at root, all items are already favorites from the query
    if (isAuthenticated) {
      return { favoriteItems: items, otherItems: [] };
    }

    // For unauthenticated users, shuffle and show random collections
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { favoriteItems: [], otherItems: shuffled.slice(0, 20) }; // Show max 20 random
  }, [items, isRoot, isAuthenticated]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    // Combine favorites and others for filtering
    const allItems = isRoot ? [...favoriteItems, ...otherItems] : items;

    if (!allItems.length) return { favorites: [], others: [] };

    let filtered = allItems;

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

    // Sort by card number if available (for collections with canonical numbering)
    if (!isRoot && collection?.metadata?.has_canonical_numbering) {
      filtered = [...filtered].sort((a, b) => {
        // Parse card numbers as integers, handling various formats
        const aNum = parseInt(a.metadata?.card_number || '9999');
        const bNum = parseInt(b.metadata?.card_number || '9999');

        // If both parse as valid numbers, sort numerically
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }

        // Fallback to string comparison if not numbers
        const aStr = String(a.metadata?.card_number || '9999');
        const bStr = String(b.metadata?.card_number || '9999');
        return aStr.localeCompare(bStr, undefined, { numeric: true });
      });
    }

    // Re-separate into favorites and others if root view
    if (isRoot) {
      const filteredFavorites = filtered.filter(item => userFavorites.has(item.id));
      const filteredOthers = filtered.filter(item => !userFavorites.has(item.id));
      return { favorites: filteredFavorites, others: filteredOthers };
    }

    return { favorites: [], others: filtered };
  }, [items, favoriteItems, otherItems, isRoot, filter, searchTerm, userOwnership, userFavorites, collection]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!items.length) return { total: 0, owned: 0, percentage: 0 };
    const total = items.length;
    const owned = userOwnership.size;
    const percentage = total > 0 ? Math.round((owned / total) * 100) : 0;
    return { total, owned, percentage };
  }, [items, userOwnership]);

  if (loading) {
    return (
      <div className="item-list">
        {!isRootView && (
          <div className="back-button-wrapper">
            <button className="back-button" disabled>
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Collections
            </button>
          </div>
        )}
        <CollectionHeaderSkeleton />
        <div className="items-toolbar">
          <div className="filter-tabs">
            <button className="filter-tab active" disabled>All</button>
            <button className="filter-tab" disabled>Owned</button>
            <button className="filter-tab" disabled>Missing</button>
          </div>
        </div>
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

  const getItemImage = (item, index) => {
    // Use actual image if available, otherwise use gradient
    if (item.primaryImage?.url) {
      return `url(${item.primaryImage.url})`;
    }
    // Fallback to gradient
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    ];
    return gradients[index % gradients.length];
  };

  const shouldShowNumberBadge = (collection, item) => {
    // Check if collection has canonical numbering enabled in metadata
    if (collection?.metadata?.has_canonical_numbering) {
      return true;
    }

    // For Pokemon TCG cards, check if they have card numbers
    if (item?.metadata?.card_number || item?.name?.includes('#')) {
      return true;
    }

    // Don't show numbers for Power Rangers figures or other collections
    if (collection?.name?.includes('Power Rangers') || collection?.name?.includes('Lightning Collection')) {
      return false;
    }

    // Default: show numbers for TCG collections, hide for others
    return collection?.metadata?.tcg_set_id ? true : false;
  };

  return (
    <div className="item-list">
      {/* Back Button - only show if not root view */}
      {!isRootView && (
        <div className="back-button-wrapper">
          <button className="back-button" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Collections
          </button>
        </div>
      )}

      {/* Collection Header */}
      <div className="collection-header-detail">
        <div
          className="collection-image-large"
          style={collection?.primaryImage?.url ? {
            backgroundImage: `url(${collection.primaryImage.url})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'transparent'
          } : {
            backgroundColor: 'var(--bright-blue)'
          }}
        >
          {!collection?.primaryImage?.url && (
            <div className="image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8" cy="8" r="1" fill="currentColor"/>
                <circle cx="12" cy="8" r="1" fill="currentColor"/>
              </svg>
            </div>
          )}
        </div>
        <div className="collection-details">
          <div className="collection-title-row">
            <h1 className="collection-title">{collection.name}</h1>
            {!isRootView && isAuthenticated && (
              <div className="collection-actions">
                {/* Show admin button if user is a maintainer */}
                {collection.maintainers?.some(m => m.user_id === user.id) && (
                  <button
                    className="admin-button"
                    onClick={() => {
                      setShowManageModal(true);
                      setActiveTab('details');
                    }}
                    title="Manage Collection"
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                )}
                <button
                  className={`favorite-button ${userFavorites.has(collection.id) ? 'active' : ''}`}
                  onClick={toggleFavorite}
                  title={userFavorites.has(collection.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <svg viewBox="0 0 24 24" fill={userFavorites.has(collection.id) ? "currentColor" : "none"} width="24" height="24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="collection-meta">
            <span className="collection-type-badge">{collection.type}</span>
            <span className="collection-date">• Added 2024</span>
          </div>
          <div className="progress-section">
            <div className="progress-bar-detail">
              <div className="progress-fill-detail" style={{ width: `${stats.percentage}%` }}></div>
            </div>
            <div className="progress-text-detail">{stats.percentage}%</div>
          </div>
          <div className="completion-badge">
            <span className="star-icon">⭐</span>
            <span>{stats.owned} / {stats.total} items</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="items-toolbar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({items.length || 0})
          </button>
          <button
            className={`filter-tab ${filter === 'owned' ? 'active' : ''}`}
            onClick={() => setFilter('owned')}
          >
            Owned ({stats.owned})
          </button>
          <button
            className={`filter-tab ${filter === 'missing' ? 'active' : ''}`}
            onClick={() => setFilter('missing')}
          >
            Missing ({stats.total - stats.owned})
          </button>
        </div>

        <div className="toolbar-actions">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className="search-icon">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="4" cy="6" r="1" fill="currentColor"/>
                <circle cx="4" cy="12" r="1" fill="currentColor"/>
                <circle cx="4" cy="18" r="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Items Grid/List - Single unified grid */}
      {(filteredItems.favorites?.length > 0 || filteredItems.others?.length > 0) ? (
        <div className={viewMode === 'grid' ? 'items-grid' : 'items-list'}>
          {/* Combine favorites and others into one array for display */}
          {[...filteredItems.favorites, ...filteredItems.others].map((item, index) => {
            const isOwned = userOwnership.has(item.id);
            const isFavorite = isRoot && userFavorites.has(item.id);
            return (
              <div
                key={item.id}
                className={`item-card ${!isOwned ? 'item-missing' : ''} ${isFavorite ? 'item-favorite' : ''} clickable`}
                onClick={() => {
                  // In root view, collections should navigate directly
                  if (isRoot && item.type?.toLowerCase() === 'collection') {
                    onSelectCollection(item);
                  } else {
                    setSelectedItem(item);
                    setSelectedItemIndex(index);
                  }
                }}
                title="Click to view details"
              >
                <div className="item-image" style={{ background: getItemImage(item, index) }}>
                  <div className="item-overlay">
                    {!isRoot && shouldShowNumberBadge(collection, item) && (
                      <span className="item-number">
                        {(() => {
                          // Use card_number from metadata if available
                          if (item.metadata?.card_number) {
                            return `#${String(item.metadata.card_number).padStart(3, '0')}`;
                          }
                          // Fall back to index
                          return `#${String(index + 1).padStart(3, '0')}`;
                        })()}
                      </span>
                    )}
                    {isOwned && (
                      <div className="owned-badge">
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                          <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    {isFavorite && (
                      <div className="favorite-indicator">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                <div className="item-content">
                  <h4 className="item-name">{item.name}</h4>
                  <div className="item-meta">
                    <span className="item-type">{item.type}</span>
                    {/* Show "Missing" label only for non-collection items */}
                    {item.type?.toLowerCase() !== 'collection' && (
                      <span className={`item-status ${isOwned ? 'owned' : 'missing'}`}>
                        {isOwned ? 'Owned' : 'Missing'}
                      </span>
                    )}
                  </div>

                  {/* Show completion bar if item is a collection type */}
                  {item.type?.toLowerCase() === 'collection' && (
                    <div className="item-completion-bar">
                      <div className="completion-progress">
                        <div
                          className="completion-fill"
                          style={{
                            width: '0%' // Will be calculated based on user's actual owned items
                          }}
                        ></div>
                      </div>
                      <span className="completion-text">
                        View Collection
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
              <p>Start adding items to this collection</p>
            </>
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          index={selectedItemIndex}
          isOwned={userOwnership.has(selectedItem.id)}
          onToggleOwnership={() => {
            toggleItemOwnership(selectedItem.id);
          }}
          onNavigateToCollection={onSelectCollection}
          onClose={() => {
            setSelectedItem(null);
            setSelectedItemIndex(null);
          }}
        />
      )}

      {/* Collection Management Modal */}
      {showManageModal && collection && (
        <div className="collection-management-modal" role="dialog" aria-modal="true" aria-labelledby="manage-collection-title">
          <div className="modal-content">
            <div className="modal-header">
              <h2 id="manage-collection-title">{collection.name}</h2>
              <button
                className="close-button"
                onClick={handleCloseModal}
                aria-label="Close collection management modal"
              >
                ×
              </button>
            </div>

            <div className="tabs" role="tablist" aria-label="Collection management tabs">
              <button
                className={activeTab === 'details' ? 'active' : ''}
                onClick={() => setActiveTab('details')}
                role="tab"
                aria-selected={activeTab === 'details'}
                aria-controls="tab-panel-details"
              >
                Details
              </button>
              <button
                className={activeTab === 'edit' ? 'active' : ''}
                onClick={() => setActiveTab('edit')}
                role="tab"
                aria-selected={activeTab === 'edit'}
                aria-controls="tab-panel-edit"
              >
                Edit
              </button>
              <button
                className={activeTab === 'curator' ? 'active' : ''}
                onClick={() => setActiveTab('curator')}
                role="tab"
                aria-selected={activeTab === 'curator'}
                aria-controls="tab-panel-curator"
              >
                AI Curator
              </button>
              <button
                className={activeTab === 'suggestions' ? 'active' : ''}
                onClick={() => setActiveTab('suggestions')}
                role="tab"
                aria-selected={activeTab === 'suggestions'}
                aria-controls="tab-panel-suggestions"
              >
                Suggestions
              </button>
              <button
                className={activeTab === 'items' ? 'active' : ''}
                onClick={() => setActiveTab('items')}
                role="tab"
                aria-selected={activeTab === 'items'}
                aria-controls="tab-panel-items"
              >
                Items
              </button>
            </div>

            <div className="tab-content" role="tabpanel" id={`tab-panel-${activeTab}`}>
              {activeTab === 'details' && (
                <div className="collection-details">
                  <h3>Collection Details</h3>
                  <p><strong>ID:</strong> {collection.id}</p>
                  <p><strong>Created:</strong> {new Date(collection.created_at).toLocaleDateString()}</p>
                  {collection.metadata?.description && (
                    <p><strong>Description:</strong> {collection.metadata.description}</p>
                  )}
                  {collection.metadata?.category && (
                    <p><strong>Category:</strong> {collection.metadata.category}</p>
                  )}
                  <p><strong>Total Items:</strong> {collection.childrenCount || items.length || 0}</p>
                  <button
                    className="btn-primary"
                    onClick={handleEditInModal}
                    style={{ marginTop: '20px' }}
                  >
                    Edit Collection
                  </button>
                  <button
                    className="btn-delete"
                    onClick={handleDelete}
                    style={{ marginTop: '10px', marginLeft: '10px' }}
                  >
                    Delete Collection
                  </button>
                </div>
              )}

              {activeTab === 'edit' && (
                <div className="collection-edit">
                  <form onSubmit={handleUpdateCollection} className="collection-form">
                    <div className="form-group">
                      <label htmlFor="modal-name">Collection Name *</label>
                      <input
                        type="text"
                        id="modal-name"
                        value={isEditMode ? formData.name : collection.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={!isEditMode}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="modal-description">Description</label>
                      <textarea
                        id="modal-description"
                        value={isEditMode ? formData.description : (collection.metadata?.description || '')}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="4"
                        disabled={!isEditMode}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="modal-category">Category</label>
                      <input
                        type="text"
                        id="modal-category"
                        value={isEditMode ? formData.category : (collection.metadata?.category || '')}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        disabled={!isEditMode}
                      />
                    </div>

                    <div className="form-group">
                      <label>Collection Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        disabled={!isEditMode}
                        style={{ display: 'none' }}
                      />
                      {!isEditMode ? (
                        imagePreview && (
                          <div className="image-preview">
                            <img
                              src={imagePreview || collection.primaryImage?.url}
                              alt="Collection preview"
                              loading="lazy"
                            />
                          </div>
                        )
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {imagePreview ? 'Change Image' : 'Upload Image'}
                          </button>
                          {imagePreview && (
                            <>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleRemoveImage}
                                style={{ marginLeft: '10px' }}
                              >
                                Remove Image
                              </button>
                              <div className="image-preview">
                                <img
                                  src={imagePreview}
                                  alt="Collection preview"
                                  loading="lazy"
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {isEditMode ? (
                      <div className="form-actions">
                        <button type="submit" className="btn-primary">
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleEditInModal}
                      >
                        Edit Collection
                      </button>
                    )}
                  </form>
                </div>
              )}

              {activeTab === 'curator' && (
                <CuratorConfig
                  collectionId={collection.id}
                  collectionName={collection.name}
                />
              )}

              {activeTab === 'suggestions' && (
                <HierarchicalSuggestions
                  collectionId={collection.id}
                  collectionName={collection.name}
                />
              )}

              {activeTab === 'items' && (
                <div className="collection-items-tab">
                  <h3>Collection Items</h3>
                  <p>Total items in this collection: {items.length}</p>
                  <div className="items-list-preview">
                    {items.slice(0, 10).map(item => (
                      <div key={item.id} className="item-preview-row">
                        <span>{item.name}</span>
                        <span className="item-type-badge">{item.type}</span>
                      </div>
                    ))}
                    {items.length > 10 && (
                      <p className="more-items-text">...and {items.length - 10} more items</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ItemList;