// Base skeleton component
export function Skeleton({ width = '100%', height = '20px', borderRadius = '4px', className = '' }) {
  return (
    <div
      className={`block bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] motion-safe:animate-shimmer motion-reduce:bg-gray-100 motion-reduce:dark:bg-gray-700 ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
    />
  );
}

// Entity Card Skeleton (used for both items and collections)
export function EntityCardSkeleton() {
  return (
    <div className="entity-card pointer-events-none select-none">
      <Skeleton height="250px" borderRadius="12px 12px 0 0" className="skeleton-image" />
      <div className="entity-content p-4 flex flex-col gap-3">
        <Skeleton width="80%" height="20px" />
        <div className="flex gap-2 mt-2">
          <Skeleton width="60px" height="18px" borderRadius="12px" />
          <Skeleton width="50px" height="18px" borderRadius="12px" />
        </div>
      </div>
    </div>
  );
}

// Collection Header Skeleton
export function CollectionHeaderSkeleton() {
  return (
    <div className="collection-header-detail flex flex-col md:flex-row gap-0 md:gap-6 items-center md:items-start p-5 md:p-8 bg-[var(--bg-primary)] rounded-xl mb-6">
      <Skeleton height="160px" width="120px" borderRadius="12px" className="skeleton-image mx-auto md:mx-0" />
      <div className="collection-details flex-1 flex flex-col items-center md:items-start w-full">
        <Skeleton width="60%" height="32px" className="mb-2" />
        <div className="flex gap-3 mb-4">
          <Skeleton width="80px" height="24px" borderRadius="12px" />
          <Skeleton width="100px" height="14px" />
        </div>
        <Skeleton width="100%" height="8px" borderRadius="6px" className="mb-2" />
        <Skeleton width="120px" height="18px" />
      </div>
    </div>
  );
}

// Item List Skeleton
export function ItemListSkeleton({ count = 12 }) {
  return (
    <div className="items-grid">
      {Array.from({ length: count }).map((_, index) => (
        <EntityCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Collection Grid Skeleton (uses EntityCardSkeleton)
export function CollectionGridSkeleton({ count = 6 }) {
  return (
    <div className="items-grid">
      {Array.from({ length: count }).map((_, index) => (
        <EntityCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Search Results Skeleton
export function SearchResultsSkeleton({ count = 5 }) {
  return (
    <div className="search-results-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="search-result-item">
          <Skeleton width="24px" height="24px" borderRadius="50%" />
          <div className="flex-1">
            <Skeleton width="70%" height="18px" className="mb-1" />
            <Skeleton width="40%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Collection Tree Skeleton
export function CollectionTreeSkeleton({ count = 3 }) {
  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="m-0 p-0 block">
          <div className="pl-3 flex items-center gap-2">
            <Skeleton width="60%" height="20px" />
            <Skeleton width="16px" height="16px" borderRadius="50%" className="ml-auto" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Filter Fields Skeleton
export function FilterFieldsSkeleton({ count = 5 }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="border border-[var(--border-color)] rounded-lg p-4 flex justify-between items-center bg-[var(--bg-primary)]"
        >
          <div className="flex items-center gap-2 flex-1">
            <Skeleton width="30%" height="18px" />
          </div>
          <Skeleton width="16px" height="16px" />
        </div>
      ))}
    </div>
  );
}
