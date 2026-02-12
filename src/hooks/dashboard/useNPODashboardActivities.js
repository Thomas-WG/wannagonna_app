'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchActivitiesByCriteria, updateActivityStatus } from '@/utils/crudActivities';
import { useMemo } from 'react';

/**
 * React Query hook for fetching NPO dashboard activities with caching
 * 
 * @param {string} organizationId - Organization ID to fetch activities for
 * @returns {Object} Query result with activities, loading, error states, and mutation functions
 */
export function useNPODashboardActivities(organizationId) {
  const queryClient = useQueryClient();

  // Fetch activities with React Query caching
  const {
    data: activities = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['npoDashboardActivities', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      return await fetchActivitiesByCriteria(organizationId, 'any', 'any');
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch when returning to dashboard (e.g. after creating an activity)
  });

  // Mutation for updating activity status with optimistic updates
  const updateStatusMutation = useMutation({
    mutationFn: async ({ activityId, newStatus }) => {
      await updateActivityStatus(activityId, newStatus);
      return { activityId, newStatus };
    },
    onMutate: async ({ activityId, newStatus }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['npoDashboardActivities', organizationId] });

      // Snapshot previous value
      const previousActivities = queryClient.getQueryData(['npoDashboardActivities', organizationId]);

      // Optimistically update
      queryClient.setQueryData(['npoDashboardActivities', organizationId], (old) => {
        if (!old) return old;
        return old.map((activity) =>
          activity.id === activityId ? { ...activity, status: newStatus } : activity
        );
      });

      return { previousActivities };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousActivities) {
        queryClient.setQueryData(['npoDashboardActivities', organizationId], context.previousActivities);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['npoDashboardActivities', organizationId] });
    },
  });

  // Helper to update activity status
  const handleStatusChange = (activityId, newStatus) => {
    updateStatusMutation.mutate({ activityId, newStatus });
  };

  // Calculate metrics from activities
  const metrics = useMemo(() => {
    const totalActivities = activities.length;
    const totalOnline = activities.filter((a) => a.type === 'online').length;
    const totalLocal = activities.filter((a) => a.type === 'local').length;
    const totalEvents = activities.filter((a) => a.type === 'event').length;
    const closedCount = activities.filter((a) => a.status === 'Closed').length;

    return {
      totalActivities,
      totalOnline,
      totalLocal,
      totalEvents,
      closedCount,
    };
  }, [activities]);

  return {
    activities,
    isLoading,
    error,
    refetch,
    handleStatusChange,
    isUpdatingStatus: updateStatusMutation.isPending,
    metrics,
  };
}

