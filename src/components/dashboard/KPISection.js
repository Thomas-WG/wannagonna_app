'use client';

import { HiUsers, HiOfficeBuilding, HiCalendar, HiViewGrid, HiLockClosed } from 'react-icons/hi';
import { MdOutlineSocialDistance } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

/**
 * KPISection Component
 * Displays key performance indicators for the NPO dashboard
 */
const KPISection = memo(function KPISection({ orgData, closedActivitiesCount, totalActivities }) {
  const t = useTranslations('MyNonProfit');
  const tDashboard = useTranslations('Dashboard');

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">
        {tDashboard('yourStatistics')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* All Activities Card */}
        <div className="bg-background-card dark:bg-background-card rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-full flex-shrink-0">
              <HiViewGrid className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-600 dark:text-neutral-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
              {t('allActivities')}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-neutral-600 dark:text-neutral-400 flex-shrink-0">
              {totalActivities}
            </p>
          </div>
        </div>

        {/* Online Activities Card */}
        <div className="bg-background-card dark:bg-background-card rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-activityType-online-100 dark:bg-activityType-online-900 p-2 rounded-full flex-shrink-0">
              <MdOutlineSocialDistance className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-online-600 dark:text-activityType-online-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
              {t('online')}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-activityType-online-600 dark:text-activityType-online-400 flex-shrink-0">
              {orgData?.totalOnlineActivities || 0}
            </p>
          </div>
        </div>

        {/* Local Activities Card */}
        <div className="bg-background-card dark:bg-background-card rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-activityType-local-100 dark:bg-activityType-local-900 p-2 rounded-full flex-shrink-0">
              <HiOfficeBuilding className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-local-600 dark:text-activityType-local-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
              {t('local')}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-activityType-local-600 dark:text-activityType-local-400 flex-shrink-0">
              {orgData?.totalLocalActivities || 0}
            </p>
          </div>
        </div>

        {/* Total Events Card */}
        <div className="bg-background-card dark:bg-background-card rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-activityType-event-100 dark:bg-activityType-event-900 p-2 rounded-full flex-shrink-0">
              <HiCalendar className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-event-600 dark:text-activityType-event-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
              {t('events')}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-activityType-event-600 dark:text-activityType-event-400 flex-shrink-0">
              {orgData?.totalEvents || 0}
            </p>
          </div>
        </div>

        {/* Closed Activities Card */}
        <div className="bg-background-card dark:bg-background-card rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full flex-shrink-0">
              <HiLockClosed className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
              {t('closed')}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
              {closedActivitiesCount}
            </p>
          </div>
        </div>

        {/* Total Participants Card */}
        <div className="bg-background-card dark:bg-background-card rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-semantic-error-100 dark:bg-semantic-error-900 p-2 rounded-full flex-shrink-0">
              <HiUsers className="h-5 w-5 sm:h-6 sm:w-6 text-semantic-error-600 dark:text-semantic-error-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
              {t('participants')}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-semantic-error-600 dark:text-semantic-error-400 flex-shrink-0">
              {orgData?.totalParticipants || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default KPISection;

