/**
 * Form utility functions
 */

/**
 * Combines multiple loading states to determine if a form is busy
 *
 * Use this to disable form buttons when any query or mutation is loading.
 * Handles undefined/null values gracefully (treats as false).
 *
 * @param {...boolean} loadingStates - Any number of loading state booleans
 * @returns {boolean} true if any loading state is true
 *
 * @example
 * // Disable during mutation or query loading
 * disabled={isFormBusy(loading, collectionsLoading)}
 *
 * @example
 * // Combine with validation
 * disabled={!isValid() || isFormBusy(loading, collectionsLoading)}
 *
 * @example
 * // Multiple loading states
 * disabled={isFormBusy(isSaving, isUpdating, isDeleting, dataLoading)}
 */
export const isFormBusy = (...loadingStates) => {
  return loadingStates.some(state => state === true);
};
