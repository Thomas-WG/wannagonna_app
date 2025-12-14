/**
 * Normalize a URL by adding https:// if needed
 * Handles cases like:
 * - "www.example.com" -> "https://www.example.com"
 * - "example.com" -> "https://example.com"
 * - "https://example.com" -> "https://example.com" (unchanged)
 * - "http://example.com" -> "http://example.com" (unchanged)
 * - "" -> "" (empty string unchanged)
 * 
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL
 */
export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmedUrl = url.trim();
  
  // Return empty string if input is empty
  if (trimmedUrl === '') {
    return '';
  }

  // If URL already starts with http:// or https://, return as is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // Otherwise, prepend https://
  return `https://${trimmedUrl}`;
}

/**
 * Format URL for display (removes https:// for cleaner display)
 * @param {string} url - The URL to format
 * @returns {string} - The formatted URL for display
 */
export function formatUrlForDisplay(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmedUrl = url.trim();
  
  if (trimmedUrl === '') {
    return '';
  }

  // Remove https:// or http:// prefix for display
  return trimmedUrl.replace(/^https?:\/\//, '');
}

