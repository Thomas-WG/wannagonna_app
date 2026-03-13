'use client';

import { HiBadgeCheck } from 'react-icons/hi';
import BadgeDisplay from '@/components/badges/BadgeDisplay';
import ChampionBadge from '@/components/leaderboard/ChampionBadge';
import { useTranslations } from 'next-intl';

/**
 * Badges section component
 * Displays user badges in a grid
 * @param {Object[]} badges - Array of badge objects
 * @param {Object[]} [championDimensions] - Leaderboard rank docs where user is champion (for ChampionBadge overlay)
 */
export default function BadgesSection({ badges, championDimensions = [] }) {
  const tProfile = useTranslations('PublicProfile');

  const getChampionForBadge = (badgeId) => {
    const sdgDimensionId = `sdg_${String(badgeId).replace(/^sdg_/i, '').replace(/^0+/, '')}`;
    return championDimensions.find((r) => r.dimension === sdgDimensionId) || null;
  };

  return (
    <div className="rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
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
        <>
          <div
            className="max-h-[420px] overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
          >
            <div className="grid grid-cols-3 gap-2 justify-items-center">
              {badges.map((badge) => {
                const champion = getChampionForBadge(badge.id);
                const content = (
                  <BadgeDisplay badge={badge} size="small" />
                );
                return (
                  <div key={badge.id} className="w-full max-w-[70px] flex justify-center">
                    {champion ? (
                      <ChampionBadge
                        dimensionLabel={champion.dimensionLabel || `SDG ${badge.id}`}
                        totalChampionships={champion.totalChampionships || 0}
                        isCurrentChampion={champion.isCurrentChampion}
                      >
                        {content}
                      </ChampionBadge>
                    ) : (
                      content
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-[#9ca3af] dark:text-text-tertiary text-center mt-2">
            {badges.length} badges earned
          </p>
        </>
      )}
    </div>
  );
}
