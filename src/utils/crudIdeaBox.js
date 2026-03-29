import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Add a new entry to the idea_box collection
 * @param {string} userId - Firebase user UID
 * @param {string} content - User's feedback/idea/bug report content
 * @returns {Promise<string>} New idea_box document ID
 */
export async function addIdeaBoxEntry(userId, content) {
  try {
    // Validate required fields
    if (!userId || !content || !content.trim()) {
      throw new Error('userId and content are required');
    }

    const ideaBoxCollection = collection(db, 'idea_box');
    
    const docRef = await addDoc(ideaBoxCollection, {
      user_id: userId,
      content: content.trim(),
      created_at: Timestamp.now()
    });
    
    console.log('IdeaBox entry created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding IdeaBox entry:', error);
    throw error;
  }
}
