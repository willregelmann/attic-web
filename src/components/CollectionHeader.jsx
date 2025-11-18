import { EntityImage } from './EntityImage';
import { IconButton } from './IconButton';

/**
 * CollectionHeader - Reusable collection header with image, title, actions, and progress
 *
 * @param {Object} collection - Collection data (name, type, year, image_url, thumbnail_url)
 * @param {String} subtitle - Subtitle text (e.g., "Collection • 2024")
 * @param {Number} ownedCount - Number of owned items
 * @param {Number} totalCount - Total number of items
 * @param {Array} actions - Array of action objects to render in header (desktop only)
 *   Each action: { id, icon, label, onClick, disabled, variant, className, testid, badge }
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
  actions = [],
  onClick,
  clickable = false,
  showProgress = true,
  hideImage = false
}) {
  const progressPercentage = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  return (
    <div
      className={`px-8 md:px-8 py-4 md:py-0 flex flex-col md:flex-row gap-0 md:gap-4 items-center text-center md:text-left transition-colors duration-200 ${clickable ? 'cursor-pointer hover:bg-black/[0.02] active:bg-black/[0.05] md:active:bg-transparent' : ''}`}
      onClick={onClick}
      title={clickable ? "Click to view collection details" : undefined}
    >
      {/* Collection Image */}
      {!hideImage && (
        <EntityImage
          item={collection}
          showBadges={false}
          lazyLoad={false}
          className="h-40 w-30 m-0 bg-transparent flex-shrink-0"
          iconSize={60}
        />
      )}

      {/* Collection Details */}
      <div className="flex-1">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-1 gap-2 md:gap-0 mt-4 md:mt-0">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-2xl sm:text-xl font-bold m-0 text-[var(--text-primary)] flex items-center gap-2 justify-center md:justify-start">
              {collection?.name || 'Collection'}
            </h1>
            {subtitle && (
              <p className="text-sm md:text-sm sm:text-xs text-[var(--text-secondary)] mt-1 mb-0 font-medium flex items-center gap-2 justify-center md:justify-start">
                {subtitle}
              </p>
            )}
          </div>

          {/* Action Buttons - Desktop Only */}
          {actions.length > 0 && (
            <div className="hidden md:flex gap-2 items-center">
              {actions.map(action => (
                <IconButton
                  key={action.id}
                  action={action}
                />
              ))}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && totalCount > 0 && (
          <div className="flex items-center gap-3 mt-3 md:mt-3 justify-center md:justify-start">
            <div className="flex-1 max-w-[160px] md:max-w-[200px] lg:max-w-[300px] h-[5px] md:h-[6px] lg:h-[8px] bg-[var(--medium-gray)] rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4a90e2] to-[#357abd] rounded transition-[width] duration-300 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <span className="text-xs md:text-[13px] lg:text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">
              {ownedCount} / {totalCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
