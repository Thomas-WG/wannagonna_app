'use client';

import { useState, useEffect } from 'react';
import { HiCheckCircle, HiStar } from 'react-icons/hi';

/**
 * ActivityValidationSuccessModal component displays a celebratory animation when activity is validated
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the modal
 * @param {Function} props.onClose - Callback when modal should close
 * @param {number} props.xpReward - XP points earned
 * @param {Array} props.badges - Array of badges earned
 * @param {string} props.activityTitle - Title of the validated activity
 */
export default function ActivityValidationSuccessModal({ 
  show, 
  onClose, 
  xpReward = 0,
  badges = [],
  activityTitle = ''
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show]);

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
          <div className="relative my-6">
            <div className="relative animate-badge-pop">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <HiCheckCircle className="w-16 h-16 text-white" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full blur-xl opacity-50 animate-pulse -z-10"></div>
            </div>
          </div>

          {/* XP Reward */}
          {xpReward > 0 && (
            <div className="mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <HiStar className="w-5 h-5" />
              <span className="text-lg font-semibold">
                +{xpReward} XP Earned!
              </span>
            </div>
          )}

          {/* Success message */}
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
            Congratulations for participating! 🎉
          </p>


          {/* Badges earned (if any were already processed) */}
          {badges.length > 0 && (
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
                    {badge.title}
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

