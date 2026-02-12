'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { HiUser } from 'react-icons/hi';
import {
  normalizeProfilePictureUrl,
  isGoogleProfilePicture,
  shouldUseUnoptimized,
  getProfilePictureFallback,
  isValidProfilePictureUrl,
} from '@/utils/profilePictureUtils';

/**
 * ProfilePicture Component
 * 
 * Unified component for displaying profile pictures from various sources
 * (Google accounts, Firebase Storage, etc.) with error handling and fallbacks.
 * 
 * @param {string} src - Profile picture URL
 * @param {string} alt - Alt text for accessibility (defaults to "Profile picture")
 * @param {number} size - Size in pixels (default: 70)
 * @param {boolean} priority - Whether to prioritize loading (default: false)
 * @param {string} className - Additional CSS classes
 * @param {React.ComponentType} fallbackIcon - Custom fallback icon component (default: HiUser)
 * @param {boolean} showInitials - Show initials when no image (default: false)
 * @param {string} name - Name for initials fallback
 * @param {string} loading - Loading strategy: 'lazy' | 'eager' (default: 'lazy' if not priority)
 * @param {function} onClick - Click handler
 * @param {object} ...props - Additional props passed to Image component
 */
export default function ProfilePicture({
  src,
  alt = 'Profile picture',
  size = 70,
  priority = false,
  className = '',
  fallbackIcon: FallbackIcon = HiUser,
  showInitials = false,
  name = '',
  loading,
  onClick,
  ...props
}) {
  const [error, setError] = useState(false);
  const [loadingState, setLoadingState] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(null);

  const MAX_RETRIES = 2;

  // Normalize and validate the source URL
  useEffect(() => {
    if (!src) {
      setCurrentSrc(null);
      setError(false);
      setLoadingState(false);
      return;
    }

    // Trim and clean the URL
    const cleanedSrc = typeof src === 'string' ? src.trim() : src;
    
    const normalizedUrl = normalizeProfilePictureUrl(cleanedSrc);
    
    if (!normalizedUrl) {
      // If normalization fails, try to use the original URL if it's a valid format
      if (isValidProfilePictureUrl(cleanedSrc)) {
        setCurrentSrc(cleanedSrc);
        setError(false);
        setLoadingState(true);
        setRetryCount(0);
        return;
      }
      // Log for debugging (remove in production if needed)
      console.warn('ProfilePicture: Invalid URL format', cleanedSrc);
      setCurrentSrc(null);
      setError(true);
      setLoadingState(false);
      return;
    }
    
    if (!isValidProfilePictureUrl(normalizedUrl)) {
      // Log for debugging (remove in production if needed)
      console.warn('ProfilePicture: URL failed validation', normalizedUrl);
      setCurrentSrc(null);
      setError(true);
      setLoadingState(false);
      return;
    }

    setCurrentSrc(normalizedUrl);
    setError(false);
    setLoadingState(true);
    setRetryCount(0);
  }, [src]);

  const handleError = () => {
    if (retryCount < MAX_RETRIES) {
      // Retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        // Force reload by appending a cache-busting parameter
        setCurrentSrc(`${currentSrc}?retry=${retryCount + 1}`);
        setLoadingState(true);
      }, delay);
    } else {
      // Max retries reached, show fallback
      setError(true);
      setLoadingState(false);
    }
  };

  const handleLoad = () => {
    setLoadingState(false);
    setError(false);
  };

  // Determine loading strategy
  const loadingStrategy = loading || (priority ? 'eager' : 'lazy');

  // If no src or error occurred, show fallback
  if (!currentSrc || error) {
    const fallbackContent = showInitials && name ? (
      <span
        className="text-white font-semibold"
        style={{ fontSize: size * 0.4 }}
      >
        {getProfilePictureFallback(name)}
      </span>
    ) : (
      <FallbackIcon
        className="text-white"
        style={{ width: size * 0.6, height: size * 0.6 }}
      />
    );

    return (
      <div
        className={`rounded-full bg-semantic-info-500 dark:bg-semantic-info-600 flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-md ${className}`}
        style={{ width: size, height: size }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(e);
          }
        } : undefined}
        {...(onClick ? { 'aria-label': alt } : {})}
      >
        {fallbackContent}
      </div>
    );
  }

  const isGoogleImage = isGoogleProfilePicture(currentSrc);
  const useUnoptimized = shouldUseUnoptimized(currentSrc);

  // Check if className contains width/height classes (for responsive sizing)
  const hasSizeClasses = className && /[wh]-\d|w-\[|h-\[/.test(className);
  const containerStyle = hasSizeClasses ? {} : { width: size, height: size };
  const imageStyle = hasSizeClasses ? { width: '100%', height: '100%' } : { width: size, height: size };

  return (
    <div
      className={`relative flex-shrink-0 rounded-full overflow-hidden ${className}`}
      style={containerStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
    >
      {/* Loading skeleton */}
      {loadingState && (
        <div
          className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={hasSizeClasses ? {} : { width: size, height: size }}
          aria-hidden="true"
        />
      )}

      {/* Profile picture image */}
      <Image
        src={currentSrc}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full border-2 border-white dark:border-neutral-800 shadow-md object-cover transition-opacity duration-300 w-full h-full ${
          loadingState ? 'opacity-0' : 'opacity-100'
        } ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
        style={imageStyle}
        priority={priority}
        loading={loadingStrategy}
        unoptimized={useUnoptimized}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
}
