'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ActivityScoreTooltip() {
  const [visible, setVisible] = useState(false);
  const t = useTranslations('Leaderboard');

  return (
    <span className="relative inline-flex items-center ml-1">
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 text-[10px] font-bold inline-flex items-center justify-center cursor-help"
      >
        i
      </span>
      {visible && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 dark:bg-gray-950 text-white px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-nowrap shadow-xl z-[200] font-light"
          role="tooltip"
        >
          {t('activityScoreTooltip')}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-950" />
        </div>
      )}
    </span>
  );
}
