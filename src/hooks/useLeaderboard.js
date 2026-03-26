'use client';

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { db } from 'firebaseConfig';

/**
 * Returns top 10 entries for a given leaderboard dimension.
 * Uses React Query with getDocs for caching - reduces redundant reads when switching tabs.
 * Cache invalidated when leaderboard_meta/dimensions updates (nightly job or admin trigger).
 *
 * @param {string} dimensionId - e.g. "global", "sdg_13", "europe"
 * @returns {{ entries: Array, loading: boolean }}
 */
export function useLeaderboard(dimensionId) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['leaderboard', dimensionId],
    queryFn: async () => {
      const q = query(
        collection(db, 'leaderboard_scores'),
        where('dimension', '==', dimensionId),
        orderBy('activity_score', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!dimensionId,
    staleTime: 60 * 1000,
  });

  return { entries, loading: isLoading };
}
