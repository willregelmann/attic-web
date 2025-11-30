import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing multi-select state
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onSelectionComplete - Callback when action is completed
 * @returns {Object} Multi-select state and handlers
 */
export function useMultiSelect({ onSelectionComplete } = {}) {
  const [multiSelectMode, setMultiSelectMode] = useState({
    active: false,
    selectedType: null, // 'owned' | 'wishlisted' | 'dbot-item'
    selectedIds: new Set()
  });

  // Enter multi-select mode with first item
  const enterMultiSelectMode = useCallback((itemId, itemType) => {
    setMultiSelectMode({
      active: true,
      selectedType: itemType,
      selectedIds: new Set([itemId])
    });
  }, []);

  // Exit multi-select mode
  const exitMultiSelectMode = useCallback(() => {
    setMultiSelectMode({
      active: false,
      selectedType: null,
      selectedIds: new Set()
    });
  }, []);

  // Toggle item selection
  const toggleItemSelection = useCallback((itemId, itemType) => {
    setMultiSelectMode(prev => {
      // If not in multi-select mode, enter it
      if (!prev.active) {
        return {
          active: true,
          selectedType: itemType,
          selectedIds: new Set([itemId])
        };
      }

      // Check if item type matches
      if (prev.selectedType !== itemType) {
        // Type mismatch - ignore
        return prev;
      }

      // Toggle selection
      const newSelectedIds = new Set(prev.selectedIds);
      if (newSelectedIds.has(itemId)) {
        newSelectedIds.delete(itemId);
      } else {
        newSelectedIds.add(itemId);
      }

      // If no items selected, exit mode
      if (newSelectedIds.size === 0) {
        return {
          active: false,
          selectedType: null,
          selectedIds: new Set()
        };
      }

      return {
        ...prev,
        selectedIds: newSelectedIds
      };
    });
  }, []);

  // Check if item is selected
  const isItemSelected = useCallback((itemId) => {
    return multiSelectMode.selectedIds.has(itemId);
  }, [multiSelectMode.selectedIds]);

  // Check if item is disabled (wrong type)
  const isItemDisabled = useCallback((itemType) => {
    return multiSelectMode.active && multiSelectMode.selectedType !== itemType;
  }, [multiSelectMode.active, multiSelectMode.selectedType]);

  // Complete selection and execute callback
  const completeSelection = useCallback((callback) => {
    if (callback && typeof callback === 'function') {
      callback(Array.from(multiSelectMode.selectedIds));
    }
    exitMultiSelectMode();
    if (onSelectionComplete) {
      onSelectionComplete();
    }
  }, [multiSelectMode.selectedIds, exitMultiSelectMode, onSelectionComplete]);

  // Memoize selectedIds array to prevent infinite re-renders when used in dependency arrays
  const selectedIdsArray = useMemo(
    () => Array.from(multiSelectMode.selectedIds),
    [multiSelectMode.selectedIds]
  );

  return {
    // State
    isMultiSelectMode: multiSelectMode.active,
    selectedType: multiSelectMode.selectedType,
    selectedCount: multiSelectMode.selectedIds.size,
    selectedIds: selectedIdsArray,

    // Actions
    enterMultiSelectMode,
    exitMultiSelectMode,
    toggleItemSelection,
    isItemSelected,
    isItemDisabled,
    completeSelection
  };
}
