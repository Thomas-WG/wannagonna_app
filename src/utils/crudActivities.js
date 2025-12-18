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

// Helper function to duplicate activity to members' history collection
async function addActivityToMemberHistory(activityId, activityData, userId) {
  try {
    const memberRef = doc(db, 'members', userId);
    const historyRef = collection(memberRef, 'history');
    
    // Create a copy of the activity data for history
    // Convert Firestore Timestamps to Date objects if needed
    const historyData = { ...activityData };
    
    // Convert any Firestore Timestamp objects to Date objects
    Object.keys(historyData).forEach(key => {
      const value = historyData[key];
      if (value && typeof value.toDate === 'function') {
        historyData[key] = value.toDate();
      }
    });
    
    // Remove the document ID field if it exists (we'll store activityId separately)
    delete historyData.id;
    
    // Add metadata
    historyData.activityId = activityId;
    historyData.addedToHistoryAt = new Date();
    
    await addDoc(historyRef, historyData);
    console.log(`Activity ${activityId} added to history for member ${userId}`);
  } catch (error) {
    console.error(`Error adding activity to history for member ${userId}:`, error);
    throw error;
  }
}

// Fetch closed activities from member history
export const fetchHistoryActivities = async (userId) => {
  try {
    const memberRef = doc(db, 'members', userId);
    const historyRef = collection(memberRef, 'history');
    const querySnapshot = await getDocs(historyRef);
    
    const historyActivities = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Convert Firestore timestamps to Date objects if needed
      const historyData = { ...data };
      Object.keys(historyData).forEach(key => {
        const value = historyData[key];
        if (value && typeof value.toDate === 'function') {
          historyData[key] = value.toDate();
        }
      });
      
      historyActivities.push({
        id: docSnapshot.id,
        ...historyData,
        fromHistory: true
      });
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
 * Get count of accepted applications for an activity
 * @param {string} activityId - Activity ID
 * @returns {Promise<number>} Count of accepted applications
 */
export async function getAcceptedApplicationsCount(activityId) {
  try {
    const applications = await fetchApplicationsForActivity(activityId);
    // Filter to only accepted applications (status === 'accepted')
    const acceptedCount = applications.filter(app => app.status === 'accepted').length;
    return acceptedCount;
  } catch (error) {
    console.error('Error getting accepted applications count:', error);
    return 0;
  }
}