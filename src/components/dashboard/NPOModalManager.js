'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';

// Lazy load modals for better performance
const DeleteActivityModal = dynamic(() => import('@/components/activities/DeleteActivityModal'), {
  ssr: false,
});
const ReviewApplicationsModal = dynamic(() => import('@/components/activities/ReviewApplicationsModal'), {
  ssr: false,
});
const ActivityDetailsModal = dynamic(() => import('@/components/activities/ActivityDetailsModal'), {
  ssr: false,
});
const StatusUpdateModal = dynamic(() => import('@/components/activities/StatusUpdateModal'), {
  ssr: false,
});
const QRCodeModal = dynamic(() => import('@/components/activities/QRCodeModal'), {
  ssr: false,
});
const ActivityValidationModal = dynamic(() => import('@/components/activities/ActivityValidationModal'), {
  ssr: false,
});
const ParticipantListModal = dynamic(() => import('@/components/activities/ParticipantListModal'), {
  ssr: false,
});

/**
 * NPOModalManager Component
 * Consolidates all modals used in the NPO dashboard
 * Uses modal type + props pattern instead of separate boolean states
 * Mobile-optimized with bottom sheet support
 */
const NPOModalManager = memo(function NPOModalManager({
  modalType,
  modalProps,
  selectedActivity,
  onClose,
  onActivityDeleted,
  onOrganizationDataUpdate,
  onStatusChange,
  onStatusUpdate,
  isUpdatingStatus,
  onValidationModalClose,
}) {
  if (!modalType) return null;

  const handleClose = () => {
    onClose();
  };

  // Mobile-optimized modal sizing
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  switch (modalType) {
    case 'activity-delete':
      return (
        <DeleteActivityModal
          isOpen={true}
          onClose={handleClose}
          activity={modalProps?.activity || selectedActivity}
          onActivityDeleted={onActivityDeleted}
        />
      );

    case 'activity-review-applications':
      return (
        <ReviewApplicationsModal
          isOpen={true}
          onClose={handleClose}
          activity={modalProps?.activity || selectedActivity}
          onOrganizationDataUpdate={onOrganizationDataUpdate}
        />
      );

    case 'activity-details':
      return (
        <ActivityDetailsModal
          isOpen={true}
          onClose={handleClose}
          activityId={modalProps?.activityId || selectedActivity?.id}
        />
      );

    case 'activity-status-update':
      return (
        <StatusUpdateModal
          isOpen={true}
          onClose={handleClose}
          currentStatus={modalProps?.currentStatus || selectedActivity?.status}
          onStatusUpdate={onStatusUpdate}
          isUpdating={isUpdatingStatus}
        />
      );

    case 'activity-qr-code':
      const activity = modalProps?.activity || selectedActivity;
      if (!activity) return null;
      return (
        <QRCodeModal
          isOpen={true}
          onClose={handleClose}
          activityId={activity.id}
          qrCodeToken={activity.qrCodeToken || modalProps?.qrCodeToken}
          title={activity.title || modalProps?.title}
          startDate={activity.start_date || modalProps?.startDate}
        />
      );

    case 'activity-validation':
      const validationActivity = modalProps?.activity || selectedActivity;
      if (!validationActivity) return null;
      return (
        <ActivityValidationModal
          isOpen={true}
          onClose={onValidationModalClose}
          activity={{
            id: validationActivity.id,
            title: validationActivity.title,
            type: validationActivity.type,
            status: validationActivity.status,
          }}
          onStatusChange={onStatusChange}
        />
      );

    case 'activity-participants':
      const participantsActivity = modalProps?.activity || selectedActivity;
      if (!participantsActivity) return null;
      return (
        <ParticipantListModal
          isOpen={true}
          onClose={handleClose}
          activity={participantsActivity}
        />
      );

    default:
      return null;
  }
});

export default NPOModalManager;
