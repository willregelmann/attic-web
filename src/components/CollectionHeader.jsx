import { useTheme } from '../contexts/ThemeContext';
import { getTypeIcon } from '../utils/iconUtils.jsx';
import './CollectionHeader.css';

/**
 * CollectionHeader - Reusable collection header with image, title, actions, and progress
 *
 * @param {Object} collection - Collection data (name, type, year, image_url, thumbnail_url)
 * @param {String} subtitle - Subtitle text (e.g., "Collection • 2024")
 * @param {Number} ownedCount - Number of owned items
 * @param {Number} totalCount - Total number of items
 * @param {ReactNode} actions - Action buttons to render in header (right side)
 * @param {ReactNode} titleAction - Action button to render next to title (inline with title)
 * @param {Function} onClick - Optional click handler for header
 * @param {Boolean} clickable - Whether header should be clickable
 * @param {Boolean} showProgress - Whether to show progress bar
 * @param {Boolean} hideImage - Whether to hide the collection image
 */
export function CollectionHeader({
  collection,
  subtitle,
  ownedCount = 0,
  totalCount = 0,
  actions,
  titleAction,
  onClick,
  clickable = false,
  showProgress = true,
  hideImage = false
}) {
  const { isDarkMode } = useTheme();
  const progressPercentage = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  const headerClass = clickable
    ? 'collection-header-detail clickable'
    : 'collection-header-detail';

  // Determine image to display - priority order:
  // 1. thumbnail_url/image_url (for DBoT entities)
  // 2. representative_images[0] (for custom collections)
  const imageUrl = collection?.thumbnail_url
    || collection?.image_url
    || (collection?.representative_images && collection.representative_images.length > 0
      ? collection.representative_images[0]
      : null);

  // Get appropriate icon for collection type
  const iconColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const fallbackIcon = getTypeIcon(collection?.type || 'collection', iconColor, 60);

  return (
    <div
      className={headerClass}
      onClick={onClick}
      title={clickable ? "Click to view collection details" : undefined}
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      {/* Collection Image */}
      {!hideImage && (imageUrl ? (
        <div
          className="collection-image-large"
          style={{
            backgroundImage: `url(${imageUrl})`,
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
            backgroundColor: 'transparent'
          }}
        >
          {fallbackIcon}
        </div>
      ))}

      {/* Collection Details */}
      <div className="collection-details">
        <div className="collection-title-row">
          <div className="collection-title-container">
            <h1 className="collection-title">
              {collection?.name || 'Collection'}
              {/* Title Action Button (inline with title) */}
              {titleAction && (
                <span className="collection-title-action">
                  {titleAction}
                </span>
              )}
            </h1>
            {subtitle && <p className="collection-subtitle">{subtitle}</p>}
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
