import { Tooltip, Button } from 'flowbite-react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import {
  HiLocationMarker, HiUserGroup, HiStar,
  HiQuestionMarkCircle,
  HiClock,
  HiDocument, HiCheckCircle, HiArchive,
  HiQrcode
} from 'react-icons/hi';
import { FaRegCircle } from 'react-icons/fa';
import StatusUpdateModal from './StatusUpdateModal';
import QRCodeModal from './QRCodeModal';
import ActivityValidationModal from './ActivityValidationModal';
import { updateActivityStatus, getAcceptedApplicationsCount } from '@/utils/crudActivities';
import { categoryIcons } from '@/constant/categoryIcons';
import { getSkillsForSelect } from '@/utils/crudSkills';

// Main component for displaying an activity card
export default function ActivityCard({
  id,
  organization_name,
  organization_logo,
  title,
  country,
  category,
  skills,
  applicants,
  type,
  xp_reward,
  city,
  description,
  start_date,
  end_date,
  sdg,
  status,
  qrCodeToken,
  frequency,
  onClick,
  onStatusChange,
  canEditStatus = false,
  showQRButton = false,
  participantTarget,
  acceptApplicationsWG,
}) {
  const t = useTranslations('ActivityCard');
  const tManage = useTranslations('ManageActivities');
  const locale = useLocale();
  
  // State for status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validatedCount, setValidatedCount] = useState(null);
  const [skillLabelsMap, setSkillLabelsMap] = useState({});

  // Fetch accepted applications count for local/online activities (not for events)
  useEffect(() => {
    const shouldShowCounter = 
      (type === 'local' && acceptApplicationsWG !== false) || 
      type === 'online';
    
    if (shouldShowCounter && id) {
      const fetchCount = async () => {
        try {
          const count = await getAcceptedApplicationsCount(id);
          setValidatedCount(count);
        } catch (error) {
          console.error('Error fetching accepted applications count:', error);
          setValidatedCount(0);
        }
      };
      fetchCount();
    } else if (type !== 'event') {
      // Reset count for local/online activities when not needed
      setValidatedCount(null);
    }
  }, [id, type, acceptApplicationsWG]);

  // Sync local status with prop changes
  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  // Fetch skill labels based on current locale
  useEffect(() => {
    const loadSkillLabels = async () => {
      if (!skills || skills.length === 0) {
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
        skills.forEach(skill => {
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
        skills.forEach(skill => {
          const skillId = typeof skill === 'object' && skill !== null 
            ? (skill.value || skill.id || skill)
            : skill;
          fallbackMap[skillId] = skillId;
        });
        setSkillLabelsMap(fallbackMap);
      }
    };

    loadSkillLabels();
  }, [skills, locale]);

  // Status configuration using design tokens - improved visibility for dark mode
  const getStatusConfig = (status) => {
    const statusConfigs = {
      'Draft': {
        icon: HiDocument,
        color: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200',
        borderColor: 'border-neutral-300 dark:border-neutral-600',
        label: t('status.Draft')
      },
      'Open': {
        icon: FaRegCircle,
        color: 'bg-semantic-success-100 dark:bg-semantic-success-800 text-semantic-success-700 dark:text-semantic-success-200',
        borderColor: 'border-semantic-success-300 dark:border-semantic-success-600',
        label: t('status.Open')
      },
      'Closed': {
        icon: HiCheckCircle,
        color: 'bg-semantic-info-100 dark:bg-semantic-info-800 text-semantic-info-700 dark:text-semantic-info-200',
        borderColor: 'border-semantic-info-300 dark:border-semantic-info-600',
        label: t('status.Closed')
      }
    };
    
    return statusConfigs[status] || statusConfigs['Draft'];
  };


  // Helper to convert Firestore date to Date object
  const getDateFromFirestore = (dateValue) => {
    if (!dateValue) return null;
    try {
      if (dateValue.seconds) {
        return new Date(dateValue.seconds * 1000);
      }
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate();
      }
      if (dateValue instanceof Date) {
        return dateValue;
      }
      return new Date(dateValue);
    } catch (e) {
      return null;
    }
  };

  const formatDateTimeRange = (start, end) => {
    if (!start) return null;
    try {
      const startDate = getDateFromFirestore(start);
      const endDate = end ? getDateFromFirestore(end) : null;
      
      if (!startDate) return null;

      const dateFormatter = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric'
      });

      const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      });

      const datePart = dateFormatter.format(startDate);
      const startTime = timeFormatter.format(startDate);
      const endTime = endDate ? timeFormatter.format(endDate) : null;

      return endTime ? `${datePart}, ${startTime} - ${endTime}` : `${datePart}, ${startTime}`;
    } catch (e) {
      return null;
    }
  };

  const dateTimeLine = formatDateTimeRange(start_date, end_date);

  // Format description preview (max 100 characters)
  const getDescriptionPreview = () => {
    if (!description) return null;
    const maxLength = 100;
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  };

  // Format time commitment based on frequency
  const getTimeCommitment = () => {
    if (!frequency) return null;
    const frequencyMap = {
      'once': 'One-time',
      'regular': 'Regular',
      'role': 'Long-term'
    };
    return frequencyMap[frequency] || frequency;
  };

  // Format relative date
  const getRelativeDate = () => {
    if (!start_date) return null;
    const startDate = getDateFromFirestore(start_date);
    if (!startDate) return null;
    
    try {
      const now = new Date();
      const diffTime = startDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return null; // Past date
      if (diffDays === 0) return 'Starts today';
      if (diffDays === 1) return 'Starts tomorrow';
      if (diffDays <= 7) return `Starts in ${diffDays} days`;
      return null; // Use absolute date for dates > 7 days
    } catch (e) {
      return null;
    }
  };

  // Get type-based color classes using design tokens
  const getTypeColorClasses = () => {
    const typeColors = {
      'online': 'border-l-activityType-online-500 dark:border-l-activityType-online-400',
      'local': 'border-l-activityType-local-500 dark:border-l-activityType-local-400',
      'event': 'border-l-activityType-event-500 dark:border-l-activityType-event-400'
    };
    return typeColors[type] || 'border-l-neutral-500 dark:border-l-neutral-400';
  };

  // Limit skills display (show max 3, then "+X more")
  const MAX_VISIBLE_SKILLS = 3;
  const visibleSkills = skills?.slice(0, MAX_VISIBLE_SKILLS) || [];
  const remainingSkillsCount = skills?.length > MAX_VISIBLE_SKILLS 
    ? skills.length - MAX_VISIBLE_SKILLS 
    : 0;

  const descriptionPreview = getDescriptionPreview();
  const timeCommitment = getTimeCommitment();
  const relativeDate = getRelativeDate();
  const typeColorClass = getTypeColorClasses();

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    // If trying to close the activity, open validation modal instead
    if (newStatus === 'Closed') {
      setShowStatusModal(false);
      setShowValidationModal(true);
      return;
    }

    // For other status changes, proceed normally
    try {
      setIsUpdatingStatus(true);
      
      // Update local state immediately for instant visual feedback
      setLocalStatus(newStatus);
      
      // Update in database
      await updateActivityStatus(id, newStatus);
      
      // Notify parent component of the change
      if (onStatusChange) {
        onStatusChange(id, newStatus);
      }
      
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating activity status:', error);
      // Revert local state on error
      setLocalStatus(status);
      alert('Error updating activity status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle validation modal close - check if activity should be closed
  const handleValidationModalClose = async (shouldCloseActivity) => {
    setShowValidationModal(false);
    
    // If all applicants are processed, close the activity
    if (shouldCloseActivity) {
      try {
        await updateActivityStatus(id, 'Closed');
        setLocalStatus('Closed');
        if (onStatusChange) {
          onStatusChange(id, 'Closed');
        }
      } catch (error) {
        console.error('Error closing activity:', error);
        alert('Failed to close activity');
      }
    } else {
      // If not all processed, revert status to Open
      setLocalStatus('Open');
    }
  };

  // Handle status badge click
  const handleStatusClick = (e) => {
    e.stopPropagation(); // Prevent card click
    setShowStatusModal(true);
  };

  // presentational component only; click handling provided by parent via onClick

  return (
    <>
      <div
        onClick={onClick}
        className={`cursor-pointer w-full p-3 sm:p-4 bg-background-card dark:bg-background-card border-l-4 ${typeColorClass} border border-border-light dark:border-border-dark rounded-xl shadow-md hover:shadow-lg hover:bg-background-hover dark:hover:bg-background-hover hover:-translate-y-1 transition-all duration-300 transform`}
        role="button"
        aria-label={title}
      >
        {/* Header Section (Top) */}
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center space-x-2 min-w-0 flex-1'>
            <Image
              src={organization_logo}
              alt={`${organization_name} logo`}
              width={40}
              height={40}
              className='rounded-full flex-shrink-0'
            />
            <span className='text-xs text-text-secondary dark:text-text-secondary truncate' aria-label={organization_name}>{organization_name}</span>
          </div>
          <div className='flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0'>
            {/* Status Badge */}
            {localStatus && (() => {
              const statusConfig = getStatusConfig(localStatus);
              const StatusIcon = statusConfig.icon;
              const tooltipContent = canEditStatus 
                ? `${statusConfig.label} - Click to change` 
                : statusConfig.label;
              const badgeClasses = canEditStatus
                ? `inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.borderColor} border cursor-pointer hover:opacity-80 transition-opacity`
                : `inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.borderColor} border`;
              
              return (
                <Tooltip content={tooltipContent} placement="top">
                  <div 
                    className={badgeClasses}
                    onClick={canEditStatus ? handleStatusClick : undefined}
                  >
                    <StatusIcon className='w-3 h-3 mr-0.5 sm:mr-1' />
                    <span className='hidden sm:inline'>{statusConfig.label}</span>
                    <span className='sm:hidden'>{statusConfig.label.split(' ')[0]}</span>
                  </div>
                </Tooltip>
              );
            })()}
            
            {/* Category Icon */}
            {(() => {
              const Icon = categoryIcons[category] || HiQuestionMarkCircle;
              const label = (() => {
                try { return tManage(category); } catch { return category; }
              })();
              return (
                <Tooltip content={label} placement="top">
                  <span aria-label={label} role="img" tabIndex={0} className='inline-flex'>
                    <Icon aria-hidden className='text-grey-400 w-6 h-6 sm:w-7 sm:h-7' />
                  </span>
                </Tooltip>
              );
            })()}
            <span className='sr-only'>{category}</span>
            
            {/* QR Code Button - Only for Local and Event activities, and only when showQRButton is true */}
            {showQRButton && (type === 'local' || type === 'event') && qrCodeToken && (
              <Tooltip content="Show QR Code" placement="top">
                <Button
                  size="sm"
                  color="gray"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQRModal(true);
                  }}
                  className="p-1.5"
                >
                  <HiQrcode className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Title */}
        <div className='mt-3 sm:mt-4 flex items-start gap-2'>
          <div className='flex-1 min-w-0'>
            <h2 className='text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary leading-tight break-words'>{title}</h2>
            {/* Description Preview */}
            {descriptionPreview && (
              <p className='mt-2 text-sm sm:text-base text-text-secondary dark:text-text-secondary line-clamp-2 leading-relaxed'>
                {descriptionPreview}
              </p>
            )}
          </div>
        </div>

        {/* Key Information Section (Middle) - Grid Layout */}
        <div className='mt-4 sm:mt-5 space-y-3'>
          {/* Metrics Grid */}
          <div className={`grid ${
            type === 'event' && participantTarget !== null && participantTarget !== undefined
              ? 'grid-cols-2'
              : type === 'event'
              ? 'grid-cols-2'
              : ((type === 'local' && acceptApplicationsWG !== false) || type === 'online') && validatedCount !== null
              ? 'grid-cols-2'
              : 'grid-cols-2'
          } gap-1.5`}>
            {/* XP Reward */}
            <div className='flex flex-col items-center justify-center px-1.5 py-1.5 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-700 rounded-lg border border-primary-300 dark:border-primary-600'>
              <HiStar className='h-3.5 w-3.5 text-primary-600 dark:text-primary-400 mb-0.5' />
              <span className='text-sm sm:text-base font-bold text-primary-700 dark:text-primary-200'>{xp_reward}</span>
              <span className='text-[10px] sm:text-xs text-primary-600 dark:text-primary-300 leading-tight'>{t('points')}</span>
            </div>
            {/* Participant Counter - Show for local (when accepting WG) and online */}
            {((type === 'local' && acceptApplicationsWG !== false) || type === 'online') && validatedCount !== null && (
              <div className='flex flex-col items-center justify-center px-1.5 py-1.5 bg-semantic-info-50 dark:bg-semantic-info-900 rounded-lg border border-semantic-info-200 dark:border-semantic-info-700'>
                <HiUserGroup className='h-3.5 w-3.5 text-semantic-info-600 dark:text-semantic-info-400 mb-0.5' />
                <span className='text-sm sm:text-base font-bold text-semantic-info-700 dark:text-semantic-info-200'>
                  {participantTarget ? `${validatedCount}/${participantTarget}` : validatedCount}
                </span>
                <span className='text-[10px] sm:text-xs text-semantic-info-600 dark:text-semantic-info-300 leading-tight'>
                  {participantTarget ? t('participants') : t('validated')}
                </span>
              </div>
            )}
            {/* People Max - Show for events when participantTarget is set */}
            {type === 'event' && participantTarget !== null && participantTarget !== undefined && (
              <div className='flex flex-col items-center justify-center px-1.5 py-1.5 bg-semantic-info-50 dark:bg-semantic-info-900 rounded-lg border border-semantic-info-200 dark:border-semantic-info-700'>
                <HiUserGroup className='h-3.5 w-3.5 text-semantic-info-600 dark:text-semantic-info-400 mb-0.5' />
                <span className='text-sm sm:text-base font-bold text-semantic-info-700 dark:text-semantic-info-200'>
                  {participantTarget}
                </span>
                <span className='text-[10px] sm:text-xs text-semantic-info-600 dark:text-semantic-info-300 leading-tight'>
                  {t('peopleMax')}
                </span>
              </div>
            )}
            {/* Time Commitment - Show for events if no participant target, or for local/online when no participant counter */}
            {((type === 'event' && (participantTarget === null || participantTarget === undefined)) || 
              ((type === 'local' && acceptApplicationsWG === false) || 
               (type === 'online' && validatedCount === null))) && (
              timeCommitment ? (
                <div className='flex flex-col items-center justify-center px-1.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700'>
                  <HiClock className='h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400 mb-0.5' />
                  <span className='text-[10px] sm:text-xs font-semibold text-neutral-700 dark:text-neutral-300 text-center leading-tight'>
                    {timeCommitment}
                  </span>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center px-1.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 opacity-50'>
                  <HiClock className='h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 mb-0.5' />
                  <span className='text-[10px] text-neutral-400 dark:text-neutral-500'>N/A</span>
                </div>
              )
            )}
          </div>

          {/* Skills with overflow indicator */}
          {skills?.length > 0 && (
            <div className='flex flex-wrap items-center gap-1.5' aria-label={t('skills')}>
              {visibleSkills.map((skill, index) => {
                // Get skill ID
                const skillId = typeof skill === 'object' && skill !== null 
                  ? (skill.value || skill.id || skill) 
                  : skill;
                
                // Get translated label from map, fallback to ID if not found
                const skillLabel = skillLabelsMap[skillId] || skillId;
                
                return (
                  <span key={index} className='px-2 sm:px-2.5 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium border border-neutral-200 dark:border-neutral-700'>
                    {skillLabel}
                  </span>
                );
              })}
              {remainingSkillsCount > 0 && (
                <span className='px-2 sm:px-2.5 py-1 text-xs rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium border border-neutral-300 dark:border-neutral-600'>
                  +{remainingSkillsCount} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Section (Bottom) */}
        <div className='mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-border-light dark:border-border-dark'>
          <div className='flex flex-col space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              {/* SDG Icon on the left */}
              {sdg && (
                <div className='flex items-center flex-shrink-0'>
                  <Image
                    src={`/icons/sdgs/c-${sdg}.png`}
                    alt={`SDG ${sdg}`}
                    width={28}
                    height={28}
                    className='w-6 h-6 sm:w-7 sm:h-7'
                  />
                </div>
              )}
              
              {/* Location on the right */}
              <div className='flex items-center text-xs sm:text-sm text-text-secondary dark:text-text-secondary min-w-0 flex-1 justify-end'>
                <HiLocationMarker className='mr-1.5 text-text-tertiary dark:text-text-tertiary flex-shrink-0' />
                <span className='truncate'>
                  {type === 'online' 
                    ? `Online (${country})`
                    : type === 'event'
                      ? `Event - ${city}, ${country}`
                      : type === 'local' 
                        ? `Local - ${city}, ${country}`
                        : ''}
                </span>
              </div>
            </div>
            {/* Date with relative formatting */}
            {(relativeDate || dateTimeLine) && (
              <div className='flex items-center text-xs sm:text-sm text-text-secondary dark:text-text-secondary'>
                <HiClock className='mr-1.5 h-3.5 w-3.5 text-text-tertiary dark:text-text-tertiary flex-shrink-0' />
                <span className='truncate'>
                  {relativeDate || dateTimeLine}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={localStatus}
        onStatusUpdate={handleStatusUpdate}
        isUpdating={isUpdatingStatus}
      />

      {/* QR Code Modal */}
      {(type === 'local' || type === 'event') && qrCodeToken && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          activityId={id}
          qrCodeToken={qrCodeToken}
          title={title}
          startDate={start_date}
        />
      )}

      {/* Activity Validation Modal */}
      {canEditStatus && (
        <ActivityValidationModal
          isOpen={showValidationModal}
          onClose={handleValidationModalClose}
          activity={{
            id,
            title,
            type,
            status: localStatus
          }}
          onStatusChange={onStatusChange}
        />
      )}
    </>
  );
}
