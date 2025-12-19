'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Avatar, Badge, Spinner } from 'flowbite-react';
import { HiCheck, HiX } from 'react-icons/hi';
import { useTranslations } from 'next-intl';
import { useModal } from '@/utils/modal/useModal';
import { fetchApplicationsForActivity } from '@/utils/crudApplications';
import { 
  fetchValidationsForActivity, 
  validateApplicant, 
  rejectApplicant,
  validateAllApplicants,
  rejectAllApplicants
} from '@/utils/crudActivityValidation';
import { useAuth } from '@/utils/auth/AuthContext';
import { updateActivityStatus } from '@/utils/crudActivities';

export default function ActivityValidationModal({ 
  isOpen, 
  onClose, 
  activity,
  onStatusChange 
}) {
  const { user } = useAuth();
  const t = useTranslations('ActivityValidationModal');
  const [applications, setApplications] = useState([]);
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState({}); // Track which user is being processed
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  // Fetch accepted applications and validations
  const fetchData = useCallback(async () => {
    if (!activity?.id || !isOpen) return;
    
    setLoading(true);
    try {
      // Fetch all applications
      const apps = await fetchApplicationsForActivity(activity.id);
      // Filter only accepted applications
      const acceptedApps = apps.filter(app => app.status === 'accepted');
      setApplications(acceptedApps);
      
      // Fetch validations
      const validationsData = await fetchValidationsForActivity(activity.id);
      setValidations(validationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [activity?.id, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      // Reset state when modal closes
      setApplications([]);
      setValidations([]);
      setProcessing({});
      setIsProcessingAll(false);
    }
  }, [isOpen, fetchData]);

  // Get validation status for a user
  const getValidationStatus = (userId) => {
    const validation = validations.find(v => v.userId === userId);
    if (!validation) return null;
    return validation.status; // 'validated' or 'rejected'
  };

  // Check if all applicants are validated or rejected
  const allApplicantsProcessed = () => {
    // If there are no applicants, consider it as "processed" (can close activity)
    if (applications.length === 0) return true;
    return applications.every(app => {
      const status = getValidationStatus(app.userId);
      return status === 'validated' || status === 'rejected';
    });
  };

  // Handle individual validate
  const handleValidate = async (userId) => {
    if (!user?.uid || !activity?.id) return;
    
    setProcessing(prev => ({ ...prev, [userId]: true }));
    try {
      const result = await validateApplicant(activity.id, userId, user.uid);
      if (result.success) {
        // Refresh validations
        const validationsData = await fetchValidationsForActivity(activity.id);
        setValidations(validationsData);
      } else {
        console.error('Validation error:', result.message);
        alert(result.message || 'Failed to validate applicant');
      }
    } catch (error) {
      console.error('Error validating applicant:', error);
      alert('An error occurred while validating the applicant');
    } finally {
      setProcessing(prev => {
        const newProcessing = { ...prev };
        delete newProcessing[userId];
        return newProcessing;
      });
    }
  };

  // Handle individual reject
  const handleReject = async (userId) => {
    if (!user?.uid || !activity?.id) return;
    
    setProcessing(prev => ({ ...prev, [userId]: true }));
    try {
      const result = await rejectApplicant(activity.id, userId, user.uid);
      if (result.success) {
        // Refresh validations
        const validationsData = await fetchValidationsForActivity(activity.id);
        setValidations(validationsData);
      } else {
        console.error('Rejection error:', result.message);
        alert(result.message || 'Failed to reject applicant');
      }
    } catch (error) {
      console.error('Error rejecting applicant:', error);
      alert('An error occurred while rejecting the applicant');
    } finally {
      setProcessing(prev => {
        const newProcessing = { ...prev };
        delete newProcessing[userId];
        return newProcessing;
      });
    }
  };

  // Handle validate all
  const handleValidateAll = async () => {
    if (!user?.uid || !activity?.id) return;
    
    const unprocessedUserIds = applications
      .filter(app => {
        const status = getValidationStatus(app.userId);
        return status !== 'validated' && status !== 'rejected';
      })
      .map(app => app.userId);
    
    if (unprocessedUserIds.length === 0) return;
    
    setIsProcessingAll(true);
    try {
      const result = await validateAllApplicants(activity.id, unprocessedUserIds, user.uid);
      // Refresh validations
      const validationsData = await fetchValidationsForActivity(activity.id);
      setValidations(validationsData);
      
      if (!result.success && result.errors.length > 0) {
        console.warn('Some validations failed:', result.errors);
      }
    } catch (error) {
      console.error('Error validating all applicants:', error);
      alert('An error occurred while validating applicants');
    } finally {
      setIsProcessingAll(false);
    }
  };

  // Handle reject all
  const handleRejectAll = async () => {
    if (!user?.uid || !activity?.id) return;
    
    const unprocessedUserIds = applications
      .filter(app => {
        const status = getValidationStatus(app.userId);
        return status !== 'validated' && status !== 'rejected';
      })
      .map(app => app.userId);
    
    if (unprocessedUserIds.length === 0) return;
    
    setIsProcessingAll(true);
    try {
      const result = await rejectAllApplicants(activity.id, unprocessedUserIds, user.uid);
      // Refresh validations
      const validationsData = await fetchValidationsForActivity(activity.id);
      setValidations(validationsData);
      
      if (!result.success && result.errors.length > 0) {
        console.warn('Some rejections failed:', result.errors);
      }
    } catch (error) {
      console.error('Error rejecting all applicants:', error);
      alert('An error occurred while rejecting applicants');
    } finally {
      setIsProcessingAll(false);
    }
  };

  // Handle close - check if all are processed, if so, close activity
  const handleClose = useCallback(async () => {
    // Check if all applicants are processed
    const allProcessed = applications.length === 0 || applications.every(app => {
      const status = validations.find(v => v.userId === app.userId)?.status;
      return status === 'validated' || status === 'rejected';
    });
    
    const shouldCloseActivity = allProcessed && activity?.status !== 'Closed';
    if (shouldCloseActivity) {
      // All applicants processed, close the activity
      try {
        await updateActivityStatus(activity.id, 'Closed');
        if (onStatusChange) {
          onStatusChange(activity.id, 'Closed');
        }
      } catch (error) {
        console.error('Error closing activity:', error);
        alert('Failed to close activity');
      }
    }
    // Pass whether activity should be closed to parent
    if (onClose) {
      onClose(shouldCloseActivity);
    }
  }, [activity, onClose, onStatusChange, applications, validations]);
  
  // Use wrapped onClose for modal registration
  const wrappedOnClose = useModal(isOpen, handleClose, 'activity-validation-modal');

  // Count unprocessed applicants
  const unprocessedCount = applications.filter(app => {
    const status = getValidationStatus(app.userId);
    return status !== 'validated' && status !== 'rejected';
  }).length;

  if (!activity) return null;

  return (
    <Modal 
      show={isOpen} 
      onClose={wrappedOnClose} 
      size="lg"
    >
      <Modal.Header className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col w-full min-w-0">
          <span className="text-base sm:text-lg font-semibold truncate">
            {t('title') || 'Validate Activity Participants'}
          </span>
          <span className="text-xs sm:text-sm text-gray-500 truncate mt-1">{activity?.title}</span>
        </div>
      </Modal.Header>
      
      <Modal.Body className="px-3 sm:px-6 py-3 sm:py-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="xl" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm sm:text-base text-gray-500 px-2 mb-4">
              {t('noAcceptedApplicants') || 'No accepted applicants found for this activity.'}
            </p>
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800 text-center">
                {t('noApplicantsCanClose') || 'You can close this activity since there are no applicants.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Bulk Actions */}
            {unprocessedCount > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 pb-3 sm:pb-4 border-b border-gray-200">
                <Button
                  color="success"
                  onClick={handleValidateAll}
                  disabled={isProcessingAll}
                  className="flex-1 w-full sm:w-auto min-h-[44px]"
                  size="sm"
                >
                  {isProcessingAll ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner size="sm" />
                      <span className="text-sm">{t('processing') || 'Processing...'}</span>
                    </div>
                  ) : (
                    <>
                      <HiCheck className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                      <span className="text-sm sm:text-base">
                        {t('validateAll') || `Validate All (${unprocessedCount})`}
                      </span>
                    </>
                  )}
                </Button>
                <Button
                  color="failure"
                  onClick={handleRejectAll}
                  disabled={isProcessingAll}
                  className="flex-1 w-full sm:w-auto min-h-[44px]"
                  size="sm"
                >
                  {isProcessingAll ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner size="sm" />
                      <span className="text-sm">{t('processing') || 'Processing...'}</span>
                    </div>
                  ) : (
                    <>
                      <HiX className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                      <span className="text-sm sm:text-base">
                        {t('rejectAll') || `Reject All (${unprocessedCount})`}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Applicants List */}
            <div className="space-y-2 sm:space-y-3 max-h-[50vh] sm:max-h-96 overflow-y-auto -mx-1 px-1">
              {applications.map((application) => {
                const validationStatus = getValidationStatus(application.userId);
                const isProcessingUser = processing[application.userId] || false;
                const isProcessed = validationStatus === 'validated' || validationStatus === 'rejected';

                return (
                  <div
                    key={application.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 pr-2">
                        <Avatar
                          img={application.profilePicture || '/favicon.ico'}
                          alt={application.displayName}
                          size="sm"
                          className="sm:!w-10 sm:!h-10 flex-shrink-0"
                          rounded
                        />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-sm sm:text-base font-medium text-gray-900 truncate" title={application.displayName}>
                            {application.displayName}
                          </p>
                          {validationStatus && (
                            <Badge
                              color={validationStatus === 'validated' ? 'success' : 'failure'}
                              className="mt-1 text-xs"
                            >
                              {validationStatus === 'validated' 
                                ? (t('validated') || 'Validated')
                                : (t('rejected') || 'Rejected')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {!isProcessed && (
                        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
                          <Button
                            size="sm"
                            color="success"
                            onClick={() => handleValidate(application.userId)}
                            disabled={isProcessingUser || isProcessingAll}
                            className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 flex items-center justify-center whitespace-nowrap"
                          >
                            {isProcessingUser ? (
                              <Spinner size="sm" />
                            ) : (
                              <>
                                <HiCheck className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('validate') || 'Validate'}</span>
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => handleReject(application.userId)}
                            disabled={isProcessingUser || isProcessingAll}
                            className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 flex items-center justify-center whitespace-nowrap"
                          >
                            {isProcessingUser ? (
                              <Spinner size="sm" />
                            ) : (
                              <>
                                <HiX className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('reject') || 'Reject'}</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completion Message */}
            {allApplicantsProcessed() && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs sm:text-sm text-green-800 text-center">
                  {t('allProcessed') || 'All applicants have been processed. The activity will be closed when you close this modal.'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-end w-full">
          <Button 
            color="gray" 
            onClick={wrappedOnClose}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            size="sm"
          >
            {t('close') || 'Close'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

