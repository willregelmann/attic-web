import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client/react';
import { Camera } from 'lucide-react';
import { SEMANTIC_SEARCH_DATABASE_OF_THINGS } from '../queries';
import { isCollectionType, formatEntityType } from '../utils/formatters';

function MobileSearch({ isOpen, onClose, onAddToCollection, onOpenImageSearch }) {
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
        searchItems({ variables: { query: searchQuery, first: 10 } });
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

  const handleViewAllResults = () => {
    const query = encodeURIComponent(searchQuery);
    setSearchQuery('');
    onClose();
    navigate(`/search?q=${query}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleViewAllResults();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - blurs the app content */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999]"
        onClick={handleClose}
      />

      <div className="fixed top-5 left-4 right-4 z-[10000] flex flex-col max-h-[calc(100vh-40px)]">
        <div className="flex flex-col bg-[var(--bg-primary)] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] overflow-hidden max-h-full">
          <div className="flex items-center gap-3 p-4 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
            <div className="flex-1 flex items-center gap-2 rounded-lg py-2.5 px-3">
              <svg className="text-[var(--text-secondary)] shrink-0" viewBox="0 0 24 24" fill="none" width="20" height="20">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="flex-1 border-none bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                placeholder="Search collections and items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="bg-none border-none p-1 text-[var(--text-secondary)] cursor-pointer flex items-center justify-center"
                  onClick={() => setSearchQuery('')}
                >
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="bg-none border-none p-1 text-[var(--text-secondary)] cursor-pointer flex items-center justify-center transition-colors active:text-[var(--primary)]"
                onClick={() => {
                  onOpenImageSearch?.(); // Open image search modal
                  onClose(); // Close mobile search when switching to image search
                }}
                title="Search by image"
              >
                <Camera size={18} />
              </button>
            </div>
          </div>

          {searchQuery.length > 2 && (
            <div className="overflow-hidden flex flex-col bg-[var(--bg-primary)] min-h-0">
              {searchLoading && (
                <div className="text-center py-8 px-4 text-[var(--text-secondary)]">Searching...</div>
              )}
              {!searchLoading && searchData?.databaseOfThingsSemanticSearch && (() => {
                const searchResults = searchData.databaseOfThingsSemanticSearch?.edges?.map(e => e.node) || [];
                return (
                <>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8 px-4 text-[var(--text-secondary)]">No results found</div>
                  ) : (
                    <>
                      <div className="py-2 overflow-y-auto min-h-0 max-h-[400px]">
                        {searchResults.map(item => (
                          <button
                            key={item.id}
                            className="flex items-center gap-3 py-3 px-4 bg-none border-none w-full text-left cursor-pointer transition-colors active:bg-[var(--bg-secondary)]"
                            onClick={() => handleResultClick(item)}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative bg-[var(--bg-secondary)]">
                              {(item.thumbnail_url || item.image_url || item.representative_image_urls?.[0]) ? (
                                <img
                                  src={item.thumbnail_url || item.image_url || item.representative_image_urls?.[0]}
                                  alt={item.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-full h-full flex items-center justify-center text-2xl"
                                style={{ display: (item.thumbnail_url || item.image_url || item.representative_image_urls?.[0]) ? 'none' : 'flex' }}
                              >
                                {isCollectionType(item.type) ? '📦' : '🎴'}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-base font-medium text-[var(--text-primary)] mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                {item.name}
                              </div>
                              <div className="text-sm text-[var(--text-secondary)]">
                                {formatEntityType(item.type)}
                                {item.year && ` • ${item.year}`}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {searchResults.length === 10 && (
                        <button
                          className="block w-full p-4 bg-[var(--bg-primary)] border-none border-t border-[var(--border-color)] text-[var(--primary)] text-base font-semibold cursor-pointer transition-all text-center shrink-0 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] active:bg-[var(--bg-secondary)]"
                          onClick={handleViewAllResults}
                          data-testid="mobile-view-all-results"
                        >
                          View all results →
                        </button>
                      )}
                    </>
                  )}
                </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MobileSearch;
