'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOrganizationById } from '@/utils/crudOrganizations';
import { countPendingApplicationsForOrganization } from '@/utils/crudApplications';

/**
 * React Query hook for fetching NPO dashboard KPI data
 * Consolidates organization data and pending applications count
 * 
 * @param {string} organizationId - Organization ID
 * @returns {Object} Query result with orgData, loading, and error states
 */
export function useNPODashboardData(organizationId) {
  // Fetch organization data
  const {
    data: orgData,
    isLoading: isLoadingOrg,
    error: orgError,
  } = useQuery({
    queryKey: ['npoOrganization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      return await fetchOrganizationById(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch pending applications count
  const {
    data: pendingCount = 0,
    isLoading: isLoadingPending,
    error: pendingError,
  } = useQuery({
    queryKey: ['npoPendingApplications', organizationId],
    queryFn: async () => {
      if (!organizationId) return 0;
      return await countPendingApplicationsForOrganization(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch on focus to catch new applications
  });

  // Combine data
  const combinedData = orgData
    ? {
        ...orgData,
        totalNewApplications: pendingCount,
      }
    : {
        totalOnlineActivities: 0,
        totalLocalActivities: 0,
        totalEvents: 0,
        totalNewApplications: 0,
        totalParticipants: 0,
      };

  return {
    orgData: combinedData,
    isLoading: isLoadingOrg || isLoadingPending,
    error: orgError || pendingError,
  };
}

