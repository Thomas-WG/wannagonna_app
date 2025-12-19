'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Avatar, Badge, Spinner, Progress } from 'flowbite-react';
import { HiUser, HiBadgeCheck, HiCalendar, HiX, HiClock, HiGlobeAlt, HiExternalLink } from 'react-icons/hi';
import { FaLinkedin, FaFacebook, FaInstagram } from 'react-icons/fa';
import { fetchPublicMemberProfile, formatJoinedDate } from '@/utils/crudMemberProfile';
import { fetchUserBadges } from '@/utils/crudBadges';
import { fetchHistoryActivities } from '@/utils/crudActivities';
import { formatDateOnly } from '@/utils/dateUtils';
import { normalizeUrl } from '@/utils/urlUtils';
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
    <Modal show={isOpen} onClose={onClose} size="5xl" className="z-50">
      <Modal.Header className="border-b border-border-light dark:border-border-dark px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-text-primary dark:text-text-primary">{tProfile('title')}</span>
        </div>
      </Modal.Header>
      <Modal.Body className="max-h-[80vh] overflow-y-auto px-4 sm:px-6 overflow-x-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="xl" />
            <p className="mt-4 text-text-secondary dark:text-text-secondary">{tProfile('loading')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <HiX className="w-12 h-12 text-semantic-error-500 dark:text-semantic-error-400 mb-4" />
            <p className="text-text-secondary dark:text-text-secondary">{error}</p>
          </div>
        ) : !profileData ? (
          <div className="flex flex-col items-center justify-center py-12">
            <HiUser className="w-12 h-12 text-text-tertiary dark:text-text-tertiary mb-4" />
            <p className="text-text-secondary dark:text-text-secondary">{tProfile('notFound')}</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
            {/* Header Section - Horizontal Layout for Both Mobile and Desktop */}
            <div className="flex flex-col gap-4 pb-4 md:pb-6 border-b-2 border-border-light dark:border-[#475569] w-full">
              <div className="w-full bg-background-hover dark:bg-background-hover rounded-lg p-3 md:p-4 border-2 border-border-light dark:border-[#475569] shadow-sm">
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Profile Picture - Left */}
                  <div className="relative flex-shrink-0">
                    {profileData.profilePicture ? (
                      <Image
                        src={profileData.profilePicture}
                        alt={profileData.displayName || 'User'}
                        width={70}
                        height={70}
                        className="md:w-[90px] md:h-[90px] rounded-full border-2 border-white shadow-md object-cover"
                      />
                    ) : (
                      <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full bg-semantic-info-500 dark:bg-semantic-info-600 flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-md">
                        <HiUser className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Middle: Name + Country */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base md:text-xl font-bold text-text-primary dark:text-text-primary mb-1 md:mb-1.5 break-words line-clamp-1">
                      {profileData.displayName || tProfile('anonymousUser')}
                    </h2>
                    
                    {countryName && (
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                        <HiGlobeAlt className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-tertiary dark:text-text-tertiary flex-shrink-0" />
                        <span className="text-xs md:text-sm text-text-secondary dark:text-text-secondary truncate">{countryName}</span>
                      </div>
                    )}
                    
                    {joinedDate && (
                      <p className="text-xs md:text-sm text-text-tertiary dark:text-text-tertiary truncate">
                        {joinedDate}
                      </p>
                    )}
                  </div>
                  
                  {/* Right Side: Level + XP */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2 md:gap-3">
                    {/* Level in Circle */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-semantic-info-100 dark:bg-semantic-info-900 flex items-center justify-center border-2 border-semantic-info-500 dark:border-semantic-info-400">
                        <span className="text-base md:text-lg font-bold text-semantic-info-700 dark:text-semantic-info-300">
                          {level}
                        </span>
                      </div>
                      <span className="text-xs text-text-tertiary dark:text-text-tertiary mt-0.5 md:mt-1">{tProfile('level')}</span>
                    </div>
                    
                    {/* XP */}
                    <div className="flex flex-col items-center">
                      <span className="text-sm md:text-base font-semibold text-text-primary dark:text-text-primary">
                        {totalXP}
                      </span>
                      <span className="text-xs text-text-tertiary dark:text-text-tertiary">{tProfile('xp')}</span>
                    </div>
                  </div>
                </div>
                
                {/* XP Progress Bar */}
                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t-2 border-border-light dark:border-[#475569]">
                  <div className="flex justify-between text-xs md:text-sm text-text-secondary dark:text-text-secondary mb-1 md:mb-1.5">
                    <span className="truncate">{currentXP} / 100 {tProfile('xp')}</span>
                    <span className="truncate ml-2">{100 - currentXP} {tProfile('xpToNext')}</span>
                  </div>
                  <Progress 
                    progress={currentXP} 
                    color="blue"
                    size="sm"
                    className="md:!h-3 h-2 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Content Layout - Mobile: About/Availability first, then Badges/Connect. Desktop: Sidebar + Main Content */}
            <div className="flex flex-col lg:flex-row gap-6 w-full">
              {/* Mobile: About and Availability shown first, Desktop: Left Sidebar */}
              <div className="flex flex-col lg:hidden space-y-6 order-1">
                {/* About Section - Mobile First */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary">{tProfile('about')}</h3>
                  
                  {profileData.bio && (
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-1">{tProfile('bioLabel')}</p>
                      <p className="text-text-secondary dark:text-text-secondary whitespace-pre-wrap break-words">{profileData.bio}</p>
                    </div>
                  )}
                  
                  {profileData.cause && (
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-1">{tProfile('causeLabel')}</p>
                      <p className="text-text-secondary dark:text-text-secondary whitespace-pre-wrap break-words">{profileData.cause}</p>
                    </div>
                  )}
                  
                  {profileData.hobbies && (
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-1">{tProfile('hobbiesLabel')}</p>
                      <p className="text-text-secondary dark:text-text-secondary whitespace-pre-wrap break-words">{profileData.hobbies}</p>
                    </div>
                  )}
                  
                  {profileData.languages && profileData.languages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2">{t('languages')}</p>
                      <div className="flex flex-wrap gap-2">
                        {profileData.languages.map((lang, idx) => (
                          <Badge key={idx} color="gray" className="text-xs">
                            {typeof lang === 'object' ? lang.label : lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  
                </div>

                {/* Skills & Availability Section - Mobile Second */}
                {(getSelectedTimeCommitments().length > 0 || getSelectedAvailabilities().length > 0 || translatedSkills && translatedSkills.length > 0) && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary">{t('skillsAvailable') || 'Skills & Availability'}</h3>
                    
                    {translatedSkills && translatedSkills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2">{t('skills')}</p>
                      <div className="flex flex-wrap gap-2">
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
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2 flex items-center gap-2">
                          <HiClock className="w-4 h-4 text-text-tertiary dark:text-text-tertiary" />
                          {t('frequency') || 'How often can you help?'}
                        </p>
                        <div className="flex flex-wrap gap-2">
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
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2 flex items-center gap-2">
                          <HiCalendar className="w-4 h-4 text-text-tertiary dark:text-text-tertiary" />
                          {t('availabilities') || 'When are you usually available?'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getSelectedAvailabilities().map((availability, idx) => (
                            <Badge key={idx} color="info" className="text-xs">
                              {availability}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Left Sidebar - Stats, Badges, Connect (narrower, fixed width on desktop) */}
              <div className="lg:w-80 lg:flex-shrink-0 space-y-6 order-2 lg:order-1">
                {/* Badges Section - Mobile Third */}
                <div className="bg-background-hover dark:bg-background-hover rounded-lg p-4 border border-border-light dark:border-border-dark">
                  <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-3 flex items-center gap-2">
                    <HiBadgeCheck className="w-5 h-5 text-activityType-event-500 dark:text-activityType-event-400" />
                    {tProfile('badges')}
                  </h3>
                  
                  {badges.length === 0 ? (
                    <div className="text-center py-6">
                      <HiBadgeCheck className="w-10 h-10 text-text-tertiary dark:text-text-tertiary mx-auto mb-2" />
                      <p className="text-sm text-text-secondary dark:text-text-secondary">{tProfile('noBadges')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 justify-items-center">
                      {badges.map((badge) => (
                        <div key={badge.id} className="w-full max-w-[70px]">
                          <BadgeDisplay badge={badge} size="small" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Connect Section - Mobile Fourth */}
                {(profileData.website || profileData.linkedin || profileData.facebook || profileData.instagram) && (
                  <div className="bg-background-hover dark:bg-background-hover rounded-lg p-4 border border-border-light dark:border-border-dark">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-3">{tProfile('connectWithMe') || 'Connect'}</h3>
                    <div className="space-y-2">
                      {profileData.website && (
                        <a
                          href={normalizeUrl(profileData.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 transition-colors text-sm"
                        >
                          <HiGlobeAlt className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{tProfile('website') || 'Website'}</span>
                          <HiExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
                        </a>
                      )}
                      {profileData.linkedin && (
                        <a
                          href={normalizeUrl(profileData.linkedin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-semantic-info-700 dark:text-semantic-info-300 hover:text-semantic-info-800 dark:hover:text-semantic-info-200 transition-colors text-sm"
                        >
                          <FaLinkedin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{tProfile('linkedin') || 'LinkedIn'}</span>
                          <HiExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
                        </a>
                      )}
                      {profileData.facebook && (
                        <a
                          href={normalizeUrl(profileData.facebook)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 transition-colors text-sm"
                        >
                          <FaFacebook className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{tProfile('facebook') || 'Facebook'}</span>
                          <HiExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
                        </a>
                      )}
                      {profileData.instagram && (
                        <a
                          href={normalizeUrl(profileData.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-accent-pink dark:text-accent-pink hover:opacity-80 transition-colors text-sm"
                        >
                          <FaInstagram className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{tProfile('instagram') || 'Instagram'}</span>
                          <HiExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content Area - About, Skills, Availability, Activities (flexible width) - Desktop Only */}
              <div className="hidden lg:flex flex-1 space-y-6 min-w-0 order-2">
                {/* About Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary">{tProfile('about')}</h3>
                  
                  {profileData.bio && (
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-1">{tProfile('bioLabel')}</p>
                      <p className="text-text-secondary dark:text-text-secondary whitespace-pre-wrap break-words">{profileData.bio}</p>
                    </div>
                  )}
                  
                  {profileData.cause && (
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-1">{tProfile('causeLabel')}</p>
                      <p className="text-text-secondary dark:text-text-secondary whitespace-pre-wrap break-words">{profileData.cause}</p>
                    </div>
                  )}
                  
                  {profileData.hobbies && (
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-1">{tProfile('hobbiesLabel')}</p>
                      <p className="text-text-secondary dark:text-text-secondary whitespace-pre-wrap break-words">{profileData.hobbies}</p>
                    </div>
                  )}
                  
                  {profileData.languages && profileData.languages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2">{t('languages')}</p>
                      <div className="flex flex-wrap gap-2">
                        {profileData.languages.map((lang, idx) => (
                          <Badge key={idx} color="gray" className="text-xs">
                            {typeof lang === 'object' ? lang.label : lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {translatedSkills && translatedSkills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2">{t('skills')}</p>
                      <div className="flex flex-wrap gap-2">
                        {translatedSkills.map((skill, idx) => (
                          <Badge key={idx} color="info" className="text-xs">
                            {skill.label || skill.value || skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills & Availability Section */}
                {(getSelectedTimeCommitments().length > 0 || getSelectedAvailabilities().length > 0) && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary">{t('skillsAvailable') || 'Skills & Availability'}</h3>
                    
                    {/* Time Commitment */}
                    {getSelectedTimeCommitments().length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2 flex items-center gap-2">
                          <HiClock className="w-4 h-4 text-text-tertiary dark:text-text-tertiary" />
                          {t('frequency') || 'How often can you help?'}
                        </p>
                        <div className="flex flex-wrap gap-2">
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
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2 flex items-center gap-2">
                          <HiCalendar className="w-4 h-4 text-text-tertiary dark:text-text-tertiary" />
                          {t('availabilities') || 'When are you usually available?'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getSelectedAvailabilities().map((availability, idx) => (
                            <Badge key={idx} color="info" className="text-xs">
                              {availability}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Completed Activities Section - Full Width, Centered */}
            <div className="space-y-3 pt-6 border-t border-border-light dark:border-border-dark">
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary flex items-center justify-center gap-2">
                <HiCalendar className="w-5 h-5 text-semantic-info-500 dark:text-semantic-info-400" />
                {tProfile('completedActivities')}
              </h3>
              
              {completedActivities.length === 0 ? (
                <div className="text-center py-6 bg-background-hover dark:bg-background-hover rounded-lg max-w-xl mx-auto border border-border-light dark:border-border-dark">
                  <HiCalendar className="w-10 h-10 text-text-tertiary dark:text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary dark:text-text-secondary">{tProfile('noActivities')}</p>
                </div>
              ) : (
                <div className="space-y-2 max-w-xl mx-auto">
                  {completedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-3 border-2 border-border-light dark:border-[#475569] rounded-lg hover:bg-background-hover dark:hover:bg-background-hover transition-colors bg-background-card dark:bg-background-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-text-primary dark:text-text-primary mb-0.5 truncate">
                            {activity.title || tProfile('untitledActivity')}
                          </h4>
                          {activity.organizationName && (
                            <p className="text-xs text-text-secondary dark:text-text-secondary truncate">
                              {activity.organizationName}
                            </p>
                          )}
                        </div>
                        {activity.addedToHistoryAt && (
                          <p className="text-xs text-text-tertiary dark:text-text-tertiary whitespace-nowrap flex-shrink-0">
                            {formatDateOnly(activity.addedToHistoryAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="px-4 sm:px-6 border-t border-border-light dark:border-border-dark">
        <div className="flex justify-end w-full">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-primary dark:text-text-primary bg-background-card dark:bg-background-card border border-border-light dark:border-border-dark rounded-lg hover:bg-background-hover dark:hover:bg-background-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors duration-200"
          >
            {tProfile('close')}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

