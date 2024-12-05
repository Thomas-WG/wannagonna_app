import { collection, getDocs, addDoc, getDoc, updateDoc, doc} from 'firebase/firestore';
import { db } from 'firebaseConfig';

export async function fetchActivities() {
  try {
    const activitiesCollection = collection(db, 'activities');
    const snapshot = await getDocs(activitiesCollection);
    
    // Log the snapshot to see the raw data
    console.log('Firestore snapshot:', snapshot);

    // Map over the documents and log each activity's data
    const activities = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('Fetched activity data:', data);
      return data;
    });

    return activities;
  } catch (error) {
    console.error('Error fetching activities:', error);
  }
}

export async function createActivity(data) {
  try {
    const activitiesCollection = collection(db, 'activities');
    const docRef = await addDoc(activitiesCollection, data);
    console.log('Activity created with ID:', docRef.id);
  } catch (error) {
    console.error('Error creating activity:', error);
  }
}

export async function updateActivity(id, data) {
  try {
    const activityDoc = doc(db, 'activities', id);
    await updateDoc(activityDoc, data);
    console.log('Activity updated:', id);
  } catch (error) {
    console.error('Error updating activity:', error);
  }
}

export async function fetchActivityById(id) {
  try {
    const activityDoc = doc(db, 'activities', id);
    const snapshot = await getDoc(activityDoc);
    if (snapshot.exists()) {
      return snapshot.data();
    } else {
      console.log('No such activity!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching activity:', error);
  }
}