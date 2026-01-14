import { useState, useEffect } from 'react';
import { getCachedBadgeUrls, setCachedBadgeUrls, batchLoadBadgeImageUrls } from '@/utils/crudBadges';

/**
 * Custom hook for managing badge image URLs with caching
 * Handles loading badge images, checking cache validity, and updating cache
 * 
 * @param {Array} badges - Array of badge objects with id and categoryId properties
 * @returns {Object} Object containing badgeImageUrls map, imagesLoading state, and error state
 */
export function useBadgeImageUrls(badges = []) {
  const [badgeImageUrls, setBadgeImageUrls] = useState({});
  const [imagesLoading, setImagesLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadImageUrls = async () => {
      if (!badges || badges.length === 0) {
        setImagesLoading(false);
        return;
      }

      try {
        setImagesLoading(true);
        setError(null);

        // Check cache first
        const cachedUrls = getCachedBadgeUrls();
        if (cachedUrls && badges.length > 0) {
          // Check if cache is still valid (all badge IDs match)
          const badgeIds = new Set(badges.map(b => b.id));
          const cachedIds = new Set(Object.keys(cachedUrls));
          const idsMatch = badgeIds.size === cachedIds.size && 
                          [...badgeIds].every(id => cachedIds.has(id));
          
          if (idsMatch) {
            // Use cached URLs immediately
            setBadgeImageUrls(cachedUrls);
            setImagesLoading(false);
            return;
          }
        }

        // Cache outdated or missing, load URLs in background
        const urls = await batchLoadBadgeImageUrls(badges);
        setBadgeImageUrls(urls);
        setCachedBadgeUrls(urls);
        setImagesLoading(false);
      } catch (err) {
        console.error('Error loading badge image URLs:', err);
        setError(err);
        setImagesLoading(false);
        // Try to use cache even if loading failed
        const cachedUrls = getCachedBadgeUrls();
        if (cachedUrls) {
          setBadgeImageUrls(cachedUrls);
        }
      }
    };

    loadImageUrls();
  }, [badges]);

  return {
    badgeImageUrls,
    imagesLoading,
    error
  };
}

