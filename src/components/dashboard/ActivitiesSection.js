'use client';

import { memo, useCallback, useMemo } from 'react';
import { Select, Badge } from 'flowbite-react';
import { HiCheck, HiX, HiClock, HiEye, HiDocumentText } from 'react-icons/hi';
import { useTranslations } from 'next-intl';
import ActivityCard from '@/components/activities/ActivityCard';
import ActivityFilters from '@/components/activities/ActivityFilters';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useActivityFilters } from '@/hooks/dashboard/useActivityFilters';
import { useActivitySort } from '@/hooks/dashboard/useActivitySort';

/**
 * ActivitiesSection Component
 * Displays activities grid with filtering, sorting, and application status badges
 */
const ActivitiesSection = memo(function ActivitiesSection({
  activities,
  applicationsWithActivities,
  showApplications,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  availableCategories,
  onViewApplication,
}) {
  const t = useTranslations('Dashboard');
  const tActivities = useTranslations('Activities');
  const {
    showActionModal,
    selectedApplicationActivity,
    setShowActivityModal,
    setSelectedActivityId,
    setShowActionModal,
    setSelectedApplicationActivity,
  } = useDashboardStore();

  // Filter activities
  const filteredActivities = useActivityFilters(activities, filters);

  // Sort activities
  const sortedActivities = useActivitySort(filteredActivities, sortBy);

  // Get application status badge
  const getApplicationStatusBadge = useCallback(
    (status) => {
      switch (status) {
        case 'accepted':
          return (
            <Badge color="success" icon={HiCheck}>
              {t('statusAccepted') || 'Accepted'}
            </Badge>
          );
        case 'rejected':
          return (
            <Badge color="failure" icon={HiX}>
              {t('statusRejected') || 'Rejected'}
            </Badge>
          );
        case 'cancelled':
          return (
            <Badge color="gray" icon={HiX}>
              {t('statusCancelled') || 'Cancelled'}
            </Badge>
          );
        default:
          return (
            <Badge color="warning" icon={HiClock}>
              {t('statusPending') || 'Pending'}
            </Badge>
          );
      }
    },
    [t]
  );

  // Handle application card click
  const handleApplicationCardClick = useCallback(
    (activity) => {
      if (activity.applicationStatus || showApplications) {
        setSelectedApplicationActivity(activity);
        setShowActionModal(true);
      } else {
        const activityIdToUse = activity.activityId || activity.id;
        setSelectedActivityId(activityIdToUse);
        setShowActivityModal(true);
      }
    },
    [showApplications, setSelectedApplicationActivity, setShowActionModal, setSelectedActivityId, setShowActivityModal]
  );

  // Handle viewing activity from application
  const handleViewActivity = useCallback(() => {
    if (selectedApplicationActivity) {
      const activityIdToUse =
        selectedApplicationActivity.activityId || selectedApplicationActivity.id;
      setSelectedActivityId(activityIdToUse);
      setShowActivityModal(true);
      setShowActionModal(false);
    }
  }, [selectedApplicationActivity, setSelectedActivityId, setShowActivityModal, setShowActionModal]);

  // Handle viewing application details
  const handleViewApplication = useCallback(() => {
    setShowActionModal(false);
    // Application modal will be handled by parent via onViewApplication prop
    onViewApplication?.();
  }, [setShowActionModal, onViewApplication]);

  // Handle activity card click
  const handleActivityClick = useCallback(
    (activity) => {
      if (showApplications) {
        handleApplicationCardClick(activity);
      } else {
        const activityIdToUse = activity.activityId || activity.id;
        setSelectedActivityId(activityIdToUse);
        setShowActivityModal(true);
      }
    },
    [showApplications, handleApplicationCardClick, setSelectedActivityId, setShowActivityModal]
  );

  return (
    <div className="mb-6 sm:mb-10">
      <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">
        {showApplications
          ? t('yourApplications') || 'Your Applications'
          : t('yourActivities') || 'Your Activities'}
      </h2>

      {/* Filters */}
      <ActivityFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        availableCountries={[]}
        availableCategories={availableCategories}
        availableSkills={[]}
      />

      {/* Sort and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-sm text-text-secondary dark:text-text-secondary">
          {tActivities('showing')} <span className="font-semibold">{sortedActivities.length}</span>{' '}
          {tActivities('of')}{' '}
          <span className="font-semibold">{activities.length}</span> {tActivities('activities')}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-primary dark:text-text-primary">
            {tActivities('sortBy')}
          </label>
          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
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

      {sortedActivities.length === 0 ? (
        <p className="text-text-secondary dark:text-text-secondary px-1">
          {showApplications
            ? t('noApplicationsFound') || 'No applications found.'
            : t('noActivitiesFound') ||
              'No activities found. Start applying to activities to see them here!'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {sortedActivities.map((activity) => {
            const applicationData = showApplications
              ? applicationsWithActivities.find((app) => app.id === activity.applicationId)
              : null;

            return (
              <div key={activity.id || activity.applicationId} className="relative">
                <ActivityCard
                  id={activity.id}
                  organization_name={activity.organization_name}
                  organization_logo={activity.organization_logo}
                  title={activity.title}
                  type={activity.type}
                  country={activity.country}
                  start_date={activity.start_date}
                  end_date={activity.end_date}
                  sdg={activity.sdg}
                  applicants={activity.applicants}
                  xp_reward={activity.xp_reward}
                  description={activity.description}
                  status={activity.status}
                  last_updated={activity.last_updated}
                  city={activity.city}
                  category={activity.category}
                  qrCodeToken={activity.qrCodeToken}
                  frequency={activity.frequency}
                  skills={activity.skills}
                  participantTarget={activity.participantTarget}
                  acceptApplicationsWG={activity.acceptApplicationsWG}
                  onClick={() => handleActivityClick(activity)}
                  canEditStatus={false}
                />
                {/* Show application status badge if showing applications */}
                {showApplications && activity.applicationStatus && (
                  <div className="absolute top-3 right-3 z-10">
                    {getApplicationStatusBadge(activity.applicationStatus)}
                  </div>
                )}

                {/* Overlay with action buttons for applications */}
                {showApplications &&
                  selectedApplicationActivity &&
                  selectedApplicationActivity.id === activity.id &&
                  showActionModal && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center z-10 p-3 sm:p-4">
                      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4 md:gap-6 w-full sm:w-auto">
                        {/* View Activity Button */}
                        <div className="flex flex-col items-center">
                          <button
                            onClick={handleViewActivity}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 active:bg-purple-700 transition-colors touch-manipulation"
                            aria-label={t('viewActivity') || 'View Activity'}
                          >
                            <HiEye className="h-6 w-6 sm:h-8 sm:w-8" />
                          </button>
                          <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white font-medium">
                            {t('viewActivity') || 'View Activity'}
                          </span>
                        </div>

                        {/* View Application Button */}
                        <div className="flex flex-col items-center">
                          <button
                            onClick={handleViewApplication}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                            aria-label={t('viewMyApplication') || 'View Application'}
                          >
                            <HiDocumentText className="h-6 w-6 sm:h-8 sm:w-8" />
                          </button>
                          <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white font-medium">
                            {t('viewMyApplication') || 'View Application'}
                          </span>
                        </div>
                      </div>

                      {/* Close button */}
                      <button
                        onClick={() => {
                          setShowActionModal(false);
                          setSelectedApplicationActivity(null);
                        }}
                        className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-800 transition-colors text-lg sm:text-xl touch-manipulation"
                        aria-label={t('close') || 'Close'}
                      >
                        ×
                      </button>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ActivitiesSection;

