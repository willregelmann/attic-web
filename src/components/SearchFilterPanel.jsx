import { useState } from 'react';
import { extractTypesFromResults } from '../utils/searchFilterUtils';
import { formatEntityType } from '../utils/formatters';
import './SearchFilterPanel.css';

function SearchFilterPanel({
  results,
  selectedTypes,
  onTypesChange,
  onClearFilters
}) {
  const [expandedFields, setExpandedFields] = useState(new Set(['type']));

  const availableTypes = extractTypesFromResults(results);

  const toggleField = (field) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(field)) {
      newExpanded.delete(field);
    } else {
      newExpanded.add(field);
    }
    setExpandedFields(newExpanded);
  };

  const handleTypeToggle = (type) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onTypesChange(newTypes);
  };

  const hasActiveFilters = selectedTypes.length > 0;

  return (
    <div className="search-filter-panel">
      {/* Type Filter */}
      {availableTypes.length > 0 && (
        <div className="filter-field-group">
          <div
            className={`filter-field-header ${selectedTypes.length > 0 ? 'has-selection' : ''}`}
            onClick={() => toggleField('type')}
          >
            <div className="filter-field-title">
              <span className="filter-field-label">Type</span>
              {selectedTypes.length > 0 && <span className="filter-field-count">{selectedTypes.length}</span>}
            </div>
            <div className="filter-field-actions">
              {selectedTypes.length > 0 && (
                <button
                  className="filter-clear-field-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTypesChange([]);
                  }}
                >
                  Clear
                </button>
              )}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                width="16"
                height="16"
                className={`filter-expand-icon ${expandedFields.has('type') ? 'expanded' : ''}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          {expandedFields.has('type') && (
            <div className="filter-field-values">
              {availableTypes.map(type => (
                <label key={type} className="filter-value-option">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="filter-checkbox"
                  />
                  <span className="filter-value-label">{formatEntityType(type)}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clear All Button at bottom */}
      {hasActiveFilters && (
        <div className="filter-panel-footer">
          <button className="filter-clear-all-button" onClick={onClearFilters}>
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchFilterPanel;
