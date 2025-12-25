import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApplicationsByUserId } from '@/utils/crudApplications';
import { useMemo } from 'react';

/**
 * React Query hook for fetching and caching application statuses for all activities
 * Batch fetches all user applications and creates a map of activityId -> hasApplied
 * 
 * @param {string} userId - User ID
 * @returns {Object} Query result with applicationStatuses map, loading, and error states
 */
export function useApplicationStatuses(userId) {
  const queryClient = useQueryClient();

  // Fetch all user applications
  const {
    data: applications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userApplications', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await fetchApplicationsByUserId(userId);
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Create a map of activityId -> hasApplied
  // Only includes non-cancelled applications
  const applicationStatuses = useMemo(() => {
    if (!applications || applications.length === 0) {
      return {};
    }

    const statusMap = {};
    applications.forEach((app) => {
      // Only mark as applied if the application is not cancelled
      if (app.status !== 'cancelled' && app.activityId) {
        statusMap[app.activityId] = true;
      }
    });

    return statusMap;
  }, [applications]);

  // Helper function to invalidate cache (useful after creating a new application)
  const invalidateStatuses = () => {
    queryClient.invalidateQueries({ queryKey: ['userApplications', userId] });
  };

  return {
    applicationStatuses,
    isLoading,
    error,
    invalidateStatuses,
  };
}

