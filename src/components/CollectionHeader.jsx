import { EntityImage } from './EntityImage';
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
 * @param {ReactNode} subtitleAction - Action button to render next to subtitle (inline with subtitle)
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
  subtitleAction,
  onClick,
  clickable = false,
  showProgress = true,
  hideImage = false
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
      {!hideImage && (
        <EntityImage
          item={collection}
          showBadges={false}
          lazyLoad={false}
          className="collection-image-large"
          iconSize={60}
        />
      )}

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
            {subtitle && (
              <p className="collection-subtitle">
                {subtitle}
                {/* Subtitle Action Button (inline with subtitle) */}
                {subtitleAction && (
                  <span className="collection-subtitle-action">
                    {subtitleAction}
                  </span>
                )}
              </p>
            )}
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
