const FILTER_PREFERENCES_KEY = 'attic_filter_preferences';

export function getFilterPreferences() {
  try {
    const stored = localStorage.getItem(FILTER_PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to load filter preferences:', e);
    return {};
  }
}

export function setFilterPreference(key, value) {
  try {
    const prefs = getFilterPreferences();
    prefs[key] = value;
    localStorage.setItem(FILTER_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save filter preference:', e);
  }
}
