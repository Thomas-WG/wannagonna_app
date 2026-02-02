'use client';

import { Modal, Avatar, Spinner, Button, Badge, Dropdown } from 'flowbite-react';
import { useEffect, useState, useCallback } from 'react';
import { fetchValidationsForActivity, validateApplicant, rejectApplicant } from '@/utils/crudActivityValidation';
import { getDoc, doc } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { useTranslations } from 'next-intl';
import { useModal } from '@/utils/modal/useModal';
import { useAuth } from '@/utils/auth/AuthContext';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import Image from 'next/image';
import { HiCheck, HiX, HiMail, HiChevronDown } from 'react-icons/hi';

export default function ParticipantListModal({ isOpen, onClose, activity, activityId }) {
  const t = useTranslations('MyNonProfit');
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [processing, setProcessing] = useState({}); // Track which user is being processed
  const wrappedOnClose = useModal(isOpen, onClose, 'participant-list-modal');
  
  // Use activityId from activity prop if available, otherwise use activityId prop (backward compatibility)
  const effectiveActivityId = activity?.id || activityId;

  const fetchParticipants = useCallback(async () => {
    if (!effectiveActivityId) return;
    
    setLoading(true);
    try {
      // Fetch all validations for the activity (pending, validated, rejected)
      const validations = await fetchValidationsForActivity(effectiveActivityId);
      
      // Fetch user profile data for all validations
      const participantsData = await Promise.all(
        validations.map(async (validation) => {
          try {
            const userRef = doc(db, 'members', validation.userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                userId: validation.userId,
                displayName: userData.displayName || userData.name || 'Unknown User',
                profilePicture: userData.profilePicture || userData.photoURL || null,
                email: userData.email || null, // Add email for contact functionality
                status: validation.status || 'validated', // Default to 'validated' for backward compatibility
                validatedAt: validation.validatedAt,
                rejectedAt: validation.rejectedAt
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching user ${validation.userId}:`, error);
            return {
              userId: validation.userId,
              displayName: 'Unknown User',
              profilePicture: null,
              email: null,
              status: validation.status || 'validated',
              validatedAt: validation.validatedAt,
              rejectedAt: validation.rejectedAt
            };
          }
        })
      );
      
      // Filter out null values
      setParticipants(participantsData.filter(p => p !== null));
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
      if (result.success) {
        // Refresh participants list
        await fetchParticipants();
      } else {
        console.error('Rejection error:', result.message);
        alert(result.message || t('errorRejecting') || 'Failed to reject participant');
      }
    } catch (error) {
      console.error('Error rejecting participant:', error);
      alert(t('errorRejecting') || 'An error occurred while rejecting the participant');
    } finally {
      setProcessing(prev => {
        const newProcessing = { ...prev };
        delete newProcessing[userId];
        return newProcessing;
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
                    {participant.profilePicture && participant.profilePicture.trim() !== '' ? (
                      <Image
                        src={participant.profilePicture}
                        alt={participant.displayName}
                        width={48}
                        height={48}
                              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 object-cover cursor-pointer"
                      />
                    ) : (
                      <Avatar
                        img=""
                        alt={participant.displayName}
                        rounded
                              size="sm"
                              className="sm:!w-10 sm:!h-10 flex-shrink-0 bg-gray-300 dark:bg-gray-600 cursor-pointer"
                      >
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
                          {participant.displayName.charAt(0).toUpperCase()}
                        </span>
                      </Avatar>
                    )}
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
