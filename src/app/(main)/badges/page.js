'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchBadgeCategories, fetchBadgesByCategory, getCachedBadgeUrls, setCachedBadgeUrls, batchLoadBadgeImageUrls, fetchUserBadgeIds } from '@/utils/crudBadges';
import { useAuth } from '@/utils/auth/AuthContext';
import { Card } from 'flowbite-react';
import { HiBadgeCheck, HiStar } from 'react-icons/hi';

/**
 * Badge Card Component with lazy loading
 */
function BadgeCard({ badge, imageUrl, isEarned = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
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

  return (
    <Card ref={cardRef} className={`h-full flex flex-col hover:shadow-lg transition-all relative bg-background-card dark:bg-background-card border-border-light dark:border-border-dark ${
      !isEarned ? 'opacity-60' : ''
    }`}>
      <div className="flex flex-col items-center text-center">
        {/* Lock icon for unearned badges */}
        {!isEarned && (
          <div className="absolute top-3 right-3 z-10">
            <svg className="w-5 h-5 text-text-tertiary dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}

        {/* Badge Image */}
        <div className="mb-4 flex items-center justify-center min-h-[120px] relative">
          {!isVisible || !imageUrl ? (
            <div className="w-24 h-24 bg-background-hover dark:bg-background-hover rounded-full flex items-center justify-center animate-pulse">
              <HiBadgeCheck className="w-12 h-12 text-text-tertiary dark:text-text-tertiary" />
            </div>
          ) : (
            <>
              {!imgLoaded && (
                <div className="absolute w-24 h-24 bg-background-hover dark:bg-background-hover rounded-full flex items-center justify-center animate-pulse">
                  <HiBadgeCheck className="w-12 h-12 text-text-tertiary dark:text-text-tertiary" />
                </div>
              )}
              <img
                src={imageUrl}
                alt={badge.title || 'Badge'}
                className={`object-contain max-w-[120px] max-h-[120px] transition-all duration-300 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                } ${!isEarned ? 'grayscale' : ''}`}
                style={{
                  filter: !isEarned ? 'grayscale(100%)' : 'none'
                }}
                onLoad={() => setImgLoaded(true)}
                onError={() => {
                  console.error(`Failed to load badge image: ${imageUrl}`);
                  setImgLoaded(true); // Stop showing loading state
                }}
              />
            </>
          )}
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

/**
 * Badges Page Component
 */
export default function BadgesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [badgesByCategory, setBadgesByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [badgeImageUrls, setBadgeImageUrls] = useState({});
  const [earnedBadgeIds, setEarnedBadgeIds] = useState(new Set());

  useEffect(() => {
    const loadBadges = async () => {
      try {
        setLoading(true);
        setImagesLoading(true);
        
        // Load user badges and categories/badges in parallel
        const [earnedIds, allCategories] = await Promise.all([
          // Fetch user's earned badge IDs (optimized - just IDs, no details)
          user?.uid ? fetchUserBadgeIds(user.uid).catch(() => new Set()) : Promise.resolve(new Set()),
          // Fetch all categories
          fetchBadgeCategories()
        ]);
        
        setEarnedBadgeIds(earnedIds);
        setCategories(allCategories);
        
        // Fetch badges for each category in parallel
        const badgesPromises = allCategories.map(async (category) => {
          const badges = await fetchBadgesByCategory(category.id);
          return { categoryId: category.id, badges };
        });
        
        const badgesResults = await Promise.all(badgesPromises);
        const badgesMap = {};
        const allBadges = [];
        
        badgesResults.forEach(({ categoryId, badges }) => {
          badgesMap[categoryId] = badges;
          // Ensure each badge has categoryId
          badges.forEach(badge => {
            if (!badge.categoryId) {
              badge.categoryId = categoryId;
            }
          });
          allBadges.push(...badges);
        });
        
        setBadgesByCategory(badgesMap);
        
        // Show content immediately, don't wait for images
        setLoading(false);
        
        // Load image URLs in background (use cache if available)
        const cachedUrls = getCachedBadgeUrls();
        if (cachedUrls && allBadges.length > 0) {
          // Check if cache is still valid
          const badgeIds = new Set(allBadges.map(b => b.id));
          const cachedIds = new Set(Object.keys(cachedUrls));
          const idsMatch = badgeIds.size === cachedIds.size && 
                          [...badgeIds].every(id => cachedIds.has(id));
          
          if (idsMatch) {
            // Use cached URLs immediately
            setBadgeImageUrls(cachedUrls);
            setImagesLoading(false);
          } else {
            // Cache outdated, reload in background
            batchLoadBadgeImageUrls(allBadges).then(urls => {
              setBadgeImageUrls(urls);
              setCachedBadgeUrls(urls);
              setImagesLoading(false);
            });
          }
        } else if (allBadges.length > 0) {
          // No cache, load URLs
          batchLoadBadgeImageUrls(allBadges).then(urls => {
            setBadgeImageUrls(urls);
            setCachedBadgeUrls(urls);
            setImagesLoading(false);
          });
        } else {
          setImagesLoading(false);
        }
      } catch (error) {
        console.error('Error loading badges:', error);
        setLoading(false);
        setImagesLoading(false);
      }
    };

    loadBadges();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-background-page dark:bg-background-page min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
        </div>
      </div>
    );
  }

  // Show loading indicator for images if still loading
  const showImageLoading = imagesLoading && Object.keys(badgeImageUrls).length === 0;

  // Calculate totals
  const totalBadges = Object.values(badgesByCategory).reduce((sum, badges) => sum + badges.length, 0);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 bg-background-page dark:bg-background-page min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <HiBadgeCheck className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500 dark:text-primary-400" />
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-text-primary">Badges</h1>
        </div>
        
        {/* Introduction */}
        <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 border-2 border-primary-200 dark:border-primary-700 mb-6">
          <div className="prose max-w-none">
            <h2 className="text-xl sm:text-2xl font-semibold text-text-primary dark:text-text-primary mb-3">
              Welcome to the Badge System!
            </h2>
            <p className="text-text-secondary dark:text-text-secondary mb-3">
              Badges are achievements you can earn by participating in activities and contributing to the community. 
              Each badge represents a milestone in your volunteering journey and helps you track your impact.
            </p>
            <p className="text-text-secondary dark:text-text-secondary mb-3">
              <strong className="text-text-primary dark:text-text-primary">How it works:</strong> When you complete activities, apply for opportunities, or reach certain milestones, 
              you'll automatically earn badges. Some badges also reward you with XP (experience points) that help you level up!
            </p>
            <p className="text-text-secondary dark:text-text-secondary">
              <strong className="text-text-primary dark:text-text-primary">Total Badges Available:</strong> <span className="font-semibold text-primary-600 dark:text-primary-400">{totalBadges}</span>
            </p>
          </div>
        </Card>

        {/* Category Summary */}
        {categories.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${categories.length === 3 ? 'lg:grid-cols-3' : categories.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4 mb-6`}>
            {categories.map((category) => {
              const badgeCount = badgesByCategory[category.id]?.length || 0;
              return (
                <Card key={category.id} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">{badgeCount}</div>
                  <div className="text-sm sm:text-base text-gray-600">{category.title || category.id}</div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Category Sections */}
      {categories.map((category) => {
        const badges = badgesByCategory[category.id] || [];
        
        // Sort badges within category
        let sortedBadges = [...badges];
        if (category.id === 'sdg') {
          // Sort SDG badges: numbers first (sorted numerically), then "sdg" badge at the end
          sortedBadges.sort((a, b) => {
            const aId = a.id.toLowerCase();
            const bId = b.id.toLowerCase();
            
            // If one is "sdg", it goes last
            if (aId === 'sdg') return 1;
            if (bId === 'sdg') return -1;
            
            // Otherwise sort numerically if both are numbers
            if (/^\d+$/.test(aId) && /^\d+$/.test(bId)) {
              return parseInt(aId) - parseInt(bId);
            }
            
            // Otherwise sort alphabetically
            return aId.localeCompare(bId);
          });
        } else {
          // Sort other categories alphabetically by title
          sortedBadges.sort((a, b) => (a.title || a.id || '').localeCompare(b.title || b.id || ''));
        }
        
        if (badges.length === 0) return null;
        
        return (
          <div key={category.id} className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary mb-2">
              {category.title || category.id}
            </h2>
            {category.description && (
              <p className="text-text-secondary dark:text-text-secondary mb-6">
                {category.description}
              </p>
            )}
            {showImageLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
                <span className="ml-3 text-text-secondary dark:text-text-secondary">Loading badge images...</span>
              </div>
            )}
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 ${showImageLoading ? 'opacity-50' : ''}`}>
              {sortedBadges.map((badge) => (
                <BadgeCard 
                  key={badge.id} 
                  badge={badge} 
                  imageUrl={badgeImageUrls[badge.id]}
                  isEarned={earnedBadgeIds.has(badge.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {totalBadges === 0 && (
        <Card className="text-center py-12 bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
          <HiBadgeCheck className="w-16 h-16 text-text-tertiary dark:text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary dark:text-text-secondary text-lg">No badges available at this time.</p>
        </Card>
      )}
    </div>
  );
}

