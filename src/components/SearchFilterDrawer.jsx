import { useState, useMemo } from 'react';
import { extractTypesFromResults } from '../utils/searchFilterUtils';
import { formatEntityType } from '../utils/formatters';

/**
 * SearchFilterDrawer - Filter drawer for search results
 * Matches CollectionFilterDrawer styling but with simplified content (just type filtering)
 */
function SearchFilterDrawer({
  results,
  selectedTypes,
  onTypesChange,
  onClearFilters,
  isOpen,
  onClose
}) {
  const [expandedFields, setExpandedFields] = useState(new Set(['type']));

  const availableTypes = useMemo(() => extractTypesFromResults(results), [results]);

  // Count items per type
  const typeCounts = useMemo(() => {
    const counts = {};
    results.forEach(item => {
      const type = item.type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [results]);

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

  const handleTypeToggle = (type) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onTypesChange(newTypes);
  };

  const hasActiveFilters = selectedTypes.length > 0;

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
        {/* Header */}
        <div className="relative p-6 md:p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-primary)] flex-shrink-0">
          <h3 className="m-0 text-xl md:text-lg font-bold text-[var(--text-primary)]">Search Filters</h3>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-3">
          {/* Type Filter */}
          {availableTypes.length > 0 && (
            <div className="mb-2 border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-primary)]">
              <div
                className={`w-full p-4 bg-transparent border-none flex justify-between items-center cursor-pointer transition-all duration-200 text-left hover:bg-[var(--bg-secondary)] ${selectedTypes.length > 0 ? 'bg-[rgba(42,82,152,0.05)]' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => toggleField('type')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleField('type');
                  }
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-[var(--text-primary)] text-[15px]">Type</span>
                  {selectedTypes.length > 0 && (
                    <span className="bg-[var(--primary)] text-white py-0.5 px-2 rounded-xl text-xs font-semibold">
                      {selectedTypes.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedTypes.length > 0 && (
                    <button
                      className="bg-transparent border-none text-[var(--primary)] cursor-pointer text-[13px] font-semibold py-1 px-2 rounded transition-all duration-200 hover:bg-[rgba(42,82,152,0.1)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTypesChange([]);
                      }}
                      aria-label="Clear type filters"
                    >
                      Clear
                    </button>
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    width="16"
                    height="16"
                    className={`text-[var(--text-secondary)] transition-transform duration-200 ${expandedFields.has('type') ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {expandedFields.has('type') && (
                <div className="py-2 px-4 pb-4 flex flex-col gap-2 bg-[var(--bg-secondary)]">
                  {availableTypes.map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-[var(--bg-primary)]">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeToggle(type)}
                        className="w-[18px] h-[18px] cursor-pointer accent-[var(--primary)]"
                      />
                      <span className="flex-1 text-[15px] text-[var(--text-primary)] flex justify-between items-center">
                        {formatEntityType(type)}
                        <span className="text-[var(--text-secondary)] text-[13px] ml-2">
                          ({typeCounts[type] || 0})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {availableTypes.length === 0 && (
            <div className="text-center py-12 px-8 text-[var(--text-secondary)]">
              <p>No filter options available.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {hasActiveFilters && (
          <div className="p-4 px-6 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
            <button
              className="w-full py-3 bg-transparent text-[var(--primary)] border-2 border-[var(--primary)] rounded-lg font-semibold text-[15px] cursor-pointer transition-all duration-200 hover:bg-[var(--primary)] hover:text-white"
              onClick={onClearFilters}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchFilterDrawer;
