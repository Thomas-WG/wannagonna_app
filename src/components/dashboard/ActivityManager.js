'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import {
  HiPencil,
  HiTrash,
  HiEye,
  HiUserGroup,
  HiQrcode,
  HiDuplicate,
  HiDocumentText,
  HiUsers,
} from 'react-icons/hi';
// Lazy load heavy components
const ActivityFilters = dynamic(() => import('@/components/activities/ActivityFilters'), {
  loading: () => <div className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />,
});
import ActivityList from './ActivityList';
import { useNPODashboardActivities } from '@/hooks/dashboard/useNPODashboardActivities';
import { duplicateActivity } from '@/utils/crudActivities';

/**
 * ActivityManager Component
 * Manages activity list, filtering, sorting, and action overlays
 * Memoized for performance
 */
const ActivityManager = memo(function ActivityManager({
  organizationId,
  onActivityDeleted,
  onOrganizationDataUpdate,
  onOpenModal,
  showToast,
}) {
  const t = useTranslations('MyNonProfit');
  const tActivities = useTranslations('Activities');
  const router = useRouter();

  const { activities, isLoading, handleStatusChange, refetch } = useNPODashboardActivities(organizationId);

  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    status: 'all',
  });
  const [sortBy, setSortBy] = useState('newest');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActionOverlay, setShowActionOverlay] = useState(false);

  // Extract available categories from activities
  const availableCategories = useMemo(() => {
    const cats = new Set();
    activities.forEach((activity) => {
      if (activity.category) cats.add(activity.category);
    });
    return Array.from(cats).sort();
  }, [activities]);

  // Filter activities based on filters
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    if (filters.type !== 'all') {
      filtered = filtered.filter((activity) => activity.type === filters.type);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter((activity) => activity.category === filters.category);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((activity) => activity.status === filters.status);
    }

    return filtered;
  }, [activities, filters]);

  // Sort activities
  const sortedActivities = useMemo(() => {
    const sorted = [...filteredActivities];

    const getDate = (date) => {
      if (!date) return new Date(0);
      if (date.seconds) return new Date(date.seconds * 1000);
      if (date.toDate) return date.toDate();
      if (date instanceof Date) return date;
      return new Date(date);
    };

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = getDate(a.start_date);
          const dateB = getDate(b.start_date);
          return dateB - dateA;
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = getDate(a.start_date);
          const dateB = getDate(b.start_date);
          return dateA - dateB;
        });
      case 'xp_high':
        return sorted.sort((a, b) => (b.xp_reward || 0) - (a.xp_reward || 0));
      case 'xp_low':
        return sorted.sort((a, b) => (a.xp_reward || 0) - (b.xp_reward || 0));
      case 'applicants_high':
        return sorted.sort((a, b) => (b.applicants || 0) - (a.applicants || 0));
      case 'applicants_low':
        return sorted.sort((a, b) => (a.applicants || 0) - (b.applicants || 0));
      case 'alphabetical':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      default:
        return sorted;
    }
  }, [filteredActivities, sortBy]);

  // Handle activity card click
  const handleActivityClick = useCallback(
    (activity) => {
      setSelectedActivity(activity);
      setShowActionOverlay(true);
    },
    []
  );

  // Action handlers
  const handleEditActivity = useCallback(() => {
    if (selectedActivity) {
      setShowActionOverlay(false);
      router.push(`/mynonprofit/activities/manage?activityId=${selectedActivity.id}`);
    }
  }, [selectedActivity, router]);

  const handleDeleteActivity = useCallback(() => {
    if (selectedActivity) {
      setShowActionOverlay(false);
      onOpenModal('activity-delete', { activity: selectedActivity });
    }
  }, [selectedActivity, onOpenModal]);

  const handleReviewApplications = useCallback(() => {
    if (selectedActivity) {
      setShowActionOverlay(false);
      onOpenModal('activity-review-applications', { activity: selectedActivity });
    }
  }, [selectedActivity, onOpenModal]);

  const handleViewActivity = useCallback(() => {
    if (selectedActivity) {
      setShowActionOverlay(false);
      onOpenModal('activity-details', { activityId: selectedActivity.id });
    }
  }, [selectedActivity, onOpenModal]);

  const handleChangeStatus = useCallback(() => {
    if (selectedActivity) {
      setShowActionOverlay(false);
      onOpenModal('activity-status-update', {
        activity: selectedActivity,
        currentStatus: selectedActivity.status,
      });
    }
  }, [selectedActivity, onOpenModal]);

  const handleShowQRCode = useCallback(() => {
    if (selectedActivity) {
      setShowActionOverlay(false);
      onOpenModal('activity-qr-code', {
        activity: selectedActivity,
        activityId: selectedActivity.id,
        qrCodeToken: selectedActivity.qrCodeToken,
        title: selectedActivity.title,
        startDate: selectedActivity.start_date,
      });
    }
  }, [selectedActivity, onOpenModal]);

  const handleViewParticipants = useCallback(() => {
    if (selectedActivity) {
      setShowActionOverlay(false);
      onOpenModal('activity-participants', { activity: selectedActivity });
    }
  }, [selectedActivity, onOpenModal]);

  const handleDuplicateActivity = useCallback(async () => {
    if (!selectedActivity) return;

    try {
      setShowActionOverlay(false);
      const newActivityId = await duplicateActivity(selectedActivity.id);
      router.push(`/mynonprofit/activities/manage?activityId=${newActivityId}`);
    } catch (error) {
      console.error('Error duplicating activity:', error);
      showToast('error', t('errorDuplicating') || 'Error duplicating activity');
    }
  }, [selectedActivity, router, showToast, t]);

  // Render action overlay
  const renderActionOverlay = useCallback(
    (activity) => {
      const hasQRCode = activity.qrCodeToken && (activity.type === 'local' || activity.type === 'event');
      const isEvent = activity.type === 'event';

      return (
        <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center z-10 p-3 sm:p-3">
          <div className="grid grid-cols-3 gap-3 sm:gap-2.5 md:gap-3 w-full max-w-xs sm:max-w-sm">
            {/* Change Status Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleChangeStatus}
                className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation"
                aria-label="Change Status"
              >
                <HiDocumentText className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
              </button>
              <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">
                {t('changeStatus')}
              </span>
            </div>

            {/* Edit Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleEditActivity}
                className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                aria-label="Edit Activity"
              >
                <HiPencil className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
              </button>
              <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">
                {t('edit')}
              </span>
            </div>

            {/* Duplicate Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleDuplicateActivity}
                className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-yellow-500 text-white flex items-center justify-center shadow-lg hover:bg-yellow-600 active:bg-yellow-700 transition-colors touch-manipulation"
                aria-label="Duplicate Activity"
              >
                <HiDuplicate className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
              </button>
              <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">
                {t('duplicate')}
              </span>
            </div>

            {/* Delete Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleDeleteActivity}
                className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:bg-red-700 transition-colors touch-manipulation"
                aria-label="Delete Activity"
              >
                <HiTrash className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
              </button>
              <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">
                {t('delete')}
              </span>
            </div>

            {/* View Activity Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleViewActivity}
                className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 active:bg-purple-700 transition-colors touch-manipulation"
                aria-label="View Activity"
              >
                <HiEye className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
              </button>
              <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">
                {t('view')}
              </span>
            </div>

            {/* Review Applications Button - Hidden for events */}
            {!isEvent && (
              <div className="flex flex-col items-center">
                <button
                  onClick={handleReviewApplications}
                  className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 active:bg-green-700 transition-colors touch-manipulation"
                  aria-label="Review Applications"
                >
                  <HiUserGroup className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                </button>
                <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">
                  {t('applications')}
                </span>
              </div>
            )}

            {/* View Participants Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleViewParticipants}
                className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg hover:bg-teal-600 active:bg-teal-700 transition-colors touch-manipulation"
                aria-label="View Participants"
              >
                <HiUsers className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
              </button>
              <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">
                {t('viewParticipants') || 'Participants'}
              </span>
            </div>

            {/* Show QR Code Button - Conditional */}
            {hasQRCode && (
              <div className="flex flex-col items-center">
                <button
                  onClick={handleShowQRCode}
                  className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:bg-indigo-600 active:bg-indigo-700 transition-colors touch-manipulation"
                  aria-label="Show QR Code"
                >
                  <HiQrcode className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                </button>
                <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">
                  {t('showQRCode')}
                </span>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setShowActionOverlay(false);
              setSelectedActivity(null);
            }}
            className="absolute top-2 right-2 sm:top-2 sm:right-2 w-9 h-9 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-800 transition-colors text-xl sm:text-lg md:text-xl lg:text-2xl touch-manipulation"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      );
    },
    [
      handleChangeStatus,
      handleEditActivity,
      handleDuplicateActivity,
      handleDeleteActivity,
      handleViewActivity,
      handleReviewApplications,
      handleViewParticipants,
      handleShowQRCode,
      t,
    ]
  );

  return (
    <div className="mt-6 sm:mt-10">
      <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">
        {t('yourActivities')}
      </h2>

      {/* Filters */}
      <ActivityFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableCountries={[]}
        availableCategories={availableCategories}
        availableSkills={[]}
      />

      {/* Sort and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-sm text-text-secondary dark:text-text-secondary">
          {tActivities('showing')} <span className="font-semibold">{sortedActivities.length}</span>{' '}
          {tActivities('of')} <span className="font-semibold">{activities.length}</span>{' '}
          {tActivities('activities')}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-primary dark:text-text-primary">
            {tActivities('sortBy')}
          </label>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
          >
            <option value="newest">{tActivities('sortNewest')}</option>
            <option value="oldest">{tActivities('sortOldest')}</option>
            <option value="xp_high">{tActivities('sortXpHigh')}</option>
            <option value="xp_low">{tActivities('sortXpLow')}</option>
            <option value="applicants_high">{tActivities('sortApplicantsHigh')}</option>
            <option value="applicants_low">{tActivities('sortApplicantsLow')}</option>
            <option value="alphabetical">{tActivities('sortAlphabetical')}</option>
          </Select>
        </div>
      </div>

      {/* Activity List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
        </div>
      ) : (
        <ActivityList
          activities={sortedActivities}
          selectedActivity={selectedActivity}
          showActionOverlay={showActionOverlay}
          onActivityClick={handleActivityClick}
          onStatusChange={handleStatusChange}
          renderActionOverlay={renderActionOverlay}
        />
      )}
    </div>
  );
});

export default ActivityManager;

