import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { Grid3x3, List, Image as ImageIcon } from 'lucide-react';
import { SEMANTIC_SEARCH_DATABASE_OF_THINGS } from '../queries';
import { parseSearchUrlParams, buildSearchUrl, applySearchFilters } from '../utils/searchFilterUtils';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { useSearch } from '../contexts/SearchContext';
import { useRadialMenu } from '../contexts/RadialMenuContext';
import SearchFilterDrawer from './SearchFilterDrawer';
import SearchResultListItem from './SearchResultListItem';
import { EntityCardGrid } from './EntityCardGrid';
import { EntityCardSkeleton } from './SkeletonLoader';
import MobileSearch from './MobileSearch';
import { ImageSearchModal } from './ImageSearchModal';
import EntityDetailModal from './EntityDetailModal';
import { isCollectionType } from '../utils/formatters';

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
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Set RadialMenu actions via context
  useRadialMenu([
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
  ], [types.length]);

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
      skip: !query || isImageSearch,
      fetchPolicy: 'network-only'
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
      // Extract nodes from EntityConnection edges
      const results = data.databaseOfThingsSemanticSearch?.edges?.map(e => e.node) || [];
      setAllResults(results);
      // If we got 30 results, there might be more
      setHasMore(results.length === 30);
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

  // Handle item click - show modal for items, navigate for collections
  const handleItemClick = (item) => {
    if (isCollectionType(item)) {
      navigate(`/collection/${item.id}`);
    } else {
      setSelectedItem(item);
    }
  };

  if (!query && !isImageSearch) {
    return (
      <div className="max-w-[1400px] mx-auto p-6 md:p-4 min-h-[calc(100vh-80px)]">
        <div className="text-center py-20 px-5">
          <div className="text-6xl md:text-5xl mb-4 opacity-30">🔍</div>
          <p className="text-lg text-[var(--text-secondary)] my-2">Enter a search query to find collections and items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-4 min-h-[calc(100vh-80px)]">
      <div className="grid grid-cols-1 gap-4">
        {/* Results Area */}
        <div className="min-w-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-3 md:gap-4">
            <div>
              {isImageSearch ? (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <ImageIcon size={24} className="text-[var(--primary)]" />
                    <h1 className="text-2xl md:text-[1.75rem] font-bold text-[var(--text-primary)] m-0">Similar Items</h1>
                  </div>
                  {!isSearching && (
                    <p className="text-base text-[var(--text-secondary)] m-0">
                      {filteredResults.length === 0
                        ? 'No similar items found'
                        : `Found ${filteredResults.length} visually similar item${filteredResults.length !== 1 ? 's' : ''}`}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h1 className="text-2xl md:text-[1.75rem] font-bold text-[var(--text-primary)] m-0 mb-2">Search results for: "{query}"</h1>
                  {!loading && (
                    <p className="text-base text-[var(--text-secondary)] m-0">
                      {filteredResults.length === 0
                        ? 'No results found'
                        : `Showing ${filteredResults.length} result${filteredResults.length !== 1 ? 's' : ''}`}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                className={`flex items-center justify-center w-10 h-10 p-0 border rounded-lg cursor-pointer transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                    : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => handleViewModeChange('grid')}
                aria-label="Grid view"
              >
                <Grid3x3 size={20} />
              </button>
              <button
                className={`flex items-center justify-center w-10 h-10 p-0 border rounded-lg cursor-pointer transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                    : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => handleViewModeChange('list')}
                aria-label="List view"
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {(loading || isSearching) && (
            <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 md:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <EntityCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20 md:py-[80px] px-5">
              <div className="text-6xl md:text-5xl mb-4">⚠️</div>
              <p className="text-lg text-[var(--text-secondary)] my-2 mb-6">Error loading search results</p>
              <button
                className="py-3 px-6 bg-[var(--primary)] text-white border-none rounded-lg text-base font-medium cursor-pointer transition-opacity duration-200 hover:opacity-90"
                onClick={() => window.location.reload()}
              >
                Retry Search
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !isSearching && !error && filteredResults.length === 0 && (
            <div className="text-center py-16 md:py-20 px-5">
              <div className="text-5xl md:text-6xl mb-4 opacity-30">{isImageSearch ? '🖼️' : '🔍'}</div>
              {isImageSearch ? (
                <>
                  <p className="text-lg text-[var(--text-secondary)] my-2">No similar items found</p>
                  <p className="text-[0.95rem] text-[var(--text-secondary)] opacity-70">
                    Try uploading a different image or adjusting the similarity threshold
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg text-[var(--text-secondary)] my-2">No results found for "{query}"</p>
                  <p className="text-[0.95rem] text-[var(--text-secondary)] opacity-70">
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
                <EntityCardGrid
                  items={filteredResults}
                  onClick={{ item: handleItemClick, collection: handleItemClick }}
                  viewMode="grid"
                />
              ) : (
                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                  {filteredResults.map(item => (
                    <SearchResultListItem key={item.id} item={item} />
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    className="py-3.5 px-8 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-base font-medium cursor-pointer transition-all duration-200 hover:bg-[var(--bg-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
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
        onOpenImageSearch={() => setShowImageSearchModal(true)}
      />

      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={showImageSearchModal}
        onClose={() => setShowImageSearchModal(false)}
      />

      {/* Filter Drawer (Mobile & Desktop) */}
      <SearchFilterDrawer
        results={allResults}
        selectedTypes={types}
        onTypesChange={handleTypesChange}
        onClearFilters={handleClearFilters}
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
      />

      {/* Entity Detail Modal */}
      {selectedItem && (
        <EntityDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onNavigateToCollection={(collection) => {
            setSelectedItem(null);
            navigate(`/collection/${collection.id}`);
          }}
        />
      )}
    </div>
  );
}

export default SearchResultsPage;
