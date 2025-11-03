'use client';

import { Modal, Button, Badge } from "flowbite-react";
import { HiCheck, HiX, HiClock, HiTrash, HiDocumentText } from "react-icons/hi";
import { useState } from "react";
import { updateApplicationStatus } from "@/utils/crudApplications";
import { formatDate } from "@/utils/dateUtils";
import { useTranslations } from "next-intl";

export default function ViewApplicationModal({ isOpen, onClose, application, activityId, onApplicationUpdated }) {
  const t = useTranslations('Dashboard');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
      await updateApplicationStatus(activityId, activityApplicationId, 'cancelled', '');
      
      // Update local state via callback - use the user's application document ID
      if (onApplicationUpdated) {
        onApplicationUpdated(application.id, 'cancelled');
      }
      
      setShowCancelConfirm(false);
      onClose();
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
      <Modal show={isOpen} onClose={onClose} size="xl">
        <Modal.Header>
          <div className="flex items-center gap-3">
            <HiDocumentText className="h-6 w-6" />
            <h3>{t('myApplication') || 'My Application'}</h3>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            {/* Application Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {t('status') || 'Status'}:
              </span>
              {getStatusBadge(application.status)}
            </div>

            {/* Application Date */}
            {application.createdAt && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t('appliedOn') || 'Applied on'}:
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(application.createdAt)}
                </p>
              </div>
            )}

            {/* User's Message */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                {t('yourMessage') || 'Your Message'}
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {application.message || t('noMessageProvided') || 'No message provided'}
                </p>
              </div>
            </div>

            {/* NPO Response */}
            {application.npoResponse && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  {t('npoResponse') || 'NPO Response'}
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {application.npoResponse}
                  </p>
                </div>
              </div>
            )}

            {/* Cancel Button - Only show if pending */}
            {application.status === 'pending' && (
              <div className="pt-4 border-t border-gray-200">
                <Button
                  color="failure"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isCancelling}
                  className="w-full sm:w-auto"
                >
                  <HiTrash className="h-5 w-5 mr-2" />
                  {t('cancelApplication') || 'Cancel Application'}
                </Button>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={onClose}>
            {t('close') || 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} size="md">
        <Modal.Header>
          {t('confirmCancelApplication') || 'Confirm Cancellation'}
        </Modal.Header>
        <Modal.Body>
          <p className="text-gray-700">
            {t('confirmCancelMessage') || 'Are you sure you want to cancel this application? This action cannot be undone.'}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="failure"
            onClick={handleCancelApplication}
            disabled={isCancelling}
          >
            {isCancelling 
              ? (t('cancelling') || 'Cancelling...')
              : (t('confirmCancel') || 'Yes, Cancel Application')
            }
          </Button>
          <Button color="gray" onClick={() => setShowCancelConfirm(false)} disabled={isCancelling}>
            {t('noKeepIt') || 'No, Keep It'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
