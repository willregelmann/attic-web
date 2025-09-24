import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ITEM_DETAILS, ADD_ITEM_TO_MY_COLLECTION } from '../queries';
import { useAuth } from '../contexts/AuthContext';
import './ItemView.css';

function ItemView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isOwned, setIsOwned] = useState(false);

  const { loading, error, data } = useQuery(GET_ITEM_DETAILS, {
    variables: { id }
  });

  const [addToCollection] = useMutation(ADD_ITEM_TO_MY_COLLECTION);

  const item = data?.item;

  useEffect(() => {
    if (item?.primaryImage) {
      setSelectedImage(item.primaryImage.url);
    }
  }, [item]);

  const handleToggleOwnership = async () => {
    if (!isAuthenticated) return;

    try {
      if (!isOwned) {
        await addToCollection({
          variables: {
            itemId: item.id,
            metadata: { added_at: new Date().toISOString() }
          }
        });
        setIsOwned(true);
      }
    } catch (error) {
      console.error('Error toggling ownership:', error);
    }
  };

  const navigateToCollection = (collection) => {
    navigate(`/collection/${collection.id}`);
  };

  const navigateToItem = (itemId) => {
    navigate(`/item/${itemId}`);
  };

  if (loading) {
    return (
      <div className="item-view-loading">
        <div className="loading-spinner"></div>
        <p>Loading item details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="item-view-error">
        <h2>Item Not Found</h2>
        <p>{error?.message || 'The requested item could not be found.'}</p>
        <button onClick={() => navigate('/')}>Back to Collections</button>
      </div>
    );
  }

  const isCollection = item.type === 'collection';

  return (
    <div className="item-view">
      <div className="item-view-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M19 12H5M5 12l7-7m-7 7l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          Back
        </button>
      </div>

      <div className="item-view-content">
        {/* Left: Images Section */}
        <div className="item-images-section">
          <div className="main-image-container">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={item.name}
                className="main-image"
              />
            ) : (
              <div className="image-placeholder">
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                  <path d="M3 15l5-5 4 4 5-5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
            )}
          </div>

          {item.images && item.images.length > 1 && (
            <div className="thumbnail-list">
              {item.images.map((img) => (
                <div
                  key={img.id}
                  className={`thumbnail ${selectedImage === img.url ? 'active' : ''}`}
                  onClick={() => setSelectedImage(img.url)}
                >
                  <img src={img.url} alt={img.alt_text} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details Section */}
        <div className="item-details-section">
          <div className="item-header">
            <h1 className="item-title">{item.name}</h1>
            <span className="item-type-badge">{item.type}</span>
          </div>

          {/* Metadata */}
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <div className="metadata-section">
              <h3>Details</h3>
              <div className="metadata-grid">
                {item.metadata.card_number && (
                  <div className="metadata-item">
                    <span className="meta-label">Card Number:</span>
                    <span className="meta-value">#{item.metadata.card_number}</span>
                  </div>
                )}
                {item.metadata.rarity && (
                  <div className="metadata-item">
                    <span className="meta-label">Rarity:</span>
                    <span className="meta-value">{item.metadata.rarity}</span>
                  </div>
                )}
                {item.metadata.artist && (
                  <div className="metadata-item">
                    <span className="meta-label">Artist:</span>
                    <span className="meta-value">{item.metadata.artist}</span>
                  </div>
                )}
                {item.metadata.release_date && (
                  <div className="metadata-item">
                    <span className="meta-label">Release Date:</span>
                    <span className="meta-value">{item.metadata.release_date}</span>
                  </div>
                )}
                {item.metadata.supertype && (
                  <div className="metadata-item">
                    <span className="meta-label">Type:</span>
                    <span className="meta-value">{item.metadata.supertype}</span>
                  </div>
                )}
                {item.metadata.hp && (
                  <div className="metadata-item">
                    <span className="meta-label">HP:</span>
                    <span className="meta-value">{item.metadata.hp}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ownership Actions */}
          {!isCollection && isAuthenticated && (
            <div className="ownership-section">
              <button
                className={`ownership-btn ${isOwned ? 'owned' : 'missing'}`}
                onClick={handleToggleOwnership}
              >
                {isOwned ? (
                  <>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                    In My Collection
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    </svg>
                    Add to Collection
                  </>
                )}
              </button>
            </div>
          )}

          {/* Collection Actions */}
          {isCollection && (
            <div className="collection-actions">
              <button
                className="view-collection-btn"
                onClick={() => navigate(`/collection/${item.id}`)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
                View Collection Items
              </button>
            </div>
          )}

          {/* Parent Collections */}
          {item.parents && item.parents.length > 0 && (
            <div className="related-section">
              <h3>Part of Collections</h3>
              <div className="related-grid">
                {item.parents.map((parent) => (
                  <div
                    key={parent.id}
                    className="related-item clickable"
                    onClick={() => navigateToCollection(parent)}
                  >
                    <div className="related-image">
                      {parent.primaryImage ? (
                        <img src={parent.primaryImage.url} alt={parent.name} />
                      ) : (
                        <div className="related-placeholder">
                          <svg viewBox="0 0 24 24" width="24" height="24">
                            <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="related-info">
                      <h4>{parent.name}</h4>
                      <span className="related-type">{parent.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Child Items/Variants */}
          {item.children && item.children.length > 0 && (
            <div className="related-section">
              <h3>{isCollection ? 'Items in Collection' : 'Variants & Components'}</h3>
              <div className="related-grid">
                {item.children.slice(0, 12).map((child) => (
                  <div
                    key={child.id}
                    className="related-item clickable"
                    onClick={() => navigateToItem(child.id)}
                  >
                    <div className="related-image">
                      {child.primaryImage ? (
                        <img src={child.primaryImage.url} alt={child.name} />
                      ) : (
                        <div className="related-placeholder">
                          <svg viewBox="0 0 24 24" width="24" height="24">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="related-info">
                      <h4>{child.name}</h4>
                      {child.metadata?.card_number && (
                        <span className="card-number">#{child.metadata.card_number}</span>
                      )}
                    </div>
                  </div>
                ))}
                {item.children.length > 12 && (
                  <div className="related-item view-all" onClick={() => navigate(`/collection/${item.id}`)}>
                    <div className="view-all-content">
                      <span>View All</span>
                      <span className="count">{item.children.length} items</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemView;