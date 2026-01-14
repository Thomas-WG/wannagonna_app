import { useMemo } from 'react';

/**
 * Hook for paginating activities list
 * 
 * @param {Array} activities - The full list of activities to paginate
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Object} Pagination data including paginated items, total pages, etc.
 */
export function useActivitiesPagination(activities, currentPage, itemsPerPage) {
  const paginationData = useMemo(() => {
    if (!activities || activities.length === 0) {
      return {
        paginatedActivities: [],
        totalPages: 0,
        totalItems: 0,
        startIndex: 0,
        endIndex: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    const totalItems = activities.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedActivities = activities.slice(startIndex, endIndex);

    return {
      paginatedActivities,
      totalPages,
      totalItems,
      startIndex: startIndex + 1, // 1-indexed for display
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [activities, currentPage, itemsPerPage]);

  return paginationData;
}

