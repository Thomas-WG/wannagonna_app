import { useMemo } from 'react';

/**
 * Custom hook for filtering activities
 * @param {Array} activities - Array of activities to filter
 * @param {Object} filters - Filter object with type, category, status
 * @returns {Array} Filtered activities
 */
export function useActivityFilters(activities, filters) {
  return useMemo(() => {
    if (!activities || activities.length === 0) return [];

    let filtered = [...activities];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter((activity) => activity.type === filters.type);
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter((activity) => activity.category === filters.category);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter((activity) => activity.status === filters.status);
    }

    return filtered;
  }, [activities, filters]);
}

