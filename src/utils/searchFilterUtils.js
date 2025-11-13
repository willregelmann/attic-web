/**
 * Search Filter Utilities
 *
 * Utility functions for filtering search results and managing search URL parameters.
 */

/**
 * Extract unique years from search results, sorted descending (newest first)
 * @param {Array} results - Array of search result items
 * @returns {Array} Sorted array of unique years
 */
export function extractYearsFromResults(results) {
  if (!results || results.length === 0) return [];

  const years = new Set();
  results.forEach(item => {
    // Check direct year field
    if (item.year) {
      years.add(parseInt(item.year, 10));
    }
    // Check attributes.year if available
    if (item.attributes && item.attributes.year) {
      years.add(parseInt(item.attributes.year, 10));
    }
  });

  return Array.from(years).sort((a, b) => b - a); // Descending order
}

/**
 * Extract unique countries from search results, sorted alphabetically
 * @param {Array} results - Array of search result items
 * @returns {Array} Sorted array of unique country codes
 */
export function extractCountriesFromResults(results) {
  if (!results || results.length === 0) return [];

  const countries = new Set();
  results.forEach(item => {
    // Check direct country field
    if (item.country) {
      countries.add(item.country);
    }
    // Check attributes.country if available
    if (item.attributes && item.attributes.country) {
      countries.add(item.attributes.country);
    }
  });

  return Array.from(countries).sort();
}

/**
 * Extract unique entity types from search results, sorted alphabetically
 * @param {Array} results - Array of search result items
 * @returns {Array} Sorted array of unique entity types
 */
export function extractTypesFromResults(results) {
  if (!results || results.length === 0) return [];

  const types = new Set();
  results.forEach(item => {
    if (item.type) {
      types.add(item.type);
    }
  });

  return Array.from(types).sort();
}

/**
 * Apply client-side filters to search results
 * @param {Array} results - Array of search result items
 * @param {Object} filters - Filter criteria
 * @param {Array} filters.types - Array of entity types to filter by
 * @returns {Array} Filtered results
 */
export function applySearchFilters(results, filters) {
  if (!results || results.length === 0) return [];

  let filtered = [...results];

  // Type filter (OR logic - match any selected type)
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter(item => {
      return item.type && filters.types.includes(item.type);
    });
  }

  return filtered;
}

/**
 * Parse URL search params into filter object
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Parsed filter object
 */
export function parseSearchUrlParams(searchParams) {
  const typeParam = searchParams.get('type');

  return {
    query: searchParams.get('q') || '',
    types: typeParam ? typeParam.split(',').filter(Boolean) : []
  };
}

/**
 * Build URL with current filters
 * @param {string} query - Search query string
 * @param {Object} filters - Filter object
 * @param {Array} filters.types - Array of entity types to filter by
 * @returns {string} URL path with query parameters
 */
export function buildSearchUrl(query, filters = {}) {
  const params = new URLSearchParams();

  if (query) {
    params.set('q', query);
  }

  if (filters.types && filters.types.length > 0) {
    params.set('type', filters.types.join(','));
  }

  return `/search?${params.toString()}`;
}
