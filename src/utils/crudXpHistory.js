import { collection, addDoc, getDocs, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Log an XP earning event to the user's XP history
 * @param {string} userId - The user's ID
 * @param {string} title - The title/description of the XP earning event
 * @param {number} points - The number of XP points earned
 * @param {string} type - The type of XP earning (e.g., "badge", "activity")
 * @returns {Promise<string|null>} Document ID of the created entry, or null if error
 */
export async function logXpHistory(userId, title, points, type = 'unknown') {
  try {
    if (!userId || !title || points === undefined || points === null) {
      console.error('Invalid parameters for logXpHistory:', { userId, title, points, type });
      return null;
    }

    const memberDoc = doc(db, 'members', userId);
    const xpHistoryCollection = collection(memberDoc, 'xpHistory');
    
    const historyEntry = {
      title: title,
      timestamp: Timestamp.now(),
      points: points,
      type: type
    };

    const docRef = await addDoc(xpHistoryCollection, historyEntry);
    console.log(`XP history entry logged for user ${userId}: ${title} (+${points} XP)`);
    
    return docRef.id;
  } catch (error) {
    console.error(`Error logging XP history for user ${userId}:`, error);
    return null;
  }
}

/**
 * Fetch all XP history entries for a user, ordered by timestamp (newest first)
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
    const xpHistoryCollection = collection(memberDoc, 'xpHistory');
    
    // Query ordered by timestamp descending (newest first)
    const q = query(xpHistoryCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const historyEntries = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to Date if needed
      let timestamp = data.timestamp;
      if (timestamp && typeof timestamp.toDate === 'function') {
        timestamp = timestamp.toDate();
      }
      
      historyEntries.push({
        id: doc.id,
        title: data.title || '',
        timestamp: timestamp,
        points: data.points || 0,
        type: data.type || 'unknown'
      });
    });
    
    console.log(`Fetched ${historyEntries.length} XP history entries for user ${userId}`);
    return historyEntries;
  } catch (error) {
    console.error(`Error fetching XP history for user ${userId}:`, error);
    return [];
  }
}

