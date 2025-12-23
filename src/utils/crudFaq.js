import { collection, getDocs, addDoc, getDoc, updateDoc, doc, query, orderBy, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Helper function to get localized text with fallback
 * @param {Object} textObj - Object with locale keys (e.g., { en: "...", fr: "..." })
 * @param {string} locale - Current locale
 * @param {string} fallbackLocale - Fallback locale (default: 'en')
 * @returns {string} Localized text or fallback
 */
export function getLocalizedText(textObj, locale, fallbackLocale = 'en') {
  if (!textObj || typeof textObj !== 'object') return '';
  return textObj[locale] || textObj[fallbackLocale] || '';
}

/**
 * Fetch all FAQs from Firestore
 * Ordered by 'order' field if exists, otherwise by 'createdAt'
 * @returns {Promise<Array>} Array of FAQ objects
 */
export async function fetchFaqs() {
  try {
    const faqsCollection = collection(db, 'faq');
    // Try to order by 'order' field first, fallback to 'createdAt'
    let q;
    try {
      q = query(faqsCollection, orderBy('order'));
    } catch (error) {
      // If 'order' field doesn't exist, order by 'createdAt'
      q = query(faqsCollection, orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    // Fallback: try without ordering
    try {
      const faqsCollection = collection(db, 'faq');
      const snapshot = await getDocs(faqsCollection);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (fallbackError) {
      console.error('Error fetching FAQs (fallback):', fallbackError);
      return [];
    }
  }
}

/**
 * Fetch a single FAQ by ID
 * @param {string} id - FAQ document ID
 * @returns {Promise<Object|null>} FAQ object or null if not found
 */
export async function fetchFaqById(id) {
  try {
    const faqDoc = doc(db, 'faq', id);
    const docSnap = await getDoc(faqDoc);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return null;
  }
}

/**
 * Add a new FAQ
 * @param {Object} questionObj - Multilingual question object { en: "...", fr: "...", es: "...", ja: "..." }
 * @param {Object} answerObj - Multilingual answer object { en: "...", fr: "...", es: "...", ja: "..." }
 * @param {number} order - Optional order number for sorting
 * @returns {Promise<string>} New FAQ document ID
 */
export async function addFaq(questionObj, answerObj, order = null) {
  try {
    // Validate that English is provided
    if (!questionObj?.en || !answerObj?.en) {
      throw new Error('English (en) question and answer are required');
    }

    const faqsCollection = collection(db, 'faq');
    
    // Get current max order if order not provided
    let finalOrder = order;
    if (finalOrder === null) {
      const existingFaqs = await fetchFaqs();
      const maxOrder = existingFaqs.reduce((max, faq) => {
        return Math.max(max, faq.order || 0);
      }, 0);
      finalOrder = maxOrder + 1;
    }

    const docRef = await addDoc(faqsCollection, {
      question: questionObj,
      answer: answerObj,
      order: finalOrder,
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding FAQ:', error);
    throw error;
  }
}

/**
 * Update an existing FAQ
 * @param {string} id - FAQ document ID
 * @param {Object} questionObj - Multilingual question object { en: "...", fr: "...", es: "...", ja: "..." }
 * @param {Object} answerObj - Multilingual answer object { en: "...", fr: "...", es: "...", ja: "..." }
 * @param {number} order - Optional order number for sorting
 * @returns {Promise<void>}
 */
export async function updateFaq(id, questionObj, answerObj, order = null) {
  try {
    // Validate that English is provided
    if (!questionObj?.en || !answerObj?.en) {
      throw new Error('English (en) question and answer are required');
    }

    const faqDoc = doc(db, 'faq', id);
    const updateData = {
      question: questionObj,
      answer: answerObj
    };
    
    if (order !== null) {
      updateData.order = order;
    }
    
    await updateDoc(faqDoc, updateData);
  } catch (error) {
    console.error('Error updating FAQ:', error);
    throw error;
  }
}

/**
 * Delete a FAQ
 * @param {string} id - FAQ document ID
 * @returns {Promise<void>}
 */
export async function deleteFaq(id) {
  try {
    const faqDoc = doc(db, 'faq', id);
    await deleteDoc(faqDoc);
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    throw error;
  }
}
