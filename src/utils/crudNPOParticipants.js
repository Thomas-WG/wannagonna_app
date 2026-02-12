import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Fetch participant records for an NPO (one doc per user per org).
 * @param {string} organizationId - NPO organization ID
 * @param {Object} options - { activityType?: 'all'|'online'|'local'|'event', sortBy?: string }
 * @returns {Promise<Array>} Array of { userId, online, local, event, createdAt, lastValidatedAt } (doc id = userId)
 */
export async function fetchParticipantRecords(organizationId, options = {}) {
  if (!organizationId) return [];
  const { activityType = 'all', sortBy = 'participated_newest' } = options;
  try {
    const participantRef = collection(db, 'organizations', organizationId, 'participant_records');
    let q = query(participantRef);

    if (activityType !== 'all') {
      q = query(q, where(activityType, '==', true));
    }

    switch (sortBy) {
      case 'participated_newest':
        q = query(q, orderBy('lastValidatedAt', 'desc'));
        break;
      case 'participated_oldest':
        q = query(q, orderBy('createdAt', 'asc'));
        break;
      default:
        q = query(q, orderBy('lastValidatedAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        userId: d.id,
        online: !!data.online,
        local: !!data.local,
        event: !!data.event,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        lastValidatedAt: data.lastValidatedAt?.toDate ? data.lastValidatedAt.toDate() : data.lastValidatedAt,
      };
    });
  } catch (error) {
    console.error('Error fetching participant records:', error);
    return [];
  }
}

/**
 * Get total count of participant records for an NPO (optionally filtered by activity type).
 * @param {string} organizationId - NPO organization ID
 * @param {string} activityType - 'all' | 'online' | 'local' | 'event'
 * @returns {Promise<number>}
 */
export async function getParticipantRecordsCount(organizationId, activityType = 'all') {
  if (!organizationId) return 0;
  try {
    const participantRef = collection(db, 'organizations', organizationId, 'participant_records');
    let q = query(participantRef);
    if (activityType !== 'all') {
      q = query(q, where(activityType, '==', true));
    }
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error getting participant records count:', error);
    return 0;
  }
}

/**
 * Batch-get member profiles (displayName, profilePicture, email) by userIds.
 * Email is included for NPO contact participants (mailto) flow.
 * @param {string[]} userIds - Array of user IDs
 * @returns {Promise<Object>} Map of userId -> { displayName, profilePicture, email }
 */
export async function batchGetMemberProfiles(userIds) {
  if (!userIds?.length) return {};
  const uniq = [...new Set(userIds)];
  const results = await Promise.all(
    uniq.map(async (uid) => {
      const memberRef = doc(db, 'members', uid);
      const snap = await getDoc(memberRef);
      if (!snap.exists()) return { [uid]: { displayName: '', profilePicture: '', email: '' } };
      const data = snap.data();
      return {
        [uid]: {
          displayName: data.displayName ?? '',
          profilePicture: data.profilePicture ?? '',
          email: data.email ?? '',
        },
      };
    })
  );
  return Object.assign({}, ...results);
}
