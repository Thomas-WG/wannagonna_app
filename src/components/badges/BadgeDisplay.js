'use client';

import { useState, useEffect } from 'react';
import { getBadgeImageUrl } from '@/utils/crudBadges';

/**
 * BadgeDisplay component displays a single badge with image, title, and tooltip
 * @param {Object} badge - Badge object with id, title, description
 * @param {string} badge.id - Badge ID (used to fetch image)
 * @param {string} badge.title - Badge title
 * @param {string} badge.description - Badge description (shown on hover)
 */
export default function BadgeDisplay({ badge }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const loadBadgeImage = async () => {
      if (!badge?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const url = await getBadgeImageUrl(badge.id);
        console.log(`Badge image URL for ${badge.id}:`, url);
        setImageUrl(url);
      } catch (error) {
        console.error(`Error loading badge image for ${badge.id}:`, error);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadBadgeImage();
  }, [badge?.id]);

  if (!badge) {
    return null;
  }

  return (
    <div
      className="relative flex flex-col items-center group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Badge Image with Shadow */}
      <div className="relative mb-2 flex items-center justify-center">
        {loading ? (
          <div className="bg-transparent animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={badge.title || 'Badge'}
            className="object-contain"
            style={{
              width: '112px',
              height: 'auto',
              maxWidth: '128px',
              display: 'block'
            }}
            onError={(e) => {
              console.error(`Failed to load badge image: ${imageUrl}`, e);
              setImageUrl(null);
            }}
          />
        ) : (
          <div className="bg-transparent flex items-center justify-center">
            <span className="text-gray-500 text-sm">?</span>
          </div>
        )}
      </div>

      {/* Badge Title */}
      <div className="text-center">
        <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 max-w-[112px] sm:max-w-[128px] truncate">
          {badge.title || 'Badge'}
        </p>
      </div>

      {/* Tooltip on Hover */}
      {showTooltip && badge.description && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-[200px] pointer-events-none">
          <div className="font-semibold mb-1">{badge.title}</div>
          <div className="text-gray-200">{badge.description}</div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
}

