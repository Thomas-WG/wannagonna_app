'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import SortBySelect from '@/components/common/SortBySelect';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import ActivityCardActionsOverlay from '@/components/activities/ActivityCardActionsOverlay';
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
        qr_code_token: selectedActivity.qr_code_token,
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
      await duplicateActivity(selectedActivity.id);
      await refetch();
      showToast('success', t('successDuplicating'));
    } catch (error) {
      console.error('Error duplicating activity:', error);
      showToast('error', t('errorDuplicating') || 'Error duplicating activity');
    }
  }, [selectedActivity, refetch, showToast, t]);

  // Render action overlay
  const renderActionOverlay = useCallback(
    (activity) => (
      <ActivityCardActionsOverlay
        activity={activity}
        onClose={() => {
          setShowActionOverlay(false);
          setSelectedActivity(null);
        }}
        onChangeStatus={handleChangeStatus}
        onEdit={handleEditActivity}
        onDuplicate={handleDuplicateActivity}
        onDelete={handleDeleteActivity}
        onView={handleViewActivity}
        onApplications={handleReviewApplications}
        onParticipants={handleViewParticipants}
        onQRCode={handleShowQRCode}
        labels={{
          changeStatus: t('changeStatus'),
          edit: t('edit'),
          duplicate: t('duplicate'),
          delete: t('delete'),
          view: t('view'),
          applications: t('applications'),
          viewParticipants: t('viewParticipants') || 'Participants',
          showQRCode: t('showQRCode'),
        }}
      />
    ),
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
      <h2 className="section-title text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">
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
        <SortBySelect
          label={tActivities('sortBy')}
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: 'newest', label: tActivities('sortNewest') },
            { value: 'oldest', label: tActivities('sortOldest') },
            { value: 'xp_high', label: tActivities('sortXpHigh') },
            { value: 'xp_low', label: tActivities('sortXpLow') },
            { value: 'applicants_high', label: tActivities('sortApplicantsHigh') },
            { value: 'applicants_low', label: tActivities('sortApplicantsLow') },
            { value: 'alphabetical', label: tActivities('sortAlphabetical') },
          ]}
        />
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

