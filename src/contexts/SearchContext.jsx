import { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext();

export const SEARCH_MODES = {
  TEXT: 'text',
  IMAGE: 'image',
};

export function SearchProvider({ children }) {
  // Search mode: 'text' or 'image'
  const [searchMode, setSearchMode] = useState(SEARCH_MODES.TEXT);

  // Text search state
  const [textQuery, setTextQuery] = useState('');

  // Image search state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Search results (shared between both modes)
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Toggle between text and image search modes
  const toggleSearchMode = useCallback(() => {
    setSearchMode(prev => prev === SEARCH_MODES.TEXT ? SEARCH_MODES.IMAGE : SEARCH_MODES.TEXT);
    // Clear previous search when switching modes
    clearSearch();
  }, []);

  // Set search mode explicitly
  const setMode = useCallback((mode) => {
    if (mode !== searchMode) {
      setSearchMode(mode);
      clearSearch();
    }
  }, [searchMode]);

  // Handle image file selection
  const handleImageSelect = useCallback((file) => {
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  }, []);

  // Clear image selection
  const clearImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  }, [imagePreview]);

  // Clear all search state
  const clearSearch = useCallback(() => {
    setTextQuery('');
    clearImage();
    setSearchResults(null);
    setIsSearching(false);
  }, [clearImage]);

  // Update text query
  const updateTextQuery = useCallback((query) => {
    setTextQuery(query);
  }, []);

  // Set search results
  const updateSearchResults = useCallback((results) => {
    setSearchResults(results);
    setIsSearching(false);
  }, []);

  // Start search (sets loading state)
  const startSearch = useCallback(() => {
    setIsSearching(true);
  }, []);

  // Check if ready to search
  const canSearch = searchMode === SEARCH_MODES.TEXT
    ? textQuery.trim().length > 0
    : imageFile !== null;

  return (
    <SearchContext.Provider value={{
      // Mode
      searchMode,
      setSearchMode: setMode,
      toggleSearchMode,
      isTextMode: searchMode === SEARCH_MODES.TEXT,
      isImageMode: searchMode === SEARCH_MODES.IMAGE,

      // Text search
      textQuery,
      updateTextQuery,

      // Image search
      imageFile,
      imagePreview,
      handleImageSelect,
      clearImage,

      // Results
      searchResults,
      updateSearchResults,
      isSearching,
      startSearch,

      // Utilities
      canSearch,
      clearSearch,
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}
