'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { useAuth } from '@/utils/auth/AuthContext';

/**
 * Returns all leaderboard_scores docs for the current user.
 * Used to show rank banners and champion indicators on their profile.
 *
 * @returns {{ myRanks: Array, getRank: Function, championDimensions: Array, loading: boolean }}
 */
export function useMyRanks() {
  const { user } = useAuth();
  const [myRanks, setMyRanks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setMyRanks([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'leaderboard_scores'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMyRanks(data);
        setLoading(false);
      },
      (err) => {
        console.error('useMyRanks error:', err);
        setMyRanks([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  const getRank = (dimensionId) =>
    myRanks.find((r) => r.dimension === dimensionId) || null;

  const championDimensions = myRanks.filter((r) => r.isCurrentChampion);

  return { myRanks, getRank, championDimensions, loading };
}
