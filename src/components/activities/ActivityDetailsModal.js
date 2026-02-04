'use client';

import { useEffect, useState } from 'react';
import { Modal, Badge, Button, Spinner } from 'flowbite-react';
import Image from 'next/image';
import { fetchActivityById, getAcceptedApplicationsCount } from '@/utils/crudActivities';
import { fetchOrganizationById } from '@/utils/crudOrganizations';
import { formatDateOnly } from '@/utils/dateUtils';
import { useTranslations, useLocale } from 'next-intl';
import { getSkillsForSelect } from '@/utils/crudSkills';
import { useTheme } from '@/utils/theme/ThemeContext';
import {
  HiLocationMarker,
  HiUserGroup,
  HiUsers,
  HiStar,
  HiCalendar,
  HiOfficeBuilding,
  HiGlobeAlt,
  HiQuestionMarkCircle,
  HiTranslate,
  HiLink,
  HiExternalLink,
  HiCheckCircle
} from 'react-icons/hi';
import { HiClock } from 'react-icons/hi2';
import NPODetailsModal from './NPODetailsModal';
import { categoryIcons } from '@/constant/categoryIcons';
import { useRouter } from 'next/navigation';
import { useModal } from '@/utils/modal/useModal';
import ShareButton from '@/components/sharing/ShareButton';
import { prepareActivityShareData } from '@/utils/sharing/shareUtils';

export default function ActivityDetailsModal({ isOpen, onClose, activityId, onApply, hasApplied = false }) {
  // Register this modal with the global modal manager for ESC key and browser back button support
  // Use the wrapped onClose returned by useModal
  const wrappedOnClose = useModal(isOpen, onClose, 'activity-details-modal');
  const t = useTranslations('ActivityCard');
  const tManage = useTranslations('ManageActivities');
  const tSharing = useTranslations('Sharing');
  const locale = useLocale();
  const router = useRouter();
  const { isDark } = useTheme();
  
  const [activity, setActivity] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNPOModal, setShowNPOModal] = useState(false);
  const [validatedCount, setValidatedCount] = useState(null);
  const [skillLabelsMap, setSkillLabelsMap] = useState({});

  // Fetch accepted applications count for local/online activities (not for events)
  useEffect(() => {
    const shouldFetchCount = 
      (activity?.type === 'local' && activity?.acceptApplicationsWG !== false) ||
      activity?.type === 'online';
    
    if (activity?.id && shouldFetchCount) {
      const fetchCount = async () => {
        try {
          const count = await getAcceptedApplicationsCount(activity.id);
          setValidatedCount(count);
        } catch (error) {
          console.error('Error fetching accepted applications count:', error);
          setValidatedCount(0);
        }
      };
      fetchCount();
    } else if (activity?.type !== 'event') {
      // Reset count for local/online activities when not needed
      setValidatedCount(null);
    }
  }, [activity?.id, activity?.type, activity?.acceptApplicationsWG]);

  // Fetch skill labels based on current locale
  useEffect(() => {
    const loadSkillLabels = async () => {
      if (!activity?.skills || activity.skills.length === 0) {
        setSkillLabelsMap({});
        return;
      }

      try {
        const skillOptions = await getSkillsForSelect(locale);
        // Create a flat map of all skills for easy lookup
        const allSkills = skillOptions.reduce((acc, group) => {
          return [...acc, ...group.options];
        }, []);

        // Create a mapping from skill ID to label
        const labelsMap = {};
        activity.skills.forEach(skill => {
          const skillId = typeof skill === 'object' && skill !== null 
            ? (skill.value || skill.id || skill)
            : skill;
          
          const foundSkill = allSkills.find(s => s.value === skillId);
          if (foundSkill) {
            labelsMap[skillId] = foundSkill.label;
          } else {
            // Fallback to ID if not found
            labelsMap[skillId] = skillId;
          }
        });

        setSkillLabelsMap(labelsMap);
      } catch (error) {
        console.error('Error loading skill labels:', error);
        // Fallback: create map with IDs as labels
        const fallbackMap = {};
        activity.skills.forEach(skill => {
          const skillId = typeof skill === 'object' && skill !== null 
            ? (skill.value || skill.id || skill)
            : skill;
          fallbackMap[skillId] = skillId;
        });
        setSkillLabelsMap(fallbackMap);
      }
    };

    if (activity) {
      loadSkillLabels();
    }
  }, [activity?.skills, locale]);

  useEffect(() => {
    async function fetchData() {
      if (!activityId || !isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const activityData = await fetchActivityById(activityId);
        
        if (!activityData) {
          setError('Activity not found');
          setLoading(false);
          return;
        }

        // Convert Firestore timestamps to Date objects
        const processedActivity = {
          ...activityData,
          start_date: activityData.start_date
            ? activityData.start_date instanceof Date
              ? activityData.start_date
              : activityData.start_date.seconds
              ? new Date(activityData.start_date.seconds * 1000)
              : new Date(activityData.start_date)
            : null,
          end_date: activityData.end_date
            ? activityData.end_date instanceof Date
              ? activityData.end_date
              : activityData.end_date.seconds
              ? new Date(activityData.end_date.seconds * 1000)
              : new Date(activityData.end_date)
            : null,
        };

        setActivity(processedActivity);

        // Fetch organization data if organizationId exists
        if (activityData.organizationId) {
          try {
            const orgData = await fetchOrganizationById(activityData.organizationId);
            setOrganization(orgData);
          } catch (orgError) {
            console.error('Error fetching organization:', orgError);
            // Organization fetch error shouldn't block the modal
          }
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Failed to load activity details');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activityId, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActivity(null);
      setOrganization(null);
      setError(null);
      setShowNPOModal(false);
    }
  }, [isOpen]);

  const CategoryIcon = activity?.category ? (categoryIcons[activity.category] || HiQuestionMarkCircle) : null;
  const categoryLabel = activity?.category ? (() => {
    try {
      return tManage(activity.category);
    } catch {
      return activity.category;
    }
  })() : '';

  // Prepare share data for activity
  const shareData = activity && organization 
    ? prepareActivityShareData(activity, organization, {
        activityPhrase: tSharing('activityPhrase'),
        shareActivityTitle: tSharing('shareActivityTitle')
      })
    : activity 
    ? prepareActivityShareData(activity, null, {
        activityPhrase: tSharing('activityPhrase'),
        shareActivityTitle: tSharing('shareActivityTitle')
      })
    : null;


  return (
    <>
      <Modal show={isOpen} onClose={wrappedOnClose} size="4xl" className="z-50">
        <Modal.Header className="bg-gradient-to-r from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold">Activity Details</h3>
          </div>
        </Modal.Header>
        
        <Modal.Body className="max-h-[85vh] overflow-y-auto px-4 sm:px-6 bg-background-card dark:bg-background-card">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Spinner size="xl" className="border-primary-500 dark:border-primary-400" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-semantic-error-600 dark:text-semantic-error-400 mb-4">{error}</p>
              <Button color="gray" onClick={wrappedOnClose} className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600">
                Close
              </Button>
            </div>
          )}

          {!loading && !error && activity && (
            <div className="space-y-4 sm:space-y-6 py-2">
              {/* Activity Header */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 pb-4 border-b-2 border-border-light dark:border-[#475569]">
                {/* Organization Logo */}
                <div className="flex items-center gap-3">
                  <Image
                    src={activity.organization_logo || '/logo/Favicon.png'}
                    alt={activity.organization_name || 'Organization'}
                    width={60}
                    height={60}
                    className="rounded-full border-2 border-border-light dark:border-border-dark"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary dark:text-text-secondary">
                      {activity.organization_name || 'Organization'}
                    </h3>
                  </div>
                </div>

                {/* Title and Category */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary flex-1">
                      {activity.title}
                    </h1>
                    <Badge
                      color={
                        activity.type === 'online'
                          ? 'blue'
                          : activity.type === 'local'
                          ? 'green'
                          : 'purple'
                      }
                      size="lg"
                      className="capitalize"
                    >
                      {activity.type}
                    </Badge>
                  </div>

                  {/* Category */}
                  {CategoryIcon && (
                    <div className="flex items-center gap-2 text-text-secondary dark:text-text-secondary mb-4">
                      <CategoryIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">{categoryLabel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Stats */}
              <div className={`grid ${
                activity.type === 'event' && activity.participantTarget !== null && activity.participantTarget !== undefined
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : activity.type === 'event'
                  ? 'grid-cols-2 sm:grid-cols-2'
                  : ((activity.type === 'local' && activity.acceptApplicationsWG !== false) || activity.type === 'online') && validatedCount !== null
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-2'
              } gap-3 sm:gap-4 pt-4 border-t-2 border-border-light dark:border-[#475569]`}>
                <div className="flex items-center gap-2">
                  <HiStar className="h-5 w-5 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-tertiary dark:text-text-tertiary">XP Reward</p>
                    <p className="text-base sm:text-lg font-semibold text-primary-600 dark:text-primary-400">{activity.xp_reward || 0}</p>
                  </div>
                </div>
                {/* Participant Counter - Show for local (when accepting WG) and online */}
                {((activity.type === 'local' && activity.acceptApplicationsWG !== false) || 
                    activity.type === 'online') && validatedCount !== null && (
                  <div className="flex items-center gap-2">
                    <HiUsers className="h-5 w-5 text-semantic-info-500 dark:text-semantic-info-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-text-tertiary dark:text-text-tertiary">{t('participants')}</p>
                      <p className="text-base sm:text-lg font-semibold text-semantic-info-600 dark:text-semantic-info-400">
                        {activity.participantTarget ? `${validatedCount}/${activity.participantTarget}` : validatedCount}
                      </p>
                    </div>
                  </div>
                )}
                {/* People Max - Show for events when participantTarget is set */}
                {activity.type === 'event' && activity.participantTarget !== null && activity.participantTarget !== undefined && (
                  <div className="flex items-center gap-2">
                    <HiUsers className="h-5 w-5 text-semantic-info-500 dark:text-semantic-info-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-text-tertiary dark:text-text-tertiary">{t('peopleMax')}</p>
                      <p className="text-base sm:text-lg font-semibold text-semantic-info-600 dark:text-semantic-info-400">
                        {activity.participantTarget}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <HiLocationMarker className="h-5 w-5 text-text-tertiary dark:text-text-tertiary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-tertiary dark:text-text-tertiary">Location</p>
                    <p className="text-xs sm:text-sm font-semibold text-text-primary dark:text-text-primary truncate">
                      {activity.type === 'online'
                        ? 'Online'
                        : activity.city && activity.country
                        ? `${activity.city}, ${activity.country}`
                        : activity.country || 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HiCalendar className="h-5 w-5 text-text-tertiary dark:text-text-tertiary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-tertiary dark:text-text-tertiary">Duration</p>
                    <p className="text-xs sm:text-sm font-semibold text-text-primary dark:text-text-primary">
                      {activity.frequency === 'once' ? 'One-time' : activity.frequency === 'regular' ? 'Regular' : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pt-4 border-t-2 border-border-light dark:border-[#475569]">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-text-primary dark:text-text-primary">Description</h2>
                <p className="text-sm sm:text-base text-text-secondary dark:text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {activity.description || 'No description provided.'}
                </p>
              </div>

              {/* External Platform Link */}
              {(activity.externalPlatformLink || activity.activity_url) && (
                <div className="flex items-center gap-4 p-4 bg-background-hover dark:bg-background-hover rounded-xl border-2 border-border-light dark:border-[#475569] hover:shadow-md transition-all">
                  <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-3 rounded-full">
                    <HiExternalLink className="h-6 w-6 text-semantic-info-600 dark:text-semantic-info-400 flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-tertiary dark:text-text-tertiary mb-1 uppercase tracking-wide">{t('externalPlatformLink')}</p>
                    <a
                      href={(activity.externalPlatformLink || activity.activity_url).startsWith('http') 
                        ? (activity.externalPlatformLink || activity.activity_url) 
                        : `https://${activity.externalPlatformLink || activity.activity_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 text-sm font-medium break-all hover:underline"
                    >
                      {activity.externalPlatformLink || activity.activity_url}
                    </a>
                  </div>
                </div>
              )}

              {/* Activity Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t-2 border-border-light dark:border-[#475569]">
                {/* Dates */}
                <div className="bg-background-hover dark:bg-background-hover rounded-lg p-4 border-2 border-border-light dark:border-[#475569]">
                  <div className="flex items-center gap-2 mb-4">
                    <HiClock className="h-5 w-5 text-semantic-info-500 dark:text-semantic-info-400" />
                    <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary">Schedule</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-text-tertiary dark:text-text-tertiary mb-1">Start Date</p>
                      <p className="text-sm font-medium text-text-primary dark:text-text-primary">
                        {activity.start_date
                          ? formatDateOnly(activity.start_date)
                          : 'Not specified'}
                      </p>
                    </div>
                    {activity.end_date && (
                      <div>
                        <p className="text-xs text-text-tertiary dark:text-text-tertiary mb-1">End Date</p>
                        <p className="text-sm font-medium text-text-primary dark:text-text-primary">
                          {formatDateOnly(activity.end_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {activity.skills && activity.skills.length > 0 && (
                  <div className="bg-background-hover dark:bg-background-hover rounded-lg p-4 border-2 border-border-light dark:border-[#475569]">
                    <div className="flex items-center gap-2 mb-4">
                      <HiUsers className="h-5 w-5 text-activityType-event-500 dark:text-activityType-event-400" />
                      <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary">{t('requiredSkills')}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activity.skills.map((skill, index) => {
                        // Get skill ID
                        const skillId = typeof skill === 'object' && skill !== null 
                          ? (skill.value || skill.id || skill) 
                          : skill;
                        
                        // Get translated label from map, fallback to ID if not found
                        const skillLabel = skillLabelsMap[skillId] || skillId;
                        
                        return (
                          <Badge key={index} color="purple" size="sm">
                            {skillLabel}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {activity.languages && activity.languages.length > 0 && (
                  <div className="bg-background-hover dark:bg-background-hover rounded-lg p-4 border-2 border-border-light dark:border-[#475569]">
                    <div className="flex items-center gap-2 mb-4">
                      <HiTranslate className="h-5 w-5 text-semantic-success-500 dark:text-semantic-success-400" />
                      <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary">Languages</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activity.languages.map((lang, index) => (
                        <Badge key={index} color="green" size="sm">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* SDG */}
                {activity.sdg && (
                  <div className="bg-background-hover dark:bg-background-hover rounded-lg p-4 border-2 border-border-light dark:border-[#475569]">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary">
                        Sustainable Development Goal
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <Image
                        src={`/icons/sdgs/c-${activity.sdg}.png`}
                        alt={`SDG ${activity.sdg}`}
                        width={60}
                        height={60}
                        className="rounded"
                      />
                      <span className="text-sm text-text-secondary dark:text-text-secondary">SDG {activity.sdg}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* NPO Summary */}
              {organization && (
                <div className="bg-gradient-to-br from-semantic-info-50 to-semantic-info-100 dark:from-semantic-info-900 dark:to-semantic-info-800 border border-semantic-info-200 dark:border-semantic-info-700 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 w-full">
                      <Image
                        src={organization.logo || activity.organization_logo || '/logo/Favicon.png'}
                        alt={organization.name || activity.organization_name}
                        width={60}
                        height={60}
                        className="rounded-full border-2 border-white dark:border-neutral-800 shadow-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-text-primary dark:text-text-primary mb-1">
                          {organization.name || activity.organization_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-text-secondary dark:text-text-secondary">
                          {organization.city && organization.country && (
                            <div className="flex items-center gap-1">
                              <HiLocationMarker className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">
                                {organization.city}, {organization.country}
                              </span>
                            </div>
                          )}
                          {organization.website && (
                            <div className="flex items-center gap-1">
                              <HiGlobeAlt className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span>Website</span>
                            </div>
                          )}
                        </div>
                        {organization.description && (
                          <p className="text-xs sm:text-sm text-text-secondary dark:text-text-secondary mt-2 line-clamp-2">
                            {organization.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      color="blue"
                      onClick={() => setShowNPOModal(true)}
                      className="w-full sm:w-auto flex-shrink-0 bg-semantic-info-600 hover:bg-semantic-info-700 dark:bg-semantic-info-500 dark:hover:bg-semantic-info-600"
                      size="sm"
                    >
                      <HiOfficeBuilding className="mr-2 h-4 w-4" />
                      Learn More
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer className="bg-background-card dark:bg-background-card border-t border-border-light dark:border-border-dark">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              {shareData && (
                <ShareButton 
                  shareData={shareData}
                  variant="default"
                  size="sm"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasApplied ? (
                <>
                  <Button
                    color="green"
                    onClick={() => {
                      wrappedOnClose();
                      router.push('/dashboard');
                    }}
                    className="flex items-center gap-2 bg-semantic-success-600 hover:bg-semantic-success-700 dark:bg-semantic-success-500 dark:hover:bg-semantic-success-600"
                  >
                    <HiCheckCircle className="h-5 w-5" />
                    View Application Status
                  </Button>
                  <Button color="gray" onClick={wrappedOnClose} className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600">
                    Close
                  </Button>
                </>
              ) : (
                <>
                  {/* Hide Apply button for events or local activities with external platform only */}
                  {onApply && 
                   activity?.type !== 'event' && 
                   !(activity?.type === 'local' && activity?.acceptApplicationsWG === false) && (
                    <Button onClick={onApply} className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white">
                      Apply Now
                    </Button>
                  )}
                  <Button color="gray" onClick={wrappedOnClose} className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600">
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* NPO Details Modal */}
      {organization && (
        <NPODetailsModal
          isOpen={showNPOModal}
          onClose={() => setShowNPOModal(false)}
          organization={organization}
        />
      )}
    </>
  );
}

