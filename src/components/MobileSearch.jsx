import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client/react';
import { SEMANTIC_SEARCH_DATABASE_OF_THINGS } from '../queries';
import { isCollectionType, formatEntityType } from '../utils/formatters';
import './MobileSearch.css';

function MobileSearch({ isOpen, onClose, onAddToCollection }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [searchItems, { data: searchData, loading: searchLoading, error: searchError }] = useLazyQuery(
    SEMANTIC_SEARCH_DATABASE_OF_THINGS,
    {
      fetchPolicy: 'network-only',
      onError: (error) => {
        console.error('Search error:', error);
        console.error('Error details:', error.message);
        console.error('GraphQL errors:', error.graphQLErrors);
        console.error('Network error:', error.networkError);
      }
    }
  );

  // Debounce search input
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        searchItems({ variables: { query: searchQuery, first: 20 } });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchItems]);

  const handleResultClick = (item) => {
    setSearchQuery('');
    onClose();

    if (isCollectionType(item.type)) {
      navigate(`/collection/${item.id}`);
    } else {
      // For individual items, navigate to full-page view
      navigate(`/item/${item.id}`);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - blurs the app content */}
      <div className="mobile-search-backdrop" onClick={handleClose} />

      <div className="mobile-search-overlay">
        <div className="mobile-search-container">
        <div className="mobile-search-header">
          <div className="mobile-search-input-wrapper">
            <svg className="mobile-search-icon" viewBox="0 0 24 24" fill="none" width="20" height="20">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              className="mobile-search-input"
              placeholder="Search collections and items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="mobile-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {searchQuery.length > 2 && (
          <div className="mobile-search-results">
            {searchLoading && (
              <div className="mobile-search-loading">Searching...</div>
            )}
            {!searchLoading && searchData?.databaseOfThingsSemanticSearch && (
              <>
                {searchData.databaseOfThingsSemanticSearch.length === 0 ? (
                  <div className="mobile-search-empty">No results found</div>
                ) : (
                  <>
                    <div className="mobile-search-results-header">
                      {searchData.databaseOfThingsSemanticSearch.length} result{searchData.databaseOfThingsSemanticSearch.length !== 1 ? 's' : ''}
                    </div>
                    <div className="mobile-search-results-list">
                      {searchData.databaseOfThingsSemanticSearch.map(item => (
                        <button
                          key={item.id}
                          className="mobile-search-result-item"
                          onClick={() => handleResultClick(item)}
                        >
                          <div className="mobile-search-result-image">
                            {(item.thumbnail_url || item.image_url) ? (
                              <img
                                src={item.thumbnail_url || item.image_url}
                                alt={item.name}
                                className="mobile-search-result-thumbnail"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="mobile-search-result-emoji"
                              style={{ display: (item.thumbnail_url || item.image_url) ? 'none' : 'flex' }}
                            >
                              {isCollectionType(item.type) ? '📦' : '🎴'}
                            </div>
                          </div>
                          <div className="mobile-search-result-details">
                            <div className="mobile-search-result-name">{item.name}</div>
                            <div className="mobile-search-result-meta">
                              {formatEntityType(item.type)}
                              {item.year && ` • ${item.year}`}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default MobileSearch;
