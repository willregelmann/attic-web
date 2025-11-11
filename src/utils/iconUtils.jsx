/**
 * Get the appropriate icon for an entity type when no image is available
 *
 * @param {string} type - Entity type (e.g., 'custom', 'collection', 'card', 'game')
 * @param {string} iconColor - Color for the icon stroke
 * @param {number} size - Size of the icon (width and height)
 * @returns {JSX.Element|null} - SVG icon element or null if no icon needed
 */
export function getTypeIcon(type, iconColor = '#6b7280', size = 64) {
  if (!type) return null;

  const typeNormalized = type.toLowerCase();

  // Custom collections - folder icon
  if (typeNormalized === 'custom') {
    return (
      <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke={iconColor} strokeWidth="1.5">
        <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-9l-2-2H5a2 2 0 0 0-2 2v0" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  // Collection types
  if (typeNormalized.includes('collection') || typeNormalized.includes('franchise') || typeNormalized.includes('series') || typeNormalized === 'linked') {
    return (
      <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke={iconColor} strokeWidth="1.5">
        <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4M3 7h18" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 11h6M9 15h6" strokeLinecap="round"/>
      </svg>
    );
  }

  // Trading card
  if (typeNormalized.includes('card')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke={iconColor} strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 9h18M9 3v18" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  // Game/Video game
  if (typeNormalized.includes('game')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke={iconColor} strokeWidth="1.5">
        <path d="M6 14h4m2 0h6M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 9V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="17" cy="14" r="1" fill={iconColor}/>
      </svg>
    );
  }

  // Default icon for other types
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke={iconColor} strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8v8m-4-4h8" strokeLinecap="round"/>
    </svg>
  );
}
