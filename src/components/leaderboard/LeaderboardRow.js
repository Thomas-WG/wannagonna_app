'use client';

import { useTranslations } from 'next-intl';
import Avatar from './Avatar';
import {
  formatScore,
  getRankDisplay,
} from './leaderboardConstants';

export default function LeaderboardRow({
  entry,
  index,
  isMe,
  isLast,
  topScore,
  onOpenProfile,
}) {
  const t = useTranslations('Leaderboard');
  const medal = getRankDisplay(entry.current_rank);
  const isTop3 = entry.current_rank <= 3;
  const barPct = topScore > 0
    ? Math.round((entry.activity_score / topScore) * 100)
    : 0;
  const canOpenProfile = Boolean(entry.user_id && onOpenProfile);
  const openProfile = () => {
    if (canOpenProfile) {
      onOpenProfile(entry.user_id);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl mb-0.5 last:mb-0 transition-colors ${
        isMe
          ? 'bg-gradient-to-br from-primary-50/70 to-accent-50/40 dark:from-primary-900/20 dark:to-accent-900/10 border border-primary-200/50 dark:border-primary-700/30'
          : 'border border-transparent hover:bg-black/5 dark:hover:bg-white/5'
      }`}
      style={{
        animation: `rowIn 0.38s ${index * 0.055}s ease both`,
      }}
    >
      <div className="w-[30px] text-center flex-shrink-0">
        {medal ? (
          <span className="text-lg">{medal.emoji}</span>
        ) : (
          <span className="font-heading font-bold text-[13px] text-text-tertiary dark:text-text-tertiary">
            #{entry.current_rank}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={openProfile}
        disabled={!canOpenProfile}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-default"
        aria-label={`Open profile of ${entry.display_name || 'Anonymous'}`}
      >
        <Avatar
          displayName={entry.display_name}
          profilePicture={entry.profile_picture}
          isChampion={entry.is_current_champion}
        />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <button
            type="button"
            onClick={openProfile}
            disabled={!canOpenProfile}
            className={`font-heading text-[13px] overflow-hidden text-ellipsis whitespace-nowrap text-left hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm disabled:no-underline disabled:cursor-default ${
              isMe ? 'font-extrabold text-primary-600 dark:text-primary-400' : 'font-semibold text-text-primary dark:text-text-primary'
            }`}
            aria-label={`Open profile of ${entry.display_name || 'Anonymous'}`}
          >
            {entry.display_name || 'Anonymous'}
            {isMe && (
              <span className="font-normal text-primary-600/75 dark:text-primary-400/75 text-[11px]"> · {t('you')}</span>
            )}
          </button>
          {entry.is_current_champion && (
            <span className="text-[9px] font-bold uppercase tracking-widest font-heading text-[#F08602] bg-[#F08602]/10 border border-[#F08602]/30 py-0.5 px-1.5 rounded-full flex-shrink-0">
              Champion
            </span>
          )}
          {!entry.is_current_champion && entry.total_championships > 0 && (
            <span className="text-[10px] text-text-tertiary dark:text-text-tertiary flex-shrink-0">
              ×{entry.total_championships} 🏆
            </span>
          )}
        </div>
        <div className="h-1 bg-black/6 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${barPct}%`,
              background: isTop3
                ? 'linear-gradient(90deg, #F08602, #CD1436)'
                : isMe
                ? 'linear-gradient(90deg, #009AA2, #51AC31)'
                : 'linear-gradient(90deg, rgba(0,154,162,0.67), rgba(81,172,49,0.67))',
            }}
          />
        </div>
      </div>

      <div className="text-right flex-shrink-0 min-w-[44px]">
        <div
          className={`font-heading font-extrabold text-sm ${
            isTop3 ? 'text-[#F08602]' : isMe ? 'text-primary-600 dark:text-primary-400' : 'text-text-primary dark:text-text-primary'
          }`}
        >
          {formatScore(entry.activity_score)}
        </div>
        <div className="text-[9.5px] text-text-tertiary dark:text-text-tertiary mt-0.5 tracking-wide">
          pts
        </div>
      </div>
    </div>
  );
}
