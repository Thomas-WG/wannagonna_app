'use client';

import { memo } from 'react';
import { Modal, Button, Textarea } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import ActivityDetailsModal from '@/components/activities/ActivityDetailsModal';
import ViewApplicationModal from '@/components/activities/ViewApplicationModal';
import QRCodeScanner from '@/components/activities/QRCodeScanner';
import ActivityValidationSuccessModal from '@/components/activities/ActivityValidationSuccessModal';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import NPODetailsModal from '@/components/activities/NPODetailsModal';
import { useDashboardStore } from '@/stores/dashboardStore';

/**
 * DashboardModals Component
 * Consolidates all modals used in the dashboard
 */
const DashboardModals = memo(function DashboardModals({
  applicationsWithActivities,
  validationResult,
  user,
  onApplicationUpdated,
  onCancelApplication,
  isCancelling,
  cancelMessage,
  onCancelMessageChange,
  onQRScanSuccess,
  showValidationModal,
  closeValidationModal,
}) {
  const t = useTranslations('Dashboard');
  const {
    showActivityModal,
    showApplicationModal,
    showQRScanner,
    showProfileModal,
    showOrgModal,
    showCancelModal,
    selectedActivityId,
    selectedApplicationActivity,
    selectedOrganization,
    selectedProfileUserId,
    cancelApplication,
    closeActivityModal,
    closeApplicationModal,
    closeProfileModal,
    closeOrgModal,
    closeCancelModal,
    setShowQRScanner,
  } = useDashboardStore();

  return (
    <>
      {/* Activity Details Modal */}
      <ActivityDetailsModal
        isOpen={showActivityModal}
        onClose={closeActivityModal}
        activityId={selectedActivityId}
      />

      {/* View Application Modal */}
      {selectedApplicationActivity && showApplicationModal && (
        <ViewApplicationModal
          isOpen={showApplicationModal}
          onClose={closeApplicationModal}
          application={
            selectedApplicationActivity.applicationData ||
            (selectedApplicationActivity.applicationId
              ? applicationsWithActivities.find(
                  (app) => app.id === selectedApplicationActivity.applicationId
                )
              : null)
          }
          activityId={selectedApplicationActivity.id}
          onApplicationUpdated={onApplicationUpdated}
        />
      )}

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={onQRScanSuccess}
      />

      {/* Activity Validation Success Modal */}
      <ActivityValidationSuccessModal
        show={showValidationModal}
        onClose={closeValidationModal}
        xpReward={validationResult?.xpReward || validationResult?.xpBreakdown?.totalXP || 0}
        badgeIds={validationResult?.badgeIds || []}
        badges={validationResult?.badges || []}
        activityTitle={validationResult?.activityTitle || ''}
        xpBreakdown={validationResult?.xpBreakdown || null}
      />

      {/* Public Profile Modal */}
      <PublicProfileModal
        isOpen={showProfileModal}
        onClose={closeProfileModal}
        userId={selectedProfileUserId || user?.uid}
        isOwnProfile={selectedProfileUserId === user?.uid}
      />

      {/* Organization Details Modal */}
      <NPODetailsModal
        isOpen={showOrgModal}
        onClose={closeOrgModal}
        organization={selectedOrganization}
      />

      {/* Cancel Application Modal */}
      <Modal
        show={showCancelModal}
        onClose={() => {
          if (!isCancelling) {
            closeCancelModal();
          }
        }}
        size="md"
      >
        <Modal.Header>
          {t('confirmCancelApplication') || 'Confirm Cancellation'}
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-text-secondary dark:text-text-secondary mb-3">
            {t('confirmCancelMessage') ||
              'Are you sure you want to cancel this application? This action cannot be undone.'}
          </p>
          <label className="block text-sm font-medium mb-1 text-text-primary dark:text-text-primary">
            {t('optionalCancelMessage') || 'Cancellation message (optional)'}
          </label>
          <Textarea
            rows={3}
            value={cancelMessage}
            onChange={(e) => onCancelMessageChange(e.target.value)}
            placeholder={
              t('optionalCancelPlaceholder') ||
              'You can briefly explain why you are cancelling'
            }
            className="w-full"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="failure"
            onClick={onCancelApplication}
            disabled={isCancelling}
            className="bg-semantic-error-600 hover:bg-semantic-error-700 dark:bg-semantic-error-500 dark:hover:bg-semantic-error-600"
          >
            {isCancelling
              ? t('cancelling') || 'Cancelling...'
              : t('confirmCancel') || 'Yes, cancel application'}
          </Button>
          <Button
            color="gray"
            onClick={closeCancelModal}
            disabled={isCancelling}
          >
            {t('noKeepIt') || 'No, keep it'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
});

export default DashboardModals;

