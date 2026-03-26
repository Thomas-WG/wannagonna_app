'use client';

import Image from 'next/image';
import { HiCalendar, HiOfficeBuilding, HiQuestionMarkCircle } from 'react-icons/hi';
import { formatDateOnly } from '@/utils/dateUtils';
import { useTranslations } from 'next-intl';
import { categoryIcons } from '@/constant/categoryIcons';

/**
 * Helper to format activity date (history merge + optional schedule fields)
 */
function formatDate(activity) {
  const date =
    activity.added_to_history_at ?? activity.end_date ?? activity.start_date ?? null;
  return date ? formatDateOnly(date) : null;
}

/** @param {Object} activity - Activity with denormalized org fields */
function getOrgName(activity) {
  return activity.organization_name ?? null;
}

function getOrgLogo(activity) {
  return activity.organization_logo ?? null;
}

/**
 * Get type color class for activity type (online, local, event) - matches ActivityCard
 */
function getTypeColorClass(type) {
  const typeColors = {
    online: 'border-l-activityType-online-500 dark:border-l-activityType-online-400',
    local: 'border-l-activityType-local-500 dark:border-l-activityType-local-400',
    event: 'border-l-activityType-event-500 dark:border-l-activityType-event-400',
  };
  return typeColors[type] || 'border-l-neutral-500 dark:border-l-neutral-400';
}

/**
 * Activities section component
 * Displays completed activities list with organization logo, name, type color, and category
 */
export default function ActivitiesSection({ completedActivities }) {
  const tProfile = useTranslations('PublicProfile');
  const tManage = useTranslations('ManageActivities');

  return (
    <div className="space-y-3 pt-6 border-t border-border-light dark:border-border-dark">
      <h3 className="text-sm font-bold uppercase tracking-widest text-[#9ca3af] dark:text-text-tertiary mb-3 text-center">
        {tProfile('completedActivities')}
      </h3>

      {!completedActivities || completedActivities.length === 0 ? (
        <div className="text-center py-6 bg-background-hover dark:bg-background-hover rounded-lg max-w-xl mx-auto border border-border-light dark:border-border-dark">
          <HiCalendar className="w-10 h-10 text-text-tertiary dark:text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary dark:text-text-secondary">{tProfile('noActivities')}</p>
        </div>
      ) : (
        <div className="space-y-2 max-w-xl mx-auto">
          {completedActivities.map((activity) => {
            const formattedDate = formatDate(activity);
            const orgName = getOrgName(activity);
            const orgLogo = getOrgLogo(activity);
            const type = activity.type || 'online';
            const category = activity.category;
            const typeColorClass = getTypeColorClass(type);
            const CategoryIcon = category ? (categoryIcons[category] || HiQuestionMarkCircle) : null;
            const categoryLabel = category ? (() => {
              try { return tManage(category); } catch { return category; }
            })() : null;

            return (
              <div
                key={activity.id}
                className={`flex items-center gap-3 border-l-4 ${typeColorClass} px-4 py-3 rounded-xl border border-[#e5e7eb] dark:border-border-light bg-white dark:bg-background-card hover:border-[#009AA2]/30 dark:hover:border-[#009AA2]/30 hover:bg-[#f0fdfd] dark:hover:bg-background-hover transition-colors`}
              >
                {/* Organization logo */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-[#f5f5f5] dark:bg-background-hover flex items-center justify-center">
                  {orgLogo ? (
                    <Image
                      src={orgLogo}
                      alt={orgName ? `${orgName} logo` : 'Organization logo'}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover"
                    />
                  ) : (
                    <HiOfficeBuilding className="w-5 h-5 text-[#9ca3af] dark:text-text-tertiary" />
                  )}
                </div>

                {/* Activity title + org name + category */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1A1A1A] dark:text-text-primary truncate">
                    {activity.title ?? activity.name ?? tProfile('untitledActivity')}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {orgName && (
                      <p className="text-xs text-[#9ca3af] dark:text-text-tertiary truncate">
                        {orgName}
                      </p>
                    )}
                    {CategoryIcon && categoryLabel && (
                      <>
                        {orgName && (
                          <span className="text-[#e5e7eb] dark:text-border-light">•</span>
                        )}
                        <span
                          className="inline-flex items-center gap-1.5 text-xs text-[#6b7280] dark:text-text-tertiary"
                          title={categoryLabel}
                        >
                          <CategoryIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{categoryLabel}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="flex-shrink-0 text-right">
                  {formattedDate && (
                    <span className="text-xs text-[#9ca3af] dark:text-text-tertiary whitespace-nowrap">
                      {formattedDate}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
