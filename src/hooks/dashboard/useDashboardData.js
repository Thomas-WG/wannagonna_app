import { useMemo } from 'react';
import { useMemberProfile } from './useMemberProfile';
import { useApplications } from './useApplications';
import { useVolunteerActivities } from './useVolunteerActivities';
import { useHistoryActivities } from './useHistoryActivities';

/**
 * Composes all dashboard data fetching hooks
 * Returns combined state with loading, error, and data
 * @param {string} userId - User ID
 * @returns {Object} Combined dashboard data state
 */
export function useDashboardData(userId) {
  const profileQuery = useMemberProfile(userId);
  const applicationsQuery = useApplications(userId);
  const volunteerActivitiesQuery = useVolunteerActivities(userId);
  const historyActivitiesQuery = useHistoryActivities(userId);

  // Calculate stats from all activities
  const stats = useMemo(() => {
    const allActivities = volunteerActivitiesQuery.data?.all || [];
    const localActivities = allActivities.filter((a) => a.type === 'local');
    const onlineActivities = allActivities.filter((a) => a.type === 'online');
    const eventActivities = allActivities.filter((a) => a.type === 'event');

    // Count closed activities from both current activities and history
    const closedFromActivities = allActivities.filter(
      (a) => a.status === 'Closed' || a.status === 'Completed'
    );
    const closedActivitiesCount =
      closedFromActivities.length + (historyActivitiesQuery.data?.length || 0);

    return {
      total_local_activities: localActivities.length,
      total_online_activities: onlineActivities.length,
      total_events: eventActivities.length,
      total_applications: applicationsQuery.data?.length || 0,
      closedActivities: closedActivitiesCount,
    };
  }, [
    volunteerActivitiesQuery.data,
    historyActivitiesQuery.data,
    applicationsQuery.data,
  ]);

  // Calculate gamification data from profile
  const gamificationData = useMemo(() => {
    if (!profileQuery.data) {
    return {
      level: 1,
      current_xp: 0,
      total_xp: 0,
      badges_count: 0,
    };
    }

    const totalXP = profileQuery.data.xp || 0;
    const level = Math.floor(totalXP / 100) + 1;
    const currentXP = totalXP % 100;

    const badgesArray = profileQuery.data.badges;
    const badgesCount = Array.isArray(badgesArray) ? badgesArray.length : 0;

    return {
      level,
      current_xp: currentXP,
      total_xp: totalXP,
      badges_count: badgesCount,
    };
  }, [profileQuery.data]);

  // Combined loading state
  const isLoading =
    profileQuery.isLoading ||
    applicationsQuery.isLoading ||
    volunteerActivitiesQuery.isLoading ||
    historyActivitiesQuery.isLoading;

  // Combined error state
  const error =
    profileQuery.error ||
    applicationsQuery.error ||
    volunteerActivitiesQuery.error ||
    historyActivitiesQuery.error;

  // All activities for view (open + history, deduplicated)
  const allActivitiesForView = useMemo(() => {
    const openActivities = volunteerActivitiesQuery.data?.open || [];
    const historyActivities = historyActivitiesQuery.data || [];

    // Deduplicate by activity ID
    const combined = [...openActivities, ...historyActivities];
    const seenIds = new Set();
    return combined.filter((activity) => {
      const activityId = activity.activity_id;
      if (seenIds.has(activityId)) {
        return false;
      }
      seenIds.add(activityId);
      return true;
    });
  }, [volunteerActivitiesQuery.data, historyActivitiesQuery.data]);

  // Applications formatted for display
  const allApplications = useMemo(() => {
    if (!applicationsQuery.data) return [];

    return applicationsQuery.data
      .filter((app) => app.activity !== null)
      .map((app) => ({
        ...app.activity,
        applicationStatus: app.status,
        application_id: app.application_id,
        applicationData: app,
        appliedAt: app.created_at,
      }));
  }, [applicationsQuery.data]);

  return {
    // Data
    profileData: profileQuery.data,
    applications: applicationsQuery.data || [],
    applicationsWithActivities: applicationsQuery.data || [],
    volunteerActivities: volunteerActivitiesQuery.data?.all || [],
    openActivities: volunteerActivitiesQuery.data?.open || [],
    historyActivities: historyActivitiesQuery.data || [],
    allActivitiesForView,
    allApplications,
    stats,
    gamificationData,

    // Loading states
    isLoading,
    isProfileLoading: profileQuery.isLoading,
    isApplicationsLoading: applicationsQuery.isLoading,
    isVolunteerActivitiesLoading: volunteerActivitiesQuery.isLoading,
    isHistoryActivitiesLoading: historyActivitiesQuery.isLoading,

    // Error states
    error,
    profileError: profileQuery.error,
    applicationsError: applicationsQuery.error,
    volunteerActivitiesError: volunteerActivitiesQuery.error,
    historyActivitiesError: historyActivitiesQuery.error,

    // Refetch functions
    refetchProfile: profileQuery.refetch,
    refetchApplications: applicationsQuery.refetch,
    refetchVolunteerActivities: volunteerActivitiesQuery.refetch,
    refetchHistoryActivities: historyActivitiesQuery.refetch,
    refetchAll: () => {
      profileQuery.refetch();
      applicationsQuery.refetch();
      volunteerActivitiesQuery.refetch();
      historyActivitiesQuery.refetch();
    },
  };
}

