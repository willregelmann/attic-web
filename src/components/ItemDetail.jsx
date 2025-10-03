import { useAuth } from '../contexts/AuthContext';
import './ItemDetail.css';

function ItemDetail({
  item,
  index,
  isOwned,
  onToggleOwnership,
  onClose,
  onNavigateToCollection,
  isSuggestionPreview = false,
  onAcceptSuggestion,
  onRejectSuggestion
}) {
  const { isAuthenticated } = useAuth();

  if (!item) return null;

  const getItemImage = () => {
    // Use actual image if available
    if (item?.primaryImage?.url) {
      return `url(${item.primaryImage.url})`;
    }
    // Fall back to gradient if no image
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="item-detail-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="item-detail-title">
      <div className={`item-detail-modal ${isSuggestionPreview ? 'suggestion-preview' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="detail-close-btn" onClick={onClose} aria-label="Close item details">
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

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
            <div className="detail-image" style={{
              background: getItemImage(),
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
              {isOwned && (
                <div className="detail-owned-badge">
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="detail-info-section">
            <h2 className="detail-title">{item.name}</h2>

            <div className="detail-metadata">
              <div className="detail-meta-item">
                <span className="meta-label">Type:</span>
                <span className="meta-value">{item.type || 'Standard'}</span>
              </div>
              <div className="detail-meta-item">
                <span className="meta-label">Number:</span>
                <span className="meta-value">
                  {item.metadata?.card_number
                    ? `#${String(item.metadata.card_number).padStart(3, '0')}`
                    : `#${String(index + 1).padStart(3, '0')}`}
                </span>
              </div>
              {item.metadata?.rarity && (
                <div className="detail-meta-item">
                  <span className="meta-label">Rarity:</span>
                  <span className="meta-value">{item.metadata.rarity}</span>
                </div>
              )}
            </div>

            {/* Show "View Full Page" button if this is a collection */}
            {item.type?.toLowerCase() === 'collection' && onNavigateToCollection && (
              <div className="detail-collection-section">
                <button
                  className="view-collection-btn"
                  onClick={() => {
                    onNavigateToCollection(item);
                    onClose();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  View Full Collection Page
                </button>
              </div>
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
            ) : (
              <div className="detail-ownership-section">
                <div className="ownership-status">
                  <span className="ownership-label">Status:</span>
                  <span className={`ownership-value ${isOwned ? 'owned' : 'missing'}`}>
                    {isOwned ? 'Owned' : 'Missing'}
                  </span>
                </div>

                {isAuthenticated ? (
                  <button
                    className={`ownership-toggle-btn ${isOwned ? 'remove' : 'add'}`}
                    onClick={onToggleOwnership}
                  >
                    {isOwned ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                          <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Remove from Collection
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Add to Collection
                      </>
                    )}
                  </button>
                ) : (
                  <p className="auth-prompt">
                    Sign in to track your collection
                  </p>
                )}
              </div>
            )}

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
      </div>
    </div>
  );
}

export default ItemDetail;