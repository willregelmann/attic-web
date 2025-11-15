import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { Grid3x3, List, Filter, Image as ImageIcon } from 'lucide-react';
import { SEMANTIC_SEARCH_DATABASE_OF_THINGS } from '../queries';
import { parseSearchUrlParams, buildSearchUrl, applySearchFilters } from '../utils/searchFilterUtils';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { useSearch } from '../contexts/SearchContext';
import SearchFilterPanel from './SearchFilterPanel';
import SearchResultListItem from './SearchResultListItem';
import { ItemCard } from './ItemCard';
import { ItemCardSkeleton } from './SkeletonLoader';
import CircularMenu from './CircularMenu';
import MobileSearch from './MobileSearch';
import './CollectionFilterPanel.css';
import './SearchResultsPage.css';

function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setBreadcrumbItems } = useBreadcrumbs();
  const { searchResults: imageSearchResults, imagePreview, isSearching, clearSearch } = useSearch();

  // Parse filters from URL (for text search)
  const filters = parseSearchUrlParams(searchParams);
  const { query, types } = filters;

  // Determine if this is an image search or text search
  const isImageSearch = imageSearchResults !== null && imageSearchResults !== undefined;

  // View mode state (saved in localStorage)
  const [viewMode, setViewMode] = useState(
    localStorage.getItem('searchResultsViewMode') || 'grid'
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // GraphQL query for text search results (skip if image search)
  // Note: We don't pass type to backend - all type filtering happens client-side
  // This allows users to see and select all available types regardless of current filter
  const { data, loading, error, fetchMore } = useQuery(
    SEMANTIC_SEARCH_DATABASE_OF_THINGS,
    {
      variables: {
        query: query,
        type: null,
        first: 30
      },
      skip: !query || isImageSearch
    }
  );

  // Results state
  const [allResults, setAllResults] = useState([]);
  const [hasMore, setHasMore] = useState(false);

  // Update results when data changes (text search) or from image search
  useEffect(() => {
    if (isImageSearch && imageSearchResults) {
      // For image search, we need to transform the results to match the expected format
      // Image search returns: {image_id, image_url, thumbnail_url, similarity, parent_type, parent_id, parent_name}
      // We need to transform to: {id, name, type, image_url, thumbnail_url, ...}
      const transformedResults = imageSearchResults.map(result => ({
        id: result.parent_id,
        name: result.parent_name,
        type: result.parent_type,
        image_url: result.image_url,
        thumbnail_url: result.thumbnail_url,
        similarity: result.similarity,
        // Flag to identify image search results
        _imageSearchResult: true
      }));
      setAllResults(transformedResults);
      setHasMore(false); // No pagination for image search results
    } else if (data?.databaseOfThingsSemanticSearch) {
      setAllResults(data.databaseOfThingsSemanticSearch);
      // If we got 30 results, there might be more
      setHasMore(data.databaseOfThingsSemanticSearch.length === 30);
    }
  }, [data, isImageSearch, imageSearchResults]);

  // Update breadcrumbs
  useEffect(() => {
    if (isImageSearch) {
      setBreadcrumbItems([
        { name: 'Home', path: '/' },
        { name: 'Image Search', path: null }
      ]);
    } else if (query) {
      setBreadcrumbItems([
        { name: 'Home', path: '/' },
        { name: `Search: "${query}"`, path: null }
      ]);
    }
  }, [query, isImageSearch, setBreadcrumbItems]);

  // Update view mode in localStorage
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('searchResultsViewMode', mode);
  };

  // Update URL when filters change
  const handleTypesChange = (newTypes) => {
    const url = buildSearchUrl(query, { types: newTypes });
    setSearchParams(new URLSearchParams(url.split('?')[1]));
  };

  const handleClearFilters = () => {
    const url = buildSearchUrl(query, { types: [] });
    setSearchParams(new URLSearchParams(url.split('?')[1]));
  };

  // Apply client-side filters
  const filteredResults = applySearchFilters(allResults, { types });

  // Handle load more
  const handleLoadMore = () => {
    // Note: Cursor-based pagination would require tracking endCursor
    // For now, we'll just show the message that there are no more results
    setHasMore(false);
  };

  if (!query && !isImageSearch) {
    return (
      <div className="search-results-page">
        <div className="search-results-empty">
          <div className="search-results-empty-icon">🔍</div>
          <p>Enter a search query to find collections and items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-page">
      <div className="search-results-layout">
        {/* Filter Panel - Desktop Sidebar */}
        <div className="search-filter-sidebar">
          <SearchFilterPanel
            results={allResults}
            selectedTypes={types}
            onTypesChange={handleTypesChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Results Area */}
        <div className="search-results-main">
          {/* Header */}
          <div className="search-results-header">
            <div className="search-results-title">
              {isImageSearch ? (
                <>
                  <div className="image-search-header">
                    <ImageIcon size={24} />
                    <h1>Similar Items</h1>
                  </div>
                  {!isSearching && (
                    <p className="search-results-count">
                      {filteredResults.length === 0
                        ? 'No similar items found'
                        : `Found ${filteredResults.length} visually similar item${filteredResults.length !== 1 ? 's' : ''}`}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h1>Search results for: "{query}"</h1>
                  {!loading && (
                    <p className="search-results-count">
                      {filteredResults.length === 0
                        ? 'No results found'
                        : `Showing ${filteredResults.length} result${filteredResults.length !== 1 ? 's' : ''}`}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="search-view-toggle">
              <button
                className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('grid')}
                aria-label="Grid view"
              >
                <Grid3x3 size={20} />
              </button>
              <button
                className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('list')}
                aria-label="List view"
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {(loading || isSearching) && (
            <div className={`search-results-${viewMode}`}>
              {Array.from({ length: 12 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="search-results-error">
              <div className="search-results-error-icon">⚠️</div>
              <p>Error loading search results</p>
              <button onClick={() => window.location.reload()}>Retry Search</button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !isSearching && !error && filteredResults.length === 0 && (
            <div className="search-results-empty">
              <div className="search-results-empty-icon">{isImageSearch ? '🖼️' : '🔍'}</div>
              {isImageSearch ? (
                <>
                  <p>No similar items found</p>
                  <p className="search-results-empty-hint">
                    Try uploading a different image or adjusting the similarity threshold
                  </p>
                </>
              ) : (
                <>
                  <p>No results found for "{query}"</p>
                  <p className="search-results-empty-hint">
                    Try adjusting your filters or search term
                  </p>
                </>
              )}
            </div>
          )}

          {/* Results Grid/List */}
          {!loading && !isSearching && !error && filteredResults.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <div className="search-results-grid">
                  {filteredResults.map(item => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="search-results-list">
                  {filteredResults.map(item => (
                    <SearchResultListItem key={item.id} item={item} />
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="search-results-load-more">
                  <button
                    className="search-load-more-button"
                    onClick={handleLoadMore}
                  >
                    Load more results
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="collection-filter-overlay" onClick={() => setShowMobileFilters(false)}>
          <div className="collection-filter-panel" onClick={(e) => e.stopPropagation()}>
            <div className="filter-panel-header">
              <h3>Search Filters</h3>
              <button
                className="filter-close-button"
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="filter-panel-body">
              <SearchFilterPanel
                results={allResults}
                selectedTypes={types}
                onTypesChange={handleTypesChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>
        </div>
      )}

      {/* Circular Menu for Mobile */}
      <CircularMenu
        actions={[
          {
            id: 'search',
            icon: 'fas fa-search',
            label: 'Search',
            onClick: () => setShowMobileSearch(true)
          },
          {
            id: 'filters',
            icon: 'fas fa-filter',
            label: 'Filters',
            onClick: () => setShowMobileFilters(true),
            badge: types.length > 0 ? types.length : undefined
          }
        ]}
      />
    </div>
  );
}

export default SearchResultsPage;
