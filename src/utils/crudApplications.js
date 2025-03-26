import { collection, addDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from 'firebaseConfig';

export const checkExistingApplication = async (activityId, userId) => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    const applicationsRef = collection(activityRef, 'applications');
    const q = query(applicationsRef, where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking existing application:', error);
    throw error;
  }
};

export const createApplication = async ({ activityId, userId, userEmail, message }) => {
  try {
    const hasExistingApplication = await checkExistingApplication(activityId, userId);
    
    if (hasExistingApplication) {
      return { 
        success: false, 
        error: 'existing_application' 
      };
    }

    const activityRef = doc(db, 'activities', activityId);
    const applicationsRef = collection(activityRef, 'applications');
    
    const applicationData = {
      userId,
      userEmail,
      message,
      status: 'pending',
      createdAt: new Date(),
    };

    const docRef = await addDoc(applicationsRef, applicationData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
}; 