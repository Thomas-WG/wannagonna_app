import { useHistoryActivities } from '@/hooks/dashboard/useHistoryActivities';

/**
 * React Query hook for fetching history activities for public profile
 * Reuses existing useHistoryActivities hook for consistency
 * @param {string} userId - User ID
 * @returns {Object} Query result with activities, loading, and error states
 */
export function usePublicProfileActivities(userId) {
  return useHistoryActivities(userId);
}
