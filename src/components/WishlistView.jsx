import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { GET_MY_WISHLIST, REMOVE_ITEM_FROM_WISHLIST, ADD_ITEM_TO_MY_COLLECTION } from '../queries';
import { CollectionGridSkeleton } from './SkeletonLoader';
import './WishlistView.css';

function WishlistView() {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_MY_WISHLIST, {
    fetchPolicy: 'network-only'
  });

  const [removeFromWishlist] = useMutation(REMOVE_ITEM_FROM_WISHLIST, {
    refetchQueries: [{ query: GET_MY_WISHLIST }]
  });

  const [addToCollection] = useMutation(ADD_ITEM_TO_MY_COLLECTION, {
    refetchQueries: [{ query: GET_MY_WISHLIST }]
  });

  const handleRemoveFromWishlist = async (itemId) => {
    try {
      await removeFromWishlist({
        variables: { itemId }
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCollection = async (item) => {
    try {
      await addToCollection({
        variables: {
          itemId: item.id,
          metadata: { added_at: new Date().toISOString() }
        }
      });
    } catch (error) {
      console.error('Error adding to collection:', error);
    }
  };

  const handleViewItem = (itemId) => {
    navigate(`/item/${itemId}`);
  };

  if (loading) {
    return (
      <div className="wishlist-view">
        <div className="wishlist-header">
          <div className="header-content">
            <h1>My Wishlist</h1>
            <p>Items you want to add to your collection</p>
          </div>
        </div>
        <CollectionGridSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-error">
        <svg className="error-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h3>Unable to load wishlist</h3>
        <p>{error.message}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data?.myWishlist || data.myWishlist.length === 0) {
    return (
      <div className="wishlist-view">
        <div className="wishlist-header">
          <div className="header-content">
            <h1>My Wishlist</h1>
            <p>Items you want to add to your collection</p>
          </div>
        </div>
        <div className="wishlist-empty">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
          <h3>Your wishlist is empty</h3>
          <p>Browse collections and add items you want to collect</p>
          <button className="browse-btn" onClick={() => navigate('/')}>
            Browse Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-view">
      <div className="wishlist-header">
        <div className="header-content">
          <h1>My Wishlist</h1>
          <p>Items you want to add to your collection</p>
        </div>
        <div className="wishlist-count">
          {data.myWishlist.length} {data.myWishlist.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      <div className="wishlist-grid">
        {data.myWishlist.map((wishlistEntry) => (
          <div key={wishlistEntry.id} className="wishlist-card" data-testid="wishlist-item">
            <div className="wishlist-card-image" onClick={() => handleViewItem(wishlistEntry.item.id)}>
              {wishlistEntry.item.primaryImage ? (
                <img
                  src={wishlistEntry.item.primaryImage.url}
                  alt={wishlistEntry.item.primaryImage.alt_text || wishlistEntry.item.name}
                  loading="lazy"
                />
              ) : (
                <div className="wishlist-card-placeholder">
                  <svg viewBox="0 0 24 24" width="48" height="48">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                    <path d="M3 15l5-5 4 4 5-5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
              )}
            </div>

            <div className="wishlist-card-content">
              <h3 className="wishlist-card-title" onClick={() => handleViewItem(wishlistEntry.item.id)}>
                {wishlistEntry.item.name}
              </h3>

              {wishlistEntry.item.metadata?.card_number && (
                <p className="wishlist-card-meta">
                  #{wishlistEntry.item.metadata.card_number}
                </p>
              )}

              {wishlistEntry.item.parents && wishlistEntry.item.parents.length > 0 && (
                <p className="wishlist-card-collection">
                  {wishlistEntry.item.parents[0].name}
                </p>
              )}

              <div className="wishlist-card-actions">
                <button
                  className="add-btn"
                  onClick={() => handleAddToCollection(wishlistEntry.item)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  </svg>
                  Add to Collection
                </button>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveFromWishlist(wishlistEntry.item.id)}
                  title="Remove from wishlist"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WishlistView;
