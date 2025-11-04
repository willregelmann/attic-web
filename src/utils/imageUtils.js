/**
 * Add Supabase image transformation parameters to an image URL
 * @param {string} imageUrl - The original image URL
 * @param {Object} options - Transformation options
 * @param {number} [options.width] - Target width in pixels
 * @param {number} [options.height] - Target height in pixels
 * @param {number} [options.quality=80] - Image quality (1-100)
 * @returns {string} Image URL with transformation parameters
 */
export function addSupabaseImageParams(imageUrl, { width, height, quality = 80 } = {}) {
  if (!imageUrl) return imageUrl;

  // Supabase uses ?width=X&height=Y&quality=Z format
  const params = new URLSearchParams();
  if (width) params.append('width', width);
  if (height) params.append('height', height);
  if (quality) params.append('quality', quality);

  const paramString = params.toString();
  if (!paramString) return imageUrl;

  return `${imageUrl}?${paramString}`;
}
