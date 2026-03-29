import { collection, getDoc, doc, query, where, getDocs, updateDoc, runTransaction, Timestamp, setDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { fetchActivityById } from './crudActivities';
import { grantBadgeToUser } from './crudBadges';
import { initializeValidationDocument } from './crudActivityValidation';
import { createOrUpdateParticipation } from './participationService';

export const checkExistingApplication = async (activityId, userId) => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    const applicationsRef = collection(activityRef, 'applications');
    const q = query(applicationsRef, where('user_id', '==', userId));
    
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
    const organizationId = activityData.organization_id;
    
    // Check if auto-accept is enabled
    const shouldAutoAccept = activityData.auto_accept_applications === true;
    const defaultStatus = shouldAutoAccept ? 'accepted' : 'pending';
    const defaultNpoResponse = shouldAutoAccept ? 'Your application has been automatically accepted.' : '';

    // Check if this is the user's first application (check BEFORE transaction)
    const userRef = doc(db, 'members', userId);
    const userApplicationsRef = collection(userRef, 'applications');
    const existingApplicationsSnapshot = await getDocs(userApplicationsRef);
    const isFirstApplication = existingApplicationsSnapshot.empty;
    
    console.log(`Checking first application for user ${userId}: ${isFirstApplication ? 'YES' : 'NO'} (found ${existingApplicationsSnapshot.size} existing applications)`);

    const applicationData = {
      user_id: userId,
      message,
      status: defaultStatus,
      created_at: new Date(),
      activity_id: activityId,
      organization_id: organizationId,
      ...(shouldAutoAccept && { npo_response: defaultNpoResponse }),
    };

    // Canonical write only; Cloud Functions upsert member/org mirrors
    const result = await runTransaction(db, async (transaction) => {
      const applicationsRef = collection(activityRef, 'applications');
      const appRef = doc(applicationsRef);
      transaction.set(appRef, applicationData);
      return appRef.id;
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
      if (data.user_id) {
        try {
          const userRef = doc(db, 'members', data.user_id);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            userProfile = userDoc.data();
          }
        } catch (userError) {
          console.error('Error fetching user profile:', userError);
        }
      }
      
      const application_id = data.application_id ?? docSnapshot.id;
      applications.push({
        id: docSnapshot.id,
        ...data,
        application_id,
        npo_response: data.npo_response,
        last_status_updated_by: data.last_status_updated_by,
        cancellation_message: data.cancellation_message,
        created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
        display_name: userProfile?.display_name || userProfile?.name || data.userEmail || 'Unknown User',
        profile_picture: userProfile?.profile_picture || userProfile?.photoURL || null
      });
    }
    
    return applications;
  } catch (error) {
    console.error('Error fetching applications for activity:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (
  activityId,
  applicationId,
  status,
  npoResponse = '',
  updatedByUserId = null,
  cancellationMessage = ''
) => {
  try {
    // Get application data first to check current status and find user and organization IDs
    const activityRef = doc(db, 'activities', activityId);
    const applicationRef = doc(activityRef, 'applications', applicationId);
    const applicationDoc = await getDoc(applicationRef);
    const applicationData = applicationDoc.data();
    
    if (!applicationData) {
      throw new Error('Application not found');
    }

    // Prepare update data - snake_case for Firestore
    const updateData = {
      status,
      npo_response: npoResponse,
      updated_at: new Date(),
    };

    // Only add last_status_updated_by if updatedByUserId is provided (backward compatibility)
    if (updatedByUserId) {
      updateData.last_status_updated_by = updatedByUserId;
      console.log("Setting last_status_updated_by:", updatedByUserId, "for application:", applicationId);
    } else {
      console.warn("updateApplicationStatus: updatedByUserId not provided, last_status_updated_by will not be set");
    }

    // Only add cancellation_message when cancelling, keep backward compatibility otherwise
    if (status === 'cancelled') {
      updateData.cancellation_message = cancellationMessage || '';
    }

    // Canonical update only; mirrors and org pending decrement run in Cloud Functions
    await updateDoc(applicationRef, updateData);
    
    // If status is being changed to "accepted", initialize validation document and participation
    if (status === 'accepted' && applicationData.user_id) {
      try {
        await initializeValidationDocument(activityId, applicationData.user_id);
        console.log(`Validation document initialized for user ${applicationData.user_id} on activity ${activityId}`);
      } catch (validationError) {
        // Log error but don't fail the application status update
        console.error('Error initializing validation document:', validationError);
      }
      try {
        await createOrUpdateParticipation(activityId, applicationData.user_id, {
          status: 'registered',
          joined_at: Timestamp.now(),
          hours: { reported: 0, validated: 0, reported_at: null, validated_at: null }
        });
        console.log(`Participation created for user ${applicationData.user_id} on activity ${activityId}`);
      } catch (participationError) {
        console.error('Error creating participation:', participationError);
      }
    }

    const npo_response = applicationData.npo_response ?? npoResponse;
    return {
      success: true,
      application: {
        ...applicationData,
        status,
        npo_response,
        application_id: applicationData.application_id ?? applicationId,
      },
    };
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
      const created_at = data.created_at?.toDate ? data.created_at.toDate() : data.created_at;
      const updated_at = data.updated_at?.toDate ? data.updated_at.toDate() : data.updated_at;

      // Optionally enrich with staff member info who last updated the status
      const last_status_updated_by = data.last_status_updated_by;
      let lastUpdatedByDisplayName = null;
      let lastUpdatedByProfilePicture = null;
      if (last_status_updated_by) {
        try {
          const staffRef = doc(db, 'members', last_status_updated_by);
          const staffDoc = await getDoc(staffRef);
          if (staffDoc.exists()) {
            const staffData = staffDoc.data();
            lastUpdatedByDisplayName =
              staffData.display_name || staffData.name || null;
            lastUpdatedByProfilePicture =
              staffData.profile_picture || staffData.photoURL || null;
          }
        } catch (staffError) {
          console.warn(
            'Error fetching staff profile for application lastStatusUpdatedBy:',
            staffError
          );
        }
      }
      
      const application_id = data.application_id ?? docSnapshot.id;
      applications.push({
        id: docSnapshot.id,
        ...data,
        application_id,
        npo_response: data.npo_response,
        last_status_updated_by,
        cancellation_message: data.cancellation_message,
        created_at,
        updated_at,
        lastUpdatedByDisplayName,
        lastUpdatedByProfilePicture,
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
          const activity = await fetchActivityById(app.activity_id);
          if (activity) {
            return {
              ...activity,
              activity_id: activity.id,
              applicationStatus: app.status,
              application_id: app.application_id,
              appliedAt: app.created_at
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching activity ${app.activity_id}:`, error);
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
    const q = query(applicationsRef, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);
    
    // Get activity data
    const activityDoc = await getDoc(activityRef);
    const activityData = activityDoc.data();
    const organizationId = activityData.organization_id;
    
    if (!querySnapshot.empty) {
      // Application exists - update to accepted without overwriting any existing NPO response
      const existingApp = querySnapshot.docs[0];
      const applicationId = existingApp.id;
      const existingData = existingApp.data();
      
      const existingNpoResponse = existingData.npo_response ?? '';
      
      await updateApplicationStatus(
        activityId,
        applicationId,
        'accepted',
        existingNpoResponse
      );
      
      return { success: true, applicationId, action: 'updated' };
    } else {
      // No application exists - create new one with accepted status (generic manual acceptance)
      // Check if this is the user's first application (before creating it)
      const userRef = doc(db, 'members', userId);
      const userApplicationsRef = collection(userRef, 'applications');
      const existingApplicationsSnapshot = await getDocs(userApplicationsRef);
      const isFirstApplication = existingApplicationsSnapshot.empty;
      
      const applicationData = {
        user_id: userId,
        message: '',
        status: 'accepted',
        created_at: Timestamp.now(),
        activity_id: activityId,
        organization_id: organizationId
      };
      
      const appRef = doc(applicationsRef);
      await setDoc(appRef, applicationData);
      const applicationId = appRef.id;
      
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