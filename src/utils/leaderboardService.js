/**
 * Leaderboard service — calls Firebase function to manually trigger
 * leaderboard computation (admin only).
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from 'firebaseConfig';

/**
 * Trigger manual leaderboard computation.
 * Requires admin role. Returns result stats or throws on error.
 * @returns {Promise<{ success: boolean, dimensions?: number, users?: number, notifications?: number, error?: string }>}
 */
export async function triggerComputeLeaderboard() {
  const fn = httpsCallable(functions, 'triggerComputeLeaderboard');
  const result = await fn({});
  return result.data;
}
