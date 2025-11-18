import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_COLLECTION_FILTER_FIELDS, GET_COLLECTION_PARENT_COLLECTIONS } from '../queries';
import { useCollectionFilter } from '../contexts/CollectionFilterContext';
import { useFilters } from '../contexts/FilterContext';
import { useAuth } from '../contexts/AuthContext';
import { countFilterValues, formatFilterValue, countParentCollections } from '../utils/collectionFilterUtils';
import { FilterFieldsSkeleton } from './SkeletonLoader';

function CollectionFilterDrawer({ collectionId, items, fetchCollectionItems, isOpen, onClose, userOwnership}) {
  const { isAuthenticated } = useAuth();
  const {
    getFiltersForCollection,
    updateCollectionFilter,
    clearFiltersForCollection,
    hasActiveFilters
  } = useCollectionFilter();
  const { groupDuplicates, setGroupDuplicates } = useFilters();

  const [expandedFields, setExpandedFields] = useState(new Set());

  // Get current filters
  const activeFilters = getFiltersForCollection(collectionId);
  const hasFilters = hasActiveFilters(collectionId);
  const textSearch = activeFilters._text_search || '';

  // For root level, we'll build filters from items instead of querying the server
  const isRootLevel = collectionId === 'root';

  // Fetch filterable fields from server (with caching)
  // Note: Only discovers fields from direct children, not nested subcollections
  const { data: filterFieldsData, loading: isLoadingFilterFields } = useQuery(
    GET_COLLECTION_FILTER_FIELDS,
    {
      variables: { collectionId },
      skip: !isOpen || !collectionId || isRootLevel,
      fetchPolicy: 'cache-and-network', // Check server but show cached data while loading
    }
  );

  // Fetch parent collections for this collection
  const { data: parentCollectionsData, loading: isLoadingParentCollections } = useQuery(
    GET_COLLECTION_PARENT_COLLECTIONS,
    {
      variables: { collectionId },
      skip: !isOpen || !collectionId || isRootLevel,
      fetchPolicy: 'cache-and-network',
    }
  );

  // Get filterable fields from server response, plus parent collections and ownership
  const filterableFields = useMemo(() => {
    let metadataFields = [];

    if (isRootLevel) {
      // For root level, build filter fields from items themselves
      const attributeMap = new Map();

      items.forEach(item => {
        if (item.attributes) {
          Object.entries(item.attributes).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              if (!attributeMap.has(key)) {
                attributeMap.set(key, new Set());
              }
              // Handle array values
              if (Array.isArray(value)) {
                value.forEach(v => attributeMap.get(key).add(String(v)));
              } else {
                attributeMap.get(key).add(String(value));
              }
            }
          });
        }
      });

      // Convert to filter field format
      metadataFields = Array.from(attributeMap.entries()).map(([key, valuesSet]) => ({
        field: key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        type: 'multiselect',
        values: Array.from(valuesSet).sort(),
        priority: 0
      }));
    } else {
      metadataFields = filterFieldsData?.databaseOfThingsCollectionFilterFields || [];
    }

    const parentCollections = parentCollectionsData?.databaseOfThingsCollectionParentCollections || [];
    const specialFields = [];

    // Add ownership filter for authenticated users
    if (isAuthenticated && userOwnership) {
      specialFields.push({
        field: 'ownership',
        label: 'Ownership',
        type: 'multiselect',
        values: ['owned', 'missing'],
        priority: 110, // Highest priority - appears first
        isOwnershipFilter: true
      });
    }

    // If there are parent collections, add them as a special filter field (not for root level)
    if (!isRootLevel && parentCollections.length > 0) {
      specialFields.push({
        field: 'parent_collections',
        label: 'Collection(s)',
        type: 'multiselect',
        values: parentCollections.map(c => c.id), // Use IDs as values
        priority: 100, // High priority - appears at top
        parentCollectionsData: parentCollections // Store full collection data for lookup
      });
    }

    // Merge and sort by priority (higher priority first)
    return [...specialFields, ...metadataFields].sort((a, b) =>
      (b.priority || 0) - (a.priority || 0)
    );
  }, [isRootLevel, items, filterFieldsData, parentCollectionsData, isAuthenticated, userOwnership]);

  // Pre-compute value counts for all fields
  const allValueCounts = useMemo(() => {
    const counts = {};
    filterableFields.forEach(fieldInfo => {
      if (fieldInfo.field === 'ownership') {
        // Special handling for ownership filter
        const ownedCount = items.filter(item => userOwnership?.has(item.id)).length;
        const missingCount = items.length - ownedCount;
        counts[fieldInfo.field] = {
          'owned': ownedCount,
          'missing': missingCount
        };
      } else if (fieldInfo.field === 'parent_collections') {
        // Special handling for parent collections
        counts[fieldInfo.field] = countParentCollections(items, fieldInfo.parentCollectionsData);
      } else {
        counts[fieldInfo.field] = countFilterValues(items, fieldInfo.field);
      }
    });
    return counts;
  }, [items, filterableFields, userOwnership]);

  // Auto-expand fields that have active filters
  useEffect(() => {
    const fieldsWithFilters = Object.keys(activeFilters);
    if (fieldsWithFilters.length > 0) {
      setExpandedFields(new Set(fieldsWithFilters));
    }
  }, [activeFilters]);

  const toggleField = (field) => {
    setExpandedFields(prev => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const handleValueToggle = (field, value) => {
    const currentValues = activeFilters[field] || [];
    const isSelected = currentValues.includes(value);

    let newValues;
    if (isSelected) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }

    updateCollectionFilter(collectionId, field, newValues);
  };

  const handleClearAll = () => {
    clearFiltersForCollection(collectionId);
    setExpandedFields(new Set());
  };

  const handleClearField = (field) => {
    updateCollectionFilter(collectionId, field, []);
  };

  const handleTextSearchChange = (e) => {
    const value = e.target.value;
    updateCollectionFilter(collectionId, '_text_search', value);
  };

  const handleClearTextSearch = () => {
    updateCollectionFilter(collectionId, '_text_search', '');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 md:bg-black/50 z-[1500] flex items-center justify-center md:items-stretch md:justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-[90%] max-w-[500px] max-h-[90vh] md:max-h-screen md:w-full md:max-w-[400px] md:fixed md:top-0 md:right-0 md:bottom-0 bg-[var(--bg-primary)] rounded-2xl md:rounded-none shadow-[0_8px_24px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-slide-up md:animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 md:p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-primary)] flex-shrink-0">
          <h3 className="m-0 text-xl md:text-lg font-bold text-[var(--text-primary)]">Collection Filters</h3>
          <button
            className="absolute top-4 right-4 bg-black/10 border-none rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-200 z-10 text-[var(--text-secondary)] hover:bg-black/20 hover:rotate-90"
            onClick={onClose}
            aria-label="Close filters"
          >
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-3">
          {/* Text Search Filter */}
          <div className="mb-4 pb-4 border-b border-[var(--border-color)]">
            <div className="relative flex items-center">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="absolute left-3 text-[var(--text-secondary)] pointer-events-none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="w-full py-3 pr-11 pl-10 border-2 border-[var(--border-color)] rounded-lg text-[15px] bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-200 focus:outline-none focus:border-[var(--primary)] focus:bg-[var(--bg-primary)] placeholder:text-[var(--text-secondary)]"
                placeholder="Search items..."
                value={textSearch}
                onChange={handleTextSearchChange}
              />
              {textSearch && (
                <button
                  className="absolute right-2 bg-transparent border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-[var(--text-secondary)] transition-all duration-200 hover:bg-black/10 hover:text-[var(--text-primary)]"
                  onClick={handleClearTextSearch}
                  aria-label="Clear text search"
                >
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Group Duplicates Filter */}
          <div className="p-3 px-4 border-b border-[var(--border-color)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={groupDuplicates}
                onChange={(e) => setGroupDuplicates(e.target.checked)}
                className="w-[18px] h-[18px] cursor-pointer accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--text-primary)]">Group duplicates</span>
            </label>
          </div>

          {(!isRootLevel && (isLoadingFilterFields || isLoadingParentCollections)) ? (
            <FilterFieldsSkeleton count={5} />
          ) : filterableFields.length === 0 ? (
            <div className="text-center py-12 px-8 text-[var(--text-secondary)]">
              <p>No filterable fields found in this collection.</p>
            </div>
          ) : (
            <>
              {filterableFields.map(fieldInfo => {
                const { field, label, values } = fieldInfo;
                const isExpanded = expandedFields.has(field);
                const selectedValues = activeFilters[field] || [];
                const hasSelection = selectedValues.length > 0;
                const valueCounts = allValueCounts[field] || {};

                return (
                  <div key={field} className="mb-2 border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-primary)]">
                    <div
                      className={`w-full p-4 bg-transparent border-none flex justify-between items-center cursor-pointer transition-all duration-200 text-left hover:bg-[var(--bg-secondary)] ${hasSelection ? 'bg-[rgba(42,82,152,0.05)]' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleField(field)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleField(field);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-semibold text-[var(--text-primary)] text-[15px]">{label}</span>
                        {hasSelection && (
                          <span className="bg-[var(--primary)] text-white py-0.5 px-2 rounded-xl text-xs font-semibold">{selectedValues.length}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSelection && (
                          <button
                            className="bg-transparent border-none text-[var(--primary)] cursor-pointer text-[13px] font-semibold py-1 px-2 rounded transition-all duration-200 hover:bg-[rgba(42,82,152,0.1)]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearField(field);
                            }}
                            aria-label={`Clear ${label} filters`}
                          >
                            Clear
                          </button>
                        )}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          width="16"
                          height="16"
                          className={`text-[var(--text-secondary)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="py-2 px-4 pb-4 flex flex-col gap-2 bg-[var(--bg-secondary)]">
                        {values.map(value => {
                          const isSelected = selectedValues.includes(value);
                          const count = valueCounts[value] || 0;

                          // Special display formatting
                          let displayValue = formatFilterValue(value);

                          // For ownership filter, show friendly labels
                          if (field === 'ownership') {
                            displayValue = value === 'owned' ? 'Owned' : 'Missing';
                          }
                          // For parent_collections, display collection name instead of ID
                          else if (field === 'parent_collections' && fieldInfo.parentCollectionsData) {
                            const collection = fieldInfo.parentCollectionsData.find(c => c.id === value);
                            displayValue = collection?.name || value;
                          }

                          return (
                            <label key={value} className="flex items-center gap-3 cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-[var(--bg-primary)]">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleValueToggle(field, value)}
                                className="w-[18px] h-[18px] cursor-pointer accent-[var(--primary)]"
                              />
                              <span className="flex-1 text-[15px] text-[var(--text-primary)] flex justify-between items-center">
                                {displayValue}
                                <span className="text-[var(--text-secondary)] text-[13px] ml-2">({count})</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {hasFilters && (
          <div className="p-4 px-6 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
            <button
              className="w-full py-3 bg-transparent text-[var(--primary)] border-2 border-[var(--primary)] rounded-lg font-semibold text-[15px] cursor-pointer transition-all duration-200 hover:bg-[var(--primary)] hover:text-white"
              onClick={handleClearAll}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionFilterDrawer;
