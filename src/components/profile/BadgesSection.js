'use client';

import { HiBadgeCheck } from 'react-icons/hi';
import BadgeDisplay from '@/components/badges/BadgeDisplay';
import { useTranslations } from 'next-intl';

/**
 * Badges section component
 * Displays user badges in a grid
 */
export default function BadgesSection({ badges }) {
  const tProfile = useTranslations('PublicProfile');

  return (
    <div className="bg-background-hover dark:bg-background-hover rounded-lg p-4 border border-border-light dark:border-border-dark">
      <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-3 flex items-center gap-2">
        <HiBadgeCheck className="w-5 h-5 text-activityType-event-500 dark:text-activityType-event-400" />
        {tProfile('badges')}
      </h3>
      
      {!badges || badges.length === 0 ? (
        <div className="text-center py-6">
          <HiBadgeCheck className="w-10 h-10 text-text-tertiary dark:text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary dark:text-text-secondary">{tProfile('noBadges')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 justify-items-center">
          {badges.map((badge) => (
            <div key={badge.id} className="w-full max-w-[70px]">
              <BadgeDisplay badge={badge} size="small" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
