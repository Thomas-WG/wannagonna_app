import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Custom hook for handling validation results from URL parameters
 * Extracts validation result handling logic from dashboard page
 * @returns {Object} Validation result state and handlers
 */
export function useValidationResult(onToastMessage) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const validationProcessedRef = useRef(false);

  useEffect(() => {
    const validation = searchParams.get('validation');

    // Only process once per validation key
    const validationKey = validation
      ? `${validation}-${searchParams.get('xp') || ''}-${searchParams.get('activityTitle') || ''}`
      : null;

    if (!validation || !validationKey || validationProcessedRef.current === validationKey) {
      return;
    }

    // Mark as processed immediately
    validationProcessedRef.current = validationKey;

    if (validation === 'success') {
      // Parse success params
      const xp = parseInt(searchParams.get('xp') || '0', 10);
      const activityTitle = searchParams.get('activityTitle') || '';

      // Parse badges
      const badges = [];
      let idx = 0;
      while (searchParams.get(`badge${idx}`)) {
        const badgeId = searchParams.get(`badge${idx}`);
        badges.push({ id: badgeId, title: badgeId }); // You might want to fetch badge details
        idx++;
      }

      setValidationResult({
        xpReward: xp,
        badges: badges,
        activityTitle: activityTitle,
      });
      setShowValidationModal(true);

      // Clean up URL immediately
      if (window.location.search.includes('validation=')) {
        router.replace('/dashboard', { scroll: false });
      }
    } else if (validation === 'already-validated') {
      // Show toast message
      if (onToastMessage) {
        onToastMessage({
          type: 'info',
          message: 'You have already validated this activity.',
        });
      }

      // Clean up URL immediately
      if (window.location.search.includes('validation=')) {
        router.replace('/dashboard', { scroll: false });
      }
    } else if (validation === 'error') {
      const message = decodeURIComponent(searchParams.get('message') || 'Validation failed');

      // Show toast message
      if (onToastMessage) {
        onToastMessage({
          type: 'failure',
          message: message,
        });
      }

      // Clean up URL immediately
      if (window.location.search.includes('validation=')) {
        router.replace('/dashboard', { scroll: false });
      }
    }
  }, [searchParams, router, onToastMessage]);

  const closeValidationModal = () => {
    setShowValidationModal(false);
    setValidationResult(null);
  };

  return {
    showValidationModal,
    validationResult,
    closeValidationModal,
  };
}

