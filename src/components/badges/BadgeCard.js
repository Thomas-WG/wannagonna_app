'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card } from 'flowbite-react';
import { HiBadgeCheck, HiStar } from 'react-icons/hi';

/**
 * Badge Card Component with lazy loading and error handling
 * @param {Object} badge - Badge object with id, title, description, xp, categoryId
 * @param {string} imageUrl - URL of the badge image
 * @param {boolean} isEarned - Whether the badge has been earned
 */
export default function BadgeCard({ badge, imageUrl, isEarned = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Start loading 100px before visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleImageError = () => {
    console.error(`Failed to load badge image: ${imageUrl}`);
    setImgError(true);
    setImgLoaded(true); // Stop showing loading state
  };

  const handleImageLoad = () => {
    setImgLoaded(true);
    setImgError(false);
  };

  const renderImage = (size) => {
    const sizeClass = size === 'mobile' ? 'w-20 h-20' : 'w-24 h-24';
    const iconSize = size === 'mobile' ? 'w-10 h-10' : 'w-12 h-12';
    const imageSize = size === 'mobile' ? 80 : 120;

    if (!isVisible || !imageUrl) {
      return (
        <div className={`${sizeClass} bg-background-hover dark:bg-background-hover rounded-full flex items-center justify-center animate-pulse`}>
          <HiBadgeCheck className={`${iconSize} text-text-tertiary dark:text-text-tertiary`} />
        </div>
      );
    }

    if (imgError) {
      return (
        <div className={`${sizeClass} bg-background-hover dark:bg-background-hover rounded-full flex items-center justify-center border-2 border-dashed border-text-tertiary dark:border-text-tertiary`}>
          <HiBadgeCheck className={size === 'mobile' ? 'w-8 h-8' : 'w-10 h-10 text-text-tertiary dark:text-text-tertiary'} />
        </div>
      );
    }

    return (
      <>
        {!imgLoaded && (
          <div className={`absolute ${sizeClass} bg-background-hover dark:bg-background-hover rounded-full flex items-center justify-center animate-pulse`}>
            <HiBadgeCheck className={`${iconSize} text-text-tertiary dark:text-text-tertiary`} />
          </div>
        )}
        <div className={`relative ${sizeClass} ${imgLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 flex items-center justify-center`}>
          <Image
            src={imageUrl}
            alt={badge.title || 'Badge'}
            width={imageSize}
            height={imageSize}
            className={`object-contain w-full h-full ${!isEarned ? 'grayscale' : ''}`}
            style={{
              filter: !isEarned ? 'grayscale(100%)' : 'none'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes={`${imageSize}px`}
            unoptimized={imageUrl?.startsWith('data:') || imageUrl?.startsWith('blob:')}
          />
        </div>
      </>
    );
  };

  return (
    <Card ref={cardRef} className={`hover:shadow-lg transition-all relative bg-background-card dark:bg-background-card border-border-light dark:border-border-dark ${
      !isEarned ? 'opacity-60' : ''
    }`}>
      {/* Lock icon for unearned badges */}
      {!isEarned && (
        <div className="absolute top-3 right-3 z-10">
          <svg className="w-5 h-5 text-text-tertiary dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}

      {/* Mobile: Horizontal Layout (image on right) */}
      <div className="flex md:hidden items-center gap-4">
        {/* Left: Title and Description */}
        <div className="flex-1 min-w-0 pr-2">
          {/* Badge Title */}
          <h3 className={`text-base font-semibold mb-1.5 line-clamp-2 ${
            isEarned ? 'text-text-primary dark:text-text-primary' : 'text-text-tertiary dark:text-text-tertiary'
          }`}>
            {badge.title || badge.id}
          </h3>

          {/* Badge Description */}
          {badge.description && (
            <p className={`text-sm mb-2 line-clamp-2 ${
              isEarned ? 'text-text-secondary dark:text-text-secondary' : 'text-text-tertiary dark:text-text-tertiary'
            }`}>
              {badge.description}
            </p>
          )}

          {/* XP Value */}
          {badge.xp !== undefined && badge.xp !== null && (
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full ${
                isEarned 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white' 
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}>
                <HiStar className={`w-3 h-3 ${isEarned ? 'fill-current' : ''}`} />
                <span>{badge.xp} XP</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: Badge Image */}
        <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center relative">
          {renderImage('mobile')}
        </div>
      </div>

      {/* Desktop: Vertical Layout (centered) */}
      <div className="hidden md:flex flex-col items-center text-center h-full">
        {/* Badge Image */}
        <div className="mb-4 flex items-center justify-center min-h-[120px] relative">
          {renderImage('desktop')}
        </div>

        {/* Badge Title */}
        <h3 className={`text-lg font-semibold mb-2 ${
          isEarned ? 'text-text-primary dark:text-text-primary' : 'text-text-tertiary dark:text-text-tertiary'
        }`}>
          {badge.title || badge.id}
        </h3>

        {/* Badge Description */}
        {badge.description && (
          <p className={`text-sm mb-3 flex-grow ${
            isEarned ? 'text-text-secondary dark:text-text-secondary' : 'text-text-tertiary dark:text-text-tertiary'
          }`}>
            {badge.description}
          </p>
        )}

        {/* XP Value */}
        {badge.xp !== undefined && badge.xp !== null && (
          <div className="mt-auto pt-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-full shadow-md ${
              isEarned 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white' 
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
            }`}>
              <HiStar className={`w-4 h-4 ${isEarned ? 'fill-current' : ''}`} />
              <span>{badge.xp} XP</span>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

