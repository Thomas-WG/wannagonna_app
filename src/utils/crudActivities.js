import { collection, getDocs, addDoc, getDoc, updateDoc, doc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';

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

// Create a new activity in the Firestore database
export async function createActivity(data) {
  try {
    // Validate that organizationId is present
    if (!data.organizationId) {
      console.error('Error creating activity: organizationId is required');
      throw new Error('organizationId is required to create an activity');
    }

    const activitiesCollection = collection(db, 'activities'); // Reference to the activities collection
    const docRef = await addDoc(activitiesCollection, data); // Add a new document with the provided data
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
    const activityDoc = doc(db, 'activities', id); // Reference to the specific activity document
    await updateDoc(activityDoc, data); // Update the document with the provided data
    console.log('Activity updated:', id); // Log the ID of the updated activity
  } catch (error) {
    console.error('Error updating activity:', error); // Log any errors
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

// Update activity status in the Firestore database
export async function updateActivityStatus(id, status) {
  try {
    const activityDoc = doc(db, 'activities', id);
    await updateDoc(activityDoc, {
      status: status,
      last_updated: new Date()
    });
    console.log('Activity status updated:', id, 'to', status);
    return { success: true };
  } catch (error) {
    console.error('Error updating activity status:', error);
    throw error;
  }
}

// Delete an activity from the Firestore database
export async function deleteActivity(id) {
  try {
    const activityDoc = doc(db, 'activities', id);
    await deleteDoc(activityDoc);
    console.log('Activity deleted:', id);
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
}