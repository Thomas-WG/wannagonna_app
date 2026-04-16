import { Tooltip, Button } from 'flowbite-react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, useMemo } from 'react';
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
import CloseActivityModal from './CloseActivityModal';
import { updateActivityStatus } from '@/utils/crudActivities';
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
  effective_participants_count,
  type,
  xp_reward,
  city,
  description,
  start_date,
  end_date,
  start_time,
  end_time,
  sdg,
  status,
  qr_code_token,
  frequency,
  onClick,
  onStatusChange,
  canEditStatus = false,
  showQRButton = false,
  participant_target,
  accept_applications_wg,
  updated_at,
  distance, // Distance in km when "Around Me" filter is active
  showStatusBadge = true,
  isClickable = true,
  fallbackLogo = '/logo/1%20-%20Color%20on%20White%20-%20RGB.png',
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
  const [showCloseActivityModal, setShowCloseActivityModal] = useState(false);
  const [skillLabelsMap, setSkillLabelsMap] = useState({});

  const participantStatCount = useMemo(() => {
    if (effective_participants_count != null) {
      return effective_participants_count;
    }
    if (applicants != null) {
      return applicants;
    }
    return null;
  }, [effective_participants_count, applicants]);

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
  // Helper to strip time component (local timezone)
  const stripTime = (date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  /**
   * Format activity date information without hours.
   * Rules:
   * - If end_date exists: "startDate - endDate"
   * - If no end_date and today is after start_date: "startDate - present"
   * - If status is Closed: "startDate - updated_at (or end_date, or today)"
   * - Otherwise: "startDate"
   */
  const formatActivityDateRange = (start, end, activityStatus, lastUpdated) => {
    if (!start) return null;

    try {
      const startDate = getDateFromFirestore(start);
      if (!startDate) return null;

      const endDate = end ? getDateFromFirestore(end) : null;
      const lastUpdatedDate = lastUpdated ? getDateFromFirestore(lastUpdated) : null;

      const startDay = stripTime(startDate);
      const endDay = endDate ? stripTime(endDate) : null;
      const lastUpdatedDay = lastUpdatedDate ? stripTime(lastUpdatedDate) : null;
      const today = stripTime(new Date());

      const dateFormatter = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const startStr = dateFormatter.format(startDay);

      // When activity is closed, show last modification date
      if (activityStatus === 'Closed') {
        const endForDisplay = lastUpdatedDay || endDay || today;
        const endStr = dateFormatter.format(endForDisplay);
        return `${startStr} - ${endStr}`;
      }

      // If we have an end date on the same day, just show the single day
      if (endDay && startDay && endDay.getTime() === startDay.getTime()) {
        return startStr;
      }

      // If we have an end date, show the range
      if (endDay) {
        const endStr = dateFormatter.format(endDay);
        return `${startStr} - ${endStr}`;
      }

      // No end date: show only start date (no hyphen)
      return startStr;
    } catch (e) {
      return null;
    }
  };

  // Format description preview (max 100 characters)
  const getDescriptionPreview = () => {
    if (!description) return null;
    const maxLength = 100;
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  };

  // Frequency label (once / regular / role) for the stats row
  const get_frequency_label = () => {
    if (!frequency) return null;
    const frequencyMap = {
      'once': 'One-time',
      'regular': 'Regular',
      'role': 'Long-term'
    };
    return frequencyMap[frequency] || frequency;
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
  const frequency_label = get_frequency_label();
  const activityDateLine = formatActivityDateRange(start_date, end_date, localStatus, updated_at);
  const typeColorClass = getTypeColorClasses();
  const logoSrc = organization_logo || fallbackLogo;

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    // If trying to close: events go directly to close modal, others go through validation first
    if (newStatus === 'Closed') {
      setShowStatusModal(false);
      if (type === 'event') {
        setShowCloseActivityModal(true);
      } else {
        setShowValidationModal(true);
      }
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
  const handleValidationModalClose = (shouldCloseActivity) => {
    setShowValidationModal(false);
    
    // If all applicants are processed, continue to hours/impact close step
    if (shouldCloseActivity) {
      setShowCloseActivityModal(true);
    } else {
      // If not all processed, revert status to Open
      setLocalStatus('Open');
    }
  };

  const handleCloseActivitySuccess = (activityId) => {
    setShowCloseActivityModal(false);
    setLocalStatus('Closed');
    if (onStatusChange) {
      onStatusChange(activityId || id, 'Closed');
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
        onClick={isClickable ? onClick : undefined}
        className={`w-full p-3 sm:p-4 bg-background-card dark:bg-background-card border-l-4 ${typeColorClass} border border-border-light dark:border-border-dark rounded-xl shadow-md transition-all duration-300 transform flex flex-col h-full min-h-[280px] ${
          isClickable ? 'cursor-pointer hover:shadow-lg hover:bg-background-hover dark:hover:bg-background-hover hover:-translate-y-1' : ''
        }`}
        role="button"
        aria-label={title}
      >
        {/* TOP SECTION — fixed, does not grow */}
        <div className='flex flex-col gap-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex items-center gap-2 min-w-0 flex-1'>
              <Image
                src={logoSrc}
                alt={`${organization_name} logo`}
                width={44}
                height={44}
                className='w-11 h-11 rounded-full flex-shrink-0 object-cover'
              />
              <span className='text-xs text-[#9ca3af] dark:text-text-tertiary font-normal truncate' aria-label={organization_name}>{organization_name}</span>
            </div>
            <div className='flex items-center gap-1.5 flex-shrink-0'>
              {/* Status Badge */}
              {showStatusBadge && localStatus && (() => {
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
              
              {/* Category Icon — subtle container */}
              {(() => {
                const Icon = categoryIcons[category] || HiQuestionMarkCircle;
                const label = (() => {
                  try { return tManage(category); } catch { return category; }
                })();
                return (
                  <Tooltip content={label} placement="top">
                    <span title={label} aria-label={label} role="img" tabIndex={0} className='inline-flex w-8 h-8 items-center justify-center rounded-lg bg-[#f5f5f5] dark:bg-neutral-700 text-[#6b7280] dark:text-text-tertiary'>
                      <Icon aria-hidden className='w-5 h-5' />
                    </span>
                  </Tooltip>
                );
              })()}
              <span className='sr-only'>{category}</span>
              
              {/* QR Code Button — subtle container */}
              {showQRButton && (type === 'local' || type === 'event') && qr_code_token && (
                <Tooltip content="Show QR Code" placement="top">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQRModal(true);
                    }}
                    className='w-8 h-8 flex items-center justify-center rounded-lg bg-[#f5f5f5] dark:bg-neutral-700 text-[#6b7280] dark:text-text-tertiary hover:opacity-80 transition-opacity'
                  >
                    <HiQrcode className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Title — 2-line max */}
          <h3 className='text-lg font-bold text-[#1A1A1A] dark:text-text-primary leading-snug line-clamp-2 mt-2'>{title}</h3>
        </div>

        {/* DESCRIPTION — natural height, no flex-grow */}
        {descriptionPreview && (
          <p className='text-sm text-[#6b7280] dark:text-text-secondary font-light leading-relaxed line-clamp-3 mt-1.5 min-h-[2.5rem]'>
            {descriptionPreview}
          </p>
        )}

        {/* SKILLS — only if present, sits directly below description */}
        {skills?.length > 0 && (
          <div className='flex flex-wrap items-center gap-1.5 mt-2' aria-label={t('skills')}>
            {visibleSkills.map((skill, index) => {
              const skillId = typeof skill === 'object' && skill !== null 
                ? (skill.value || skill.id || skill) 
                : skill;
              const skillLabel = skillLabelsMap[skillId] || skillId;
              return (
                <span key={index} className='text-xs font-medium px-2.5 py-1 rounded-full border border-[#e5e7eb] dark:border-border-light bg-[#f9fafb] dark:bg-neutral-800 text-[#3F3F3F] dark:text-text-primary'>
                  {skillLabel}
                </span>
              );
            })}
            {remainingSkillsCount > 0 && (
              <span className='text-xs font-medium px-2.5 py-1 rounded-full border border-[#e5e7eb] dark:border-border-light bg-[#f9fafb] dark:bg-neutral-700 text-[#6b7280] dark:text-text-tertiary'>
                +{remainingSkillsCount} more
              </span>
            )}
          </div>
        )}

        {/* SPACER — the only growing element, absorbs empty space */}
        <div className='flex-1 min-h-[1rem]' />

        {/* STATS ROW — pinned just above footer */}
        <div className='flex items-center gap-4 pb-3 flex-wrap'>
            <span className='flex items-center gap-1.5 text-sm font-semibold text-[#009AA2] dark:text-primary-500'>
              <HiStar className='w-4 h-4 flex-shrink-0' />
              {xp_reward} <span className='text-xs font-normal text-[#6b7280] dark:text-text-tertiary'>pts</span>
            </span>
            {((type === 'local' && accept_applications_wg !== false) || type === 'online') && participantStatCount != null && (
              <>
                <span className='w-px h-4 bg-[#e5e7eb] dark:bg-border-light flex-shrink-0' />
                <span className='flex items-center gap-1.5 text-sm font-semibold text-[#3F3F3F] dark:text-text-primary'>
                  <HiUserGroup className='w-4 h-4 flex-shrink-0' />
                  {participant_target != null && participant_target > 0
                    ? `${participantStatCount}/${participant_target}`
                    : participantStatCount}{' '}
                  <span className='text-xs font-normal text-[#6b7280] dark:text-text-tertiary'>
                    {participant_target != null && participant_target > 0 ? t('participants') : t('validated')}
                  </span>
                </span>
              </>
            )}
            {type === 'event' && participant_target !== null && participant_target !== undefined && (
              <>
                <span className='w-px h-4 bg-[#e5e7eb] dark:bg-border-light flex-shrink-0' />
                <span className='flex items-center gap-1.5 text-sm font-semibold text-[#3F3F3F] dark:text-text-primary'>
                  <HiUserGroup className='w-4 h-4 flex-shrink-0' />
                  {participant_target} <span className='text-xs font-normal text-[#6b7280] dark:text-text-tertiary'>{t('peopleMax')}</span>
                </span>
              </>
            )}
            {((type === 'event' && (participant_target === null || participant_target === undefined)) ||
              ((type === 'local' && accept_applications_wg === false) || (type === 'online' && participantStatCount == null))) && (
              <>
                <span className='w-px h-4 bg-[#e5e7eb] dark:bg-border-light flex-shrink-0' />
                <span className='flex items-center gap-1.5 text-sm font-semibold text-[#3F3F3F] dark:text-text-primary'>
                  <HiClock className='w-4 h-4 flex-shrink-0' />
                  {frequency_label || 'N/A'}
                </span>
              </>
            )}
          </div>

        {/* FOOTER — always at bottom */}
        <div className='border-t border-[#f0f0f0] dark:border-border-light pt-3'>
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
              <div className='flex items-center text-xs sm:text-sm text-text-secondary dark:text-text-secondary min-w-0 flex-1 justify-end gap-2'>
                <div className='flex items-center min-w-0'>
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
                {/* Distance badge when available */}
                {distance !== undefined && distance !== null && (
                  <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex-shrink-0'>
                    {distance.toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
            {/* Date range */}
            {activityDateLine && (
              <div className='flex items-center text-xs sm:text-sm text-text-secondary dark:text-text-secondary'>
                <HiClock className='mr-1.5 h-3.5 w-3.5 text-text-tertiary dark:text-text-tertiary flex-shrink-0' />
                <span className='truncate'>
                  {activityDateLine}
                  {(start_time || end_time) && (
                    <span className='text-text-tertiary dark:text-text-tertiary'>
                      {' · '}
                      {start_time && end_time ? `${start_time} – ${end_time}` : start_time || end_time}
                    </span>
                  )}
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
      {(type === 'local' || type === 'event') && qr_code_token && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          activityId={id}
          qr_code_token={qr_code_token}
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

      {canEditStatus && (
        <CloseActivityModal
          isOpen={showCloseActivityModal}
          onClose={() => setShowCloseActivityModal(false)}
          activity={{
            id,
            title,
            type,
            status: localStatus,
            impact_parameters: [],
            start_date,
            end_date,
            start_time,
            end_time,
          }}
          onSuccess={handleCloseActivitySuccess}
        />
      )}
    </>
  );
}
