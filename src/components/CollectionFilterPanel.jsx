import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_COLLECTION_FILTER_FIELDS } from '../queries';
import { useCollectionFilter } from '../contexts/CollectionFilterContext';
import { countFilterValues, formatFilterValue } from '../utils/collectionFilterUtils';
import { FilterFieldsSkeleton } from './SkeletonLoader';
import './CollectionFilterPanel.css';

function CollectionFilterPanel({ collectionId, items, fetchCollectionItems, isOpen, onClose }) {
  const {
    getFiltersForCollection,
    updateCollectionFilter,
    clearFiltersForCollection,
    hasActiveFilters,
    hasEffectiveFilters
  } = useCollectionFilter();

  const [expandedFields, setExpandedFields] = useState(new Set());

  // Get current filters (including inherited)
  const activeFilters = getFiltersForCollection(collectionId, true);
  const ownFilters = getFiltersForCollection(collectionId, false);
  const hasOwn = hasActiveFilters(collectionId);
  const hasEffective = hasEffectiveFilters(collectionId);

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

  // Get filterable fields from server response
  const filterableFields = useMemo(() => {
    return filterFieldsData?.databaseOfThingsCollectionFilterFields || [];
  }, [filterFieldsData]);

  // Pre-compute value counts for all fields
  const allValueCounts = useMemo(() => {
    const counts = {};
    filterableFields.forEach(fieldInfo => {
      counts[fieldInfo.field] = countFilterValues(items, fieldInfo.field);
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
          {isLoadingFilterFields ? (
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

                          return (
                            <label key={value} className="filter-value-option">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleValueToggle(field, value)}
                                className="filter-checkbox"
                              />
                              <span className="filter-value-label">
                                {formatFilterValue(value)}
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

        {hasOwn && (
          <div className="filter-panel-footer">
            <button className="filter-clear-all-button" onClick={handleClearAll}>
              Clear All Filters
            </button>
          </div>
        )}

        {!hasOwn && hasEffective && (
          <div className="filter-panel-info">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Filters inherited from parent collection</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionFilterPanel;
