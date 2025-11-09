import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_COLLECTION_FILTER_FIELDS, GET_COLLECTION_PARENT_COLLECTIONS } from '../queries';
import { useCollectionFilter } from '../contexts/CollectionFilterContext';
import { countFilterValues, formatFilterValue, countParentCollections } from '../utils/collectionFilterUtils';
import { FilterFieldsSkeleton } from './SkeletonLoader';
import './CollectionFilterPanel.css';

function CollectionFilterPanel({ collectionId, items, fetchCollectionItems, isOpen, onClose }) {
  const {
    getFiltersForCollection,
    updateCollectionFilter,
    clearFiltersForCollection,
    hasActiveFilters
  } = useCollectionFilter();

  const [expandedFields, setExpandedFields] = useState(new Set());

  // Get current filters
  const activeFilters = getFiltersForCollection(collectionId);
  const hasFilters = hasActiveFilters(collectionId);
  const textSearch = activeFilters._text_search || '';

  // Fetch filterable fields from server (with caching)
  // Note: Only discovers fields from direct children, not nested subcollections
  const { data: filterFieldsData, loading: isLoadingFilterFields } = useQuery(
    GET_COLLECTION_FILTER_FIELDS,
    {
      variables: { collectionId },
      skip: !isOpen || !collectionId,
      fetchPolicy: 'cache-and-network', // Check server but show cached data while loading
    }
  );

  // Fetch parent collections for this collection
  const { data: parentCollectionsData, loading: isLoadingParentCollections } = useQuery(
    GET_COLLECTION_PARENT_COLLECTIONS,
    {
      variables: { collectionId },
      skip: !isOpen || !collectionId,
      fetchPolicy: 'cache-and-network',
    }
  );

  // Get filterable fields from server response, plus parent collections
  const filterableFields = useMemo(() => {
    const metadataFields = filterFieldsData?.databaseOfThingsCollectionFilterFields || [];
    const parentCollections = parentCollectionsData?.databaseOfThingsCollectionParentCollections || [];

    // If there are parent collections, add them as a special filter field
    if (parentCollections.length > 0) {
      const parentCollectionField = {
        field: 'parent_collections',
        label: 'Collection(s)',
        type: 'multiselect',
        values: parentCollections.map(c => c.id), // Use IDs as values
        priority: 100, // High priority - appears at top
        parentCollectionsData: parentCollections // Store full collection data for lookup
      };

      // Merge and sort by priority (higher priority first)
      return [parentCollectionField, ...metadataFields].sort((a, b) =>
        (b.priority || 0) - (a.priority || 0)
      );
    }

    return metadataFields;
  }, [filterFieldsData, parentCollectionsData]);

  // Pre-compute value counts for all fields
  const allValueCounts = useMemo(() => {
    const counts = {};
    filterableFields.forEach(fieldInfo => {
      if (fieldInfo.field === 'parent_collections') {
        // Special handling for parent collections
        counts[fieldInfo.field] = countParentCollections(items, fieldInfo.parentCollectionsData);
      } else {
        counts[fieldInfo.field] = countFilterValues(items, fieldInfo.field);
      }
    });
    return counts;
  }, [items, filterableFields]);

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
    <div className="collection-filter-overlay" onClick={onClose}>
      <div className="collection-filter-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filter-panel-header">
          <h3>Collection Filters</h3>
          <button className="filter-close-button" onClick={onClose} aria-label="Close filters">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="filter-panel-body">
          {/* Text Search Filter */}
          <div className="filter-text-search">
            <div className="filter-text-search-input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="search-icon">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="filter-text-search-input"
                placeholder="Search items..."
                value={textSearch}
                onChange={handleTextSearchChange}
              />
              {textSearch && (
                <button
                  className="filter-text-search-clear"
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

          {(isLoadingFilterFields || isLoadingParentCollections) ? (
            <FilterFieldsSkeleton count={5} />
          ) : filterableFields.length === 0 ? (
            <div className="filter-empty-state">
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
                  <div key={field} className="filter-field-group">
                    <div
                      className={`filter-field-header ${hasSelection ? 'has-selection' : ''}`}
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
                      <div className="filter-field-title">
                        <span className="filter-field-label">{label}</span>
                        {hasSelection && (
                          <span className="filter-field-count">{selectedValues.length}</span>
                        )}
                      </div>
                      <div className="filter-field-actions">
                        {hasSelection && (
                          <button
                            className="filter-clear-field-button"
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
                          className={`filter-expand-icon ${isExpanded ? 'expanded' : ''}`}
                        >
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="filter-field-values">
                        {values.map(value => {
                          const isSelected = selectedValues.includes(value);
                          const count = valueCounts[value] || 0;

                          // For parent_collections, display collection name instead of ID
                          let displayValue = formatFilterValue(value);
                          if (field === 'parent_collections' && fieldInfo.parentCollectionsData) {
                            const collection = fieldInfo.parentCollectionsData.find(c => c.id === value);
                            displayValue = collection?.name || value;
                          }

                          return (
                            <label key={value} className="filter-value-option">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleValueToggle(field, value)}
                                className="filter-checkbox"
                              />
                              <span className="filter-value-label">
                                {displayValue}
                                <span className="filter-value-count">({count})</span>
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
          <div className="filter-panel-footer">
            <button className="filter-clear-all-button" onClick={handleClearAll}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionFilterPanel;
