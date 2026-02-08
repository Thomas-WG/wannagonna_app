/**
 * Profile Picture Utilities
 * 
 * Utility functions for managing and validating profile picture URLs
 * from various sources (Google, Firebase Storage, etc.)
 */

/**
 * Allowed domains for profile pictures (security validation)
 */
const ALLOWED_PROFILE_PICTURE_DOMAINS = [
  'googleusercontent.com',
  'firebasestorage.googleapis.com',
  'firebasestorage.app',
  'storage.googleapis.com',
  // Allow localhost for development/emulator
  'localhost',
  '127.0.0.1',
];

/**
 * Normalizes profile picture URL from various sources
 * @param {string} url - Profile picture URL
 * @param {string} userId - User ID for fallback (optional)
 * @returns {string|null} Normalized URL or null if invalid
 */
export function normalizeProfilePictureUrl(url, userId = null) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Google profile pictures - already optimized, use as-is
  if (isGoogleProfilePicture(trimmedUrl)) {
    return trimmedUrl;
  }

  // Firebase Storage URLs - use as-is
  if (isFirebaseProfilePicture(trimmedUrl)) {
    return trimmedUrl;
  }

  // Data URLs (blob URLs) - use as-is for preview
  if (trimmedUrl.startsWith('data:') || trimmedUrl.startsWith('blob:')) {
    return trimmedUrl;
  }

  // In development, allow any HTTP/HTTPS URL (will be validated by isValidProfilePictureUrl)
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       process.env.NEXT_PUBLIC_USE_EMULATOR === 'true' ||
                       (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  
  if (isDevelopment && (trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('http://'))) {
    return trimmedUrl;
  }

  // Invalid URL
  return null;
}

/**
 * Determines if profile picture is from Google
 * @param {string} url - Profile picture URL
 * @returns {boolean}
 */
export function isGoogleProfilePicture(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('googleusercontent.com');
}

/**
 * Determines if profile picture is from Firebase Storage
 * @param {string} url - Profile picture URL
 * @returns {boolean}
 */
export function isFirebaseProfilePicture(url) {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('firebasestorage.app') ||
    url.includes('storage.googleapis.com') ||
    // Also check for Firebase Storage emulator URLs
    (url.includes('localhost') && url.includes('/v0/b/')) ||
    (url.includes('127.0.0.1') && url.includes('/v0/b/'))
  );
}

/**
 * Validates that URL is from an allowed domain (security check)
 * @param {string} url - Profile picture URL
 * @returns {boolean}
 */
export function isValidProfilePictureUrl(url) {
  if (!url || typeof url !== 'string') return false;

  // Allow data URLs and blob URLs (for preview)
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return true;
  }

  // Check if we're in development/emulator mode
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       process.env.NEXT_PUBLIC_USE_EMULATOR === 'true' ||
                       (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  try {
    const urlObj = new URL(url);
    
    // In development/emulator mode, allow HTTP and HTTPS URLs for testing flexibility
    if (isDevelopment) {
      // Allow HTTP (for emulator) and HTTPS URLs in development
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    }
    
    // In production, only allow specific domains
    // Check if hostname matches any allowed domain
    const isValid = ALLOWED_PROFILE_PICTURE_DOMAINS.some((domain) =>
      urlObj.hostname.includes(domain)
    );
    
    // Also check the full URL string as fallback (for URLs with complex query params)
    if (!isValid) {
      return ALLOWED_PROFILE_PICTURE_DOMAINS.some((domain) =>
        url.includes(domain)
      );
    }
    
    return isValid;
  } catch {
    // If URL parsing fails, check if it contains allowed domains as fallback
    // In development, allow any HTTP/HTTPS URL
    if (isDevelopment && (url.startsWith('https://') || url.startsWith('http://'))) {
      return true;
    }
    
    return ALLOWED_PROFILE_PICTURE_DOMAINS.some((domain) =>
      url.includes(domain)
    );
  }
}

/**
 * Generates initials from a name for fallback display
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export function getProfilePictureFallback(name) {
  if (!name || typeof name !== 'string') return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';

  if (parts.length === 1) {
    // Single name - use first letter
    return parts[0].charAt(0).toUpperCase();
  }

  // Multiple names - use first letter of first and last name
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}

/**
 * Gets the appropriate image optimization setting based on source
 * @param {string} url - Profile picture URL
 * @returns {boolean} true if should use unoptimized, false otherwise
 */
export function shouldUseUnoptimized(url) {
  // Google images are already optimized, don't optimize again
  if (isGoogleProfilePicture(url)) {
    return true;
  }

  // Data URLs and blob URLs can't be optimized
  if (url?.startsWith('data:') || url?.startsWith('blob:')) {
    return true;
  }

  // Firebase Storage images can be optimized by Next.js
  return false;
}
