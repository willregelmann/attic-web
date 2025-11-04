import { useFilters, LANGUAGE_OPTIONS } from '../contexts/FilterContext';
import * as flags from 'country-flag-icons/react/3x2';
import './FilterModal.css';

function FilterModal({ isOpen, onClose }) {
  const { filters, toggleLanguage, resetFilters, hasActiveFilters } = useFilters();

  if (!isOpen) return null;

  const handleLanguageToggle = (value) => {
    toggleLanguage(value);
  };

  const handleReset = () => {
    resetFilters();
  };

  // Check if a language is selected
  const isLanguageSelected = (languageCode) => {
    if (languageCode === 'all') {
      return !filters.languages || filters.languages.length === 0;
    }
    return filters.languages && filters.languages.includes(languageCode);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="filter-modal-title">
      <div className="modal-content filter-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close filter modal">
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="modal-header">
          <h2 id="filter-modal-title">Filters</h2>
          <p>Select multiple languages to filter collections</p>
        </div>

        <div className="modal-body">
          <div className="filter-section">
            <label className="filter-label">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className="filter-icon">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5-5 5 5M12 5v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Language
            </label>
            <div className="filter-options">
              {LANGUAGE_OPTIONS.map(option => {
                // Get the flag component dynamically
                const FlagComponent = option.countryCode ? flags[option.countryCode] : null;

                const isSelected = isLanguageSelected(option.value);

                return (
                  <button
                    key={option.value}
                    className={`filter-option ${isSelected ? 'active' : ''}`}
                    onClick={() => handleLanguageToggle(option.value)}
                    type="button"
                  >
                    <div className="filter-option-content">
                      {FlagComponent ? (
                        <FlagComponent className="filter-flag" />
                      ) : (
                        <div className="filter-flag-placeholder">🌐</div>
                      )}
                      <span className="filter-option-label">{option.label}</span>
                    </div>
                    {isSelected && (
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="check-icon">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {hasActiveFilters && (
            <button className="reset-button" onClick={handleReset} type="button">
              Reset All
            </button>
          )}
          <button className="apply-button" onClick={onClose} type="button">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterModal;
