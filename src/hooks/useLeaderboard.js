'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Returns top 10 entries for a given leaderboard dimension.
 * Uses onSnapshot for live updates when nightly job runs.
 *
 * @param {string} dimensionId - e.g. "global", "sdg_13", "europe"
 * @returns {{ entries: Array, loading: boolean }}
 */
export function useLeaderboard(dimensionId) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dimensionId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'leaderboard_scores'),
      where('dimension', '==', dimensionId),
      orderBy('activityScore', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEntries(data);
        setLoading(false);
      },
      (err) => {
        console.error('useLeaderboard error:', err);
        setEntries([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [dimensionId]);

  return { entries, loading };
}
