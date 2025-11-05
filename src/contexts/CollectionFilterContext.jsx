import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CollectionFilterContext = createContext();

/**
 * CollectionFilterProvider - manages collection-specific filters with inheritance
 *
 * Storage format in localStorage:
 * {
 *   "collection-filters": {
 *     "collection-123": {
 *       "year": [2020, 2021, 2022],
 *       "country": ["US", "JP"],
 *       "attributes.rarity": ["Rare", "Legendary"]
 *     }
 *   }
 * }
 */

const STORAGE_KEY = 'collection-filters';

export function CollectionFilterProvider({ children }) {
  const [collectionFilters, setCollectionFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to parse collection filters:', e);
      return {};
    }
  });

  // Current active collection and inherited path
  const [currentCollectionId, setCurrentCollectionId] = useState(null);
  const [parentPath, setParentPath] = useState([]); // Array of parent collection IDs

  // Save to localStorage whenever filters change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectionFilters));
  }, [collectionFilters]);

  /**
   * Set the current collection and its parent path for inheritance
   * @param {string} collectionId - Current collection ID
   * @param {Array} ancestors - Array of ancestor collection IDs [grandparent, parent]
   */
  const setActiveCollection = useCallback((collectionId, ancestors = []) => {
    setCurrentCollectionId(collectionId);
    setParentPath(ancestors);
  }, []);

  /**
   * Get filters for a specific collection, including inherited filters
   * @param {string} collectionId - Collection ID to get filters for
   * @param {boolean} includeInherited - Whether to include inherited filters from ancestors
   */
  const getFiltersForCollection = useCallback((collectionId, includeInherited = true) => {
    if (!collectionId) return {};

    // Start with inherited filters if enabled
    let mergedFilters = {};

    if (includeInherited && parentPath.length > 0) {
      // Merge filters from ancestors (grandparent -> parent -> current)
      // Later filters override earlier ones for the same field
      for (const ancestorId of parentPath) {
        const ancestorFilters = collectionFilters[ancestorId] || {};
        mergedFilters = { ...mergedFilters, ...ancestorFilters };
      }
    }

    // Apply current collection's filters (overriding inherited ones)
    const ownFilters = collectionFilters[collectionId] || {};
    mergedFilters = { ...mergedFilters, ...ownFilters };

    return mergedFilters;
  }, [collectionFilters, parentPath]);

  /**
   * Set filters for a specific collection
   * @param {string} collectionId - Collection ID
   * @param {Object} filters - Filter object
   */
  const setFiltersForCollection = useCallback((collectionId, filters) => {
    setCollectionFilters(prev => ({
      ...prev,
      [collectionId]: filters
    }));
  }, []);

  /**
   * Update a single filter field for a collection
   * @param {string} collectionId - Collection ID
   * @param {string} field - Field name (e.g., "year", "country", "attributes.rarity")
   * @param {Array} values - Array of values to filter by
   */
  const updateCollectionFilter = useCallback((collectionId, field, values) => {
    setCollectionFilters(prev => {
      const collectionData = prev[collectionId] || {};

      // If values is empty, remove the filter field
      if (!values || values.length === 0) {
        const { [field]: removed, ...rest } = collectionData;
        return {
          ...prev,
          [collectionId]: rest
        };
      }

      return {
        ...prev,
        [collectionId]: {
          ...collectionData,
          [field]: values
        }
      };
    });
  }, []);

  /**
   * Clear all filters for a specific collection
   * @param {string} collectionId - Collection ID
   */
  const clearFiltersForCollection = useCallback((collectionId) => {
    setCollectionFilters(prev => {
      const { [collectionId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Check if a collection has any active filters (not including inherited)
   * @param {string} collectionId - Collection ID
   */
  const hasActiveFilters = useCallback((collectionId) => {
    const filters = collectionFilters[collectionId];
    return !!(filters && Object.keys(filters).length > 0);
  }, [collectionFilters]);

  /**
   * Check if a collection has any effective filters (including inherited)
   * @param {string} collectionId - Collection ID
   */
  const hasEffectiveFilters = useCallback((collectionId) => {
    const filters = getFiltersForCollection(collectionId, true);
    return Object.keys(filters).length > 0;
  }, [getFiltersForCollection]);

  /**
   * Get all unique values for a field across items
   * @param {Array} items - Array of items
   * @param {string} field - Field path (e.g., "year", "country", "attributes.rarity")
   */
  const getFieldValues = useCallback((items, field) => {
    const values = new Set();

    items.forEach(item => {
      // Handle nested paths like "attributes.rarity"
      const fieldParts = field.split('.');
      let value = item;

      for (const part of fieldParts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          value = null;
          break;
        }
      }

      if (value !== null && value !== undefined && value !== '') {
        // Handle arrays
        if (Array.isArray(value)) {
          value.forEach(v => values.add(v));
        } else {
          values.add(value);
        }
      }
    });

    return Array.from(values).sort();
  }, []);

  /**
   * Apply filters to a list of items
   * @param {Array} items - Items to filter
   * @param {Object} filters - Filters to apply
   */
  const applyFilters = useCallback((items, filters) => {
    if (!filters || Object.keys(filters).length === 0) {
      return items;
    }

    return items.filter(item => {
      // Determine if this is a collection type
      const isCollection = item.type && item.type.toLowerCase().includes('collection');

      // Check all filter conditions
      return Object.entries(filters).every(([field, allowedValues]) => {
        if (!allowedValues || allowedValues.length === 0) return true;

        // Get item value for this field
        const fieldParts = field.split('.');
        let value = item;

        for (const part of fieldParts) {
          if (value && typeof value === 'object') {
            value = value[part];
          } else {
            value = null;
            break;
          }
        }

        // If value is null/undefined
        if (value === null || value === undefined) {
          // Keep collections (they might have matching descendants)
          // Exclude non-collections
          return isCollection;
        }

        // Handle array values
        if (Array.isArray(value)) {
          return value.some(v => allowedValues.includes(String(v)));
        }

        // Handle single values - convert to string for comparison since filter values are strings
        return allowedValues.includes(String(value));
      });
    });
  }, []);

  const value = {
    currentCollectionId,
    setActiveCollection,
    getFiltersForCollection,
    setFiltersForCollection,
    updateCollectionFilter,
    clearFiltersForCollection,
    hasActiveFilters,
    hasEffectiveFilters,
    getFieldValues,
    applyFilters
  };

  return (
    <CollectionFilterContext.Provider value={value}>
      {children}
    </CollectionFilterContext.Provider>
  );
}

export function useCollectionFilter() {
  const context = useContext(CollectionFilterContext);
  if (!context) {
    throw new Error('useCollectionFilter must be used within CollectionFilterProvider');
  }
  return context;
}
