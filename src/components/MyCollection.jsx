import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { MY_COLLECTION_TREE } from '../queries';
import { CollectionCard } from './CollectionCard';
import { ItemCardImage } from './ItemCard';
import ItemDetail from './ItemDetail';
import CircularMenu from './CircularMenu';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import './MyCollection.css';

function MyCollection({ onAddToCollection }) {
  const navigate = useNavigate();
  const [currentParentId, setCurrentParentId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  const { loading, error, data, refetch } = useQuery(MY_COLLECTION_TREE, {
    variables: { parentId: currentParentId },
    fetchPolicy: 'cache-and-network'
  });

  const handleCollectionClick = (collectionId) => {
    setCurrentParentId(collectionId);
  };

  const handleBackClick = () => {
    if (data?.myCollectionTree?.current_collection?.parent_collection_id) {
      setCurrentParentId(data.myCollectionTree.current_collection.parent_collection_id);
    } else {
      setCurrentParentId(null);
    }
  };

  const handleItemClick = (item, index) => {
    setSelectedItem(item);
    setSelectedItemIndex(index);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
    setSelectedItemIndex(null);
  };

  const handleNavigateItem = (direction) => {
    if (!data?.myCollectionTree) return;

    const allItems = [
      ...(data.myCollectionTree.items || []),
      ...(data.myCollectionTree.wishlists || [])
    ];

    const newIndex = direction === 'next'
      ? (selectedItemIndex + 1) % allItems.length
      : (selectedItemIndex - 1 + allItems.length) % allItems.length;

    setSelectedItemIndex(newIndex);
    setSelectedItem(allItems[newIndex]);
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

  const { collections = [], items = [], wishlists = [], current_collection } = data?.myCollectionTree || {};
  const allItems = [...items, ...wishlists];

  return (
    <div className="my-collection">
      {/* Header with breadcrumbs */}
      <div className="my-collection-header">
        <div className="my-collection-breadcrumbs">
          <button
            className={!current_collection ? 'active' : ''}
            onClick={() => setCurrentParentId(null)}
          >
            My Collection
          </button>
          {current_collection && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span className="active">{current_collection.name}</span>
            </>
          )}
        </div>

        {current_collection && (
          <button className="back-button" onClick={handleBackClick}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="collection-stats">
        <div className="stat">
          <span className="stat-value">{collections.length}</span>
          <span className="stat-label">Collections</span>
        </div>
        <div className="stat">
          <span className="stat-value">{items.length}</span>
          <span className="stat-label">Items Owned</span>
        </div>
        <div className="stat">
          <span className="stat-value">{wishlists.length}</span>
          <span className="stat-label">Wishlisted</span>
        </div>
      </div>

      {/* Collections and Items Grid */}
      <div className="collections-items-grid">
        {/* Custom Collections */}
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            onClick={() => handleCollectionClick(collection.id)}
          />
        ))}

        {/* Owned Items */}
        {items.map((item, index) => (
          <div
            key={item.user_item_id}
            className="item-card owned"
            onClick={() => handleItemClick(item, index)}
          >
            <ItemCardImage item={item} />
            <div className="item-card-content">
              <h4 className="item-card-name">{item.name}</h4>
              {item.year && <p className="item-card-year">{item.year}</p>}
              <div className="ownership-badge owned-badge">Owned</div>
            </div>
          </div>
        ))}

        {/* Wishlist Items */}
        {wishlists.map((wishlist, index) => (
          <div
            key={wishlist.wishlist_id}
            className="item-card wishlist"
            onClick={() => handleItemClick(wishlist, items.length + index)}
          >
            <ItemCardImage item={wishlist} />
            <div className="item-card-content">
              <h4 className="item-card-name">{wishlist.name}</h4>
              {wishlist.year && <p className="item-card-year">{wishlist.year}</p>}
              <div className="ownership-badge wishlist-badge">Wishlist</div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {collections.length === 0 && allItems.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" width="64" height="64" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4M3 7h18"/>
            </svg>
            <h3>No items yet</h3>
            <p>Start building your collection by browsing and adding items</p>
            <button className="browse-button" onClick={() => navigate('/browse')}>
              Browse Collections
            </button>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={handleCloseDetail}
          onNext={() => handleNavigateItem('next')}
          onPrevious={() => handleNavigateItem('prev')}
          hasNext={selectedItemIndex < allItems.length - 1}
          hasPrevious={selectedItemIndex > 0}
        />
      )}

      {/* Circular Menu */}
      {onAddToCollection && (
        <CircularMenu onAddToCollection={onAddToCollection} />
      )}
    </div>
  );
}

export default MyCollection;
