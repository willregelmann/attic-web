import { useQuery } from '@apollo/client/react';
import { GET_COLLECTIONS } from '../queries';
import { CollectionGridSkeleton } from './SkeletonLoader';
import { formatEntityType } from '../utils/formatters';
import { useTheme } from '../contexts/ThemeContext';
import './CollectionBrowser.css';

function CollectionBrowser({ onSelectCollection }) {
  const { loading, error, data } = useQuery(GET_COLLECTIONS);
  const { isDarkMode } = useTheme();

  if (loading) {
    return (
      <div className="collection-browser">
        <div className="collections-header">
          <div className="header-content">
            <h1>My Collections</h1>
            <p>Track and manage your collectibles</p>
          </div>
        </div>
        <CollectionGridSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="collections-error">
        <svg className="error-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h3>Unable to load collections</h3>
        <p>{error.message}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data || !data.collections || data.collections.length === 0) {
    return (
      <div className="collections-empty">
        <svg className="empty-icon" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="7" width="14" height="10" stroke="currentColor" strokeWidth="2" rx="2"/>
          <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <h3>No collections yet</h3>
        <p>Start by creating your first collection</p>
        <button className="create-btn">Create Collection</button>
      </div>
    );
  }

  // Mock data for collection stats - in real app, this would come from the backend
  const getCollectionStats = (collection) => {
    // This should come from your GraphQL query
    return {
      total: 102,
      owned: 67,
      percentage: Math.round((67/102) * 100)
    };
  };

  const getCollectionBackground = () => {
    // Returns grey background color based on theme
    return isDarkMode ? '#374151' : '#e5e7eb';
  };

  const getCollectionIcon = (collection) => {
    const iconColor = isDarkMode ? '#9ca3af' : '#6b7280';

    // Use folder icon for custom collections
    if (collection && collection.type === 'custom') {
      return (
        <svg viewBox="0 0 24 24" fill="none" width="64" height="64" stroke={iconColor} strokeWidth="1.5">
          <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-9l-2-2H5a2 2 0 0 0-2 2v0" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }

    // Default collection icon
    return (
      <svg viewBox="0 0 24 24" fill="none" width="64" height="64" stroke={iconColor} strokeWidth="1.5">
        <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4M3 7h18" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 11h6M9 15h6" strokeLinecap="round"/>
      </svg>
    );
  };

  return (
    <div className="collection-browser">
      <div className="collections-header">
        <div className="header-content">
          <h1>My Collections</h1>
          <p>Track and manage your collectibles</p>
        </div>
        <div className="header-actions">
          <button className="action-btn">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Collection
          </button>
        </div>
      </div>

      <div className="collections-stats">
        <div className="stat-card">
          <div className="stat-value">{data.collections.length}</div>
          <div className="stat-label">Collections</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">342</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">65%</div>
          <div className="stat-label">Completion</div>
        </div>
      </div>

      <div className="collections-grid">
        {data.collections.map(collection => {
          const stats = getCollectionStats(collection);
          return (
            <div
              key={collection.id}
              className="collection-card"
              onClick={() => onSelectCollection(collection)}
            >
              <div
                className="collection-image"
                style={{ background: getCollectionBackground() }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%'
                }}>
                  {getCollectionIcon(collection)}
                </div>
              </div>

              <div className="collection-content">
                <div className="collection-header">
                  <h3>{collection.name}</h3>
                  <span className="collection-badge">{formatEntityType(collection.type)}</span>
                </div>

                <div className="collection-progress">
                  <div className="progress-info">
                    <span className="progress-label">Progress</span>
                    <span className="progress-value">{stats.owned}/{stats.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-percentage">{stats.percentage}% Complete</div>
                </div>

                <div className="collection-footer">
                  <button className="view-btn">View Collection →</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CollectionBrowser;