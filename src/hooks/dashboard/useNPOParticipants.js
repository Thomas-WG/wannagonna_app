import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  fetchParticipantRecords,
  batchGetMemberProfiles,
} from '@/utils/crudNPOParticipants';

/**
 * Fetches NPO participant records, merges member profiles (displayName, profilePicture),
 * applies client-side sort when sortBy is name, and paginates.
 * @param {string} organizationId - NPO organization ID
 * @param {Object} filters - { activityType?: 'all'|'online'|'local'|'event' }
 * @param {string} sortBy - 'name_az' | 'name_za' | 'participated_newest' | 'participated_oldest'
 * @param {number} page - Current page (1-indexed)
 * @param {number} pageSize - Page size
 * @returns {Object} { participants, totalCount, totalPages, hasNextPage, hasPreviousPage, startIndex, endIndex, isLoading, error }
 */
export function useNPOParticipants(
  organizationId,
  filters = {},
  sortBy = 'participated_newest',
  page = 1,
  pageSize = 20
) {
  const activityType = filters.activityType ?? 'all';

  const {
    data: mergedList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['npoParticipants', organizationId, activityType, sortBy],
    queryFn: async () => {
      const records = await fetchParticipantRecords(organizationId, {
        activityType,
        sortBy:
          sortBy === 'name_az' || sortBy === 'name_za'
            ? 'participated_newest'
            : sortBy,
      });
      if (!records.length) return [];
      const userIds = records.map((r) => r.userId);
      const profiles = await batchGetMemberProfiles(userIds);
      const merged = records.map((r) => ({
        ...r,
        displayName: profiles[r.userId]?.displayName ?? '',
        profilePicture: profiles[r.userId]?.profilePicture ?? '',
        email: profiles[r.userId]?.email ?? '',
      }));
      if (sortBy === 'name_az') {
        merged.sort((a, b) =>
          (a.displayName || '').localeCompare(b.displayName || '', undefined, { sensitivity: 'base' })
        );
      } else if (sortBy === 'name_za') {
        merged.sort((a, b) =>
          (b.displayName || '').localeCompare(a.displayName || '', undefined, { sensitivity: 'base' })
        );
      }
      return merged;
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const pagination = useMemo(() => {
    if (!mergedList) {
      return {
        participants: [],
        allParticipants: [],
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        startIndex: 0,
        endIndex: 0,
        totalCount: 0,
      };
    }
    const totalCount = mergedList.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, totalCount);
    const participants = mergedList.slice(start, end);
    return {
      participants,
      allParticipants: mergedList,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      startIndex: totalCount ? start + 1 : 0,
      endIndex: end,
    };
  }, [mergedList, page, pageSize]);

  return {
    ...pagination,
    isLoading,
    error,
  };
}
