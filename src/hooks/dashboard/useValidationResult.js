import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/utils/auth/AuthContext';
import { useNotificationsListener } from '@/utils/notifications';

/**
 * Custom hook for handling validation results from URL parameters
 * Extracts validation result handling logic from dashboard page
 * @param {Function} onToastMessage - Callback for toast messages
 * @returns {Object} Validation result state and handlers
 */
export function useValidationResult(onToastMessage) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const validationProcessedRef = useRef(false);
  const pollingTimeoutRef = useRef(null);
  const currentActivityIdRef = useRef(null);
  
  // Listen to notifications for real-time updates
  const { notifications } = useNotificationsListener(user?.uid || null);
  
  // Expose function to set validation result externally (e.g., from notification click)
  const setValidationResultExternal = (result) => {
    setValidationResult(result);
    setShowValidationModal(true);
  };
  
  // Poll for notification with complete reward data after QR validation
  useEffect(() => {
    // If we have a pending validation (activityId stored) but no complete data yet
    if (currentActivityIdRef.current && validationResult && !validationResult.badgeIds?.length) {
      // Look for a REWARD notification with matching activityId
      const rewardNotification = notifications.find(
        (n) =>
          n.type === 'REWARD' &&
          n.metadata?.activityId === currentActivityIdRef.current &&
          n.metadata?.badgesGranted?.length > 0
      );
      
      if (rewardNotification && rewardNotification.metadata) {
        const metadata = rewardNotification.metadata;
        // Update validation result with complete data
        setValidationResult({
          ...validationResult,
          badgeIds: Array.isArray(metadata.badgesGranted) ? metadata.badgesGranted : [],
          xpBreakdown: {
            totalXP: metadata.totalXP || validationResult.xpReward || 0,
            activityXP: metadata.activityXP || 0,
            badgeXPMap: metadata.badgeXPMap || {},
          },
          xpReward: metadata.totalXP || validationResult.xpReward || 0,
        });
        
        // Clear the polling
        currentActivityIdRef.current = null;
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
      }
    }
  }, [notifications, validationResult]);

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
      const activityId = searchParams.get('activityId') || null;

      // Parse badges from URL (if any)
      const badges = [];
      let idx = 0;
      while (searchParams.get(`badge${idx}`)) {
        const badgeId = searchParams.get(`badge${idx}`);
        badges.push({ id: badgeId, title: badgeId });
        idx++;
      }

      // Set initial validation result (may be updated when notification arrives)
      setValidationResult({
        xpReward: xp,
        badges: badges,
        badgeIds: badges.map(b => b.id),
        activityTitle: activityTitle,
        activityId: activityId,
      });
      setShowValidationModal(true);
      
      // Store activityId to poll for complete notification data
      if (activityId) {
        currentActivityIdRef.current = activityId;
        
        // Set timeout to stop polling after 15 seconds
        pollingTimeoutRef.current = setTimeout(() => {
          currentActivityIdRef.current = null;
        }, 15000);
      }

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
    currentActivityIdRef.current = null;
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  return {
    showValidationModal,
    validationResult,
    closeValidationModal,
    setValidationResultExternal,
  };
}

