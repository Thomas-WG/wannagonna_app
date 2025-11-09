import { collection, addDoc, getDoc, doc, query, where, getDocs, updateDoc, runTransaction, increment } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { fetchActivityById } from './crudActivities';
import { grantBadgeToUser } from './crudBadges';

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

    // Check if this is the user's first application
    const userRef = doc(db, 'members', userId);
    const userApplicationsRef = collection(userRef, 'applications');
    const existingApplicationsSnapshot = await getDocs(userApplicationsRef);
    const isFirstApplication = existingApplicationsSnapshot.empty;

    // Get activity details to get organization ID
    const activityRef = doc(db, 'activities', activityId);
    const activityDoc = await getDoc(activityRef);
    const organizationId = activityDoc.data().organizationId;

    const applicationData = {
      userId,
      message,
      status: 'pending',
      createdAt: new Date(),
      activityId,
      organizationId: organizationId
    };

    // Use transaction to ensure all operations succeed or all fail
    const result = await runTransaction(db, async (transaction) => {
      // Add application to activity's applications collection
      const applicationsRef = collection(activityRef, 'applications');
      const docRef = await addDoc(applicationsRef, applicationData);
      
      // Add application to user's applications collection
      const userApplicationsRef = collection(userRef, 'applications');
      transaction.set(doc(userApplicationsRef), {
        ...applicationData,
        applicationId: docRef.id,
      });

      // Add application to organization's applications collection
      const orgRef = doc(db, 'organizations', organizationId);
      const orgApplicationsRef = collection(orgRef, 'applications');
      transaction.set(doc(orgApplicationsRef), {
        ...applicationData,
        applicationId: docRef.id,
      });

      return docRef.id;
    });

    // Grant badge if this is the first application (after transaction succeeds)
    if (isFirstApplication) {
      try {
        await grantBadgeToUser(userId, 'firstApplication');
        console.log('First application badge granted to user:', userId);
      } catch (badgeError) {
        // Log error but don't fail the application creation
        console.error('Error granting first application badge:', badgeError);
      }
    }

    return { success: true, id: result };
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

export const fetchApplicationsForActivity = async (activityId) => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    const applicationsRef = collection(activityRef, 'applications');
    const querySnapshot = await getDocs(applicationsRef);
    
    const applications = [];
    
    // Process applications and fetch user profile data
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Fetch user profile data
      let userProfile = null;
      if (data.userId) {
        try {
          const userRef = doc(db, 'members', data.userId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            userProfile = userDoc.data();
          }
        } catch (userError) {
          console.error('Error fetching user profile:', userError);
        }
      }
      
      applications.push({
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        displayName: userProfile?.displayName || userProfile?.name || data.userEmail || 'Unknown User',
        profilePicture: userProfile?.profilePicture || userProfile?.photoURL || null
      });
    }
    
    return applications;
  } catch (error) {
    console.error('Error fetching applications for activity:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (activityId, applicationId, status, npoResponse = '') => {
  try {
    // Get application data first to check current status and find user and organization IDs
    const activityRef = doc(db, 'activities', activityId);
    const applicationRef = doc(activityRef, 'applications', applicationId);
    const applicationDoc = await getDoc(applicationRef);
    const applicationData = applicationDoc.data();
    
    if (!applicationData) {
      throw new Error('Application not found');
    }

    // Check if we need to update the organization's totalNewApplications count
    const shouldDecrementCount = applicationData.status === 'pending' && (status === 'accepted' || status === 'rejected' || status === 'cancelled');

    // Update in activity's applications collection
    await updateDoc(applicationRef, {
      status,
      npoResponse,
      updatedAt: new Date()
    });
    
    if (applicationData) {
      // Update in user's applications collection
      const userRef = doc(db, 'members', applicationData.userId);
      const userApplicationsRef = collection(userRef, 'applications');
      const userQuery = query(userApplicationsRef, where('applicationId', '==', applicationId));
      const userQuerySnapshot = await getDocs(userQuery);
      
      userQuerySnapshot.forEach(async (userDoc) => {
        await updateDoc(userDoc.ref, {
          status,
          npoResponse,
          updatedAt: new Date()
        });
      });

      // Update in organization's applications collection
      if (applicationData.organizationId) {
        const orgRef = doc(db, 'organizations', applicationData.organizationId);
        const orgApplicationsRef = collection(orgRef, 'applications');
        const orgQuery = query(orgApplicationsRef, where('applicationId', '==', applicationId));
        const orgQuerySnapshot = await getDocs(orgQuery);
        
        orgQuerySnapshot.forEach(async (orgDoc) => {
          await updateDoc(orgDoc.ref, {
            status,
            npoResponse,
            updatedAt: new Date()
          });
        });

        // Update organization's totalNewApplications count when status changes from pending
        if (shouldDecrementCount) {
          await updateDoc(orgRef, {
            totalNewApplications: increment(-1)
          });
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// Fetch all applications for a specific user (volunteer)
export const fetchApplicationsByUserId = async (userId) => {
  try {
    const userRef = doc(db, 'members', userId);
    const userApplicationsRef = collection(userRef, 'applications');
    const querySnapshot = await getDocs(userApplicationsRef);
    
    const applications = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Convert Firestore timestamps to Date objects
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt;
      
      applications.push({
        id: docSnapshot.id,
        ...data,
        createdAt,
        updatedAt
      });
    }
    
    return applications;
  } catch (error) {
    console.error('Error fetching applications for user:', error);
    throw error;
  }
};

// Fetch activities for a volunteer based on their accepted applications
export const fetchActivitiesForVolunteer = async (userId) => {
  try {
    // First, get all applications for this user
    const applications = await fetchApplicationsByUserId(userId);
    
    // Filter only accepted applications
    const acceptedApplications = applications.filter(app => app.status === 'accepted');
    
    // Fetch activity details for each accepted application
    const activities = await Promise.all(
      acceptedApplications.map(async (app) => {
        try {
          const activity = await fetchActivityById(app.activityId);
          if (activity) {
            return {
              ...activity,
              applicationStatus: app.status,
              applicationId: app.id,
              appliedAt: app.createdAt
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching activity ${app.activityId}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null values
    return activities.filter(activity => activity !== null);
  } catch (error) {
    console.error('Error fetching activities for volunteer:', error);
    throw error;
  }
};
