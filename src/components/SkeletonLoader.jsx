import './SkeletonLoader.css';

// Base skeleton component
export function Skeleton({ width = '100%', height = '20px', borderRadius = '4px', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
    />
  );
}

// Collection Card Skeleton
export function CollectionCardSkeleton() {
  return (
    <div className="collection-card skeleton-card">
      <Skeleton height="200px" borderRadius="12px 12px 0 0" className="skeleton-image" />
      <div className="collection-content">
        <div className="collection-header">
          <Skeleton width="70%" height="24px" />
          <Skeleton width="60px" height="20px" borderRadius="12px" />
        </div>
        <div className="skeleton-progress">
          <Skeleton width="100%" height="8px" borderRadius="4px" />
          <Skeleton width="40%" height="16px" style={{ marginTop: '8px' }} />
        </div>
      </div>
    </div>
  );
}

// Item Card Skeleton
export function ItemCardSkeleton() {
  return (
    <div className="item-card skeleton-card">
      <Skeleton height="250px" borderRadius="12px 12px 0 0" className="skeleton-image" />
      <div className="item-content">
        <Skeleton width="80%" height="20px" />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
    <div className="collection-header-detail skeleton-header">
      <Skeleton height="160px" width="120px" borderRadius="12px" className="skeleton-image" />
      <div className="collection-details" style={{ flex: 1 }}>
        <Skeleton width="60%" height="32px" style={{ marginBottom: '8px' }} />
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <Skeleton width="80px" height="24px" borderRadius="12px" />
          <Skeleton width="100px" height="14px" />
        </div>
        <Skeleton width="100%" height="8px" borderRadius="6px" style={{ marginBottom: '8px' }} />
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
        <ItemCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Collection Grid Skeleton
export function CollectionGridSkeleton({ count = 6 }) {
  return (
    <div className="collections-grid">
      {Array.from({ length: count }).map((_, index) => (
        <CollectionCardSkeleton key={index} />
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
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height="18px" style={{ marginBottom: '4px' }} />
            <Skeleton width="40%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}
