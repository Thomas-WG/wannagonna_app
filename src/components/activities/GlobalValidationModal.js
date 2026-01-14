'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import ActivityValidationSuccessModal from './ActivityValidationSuccessModal';

/**
 * GlobalValidationModal - Renders validation modal globally based on store state
 * This allows the modal to appear on any page, not just the dashboard
 */
export default function GlobalValidationModal() {
  const { notificationValidationResult, clearNotificationValidationResult } = useDashboardStore();
  const [showModal, setShowModal] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Watch for notification-based validation result
  useEffect(() => {
    if (notificationValidationResult) {
      setValidationResult(notificationValidationResult);
      setShowModal(true);
      clearNotificationValidationResult();
    }
  }, [notificationValidationResult, clearNotificationValidationResult]);

  const handleClose = () => {
    setShowModal(false);
    setValidationResult(null);
  };

  if (!showModal || !validationResult) {
    return null;
  }

  return (
    <ActivityValidationSuccessModal
      show={showModal}
      onClose={handleClose}
      xpReward={validationResult.xpReward || validationResult.xpBreakdown?.totalXP || 0}
      badgeIds={validationResult.badgeIds || []}
      badges={validationResult.badges || []}
      activityTitle={validationResult.activityTitle || ''}
      xpBreakdown={validationResult.xpBreakdown || null}
    />
  );
}

