import { Tooltip } from 'flowbite-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import {
  HiLocationMarker, HiUserGroup, HiStar,
  HiQuestionMarkCircle,
  HiClock,
  HiDocument, HiCheckCircle, HiArchive
} from 'react-icons/hi';
import { FaRegCircle } from 'react-icons/fa';
import StatusUpdateModal from './StatusUpdateModal';
import { updateActivityStatus } from '@/utils/crudActivities';
import { categoryIcons } from '@/constant/categoryIcons';

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
  onClick,
  onStatusChange,
  canEditStatus = false,
}) {
  const t = useTranslations('ActivityCard');
  const tManage = useTranslations('ManageActivities');
  
  // State for status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);

  // Sync local status with prop changes
  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  // Status configuration
  const getStatusConfig = (status) => {
    const statusConfigs = {
      'Draft': {
        icon: HiDocument,
        color: 'bg-gray-100 text-gray-800',
        borderColor: 'border-gray-300',
        label: t('status.Draft')
      },
      'Open': {
        icon: FaRegCircle,
        color: 'bg-green-100 text-green-800',
        borderColor: 'border-green-300',
        label: t('status.Open')
      },
      'Closed': {
        icon: HiCheckCircle,
        color: 'bg-purple-100 text-purple-800',
        borderColor: 'border-purple-300',
        label: t('status.Closed')
      }
    };
    
    return statusConfigs[status] || statusConfigs['Draft'];
  };


  const formatDateTimeRange = (start, end) => {
    if (!start) return null;
    try {
      const startDate = new Date(start);
      const endDate = end ? new Date(end) : null;

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

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
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
        className="cursor-pointer w-full sm:w-80 md:w-96 mx-auto p-3 sm:p-4 bg-white border border-gray-200 rounded-xl shadow-md hover:bg-gray-50 transition-all duration-300"
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
            <span className='text-xs text-gray-500 truncate' aria-label={organization_name}>{organization_name}</span>
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
          </div>
        </div>

        {/* Title */}
        <div className='mt-2 sm:mt-3 min-h-[3rem] sm:h-14 flex items-start'>
          <h2 className='text-lg sm:text-xl font-bold text-gray-900 leading-tight break-words'>{title}</h2>
        </div>

        {/* Key Information Section (Middle) */}
        <div className='mt-2 sm:mt-3 space-y-2'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center text-sm sm:text-base font-semibold text-indigo-600'>
              <HiStar className='mr-1 text-indigo-500 flex-shrink-0' />
              <span className='truncate'>{xp_reward} {t('points')}</span>
            </div>
            <div className='flex items-center text-xs sm:text-sm font-semibold text-gray-700 flex-shrink-0'>
              <HiUserGroup className='mr-1 text-gray-600' />
              <span>{applicants} {t('applied')}</span>
            </div>
          </div>

          {skills?.length > 0 && (
            <div className='flex flex-wrap gap-1' aria-label={t('skills')}>
              {skills.map((skill, index) => (
                <span key={index} className='px-1.5 sm:px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800'>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Section (Bottom) */}
        <div className='mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200'>
          <div className='flex flex-col space-y-1'>
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
              <div className='flex items-center text-xs sm:text-sm text-gray-700 min-w-0 flex-1 justify-end'>
                <HiLocationMarker className='mr-1 text-gray-500 flex-shrink-0' />
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
            {dateTimeLine && (
              <div className='text-xs sm:text-sm text-gray-700 truncate'>
                {dateTimeLine}
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
    </>
  );
}
