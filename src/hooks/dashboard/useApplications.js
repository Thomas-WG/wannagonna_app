import { useQuery } from '@tanstack/react-query';
import { fetchApplicationsByUserId } from '@/utils/crudApplications';
import { fetchActivityById } from '@/utils/crudActivities';

/**
 * React Query hook for fetching applications with their associated activities
 * @param {string} userId - User ID
 * @returns {Object} Query result with applications with activities, loading, and error states
 */
export function useApplications(userId) {
  return useQuery({
    queryKey: ['applications', userId],
    queryFn: async () => {
      // Fetch applications
      const userApplications = await fetchApplicationsByUserId(userId);

      // Fetch activities for each application and combine
      const appsWithActivities = await Promise.all(
        userApplications.map(async (app) => {
          try {
            const activity = await fetchActivityById(app.activityId);
            if (activity) {
              return {
                ...app,
                activity: activity,
              };
            }
            return { ...app, activity: null };
          } catch (error) {
            console.error(`Error fetching activity ${app.activityId}:`, error);
            return { ...app, activity: null };
          }
        })
      );

      // Sort applications: open activities first, then by status (pending, accepted, rejected)
      const sortedApps = appsWithActivities.sort((a, b) => {
        const aActivityStatus = a.activity?.status || '';
        const bActivityStatus = b.activity?.status || '';

        // First sort by activity status: Open activities first
        if (aActivityStatus === 'Open' && bActivityStatus !== 'Open') return -1;
        if (aActivityStatus !== 'Open' && bActivityStatus === 'Open') return 1;

        // Then sort by application status: pending, accepted, rejected
        const statusOrder = { pending: 0, accepted: 1, rejected: 2 };
        const aStatusOrder = statusOrder[a.status] ?? 3;
        const bStatusOrder = statusOrder[b.status] ?? 3;

        if (aStatusOrder !== bStatusOrder) {
          return aStatusOrder - bStatusOrder;
        }

        // Finally sort by creation date (newest first)
        const aDate = a.createdAt?.getTime?.() || 0;
        const bDate = b.createdAt?.getTime?.() || 0;
        return bDate - aDate;
      });

      return sortedApps;
    },
    enabled: !!userId, // Only run query if userId exists
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
}

