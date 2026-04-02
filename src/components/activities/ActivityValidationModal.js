'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Badge, Spinner } from 'flowbite-react';
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
import ProfilePicture from '@/components/common/ProfilePicture';
import { getDoc, doc } from 'firebase/firestore';
import { db } from 'firebaseConfig';

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
  const [qrValidatedParticipants, setQrValidatedParticipants] = useState([]);
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

      // When no applications but we have validated users (QR-only flow), fetch their display names
      const validated = validationsData.filter(v => v.status === 'validated');
      const validatedNotInApps = validated.filter(v =>
        !acceptedApps.some(a => a.user_id === v.user_id)
      );
      if (validatedNotInApps.length > 0) {
        const withNames = await Promise.all(
          validatedNotInApps.map(async (v) => {
            let display_name = 'Participant';
            try {
              const userDoc = await getDoc(doc(db, 'members', v.user_id));
              if (userDoc.exists()) {
                const d = userDoc.data();
                display_name = d.display_name || d.name || d.email || display_name;
              }
            } catch (_) {}
            return { user_id: v.user_id, display_name, status: 'validated' };
          })
        );
        setQrValidatedParticipants(withNames);
      } else {
        setQrValidatedParticipants([]);
      }
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
      setQrValidatedParticipants([]);
      setProcessing({});
      setIsProcessingAll(false);
    }
  }, [isOpen, fetchData]);

  // Get validation status for a user
  const getValidationStatus = (userId) => {
    const validation = validations.find(v => v.user_id === userId);
    if (!validation) return null;
    return validation.status; // 'validated' or 'rejected'
  };

  // Check if all applicants are validated or rejected
  const allApplicantsProcessed = () => {
    // If there are no applicants, consider it as "processed" (can close activity)
    if (applications.length === 0) return true;
    return applications.every(app => {
      const status = getValidationStatus(app.user_id);
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
        const status = getValidationStatus(app.user_id);
        return status !== 'validated' && status !== 'rejected';
      })
      .map(app => app.user_id);
    
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
        const status = getValidationStatus(app.user_id);
        return status !== 'validated' && status !== 'rejected';
      })
      .map(app => app.user_id);
    
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

  // Handle close - if all processed, tell parent to open CloseActivityModal (parent will not call updateActivityStatus here)
  const handleClose = useCallback(() => {
    const allProcessed = applications.length === 0 || applications.every(app => {
      const status = validations.find(v => v.user_id === app.user_id)?.status;
      return status === 'validated' || status === 'rejected';
    });
    const shouldCloseActivity = allProcessed && activity?.status !== 'Closed';
    if (onClose) {
      onClose(shouldCloseActivity, activity);
    }
  }, [activity, onClose, applications, validations]);
  
  // Use wrapped onClose for modal registration
  const wrappedOnClose = useModal(isOpen, handleClose, 'activity-validation-modal');

  // Count unprocessed applicants
  const unprocessedCount = applications.filter(app => {
    const status = getValidationStatus(app.user_id);
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
          <div className="text-center py-6">
            <p className="text-sm sm:text-base text-gray-500 px-2 mb-4">
              {t('noAcceptedApplicants') || 'No accepted applicants found for this activity.'}
            </p>
            {qrValidatedParticipants.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('qrParticipantsList') || 'The following participants validated via QR code:'}
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto mb-4 text-left">
                  {qrValidatedParticipants.map((p) => (
                    <div
                      key={p.user_id}
                      className="flex items-center gap-3 border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <ProfilePicture
                        src={null}
                        alt={p.display_name}
                        size={36}
                        variant="subtle"
                        showInitials={true}
                        name={p.display_name}
                        className="flex-shrink-0"
                      />
                      <span className="text-sm font-medium truncate">{p.display_name}</span>
                      <Badge color="success" className="ml-auto flex-shrink-0 text-xs">
                        {t('validated') || 'Validated'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 text-center">
                  {t('qrParticipantsNextStep') || 'Click Next to enter hours and impact, then close the activity.'}
                </p>
              </>
            ) : (
              <div className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 text-center">
                  {t('noApplicantsCanClose') || 'You can close this activity since there are no applicants.'}
                </p>
              </div>
            )}
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
                const validationStatus = getValidationStatus(application.user_id);
                const isProcessingUser = processing[application.user_id] || false;
                const isProcessed = validationStatus === 'validated' || validationStatus === 'rejected';

                return (
                  <div
                    key={application.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 pr-2">
                        <ProfilePicture
                          src={application.profile_picture}
                          alt={application.display_name}
                          size={40}
                          variant="subtle"
                          showInitials={true}
                          name={application.display_name}
                          loading="lazy"
                          className="sm:!w-10 sm:!h-10 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-sm sm:text-base font-medium text-gray-900 truncate" title={application.display_name}>
                            {application.display_name}
                          </p>
                          {(validationStatus === 'validated' || validationStatus === 'rejected') && (
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
                            onClick={() => handleValidate(application.user_id)}
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
                            onClick={() => handleReject(application.user_id)}
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

            {/* QR-only participants (validated via QR, no application) */}
            {qrValidatedParticipants.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {t('qrParticipantsAlso') || 'Also validated via QR code:'}
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {qrValidatedParticipants.map((p) => (
                    <div
                      key={p.user_id}
                      className="flex items-center gap-3 border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <ProfilePicture
                        src={null}
                        alt={p.display_name}
                        size={32}
                        variant="subtle"
                        showInitials={true}
                        name={p.display_name}
                        className="flex-shrink-0"
                      />
                      <span className="text-sm truncate">{p.display_name}</span>
                      <Badge color="success" className="ml-auto flex-shrink-0 text-xs">
                        {t('validated') || 'Validated'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            {allApplicantsProcessed() ? (t('next') || 'Next') : (t('close') || 'Close')}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

