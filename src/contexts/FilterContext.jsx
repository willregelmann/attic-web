import { createContext, useContext, useState, useEffect } from 'react';

const FilterContext = createContext();

// Available language options with country codes for flags
// We use country codes that best represent each language
export const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All Languages', countryCode: null },
  { value: 'en', label: 'English', countryCode: 'US' },
  { value: 'ja', label: '日本語 (Japanese)', countryCode: 'JP' },
  { value: 'es', label: 'Español (Spanish)', countryCode: 'ES' },
  { value: 'fr', label: 'Français (French)', countryCode: 'FR' },
  { value: 'de', label: 'Deutsch (German)', countryCode: 'DE' },
  { value: 'it', label: 'Italiano (Italian)', countryCode: 'IT' },
  { value: 'ko', label: '한국어 (Korean)', countryCode: 'KR' },
  { value: 'zh', label: '中文 (Chinese)', countryCode: 'CN' },
];

export function FilterProvider({ children }) {
  // Load filters from localStorage
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('appFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old single-language format to array format
        if (parsed.language && typeof parsed.language === 'string') {
          return {
            languages: parsed.language === 'all' ? [] : [parsed.language]
          };
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved filters:', e);
      }
    }
    return {
      languages: [] // Empty array means "all languages"
    };
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appFilters', JSON.stringify(filters));
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Toggle a language in the languages array
  const toggleLanguage = (languageCode) => {
    setFilters(prev => {
      const currentLanguages = prev.languages || [];

      if (languageCode === 'all') {
        // If "All Languages" is clicked, clear the selection
        return { ...prev, languages: [] };
      }

      // Toggle the language
      const isSelected = currentLanguages.includes(languageCode);
      const newLanguages = isSelected
        ? currentLanguages.filter(lang => lang !== languageCode)
        : [...currentLanguages, languageCode];

      return { ...prev, languages: newLanguages };
    });
  };

  const resetFilters = () => {
    setFilters({
      languages: []
    });
  };

  // Check if any filters are active (not default)
  const hasActiveFilters = filters.languages && filters.languages.length > 0;

  return (
    <FilterContext.Provider value={{
      filters,
      updateFilter,
      toggleLanguage,
      resetFilters,
      hasActiveFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
}
