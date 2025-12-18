import { collection, addDoc, getDoc, doc, query, where, getDocs, updateDoc, runTransaction, increment, Timestamp } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { fetchActivityById } from './crudActivities';
import { grantBadgeToUser } from './crudBadges';

export const checkExistingApplication = async (activityId, userId) => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    const applicationsRef = collection(activityRef, 'applications');
    const q = query(applicationsRef, where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    // Check if there's any application that is NOT cancelled
    const hasNonCancelledApplication = querySnapshot.docs.some(
      (doc) => doc.data().status !== 'cancelled'
    );
    return hasNonCancelledApplication;
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

    // Get activity details to get organization ID and check auto-accept settings
    const activityRef = doc(db, 'activities', activityId);
    const activityDoc = await getDoc(activityRef);
    const activityData = activityDoc.data();
    const organizationId = activityData.organizationId;
    
    // Check if auto-accept is enabled
    const shouldAutoAccept = activityData.autoAcceptApplications === true;
    const defaultStatus = shouldAutoAccept ? 'accepted' : 'pending';
    const defaultNpoResponse = shouldAutoAccept ? 'Your application has been automatically accepted.' : '';

    // Check if this is the user's first application (check BEFORE transaction)
    const userRef = doc(db, 'members', userId);
    const userApplicationsRef = collection(userRef, 'applications');
    const existingApplicationsSnapshot = await getDocs(userApplicationsRef);
    const isFirstApplication = existingApplicationsSnapshot.empty;
    
    console.log(`Checking first application for user ${userId}: ${isFirstApplication ? 'YES' : 'NO'} (found ${existingApplicationsSnapshot.size} existing applications)`);

    const applicationData = {
      userId,
      message,
      status: defaultStatus,
      createdAt: new Date(),
      activityId,
      organizationId: organizationId,
      ...(shouldAutoAccept && { npoResponse: defaultNpoResponse })
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

      // If auto-accept is enabled, update organization's totalNewApplications count
      // (since it's already accepted, we don't increment the pending count)
      if (shouldAutoAccept) {
        // No need to increment totalNewApplications for auto-accepted applications
        // They bypass the pending queue
      }

      return docRef.id;
    });

    // Grant badge if this is the first application (after transaction succeeds)
    let badgeDetails = null;
    if (isFirstApplication) {
      try {
        console.log(`Attempting to grant firstApplication badge to user ${userId}...`);
        badgeDetails = await grantBadgeToUser(userId, 'firstApplication');
        if (badgeDetails) {
          console.log('First application badge granted successfully to user:', userId, badgeDetails);
        } else {
          console.warn(`First application badge grant returned null for user ${userId}. This might mean:
            - Badge document 'firstApplication' not found in Firestore
            - User already has the badge
            - Member document doesn't exist`);
        }
      } catch (badgeError) {
        // Log error but don't fail the application creation
        console.error('Error granting first application badge:', badgeError);
        console.error('Badge error details:', {
          message: badgeError.message,
          stack: badgeError.stack,
          userId: userId
        });
      }
    } else {
      console.log(`Not granting firstApplication badge - user ${userId} already has ${existingApplicationsSnapshot.size} application(s)`);
    }

    return { success: true, id: result, badgeDetails };
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

export const updateApplicationStatus = async (activityId, applicationId, status, npoResponse = '', updatedByUserId = null) => {
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

    // Prepare update data - include lastStatusUpdatedBy if provided
    const updateData = {
      status,
      npoResponse,
      updatedAt: new Date()
    };
    
    // Only add lastStatusUpdatedBy if updatedByUserId is provided (backward compatibility)
    if (updatedByUserId) {
      updateData.lastStatusUpdatedBy = updatedByUserId;
      console.log("Setting lastStatusUpdatedBy:", updatedByUserId, "for application:", applicationId);
    } else {
      console.warn("updateApplicationStatus: updatedByUserId not provided, lastStatusUpdatedBy will not be set");
    }

    // Update in activity's applications collection
    await updateDoc(applicationRef, updateData);
    
    if (applicationData) {
      // Update in user's applications collection
      const userRef = doc(db, 'members', applicationData.userId);
      const userApplicationsRef = collection(userRef, 'applications');
      const userQuery = query(userApplicationsRef, where('applicationId', '==', applicationId));
      const userQuerySnapshot = await getDocs(userQuery);
      
      userQuerySnapshot.forEach(async (userDoc) => {
        await updateDoc(userDoc.ref, updateData);
      });

      // Update in organization's applications collection
      if (applicationData.organizationId) {
        const orgRef = doc(db, 'organizations', applicationData.organizationId);
        const orgApplicationsRef = collection(orgRef, 'applications');
        const orgQuery = query(orgApplicationsRef, where('applicationId', '==', applicationId));
        const orgQuerySnapshot = await getDocs(orgQuery);
        
        orgQuerySnapshot.forEach(async (orgDoc) => {
          await updateDoc(orgDoc.ref, updateData);
        });

        // Update organization's totalNewApplications count when status changes from pending
        if (shouldDecrementCount) {
          await updateDoc(orgRef, {
            totalNewApplications: increment(-1)
          });
        }
      }
    }

    return { success: true, application: { ...applicationData, status, npoResponse } };
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

/**
 * Create or update application with accepted status for QR validation
 * @param {string} activityId - Activity ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result object
 */
export const createOrUpdateApplicationAsAccepted = async (activityId, userId) => {
  try {
    // Check if application already exists
    const activityRef = doc(db, 'activities', activityId);
    const applicationsRef = collection(activityRef, 'applications');
    const q = query(applicationsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    // Get activity data
    const activityDoc = await getDoc(activityRef);
    const activityData = activityDoc.data();
    const organizationId = activityData.organizationId;
    
    if (!querySnapshot.empty) {
      // Application exists - update to accepted
      const existingApp = querySnapshot.docs[0];
      const applicationId = existingApp.id;
      
      // Update status to accepted
      await updateApplicationStatus(activityId, applicationId, 'accepted', 'Accepted via QR code validation');
      
      return { success: true, applicationId, action: 'updated' };
    } else {
      // No application exists - create new one with accepted status
      // Check if this is the user's first application (before creating it)
      const userRef = doc(db, 'members', userId);
      const userApplicationsRef = collection(userRef, 'applications');
      const existingApplicationsSnapshot = await getDocs(userApplicationsRef);
      const isFirstApplication = existingApplicationsSnapshot.empty;
      
      const applicationData = {
        userId,
        message: 'Accepted via QR code validation',
        status: 'accepted',
        createdAt: Timestamp.now(),
        activityId,
        organizationId: organizationId
      };
      
      // Create application in activity's applications collection first
      const docRef = await addDoc(applicationsRef, applicationData);
      const applicationId = docRef.id;
      
      // Then add to user's and organization's collections
      await addDoc(userApplicationsRef, {
        ...applicationData,
        applicationId: applicationId,
      });
      
      const orgRef = doc(db, 'organizations', organizationId);
      const orgApplicationsRef = collection(orgRef, 'applications');
      await addDoc(orgApplicationsRef, {
        ...applicationData,
        applicationId: applicationId,
      });
      
      // Grant firstApplication badge if this is the first application
      if (isFirstApplication) {
        try {
          console.log(`Attempting to grant firstApplication badge to user ${userId} (via QR validation)...`);
          const badgeDetails = await grantBadgeToUser(userId, 'firstApplication');
          if (badgeDetails) {
            console.log('First application badge granted successfully to user via QR validation:', userId, badgeDetails);
          } else {
            console.warn(`First application badge grant returned null for user ${userId} (via QR validation)`);
          }
        } catch (badgeError) {
          console.error('Error granting first application badge via QR validation:', badgeError);
        }
      }
      
      return { success: true, applicationId, action: 'created' };
    }
  } catch (error) {
    console.error('Error creating/updating application for QR validation:', error);
    throw error;
  }
};

/**
 * Count pending applications for an organization dynamically
 * @param {string} organizationId - Organization ID
 * @returns {Promise<number>} Count of pending applications
 */
export const countPendingApplicationsForOrganization = async (organizationId) => {
  try {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgApplicationsRef = collection(orgRef, 'applications');
    const q = query(orgApplicationsRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error counting pending applications for organization:', error);
    return 0;
  }
};