'use client';

import { useTranslations } from 'next-intl';
import Avatar from './Avatar';
import { formatScore } from './leaderboardConstants';

export default function MyRankBanner({ entries, currentUserId }) {
  const t = useTranslations('Leaderboard');
  const me = entries.find((e) => e.userId === currentUserId);
  if (!me) return null;

  const above = entries.find((e) => e.currentRank === me.currentRank - 1);
  const gap = above ? above.activityScore - me.activityScore : 0;

  if (me.isCurrentChampion) {
    return (
      <div className="mt-2.5 py-2.5 px-3.5 bg-gradient-to-br from-[#F08602]/9 to-[#F08602]/4 border border-[#F08602]/28 rounded-xl flex items-center gap-2.5">
        <span className="text-2xl">👑</span>
        <div>
          <div className="font-heading font-extrabold text-[13px] text-[#F08602]">
            {t('youAreChampion')}
          </div>
          <div className="text-sm text-text-secondary dark:text-text-secondary mt-1">
            {t('championKeepGoing')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2.5 py-2.5 px-3.5 bg-primary-50/40 dark:bg-primary-900/10 border border-primary-200/40 dark:border-primary-700/20 rounded-xl flex items-center gap-2.5">
      <Avatar
        userId={me.userId}
        displayName={me.displayName}
        profilePicture={me.profilePicture}
        size={32}
      />
      <div className="flex-1 min-w-0">
        <div className="font-heading font-bold text-[13px] text-text-primary dark:text-text-primary">
          {t('you')} · <span className="text-primary-600 dark:text-primary-400">#{me.currentRank}</span>
          <span className="font-light text-text-secondary dark:text-text-secondary text-xs">
            {' '}
            — {formatScore(me.activityScore)} pts
          </span>
        </div>
        {above && (
          <div className="text-sm text-text-secondary dark:text-text-secondary mt-0.5">
            ↑ <strong className="text-semantic-error">{formatScore(gap)} pts</strong>{' '}
            {t('behindRank', { rank: me.currentRank - 1 })}
          </div>
        )}
      </div>
    </div>
  );
}
