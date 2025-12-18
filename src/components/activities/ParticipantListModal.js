'use client';

import { Modal, Avatar, Spinner } from 'flowbite-react';
import { useEffect, useState, useCallback } from 'react';
import { fetchValidationsForActivity } from '@/utils/crudActivityValidation';
import { getDoc, doc } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { useTranslations } from 'next-intl';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import Image from 'next/image';

export default function ParticipantListModal({ isOpen, onClose, activityId }) {
  const t = useTranslations('MyNonProfit');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const fetchParticipants = useCallback(async () => {
    if (!activityId) return;
    
    setLoading(true);
    try {
      // Fetch all validations for the activity
      const validations = await fetchValidationsForActivity(activityId);
      
      // Filter to only validated participants (status === 'validated')
      const validatedValidations = validations.filter(v => v.status === 'validated');
      
      // Fetch user profile data for each validated participant
      const participantsData = await Promise.all(
        validatedValidations.map(async (validation) => {
          try {
            const userRef = doc(db, 'members', validation.userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                userId: validation.userId,
                displayName: userData.displayName || userData.name || 'Unknown User',
                profilePicture: userData.profilePicture || userData.photoURL || null,
                validatedAt: validation.validatedAt
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching user ${validation.userId}:`, error);
            return {
              userId: validation.userId,
              displayName: 'Unknown User',
              profilePicture: null,
              validatedAt: validation.validatedAt
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
  }, [activityId]);

  useEffect(() => {
    if (isOpen && activityId) {
      fetchParticipants();
    } else if (!isOpen) {
      // Reset state when modal closes
      setParticipants([]);
      setProfileModalOpen(false);
      setSelectedUserId(null);
    }
  }, [isOpen, activityId, fetchParticipants]);

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

  return (
    <>
      <Modal show={isOpen} onClose={onClose} size="md" className="z-50">
        <Modal.Header className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-semibold">{t('participantsTitle')}</h3>
            {participants.length > 0 && (
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                {participants.length}
              </span>
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
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.userId}
                  onClick={() => handleParticipantClick(participant.userId)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors touch-manipulation active:scale-[0.98]"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {participant.profilePicture ? (
                      <Image
                        src={participant.profilePicture}
                        alt={participant.displayName}
                        width={48}
                        height={48}
                        className="rounded-full w-12 h-12 object-cover"
                      />
                    ) : (
                      <Avatar
                        img=""
                        alt={participant.displayName}
                        rounded
                        size="md"
                        className="bg-gray-300 dark:bg-gray-600"
                      >
                        <span className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                          {participant.displayName.charAt(0).toUpperCase()}
                        </span>
                      </Avatar>
                    )}
                  </div>
                  
                  {/* Name and Date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                      {participant.displayName}
                    </p>
                    {participant.validatedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {t('validatedAt')}: {formatDate(participant.validatedAt)}
                      </p>
                    )}
                  </div>
                  
                  {/* Click indicator */}
                  <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              ))}
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
