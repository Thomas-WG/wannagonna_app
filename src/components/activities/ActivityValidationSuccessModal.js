'use client';

import { useState, useEffect } from 'react';
import { HiCheckCircle, HiStar } from 'react-icons/hi';
import { fetchBadgeDetailsByIds, findBadgeById, getBadgeImageUrl } from '@/utils/crudBadges';

/**
 * ActivityValidationSuccessModal component displays a celebratory animation when activity is validated
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the modal
 * @param {Function} props.onClose - Callback when modal should close
 * @param {number} props.xpReward - Total XP points earned (for backward compatibility)
 * @param {Array} props.badges - Array of badges earned (for backward compatibility)
 * @param {string[]} props.badgeIds - Array of badge IDs to fetch and display
 * @param {string} props.activityTitle - Title of the validated activity
 * @param {Object} props.xpBreakdown - XP composition breakdown
 * @param {number} props.xpBreakdown.totalXP - Total XP earned
 * @param {number} props.xpBreakdown.activityXP - XP from activity itself
 * @param {Object} props.xpBreakdown.badgeXPMap - Map of badge ID to XP value
 */
export default function ActivityValidationSuccessModal({ 
  show, 
  onClose, 
  xpReward = 0,
  badges = [],
  badgeIds = [],
  activityTitle = '',
  xpBreakdown = null
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [badgeDetails, setBadgeDetails] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [badgeAnimationIndex, setBadgeAnimationIndex] = useState(-1);

  // Determine which badge IDs to use
  const badgeIdsToFetch = badgeIds.length > 0 ? badgeIds : (badges.map(b => b.id).filter(Boolean));

  // Determine XP values
  const totalXP = xpBreakdown?.totalXP ?? xpReward;
  const activityXP = xpBreakdown?.activityXP ?? 0;
  const badgeXPMap = xpBreakdown?.badgeXPMap ?? {};

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      setBadgeAnimationIndex(-1);
      
      // Fetch badge details if we have badge IDs
      if (badgeIdsToFetch.length > 0) {
        loadBadgeDetails();
      } else {
        setBadgeDetails([]);
      }
    } else {
      setBadgeDetails([]);
      setBadgeAnimationIndex(-1);
    }
  }, [show, badgeIdsToFetch.join(',')]);
  
  // Start badge animations immediately when modal shows (don't wait for images)
  useEffect(() => {
    if (show && badgeIdsToFetch.length > 0) {
      // Start animations faster - only wait 0.5s for XP to show, then animate badges
      const badgeAnimationTimer = setTimeout(() => {
        // Animate badges one by one (use badgeIdsToFetch length since we're not waiting for images)
        const totalBadges = badgeIdsToFetch.length;
        for (let index = 0; index < totalBadges; index++) {
          setTimeout(() => {
            setBadgeAnimationIndex(index);
          }, index * 150); // 0.15s delay between each badge (faster)
        }
      }, 500); // Start after 0.5 seconds (faster - just enough for XP to show)
      
      return () => clearTimeout(badgeAnimationTimer);
    }
  }, [show, badgeIdsToFetch.length]);
  
  // Auto-close after all badges have been shown AND images have loaded (with extra time to read)
  useEffect(() => {
    if (!show) return;
    
    // Calculate when all badges will be shown (animation timing)
    const totalBadges = badgeIdsToFetch.length;
    const timeToShowAllBadges = 500 + (totalBadges * 150); // 0.5s initial delay + 0.15s per badge
    
    // Check if images are still loading
    const imagesStillLoading = loadingBadges || badgeDetails.length < badgeIdsToFetch.length || 
      (badgeDetails.length > 0 && badgeDetails.some(b => !b.imageUrl));
    
    // If images are still loading, wait longer (images can take up to 30+ seconds)
    // Otherwise, wait for animation + reading time
    let autoCloseDelay;
    if (imagesStillLoading && badgeIdsToFetch.length > 0) {
      // Images are loading - wait up to 35 seconds for them, then 5s reading time
      // This gives Firebase Storage time to complete (it can be very slow)
      autoCloseDelay = 35000 + 5000; // 40 seconds total
    } else {
      // Images are done (or no badges) - just wait for animation + reading time
      autoCloseDelay = timeToShowAllBadges + 3000;
    }
    
    // Minimum 8 seconds, maximum 45 seconds (to allow for very slow image loading)
    const finalDelay = Math.max(8000, Math.min(45000, autoCloseDelay));
    
    const timer = setTimeout(() => {
      handleClose();
    }, finalDelay);
    
    return () => clearTimeout(timer);
  }, [show, badgeDetails.length, badgeIdsToFetch.length, loadingBadges]);

  const loadBadgeDetails = async () => {
    if (badgeIdsToFetch.length === 0) return;
    
    try {
      setLoadingBadges(true);
      
      // First, load badge metadata (fast) - don't wait for images
      const badgeMetadataPromises = badgeIdsToFetch.map(async (badgeId) => {
        const badgeDetails = await findBadgeById(badgeId);
        if (badgeDetails && badgeDetails.categoryId) {
          return {
            id: badgeId,
            title: badgeDetails.title || badgeId,
            description: badgeDetails.description || '',
            categoryId: badgeDetails.categoryId,
            imageUrl: null, // Will be loaded separately
          };
        }
        return null;
      });
      
      const metadataResults = await Promise.all(badgeMetadataPromises);
      const initialDetails = metadataResults.filter(badge => badge !== null);
      
      // Set initial details immediately (with null imageUrls)
      setBadgeDetails(initialDetails);
      setLoadingBadges(false);
      
      // Now load images in background and update as they come in
      initialDetails.forEach(async (badge) => {
        try {
          const imageUrl = await getBadgeImageUrl(badge.categoryId, badge.id);
          
          if (imageUrl) {
            // Update badgeDetails with the new image URL
            setBadgeDetails(prev => prev.map(b => 
              b.id === badge.id ? { ...b, imageUrl } : b
            ));
          }
        } catch (error) {
          console.error(`Error loading image for badge ${badge.id}:`, error);
        }
      });
    } catch (error) {
      console.error('Error loading badge details:', error);
      setBadgeDetails([]);
      setLoadingBadges(false);
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Wait for fade-out animation
  };

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleClose}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 6)],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Modal container */}
      <div 
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Celebration emoji */}
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Activity Registered!
          </h2>

          {/* Activity title */}
          {activityTitle && (
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 font-semibold">
              {activityTitle}
            </p>
          )}

          {/* Success icon */}
          <div className="relative my-4">
            <div className="relative animate-badge-pop">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <HiCheckCircle className="w-12 h-12 text-white" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full blur-xl opacity-50 animate-pulse -z-10"></div>
            </div>
          </div>

          {/* Total XP - Prominently displayed */}
          {totalXP > 0 && (
            <div className="mb-4 flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
              <HiStar className="w-6 h-6" />
              <span className="text-3xl font-bold">
                +{totalXP} XP Total
              </span>
            </div>
          )}

          {/* Activity XP breakdown */}
          {activityXP > 0 && (
            <div className="mb-3 text-gray-700 dark:text-gray-300">
              <span className="text-base font-medium">
                Activity: +{activityXP} XP
              </span>
            </div>
          )}

          {/* Badges with XP breakdown - Show immediately, images load in background */}
          {badgeIdsToFetch.length > 0 && (
            <div className="mb-4 w-full">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {badgeIdsToFetch.map((badgeId, idx) => {
                  const badgeXP = badgeXPMap[badgeId] || 0;
                  const isVisible = badgeAnimationIndex >= idx;
                  // Find badge details if available (may still be loading)
                  const badgeDetail = badgeDetails.find(b => b.id === badgeId);
                  const badgeTitle = badgeDetail?.title || badgeId;
                  
                  return (
                    <div
                      key={badgeId}
                      className={`flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg transition-all duration-500 ${
                        isVisible 
                          ? 'opacity-100 translate-x-0' 
                          : 'opacity-0 -translate-x-4'
                      }`}
                      style={{
                        transitionDelay: isVisible ? `${idx * 0.1}s` : '0s'
                      }}
                    >
                      {/* Badge image - show placeholder while loading */}
                      <div className="flex-shrink-0">
                        {badgeDetail?.imageUrl ? (
                          <img
                            src={badgeDetail.imageUrl}
                            alt={badgeTitle}
                            className="w-12 h-12 object-contain"
                            onLoad={() => {}}
                            onError={(e) => {}}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-lg font-bold">
                            {loadingBadges ? (
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              '✨'
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Badge title and XP */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {badgeTitle}
                        </p>
                        {badgeXP > 0 && (
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            +{badgeXP} XP
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fallback: Show badges array if badgeIds not provided (backward compatibility) */}
          {badgeIdsToFetch.length === 0 && badges.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Badges Earned:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {badges.map((badge, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                  >
                    {badge.title || badge.id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={handleClose}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}

