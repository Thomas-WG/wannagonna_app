import { collection, getDocs, addDoc, getDoc, updateDoc, doc, onSnapshot, query, where, deleteDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { fetchApplicationsForActivity } from './crudApplications';
import { grantActivityCompletionBadges, awardXpToUser } from './crudBadges';
import { v4 as uuidv4 } from 'uuid';
import { fetchValidationsForActivity } from './crudActivityValidation';

// Fetch all activities from the Firestore database
export async function fetchActivities() {
  try {
    const activitiesCollection = collection(db, 'activities'); // Reference to the activities collection
    const snapshot = await getDocs(activitiesCollection); // Get documents from the collection
    
    // Log the snapshot to see the raw data
    console.log('Firestore snapshot:', snapshot);

    // Map over the documents and log each activity's data
    const activities = snapshot.docs.map((doc) => {
      const data = doc.data(); // Get data from each document
      return {id: doc.id, ...data}; // Return an object with the document ID and data
    });

    return activities; // Return the array of activities
  } catch (error) {
    console.error('Error fetching activities:', error); // Log any errors
  }
}

// Subscribe to real-time updates of activities
export function subscribeToActivities(callback) {
  const activitiesCollection = collection(db, 'activities'); // Reference to the activities collection
  
  // Return the unsubscribe function
  return onSnapshot(activitiesCollection, (snapshot) => {
    const activities = snapshot.docs.map((doc) => ({
      id: doc.id, // Get document ID
      ...doc.data() // Get data from each document
    }));
    callback(activities); // Call the provided callback with the updated activities
  }, (error) => {
    console.error('Error listening to activities:', error); // Log any errors
  });
}

// Subscribe to real-time updates of Open activities only (efficient server-side filtering)
export function subscribeToOpenActivities(callback) {
  const activitiesCollection = collection(db, 'activities');
  const q = query(activitiesCollection, where('status', '==', 'Open'));
  
  // Return the unsubscribe function
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(activities);
  }, (error) => {
    console.error('Error listening to open activities:', error);
  });
}

// Create a new activity in the Firestore database
export async function createActivity(data) {
  try {
    // Validate that organizationId is present
    if (!data.organizationId) {
      console.error('Error creating activity: organizationId is required');
      throw new Error('organizationId is required to create an activity');
    }

    // Generate QR code token for Event and Local activities
    const activityData = { ...data };
    if ((activityData.type === 'event' || activityData.type === 'local') && !activityData.qrCodeToken) {
      activityData.qrCodeToken = uuidv4();
      console.log('Generated QR code token for activity:', activityData.qrCodeToken);
    }

    const activitiesCollection = collection(db, 'activities'); // Reference to the activities collection
    const docRef = await addDoc(activitiesCollection, activityData); // Add a new document with the provided data
    console.log('Activity created with ID:', docRef.id); // Log the ID of the created activity
    return docRef.id; // Return the ID of the created activity
  } catch (error) {
    console.error('Error creating activity:', error); // Log any errors
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Duplicate an existing activity
export async function duplicateActivity(activityId) {
  try {
    // Fetch the original activity
    const originalActivity = await fetchActivityById(activityId);
    if (!originalActivity) {
      throw new Error('Activity not found');
    }

    // Prepare duplicate data - exclude fields that shouldn't be copied
    const {
      id,
      applicants,
      creation_date,
      qrCodeToken,
      ...duplicateData
    } = originalActivity;

    // Set status to 'Draft'
    duplicateData.status = 'Draft';

    // Set creation_date to current date
    duplicateData.creation_date = new Date();

    // Generate new QR code token for Event and Local activities
    if (duplicateData.type === 'event' || duplicateData.type === 'local') {
      duplicateData.qrCodeToken = uuidv4();
    }

    // Create the duplicate activity
    const newActivityId = await createActivity(duplicateData);
    console.log('Activity duplicated with new ID:', newActivityId);
    return newActivityId;
  } catch (error) {
    console.error('Error duplicating activity:', error);
    throw error;
  }
}

// Update an existing activity in the Firestore database
export async function updateActivity(id, data) {
  try {
    // Get current activity to check type and existing token
    const activityDoc = doc(db, 'activities', id);
    const activitySnapshot = await getDoc(activityDoc);
    
    if (!activitySnapshot.exists()) {
      throw new Error('Activity not found');
    }

    const currentData = activitySnapshot.data();
    const updateData = { ...data };

    // Generate QR code token for Event and Local activities if not present
    if ((updateData.type === 'event' || updateData.type === 'local' || 
         currentData.type === 'event' || currentData.type === 'local') && 
        !updateData.qrCodeToken && !currentData.qrCodeToken) {
      updateData.qrCodeToken = uuidv4();
      console.log('Generated QR code token for activity:', updateData.qrCodeToken);
    }

    await updateDoc(activityDoc, updateData); // Update the document with the provided data
    console.log('Activity updated:', id); // Log the ID of the updated activity
  } catch (error) {
    console.error('Error updating activity:', error); // Log any errors
    throw error;
  }
}

// Fetch a specific activity by its ID
export async function fetchActivityById(id) {
  try {
    const activityDoc = doc(db, 'activities', id); // Reference to the specific activity document
    const snapshot = await getDoc(activityDoc); // Get the document snapshot
    if (snapshot.exists()) {
      return {id: snapshot.id, ...snapshot.data()}; // Return the data if the document exists
    } else {
      console.log('No such activity!'); // Log if the document does not exist
      return null; // Return null if no document found
    }
  } catch (error) {
    console.error('Error fetching activity:', error); // Log any errors
  }
}

// Fetch activities by organization ID, type and status
export async function fetchActivitiesByCriteria(organizationId = 'any', type = 'any', status = 'any') {
  try {
    const activitiesCollection = collection(db, 'activities');
    let conditions = [];
    
    // Add conditions only for non-'any' values
    if (organizationId !== 'any') {
      conditions.push(where('organizationId', '==', organizationId));
    }
    if (type !== 'any') {
      conditions.push(where('type', '==', type));
    }
    if (status !== 'any') {
      conditions.push(where('status', '==', status));
    }

    // Create query with all applicable conditions
    const q = conditions.length > 0 
      ? query(activitiesCollection, ...conditions)
      : query(activitiesCollection);
      
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

// Helper function to add activity reference to members' history collection
// Best practice: Store only activityId reference, not duplicated activity data
// This prevents data inconsistency and reduces storage costs
async function addActivityToMemberHistory(activityId, userId, metadata = {}) {
  try {
    const memberRef = doc(db, 'members', userId);
    const historyRef = collection(memberRef, 'history');
    
    // Store only reference and metadata, not full activity data
    const historyData = {
      activityId: activityId,
      addedToHistoryAt: new Date(),
      ...metadata // Allow additional metadata like validatedViaQR, validatedViaManual, etc.
    };
    
    await addDoc(historyRef, historyData);
    console.log(`Activity ${activityId} reference added to history for member ${userId}`);
  } catch (error) {
    console.error(`Error adding activity to history for member ${userId}:`, error);
    throw error;
  }
}

// Fetch closed activities from member history
// This function fetches activityId references from the history sub-collection,
// then fetches the full activity data from the main activities collection
export const fetchHistoryActivities = async (userId) => {
  try {
    const memberRef = doc(db, 'members', userId);
    const historyRef = collection(memberRef, 'history');
    const querySnapshot = await getDocs(historyRef);
    
    const historyActivities = [];
    
    // Extract activityIds from history documents
    const activityIds = [];
    const historyMetadata = new Map(); // Map activityId -> metadata (addedToHistoryAt, etc.)
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Extract activityId - handle both old duplicated data and new reference-only data
      const activityId = data.activityId;
      
      if (!activityId) {
        // Skip documents without activityId (shouldn't happen, but handle gracefully)
        console.warn(`History document ${docSnapshot.id} has no activityId, skipping`);
        continue;
      }
      
      // Store metadata for this activity
      const metadata = {
        historyDocId: docSnapshot.id,
        addedToHistoryAt: data.addedToHistoryAt,
        validatedViaQR: data.validatedViaQR,
        validatedViaManual: data.validatedViaManual,
      };
      
      // Convert Firestore timestamps to Date objects if needed
      if (metadata.addedToHistoryAt && typeof metadata.addedToHistoryAt.toDate === 'function') {
        metadata.addedToHistoryAt = metadata.addedToHistoryAt.toDate();
      }
      
      if (!activityIds.includes(activityId)) {
        activityIds.push(activityId);
        historyMetadata.set(activityId, metadata);
      }
    }
    
    // Fetch full activity data for each activityId
    for (const activityId of activityIds) {
      try {
        const activityData = await fetchActivityById(activityId);
        
        if (activityData) {
          // Get metadata for this activity
          const metadata = historyMetadata.get(activityId) || {};
          
          // Convert Firestore timestamps to Date objects if needed
          const processedActivity = {
            ...activityData,
            start_date: activityData.start_date
              ? activityData.start_date instanceof Date
                ? activityData.start_date
                : activityData.start_date.seconds
                ? new Date(activityData.start_date.seconds * 1000)
                : new Date(activityData.start_date)
              : null,
            end_date: activityData.end_date
              ? activityData.end_date instanceof Date
                ? activityData.end_date
                : activityData.end_date.seconds
                ? new Date(activityData.end_date.seconds * 1000)
                : new Date(activityData.end_date)
              : null,
            // Preserve activityId for reference (used in dashboard for modal)
            activityId: activityId,
            // Add history metadata
            addedToHistoryAt: metadata.addedToHistoryAt,
            validatedViaQR: metadata.validatedViaQR,
            validatedViaManual: metadata.validatedViaManual,
            // Mark as from history
            fromHistory: true
          };
          
          historyActivities.push(processedActivity);
        } else {
          // Activity was deleted, log warning but don't fail
          console.warn(`Activity ${activityId} referenced in history no longer exists`);
        }
      } catch (error) {
        // Error fetching activity, log but continue with other activities
        console.error(`Error fetching activity ${activityId} from history:`, error);
      }
    }
    
    return historyActivities;
  } catch (error) {
    console.error('Error fetching history activities:', error);
    throw error;
  }
};

// Update activity status in the Firestore database
export async function updateActivityStatus(id, status) {
  try {
    const activityDoc = doc(db, 'activities', id);
    
    // Get the activity data before updating status
    const activitySnapshot = await getDoc(activityDoc);
    if (!activitySnapshot.exists()) {
      throw new Error('Activity not found');
    }
    
    const activityData = activitySnapshot.data();
    
    // Update the activity status
    await updateDoc(activityDoc, {
      status: status,
      last_updated: new Date()
    });
    console.log('Activity status updated:', id, 'to', status);
    
    // Note: Activity completion (granting badges/XP) is now handled through
    // the ActivityValidationModal when status is changed to "Closed"
    // This ensures all activity types (online, local, event) go through the same validation process
    
    return { success: true };
  } catch (error) {
    console.error('Error updating activity status:', error);
    throw error;
  }
}

// Delete an activity from the Firestore database
export async function deleteActivity(id) {
  try {
    // First, get the activity data to access organizationId
    const activityDoc = doc(db, 'activities', id);
    const activitySnapshot = await getDoc(activityDoc);
    
    if (!activitySnapshot.exists()) {
      throw new Error('Activity not found');
    }
    
    const activityData = activitySnapshot.data();
    const organizationId = activityData.organizationId;
    
    // Get all applications for this activity
    const applicationsRef = collection(activityDoc, 'applications');
    const applicationsSnapshot = await getDocs(applicationsRef);
    
    // Count pending applications to update organization's totalNewApplications
    let pendingApplicationsCount = 0;
    applicationsSnapshot.docs.forEach((applicationDoc) => {
      const applicationData = applicationDoc.data();
      if (applicationData.status === 'pending') {
        pendingApplicationsCount++;
      }
    });

    // Pre-read and gather all references to delete, then commit in a single batch
    const batch = writeBatch(db);

    // Delete applications from the activity's applications collection
    applicationsSnapshot.docs.forEach((applicationDoc) => {
      batch.delete(applicationDoc.ref);
    });

    // Delete applications from user's applications collection
    for (const applicationDoc of applicationsSnapshot.docs) {
      const applicationData = applicationDoc.data();
      const userId = applicationData.userId;
      const applicationId = applicationDoc.id;

      if (userId) {
        const userRef = doc(db, 'members', userId);
        const userApplicationsRef = collection(userRef, 'applications');
        const userQuery = query(userApplicationsRef, where('applicationId', '==', applicationId));
        const userQuerySnapshot = await getDocs(userQuery);

        userQuerySnapshot.docs.forEach((userAppDoc) => {
          batch.delete(userAppDoc.ref);
        });
      }
    }

    // Delete applications from organization's applications collection and update counts
    if (organizationId) {
      const orgRef = doc(db, 'organizations', organizationId);
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        if (pendingApplicationsCount > 0) {
          // Decrement by the number of pending applications
          batch.update(orgRef, { totalNewApplications: increment(-pendingApplicationsCount) });
        }

        // Delete each application's mirror under organization
        for (const applicationDoc of applicationsSnapshot.docs) {
          const applicationId = applicationDoc.id;
          const orgApplicationsRef = collection(orgRef, 'applications');
          const orgQuery = query(orgApplicationsRef, where('applicationId', '==', applicationId));
          const orgQuerySnapshot = await getDocs(orgQuery);

          orgQuerySnapshot.docs.forEach((orgAppDoc) => {
            batch.delete(orgAppDoc.ref);
          });
        }
      }
    }

    // Finally, delete the activity document itself
    batch.delete(activityDoc);

    await batch.commit();
    
    console.log('Activity and all related applications deleted:', id);
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
}

/**
 * Get count of validated participants for an activity
 * @param {string} activityId - Activity ID
 * @returns {Promise<number>} Count of validated participants
 */
export async function getValidatedParticipantsCount(activityId) {
  try {
    const validations = await fetchValidationsForActivity(activityId);
    // Filter to only validated participants (status === 'validated')
    const validatedCount = validations.filter(v => v.status === 'validated').length;
    return validatedCount;
  } catch (error) {
    console.error('Error getting validated participants count:', error);
    return 0;
  }
}

/**
 * Get count of effective participants for an activity
 * 
 * This starts from all accepted applications, then subtracts
 * participants who have a validation with status 'rejected'
 * (they were accepted but ultimately did not do the job).
 * @param {string} activityId - Activity ID
 * @returns {Promise<number>} Count of effective participants
 */
export async function getAcceptedApplicationsCount(activityId) {
  try {
    // Fetch all applications for the activity
    const applications = await fetchApplicationsForActivity(activityId);
    // Consider only accepted applications as the base set of participants
    const acceptedApplications = applications.filter(app => app.status === 'accepted');

    // Fetch validations to identify rejected participants
    const validations = await fetchValidationsForActivity(activityId);
    const rejectedUserIds = new Set(
      validations
        .filter(v => v.status === 'rejected')
        .map(v => v.userId)
    );

    // Effective participants = accepted applications minus those explicitly rejected
    const effectiveParticipants = acceptedApplications.filter(
      app => !rejectedUserIds.has(app.userId)
    );

    return effectiveParticipants.length;
  } catch (error) {
    console.error('Error getting accepted applications count:', error);
    return 0;
  }
}

/**
 * Update all activities for an organization with new logo and name.
 * This ensures that all existing activities display the updated organization information.
 * @param {string} organizationId - Organization ID
 * @param {string} logoUrl - New logo URL
 * @param {string} organizationName - New organization name (optional)
 * @returns {Promise<number>} Number of activities updated
 */
export async function updateActivitiesForOrganization(organizationId, logoUrl, organizationName = null) {
  try {
    if (!organizationId) {
      throw new Error('organizationId is required');
    }
    if (!logoUrl) {
      throw new Error('logoUrl is required');
    }

    // Fetch all activities for this organization
    const activities = await fetchActivitiesByCriteria(organizationId, 'any', 'any');
    
    if (activities.length === 0) {
      console.log(`No activities found for organization ${organizationId}`);
      return 0;
    }

    // Prepare update data
    const updateData = {
      organization_logo: logoUrl
    };
    
    // Include organization name if provided
    if (organizationName) {
      updateData.organization_name = organizationName;
    }

    // Use batch write for efficient updates
    const batch = writeBatch(db);
    let updateCount = 0;

    activities.forEach((activity) => {
      const activityRef = doc(db, 'activities', activity.id);
      batch.update(activityRef, updateData);
      updateCount++;
    });

    // Commit all updates
    await batch.commit();
    console.log(`Updated ${updateCount} activities for organization ${organizationId} with new logo`);
    
    return updateCount;
  } catch (error) {
    console.error('Error updating activities for organization:', error);
    throw error;
  }
}