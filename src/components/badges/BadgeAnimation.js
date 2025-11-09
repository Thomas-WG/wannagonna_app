'use client';

import { useState, useEffect } from 'react';
import { getBadgeImageUrl, fetchBadgeById } from '@/utils/crudBadges';

/**
 * BadgeAnimation component displays a celebratory animation when a badge is earned
 * @param {Object} props
 * @param {string} props.badgeId - The badge ID that was earned
 * @param {boolean} props.show - Whether to show the animation
 * @param {Function} props.onClose - Callback when animation should close
 */
export default function BadgeAnimation({ badgeId, show, onClose }) {
  const [badgeDetails, setBadgeDetails] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show && badgeId) {
      loadBadgeData();
      setIsAnimating(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, badgeId]);

  const loadBadgeData = async () => {
    if (!badgeId) return;
    
    try {
      setLoading(true);
      // Fetch badge details and image in parallel
      const [details, image] = await Promise.all([
        fetchBadgeById(badgeId),
        getBadgeImageUrl(badgeId)
      ]);
      
      setBadgeDetails(details);
      setImageUrl(image);
    } catch (error) {
      console.error('Error loading badge data:', error);
    } finally {
      setLoading(false);
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

      {/* Badge animation container */}
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
            Badge Earned!
          </h2>

          {/* Badge image */}
          <div className="relative my-6">
            {loading ? (
              <div className="w-32 h-32 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : imageUrl ? (
              <div className="relative animate-badge-pop">
                <img
                  src={imageUrl}
                  alt={badgeDetails?.title || 'Badge'}
                  className="w-32 h-32 object-contain drop-shadow-lg"
                />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse -z-10"></div>
              </div>
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                ✨
              </div>
            )}
          </div>

          {/* Badge title */}
          {badgeDetails?.title && (
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {badgeDetails.title}
            </h3>
          )}

          {/* Badge description */}
          {badgeDetails?.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {badgeDetails.description}
            </p>
          )}

          {/* Continue button */}
          <button
            onClick={handleClose}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}

