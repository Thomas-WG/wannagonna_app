'use client';

import { memo } from 'react';
import ActivityCard from '@/components/activities/ActivityCard';
import { useTranslations } from 'next-intl';

/**
 * ActivityList Component
 * Renders a grid of activity cards with action overlay support
 */
const ActivityList = memo(function ActivityList({
  activities,
  selectedActivity,
  showActionOverlay,
  onActivityClick,
  onStatusChange,
  renderActionOverlay,
}) {
  const t = useTranslations('MyNonProfit');

  if (activities.length === 0) {
    return (
      <p className="text-text-secondary dark:text-text-secondary px-1">{t('noActivitiesFound')}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {activities.map((activity) => (
        <div key={activity.id} className="relative">
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
            onClick={() => onActivityClick(activity)}
            canEditStatus={true}
            onStatusChange={onStatusChange}
            showQRButton={true}
          />
          {selectedActivity &&
            selectedActivity.id === activity.id &&
            showActionOverlay &&
            renderActionOverlay(activity)}
        </div>
      ))}
    </div>
  );
});

export default ActivityList;

