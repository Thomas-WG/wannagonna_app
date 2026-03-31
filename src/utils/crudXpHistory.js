import { collection, addDoc, getDocs, query, orderBy, Timestamp, doc, limit, startAfter } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Log an XP earning event to the user's XP history
 * @param {string} userId - The user's ID
 * @param {string} title - The title/description of the XP earning event
 * @param {number} points - The number of XP points earned
 * @param {string} type - The type of XP earning (e.g., "badge", "activity", "referral")
 * @param {Object} metadata - Optional metadata (badge_id, activity_id, referrer_id)
 * @param {string} metadata.badge_id - Badge ID (for badge type)
 * @param {string} metadata.activity_id - Activity ID (for activity type)
 * @param {string} metadata.referrer_id - Referrer's user ID (for referral type)
 * @returns {Promise<string|null>} Document ID of the created entry, or null if error
 */
export async function logXpHistory(userId, title, points, type = 'unknown', metadata = {}) {
  try {
    if (!userId || !title || points === undefined || points === null) {
      console.error('Invalid parameters for logXpHistory:', { userId, title, points, type });
      return null;
    }

    const memberDoc = doc(db, 'members', userId);
    const xpHistoryCollection = collection(memberDoc, 'xp_history');
    
    const historyEntry = {
      title: title,
      created_at: Timestamp.now(),
      points: points,
      type: type
    };

    // Add metadata IDs based on type
    if (type === 'badge' && metadata.badge_id) {
      historyEntry.badge_id = metadata.badge_id;
    }
    if (type === 'activity' && metadata.activity_id) {
      historyEntry.activity_id = metadata.activity_id;
    }
    if (type === 'referral' && metadata.referrer_id) {
      historyEntry.referrer_id = metadata.referrer_id;
    }

    const docRef = await addDoc(xpHistoryCollection, historyEntry);
    console.log(`XP history entry logged for user ${userId}: ${title} (+${points} XP)`);
    
    return docRef.id;
  } catch (error) {
    console.error(`Error logging XP history for user ${userId}:`, error);
    return null;
  }
}

/**
 * Fetch all XP history entries for a user, ordered by created_at (newest first)
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of XP history entries
 */
export async function fetchXpHistory(userId) {
  try {
    if (!userId) {
      console.error('No userId provided to fetchXpHistory');
      return [];
    }

    const memberDoc = doc(db, 'members', userId);
    const xpHistoryCollection = collection(memberDoc, 'xp_history');
    
    // Query ordered by created_at descending (newest first)
    const q = query(xpHistoryCollection, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const historyEntries = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to Date if needed
      let created_at = data.created_at;
      if (created_at && typeof created_at.toDate === 'function') {
        created_at = created_at.toDate();
      }
      
      historyEntries.push({
        id: doc.id,
        title: data.title || '',
        created_at: created_at,
        points: data.points || 0,
        type: data.type || 'unknown',
        badge_id: data.badge_id ?? null,
        activity_id: data.activity_id ?? null,
        referrer_id: data.referrer_id || null
      });
    });
    
    console.log(`Fetched ${historyEntries.length} XP history entries for user ${userId}`);
    return historyEntries;
  } catch (error) {
    console.error(`Error fetching XP history for user ${userId}:`, error);
    return [];
  }
}

/**
 * Fetch XP history entries for a user with pagination support
 * @param {string} userId - The user's ID
 * @param {number} pageSize - Number of entries to fetch per page
 * @param {Object|null} lastDoc - The last document from previous page (for cursor-based pagination)
 * @returns {Promise<Object>} Object with entries array, hasNextPage boolean, and lastDoc for next page
 */
export async function fetchXpHistoryPaginated(userId, pageSize = 20, lastDoc = null) {
  try {
    if (!userId) {
      console.error('No userId provided to fetchXpHistoryPaginated');
      return {
        entries: [],
        hasNextPage: false,
        lastDoc: null,
      };
    }

    const memberDoc = doc(db, 'members', userId);
    const xpHistoryCollection = collection(memberDoc, 'xp_history');
    
    // Build query ordered by created_at descending (newest first)
    let q = query(xpHistoryCollection, orderBy('created_at', 'desc'));
    
    // Apply pagination cursor if provided
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    // Fetch one extra document to check if there's a next page
    q = query(q, limit(pageSize + 1));

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    // Check if there's a next page
    const hasNextPage = docs.length > pageSize;
    const docsToReturn = hasNextPage ? docs.slice(0, pageSize) : docs;
    
    const historyEntries = [];
    
    docsToReturn.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Convert Firestore Timestamp to Date if needed
      let created_at = data.created_at;
      if (created_at && typeof created_at.toDate === 'function') {
        created_at = created_at.toDate();
      }
      
      historyEntries.push({
        id: docSnap.id,
        title: data.title || '',
        created_at: created_at,
        points: data.points || 0,
        type: data.type || 'unknown',
        badge_id: data.badge_id ?? null,
        activity_id: data.activity_id ?? null,
        referrer_id: data.referrer_id || null
      });
    });
    
    // Get the last document snapshot for next page pagination (must be original Firestore doc)
    const newLastDoc = docsToReturn.length > 0 ? docsToReturn[docsToReturn.length - 1] : null;
    
    console.log(`Fetched ${historyEntries.length} XP history entries for user ${userId} (hasMore: ${hasNextPage})`);
    
    return {
      entries: historyEntries,
      hasNextPage,
      lastDoc: newLastDoc,
    };
  } catch (error) {
    console.error(`Error fetching paginated XP history for user ${userId}:`, error);
    return {
      entries: [],
      hasNextPage: false,
      lastDoc: null,
    };
  }
}

