import { useMemo } from 'react';

/**
 * Custom hook for sorting activities
 * @param {Array} activities - Array of activities to sort
 * @param {string} sortBy - Sort option (newest, oldest, xp_high, xp_low, applicants_high, applicants_low, alphabetical)
 * @returns {Array} Sorted activities
 */
export function useActivitySort(activities, sortBy) {
  return useMemo(() => {
    if (!activities || activities.length === 0) return [];

    const sorted = [...activities];

    const getDate = (date) => {
      if (!date) return new Date(0);
      if (date.seconds) return new Date(date.seconds * 1000);
      if (date.toDate) return date.toDate();
      if (date instanceof Date) return date;
      return new Date(date);
    };

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = getDate(a.start_date);
          const dateB = getDate(b.start_date);
          return dateB - dateA;
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = getDate(a.start_date);
          const dateB = getDate(b.start_date);
          return dateA - dateB;
        });
      case 'xp_high':
        return sorted.sort((a, b) => (b.xp_reward || 0) - (a.xp_reward || 0));
      case 'xp_low':
        return sorted.sort((a, b) => (a.xp_reward || 0) - (b.xp_reward || 0));
      case 'applicants_high':
        return sorted.sort((a, b) => (b.applicants || 0) - (a.applicants || 0));
      case 'applicants_low':
        return sorted.sort((a, b) => (a.applicants || 0) - (b.applicants || 0));
      case 'alphabetical':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      default:
        return sorted;
    }
  }, [activities, sortBy]);
}

