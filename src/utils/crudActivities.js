import { collection, getDocs, addDoc, getDoc, updateDoc, doc, onSnapshot} from 'firebase/firestore';
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
    const activitiesCollection = collection(db, 'activities'); // Reference to the activities collection
    const docRef = await addDoc(activitiesCollection, data); // Add a new document with the provided data
    console.log('Activity created with ID:', docRef.id); // Log the ID of the created activity
  } catch (error) {
    console.error('Error creating activity:', error); // Log any errors
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
      return snapshot.data(); // Return the data if the document exists
    } else {
      console.log('No such activity!'); // Log if the document does not exist
      return null; // Return null if no document found
    }
  } catch (error) {
    console.error('Error fetching activity:', error); // Log any errors
  }
}