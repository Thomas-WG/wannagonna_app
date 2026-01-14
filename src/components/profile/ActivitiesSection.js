'use client';

import { HiCalendar } from 'react-icons/hi';
import { formatDateOnly } from '@/utils/dateUtils';
import { useTranslations } from 'next-intl';

/**
 * Activities section component
 * Displays completed activities list
 */
export default function ActivitiesSection({ completedActivities }) {
  const tProfile = useTranslations('PublicProfile');

  return (
    <div className="space-y-3 pt-6 border-t border-border-light dark:border-border-dark">
      <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary flex items-center justify-center gap-2">
        <HiCalendar className="w-5 h-5 text-semantic-info-500 dark:text-semantic-info-400" />
        {tProfile('completedActivities')}
      </h3>
      
      {!completedActivities || completedActivities.length === 0 ? (
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
  );
}
