import { useQuery } from '@tanstack/react-query';
import { collection, getCountFromServer, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { db } from 'firebaseConfig';

/**
 * React Query hook for fetching and caching organizations with server-side
 * filtering and sorting, then paginating client-side.
 *
 * Filters:
 * - country: ISO country code or 'all'
 * - language: ISO language code or 'all'
 * - sdg: SDG identifier or 'all'
 *
 * Sorting:
 * - name_az (default)
 * - name_za
 *
 * Note on Firestore structure:
 * - This implementation assumes that:
 *   - `organizations` collection exists
 *   - `country` is stored as a simple string field
 *   - `languages` is stored as an array field of language codes
 *   - `sdgs` is stored as an array field of SDG identifiers
 *   - `name` is either a simple string or a localized object; if it's an object,
 *     we sort by `name.en` as a reasonable default.
 *
 * If your schema differs, adjust the query builders accordingly.
 *
 * @param {number} page - Current page number (1-indexed)
 * @param {number} pageSize - Number of items per page
 * @param {Object} filters - { country, language, sdg }
 * @param {string} sortBy - 'name_az' | 'name_za'
 * @returns {Object} Query result with organizations, totalCount, pagination info, loading, and error states
 */
export function useOrganizationsPaginated(page = 1, pageSize = 20, filters = {}, sortBy = 'name_az') {
  const normalizedFilters = {
    country: filters.country || 'all',
    language: filters.language || 'all',
    sdg: filters.sdg || 'all',
  };

  const sortField = 'name.en' in (filters.exampleOrganization || {}) ? 'name.en' : 'name';

  // Build Firestore query constraints based on filters and sort
  const buildBaseQuery = () => {
    const organizationsRef = collection(db, 'organizations');
    const constraints = [];

    // Country filter
    if (normalizedFilters.country && normalizedFilters.country !== 'all') {
      constraints.push(where('country', '==', normalizedFilters.country));
    }

    // Language filter (array-contains)
    if (normalizedFilters.language && normalizedFilters.language !== 'all') {
      constraints.push(where('languages', 'array-contains', normalizedFilters.language));
    }

    // SDG filter (array-contains)
    if (normalizedFilters.sdg && normalizedFilters.sdg !== 'all') {
      constraints.push(where('sdgs', 'array-contains', normalizedFilters.sdg));
    }

    // Sort by name ascending for Firestore; we will reverse client-side for Z-A
    constraints.push(orderBy(sortField, 'asc'));

    return query(organizationsRef, ...constraints);
  };

  // Fetch all matching organizations in batches for pagination
  const {
    data: organizationsData,
    isLoading: isLoadingOrganizations,
    error: organizationsError,
  } = useQuery({
    queryKey: ['organizations', 'paginated', normalizedFilters, sortBy],
    queryFn: async () => {
      const baseQuery = buildBaseQuery();

      const allOrgs = [];
      let lastDoc = null;
      let hasMore = true;
      const batchSize = 100;
      const maxItems = 5000;

      while (hasMore && allOrgs.length < maxItems) {
        const q = lastDoc
          ? query(baseQuery, startAfter(lastDoc), limit(batchSize))
          : query(baseQuery, limit(batchSize));

        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
          allOrgs.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        const docs = snapshot.docs;
        if (docs.length === batchSize) {
          lastDoc = docs[docs.length - 1];
          hasMore = true;
        } else {
          hasMore = false;
        }
      }

      // Apply client-side Z-A sort if needed
      if (sortBy === 'name_za') {
        allOrgs.sort((a, b) => {
          const aName = typeof a.name === 'object' ? a.name.en || '' : a.name || '';
          const bName = typeof b.name === 'object' ? b.name.en || '' : b.name || '';
          return bName.localeCompare(aName);
        });
      }

      return allOrgs;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Get total count using Firestore count aggregation
  const {
    data: totalCount = 0,
    isLoading: isLoadingCount,
  } = useQuery({
    queryKey: ['organizations', 'count', normalizedFilters],
    queryFn: async () => {
      const baseQuery = buildBaseQuery();
      const snapshot = await getCountFromServer(baseQuery);
      return snapshot.data().count || 0;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Client-side pagination
  const paginationData = useMemo(() => {
    if (!organizationsData) {
      return {
        paginatedOrganizations: [],
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        startIndex: 0,
        endIndex: 0,
      };
    }

    const totalItems = organizationsData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedOrganizations = organizationsData.slice(startIndex, endIndex);

    return {
      paginatedOrganizations,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      startIndex: totalItems === 0 ? 0 : startIndex + 1,
      endIndex,
    };
  }, [organizationsData, page, pageSize]);

  return {
    organizations: paginationData.paginatedOrganizations,
    totalCount: totalCount || paginationData.totalItems,
    totalPages: paginationData.totalPages,
    hasNextPage: paginationData.hasNextPage,
    hasPreviousPage: paginationData.hasPreviousPage,
    startIndex: paginationData.startIndex,
    endIndex: paginationData.endIndex,
    isLoading: isLoadingOrganizations || isLoadingCount,
    error: organizationsError,
  };
}

