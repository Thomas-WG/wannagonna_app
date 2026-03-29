'use client';

import { useTranslations } from 'next-intl';
import Avatar from './Avatar';
import { formatScore } from './leaderboardConstants';

export default function MyRankBanner({ entries, currentUserId }) {
  const t = useTranslations('Leaderboard');
  const me = entries.find((e) => e.user_id === currentUserId);
  if (!me) return null;

  const above = entries.find((e) => e.current_rank === me.current_rank - 1);
  const gap = above ? above.activity_score - me.activity_score : 0;

  if (me.is_current_champion) {
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
        userId={me.user_id}
        displayName={me.display_name}
        profilePicture={me.profile_picture}
        size={32}
      />
      <div className="flex-1 min-w-0">
        <div className="font-heading font-bold text-[13px] text-text-primary dark:text-text-primary">
          {t('you')} · <span className="text-primary-600 dark:text-primary-400">#{me.current_rank}</span>
          <span className="font-light text-text-secondary dark:text-text-secondary text-xs">
            {' '}
            — {formatScore(me.activity_score)} pts
          </span>
        </div>
        {above && (
          <div className="text-sm text-text-secondary dark:text-text-secondary mt-0.5">
            ↑ <strong className="text-semantic-error">{formatScore(gap)} pts</strong>{' '}
            {t('behindRank', { rank: me.current_rank - 1 })}
          </div>
        )}
      </div>
    </div>
  );
}
