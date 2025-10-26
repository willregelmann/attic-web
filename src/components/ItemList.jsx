import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  GET_DATABASE_OF_THINGS_COLLECTION_ITEMS,
  GET_DATABASE_OF_THINGS_COLLECTIONS,
  GET_MY_FAVORITE_COLLECTIONS,
  FAVORITE_COLLECTION,
  UNFAVORITE_COLLECTION
} from '../queries';
import ItemDetail from './ItemDetail';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import { formatEntityType, isCollectionType } from '../utils/formatters';
import { ItemCardImage } from './ItemCard';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import './ItemList.css';

function ItemList({ collection, onBack, onSelectCollection, isRootView = false, onRefresh, navigationPath = [] }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { setBreadcrumbItems, setLoading: setBreadcrumbsLoading } = useBreadcrumbs();
  const [filter, setFilter] = useState('all'); // all, owned, missing
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [sortBy, setSortBy] = useState('default'); // default, name-asc, name-desc, type, owned
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
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

  // For root: use favorites for authenticated users, all collections for others
  const rootQuery = isAuthenticated ? GET_MY_FAVORITE_COLLECTIONS : GET_DATABASE_OF_THINGS_COLLECTIONS;

  const { loading, error, data, refetch } = useQuery(
    isRoot ? rootQuery : GET_DATABASE_OF_THINGS_COLLECTION_ITEMS,
    {
      variables: isRoot ? { first: 50 } : { collectionId: collection.id, first: 1000 },
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

  // Toggle collection favorite status
  const toggleFavorite = async () => {
    if (!isAuthenticated || !collection || collection.id === 'root') {
      return;
    }

    const isFavorited = userFavorites.has(collection.id);

    try {
      if (isFavorited) {
        await unfavoriteCollectionMutation({
          variables: { collectionId: collection.id }
        });

        setUserFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(collection.id);
          return newSet;
        });
      } else {
        await favoriteCollectionMutation({
          variables: { collectionId: collection.id }
        });

        setUserFavorites(prev => {
          const newSet = new Set(prev);
          newSet.add(collection.id);
          return newSet;
        });
      }

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
      // For unauthenticated users, use Database of Things collections
      return data?.databaseOfThingsCollections || [];
    }
    return data?.databaseOfThingsCollectionItems || [];
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

    // Re-separate into favorites and others if root view
    if (isRoot) {
      const filteredFavorites = filtered.filter(item => userFavorites.has(item.id));
      const filteredOthers = filtered.filter(item => !userFavorites.has(item.id));
      return { favorites: filteredFavorites, others: filteredOthers };
    }

    return { favorites: [], others: filtered };
  }, [items, favoriteItems, otherItems, isRoot, filter, searchTerm, userOwnership, userFavorites, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!items.length) return { total: 0, owned: 0, percentage: 0 };
    const total = items.length;
    const owned = userOwnership.size;
    const percentage = total > 0 ? Math.round((owned / total) * 100) : 0;
    return { total, owned, percentage };
  }, [items, userOwnership]);

  // Update breadcrumbs in context
  useEffect(() => {
    if (isRootView) {
      setBreadcrumbItems([]);
      return;
    }

    const homeIcon = (
      <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="breadcrumb-icon">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );

    const items = [
      {
        label: 'Home',
        icon: homeIcon,
        onClick: () => navigate('/')
      }
    ];

    // Add navigation path items
    navigationPath.forEach((pathItem, index) => {
      items.push({
        label: pathItem.name,
        onClick: () => {
          const pathUpToHere = navigationPath.slice(0, index);
          const pathParam = pathUpToHere.length > 0
            ? `?path=${pathUpToHere.map(p => `${p.id}:${encodeURIComponent(p.name)}`).join(',')}`
            : '';
          navigate(`/collection/${pathItem.id}${pathParam}`);
        }
      });
    });

    // Add current collection (not clickable)
    if (collection?.name) {
      items.push({
        label: collection.name
      });
    }

    setBreadcrumbItems(items);
  }, [collection?.name, navigationPath, navigate, isRootView, setBreadcrumbItems]);

  // Update breadcrumbs loading state
  useEffect(() => {
    if (!isRootView) {
      setBreadcrumbsLoading(loading);
    }
  }, [loading, isRootView, setBreadcrumbsLoading]);

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

  return (
    <div className="item-list">
      {/* Collection Header */}
      <div
        className="collection-header-detail clickable"
        onClick={() => {
          setSelectedItem(collection);
          setSelectedItemIndex(null);
        }}
        title="Click to view collection details"
        style={{ cursor: 'pointer' }}
      >
        {collection?.image_url && (
          <div
            className="collection-image-large"
            style={{
              backgroundImage: `url(${collection.image_url})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'transparent'
            }}
          />
        )}
        <div className="collection-details">
          <div className="collection-title-row">
            <div>
              <h1 className="collection-title">{collection.name}</h1>
              <p className="collection-subtitle">
                {formatEntityType(collection.type)}
                {collection.year && ` • ${collection.year}`}
              </p>
            </div>
            {!isRootView && isAuthenticated && (
              <div className="collection-actions">
                <button
                  className={`favorite-button ${userFavorites.has(collection.id) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite();
                  }}
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
          <div className="progress-section">
            <div className="progress-bar-detail">
              <div className="progress-fill-detail" style={{ width: `${stats.percentage}%` }}></div>
            </div>
            <span className="completion-badge">
              {stats.owned} / {stats.total}
            </span>
          </div>
        </div>
      </div>

      {/* Items Grid/List */}
      {(filteredItems.favorites?.length > 0 || filteredItems.others?.length > 0) ? (
        <div className={viewMode === 'grid' ? 'items-grid' : 'items-list'}>
          {[...filteredItems.favorites, ...filteredItems.others].map((item, index) => {
            const isOwned = userOwnership.has(item.id);
            const isFavorite = isRoot && userFavorites.has(item.id);
            return (
              <div
                key={item.id}
                className={`item-card ${isFavorite ? 'item-favorite' : ''} clickable`}
                onClick={() => {
                  if (isCollectionType(item.type)) {
                    onSelectCollection(item);
                  } else {
                    setSelectedItem(item);
                    setSelectedItemIndex(index);
                  }
                }}
                title="Click to view details"
              >
                <ItemCardImage
                  item={item}
                  index={index}
                  isOwned={isOwned}
                  isFavorite={isFavorite}
                />

                <div className="item-content">
                  <h4 className="item-name">{item.name}</h4>
                  <div className="item-meta">
                    <span className="item-type">
                      {formatEntityType(item.type)}
                      {item.year && ` • ${item.year}`}
                    </span>
                  </div>

                  <div className="item-completion-bar">
                    <div className="completion-progress">
                      <div className="completion-fill" style={{ width: isOwned ? '100%' : '0%' }}></div>
                    </div>
                  </div>
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
    </div>
  );
}

export default ItemList;
