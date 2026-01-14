'use client';

import { memo } from 'react';
import { HiOfficeBuilding, HiCalendar, HiDocumentText } from 'react-icons/hi';
import { MdOutlineSocialDistance } from 'react-icons/md';
import { useTranslations } from 'next-intl';

/**
 * StatsSection Component
 * Displays statistics cards for Local Activities, Online Activities, Events, and Total Applications
 */
const StatsSection = memo(function StatsSection({ stats }) {
  const t = useTranslations('Dashboard');

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">
        {t('yourStatistics') || 'Your Statistics'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Local Activities */}
        <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-activityType-local-100 dark:bg-activityType-local-900 p-2 rounded-full flex-shrink-0">
              <HiOfficeBuilding className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-local-600 dark:text-activityType-local-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
              {t('localActivities') || 'Local Activities'}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-activityType-local-600 dark:text-activityType-local-400 flex-shrink-0">
              {stats.totalLocalActivities}
            </p>
          </div>
        </div>

        {/* Online Activities */}
        <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-activityType-online-100 dark:bg-activityType-online-900 p-2 rounded-full flex-shrink-0">
              <MdOutlineSocialDistance className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-online-600 dark:text-activityType-online-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
              {t('onlineActivities') || 'Online Activities'}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-activityType-online-600 dark:text-activityType-online-400 flex-shrink-0">
              {stats.totalOnlineActivities}
            </p>
          </div>
        </div>

        {/* Events */}
        <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-activityType-event-100 dark:bg-activityType-event-900 p-2 rounded-full flex-shrink-0">
              <HiCalendar className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-event-600 dark:text-activityType-event-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
              {t('events') || 'Events'}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-activityType-event-600 dark:text-activityType-event-400 flex-shrink-0">
              {stats.totalEvents}
            </p>
          </div>
        </div>

        {/* Total Applications */}
        <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-semantic-warning-100 dark:bg-semantic-warning-900 p-2 rounded-full flex-shrink-0">
              <HiDocumentText className="h-5 w-5 sm:h-6 sm:w-6 text-semantic-warning-600 dark:text-semantic-warning-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
              {t('totalApplications') || 'Total applications'}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-semantic-warning-600 dark:text-semantic-warning-400 flex-shrink-0">
              {stats.totalApplications}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default StatsSection;

