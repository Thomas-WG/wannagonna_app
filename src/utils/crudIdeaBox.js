import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Add a new entry to the ideaBox collection
 * @param {string} userId - Firebase user UID
 * @param {string} content - User's feedback/idea/bug report content
 * @returns {Promise<string>} New ideaBox document ID
 */
export async function addIdeaBoxEntry(userId, content) {
  try {
    // Validate required fields
    if (!userId || !content || !content.trim()) {
      throw new Error('userId and content are required');
    }

    const ideaBoxCollection = collection(db, 'ideaBox');
    
    const docRef = await addDoc(ideaBoxCollection, {
      userId: userId,
      content: content.trim(),
      createdAt: Timestamp.now()
    });
    
    console.log('IdeaBox entry created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding IdeaBox entry:', error);
    throw error;
  }
}
