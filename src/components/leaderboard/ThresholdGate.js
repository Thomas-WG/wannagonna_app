'use client';

import { useTranslations } from 'next-intl';
import { THRESHOLD } from './leaderboardConstants';

export default function ThresholdGate({ label, current }) {
  const t = useTranslations('Leaderboard');
  const pct = Math.round((current / THRESHOLD) * 100);

  return (
    <div className="text-center py-11 px-5 bg-gradient-to-br from-primary-50/30 to-accent-50/20 dark:from-primary-900/10 dark:to-accent-900/10 border-2 border-dashed border-primary-200/50 dark:border-primary-700/30 rounded-2xl">
      <div className="text-4xl mb-3">🔒</div>
      <div className="font-heading font-extrabold text-base text-text-primary dark:text-text-primary mb-2">
        {t('thresholdGateTitle', { label })}
      </div>
      <div className="text-sm text-text-secondary dark:text-text-secondary mb-6 leading-relaxed">
        {t('thresholdGateDesc')}
        <br />
        <strong className="text-primary-600 dark:text-primary-400">
          {current} {t('volunteersAlready')}
        </strong>
      </div>
      <div className="max-w-[200px] mx-auto">
        <div className="h-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10.5px] text-text-tertiary dark:text-text-tertiary mt-1">
          <span>{current} {t('volunteers')}</span>
          <span>{t('goal')}: {THRESHOLD}</span>
        </div>
      </div>
    </div>
  );
}
