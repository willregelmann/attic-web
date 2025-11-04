// Map country codes to language codes
const COUNTRY_TO_LANGUAGE = {
  'US': 'en',
  'GB': 'en',
  'CA': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
  'JP': 'ja',
  'ES': 'es',
  'MX': 'es',
  'AR': 'es',
  'FR': 'fr',
  'BE': 'fr',
  'CH': 'fr',
  'DE': 'de',
  'AT': 'de',
  'IT': 'it',
  'KR': 'ko',
  'CN': 'zh',
  'TW': 'zh',
  'HK': 'zh',
};

/**
 * Get language code from country code
 */
export function getLanguageFromCountry(country) {
  if (!country) return null;
  return COUNTRY_TO_LANGUAGE[country.toUpperCase()] || null;
}

/**
 * Check if an entity matches the language filter
 * @param {Object} entity - The entity to check
 * @param {Array} languageFilters - Array of language codes to filter by
 */
export function matchesLanguageFilter(entity, languageFilters) {
  // If no filters or empty array, return true (show all)
  if (!languageFilters || languageFilters.length === 0) {
    return true;
  }

  // If entity has no country, include it (don't filter out items without country data)
  if (!entity.country) {
    return true;
  }

  // Check if entity's language matches ANY of the filters
  const entityLanguage = getLanguageFromCountry(entity.country);
  return languageFilters.includes(entityLanguage);
}

/**
 * Filter an array of entities based on current filters
 */
export function filterEntities(entities, filters) {
  if (!entities || !Array.isArray(entities)) {
    return entities;
  }

  return entities.filter(entity => {
    return matchesLanguageFilter(entity, filters.languages);
  });
}
