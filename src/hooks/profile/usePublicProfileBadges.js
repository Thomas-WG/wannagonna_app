import { useQuery } from '@tanstack/react-query';
import { fetchUserBadges } from '@/utils/crudBadges';

/**
 * React Query hook for fetching user badges with caching
 * @param {string} userId - User ID
 * @returns {Object} Query result with badges, loading, and error states
 */
export function usePublicProfileBadges(userId) {
  return useQuery({
    queryKey: ['publicProfileBadges', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        return await fetchUserBadges(userId);
      } catch (err) {
        console.error('Error fetching badges:', err);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
