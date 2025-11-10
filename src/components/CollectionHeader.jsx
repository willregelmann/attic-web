import './CollectionHeader.css';

/**
 * CollectionHeader - Reusable collection header with image, title, actions, and progress
 *
 * @param {Object} collection - Collection data (name, type, year, image_url, thumbnail_url)
 * @param {String} subtitle - Subtitle text (e.g., "Collection • 2024")
 * @param {Number} ownedCount - Number of owned items
 * @param {Number} totalCount - Total number of items
 * @param {ReactNode} actions - Action buttons to render in header
 * @param {Function} onClick - Optional click handler for header
 * @param {Boolean} clickable - Whether header should be clickable
 * @param {Boolean} showProgress - Whether to show progress bar
 */
export function CollectionHeader({
  collection,
  subtitle,
  ownedCount = 0,
  totalCount = 0,
  actions,
  onClick,
  clickable = false,
  showProgress = true
}) {
  const progressPercentage = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  const headerClass = clickable
    ? 'collection-header-detail clickable'
    : 'collection-header-detail';

  return (
    <div
      className={headerClass}
      onClick={onClick}
      title={clickable ? "Click to view collection details" : undefined}
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      {/* Collection Image */}
      {(collection?.thumbnail_url || collection?.image_url) ? (
        <div
          className="collection-image-large"
          style={{
            backgroundImage: `url(${collection.thumbnail_url || collection.image_url})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'transparent'
          }}
        />
      ) : (
        <div
          className="collection-image-large"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            border: '2px solid #dee2e6'
          }}
        >
          <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="#6c757d" strokeWidth="1.5">
            <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4M3 7h18" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}

      {/* Collection Details */}
      <div className="collection-details">
        <div className="collection-title-row">
          <div>
            <h1 className="collection-title">{collection?.name || 'Collection'}</h1>
            <p className="collection-subtitle">{subtitle}</p>
          </div>

          {/* Action Buttons Slot */}
          {actions && (
            <div className="collection-actions">
              {actions}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && totalCount > 0 && (
          <div className="progress-section">
            <div className="progress-bar-detail">
              <div className="progress-fill-detail" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <span className="completion-badge">
              {ownedCount} / {totalCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
