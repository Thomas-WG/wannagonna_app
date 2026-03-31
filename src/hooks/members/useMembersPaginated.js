import { useQuery } from '@tanstack/react-query';
import { getMembersListViaFunction } from '@/utils/membersService';
import { getMembersCount } from '@/utils/crudMemberProfile';
import { useMemo } from 'react';

/**
 * React Query hook for fetching and caching paginated members
 * Uses Cloud Function getMembersList (sanitized, no PII) with server-side filtering
 * and sorting, then paginate client-side for page numbers.
 *
 * @param {number} page - Current page number (1-indexed)
 * @param {number} pageSize - Number of items per page
 * @param {Object} filters - Filter object with country (optional)
 * @param {string} sortBy - Sort option: 'name_az', 'name_za', 'joined_newest', 'joined_oldest'
 * @returns {Object} Query result with members, totalCount, pagination info, loading, and error states
 */
export function useMembersPaginated(page = 1, pageSize = 20, filters = {}, sortBy = 'name_az') {
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: ['members', 'paginated', filters, sortBy],
    queryFn: async () => {
      const allMembers = [];
      let lastDocId = null;
      let hasMore = true;
      const batchSize = 100;
      const maxMembers = 5000;

      while (hasMore && allMembers.length < maxMembers) {
        const result = await getMembersListViaFunction(filters, sortBy, batchSize, lastDocId);

        allMembers.push(...result.members);
        hasMore = result.hasNextPage;
        lastDocId = result.lastDocId;

        if (result.members.length < batchSize) {
          hasMore = false;
        }
      }

      return allMembers;
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get total count (cached separately for performance)
  const {
    data: totalCount = 0,
    isLoading: isLoadingCount,
  } = useQuery({
    queryKey: ['members', 'count', filters],
    queryFn: async () => {
      return await getMembersCount(filters);
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Calculate pagination
  const paginationData = useMemo(() => {
    if (!membersData) {
      return {
        paginatedMembers: [],
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        startIndex: 0,
        endIndex: 0,
      };
    }

    const totalItems = membersData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedMembers = membersData.slice(startIndex, endIndex);

    return {
      paginatedMembers,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      startIndex: startIndex + 1, // 1-indexed for display
      endIndex,
    };
  }, [membersData, page, pageSize]);

  return {
    members: paginationData.paginatedMembers,
    totalCount: totalCount || paginationData.totalItems,
    totalPages: paginationData.totalPages,
    hasNextPage: paginationData.hasNextPage,
    hasPreviousPage: paginationData.hasPreviousPage,
    startIndex: paginationData.startIndex,
    endIndex: paginationData.endIndex,
    isLoading: isLoadingMembers || isLoadingCount,
    error: membersError,
  };
}

