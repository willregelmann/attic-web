import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAuth } from '../contexts/AuthContext';
import {
  GET_COLLECTION_ITEMS,
  GET_COLLECTIONS,
  GET_MY_FAVORITE_COLLECTIONS,
  FAVORITE_COLLECTION,
  UNFAVORITE_COLLECTION
} from '../queries';
import ItemDetail from './ItemDetail';
import AddItemsModal from './AddItemsModal';
import './ItemList.css';

function ItemList({ collection, onBack, onSelectCollection, isRootView = false }) {
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState('all'); // all, owned, missing
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [userFavorites, setUserFavorites] = useState(new Set());

  // GraphQL mutations for favorites
  const [favoriteCollectionMutation] = useMutation(FAVORITE_COLLECTION);
  const [unfavoriteCollectionMutation] = useMutation(UNFAVORITE_COLLECTION);

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

  console.log('ItemList rendering with collection:', collection);
  console.log('isRoot:', isRoot, 'isRootView:', isRootView);

  const { loading, error, data } = useQuery(
    isRoot ? GET_COLLECTIONS : GET_COLLECTION_ITEMS,
    {
      variables: isRoot ? {} : { collectionId: collection.id },
      skip: !collection.id,
      fetchPolicy: 'cache-and-network'
    }
  );

  console.log('ItemList query result:', { loading, error, data });

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
      return data?.collections || [];
    }
    return data?.collectionItems || [];
  }, [data, isRoot]);

  // Separate favorites from other items for root view
  const { favoriteItems, otherItems } = useMemo(() => {
    if (!isRoot || !items.length) {
      return { favoriteItems: [], otherItems: items };
    }

    const favorites = [];
    const others = [];

    items.forEach(item => {
      if (userFavorites.has(item.id)) {
        favorites.push(item);
      } else {
        others.push(item);
      }
    });

    // Shuffle other items for variety if user is not authenticated or has no favorites
    if (!isAuthenticated || favorites.length === 0) {
      // Fisher-Yates shuffle for randomization
      const shuffled = [...others];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return { favoriteItems: [], otherItems: shuffled.slice(0, 20) }; // Show max 20 random
    }

    return { favoriteItems: favorites, otherItems: others };
  }, [items, isRoot, userFavorites, isAuthenticated]);

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
      <div className="items-loading">
        <div className="loading-spinner"></div>
        <p>Loading collection items...</p>
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
          {isAuthenticated && (
            <button
              className="add-items-btn"
              onClick={() => setShowAddItemsModal(true)}
              style={{ marginRight: '1rem' }}
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add to My Collection
            </button>
          )}
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
                  console.log('Clicked item:', item);
                  console.log('Item type:', item.type);
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
                          // Debug: log what we're getting
                          if (index === 0) {
                            console.log('First item:', item.name, 'metadata:', item.metadata);
                          }
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

      {/* Add Items Modal */}
      {showAddItemsModal && (
        <AddItemsModal
          isOpen={showAddItemsModal}
          onClose={() => setShowAddItemsModal(false)}
          onItemsAdded={(addedItems) => {
            // For now, we'll just refresh the page to show the new items
            // In a production app, we'd update the local state or refetch queries
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

export default ItemList;