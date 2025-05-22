import { collection, addDoc, getDoc, doc, query, where, getDocs } from 'firebase/firestore';
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

    // Get activity details to get organization ID
    const activityRef = doc(db, 'activities', activityId);
    const activityDoc = await getDoc(activityRef);
    const organizationId = activityDoc.data().organizationId;

    const applicationData = {
      userId,
      userEmail,
      message,
      status: 'pending',
      createdAt: new Date(),
      activityId,
      category: activityDoc.data().category,
      title: activityDoc.data().title,
      description: activityDoc.data().description,
      type: activityDoc.data().type,
      frequency: activityDoc.data().frequency,
      organizationName: activityDoc.data().organization_name,
      organization_logo: activityDoc.data().organization_logo,
      organizationId: organizationId
    };

    // Add application to activity's applications collection
    const applicationsRef = collection(activityRef, 'applications');
    const docRef = await addDoc(applicationsRef, applicationData);

    // Add application to user's applications collection
    const userRef = doc(db, 'members', userId);
    const userApplicationsRef = collection(userRef, 'applications');
    await addDoc(userApplicationsRef, {
      ...applicationData,
      applicationId: docRef.id,
    });

    // Add application to organization's applications collection
    const orgRef = doc(db, 'organizations', organizationId);
    const orgApplicationsRef = collection(orgRef, 'applications');
    await addDoc(orgApplicationsRef, {
      ...applicationData,
      applicationId: docRef.id,
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
}; 