import { collection, getDocs } from 'firebase/firestore';
import { db } from 'firebaseConfig';

export async function fetchActivities() {
  const activitiesCollection = collection(db, 'activities'); 
  const snapshot = await getDocs(activitiesCollection);
  return snapshot.docs.map((doc) => doc.data());
}