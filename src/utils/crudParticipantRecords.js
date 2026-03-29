import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from 'firebaseConfig';

const DEFAULT_PAGE_SIZE = 30;

/**
 * Fetch participant records for an organization with pagination.
 *
 * @param {string} organizationId - NPO organization ID
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Page size (default 30)
 * @param {import('firebase/firestore').DocumentSnapshot|null} [options.startAfterDoc] - Cursor for next page
 * @returns {Promise<{ records: Array<{ id: string, user_id: string, online: boolean, local: boolean, event: boolean, created_at: unknown, last_validated_at: unknown, total_hours: number }>, lastDoc: import('firebase/firestore').DocumentSnapshot|null }>}
 */
export async function fetchParticipantRecords(organizationId, options = {}) {
  const pageSize = options.limit ?? DEFAULT_PAGE_SIZE;
  const startAfterDoc = options.startAfterDoc ?? null;

  if (!organizationId) {
    return { records: [], lastDoc: null };
  }

  try {
    const participantRecordsRef = collection(
      db,
      'organizations',
      organizationId,
      'participant_records'
    );

    let q = query(
      participantRecordsRef,
      orderBy('last_validated_at', 'desc'),
      limit(pageSize + 1) // fetch one extra to know if there's a next page
    );

    if (startAfterDoc) {
      q = query(
        participantRecordsRef,
        orderBy('last_validated_at', 'desc'),
        startAfter(startAfterDoc),
        limit(pageSize + 1)
      );
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const records = (hasMore ? docs.slice(0, pageSize) : docs).map((d) => {
      const data = d.data();
      const totalHours = data.total_hours ?? 0;
      return {
        id: d.id,
        user_id: data.user_id,
        online: !!data.online,
        local: !!data.local,
        event: !!data.event,
        created_at: data.created_at ?? null,
        last_validated_at: data.last_validated_at ?? null,
        total_hours: totalHours,
      };
    });
    const lastDoc = records.length > 0 ? docs[records.length - 1] : null;

    return { records, lastDoc };
  } catch (error) {
    console.error('Error fetching participant records:', error);
    return { records: [], lastDoc: null };
  }
}
