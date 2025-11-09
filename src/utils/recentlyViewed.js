/**
 * Utilities for managing recently viewed collections in localStorage
 */

const STORAGE_KEY = 'attic_recently_viewed';
const MAX_ITEMS = 12;

/**
 * Get recently viewed collections from localStorage
 * @returns {Array} Array of recently viewed collection objects
 */
export const getRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading recently viewed:', error);
    return [];
  }
};

/**
 * Add a collection to recently viewed
 * @param {Object} collection - Collection object with id, name, type, year, image_url, thumbnail_url, representative_image_urls
 */
export const addToRecentlyViewed = (collection) => {
  try {
    const recent = getRecentlyViewed();

    // Remove if already exists (to move to front)
    const filtered = recent.filter(item => item.id !== collection.id);

    // Add to front
    const updated = [
      {
        id: collection.id,
        name: collection.name,
        type: collection.type,
        year: collection.year,
        image_url: collection.image_url,
        thumbnail_url: collection.thumbnail_url,
        representative_image_urls: collection.representative_image_urls,
        viewedAt: Date.now()
      },
      ...filtered
    ].slice(0, MAX_ITEMS); // Keep only MAX_ITEMS

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recently viewed:', error);
  }
};

/**
 * Clear all recently viewed collections
 */
export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
  }
};
