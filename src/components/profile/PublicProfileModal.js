'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Avatar, Badge, Spinner, Progress } from 'flowbite-react';
import { HiUser, HiStar, HiBadgeCheck, HiCalendar, HiX, HiClock } from 'react-icons/hi';
import { fetchPublicMemberProfile, formatJoinedDate } from '@/utils/crudMemberProfile';
import { fetchUserBadges } from '@/utils/crudBadges';
import { fetchHistoryActivities } from '@/utils/crudActivities';
import { formatDateOnly } from '@/utils/dateUtils';
import BadgeDisplay from '@/components/badges/BadgeDisplay';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { countries } from 'countries-list';
import { getSkillsForSelect } from '@/utils/crudSkills';

export default function PublicProfileModal({ isOpen, onClose, userId, isOwnProfile = false }) {
  const t = useTranslations('CompleteProfile');
  const tProfile = useTranslations('PublicProfile');
  const locale = useLocale();
  const [profileData, setProfileData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [completedActivities, setCompletedActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [translatedSkills, setTranslatedSkills] = useState([]);

  const loadProfileData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [profile, userBadges, activities, skillOptions] = await Promise.all([
        fetchPublicMemberProfile(userId),
        fetchUserBadges(userId).catch(err => {
          console.error('Error fetching badges:', err);
          return [];
        }),
        fetchHistoryActivities(userId).catch(err => {
          console.error('Error fetching activities:', err);
          return [];
        }),
        getSkillsForSelect(locale).catch(err => {
          console.error('Error fetching skills:', err);
          return [];
        })
      ]);

      if (!profile) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      // Create a flat map of all skills for easy lookup
      const allSkills = skillOptions.reduce((acc, group) => {
        return [...acc, ...group.options];
      }, []);

      // Translate skills if profile has skills
      let translatedSkillsList = [];
      if (profile.skills && profile.skills.length > 0) {
        translatedSkillsList = profile.skills.map(skill => {
          // Find the skill in our options by value (skill ID)
          const foundSkill = allSkills.find(s => s.value === (skill.value || skill.id || skill));
          if (foundSkill) {
            return foundSkill;
          }
          // Fallback: if skill is an object with label, use it; otherwise use the value/id
          if (typeof skill === 'object' && skill.label) {
            return skill;
          }
          return { value: skill.value || skill.id || skill, label: skill.label || skill.value || skill.id || skill };
        });
      }

      setProfileData(profile);
      setBadges(userBadges);
      setCompletedActivities(activities);
      setTranslatedSkills(translatedSkillsList);
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [userId, locale]);

  useEffect(() => {
    if (isOpen && userId) {
      loadProfileData();
    } else {
      // Reset state when modal closes
      setProfileData(null);
      setBadges([]);
      setCompletedActivities([]);
      setTranslatedSkills([]);
      setError(null);
    }
  }, [isOpen, userId, loadProfileData]);

  const joinedDate = profileData?.createdAt ? formatJoinedDate(profileData.createdAt) : null;
  
  // Calculate XP progress for level bar
  const currentXP = profileData ? (profileData.xp % 100) : 0;
  const level = profileData?.level || 1;
  const totalXP = profileData?.xp || 0;
  
  // Get country name from country code
  const getCountryName = (countryCode) => {
    if (!countryCode) return null;
    const country = countries[countryCode.toUpperCase()];
    return country ? country.name : countryCode;
  };
  
  const countryName = profileData?.country ? getCountryName(profileData.country) : null;
  
  // Helper function to get selected time commitment options
  const getSelectedTimeCommitments = () => {
    if (!profileData?.timeCommitment) return [];
    const commitments = [];
    if (profileData.timeCommitment.daily) commitments.push(t('daily') || 'Daily');
    if (profileData.timeCommitment.weekly) commitments.push(t('weekly') || 'Weekly');
    if (profileData.timeCommitment.biweekly) commitments.push(t('biweekly') || 'Every two weeks');
    if (profileData.timeCommitment.monthly) commitments.push(t('monthly') || 'Monthly');
    if (profileData.timeCommitment.occasional) commitments.push(t('occasionally') || 'Occasionally');
    if (profileData.timeCommitment.flexible) commitments.push(t('flexible') || 'Flexible');
    return commitments;
  };
  
  // Helper function to get selected availability options
  const getSelectedAvailabilities = () => {
    if (!profileData?.availabilities) return [];
    const availabilities = [];
    if (profileData.availabilities.weekdays) availabilities.push(t('weekdays') || 'Weekdays');
    if (profileData.availabilities.weekends) availabilities.push(t('weekends') || 'Weekends');
    if (profileData.availabilities.mornings) availabilities.push(t('mornings') || 'Mornings');
    if (profileData.availabilities.afternoons) availabilities.push(t('afternoons') || 'Afternoons');
    if (profileData.availabilities.evenings) availabilities.push(t('evenings') || 'Evenings');
    if (profileData.availabilities.flexible) availabilities.push(t('flexible') || 'Flexible');
    return availabilities;
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="4xl" className="z-50">
      <Modal.Header className="border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{tProfile('title')}</span>
        </div>
      </Modal.Header>
      <Modal.Body className="max-h-[80vh] overflow-y-auto px-4 sm:px-6 overflow-x-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="xl" />
            <p className="mt-4 text-gray-600">{tProfile('loading')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <HiX className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-gray-600">{error}</p>
          </div>
        ) : !profileData ? (
          <div className="flex flex-col items-center justify-center py-12">
            <HiUser className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600">{tProfile('notFound')}</p>
          </div>
        ) : (
          <div className="space-y-6 w-full max-w-full overflow-x-hidden">
            {/* Header Section */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-200 w-full">
              <div className="relative">
                {profileData.profilePicture ? (
                  <Image
                    src={profileData.profilePicture}
                    alt={profileData.displayName || 'User'}
                    width={100}
                    height={100}
                    className="rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="rounded-full bg-indigo-500 w-24 h-24 flex items-center justify-center border-4 border-white shadow-lg">
                    <HiUser className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center text-center w-full max-w-full">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words px-2">
                  {profileData.displayName || tProfile('anonymousUser')}
                </h2>
                
                <div className="flex flex-wrap items-center justify-center gap-3 mb-3 px-2">
                  {countryName && (
                    <span className="text-sm text-gray-600 break-words">
                      {countryName}
                    </span>
                  )}
                </div>
                
                {joinedDate && (
                  <p className="text-sm text-gray-500 mb-4 px-2 break-words">
                    {tProfile('joinedFrom')}: {joinedDate}
                  </p>
                )}
                
                {/* Level and XP Bar */}
                <div className="mb-4 w-full max-w-md px-2">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <HiStar className="w-5 h-5 text-yellow-500" />
                      <span className="text-base sm:text-lg font-bold text-gray-800">
                        {tProfile('level')} {level}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span>{totalXP} {tProfile('xp')}</span>
                    </div>
                  </div>
                  
                  {/* XP Progress Bar */}
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-gray-600 mb-1 px-1">
                      <span className="truncate">{currentXP} / 100 {tProfile('xp')}</span>
                      <span className="truncate ml-2">{100 - currentXP} {tProfile('xpToNext')}</span>
                    </div>
                    <Progress 
                      progress={currentXP} 
                      color="blue"
                      size="lg"
                      className="h-3 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="space-y-4 w-full max-w-full overflow-x-hidden">
              <h3 className="text-xl font-semibold text-gray-900 text-center">{tProfile('about')}</h3>
              
              {profileData.bio && (
                <div className="text-center w-full">
                  <p className="text-sm font-medium text-gray-700 mb-1">{tProfile('bioLabel')}</p>
                  <p className="text-gray-600 whitespace-pre-wrap break-words px-2">{profileData.bio}</p>
                </div>
              )}
              
              {profileData.cause && (
                <div className="text-center w-full">
                  <p className="text-sm font-medium text-gray-700 mb-1">{tProfile('causeLabel')}</p>
                  <p className="text-gray-600 whitespace-pre-wrap break-words px-2">{profileData.cause}</p>
                </div>
              )}
              
              {profileData.hobbies && (
                <div className="text-center w-full">
                  <p className="text-sm font-medium text-gray-700 mb-1">{tProfile('hobbiesLabel')}</p>
                  <p className="text-gray-600 whitespace-pre-wrap break-words px-2">{profileData.hobbies}</p>
                </div>
              )}
              
              {profileData.languages && profileData.languages.length > 0 && (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">{t('languages')}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {profileData.languages.map((lang, idx) => (
                      <Badge key={idx} color="gray" className="text-xs">
                        {typeof lang === 'object' ? lang.label : lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {translatedSkills && translatedSkills.length > 0 && (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">{t('skills')}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {translatedSkills.map((skill, idx) => (
                      <Badge key={idx} color="info" className="text-xs">
                        {skill.label || skill.value || skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Time Commitment */}
              {getSelectedTimeCommitments().length > 0 && (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1 flex items-center justify-center gap-2">
                    <HiClock className="w-4 h-4" />
                    {t('frequency') || 'How often can you help?'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {getSelectedTimeCommitments().map((commitment, idx) => (
                      <Badge key={idx} color="gray" className="text-xs">
                        {commitment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Availability */}
              {getSelectedAvailabilities().length > 0 && (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1 flex items-center justify-center gap-2">
                    <HiCalendar className="w-4 h-4" />
                    {t('availabilities') || 'When are you usually available?'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {getSelectedAvailabilities().map((availability, idx) => (
                      <Badge key={idx} color="info" className="text-xs">
                        {availability}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Badges Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                <HiBadgeCheck className="w-6 h-6 text-purple-500" />
                {tProfile('badges')}
              </h3>
              
              {badges.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg w-full">
                  <HiBadgeCheck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">{tProfile('noBadges')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 justify-items-center w-full max-w-full">
                  {badges.map((badge) => (
                    <div key={badge.id} className="w-full max-w-[112px] sm:max-w-[128px]">
                      <BadgeDisplay badge={badge} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Activities Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                <HiCalendar className="w-6 h-6 text-blue-500" />
                {tProfile('completedActivities')}
              </h3>
              
              {completedActivities.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg w-full">
                  <HiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">{tProfile('noActivities')}</p>
                </div>
              ) : (
                <div className="space-y-3 w-full max-w-full">
                  {completedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full max-w-full"
                    >
                      <div className="flex flex-col items-center text-center gap-2 w-full">
                        <div className="flex-1 min-w-0 w-full">
                          <h4 className="font-semibold text-gray-900 mb-1 break-words px-2">
                            {activity.title || tProfile('untitledActivity')}
                          </h4>
                          {activity.organizationName && (
                            <p className="text-sm text-gray-600 mb-1 break-words px-2">
                              {activity.organizationName}
                            </p>
                          )}
                          {activity.addedToHistoryAt && (
                            <p className="text-xs text-gray-500 break-words px-2">
                              {tProfile('completed')}: {formatDateOnly(activity.addedToHistoryAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="px-4 sm:px-6">
        <div className="flex justify-end w-full">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {tProfile('close')}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

