'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchActivitiesByCriteria } from '@/utils/crudActivities';
import { fetchApplicationsForActivity } from '@/utils/crudApplications';

/**
 * React Query hook for fetching activity analytics
 * Aggregates metrics from activities and applications
 * 
 * @param {string} organizationId - Organization ID
 * @param {string} timeRange - Time range filter ('7d', '30d', '90d', 'all')
 * @returns {Object} Analytics data with metrics and charts data
 */
export function useActivityAnalytics(organizationId, timeRange = 'all') {
  // Fetch activities
  const {
    data: activities = [],
    isLoading: isLoadingActivities,
    error: activitiesError,
  } = useQuery({
    queryKey: ['npoDashboardActivities', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      return await fetchActivitiesByCriteria(organizationId, 'any', 'any');
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Calculate date filter
  const dateFilter = useMemo(() => {
    if (timeRange === 'all') return null;
    const now = new Date();
    const days = parseInt(timeRange);
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return cutoffDate;
  }, [timeRange]);

  // Filter activities by date range
  const filteredActivities = useMemo(() => {
    if (!dateFilter) return activities;
    return activities.filter((activity) => {
      const activityDate = activity.creation_date?.toDate
        ? activity.creation_date.toDate()
        : activity.creation_date?.seconds
        ? new Date(activity.creation_date.seconds * 1000)
        : new Date(activity.creation_date);
      return activityDate >= dateFilter;
    });
  }, [activities, dateFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalActivities = filteredActivities.length;
    const totalApplications = filteredActivities.reduce(
      (sum, activity) => sum + (activity.applicants || 0),
      0
    );
    const totalXP = filteredActivities.reduce(
      (sum, activity) => sum + (activity.xp_reward || 0),
      0
    );
    const averageXP = totalActivities > 0 ? totalXP / totalActivities : 0;
    const averageApplications = totalActivities > 0 ? totalApplications / totalActivities : 0;

    // Status breakdown
    const statusBreakdown = filteredActivities.reduce(
      (acc, activity) => {
        const status = activity.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {}
    );

    // Type breakdown
    const typeBreakdown = filteredActivities.reduce(
      (acc, activity) => {
        const type = activity.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {}
    );

    // XP distribution
    const xpDistribution = filteredActivities.reduce(
      (acc, activity) => {
        const xp = activity.xp_reward || 0;
        const range =
          xp < 50 ? '0-49' : xp < 100 ? '50-99' : xp < 200 ? '100-199' : '200+';
        acc[range] = (acc[range] || 0) + 1;
        return acc;
      },
      {}
    );

    return {
      totalActivities,
      totalApplications,
      totalXP,
      averageXP: Math.round(averageXP),
      averageApplications: Math.round(averageApplications * 10) / 10,
      statusBreakdown,
      typeBreakdown,
      xpDistribution,
    };
  }, [filteredActivities]);

  // Chart data
  const chartData = useMemo(() => {
    return {
      statusChart: Object.entries(metrics.statusBreakdown).map(([status, count]) => ({
        name: status,
        value: count,
      })),
      typeChart: Object.entries(metrics.typeBreakdown).map(([type, count]) => ({
        name: type,
        value: count,
      })),
      xpChart: Object.entries(metrics.xpDistribution).map(([range, count]) => ({
        name: range,
        value: count,
      })),
    };
  }, [metrics]);

  return {
    metrics,
    chartData,
    activities: filteredActivities,
    isLoading: isLoadingActivities,
    error: activitiesError,
  };
}

