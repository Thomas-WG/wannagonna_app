import { httpsCallable } from 'firebase/functions';
import { functions } from 'firebaseConfig';

/**
 * Fetch a sanitized list of members via Cloud Function.
 * Email and other PII are never sent to the client.
 *
 * @param {Object} filters - Filter object with country (optional, use 'all' for no filter)
 * @param {string} sortBy - Sort option: 'name_az', 'name_za', 'joined_newest', 'joined_oldest'
 * @param {number} pageSize - Batch size (default 100, max 100)
 * @param {string|null} lastDocId - Cursor for pagination (document ID from previous response)
 * @returns {Promise<{ members: Array, lastDocId: string|null, hasNextPage: boolean }>}
 */
export async function getMembersListViaFunction(filters = {}, sortBy = 'name_az', pageSize = 100, lastDocId = null) {
  const fn = httpsCallable(functions, 'getMembersList');
  const result = await fn({
    filters,
    sortBy,
    pageSize,
    lastDocId,
  });
  const data = result.data;
  return {
    members: data.members || [],
    lastDocId: data.lastDocId ?? null,
    hasNextPage: !!data.hasNextPage,
  };
}
