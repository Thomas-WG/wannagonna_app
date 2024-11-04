import { collection, getDocs } from 'firebase/firestore';
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
