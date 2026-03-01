'use client';

import { Modal, Spinner, Button, Badge, Dropdown } from 'flowbite-react';
import { useEffect, useState, useCallback } from 'react';
import { fetchValidationsForActivity, validateApplicant, rejectApplicant } from '@/utils/crudActivityValidation';
import { getActivityParticipations } from '@/utils/participationService';
import { fetchActivityById } from '@/utils/crudActivities';
import { getDoc, doc } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { useTranslations } from 'next-intl';
import { useModal } from '@/utils/modal/useModal';
import { useAuth } from '@/utils/auth/AuthContext';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import ProfilePicture from '@/components/common/ProfilePicture';
import { HiCheck, HiX, HiMail, HiChevronDown } from 'react-icons/hi';

export default function ParticipantListModal({ isOpen, onClose, activity, activityId }) {
  const t = useTranslations('MyNonProfit');
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [fullActivity, setFullActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [processing, setProcessing] = useState({});
  const wrappedOnClose = useModal(isOpen, onClose, 'participant-list-modal');

  const effectiveActivityId = activity?.id || activityId;

  const fetchParticipants = useCallback(async () => {
    if (!effectiveActivityId) return;

    setLoading(true);
    try {
      const [activityData, validations, participations] = await Promise.all([
        fetchActivityById(effectiveActivityId),
        fetchValidationsForActivity(effectiveActivityId),
        getActivityParticipations(effectiveActivityId),
      ]);
      setFullActivity(activityData || activity);
      const participationByUser = {};
      participations.forEach((p) => {
        participationByUser[p.id] = p;
      });

      const participantsData = await Promise.all(
        validations.map(async (validation) => {
          const part = participationByUser[validation.userId];
          const reported = part?.hours?.reported != null ? Number(part.hours.reported) : null;
          const validated = part?.hours?.validated != null ? Number(part.hours.validated) : null;
          const base = {
            userId: validation.userId,
            displayName: 'Unknown User',
            profilePicture: null,
            email: null,
            status: validation.status || 'validated',
            validatedAt: validation.validatedAt,
            rejectedAt: validation.rejectedAt,
            reportedHours: reported,
            validatedHours: validated,
          };
          try {
            const userRef = doc(db, 'members', validation.userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              base.displayName = userData.displayName || userData.name || 'Unknown User';
              base.profilePicture = userData.profilePicture || userData.photoURL || null;
              base.email = userData.email || null;
            }
          } catch (error) {
            console.error(`Error fetching user ${validation.userId}:`, error);
          }
          return base;
        })
      );
      const cleaned = participantsData.filter((p) => p != null);
      setParticipants(cleaned);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveActivityId]);

  useEffect(() => {
    if (isOpen && effectiveActivityId) {
      fetchParticipants();
    } else if (!isOpen) {
      // Reset state when modal closes
      setParticipants([]);
      setFullActivity(null);
      setProfileModalOpen(false);
      setSelectedUserId(null);
      setProcessing({});
    }
  }, [isOpen, effectiveActivityId, fetchParticipants]);

  const handleParticipantClick = (userId) => {
    setSelectedUserId(userId);
    setProfileModalOpen(true);
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      return '';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'validated':
        return <Badge color="success" icon={HiCheck}>{t('validated') || 'Validated'}</Badge>;
      case 'rejected':
        return <Badge color="failure" icon={HiX}>{t('rejected') || 'Rejected'}</Badge>;
      case 'pending':
        return <Badge color="warning">{t('pendingValidation') || 'Pending'}</Badge>;
      default:
        return null;
    }
  };

  const handleValidate = async (userId) => {
    if (!user?.uid || !effectiveActivityId) return;
    
    setProcessing(prev => ({ ...prev, [userId]: true }));
    try {
      const result = await validateApplicant(effectiveActivityId, userId, user.uid);
      if (result.success) {
        // Refresh participants list
        await fetchParticipants();
      } else {
        console.error('Validation error:', result.message);
        alert(result.message || t('errorValidating') || 'Failed to validate participant');
      }
    } catch (error) {
      console.error('Error validating participant:', error);
      alert(t('errorValidating') || 'An error occurred while validating the participant');
    } finally {
      setProcessing(prev => {
        const newProcessing = { ...prev };
        delete newProcessing[userId];
        return newProcessing;
      });
    }
  };

  const handleReject = async (userId) => {
    if (!user?.uid || !effectiveActivityId) return;

    setProcessing(prev => ({ ...prev, [userId]: true }));
    try {
      const result = await rejectApplicant(effectiveActivityId, userId, user.uid);
      if (result.success) await fetchParticipants();
      else alert(result.message || t('errorRejecting') || 'Failed to reject participant');
    } catch (error) {
      console.error('Error rejecting participant:', error);
      alert(t('errorRejecting') || 'An error occurred while rejecting the participant');
    } finally {
      setProcessing(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const handleContactParticipants = (filterType) => {
    let filteredParticipants = [];
    
    switch (filterType) {
      case 'pending':
        filteredParticipants = participants.filter(p => p.status === 'pending');
        break;
      case 'validated':
        filteredParticipants = participants.filter(p => p.status === 'validated');
        break;
      case 'all':
        // Include all participants except rejected ones
        filteredParticipants = participants.filter(p => p.status !== 'rejected');
        break;
      default:
        filteredParticipants = participants;
    }
    
    // Get emails, filtering out null/undefined/empty strings
    const emails = filteredParticipants
      .map(p => p.email)
      .filter(email => email && email.trim() !== '');
    
    if (emails.length === 0) {
      alert(t('noEmailsAvailable') || 'No email addresses available for the selected participants.');
      return;
    }
    
    // Create mailto: link with BCC
    // Note: Some email clients have limits on BCC recipients (typically 50-100)
    // For large lists, you might want to split into multiple emails
    const bccEmails = emails.join(',');
    const activityTitle = activity?.title || t('activity') || 'Activity';
    const subject = encodeURIComponent(
      t('emailSubject', { activityTitle }) || 
      `Regarding: ${activityTitle}`
    );
    const mailtoLink = `mailto:?bcc=${encodeURIComponent(bccEmails)}&subject=${subject}`;
    
    // Open email client
    window.location.href = mailtoLink;
  };

  return (
    <>
      <Modal show={isOpen} onClose={wrappedOnClose} size="lg" className="z-50">
        <Modal.Header className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-semibold">{t('participantsTitle')}</h3>
            {participants.length > 0 && (
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                {participants.length}
              </span>
              )}
            </div>

            {/* Contact Participants Button */}
            {participants.length > 0 && (
              <div className="relative">
                <Dropdown
                  label=""
                  dismissOnClick={true}
                  renderTrigger={() => (
                    <Button
                      size="sm"
                      color="light"
                      className="bg-white/20 hover:bg-white/30 text-white border-0 min-h-[44px] sm:min-h-0"
                    >
                      <HiMail className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t('contactParticipants') || 'Contact'}</span>
                      <HiChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                >
                  <Dropdown.Item onClick={() => handleContactParticipants('pending')}>
                    {t('contactPending') || 'Contact Pending'} ({participants.filter(p => p.status === 'pending').length})
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleContactParticipants('validated')}>
                    {t('contactValidated') || 'Contact Validated'} ({participants.filter(p => p.status === 'validated').length})
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleContactParticipants('all')}>
                    {t('contactAll') || 'Contact All'} ({participants.filter(p => p.status !== 'rejected').length})
                  </Dropdown.Item>
                </Dropdown>
              </div>
            )}
          </div>
        </Modal.Header>
        
        <Modal.Body className="max-h-[70vh] overflow-y-auto px-4 sm:px-6 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="xl" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                {t('noParticipants') || 'No participants yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Global impact summary (for activities with impact parameters, exclude Events) */}
              {fullActivity?.type !== 'event' &&
                (fullActivity?.impactParameters?.length > 0 ||
                  (fullActivity?.impactResults && Object.keys(fullActivity.impactResults.parameters || {}).length > 0)) && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                    {t('impactResults') || 'Impact results'}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {t('totalHours') || 'Total hours'}: {(fullActivity?.impactResults?.totalHours ?? 0).toFixed(1)}
                    </span>
                    {(() => {
                      const params = fullActivity?.impactParameters || [];
                      const results = fullActivity?.impactResults?.parameters || {};
                      const allParamIds = new Set([
                        ...params.map((p) => p?.parameterId).filter(Boolean),
                        ...Object.keys(results),
                      ]);
                      const paramById = params.reduce((acc, p) => {
                        if (p?.parameterId) acc[p.parameterId] = p;
                        return acc;
                      }, {});
                      return [...allParamIds].map((paramId) => {
                        const meta = paramById[paramId];
                        const label = meta?.label || paramId;
                        const unit = meta?.unit ? ` (${meta.unit})` : '';
                        const value = results[paramId];
                        return (
                          <span key={paramId} className="text-sm text-green-700 dark:text-green-300">
                            {label}{unit}: {value != null ? String(value) : '—'}
                          </span>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Info message for validation */}
              {participants.some(p => p.status === 'pending') && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 text-center">
                    {t('validateActivityCompletion') || 'Use the buttons below to validate if each participant actually completed the activity.'}
                  </p>
                </div>
              )}

              {participants.map((participant) => {
                const isProcessing = processing[participant.userId] || false;
                const isPending = participant.status === 'pending';
                const showButtons = isPending;
                
                return (
                <div
                  key={participant.userId}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Avatar and Info */}
                      <div 
                        className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0"
                      >
                        <div 
                          className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleParticipantClick(participant.userId)}
                          title={t('viewProfile') || 'View profile'}
                        >
                          <ProfilePicture
                            src={participant.profilePicture}
                            alt={participant.displayName}
                            size={48}
                            showInitials={true}
                            name={participant.displayName}
                            loading="lazy"
                            className="w-10 h-10 sm:w-12 sm:h-12"
                          />
                        </div>
                  
                        {/* Name, Status, and Date */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleParticipantClick(participant.userId)}
                        >
                          <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {participant.displayName}
                    </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(participant.status)}
                          </div>
                          {(participant.validatedAt || participant.rejectedAt) && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {participant.validatedAt 
                                ? `${t('validatedAt') || 'Validated at'}: ${formatDate(participant.validatedAt)}`
                                : participant.rejectedAt 
                                  ? `${t('rejectedAt') || 'Rejected at'}: ${formatDate(participant.rejectedAt)}`
                                  : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Hours display (NPO edits via Close/Edit modal) */}
                      {(participant.validatedHours != null || participant.reportedHours != null) && (
                        <div className="pt-2 sm:pt-0 sm:pl-4 sm:ml-4 sm:border-l border-gray-100 dark:border-gray-700">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {t('validatedHours') || 'Hours'}: {participant.validatedHours != null ? participant.validatedHours : participant.reportedHours ?? '—'}
                          </span>
                        </div>
                      )}

                      {/* Action Buttons - Only show for pending status */}
                      {showButtons && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-700 sm:border-l sm:pl-4 sm:ml-4 min-w-[180px] sm:min-w-[200px]">
                          <Button
                            size="sm"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleValidate(participant.userId);
                            }}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 flex items-center justify-center whitespace-nowrap"
                          >
                            {isProcessing ? (
                              <Spinner size="sm" />
                            ) : (
                              <>
                                <HiCheck className="h-4 w-4 sm:mr-1" />
                                <span className="text-sm sm:text-base">{t('validateParticipant') || 'Validate'}</span>
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(participant.userId);
                            }}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 flex items-center justify-center whitespace-nowrap"
                          >
                            {isProcessing ? (
                              <Spinner size="sm" />
                            ) : (
                              <>
                                <HiX className="h-4 w-4 sm:mr-1" />
                                <span className="text-sm sm:text-base">{t('rejectParticipant') || 'Reject'}</span>
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
          )}
        </Modal.Body>
      </Modal>

      {/* Public Profile Modal */}
      {selectedUserId && (
        <PublicProfileModal
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
          isOwnProfile={false}
        />
      )}
    </>
  );
}
