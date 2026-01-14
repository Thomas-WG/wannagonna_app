import { useQuery } from '@tanstack/react-query';
import { fetchActivitiesForVolunteer } from '@/utils/crudApplications';

/**
 * React Query hook for fetching volunteer activities (accepted applications)
 * @param {string} userId - User ID
 * @returns {Object} Query result with volunteer activities, loading, and error states
 */
export function useVolunteerActivities(userId) {
  return useQuery({
    queryKey: ['volunteerActivities', userId],
    queryFn: async () => {
      const activities = await fetchActivitiesForVolunteer(userId);
      // Filter activities to show only Open activities with accepted applications
      const open = activities.filter((a) => a.status === 'Open');
      return {
        all: activities,
        open: open,
      };
    },
    enabled: !!userId, // Only run query if userId exists
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
}

