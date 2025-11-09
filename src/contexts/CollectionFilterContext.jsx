import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CollectionFilterContext = createContext();

/**
 * CollectionFilterProvider - manages collection-specific filters
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

  // Current active collection
  const [currentCollectionId, setCurrentCollectionId] = useState(null);

  // Save to localStorage whenever filters change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectionFilters));
  }, [collectionFilters]);

  /**
   * Set the current collection
   * @param {string} collectionId - Current collection ID
   */
  const setActiveCollection = useCallback((collectionId) => {
    setCurrentCollectionId(collectionId);
  }, []);

  /**
   * Get filters for a specific collection
   * @param {string} collectionId - Collection ID to get filters for
   */
  const getFiltersForCollection = useCallback((collectionId) => {
    if (!collectionId) return {};
    return collectionFilters[collectionId] || {};
  }, [collectionFilters]);

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
   * @param {string} field - Field name (e.g., "year", "country", "attributes.rarity", "_text_search")
   * @param {Array|string} values - Array of values to filter by, or string for text search
   */
  const updateCollectionFilter = useCallback((collectionId, field, values) => {
    setCollectionFilters(prev => {
      const collectionData = prev[collectionId] || {};

      // If values is empty, remove the filter field
      const isEmpty = Array.isArray(values)
        ? values.length === 0
        : (typeof values === 'string' ? values.trim() === '' : !values);

      if (isEmpty) {
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
   * Check if a collection has any active filters
   * @param {string} collectionId - Collection ID
   */
  const hasActiveFilters = useCallback((collectionId) => {
    const filters = collectionFilters[collectionId];
    return !!(filters && Object.keys(filters).length > 0);
  }, [collectionFilters]);

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
   * @param {Array} parentCollections - Parent collections data (for parent_collections filter)
   */
  const applyFilters = useCallback((items, filters, parentCollections = []) => {
    if (!filters || Object.keys(filters).length === 0) {
      return items;
    }

    // Build a map of item_id -> parent_collection_ids for parent_collections filtering
    const itemToParentsMap = {};
    if (filters.parent_collections && parentCollections.length > 0) {
      parentCollections.forEach(collection => {
        const itemIds = collection.attributes?.item_ids || [];
        itemIds.forEach(itemId => {
          if (!itemToParentsMap[itemId]) {
            itemToParentsMap[itemId] = [];
          }
          itemToParentsMap[itemId].push(collection.id);
        });
      });
    }

    return items.filter(item => {
      // Determine if this is a collection type
      const isCollection = item.type && item.type.toLowerCase().includes('collection');

      // Check all filter conditions
      return Object.entries(filters).every(([field, allowedValues]) => {
        if (!allowedValues || (Array.isArray(allowedValues) && allowedValues.length === 0)) return true;

        // Special handling for text search filter
        if (field === '_text_search' && typeof allowedValues === 'string') {
          const searchTerm = allowedValues.toLowerCase().trim();
          if (!searchTerm) return true;

          // Search in name
          const name = item.name?.toLowerCase() || '';
          if (name.includes(searchTerm)) return true;

          // Search in description
          const description = item.metadata?.description?.toLowerCase() ||
                             item.description?.toLowerCase() || '';
          if (description.includes(searchTerm)) return true;

          // Keep collections (they might have matching descendants)
          if (isCollection) return true;

          // Didn't match text search
          return false;
        }

        // Special handling for parent_collections filter
        if (field === 'parent_collections') {
          const itemParents = itemToParentsMap[item.id] || [];
          // Item matches if it belongs to ANY of the selected parent collections (OR logic)
          return itemParents.some(parentId => allowedValues.includes(parentId));
        }

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
