import { useQuery } from '@tanstack/react-query';
import { fetchHistoryActivities } from '@/utils/crudActivities';

/**
 * React Query hook for fetching history activities (closed activities)
 * @param {string} userId - User ID
 * @returns {Object} Query result with history activities, loading, and error states
 */
export function useHistoryActivities(userId) {
  return useQuery({
    queryKey: ['historyActivities', userId],
    queryFn: async () => {
      return await fetchHistoryActivities(userId);
    },
    enabled: !!userId, // Only run query if userId exists
    staleTime: 60 * 1000, // Consider data fresh for 1 minute (history changes less frequently)
  });
}

