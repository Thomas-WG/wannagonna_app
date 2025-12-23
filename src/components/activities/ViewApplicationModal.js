'use client';

import { Modal, Button, Badge } from "flowbite-react";
import { HiCheck, HiX, HiClock, HiTrash, HiDocumentText } from "react-icons/hi";
import { useState } from "react";
import { updateApplicationStatus } from "@/utils/crudApplications";
import { formatDate } from "@/utils/dateUtils";
import { useTranslations } from "next-intl";
import { useTheme } from '@/utils/theme/ThemeContext';
import { useModal } from '@/utils/modal/useModal';

export default function ViewApplicationModal({ isOpen, onClose, application, activityId, onApplicationUpdated }) {
  const t = useTranslations('Dashboard');
  const { isDark } = useTheme();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const wrappedOnClose = useModal(isOpen, onClose, 'view-application-modal');
  const wrappedCancelConfirmOnClose = useModal(showCancelConfirm, () => setShowCancelConfirm(false), 'cancel-confirm-modal');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge color="success" icon={HiCheck}>{t('statusAccepted') || 'Accepted'}</Badge>;
      case 'rejected':
        return <Badge color="failure" icon={HiX}>{t('statusRejected') || 'Rejected'}</Badge>;
      case 'cancelled':
        return <Badge color="gray" icon={HiX}>{t('statusCancelled') || 'Cancelled'}</Badge>;
      default:
        return <Badge color="warning" icon={HiClock}>{t('statusPending') || 'Pending'}</Badge>;
    }
  };

  const handleCancelApplication = async () => {
    if (!application || !activityId) return;
    
    // Use applicationId field if available (ID in activity's applications collection), otherwise fall back to id
    const activityApplicationId = application.applicationId || application.id;
    
    setIsCancelling(true);
    try {
      await updateApplicationStatus(
        activityId,
        activityApplicationId,
        'cancelled',
        application.npoResponse || '',
        application.userId || null,
        cancelMessage.trim() || ''
      );
      
      // Update local state via callback - use the user's application document ID
      if (onApplicationUpdated) {
        onApplicationUpdated(application.id, 'cancelled');
      }
      
      setShowCancelConfirm(false);
      setCancelMessage('');
      wrappedOnClose();
    } catch (error) {
      console.error('Error cancelling application:', error);
      alert(t('errorCancellingApplication') || 'Failed to cancel application. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!application) return null;

  return (
    <>
      <Modal show={isOpen} onClose={wrappedOnClose} size="xl" className="z-50">
        <Modal.Header className="bg-gradient-to-r from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <HiDocumentText className="h-6 w-6 text-white" />
            <h3 className="text-white">{t('myApplication') || 'My Application'}</h3>
          </div>
        </Modal.Header>
        <Modal.Body className="bg-background-card dark:bg-background-card">
          <div className="space-y-6">
            {/* Application Status */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-border-light dark:border-[#475569]">
              <span className="text-sm font-medium text-text-primary dark:text-text-primary">
                {t('status') || 'Status'}:
              </span>
              {getStatusBadge(application.status)}
            </div>

            {/* Application Date */}
            {application.createdAt && (
              <div className="pb-4 border-b-2 border-border-light dark:border-[#475569]">
                <span className="text-sm font-medium text-text-primary dark:text-text-primary">
                  {t('appliedOn') || 'Applied on'}:
                </span>
                <p className="text-sm text-text-secondary dark:text-text-secondary mt-1">
                  {formatDate(application.createdAt)}
                </p>
              </div>
            )}

            {/* User's Message */}
            <div className="pb-4 border-b-2 border-border-light dark:border-[#475569]">
              <h4 className="text-sm font-semibold text-text-primary dark:text-text-primary mb-2">
                {t('yourMessage') || 'Your Message'}
              </h4>
              <div className="bg-background-hover dark:bg-background-hover border-2 border-border-light dark:border-[#475569] rounded-lg p-4">
                <p className="text-sm text-text-secondary dark:text-text-secondary whitespace-pre-wrap">
                  {application.message || t('noMessageProvided') || 'No message provided'}
                </p>
              </div>
            </div>

            {/* NPO Response */}
            {application.npoResponse && (
              <div className="pb-4 border-b-2 border-border-light dark:border-[#475569]">
                <h4 className="text-sm font-semibold text-text-primary dark:text-text-primary mb-2">
                  {t('npoResponse') || 'NPO Response'}
                </h4>
                <div className="bg-gradient-to-r from-semantic-info-50 to-semantic-info-100 dark:from-semantic-info-900 dark:to-semantic-info-800 border-2 border-semantic-info-200 dark:border-semantic-info-700 rounded-lg p-4">
                  <p className="text-sm text-text-secondary dark:text-text-secondary whitespace-pre-wrap">
                    {application.npoResponse}
                  </p>
                </div>
              </div>
            )}

            {/* Cancel Button - Only show if pending */}
            {application.status === 'pending' && (
              <div className="pt-4 border-t-2 border-border-light dark:border-[#475569]">
                <Button
                  color="failure"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isCancelling}
                  className="w-full sm:w-auto bg-semantic-error-600 hover:bg-semantic-error-700 dark:bg-semantic-error-500 dark:hover:bg-semantic-error-600 text-white"
                >
                  <HiTrash className="h-5 w-5 mr-2" />
                  {t('cancelApplication') || 'Cancel Application'}
                </Button>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-background-card dark:bg-background-card border-t-2 border-border-light dark:border-[#475569]">
          <Button 
            color="gray" 
            onClick={wrappedOnClose}
            className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            {t('close') || 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelConfirm} onClose={wrappedCancelConfirmOnClose} size="md" className="z-50">
        <Modal.Header className="bg-gradient-to-r from-semantic-error-500 to-semantic-error-600 dark:from-semantic-error-600 dark:to-semantic-error-700 text-white border-b border-border-light dark:border-border-dark">
          {t('confirmCancelApplication') || 'Confirm Cancellation'}
        </Modal.Header>
        <Modal.Body className="bg-background-card dark:bg-background-card">
          <p className="text-text-secondary dark:text-text-secondary mb-3">
            {t('confirmCancelMessage') || 'Are you sure you want to cancel this application? This action cannot be undone.'}
          </p>
          <label className="block text-sm font-medium mb-1 text-text-primary dark:text-text-primary">
            {t('optionalCancelMessage') || 'Cancellation message (optional)'}
          </label>
          <textarea
            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-page dark:bg-background-page text-sm p-2"
            rows={3}
            value={cancelMessage}
            onChange={(e) => setCancelMessage(e.target.value)}
            placeholder={t('optionalCancelPlaceholder') || 'You can briefly explain why you are cancelling'}
          />
        </Modal.Body>
        <Modal.Footer className="bg-background-card dark:bg-background-card border-t-2 border-border-light dark:border-[#475569]">
          <Button
            color="failure"
            onClick={handleCancelApplication}
            disabled={isCancelling}
            className="bg-semantic-error-600 hover:bg-semantic-error-700 dark:bg-semantic-error-500 dark:hover:bg-semantic-error-600 text-white"
          >
            {isCancelling 
              ? (t('cancelling') || 'Cancelling...')
              : (t('confirmCancel') || 'Yes, Cancel Application')
            }
          </Button>
          <Button 
            color="gray" 
            onClick={wrappedCancelConfirmOnClose} 
            disabled={isCancelling}
            className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            {t('noKeepIt') || 'No, Keep It'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
