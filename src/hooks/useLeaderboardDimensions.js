'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { db } from 'firebaseConfig';

/**
 * Returns the list of SDG and continent dimension IDs that have rankings.
 * Used to filter dropdowns to show only dimensions with data.
 * Subscribes to leaderboard_meta/dimensions - when it updates (nightly job or admin trigger),
 * invalidates leaderboard queries so tab data refetches.
 *
 * @returns {{ sdg: string[], continent: string[], loading: boolean }}
 */
export function useLeaderboardDimensions() {
  const queryClient = useQueryClient();
  const [sdg, setSdg] = useState([]);
  const [continent, setContinent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, 'leaderboard_meta', 'dimensions');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSdg(data.sdg || []);
          setContinent(data.continent || []);
        } else {
          setSdg([]);
          setContinent([]);
        }
        setLoading(false);
        // Invalidate leaderboard queries when dimensions update (compute job ran)
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      },
      (err) => {
        console.error('useLeaderboardDimensions error:', err);
        setSdg([]);
        setContinent([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [queryClient]);

  return { sdg, continent, loading };
}
